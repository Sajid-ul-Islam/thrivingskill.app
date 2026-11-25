import { Course, CourseModule, CategoryId } from '../../types';
import { resolveLessonVideoData } from '../../data/lessonVideosRegistry';
import { getLiveReviewsForCourse } from '../../data/liveReviews';
import { getSafeImageUri } from '../../utils/imageUtils';

// Parse a real duration string such as "1 hours 9 minutes", "02 mins", or "12:30" into total minutes.
export function parseDurationMinutes(duration?: string): number {
  if (!duration || typeof duration !== 'string') return 0;
  const trimmed = duration.trim().toLowerCase();
  if (!trimmed || trimmed === 'lifetime' || trimmed === 'self-paced') return 0;

  if (trimmed.includes(':')) {
    const parts = trimmed.split(':').map((p) => parseInt(p, 10));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return parts[0] + parts[1] / 60;
    }
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return parts[0] * 60 + parts[1] + parts[2] / 60;
    }
  }

  let totalMinutes = 0;
  let matched = false;
  const hourMatch = trimmed.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/i);
  if (hourMatch) {
    totalMinutes += parseFloat(hourMatch[1]) * 60;
    matched = true;
  }
  const minMatch = trimmed.match(/(\d+(?:\.\d+)?)\s*(?:minutes?|mins?|m)\b/i);
  if (minMatch) {
    totalMinutes += parseFloat(minMatch[1]);
    matched = true;
  }
  const secMatch = trimmed.match(/(\d+(?:\.\d+)?)\s*(?:seconds?|secs?|s)\b/i);
  if (secMatch) {
    totalMinutes += parseFloat(secMatch[1]) / 60;
    matched = true;
  }

  if (matched) return totalMinutes;
  const plainNum = parseFloat(trimmed);
  return !isNaN(plainNum) ? plainNum : 0;
}

// Clean HTML tags and HTML entities from WordPress text
export function cleanHtml(text?: string): string {
  if (!text) return '';
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#8216;/g, '‘')
    .replace(/&#8217;/g, '’')
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

// Parse price from BDT format e.g. "৳ 500" or number
export function parseBdtPrice(price: any, rendered?: string): { bdt: number; usd: number } {
  let bdt = 0;
  if (typeof price === 'number') {
    bdt = price;
  } else if (typeof price === 'string') {
    const cleaned = price.replace(/[^0-9.]/g, '');
    bdt = parseFloat(cleaned) || 0;
  } else if (rendered) {
    const cleaned = rendered.replace(/[^0-9.]/g, '');
    bdt = parseFloat(cleaned) || 0;
  }
  // Approximate USD conversion for reference (1 USD ~ 118 BDT)
  const usd = Math.round((bdt / 118) * 10) / 10;
  return { bdt, usd };
}

// Map category slug / name to a visually appealing icon and color
export const CATEGORY_COLOR_MAP: Record<string, { color: string; icon: string }> = {
  'generative-ai': { color: '#8B5CF6', icon: 'sparkles' },
  '4ir': { color: '#06B6D4', icon: 'hardware-chip' },
  excel: { color: '#10B981', icon: 'grid' },
  'data-science': { color: '#3B82F6', icon: 'analytics' },
  business: { color: '#F59E0B', icon: 'briefcase' },
  finance: { color: '#EC4899', icon: 'cash' },
  'supply-chain': { color: '#14B8A6', icon: 'cube' },
  leadership: { color: '#6366F1', icon: 'people' },
  research: { color: '#0EA5E9', icon: 'flask' },
  'job-seekers': { color: '#F97316', icon: 'ribbon' },
};

export function getCategoryTheme(slug: string, name: string) {
  const key = Object.keys(CATEGORY_COLOR_MAP).find(
    (k) => slug.toLowerCase().includes(k) || name.toLowerCase().includes(k)
  );
  if (key && CATEGORY_COLOR_MAP[key]) {
    return CATEGORY_COLOR_MAP[key];
  }
  return { color: '#059669', icon: 'book' };
}

// Transform raw LearnPress course to our App Course model
export function transformWpCourse(raw: any): Course {
  const id = String(raw.id || Math.random());
  const title = cleanHtml(raw.name || raw.title || 'Untitled Course');
  const slug = raw.slug || id;
  const excerpt = cleanHtml(raw.excerpt || raw.content || '');
  const description = raw.content
    ? cleanHtml(raw.content)
    : excerpt || 'Comprehensive professional training course on Thriving Skills.';

  const priceData = parseBdtPrice(raw.price, raw.price_rendered);
  const origPriceData = parseBdtPrice(
    raw.origin_price || raw.regular_price,
    raw.origin_price_rendered
  );
  const bdtPrice = priceData.bdt > 0 ? priceData.bdt : 0;
  const bdtOrigPrice =
    origPriceData.bdt > bdtPrice ? origPriceData.bdt : Math.round(bdtPrice * 1.5) || 1200;

  // Image / thumbnail
  let thumbnail = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800';
  if (typeof raw.image === 'string' && raw.image.trim().length > 0) {
    thumbnail = raw.image;
  } else if (raw.image?.src) {
    thumbnail = raw.image.src;
  }
  thumbnail = getSafeImageUri(thumbnail) || thumbnail;

  // Categories & Taxonomy Slugs
  const categorySlugs: string[] = [];
  const categoryIds: (string | number)[] = [];
  let primaryCatSlug = '';

  if (Array.isArray(raw.categories) && raw.categories.length > 0) {
    raw.categories.forEach((cat: any) => {
      const slug = cat.slug || String(cat.id || '');
      if (slug && slug !== 'published') {
        categorySlugs.push(slug);
        if (cat.id || cat.term_id) categoryIds.push(cat.id || cat.term_id);
        if (!primaryCatSlug) primaryCatSlug = slug;
      }
    });
  }

  // If no category assigned in LearnPress, infer intelligently from title/slug keywords
  if (!primaryCatSlug) {
    const textToCheck = `${title} ${slug} ${excerpt}`.toLowerCase();
    if (textToCheck.match(/bank|financ|account|tax|vat|audit|cfo|investment/)) {
      primaryCatSlug = 'finance-accounting-legal';
    } else if (
      textToCheck.match(/generative|prompt|gpt|llm|midjourney|claude|copilot|ai /) ||
      textToCheck.includes(' ai')
    ) {
      primaryCatSlug = 'generative-ai';
    } else if (textToCheck.match(/excel|spreadsheet|vba|pivot/)) {
      primaryCatSlug = 'microsoft-excel-courses';
    } else if (
      textToCheck.match(/data|python|power bi|tableau|analytics|sql|machine learning|deep learning/)
    ) {
      primaryCatSlug = 'data_science';
    } else if (textToCheck.match(/leader|manage|executive|c-suite|supervis/)) {
      primaryCatSlug = 'leadership-management';
    } else if (textToCheck.match(/market|sales|branding|seo|digital marketing|ad |copywriting/)) {
      primaryCatSlug = 'sales-marketing';
    } else if (
      textToCheck.match(/supply chain|procurement|logistics|inventory|warehouse|contract/)
    ) {
      primaryCatSlug = 'supply-chain-management';
    } else if (textToCheck.match(/hr|human resource|talent|recruit|payroll|kpi/)) {
      primaryCatSlug = 'human-resource-management';
    } else if (textToCheck.match(/research|academic|thesis|methodology|paper/)) {
      primaryCatSlug = 'research-courses';
    } else if (textToCheck.match(/career|job|interview|resume|cv /)) {
      primaryCatSlug = 'job-seekers-skills';
    } else if (textToCheck.match(/4ir|blockchain|iot|robot/)) {
      primaryCatSlug = '4ir';
    } else {
      primaryCatSlug = 'business';
    }
    categorySlugs.push(primaryCatSlug);
  }

  const catId: CategoryId = primaryCatSlug as CategoryId;

  // Instructor
  const instructorRaw = raw.instructor || {};
  const instructor = {
    id: String(instructorRaw.id || 'ts-inst-1'),
    name: cleanHtml(instructorRaw.name || 'Thriving Skills Mentor'),
    title: 'Lead Industry Specialist',
    company: 'Thriving Skills Bangladesh',
    avatar:
      getSafeImageUri(instructorRaw.avatar) || 'https://secure.gravatar.com/avatar/?d=mp&s=300',
    bio: cleanHtml(
      instructorRaw.bio || 'Experienced practitioner and instructor at Thriving Skills.'
    ),
    rating:
      typeof instructorRaw.rating === 'number' && instructorRaw.rating > 0
        ? Number(instructorRaw.rating.toFixed(1))
        : null,
    studentsCount:
      typeof instructorRaw.students_count === 'number' && instructorRaw.students_count > 0
        ? instructorRaw.students_count
        : null,
    coursesCount:
      typeof instructorRaw.courses_count === 'number' && instructorRaw.courses_count > 0
        ? instructorRaw.courses_count
        : null,
  };

  // Modules / Sections (strictly from real LearnPress data; never invent placeholder lessons or videos)
  let modules: CourseModule[] = [];
  let lecturesCount = 0;
  if (Array.isArray(raw.sections) && raw.sections.length > 0) {
    modules = raw.sections.map((sec: any, secIdx: number) => {
      const items = Array.isArray(sec.items) ? sec.items : [];
      lecturesCount += items.length;
      return {
        id: String(sec.id || `mod-${secIdx + 1}`),
        title: cleanHtml(sec.title || `Module ${secIdx + 1}`),
        lessons: items.map((item: any, itemIdx: number) => {
          const isQuiz = item.type === 'lp_quiz' || item.format === 'quiz';
          const realTitle = cleanHtml(
            item.title || (isQuiz ? `Quiz: Module ${secIdx + 1}` : `Lesson ${itemIdx + 1}`)
          );
          const realDuration = cleanHtml(item.duration || '');
          const realSummary = cleanHtml(item.summary || item.excerpt || '');
          const videoData = isQuiz
            ? {
                duration: realDuration,
                videoUrl: undefined,
                videoIntro: undefined,
                videoId: undefined,
                videoType: 'none' as const,
                summary: realSummary,
              }
            : resolveLessonVideoData(
                { id, title, category: catId },
                {
                  id: String(item.id || `les-${secIdx}-${itemIdx}`),
                  title: realTitle,
                  duration: realDuration,
                  summary: realSummary,
                  videoUrl: item.video_url || item.meta_data?.video_url,
                  videoIntro: item.video_intro || item.meta_data?._lp_lesson_video_intro,
                }
              );
          return {
            id: String(item.id || `les-${secIdx}-${itemIdx}`),
            title: realTitle,
            duration: videoData.duration,
            videoUrl: videoData.videoUrl,
            videoIntro: videoData.videoIntro,
            videoId: videoData.videoId,
            videoType: videoData.videoType,
            isFreePreview: Boolean(item.preview) || (!isQuiz && itemIdx === 0),
            summary: videoData.summary,
            type: isQuiz ? ('quiz' as const) : ('lesson' as const),
            quizId: isQuiz ? String(item.id) : undefined,
          };
        }),
      };
    });
  }

  // Determine badge
  let badge: Course['badge'] = undefined;
  if (raw.on_sale) badge = 'Trending';
  if (title.toLowerCase().includes('bundle')) badge = 'Special Bundle';
  if (
    title.toLowerCase().includes('ai') ||
    title.toLowerCase().includes('gemini') ||
    title.toLowerCase().includes('chatgpt')
  ) {
    badge = 'Bestseller';
  }

  const courseStatus = String(raw.course_data?.status || '').toLowerCase();
  const isServerEnrolled =
    raw.enrolled === true ||
    raw.is_enrolled === true ||
    courseStatus === 'enrolled' ||
    courseStatus === 'finished' ||
    courseStatus === 'purchased';

  const moduleMinutes = modules.reduce(
    (sum, m) => sum + m.lessons.reduce((lSum, l) => lSum + parseDurationMinutes(l.duration), 0),
    0
  );
  const serverDurationMinutes = parseDurationMinutes(
    raw.meta_data?.thim_course_duration || raw.duration
  );
  const computedHours =
    serverDurationMinutes > 0
      ? Math.round((serverDurationMinutes / 60) * 10) / 10
      : moduleMinutes > 0
        ? Math.round((moduleMinutes / 60) * 10) / 10
        : 0;
  const metaLessonCount = parseInt(String(raw.meta_data?._lp_offline_lesson_count || ''), 10);
  const computedLecturesCount =
    lecturesCount > 0
      ? lecturesCount
      : !isNaN(metaLessonCount) && metaLessonCount > 0
        ? metaLessonCount
        : 0;

  return {
    id,
    title,
    slug,
    subtitle:
      excerpt.slice(0, 120) || 'Practical skills and industry certification for career growth.',
    category: catId,
    categorySlugs,
    categoryIds,
    level: 'All Levels',
    isEnrolled: isServerEnrolled,
    rating: typeof raw.rating === 'number' && raw.rating > 0 ? Number(raw.rating.toFixed(1)) : null,
    reviewsCount:
      typeof raw.rating_count === 'number' && raw.rating_count > 0
        ? raw.rating_count
        : getLiveReviewsForCourse(id).length > 0
          ? getLiveReviewsForCourse(id).length
          : null,
    enrolledCount:
      typeof raw.count_students === 'number' && raw.count_students > 0 ? raw.count_students : null,
    price: priceData.usd || 15,
    priceBdt: bdtPrice,
    originalPrice: origPriceData.usd || 30,
    originalPriceBdt: bdtOrigPrice,
    thumbnail,
    badge,
    durationHours: computedHours,
    lecturesCount: computedLecturesCount,
    certificateIncluded: true,
    language: 'Bangla & English',
    lastUpdated: raw.date_modified ? raw.date_modified.split('T')[0] : '2026-08',
    instructor,
    highlights: [
      'Learn directly from top industry experts in Bangladesh',
      'Hands-on practical projects ready for your portfolio',
      'Downloadable toolkits, templates, and reference materials',
      'Verified Thriving Skills Certificate of Completion',
    ],
    description,
    prerequisites: [
      'Basic familiarity with relevant computer/web tools',
      'Eagerness to upskill and advance career',
    ],
    modules,
    reviews: getLiveReviewsForCourse(id),
    skillTrack: title.includes('AI') ? 'Generative AI Career Track' : 'Professional Skills Track',
    _searchIndex:
      `${title} ${excerpt} ${instructor.name} ${catId} ${categorySlugs.join(' ')}`.toLowerCase(),
  };
}

/**
 * Transforms a lean course item from the companion plugin (/thrivingskill/v1/feed)
 * into the complete Course model used by the application UI.
 */
export function transformCompanionCourse(raw: any): Course {
  const id = String(raw.id);
  const title = cleanHtml(raw.title || 'Untitled Course');
  const excerpt = cleanHtml(raw.excerpt || '');
  const bdtPrice = typeof raw.price_bdt === 'number' ? raw.price_bdt : 0;
  const bdtOrigPrice =
    typeof raw.origin_price_bdt === 'number' && raw.origin_price_bdt > bdtPrice
      ? raw.origin_price_bdt
      : bdtPrice > 0
        ? Math.round(bdtPrice * 1.5)
        : 1200;

  const usdPrice = Math.round((bdtPrice / 118) * 10) / 10;
  const origUsdPrice = Math.round((bdtOrigPrice / 118) * 10) / 10;

  let thumbnail =
    raw.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800';
  thumbnail = getSafeImageUri(thumbnail) || thumbnail;

  const categorySlug = raw.category?.slug || 'professional-skills';
  const categoryIds = raw.category?.id ? [raw.category.id] : [];

  const instructorName = raw.instructor?.name || 'Thriving Skills Fellow';
  const instructorAvatar =
    getSafeImageUri(raw.instructor?.avatar) ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400';

  const badge: Course['badge'] =
    bdtPrice === 0 || raw.is_free ? 'Top Rated' : bdtPrice <= 1000 ? 'Bestseller' : 'Trending';

  const realRating =
    typeof raw.rating === 'number' && raw.rating > 0 ? Number(raw.rating.toFixed(1)) : null;
  const liveReviews = getLiveReviewsForCourse(id);
  const realReviewsCount =
    typeof raw.reviews_count === 'number' && raw.reviews_count > 0
      ? raw.reviews_count
      : liveReviews.length > 0
        ? liveReviews.length
        : null;
  const realEnrolledCount =
    typeof raw.students_count === 'number' && raw.students_count > 0 ? raw.students_count : null;

  const courseStatus = String(raw.course_data?.status || '').toLowerCase();
  const isServerEnrolled =
    raw.enrolled === true ||
    raw.is_enrolled === true ||
    courseStatus === 'enrolled' ||
    courseStatus === 'finished' ||
    courseStatus === 'purchased';

  return {
    id,
    title,
    slug: raw.slug || id,
    subtitle: excerpt,
    category: categorySlug as CategoryId,
    categorySlugs: [categorySlug],
    categoryIds,
    level: (raw.level || 'All Levels') as any,
    isEnrolled: isServerEnrolled,
    rating: realRating,
    reviewsCount: realReviewsCount,
    enrolledCount: realEnrolledCount,
    price: usdPrice,
    priceBdt: bdtPrice,
    originalPrice: origUsdPrice,
    originalPriceBdt: bdtOrigPrice,
    thumbnail,
    badge,
    durationHours: Math.round((parseDurationMinutes(raw.duration) / 60) * 10) / 10,
    lecturesCount: typeof raw.lectures_count === 'number' ? raw.lectures_count : 0,
    certificateIncluded: true,
    language: 'Bangla & English',
    lastUpdated: '2026-11',
    instructor: {
      id: String(raw.instructor?.id || `inst-${id}`),
      name: instructorName,
      title: 'Senior Faculty & Practitioner',
      company: 'Thriving Skills Bangladesh',
      avatar: instructorAvatar,
      bio: 'Leading industry practitioner with extensive real-world experience.',
      rating:
        typeof raw.instructor?.rating === 'number' && raw.instructor.rating > 0
          ? Number(raw.instructor.rating.toFixed(1))
          : null,
      studentsCount:
        typeof raw.instructor?.students_count === 'number' && raw.instructor.students_count > 0
          ? raw.instructor.students_count
          : null,
      coursesCount:
        typeof raw.instructor?.courses_count === 'number' && raw.instructor.courses_count > 0
          ? raw.instructor.courses_count
          : null,
    },
    modules: [],
    highlights: [
      'Learn directly from top industry experts in Bangladesh',
      'Hands-on practical projects ready for your portfolio',
      'Downloadable toolkits, templates, and reference materials',
      'Verified Thriving Skills Certificate of Completion',
    ],
    description: excerpt || 'Comprehensive professional training course on Thriving Skills.',
    prerequisites: [
      'Basic familiarity with relevant computer/web tools',
      'Eagerness to upskill and advance career',
    ],
    reviews: liveReviews,
    skillTrack: title.includes('AI') ? 'Generative AI Career Track' : 'Professional Skills Track',
    _searchIndex: `${title} ${excerpt} ${instructorName} ${categorySlug}`.toLowerCase(),
  };
}
