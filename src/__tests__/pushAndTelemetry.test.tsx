import * as Notifications from 'expo-notifications';
import * as Sentry from '@sentry/react-native';
import { Env } from '../config/env';
import { TelemetryService } from '../services/telemetry/telemetryService';
import { PushNotificationService } from '../services/notifications/pushNotificationService';

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(async () => ({ status: 'undetermined' })),
  requestPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  setNotificationChannelAsync: jest.fn(async () => undefined),
  getExpoPushTokenAsync: jest.fn(async () => ({ data: 'ExponentPushToken[test_token_123456]' })),
  scheduleNotificationAsync: jest.fn(async () => 'notif-id-1'),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  getLastNotificationResponseAsync: jest.fn(async () => null),
  AndroidImportance: { MAX: 5, HIGH: 4, DEFAULT: 3 },
}));

describe('Issue #15: Defer push permission & Sentry Crash Reporting integration', () => {
  const originalDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

  beforeEach(() => {
    jest.clearAllMocks();
    (TelemetryService as any).isInitialized = false;
    (TelemetryService as any).activeDsn = '';
  });

  afterAll(() => {
    process.env.EXPO_PUBLIC_SENTRY_DSN = originalDsn;
  });

  it('never calls requestPermissionsAsync during launch or silent sync', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: 'undetermined',
    });

    const token = await PushNotificationService.syncGrantedPushRegistration();
    expect(token).toBeNull();
    expect(Notifications.getPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it('requests notification permissions only on explicit user action', async () => {
    (Notifications.getPermissionsAsync as jest.Mock)
      .mockResolvedValueOnce({ status: 'undetermined' })
      .mockResolvedValueOnce({ status: 'granted' });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: 'granted',
    });

    const result = await PushNotificationService.requestPermissionAndRegister();
    expect(result.granted).toBe(true);
    expect(result.token).toBe('ExponentPushToken[test_token_123456]');
    expect(Notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
  });

  it('initializes @sentry/react-native via static Env.SENTRY_DSN and does not hit legacy /store/', () => {
    process.env.EXPO_PUBLIC_SENTRY_DSN = 'https://abc123@o1.ingest.sentry.io/456';
    expect(Env.SENTRY_DSN).toBe('https://abc123@o1.ingest.sentry.io/456');

    TelemetryService.initialize();
    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://abc123@o1.ingest.sentry.io/456',
        enabled: true,
      })
    );

    TelemetryService.setUser({ id: '42', username: 'learner42', role: 'subscriber' });
    expect(Sentry.setUser).toHaveBeenCalledWith({ id: '42', username: 'learner42' });

    const err = new Error('Sample UI failure');
    TelemetryService.captureException(err, { screen: 'LessonPlayer' });
    expect(Sentry.captureException).toHaveBeenCalledWith(err, {
      extra: { screen: 'LessonPlayer' },
    });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
