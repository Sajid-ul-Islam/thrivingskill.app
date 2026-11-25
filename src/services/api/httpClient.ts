import { Platform } from 'react-native';
import { Env } from '../../config/env';
import { SecureStorageService } from '../storage/secureStorage';

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
  timeoutMs?: number;
  skipAuth?: boolean;
  retries?: number;
  allowFallback?: boolean;
  baseUrl?: string;
}

export interface ApiResponseMeta<T> {
  data: T;
  totalCount: number;
  totalPages: number;
  headers: Record<string, string>;
  status: number;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  data?: any;

  constructor(message: string, status: number, code?: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

// Clean HTML tags and entities often returned by WordPress error responses
export function sanitizeWpMessage(message?: string): string {
  if (!message) return '';
  return message
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#8211;/g, '–')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

const SERVER_OUTAGE_STATUSES = new Set([502, 503, 504, 521, 522]);

export class HttpClient {
  private static activeToken: string | null = null;
  private static connectivityListener: ((isOnline: boolean, errorMsg?: string) => void) | null =
    null;
  private static inFlightRequests = new Map<string, Promise<any>>();

  /**
   * Register a global listener for network reachability changes detected by HTTP calls
   */
  static setConnectivityListener(
    listener: ((isOnline: boolean, errorMsg?: string) => void) | null
  ): void {
    this.connectivityListener = listener;
  }

  /**
   * Set the active JWT authentication token in memory
   */
  static setAuthToken(token: string | null): void {
    this.activeToken = token;
  }

  /**
   * Retrieve active authentication token from memory or hardware-backed secure storage
   */
  static async getAuthToken(): Promise<string | null> {
    if (this.activeToken) return this.activeToken;
    try {
      const stored = await SecureStorageService.getAuthToken();
      this.activeToken = stored;
      return stored;
    } catch {
      return null;
    }
  }

  /**
   * Build complete URL with query parameters
   */
  private static buildUrl(
    endpoint: string,
    params?: RequestOptions['params'],
    customBase?: string
  ): string {
    const base = (customBase || Env.API_URL).replace(/\/+$/, '');
    let cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    if (base.endsWith('/wp-json') && cleanEndpoint.startsWith('/wp-json/')) {
      cleanEndpoint = cleanEndpoint.slice('/wp-json'.length);
    }
    let url = `${base}${cleanEndpoint}`;

    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          searchParams.append(key, String(val));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }

    return url;
  }

  /**
   * Constructs sanitized request headers synchronously when auth is skipped or cached in memory.
   */
  private static createHeaders(
    isGet: boolean,
    token: string | null,
    customHeaders?: HeadersInit
  ): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(isGet ? {} : { 'Content-Type': 'application/json' }),
      ...(customHeaders as Record<string, string>),
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // In web browsers, headers not in WordPress Access-Control-Allow-Headers trigger preflight failures.
    if (Platform.OS === 'web') {
      delete headers['Cache-Control'];
      delete headers['cache-control'];
      delete headers['Pragma'];
      delete headers['pragma'];
    }

    return headers;
  }

  /**
   * Single unified HTTP execution pipeline handling headers, timeout, exponential-backoff
   * retries, WordPress error parsing, dual-host failover, and response header metadata.
   */
  private static async executeCore<T = any>(
    endpoint: string,
    options: RequestOptions = {},
    logLabel: 'Request' | 'RequestWithMeta' = 'Request'
  ): Promise<ApiResponseMeta<T>> {
    const {
      params,
      timeoutMs = Env.REQUEST_TIMEOUT_MS,
      skipAuth = false,
      retries = options.method && options.method !== 'GET' ? 0 : Env.MAX_RETRIES,
      headers: customHeaders,
      allowFallback = true,
      baseUrl,
      ...fetchOptions
    } = options;

    const isGet = !options.method || options.method.toUpperCase() === 'GET';
    const fallbackBaseUrl = Env.FALLBACK_API_URL;
    const canAttemptFallback =
      allowFallback &&
      isGet &&
      Env.ENABLE_FALLBACK &&
      !baseUrl &&
      Boolean(fallbackBaseUrl) &&
      fallbackBaseUrl !== Env.API_URL;

    const fullUrl = this.buildUrl(endpoint, params, baseUrl);
    const token = skipAuth ? null : this.activeToken || (await this.getAuthToken());
    const headers = this.createHeaders(isGet, token, customHeaders);

    if (Env.DEBUG_API) {
      console.log(`[API ${logLabel}] ${options.method || 'GET'} ${fullUrl}`);
    }

    let attempt = 0;
    while (attempt <= retries) {
      attempt++;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(fullUrl, {
          ...fetchOptions,
          headers,
          signal: controller.signal,
        });

        clearTimeout(timer);

        const contentType = response.headers.get('content-type') || '';
        const responseData: any = contentType.includes('application/json')
          ? await response.json()
          : await response.text();

        if (Env.DEBUG_API) {
          const respTag = logLabel === 'RequestWithMeta' ? 'ResponseWithMeta' : 'Response';
          console.log(`[API ${respTag} ${response.status}] ${fullUrl}`);
        }

        if (
          !response.ok ||
          (responseData &&
            typeof responseData === 'object' &&
            responseData.code &&
            responseData.message &&
            responseData.data?.status)
        ) {
          const rawMessage =
            responseData?.message || `Request failed with HTTP status ${response.status}`;
          const cleanMessage = sanitizeWpMessage(rawMessage);
          const errorCode = responseData?.code || `HTTP_${response.status}`;
          throw new ApiError(cleanMessage, response.status, errorCode, responseData);
        }

        this.connectivityListener?.(true);

        const totalCountHeader =
          response.headers.get('x-wp-total') || response.headers.get('X-WP-Total');
        const totalPagesHeader =
          response.headers.get('x-wp-totalpages') || response.headers.get('X-WP-TotalPages');
        const totalCount = totalCountHeader
          ? parseInt(totalCountHeader, 10)
          : Array.isArray(responseData)
            ? responseData.length
            : 0;
        const totalPages = totalPagesHeader ? parseInt(totalPagesHeader, 10) : 1;

        const headerMap: Record<string, string> = {};
        if (typeof (response.headers as any).forEach === 'function') {
          (response.headers as any).forEach((val: string, key: string) => {
            headerMap[key.toLowerCase()] = val;
          });
        }

        return {
          data: responseData as T,
          totalCount,
          totalPages,
          headers: headerMap,
          status: response.status,
        };
      } catch (err: any) {
        clearTimeout(timer);

        const isAbort = err.name === 'AbortError';
        const isNetworkErr = err instanceof TypeError || isAbort;

        if (isNetworkErr && attempt <= retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 3000);
          if (Env.DEBUG_API) {
            console.log(`[API Retry] ${fullUrl} in ${delay}ms (attempt ${attempt}/${retries})`);
          }
          await new Promise((res) => setTimeout(res, delay));
          continue;
        }

        const isServerOutage = err instanceof ApiError && SERVER_OUTAGE_STATUSES.has(err.status);
        if (canAttemptFallback && (isNetworkErr || isServerOutage)) {
          if (Env.DEBUG_API) {
            console.log(
              `[API Failover] Primary ${fullUrl} failed. Attempting failover to ${Env.FALLBACK_API_URL}...`
            );
          }
          try {
            return await this.executeCore<T>(
              endpoint,
              {
                ...options,
                baseUrl: Env.FALLBACK_API_URL,
                allowFallback: false,
                retries: 1,
              },
              logLabel
            );
          } catch (fallbackErr) {
            if (Env.DEBUG_API) {
              console.warn(`[API Failover] Fallback host also failed:`, fallbackErr);
            }
          }
        }

        if (isAbort) {
          this.connectivityListener?.(false, 'Connection timed out.');
          throw new ApiError(`Request timeout after ${timeoutMs}ms`, 408, 'REQUEST_TIMEOUT');
        }

        if (err instanceof ApiError) {
          this.connectivityListener?.(true);
          throw err;
        }

        let userFriendlyMsg =
          err.message || 'Network request failed. Please check your internet connection.';
        if (
          userFriendlyMsg.includes('UnknownHostException') ||
          userFriendlyMsg.includes('Unable to resolve host') ||
          userFriendlyMsg.includes('ENOTFOUND')
        ) {
          userFriendlyMsg =
            'Cannot reach server (DNS resolution failed). Please check your internet connection, try mobile data (4G), or enable Private DNS in Android settings.';
        }

        this.connectivityListener?.(false, userFriendlyMsg);
        throw new ApiError(userFriendlyMsg, 0, 'NETWORK_ERROR', err);
      }
    }

    throw new ApiError('Maximum retry attempts exceeded', 0, 'MAX_RETRIES_EXCEEDED');
  }

  /**
   * Core execution method with in-flight GET deduplication, timeout, and retry logic
   */
  static request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const isGet = !options.method || options.method.toUpperCase() === 'GET';
    const requestKey = `${options.method || 'GET'}:${this.buildUrl(endpoint, options.params)}`;

    if (isGet && this.inFlightRequests.has(requestKey)) {
      return this.inFlightRequests.get(requestKey) as Promise<T>;
    }

    const task = this.executeCore<T>(endpoint, options, 'Request')
      .then((res) => res.data)
      .finally(() => {
        if (isGet) {
          this.inFlightRequests.delete(requestKey);
        }
      });

    if (isGet) {
      this.inFlightRequests.set(requestKey, task);
    }

    return task;
  }

  /**
   * Request with complete pagination metadata extracted from HTTP response headers
   * (e.g. WordPress x-wp-total, x-wp-totalpages)
   */
  static requestWithMeta<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponseMeta<T>> {
    const isGet = !options.method || options.method.toUpperCase() === 'GET';
    const requestKey = `META:${options.method || 'GET'}:${this.buildUrl(endpoint, options.params, options.baseUrl)}`;

    if (isGet && this.inFlightRequests.has(requestKey)) {
      return this.inFlightRequests.get(requestKey) as Promise<ApiResponseMeta<T>>;
    }

    const task = this.executeCore<T>(endpoint, options, 'RequestWithMeta').finally(() => {
      if (isGet) {
        this.inFlightRequests.delete(requestKey);
      }
    });

    if (isGet) {
      this.inFlightRequests.set(requestKey, task);
    }

    return task;
  }

  // HTTP Verb Convenience Methods
  static get<T = any>(
    endpoint: string,
    params?: RequestOptions['params'],
    options?: Omit<RequestOptions, 'params' | 'method'>
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET', params });
  }

  static post<T = any>(
    endpoint: string,
    body?: any,
    options?: Omit<RequestOptions, 'body' | 'method'>
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  static put<T = any>(
    endpoint: string,
    body?: any,
    options?: Omit<RequestOptions, 'body' | 'method'>
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  static patch<T = any>(
    endpoint: string,
    body?: any,
    options?: Omit<RequestOptions, 'body' | 'method'>
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  static delete<T = any>(endpoint: string, options?: Omit<RequestOptions, 'method'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  static getWithMeta<T = any>(
    endpoint: string,
    params?: RequestOptions['params'],
    options?: Omit<RequestOptions, 'params' | 'method'>
  ): Promise<ApiResponseMeta<T>> {
    return this.requestWithMeta<T>(endpoint, { ...options, method: 'GET', params });
  }
}
