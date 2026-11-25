import { HttpClient } from './httpClient';
import { Endpoints } from './endpoints';
import { CacheManager } from '../cache/cacheManager';
import { Env } from '../../config/env';

export interface HeroSlide {
  id: number | string;
  tag?: string;
  title: string;
  subtitle?: string;
  button_text?: string;
  image_url?: string;
  target?: string;
}

export interface FlashSaleCampaign {
  active: boolean;
  title: string;
  coupon_code: string;
  discount_percent: number;
  end_time?: string | null;
  end_timestamp?: number | null;
}

export interface LearnerSupportHotline {
  whatsapp?: string | null;
  email?: string | null;
  helpline?: string | null;
}

export interface AppRemoteConfig {
  status: string;
  version_control: {
    min_required_version: string;
    latest_version: string;
    maintenance_mode: boolean;
  };
  checkout_policy: {
    mode: 'webview' | 'native';
    checkout_url: string;
    sslcommerz_active: boolean;
  };
  announcement_banner: {
    active: boolean;
    message: string;
    target?: string;
  };
  hero_slides?: HeroSlide[];
  flash_sale?: FlashSaleCampaign;
  trending_keywords?: string[];
  support?: LearnerSupportHotline;
  server_time?: string;
  server_timestamp?: number;
}

export interface LeanFeedPageResponse {
  count: number;
  page?: number;
  limit?: number;
  total?: number;
  total_pages?: number;
  courses: any[];
}

const CONFIG_CACHE_KEY = '@thrivingskill_remote_companion_config_v1';
const CONFIG_CACHE_TTL = 300000; // 5 minutes
export const MAX_COMPANION_FEED_LIMIT = 50;
const EXPO_PUSH_TOKEN_REGEX = /^(?:ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]{8,128}\]$/;

/**
 * Validates whether a remote flash sale is genuinely active and has not expired.
 */
export function isFlashSaleActive(
  sale?: FlashSaleCampaign | null,
  nowMs: number = Date.now()
): boolean {
  if (!sale || !sale.active) return false;

  if (typeof sale.end_timestamp === 'number' && Number.isFinite(sale.end_timestamp)) {
    return sale.end_timestamp * 1000 > nowMs;
  }

  if (typeof sale.end_time === 'string' && sale.end_time.trim().length > 0) {
    const parsedMs = Date.parse(sale.end_time);
    return Number.isFinite(parsedMs) && parsedMs > nowMs;
  }

  return false;
}

/**
 * Normalizes optional remote support hotlines so empty/unset strings never produce broken links.
 */
export function resolveSupportContacts(support?: LearnerSupportHotline | null): {
  whatsapp: string | null;
  email: string | null;
  helpline: string | null;
} {
  const cleanStr = (val?: string | null): string | null => {
    if (typeof val !== 'string') return null;
    const trimmed = val.trim();
    return trimmed.length > 0 ? trimmed : null;
  };

  return {
    whatsapp: cleanStr(support?.whatsapp),
    email: cleanStr(support?.email),
    helpline: cleanStr(support?.helpline),
  };
}

export class CompanionService {
  /**
   * Fetches live remote configuration and Mobile Command Center parameters
   * from the TS Mobile Bridge companion plugin with SWR caching.
   */
  static async fetchAppConfig(forceRefresh: boolean = false): Promise<AppRemoteConfig | null> {
    if (!forceRefresh) {
      const cached = await CacheManager.get<AppRemoteConfig>(CONFIG_CACHE_KEY);
      if (cached) return cached;
    }

    try {
      const config = await HttpClient.get<AppRemoteConfig>(Endpoints.COMPANION.CONFIG, {
        _t: Date.now(),
      });

      if (config && config.status === 'success') {
        await CacheManager.set(CONFIG_CACHE_KEY, config, CONFIG_CACHE_TTL);
        return config;
      }
      return null;
    } catch (err) {
      if (Env.DEBUG_API) {
        console.warn(
          '[CompanionService] Failed to fetch remote config, using stale fallback:',
          err
        );
      }
      return CacheManager.get<AppRemoteConfig>(CONFIG_CACHE_KEY, true);
    }
  }

  /**
   * Registers or updates authenticated learner device Expo push token with the companion plugin.
   */
  static async registerPushToken(
    token: string,
    platform: 'android' | 'ios' | 'web' = 'android'
  ): Promise<boolean> {
    if (!token || !EXPO_PUSH_TOKEN_REGEX.test(token.trim())) {
      return false;
    }

    const authToken = await HttpClient.getAuthToken();
    if (!authToken) {
      return false;
    }

    try {
      const res = await HttpClient.post<{ status: string }>(
        Endpoints.COMPANION.REGISTER_PUSH_TOKEN,
        {
          token: token.trim(),
          platform,
        }
      );
      return res?.status === 'success';
    } catch (err) {
      if (Env.DEBUG_API) {
        console.warn('[CompanionService] Failed to register push token:', err);
      }
      return false;
    }
  }

  /**
   * Fetches a bounded page from the lean course feed endpoint (max 50 per page).
   */
  static async fetchLeanFeed(
    limit: number = 30,
    page: number = 1
  ): Promise<LeanFeedPageResponse | null> {
    const boundedLimit = Math.max(1, Math.min(MAX_COMPANION_FEED_LIMIT, Math.floor(limit)));
    const boundedPage = Math.max(1, Math.floor(page));

    try {
      const res = await HttpClient.get<LeanFeedPageResponse>(Endpoints.COMPANION.FEED, {
        limit: boundedLimit,
        page: boundedPage,
      });
      if (res && Array.isArray(res.courses)) {
        return res;
      }
      return null;
    } catch (err) {
      if (Env.DEBUG_API) {
        console.warn('[CompanionService] Companion feed unavailable, falling back:', err);
      }
      return null;
    }
  }

  /**
   * Paginates across the bounded companion /feed (50 per page) to retrieve the full catalog.
   */
  static async fetchAllLeanFeed(): Promise<any[] | null> {
    const firstPage = await this.fetchLeanFeed(MAX_COMPANION_FEED_LIMIT, 1);
    if (!firstPage || !Array.isArray(firstPage.courses) || firstPage.courses.length === 0) {
      return null;
    }

    const allCourses: any[] = [...firstPage.courses];
    const totalPages = Math.max(1, Number(firstPage.total_pages) || 1);

    if (totalPages > 1) {
      const pagePromises: Promise<LeanFeedPageResponse | null>[] = [];
      for (let p = 2; p <= totalPages; p++) {
        pagePromises.push(this.fetchLeanFeed(MAX_COMPANION_FEED_LIMIT, p));
      }
      const remainingPages = await Promise.all(pagePromises);
      remainingPages.forEach((pg) => {
        if (pg && Array.isArray(pg.courses)) {
          allCourses.push(...pg.courses);
        }
      });
    }

    return allCourses;
  }
}
