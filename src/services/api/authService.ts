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

      const token = data.token;
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
   * Validate existing JWT token
   */
  static async validateToken(token?: string): Promise<boolean> {
    try {
      const activeToken = token || (await HttpClient.getAuthToken());
      if (!activeToken) return false;

      await HttpClient.post(
        Endpoints.LEARNPRESS.TOKEN_VALIDATE,
        {},
        {
          headers: { Authorization: `Bearer ${activeToken}` },
          skipAuth: false,
        }
      );
      return true;
    } catch {
      return false;
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
   * Complete password reset or new user password setup via WordPress action=resetpass
   */
  static async confirmPasswordReset(
    login: string,
    key: string,
    newPassword: string
  ): Promise<boolean> {
    const data = new URLSearchParams({
      action: 'resetpass',
      rp_key: key.trim(),
      rp_login: login.trim(),
      pass1: newPassword,
      pass2: newPassword,
    }).toString();

    const response = await fetch(`${Env.SITE_URL}/login/?action=resetpass`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Linux; Android; Mobile)',
      },
      body: data,
    });

    if (!response.ok) {
      throw new Error(`Password reset request failed (HTTP ${response.status}). Please try again.`);
    }

    const redirectUrl = response.url || '';
    if (redirectUrl.includes('error=invalidkey') || redirectUrl.includes('error=expiredkey')) {
      throw new Error(
        'This password reset link is invalid or has expired. Please request a new link.'
      );
    }
    if (redirectUrl.includes('error=')) {
      throw new Error('Could not reset password. Please check your reset link and try again.');
    }

    return true;
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

      const token = data.token;
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
