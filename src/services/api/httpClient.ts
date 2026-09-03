import AsyncStorage from '@react-native-async-storage/async-storage';
import { Env } from '../../config/env';

const AUTH_TOKEN_KEY = '@thrivingskill_auth_token';

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
  timeoutMs?: number;
  skipAuth?: boolean;
  retries?: number;
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

export class HttpClient {
  private static activeToken: string | null = null;

  /**
   * Set the active JWT authentication token in memory
   */
  static setAuthToken(token: string | null): void {
    this.activeToken = token;
  }

  /**
   * Retrieve active authentication token from memory or persistent storage
   */
  static async getAuthToken(): Promise<string | null> {
    if (this.activeToken) return this.activeToken;
    try {
      const stored = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      this.activeToken = stored;
      return stored;
    } catch {
      return null;
    }
  }

  /**
   * Build complete URL with query parameters
   */
  private static buildUrl(endpoint: string, params?: RequestOptions['params']): string {
    const base = Env.API_URL;
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
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
   * Core execution method with timeout and retry logic
   */
  static async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const {
      params,
      timeoutMs = Env.REQUEST_TIMEOUT_MS,
      skipAuth = false,
      retries = options.method && options.method !== 'GET' ? 0 : Env.MAX_RETRIES,
      headers: customHeaders,
      ...fetchOptions
    } = options;

    const fullUrl = this.buildUrl(endpoint, params);
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(customHeaders as Record<string, string>),
    };

    // Inject Bearer token if present
    if (!skipAuth) {
      const token = await this.getAuthToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    if (Env.DEBUG_API) {
      console.log(`[API Request] ${options.method || 'GET'} ${fullUrl}`);
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
        let responseData: any = null;

        if (contentType.includes('application/json')) {
          responseData = await response.json();
        } else {
          responseData = await response.text();
        }

        if (Env.DEBUG_API) {
          console.log(`[API Response ${response.status}] ${fullUrl}`);
        }

        // Handle WordPress / LearnPress error structures
        if (!response.ok || (responseData && typeof responseData === 'object' && responseData.code && responseData.message && responseData.data?.status)) {
          const rawMessage = responseData?.message || `Request failed with HTTP status ${response.status}`;
          const cleanMessage = sanitizeWpMessage(rawMessage);
          const errorCode = responseData?.code || `HTTP_${response.status}`;

          throw new ApiError(cleanMessage, response.status, errorCode, responseData);
        }

        return responseData as T;
      } catch (err: any) {
        clearTimeout(timer);

        const isAbort = err.name === 'AbortError';
        const isNetworkErr = err instanceof TypeError || isAbort;

        // If network error and we have retries remaining, wait with exponential backoff
        if (isNetworkErr && attempt <= retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 3000);
          if (Env.DEBUG_API) {
            console.log(`[API Retry] ${fullUrl} in ${delay}ms (attempt ${attempt}/${retries})`);
          }
          await new Promise((res) => setTimeout(res, delay));
          continue;
        }

        if (isAbort) {
          throw new ApiError(`Request timeout after ${timeoutMs}ms`, 408, 'REQUEST_TIMEOUT');
        }

        if (err instanceof ApiError) {
          throw err;
        }

        throw new ApiError(
          err.message || 'Network request failed. Please check your internet connection.',
          0,
          'NETWORK_ERROR',
          err
        );
      }
    }

    throw new ApiError('Maximum retry attempts exceeded', 0, 'MAX_RETRIES_EXCEEDED');
  }

  // HTTP Verb Convenience Methods
  static get<T = any>(endpoint: string, params?: RequestOptions['params'], options?: Omit<RequestOptions, 'params' | 'method'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET', params });
  }

  static post<T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'body' | 'method'>): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  static put<T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'body' | 'method'>): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  static delete<T = any>(endpoint: string, options?: Omit<RequestOptions, 'method'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}
