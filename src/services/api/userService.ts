import { HttpClient } from './httpClient';
import { Endpoints } from './endpoints';
import { WpUser, UserSocialLinks } from '../../types';

export interface ProfileUpdatePayload {
  name?: string;
  first_name?: string;
  last_name?: string;
  nickname?: string;
  description?: string;
  phone?: string;
  city?: string;
  avatar?: string;
  cover_photo?: string;
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
  city?: string;
  cover_photo?: string;
  social?: UserSocialLinks;
  avatar_urls?: Record<string, string>;
}

export class UserService {
  /**
   * Fetch current authenticated WordPress user profile from live backend
   */
  static async getCurrentUser(): Promise<UserProfile | null> {
    try {
      const data = await HttpClient.get<any>(Endpoints.WORDPRESS.CURRENT_USER, { context: 'edit' });
      if (!data) return null;

      let lpAvatar: string | undefined;
      let lpCover: string | undefined;
      let lpSocial: UserSocialLinks | undefined;
      let lpPhone: string | undefined;
      let lpCity: string | undefined;

      if (data.id) {
        try {
          const lpUser = await this.getLearnPressUser(data.id);
          if (lpUser) {
            if (lpUser.avatar_url) lpAvatar = lpUser.avatar_url;
            if (lpUser.cover_url || lpUser.cover_photo)
              lpCover = lpUser.cover_url || lpUser.cover_photo;
            if (lpUser.social) lpSocial = lpUser.social;
            if (lpUser.city) lpCity = lpUser.city;
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
      const city =
        lpCity || data.meta?.city || data.meta?.billing_city || data.meta?.shipping_city || '';
      const avatar =
        lpAvatar ||
        data.meta?.avatar_url ||
        data.avatar_urls?.['96'] ||
        data.avatar_urls?.['48'] ||
        '';
      const cover_photo = lpCover || data.meta?.cover_photo || data.meta?.cover_url || '';

      return {
        id: data.id,
        username: data.slug || data.name,
        email: data.email || '',
        displayName: data.name,
        name: data.name,
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        nickname: data.nickname || '',
        description: data.description || '',
        phone,
        city,
        avatar,
        cover_photo,
        social: lpSocial,
        avatar_urls: data.avatar_urls,
        roles: data.roles || ['subscriber'],
      };
    } catch {
      return null;
    }
  }

  /**
   * Update user profile via WordPress REST API (/wp/v2/users/me) and LearnPress
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
    if (payload.city !== undefined) {
      meta.city = payload.city;
      meta.billing_city = payload.city;
    }
    if (payload.avatar !== undefined) {
      meta.avatar_url = payload.avatar;
    }
    if (payload.cover_photo !== undefined) {
      meta.cover_photo = payload.cover_photo;
      meta.cover_url = payload.cover_photo;
    }
    if (Object.keys(meta).length > 0) {
      body.meta = meta;
    }

    const data = await HttpClient.post<any>(Endpoints.WORDPRESS.CURRENT_USER, body);

    // Synchronize social links, avatar, and cover image to LearnPress
    let lpSocial = payload.social;
    if (data?.id) {
      try {
        const lpPayload: Record<string, any> = {};
        if (payload.social) lpPayload.social = payload.social;
        if (payload.avatar) lpPayload.avatar_url = payload.avatar;
        if (payload.cover_photo) lpPayload.cover_url = payload.cover_photo;
        if (payload.city) lpPayload.city = payload.city;
        if (payload.phone) lpPayload.phone = payload.phone;

        if (Object.keys(lpPayload).length > 0) {
          await HttpClient.post(Endpoints.LEARNPRESS.USER_DETAIL(data.id), lpPayload);
        }
      } catch {
        // Fallback silently if LearnPress custom endpoint rejects extra fields
      }
    }

    const updatedUser: UserProfile = {
      id: data?.id || '',
      username: data?.slug || data?.name || '',
      email: data?.email || '',
      displayName: data?.name || payload.name || '',
      name: data?.name || payload.name || '',
      first_name: data?.first_name || payload.first_name || '',
      last_name: data?.last_name || payload.last_name || '',
      nickname: data?.nickname || payload.nickname || '',
      description: data?.description || payload.description || '',
      phone: payload.phone || data?.meta?.phone || '',
      city: payload.city || data?.meta?.city || '',
      avatar: payload.avatar || data?.meta?.avatar_url || data?.avatar_urls?.['96'] || '',
      cover_photo: payload.cover_photo || data?.meta?.cover_photo || '',
      social: lpSocial,
      avatar_urls: data?.avatar_urls,
      roles: data?.roles || ['subscriber'],
    };

    return updatedUser;
  }

  /**
   * Change authenticated user password via LearnPress (/learnpress/v1/users/change-password)
   */
  static async changePassword(
    payload: ChangePasswordPayload
  ): Promise<{ code: string; message: string }> {
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
      if (
        err?.code === 'rest_user_incorrect_password' ||
        err?.data?.code === 'rest_user_incorrect_password'
      ) {
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
      throw new Error(
        'This account does not have a valid server user ID. Please use the web deletion form.'
      );
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
