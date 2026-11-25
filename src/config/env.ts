import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Application Environment Configuration
 *
 * Supports dual-environment operation in development builds for:
 * 1. Live Production Site: https://thrivingskill.com
 * 2. Staging Testing Site: https://staging.thrivingskill.com
 *
 * Security & Release Guarantees:
 * - Every EXPO_PUBLIC_* variable is read via a static literal `process.env.EXPO_PUBLIC_*`
 *   property access so Metro/Babel inlines build-time values into Hermes release bundles.
 * - Production builds NEVER fail over to staging and NEVER restore persisted staging overrides.
 * - Runtime environment switching is restricted strictly to development builds (`__DEV__`).
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
  const trimmed = url.trim();
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
};

const isStagingUrl = (url?: string): boolean => {
  if (!url) return false;
  return url.toLowerCase().includes('staging.thrivingskill.com');
};

/**
 * Resolves a safe fallback URL for the active environment.
 * Production builds NEVER fail over to staging; only an explicit non-staging mirror is allowed.
 */
export const resolveFallbackUrl = (
  explicitFallback: string | undefined,
  env: ApiEnvironment,
  stagingDefaultFallback: string
): string => {
  const normalized = normalizeUrl(explicitFallback);
  if (env === 'production') {
    if (normalized && !isStagingUrl(normalized)) {
      return normalized;
    }
    return '';
  }
  return normalized || stagingDefaultFallback;
};

const isDevRuntime = (): boolean => typeof __DEV__ !== 'undefined' && __DEV__;

/**
 * Determines the initial build-time environment using static literal `process.env.EXPO_PUBLIC_*`
 * reads so Expo / Metro inlines them into Hermes release bundles.
 */
const determineInitialEnvironment = (): ApiEnvironment => {
  const defaultEnv = process.env.EXPO_PUBLIC_DEFAULT_ENVIRONMENT;
  if (defaultEnv === 'staging') return 'staging';
  if (defaultEnv === 'production') return 'production';

  const explicitApi = process.env.EXPO_PUBLIC_API_URL;
  const explicitSite = process.env.EXPO_PUBLIC_SITE_URL;
  if (isStagingUrl(explicitApi) || isStagingUrl(explicitSite)) {
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
   * Whether runtime environment switching is permitted (development builds only).
   */
  get canSwitchEnvironment(): boolean {
    return isDevRuntime();
  },

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
   * Alternate environment when operating in staging (development/staging only).
   * Production never falls back to staging.
   */
  get fallbackEnvironment(): ApiEnvironment | null {
    return activeEnvironment === 'staging' ? 'production' : null;
  },

  /**
   * Fallback base REST API URL.
   * - In production: uses an explicit production mirror (`EXPO_PUBLIC_FALLBACK_API_URL`) if
   *   configured and NOT pointing to staging; otherwise returns '' (never fails over to staging).
   * - In staging: allows explicit fallback URL or production registry fallback.
   */
  get FALLBACK_API_URL(): string {
    return resolveFallbackUrl(
      process.env.EXPO_PUBLIC_FALLBACK_API_URL,
      activeEnvironment,
      ENVIRONMENTS.production.apiUrl
    );
  },

  /**
   * Fallback main website URL.
   * Never returns a staging host when activeEnvironment is 'production'.
   */
  get FALLBACK_SITE_URL(): string {
    return resolveFallbackUrl(
      process.env.EXPO_PUBLIC_FALLBACK_SITE_URL,
      activeEnvironment,
      ENVIRONMENTS.production.siteUrl
    );
  },

  /**
   * Public Sentry DSN read via static literal access so Expo/Metro inlines it into release bundles.
   */
  get SENTRY_DSN(): string {
    return (process.env.EXPO_PUBLIC_SENTRY_DSN || '').trim();
  },

  /**
   * Validates required EXPO_PUBLIC_* variables at startup in non-production builds
   * so missing release/preview config fails loudly instead of silently falling back.
   */
  assertRequiredVars(options?: {
    allowTestBypass?: boolean;
    overrides?: { apiUrl?: string; siteUrl?: string };
  }): {
    apiUrl: string;
    siteUrl: string;
    environment: ApiEnvironment;
  } {
    const allowTestBypass = options?.allowTestBypass ?? true;
    const isJestRunner = typeof process !== 'undefined' && Boolean(process.env.JEST_WORKER_ID);

    const staticApiUrl = normalizeUrl(
      options?.overrides && 'apiUrl' in options.overrides
        ? options.overrides.apiUrl
        : process.env.EXPO_PUBLIC_API_URL
    );
    const staticSiteUrl = normalizeUrl(
      options?.overrides && 'siteUrl' in options.overrides
        ? options.overrides.siteUrl
        : process.env.EXPO_PUBLIC_SITE_URL
    );
    const missing: string[] = [];
    if (!staticApiUrl) missing.push('EXPO_PUBLIC_API_URL');
    if (!staticSiteUrl) missing.push('EXPO_PUBLIC_SITE_URL');

    const isNonProductionProfile =
      activeEnvironment !== 'production' ||
      process.env.EXPO_PUBLIC_DEFAULT_ENVIRONMENT === 'staging' ||
      isDevRuntime();

    if (missing.length > 0 && isNonProductionProfile && !(allowTestBypass && isJestRunner)) {
      throw new Error(
        `[Env] Missing required build-time environment variable(s): ${missing.join(', ')}. ` +
          'Define them via .env.<profile> or eas.json env blocks before building.'
      );
    }

    return {
      apiUrl: this.API_URL,
      siteUrl: this.SITE_URL,
      environment: activeEnvironment,
    };
  },

  /**
   * Initialize environment config and restore persisted preference (dev builds only).
   * Production builds always use their build-time environment and ignore any persisted staging selection.
   */
  async init(): Promise<ApiEnvironment> {
    if (isInitialized) return activeEnvironment;

    // Re-evaluate build-time environment and validate required vars in non-production profiles
    activeEnvironment = determineInitialEnvironment();
    hasExplicitUserSelection = false;
    this.assertRequiredVars();

    if (this.canSwitchEnvironment) {
      try {
        if (AsyncStorage && typeof AsyncStorage.getItem === 'function') {
          const stored = await AsyncStorage.getItem(ACTIVE_ENV_STORAGE_KEY);
          if (stored === 'production' || stored === 'staging') {
            activeEnvironment = stored;
            hasExplicitUserSelection = true;
          }
        }
      } catch {
        // Keep build-time initial environment when storage is unavailable
      }
    } else {
      // Production/release builds: clear any legacy persisted env override so users cannot stay pinned to staging
      try {
        if (AsyncStorage && typeof AsyncStorage.removeItem === 'function') {
          await AsyncStorage.removeItem(ACTIVE_ENV_STORAGE_KEY);
        }
      } catch {}
    }

    isInitialized = true;

    if (this.DEBUG_API || activeEnvironment !== 'production') {
      console.log(
        `[Env] Startup initialized: env=${activeEnvironment}, API_URL=${this.API_URL}, SITE_URL=${this.SITE_URL}`
      );
    }

    return activeEnvironment;
  },

  /**
   * Dynamically switch server environment at runtime (development builds only).
   */
  async setEnvironment(newEnv: ApiEnvironment): Promise<void> {
    if (!this.canSwitchEnvironment) {
      return;
    }
    if (newEnv !== 'production' && newEnv !== 'staging') return;
    activeEnvironment = newEnv;
    hasExplicitUserSelection = true;

    try {
      if (AsyncStorage && typeof AsyncStorage.setItem === 'function') {
        await AsyncStorage.setItem(ACTIVE_ENV_STORAGE_KEY, newEnv);
      }
    } catch {}

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
   * Toggle between production and staging (development builds only).
   */
  async toggleEnvironment(): Promise<ApiEnvironment> {
    if (!this.canSwitchEnvironment) {
      return activeEnvironment;
    }
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
   */
  get API_URL(): string {
    if (hasExplicitUserSelection) {
      return ENVIRONMENTS[activeEnvironment].apiUrl;
    }
    const explicit = normalizeUrl(process.env.EXPO_PUBLIC_API_URL);
    if (explicit) return explicit;
    return ENVIRONMENTS[activeEnvironment].apiUrl;
  },

  /**
   * Main Website URL
   */
  get SITE_URL(): string {
    if (hasExplicitUserSelection) {
      return ENVIRONMENTS[activeEnvironment].siteUrl;
    }
    const explicit = normalizeUrl(process.env.EXPO_PUBLIC_SITE_URL);
    if (explicit) return explicit;
    return ENVIRONMENTS[activeEnvironment].siteUrl;
  },

  /**
   * WordPress Admin Console URL
   */
  get WP_ADMIN_URL(): string {
    if (!hasExplicitUserSelection) {
      const explicit = process.env.EXPO_PUBLIC_WP_ADMIN_URL?.trim();
      if (explicit) return explicit;
    }
    return ENVIRONMENTS[activeEnvironment].wpAdminUrl;
  },

  /**
   * Google Play Mandatory Account & Data Deletion Public URL
   */
  get ACCOUNT_DELETION_URL(): string {
    return `${this.SITE_URL}/delete-account/`;
  },

  /**
   * Request Timeout in milliseconds
   */
  get REQUEST_TIMEOUT_MS(): number {
    const raw = process.env.EXPO_PUBLIC_REQUEST_TIMEOUT_MS;
    const timeout = Number(raw);
    return !isNaN(timeout) && timeout > 0 ? timeout : 15000;
  },

  /**
   * Maximum automatic retries for idempotent requests on network failure
   */
  get MAX_RETRIES(): number {
    const raw = process.env.EXPO_PUBLIC_MAX_RETRIES;
    const retries = Number(raw);
    return !isNaN(retries) && retries >= 0 ? retries : 2;
  },

  /**
   * Cache Time-To-Live in milliseconds
   */
  get CACHE_TTL_MS(): number {
    const raw = process.env.EXPO_PUBLIC_CACHE_TTL_MS;
    const ttl = Number(raw);
    return !isNaN(ttl) && ttl > 0 ? ttl : 300000; // 5 minutes
  },

  /**
   * Whether to fallback to alternate host or local seed data if network is unavailable
   */
  get ENABLE_FALLBACK(): boolean {
    const raw = process.env.EXPO_PUBLIC_ENABLE_FALLBACK;
    if (raw !== undefined) {
      return raw === 'true';
    }
    return true;
  },

  /**
   * Whether to output detailed API request/response logs in console
   */
  get DEBUG_API(): boolean {
    const raw = process.env.EXPO_PUBLIC_DEBUG_API;
    if (raw !== undefined) {
      return raw === 'true';
    }
    return isDevRuntime();
  },
};
