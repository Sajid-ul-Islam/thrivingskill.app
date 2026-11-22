import { Platform, ImageSourcePropType } from 'react-native';

/**
 * Normalizes and sanitizes image URIs for cross-platform reliability.
 * - Handles non-ASCII / Unicode characters (such as Bengali script) via encodeURI.
 * - Trims whitespaces and ensures secure https protocol for WordPress media.
 */
export function getSafeImageUri(rawUri?: string | null): string {
  if (!rawUri || typeof rawUri !== 'string') return '';
  let trimmed = rawUri.trim();
  if (!trimmed) return '';

  // Ensure https for thrivingskill.com images
  if (trimmed.startsWith('http://thrivingskill.com')) {
    trimmed = trimmed.replace('http://thrivingskill.com', 'https://thrivingskill.com');
  }

  try {
    // Decode first to avoid double-encoding already encoded parts, then encodeURI
    return encodeURI(decodeURI(trimmed));
  } catch {
    return encodeURI(trimmed);
  }
}

/**
 * Returns a robust Image source object with proper platform headers to bypass
 * Cloudflare hotlink protection (Error 1011) and handle Unicode image URLs.
 */
export function getSafeImageSource(
  rawUri?: string | null,
  fallbackSource: ImageSourcePropType = require('../../assets/icon.png')
): ImageSourcePropType {
  const safeUri = getSafeImageUri(rawUri);
  if (!safeUri) {
    return fallbackSource;
  }

  // On Web, headers in Image source are ignored by browser <img> tags,
  // but <meta name="referrer" content="no-referrer"> handles it.
  if (Platform.OS === 'web') {
    return { uri: safeUri };
  }

  // On native mobile (Android/iOS), include Referer header to prevent CDN hotlink blocks
  return {
    uri: safeUri,
    headers: {
      Referer: 'https://thrivingskill.com/',
    },
  };
}
