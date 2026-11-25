import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PushNotificationService,
  InAppNotification,
  InAppNotificationType,
} from './pushNotificationService';

export type NotificationPriority = 'urgent' | 'high' | 'normal' | 'low';

export interface QueuedNotification {
  id: string;
  title: string;
  body: string;
  type: InAppNotificationType;
  priority: NotificationPriority;
  data?: Record<string, any>;
  actionCategory?: string;
  createdAt: number;
  scheduledForHour?: number;
}

export interface LearnerHabitProfile {
  hourlyActivity: number[]; // 24 buckets representing 0..23 hours
  totalSessionsRecorded: number;
  lastActiveTimestamp: number;
  preferredStudyHour: number; // default: 20 (8:00 PM)
}

export interface QueueDeliveryStats {
  queuedCount: number;
  deliveriesToday: number;
  lastDeliveredTimestamp: number;
  isStartupThrottled: boolean;
  peakHours: number[];
}

const STORAGE_KEY_QUEUE = '@thrivingskill_notif_queue_v1';
const STORAGE_KEY_HABIT = '@thrivingskill_habit_profile_v1';
const STORAGE_KEY_THROTTLE = '@thrivingskill_notif_throttle_v1';

// Guardrails & Pacing Constants
export const MIN_NOTIFICATION_INTERVAL_MS = 45 * 60 * 1000; // 45 minutes between automatic in-app alerts
export const MAX_DAILY_NOTIFICATIONS = 3; // Maximum 3 automated alerts per 24 hours to avoid annoyance
export const STARTUP_GRACE_WINDOW_MS = 30 * 1000; // First 30s of app launch considered "startup"

const DEFAULT_HABIT_PROFILE: LearnerHabitProfile = {
  hourlyActivity: Array(24).fill(0),
  totalSessionsRecorded: 0,
  lastActiveTimestamp: Date.now(),
  preferredStudyHour: 20,
};

// Executive default receptive hours (10 AM morning, 3 PM afternoon break, 8 PM evening study)
const DEFAULT_RECEPTIVE_HOURS = [10, 15, 20];

export class HabitNotificationQueue {
  private static startupNotificationShown = false;
  private static appLaunchTimestamp = Date.now();
  private static queueProcessorTimer: ReturnType<typeof setTimeout> | null = null;
  private static isProcessing = false;

  /**
   * Resets session startup state (useful for app boot initialization and test suites)
   */
  static resetStartupSession(): void {
    this.startupNotificationShown = false;
    this.appLaunchTimestamp = Date.now();
  }

  // =========================================================================
  // 1. HABIT TRACKING & RECEPTIVE LEARNING WINDOWS
  // =========================================================================

  /**
   * Records user activity at the current time to build the learner's habit profile
   */
  static async recordUserActivity(): Promise<LearnerHabitProfile> {
    try {
      const profile = await this.getHabitProfile();
      const currentHour = new Date().getHours();

      // Increment frequency for current hour
      profile.hourlyActivity[currentHour] = (profile.hourlyActivity[currentHour] || 0) + 1;
      profile.totalSessionsRecorded += 1;
      profile.lastActiveTimestamp = Date.now();

      await AsyncStorage.setItem(STORAGE_KEY_HABIT, JSON.stringify(profile));
      return profile;
    } catch {
      return DEFAULT_HABIT_PROFILE;
    }
  }

  /**
   * Retrieves the stored learner habit profile
   */
  static async getHabitProfile(): Promise<LearnerHabitProfile> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY_HABIT);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.hourlyActivity) && parsed.hourlyActivity.length === 24) {
          return parsed;
        }
      }
    } catch {}
    return { ...DEFAULT_HABIT_PROFILE, hourlyActivity: [...DEFAULT_HABIT_PROFILE.hourlyActivity] };
  }

  /**
   * Computes the learner's top peak activity hours based on empirical habit history.
   * If learner is new (< 3 sessions), returns executive default receptive hours.
   */
  static async getPeakLearningHours(): Promise<number[]> {
    const profile = await this.getHabitProfile();

    if (profile.totalSessionsRecorded < 3) {
      return DEFAULT_RECEPTIVE_HOURS;
    }

    // Rank hours by activity count
    const ranked = profile.hourlyActivity
      .map((count, hour) => ({ hour, count }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count);

    if (ranked.length === 0) {
      return DEFAULT_RECEPTIVE_HOURS;
    }

    // Return top 2 to 3 peak hours
    return ranked.slice(0, 3).map((r) => r.hour);
  }

  /**
   * Checks whether the current moment is a receptive learning habit window for the learner.
   * Considers peak habit hours (+/- 1 hour tolerance) or the user's configured preferred reminder hour.
   */
  static async isReceptiveTimeNow(): Promise<boolean> {
    const currentHour = new Date().getHours();
    const peakHours = await this.getPeakLearningHours();
    const profile = await this.getHabitProfile();

    // Check if within +/- 1 hour of any peak habit hour
    const matchesPeak = peakHours.some((peak) => Math.abs(peak - currentHour) <= 1);
    if (matchesPeak) return true;

    // Check configured study hour
    if (Math.abs(profile.preferredStudyHour - currentHour) <= 1) {
      return true;
    }

    return false;
  }

  // =========================================================================
  // 2. THROTTLING & ANTI-ANNOYANCE BUDGETS
  // =========================================================================

  /**
   * Checks delivery throttle state: cooldown interval, daily budget, and startup limits
   */
  static async canDeliverNotificationNow(priority: NotificationPriority = 'normal'): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    // 1. Urgent priority (live classes, certificates, purchase) ALWAYS bypasses cooldown
    if (priority === 'urgent') {
      return { allowed: true };
    }

    const now = Date.now();
    const isStartupPhase = now - this.appLaunchTimestamp < STARTUP_GRACE_WINDOW_MS;

    // 2. Startup Guard: Never show more than 1 notification during app startup!
    if (isStartupPhase && this.startupNotificationShown) {
      return {
        allowed: false,
        reason: 'Startup throttle active: Maximum 1 notification allowed during app launch',
      };
    }

    // 3. Daily delivery budget & cooldown check
    try {
      const rawThrottle = await AsyncStorage.getItem(STORAGE_KEY_THROTTLE);
      const throttleData = rawThrottle
        ? JSON.parse(rawThrottle)
        : { lastDeliveredTimestamp: 0, deliveriesToday: 0, dateKey: new Date().toDateString() };

      const todayKey = new Date().toDateString();
      if (throttleData.dateKey !== todayKey) {
        throttleData.deliveriesToday = 0;
        throttleData.dateKey = todayKey;
      }

      // Check daily delivery cap
      if (throttleData.deliveriesToday >= MAX_DAILY_NOTIFICATIONS && priority !== 'high') {
        return {
          allowed: false,
          reason: `Daily notification budget reached (${throttleData.deliveriesToday}/${MAX_DAILY_NOTIFICATIONS})`,
        };
      }

      // Check cooldown interval between notifications
      const timeSinceLast = now - (throttleData.lastDeliveredTimestamp || 0);
      if (timeSinceLast < MIN_NOTIFICATION_INTERVAL_MS && priority !== 'high') {
        const remainingMinutes = Math.ceil((MIN_NOTIFICATION_INTERVAL_MS - timeSinceLast) / 60000);
        return {
          allowed: false,
          reason: `Pacing cooldown active: ${remainingMinutes}m remaining before next notification`,
        };
      }

      return { allowed: true };
    } catch {
      return { allowed: true };
    }
  }

  /**
   * Records a successful notification delivery to update throttle state
   */
  static async recordDelivery(priority: NotificationPriority = 'normal'): Promise<void> {
    const now = Date.now();
    this.startupNotificationShown = true;

    try {
      const rawThrottle = await AsyncStorage.getItem(STORAGE_KEY_THROTTLE);
      const throttleData = rawThrottle
        ? JSON.parse(rawThrottle)
        : { lastDeliveredTimestamp: 0, deliveriesToday: 0, dateKey: new Date().toDateString() };

      const todayKey = new Date().toDateString();
      if (throttleData.dateKey !== todayKey) {
        throttleData.deliveriesToday = 0;
        throttleData.dateKey = todayKey;
      }

      throttleData.deliveriesToday += 1;
      throttleData.lastDeliveredTimestamp = now;

      await AsyncStorage.setItem(STORAGE_KEY_THROTTLE, JSON.stringify(throttleData));
    } catch {}
  }

  // =========================================================================
  // 3. PERSISTENT NOTIFICATION QUEUE
  // =========================================================================

  /**
   * Retrieves all items currently waiting in the queue
   */
  static async getQueue(): Promise<QueuedNotification[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY_QUEUE);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /**
   * Saves updated queue items
   */
  private static async saveQueue(queue: QueuedNotification[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(queue.slice(0, 30)));
    } catch {}
  }

  /**
   * Enqueues a notification into the smart queue or delivers immediately if urgent/ready
   */
  static async enqueueOrDispatch(
    title: string,
    body: string,
    type: InAppNotificationType = 'system',
    priority: NotificationPriority = 'normal',
    data?: Record<string, any>,
    actionCategory?: string
  ): Promise<{ status: 'delivered' | 'queued'; notificationId: string }> {
    const notificationId = `q_notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Urgent notifications bypass the queue completely
    if (priority === 'urgent') {
      await PushNotificationService.dispatchNotification(title, body, type, data, actionCategory);
      await this.recordDelivery('urgent');
      return { status: 'delivered', notificationId };
    }

    // Check throttle and habit receptivity
    const throttleCheck = await this.canDeliverNotificationNow(priority);
    const isReceptive = await this.isReceptiveTimeNow();

    if (throttleCheck.allowed && isReceptive) {
      // Deliver immediately
      await PushNotificationService.dispatchNotification(title, body, type, data, actionCategory);
      await this.recordDelivery(priority);
      return { status: 'delivered', notificationId };
    }

    // Otherwise, place into queue
    const queuedItem: QueuedNotification = {
      id: notificationId,
      title,
      body,
      type,
      priority,
      data,
      actionCategory,
      createdAt: Date.now(),
    };

    const currentQueue = await this.getQueue();

    // Deduplicate: avoid queuing identical items (same courseId and type)
    const exists = currentQueue.some(
      (item) => item.type === type && item.data?.courseId === data?.courseId
    );

    if (!exists) {
      // Sort by priority (urgent > high > normal > low)
      const priorityWeights: Record<NotificationPriority, number> = {
        urgent: 4,
        high: 3,
        normal: 2,
        low: 1,
      };

      currentQueue.push(queuedItem);
      currentQueue.sort((a, b) => priorityWeights[b.priority] - priorityWeights[a.priority]);

      await this.saveQueue(currentQueue);
    }

    // Schedule processor check
    this.scheduleQueueProcessing();

    return { status: 'queued', notificationId };
  }

  /**
   * Processes the queue: checks if conditions are right to deliver the next queued notification
   */
  static async processQueue(): Promise<InAppNotification | null> {
    if (this.isProcessing) return null;
    this.isProcessing = true;

    try {
      const queue = await this.getQueue();
      if (queue.length === 0) return null;

      const topItem = queue[0];
      const throttleCheck = await this.canDeliverNotificationNow(topItem.priority);
      const isReceptive = await this.isReceptiveTimeNow();

      // Check if allowed to deliver
      if (throttleCheck.allowed && (isReceptive || topItem.priority === 'high')) {
        // Dequeue item
        queue.shift();
        await this.saveQueue(queue);

        // Deliver notification
        const delivered = await PushNotificationService.dispatchNotification(
          topItem.title,
          topItem.body,
          topItem.type,
          topItem.data,
          topItem.actionCategory
        );

        await this.recordDelivery(topItem.priority);
        return delivered;
      }

      return null;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Schedules a delayed queue check
   */
  static scheduleQueueProcessing(delayMs: number = 60000): void {
    if (this.queueProcessorTimer) {
      clearTimeout(this.queueProcessorTimer);
    }

    this.queueProcessorTimer = setTimeout(() => {
      this.processQueue().catch(() => {});
    }, delayMs);
  }

  /**
   * Cleans up running timers
   */
  static cleanup(): void {
    if (this.queueProcessorTimer) {
      clearTimeout(this.queueProcessorTimer);
      this.queueProcessorTimer = null;
    }
  }

  /**
   * Clears all queued items
   */
  static async clearQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY_QUEUE);
    } catch {}
  }

  /**
   * Retrieves summary statistics for telemetry & inspection
   */
  static async getStats(): Promise<QueueDeliveryStats> {
    const queue = await this.getQueue();
    const peakHours = await this.getPeakLearningHours();

    let deliveriesToday = 0;
    let lastDeliveredTimestamp = 0;

    try {
      const rawThrottle = await AsyncStorage.getItem(STORAGE_KEY_THROTTLE);
      if (rawThrottle) {
        const parsed = JSON.parse(rawThrottle);
        deliveriesToday = parsed.deliveriesToday || 0;
        lastDeliveredTimestamp = parsed.lastDeliveredTimestamp || 0;
      }
    } catch {}

    const now = Date.now();
    const isStartupThrottled =
      now - this.appLaunchTimestamp < STARTUP_GRACE_WINDOW_MS && this.startupNotificationShown;

    return {
      queuedCount: queue.length,
      deliveriesToday,
      lastDeliveredTimestamp,
      isStartupThrottled,
      peakHours,
    };
  }
}
