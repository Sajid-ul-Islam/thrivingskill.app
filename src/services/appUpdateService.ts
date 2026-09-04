import * as Updates from 'expo-updates';

export interface AppUpdateStatus {
  isChecking: boolean;
  isAvailable: boolean;
  isDownloaded: boolean;
  error: string | null;
  updateId: string | null;
  channel: string | null;
  runtimeVersion: string | null;
  isEmbeddedLaunch: boolean;
  isEnabled: boolean;
  lastChecked: string | null;
}

export class AppUpdateService {
  /**
   * Get current OTA metadata
   */
  public static getUpdateInfo() {
    return {
      isEnabled: Updates.isEnabled,
      updateId: Updates.updateId || null,
      channel: Updates.channel || 'production',
      runtimeVersion: Updates.runtimeVersion || '1.0.0',
      isEmbeddedLaunch: Updates.isEmbeddedLaunch,
      createdAt: Updates.createdAt ? new Date(Updates.createdAt).toLocaleDateString() : 'Initial Build',
    };
  }

  /**
   * Check for updates over-the-air (OTA).
   * In standalone APKs, this contacts the EAS Update servers.
   * In Expo Go, it gracefully reports that development mode is active.
   */
  public static async checkForUpdate(): Promise<{
    isAvailable: boolean;
    isDownloaded: boolean;
    message: string;
  }> {
    if (!Updates.isEnabled) {
      return {
        isAvailable: false,
        isDownloaded: false,
        message: 'Expo Go / Dev Mode active. Code updates reload automatically via Metro.',
      };
    }

    try {
      const check = await Updates.checkForUpdateAsync();

      if (check.isAvailable) {
        // Fetch and download the new bundle in background
        const fetchResult = await Updates.fetchUpdateAsync();
        if (fetchResult.isNew) {
          return {
            isAvailable: true,
            isDownloaded: true,
            message: 'A new update was downloaded! Restart now to apply latest features.',
          };
        }
      }

      return {
        isAvailable: false,
        isDownloaded: false,
        message: 'You are on the latest version of Thriving Skills.',
      };
    } catch (err: any) {
      return {
        isAvailable: false,
        isDownloaded: false,
        message: err?.message || 'Failed to check for updates. Check internet connection.',
      };
    }
  }

  /**
   * Reload the app immediately to apply newly fetched JS/TSX components
   */
  public static async reloadApp(): Promise<void> {
    if (Updates.isEnabled) {
      await Updates.reloadAsync();
    }
  }
}
