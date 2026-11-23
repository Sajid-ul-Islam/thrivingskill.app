import AsyncStorage from '@react-native-async-storage/async-storage';
import { CacheManager } from '../cache/cacheManager';
import { SecureStorageService } from './secureStorage';

const STORAGE_CLEANUP_VERSION = '@ts_storage_sanitized_v2';
const DEFAULT_PREFS_VERSION = '@ts_default_prefs_v1';
const AUTH_USER_KEY = '@thriving_skill_user';
const QNA_PREFIX = '@thriving_skill_qna_';

/**
 * StorageSanitizer
 * Ensures that any legacy mock data (such as Unsplash avatars, mock Q&A comments,
 * and test reviews stored in previous builds) is automatically detected and purged
 * from AsyncStorage on app launch.
 */
export class StorageSanitizer {
  static async runStartupSanitization(): Promise<void> {
    try {
      // 0. Enforce English language and Light mode by default per client requirement
      const prefsInitialized = await AsyncStorage.getItem(DEFAULT_PREFS_VERSION);
      if (!prefsInitialized) {
        await AsyncStorage.setItem('@thriving_skill_lang', 'en');
        await AsyncStorage.setItem('@thriving_skill_theme_mode', 'light');
        await AsyncStorage.setItem(DEFAULT_PREFS_VERSION, '1');
      }

      const alreadySanitized = await AsyncStorage.getItem(STORAGE_CLEANUP_VERSION);
      if (alreadySanitized) {
        // Still perform a fast sanity check on the active user avatar
        await this.sanitizeUserAvatar();
        return;
      }

      console.log('[StorageSanitizer] Running comprehensive legacy storage sanitization...');

      // 1. Sanitize cached user profile in local storage
      await this.sanitizeUserAvatar();

      // 2. Scan and purge mock Q&A comments from local storage
      await this.sanitizeAllQnAStores();

      // 3. Scan and purge mock reviews/comments from local storage
      await this.sanitizeAllReviewStores();

      // 4. Clear stale course catalog cache to force fresh live LMS sync
      await CacheManager.remove('courses_full_catalog');
      await CacheManager.remove('courses_list_all');

      // 5. Migrate any plaintext auth tokens to hardware-backed SecureStore
      await SecureStorageService.getAuthToken().catch(() => {});

      // 6. Mark sanitization as complete for this build version
      await AsyncStorage.setItem(STORAGE_CLEANUP_VERSION, new Date().toISOString());
      console.log('[StorageSanitizer] Local storage successfully sanitized of all mock data.');
    } catch (err) {
      console.warn('[StorageSanitizer] Sanitization check encountered non-fatal error:', err);
    }
  }

  /**
   * Cleans any mock or Unsplash avatar from the stored user profile
   */
  private static async sanitizeUserAvatar(): Promise<void> {
    try {
      const rawUser = await AsyncStorage.getItem(AUTH_USER_KEY);
      if (!rawUser) return;

      const user = JSON.parse(rawUser);
      if (user && typeof user === 'object') {
        const avatarStr = typeof user.avatar === 'string' ? user.avatar : '';
        const isMockAvatar =
          avatarStr.includes('unsplash.com') ||
          avatarStr.includes('randomuser.me') ||
          avatarStr.includes('i.pravatar.cc') ||
          avatarStr.includes('mock');

        if (isMockAvatar) {
          user.avatar = '';
          await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
          console.log('[StorageSanitizer] Purged legacy mock avatar from local user profile.');
        }
      }
    } catch {}
  }

  /**
   * Scans all @thriving_skill_qna_* keys and purges mock discussion questions
   */
  private static async sanitizeAllQnAStores(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const qnaKeys = allKeys.filter((k) => k.startsWith(QNA_PREFIX));

      for (const key of qnaKeys) {
        const raw = await AsyncStorage.getItem(key);
        if (!raw) continue;

        try {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            const cleanList = list.filter((item: any) => {
              if (!item || !item.id) return false;
              if (
                item.id === 'qna-1' ||
                item.id === 'qna-2' ||
                item.authorName === 'Tanvir Hossain' ||
                item.authorName === 'Nusrat Jahan' ||
                (typeof item.authorAvatar === 'string' && item.authorAvatar.includes('unsplash.com'))
              ) {
                return false;
              }
              return true;
            });

            if (cleanList.length !== list.length) {
              await AsyncStorage.setItem(key, JSON.stringify(cleanList));
              console.log(`[StorageSanitizer] Cleaned mock Q&A items from ${key}`);
            }
          }
        } catch {}
      }
    } catch {}
  }

  /**
   * Scans AsyncStorage for any cached reviews or items containing mock avatars or fake authors
   */
  private static async sanitizeAllReviewStores(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const reviewKeys = allKeys.filter((k) => k.includes('review') || k.startsWith('@ts_cache_'));

      for (const key of reviewKeys) {
        const raw = await AsyncStorage.getItem(key);
        if (
          !raw ||
          (!raw.includes('unsplash.com') &&
            !raw.includes('randomuser.me') &&
            !raw.includes('i.pravatar.cc') &&
            !raw.includes('Tanvir Hossain') &&
            !raw.includes('Nusrat Jahan'))
        ) {
          continue;
        }

        try {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            if (Array.isArray(parsed.data)) {
              parsed.data = parsed.data.filter((item: any) => {
                const avatar = item?.userAvatar || item?.authorAvatar || '';
                const name = item?.userName || item?.authorName || '';
                if (
                  avatar.includes('unsplash.com') ||
                  avatar.includes('randomuser.me') ||
                  avatar.includes('i.pravatar.cc') ||
                  name === 'Tanvir Hossain' ||
                  name === 'Nusrat Jahan'
                ) {
                  return false;
                }
                return true;
              });
              await AsyncStorage.setItem(key, JSON.stringify(parsed));
              console.log(`[StorageSanitizer] Sanitized cached review data in ${key}`);
            } else if (Array.isArray(parsed)) {
              const clean = parsed.filter((item: any) => {
                const avatar = item?.userAvatar || item?.authorAvatar || '';
                const name = item?.userName || item?.authorName || '';
                if (
                  avatar.includes('unsplash.com') ||
                  avatar.includes('randomuser.me') ||
                  avatar.includes('i.pravatar.cc') ||
                  name === 'Tanvir Hossain' ||
                  name === 'Nusrat Jahan'
                ) {
                  return false;
                }
                return true;
              });
              await AsyncStorage.setItem(key, JSON.stringify(clean));
              console.log(`[StorageSanitizer] Sanitized review items in ${key}`);
            }
          }
        } catch {}
      }
    } catch {}
  }
}
