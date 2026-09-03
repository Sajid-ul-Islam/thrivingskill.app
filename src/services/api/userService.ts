import { HttpClient } from './httpClient';
import { Endpoints } from './endpoints';
import { WpUser } from '../../types';

export class UserService {
  /**
   * Fetch current authenticated WordPress user profile
   */
  static async getCurrentUser(): Promise<WpUser | null> {
    try {
      const data = await HttpClient.get<any>(Endpoints.WORDPRESS.CURRENT_USER);
      if (!data) return null;

      return {
        id: data.id,
        username: data.slug || data.name,
        email: data.email || '',
        displayName: data.name,
        avatar: data.avatar_urls?.['96'] || data.avatar_urls?.['48'],
        roles: data.roles || ['subscriber'],
      };
    } catch {
      return null;
    }
  }

  /**
   * Fetch user details from LearnPress
   */
  static async getLearnPressUser(userId: string | number): Promise<any> {
    return HttpClient.get(Endpoints.LEARNPRESS.USER_DETAIL(userId));
  }
}
