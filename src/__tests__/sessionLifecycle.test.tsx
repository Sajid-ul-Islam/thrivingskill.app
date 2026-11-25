import React from 'react';

declare const Buffer: any;
import { Text, TouchableOpacity, View } from 'react-native';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Env } from '../config/env';
import { HttpClient } from '../services/api/httpClient';
import { SecureStorageService } from '../services/storage/secureStorage';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { FeedbackProvider } from '../context/FeedbackContext';

jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    isAvailableAsync: jest.fn(async () => true),
    getItemAsync: jest.fn(async (key: string) => (store.has(key) ? store.get(key)! : null)),
    setItemAsync: jest.fn(async (key: string, val: string) => {
      store.set(key, String(val));
    }),
    deleteItemAsync: jest.fn(async (key: string) => {
      store.delete(key);
    }),
    __clear: () => store.clear(),
    __peek: (key: string) => store.get(key) ?? null,
  };
});

function makeJsonResponse(data: any, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (k: string) => (k.toLowerCase() === 'content-type' ? 'application/json' : null),
      forEach: () => {},
    },
    json: async () => data,
    text: async () => JSON.stringify(data),
  };
}

function makeSignedMockJwt(payload: Record<string, any>): string {
  const encode = (obj: Record<string, any>) =>
    btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.sig123`;
}

function safeParseUserJson(raw: string | null): Record<string, any> {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

const AuthHarness: React.FC = () => {
  const {
    isLoading,
    isAuthenticated,
    user,
    token,
    isAuthModalVisible,
    sessionExpiredNotice,
    setAuthModalVisible,
  } = useAuth();

  return (
    <View>
      <Text testID="auth-loading">{String(isLoading)}</Text>
      <Text testID="auth-authenticated">{String(isAuthenticated)}</Text>
      <Text testID="auth-user">{user ? String(user.username || user.id) : 'none'}</Text>
      <Text testID="auth-token">{token ?? 'none'}</Text>
      <Text testID="auth-modal-visible">{String(isAuthModalVisible)}</Text>
      <Text testID="auth-expired-notice">{String(sessionExpiredNotice)}</Text>
      <TouchableOpacity testID="close-modal" onPress={() => setAuthModalVisible(false)} />
    </View>
  );
};

async function flushRender() {
  return render(
    <FeedbackProvider>
      <AuthProvider>
        <AuthHarness />
      </AuthProvider>
    </FeedbackProvider>
  );
}

describe('Session lifecycle: launch validation, no ts_session_ fallback, and central 401 handler', () => {
  const secureStoreMock = SecureStore as unknown as {
    __clear: () => void;
    __peek: (k: string) => string | null;
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    secureStoreMock.__clear();
    await AsyncStorage.clear();
    HttpClient.setAuthToken(null);
    HttpClient.setUnauthorizedListener(null);
    (SecureStorageService as any).isSecureStoreAvailable = null;
    await Env.setEnvironment('staging');
  });

  it('never synthesizes a ts_session_ token when SecureStore has no token and forces login', async () => {
    await AsyncStorage.setItem(
      '@thrivingskill_auth_user',
      JSON.stringify({ id: 42, username: 'sadia', email: 'sadia@example.com' })
    );

    await flushRender();

    await waitFor(() => {
      expect(screen.getByTestId('auth-loading').props.children).toBe('false');
    });

    expect(screen.getByTestId('auth-authenticated').props.children).toBe('false');
    expect(screen.getByTestId('auth-user').props.children).toBe('none');
    expect(screen.getByTestId('auth-token').props.children).toBe('none');
    expect(screen.getByTestId('auth-modal-visible').props.children).toBe('true');
    expect(screen.getByTestId('auth-expired-notice').props.children).toBe('true');
    expect(await AsyncStorage.getItem('@thrivingskill_auth_user')).toBeNull();
    expect(await HttpClient.getAuthToken()).toBeNull();
  });

  it('rejects a persisted legacy ts_session_ token without treating user as signed in', async () => {
    await AsyncStorage.setItem(
      '@thrivingskill_auth_user',
      JSON.stringify({
        id: 77,
        username: 'legacy_user',
        email: 'legacy@example.com',
        token: 'ts_session_77',
      })
    );
    await SecureStore.setItemAsync('thriving_skill_jwt_token', 'ts_session_77');

    await flushRender();

    await waitFor(() => {
      expect(screen.getByTestId('auth-loading').props.children).toBe('false');
    });

    expect(screen.getByTestId('auth-authenticated').props.children).toBe('false');
    expect(screen.getByTestId('auth-token').props.children).toBe('none');
    expect(screen.getByTestId('auth-modal-visible').props.children).toBe('true');
    expect(secureStoreMock.__peek('thriving_skill_jwt_token')).toBeNull();
    expect(await AsyncStorage.getItem('@thrivingskill_auth_user')).toBeNull();
  });

  it('validates persisted 7-day token on launch and clears expired sessions into login', async () => {
    const nowSec = Math.floor(Date.now() / 1000);
    const expiredTsmbToken = makeSignedMockJwt({
      iss: 'tsmb',
      sub: 99,
      iat: nowSec - 605000,
      exp: nowSec - 100,
    });

    await AsyncStorage.setItem(
      '@thrivingskill_auth_user',
      JSON.stringify({ id: 99, username: 'expired_user', email: 'exp@example.com' })
    );
    await SecureStorageService.setAuthToken(expiredTsmbToken);

    await flushRender();

    await waitFor(() => {
      expect(screen.getByTestId('auth-loading').props.children).toBe('false');
    });

    expect(screen.getByTestId('auth-authenticated').props.children).toBe('false');
    expect(screen.getByTestId('auth-modal-visible').props.children).toBe('true');
    expect(screen.getByTestId('auth-expired-notice').props.children).toBe('true');
    expect(secureStoreMock.__peek('thriving_skill_jwt_token')).toBeNull();
  });

  it('clears session and shows login once via central 401 handler when authenticated lesson call returns 401', async () => {
    const nowSec = Math.floor(Date.now() / 1000);
    const activeToken = makeSignedMockJwt({
      iss: 'tsmb',
      sub: 123,
      iat: nowSec,
      exp: nowSec + 604800,
    });

    await AsyncStorage.setItem(
      '@thrivingskill_auth_user',
      JSON.stringify({ id: 123, username: 'tareq', email: 'tareq@example.com', token: activeToken })
    );
    await SecureStorageService.setAuthToken(activeToken);

    const fetchMock = globalThis.fetch as jest.Mock;
    fetchMock
      // Launch validation (/wp/v2/users/me) + immediate background refreshUserProfile
      .mockResolvedValueOnce(makeJsonResponse({ id: 123, slug: 'tareq', name: 'Tareq' }, 200))
      .mockResolvedValueOnce(makeJsonResponse({ id: 123, slug: 'tareq', name: 'Tareq' }, 200))
      .mockResolvedValueOnce(makeJsonResponse({ id: 123, slug: 'tareq', name: 'Tareq' }, 200));

    await flushRender();

    await waitFor(() => {
      expect(screen.getByTestId('auth-loading').props.children).toBe('false');
      expect(screen.getByTestId('auth-authenticated').props.children).toBe('true');
    });

    expect(screen.getByTestId('auth-token').props.children).toBe(activeToken);
    // Plaintext token stripped from AsyncStorage user snapshot during migration
    const persistedUser = safeParseUserJson(await AsyncStorage.getItem('@thrivingskill_auth_user'));
    expect(persistedUser.token).toBeUndefined();

    // Simulate concurrent 401 responses after 7-day token expiration mid-session
    fetchMock
      .mockResolvedValueOnce(
        makeJsonResponse(
          { code: 'rest_not_logged_in', message: 'Expired', data: { status: 401 } },
          401
        )
      )
      .mockResolvedValueOnce(
        makeJsonResponse(
          { code: 'rest_not_logged_in', message: 'Expired', data: { status: 401 } },
          401
        )
      );

    await act(async () => {
      await Promise.allSettled([
        HttpClient.get('/thrivingskill/v1/lessons/501', undefined, { retries: 0 }),
        HttpClient.get('/thrivingskill/v1/enrollments', undefined, { retries: 0 }),
      ]);
    });

    await waitFor(() => {
      expect(screen.getByTestId('auth-authenticated').props.children).toBe('false');
      expect(screen.getByTestId('auth-user').props.children).toBe('none');
      expect(screen.getByTestId('auth-token').props.children).toBe('none');
      expect(screen.getByTestId('auth-modal-visible').props.children).toBe('true');
      expect(screen.getByTestId('auth-expired-notice').props.children).toBe('true');
    });

    expect(secureStoreMock.__peek('thriving_skill_jwt_token')).toBeNull();
    expect(await AsyncStorage.getItem('@thrivingskill_auth_user')).toBeNull();

    // Closing modal manually shouldn't break state
    await fireEvent.press(screen.getByTestId('close-modal'));
    expect(screen.getByTestId('auth-modal-visible').props.children).toBe('false');
  });

  it('keeps cached session active when launch verification hits offline network error', async () => {
    const nowSec = Math.floor(Date.now() / 1000);
    const activeToken = makeSignedMockJwt({
      iss: 'tsmb',
      sub: 456,
      iat: nowSec,
      exp: nowSec + 604800,
    });

    await AsyncStorage.setItem(
      '@thrivingskill_auth_user',
      JSON.stringify({ id: 456, username: 'offline_learner', email: 'off@example.com' })
    );
    await SecureStorageService.setAuthToken(activeToken);

    (globalThis.fetch as jest.Mock).mockRejectedValueOnce(new TypeError('Network request failed'));

    await flushRender();

    await waitFor(() => {
      expect(screen.getByTestId('auth-loading').props.children).toBe('false');
    });

    expect(screen.getByTestId('auth-authenticated').props.children).toBe('true');
    expect(screen.getByTestId('auth-user').props.children).toBe('offline_learner');
    expect(screen.getByTestId('auth-token').props.children).toBe(activeToken);
    expect(screen.getByTestId('auth-modal-visible').props.children).toBe('false');
  });
});
