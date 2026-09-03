declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_API_URL?: string;
      EXPO_PUBLIC_SITE_URL?: string;
      EXPO_PUBLIC_REQUEST_TIMEOUT_MS?: string;
      EXPO_PUBLIC_MAX_RETRIES?: string;
      EXPO_PUBLIC_CACHE_TTL_MS?: string;
      EXPO_PUBLIC_ENABLE_FALLBACK?: string;
      EXPO_PUBLIC_DEBUG_API?: string;
      EXPO_PUBLIC_WC_CONSUMER_KEY?: string;
      EXPO_PUBLIC_WC_CONSUMER_SECRET?: string;
    }
  }
}

export {};
