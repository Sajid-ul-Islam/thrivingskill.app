import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  private static sentryDsn?: string;

  /**
   * Initializes Telemetry & Crash Monitoring
   */
  static initialize(customDsn?: string): void {
    if (this.isInitialized) return;
    this.isInitialized = true;
    this.sentryDsn = customDsn || (process.env as any)?.EXPO_PUBLIC_SENTRY_DSN;

    this.addBreadcrumb({
      category: 'system',
      message: `App initialized (v1.4.0, Platform: ${Platform.OS})`,
      timestamp: Date.now(),
    });

    // Global Error Handler Hook
    if (typeof ErrorUtils !== 'undefined' && ErrorUtils.getGlobalHandler) {
      const defaultHandler = ErrorUtils.getGlobalHandler();
      ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
        TelemetryService.captureException(error, { isFatal });
        if (defaultHandler) {
          defaultHandler(error, isFatal);
        }
      });
    }
  }

  /**
   * Records a user/action breadcrumb for crash forensics
   */
  static addBreadcrumb(breadcrumb: Omit<TelemetryBreadcrumb, 'timestamp'> & { timestamp?: number }): void {
    const entry: TelemetryBreadcrumb = {
      ...breadcrumb,
      timestamp: breadcrumb.timestamp || Date.now(),
    };
    this.breadcrumbs.push(entry);
    if (this.breadcrumbs.length > MAX_BREADCRUMBS) {
      this.breadcrumbs.shift();
    }
  }

  /**
   * Associates telemetry with the active authenticated user
   */
  static setUser(user: { id: string; username?: string; role?: string } | null): void {
    this.currentUser = user;
    if (user) {
      this.addBreadcrumb({
        category: 'auth',
        message: `User session bound (Role: ${user.role || 'learner'})`,
      });
    }
  }

  /**
   * Captures an unhandled or caught exception
   */
  static captureException(error: Error | any, context?: Record<string, any>): void {
    const message = error?.message || String(error);
    const stack = error?.stack || undefined;

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

    // Persist locally for diagnostics
    this.persistCrashLocally(crashEvent);

    // Forward to remote ingestion if Sentry DSN is present
    if (this.sentryDsn) {
      this.forwardToSentry(crashEvent).catch(() => {});
    }
  }

  /**
   * Tracks custom business/learning events (e.g., lesson_complete, checkout_start)
   */
  static trackEvent(eventName: string, properties?: Record<string, any>): void {
    this.addBreadcrumb({
      category: 'system',
      message: `Event: ${eventName}`,
      data: properties,
    });
  }

  /**
   * Persists crash log to local AsyncStorage queue
   */
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

  /**
   * Retrieves recent crash reports for in-app support / audit
   */
  static async getStoredCrashes(): Promise<TelemetryEvent[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY_CRASHES);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /**
   * Clears stored crash reports
   */
  static async clearStoredCrashes(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY_CRASHES);
    } catch {}
  }

  /**
   * Forwards event payload to Sentry ingestion envelope
   */
  private static async forwardToSentry(event: TelemetryEvent): Promise<void> {
    if (!this.sentryDsn) return;
    try {
      const dsnUrl = new URL(this.sentryDsn);
      const projectId = dsnUrl.pathname.replace('/', '');
      const endpoint = `${dsnUrl.protocol}//${dsnUrl.host}/api/${projectId}/store/`;

      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sentry-Auth': `Sentry sentry_version=7, sentry_client=thrivingskill-mobile/1.4.0, sentry_key=${dsnUrl.username}`,
        },
        body: JSON.stringify({
          event_id: event.id.replace('crash_', ''),
          timestamp: new Date(event.timestamp).toISOString(),
          platform: 'javascript',
          level: 'error',
          message: event.message,
          exception: {
            values: [
              {
                type: 'Error',
                value: event.message,
                stacktrace: event.stack ? { frames: [{ filename: 'app.bundle', function: event.stack }] } : undefined,
              },
            ],
          },
          user: event.userId ? { id: event.userId } : undefined,
          breadcrumbs: event.breadcrumbs.map((b) => ({
            timestamp: b.timestamp / 1000,
            category: b.category,
            message: b.message,
            data: b.data,
          })),
        }),
      });
    } catch {}
  }
}
