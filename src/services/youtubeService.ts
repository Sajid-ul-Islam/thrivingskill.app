import AsyncStorage from '@react-native-async-storage/async-storage';
import { YouTubeVideo, YOUTUBE_VIDEOS, YOUTUBE_CHANNEL } from '../data/youtubeVideos';
import { Course } from '../types';

const STORAGE_KEY_CACHED_VIDEOS = '@ts_cached_youtube_videos';
const STORAGE_KEY_SAVED_VIDEOS = '@ts_saved_youtube_videos';
const RSS_FEED_URL = 'https://www.youtube.com/feeds/videos.xml?channel_id=UCyz7sGLDHZrHuVIDgYtDfyg';

/**
 * Lightweight XML parser for YouTube RSS feed entries (no external dependencies needed)
 */
export function parseYouTubeRss(xmlText: string): YouTubeVideo[] {
  const videos: YouTubeVideo[] = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match: RegExpExecArray | null;

  while ((match = entryRegex.exec(xmlText)) !== null) {
    const entryBlock = match[1];

    const idMatch = entryBlock.match(/<yt:videoId>(.*?)<\/yt:videoId>/);
    const titleMatch = entryBlock.match(/<title>(.*?)<\/title>/);
    const publishedMatch = entryBlock.match(/<published>(.*?)<\/published>/);
    const thumbMatch = entryBlock.match(/<media:thumbnail\s+url="(.*?)"/);

    if (idMatch && idMatch[1] && titleMatch && titleMatch[1]) {
      const id = idMatch[1].trim();
      let title = titleMatch[1].trim();

      // Clean HTML entities if any
      title = title
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#39;/g, "'");

      // Format publication date
      let published = '';
      if (publishedMatch && publishedMatch[1]) {
        try {
          const date = new Date(publishedMatch[1]);
          published = date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
        } catch {
          published = '';
        }
      }

      const thumbnail =
        thumbMatch && thumbMatch[1] ? thumbMatch[1] : `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

      videos.push({
        id,
        title,
        thumbnail,
        duration: '', // RSS feeds omit duration; fallback values preserved during merge
        views: '',
        published,
        url: `https://www.youtube.com/watch?v=${id}`,
      });
    }
  }

  return videos;
}

/**
 * Syncs the latest videos from YouTube's public RSS feed and merges them with curated static data.
 */
export async function syncLatestYouTubeVideos(): Promise<YouTubeVideo[]> {
  try {
    // 1. Fetch live RSS feed with 8 second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(RSS_FEED_URL, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/xml, text/xml, */*',
      },
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const xml = await response.text();
      const liveVideos = parseYouTubeRss(xml);

      if (liveVideos.length > 0) {
        // Merge strategy:
        // Build a map from existing static/cached videos for metadata like duration/views
        const existingMap = new Map<string, YouTubeVideo>();
        YOUTUBE_VIDEOS.forEach((v) => existingMap.set(v.id, v));

        // Get any previously cached entries
        const cachedRaw = await AsyncStorage.getItem(STORAGE_KEY_CACHED_VIDEOS);
        if (cachedRaw) {
          try {
            const cachedList: YouTubeVideo[] = JSON.parse(cachedRaw);
            cachedList.forEach((v) => {
              if (!existingMap.has(v.id)) {
                existingMap.set(v.id, v);
              }
            });
          } catch {
            // Ignore parse errors
          }
        }

        // Merge: new live videos first, enriched with duration/views if we already have them
        const merged: YouTubeVideo[] = [];
        const seenIds = new Set<string>();

        // Add live videos
        for (const live of liveVideos) {
          if (!seenIds.has(live.id)) {
            seenIds.add(live.id);
            const prev = existingMap.get(live.id);
            merged.push({
              ...live,
              duration: prev?.duration || live.duration || '',
              views: prev?.views || live.views || '',
              published: live.published || prev?.published || '',
            });
          }
        }

        // Add any remaining curated videos that weren't in the latest 15 RSS items
        for (const curated of YOUTUBE_VIDEOS) {
          if (!seenIds.has(curated.id)) {
            seenIds.add(curated.id);
            merged.push(curated);
          }
        }

        // Save merged list to storage for instant offline access
        await AsyncStorage.setItem(STORAGE_KEY_CACHED_VIDEOS, JSON.stringify(merged));
        return merged;
      }
    }
  } catch {
    // Network or parse failure: fallback to local cache or bundled data
  }

  // Fallback 1: Local cache
  try {
    const cached = await AsyncStorage.getItem(STORAGE_KEY_CACHED_VIDEOS);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Ignore error
  }

  // Fallback 2: Curated bundled list
  return YOUTUBE_VIDEOS;
}

/**
 * Storage helpers for Saved / Watch Later bookmarks
 */
export async function getSavedVideoIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_SAVED_VIDEOS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveVideoIds(ids: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_SAVED_VIDEOS, JSON.stringify(ids));
  } catch {
    // Ignore error
  }
}

/**
 * Cross-links a YouTube video to a relevant accredited course for enrollment conversion.
 */
export function findRelatedCourse(video: YouTubeVideo, courses: Course[]): Course | null {
  if (!video || !courses || courses.length === 0) return null;

  const title = video.title.toLowerCase();

  // Keyword to course category / title scoring
  const keywords: { patterns: string[]; courseIdMatch?: string; categoryMatch?: string }[] = [
    {
      patterns: ['chatgpt', 'gpt', 'generative ai', 'prompt engineering', 'artificial intelligence'],
      courseIdMatch: 'course-ai-productivity',
      categoryMatch: 'generative-ai',
    },
    {
      patterns: ['excel', 'dashboard', 'spreadsheet', 'vlookup', 'pivot'],
      courseIdMatch: 'course-excel-dashboards',
      categoryMatch: 'excel-data',
    },
    {
      patterns: ['financial model', 'valuation', 'accounting', 'balance sheet', 'stock market', 'finance'],
      courseIdMatch: 'course-financial-modeling',
      categoryMatch: 'finance',
    },
    {
      patterns: ['procurement', 'supply chain', 'spinning', 'cotton', 'logistics', 'vendor', 'inventory'],
      courseIdMatch: 'course-supply-chain-analytics',
      categoryMatch: 'supply-chain',
    },
    {
      patterns: ['sales', 'negotiation', 'b2b', 'pitch', 'client', 'closing'],
      courseIdMatch: 'course-sales-negotiation',
      categoryMatch: 'marketing',
    },
    {
      patterns: ['hr', 'human resource', 'payroll', 'recruitment', 'interview', 'talent'],
      courseIdMatch: 'course-hr-people-ops',
      categoryMatch: 'hr',
    },
    {
      patterns: ['power bi', 'powerbi', 'data analytics', 'data analysis', 'bi dashboard'],
      courseIdMatch: 'course-data-analysis-powerbi',
      categoryMatch: 'excel-data',
    },
    {
      patterns: ['leadership', 'management', 'executive', 'team building', 'strategy'],
      courseIdMatch: 'course-ai-exec-leadership',
      categoryMatch: 'leadership',
    },
  ];

  for (const rule of keywords) {
    if (rule.patterns.some((p) => title.includes(p))) {
      // First try exact course ID match
      if (rule.courseIdMatch) {
        const found = courses.find((c) => c.id === rule.courseIdMatch);
        if (found) return found;
      }
      // Or match by category
      if (rule.categoryMatch) {
        const found = courses.find((c) => c.category === rule.categoryMatch);
        if (found) return found;
      }
    }
  }

  return null;
}

const STORAGE_KEY_LAST_WATCHED = '@ts_last_watched_video';

export async function getLastWatchedVideo(): Promise<YouTubeVideo | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_LAST_WATCHED);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function saveLastWatchedVideo(video: YouTubeVideo): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_LAST_WATCHED, JSON.stringify(video));
  } catch {
    // Ignored
  }
}

/**
 * Reverse matching: finds a relevant YouTube masterclass/trailer for a course
 */
export function findRelatedVideoForCourse(course: Course, videos: YouTubeVideo[]): YouTubeVideo | null {
  if (!course || !videos || videos.length === 0) return null;

  const courseTitle = course.title.toLowerCase();
  const category = (course.category || '').toLowerCase();

  const courseKeywords = courseTitle
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !['with', 'from', 'course', 'master', 'mastery'].includes(w));

  let bestVideo: YouTubeVideo | null = null;
  let highestScore = 0;

  for (const v of videos) {
    const vTitle = v.title.toLowerCase();
    let score = 0;

    for (const kw of courseKeywords) {
      if (vTitle.includes(kw)) score += 3;
    }

    if (category && vTitle.includes(category)) score += 2;
    if (category.includes('ai') && (vTitle.includes('ai') || vTitle.includes('chatgpt'))) score += 3;
    if (category.includes('excel') && vTitle.includes('excel')) score += 3;
    if (category.includes('supply') && (vTitle.includes('procurement') || vTitle.includes('supply') || vTitle.includes('cotton'))) score += 3;
    if (category.includes('finance') && (vTitle.includes('finance') || vTitle.includes('financial') || vTitle.includes('valuation'))) score += 3;
    if (category.includes('leadership') && (vTitle.includes('leadership') || vTitle.includes('negotiation'))) score += 3;

    if (score > highestScore) {
      highestScore = score;
      bestVideo = v;
    }
  }

  return highestScore >= 3 ? bestVideo : (videos[0] || null);
}

