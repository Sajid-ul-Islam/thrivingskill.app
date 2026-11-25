import { computeRecommendedCourses } from '../utils/recommendations';
import { Category, Course, UserProgress } from '../types';

const mockCategories: Category[] = [
  {
    id: 'ai',
    name: 'AI & Automation',
    banglaName: 'এআই ও অটোমেশন',
    icon: 'sparkles',
    count: 5,
    color: '#102F53',
  },
  {
    id: 'excel',
    name: 'Excel & Analytics',
    banglaName: 'এক্সেল ও অ্যানালিটিক্স',
    icon: 'grid',
    count: 4,
    color: '#059669',
  },
];

const makeCourse = (
  overrides: Partial<Course> & { id: string; title: string; category: string }
): Course => ({
  id: overrides.id,
  title: overrides.title,
  slug: overrides.id,
  subtitle: 'Subtitle',
  description: overrides.description ?? 'Practical course description',
  category: overrides.category,
  instructor: {
    id: 'inst-1',
    name: 'Instructor',
    title: 'Lead Instructor',
    company: 'Thriving Skills',
    avatar: '',
    bio: 'Bio',
    rating: 4.8,
    studentsCount: 100,
    coursesCount: 3,
  },
  rating: overrides.rating ?? 4.6,
  reviewsCount: 10,
  enrolledCount: overrides.enrolledCount ?? 200,
  durationHours: 2,
  lecturesCount: 5,
  certificateIncluded: true,
  language: 'English',
  lastUpdated: '2026-01-01',
  level: 'Beginner',
  price: 20,
  originalPrice: 30,
  priceBdt: 2000,
  thumbnail: 'https://thrivingskill.com/thumb.jpg',
  highlights: [],
  prerequisites: [],
  modules: [],
  reviews: [],
  badge: overrides.badge,
});

describe('computeRecommendedCourses (real engine)', () => {
  it('penalizes completed courses and prioritizes in-progress & affinity matches', () => {
    const courses: Course[] = [
      makeCourse({
        id: 'c1',
        title: 'Completed Excel Mastery',
        category: 'excel',
        rating: 5.0,
        enrolledCount: 5000,
      }),
      makeCourse({
        id: 'c2',
        title: 'ChatGPT Prompt Engineering',
        category: 'ai',
        rating: 4.9,
        badge: 'Bestseller',
      }),
      makeCourse({ id: 'c3', title: 'Gemini Office Automation', category: 'ai', rating: 4.8 }),
      makeCourse({ id: 'c4', title: 'Basic Accounting', category: 'finance', rating: 4.5 }),
    ];

    const userProgress: Record<string, UserProgress> = {
      c1: {
        courseId: 'c1',
        completedLessonIds: ['l1', 'l2'],
        lastAccessedLessonId: 'l2',
        isCompleted: true,
        enrolledDate: '2026-01-01',
      },
      c3: {
        courseId: 'c3',
        completedLessonIds: ['l1'],
        lastAccessedLessonId: 'l1',
        isCompleted: false,
        enrolledDate: '2026-01-02',
      },
    };

    const result = computeRecommendedCourses({
      courses,
      categories: mockCategories,
      userProgress,
      categoryAffinities: { ai: 4 },
      searchKeywordsHistory: ['gemini'],
      limit: 3,
    });

    expect(result.courses).toHaveLength(3);
    // Completed course c1 receives -80 penalty and should be excluded from top 3
    expect(result.courses.map((c) => c.id)).not.toContain('c1');
    // c3 matches both category affinity ('ai'), active progress (+15), and search keyword ('gemini' +30)
    expect(result.courses[0].id).toBe('c3');
    expect(result.rationale).toContain('AI & Automation');
    expect(result.rationaleBn).toContain('এআই ও অটোমেশন');
  });

  it('returns default executive rationale when affinity is low and honors limit', () => {
    const courses: Course[] = [
      makeCourse({ id: 'a1', title: 'Course One', category: 'excel' }),
      makeCourse({ id: 'a2', title: 'Course Two', category: 'excel', badge: 'Trending' }),
    ];

    const result = computeRecommendedCourses({
      courses,
      categories: mockCategories,
      userProgress: {},
      categoryAffinities: { ai: 1 },
      searchKeywordsHistory: [],
      limit: 1,
    });

    expect(result.courses).toHaveLength(1);
    expect(result.courses[0].id).toBe('a2');
    expect(result.rationale).toContain('executive skill acceleration');
  });
});
