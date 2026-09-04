import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WpUser } from '../types';
import {
  loginWpUser,
  loginWpGoogle,
  loginWpFacebook,
  registerWpUser,
  validateWpToken,
} from '../services/wordpressApi';

const AUTH_USER_STORAGE_KEY = '@thrivingskill_auth_user';
const AUTH_TOKEN_STORAGE_KEY = '@thrivingskill_auth_token';

interface AuthContextType {
  user: WpUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isGuest: boolean;
  isAuthModalVisible: boolean;
  setAuthModalVisible: (visible: boolean) => void;
  login: (username: string, password: string) => Promise<void>;
  loginWithGoogle: (email?: string, name?: string) => Promise<void>;
  loginWithFacebook: (email?: string, name?: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  continueAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<WpUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGuest, setIsGuest] = useState<boolean>(true);
  const [isAuthModalVisible, setAuthModalVisible] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      try {
        const [savedUser, savedToken] = await Promise.all([
          AsyncStorage.getItem(AUTH_USER_STORAGE_KEY),
          AsyncStorage.getItem(AUTH_TOKEN_STORAGE_KEY),
        ]);

        if (savedUser && savedToken) {
          const parsedUser: WpUser = JSON.parse(savedUser);
          setUser(parsedUser);
          setToken(savedToken);
          setIsGuest(false);

          // Verify token in background
          validateWpToken(savedToken).then((isValid) => {
            if (!isValid) {
              console.log('Stored token has expired or is invalid.');
            }
          });
        } else {
          // Default to guest mode
          setIsGuest(true);
        }
      } catch (e) {
        console.warn('Failed to restore auth state:', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const saveUserSession = async (loggedInUser: WpUser) => {
    setUser(loggedInUser);
    setToken(loggedInUser.token || null);
    setIsGuest(false);
    setAuthModalVisible(false);

    await Promise.all([
      AsyncStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(loggedInUser)),
      loggedInUser.token
        ? AsyncStorage.setItem(AUTH_TOKEN_STORAGE_KEY, loggedInUser.token)
        : Promise.resolve(),
    ]);
  };

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const loggedInUser = await loginWpUser(username, password);
      await saveUserSession(loggedInUser);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (email?: string, name?: string) => {
    setIsLoading(true);
    try {
      const loggedInUser = await loginWpGoogle(email, name);
      await saveUserSession(loggedInUser);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithFacebook = async (email?: string, name?: string) => {
    setIsLoading(true);
    try {
      const loggedInUser = await loginWpFacebook(email, name);
      await saveUserSession(loggedInUser);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      await registerWpUser({ username, email, password });
      // Immediately log in new user
      await login(username, password);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    setIsGuest(true);
    try {
      await Promise.all([
        AsyncStorage.removeItem(AUTH_USER_STORAGE_KEY),
        AsyncStorage.removeItem(AUTH_TOKEN_STORAGE_KEY),
      ]);
    } catch {}
  };

  const continueAsGuest = () => {
    setIsGuest(true);
    setAuthModalVisible(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        isGuest,
        isAuthModalVisible,
        setAuthModalVisible,
        login,
        loginWithGoogle,
        loginWithFacebook,
        register,
        logout,
        continueAsGuest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
