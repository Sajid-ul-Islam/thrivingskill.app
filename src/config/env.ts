import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Application Environment Configuration
 *
 * Supports dual-environment operation for:
 * 1. Live Production Site: https://thrivingskill.com
 * 2. Staging Testing Site: https://staging.thrivingskill.com
 *
 * Provides:
 * - Dynamic runtime environment switching with persistence in AsyncStorage
 * - Automatic dual-host network fallback/failover in HttpClient
 * - Reactive environment listeners for cache invalidation & UI updates
 * - Full backward-compatible static property getters
 */

export type ApiEnvironment = 'production' | 'staging';

export interface EnvironmentConfig {
  name: ApiEnvironment;
  label: string;
  labelBn: string;
  siteUrl: string;
  apiUrl: string;
  wpAdminUrl: string;
  accountDeletionUrl: string;
  companionRegisterUrl: string;
}

export const ENVIRONMENTS: Record<ApiEnvironment, EnvironmentConfig> = {
  production: {
    name: 'production',
    label: 'Live Production',
    labelBn: 'লাইভ প্রোডাকশন',
    siteUrl: 'https://thrivingskill.com',
    apiUrl: 'https://thrivingskill.com/wp-json',
    wpAdminUrl: 'https://thrivingskill.com/wp-admin/',
    accountDeletionUrl: 'https://thrivingskill.com/delete-account/',
    companionRegisterUrl: 'https://thrivingskill.com/wp-json/thrivingskill/v1/register',
  },
  staging: {
    name: 'staging',
    label: 'Staging Server',
    labelBn: 'স্টেজিং সার্ভার',
    siteUrl: 'https://staging.thrivingskill.com',
    apiUrl: 'https://staging.thrivingskill.com/wp-json',
    wpAdminUrl: 'https://staging.thrivingskill.com/wp-admin/',
    accountDeletionUrl: 'https://staging.thrivingskill.com/delete-account/',
    companionRegisterUrl: 'https://staging.thrivingskill.com/wp-json/thrivingskill/v1/register',
  },
};

const normalizeUrl = (url?: string): string => {
  if (!url) return '';
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

// Safe access helper for React Native / Expo environment variables
const getEnvVar = (key: string): string | undefined => {
  if (typeof process !== 'undefined' && process.env) {
    return (process.env as Record<string, string | undefined>)[key];
  }
  return undefined;
};

// Initial environment determination from build-time vars or sensible live default
const determineInitialEnvironment = (): ApiEnvironment => {
  const defaultEnv = getEnvVar('EXPO_PUBLIC_DEFAULT_ENVIRONMENT');
  if (defaultEnv === 'staging') return 'staging';
  if (defaultEnv === 'production') return 'production';

  const explicitApi = getEnvVar('EXPO_PUBLIC_API_URL');
  const explicitSite = getEnvVar('EXPO_PUBLIC_SITE_URL');
  if (
    (explicitApi && explicitApi.includes('staging.thrivingskill.com')) ||
    (explicitSite && explicitSite.includes('staging.thrivingskill.com'))
  ) {
    return 'staging';
  }
  return 'production';
};

const ACTIVE_ENV_STORAGE_KEY = '@thrivingskill_active_environment';
let activeEnvironment: ApiEnvironment = determineInitialEnvironment();
let hasExplicitUserSelection = false;
let isInitialized = false;
const environmentListeners = new Set<(env: ApiEnvironment) => void>();

export const Env = {
  /**
   * Available environment registry
   */
  ENVIRONMENTS,

  /**
   * Active environment identifier ('production' | 'staging')
   */
  get currentEnvironment(): ApiEnvironment {
    return activeEnvironment;
  },

  /**
   * Complete configuration object for active environment
   */
  get environmentConfig(): EnvironmentConfig {
    return ENVIRONMENTS[activeEnvironment];
  },

  /**
   * Alternate environment used for automatic failover/fallback
   */
  get fallbackEnvironment(): ApiEnvironment {
    return activeEnvironment === 'production' ? 'staging' : 'production';
  },

  /**
   * Fallback base REST API URL
   */
  get FALLBACK_API_URL(): string {
    return ENVIRONMENTS[this.fallbackEnvironment].apiUrl;
  },

  /**
   * Fallback main website URL
   */
  get FALLBACK_SITE_URL(): string {
    return ENVIRONMENTS[this.fallbackEnvironment].siteUrl;
  },

  /**
   * Initialize and restore persisted environment preference from AsyncStorage
   */
  async init(): Promise<ApiEnvironment> {
    if (isInitialized) return activeEnvironment;
    try {
      if (AsyncStorage && typeof AsyncStorage.getItem === 'function') {
        const stored = await AsyncStorage.getItem(ACTIVE_ENV_STORAGE_KEY);
        if (stored === 'production' || stored === 'staging') {
          activeEnvironment = stored;
          hasExplicitUserSelection = true;
        }
      }
    } catch {
      // In tests or headless environments, keep initial default
    }
    isInitialized = true;
    return activeEnvironment;
  },

  /**
   * Dynamically switch server environment at runtime
   */
  async setEnvironment(newEnv: ApiEnvironment): Promise<void> {
    if (newEnv !== 'production' && newEnv !== 'staging') return;
    activeEnvironment = newEnv;
    hasExplicitUserSelection = true;

    try {
      if (AsyncStorage && typeof AsyncStorage.setItem === 'function') {
        await AsyncStorage.setItem(ACTIVE_ENV_STORAGE_KEY, newEnv);
      }
    } catch {}

    // Notify all active subscribers
    environmentListeners.forEach((listener) => {
      try {
        listener(newEnv);
      } catch (err) {
        if (this.DEBUG_API) {
          console.warn('[Env] Error in environment subscriber:', err);
        }
      }
    });
  },

  /**
   * Toggle between production and staging
   */
  async toggleEnvironment(): Promise<ApiEnvironment> {
    const nextEnv: ApiEnvironment = activeEnvironment === 'production' ? 'staging' : 'production';
    await this.setEnvironment(nextEnv);
    return nextEnv;
  },

  /**
   * Subscribe to server environment changes
   */
  subscribeEnvironment(listener: (env: ApiEnvironment) => void): () => void {
    environmentListeners.add(listener);
    return () => {
      environmentListeners.delete(listener);
    };
  },

  /**
   * Base REST API URL (WordPress / LearnPress REST API)
   * Dynamically resolves to active environment
   */
  get API_URL(): string {
    if (hasExplicitUserSelection) {
      return ENVIRONMENTS[activeEnvironment].apiUrl;
    }
    const explicit = normalizeUrl(getEnvVar('EXPO_PUBLIC_API_URL'));
    if (explicit) return explicit;
    return ENVIRONMENTS[activeEnvironment].apiUrl;
  },

  /**
   * Main Website URL
   * Dynamically resolves to active environment
   */
  get SITE_URL(): string {
    if (hasExplicitUserSelection) {
      return ENVIRONMENTS[activeEnvironment].siteUrl;
    }
    const explicit = normalizeUrl(getEnvVar('EXPO_PUBLIC_SITE_URL'));
    if (explicit) return explicit;
    return ENVIRONMENTS[activeEnvironment].siteUrl;
  },

  /**
   * WordPress Admin Console URL
   * e.g. https://thrivingskill.com/wp-admin/ or https://staging.thrivingskill.com/wp-admin/
   */
  get WP_ADMIN_URL(): string {
    return ENVIRONMENTS[activeEnvironment].wpAdminUrl;
  },

  /**
   * Google Play Mandatory Account & Data Deletion Public URL
   */
  get ACCOUNT_DELETION_URL(): string {
    return ENVIRONMENTS[activeEnvironment].accountDeletionUrl;
  },

  /**
   * Request Timeout in milliseconds
   */
  get REQUEST_TIMEOUT_MS(): number {
    const raw = getEnvVar('EXPO_PUBLIC_REQUEST_TIMEOUT_MS');
    const timeout = Number(raw);
    return !isNaN(timeout) && timeout > 0 ? timeout : 15000;
  },

  /**
   * Maximum automatic retries for idempotent requests on network failure
   */
  get MAX_RETRIES(): number {
    const raw = getEnvVar('EXPO_PUBLIC_MAX_RETRIES');
    const retries = Number(raw);
    return !isNaN(retries) && retries >= 0 ? retries : 2;
  },

  /**
   * Cache Time-To-Live in milliseconds
   */
  get CACHE_TTL_MS(): number {
    const raw = getEnvVar('EXPO_PUBLIC_CACHE_TTL_MS');
    const ttl = Number(raw);
    return !isNaN(ttl) && ttl > 0 ? ttl : 300000; // 5 minutes
  },

  /**
   * Whether to fallback to alternate host or local seed data if network is unavailable
   */
  get ENABLE_FALLBACK(): boolean {
    const raw = getEnvVar('EXPO_PUBLIC_ENABLE_FALLBACK');
    if (raw !== undefined) {
      return raw === 'true';
    }
    return true;
  },

  /**
   * Whether to output detailed API request/response logs in console
   */
  get DEBUG_API(): boolean {
    const raw = getEnvVar('EXPO_PUBLIC_DEBUG_API');
    if (raw !== undefined) {
      return raw === 'true';
    }
    return typeof __DEV__ !== 'undefined' ? __DEV__ : false;
  },

  /**
   * Optional Google Gemini API Key
   */
  get GEMINI_API_KEY(): string | undefined {
    return getEnvVar('EXPO_PUBLIC_GEMINI_API_KEY');
  },

  /**
   * Optional Google API Key
   */
  get GOOGLE_API_KEY(): string | undefined {
    return getEnvVar('EXPO_PUBLIC_GOOGLE_API_KEY');
  },
};
