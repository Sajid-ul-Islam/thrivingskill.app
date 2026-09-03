import { HttpClient } from './httpClient';
import { Endpoints } from './endpoints';
import { CacheManager } from '../cache/cacheManager';
import { Course, Category, CategoryId } from '../../types';
import { COURSES as FALLBACK_COURSES, CATEGORIES as INITIAL_CATEGORIES } from '../../data/mockData';
import { transformWpCourse, cleanHtml } from '../wordpressApi';

export interface CourseQueryParams {
  page?: number;
  perPage?: number;
  search?: string;
  category?: string | number;
  order?: 'asc' | 'desc';
  orderby?: 'date' | 'title' | 'price' | 'popularity';
}

export class CoursesService {
  private static COURSES_CACHE_PREFIX = 'courses_list';
  private static CATEGORIES_CACHE_KEY = 'categories_list';

  /**
   * Fetch courses with caching, pagination, category filtering, and search
   */
  static async getCourses(params: CourseQueryParams = {}): Promise<Course[]> {
    const page = params.page || 1;
    const perPage = params.perPage || 30;
    const cacheKey = `${this.COURSES_CACHE_PREFIX}_p${page}_pp${perPage}_s${params.search || ''}_c${params.category || ''}`;

    // Try fresh cache first if not searching
    if (!params.search) {
      const cached = await CacheManager.get<Course[]>(cacheKey);
      if (cached) return cached;
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

      // Cache the result
      await CacheManager.set(cacheKey, courses);

      return courses;
    } catch (err) {
      // Try stale cache on failure
      const stale = await CacheManager.get<Course[]>(cacheKey, true);
      if (stale && stale.length > 0) return stale;

      // Fallback to seed courses if enabled
      return FALLBACK_COURSES;
    }
  }

  /**
   * Fetch full course details by ID including curriculum sections and lessons
   */
  static async getCourseDetail(courseId: string | number): Promise<Course> {
    const cacheKey = `course_detail_${courseId}`;

    const cached = await CacheManager.get<Course>(cacheKey);
    if (cached) return cached;

    try {
      const raw = await HttpClient.get<any>(Endpoints.LEARNPRESS.COURSE_DETAIL(courseId));
      const course = transformWpCourse(raw);

      // Cache detail with extended TTL
      await CacheManager.set(cacheKey, course, 600000); // 10 minutes

      return course;
    } catch (err) {
      const stale = await CacheManager.get<Course>(cacheKey, true);
      if (stale) return stale;

      const fallback = FALLBACK_COURSES.find((c) => c.id === String(courseId));
      if (fallback) return fallback;

      throw err;
    }
  }

  /**
   * Fetch course categories from LearnPress
   */
  static async getCategories(): Promise<Category[]> {
    const cached = await CacheManager.get<Category[]>(this.CATEGORIES_CACHE_KEY);
    if (cached) return cached;

    try {
      const rawCats = await HttpClient.get<any[]>(Endpoints.LEARNPRESS.COURSE_CATEGORIES, {
        per_page: 50,
      });

      if (!Array.isArray(rawCats)) {
        throw new Error('Expected array of categories');
      }

      const validCats = rawCats.filter((c: any) => c.count > 0 && c.slug !== 'published');

      const mapped: Category[] = [
        {
          id: 'all',
          name: 'All Courses',
          banglaName: 'সব কোর্স',
          icon: 'grid',
          count: 372,
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
    } catch {
      const stale = await CacheManager.get<Category[]>(this.CATEGORIES_CACHE_KEY, true);
      if (stale) return stale;
      return INITIAL_CATEGORIES;
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
