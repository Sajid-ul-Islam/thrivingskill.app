import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { CompanionService } from '../api/companionService';
import { parseAppDeepLink } from '../../navigation/deepLinking';
import { RootTab } from '../../types';

export interface NormalizedNotificationTarget {
  screen:
    | 'CourseDetail'
    | 'LessonPlayer'
    | 'YouTubeVideos'
    | 'Home'
    | 'Courses'
    | 'MyLearning'
    | 'Workshops'
    | 'Profile';
  courseId?: string;
  lessonId?: string;
  tab?: RootTab;
  externalUrl?: string;
  rawScreen?: string;
}

function normalizeStringId(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return String(value);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length > 0 && trimmed !== 'undefined' && trimmed !== 'null') {
      return trimmed;
    }
  }
  return undefined;
}

/**
 * Unifies notification tap payloads across TS Mobile Bridge (`course_id`, `screen`, `url`),
 * local Expo scheduler (`courseId`, `lessonId`, `actionRoute`), and deep-link URLs (`postUrl`).
 */
export function normalizeNotificationPayload(
  rawData: Record<string, any> | null | undefined
): NormalizedNotificationTarget | null {
  if (!rawData || typeof rawData !== 'object') return null;

  let courseId = normalizeStringId(
    rawData.courseId ?? rawData.course_id ?? rawData.actionRoute?.courseId
  );
  let lessonId = normalizeStringId(rawData.lessonId ?? rawData.lesson_id);

  const rawUrl = normalizeStringId(rawData.postUrl ?? rawData.post_url ?? rawData.url);
  if (rawUrl) {
    const parsedLink = parseAppDeepLink(rawUrl);
    if (parsedLink?.type === 'lesson') {
      courseId = courseId || parsedLink.courseId;
      lessonId = lessonId || parsedLink.lessonId;
    } else if (parsedLink?.type === 'course') {
      courseId = courseId || parsedLink.courseId;
    } else if (parsedLink?.type === 'youtube') {
      return { screen: 'YouTubeVideos', rawScreen: String(rawData.screen || '') };
    } else if (parsedLink?.type === 'tab') {
      return {
        screen: parsedLink.tab,
        tab: parsedLink.tab,
        courseId,
        rawScreen: String(rawData.screen || ''),
      };
    } else if (/^\d+$/.test(rawUrl) && !courseId) {
      // Admin Push Broadcast Target Course/Post ID field populates both `course_id` and `url`.
      courseId = rawUrl;
    }
  }

  const rawScreen = String(
    rawData.screen ?? rawData.route ?? rawData.tab ?? rawData.actionRoute?.tab ?? ''
  ).trim();
  const screenKey = rawScreen.toLowerCase();

  if (courseId && lessonId) {
    return { screen: 'LessonPlayer', courseId, lessonId, rawScreen };
  }

  if (screenKey === 'lesson' || screenKey === 'lessonplayer' || screenKey === 'lesson_player') {
    if (courseId && lessonId) {
      return { screen: 'LessonPlayer', courseId, lessonId, rawScreen };
    }
    if (courseId) {
      return { screen: 'CourseDetail', courseId, rawScreen };
    }
  }

  if (screenKey === 'youtube' || screenKey === 'youtubevideos' || screenKey === 'videos') {
    return { screen: 'YouTubeVideos', rawScreen };
  }

  if (
    screenKey === 'mylearning' ||
    screenKey === 'my-learning' ||
    screenKey === 'my_learning' ||
    screenKey === 'mycourses' ||
    screenKey === 'my_courses' ||
    screenKey === 'certificates'
  ) {
    return courseId
      ? { screen: 'CourseDetail', courseId, tab: 'MyLearning', rawScreen }
      : { screen: 'MyLearning', tab: 'MyLearning', rawScreen };
  }

  if (
    screenKey === 'workshops' ||
    screenKey === 'workshop' ||
    screenKey === 'masterclass' ||
    screenKey === 'masterclasses' ||
    screenKey === 'live' ||
    screenKey === 'liveclass' ||
    screenKey === 'live_class'
  ) {
    return { screen: 'Workshops', tab: 'Workshops', rawScreen };
  }

  if (screenKey === 'profile' || screenKey === 'account') {
    return { screen: 'Profile', tab: 'Profile', rawScreen };
  }

  if (screenKey === 'course' || screenKey === 'coursedetail' || screenKey === 'course_detail') {
    if (courseId) {
      return { screen: 'CourseDetail', courseId, rawScreen };
    }
    return { screen: 'Courses', tab: 'Courses', rawScreen };
  }

  if (
    screenKey === 'courses' ||
    screenKey === 'catalog' ||
    screenKey === 'explore' ||
    screenKey === 'offers'
  ) {
    return courseId
      ? { screen: 'CourseDetail', courseId, tab: 'Courses', rawScreen }
      : { screen: 'Courses', tab: 'Courses', rawScreen };
  }

  if (courseId) {
    return { screen: 'CourseDetail', courseId, rawScreen };
  }

  if (rawUrl && /^https?:\/\//i.test(rawUrl)) {
    return { screen: 'Home', externalUrl: rawUrl, rawScreen };
  }

  if (screenKey === 'home') {
    return { screen: 'Home', tab: 'Home', rawScreen };
  }

  return null;
}

export interface NotificationSettings {
  streakReminders: boolean;
  liveClassAlerts: boolean;
  courseUpdates: boolean;
  promotionalOffers: boolean;
  recommendations: boolean;
  reminderHour: number; // 0-23 (default: 20 -> 8:00 PM)
}

export type InAppNotificationType =
  | 'assignment'
  | 'workshop'
  | 'certificate'
  | 'system'
  | 'ai'
  | 'course'
  | 'offer'
  | 'recommendation'
  | 'update'
  | 'streak_nudge'
  | 'cert_ready';

export interface InAppNotification {
  id: string;
  title: string;
  body: string;
  type: InAppNotificationType;
  data?: Record<string, any>;
  timestamp: number;
  read: boolean;
  actionCategory?: string;
}

export const ANDROID_NOTIFICATION_CHANNELS = {
  OFFERS: {
    id: 'thrivingskill_offers',
    name: 'Discounts & Promotional Offers',
    importance: 4, // High
    vibration: true,
    sound: true,
  },
  COURSES: {
    id: 'thrivingskill_courses',
    name: 'New Courses Published',
    importance: 4,
    vibration: true,
    sound: true,
  },
  RECOMMENDATIONS: {
    id: 'thrivingskill_recommendations',
    name: 'Automated Recommendations',
    importance: 3, // Default
    vibration: false,
    sound: true,
  },
  UPDATES: {
    id: 'thrivingskill_updates',
    name: 'Platform Updates & Articles',
    importance: 3,
    vibration: false,
    sound: true,
  },
} as const;

export const IOS_NOTIFICATION_CATEGORIES = {
  RECOMMENDATION: {
    identifier: 'TS_RECOMMENDATION_ACTION_CATEGORY',
    actions: [
      { identifier: 'VIEW_COURSE', title: 'View Course 🚀', options: { foreground: true } },
      { identifier: 'BOOKMARK', title: 'Save for Later 🔖', options: { foreground: false } },
      { identifier: 'DISMISS', title: 'Dismiss ✕', options: { destructive: true } },
    ],
  },
  OFFER: {
    identifier: 'TS_OFFER_ACTION_CATEGORY',
    actions: [
      { identifier: 'CLAIM_OFFER', title: 'Claim Offer 🔥', options: { foreground: true } },
      { identifier: 'BOOKMARK', title: 'Bookmark 🔖', options: { foreground: false } },
      { identifier: 'DISMISS', title: 'Dismiss ✕', options: { destructive: true } },
    ],
  },
  COURSE: {
    identifier: 'TS_COURSE_ACTION_CATEGORY',
    actions: [
      { identifier: 'EXPLORE_COURSE', title: 'Explore 🎓', options: { foreground: true } },
      { identifier: 'BOOKMARK', title: 'Save 🔖', options: { foreground: false } },
      { identifier: 'DISMISS', title: 'Dismiss ✕', options: { destructive: true } },
    ],
  },
} as const;

// Configure global notification handler: ensures notifications pop down from the status bar
// as heads-up alerts and remain in the pull-down notification shade even when app is foregrounded
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch {}

const STORAGE_KEY_TOKEN = '@thrivingskill_push_token';
const STORAGE_KEY_SETTINGS = '@thrivingskill_notification_settings';
const STORAGE_KEY_INBOX = '@thrivingskill_notifications_inbox';

const DEFAULT_SETTINGS: NotificationSettings = {
  streakReminders: true,
  liveClassAlerts: true,
  courseUpdates: true,
  promotionalOffers: true,
  recommendations: true,
  reminderHour: 20,
};

export class PushNotificationService {
  private static cachedToken: string | null = null;
  private static listeners = new Set<(notif: InAppNotification) => void>();
  private static channelsInitialized = false;

  /**
   * Subscribe to live in-app notifications (e.g. for Action Notification Panel)
   */
  static subscribe(listener: (notif: InAppNotification) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notifySubscribers(notif: InAppNotification): void {
    this.listeners.forEach((fn) => {
      try {
        fn(notif);
      } catch {}
    });
  }

  /**
   * Registers the device for push notifications, sets up Android notification channels,
   * requests Android 13+ POST_NOTIFICATIONS permission, and returns the device push token.
   */
  static async registerForPushNotifications(): Promise<string | null> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY_TOKEN);
      if (stored) {
        this.cachedToken = stored;
      }

      // Request native system notification permissions (Android 13+ & iOS)
      if (Platform.OS !== 'web') {
        try {
          const { status: existingStatus } = await Notifications.getPermissionsAsync();
          if (existingStatus !== 'granted') {
            await Notifications.requestPermissionsAsync();
          }
        } catch {}
      }

      // Initialize Android Notification Channels (Enables status bar pull-down shade & heads-up drop-down)
      if (Platform.OS === 'android' && !this.channelsInitialized) {
        try {
          await Notifications.setNotificationChannelAsync(ANDROID_NOTIFICATION_CHANNELS.OFFERS.id, {
            name: ANDROID_NOTIFICATION_CHANNELS.OFFERS.name,
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FFB606',
            sound: 'default',
            showBadge: true,
            enableLights: true,
            enableVibrate: true,
          });

          await Notifications.setNotificationChannelAsync(
            ANDROID_NOTIFICATION_CHANNELS.COURSES.id,
            {
              name: ANDROID_NOTIFICATION_CHANNELS.COURSES.name,
              importance: Notifications.AndroidImportance.HIGH,
              vibrationPattern: [0, 200, 200, 200],
              lightColor: '#102F53',
              sound: 'default',
              showBadge: true,
              enableLights: true,
              enableVibrate: true,
            }
          );

          await Notifications.setNotificationChannelAsync(
            ANDROID_NOTIFICATION_CHANNELS.RECOMMENDATIONS.id,
            {
              name: ANDROID_NOTIFICATION_CHANNELS.RECOMMENDATIONS.name,
              importance: Notifications.AndroidImportance.HIGH,
              sound: 'default',
              showBadge: true,
            }
          );

          await Notifications.setNotificationChannelAsync(
            ANDROID_NOTIFICATION_CHANNELS.UPDATES.id,
            {
              name: ANDROID_NOTIFICATION_CHANNELS.UPDATES.name,
              importance: Notifications.AndroidImportance.DEFAULT,
              showBadge: true,
            }
          );

          this.channelsInitialized = true;
        } catch {}
      }

      // Web Notification permission
      if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
        try {
          if (Notification.permission === 'default') {
            await Notification.requestPermission();
          }
        } catch {}
      }

      // Generate or retrieve push token
      if (!this.cachedToken) {
        let deviceToken: string | null = null;
        try {
          const expoToken = await Notifications.getExpoPushTokenAsync().catch(() => null);
          if (expoToken?.data) {
            deviceToken = expoToken.data;
          }
        } catch {}

        if (!deviceToken) {
          deviceToken = `ts_push_${Platform.OS}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
        }

        await AsyncStorage.setItem(STORAGE_KEY_TOKEN, deviceToken);
        this.cachedToken = deviceToken;
      }

      if (this.cachedToken && /^(?:ExponentPushToken|ExpoPushToken)\[/.test(this.cachedToken)) {
        const platform =
          Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';
        CompanionService.registerPushToken(this.cachedToken, platform).catch(() => {});
      }

      return this.cachedToken;
    } catch {
      return null;
    }
  }

  /**
   * Retrieves active notification preferences
   */
  static async getSettings(): Promise<NotificationSettings> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY_SETTINGS);
      if (raw) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
      }
    } catch {}
    return DEFAULT_SETTINGS;
  }

  /**
   * Updates notification preferences
   */
  static async saveSettings(settings: Partial<NotificationSettings>): Promise<void> {
    try {
      const current = await this.getSettings();
      const merged = { ...current, ...settings };
      await AsyncStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(merged));
    } catch {}
  }

  /**
   * Dispatches a notification to:
   * 1. The phone's native Android/iOS status bar notification panel (pull down drawer)
   * 2. In-app student notifications inbox (AsyncStorage)
   * 3. Web Notification API (in browser)
   * 4. In-app action notification subscribers
   */
  static async dispatchNotification(
    title: string,
    body: string,
    type: InAppNotificationType = 'system',
    data?: Record<string, any>,
    actionCategory?: string
  ): Promise<InAppNotification> {
    const notification: InAppNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title,
      body,
      type,
      data,
      timestamp: Date.now(),
      read: false,
      actionCategory,
    };

    // 1. Store in persistent in-app inbox
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY_INBOX);
      const list: InAppNotification[] = raw ? JSON.parse(raw) : [];
      list.unshift(notification);
      await AsyncStorage.setItem(STORAGE_KEY_INBOX, JSON.stringify(list.slice(0, 40)));
    } catch {}

    // 2. Deliver to phone's native notification shade (pull down from status bar)
    if (Platform.OS !== 'web') {
      try {
        const channelId =
          data?.channelId ||
          (type === 'offer'
            ? ANDROID_NOTIFICATION_CHANNELS.OFFERS.id
            : type === 'course'
              ? ANDROID_NOTIFICATION_CHANNELS.COURSES.id
              : type === 'recommendation'
                ? ANDROID_NOTIFICATION_CHANNELS.RECOMMENDATIONS.id
                : ANDROID_NOTIFICATION_CHANNELS.UPDATES.id);

        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            data: { ...data, type, notificationId: notification.id },
            sound: true,
            badge: 1,
            // @ts-ignore Android channel config
            channelId,
          },
          trigger: null, // null delivers immediately into status bar tray
        });
      } catch (nativeErr) {
        // Gracefully catch if native module is unavailable
      }
    }

    // 3. Dispatch to Web Notifications API if in browser
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
      try {
        if (Notification.permission === 'granted') {
          new Notification(title, {
            body,
            icon: data?.thumbnail || '/favicon.png',
            tag: notification.id,
          });
        }
      } catch {}
    }

    // 4. Broadcast to in-app subscribers (Action Notification Panel, Badges)
    this.notifySubscribers(notification);
    return notification;
  }

  private static handledResponseKeys = new Set<string>();

  /**
   * Subscribes to user taps on native notifications for BOTH:
   * - cold start (`Notifications.getLastNotificationResponseAsync`)
   * - warm/background start (`Notifications.addNotificationResponseReceivedListener`)
   */
  static addNativeNotificationResponseListener(
    listener: (data: Record<string, any>) => void
  ): () => void {
    let active = true;

    const dispatchResponse = (response: Notifications.NotificationResponse | null | undefined) => {
      if (!active || !response) return;
      const rawData = response.notification?.request?.content?.data;
      if (!rawData || typeof rawData !== 'object') return;

      const dedupeKey =
        response.notification?.request?.identifier ||
        `${response.actionIdentifier || 'tap'}:${JSON.stringify(rawData)}`;
      if (this.handledResponseKeys.has(dedupeKey)) return;
      this.handledResponseKeys.add(dedupeKey);

      const normalized = normalizeNotificationPayload(rawData);
      const enrichedData: Record<string, any> = {
        ...rawData,
        ...(normalized?.courseId
          ? { courseId: normalized.courseId, course_id: normalized.courseId }
          : {}),
        ...(normalized?.lessonId
          ? { lessonId: normalized.lessonId, lesson_id: normalized.lessonId }
          : {}),
        ...(normalized?.tab ? { tab: normalized.tab } : {}),
        ...(normalized?.screen ? { normalizedScreen: normalized.screen } : {}),
        ...(normalized?.externalUrl ? { postUrl: normalized.externalUrl } : {}),
      };
      listener(enrichedData);
    };

    try {
      const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
        dispatchResponse(response);
      });

      if (typeof Notifications.getLastNotificationResponseAsync === 'function') {
        Notifications.getLastNotificationResponseAsync()
          .then((response) => {
            dispatchResponse(response);
          })
          .catch(() => {});
      }

      return () => {
        active = false;
        subscription.remove();
      };
    } catch {
      return () => {
        active = false;
      };
    }
  }

  /**
   * Dispatches a notification for newly published courses on https://thrivingskill.com
   */
  static async notifyNewCourse(
    course: { id: string; title: string; priceBdt?: number; thumbnail?: string },
    isBangla: boolean = false
  ): Promise<InAppNotification | null> {
    const settings = await this.getSettings();
    if (!settings.courseUpdates) return null;

    const priceText = course.priceBdt ? ` (৳${course.priceBdt})` : '';
    const title = isBangla ? '🎓 নতুন কোর্স প্রকাশিত হয়েছে!' : '🎓 New Course Published!';
    const body = isBangla
      ? `"${course.title}" কোর্সটি এখন উপলব্ধ${priceText}। পেশাগত দক্ষতায় এক ধাপ এগিয়ে যান!`
      : `"${course.title}" is now available${priceText}. Enroll now to level up your career!`;

    return this.dispatchNotification(
      title,
      body,
      'course',
      {
        courseId: course.id,
        courseName: course.title,
        priceBdt: course.priceBdt,
        thumbnail: course.thumbnail,
        channelId: ANDROID_NOTIFICATION_CHANNELS.COURSES.id,
      },
      IOS_NOTIFICATION_CATEGORIES.COURSE.identifier
    );
  }

  /**
   * Dispatches a notification for promotional discount offers & flash sales on the site
   */
  static async notifyCourseOffer(
    course: {
      id: string;
      title: string;
      priceBdt: number;
      originalPriceBdt: number;
      discountPercent: number;
      thumbnail?: string;
    },
    isBangla: boolean = false
  ): Promise<InAppNotification | null> {
    const settings = await this.getSettings();
    if (!settings.promotionalOffers) return null;

    const title = isBangla
      ? `🔥 বিশেষ ছাড়: ${course.discountPercent}% ছাড়!`
      : `🔥 Special Offer: ${course.discountPercent}% OFF!`;
    const body = isBangla
      ? `"${course.title}" এখন মাত্র ৳${course.priceBdt} (পূর্বে ছিল ৳${course.originalPriceBdt})। অফারটি সীমিত সময়ের জন্য!`
      : `Get "${course.title}" for only ৳${course.priceBdt} (Regular: ৳${course.originalPriceBdt}). Limited time discount!`;

    return this.dispatchNotification(
      title,
      body,
      'offer',
      {
        courseId: course.id,
        courseName: course.title,
        priceBdt: course.priceBdt,
        originalPriceBdt: course.originalPriceBdt,
        discountPercent: course.discountPercent,
        thumbnail: course.thumbnail,
        channelId: ANDROID_NOTIFICATION_CHANNELS.OFFERS.id,
      },
      IOS_NOTIFICATION_CATEGORIES.OFFER.identifier
    );
  }

  /**
   * Dispatches a notification for new platform articles & updates from the site
   */
  static async notifySiteUpdate(
    post: { id: number; title: string; link?: string },
    isBangla: boolean = false
  ): Promise<InAppNotification | null> {
    const settings = await this.getSettings();
    if (!settings.courseUpdates) return null;

    const title = isBangla
      ? '📢 নতুন আর্টিকেল ও ক্যারিয়ার আপডেট'
      : '📢 Career Insight & Platform Update';
    const body = isBangla
      ? `"${post.title}" – থ্রাইভিং স্কিলস-এর নতুন ব্লগ পোস্টটি পড়ুন এবং জানুন গুরুত্বপূর্ণ ইনসাইট!`
      : `"${post.title}" – Read the latest expert insights and skills guide on Thriving Skills.`;

    return this.dispatchNotification(title, body, 'update', {
      postId: post.id,
      postTitle: post.title,
      postUrl: post.link,
      channelId: ANDROID_NOTIFICATION_CHANNELS.UPDATES.id,
    });
  }

  /**
   * Dispatches an automated personalized course recommendation
   */
  static async notifyCourseRecommendation(
    course: { id: string; title: string; reason: string; thumbnail?: string },
    isBangla: boolean = false
  ): Promise<InAppNotification | null> {
    const settings = await this.getSettings();
    if (!settings.recommendations) return null;

    const title = isBangla ? '✨ আপনার জন্য বিশেষ কোর্স পরামর্শ' : '✨ Recommended For You';
    const body = isBangla
      ? `${course.reason}: "${course.title}" কোর্সটি দিয়ে আপনার দক্ষতা একধাপ এগিয়ে নিন।`
      : `${course.reason}: Accelerate your learning journey with "${course.title}".`;

    return this.dispatchNotification(
      title,
      body,
      'recommendation',
      {
        courseId: course.id,
        courseName: course.title,
        recommendationReason: course.reason,
        thumbnail: course.thumbnail,
        channelId: ANDROID_NOTIFICATION_CHANNELS.RECOMMENDATIONS.id,
      },
      IOS_NOTIFICATION_CATEGORIES.RECOMMENDATION.identifier
    );
  }

  /**
   * Schedules a daily streak retention reminder (rate-limited to max once per calendar day)
   */
  static async scheduleDailyStreakNudge(
    isBangla: boolean = false,
    force: boolean = false
  ): Promise<void> {
    const settings = await this.getSettings();
    if (!settings.streakReminders) return;

    const STORAGE_KEY_LAST_NUDGE = '@thrivingskill_last_streak_nudge_date';
    if (!force) {
      try {
        const lastDate = await AsyncStorage.getItem(STORAGE_KEY_LAST_NUDGE);
        const todayStr = new Date().toDateString();
        if (lastDate === todayStr) {
          // Already nudged today; do not spam on startup
          return;
        }
      } catch {}
    }

    await this.dispatchNotification(
      isBangla ? '🔥 আপনার স্টাডি স্ট্রিক ধরে রাখুন!' : '🔥 Keep Your Daily Learning Streak!',
      isBangla
        ? 'প্রতিদিন মাত্র ১০ মিনিট শিখে পেশাগত দক্ষতার শীর্ষে থাকুন। আজকের লেকচার শুরু করুন!'
        : 'Dedicate just 10 minutes today to maintain your executive learning streak.',
      'streak_nudge',
      { type: 'streak_nudge' }
    );

    try {
      await AsyncStorage.setItem(STORAGE_KEY_LAST_NUDGE, new Date().toDateString());
    } catch {}
  }

  /**
   * Notifies user that their certificate is unlocked
   */
  static async notifyCertificateReady(
    courseTitle: string,
    isBangla: boolean = false
  ): Promise<void> {
    await this.dispatchNotification(
      isBangla ? '🎓 ভেরিফাইড সার্টিফিকেট প্রস্তুত!' : '🎓 Verified Certificate Ready!',
      isBangla
        ? `অভিনন্দন! "${courseTitle}" কোর্সের অফিসিয়াল সার্টিফিকেট এখন লিংকডইনে শেয়ারের জন্য প্রস্তুত।`
        : `Congratulations! Your verified credential for "${courseTitle}" is ready to share on LinkedIn.`,
      'cert_ready',
      { type: 'cert_ready', courseTitle }
    );
  }

  /**
   * Retrieves student in-app notifications
   */
  static async getNotifications(): Promise<InAppNotification[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY_INBOX);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /**
   * Marks all notifications as read
   */
  static async markAllAsRead(): Promise<void> {
    try {
      const list = await this.getNotifications();
      const updated = list.map((item) => ({ ...item, read: true }));
      await AsyncStorage.setItem(STORAGE_KEY_INBOX, JSON.stringify(updated));
    } catch {}
  }

  /**
   * Removes a single notification by id from the persistent inbox (Easy Remover)
   */
  static async removeNotification(id: string): Promise<void> {
    try {
      const list = await this.getNotifications();
      const updated = list.filter((item) => item.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY_INBOX, JSON.stringify(updated));
    } catch {}
  }

  /**
   * Clears all notifications from persistent inbox (Easy Remover)
   */
  static async clearAllNotifications(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY_INBOX);
    } catch {}
  }

  /**
   * Returns unread notifications count
   */
  static async getUnreadCount(): Promise<number> {
    try {
      const list = await this.getNotifications();
      return list.filter((item) => !item.read).length;
    } catch {
      return 0;
    }
  }
}
