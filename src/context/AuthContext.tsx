import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WpUser } from '../types';
import { UserProfile, UserService } from '../services/api/userService';
import { HttpClient } from '../services/api/httpClient';
import {
  AuthService,
  isValidSessionTokenFormat,
  isJwtTokenExpired,
} from '../services/api/authService';
import { Endpoints } from '../services/api/endpoints';
import { SyncQueueManager } from '../services/offline/syncQueue';
import { SecureStorageService } from '../services/storage/secureStorage';
import { useFeedback } from './FeedbackContext';
import {
  loginWpUser,
  registerWpUser,
  verifyWpRegistrationOtp,
  sendWpPhoneOtp,
  verifyWpPhoneOtp,
  confirmWpPasswordReset,
} from '../services/wordpressApi';

export type { UserProfile };

const AUTH_USER_STORAGE_KEY = '@thrivingskill_auth_user';
const AUTH_TOKEN_STORAGE_KEY = '@thrivingskill_auth_token';
const AUTH_ADMIN_BYPASS_KEY = '@thrivingskill_admin_bypass';
const ALT_ADMIN_BYPASS_KEY = '@ts_auth_admin_bypass';
const AUTH_DEV_MODE_KEY = '@ts_dev_mode_unlocked';

/**
 * Strict administrator check based only on verified WordPress server roles.
 */
export function isUserAdmin(user: UserProfile | WpUser | null | undefined): boolean {
  if (!user) return false;
  const adminRoles = new Set(['administrator', 'admin', 'editor', 'instructor']);
  if (Array.isArray(user.roles)) {
    if (user.roles.some((r) => typeof r === 'string' && adminRoles.has(r.toLowerCase().trim()))) {
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
  isDevMode: boolean;
  canBypassCourseLocks: boolean;
  isLoading: boolean;
  isGuest: boolean;
  isAuthModalVisible: boolean;
  setAuthModalVisible: (visible: boolean) => void;
  sessionExpiredNotice: boolean;
  clearSessionExpiredNotice: () => void;
  login: (username: string, password: string, dismissModal?: boolean) => Promise<void>;
  loginWithPhone: (phone: string, otp: string, fullName?: string) => Promise<void>;
  sendPhoneOtp: (phone: string) => Promise<{ success: boolean; message: string; testOtp?: string }>;
  register: (
    username: string,
    email: string,
    password: string,
    phone?: string,
    fullName?: string
  ) => Promise<{
    success: boolean;
    emailSent: boolean;
    requiresVerification?: boolean;
    autoLoggedIn: boolean;
    message?: string;
    devVerificationOtp?: string;
  } | void>;
  verifyRegistrationOtp: (email: string, otp: string) => Promise<void>;
  confirmPasswordReset: (login: string, key: string, newPassword: string) => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>, syncToServer?: boolean) => Promise<void>;
  refreshUserProfile: () => Promise<UserProfile | null>;
  isSyncingProfile: boolean;
  logout: () => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  continueAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const feedback = useFeedback();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [isAuthModalVisible, setAuthModalVisible] = useState<boolean>(false);
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState<boolean>(false);
  const activeSessionRef = useRef<boolean>(false);
  const isHandlingUnauthorizedRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);

  const clearSessionExpiredNotice = useCallback(() => {
    setSessionExpiredNotice(false);
  }, []);

  const clearPersistedSession = useCallback(async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(AUTH_USER_STORAGE_KEY),
        AsyncStorage.removeItem(AUTH_TOKEN_STORAGE_KEY),
        SecureStorageService.removeAuthToken(),
        AsyncStorage.removeItem(AUTH_ADMIN_BYPASS_KEY),
        AsyncStorage.removeItem(ALT_ADMIN_BYPASS_KEY),
      ]);
    } catch {}
  }, []);

  const clearSessionAndPromptLogin = useCallback(
    async (showExpiredFeedback: boolean = true) => {
      activeSessionRef.current = false;
      HttpClient.setAuthToken(null);
      if (isMountedRef.current) {
        setUser(null);
        setToken(null);
        setIsGuest(false);
        if (showExpiredFeedback) {
          setSessionExpiredNotice(true);
        }
        setAuthModalVisible(true);
      }
      await clearPersistedSession();
      if (showExpiredFeedback) {
        feedback?.showToast?.({
          message: 'Your session expired. Please sign in again.',
          type: 'warning',
        });
      }
    },
    [clearPersistedSession, feedback]
  );

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    HttpClient.setUnauthorizedListener(() => {
      if (isHandlingUnauthorizedRef.current || !activeSessionRef.current) {
        return;
      }
      isHandlingUnauthorizedRef.current = true;
      clearSessionAndPromptLogin(true).finally(() => {
        isHandlingUnauthorizedRef.current = false;
      });
    });

    return () => {
      HttpClient.setUnauthorizedListener(null);
    };
  }, [clearSessionAndPromptLogin]);

  useEffect(() => {
    (async () => {
      try {
        const [savedUser, secureToken] = await Promise.all([
          AsyncStorage.getItem(AUTH_USER_STORAGE_KEY),
          SecureStorageService.getAuthToken(),
        ]);

        // Clean up any legacy dev/bypass flags from AsyncStorage
        AsyncStorage.multiRemove([
          AUTH_ADMIN_BYPASS_KEY,
          ALT_ADMIN_BYPASS_KEY,
          AUTH_DEV_MODE_KEY,
        ]).catch(() => {});

        if (savedUser) {
          let parsedUser: UserProfile | null = null;
          try {
            parsedUser = JSON.parse(savedUser);
          } catch (parseErr) {
            console.warn('Failed to parse saved auth user:', parseErr);
            await clearPersistedSession();
          }

          if (parsedUser && (parsedUser.id || parsedUser.email || parsedUser.username)) {
            // Sanitize legacy mock avatar from local storage
            if (
              parsedUser.avatar &&
              (parsedUser.avatar.includes('unsplash.com') ||
                parsedUser.avatar.includes('randomuser.me') ||
                parsedUser.avatar.includes('i.pravatar.cc') ||
                parsedUser.avatar.includes('mock'))
            ) {
              parsedUser.avatar = '';
            }

            const candidateToken = isValidSessionTokenFormat(secureToken)
              ? secureToken
              : isValidSessionTokenFormat(parsedUser.token)
                ? parsedUser.token
                : null;

            if (!candidateToken) {
              // No real token (e.g. missing SecureStore or legacy `ts_session_` placeholder): force re-login.
              await clearSessionAndPromptLogin(true);
              return;
            }

            const validationStatus = await AuthService.verifySession(candidateToken);
            if (!isMountedRef.current) return;

            if (validationStatus === 'invalid') {
              await clearSessionAndPromptLogin(true);
              return;
            }

            const { token: _omitToken, ...userWithoutToken } = parsedUser;
            const restoredUser: UserProfile = {
              ...userWithoutToken,
              token: candidateToken,
            };

            activeSessionRef.current = true;
            HttpClient.setAuthToken(candidateToken);
            setUser(restoredUser);
            setToken(candidateToken);
            setSessionExpiredNotice(false);
            setIsGuest(false);

            // Ensure hardware-backed SecureStore holds the validated token and purge plaintext copy
            if (!secureToken) {
              await SecureStorageService.setAuthToken(candidateToken);
            }
            if (parsedUser.token) {
              AsyncStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(userWithoutToken)).catch(
                () => {}
              );
            }

            if (validationStatus === 'valid') {
              refreshUserProfile().catch(() => {});
            }
          } else if (parsedUser) {
            await clearPersistedSession();
          }
        } else {
          if (secureToken) {
            await SecureStorageService.removeAuthToken();
          }
          // Mandatory login required per client change request (no unauthenticated guest bypass)
          setIsGuest(false);
        }
      } catch (e) {
        console.warn('Failed to restore auth state:', e);
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    })();
  }, [clearPersistedSession, clearSessionAndPromptLogin]);

  const isAdmin = isUserAdmin(user);
  const canBypassCourseLocks = isAdmin || isDevMode;

  const saveUserSession = async (
    loggedInUser: WpUser | UserProfile,
    dismissModal: boolean = true
  ) => {
    const userToken = loggedInUser.token;
    if (!isValidSessionTokenFormat(userToken)) {
      throw new Error('Authentication did not return a valid session token.');
    }
    const { token: _omitToken, ...userWithoutToken } = loggedInUser as UserProfile;
    const userWithToken: UserProfile = {
      ...userWithoutToken,
      token: userToken,
    };
    activeSessionRef.current = true;
    isHandlingUnauthorizedRef.current = false;
    setSessionExpiredNotice(false);
    HttpClient.setAuthToken(userToken);
    setToken(userToken);
    setUser(userWithToken);
    setIsGuest(false);
    if (dismissModal) {
      setAuthModalVisible(false);
    }

    try {
      await Promise.all([
        AsyncStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(userWithoutToken)),
        SecureStorageService.setAuthToken(userToken),
      ]);
    } catch (e) {
      console.warn('Failed to persist user session:', e);
    }
  };

  const [isSyncingProfile, setIsSyncingProfile] = useState<boolean>(false);

  /**
   * Refreshes user profile from https://thrivingskill.com/wp-json/wp/v2/users/me
   * Auto-syncs any updates customer made on the actual website into the app
   */
  const refreshUserProfile = async (): Promise<UserProfile | null> => {
    const currentToken = token || (await SecureStorageService.getAuthToken());
    if (!isValidSessionTokenFormat(currentToken)) return null;
    if (isJwtTokenExpired(currentToken)) {
      await clearSessionAndPromptLogin(true);
      return null;
    }

    setIsSyncingProfile(true);
    try {
      const serverUser = await UserService.getCurrentUser();
      if (serverUser) {
        const mergedUser: UserProfile = {
          ...user,
          ...serverUser,
          phone: serverUser.phone || user?.phone || '',
          city: serverUser.city || user?.city || '',
          description: serverUser.description || user?.description || '',
          avatar: serverUser.avatar || user?.avatar || '',
          cover_photo: serverUser.cover_photo || user?.cover_photo || '',
          social: serverUser.social || user?.social,
          token: currentToken,
        };
        const { token: _omitToken, ...mergedUserWithoutToken } = mergedUser;
        setUser(mergedUser);
        await AsyncStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(mergedUserWithoutToken));
        return mergedUser;
      }
    } catch {
      // Graceful offline catch
    } finally {
      if (isMountedRef.current) {
        setIsSyncingProfile(false);
      }
    }
    return null;
  };

  // Auto-sync profile from site when app returns to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && user) {
        refreshUserProfile().catch(() => {});
      }
    });
    return () => sub.remove();
  }, [user]);

  /**
   * Updates user profile in app and automatically synchronizes to live website
   */
  const updateUserProfile = async (
    updates: Partial<UserProfile>,
    syncToServer: boolean = true
  ): Promise<void> => {
    if (!user) return;
    const updatedUser: UserProfile = {
      ...user,
      ...updates,
      displayName: updates.name || updates.displayName || user.displayName,
      name: updates.name !== undefined ? updates.name : user.name || user.displayName,
    };
    const { token: _omitUpdatedToken, ...updatedToPersist } = updatedUser;
    setUser(updatedUser);

    try {
      await AsyncStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(updatedToPersist));
    } catch (e) {
      console.warn('Failed to persist user profile update:', e);
    }

    if (syncToServer && token) {
      try {
        const serverUser = await UserService.updateProfile({
          name: updatedUser.name || updatedUser.displayName,
          first_name: updatedUser.first_name,
          last_name: updatedUser.last_name,
          description: updatedUser.description,
          phone: updatedUser.phone,
          city: updatedUser.city,
          avatar: updatedUser.avatar,
          cover_photo: updatedUser.cover_photo,
          social: updatedUser.social,
        });
        if (serverUser) {
          const syncedUser: UserProfile = {
            ...serverUser,
            token,
          };
          const { token: _omitSyncedToken, ...syncedToPersist } = syncedUser;
          setUser(syncedUser);
          await AsyncStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(syncedToPersist));
        }
      } catch (err) {
        // Enqueue offline sync if network is down
        try {
          await SyncQueueManager.enqueue(
            'UPDATE_PROFILE',
            Endpoints.WORDPRESS.CURRENT_USER,
            {
              name: updatedUser.name || updatedUser.displayName,
              first_name: updatedUser.first_name,
              last_name: updatedUser.last_name,
              description: updatedUser.description,
              meta: {
                phone: updatedUser.phone,
                city: updatedUser.city,
                avatar_url: updatedUser.avatar,
                cover_photo: updatedUser.cover_photo,
              },
            },
            'POST'
          );
        } catch {}
      }
    }
  };

  const login = async (username: string, password: string, dismissModal: boolean = true) => {
    setIsLoading(true);
    try {
      const loggedInUser = await loginWpUser(username, password);
      await saveUserSession(loggedInUser, dismissModal);
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

  const register = async (
    username: string,
    email: string,
    password: string,
    phone?: string,
    fullName?: string
  ): Promise<{
    success: boolean;
    emailSent: boolean;
    requiresVerification?: boolean;
    autoLoggedIn: boolean;
    message?: string;
    devVerificationOtp?: string;
  }> => {
    setIsLoading(true);
    try {
      const regRes = await registerWpUser({
        username,
        email,
        password,
        confirm_password: password,
        phone,
        name: fullName,
      });

      if (regRes?.requires_verification || regRes?.status === 'verification_required') {
        return {
          success: true,
          emailSent: true,
          requiresVerification: true,
          autoLoggedIn: false,
          message: typeof regRes.message === 'string' ? regRes.message : undefined,
          devVerificationOtp:
            isDevMode && typeof regRes.dev_verification_otp === 'string'
              ? regRes.dev_verification_otp
              : undefined,
        };
      }

      let autoLoggedIn = false;
      // Fallback for legacy endpoints without OTP pre-verification
      try {
        await login(username, password, false);
        autoLoggedIn = true;
        if (fullName || phone) {
          await updateUserProfile(
            {
              name: fullName || undefined,
              phone: phone || undefined,
            },
            false
          );
        }
      } catch (loginErr) {
        console.warn('Auto-login deferred after registration:', loginErr);
      }

      return {
        success: true,
        emailSent: true,
        requiresVerification: false,
        autoLoggedIn,
      };
    } finally {
      setIsLoading(false);
    }
  };

  const verifyRegistrationOtp = async (email: string, otp: string): Promise<void> => {
    setIsLoading(true);
    try {
      const res = await verifyWpRegistrationOtp(email, otp);
      const verifiedUser: WpUser = {
        id: res.user_id || 0,
        username: res.username || email.split('@')[0],
        email: res.email || email,
        displayName: res.user_display_name || res.username || email.split('@')[0],
        token: res.token,
        roles: ['subscriber'],
      };
      await saveUserSession(verifiedUser, true);
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
    const currentToken = token || (await SecureStorageService.getAuthToken());
    activeSessionRef.current = false;
    isHandlingUnauthorizedRef.current = false;
    setSessionExpiredNotice(false);
    HttpClient.setAuthToken(null);
    setToken(null);
    setUser(null);
    setIsGuest(true);
    if (isValidSessionTokenFormat(currentToken)) {
      void AuthService.revokeToken(currentToken);
    }
    await clearPersistedSession();
  };

  const deleteAccount = async (password: string): Promise<void> => {
    if (!user || !token) {
      throw new Error('You must be signed in to delete your account.');
    }
    const uid = user.id;
    await UserService.deleteAccount(uid, password);
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const userScopedKeys = allKeys.filter((k) => k.includes(`_u_${uid}`));
      await (userScopedKeys.length > 0 ? AsyncStorage.multiRemove(userScopedKeys) : Promise.resolve());
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
        isDevMode,
        canBypassCourseLocks,
        isLoading,
        isGuest,
        isAuthModalVisible,
        setAuthModalVisible,
        sessionExpiredNotice,
        clearSessionExpiredNotice,
        login,
        loginWithPhone,
        sendPhoneOtp,
        register,
        verifyRegistrationOtp,
        confirmPasswordReset,
        updateUserProfile,
        refreshUserProfile,
        isSyncingProfile,
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
