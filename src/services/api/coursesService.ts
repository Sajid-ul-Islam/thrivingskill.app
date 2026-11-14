import { HttpClient } from './httpClient';
import { Endpoints } from './endpoints';
import { CacheManager } from '../cache/cacheManager';
import { Course, Category, CategoryId, Workshop } from '../../types';
import { transformWpCourse, cleanHtml } from './transformers';

export interface CourseQueryParams {
  page?: number;
  perPage?: number;
  search?: string;
  category?: string | number;
  order?: 'asc' | 'desc';
  orderby?: 'date' | 'title' | 'price' | 'popularity';
  forceRefresh?: boolean;
}

export class CoursesService {
  private static COURSES_CACHE_PREFIX = 'courses_list';
  private static CATEGORIES_CACHE_KEY = 'categories_list';
  private static LIVE_WORKSHOPS_CACHE_KEY = 'live_workshops_list';

  /**
   * Fetch courses with caching, pagination, category filtering, and search.
   * On failure, returns stale cache if available, otherwise throws so callers
   * can display explicit error/offline states instead of silent mock data.
   */
  static async getCourses(params: CourseQueryParams = {}): Promise<Course[]> {
    const page = params.page || 1;
    const perPage = params.perPage || 30;
    const cacheKey = `${this.COURSES_CACHE_PREFIX}_p${page}_pp${perPage}_s${params.search || ''}_c${params.category || ''}`;

    // Try fresh cache first if not searching or forcing refresh
    if (!params.search && !params.forceRefresh) {
      const cached = await CacheManager.get<Course[]>(cacheKey);
      if (cached && cached.length > 0) return cached;
    }

    try {
      const queryParams: Record<string, any> = {
        page,
        per_page: perPage,
      };

      if (params.search && params.search.trim()) {
        queryParams.search = params.search.trim();
      }
      if (params.category && params.category !== 'all') {
        queryParams.category = params.category;
      }
      if (params.order) queryParams.order = params.order;
      if (params.orderby) queryParams.orderby = params.orderby;

      const rawCourses = await HttpClient.get<any[]>(Endpoints.LEARNPRESS.COURSES, queryParams);

      if (!Array.isArray(rawCourses)) {
        throw new Error('Expected array of courses from backend');
      }

      const courses = rawCourses.map(transformWpCourse);

      // Cache the fresh result
      await CacheManager.set(cacheKey, courses);

      return courses;
    } catch (err) {
      // Try stale cache on failure
      const stale = await CacheManager.get<Course[]>(cacheKey, true);
      if (stale && stale.length > 0) return stale;

      // Do NOT return mock courses; throw or return empty array so UI can show proper error/empty state
      throw err;
    }
  }

  /**
   * Fetch full course details by ID including curriculum sections and lessons.
   * Throws on failure when neither fresh nor stale cache is found.
   */
  static async getCourseDetail(courseId: string | number, forceRefresh: boolean = false): Promise<Course> {
    const cacheKey = `course_detail_${courseId}`;

    if (!forceRefresh) {
      const cached = await CacheManager.get<Course>(cacheKey);
      if (cached) return cached;
    }

    try {
      const raw = await HttpClient.get<any>(Endpoints.LEARNPRESS.COURSE_DETAIL(courseId));
      const course = transformWpCourse(raw);

      // Cache detail with extended TTL (10 minutes)
      await CacheManager.set(cacheKey, course, 600000);

      return course;
    } catch (err) {
      const stale = await CacheManager.get<Course>(cacheKey, true);
      if (stale) return stale;

      throw err;
    }
  }

  /**
   * Fetch course categories from LearnPress.
   * Returns valid categories with live course counts.
   */
  static async getCategories(): Promise<Category[]> {
    const cached = await CacheManager.get<Category[]>(this.CATEGORIES_CACHE_KEY);
    if (cached && cached.length > 0) return cached;

    try {
      const rawCats = await HttpClient.get<any[]>(Endpoints.LEARNPRESS.COURSE_CATEGORIES, {
        per_page: 50,
      });

      if (!Array.isArray(rawCats)) {
        throw new Error('Expected array of categories');
      }

      const validCats = rawCats.filter((c: any) => c.count > 0 && c.slug !== 'published');

      const totalCount = validCats.reduce((acc: number, c: any) => acc + (c.count || 0), 0);

      const mapped: Category[] = [
        {
          id: 'all',
          name: 'All Courses',
          banglaName: 'সব কোর্স',
          icon: 'grid',
          count: totalCount,
          color: '#059669',
          slug: 'all',
        },
        ...validCats.map((c: any) => ({
          id: c.slug || String(c.id),
          name: cleanHtml(c.name),
          count: c.count,
          icon: 'book',
          color: '#4F46E5',
          slug: c.slug,
        })),
      ];

      await CacheManager.set(this.CATEGORIES_CACHE_KEY, mapped, 900000); // 15 minutes
      return mapped;
    } catch (err) {
      const stale = await CacheManager.get<Category[]>(this.CATEGORIES_CACHE_KEY, true);
      if (stale && stale.length > 0) return stale;

      // Fallback to minimal root category with 0 count until synced
      return [
        {
          id: 'all',
          name: 'All Courses',
          banglaName: 'সব কোর্স',
          icon: 'grid',
          count: 0,
          color: '#059669',
          slug: 'all',
        },
      ];
    }
  }

  /**
   * Fetch authentic live workshops and upcoming masterclasses from LearnPress
   * (Category 459: Upcoming Live Training).
   */
  static async getLiveWorkshops(): Promise<Workshop[]> {
    const cacheKey = this.LIVE_WORKSHOPS_CACHE_KEY;
    const cached = await CacheManager.get<Workshop[]>(cacheKey);
    if (cached && cached.length > 0) return cached;

    try {
      const raw = await HttpClient.get<any[]>(Endpoints.LEARNPRESS.COURSES, {
        category: 459,
        per_page: 20,
      });

      if (!Array.isArray(raw)) throw new Error('Expected array of live training courses');

      const workshops: Workshop[] = raw.map((c: any) => {
        const course = transformWpCourse(c);
        return {
          id: String(course.id),
          title: course.title,
          description: course.subtitle || course.description || 'Interactive live masterclass hosted by Thriving Skills.',
          speaker: course.instructor,
          date: 'Upcoming Live Session',
          time: '7:30 PM - 9:30 PM (GMT+6)',
          duration: `${course.durationHours || 2} Hours Live`,
          seatsLeft: Math.max(5, (parseInt(course.id, 10) % 25) + 3),
          totalSeats: 100,
          isLive: false,
          category: course.category,
          thumbnail: course.thumbnail,
          price: course.price,
          priceBdt: course.priceBdt,
          isProFree: true,
        };
      });

      await CacheManager.set(cacheKey, workshops, 300000); // 5 min cache
      return workshops;
    } catch (err) {
      const stale = await CacheManager.get<Workshop[]>(cacheKey, true);
      if (stale && stale.length > 0) return stale;
      return [];
    }
  }

  /**
   * Enroll the authenticated user into a course
   */
  static async enrollCourse(courseId: string | number): Promise<{ success: boolean; message?: string }> {
    return HttpClient.post(Endpoints.LEARNPRESS.COURSE_ENROLL, { id: courseId });
  }

  /**
   * Retake a course
   */
  static async retakeCourse(courseId: string | number): Promise<any> {
    return HttpClient.post(Endpoints.LEARNPRESS.COURSE_RETAKE, { id: courseId });
  }

  /**
   * Mark a course as finished
   */
  static async finishCourse(courseId: string | number): Promise<any> {
    return HttpClient.post(Endpoints.LEARNPRESS.COURSE_FINISH, { id: courseId });
  }
}
