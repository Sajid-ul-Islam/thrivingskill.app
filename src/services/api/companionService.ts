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
  end_time?: string;
  end_timestamp?: number;
}

export interface LearnerSupportHotline {
  whatsapp: string;
  email: string;
  helpline: string;
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
}

const CONFIG_CACHE_KEY = '@thrivingskill_remote_companion_config_v1';
const CONFIG_CACHE_TTL = 300000; // 5 minutes

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
   * Registers or updates learner device push token with the WordPress companion plugin
   */
  static async registerPushToken(
    token: string,
    platform: 'android' | 'ios' | 'web' = 'android'
  ): Promise<boolean> {
    if (!token) return false;
    try {
      const res = await HttpClient.post<{ status: string }>(
        Endpoints.COMPANION.REGISTER_PUSH_TOKEN,
        {
          token,
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
   * Fetches the ultra-fast lean course feed from the companion plugin
   */
  static async fetchLeanFeed(limit: number = 30): Promise<any[] | null> {
    try {
      const res = await HttpClient.get<{ count: number; courses: any[] }>(
        Endpoints.COMPANION.FEED,
        {
          limit,
          _t: Date.now(),
        }
      );
      if (res && Array.isArray(res.courses)) {
        return res.courses;
      }
      return null;
    } catch (err) {
      if (Env.DEBUG_API) {
        console.warn('[CompanionService] Companion feed unavailable, falling back:', err);
      }
      return null;
    }
  }
}
