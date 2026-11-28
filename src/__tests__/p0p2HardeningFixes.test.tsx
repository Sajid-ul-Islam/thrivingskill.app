import React from 'react';
import { act, render, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LearningProvider, useLearning } from '../context/LearningContext';
import { LearningContextType } from '../context/learning/learningContext.types';
import { AnalyticsService } from '../services/analytics/analyticsService';
import { SyncQueueManager } from '../services/offline/syncQueue';
import { CompanionService } from '../services/api/companionService';
import { CoursesService } from '../services/api/coursesService';
import { HttpClient } from '../services/api/httpClient';
import { CacheManager } from '../services/cache/cacheManager';
import { sanitizeSentryEvent } from '../services/telemetry/telemetrySanitizer';
import { Course } from '../types';

let mockAuthState = {
  user: { id: 101, username: 'learner101', email: 'learner101@example.com' },
  token: 'jwt_test_token',
  canBypassCourseLocks: false,
};

let mockIsOffline = false;

const mockCatalogCourses = [
  {
    id: 'c1',
    title: 'Course One',
    modules: [
      {
        id: 'm1',
        title: 'Module 1',
        lessons: [{ id: 'l1', title: 'Lesson 1', duration: '5m' }],
      },
    ],
  },
];

jest.mock('../context/AuthContext', () => ({
  useAuth: () => mockAuthState,
}));

jest.mock('../context/NetworkContext', () => ({
  useNetwork: () => ({ isOffline: mockIsOffline }),
}));

jest.mock('../context/learning/useCatalogAndBrandingSync', () => ({
  useCatalogAndBrandingSync: () => ({
    courses: mockCatalogCourses,
    coursesRef: { current: mockCatalogCourses },
    totalCourseCount: 1,
    categories: [],
    workshops: [],
    blogPosts: [],
    isLoadingCourses: false,
    coursesError: null,
    refreshCourses: jest.fn(),
    loadCourseDetail: jest.fn(),
  }),
}));

const makeCourse = (id: string, title = `Course ${id}`): Course =>
  ({
    id,
    title,
    subtitle: '',
    description: '',
    instructor: 'Instructor',
    instructorTitle: '',
    instructorAvatar: '',
    instructorBio: '',
    rating: 5,
    reviewCount: 0,
    studentCount: 0,
    duration: '1h',
    lessonCount: 1,
    level: 'Beginner',
    category: 'Business',
    categoryId: 'business',
    priceBdt: 0,
    priceFormatted: 'Free',
    isFree: true,
    thumbnail: '',
    trailerUrl: '',
    learningOutcomes: [],
    curriculum: [],
    reviews: [],
    tags: [],
    isBestseller: false,
    isFeatured: false,
    updatedAt: '2026-01-01',
  }) as unknown as Course;

describe('P0–P2 hardening fixes', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    mockIsOffline = false;
    mockAuthState = {
      user: { id: 101, username: 'learner101', email: 'learner101@example.com' },
      token: 'jwt_test_token',
      canBypassCourseLocks: false,
    };
    jest.spyOn(CompanionService, 'fetchLearningState').mockResolvedValue({
      enrolledCourseIds: [],
      progress: {},
      certificates: [],
      reviewedCourseIds: [],
    });
    jest.spyOn(CoursesService, 'fetchEnrolledCourseIdsFromServer').mockResolvedValue([]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('P0: enrollInCourse tracks free_enrollment_confirmed ONLY after SyncQueueManager confirms server flush', async () => {
    let ctx!: LearningContextType;
    const Harness = () => {
      ctx = useLearning();
      return null;
    };

    const trackSpy = jest.spyOn(AnalyticsService, 'trackRecommendationConversion');
    jest.spyOn(SyncQueueManager, 'enqueue').mockResolvedValue(undefined as never);

    // Case 1: queued/offline flush did not succeed on server -> NO conversion tracked
    jest
      .spyOn(SyncQueueManager, 'processQueue')
      .mockResolvedValueOnce({ processed: 1, succeeded: 0, failed: 1 });
    jest.spyOn(SyncQueueManager, 'getPendingMutations').mockResolvedValueOnce([
      {
        id: 'm1',
        action: 'ENROLL_COURSE',
        endpoint: '/learnpress/v1/courses/enroll',
        payload: { id: 501 },
        method: 'POST',
        retries: 1,
        maxRetries: 5,
      } as never,
    ]);

    await render(
      <LearningProvider>
        <Harness />
      </LearningProvider>
    );

    await act(async () => {
      ctx.enrollInCourse('501');
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(trackSpy).not.toHaveBeenCalled();

    // Case 2: server flush succeeds and mutation leaves queue -> records free_enrollment_confirmed
    jest
      .spyOn(SyncQueueManager, 'processQueue')
      .mockResolvedValueOnce({ processed: 1, succeeded: 1, failed: 0 });
    jest.spyOn(SyncQueueManager, 'getPendingMutations').mockResolvedValueOnce([]);

    await act(async () => {
      ctx.enrollInCourse('502');
      await Promise.resolve();
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(trackSpy).toHaveBeenCalledWith('502', {
        conversionType: 'free_enrollment_confirmed',
        learnerId: '101',
      });
    });
    expect(trackSpy).not.toHaveBeenCalledWith(
      '502',
      expect.objectContaining({ conversionType: 'purchase' })
    );
  });

  it('P0: confirmServerEnrollments separates free, paid purchase, and generic sync conversions', async () => {
    let ctx!: LearningContextType;
    const Harness = () => {
      ctx = useLearning();
      return null;
    };

    const trackSpy = jest.spyOn(AnalyticsService, 'trackRecommendationConversion');

    await render(
      <LearningProvider>
        <Harness />
      </LearningProvider>
    );

    await act(async () => {
      ctx.confirmServerEnrollments(['601']);
      ctx.confirmServerEnrollments(['602'], { conversionType: 'free_enrollment_confirmed' });
      ctx.confirmServerEnrollments(['603'], { conversionType: 'paid_purchase_confirmed' });
    });

    expect(trackSpy).toHaveBeenCalledWith('601', {
      conversionType: 'course_enrollment_confirmed',
      learnerId: '101',
    });
    expect(trackSpy).toHaveBeenCalledWith('602', {
      conversionType: 'free_enrollment_confirmed',
      learnerId: '101',
    });
    expect(trackSpy).toHaveBeenCalledWith('603', {
      conversionType: 'paid_purchase_confirmed',
      learnerId: '101',
    });
  });

  it('P1: AnalyticsService explicitly marks storage authority as device_local_only', () => {
    expect(AnalyticsService.STORAGE_AUTHORITY).toBe('device_local_only');
    expect(AnalyticsService.AUTHORITATIVE_REPORTING_SOURCE).toBe('wordpress_ts_mobile_bridge');
  });

  it('P1: sanitizeSentryEvent recursively scrubs sensitive keys, cookies, and Bearer headers across extra, contexts, and tags', () => {
    const rawEvent = {
      extra: {
        authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.secret.sig',
        nested: {
          access_token: 'tok_123',
          refresh_token: 'ref_456',
          cookie: 'wordpress_logged_in=abc',
          secret: 'shhh',
          api_key: 'key_999',
          safeField: 'visible',
        },
        url: 'https://thrivingskill.com/wp-json/app?token=abc&api_key=xyz&course=10',
      },
      contexts: {
        headers: {
          Authorization: 'Bearer super_secret_jwt',
          'set-cookie': 'session=secret',
        },
      },
      tags: {
        api_key: 'tag_secret_key',
        screen: 'CourseDetail',
      },
    };

    const sanitized = sanitizeSentryEvent(rawEvent);
    expect(sanitized.extra.authorization).toBe('[REDACTED]');
    expect(sanitized.extra.nested.access_token).toBe('[REDACTED]');
    expect(sanitized.extra.nested.refresh_token).toBe('[REDACTED]');
    expect(sanitized.extra.nested.cookie).toBe('[REDACTED]');
    expect(sanitized.extra.nested.secret).toBe('[REDACTED]');
    expect(sanitized.extra.nested.api_key).toBe('[REDACTED]');
    expect(sanitized.extra.nested.safeField).toBe('visible');
    expect(sanitized.extra.url).toContain('token=[REDACTED]');
    expect(sanitized.extra.url).toContain('api_key=[REDACTED]');
    expect(sanitized.extra.url).toContain('course=10');
    expect(sanitized.contexts.headers.Authorization).toBe('[REDACTED]');
    expect(sanitized.contexts.headers['set-cookie']).toBe('[REDACTED]');
    expect(sanitized.tags.api_key).toBe('[REDACTED]');
    expect(sanitized.tags.screen).toBe('CourseDetail');
  });

  it('P1: CoursesService.getAllCourses bounds concurrency to <= 3 and preserves stale cache on partial page failure', async () => {
    const staleCatalog = [makeCourse('stale-1', 'Stale Course')];
    jest.spyOn(CacheManager, 'get').mockImplementation(async (_key, allowStale) => {
      if (allowStale) return staleCatalog;
      return null;
    });
    const cacheSetSpy = jest.spyOn(CacheManager, 'set').mockResolvedValue(undefined);

    let activeRequests = 0;
    let maxConcurrent = 0;

    jest
      .spyOn(CompanionService, 'fetchAllLeanFeed')
      .mockRejectedValue(new Error('Companion unavailable in test'));

    jest.spyOn(HttpClient, 'getWithMeta').mockResolvedValue({
      data: [{ id: 1, name: 'Course 1' }],
      totalPages: 7,
      totalCount: 700,
      headers: { 'x-wp-totalpages': '7' },
      status: 200,
    });

    jest.spyOn(HttpClient, 'get').mockImplementation(async (_url, params?: Record<string, any>) => {
      activeRequests += 1;
      maxConcurrent = Math.max(maxConcurrent, activeRequests);
      await new Promise((r) => setTimeout(r, 10));
      activeRequests -= 1;
      if (params?.page === 4) {
        throw new Error('Page 4 timeout');
      }
      return [{ id: params?.page || 2, name: `Course ${params?.page}` }];
    });

    const result = await CoursesService.getAllCourses(true);

    expect(maxConcurrent).toBeLessThanOrEqual(3);
    expect(result).toEqual(staleCatalog);
    expect(cacheSetSpy).toHaveBeenCalledTimes(1);
    expect(cacheSetSpy).toHaveBeenCalledWith('courses_full_catalog', staleCatalog, 1800000);

    // Without stale cache, partial page failure must throw rather than caching incomplete data
    jest.spyOn(CacheManager, 'get').mockResolvedValue(null);
    await expect(CoursesService.getAllCourses(true)).rejects.toThrow(/Partial catalog sync failed/);
  });

  it('P2: reconciles failed server completion, blocks local-only certificates, hydrates cross-device completion, and handles retake resets', async () => {
    let ctx!: LearningContextType;
    const Harness = () => {
      ctx = useLearning();
      return null;
    };

    const fetchStateSpy = jest.spyOn(CompanionService, 'fetchLearningState');
    fetchStateSpy.mockResolvedValueOnce({
      enrolledCourseIds: ['c1'],
      progress: {
        c1: {
          courseId: 'c1',
          completedLessonIds: [],
          isCompleted: false,
          enrolledDate: '2026-01-01T00:00:00.000Z',
        },
      },
      certificates: [],
      reviewedCourseIds: [],
    });

    jest.spyOn(CoursesService, 'fetchEnrolledCourseIdsFromServer').mockResolvedValue(['c1']);
    jest.spyOn(SyncQueueManager, 'enqueue').mockResolvedValue(undefined as never);
    jest
      .spyOn(SyncQueueManager, 'processQueue')
      .mockResolvedValue({ processed: 1, succeeded: 0, failed: 1 });
    jest.spyOn(SyncQueueManager, 'getPendingMutations').mockResolvedValue([]);

    await render(
      <LearningProvider>
        <Harness />
      </LearningProvider>
    );

    await waitFor(() => {
      expect(ctx.userProgress.c1).toBeDefined();
    });

    // 1. Mark lesson completed optimistically -> local state flips, but NO server certificate => certificate stays locked
    await act(async () => {
      ctx.markLessonCompleted('c1', 'l1');
    });
    expect(ctx.userProgress.c1?.isCompleted).toBe(true);
    expect(ctx.isCertificateUnlocked('c1')).toBe(false);

    // 2. Offline queue fails server sync -> syncOfflineData reconciles with server (isCompleted: false)
    fetchStateSpy.mockResolvedValueOnce({
      enrolledCourseIds: ['c1'],
      progress: {
        c1: {
          courseId: 'c1',
          completedLessonIds: [],
          isCompleted: false,
          enrolledDate: '2026-01-01T00:00:00.000Z',
        },
      },
      certificates: [],
      reviewedCourseIds: [],
    });

    await act(async () => {
      await ctx.syncOfflineData();
    });
    expect(ctx.userProgress.c1?.isCompleted).toBe(false);
    expect(ctx.isCertificateUnlocked('c1')).toBe(false);

    // 3. Cross-device login hydration: server has completed course + server-verified certificate
    fetchStateSpy.mockResolvedValueOnce({
      enrolledCourseIds: ['c1'],
      progress: {
        c1: {
          courseId: 'c1',
          completedLessonIds: ['l1'],
          isCompleted: true,
          enrolledDate: '2026-01-01T00:00:00.000Z',
        },
      },
      certificates: [
        {
          id: 'cert-1',
          courseId: 'c1',
          courseTitle: 'Course One',
          studentName: 'Learner 101',
          issueDate: '2026-02-01',
          credentialId: 'TS-C1-101',
          instructorName: 'Instructor',
          verificationUrl: 'https://thrivingskill.com/verify/TS-C1-101',
        },
      ],
      reviewedCourseIds: ['c1'],
    });

    await act(async () => {
      await ctx.syncOfflineData();
    });
    expect(ctx.userProgress.c1?.isCompleted).toBe(true);
    expect(ctx.isCertificateUnlocked('c1')).toBe(true);

    // 4. Retake / server reset: server clears completed lessons and completion -> local completion resets
    fetchStateSpy.mockResolvedValueOnce({
      enrolledCourseIds: ['c1'],
      progress: {
        c1: {
          courseId: 'c1',
          completedLessonIds: [],
          isCompleted: false,
          enrolledDate: '2026-03-01T00:00:00.000Z',
        },
      },
      certificates: [],
      reviewedCourseIds: [],
    });

    await act(async () => {
      await ctx.syncOfflineData();
    });
    expect(ctx.userProgress.c1?.isCompleted).toBe(false);
    expect(ctx.userProgress.c1?.completedLessonIds).toEqual([]);
    expect(ctx.isCertificateUnlocked('c1')).toBe(false);
  });
});
