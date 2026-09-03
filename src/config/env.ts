/**
 * Application Environment Configuration
 * 
 * Supports Expo SDK 49+ EXPO_PUBLIC_* environment variables.
 * When environment variables are defined in .env, they are embedded at build time.
 * If not defined, sensible production defaults are applied automatically.
 */

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

export const Env = {
  /**
   * Base REST API URL (WordPress / LearnPress REST API)
   * e.g. https://thrivingskill.com/wp-json
   */
  get API_URL(): string {
    return normalizeUrl(getEnvVar('EXPO_PUBLIC_API_URL')) || 'https://thrivingskill.com/wp-json';
  },

  /**
   * Main Website URL
   * e.g. https://thrivingskill.com
   */
  get SITE_URL(): string {
    return normalizeUrl(getEnvVar('EXPO_PUBLIC_SITE_URL')) || 'https://thrivingskill.com';
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
   * Whether to fallback to local seed data if network is unavailable
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
   * Optional WooCommerce Consumer Key
   */
  get WC_CONSUMER_KEY(): string | undefined {
    return getEnvVar('EXPO_PUBLIC_WC_CONSUMER_KEY');
  },

  /**
   * Optional WooCommerce Consumer Secret
   */
  get WC_CONSUMER_SECRET(): string | undefined {
    return getEnvVar('EXPO_PUBLIC_WC_CONSUMER_SECRET');
  },
};
