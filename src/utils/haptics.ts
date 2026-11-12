import { Platform, Vibration } from 'react-native';

export type HapticKind = 'selection' | 'light' | 'medium' | 'success' | 'warning' | 'error' | 'none';

/**
 * Triggers lightweight, non-intrusive tactile feedback across iOS & Android.
 * Falls back safely to a no-op on web or devices without vibration hardware.
 */
export function triggerHaptic(kind: HapticKind = 'selection'): void {
  if (kind === 'none' || Platform.OS === 'web') {
    return;
  }

  try {
    switch (kind) {
      case 'selection':
      case 'light':
        Vibration.vibrate(Platform.OS === 'android' ? 8 : 10);
        break;
      case 'medium':
        Vibration.vibrate(14);
        break;
      case 'success':
        Vibration.vibrate(Platform.OS === 'android' ? [0, 10, 45, 14] : 15);
        break;
      case 'warning':
        Vibration.vibrate(Platform.OS === 'android' ? [0, 14, 50, 14] : 20);
        break;
      case 'error':
        Vibration.vibrate(Platform.OS === 'android' ? [0, 18, 45, 18, 45, 22] : 25);
        break;
    }
  } catch {
    // Gracefully ignore on unsupported environments
  }
}
