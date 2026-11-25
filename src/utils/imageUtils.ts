import { Platform, ImageSourcePropType } from 'react-native';
import { Env } from '../config/env';

/**
 * Authentic bundled team & faculty assets from assets/team/
 * Matches canonical instructors, founders, and leaders from https://thrivingskill.com
 */
export const INSTRUCTOR_LOCAL_AVATARS: Record<string, ImageSourcePropType> = {
  // Founders & Executive Leadership
  mahmud: require('../../assets/team/abdullah_al_mahmud.jpeg'),
  abdullah: require('../../assets/team/abdullah_al_mahmud.jpeg'),
  nuruddin: require('../../assets/team/syed_nuruddin_ahmed.jpeg'),
  yusuf: require('../../assets/team/yusuf_iqbal.jpeg'),
  tareq: require('../../assets/team/tareq_siddiqui.jpeg'),
  siddiqui: require('../../assets/team/tareq_siddiqui.jpeg'),
  noman: require('../../assets/team/abdulla_al_noman.jpeg'),

  // Top Faculty, Master Mentors & Course Authors
  don: require('../../assets/team/don_sumdany.png'),
  sumdany: require('../../assets/team/don_sumdany.png'),
  'km ali': require('../../assets/team/km_ali.png'),
  'k.m. ali': require('../../assets/team/km_ali.png'),
  'arif khan': require('../../assets/team/arif_khan.png'),
  moinuddin: require('../../assets/team/moinuddin_chowdhury.png'),
  habib: require('../../assets/team/mamun_habib.jpeg'),
  'mamun habib': require('../../assets/team/mamun_habib.jpeg'),
  jishu: require('../../assets/team/jishu_tarafder.png'),
  tarafder: require('../../assets/team/jishu_tarafder.png'),
  humaira: require('../../assets/team/humaira_sharmeen.png'),
  sharmeen: require('../../assets/team/humaira_sharmeen.png'),
};

/**
 * Resolves an instructor or leadership member avatar source.
 * Prioritizes bundled high-res authentic local assets from assets/team/
 * before falling back to network URL or fallback image.
 */
export function getInstructorAvatarSource(
  name?: string | null,
  rawUri?: string | null,
  fallbackSource: ImageSourcePropType = require('../../assets/icon.png')
): ImageSourcePropType {
  if (name && typeof name === 'string') {
    const cleanName = name.toLowerCase().trim();
    for (const [key, asset] of Object.entries(INSTRUCTOR_LOCAL_AVATARS)) {
      if (cleanName.includes(key)) {
        return asset;
      }
    }
  }

  if (rawUri && typeof rawUri === 'string' && rawUri.trim().length > 0) {
    return getSafeImageSource(rawUri, fallbackSource);
  }

  return fallbackSource;
}

/**
 * Normalizes and sanitizes image URIs for cross-platform reliability.
 * - Handles non-ASCII / Unicode characters (such as Bengali script) via encodeURI.
 * - Trims whitespaces and ensures secure https protocol for WordPress media.
 * - Supports both live (thrivingskill.com) and staging (staging.thrivingskill.com).
 */
export function getSafeImageUri(rawUri?: string | null): string {
  if (!rawUri || typeof rawUri !== 'string') return '';
  let trimmed = rawUri.trim();
  if (!trimmed) return '';

  // Ensure https for both live and staging thrivingskill.com media
  trimmed = trimmed.replace(
    /^http:\/\/(staging\.)?thrivingskill\.com/i,
    'https://$1thrivingskill.com'
  );

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

  // On native mobile (Android/iOS), include Referer matching the active server to prevent CDN hotlink blocks
  const activeReferer = Env.SITE_URL ? `${Env.SITE_URL}/` : 'https://thrivingskill.com/';
  return {
    uri: safeUri,
    cache: 'force-cache',
    headers: {
      Referer: activeReferer,
    },
  };
}
