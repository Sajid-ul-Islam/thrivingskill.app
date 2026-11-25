import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sentry from '@sentry/react-native';
import { Env } from '../../config/env';

export interface TelemetryBreadcrumb {
  category: 'navigation' | 'auth' | 'video' | 'checkout' | 'system' | 'network';
  message: string;
  data?: Record<string, any>;
  timestamp: number;
}

export interface TelemetryEvent {
  id: string;
  type: 'error' | 'warning' | 'event';
  message: string;
  stack?: string;
  context?: Record<string, any>;
  breadcrumbs: TelemetryBreadcrumb[];
  userId?: string;
  platform: string;
  version: string;
  timestamp: number;
}

const STORAGE_KEY_CRASHES = '@thrivingskill_telemetry_crashes';
const MAX_BREADCRUMBS = 30;
const MAX_STORED_CRASHES = 20;

export class TelemetryService {
  private static isInitialized = false;
  private static breadcrumbs: TelemetryBreadcrumb[] = [];
  private static currentUser: { id: string; username?: string; role?: string } | null = null;
  private static activeDsn = '';

  /**
   * Initializes official @sentry/react-native crash reporting using static build-time Env.SENTRY_DSN.
   */
  static initialize(customDsn?: string): void {
    const resolvedDsn = (customDsn ?? Env.SENTRY_DSN).trim();
    if (this.isInitialized && (!customDsn || resolvedDsn === this.activeDsn)) {
      return;
    }

    this.isInitialized = true;
    this.activeDsn = resolvedDsn;

    try {
      Sentry.init({
        dsn: resolvedDsn || undefined,
        enabled: Boolean(resolvedDsn),
        environment: Env.currentEnvironment,
        attachStacktrace: true,
        enableAutoSessionTracking: true,
        tracesSampleRate: __DEV__ ? 1.0 : 0.2,
      });
    } catch {
      // Never block app boot if native Sentry initialization is unavailable in test/web environments
    }

    this.addBreadcrumb({
      category: 'system',
      message: `App initialized (v1.4.0, Platform: ${Platform.OS}, Env: ${Env.currentEnvironment})`,
      timestamp: Date.now(),
    });
  }

  /**
   * Returns whether a valid Sentry DSN is configured in this build.
   */
  static isSentryConfigured(): boolean {
    return Boolean(this.activeDsn || Env.SENTRY_DSN);
  }

  /**
   * Records a user/action breadcrumb both locally and inside Sentry scope.
   */
  static addBreadcrumb(
    breadcrumb: Omit<TelemetryBreadcrumb, 'timestamp'> & { timestamp?: number }
  ): void {
    const entry: TelemetryBreadcrumb = {
      ...breadcrumb,
      timestamp: breadcrumb.timestamp || Date.now(),
    };
    this.breadcrumbs.push(entry);
    if (this.breadcrumbs.length > MAX_BREADCRUMBS) {
      this.breadcrumbs.shift();
    }

    try {
      Sentry.addBreadcrumb({
        category: entry.category,
        message: entry.message,
        data: entry.data,
        timestamp: entry.timestamp / 1000,
      });
    } catch {}
  }

  /**
   * Associates telemetry & Sentry crash events with the active authenticated learner.
   */
  static setUser(user: { id: string; username?: string; role?: string } | null): void {
    this.currentUser = user;
    try {
      Sentry.setUser(
        user
          ? {
              id: user.id,
              username: user.username,
            }
          : null
      );
      if (user?.role) {
        Sentry.setTag('user_role', user.role);
      }
    } catch {}

    if (user) {
      this.addBreadcrumb({
        category: 'auth',
        message: `User session bound (Role: ${user.role || 'learner'})`,
      });
    }
  }

  /**
   * Captures an unhandled or caught exception via @sentry/react-native and local diagnostics ring buffer.
   */
  static captureException(error: Error | any, context?: Record<string, any>): void {
    const normalizedError = error instanceof Error ? error : new Error(String(error));
    const message = normalizedError.message || String(error);
    const stack = normalizedError.stack || undefined;

    const crashEvent: TelemetryEvent = {
      id: `crash_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: 'error',
      message,
      stack,
      context,
      breadcrumbs: [...this.breadcrumbs],
      userId: this.currentUser?.id,
      platform: Platform.OS,
      version: '1.4.0',
      timestamp: Date.now(),
    };

    if (__DEV__) {
      console.warn('[Telemetry] Crash Captured:', message, context);
    }

    this.persistCrashLocally(crashEvent);

    try {
      if (this.isSentryConfigured()) {
        Sentry.captureException(normalizedError, context ? { extra: context } : undefined);
      }
    } catch {}
  }

  /**
   * Tracks custom business/learning breadcrumbs.
   */
  static trackEvent(eventName: string, properties?: Record<string, any>): void {
    this.addBreadcrumb({
      category: 'system',
      message: `Event: ${eventName}`,
      data: properties,
    });
  }

  private static async persistCrashLocally(event: TelemetryEvent): Promise<void> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY_CRASHES);
      const list: TelemetryEvent[] = raw ? JSON.parse(raw) : [];
      list.unshift(event);
      if (list.length > MAX_STORED_CRASHES) {
        list.pop();
      }
      await AsyncStorage.setItem(STORAGE_KEY_CRASHES, JSON.stringify(list));
    } catch {}
  }

  static async getStoredCrashes(): Promise<TelemetryEvent[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY_CRASHES);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  static async clearStoredCrashes(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY_CRASHES);
    } catch {}
  }
}
