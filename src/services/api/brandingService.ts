import { HttpClient } from './httpClient';
import { CacheManager } from '../cache/cacheManager';
import { Env } from '../../config/env';
import { CompanionService } from './companionService';

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

export interface PartnerLogoItem {
  id: string;
  name: string;
  nameBn?: string;
  logoUrl: string;
  websiteUrl?: string;
}

export interface HomeFeatureCardItem {
  id: string;
  badge: string;
  badgeBn: string;
  title: string;
  titleBn: string;
  subtitle: string;
  subtitleBn: string;
  imageUrl: string;
  actionType: 'bundle' | 'subscription' | 'courses' | 'workshops';
  targetId?: string;
}

export interface SpecialBundlePosterItem {
  id: string;
  title: string;
  titleBn: string;
  posterUrl: string;
  price: number;
  regularPrice: number;
  currency: string;
  discountPercent: number;
  coursesCount: number;
  rating: number;
  enrolledCount: number;
  targetSlug: string;
}

export interface StudentTestimonialItem {
  id: string;
  name: string;
  role: string;
  roleBn?: string;
  company?: string;
  quote: string;
  quoteBn?: string;
  rating: number;
  avatarUrl?: string;
}

const BRANDING_CACHE_KEY = 'site_branding_meta';
const BANNERS_CACHE_KEY = 'site_banners_list';
const PARTNER_LOGOS_CACHE_KEY = 'site_partner_logos_list';
const HOME_FEATURES_CACHE_KEY = 'site_home_features_list';
const SPECIAL_BUNDLES_CACHE_KEY = 'site_special_bundles_list';
const TESTIMONIALS_CACHE_KEY = 'site_student_testimonials_list';
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
    id: 'learn-build-career',
    badge: 'LIVE LMS 2026',
    badgeIcon: 'school-outline',
    title: 'শিখুন এবং গড়ুন নিজের ক্যারিয়ার',
    subtitle: '৩০০+ প্রিমিয়াম কোর্স, সাপ্তাহিক লাইভ সেশন এবং এক্সিকিউটিভ সার্টিফিকেশন।',
    ctaText: 'Explore All Courses →',
    gradientColors: ['#102F53', '#1D4476', '#FFB606'],
    actionType: 'course',
    imageUrl: 'https://thrivingskill.com/wp-content/uploads/2026/10/sty-ai-era.png',
  },
  {
    id: 'course-bundles-curated',
    badge: 'CAREER TRACKS',
    badgeIcon: 'layers',
    title: 'Specialized Career Bundles',
    subtitle:
      'Curated multi-course career tracks for marketing, supply chain, financial modeling & HR.',
    ctaText: 'View Bundles →',
    gradientColors: ['#102F53', '#0A1C33', '#102F53'],
    actionType: 'bundle',
    imageUrl: 'https://thrivingskill.com/wp-content/uploads/2026/05/bundle.jpeg',
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
    subtitle:
      'Boost office productivity with practical AI, prompt engineering & automated workflow models.',
    ctaText: 'Watch Video Trailer →',
    gradientColors: ['#102F53', '#0A1C33', '#102F53'],
    actionType: 'trailer',
    targetId: 'course-ai-productivity',
    imageUrl:
      'https://thrivingskill.com/wp-content/uploads/2026/05/AI-Bundle-Promotional-Poster.jpg',
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

export const DEFAULT_PARTNER_LOGOS: PartnerLogoItem[] = [
  {
    id: 'brac-bank',
    name: 'BRAC Bank',
    nameBn: 'ব্র্যাক ব্যাংক',
    logoUrl:
      'https://thrivingskill.com/wp-content/uploads/2022/09/brac-bank-logo-3C1A03E45D-seeklogo.com_.png',
    websiteUrl: 'https://www.bracbank.com',
  },
  {
    id: 'amann-group',
    name: 'Amann Group',
    nameBn: 'আমান গ্রুপ',
    logoUrl: 'https://thrivingskill.com/wp-content/uploads/2022/09/amann.png',
  },
  {
    id: 'ipdc-finance',
    name: 'IPDC Finance',
    nameBn: 'আইপিডিসি ফাইন্যান্স',
    logoUrl: 'https://thrivingskill.com/wp-content/uploads/2025/08/IPDC-logo.png',
  },
  {
    id: 'ucb-stock',
    name: 'UCB Stock Brokerage',
    nameBn: 'ইউসিবি স্টক ব্রোকারেজ',
    logoUrl: 'https://thrivingskill.com/wp-content/uploads/2023/04/3.-ucb-stock.png',
  },
  {
    id: 'a2i',
    name: 'a2i (Aspire to Innovate)',
    nameBn: 'এটুআই',
    logoUrl: 'https://thrivingskill.com/wp-content/uploads/2023/04/a2i1.png',
  },
  {
    id: 'elite-paint',
    name: 'Elite Paint',
    nameBn: 'এলিট পেইন্ট',
    logoUrl: 'https://thrivingskill.com/wp-content/uploads/2022/09/elite-paint.png',
  },
  {
    id: 'runner-group',
    name: 'Runner Group',
    nameBn: 'রানার গ্রুপ',
    logoUrl: 'https://thrivingskill.com/wp-content/uploads/2022/09/runner-logo-main.png',
  },
  {
    id: 'eu-seal',
    name: 'EU Technical Cooperation',
    nameBn: 'ইইউ কোঅপারেশন',
    logoUrl: 'https://thrivingskill.com/wp-content/uploads/2026/05/EU_SEAL.svg.png',
  },
  {
    id: 'green-hills',
    name: 'Green Hills',
    nameBn: 'গ্রিন হিলস',
    logoUrl: 'https://thrivingskill.com/wp-content/uploads/2022/09/ghlogo.png',
  },
];

export const DEFAULT_HOME_FEATURES: HomeFeatureCardItem[] = [
  {
    id: 'feat-bundles',
    badge: 'CAREER TRACKS',
    badgeBn: 'বান্ডেল অফার',
    title: 'Course Bundles',
    titleBn: 'কোর্স বান্ডেল',
    subtitle: 'Learn multiple connected courses together at discount',
    subtitleBn: 'স্পেশাল বান্ডেল অফারে শিখুন একাধিক কোর্স এক সাথে',
    imageUrl: 'https://thrivingskill.com/wp-content/uploads/2026/05/bundle.jpeg',
    actionType: 'bundle',
    targetId: 'special-bundles',
  },
  {
    id: 'feat-subscription',
    badge: 'UNLIMITED ACCESS',
    badgeBn: 'আনলিমিটেড এক্সেস',
    title: 'Subscription',
    titleBn: 'সাবস্ক্রিপশন',
    subtitle: 'Unlock 300+ accredited courses in one membership',
    subtitleBn: 'আনলিমিটেড এক্সেস পান সকল কোর্সে এক সাবস্ক্রিপশনে',
    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=500',
    actionType: 'subscription',
  },
  {
    id: 'feat-recorded',
    badge: 'SELF-PACED LMS',
    badgeBn: 'নিজের সুবিধামতো',
    title: 'Recorded Courses',
    titleBn: 'রেকর্ডেড কোর্স',
    subtitle: 'Learn flexibly from anywhere at your own pace',
    subtitleBn: 'নিজের সুবিধাজনক সময়ে যে কোনো জায়গা থেকে শিখুন',
    imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=500',
    actionType: 'courses',
  },
  {
    id: 'feat-workshops',
    badge: 'INTERACTIVE SESSIONS',
    badgeBn: 'লাইভ ইন্টারঅ্যাকশন',
    title: 'Live Workshops',
    titleBn: 'লাইভ ক্লাস ও ওয়ার্কশপ',
    subtitle: 'Direct Q&A with executive industry practitioners',
    subtitleBn: 'সরাসরি ইন্সট্রাক্টরের সাথে ইন্টারঅ্যাক্টিভ লাইভ সেশন',
    imageUrl: 'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?q=80&w=500',
    actionType: 'workshops',
  },
];

export const DEFAULT_SPECIAL_BUNDLES: SpecialBundlePosterItem[] = [
  {
    id: 'bundle-finance-accounting',
    title: 'Finance & Accounting Career Track',
    titleBn: 'ফাইন্যান্স অ্যান্ড অ্যাকাউন্টিং বান্ডেল',
    posterUrl: 'https://thrivingskill.com/wp-content/uploads/2026/03/Finance-and-Accounting.jpg',
    price: 3540,
    regularPrice: 5900,
    currency: '৳',
    discountPercent: 40,
    coursesCount: 4,
    rating: 4.9,
    enrolledCount: 382,
    targetSlug: 'finance-and-accounting',
  },
  {
    id: 'bundle-human-resource',
    title: 'Human Resource Executive Track',
    titleBn: 'হিউম্যান রিসোর্স (HR) মাস্টার বান্ডেল',
    posterUrl: 'https://thrivingskill.com/wp-content/uploads/2026/03/3.-HR-Bundle.jpg',
    price: 5100,
    regularPrice: 8500,
    currency: '৳',
    discountPercent: 40,
    coursesCount: 5,
    rating: 4.9,
    enrolledCount: 415,
    targetSlug: 'human-resource-bundle',
  },
  {
    id: 'bundle-leadership-management',
    title: 'Leadership & Executive Management',
    titleBn: 'লিডারশিপ অ্যান্ড ম্যানেজমেন্ট ট্র্যাক',
    posterUrl: 'https://thrivingskill.com/wp-content/uploads/2026/04/leadership.jpeg',
    price: 2280,
    regularPrice: 3800,
    currency: '৳',
    discountPercent: 40,
    coursesCount: 3,
    rating: 4.8,
    enrolledCount: 290,
    targetSlug: 'leadership-and-management',
  },
  {
    id: 'bundle-microsoft-excel',
    title: 'Microsoft Excel & KPI Cockpit Master',
    titleBn: 'মাইক্রোসফট এক্সেল মাস্টার বান্ডেল',
    posterUrl: 'https://thrivingskill.com/wp-content/uploads/2026/03/5.-Excel-Bundle.jpg',
    price: 5190,
    regularPrice: 8650,
    currency: '৳',
    discountPercent: 40,
    coursesCount: 5,
    rating: 5.0,
    enrolledCount: 620,
    targetSlug: 'microsoft-excel-bundle',
  },
];

export const DEFAULT_STUDENT_TESTIMONIALS: StudentTestimonialItem[] = [
  {
    id: 'test-nobel-haider',
    name: 'Nobel Haider',
    role: 'Senior Executive, Supply Chain',
    roleBn: 'সিনিয়র এক্সিকিউটিভ, সাপ্লাই চেইন',
    company: 'Leading RMG Conglomerate',
    quote:
      'The supply chain and financial modeling courses helped me streamline our procurement operations significantly. The practical spreadsheets are priceless.',
    quoteBn:
      'সাপ্লাই চেইন এবং ফাইন্যান্সিয়াল মডেলিং কোর্সগুলো আমাদের প্রকিউরমেন্ট অপারেশনে দারুণ কাজে দিয়েছে। প্র্যাকটিক্যাল এক্সেল শিটগুলো সত্যিই অসাধারণ।',
    rating: 5.0,
  },
  {
    id: 'test-imran-sabuj',
    name: 'Muhammad Imran Sabuj',
    role: 'Head of HR & Admin',
    roleBn: 'হেড অব এইচআর অ্যান্ড অ্যাডমিন',
    company: 'Multinational Manufacturing',
    quote:
      'Thriving Skills HR Masterclass covers practical labor laws and KPI appraisal frameworks that every HR professional in Bangladesh needs.',
    quoteBn:
      'থ্রাইভিং স্কিলস এইচআর মাস্টারক্লাসে বাংলাদেশের বাস্তব শ্রম আইন এবং কেপিআই ফ্রেমওয়ার্ক চমৎকারভাবে শেখানো হয়েছে।',
    rating: 5.0,
  },
  {
    id: 'test-siddikul-azam',
    name: 'Kazi Md Siddikul Azam',
    role: 'Financial Analyst',
    roleBn: 'ফাইন্যান্সিয়াল অ্যানালিস্ট',
    company: 'Capital Investments Ltd',
    quote:
      'The financial modeling and advanced Excel tracks gave me the confidence to build dynamic forecasting models for management reporting.',
    quoteBn:
      'ফাইন্যান্সিয়াল মডেলিং এবং অ্যাডভান্সড এক্সেল কোর্স আমাকে ম্যানেজমেন্ট রিপোর্টিংয়ের জন্য ডায়নামিক ফোরকাস্টিং মডেল তৈরির পূর্ণ আত্মবিশ্বাস দিয়েছে।',
    rating: 5.0,
  },
  {
    id: 'test-mahmuda-akter',
    name: 'Mahmuda Akter',
    role: 'Marketing Specialist',
    roleBn: 'মার্কেটিং স্পেশালিস্ট',
    company: 'Fintech Solutions',
    quote:
      'Outstanding digital marketing curricula. Real case studies from Bangladesh market made the concepts immediately applicable.',
    quoteBn:
      'অসাধারণ ডিজিটাল মার্কেটিং কারিকুলাম। বাংলাদেশের লোকাল মার্কেটের রিয়েল কেস স্টাডি কনসেপ্টগুলোকে সরাসরি প্রয়োগযোগ্য করে তুলেছে।',
    rating: 5.0,
  },
  {
    id: 'test-moniruzzaman',
    name: 'Khandker Moniruzzaman',
    role: 'Assistant Manager, Accounts',
    roleBn: 'অ্যাসিস্ট্যান্ট ম্যানেজার, অ্যাকাউন্টস',
    company: 'National Trading Group',
    quote:
      'Very structured VAT, Tax & Accounting courses. Step-by-step guidance made complex NBR regulations easy to master.',
    quoteBn:
      'খুবই গোছানো ভ্যাট, ট্যাক্স ও অ্যাকাউন্টিং কোর্স। স্টেপ-বাই-স্টেপ গাইডলাইন এনবিআর-এর জটিল নিয়মকানুনগুলো সহজে বুঝতে সাহায্য করেছে।',
    rating: 5.0,
  },
  {
    id: 'test-musfiqur-rahman',
    name: 'Md. Musfiqur Rahman Bhuiyan',
    role: 'Business Development Executive',
    roleBn: 'বিজনেস ডেভেলপমেন্ট এক্সিকিউটিভ',
    company: 'Tech Enterprise Ltd',
    quote:
      'Interactive and concise lessons. Learned executive presentation and negotiation strategies that won us corporate clients.',
    quoteBn:
      'ইন্টারঅ্যাক্টিভ ও টু-দ্য-পয়েন্ট লেসন। এক্সিকিউটিভ প্রেজেন্টেশন ও নেগোসিয়েশন স্ট্র্যাটেজি আমাদের নতুন কর্পোরেট ক্লায়েন্ট জিততে সাহায্য করেছে।',
    rating: 5.0,
  },
  {
    id: 'test-soumitro-sarkar',
    name: 'Soumitro Sarkar',
    role: 'Corporate Trainer & Consultant',
    roleBn: 'কর্পোরেট ট্রেইনার ও কনসালট্যান্ট',
    company: 'Professional Training Services',
    quote:
      'Exceptional platform quality. The mobile experience allows learning during daily commute without any interruption.',
    quoteBn:
      'প্ল্যাটফর্মের মান সত্যিই বিশ্বমানের। মোবাইল অ্যাপ থাকায় জ্যামের মাঝেও প্রতিদিন কোনো বাধা ছাড়াই নতুন স্কিল শেখা সম্ভব হচ্ছে।',
    rating: 5.0,
  },
];

/**
 * Clean HTML tags and decode common HTML entities returned by WordPress
 */
export function sanitizeWpText(text?: string): string {
  if (!text) return '';
  return (
    text
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
      .trim()
  );
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
      // 0. Primary Source: Live Hero Slides from TS Mobile Bridge Command Center
      const companionConfig = await CompanionService.fetchAppConfig();
      if (companionConfig?.hero_slides && Array.isArray(companionConfig.hero_slides)) {
        companionConfig.hero_slides.forEach((slide, idx) => {
          if (slide.title) {
            dynamicSlides.push({
              id: `companion-slide-${slide.id || idx}`,
              badge: slide.tag || 'FEATURED',
              badgeIcon: 'star',
              title: sanitizeWpText(slide.title),
              subtitle:
                sanitizeWpText(slide.subtitle) ||
                'Empower your career with certified industry tracks.',
              ctaText: slide.button_text ? `${slide.button_text} →` : 'Enroll Now →',
              gradientColors: paletteList[idx % paletteList.length],
              actionType: 'course',
              targetId: slide.target || undefined,
              imageUrl: slide.image_url || undefined,
            });
          }
        });
      }
    } catch (err) {
      if (Env.DEBUG_API) {
        console.warn('[BrandingService] Could not fetch companion hero slides:', err);
      }
    }

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
          const cleanExcerpt =
            rawExcerpt && rawExcerpt.length > 5
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
          const cleanExcerpt =
            rawExcerpt && rawExcerpt.length > 5
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
    const flagshipSummit = DEFAULT_CURATED_SLIDES.find((s) => s.id === 'summit-2026');
    const aiTrailer = DEFAULT_CURATED_SLIDES.find((s) => s.id === 'ai-masterclass');
    const heroCover = DEFAULT_CURATED_SLIDES.find((s) => s.id === 'skills-growth-2026');

    const finalSlides: DynamicCarouselSlide[] = [];

    // Prioritize dynamic slides explicitly managed from the TS Mobile Bridge Command Center
    for (const d of dynamicSlides) {
      if (!finalSlides.some((s) => s.title.toLowerCase() === d.title.toLowerCase())) {
        finalSlides.push(d);
      }
    }

    // Always ensure flagship items are present as fallbacks
    if (
      heroCover &&
      !finalSlides.some((s) => s.title.toLowerCase() === heroCover.title.toLowerCase())
    )
      finalSlides.push(heroCover);
    if (
      flagshipSummit &&
      !finalSlides.some((s) => s.title.toLowerCase() === flagshipSummit.title.toLowerCase())
    )
      finalSlides.push(flagshipSummit);
    if (
      aiTrailer &&
      !finalSlides.some((s) => s.title.toLowerCase() === aiTrailer.title.toLowerCase())
    )
      finalSlides.push(aiTrailer);

    // Limit to top 6 slides for optimal carousel performance & memory
    const trimmed = finalSlides.slice(0, 6);
    await CacheManager.set(BANNERS_CACHE_KEY, trimmed, ONE_HOUR_MS);
    return trimmed;
  }

  /**
   * Fetch official partner logos for the homepage marquee.
   * Cached with SWR strategy, falling back to authentic enterprise partners.
   */
  static async getPartnerLogos(forceRefresh: boolean = false): Promise<PartnerLogoItem[]> {
    if (!forceRefresh) {
      const cached = await CacheManager.get<PartnerLogoItem[]>(PARTNER_LOGOS_CACHE_KEY, true);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        return cached;
      }
    }

    try {
      // Check if Companion config has dynamic partner logos
      const companionConfig = await CompanionService.fetchAppConfig();
      const dynamicPartners = (companionConfig as any)?.partner_logos;
      if (Array.isArray(dynamicPartners) && dynamicPartners.length > 0) {
        const mapped: PartnerLogoItem[] = dynamicPartners.map((p: any, idx: number) => ({
          id: p.id || `partner-${idx}`,
          name: p.name || 'Partner',
          nameBn: p.name_bn || p.name,
          logoUrl: p.logo_url || p.logoUrl,
          websiteUrl: p.website_url || p.websiteUrl,
        }));
        await CacheManager.set(PARTNER_LOGOS_CACHE_KEY, mapped, ONE_HOUR_MS);
        return mapped;
      }
    } catch (err) {
      if (Env.DEBUG_API) {
        console.warn('[BrandingService] Could not fetch dynamic partner logos:', err);
      }
    }

    await CacheManager.set(PARTNER_LOGOS_CACHE_KEY, DEFAULT_PARTNER_LOGOS, ONE_HOUR_MS);
    return DEFAULT_PARTNER_LOGOS;
  }

  /**
   * Fetch 2x2 home feature grid items ("শিখুন এবং গড়ুন নিজের ক্যারিয়ার").
   */
  static async getHomeFeatureCards(forceRefresh: boolean = false): Promise<HomeFeatureCardItem[]> {
    if (!forceRefresh) {
      const cached = await CacheManager.get<HomeFeatureCardItem[]>(HOME_FEATURES_CACHE_KEY, true);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        return cached;
      }
    }

    try {
      const companionConfig = await CompanionService.fetchAppConfig();
      const dynamicFeatures = (companionConfig as any)?.home_features;
      if (Array.isArray(dynamicFeatures) && dynamicFeatures.length > 0) {
        const mapped: HomeFeatureCardItem[] = dynamicFeatures.map((f: any, idx: number) => ({
          id: f.id || `feat-${idx}`,
          badge: f.badge || 'FEATURED',
          badgeBn: f.badge_bn || 'ফিচার্ড',
          title: f.title || 'Course',
          titleBn: f.title_bn || f.title,
          subtitle: f.subtitle || '',
          subtitleBn: f.subtitle_bn || f.subtitle,
          imageUrl: f.image_url || f.imageUrl,
          actionType: f.action_type || 'courses',
          targetId: f.target_id || f.targetId,
        }));
        await CacheManager.set(HOME_FEATURES_CACHE_KEY, mapped, ONE_HOUR_MS);
        return mapped;
      }
    } catch (err) {
      if (Env.DEBUG_API) {
        console.warn('[BrandingService] Could not fetch dynamic home features:', err);
      }
    }

    await CacheManager.set(HOME_FEATURES_CACHE_KEY, DEFAULT_HOME_FEATURES, ONE_HOUR_MS);
    return DEFAULT_HOME_FEATURES;
  }

  /**
   * Fetch special promotional bundle posters with live pricing and graphics.
   */
  static async getSpecialBundles(
    forceRefresh: boolean = false
  ): Promise<SpecialBundlePosterItem[]> {
    if (!forceRefresh) {
      const cached = await CacheManager.get<SpecialBundlePosterItem[]>(
        SPECIAL_BUNDLES_CACHE_KEY,
        true
      );
      if (cached && Array.isArray(cached) && cached.length > 0) {
        return cached;
      }
    }

    try {
      const collections = await HttpClient.get<any[]>(
        '/wp/v2/lp_collection',
        { _embed: '1', per_page: 6 },
        { skipAuth: true, timeoutMs: 8000 }
      );

      if (Array.isArray(collections) && collections.length > 0) {
        const dynamicBundles: SpecialBundlePosterItem[] = [];
        collections.forEach((col, idx) => {
          const featuredMedia = col._embedded?.['wp:featuredmedia']?.[0]?.source_url;
          const cleanTitle = sanitizeWpText(col.title?.rendered);
          if (cleanTitle && featuredMedia) {
            dynamicBundles.push({
              id: `collection-${col.id || idx}`,
              title: cleanTitle,
              titleBn: cleanTitle,
              posterUrl: featuredMedia,
              price: col.meta?.price ? Number(col.meta.price) : 3500,
              regularPrice: col.meta?.regular_price ? Number(col.meta.regular_price) : 5800,
              currency: '৳',
              discountPercent: 40,
              coursesCount: Array.isArray(col.courses) ? col.courses.length : 4,
              rating: 4.9,
              enrolledCount: 300 + idx * 45,
              targetSlug: col.slug || String(col.id),
            });
          }
        });

        if (dynamicBundles.length > 0) {
          await CacheManager.set(SPECIAL_BUNDLES_CACHE_KEY, dynamicBundles, ONE_HOUR_MS);
          return dynamicBundles;
        }
      }
    } catch (err) {
      if (Env.DEBUG_API) {
        console.warn('[BrandingService] Could not fetch dynamic special bundles:', err);
      }
    }

    await CacheManager.set(SPECIAL_BUNDLES_CACHE_KEY, DEFAULT_SPECIAL_BUNDLES, ONE_HOUR_MS);
    return DEFAULT_SPECIAL_BUNDLES;
  }

  /**
   * Fetch student testimonials ("Why people choose Thriving Skills").
   */
  static async getStudentTestimonials(
    forceRefresh: boolean = false
  ): Promise<StudentTestimonialItem[]> {
    if (!forceRefresh) {
      const cached = await CacheManager.get<StudentTestimonialItem[]>(TESTIMONIALS_CACHE_KEY, true);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        return cached;
      }
    }

    try {
      const companionConfig = await CompanionService.fetchAppConfig();
      const dynamicTestimonials = (companionConfig as any)?.student_testimonials;
      if (Array.isArray(dynamicTestimonials) && dynamicTestimonials.length > 0) {
        const mapped: StudentTestimonialItem[] = dynamicTestimonials.map((t: any, idx: number) => ({
          id: t.id || `test-${idx}`,
          name: t.name || 'Student',
          role: t.role || 'Professional',
          roleBn: t.role_bn || t.role,
          company: t.company,
          quote: t.quote || '',
          quoteBn: t.quote_bn || t.quote,
          rating: t.rating || 5.0,
          avatarUrl: t.avatar_url || t.avatarUrl,
        }));
        await CacheManager.set(TESTIMONIALS_CACHE_KEY, mapped, ONE_HOUR_MS);
        return mapped;
      }
    } catch (err) {
      if (Env.DEBUG_API) {
        console.warn('[BrandingService] Could not fetch dynamic student testimonials:', err);
      }
    }

    await CacheManager.set(TESTIMONIALS_CACHE_KEY, DEFAULT_STUDENT_TESTIMONIALS, ONE_HOUR_MS);
    return DEFAULT_STUDENT_TESTIMONIALS;
  }
}
