declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_API_URL?: string;
      EXPO_PUBLIC_SITE_URL?: string;
      EXPO_PUBLIC_WP_ADMIN_URL?: string;
      EXPO_PUBLIC_DEFAULT_ENVIRONMENT?: 'production' | 'staging' | string;
      EXPO_PUBLIC_FALLBACK_API_URL?: string;
      EXPO_PUBLIC_FALLBACK_SITE_URL?: string;
      EXPO_PUBLIC_REQUEST_TIMEOUT_MS?: string;
      EXPO_PUBLIC_MAX_RETRIES?: string;
      EXPO_PUBLIC_CACHE_TTL_MS?: string;
      EXPO_PUBLIC_ENABLE_FALLBACK?: string;
      EXPO_PUBLIC_DEBUG_API?: string;
    }
  }
}

export {};
