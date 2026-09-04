import { Course, CourseModule, CategoryId } from '../../types';

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

// Transform raw LearnPress course to our App Course model
export function transformWpCourse(raw: any): Course {
  const id = String(raw.id || Math.random());
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

  // Categories
  let catId: CategoryId = 'generative-ai';
  if (Array.isArray(raw.categories) && raw.categories.length > 0) {
    const primaryCat = raw.categories[0];
    catId = primaryCat.slug || String(primaryCat.id) || 'generative-ai';
  }

  // Instructor
  const instructorRaw = raw.instructor || {};
  const instructor = {
    id: String(instructorRaw.id || 'ts-inst-1'),
    name: cleanHtml(instructorRaw.name || 'Thriving Skills Mentor'),
    title: 'Lead Industry Specialist',
    company: 'Thriving Skills Bangladesh',
    avatar: instructorRaw.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300',
    bio: cleanHtml(instructorRaw.bio || 'Experienced practitioner and instructor at Thriving Skills.'),
    rating: 4.8 + Math.round((Math.random() * 0.2) * 10) / 10,
    studentsCount: Math.floor(Math.random() * 800) + 200,
    coursesCount: 5,
  };

  // Modules / Sections
  let modules: CourseModule[] = [];
  let lecturesCount = 0;
  if (Array.isArray(raw.sections) && raw.sections.length > 0) {
    modules = raw.sections.map((sec: any, secIdx: number) => {
      const items = Array.isArray(sec.items) ? sec.items : [];
      lecturesCount += items.length;
      return {
        id: String(sec.id || `mod-${secIdx + 1}`),
        title: cleanHtml(sec.title || `Module ${secIdx + 1}`),
        lessons: items.map((item: any, itemIdx: number) => ({
          id: String(item.id || `les-${secIdx}-${itemIdx}`),
          title: cleanHtml(item.title || `Lesson ${itemIdx + 1}`),
          duration: item.duration || '05:00',
          isFreePreview: Boolean(item.preview),
          summary: `Interactive lesson covering ${item.title || 'course competencies'}.`,
        })),
      };
    });
  } else {
    lecturesCount = 8;
    modules = [
      {
        id: `mod-${id}-1`,
        title: 'Foundations & Core Principles',
        lessons: [
          { id: `les-${id}-1`, title: 'Course Orientation & Objectives', duration: '08:15', isFreePreview: true },
          { id: `les-${id}-2`, title: 'Key Frameworks & Essential Concepts', duration: '14:20', isFreePreview: true },
          { id: `les-${id}-3`, title: 'Practical Methodology & Use Cases', duration: '18:40', isFreePreview: false },
        ],
      },
      {
        id: `mod-${id}-2`,
        title: 'Applied Skills & Implementation',
        lessons: [
          { id: `les-${id}-4`, title: 'Hands-on Execution & Real-world Workflows', duration: '22:10', isFreePreview: false },
          { id: `les-${id}-5`, title: 'Industry Best Practices & Troubleshooting', duration: '16:30', isFreePreview: false },
          { id: `les-${id}-6`, title: 'Final Project Evaluation & Certification', duration: '12:00', isFreePreview: false },
        ],
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
    level: 'All Levels',
    rating: typeof raw.rating === 'number' && raw.rating > 0 ? raw.rating : 4.8,
    reviewsCount: Math.floor(Math.random() * 120) + 24,
    enrolledCount: raw.count_students || Math.floor(Math.random() * 600) + 150,
    price: priceData.usd || 15,
    priceBdt: bdtPrice,
    originalPrice: origPriceData.usd || 30,
    originalPriceBdt: bdtOrigPrice,
    thumbnail,
    badge,
    durationHours: Math.max(3, Math.round(lecturesCount * 0.4)),
    lecturesCount: Math.max(modules.reduce((acc, m) => acc + m.lessons.length, 0), 6),
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
    reviews: [
      {
        id: `rev-${id}-1`,
        userName: 'Tanvir Hossain',
        userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200',
        rating: 5,
        date: '2 weeks ago',
        comment: 'Very practical course with clear Bengali explanations and actionable frameworks for everyday corporate work.',
        userRole: 'Analyst',
        company: 'Dhaka Tech',
      },
    ],
    skillTrack: title.includes('AI') ? 'Generative AI Career Track' : 'Professional Skills Track',
  };
}
