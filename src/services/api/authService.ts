import { HttpClient } from './httpClient';
import { Endpoints } from './endpoints';
import { WpUser } from '../../types';

export interface TokenResponse {
  token: string;
  user_email: string;
  user_nicename?: string;
  user_display_name?: string;
  user_id?: string | number;
}

export class AuthService {
  /**
   * Log in user using WordPress credentials via LearnPress JWT token endpoint
   */
  static async login(username: string, password: string): Promise<WpUser> {
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

    return {
      id: data.user_id || 'wp-user',
      username: username.trim(),
      email: data.user_email || `${username}@thrivingskill.com`,
      displayName: data.user_display_name || username.trim(),
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200',
      token,
      roles: ['subscriber'],
    };
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
   * Register a new student account
   */
  static async register(userData: {
    username: string;
    email: string;
    password: string;
  }): Promise<any> {
    return HttpClient.post(Endpoints.LEARNPRESS.TOKEN_REGISTER, userData, {
      skipAuth: true,
    });
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
}
