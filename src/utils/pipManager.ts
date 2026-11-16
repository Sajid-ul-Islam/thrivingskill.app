import { Platform } from 'react-native';
import { isPictureInPictureSupported } from 'expo-video';

/**
 * Metadata for OS lock-screen now-playing notification and media controls
 */
export interface NowPlayingMetadata {
  title: string;
  artist: string;
  album: string;
  artworkUrl?: string;
}

/**
 * Checks if the current hardware and OS environment supports native Picture-in-Picture.
 * - Android: API 26+ (Android 8.0+) with picture-in-picture feature
 * - iOS: iOS 14+ with AVPictureInPictureController
 * - Web: Document Picture-in-Picture API
 */
export function isSystemPiPSupported(): boolean {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        return !!(document.pictureInPictureEnabled || 'pictureInPictureElement' in document);
      }
      return false;
    }
    return isPictureInPictureSupported();
  } catch {
    // Graceful fallback for non-supported or simulated environments
    return Platform.OS === 'android' || Platform.OS === 'ios';
  }
}

/**
 * Checks if background audio playback is available on the current device.
 * Enabled on Android (API 26+) via MediaSessionService and iOS via UIBackgroundModes.
 */
export function isBackgroundAudioSupported(): boolean {
  return Platform.OS === 'android' || Platform.OS === 'ios';
}

/**
 * Formats standardized lock-screen now-playing notification metadata.
 */
export function formatNowPlayingMetadata(
  lessonTitle: string,
  courseTitle?: string,
  artworkUrl?: string
): NowPlayingMetadata {
  return {
    title: lessonTitle.trim() || 'Masterclass Lecture',
    artist: 'Thriving Skills',
    album: courseTitle?.trim() || 'Executive Professional Course',
    artworkUrl: artworkUrl || 'https://thrivingskill.com/wp-content/uploads/2023/10/logo.png',
  };
}

/**
 * Returns human-readable bilingual status badge for PiP and commute audio modes.
 */
export function getPlayerOverlayBadge(
  isPiPActive: boolean,
  isCommuteMode: boolean
): { labelEn: string; labelBn: string; active: boolean; badgeColor: string } {
  if (isPiPActive) {
    return {
      labelEn: 'PiP Overlay Active',
      labelBn: 'ভাসমান স্ক্রিন সক্রিয়',
      active: true,
      badgeColor: '#FFB606',
    };
  }
  if (isCommuteMode) {
    return {
      labelEn: 'Background Audio Mode',
      labelBn: 'ব্যাকগ্রাউন্ড অডিও সক্রিয়',
      active: true,
      badgeColor: '#10B981',
    };
  }
  return {
    labelEn: 'Standard Playback',
    labelBn: 'স্ট্যান্ডার্ড প্লেয়ার',
    active: false,
    badgeColor: '#64748B',
  };
}
