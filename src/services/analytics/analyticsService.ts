import AsyncStorage from '@react-native-async-storage/async-storage';
import { sanitizeTelemetryRecord } from '../telemetry/telemetrySanitizer';

export const STORAGE_KEY_ANALYTICS_EVENTS = '@thrivingskill_analytics_events_v1';
export const STORAGE_KEY_ANALYTICS_STATE = '@thrivingskill_analytics_state_v1';
const LEGACY_STORAGE_KEY_RECOMMENDATION_ATTRIBUTIONS = '@thrivingskill_recommendation_attributions';

const MAX_STORED_EVENTS = 1000;
const MAX_IMPRESSED_CARD_KEYS = 500;
const MAX_RECENT_IMPRESSIONS = 100;
const MAX_PENDING_CLICKS = 200;
const MAX_STORED_ATTRIBUTIONS = 200;
const MAX_CONVERTED_COURSE_KEYS = 500;

export const DEFAULT_RECOMMENDATION_ATTRIBUTION_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface AnalyticsEventRecord {
  id: string;
  name: string;
  timestamp: number;
  learnerId: string | null;
  sessionId: string;
  properties: Record<string, any>;
}

export interface AnalyticsEventFilter {
  name?: string;
  source?: string;
  courseId?: string;
  learnerId?: string | null;
  limit?: number;
}

export interface RecommendationImpressionItem {
  courseId: string;
  position?: number | null;
}

export interface RecommendationImpressionOptions {
  surface?: string;
  source?: string;
  recommendationId?: string;
  learnerId?: string | null;
  sessionId?: string;
  timestamp?: number;
}

export interface RecommendationClickOptions {
  recommendationId?: string;
  source?: string;
  surface?: string;
  category?: string;
  position?: number | null;
  learnerId?: string | null;
  sessionId?: string;
  clickTimestamp?: number;
  attributionWindowMs?: number;
}

export interface RecommendationConversionOptions {
  conversionType?: 'enroll' | 'purchase';
  conversionTimestamp?: number;
  learnerId?: string | null;
  sessionId?: string;
  recommendationId?: string;
  source?: string;
  attributionWindowMs?: number;
}

export interface RecommendationImpressionRecord {
  recommendationId: string;
  courseId: string;
  source: string;
  surface: string;
  position: number | null;
  learnerId: string | null;
  sessionId: string;
  timestamp: number;
}

export interface RecommendationClickRecord {
  clickId: string;
  recommendationId: string;
  courseId: string;
  source: string;
  surface: string;
  position: number | null;
  learnerId: string | null;
  sessionId: string;
  clickTimestamp: number;
  attributionWindowMs: number;
  category?: string;
}

export interface RecommendationAttributionRecord {
  clickId?: string;
  recommendationId: string;
  courseId: string;
  source: string;
  position: number | null;
  learnerId: string | null;
  sessionId: string;
  clickTimestamp: number;
  conversionTimestamp: number;
  attributionWindowMs: number;
  conversionType: 'enroll' | 'purchase';
  timeToConversionMs: number;
  category?: string;
}

export interface RecommendationAggregateBucket {
  impressions: number;
  clicks: number;
  conversions: number;
}

export interface RecommendationSourceMetrics extends RecommendationAggregateBucket {
  ctr: number;
  conversionRate: number;
}

export interface RecommendationAttributionSummary {
  impressions: number;
  clicks: number;
  conversions: number;
  unattributedConversions: number;
  duplicateConversions: number;
  ctr: number;
  conversionRate: number;
  bySource: Record<string, RecommendationSourceMetrics>;
  byPosition: Record<string, RecommendationSourceMetrics>;
  totalEventsStored: number;
}

interface PersistedAnalyticsState {
  totals: {
    impressions: number;
    clicks: number;
    conversions: number;
    unattributedConversions: number;
    duplicateConversions: number;
  };
  sourceMetrics: Record<string, RecommendationAggregateBucket>;
  positionMetrics: Record<string, RecommendationAggregateBucket>;
  impressedCardKeys: string[];
  recentCardImpressions: RecommendationImpressionRecord[];
  pendingClicks: RecommendationClickRecord[];
  attributions: RecommendationAttributionRecord[];
  convertedCourseKeys: string[];
}

function emptyTotals() {
  return {
    impressions: 0,
    clicks: 0,
    conversions: 0,
    unattributedConversions: 0,
    duplicateConversions: 0,
  };
}

function normalizePosition(position?: number | null): number | null {
  if (typeof position === 'number' && Number.isFinite(position) && position >= 0) {
    return Math.floor(position);
  }
  return null;
}

function positionBucketKey(position: number | null): string {
  return position !== null ? String(position) : 'unknown';
}

function buildMetricsFromBucket(
  bucket: RecommendationAggregateBucket
): RecommendationSourceMetrics {
  const impressions = bucket.impressions || 0;
  const clicks = bucket.clicks || 0;
  const conversions = bucket.conversions || 0;
  return {
    impressions,
    clicks,
    conversions,
    ctr: impressions > 0 ? Number((clicks / impressions).toFixed(4)) : 0,
    conversionRate: clicks > 0 ? Number((conversions / clicks).toFixed(4)) : 0,
  };
}

function makeImpressedCardKey(
  recommendationId: string,
  source: string,
  surface: string,
  learnerId: string | null,
  sessionId: string,
  courseId: string
): string {
  return `${recommendationId}:${source}:${surface}:${learnerId || 'guest'}:${sessionId}:${courseId}`;
}

function makeActorKey(learnerId: string | null, sessionId: string): string {
  return learnerId !== null ? `user:${learnerId}` : `session:${sessionId}`;
}

function makeConvertedCourseKey(actorKey: string, courseId: string): string {
  return `${actorKey}::${courseId}`;
}

/**
 * Centralized app-only analytics and recommendation attribution service.
 * Keeps business analytics events and durable conversion attribution out of Sentry breadcrumbs.
 */
export class AnalyticsService {
  private static idSequence = 0;
  private static stateEpoch = 0;
  private static currentUser: { id: string; username?: string; role?: string } | null = null;
  private static sessionId = AnalyticsService.generateId('sess');
  private static attributionWindowMs = DEFAULT_RECOMMENDATION_ATTRIBUTION_WINDOW_MS;

  private static events: AnalyticsEventRecord[] = [];
  private static totals = emptyTotals();
  private static sourceMetrics: Record<string, RecommendationAggregateBucket> = {};
  private static positionMetrics: Record<string, RecommendationAggregateBucket> = {};
  private static impressedCardKeys: string[] = [];
  private static impressedCardKeySet = new Set<string>();
  private static recentCardImpressions: RecommendationImpressionRecord[] = [];
  private static recentBatchIdMap = new Map<string, string>();
  private static pendingRecommendationClicks: RecommendationClickRecord[] = [];
  private static recommendationAttributions: RecommendationAttributionRecord[] = [];
  private static convertedCourseKeys: string[] = [];
  private static convertedCourseKeySet = new Set<string>();
  private static lastRecommendationId = '';

  private static hasHydrated = false;
  private static activeHydratePromise: Promise<void> | null = null;
  private static writeChain: Promise<void> = Promise.resolve();

  private static generateId(prefix: string): string {
    this.idSequence += 1;
    const rand = Math.random().toString(36).slice(2, 7);
    return `${prefix}_${Date.now()}_${this.idSequence}_${rand}`;
  }

  private static createRecommendationId(source: string, courseIds: string[]): string {
    const payload = `${source}:${courseIds.join(',')}`;
    let hash = 2166136261;
    for (let i = 0; i < payload.length; i++) {
      hash ^= payload.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    this.idSequence += 1;
    const safeSource = source.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 32) || 'rec';
    return `rec_${safeSource}_${(hash >>> 0).toString(16).padStart(8, '0')}_${this.idSequence}`;
  }

  private static resolveLearnerId(explicitLearnerId?: string | null): string | null {
    if (explicitLearnerId !== undefined) {
      if (explicitLearnerId === null) return null;
      const trimmed = String(explicitLearnerId).trim();
      return trimmed || null;
    }
    const current = this.currentUser?.id ? String(this.currentUser.id).trim() : '';
    return current || null;
  }

  private static resolveAttributionWindowMs(explicitWindowMs?: number): number {
    if (
      typeof explicitWindowMs === 'number' &&
      Number.isFinite(explicitWindowMs) &&
      explicitWindowMs >= 0
    ) {
      return explicitWindowMs;
    }
    return this.attributionWindowMs;
  }

  private static ensureBucket(
    map: Record<string, RecommendationAggregateBucket>,
    key: string
  ): RecommendationAggregateBucket {
    if (!map[key]) {
      map[key] = { impressions: 0, clicks: 0, conversions: 0 };
    }
    return map[key];
  }

  private static recordImpressedCardKey(key: string): boolean {
    if (this.impressedCardKeySet.has(key)) return false;
    this.impressedCardKeySet.add(key);
    this.impressedCardKeys.push(key);
    while (this.impressedCardKeys.length > MAX_IMPRESSED_CARD_KEYS) {
      const evicted = this.impressedCardKeys.shift();
      if (evicted) this.impressedCardKeySet.delete(evicted);
    }
    return true;
  }

  private static recordConvertedCourseKey(key: string): void {
    if (this.convertedCourseKeySet.has(key)) return;
    this.convertedCourseKeySet.add(key);
    this.convertedCourseKeys.push(key);
    while (this.convertedCourseKeys.length > MAX_CONVERTED_COURSE_KEYS) {
      const evicted = this.convertedCourseKeys.shift();
      if (evicted) this.convertedCourseKeySet.delete(evicted);
    }
  }

  private static hasCourseConvertedForActor(
    courseId: string,
    learnerId: string | null,
    sessionId: string
  ): boolean {
    const actorKey = makeActorKey(learnerId, sessionId);
    if (this.convertedCourseKeySet.has(makeConvertedCourseKey(actorKey, courseId))) {
      return true;
    }
    // Check if an in-session guest conversion occurred prior to login in the same session.
    if (learnerId !== null && sessionId) {
      const guestSessionKey = makeConvertedCourseKey(`session:${sessionId}`, courseId);
      if (this.convertedCourseKeySet.has(guestSessionKey)) {
        return true;
      }
    }
    return this.recommendationAttributions.some((attr) => {
      if (attr.courseId !== courseId) return false;
      if (learnerId !== null && attr.learnerId !== null) {
        return attr.learnerId === learnerId;
      }
      return Boolean(attr.sessionId && sessionId && attr.sessionId === sessionId);
    });
  }

  private static isActorMatch(
    click: RecommendationClickRecord,
    learnerId: string | null,
    sessionId: string
  ): boolean {
    if (click.learnerId !== null) {
      return learnerId !== null && click.learnerId === learnerId;
    }
    return Boolean(click.sessionId && sessionId && click.sessionId === sessionId);
  }

  private static findLatestCardImpression(
    courseId: string,
    recommendationId?: string,
    source?: string
  ): RecommendationImpressionRecord | undefined {
    for (let i = this.recentCardImpressions.length - 1; i >= 0; i -= 1) {
      const imp = this.recentCardImpressions[i];
      if (imp.courseId !== courseId) continue;
      if (recommendationId && imp.recommendationId !== recommendationId) continue;
      if (source && imp.source !== source) continue;
      return imp;
    }
    return undefined;
  }

  private static clearInMemoryState(): void {
    this.events = [];
    this.totals = emptyTotals();
    this.sourceMetrics = {};
    this.positionMetrics = {};
    this.impressedCardKeys = [];
    this.impressedCardKeySet.clear();
    this.recentCardImpressions = [];
    this.recentBatchIdMap.clear();
    this.pendingRecommendationClicks = [];
    this.recommendationAttributions = [];
    this.convertedCourseKeys = [];
    this.convertedCourseKeySet.clear();
    this.lastRecommendationId = '';
    this.hasHydrated = false;
    this.activeHydratePromise = null;
  }

  private static schedulePersist(): void {
    const epoch = this.stateEpoch;
    const eventsSnapshot = this.events.slice(-MAX_STORED_EVENTS);
    const stateSnapshot: PersistedAnalyticsState = {
      totals: { ...this.totals },
      sourceMetrics: Object.fromEntries(
        Object.entries(this.sourceMetrics).map(([k, v]) => [k, { ...v }])
      ),
      positionMetrics: Object.fromEntries(
        Object.entries(this.positionMetrics).map(([k, v]) => [k, { ...v }])
      ),
      impressedCardKeys: [...this.impressedCardKeys],
      recentCardImpressions: [...this.recentCardImpressions],
      pendingClicks: [...this.pendingRecommendationClicks],
      attributions: [...this.recommendationAttributions],
      convertedCourseKeys: [...this.convertedCourseKeys],
    };

    this.writeChain = this.writeChain
      .then(async () => {
        if (epoch !== this.stateEpoch) return;
        await AsyncStorage.multiSet([
          [STORAGE_KEY_ANALYTICS_EVENTS, JSON.stringify(eventsSnapshot)],
          [STORAGE_KEY_ANALYTICS_STATE, JSON.stringify(stateSnapshot)],
        ]);
      })
      .catch(() => {});
  }

  static async whenIdle(): Promise<void> {
    await this.writeChain.catch(() => {});
  }

  /**
   * Simulates an app process restart in tests by resetting only in-memory caches while keeping AsyncStorage intact.
   */
  static resetInMemoryCacheForTest(): void {
    this.stateEpoch += 1;
    this.clearInMemoryState();
    this.sessionId = this.generateId('sess');
  }

  static setUser(user: { id: string; username?: string; role?: string } | null): void {
    const previousUserId = this.currentUser?.id ? String(this.currentUser.id) : null;
    const nextUserId = user?.id ? String(user.id) : null;
    if (previousUserId !== null && previousUserId !== nextUserId) {
      // Rotate session boundary on logout or account switch so anonymous session clicks never leak across learners.
      this.sessionId = this.generateId('sess');
    }
    this.currentUser = user;
  }

  static getSessionId(): string {
    return this.sessionId;
  }

  static setSessionId(sessionId: string): string {
    const normalized = String(sessionId || '').trim();
    if (normalized) {
      this.sessionId = normalized;
    }
    return this.sessionId;
  }

  static startNewSession(): string {
    this.sessionId = this.generateId('sess');
    return this.sessionId;
  }

  static setRecommendationAttributionWindowMs(windowMs: number): void {
    if (typeof windowMs === 'number' && Number.isFinite(windowMs) && windowMs >= 0) {
      this.attributionWindowMs = windowMs;
    }
  }

  static getRecommendationAttributionWindowMs(): number {
    return this.attributionWindowMs;
  }

  /**
   * Appends a sanitized business analytics event into the durable local event log (never Sentry breadcrumbs).
   */
  static trackEvent(
    eventName: string,
    properties?: Record<string, any>,
    metadata?: { learnerId?: string | null; sessionId?: string; timestamp?: number }
  ): AnalyticsEventRecord {
    const normalizedProps = sanitizeTelemetryRecord(properties || {}) || {};
    const learnerId =
      metadata?.learnerId !== undefined
        ? this.resolveLearnerId(metadata.learnerId)
        : normalizedProps.learnerId !== undefined
          ? this.resolveLearnerId(normalizedProps.learnerId)
          : this.resolveLearnerId();
    const sessionId =
      (
        metadata?.sessionId ||
        (typeof normalizedProps.sessionId === 'string' ? normalizedProps.sessionId : '') ||
        this.sessionId
      ).trim() || this.sessionId;
    const timestamp =
      typeof metadata?.timestamp === 'number' && Number.isFinite(metadata.timestamp)
        ? metadata.timestamp
        : typeof normalizedProps.timestamp === 'number' &&
            Number.isFinite(normalizedProps.timestamp)
          ? normalizedProps.timestamp
          : Date.now();

    const eventRecord: AnalyticsEventRecord = {
      id: this.generateId('evt'),
      name: String(eventName || 'custom_event').trim() || 'custom_event',
      timestamp,
      learnerId,
      sessionId,
      properties: normalizedProps,
    };

    this.events.push(eventRecord);
    if (this.events.length > MAX_STORED_EVENTS) {
      this.events.shift();
    }
    this.schedulePersist();
    return eventRecord;
  }

  /**
   * Records individual visible course-card impressions for a recommendation surface/source.
   * Increments impressions per newly shown course card so CTR shares the same per-card unit as clicks.
   */
  static trackRecommendationImpression(
    items: (string | RecommendationImpressionItem)[],
    surfaceOrOptions: string | RecommendationImpressionOptions = 'home'
  ): string | null {
    const normalizedItems: { courseId: string; position: number | null }[] = [];
    const seenInCall = new Set<string>();

    items.forEach((entry, index) => {
      const courseId =
        typeof entry === 'string' ? String(entry).trim() : String(entry?.courseId || '').trim();
      if (!courseId || seenInCall.has(courseId)) return;
      seenInCall.add(courseId);
      const position =
        typeof entry === 'string'
          ? index
          : normalizePosition(entry.position !== undefined ? entry.position : index);
      normalizedItems.push({ courseId, position });
    });

    if (normalizedItems.length === 0) return null;

    const options: RecommendationImpressionOptions =
      typeof surfaceOrOptions === 'string'
        ? { surface: surfaceOrOptions, source: surfaceOrOptions }
        : surfaceOrOptions || {};

    const surface = (options.surface || 'home').trim() || 'home';
    const source = (options.source || surface).trim() || surface;
    const learnerId = this.resolveLearnerId(options.learnerId);
    const sessionId = (options.sessionId || this.sessionId).trim() || this.sessionId;
    const timestamp =
      typeof options.timestamp === 'number' && Number.isFinite(options.timestamp)
        ? options.timestamp
        : Date.now();
    const explicitRecId = options.recommendationId?.trim() || '';
    const batchSignature = `${source}:${surface}:${learnerId || 'guest'}:${sessionId}:${normalizedItems.map((i) => i.courseId).join(',')}`;

    let recommendationId = explicitRecId;
    if (!recommendationId) {
      const existingBatchId = this.recentBatchIdMap.get(batchSignature);
      if (existingBatchId) {
        recommendationId = existingBatchId;
      } else {
        recommendationId = this.createRecommendationId(
          source,
          normalizedItems.map((i) => i.courseId)
        );
        this.recentBatchIdMap.set(batchSignature, recommendationId);
        if (this.recentBatchIdMap.size > MAX_RECENT_IMPRESSIONS) {
          const oldestKey = this.recentBatchIdMap.keys().next().value;
          if (oldestKey) this.recentBatchIdMap.delete(oldestKey);
        }
      }
    }
    this.lastRecommendationId = recommendationId;

    let recordedAny = false;
    for (const item of normalizedItems) {
      const cardKey = makeImpressedCardKey(
        recommendationId,
        source,
        surface,
        learnerId,
        sessionId,
        item.courseId
      );
      if (!this.recordImpressedCardKey(cardKey)) {
        continue;
      }

      recordedAny = true;
      this.totals.impressions += 1;
      this.ensureBucket(this.sourceMetrics, source).impressions += 1;
      this.ensureBucket(this.positionMetrics, positionBucketKey(item.position)).impressions += 1;

      const cardImpression: RecommendationImpressionRecord = {
        recommendationId,
        courseId: item.courseId,
        source,
        surface,
        position: item.position,
        learnerId,
        sessionId,
        timestamp,
      };
      this.recentCardImpressions.push(cardImpression);
      if (this.recentCardImpressions.length > MAX_RECENT_IMPRESSIONS) {
        this.recentCardImpressions.shift();
      }

      this.trackEvent(
        'recommendation_impression',
        {
          recommendationId,
          courseId: item.courseId,
          source,
          surface,
          position: item.position,
          learnerId,
          sessionId,
          timestamp,
        },
        { learnerId, sessionId, timestamp }
      );
    }

    if (!recordedAny && !this.hasHydrated) {
      return recommendationId;
    }

    if (recordedAny) {
      this.schedulePersist();
    }

    return recommendationId;
  }

  /**
   * Records a user click on an individual recommended course card with full attribution context.
   */
  static trackRecommendationClick(
    courseId: string,
    categoryOrOptions?: string | RecommendationClickOptions,
    position?: number
  ): RecommendationClickRecord | null {
    const idStr = String(courseId || '').trim();
    if (!idStr) return null;

    const options: RecommendationClickOptions =
      typeof categoryOrOptions === 'string'
        ? { category: categoryOrOptions, position }
        : categoryOrOptions || {};

    const explicitRecId = options.recommendationId?.trim() || undefined;
    const explicitSource = options.source?.trim() || undefined;
    const explicitSurface = options.surface?.trim() || undefined;
    const matchedImpression = this.findLatestCardImpression(idStr, explicitRecId, explicitSource);

    const source = explicitSource || matchedImpression?.source || explicitSurface || 'unknown';
    const surface = explicitSurface || matchedImpression?.surface || source;
    const recommendationId =
      explicitRecId ||
      matchedImpression?.recommendationId ||
      this.createRecommendationId(source, [idStr]);

    const candidatePos = options.position !== undefined ? options.position : position;
    const resolvedPosition = normalizePosition(candidatePos) ?? matchedImpression?.position ?? null;

    const learnerId = this.resolveLearnerId(options.learnerId);
    const sessionId =
      (options.sessionId || matchedImpression?.sessionId || this.sessionId).trim() ||
      this.sessionId;
    const clickTimestamp =
      typeof options.clickTimestamp === 'number' && Number.isFinite(options.clickTimestamp)
        ? options.clickTimestamp
        : Date.now();
    const attributionWindowMs = this.resolveAttributionWindowMs(options.attributionWindowMs);
    const category = options.category?.trim() || undefined;

    const clickRecord: RecommendationClickRecord = {
      clickId: this.generateId('clk'),
      recommendationId,
      courseId: idStr,
      source,
      surface,
      position: resolvedPosition,
      learnerId,
      sessionId,
      clickTimestamp,
      attributionWindowMs,
      ...(category ? { category } : {}),
    };

    this.pendingRecommendationClicks.push(clickRecord);
    if (this.pendingRecommendationClicks.length > MAX_PENDING_CLICKS) {
      this.pendingRecommendationClicks.shift();
    }

    this.totals.clicks += 1;
    this.ensureBucket(this.sourceMetrics, source).clicks += 1;
    this.ensureBucket(this.positionMetrics, positionBucketKey(resolvedPosition)).clicks += 1;

    this.trackEvent(
      'recommendation_click',
      {
        clickId: clickRecord.clickId,
        recommendationId,
        courseId: idStr,
        source,
        surface,
        position: resolvedPosition,
        learnerId,
        sessionId,
        clickTimestamp,
        attributionWindowMs,
        category: category || 'unknown',
      },
      { learnerId, sessionId, timestamp: clickTimestamp }
    );

    return clickRecord;
  }

  /**
   * Attributes an enrollment or purchase conversion strictly to a prior recorded recommendation click
   * within the attribution window, never double-counting repeat conversions on the same course per actor.
   */
  static trackRecommendationConversion(
    courseId: string,
    conversionTypeOrOptions: 'enroll' | 'purchase' | RecommendationConversionOptions = 'enroll',
    extraOptions?: Omit<RecommendationConversionOptions, 'conversionType'>
  ): boolean {
    const idStr = String(courseId || '').trim();
    if (!idStr) return false;

    const options: RecommendationConversionOptions =
      typeof conversionTypeOrOptions === 'string'
        ? { ...(extraOptions || {}), conversionType: conversionTypeOrOptions }
        : conversionTypeOrOptions || {};

    const conversionType: 'enroll' | 'purchase' = options.conversionType || 'enroll';
    const conversionTimestamp =
      typeof options.conversionTimestamp === 'number' &&
      Number.isFinite(options.conversionTimestamp)
        ? options.conversionTimestamp
        : Date.now();
    const learnerId = this.resolveLearnerId(options.learnerId);
    const sessionId = (options.sessionId || this.sessionId).trim() || this.sessionId;
    const filterRecId = options.recommendationId?.trim() || undefined;
    const filterSource = options.source?.trim() || undefined;
    const hasExplicitWindow =
      typeof options.attributionWindowMs === 'number' &&
      Number.isFinite(options.attributionWindowMs) &&
      options.attributionWindowMs >= 0;

    // Never allow the same course to generate repeated conversion counts for the same learner/session.
    if (this.hasCourseConvertedForActor(idStr, learnerId, sessionId)) {
      this.totals.duplicateConversions += 1;
      this.pendingRecommendationClicks = this.pendingRecommendationClicks.filter(
        (click) => !(click.courseId === idStr && this.isActorMatch(click, learnerId, sessionId))
      );
      this.schedulePersist();
      return false;
    }

    let winningIndex = -1;
    let winningClick: RecommendationClickRecord | null = null;
    let winningWindowMs = this.attributionWindowMs;
    const expiredIndices = new Set<number>();

    this.pendingRecommendationClicks.forEach((click, idx) => {
      if (click.courseId !== idStr) return;
      if (!this.isActorMatch(click, learnerId, sessionId)) return;

      const elapsedMs = conversionTimestamp - click.clickTimestamp;
      if (elapsedMs > click.attributionWindowMs) {
        expiredIndices.add(idx);
      }

      if (filterRecId && click.recommendationId !== filterRecId) return;
      if (filterSource && click.source !== filterSource) return;

      const effectiveWindowMs = hasExplicitWindow
        ? Number(options.attributionWindowMs)
        : click.attributionWindowMs;

      if (elapsedMs < 0 || elapsedMs > effectiveWindowMs) {
        return;
      }

      if (
        !winningClick ||
        click.clickTimestamp > winningClick.clickTimestamp ||
        (click.clickTimestamp === winningClick.clickTimestamp && idx > winningIndex)
      ) {
        winningClick = click;
        winningIndex = idx;
        winningWindowMs = effectiveWindowMs;
      }
    });

    if (expiredIndices.size > 0 && !hasExplicitWindow) {
      this.pendingRecommendationClicks = this.pendingRecommendationClicks.filter(
        (_, idx) => !expiredIndices.has(idx)
      );
      this.schedulePersist();
    }

    if (!winningClick || winningIndex === -1) {
      this.totals.unattributedConversions += 1;
      this.trackEvent(
        'recommendation_unattributed_conversion',
        {
          courseId: idStr,
          conversionType,
          conversionTimestamp,
          learnerId,
          sessionId,
        },
        { learnerId, sessionId, timestamp: conversionTimestamp }
      );
      return false;
    }

    const matchedClick: RecommendationClickRecord = winningClick;

    // Mark course converted for this actor (and source guest session if upgrading to authenticated user).
    const actorKey = makeActorKey(learnerId, sessionId);
    this.recordConvertedCourseKey(makeConvertedCourseKey(actorKey, idStr));
    if (learnerId !== null && matchedClick.sessionId) {
      this.recordConvertedCourseKey(
        makeConvertedCourseKey(`session:${matchedClick.sessionId}`, idStr)
      );
    }

    // Consume all pending clicks for this course + actor.
    this.pendingRecommendationClicks = this.pendingRecommendationClicks.filter(
      (click) => !(click.courseId === idStr && this.isActorMatch(click, learnerId, sessionId))
    );

    const resolvedLearnerId = learnerId ?? matchedClick.learnerId;
    const resolvedSessionId = matchedClick.sessionId || sessionId;

    const record: RecommendationAttributionRecord = {
      ...(matchedClick.clickId ? { clickId: matchedClick.clickId } : {}),
      recommendationId: matchedClick.recommendationId,
      courseId: idStr,
      source: matchedClick.source,
      position: matchedClick.position,
      learnerId: resolvedLearnerId,
      sessionId: resolvedSessionId,
      clickTimestamp: matchedClick.clickTimestamp,
      conversionTimestamp,
      attributionWindowMs: winningWindowMs,
      conversionType,
      timeToConversionMs: conversionTimestamp - matchedClick.clickTimestamp,
      ...(matchedClick.category ? { category: matchedClick.category } : {}),
    };

    this.totals.conversions += 1;
    this.ensureBucket(this.sourceMetrics, matchedClick.source).conversions += 1;
    this.ensureBucket(this.positionMetrics, positionBucketKey(matchedClick.position)).conversions +=
      1;
    this.recommendationAttributions.push(record);
    if (this.recommendationAttributions.length > MAX_STORED_ATTRIBUTIONS) {
      this.recommendationAttributions.shift();
    }

    this.trackEvent(
      'recommendation_conversion',
      { ...record },
      { learnerId: resolvedLearnerId, sessionId: resolvedSessionId, timestamp: conversionTimestamp }
    );
    return true;
  }

  static getEvents(filter?: AnalyticsEventFilter): AnalyticsEventRecord[] {
    let list = this.events;
    if (filter?.name) {
      list = list.filter((e) => e.name === filter.name);
    }
    if (filter?.source) {
      list = list.filter((e) => e.properties?.source === filter.source);
    }
    if (filter?.courseId) {
      list = list.filter((e) => e.properties?.courseId === filter.courseId);
    }
    if (filter?.learnerId !== undefined) {
      list = list.filter((e) => e.learnerId === filter.learnerId);
    }
    const copy = list.map((e) => ({ ...e, properties: { ...e.properties } }));
    if (typeof filter?.limit === 'number' && filter.limit > 0) {
      return copy.slice(-filter.limit);
    }
    return copy;
  }

  static async getStoredEvents(): Promise<AnalyticsEventRecord[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY_ANALYTICS_EVENTS);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  static getRecommendationMetrics(): {
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    conversionRate: number;
  } {
    const { impressions, clicks, conversions } = this.totals;
    return {
      impressions,
      clicks,
      conversions,
      ctr: impressions > 0 ? Number((clicks / impressions).toFixed(4)) : 0,
      conversionRate: clicks > 0 ? Number((conversions / clicks).toFixed(4)) : 0,
    };
  }

  static getRecommendationAttributions(): RecommendationAttributionRecord[] {
    return this.recommendationAttributions.map((record) => ({ ...record }));
  }

  static getLastRecommendationAttribution(): RecommendationAttributionRecord | null {
    const last = this.recommendationAttributions[this.recommendationAttributions.length - 1];
    return last ? { ...last } : null;
  }

  static getPendingRecommendationClicks(): RecommendationClickRecord[] {
    return this.pendingRecommendationClicks.map((click) => ({ ...click }));
  }

  static getRecommendationAttributionSummary(): RecommendationAttributionSummary {
    const bySource: Record<string, RecommendationSourceMetrics> = {};
    Object.entries(this.sourceMetrics).forEach(([src, bucket]) => {
      bySource[src] = buildMetricsFromBucket(bucket);
    });

    const byPosition: Record<string, RecommendationSourceMetrics> = {};
    Object.entries(this.positionMetrics).forEach(([pos, bucket]) => {
      byPosition[pos] = buildMetricsFromBucket(bucket);
    });

    const base = this.getRecommendationMetrics();
    return {
      ...base,
      unattributedConversions: this.totals.unattributedConversions,
      duplicateConversions: this.totals.duplicateConversions,
      bySource,
      byPosition,
      totalEventsStored: this.events.length,
    };
  }

  static async hydrate(force: boolean = false): Promise<void> {
    if (this.hasHydrated && !force) return;
    if (this.activeHydratePromise && !force) {
      return this.activeHydratePromise;
    }

    const epoch = this.stateEpoch;
    const run = (async () => {
      try {
        await this.writeChain.catch(() => {});
        if (epoch !== this.stateEpoch) return;
        const entries = await AsyncStorage.multiGet([
          STORAGE_KEY_ANALYTICS_STATE,
          STORAGE_KEY_ANALYTICS_EVENTS,
          LEGACY_STORAGE_KEY_RECOMMENDATION_ATTRIBUTIONS,
        ]);
        if (epoch !== this.stateEpoch) return;

        const rawState = entries[0]?.[1] || null;
        const rawEvents = entries[1]?.[1] || null;
        const rawLegacy = entries[2]?.[1] || null;

        if (rawEvents) {
          try {
            const parsedEvents = JSON.parse(rawEvents);
            if (Array.isArray(parsedEvents)) {
              const seenIds = new Set(this.events.map((e) => e.id));
              const mergedEvents = [...this.events];
              for (const evt of parsedEvents) {
                if (evt && evt.id && !seenIds.has(evt.id)) {
                  seenIds.add(evt.id);
                  mergedEvents.push(evt);
                }
              }
              mergedEvents.sort((a, b) => a.timestamp - b.timestamp);
              this.events = mergedEvents.slice(-MAX_STORED_EVENTS);
            }
          } catch {}
        }

        if (rawState) {
          try {
            const parsed: Partial<PersistedAnalyticsState> = JSON.parse(rawState);
            if (parsed && typeof parsed === 'object') {
              if (parsed.totals) {
                this.totals.impressions += Number(parsed.totals.impressions) || 0;
                this.totals.clicks += Number(parsed.totals.clicks) || 0;
                this.totals.conversions += Number(parsed.totals.conversions) || 0;
                this.totals.unattributedConversions +=
                  Number(parsed.totals.unattributedConversions) || 0;
                this.totals.duplicateConversions += Number(parsed.totals.duplicateConversions) || 0;
              }
              if (parsed.sourceMetrics && typeof parsed.sourceMetrics === 'object') {
                for (const [src, b] of Object.entries(parsed.sourceMetrics)) {
                  const target = this.ensureBucket(this.sourceMetrics, src);
                  target.impressions += Number(b?.impressions) || 0;
                  target.clicks += Number(b?.clicks) || 0;
                  target.conversions += Number(b?.conversions) || 0;
                }
              }
              if (parsed.positionMetrics && typeof parsed.positionMetrics === 'object') {
                for (const [pos, b] of Object.entries(parsed.positionMetrics)) {
                  const target = this.ensureBucket(this.positionMetrics, pos);
                  target.impressions += Number(b?.impressions) || 0;
                  target.clicks += Number(b?.clicks) || 0;
                  target.conversions += Number(b?.conversions) || 0;
                }
              }
              if (Array.isArray(parsed.impressedCardKeys)) {
                parsed.impressedCardKeys.forEach((k) => {
                  if (typeof k === 'string' && k) this.recordImpressedCardKey(k);
                });
              }
              if (Array.isArray(parsed.convertedCourseKeys)) {
                parsed.convertedCourseKeys.forEach((k) => {
                  if (typeof k === 'string' && k) this.recordConvertedCourseKey(k);
                });
              }
              if (Array.isArray(parsed.recentCardImpressions)) {
                this.recentCardImpressions = [
                  ...parsed.recentCardImpressions,
                  ...this.recentCardImpressions,
                ].slice(-MAX_RECENT_IMPRESSIONS);
              }
              this.mergeClicksAndAttributions(
                Array.isArray(parsed.pendingClicks) ? parsed.pendingClicks : [],
                Array.isArray(parsed.attributions) ? parsed.attributions : []
              );
            }
          } catch {}
        } else if (rawLegacy) {
          try {
            const parsedLegacy = JSON.parse(rawLegacy);
            this.mergeClicksAndAttributions(
              Array.isArray(parsedLegacy?.pendingClicks) ? parsedLegacy.pendingClicks : [],
              Array.isArray(parsedLegacy?.attributions) ? parsedLegacy.attributions : []
            );
          } catch {}
        }

        this.hasHydrated = true;
      } catch {}
    })();

    this.activeHydratePromise = run;
    try {
      await run;
    } finally {
      if (this.activeHydratePromise === run) {
        this.activeHydratePromise = null;
      }
    }
  }

  private static mergeClicksAndAttributions(
    storedClicks: RecommendationClickRecord[],
    storedAttributions: RecommendationAttributionRecord[]
  ): void {
    const clickKeys = new Set(
      this.pendingRecommendationClicks.map(
        (c) => `${c.recommendationId}:${c.courseId}:${c.clickTimestamp}:${c.sessionId}`
      )
    );
    storedClicks.forEach((click) => {
      if (!click || !click.courseId) return;
      const key = `${click.recommendationId}:${click.courseId}:${click.clickTimestamp}:${click.sessionId}`;
      if (!clickKeys.has(key)) {
        clickKeys.add(key);
        this.pendingRecommendationClicks.push({
          ...click,
          clickId: click.clickId || this.generateId('clk'),
        });
      }
    });
    this.pendingRecommendationClicks = this.pendingRecommendationClicks
      .sort((a, b) => a.clickTimestamp - b.clickTimestamp)
      .slice(-MAX_PENDING_CLICKS);

    const attrKeys = new Set(
      this.recommendationAttributions.map(
        (a) => `${a.recommendationId}:${a.courseId}:${a.conversionTimestamp}:${a.conversionType}`
      )
    );
    storedAttributions.forEach((attr) => {
      if (!attr || !attr.courseId) return;
      const key = `${attr.recommendationId}:${attr.courseId}:${attr.conversionTimestamp}:${attr.conversionType}`;
      if (!attrKeys.has(key)) {
        attrKeys.add(key);
        this.recommendationAttributions.push(attr);
      }
      const actorKey = makeActorKey(attr.learnerId ?? null, attr.sessionId);
      this.recordConvertedCourseKey(makeConvertedCourseKey(actorKey, attr.courseId));
    });
    this.recommendationAttributions = this.recommendationAttributions
      .sort((a, b) => a.conversionTimestamp - b.conversionTimestamp)
      .slice(-MAX_STORED_ATTRIBUTIONS);
  }

  static resetAnalytics(): void {
    this.stateEpoch += 1;
    this.clearInMemoryState();
    this.attributionWindowMs = DEFAULT_RECOMMENDATION_ATTRIBUTION_WINDOW_MS;
    this.sessionId = this.generateId('sess');
    const epoch = this.stateEpoch;
    this.writeChain = this.writeChain
      .then(async () => {
        if (epoch !== this.stateEpoch) return;
        await AsyncStorage.multiRemove([
          STORAGE_KEY_ANALYTICS_EVENTS,
          STORAGE_KEY_ANALYTICS_STATE,
          LEGACY_STORAGE_KEY_RECOMMENDATION_ATTRIBUTIONS,
        ]);
      })
      .catch(() => {});
  }
}
