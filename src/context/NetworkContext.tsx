import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { HttpClient } from '../services/api/httpClient';
import { Env } from '../config/env';

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

  useEffect(() => {
    isMountedRef.current = true;
    HttpClient.setConnectivityListener((online, errorMsg) => {
      if (!isMountedRef.current) return;
      setIsOffline(!online);
      setLastErrorMessage(online ? null : errorMsg || null);
    });

    return () => {
      isMountedRef.current = false;
      HttpClient.setConnectivityListener(null);
    };
  }, []);

  const checkReachability = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && !navigator.onLine) {
      if (isMountedRef.current) {
        setIsOffline(true);
        setLastErrorMessage('You appear to be offline.');
      }
      return false;
    }

    if (isMountedRef.current) setIsChecking(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(`${Env.API_URL}/wp/v2/types`, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timer);
      const ok = response.status > 0;
      if (isMountedRef.current) {
        setIsOffline(!ok);
        if (ok) setLastErrorMessage(null);
      }
      return ok;
    } catch {
      clearTimeout(timer);
      if (isMountedRef.current) {
        setIsOffline(true);
        setLastErrorMessage('Unable to reach Thriving Skills servers.');
      }
      return false;
    } finally {
      if (isMountedRef.current) setIsChecking(false);
    }
  }, []);

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
