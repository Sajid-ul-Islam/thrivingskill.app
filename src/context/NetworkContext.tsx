import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { HttpClient } from '../services/api/httpClient';
import { Env } from '../config/env';
import { SyncQueueManager } from '../services/offline/syncQueue';

interface NetworkContextType {
  isOffline: boolean;
  isChecking: boolean;
  lastErrorMessage: string | null;
  retryConnection: (onRecovered?: () => Promise<void> | void) => Promise<boolean>;
  dismissOfflineBanner: () => void;
}

const NetworkContext = createContext<NetworkContextType>({
  isOffline: false,
  isChecking: false,
  lastErrorMessage: null,
  retryConnection: async () => true,
  dismissOfflineBanner: () => {},
});

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOffline, setIsOffline] = useState<boolean>(
    Platform.OS === 'web' && typeof navigator !== 'undefined' ? !navigator.onLine : false
  );
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [lastErrorMessage, setLastErrorMessage] = useState<string | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const reachabilityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const checkReachability = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && !navigator.onLine) {
      if (isMountedRef.current) {
        setIsOffline(true);
        setLastErrorMessage('You appear to be offline.');
      }
      return false;
    }

    if (isMountedRef.current) setIsChecking(true);

    if (reachabilityTimerRef.current) {
      clearTimeout(reachabilityTimerRef.current);
      reachabilityTimerRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    reachabilityTimerRef.current = setTimeout(() => {
      try {
        controller.abort();
      } catch {}
    }, 8000); // 8-second safety window for mobile 3G/4G connections

    try {
      // 1. Primary check: Root WP-JSON index (standard, fast discovery endpoint ~300ms vs 5200ms on /wp/v2/types)
      const response = await fetch(Env.API_URL, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'Cache-Control': 'no-cache',
        },
      });

      if (reachabilityTimerRef.current) {
        clearTimeout(reachabilityTimerRef.current);
        reachabilityTimerRef.current = null;
      }

      const ok = response.status >= 200 && response.status < 400;
      if (isMountedRef.current) {
        setIsOffline(!ok);
        if (ok) setLastErrorMessage(null);
      }
      return ok;
    } catch {
      if (reachabilityTimerRef.current) {
        clearTimeout(reachabilityTimerRef.current);
        reachabilityTimerRef.current = null;
      }

      // 2. Secondary fallback ping to SITE_URL before concluding complete offline state
      try {
        const fallbackController = new AbortController();
        const fallbackTimer: ReturnType<typeof setTimeout> = setTimeout(() => {
          try {
            fallbackController.abort();
          } catch {}
        }, 4000);

        const fallbackRes = await fetch(Env.SITE_URL, {
          method: 'HEAD',
          signal: fallbackController.signal,
        });
        clearTimeout(fallbackTimer);
        const fallbackOk = fallbackRes.status >= 200 && fallbackRes.status < 400;
        if (isMountedRef.current) {
          setIsOffline(!fallbackOk);
          if (fallbackOk) setLastErrorMessage(null);
        }
        return fallbackOk;
      } catch {
        // Both primary API and site root were unreachable
        if (isMountedRef.current) {
          setIsOffline(true);
          setLastErrorMessage('Unable to reach Thriving Skills servers.');
        }
        return false;
      }
    } finally {
      if (isMountedRef.current) setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    HttpClient.setConnectivityListener((online, errorMsg) => {
      if (!isMountedRef.current) return;
      if (online) {
        setIsOffline(false);
        setLastErrorMessage(null);
        // Silently drain offline mutation queue when network recovers
        SyncQueueManager.processQueue().catch(() => {});
      } else {
        // Double-check reachability before immediately locking into offline mode from transient errors
        checkReachability().then((reachable) => {
          if (!isMountedRef.current) return;
          if (!reachable) {
            setIsOffline(true);
            setLastErrorMessage(errorMsg || 'Limited connectivity.');
          }
        }).catch(() => {});
      }
    });

    return () => {
      isMountedRef.current = false;
      if (reachabilityTimerRef.current) {
        clearTimeout(reachabilityTimerRef.current);
        reachabilityTimerRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      HttpClient.setConnectivityListener(null);
    };
  }, [checkReachability]);

  // Re-check when browser comes back online or app returns to foreground while offline
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleOnline = () => {
        setIsOffline(false);
        setLastErrorMessage(null);
      };
      const handleOffline = () => {
        setIsOffline(true);
        setLastErrorMessage('No internet connection detected.');
      };
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active' && isOffline) {
        checkReachability().catch(() => {});
      }
    });
    return () => sub.remove();
  }, [isOffline, checkReachability]);

  const retryConnection = useCallback(
    async (onRecovered?: () => Promise<void> | void): Promise<boolean> => {
      const online = await checkReachability();
      if (online && onRecovered) {
        await onRecovered();
      }
      return online;
    },
    [checkReachability]
  );

  const dismissOfflineBanner = useCallback(() => {
    setIsOffline(false);
  }, []);

  return (
    <NetworkContext.Provider
      value={{
        isOffline,
        isChecking,
        lastErrorMessage,
        retryConnection,
        dismissOfflineBanner,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => useContext(NetworkContext);
