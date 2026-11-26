import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sentry from '@sentry/react-native';
import { Env } from '../../config/env';
import { APP_VERSION } from '../../config/appVersion';

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

const SENSITIVE_QUERY_PARAM_REGEX =
  /([?&](?:order_key|key|rp_key|token|tsmb_handoff|otp|password|reset_key)=)[^&#\s]+/gi;

export function sanitizeSensitiveUrl(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  return raw.replace(SENSITIVE_QUERY_PARAM_REGEX, '$1[REDACTED]');
}

function sanitizeTelemetryRecord(value: any, depth: number = 0): any {
  if (depth > 3 || value === null || value === undefined) return value;
  if (typeof value === 'string') return sanitizeSensitiveUrl(value);
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeTelemetryRecord(item, depth + 1));
  }
  if (typeof value === 'object') {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      const lowerKey = k.toLowerCase();
      if (
        lowerKey === 'order_key' ||
        lowerKey === 'orderkey' ||
        lowerKey === 'tsmb_handoff' ||
        lowerKey === 'token' ||
        lowerKey === 'password' ||
        lowerKey === 'otp'
      ) {
        out[k] = '[REDACTED]';
      } else {
        out[k] = sanitizeTelemetryRecord(v, depth + 1);
      }
    }
    return out;
  }
  return value;
}

export function sanitizeSentryBreadcrumb<T extends Record<string, any> | null | undefined>(
  breadcrumb: T
): T {
  if (!breadcrumb || typeof breadcrumb !== 'object') return breadcrumb;
  return {
    ...breadcrumb,
    ...(typeof breadcrumb.message === 'string'
      ? { message: sanitizeSensitiveUrl(breadcrumb.message) }
      : {}),
    ...(breadcrumb.data ? { data: sanitizeTelemetryRecord(breadcrumb.data) } : {}),
  } as T;
}

export function sanitizeSentryEvent<T extends Record<string, any> | null | undefined>(event: T): T {
  if (!event || typeof event !== 'object') return event;
  const copy: any = { ...event };
  if (copy.request) {
    copy.request = sanitizeTelemetryRecord(copy.request);
  }
  if (Array.isArray(copy.breadcrumbs)) {
    copy.breadcrumbs = copy.breadcrumbs.map((b: any) => sanitizeSentryBreadcrumb(b));
  } else if (copy.breadcrumbs && Array.isArray(copy.breadcrumbs.values)) {
    copy.breadcrumbs = {
      ...copy.breadcrumbs,
      values: copy.breadcrumbs.values.map((b: any) => sanitizeSentryBreadcrumb(b)),
    };
  }
  if (copy.user && typeof copy.user === 'object') {
    const cleanUser: Record<string, any> = {};
    if (copy.user.id !== undefined) cleanUser.id = copy.user.id;
    if (
      typeof copy.user.username === 'string' &&
      !isPhoneNumberUsername(copy.user.username) &&
      !copy.user.username.endsWith('@phone.thrivingskill.com')
    ) {
      cleanUser.username = copy.user.username;
    }
    copy.user = cleanUser;
  }
  return copy;
}

export function isPhoneNumberUsername(username?: string | null): boolean {
  if (!username || typeof username !== 'string') return false;
  const clean = username.trim();
  return /^\+?\d[\d\s()-]{6,}$/.test(clean);
}

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
        sendDefaultPii: false,
        tracesSampleRate: __DEV__ ? 1.0 : 0.2,
        beforeBreadcrumb: (breadcrumb) => sanitizeSentryBreadcrumb(breadcrumb),
        beforeSend: (event) => sanitizeSentryEvent(event),
      });
    } catch {
      // Never block app boot if native Sentry initialization is unavailable in test/web environments
    }

    this.addBreadcrumb({
      category: 'system',
      message: `App initialized (v${APP_VERSION}, Platform: ${Platform.OS}, Env: ${Env.currentEnvironment})`,
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
   * Records a user/action breadcrumb both locally and inside Sentry scope with secrets scrubbed.
   */
  static addBreadcrumb(
    breadcrumb: Omit<TelemetryBreadcrumb, 'timestamp'> & { timestamp?: number }
  ): void {
    const entry: TelemetryBreadcrumb = sanitizeSentryBreadcrumb({
      ...breadcrumb,
      timestamp: breadcrumb.timestamp || Date.now(),
    });
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
   * Associates telemetry & Sentry crash events with the active authenticated learner without sending phone PII.
   */
  static setUser(user: { id: string; username?: string; role?: string } | null): void {
    this.currentUser = user;
    try {
      if (!user) {
        Sentry.setUser(null);
      } else {
        const safeUsername =
          user.username &&
          !isPhoneNumberUsername(user.username) &&
          !user.username.endsWith('@phone.thrivingskill.com')
            ? user.username
            : undefined;
        Sentry.setUser(safeUsername ? { id: user.id, username: safeUsername } : { id: user.id });
        if (user.role) {
          Sentry.setTag('user_role', user.role);
        }
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
      version: APP_VERSION,
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
