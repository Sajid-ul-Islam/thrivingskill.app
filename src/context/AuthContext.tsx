import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WpUser } from '../types';
import { UserProfile, UserService } from '../services/api/userService';
import { HttpClient } from '../services/api/httpClient';
import { CacheManager } from '../services/cache/cacheManager';
import {
  loginWpUser,
  registerWpUser,
  sendWpPhoneOtp,
  verifyWpPhoneOtp,
  confirmWpPasswordReset,
} from '../services/wordpressApi';

export type { UserProfile };

const AUTH_USER_STORAGE_KEY = '@thrivingskill_auth_user';
const AUTH_TOKEN_STORAGE_KEY = '@thrivingskill_auth_token';
const AUTH_ADMIN_BYPASS_KEY = '@thrivingskill_admin_bypass';

/**
 * Strict administrator check based only on verified WordPress server roles.
 */
export function isUserAdmin(user: UserProfile | WpUser | null | undefined): boolean {
  if (!user) return false;
  const adminRoles = new Set(['administrator', 'admin', 'editor', 'instructor']);
  if (Array.isArray(user.roles)) {
    if (
      user.roles.some(
        (r) => typeof r === 'string' && adminRoles.has(r.toLowerCase().trim())
      )
    ) {
      return true;
    }
  }
  if (typeof (user as any).role === 'string') {
    const r = (user as any).role.toLowerCase().trim();
    if (adminRoles.has(r)) return true;
  }
  return false;
}

const isDevMode = typeof __DEV__ !== 'undefined' && __DEV__;

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isAdminBypass: boolean;
  toggleAdminBypass: () => Promise<boolean>;
  isLoading: boolean;
  isGuest: boolean;
  isAuthModalVisible: boolean;
  setAuthModalVisible: (visible: boolean) => void;
  login: (username: string, password: string) => Promise<void>;
  loginWithPhone: (phone: string, otp: string, fullName?: string) => Promise<void>;
  sendPhoneOtp: (phone: string) => Promise<{ success: boolean; message: string; testOtp?: string }>;
  register: (username: string, email: string, password: string, phone?: string) => Promise<void>;
  confirmPasswordReset: (login: string, key: string, newPassword: string) => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  continueAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [isAuthModalVisible, setAuthModalVisible] = useState<boolean>(false);
  const [isAdminBypass, setIsAdminBypass] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      try {
        const [savedUser, savedToken, savedBypass] = await Promise.all([
          AsyncStorage.getItem(AUTH_USER_STORAGE_KEY),
          AsyncStorage.getItem(AUTH_TOKEN_STORAGE_KEY),
          AsyncStorage.getItem(AUTH_ADMIN_BYPASS_KEY),
        ]);

        if (isDevMode && savedBypass === 'true') {
          setIsAdminBypass(true);
        } else if (!isDevMode && savedBypass) {
          await AsyncStorage.removeItem(AUTH_ADMIN_BYPASS_KEY);
        }

        if (savedUser) {
          try {
            const parsedUser: UserProfile = JSON.parse(savedUser);
            if (parsedUser && (parsedUser.id || parsedUser.email || parsedUser.username)) {
              // Extract persistent session token or generate durable session id
              const activeToken = savedToken || parsedUser.token || `ts_session_${parsedUser.id}`;
              const userWithToken: UserProfile = {
                ...parsedUser,
                token: activeToken,
              };
              setUser(userWithToken);
              setToken(activeToken);
              HttpClient.setAuthToken(activeToken);
              setIsGuest(false);

              // Keep storage keys synchronized
              if (!savedToken) {
                await AsyncStorage.setItem(AUTH_TOKEN_STORAGE_KEY, activeToken);
              }
            } else {
              setIsGuest(false);
            }
          } catch (parseErr) {
            console.warn('Failed to parse saved auth user:', parseErr);
            setIsGuest(false);
          }
        } else {
          // Mandatory login required per client change request (no unauthenticated guest bypass)
          setIsGuest(false);
        }
      } catch (e) {
        console.warn('Failed to restore auth state:', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const toggleAdminBypass = async (): Promise<boolean> => {
    if (!isDevMode) {
      setIsAdminBypass(false);
      return false;
    }
    const nextVal = !isAdminBypass;
    setIsAdminBypass(nextVal);
    try {
      await AsyncStorage.setItem(AUTH_ADMIN_BYPASS_KEY, String(nextVal));
    } catch (e) {
      console.warn('Failed to persist admin bypass state:', e);
    }
    return nextVal;
  };

  const isAdmin = (isDevMode && isAdminBypass) || isUserAdmin(user);

  const saveUserSession = async (loggedInUser: WpUser | UserProfile) => {
    const userToken = loggedInUser.token || `ts_session_${loggedInUser.id || Date.now()}`;
    const userWithToken: UserProfile = {
      ...(loggedInUser as UserProfile),
      token: userToken,
    };
    setUser(userWithToken);
    setToken(userToken);
    HttpClient.setAuthToken(userToken);
    setIsGuest(false);
    setAuthModalVisible(false);

    try {
      await Promise.all([
        AsyncStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(userWithToken)),
        AsyncStorage.setItem(AUTH_TOKEN_STORAGE_KEY, userToken),
      ]);
    } catch (e) {
      console.warn('Failed to persist user session:', e);
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>): Promise<void> => {
    if (!user) return;
    const updatedUser: UserProfile = {
      ...user,
      ...updates,
      displayName: updates.name || updates.displayName || user.displayName,
      name: updates.name !== undefined ? updates.name : (user.name || user.displayName),
    };
    setUser(updatedUser);
    try {
      await AsyncStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(updatedUser));
    } catch (e) {
      console.warn('Failed to persist user profile update:', e);
    }
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

  const loginWithPhone = async (phone: string, otp: string, fullName?: string) => {
    setIsLoading(true);
    try {
      const loggedInUser = await verifyWpPhoneOtp(phone, otp, fullName);
      await saveUserSession(loggedInUser);
    } finally {
      setIsLoading(false);
    }
  };

  const sendPhoneOtp = async (phone: string) => {
    return sendWpPhoneOtp(phone);
  };

  const register = async (username: string, email: string, password: string, phone?: string) => {
    setIsLoading(true);
    try {
      await registerWpUser({ username, email, password, confirm_password: password, phone });
      // Immediately log in new user
      await login(username, password);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmPasswordReset = async (loginParam: string, key: string, newPassword: string) => {
    setIsLoading(true);
    try {
      await confirmWpPasswordReset(loginParam, key, newPassword);
      // Immediately log in user with verified credentials
      await login(loginParam, newPassword);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    setIsGuest(true);
    setIsAdminBypass(false);
    HttpClient.setAuthToken(null);
    try {
      await Promise.all([
        AsyncStorage.removeItem(AUTH_USER_STORAGE_KEY),
        AsyncStorage.removeItem(AUTH_TOKEN_STORAGE_KEY),
        AsyncStorage.removeItem(AUTH_ADMIN_BYPASS_KEY),
        CacheManager.clearAll(),
      ]);
    } catch {}
  };

  const deleteAccount = async (password: string): Promise<void> => {
    if (!user || !token) {
      throw new Error('You must be signed in to delete your account.');
    }
    const uid = user.id;
    await UserService.deleteAccount(uid, password);
    setIsAdminBypass(false);
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const userScopedKeys = allKeys.filter((k) => k.includes(`_u_${uid}`));
      await Promise.all([
        AsyncStorage.removeItem(AUTH_ADMIN_BYPASS_KEY),
        userScopedKeys.length > 0 ? AsyncStorage.multiRemove(userScopedKeys) : Promise.resolve(),
      ]);
    } catch {}
    await logout();
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
        isAuthenticated: !!user,
        isAdmin,
        isAdminBypass: isDevMode ? isAdminBypass : false,
        toggleAdminBypass,
        isLoading,
        isGuest,
        isAuthModalVisible,
        setAuthModalVisible,
        login,
        loginWithPhone,
        sendPhoneOtp,
        register,
        confirmPasswordReset,
        updateUserProfile,
        logout,
        deleteAccount,
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
