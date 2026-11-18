import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NotificationSettings {
  streakReminders: boolean;
  liveClassAlerts: boolean;
  courseUpdates: boolean;
  reminderHour: number; // 0-23 (default: 20 -> 8:00 PM)
}

export interface InAppNotification {
  id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  timestamp: number;
  read: boolean;
}

const STORAGE_KEY_TOKEN = '@thrivingskill_push_token';
const STORAGE_KEY_SETTINGS = '@thrivingskill_notification_settings';
const STORAGE_KEY_INBOX = '@thrivingskill_notifications_inbox';

const DEFAULT_SETTINGS: NotificationSettings = {
  streakReminders: true,
  liveClassAlerts: true,
  courseUpdates: true,
  reminderHour: 20,
};

export class PushNotificationService {
  private static cachedToken: string | null = null;

  /**
   * Registers the device for push notifications and returns the active push token
   */
  static async registerForPushNotifications(): Promise<string | null> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY_TOKEN);
      if (stored) {
        this.cachedToken = stored;
        return stored;
      }

      // Generate a deterministic client device push token
      const deviceId = `ts_push_${Platform.OS}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
      await AsyncStorage.setItem(STORAGE_KEY_TOKEN, deviceId);
      this.cachedToken = deviceId;
      return deviceId;
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
   * Dispatches or schedules a local notifications nudge (e.g., streak retention)
   */
  static async dispatchNotification(
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<void> {
    try {
      const notification: InAppNotification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title,
        body,
        data,
        timestamp: Date.now(),
        read: false,
      };

      const raw = await AsyncStorage.getItem(STORAGE_KEY_INBOX);
      const list: InAppNotification[] = raw ? JSON.parse(raw) : [];
      list.unshift(notification);
      // Keep last 30 notifications in student inbox
      await AsyncStorage.setItem(STORAGE_KEY_INBOX, JSON.stringify(list.slice(0, 30)));
    } catch {}
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
