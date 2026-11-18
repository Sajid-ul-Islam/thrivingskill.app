import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

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
          let finalStatus = existingStatus;
          if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
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

          await Notifications.setNotificationChannelAsync(ANDROID_NOTIFICATION_CHANNELS.COURSES.id, {
            name: ANDROID_NOTIFICATION_CHANNELS.COURSES.name,
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 200, 200, 200],
            lightColor: '#102F53',
            sound: 'default',
            showBadge: true,
            enableLights: true,
            enableVibrate: true,
          });

          await Notifications.setNotificationChannelAsync(ANDROID_NOTIFICATION_CHANNELS.RECOMMENDATIONS.id, {
            name: ANDROID_NOTIFICATION_CHANNELS.RECOMMENDATIONS.name,
            importance: Notifications.AndroidImportance.HIGH,
            sound: 'default',
            showBadge: true,
          });

          await Notifications.setNotificationChannelAsync(ANDROID_NOTIFICATION_CHANNELS.UPDATES.id, {
            name: ANDROID_NOTIFICATION_CHANNELS.UPDATES.name,
            importance: Notifications.AndroidImportance.DEFAULT,
            showBadge: true,
          });

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
        const channelId = data?.channelId || (
          type === 'offer'
            ? ANDROID_NOTIFICATION_CHANNELS.OFFERS.id
            : type === 'course'
            ? ANDROID_NOTIFICATION_CHANNELS.COURSES.id
            : type === 'recommendation'
            ? ANDROID_NOTIFICATION_CHANNELS.RECOMMENDATIONS.id
            : ANDROID_NOTIFICATION_CHANNELS.UPDATES.id
        );

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

  /**
   * Subscribes to user taps on the phone's native status bar drop-down notification
   */
  static addNativeNotificationResponseListener(
    listener: (data: Record<string, any>) => void
  ): () => void {
    try {
      const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response?.notification?.request?.content?.data;
        if (data) {
          listener(data);
        }
      });
      return () => {
        subscription.remove();
      };
    } catch {
      return () => {};
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

    const title = isBangla ? '📢 নতুন আর্টিকেল ও ক্যারিয়ার আপডেট' : '📢 Career Insight & Platform Update';
    const body = isBangla
      ? `"${post.title}" – থ্রাইভিং স্কিলস-এর নতুন ব্লগ পোস্টটি পড়ুন এবং জানুন গুরুত্বপূর্ণ ইনসাইট!`
      : `"${post.title}" – Read the latest expert insights and skills guide on Thriving Skills.`;

    return this.dispatchNotification(
      title,
      body,
      'update',
      {
        postId: post.id,
        postTitle: post.title,
        postUrl: post.link,
        channelId: ANDROID_NOTIFICATION_CHANNELS.UPDATES.id,
      }
    );
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
   * Schedules a daily streak retention reminder
   */
  static async scheduleDailyStreakNudge(isBangla: boolean = false): Promise<void> {
    const settings = await this.getSettings();
    if (!settings.streakReminders) return;

    await this.dispatchNotification(
      isBangla ? '🔥 আপনার স্টাডি স্ট্রিক ধরে রাখুন!' : '🔥 Keep Your Daily Learning Streak!',
      isBangla
        ? 'প্রতিদিন মাত্র ১০ মিনিট শিখে পেশাগত দক্ষতার শীর্ষে থাকুন। আজকের লেকচার শুরু করুন!'
        : 'Dedicate just 10 minutes today to maintain your executive learning streak.',
      'streak_nudge',
      { type: 'streak_nudge' }
    );
  }

  /**
   * Notifies user that their certificate is unlocked
   */
  static async notifyCertificateReady(courseTitle: string, isBangla: boolean = false): Promise<void> {
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
}
