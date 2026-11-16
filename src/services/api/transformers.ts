import { Course, CourseModule, CategoryId } from '../../types';
import { resolveLessonVideoData } from '../../data/lessonVideosRegistry';
import { getLiveReviewsForCourse } from '../../data/liveReviews';

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
  'excel': { color: '#10B981', icon: 'grid' },
  'data-science': { color: '#3B82F6', icon: 'analytics' },
  'business': { color: '#F59E0B', icon: 'briefcase' },
  'finance': { color: '#EC4899', icon: 'cash' },
  'supply-chain': { color: '#14B8A6', icon: 'cube' },
  'leadership': { color: '#6366F1', icon: 'people' },
  'research': { color: '#0EA5E9', icon: 'flask' },
  'job-seekers': { color: '#F97316', icon: 'ribbon' },
};

export function getCategoryTheme(slug: string, name: string) {
  const key = Object.keys(CATEGORY_COLOR_MAP).find((k) =>
    slug.toLowerCase().includes(k) || name.toLowerCase().includes(k)
  );
  if (key && CATEGORY_COLOR_MAP[key]) {
    return CATEGORY_COLOR_MAP[key];
  }
  return { color: '#059669', icon: 'book' };
}

// Deterministic hash to generate consistent display metrics across re-renders
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Transform raw LearnPress course to our App Course model
export function transformWpCourse(raw: any): Course {
  const id = String(raw.id || Math.random());
  const seed = hashString(id);
  const title = cleanHtml(raw.name || raw.title || 'Untitled Course');
  const slug = raw.slug || id;
  const excerpt = cleanHtml(raw.excerpt || raw.content || '');
  const description = raw.content ? cleanHtml(raw.content) : excerpt || 'Comprehensive professional training course on Thriving Skills.';
  
  const priceData = parseBdtPrice(raw.price, raw.price_rendered);
  const origPriceData = parseBdtPrice(raw.origin_price || raw.regular_price, raw.origin_price_rendered);
  const bdtPrice = priceData.bdt > 0 ? priceData.bdt : 0;
  const bdtOrigPrice = origPriceData.bdt > bdtPrice ? origPriceData.bdt : Math.round(bdtPrice * 1.5) || 1200;

  // Image / thumbnail
  let thumbnail = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800';
  if (typeof raw.image === 'string' && raw.image.trim().length > 0) {
    thumbnail = raw.image;
  } else if (raw.image?.src) {
    thumbnail = raw.image.src;
  }

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
    } else if (textToCheck.match(/generative|prompt|gpt|llm|midjourney|claude|copilot|ai /) || textToCheck.includes(' ai')) {
      primaryCatSlug = 'generative-ai';
    } else if (textToCheck.match(/excel|spreadsheet|vba|pivot/)) {
      primaryCatSlug = 'microsoft-excel-courses';
    } else if (textToCheck.match(/data|python|power bi|tableau|analytics|sql|machine learning|deep learning/)) {
      primaryCatSlug = 'data_science';
    } else if (textToCheck.match(/leader|manage|executive|c-suite|supervis/)) {
      primaryCatSlug = 'leadership-management';
    } else if (textToCheck.match(/market|sales|branding|seo|digital marketing|ad |copywriting/)) {
      primaryCatSlug = 'sales-marketing';
    } else if (textToCheck.match(/supply chain|procurement|logistics|inventory|warehouse|contract/)) {
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
    avatar: instructorRaw.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300',
    bio: cleanHtml(instructorRaw.bio || 'Experienced practitioner and instructor at Thriving Skills.'),
    rating: 4.8 + ((seed % 3) / 10),
    studentsCount: 200 + (seed % 650),
    coursesCount: 5,
  };

  // Modules / Sections
  let modules: CourseModule[] = [];
  let lecturesCount = 0;
  if (Array.isArray(raw.sections) && raw.sections.length > 0) {
    let globalLessonIdx = 0;
    modules = raw.sections.map((sec: any, secIdx: number) => {
      const items = Array.isArray(sec.items) ? sec.items : [];
      lecturesCount += items.length;
      return {
        id: String(sec.id || `mod-${secIdx + 1}`),
        title: cleanHtml(sec.title || `Module ${secIdx + 1}`),
        lessons: items.map((item: any, itemIdx: number) => {
          const isQuiz = item.type === 'lp_quiz' || item.format === 'quiz';
          const videoData = isQuiz
            ? {
                duration: item.duration || '10:00',
                videoUrl: undefined,
                videoIntro: undefined,
                videoType: 'none' as const,
                summary: `Assessment quiz testing course competencies for ${cleanHtml(item.title || 'this module')}.`,
              }
            : resolveLessonVideoData(
                { id, title, category: catId },
                { id: String(item.id), title: cleanHtml(item.title) },
                globalLessonIdx++
              );
          return {
            id: String(item.id || `les-${secIdx}-${itemIdx}`),
            title: cleanHtml(item.title || (isQuiz ? `Quiz: Module ${secIdx + 1}` : `Lesson ${itemIdx + 1}`)),
            duration: item.duration || videoData.duration || (isQuiz ? '10:00' : '15:00'),
            videoUrl: videoData.videoUrl,
            videoIntro: videoData.videoIntro,
            videoType: videoData.videoType,
            isFreePreview: Boolean(item.preview) || (!isQuiz && itemIdx === 0),
            summary: item.summary || videoData.summary || `Interactive lesson covering ${item.title || 'course competencies'}.`,
            type: isQuiz ? ('quiz' as const) : ('lesson' as const),
            quizId: isQuiz ? String(item.id) : undefined,
          };
        }),
      };
    });
  } else {
    const fallbackLessonsMod1 = [
      { id: `les-${id}-1`, title: 'Course Orientation & Objectives', isFreePreview: true },
      { id: `les-${id}-2`, title: 'Key Frameworks & Essential Concepts', isFreePreview: true },
      { id: `les-${id}-3`, title: 'Practical Methodology & Use Cases', isFreePreview: false },
    ].map((l, idx) => {
      const v = resolveLessonVideoData({ id, title, category: catId }, l, idx);
      return {
        ...l,
        duration: v.duration,
        videoUrl: v.videoUrl,
        videoIntro: v.videoIntro,
        videoType: v.videoType,
        summary: v.summary,
      };
    });

    const fallbackLessonsMod2 = [
      { id: `les-${id}-4`, title: 'Hands-on Execution & Real-world Workflows', isFreePreview: false },
      { id: `les-${id}-5`, title: 'Industry Best Practices & Troubleshooting', isFreePreview: false },
      { id: `les-${id}-6`, title: 'Final Project Evaluation & Certification', isFreePreview: false },
    ].map((l, idx) => {
      const v = resolveLessonVideoData({ id, title, category: catId }, l, idx + 3);
      return {
        ...l,
        duration: v.duration,
        videoUrl: v.videoUrl,
        videoIntro: v.videoIntro,
        videoType: v.videoType,
        summary: v.summary,
      };
    });

    lecturesCount = 6;
    modules = [
      {
        id: `mod-${id}-1`,
        title: 'Foundations & Core Principles',
        lessons: fallbackLessonsMod1,
      },
      {
        id: `mod-${id}-2`,
        title: 'Applied Skills & Implementation',
        lessons: fallbackLessonsMod2,
      },
    ];
  }

  // Determine badge
  let badge: Course['badge'] = undefined;
  if (raw.on_sale) badge = 'Trending';
  if (title.toLowerCase().includes('bundle')) badge = 'Special Bundle';
  if (title.toLowerCase().includes('ai') || title.toLowerCase().includes('gemini') || title.toLowerCase().includes('chatgpt')) {
    badge = 'Bestseller';
  }

  return {
    id,
    title,
    slug,
    subtitle: excerpt.slice(0, 120) || 'Practical skills and industry certification for career growth.',
    category: catId,
    categorySlugs,
    categoryIds,
    level: 'All Levels',
    rating: typeof raw.rating === 'number' && raw.rating > 0 ? Number(raw.rating.toFixed(1)) : 0,
    reviewsCount: raw.rating_count || (raw.rating > 0 ? 1 : 0),
    enrolledCount: raw.count_students || 0,
    price: priceData.usd || 15,
    priceBdt: bdtPrice,
    originalPrice: origPriceData.usd || 30,
    originalPriceBdt: bdtOrigPrice,
    thumbnail,
    badge,
    durationHours: Math.max(3, Math.round(lecturesCount * 0.4)),
    lecturesCount: Math.max(modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0), 6),
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
    prerequisites: ['Basic familiarity with relevant computer/web tools', 'Eagerness to upskill and advance career'],
    modules,
    reviews: getLiveReviewsForCourse(id),
    skillTrack: title.includes('AI') ? 'Generative AI Career Track' : 'Professional Skills Track',
    _searchIndex: `${title} ${excerpt} ${instructor.name} ${catId} ${categorySlugs.join(' ')}`.toLowerCase(),
  };
}
