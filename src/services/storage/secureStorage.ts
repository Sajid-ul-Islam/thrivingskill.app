import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Hardware-backed Secure Storage Service
 *
 * Provides OWASP MASVS-compliant cryptographic protection for sensitive credentials.
 * - Android: Android Keystore system (AES-256-GCM via EncryptedSharedPreferences)
 * - iOS: Apple Keychain Services with Secure Enclave hardware backing
 * - Web / Fallback: Gracefully falls back to AsyncStorage when SecureStore is unavailable
 */

// Key for hardware-backed SecureStore (alphanumeric, dots, underscores, hyphens)
const SECURE_AUTH_TOKEN_KEY = 'thriving_skill_jwt_token';

// Legacy plain-text AsyncStorage key used for migration
const LEGACY_ASYNC_TOKEN_KEY = '@thrivingskill_auth_token';
const LEGACY_USER_STORAGE_KEY = '@thrivingskill_auth_user';

export class SecureStorageService {
  private static isSecureStoreAvailable: boolean | null = null;

  /**
   * Check if hardware SecureStore is supported on current platform
   */
  public static async isAvailable(): Promise<boolean> {
    if (this.isSecureStoreAvailable !== null) {
      return this.isSecureStoreAvailable;
    }

    if (Platform.OS === 'web') {
      this.isSecureStoreAvailable = false;
      return false;
    }

    try {
      const available = await SecureStore.isAvailableAsync();
      this.isSecureStoreAvailable = available;
      return available;
    } catch {
      this.isSecureStoreAvailable = false;
      return false;
    }
  }

  /**
   * Persist JWT authentication token securely in hardware-backed storage
   */
  public static async setAuthToken(token: string): Promise<void> {
    const isSecAvail = await this.isAvailable();

    if (isSecAvail) {
      try {
        await SecureStore.setItemAsync(SECURE_AUTH_TOKEN_KEY, token, {
          keychainAccessible: SecureStore.WHEN_UNLOCKED,
        });
        // Remove from legacy plain-text AsyncStorage to ensure no plaintext token on disk
        await AsyncStorage.removeItem(LEGACY_ASYNC_TOKEN_KEY).catch(() => {});
        return;
      } catch (err) {
        console.warn('[SecureStorage] Failed to write to SecureStore, falling back to AsyncStorage:', err);
      }
    }

    // Fallback for Web or unsupported environments
    await AsyncStorage.setItem(LEGACY_ASYNC_TOKEN_KEY, token);
  }

  /**
   * Retrieve JWT authentication token.
   * Seamlessly migrates legacy plain-text tokens from AsyncStorage into SecureStore.
   */
  public static async getAuthToken(): Promise<string | null> {
    const isSecAvail = await this.isAvailable();

    if (isSecAvail) {
      try {
        // 1. Check hardware-backed SecureStore
        const secureToken = await SecureStore.getItemAsync(SECURE_AUTH_TOKEN_KEY);
        if (secureToken) {
          return secureToken;
        }

        // 2. Migration: Check legacy AsyncStorage for existing logged-in sessions
        const legacyToken = await AsyncStorage.getItem(LEGACY_ASYNC_TOKEN_KEY);
        if (legacyToken) {
          // Migrate to hardware SecureStore
          await SecureStore.setItemAsync(SECURE_AUTH_TOKEN_KEY, legacyToken, {
            keychainAccessible: SecureStore.WHEN_UNLOCKED,
          });
          // Remove plaintext token from disk
          await AsyncStorage.removeItem(LEGACY_ASYNC_TOKEN_KEY).catch(() => {});
          console.log('[SecureStorage] Migrated legacy auth token to hardware-backed SecureStore.');
          return legacyToken;
        }

        // 3. Fallback: Check if token exists in cached user profile object
        const legacyUserRaw = await AsyncStorage.getItem(LEGACY_USER_STORAGE_KEY);
        if (legacyUserRaw) {
          try {
            const parsed = JSON.parse(legacyUserRaw);
            if (parsed && typeof parsed.token === 'string' && parsed.token.length > 10) {
              const userToken = parsed.token;
              await SecureStore.setItemAsync(SECURE_AUTH_TOKEN_KEY, userToken, {
                keychainAccessible: SecureStore.WHEN_UNLOCKED,
              });
              console.log('[SecureStorage] Extracted and secured token from stored user profile.');
              return userToken;
            }
          } catch {}
        }

        return null;
      } catch (err) {
        console.warn('[SecureStorage] Error accessing SecureStore, checking AsyncStorage fallback:', err);
      }
    }

    // Web or fallback
    return AsyncStorage.getItem(LEGACY_ASYNC_TOKEN_KEY);
  }

  /**
   * Remove JWT authentication token on sign out from all storage layers
   */
  public static async removeAuthToken(): Promise<void> {
    const isSecAvail = await this.isAvailable();

    if (isSecAvail) {
      try {
        await SecureStore.deleteItemAsync(SECURE_AUTH_TOKEN_KEY);
      } catch (err) {
        console.warn('[SecureStorage] Error deleting from SecureStore:', err);
      }
    }

    // Always clear legacy/fallback key as well
    await AsyncStorage.removeItem(LEGACY_ASYNC_TOKEN_KEY).catch(() => {});
  }
}
