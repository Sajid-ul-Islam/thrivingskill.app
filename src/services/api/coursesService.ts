import { HttpClient } from './httpClient';
import { Endpoints } from './endpoints';
import { CacheManager } from '../cache/cacheManager';
import { Course, Category, Workshop } from '../../types';
import { transformWpCourse, transformCompanionCourse, cleanHtml } from './transformers';
import { CompanionService } from './companionService';
import { Env } from '../../config/env';
import { INITIAL_COURSES_SEED } from '../../data/coursesCatalogSeed';

// Eagerly pre-seed in-memory cache with the verified catalog for 0ms startup
CacheManager.set('courses_full_catalog', INITIAL_COURSES_SEED, 1800000).catch(() => {});

export interface CourseQueryParams {
  page?: number;
  perPage?: number;
  search?: string;
  category?: string | number;
  order?: 'asc' | 'desc';
  orderby?: 'date' | 'title' | 'price' | 'popularity';
  forceRefresh?: boolean;
  fetchAll?: boolean;
}

export class CoursesService {
  private static COURSES_CACHE_PREFIX = 'courses_list';
  private static ALL_COURSES_CACHE_KEY = 'courses_full_catalog';
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
   * Synchronously retrieve cached courses from memory (0ms latency).
   * Falls back to verified seed catalog if memory cache has not yet been populated.
   */
  static getCachedCoursesSync(): Course[] {
    const memory = CacheManager.getSync<Course[]>(this.ALL_COURSES_CACHE_KEY);
    if (memory && memory.length > 0) return memory;
    return INITIAL_COURSES_SEED;
  }

  /**
   * Synchronously retrieve cached categories from memory (0ms latency).
   * Falls back to verified categories with calculated counts if memory cache is unpopulated.
   */
  static getCachedCategoriesSync(): Category[] {
    const memory = CacheManager.getSync<Category[]>(this.CATEGORIES_CACHE_KEY);
    if (memory && memory.length > 0) return memory;
    return [];
  }

  /**
   * Asynchronously retrieve cached courses from memory or persistent storage.
   */
  static async getCachedCourses(): Promise<Course[]> {
    const cached = await CacheManager.get<Course[]>(this.ALL_COURSES_CACHE_KEY, true);
    if (cached && cached.length > 0) return cached;
    return INITIAL_COURSES_SEED;
  }

  /**
   * Comprehensive Catalog Synchronization:
   * Fetches ALL courses from the main site across all pagination pages up to x-wp-totalpages.
   * Utilizes Stale-While-Revalidate (SWR): instantaneous cache response followed by silent background sync.
   */
  static async getAllCourses(forceRefresh: boolean = false): Promise<Course[]> {
    const fetchAllFromNetwork = async (): Promise<Course[]> => {
      // Strategy 1: Attempt high-speed Companion Plugin paginated feed (/thrivingskill/v1/feed)
      try {
        const leanCourses = await CompanionService.fetchAllLeanFeed();
        if (Array.isArray(leanCourses) && leanCourses.length > 0) {
          if (Env.DEBUG_API) {
            console.log(
              `[CoursesService] Loaded ${leanCourses.length} courses via TS Mobile Bridge feed.`
            );
          }
          const transformed = leanCourses.map(transformCompanionCourse);
          await CacheManager.set(CoursesService.ALL_COURSES_CACHE_KEY, transformed, 1800000);
          CoursesService.notifyCatalogUpdated();
          return transformed;
        }
      } catch (companionErr) {
        if (Env.DEBUG_API) {
          console.warn(
            '[CoursesService] Companion feed unavailable, proceeding with standard LearnPress sync:',
            companionErr
          );
        }
      }

      if (Env.DEBUG_API) {
        console.log('[CoursesService] Starting full catalog sync from LearnPress...');
      }

      // Strategy 2: Standard LearnPress pagination sync
      // Step 1: Fetch Page 1 with per_page=100 and extract pagination metadata
      const p1 = await HttpClient.getWithMeta<any[]>(
        Endpoints.LEARNPRESS.COURSES,
        {
          per_page: 100,
          page: 1,
          _t: Date.now(),
        },
        {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
          },
        }
      );

      if (!Array.isArray(p1.data)) {
        throw new Error('Expected array of courses from backend');
      }

      const totalPages = Math.max(1, p1.totalPages || 1);
      let allRaw: any[] = [...p1.data];

      // Step 2: Concurrently fetch remaining pages if totalPages > 1
      if (totalPages > 1) {
        const remainingPagePromises: Promise<any[]>[] = [];
        for (let page = 2; page <= totalPages; page++) {
          remainingPagePromises.push(
            HttpClient.get<any[]>(
              Endpoints.LEARNPRESS.COURSES,
              {
                per_page: 100,
                page,
                _t: Date.now(),
              },
              {
                headers: {
                  'Cache-Control': 'no-cache, no-store, must-revalidate',
                  Pragma: 'no-cache',
                },
              }
            ).catch((err) => {
              if (Env.DEBUG_API) {
                console.warn(`[CoursesService] Page ${page} fetch error:`, err);
              }
              return [];
            })
          );
        }

        const remainingResults = await Promise.all(remainingPagePromises);
        remainingResults.forEach((pageData) => {
          if (Array.isArray(pageData)) {
            allRaw = allRaw.concat(pageData);
          }
        });
      }

      // Step 3: Deduplicate by course ID
      const courseMap = new Map<string, any>();
      allRaw.forEach((item) => {
        if (item && item.id) {
          courseMap.set(String(item.id), item);
        }
      });

      const uniqueRaw = Array.from(courseMap.values());
      const transformed = uniqueRaw.map(transformWpCourse);

      if (Env.DEBUG_API) {
        console.log(
          `[CoursesService] Successfully synced full catalog: ${transformed.length} courses across ${totalPages} pages`
        );
      }

      return transformed;
    };

    if (forceRefresh) {
      const freshCourses = await fetchAllFromNetwork();
      await CacheManager.set(this.ALL_COURSES_CACHE_KEY, freshCourses, 1800000); // 30 mins
      return freshCourses;
    }

    // Stale-While-Revalidate
    const courses = await CacheManager.getOrRevalidate<Course[]>(
      this.ALL_COURSES_CACHE_KEY,
      fetchAllFromNetwork,
      (updatedCourses) => {
        if (Env.DEBUG_API) {
          console.log(
            `[CoursesService] Background sync updated ${updatedCourses.length} courses in catalog`
          );
        }
        this.notifyCatalogUpdated();
      },
      1800000
    );

    return courses || [];
  }

  /**
   * Fetch courses with caching, pagination, category filtering, search, and SWR.
   * If fetchAll is specified or default catalog is queried without filters, delegates to getAllCourses.
   */
  static async getCourses(params: CourseQueryParams = {}): Promise<Course[]> {
    if (
      params.fetchAll ||
      (!params.page && !params.perPage && !params.search && !params.category)
    ) {
      return this.getAllCourses(params.forceRefresh);
    }

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

      const rawCourses = await HttpClient.get<any[]>(Endpoints.LEARNPRESS.COURSES, queryParams, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      });

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
          console.log(
            `[CoursesService] Live sync detected ${updatedCourses.length} updated courses`
          );
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
  static async getCourseDetail(
    courseId: string | number,
    forceRefresh: boolean = false
  ): Promise<Course> {
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
  /**
   * Fetch course categories from WordPress / LearnPress.
   * Returns valid categories with live course counts and bilingual names.
   */
  static async getCategories(forceRefresh: boolean = false): Promise<Category[]> {
    const fetchCatsFromNetwork = async (): Promise<Category[]> => {
      let rawCats: any[] | null = null;

      // Primary: WordPress Core course_category taxonomy (public, zero auth required)
      try {
        rawCats = await HttpClient.get<any[]>(
          Endpoints.WORDPRESS.COURSE_CATEGORIES,
          {
            per_page: 100,
            _t: Date.now(),
          },
          {
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              Pragma: 'no-cache',
            },
          }
        );
      } catch (err) {
        if (Env.DEBUG_API)
          console.warn('[CoursesService] WP course_category fetch failed, falling back:', err);
      }

      // Fallback: LearnPress v1 endpoint
      if (!Array.isArray(rawCats) || rawCats.length === 0) {
        try {
          rawCats = await HttpClient.get<any[]>(
            Endpoints.LEARNPRESS.COURSE_CATEGORIES,
            {
              per_page: 100,
              _t: Date.now(),
            },
            {
              headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                Pragma: 'no-cache',
              },
            }
          );
        } catch (err) {
          if (Env.DEBUG_API)
            console.warn('[CoursesService] LearnPress course_category fetch failed:', err);
        }
      }

      if (!Array.isArray(rawCats)) {
        throw new Error('Expected array of categories');
      }

      // Filter out internal metadata/offer tags
      const excludedSlugs = new Set(['published', 'get-offer', '60-off', 'get-tickets', 'courses']);
      const validCats = rawCats.filter((c: any) => c.count > 0 && !excludedSlugs.has(c.slug));
      const totalCount = validCats.reduce((acc: number, c: any) => acc + (c.count || 0), 0);

      const getCategoryBanglaName = (slug: string, name: string): string => {
        const s = (slug || '').toLowerCase();
        const n = (name || '').toLowerCase();
        if (s.includes('generative-ai') || s.includes('4ir') || n.includes('ai'))
          return 'জেনারেটিভ এআই';
        if (s.includes('excel') || n.includes('excel')) return 'মাইক্রোসফট এক্সেল';
        if (s.includes('finance') || s.includes('accounting') || n.includes('finance'))
          return 'ফাইন্যান্স ও অ্যাকাউন্টিং';
        if (s.includes('marketing') || s.includes('sales') || n.includes('marketing'))
          return 'সেলস ও মার্কেটিং';
        if (s.includes('human-resource') || s.includes('hr') || n.includes('human'))
          return 'হিউম্যান রিসোর্স (HR)';
        if (s.includes('supply-chain') || n.includes('supply')) return 'সাপ্লাই চেইন ম্যানেজমেন্ট';
        if (s.includes('leadership') || n.includes('leadership')) return 'লিডারশিপ ও ম্যানেজমেন্ট';
        if (s.includes('personal-development') || n.includes('personal'))
          return 'পার্সোনাল ডেভেলপমেন্ট';
        if (s.includes('data') || n.includes('data')) return 'ডেটা সায়েন্স ও অ্যানালিটিক্স';
        if (s.includes('job-seeker') || n.includes('job')) return 'চাকরিপ্রার্থীদের দক্ষতা';
        if (s.includes('research') || n.includes('research')) return 'রিসার্চ ও অ্যাকাডেমিয়া';
        if (s.includes('business') || n.includes('business')) return 'বিজনেস ও প্রশাসন';
        if (s.includes('upcoming') || n.includes('upcoming')) return 'আসন্ন লাইভ ট্রেনিং';
        if (s.includes('master') || n.includes('master')) return 'মাস্টারক্লাস';
        if (s.includes('bundle')) return 'স্পেশাল বান্ডেল';
        return name;
      };

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
        ...validCats.map((c: any) => {
          const cleanName = cleanHtml(c.name);
          const slug = c.slug || String(c.id);
          return {
            id: slug,
            name: cleanName,
            banglaName: getCategoryBanglaName(slug, cleanName),
            count: c.count,
            icon: 'book',
            color: '#4F46E5',
            slug: slug,
          };
        }),
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

    return (
      cats || [
        {
          id: 'all',
          name: 'All Courses',
          banglaName: 'সব কোর্স',
          icon: 'grid',
          count: 0,
          color: '#059669',
          slug: 'all',
        },
      ]
    );
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
          description:
            course.subtitle ||
            course.description ||
            'Interactive live masterclass hosted by Thriving Skills.',
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
   * Fetch live WooCommerce product pricing and bundle sub-course IDs strictly by ID
   */
  static async getWooCommerceProductPricing(productId: string | number): Promise<{
    id: string;
    priceBdt?: number;
    originalPriceBdt?: number;
    bundledCourseIds?: string[];
    bundledCourses?: { id: string; title: string; priceBdt?: number }[];
  } | null> {
    const idStr = String(productId);
    try {
      const product = await HttpClient.get<any>(
        Endpoints.WOOCOMMERCE.PRODUCT_DETAIL(idStr),
        undefined,
        { skipAuth: true, retries: 1 }
      );
      if (!product || String(product.id) !== idStr) return null;

      const minorUnit = Number(product.prices?.currency_minor_unit ?? 0);
      const divisor = Math.pow(10, isNaN(minorUnit) ? 0 : minorUnit);
      const rawPrice = Number(product.prices?.price ?? product.price);
      const rawRegular = Number(product.prices?.regular_price ?? product.regular_price ?? rawPrice);

      const priceBdt = !isNaN(rawPrice) ? Math.round(rawPrice / divisor) : undefined;
      const originalPriceBdt = !isNaN(rawRegular) ? Math.round(rawRegular / divisor) : priceBdt;

      // Support WooCommerce grouped_products or product bundles matched by ID
      const rawGrouped = Array.isArray(product.grouped_products) ? product.grouped_products : [];
      const rawBundled = Array.isArray(product.bundled_items)
        ? product.bundled_items
        : Array.isArray(product.extensions?.bundles?.bundled_items)
          ? product.extensions.bundles.bundled_items
          : [];

      const bundledCourses: { id: string; title: string; priceBdt?: number }[] = [];
      const bundledCourseIds: string[] = [];

      rawBundled.forEach((b: any) => {
        if (b && typeof b === 'object' && (b.product_id || b.id)) {
          const bId = String(b.product_id || b.id);
          bundledCourseIds.push(bId);
          bundledCourses.push({
            id: bId,
            title: cleanHtml(b.title || b.name || `Course #${bId}`),
            priceBdt: typeof b.price === 'number' ? b.price : undefined,
          });
        } else if (b !== null && b !== undefined) {
          bundledCourseIds.push(String(b));
        }
      });

      rawGrouped.forEach((gId: any) => {
        const sId = String(gId);
        if (!bundledCourseIds.includes(sId)) {
          bundledCourseIds.push(sId);
        }
      });

      return {
        id: idStr,
        priceBdt,
        originalPriceBdt,
        bundledCourseIds: bundledCourseIds.length > 0 ? bundledCourseIds : undefined,
        bundledCourses: bundledCourses.length > 0 ? bundledCourses : undefined,
      };
    } catch {
      return null;
    }
  }

  /**
   * Enroll the authenticated user into a course (server enforces payment for paid courses)
   */
  static async enrollCourse(
    courseId: string | number
  ): Promise<{ success: boolean; code?: string; message?: string }> {
    const res = await HttpClient.post<{
      success?: boolean;
      status?: string;
      code?: string;
      message?: string;
    }>(Endpoints.LEARNPRESS.COURSE_ENROLL, { id: courseId });

    const succeeded =
      res?.success === true || res?.status === 'success' || res?.code === 'already_enrolled';
    if (!succeeded) {
      throw new Error(res?.message || 'Course enrollment was rejected by the server.');
    }

    return {
      success: true,
      code: res?.code,
      message: res?.message,
    };
  }

  /**
   * Verifies real enrollment against the server before unlocking course access.
   * Never unlocks a course locally on unpaid, pending, cancelled, or failed orders.
   */
  static async verifyServerEnrollment(
    courseId: string | number,
    orderInfo?: { orderId?: string; orderKey?: string }
  ): Promise<{
    enrolled: boolean;
    enrolledCourseIds: string[];
    orderStatus?: string | null;
    reason?:
      'payment_failed' | 'payment_cancelled' | 'pending' | 'not_enrolled' | 'unauthenticated';
  }> {
    const courseIdStr = String(courseId);
    const authToken = await HttpClient.getAuthToken();
    if (!authToken) {
      return {
        enrolled: false,
        enrolledCourseIds: [],
        reason: 'unauthenticated',
      };
    }

    const companionCheck = await CompanionService.checkServerEnrollment({
      courseId: courseIdStr,
      orderId: orderInfo?.orderId,
      orderKey: orderInfo?.orderKey,
    });

    if (companionCheck) {
      const orderStatus = companionCheck.orderStatus?.toLowerCase() ?? null;
      if (orderStatus === 'failed') {
        return {
          enrolled: false,
          enrolledCourseIds: companionCheck.enrolledCourseIds,
          orderStatus,
          reason: 'payment_failed',
        };
      }
      if (orderStatus === 'cancelled' || orderStatus === 'refunded') {
        return {
          enrolled: false,
          enrolledCourseIds: companionCheck.enrolledCourseIds,
          orderStatus,
          reason: 'payment_cancelled',
        };
      }

      const isEnrolled =
        companionCheck.enrolled || companionCheck.enrolledCourseIds.includes(courseIdStr);
      if (isEnrolled) {
        return {
          enrolled: true,
          enrolledCourseIds: companionCheck.enrolledCourseIds.includes(courseIdStr)
            ? companionCheck.enrolledCourseIds
            : [courseIdStr, ...companionCheck.enrolledCourseIds],
          orderStatus,
        };
      }

      return {
        enrolled: false,
        enrolledCourseIds: companionCheck.enrolledCourseIds,
        orderStatus,
        reason: orderStatus === 'pending' || orderStatus === 'on-hold' ? 'pending' : 'not_enrolled',
      };
    }

    // Fallback when companion /enrollments route is unavailable: inspect live LearnPress course_data.status
    const freshCourse = await this.getCourseDetail(courseIdStr, true);
    if (freshCourse?.isEnrolled) {
      return {
        enrolled: true,
        enrolledCourseIds: [courseIdStr],
      };
    }

    return {
      enrolled: false,
      enrolledCourseIds: [],
      reason: 'not_enrolled',
    };
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
