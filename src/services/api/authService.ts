import { ApiError, HttpClient } from './httpClient';
import { Endpoints } from './endpoints';
import { Env } from '../../config/env';
import { WpUser } from '../../types';

export interface TokenResponse {
  token: string;
  user_email: string;
  user_nicename?: string;
  user_display_name?: string;
  user_id?: string | number;
}

export type SessionValidationStatus = 'valid' | 'invalid' | 'offline';

export function isValidSessionTokenFormat(token?: string | null): token is string {
  return (
    typeof token === 'string' && token.trim().length > 0 && !token.trim().startsWith('ts_session_')
  );
}

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function decodeBase64String(input: string): string {
  if (typeof atob === 'function') {
    return atob(input);
  }
  let output = '';
  const clean = input.replace(/=+$/, '');
  for (let i = 0; i < clean.length; i += 4) {
    const c1 = BASE64_ALPHABET.indexOf(clean[i]);
    const c2 = BASE64_ALPHABET.indexOf(clean[i + 1]);
    const c3 = i + 2 < clean.length ? BASE64_ALPHABET.indexOf(clean[i + 2]) : -1;
    const c4 = i + 3 < clean.length ? BASE64_ALPHABET.indexOf(clean[i + 3]) : -1;
    if (c1 < 0 || c2 < 0) break;
    output += String.fromCharCode((c1 << 2) | (c2 >> 4));
    if (c3 >= 0) {
      output += String.fromCharCode(((c2 & 15) << 4) | (c3 >> 2));
    }
    if (c4 >= 0) {
      output += String.fromCharCode(((c3 & 3) << 6) | c4);
    }
  }
  return output;
}

export function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.trim().split('.');
    if (parts.length !== 3 || !parts[1]) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const binary = decodeBase64String(padded);
    const jsonStr = decodeURIComponent(
      binary
        .split('')
        .map((ch) => `%${ch.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join('')
    );
    const parsed = JSON.parse(jsonStr);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export function isJwtTokenExpired(token: string, nowMs: number = Date.now()): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number' || !Number.isFinite(payload.exp)) {
    return false;
  }
  return payload.exp * 1000 <= nowMs;
}

function isNetworkFailureError(err: any): boolean {
  const msg = String(err?.message || '');
  return (
    err?.status === 0 ||
    err?.code === 'NETWORK_ERROR' ||
    msg.includes('Failed to fetch') ||
    msg.includes('Network request failed') ||
    msg.includes('Network error')
  );
}

function isTimeoutError(err: any): boolean {
  return err?.status === 408 || err?.code === 'REQUEST_TIMEOUT';
}

export class AuthService {
  /**
   * CR-04: Log in user using WordPress credentials via Native LearnPress JWT token endpoint.
   * Never fabricates a client session or token on network errors.
   */
  static async login(username: string, password: string): Promise<WpUser> {
    try {
      const data = await HttpClient.post<TokenResponse>(
        Endpoints.LEARNPRESS.TOKEN,
        {
          username: username.trim(),
          password,
        },
        { skipAuth: true }
      );

      const token = data?.token;
      if (!isValidSessionTokenFormat(token)) {
        throw new ApiError(
          'Authentication did not return a valid session token.',
          401,
          'INVALID_TOKEN_RESPONSE',
          data
        );
      }
      HttpClient.setAuthToken(token);

      // Fetch authentic WordPress profile to obtain real roles (e.g. administrator)
      let userProfile: any = null;
      try {
        userProfile = await HttpClient.get<any>(Endpoints.WORDPRESS.CURRENT_USER);
      } catch {
        // Fallback if user profile endpoint is restricted
      }

      const roles: string[] =
        Array.isArray(userProfile?.roles) && userProfile.roles.length > 0
          ? userProfile.roles
          : ['subscriber'];

      const siteHost =
        Env.SITE_URL.replace(/^https?:\/\//i, '').split('/')[0] || 'thrivingskill.com';

      return {
        id: userProfile?.id || data.user_id || 'wp-user',
        username: userProfile?.slug || userProfile?.name || username.trim(),
        email: userProfile?.email || data.user_email || `${username.trim()}@${siteHost}`,
        displayName: userProfile?.name || data.user_display_name || username.trim(),
        avatar: userProfile?.avatar_urls?.['96'] || userProfile?.avatar_urls?.['48'] || '',
        token,
        roles,
      };
    } catch (err: any) {
      if (isTimeoutError(err)) {
        throw new ApiError(
          'Connection timed out. Please check your internet connection and try again.',
          408,
          'REQUEST_TIMEOUT',
          err
        );
      }
      if (isNetworkFailureError(err)) {
        throw new ApiError(
          'No internet connection. Please check your connection and try again.',
          0,
          'NETWORK_ERROR',
          err
        );
      }
      throw err;
    }
  }

  /**
   * Verify an active session token against the server (`tsmb` 7-day JWTs via `/wp/v2/users/me`
   * and LearnPress JWTs via `/learnpress/v1/token/validate`), distinguishing server rejection
   * (`invalid`) from transient network unavailability (`offline`).
   */
  static async verifySession(token?: string): Promise<SessionValidationStatus> {
    const activeToken = token || (await HttpClient.getAuthToken());
    if (!isValidSessionTokenFormat(activeToken) || isJwtTokenExpired(activeToken)) {
      return 'invalid';
    }

    const payload = decodeJwtPayload(activeToken);
    const requestOptions = {
      headers: { Authorization: `Bearer ${activeToken}` },
      skipAuth: false,
      retries: 0,
      suppressUnauthorizedHandler: true,
    };

    try {
      if (payload?.iss === 'tsmb') {
        const me = await HttpClient.get<any>(
          Endpoints.WORDPRESS.CURRENT_USER,
          { context: 'edit' },
          requestOptions
        );
        return me && me.id ? 'valid' : 'invalid';
      }

      try {
        await HttpClient.post(Endpoints.LEARNPRESS.TOKEN_VALIDATE, {}, requestOptions);
        return 'valid';
      } catch (lpErr: any) {
        if (lpErr?.status === 404 || lpErr?.code === 'rest_no_route') {
          const me = await HttpClient.get<any>(
            Endpoints.WORDPRESS.CURRENT_USER,
            { context: 'edit' },
            requestOptions
          );
          return me && me.id ? 'valid' : 'invalid';
        }
        throw lpErr;
      }
    } catch (err: any) {
      if (err?.status === 401 || err?.status === 403) {
        return 'invalid';
      }
      return 'offline';
    }
  }

  /**
   * Validate existing JWT token
   */
  static async validateToken(token?: string): Promise<boolean> {
    return (await this.verifySession(token)) === 'valid';
  }

  /**
   * Best-effort server-side revocation for active TSMB bearer tokens.
   */
  static async revokeToken(token?: string): Promise<void> {
    const activeToken = token || (await HttpClient.getAuthToken());
    if (!isValidSessionTokenFormat(activeToken)) return;
    try {
      await HttpClient.post(
        Endpoints.COMPANION.REVOKE_TOKEN,
        {},
        {
          headers: { Authorization: `Bearer ${activeToken}` },
          retries: 0,
          suppressUnauthorizedHandler: true,
        }
      );
    } catch {
      // Logout must stay resilient offline or on servers without companion revocation support.
    }
  }

  /**
   * CR-04: Register a new student account directly in LearnPress/WordPress.
   * Succeeds only after server confirmation; never fabricates a local session on network failure.
   */
  static async register(userData: {
    username: string;
    email: string;
    password: string;
    confirm_password?: string;
    phone?: string;
    name?: string;
    first_name?: string;
    last_name?: string;
  }): Promise<any> {
    const nameParts = (userData.name || '').trim().split(/\s+/);
    const firstName = userData.first_name || nameParts[0] || '';
    const lastName = userData.last_name || nameParts.slice(1).join(' ') || '';

    const payload: Record<string, any> = {
      username: userData.username.trim(),
      email: userData.email.trim(),
      password: userData.password,
      confirm_password: userData.confirm_password || userData.password,
    };

    if (firstName) payload.first_name = firstName;
    if (lastName) payload.last_name = lastName;
    if (userData.name) {
      payload.name = userData.name.trim();
      payload.display_name = userData.name.trim();
    }

    if (userData.phone) {
      payload.phone = userData.phone;
      payload.phone_number = userData.phone;
      payload.billing_phone = userData.phone;
      payload._lp_custom_register_form = {
        phone: userData.phone,
        phone_number: userData.phone,
        'Phone Number': userData.phone,
      };
    }

    try {
      try {
        return await HttpClient.post(Endpoints.COMPANION.REGISTER, payload, {
          skipAuth: true,
        });
      } catch (companionErr: any) {
        // Fall back to LearnPress native registration endpoint only if companion route is absent (404/rest_no_route)
        if (companionErr?.status === 404 || companionErr?.code === 'rest_no_route') {
          return await HttpClient.post(Endpoints.LEARNPRESS.TOKEN_REGISTER, payload, {
            skipAuth: true,
          });
        }
        throw companionErr;
      }
    } catch (err: any) {
      if (isTimeoutError(err)) {
        throw new ApiError(
          'Connection timed out. Please check your internet connection and try again.',
          408,
          'REQUEST_TIMEOUT',
          err
        );
      }
      if (isNetworkFailureError(err)) {
        throw new ApiError(
          'No internet connection. Please check your connection and try again.',
          0,
          'NETWORK_ERROR',
          err
        );
      }
      throw err;
    }
  }

  /**
   * Complete email OTP verification after companion registration
   */
  static async verifyRegistrationOtp(
    email: string,
    otp: string
  ): Promise<{
    verified?: boolean;
    token?: string;
    user_id?: string | number;
    username?: string;
    email?: string;
    user_display_name?: string;
  }> {
    try {
      const res = await HttpClient.post<any>(
        Endpoints.COMPANION.VERIFY_REGISTRATION,
        {
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
        },
        { skipAuth: true }
      );
      if (res?.token) {
        HttpClient.setAuthToken(res.token);
      }
      return res;
    } catch (err: any) {
      if (isTimeoutError(err)) {
        throw new ApiError(
          'Connection timed out. Please check your internet connection and try again.',
          408,
          'REQUEST_TIMEOUT',
          err
        );
      }
      if (isNetworkFailureError(err)) {
        throw new ApiError(
          'No internet connection. Please check your connection and try again.',
          0,
          'NETWORK_ERROR',
          err
        );
      }
      throw err;
    }
  }

  /**
   * Resend email OTP verification code for pending registration
   */
  static async resendRegistrationOtp(email: string): Promise<{
    status?: string;
    code?: number;
    message?: string;
    expires_in?: number;
    dev_verification_otp?: string;
  }> {
    try {
      return await HttpClient.post<any>(
        Endpoints.COMPANION.RESEND_REGISTRATION,
        {
          email: email.trim().toLowerCase(),
        },
        { skipAuth: true }
      );
    } catch (err: any) {
      if (isTimeoutError(err)) {
        throw new ApiError(
          'Connection timed out. Please check your internet connection and try again.',
          408,
          'REQUEST_TIMEOUT',
          err
        );
      }
      if (isNetworkFailureError(err)) {
        throw new ApiError(
          'No internet connection. Please check your connection and try again.',
          0,
          'NETWORK_ERROR',
          err
        );
      }
      throw err;
    }
  }

  /**
   * Request password reset
   */
  static async resetPassword(email: string): Promise<any> {
    return HttpClient.post(
      Endpoints.LEARNPRESS.USER_RESET_PASSWORD,
      { user_login: email.trim() },
      { skipAuth: true }
    );
  }

  /**
   * Complete password reset or new user password setup via WordPress REST API.
   * Never scrapes HTML login pages or spoofs browser User-Agent headers.
   */
  static async confirmPasswordReset(
    login: string,
    key: string,
    newPassword: string
  ): Promise<boolean> {
    const cleanLogin = login.trim();
    const cleanKey = key.trim();
    if (!cleanLogin || !cleanKey || !newPassword) {
      throw new Error('Username, verification key, and new password are required.');
    }

    try {
      await HttpClient.post<{ status?: string; code?: number; message?: string }>(
        Endpoints.COMPANION.CONFIRM_PASSWORD_RESET,
        {
          login: cleanLogin,
          key: cleanKey,
          password: newPassword,
        },
        { skipAuth: true }
      );
      return true;
    } catch (err: any) {
      if (isTimeoutError(err)) {
        throw new ApiError(
          'Connection timed out. Please check your internet connection and try again.',
          408,
          'REQUEST_TIMEOUT',
          err
        );
      }
      if (isNetworkFailureError(err)) {
        throw new ApiError(
          'No internet connection. Please check your connection and try again.',
          0,
          'NETWORK_ERROR',
          err
        );
      }
      if (err?.status === 404 || err?.code === 'rest_no_route') {
        throw new Error(
          'In-app password reset endpoint is unavailable on the server. Please open the password reset link from your email in a browser.'
        );
      }
      const msg = String(err?.message || '');
      if (
        err?.code === 'invalid_reset_key' ||
        err?.code === 'invalidkey' ||
        err?.code === 'expiredkey' ||
        msg.toLowerCase().includes('invalid') ||
        msg.toLowerCase().includes('expired')
      ) {
        throw new Error(
          'This password reset link is invalid or has expired. Please request a new link.'
        );
      }
      throw new Error(
        msg || 'Could not reset password. Please check your reset link and try again.'
      );
    }
  }

  /**
   * Optional helper: Send 6-digit SMS OTP to Bangladeshi mobile number
   */
  static async sendPhoneOtp(
    phone: string
  ): Promise<{ success: boolean; message: string; testOtp?: string }> {
    const cleanPhone = phone.trim().replace(/[\s-]/g, '');
    try {
      const res = await HttpClient.post<{ success: boolean; message: string; testOtp?: string }>(
        Endpoints.TSL.SEND_OTP,
        { phone: cleanPhone },
        { skipAuth: true }
      );
      if (!__DEV__ && res && 'testOtp' in res) {
        const { testOtp: _ignored, ...safeRes } = res;
        return safeRes;
      }
      return res;
    } catch (err: any) {
      throw new Error(
        err?.message ||
          'Phone OTP verification service is currently unavailable. Please sign in using your email or username and password.'
      );
    }
  }

  /**
   * Verify SMS OTP and authenticate user (CR-04)
   */
  static async verifyPhoneOtp(phone: string, otp: string, fullName?: string): Promise<WpUser> {
    const cleanPhone = phone.trim().replace(/[\s-]/g, '');
    const cleanOtp = otp.trim();

    try {
      const data = await HttpClient.post<TokenResponse>(
        Endpoints.TSL.VERIFY_OTP,
        {
          phone: cleanPhone,
          otp: cleanOtp,
          display_name: fullName,
        },
        { skipAuth: true }
      );

      const token = data?.token;
      if (!isValidSessionTokenFormat(token)) {
        throw new ApiError(
          'Authentication did not return a valid session token.',
          401,
          'INVALID_TOKEN_RESPONSE',
          data
        );
      }
      HttpClient.setAuthToken(token);

      return {
        id: data.user_id || `phone-${cleanPhone.slice(-6)}`,
        username: cleanPhone,
        email: data.user_email || `${cleanPhone.replace(/\+/g, '')}@thrivingskill.com`,
        displayName: data.user_display_name || fullName || `Student (${cleanPhone.slice(-4)})`,
        avatar: '',
        token,
        roles: ['subscriber'],
      };
    } catch (err: any) {
      throw new Error(
        err?.message || 'OTP verification failed. Please check the code and try again.'
      );
    }
  }
}
