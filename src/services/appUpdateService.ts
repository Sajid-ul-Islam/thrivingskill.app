import * as Updates from 'expo-updates';
import { Linking } from 'react-native';
import { Env } from '../config/env';

export interface AppUpdateStatus {
  isChecking: boolean;
  isAvailable: boolean;
  isDownloaded: boolean;
  isApkUpdateAvailable?: boolean;
  apkDownloadUrl?: string | null;
  changelog?: string | null;
  latestVersion?: string | null;
  error: string | null;
  updateId: string | null;
  channel: string | null;
  runtimeVersion: string | null;
  isEmbeddedLaunch: boolean;
  isEnabled: boolean;
  lastChecked: string | null;
}

export interface CheckUpdateResult {
  isAvailable: boolean;
  isDownloaded: boolean;
  isApkUpdateAvailable?: boolean;
  apkDownloadUrl?: string | null;
  changelog?: string | null;
  latestVersion?: string | null;
  message: string;
}

export class AppUpdateService {
  public static readonly CURRENT_VERSION = '1.4.0';
  public static readonly CURRENT_VERSION_CODE = 10400;

  /**
   * Get current OTA & build metadata
   */
  public static getUpdateInfo() {
    return {
      isEnabled: Updates.isEnabled,
      updateId: Updates.updateId || null,
      channel: Updates.channel || 'production',
      runtimeVersion: Updates.runtimeVersion || '1.4.0',
      isEmbeddedLaunch: Updates.isEmbeddedLaunch,
      createdAt: Updates.createdAt
        ? new Date(Updates.createdAt).toLocaleDateString()
        : 'Initial Build',
      currentVersion: this.CURRENT_VERSION,
    };
  }

  /**
   * Check for updates across both channels:
   * 1. EAS OTA updates (JS bundle updates pushed over-the-air)
   * 2. Self-Hosted Server / Direct APK updates (from thrivingskill.com)
   */
  public static async checkForUpdate(): Promise<CheckUpdateResult> {
    let otaDownloaded = false;
    let otaMessage = '';

    // 1. Check EAS Over-The-Air (OTA) updates if enabled in standalone APK
    if (Updates.isEnabled) {
      try {
        const check = await Updates.checkForUpdateAsync();
        if (check.isAvailable) {
          const fetchResult = await Updates.fetchUpdateAsync();
          if (fetchResult.isNew) {
            otaDownloaded = true;
            otaMessage = 'A new OTA update was downloaded! Restart now to apply latest features.';
          }
        }
      } catch (err: any) {
        // Fall back gracefully to self-hosted update check
      }
    }

    if (otaDownloaded) {
      return {
        isAvailable: true,
        isDownloaded: true,
        message: otaMessage,
      };
    }

    // 2. Check Self-Hosted / Direct APK Update endpoint from thrivingskill.com
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const updateEndpoint = `${Env.SITE_URL}/wp-json/thrivingskill/v1/app-update`;
      const res = await fetch(updateEndpoint, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      }).catch(() => null);

      clearTimeout(timeoutId);

      if (res && res.ok) {
        const data = await res.json();
        if (data && data.versionCode && data.versionCode > this.CURRENT_VERSION_CODE) {
          return {
            isAvailable: true,
            isDownloaded: false,
            isApkUpdateAvailable: true,
            apkDownloadUrl: data.apkUrl || `${Env.SITE_URL}/downloads/thrivingskill-latest.apk`,
            changelog:
              data.changelog ||
              'A new native APK update is available with enhanced performance and features.',
            latestVersion: data.version || data.latestVersion || '1.4.1',
            message: `Version ${data.version || data.latestVersion || '1.4.1'} is available for download!`,
          };
        }
      }
    } catch {
      // Graceful fallback
    }

    if (!Updates.isEnabled) {
      return {
        isAvailable: false,
        isDownloaded: false,
        message: 'Expo Go / Dev Mode active. Code updates reload automatically via Metro.',
      };
    }

    return {
      isAvailable: false,
      isDownloaded: false,
      message: 'You are on the latest version of Thriving Skills (v1.4.0).',
    };
  }

  /**
   * Reload the app immediately to apply newly fetched JS/TSX components
   */
  public static async reloadApp(): Promise<void> {
    if (Updates.isEnabled) {
      await Updates.reloadAsync();
    }
  }

  /**
   * Download / Open Self-Hosted APK
   */
  public static async downloadApk(url?: string | null): Promise<void> {
    const targetUrl = url || `${Env.SITE_URL}/downloads/thrivingskill-latest.apk`;
    const supported = await Linking.canOpenURL(targetUrl);
    if (supported) {
      await Linking.openURL(targetUrl);
    }
  }
}
