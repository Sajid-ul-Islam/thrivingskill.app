/**
 * Thriving Skills Lesson Video Resolver
 *
 * Resolves lesson video streams strictly from verified WordPress / LearnPress / Companion
 * lesson data (or an explicit lesson-ID-keyed map).
 *
 * Security & Content Integrity Guarantees:
 * - Zero placeholder Vimeo playlists, zero category/keyword guessing, zero modulo fallbacks.
 * - Zero fabricated titles, durations, or summaries.
 * - Fails closed when no verified video is assigned to a lesson, surfacing "Video coming soon".
 */

export type LessonVideoType = 'vimeo' | 'youtube' | 'mp4' | 'iframe' | 'none';

export interface LessonVideoData {
  hasVideo: boolean;
  comingSoon: boolean;
  comingSoonMessage: string;
  title: string;
  duration: string;
  videoUrl?: string;
  videoIntro?: string;
  videoId?: string;
  videoType: LessonVideoType;
  summary: string;
}

export interface VerifiedLessonVideoEntry {
  videoUrl: string;
  videoIntro?: string;
  videoType: Exclude<LessonVideoType, 'none'>;
  videoId?: string;
}

/**
 * Optional local override registry strictly keyed by exact LearnPress lesson ID.
 * Fails closed on a miss; WordPress/LearnPress API data is the primary authority.
 */
export const VERIFIED_LESSON_VIDEOS: Record<string, VerifiedLessonVideoEntry> = {};

export const VIDEO_COMING_SOON_MESSAGE = 'Video coming soon';
export const VIDEO_COMING_SOON_MESSAGE_BN = 'ভিডিও শীঘ্রই আসছে';

/**
 * Decodes common HTML entities found inside LearnPress embed attributes (e.g. `&amp;`).
 */
export function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&#0*38;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

/**
 * Normalizes a candidate video URL, upgrading protocol-relative `//` to `https://`
 * and rejecting dangerous or non-HTTP(S) schemes such as `javascript:` or `data:`.
 */
export function normalizeVideoUrl(rawUrl?: string): string | undefined {
  if (!rawUrl || typeof rawUrl !== 'string') return undefined;
  const decoded = decodeHtmlEntities(rawUrl).trim();
  if (!decoded) return undefined;

  if (/^(javascript|data|vbscript|file):/i.test(decoded)) {
    return undefined;
  }

  const normalized = decoded.startsWith('//') ? `https:${decoded}` : decoded;
  if (!/^https?:\/\//i.test(normalized)) {
    return undefined;
  }

  return normalized;
}

/**
 * Parses a numeric Vimeo video ID from a Vimeo or Vimeo Player URL.
 * Returns `undefined` when no valid numeric ID is present (never returns a default ID).
 */
export function parseVimeoVideoId(url?: string): string | undefined {
  if (!url) return undefined;
  const normalized = decodeHtmlEntities(url).trim();
  const match =
    normalized.match(/player\.vimeo\.com\/video\/(\d+)/i) ||
    normalized.match(
      /vimeo\.com\/(?:channels\/[^/?#]+\/|groups\/[^/?#]+\/videos\/|album\/\d+\/video\/|video\/)?(\d+)/i
    );
  return match?.[1];
}

/**
 * Parses a Vimeo unlisted privacy hash (`?h=...` or `vimeo.com/<id>/<hash>`) if present.
 */
function parseVimeoPrivacyHash(url: string): string | undefined {
  const queryMatch = url.match(/[?&]h=([a-zA-Z0-9]+)/);
  if (queryMatch?.[1]) return queryMatch[1];

  const pathMatch = url.match(/vimeo\.com\/\d+\/([a-zA-Z0-9]+)/i);
  if (pathMatch?.[1] && !/^(channels|groups|videos|video|album)$/i.test(pathMatch[1])) {
    return pathMatch[1];
  }
  return undefined;
}

/**
 * Builds a canonical HTTPS `player.vimeo.com/video/<id>` URL while preserving
 * existing query parameters (such as the `?h=...` unlisted privacy hash).
 */
export function buildVimeoEmbedUrl(url: string, videoId?: string): string {
  const parsedId = videoId || parseVimeoVideoId(url);
  if (!parsedId) return url;

  const normalized = decodeHtmlEntities(url).trim().replace(/^\/\//, 'https://');
  if (/^https?:\/\/player\.vimeo\.com\/video\/\d+/i.test(normalized)) {
    return normalized.replace(/^http:\/\//i, 'https://');
  }

  const privacyHash = parseVimeoPrivacyHash(normalized);
  const base = `https://player.vimeo.com/video/${parsedId}`;
  return privacyHash ? `${base}?h=${privacyHash}` : base;
}

/**
 * Parses an 11-character YouTube video ID from a YouTube / youtu.be URL.
 */
export function parseYouTubeVideoId(url?: string): string | undefined {
  if (!url) return undefined;
  const normalized = decodeHtmlEntities(url).trim();
  const match = normalized.match(
    /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|shorts\/|live\/|watch\?(?:[^#]*&)?v=))([\w-]{11})/i
  );
  return match?.[1];
}

/**
 * Extracts a validated video URL from WordPress/LearnPress `video_intro`
 * (either an `<iframe src="...">` snippet or a bare URL string).
 */
export function extractVideoUrlFromIntro(videoIntro?: string): string | undefined {
  if (!videoIntro || typeof videoIntro !== 'string') return undefined;
  const trimmed = videoIntro.trim();
  if (!trimmed) return undefined;

  const iframeSrcMatch = trimmed.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  if (iframeSrcMatch?.[1]) {
    return normalizeVideoUrl(iframeSrcMatch[1]);
  }

  // Only treat plain text as a URL if it actually starts with a URL scheme or //
  if (/^(https?:)?\/\//i.test(trimmed) && !trimmed.includes('<')) {
    return normalizeVideoUrl(trimmed);
  }

  return undefined;
}

/**
 * Detects the video provider type and fails closed (`none`) when a known video host
 * lacks a parseable ID or when the URL is missing/invalid.
 */
export function detectVideoType(url?: string): LessonVideoType {
  const normalized = normalizeVideoUrl(url);
  if (!normalized) return 'none';

  const lower = normalized.toLowerCase();
  if (lower.includes('vimeo.com')) {
    return parseVimeoVideoId(normalized) ? 'vimeo' : 'none';
  }
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
    return parseYouTubeVideoId(normalized) ? 'youtube' : 'none';
  }
  if (/\.(mp4|m3u8|mpd|webm)($|\?)/i.test(normalized)) {
    return 'mp4';
  }
  // Require HTTPS for generic embed iframes
  if (/^https:\/\//i.test(normalized)) {
    return 'iframe';
  }
  return 'none';
}

function makeResponsiveIframe(embedUrl: string): string {
  const safeSrc = embedUrl.replace(/"/g, '&quot;').replace(/</g, '%3C').replace(/>/g, '%3E');
  return `<iframe src="${safeSrc}" width="100%" height="100%" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;"></iframe>`;
}

function failClosedResult(title: string, duration: string, summary: string): LessonVideoData {
  return {
    hasVideo: false,
    comingSoon: true,
    comingSoonMessage: VIDEO_COMING_SOON_MESSAGE,
    title,
    duration,
    videoUrl: undefined,
    videoIntro: undefined,
    videoId: undefined,
    videoType: 'none',
    summary,
  };
}

/**
 * Resolves lesson video playback metadata strictly from the lesson's real WordPress/LearnPress
 * fields (or explicit lesson-ID registry entry). Never falls back to category playlists,
 * course-wide guesses, modulo indexing, or hardcoded Vimeo IDs.
 */
export function resolveLessonVideoData(
  _course?: { id?: string | number; title?: string; category?: string },
  lesson?: {
    id?: string | number;
    title?: string;
    duration?: string;
    summary?: string;
    videoUrl?: string;
    videoIntro?: string;
  }
): LessonVideoData {
  const title = (lesson?.title || '').trim();
  const duration = (lesson?.duration || '').trim();
  const summary = (lesson?.summary || '').trim();

  if (!lesson) {
    return failClosedResult(title, duration, summary);
  }

  const lessonIdKey = lesson.id !== undefined && lesson.id !== null ? String(lesson.id).trim() : '';
  const registryEntry =
    lessonIdKey && Object.prototype.hasOwnProperty.call(VERIFIED_LESSON_VIDEOS, lessonIdKey)
      ? VERIFIED_LESSON_VIDEOS[lessonIdKey]
      : undefined;

  const directUrl = normalizeVideoUrl(lesson.videoUrl);
  const introUrl = extractVideoUrlFromIntro(lesson.videoIntro);
  const candidateUrl = directUrl || introUrl || normalizeVideoUrl(registryEntry?.videoUrl);

  if (!candidateUrl) {
    return failClosedResult(title, duration, summary);
  }

  const videoType = detectVideoType(candidateUrl);
  if (videoType === 'none') {
    return failClosedResult(title, duration, summary);
  }

  if (videoType === 'vimeo') {
    const videoId = parseVimeoVideoId(candidateUrl);
    if (!videoId) {
      return failClosedResult(title, duration, summary);
    }
    const canonicalUrl = buildVimeoEmbedUrl(candidateUrl, videoId);
    const videoIntro = makeResponsiveIframe(canonicalUrl);

    return {
      hasVideo: true,
      comingSoon: false,
      comingSoonMessage: '',
      title,
      duration,
      videoUrl: canonicalUrl,
      videoIntro,
      videoId,
      videoType: 'vimeo',
      summary,
    };
  }

  if (videoType === 'youtube') {
    const videoId = parseYouTubeVideoId(candidateUrl);
    if (!videoId) {
      return failClosedResult(title, duration, summary);
    }
    const canonicalUrl = `https://www.youtube-nocookie.com/embed/${videoId}`;
    const videoIntro = makeResponsiveIframe(canonicalUrl);

    return {
      hasVideo: true,
      comingSoon: false,
      comingSoonMessage: '',
      title,
      duration,
      videoUrl: canonicalUrl,
      videoIntro,
      videoId,
      videoType: 'youtube',
      summary,
    };
  }

  if (videoType === 'mp4') {
    const secureUrl = candidateUrl.replace(/^http:\/\//i, 'https://');
    return {
      hasVideo: true,
      comingSoon: false,
      comingSoonMessage: '',
      title,
      duration,
      videoUrl: secureUrl,
      videoIntro: undefined,
      videoId: undefined,
      videoType: 'mp4',
      summary,
    };
  }

  // Verified HTTPS iframe rebuilt strictly from canonical URL (never pass through raw server HTML)
  return {
    hasVideo: true,
    comingSoon: false,
    comingSoonMessage: '',
    title,
    duration,
    videoUrl: candidateUrl,
    videoIntro: makeResponsiveIframe(candidateUrl),
    videoId: undefined,
    videoType: 'iframe',
    summary,
  };
}
