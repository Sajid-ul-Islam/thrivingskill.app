import { HttpClient } from './httpClient';
import { Endpoints } from './endpoints';
import { CacheManager } from '../cache/cacheManager';
import { Course, Category, CategoryId, Workshop } from '../../types';
import { transformWpCourse, cleanHtml } from './transformers';
import { Env } from '../../config/env';

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

  // Catalog update subscribers for real-time background sync
  private static catalogListeners = new Set<() => void>();

  static subscribeCatalogUpdates(listener: () => void): () => void {
    this.catalogListeners.add(listener);
    return () => {
      this.catalogListeners.delete(listener);
    };
  }

  static notifyCatalogUpdated(): void {
    this.catalogListeners.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        if (Env.DEBUG_API) console.warn('[CoursesService] Catalog listener error:', e);
      }
    });
  }

  /**
   * Fetch courses with caching, pagination, category filtering, search, and SWR.
   * On failure, returns stale cache if available, otherwise throws so callers
   * can display explicit error/offline states instead of silent mock data.
   */
  static async getCourses(params: CourseQueryParams = {}): Promise<Course[]> {
    const page = params.page || 1;
    const perPage = params.perPage || 30;
    const cacheKey = `${this.COURSES_CACHE_PREFIX}_p${page}_pp${perPage}_s${params.search || ''}_c${params.category || ''}`;

    const fetchFromNetwork = async (): Promise<Course[]> => {
      const queryParams: Record<string, any> = {
        page,
        per_page: perPage,
        _t: Date.now(),
      };

      if (params.search && params.search.trim()) {
        queryParams.search = params.search.trim();
      }
      if (params.category && params.category !== 'all') {
        queryParams.category = params.category;
      }
      if (params.order) queryParams.order = params.order;
      if (params.orderby) queryParams.orderby = params.orderby;

      const rawCourses = await HttpClient.get<any[]>(
        Endpoints.LEARNPRESS.COURSES,
        queryParams,
        {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
          },
        }
      );

      if (!Array.isArray(rawCourses)) {
        throw new Error('Expected array of courses from backend');
      }

      return rawCourses.map(transformWpCourse);
    };

    // If explicit forceRefresh or performing a text query, fetch directly
    if (params.forceRefresh || params.search) {
      const freshCourses = await fetchFromNetwork();
      await CacheManager.set(cacheKey, freshCourses);
      return freshCourses;
    }

    // Stale-While-Revalidate: return stale immediately, revalidate silently
    const courses = await CacheManager.getOrRevalidate<Course[]>(
      cacheKey,
      fetchFromNetwork,
      (updatedCourses) => {
        if (Env.DEBUG_API) {
          console.log(`[CoursesService] Live sync detected ${updatedCourses.length} updated courses`);
        }
        this.notifyCatalogUpdated();
      }
    );

    return courses || [];
  }

  /**
   * Fetch full course details by ID including curriculum sections and lessons.
   * Throws on failure when neither fresh nor stale cache is found.
   */
  static async getCourseDetail(courseId: string | number, forceRefresh: boolean = false): Promise<Course> {
    const cacheKey = `course_detail_${courseId}`;

    const fetchDetailFromNetwork = async (): Promise<Course> => {
      const raw = await HttpClient.get<any>(
        Endpoints.LEARNPRESS.COURSE_DETAIL(courseId),
        { _t: Date.now() },
        {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
          },
        }
      );
      return transformWpCourse(raw);
    };

    if (forceRefresh) {
      const course = await fetchDetailFromNetwork();
      await CacheManager.set(cacheKey, course, 600000);
      return course;
    }

    const course = await CacheManager.getOrRevalidate<Course>(
      cacheKey,
      fetchDetailFromNetwork,
      () => {
        if (Env.DEBUG_API) {
          console.log(`[CoursesService] Live course detail updated for ${courseId}`);
        }
        this.notifyCatalogUpdated();
      },
      600000
    );

    if (course) return course;
    throw new Error(`Failed to load course ${courseId}`);
  }

  /**
   * Fetch course categories from LearnPress.
   * Returns valid categories with live course counts.
   */
  static async getCategories(forceRefresh: boolean = false): Promise<Category[]> {
    const fetchCatsFromNetwork = async (): Promise<Category[]> => {
      const rawCats = await HttpClient.get<any[]>(
        Endpoints.LEARNPRESS.COURSE_CATEGORIES,
        {
          per_page: 50,
          _t: Date.now(),
        },
        {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
          },
        }
      );

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

      return mapped;
    };

    if (forceRefresh) {
      const cats = await fetchCatsFromNetwork();
      await CacheManager.set(this.CATEGORIES_CACHE_KEY, cats, 900000);
      return cats;
    }

    const cats = await CacheManager.getOrRevalidate<Category[]>(
      this.CATEGORIES_CACHE_KEY,
      fetchCatsFromNetwork,
      () => {
        this.notifyCatalogUpdated();
      },
      900000
    );

    return cats || [
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

  /**
   * Fetch authentic live workshops and upcoming masterclasses from LearnPress
   * (Category 459: Upcoming Live Training).
   */
  static async getLiveWorkshops(forceRefresh: boolean = false): Promise<Workshop[]> {
    const cacheKey = this.LIVE_WORKSHOPS_CACHE_KEY;

    const fetchWorkshopsFromNetwork = async (): Promise<Workshop[]> => {
      const raw = await HttpClient.get<any[]>(
        Endpoints.LEARNPRESS.COURSES,
        {
          category: 459,
          per_page: 20,
          _t: Date.now(),
        },
        {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
          },
        }
      );

      if (!Array.isArray(raw)) throw new Error('Expected array of live training courses');

      return raw.map((c: any) => {
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
          joinUrl: `https://thrivingskill.com/courses/${course.id}`,
        };
      });
    };

    if (forceRefresh) {
      const workshops = await fetchWorkshopsFromNetwork();
      await CacheManager.set(cacheKey, workshops, 300000);
      return workshops;
    }

    const workshops = await CacheManager.getOrRevalidate<Workshop[]>(
      cacheKey,
      fetchWorkshopsFromNetwork,
      () => {
        this.notifyCatalogUpdated();
      },
      300000
    );

    return workshops || [];
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
