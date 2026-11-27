import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sentry from '@sentry/react-native';
import { Env } from '../../config/env';
import { APP_VERSION } from '../../config/appVersion';
import {
  AnalyticsService,
  DEFAULT_RECOMMENDATION_ATTRIBUTION_WINDOW_MS,
  type AnalyticsEventRecord,
  type RecommendationAttributionRecord,
  type RecommendationAttributionSummary,
  type RecommendationClickOptions,
  type RecommendationClickRecord,
  type RecommendationConversionOptions,
  type RecommendationImpressionItem,
  type RecommendationImpressionOptions,
  type RecommendationImpressionRecord,
  type RecommendationSourceMetrics,
} from '../analytics/analyticsService';
import {
  sanitizeSentryBreadcrumb,
  sanitizeSentryEvent,
  sanitizeSensitiveUrl,
  isPhoneNumberUsername,
} from './telemetrySanitizer';

export {
  DEFAULT_RECOMMENDATION_ATTRIBUTION_WINDOW_MS,
  sanitizeSentryBreadcrumb,
  sanitizeSentryEvent,
  sanitizeSensitiveUrl,
  isPhoneNumberUsername,
};
export type {
  AnalyticsEventRecord,
  RecommendationAttributionRecord,
  RecommendationAttributionSummary,
  RecommendationClickOptions,
  RecommendationClickRecord,
  RecommendationConversionOptions,
  RecommendationImpressionItem,
  RecommendationImpressionOptions,
  RecommendationImpressionRecord,
  RecommendationSourceMetrics,
};

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
   * Associates crash telemetry & product analytics with the active authenticated learner without sending phone PII.
   */
  static setUser(user: { id: string; username?: string; role?: string } | null): void {
    this.currentUser = user;
    AnalyticsService.setUser(user);
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
   * Delegates custom business/learning analytics events to the durable AnalyticsService store
   * rather than recording product analytics inside Sentry crash breadcrumbs.
   */
  static trackEvent(eventName: string, properties?: Record<string, any>): AnalyticsEventRecord {
    return AnalyticsService.trackEvent(eventName, properties);
  }

  static getSessionId(): string {
    return AnalyticsService.getSessionId();
  }

  static setSessionId(sessionId: string): string {
    return AnalyticsService.setSessionId(sessionId);
  }

  static startNewSession(): string {
    return AnalyticsService.startNewSession();
  }

  static setRecommendationAttributionWindowMs(windowMs: number): void {
    AnalyticsService.setRecommendationAttributionWindowMs(windowMs);
  }

  static getRecommendationAttributionWindowMs(): number {
    return AnalyticsService.getRecommendationAttributionWindowMs();
  }

  static trackRecommendationImpression(
    items: (string | RecommendationImpressionItem)[],
    surfaceOrOptions: string | RecommendationImpressionOptions = 'home'
  ): string | null {
    return AnalyticsService.trackRecommendationImpression(items, surfaceOrOptions);
  }

  static trackRecommendationClick(
    courseId: string,
    categoryOrOptions?: string | RecommendationClickOptions,
    position?: number
  ): RecommendationClickRecord | null {
    return AnalyticsService.trackRecommendationClick(courseId, categoryOrOptions, position);
  }

  static trackRecommendationConversion(
    courseId: string,
    conversionTypeOrOptions: 'enroll' | 'purchase' | RecommendationConversionOptions = 'enroll',
    extraOptions?: Omit<RecommendationConversionOptions, 'conversionType'>
  ): boolean {
    return AnalyticsService.trackRecommendationConversion(
      courseId,
      conversionTypeOrOptions,
      extraOptions
    );
  }

  static getRecommendationMetrics(): {
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    conversionRate: number;
  } {
    return AnalyticsService.getRecommendationMetrics();
  }

  static getRecommendationAttributions(): RecommendationAttributionRecord[] {
    return AnalyticsService.getRecommendationAttributions();
  }

  static getLastRecommendationAttribution(): RecommendationAttributionRecord | null {
    return AnalyticsService.getLastRecommendationAttribution();
  }

  static getPendingRecommendationClicks(): RecommendationClickRecord[] {
    return AnalyticsService.getPendingRecommendationClicks();
  }

  static getRecommendationAttributionSummary(): RecommendationAttributionSummary {
    return AnalyticsService.getRecommendationAttributionSummary();
  }

  static async hydrateRecommendationAttributions(force: boolean = false): Promise<void> {
    return AnalyticsService.hydrate(force);
  }

  static resetRecommendationMetrics(): void {
    AnalyticsService.resetAnalytics();
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
