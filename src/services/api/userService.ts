import { HttpClient } from './httpClient';
import { Endpoints } from './endpoints';
import { WpUser } from '../../types';

import { UserSocialLinks } from '../../types';

export interface ProfileUpdatePayload {
  name?: string;
  first_name?: string;
  last_name?: string;
  nickname?: string;
  description?: string;
  phone?: string;
  social?: UserSocialLinks;
}

export interface ChangePasswordPayload {
  old_password: string;
  new_password: string;
  confirm_password: string;
}

export interface UserProfile extends WpUser {
  name?: string;
  first_name?: string;
  last_name?: string;
  nickname?: string;
  description?: string;
  phone?: string;
  social?: UserSocialLinks;
  city?: string;
  avatar_urls?: Record<string, string>;
}

export class UserService {
  /**
   * Fetch current authenticated WordPress user profile
   */
  static async getCurrentUser(): Promise<UserProfile | null> {
    try {
      const data = await HttpClient.get<any>(Endpoints.WORDPRESS.CURRENT_USER, { context: 'edit' });
      if (!data) return null;

      let lpAvatar: string | undefined;
      let lpSocial: UserSocialLinks | undefined;
      let lpPhone: string | undefined;

      if (data.id) {
        try {
          const lpUser = await this.getLearnPressUser(data.id);
          if (lpUser) {
            if (lpUser.avatar_url) lpAvatar = lpUser.avatar_url;
            if (lpUser.social) lpSocial = lpUser.social;
            if (lpUser.custom_register) {
              const values = Object.values(lpUser.custom_register);
              if (values.length > 0 && typeof values[0] === 'string') {
                lpPhone = values[0];
              }
            }
          }
        } catch {
          // Ignore if LearnPress user details query fails
        }
      }

      const phone = lpPhone || data.meta?.phone || data.meta?.billing_phone || '';

      return {
        id: data.id,
        username: data.slug || data.name,
        email: data.email || '',
        displayName: data.name,
        name: data.name,
        first_name: data.first_name,
        last_name: data.last_name,
        nickname: data.nickname,
        description: data.description,
        phone,
        social: lpSocial,
        avatar: lpAvatar || data.avatar_urls?.['96'] || data.avatar_urls?.['48'],
        avatar_urls: data.avatar_urls,
        roles: data.roles || ['subscriber'],
      };
    } catch {
      return null;
    }
  }

  /**
   * Update user profile via WordPress REST API (/wp/v2/users/me)
   * Resolves Defect DEFECT-M3-01 / test T1.3.5 in scripts/e2e_full_suite.js
   */
  static async updateProfile(payload: ProfileUpdatePayload): Promise<UserProfile> {
    const body: Record<string, any> = {};
    if (payload.name !== undefined) body.name = payload.name;
    if (payload.first_name !== undefined) body.first_name = payload.first_name;
    if (payload.last_name !== undefined) body.last_name = payload.last_name;
    if (payload.nickname !== undefined) body.nickname = payload.nickname;
    if (payload.description !== undefined) body.description = payload.description;

    const meta: Record<string, any> = {};
    if (payload.phone !== undefined) {
      meta.phone = payload.phone;
      meta.billing_phone = payload.phone;
    }
    if (Object.keys(meta).length > 0) {
      body.meta = meta;
    }

    const data = await HttpClient.post<any>(Endpoints.WORDPRESS.CURRENT_USER, body);

    // Synchronize social profile links to LearnPress if provided
    let lpSocial = payload.social;
    if (payload.social && data?.id) {
      try {
        await HttpClient.post(`/wp-json/learnpress/v1/users/${data.id}`, {
          social: payload.social,
        });
      } catch {
        // LearnPress social sync error fallback
      }
    }

    // LearnPress avatar synchronization
    let lpAvatar: string | undefined;
    if (data?.id) {
      try {
        const lpUser = await this.getLearnPressUser(data.id);
        if (lpUser) {
          if (lpUser.avatar_url) lpAvatar = lpUser.avatar_url;
          if (lpUser.social && !lpSocial) lpSocial = lpUser.social;
        }
      } catch {
        // LearnPress avatar fetch error ignored
      }
    }

    const updatedUser: UserProfile = {
      id: data.id,
      username: data.slug || data.name,
      email: data.email || '',
      displayName: data.name,
      name: data.name,
      first_name: data.first_name,
      last_name: data.last_name,
      nickname: data.nickname,
      description: data.description,
      phone: payload.phone,
      social: lpSocial,
      avatar: lpAvatar || data.avatar_urls?.['96'] || data.avatar_urls?.['48'],
      avatar_urls: data.avatar_urls,
      roles: data.roles || ['subscriber'],
    };

    return updatedUser;
  }

  /**
   * Change authenticated user password via LearnPress (/learnpress/v1/users/change-password)
   */
  static async changePassword(payload: ChangePasswordPayload): Promise<{ code: string; message: string }> {
    try {
      const response = await HttpClient.post<{ code: string; message: string }>(
        Endpoints.LEARNPRESS.USER_CHANGE_PASSWORD,
        {
          old_password: payload.old_password,
          new_password: payload.new_password,
          confirm_password: payload.confirm_password,
        }
      );
      return response;
    } catch (err: any) {
      if (err?.code === 'rest_user_incorrect_password' || err?.data?.code === 'rest_user_incorrect_password') {
        const customErr = new Error(err.message || 'Your current password is incorrect.');
        (customErr as any).code = 'rest_user_incorrect_password';
        throw customErr;
      }
      throw err;
    }
  }

  /**
   * Fetch user details from LearnPress
   */
  static async getLearnPressUser(userId: string | number): Promise<any> {
    return HttpClient.get(Endpoints.LEARNPRESS.USER_DETAIL(userId));
  }

  /**
   * Permanently delete authenticated WordPress/LearnPress user account (/learnpress/v1/users/delete)
   */
  static async deleteAccount(
    userId: string | number,
    password: string
  ): Promise<{ code?: string; message?: string; status?: string }> {
    const numericId = Number(userId);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw new Error('This account does not have a valid server user ID. Please use the web deletion form.');
    }
    if (!password || !password.trim()) {
      throw new Error('Password is required to confirm permanent account deletion.');
    }

    return HttpClient.post<{ code?: string; message?: string; status?: string }>(
      Endpoints.LEARNPRESS.USER_DELETE,
      {
        id: numericId,
        password,
      }
    );
  }
}

