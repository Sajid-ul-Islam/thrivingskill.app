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
   * Log in or register using Google OAuth
   */
  static async loginWithGoogle(mockEmail?: string, mockName?: string): Promise<WpUser> {
    // In production, this can exchange the Google idToken with WordPress social login endpoint
    const id = 'google-' + Math.random().toString(36).substring(2, 9);
    const email = mockEmail || 'sajid.professional@gmail.com';
    const name = mockName || 'Sajid Ul Islam';
    const fakeToken = `tsl_jwt_google_${Date.now()}_${id}`;

    HttpClient.setAuthToken(fakeToken);
    return {
      id,
      username: email.split('@')[0],
      email,
      displayName: name,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200',
      token: fakeToken,
      roles: ['subscriber'],
    };
  }

  /**
   * Log in or register using Facebook OAuth
   */
  static async loginWithFacebook(mockEmail?: string, mockName?: string): Promise<WpUser> {
    // In production, this can exchange Facebook access token with WordPress social login endpoint
    const id = 'fb-' + Math.random().toString(36).substring(2, 9);
    const email = mockEmail || 'sajid.facebook@thrivingskill.com';
    const name = mockName || 'Sajid Ul Islam (FB)';
    const fakeToken = `tsl_jwt_fb_${Date.now()}_${id}`;

    HttpClient.setAuthToken(fakeToken);
    return {
      id,
      username: email.split('@')[0],
      email,
      displayName: name,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200',
      token: fakeToken,
      roles: ['subscriber'],
    };
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
