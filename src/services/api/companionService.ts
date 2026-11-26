import { ApiError, HttpClient } from './httpClient';
import { Endpoints } from './endpoints';
import { CacheManager } from '../cache/cacheManager';
import { Env } from '../../config/env';
import { isTrustedCheckoutOrigin } from '../checkout/checkoutHelpers';
import { Certificate, Review, UserProgress } from '../../types';

export interface HeroSlide {
  id: number | string;
  tag?: string;
  title: string;
  subtitle?: string;
  button_text?: string;
  image_url?: string;
  target?: string;
}

export interface FlashSaleCampaign {
  active: boolean;
  title: string;
  coupon_code: string;
  discount_percent: number;
  end_time?: string | null;
  end_timestamp?: number | null;
}

export interface LearnerSupportHotline {
  whatsapp?: string | null;
  email?: string | null;
  helpline?: string | null;
}

export interface AppRemoteConfig {
  status: string;
  version_control: {
    min_required_version: string;
    latest_version: string;
    maintenance_mode: boolean;
  };
  checkout_policy: {
    mode: 'webview' | 'native';
    checkout_url: string;
    sslcommerz_active: boolean;
  };
  announcement_banner: {
    active: boolean;
    message: string;
    target?: string;
  };
  hero_slides?: HeroSlide[];
  flash_sale?: FlashSaleCampaign;
  trending_keywords?: string[];
  support?: LearnerSupportHotline;
  server_time?: string;
  server_timestamp?: number;
}

export interface LeanFeedPageResponse {
  count: number;
  page?: number;
  limit?: number;
  total?: number;
  total_pages?: number;
  courses: any[];
}

export interface ServerEnrollmentCheck {
  enrolled: boolean;
  enrolledCourseIds: string[];
  orderStatus?: string | null;
  paymentConfirmed?: boolean;
}

export interface ServerLearningState {
  enrolledCourseIds: string[];
  reviewedCourseIds: string[];
  progress: Record<string, UserProgress>;
  certificates: Certificate[];
}

export interface ServerReviewSubmitResult {
  courseCompleted: boolean;
  hasReviewed: boolean;
  review: Review | null;
  certificate: Certificate | null;
}

const CONFIG_CACHE_KEY = '@thrivingskill_remote_companion_config_v1';
const CONFIG_CACHE_TTL = 300000; // 5 minutes
export const MAX_COMPANION_FEED_LIMIT = 50;
const EXPO_PUSH_TOKEN_REGEX = /^(?:ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]{8,128}\]$/;

/**
 * Validates whether a remote flash sale is genuinely active and has not expired.
 */
export function isFlashSaleActive(
  sale?: FlashSaleCampaign | null,
  nowMs: number = Date.now()
): boolean {
  if (!sale || !sale.active) return false;

  if (typeof sale.end_timestamp === 'number' && Number.isFinite(sale.end_timestamp)) {
    return sale.end_timestamp * 1000 > nowMs;
  }

  if (typeof sale.end_time === 'string' && sale.end_time.trim().length > 0) {
    const parsedMs = Date.parse(sale.end_time);
    return Number.isFinite(parsedMs) && parsedMs > nowMs;
  }

  return false;
}

/**
 * Normalizes optional remote support hotlines so empty/unset strings never produce broken links.
 */
export function resolveSupportContacts(support?: LearnerSupportHotline | null): {
  whatsapp: string | null;
  email: string | null;
  helpline: string | null;
} {
  const cleanStr = (val?: string | null): string | null => {
    if (typeof val !== 'string') return null;
    const trimmed = val.trim();
    return trimmed.length > 0 ? trimmed : null;
  };

  return {
    whatsapp: cleanStr(support?.whatsapp),
    email: cleanStr(support?.email),
    helpline: cleanStr(support?.helpline),
  };
}

export class CompanionService {
  /**
   * Fetches live remote configuration and Mobile Command Center parameters
   * from the TS Mobile Bridge companion plugin with SWR caching.
   */
  static async fetchAppConfig(forceRefresh: boolean = false): Promise<AppRemoteConfig | null> {
    if (!forceRefresh) {
      const cached = await CacheManager.get<AppRemoteConfig>(CONFIG_CACHE_KEY);
      if (cached) return cached;
    }

    try {
      const config = await HttpClient.get<AppRemoteConfig>(Endpoints.COMPANION.CONFIG, {
        _t: Date.now(),
      });

      if (config && config.status === 'success') {
        await CacheManager.set(CONFIG_CACHE_KEY, config, CONFIG_CACHE_TTL);
        return config;
      }
      return null;
    } catch (err) {
      if (Env.DEBUG_API) {
        console.warn(
          '[CompanionService] Failed to fetch remote config, using stale fallback:',
          err
        );
      }
      return CacheManager.get<AppRemoteConfig>(CONFIG_CACHE_KEY, true);
    }
  }

  /**
   * Registers or updates authenticated learner device Expo push token with the companion plugin.
   */
  static async registerPushToken(
    token: string,
    platform: 'android' | 'ios' | 'web' = 'android'
  ): Promise<boolean> {
    if (!token || !EXPO_PUSH_TOKEN_REGEX.test(token.trim())) {
      return false;
    }

    const authToken = await HttpClient.getAuthToken();
    if (!authToken) {
      return false;
    }

    try {
      const res = await HttpClient.post<{ status: string }>(
        Endpoints.COMPANION.REGISTER_PUSH_TOKEN,
        {
          token: token.trim(),
          platform,
        }
      );
      return res?.status === 'success';
    } catch (err) {
      if (Env.DEBUG_API) {
        console.warn('[CompanionService] Failed to register push token:', err);
      }
      return false;
    }
  }

  /**
   * Fetches a bounded page from the lean course feed endpoint (max 50 per page).
   */
  static async fetchLeanFeed(
    limit: number = 30,
    page: number = 1
  ): Promise<LeanFeedPageResponse | null> {
    const boundedLimit = Math.max(1, Math.min(MAX_COMPANION_FEED_LIMIT, Math.floor(limit)));
    const boundedPage = Math.max(1, Math.floor(page));

    try {
      const res = await HttpClient.get<LeanFeedPageResponse>(Endpoints.COMPANION.FEED, {
        limit: boundedLimit,
        page: boundedPage,
      });
      if (res && Array.isArray(res.courses)) {
        return res;
      }
      return null;
    } catch (err) {
      if (Env.DEBUG_API) {
        console.warn('[CompanionService] Companion feed unavailable, falling back:', err);
      }
      return null;
    }
  }

  /**
   * Paginates across the bounded companion /feed (50 per page) to retrieve the full catalog.
   */
  static async fetchAllLeanFeed(): Promise<any[] | null> {
    const firstPage = await this.fetchLeanFeed(MAX_COMPANION_FEED_LIMIT, 1);
    if (!firstPage || !Array.isArray(firstPage.courses) || firstPage.courses.length === 0) {
      return null;
    }

    const allCourses: any[] = [...firstPage.courses];
    const totalPages = Math.max(1, Number(firstPage.total_pages) || 1);

    if (totalPages > 1) {
      const pagePromises: Promise<LeanFeedPageResponse | null>[] = [];
      for (let p = 2; p <= totalPages; p++) {
        pagePromises.push(this.fetchLeanFeed(MAX_COMPANION_FEED_LIMIT, p));
      }
      const remainingPages = await Promise.all(pagePromises);
      remainingPages.forEach((pg) => {
        if (pg && Array.isArray(pg.courses)) {
          allCourses.push(...pg.courses);
        }
      });
    }

    return allCourses;
  }

  /**
   * Queries authenticated server enrollment & optional WooCommerce order status.
   * Returns null if the companion plugin is unreachable or missing this route.
   */
  static async checkServerEnrollment(params?: {
    courseId?: string | number;
    orderId?: string;
    orderKey?: string;
  }): Promise<ServerEnrollmentCheck | null> {
    const authToken = await HttpClient.getAuthToken();
    if (!authToken) {
      return null;
    }

    try {
      const query: Record<string, any> = { _t: Date.now() };
      if (params?.courseId !== undefined) query.course_id = String(params.courseId);
      if (params?.orderId) query.order_id = String(params.orderId);
      if (params?.orderKey) query.order_key = params.orderKey;

      const res = await HttpClient.get<{
        status?: string;
        enrolled?: boolean;
        enrolled_course_ids?: (number | string)[];
        order_status?: string | null;
        payment_confirmed?: boolean;
      }>(Endpoints.COMPANION.ENROLLMENTS, query, {
        retries: 1,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      });

      if (!res || res.status !== 'success') {
        return null;
      }

      return {
        enrolled: Boolean(res.enrolled),
        enrolledCourseIds: Array.isArray(res.enrolled_course_ids)
          ? res.enrolled_course_ids.map((cid) => String(cid))
          : [],
        orderStatus: res.order_status ?? null,
        paymentConfirmed: Boolean(res.payment_confirmed),
      };
    } catch (err) {
      if (Env.DEBUG_API) {
        console.warn('[CompanionService] Enrollment status endpoint unavailable:', err);
      }
      return null;
    }
  }

  /**
   * Requests a short-lived, single-use WordPress cookie login handoff URL so an
   * authenticated learner opens WooCommerce checkout signed in rather than as a guest.
   * Returns null only if the server lacks the handoff endpoint (404 / rest_no_route).
   */
  static async createWebViewHandoffUrl(params?: {
    courseId?: string | number;
    redirectPath?: string;
  }): Promise<{ loginUrl: string; expiresIn: number } | null> {
    const authToken = await HttpClient.getAuthToken();
    if (!authToken) {
      throw new ApiError('Authentication required before checkout.', 401, 'UNAUTHENTICATED');
    }

    try {
      const payload: Record<string, any> = {};
      if (params?.courseId !== undefined) {
        const parsedId = Number(params.courseId);
        if (Number.isFinite(parsedId) && parsedId > 0) {
          payload.course_id = Math.floor(parsedId);
        }
      }
      if (params?.redirectPath) {
        payload.redirect_to = params.redirectPath;
      }

      const res = await HttpClient.post<{
        status?: string;
        login_url?: string;
        expires_in?: number;
      }>(Endpoints.COMPANION.WEBVIEW_HANDOFF, payload, { retries: 0 });

      const loginUrl = typeof res?.login_url === 'string' ? res.login_url.trim() : '';
      if (!loginUrl || !isTrustedCheckoutOrigin(loginUrl, Env.SITE_URL)) {
        throw new ApiError(
          'Server returned an untrusted checkout handoff URL.',
          502,
          'INVALID_HANDOFF_URL'
        );
      }

      return {
        loginUrl,
        expiresIn: Number(res?.expires_in) || 120,
      };
    } catch (err: any) {
      if (err?.status === 404 || err?.code === 'rest_no_route') {
        if (Env.DEBUG_API) {
          console.warn('[CompanionService] WebView handoff route unavailable on server:', err);
        }
        return null;
      }
      throw err;
    }
  }

  /**
   * Queries authoritative enrollments, completed lessons, reviewed courses, and server-issued certificates.
   * Returns null only if unauthenticated or the server lacks /learning-state.
   */
  static async fetchLearningState(): Promise<ServerLearningState | null> {
    const authToken = await HttpClient.getAuthToken();
    if (!authToken) {
      return null;
    }

    try {
      const res = await HttpClient.get<{
        status?: string;
        enrolled_course_ids?: (number | string)[];
        reviewed_course_ids?: (number | string)[];
        progress?: Record<string, any>;
        certificates?: any[];
      }>(
        Endpoints.COMPANION.LEARNING_STATE,
        { _t: Date.now() },
        {
          retries: 1,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
          },
        }
      );

      if (!res || res.status !== 'success') {
        return null;
      }

      const enrolledCourseIds = Array.isArray(res.enrolled_course_ids)
        ? Array.from(new Set(res.enrolled_course_ids.map((id) => String(id)).filter(Boolean)))
        : [];
      const reviewedCourseIds = Array.isArray(res.reviewed_course_ids)
        ? Array.from(new Set(res.reviewed_course_ids.map((id) => String(id)).filter(Boolean)))
        : [];

      const progress: Record<string, UserProgress> = {};
      if (res.progress && typeof res.progress === 'object') {
        for (const [cid, rawProg] of Object.entries(res.progress)) {
          if (!rawProg || typeof rawProg !== 'object') continue;
          progress[String(cid)] = {
            courseId: String(rawProg.courseId ?? cid),
            enrolledDate: String(rawProg.enrolledDate || new Date().toISOString().split('T')[0]),
            completedLessonIds: Array.isArray(rawProg.completedLessonIds)
              ? rawProg.completedLessonIds.map((lid: any) => String(lid))
              : [],
            lastAccessedLessonId: rawProg.lastAccessedLessonId
              ? String(rawProg.lastAccessedLessonId)
              : undefined,
            isCompleted: Boolean(rawProg.isCompleted),
            hasReviewed: Boolean(rawProg.hasReviewed),
            completedDate: rawProg.completedDate ? String(rawProg.completedDate) : undefined,
            certificateId: rawProg.certificateId ? String(rawProg.certificateId) : undefined,
            status: rawProg.status,
            grade: rawProg.grade,
          };
        }
      }

      const certificates: Certificate[] = Array.isArray(res.certificates)
        ? res.certificates
            .filter((c) => c && c.courseId && c.credentialId)
            .map((c) => ({
              id: String(c.id || `cert-${c.courseId}`),
              courseId: String(c.courseId),
              courseTitle: String(c.courseTitle || `Course #${c.courseId}`),
              studentName: String(c.studentName || 'Executive Graduate'),
              issueDate: String(c.issueDate || ''),
              credentialId: String(c.credentialId),
              instructorName: String(c.instructorName || 'Thriving Skills Instructor'),
              verificationUrl: String(c.verificationUrl || ''),
              serverVerified: Boolean(c.serverVerified ?? true),
            }))
        : [];

      return {
        enrolledCourseIds,
        reviewedCourseIds,
        progress,
        certificates,
      };
    } catch (err: any) {
      if (Env.DEBUG_API) {
        console.warn('[CompanionService] Learning state sync unavailable:', err);
      }
      return null;
    }
  }

  /**
   * Submits a course review to the WordPress companion backend and receives an authoritative
   * certificate only after the backend confirms 100% course completion + persisted review.
   * Returns null only when the server lacks the route (404 / rest_no_route).
   */
  static async submitCourseReviewAndCertificate(params: {
    courseId: string | number;
    rating: number;
    content: string;
    title?: string;
    requireCompletion?: boolean;
  }): Promise<ServerReviewSubmitResult | null> {
    const authToken = await HttpClient.getAuthToken();
    if (!authToken) {
      throw new ApiError('Please sign in to submit a course review.', 401, 'UNAUTHENTICATED');
    }

    const cleanContent = params.content.trim();
    const cleanTitle = (params.title || cleanContent.slice(0, 48) || 'Course Review').trim();

    try {
      const res = await HttpClient.post<{
        status?: string;
        course_completed?: boolean;
        has_reviewed?: boolean;
        review?: any;
        certificate?: any;
      }>(
        Endpoints.COMPANION.COURSE_REVIEW_AND_CERT(params.courseId),
        {
          rate: Math.max(1, Math.min(5, Math.round(params.rating))),
          title: cleanTitle,
          content: cleanContent,
          require_completion: params.requireCompletion !== false,
        },
        { retries: 0 }
      );

      const rawRev = res?.review;
      const review: Review | null = rawRev
        ? {
            id: String(rawRev.id || `rev-${Date.now()}`),
            userName: String(rawRev.user_name || 'Learner'),
            userAvatar: '',
            rating: Math.max(1, Math.min(5, Number(rawRev.rating ?? params.rating) || 5)),
            date: String(rawRev.date || new Date().toISOString().split('T')[0]),
            comment: String(rawRev.comment || cleanContent),
          }
        : null;

      const rawCert = res?.certificate;
      const certificate: Certificate | null =
        rawCert && rawCert.credentialId
          ? {
              id: String(rawCert.id || `cert-${params.courseId}`),
              courseId: String(rawCert.courseId || params.courseId),
              courseTitle: String(rawCert.courseTitle || ''),
              studentName: String(rawCert.studentName || 'Executive Graduate'),
              issueDate: String(rawCert.issueDate || ''),
              credentialId: String(rawCert.credentialId),
              instructorName: String(rawCert.instructorName || 'Thriving Skills Instructor'),
              verificationUrl: String(rawCert.verificationUrl || ''),
              serverVerified: Boolean(rawCert.serverVerified ?? true),
            }
          : null;

      return {
        courseCompleted: Boolean(res?.course_completed),
        hasReviewed: Boolean(res?.has_reviewed ?? true),
        review,
        certificate,
      };
    } catch (err: any) {
      if (err?.status === 404 || err?.code === 'rest_no_route') {
        return null;
      }
      throw err;
    }
  }
}
