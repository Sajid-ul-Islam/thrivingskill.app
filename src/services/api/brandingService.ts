import { HttpClient } from './httpClient';
import { CacheManager } from '../cache/cacheManager';
import { Env } from '../../config/env';

export interface SiteBrandingInfo {
  siteName: string;
  tagline: string;
  taglineBn: string;
  siteUrl: string;
  updatedAt: number;
}

export interface DynamicCarouselSlide {
  id: string;
  badge: string;
  badgeIcon: string;
  title: string;
  subtitle: string;
  ctaText: string;
  gradientColors: [string, string, ...string[]];
  actionType: 'summit' | 'course' | 'trailer' | 'subscription' | 'bundle';
  targetId?: string;
  imageUrl?: string;
  linkUrl?: string;
}

const BRANDING_CACHE_KEY = 'site_branding_meta';
const BANNERS_CACHE_KEY = 'site_banners_list';
const ONE_HOUR_MS = 60 * 60 * 1000;

export const DEFAULT_SITE_BRANDING: SiteBrandingInfo = {
  siteName: 'Thrivingskills',
  tagline: 'Empowering People, Building a Skilled Nation',
  taglineBn: 'দক্ষ জাতি গঠনে মানুষের ক্ষমতায়ন',
  siteUrl: 'https://thrivingskill.com',
  updatedAt: Date.now(),
};

export const DEFAULT_CURATED_SLIDES: DynamicCarouselSlide[] = [
  {
    id: 'skills-growth-2026',
    badge: 'EMPOWERING GROWTH',
    badgeIcon: 'rocket',
    title: 'Skills-Focused Economy',
    subtitle: 'Bridge the future of work with tech-enabled human potential.',
    ctaText: 'Explore Curricula →',
    gradientColors: ['#102F53', '#1D4476', '#102F53'],
    actionType: 'course',
    targetId: 'skills-growth',
    imageUrl: 'https://thrivingskill.com/wp-content/uploads/2026/05/cover2.jpg2_.jpeg',
  },
  {
    id: 'summit-2026',
    badge: 'FLAGSHIP CONFERENCE 2026',
    badgeIcon: 'calendar',
    title: 'Bangladesh Skills Summit 2026',
    subtitle: 'Decoding 4IR employability, AI workforce transformation, & leadership.',
    ctaText: 'Reserve Summit Pass →',
    gradientColors: ['#102F53', '#1D4476', '#E34234'],
    actionType: 'summit',
    targetId: 'summit-2026',
  },
  {
    id: 'ai-masterclass',
    badge: 'EXECUTIVE MASTERCLASS',
    badgeIcon: 'bulb',
    title: 'Generative AI & Prompt Engineering',
    subtitle: 'Boost office productivity with practical AI, prompt engineering & automated workflow models.',
    ctaText: 'Watch Video Trailer →',
    gradientColors: ['#102F53', '#0A1C33', '#102F53'],
    actionType: 'trailer',
    targetId: 'course-ai-productivity',
    imageUrl: 'https://thrivingskill.com/wp-content/uploads/2026/05/AI-Bundle-Promotional-Poster.jpg',
  },
  {
    id: 'excel-modeling',
    badge: 'INDUSTRY ACCREDITED',
    badgeIcon: 'ribbon',
    title: 'Advanced Excel & Financial Modeling',
    subtitle: 'Build dynamic C-suite KPI cockpits & automate financial valuations.',
    ctaText: 'Explore Course →',
    gradientColors: ['#102F53', '#B92B1D', '#E34234'],
    actionType: 'course',
    targetId: 'course-excel-dashboards',
  },
];

/**
 * Clean HTML tags and decode common HTML entities returned by WordPress
 */
export function sanitizeWpText(text?: string): string {
  if (!text) return '';
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#8211;/g, '–')
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&nbsp;/g, ' ')
    // Strip external price promo phrases to maintain reader-app compliance
    .replace(/Only\s+\d+.*BDT/gi, '')
    .replace(/Use Coupon Code:[^\n.]*/gi, '')
    .trim();
}

export class BrandingService {
  /**
   * Fetch live site branding metadata (Site name, tagline, URLs).
   * Checks CacheManager first, then updates in the background.
   */
  static async getSiteBranding(forceRefresh: boolean = false): Promise<SiteBrandingInfo> {
    if (!forceRefresh) {
      const cached = await CacheManager.get<SiteBrandingInfo>(BRANDING_CACHE_KEY, true);
      if (cached) {
        // Asynchronously check for updates if stale
        this.fetchAndCacheBranding().catch(() => {});
        return cached;
      }
    }

    try {
      const live = await this.fetchAndCacheBranding();
      return live;
    } catch {
      return DEFAULT_SITE_BRANDING;
    }
  }

  /**
   * Fetch live banners from WordPress backend (Collections, Posts, and Media).
   * Blends live server items with flagship summit and executive masterclass slides.
   */
  static async getDynamicBanners(forceRefresh: boolean = false): Promise<DynamicCarouselSlide[]> {
    if (!forceRefresh) {
      const cached = await CacheManager.get<DynamicCarouselSlide[]>(BANNERS_CACHE_KEY, true);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        // Asynchronously revalidate in background
        this.fetchAndCacheBanners().catch(() => {});
        return cached;
      }
    }

    try {
      const live = await this.fetchAndCacheBanners();
      return live;
    } catch {
      return DEFAULT_CURATED_SLIDES;
    }
  }

  /**
   * Internal fetcher for /wp-json
   */
  private static async fetchAndCacheBranding(): Promise<SiteBrandingInfo> {
    try {
      // Calling root /wp-json returns the WordPress site descriptor
      const res = await HttpClient.get<any>('/', undefined, { skipAuth: true, timeoutMs: 8000 });
      if (res && res.name) {
        const info: SiteBrandingInfo = {
          siteName: sanitizeWpText(res.name) || DEFAULT_SITE_BRANDING.siteName,
          tagline: sanitizeWpText(res.description) || DEFAULT_SITE_BRANDING.tagline,
          taglineBn: DEFAULT_SITE_BRANDING.taglineBn,
          siteUrl: res.url || DEFAULT_SITE_BRANDING.siteUrl,
          updatedAt: Date.now(),
        };
        await CacheManager.set(BRANDING_CACHE_KEY, info, ONE_HOUR_MS);
        return info;
      }
    } catch (err) {
      if (Env.DEBUG_API) {
        console.warn('[BrandingService] Failed to fetch /wp-json site branding:', err);
      }
    }
    return DEFAULT_SITE_BRANDING;
  }

  /**
   * Internal fetcher for dynamic banner slides from LearnPress collections and WP posts
   */
  private static async fetchAndCacheBanners(): Promise<DynamicCarouselSlide[]> {
    const dynamicSlides: DynamicCarouselSlide[] = [];

    // Distinct gradients aligned with Thriving Skills brand identity
    const paletteList: [string, string, ...string[]][] = [
      ['#102F53', '#1D4476', '#102F53'], // Deep Royal Blue
      ['#102F53', '#1D4476', '#E34234'], // Deep Royal Blue with Accent Red
      ['#102F53', '#0A1C33', '#102F53'], // Deep Royal Blue Navy
      ['#102F53', '#B92B1D', '#E34234'], // Deep Royal Blue to Crimson Red
      ['#102F53', '#1E293B', '#102F53'], // Slate Navy
      ['#102F53', '#334155', '#E34234'], // Navy Slate Red
    ];

    try {
      // 1. Fetch LearnPress Collections with featured media
      const collections = await HttpClient.get<any[]>(
        '/wp/v2/lp_collection',
        { _embed: '1', per_page: 4 },
        { skipAuth: true, timeoutMs: 8000 }
      );

      if (Array.isArray(collections)) {
        collections.forEach((col, idx) => {
          const featuredMedia = col._embedded?.['wp:featuredmedia']?.[0]?.source_url;
          const cleanTitle = sanitizeWpText(col.title?.rendered);
          const rawExcerpt = sanitizeWpText(col.excerpt?.rendered);
          const cleanExcerpt = rawExcerpt && rawExcerpt.length > 5
            ? rawExcerpt
            : 'Explore specialized industry skill series designed for modern professionals.';

          if (cleanTitle) {
            dynamicSlides.push({
              id: `collection-${col.id || idx}`,
              badge: 'CURATED BUNDLE',
              badgeIcon: 'layers',
              title: cleanTitle,
              subtitle: cleanExcerpt,
              ctaText: 'Explore Curricula →',
              gradientColors: paletteList[idx % paletteList.length],
              actionType: 'bundle',
              targetId: col.slug || String(col.id),
              imageUrl: featuredMedia || undefined,
            });
          }
        });
      }
    } catch (err) {
      if (Env.DEBUG_API) {
        console.warn('[BrandingService] Could not fetch lp_collection banners:', err);
      }
    }

    try {
      // 2. Fetch featured posts / thought leadership
      const posts = await HttpClient.get<any[]>(
        '/wp/v2/posts',
        { _embed: '1', per_page: 3 },
        { skipAuth: true, timeoutMs: 8000 }
      );

      if (Array.isArray(posts)) {
        posts.forEach((post, idx) => {
          const featuredMedia = post._embedded?.['wp:featuredmedia']?.[0]?.source_url;
          const cleanTitle = sanitizeWpText(post.title?.rendered);
          const rawExcerpt = sanitizeWpText(post.excerpt?.rendered);
          const cleanExcerpt = rawExcerpt && rawExcerpt.length > 5
            ? rawExcerpt
            : 'Read the latest insights from industry leaders on thriving in the digital economy.';

          // Only include if it has a featured image or compelling title
          if (cleanTitle && featuredMedia) {
            dynamicSlides.push({
              id: `post-${post.id || idx}`,
              badge: 'INDUSTRY INSIGHTS',
              badgeIcon: 'bulb',
              title: cleanTitle,
              subtitle: cleanExcerpt,
              ctaText: 'Read Article →',
              gradientColors: paletteList[(idx + 2) % paletteList.length],
              actionType: 'course',
              targetId: post.slug || String(post.id),
              imageUrl: featuredMedia,
            });
          }
        });
      }
    } catch (err) {
      if (Env.DEBUG_API) {
        console.warn('[BrandingService] Could not fetch post banners:', err);
      }
    }

    // 3. Always ensure our flagship Summit and Generative AI trailer are present
    const flagshipSummit = DEFAULT_CURATED_SLIDES.find(s => s.id === 'summit-2026');
    const aiTrailer = DEFAULT_CURATED_SLIDES.find(s => s.id === 'ai-masterclass');
    const heroCover = DEFAULT_CURATED_SLIDES.find(s => s.id === 'skills-growth-2026');

    const finalSlides: DynamicCarouselSlide[] = [];
    if (heroCover) finalSlides.push(heroCover);
    if (flagshipSummit) finalSlides.push(flagshipSummit);
    if (aiTrailer) finalSlides.push(aiTrailer);

    // Merge in dynamic items from server, ensuring no duplicates
    for (const d of dynamicSlides) {
      if (!finalSlides.some(s => s.title.toLowerCase() === d.title.toLowerCase())) {
        finalSlides.push(d);
      }
    }

    // Limit to top 6 slides for optimal carousel performance & memory
    const trimmed = finalSlides.slice(0, 6);
    await CacheManager.set(BANNERS_CACHE_KEY, trimmed, ONE_HOUR_MS);
    return trimmed;
  }
}
