import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Sentry from '@sentry/react-native';
import { Platform } from 'react-native';
import { Env } from '../config/env';
import {
  TelemetryService,
  sanitizeSentryBreadcrumb,
  sanitizeSentryEvent,
} from '../services/telemetry/telemetryService';
import { PushNotificationService } from '../services/notifications/pushNotificationService';
import { CompanionService } from '../services/api/companionService';

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(async () => ({ status: 'undetermined' })),
  requestPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  setNotificationChannelAsync: jest.fn(async () => undefined),
  getExpoPushTokenAsync: jest.fn(async () => ({ data: 'ExponentPushToken[test_token_123456]' })),
  scheduleNotificationAsync: jest.fn(async () => 'notif-id-1'),
  getAllScheduledNotificationsAsync: jest.fn(async () => []),
  cancelScheduledNotificationAsync: jest.fn(async () => undefined),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  getLastNotificationResponseAsync: jest.fn(async () => null),
  AndroidImportance: { MAX: 5, HIGH: 4, DEFAULT: 3 },
  SchedulableTriggerInputTypes: { DAILY: 'daily' },
}));

describe('Issue #15, Item 2 & Item 6: Push tokens, streak schedule, & Sentry PII scrubbing', () => {
  const originalDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

  beforeEach(() => {
    jest.clearAllMocks();
    (TelemetryService as any).isInitialized = false;
    (TelemetryService as any).activeDsn = '';
    (PushNotificationService as any).cachedToken = null;
    (PushNotificationService as any).channelsInitialized = false;
    Platform.OS = 'android';
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

  it('never fabricates ts_push_* tokens, purges stale fake tokens, and re-registers when token changes', async () => {
    await AsyncStorage.setItem('@thrivingskill_push_token', 'ts_push_android_fake123');
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    (Notifications.getExpoPushTokenAsync as jest.Mock).mockRejectedValueOnce(
      new Error('FCM not ready')
    );
    const registerSpy = jest.spyOn(CompanionService, 'registerPushToken').mockResolvedValue(true);

    // Offline / failure returns null and purges fake token instead of storing ts_push_*
    const failedToken = await PushNotificationService.syncGrantedPushRegistration('42');
    expect(failedToken).toBeNull();
    expect(await AsyncStorage.getItem('@thrivingskill_push_token')).toBeNull();
    expect(registerSpy).not.toHaveBeenCalled();

    // Next launch re-fetches real token and registers it cleanly
    (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValueOnce({
      data: 'ExponentPushToken[token_alpha_111]',
    });
    const tok1 = await PushNotificationService.syncGrantedPushRegistration('42');
    expect(tok1).toBe('ExponentPushToken[token_alpha_111]');
    expect(registerSpy).toHaveBeenCalledTimes(1);
    expect(registerSpy).toHaveBeenCalledWith('ExponentPushToken[token_alpha_111]', 'android');

    // Same launch/token skips duplicate registration
    (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValueOnce({
      data: 'ExponentPushToken[token_alpha_111]',
    });
    await PushNotificationService.syncGrantedPushRegistration('42');
    expect(registerSpy).toHaveBeenCalledTimes(1);

    // Token rotation on subsequent launch triggers server re-registration
    (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValueOnce({
      data: 'ExponentPushToken[token_beta_222]',
    });
    const tok2 = await PushNotificationService.syncGrantedPushRegistration('42');
    expect(tok2).toBe('ExponentPushToken[token_beta_222]');
    expect(registerSpy).toHaveBeenCalledTimes(2);
    expect(registerSpy).toHaveBeenLastCalledWith('ExponentPushToken[token_beta_222]', 'android');

    registerSpy.mockRestore();
  });

  it('schedules daily streak nudge at settings.reminderHour rather than firing immediately on open', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    await AsyncStorage.setItem(
      '@thrivingskill_notification_settings',
      JSON.stringify({ streakReminders: true, reminderHour: 21 })
    );

    await PushNotificationService.scheduleDailyStreakNudge(false);

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        trigger: expect.objectContaining({
          type: 'daily',
          hour: 21,
          minute: 0,
        }),
      })
    );
    // Must not schedule an immediate null-trigger notification
    const calls = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls;
    expect(calls.every((call) => call[0]?.trigger !== null)).toBe(true);
  });

  it('initializes @sentry/react-native, omits phone usernames, and scrubs order_key from breadcrumbs', () => {
    process.env.EXPO_PUBLIC_SENTRY_DSN = 'https://abc123@o1.ingest.sentry.io/456';
    expect(Env.SENTRY_DSN).toBe('https://abc123@o1.ingest.sentry.io/456');

    TelemetryService.initialize();
    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://abc123@o1.ingest.sentry.io/456',
        enabled: true,
        sendDefaultPii: false,
      })
    );

    // Phone number username MUST NOT be sent to Sentry user scope
    TelemetryService.setUser({ id: '42', username: '01711223344', role: 'subscriber' });
    expect(Sentry.setUser).toHaveBeenLastCalledWith({ id: '42' });

    // Non-phone username is kept cleanly
    TelemetryService.setUser({ id: '42', username: 'learner42', role: 'subscriber' });
    expect(Sentry.setUser).toHaveBeenLastCalledWith({ id: '42', username: 'learner42' });

    // order_key and tokens MUST be scrubbed from network breadcrumbs and events
    const scrubbedCrumb = sanitizeSentryBreadcrumb({
      category: 'xhr',
      message:
        'GET https://thrivingskill.com/checkout/order-received/99/?order_key=wc_order_secret99&key=wc_order_secret99',
      data: {
        url: 'https://thrivingskill.com/wp-json/thrivingskill/v1/enrollments?order_key=wc_order_secret99',
        order_key: 'wc_order_secret99',
      },
    });
    expect(scrubbedCrumb.message).not.toContain('wc_order_secret99');
    expect(scrubbedCrumb.data.url).toContain('order_key=[REDACTED]');
    expect(scrubbedCrumb.data.order_key).toBe('[REDACTED]');

    const scrubbedEvt = sanitizeSentryEvent({
      request: { url: 'https://thrivingskill.com/?tsmb_handoff=secret123&order_key=wc_order_abc' },
      user: { id: '7', username: '01812345678' },
    });
    expect(scrubbedEvt.request.url).not.toContain('secret123');
    expect(scrubbedEvt.request.url).not.toContain('wc_order_abc');
    expect(scrubbedEvt.user).toEqual({ id: '7' });

    const err = new Error('Sample UI failure');
    TelemetryService.captureException(err, { screen: 'LessonPlayer' });
    expect(Sentry.captureException).toHaveBeenCalledWith(err, {
      extra: { screen: 'LessonPlayer' },
    });
    expect(globalThis.fetch).not.toHaveBeenCalled();

    // Business analytics events go to durable AnalyticsService storage, not Sentry breadcrumbs
    const breadcrumbCallsBefore = (Sentry.addBreadcrumb as jest.Mock).mock.calls.length;
    TelemetryService.trackEvent('course_preview_opened', { courseId: '85153' });
    expect((Sentry.addBreadcrumb as jest.Mock).mock.calls.length).toBe(breadcrumbCallsBefore);
  });
});
