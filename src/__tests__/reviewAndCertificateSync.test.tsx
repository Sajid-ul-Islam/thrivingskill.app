import React from 'react';
import { Text } from 'react-native';
import { render, waitFor, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LearningProvider, useLearning } from '../context/LearningContext';
import { HttpClient } from '../services/api/httpClient';
import { Env } from '../config/env';
import { CoursesService } from '../services/api/coursesService';
import { CompanionService } from '../services/api/companionService';
import { CacheManager } from '../services/cache/cacheManager';
import { Course } from '../types';

function mockJson(data: any, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (k: string) => (k.toLowerCase() === 'content-type' ? 'application/json' : null),
      forEach: () => {},
    },
    json: async () => data,
    text: async () => JSON.stringify(data),
  };
}

function safeParseBody(raw: any): Record<string, any> {
  try {
    return JSON.parse(String(raw || '{}'));
  } catch {
    return {};
  }
}

const sampleCourses: Course[] = [
  {
    id: '901',
    title: 'Executive AI Mastery',
    slug: 'executive-ai-mastery',
    subtitle: 'AI workflows',
    description: 'Course description',
    category: 'generative-ai',
    instructor: {
      id: 'inst-1',
      name: 'Dr. Mentor',
      title: 'Lead Mentor',
      company: 'Thriving Skills',
      avatar: '',
      bio: 'Bio',
      rating: 4.9,
      studentsCount: 100,
      coursesCount: 2,
    },
    rating: 4.8,
    reviewsCount: 10,
    enrolledCount: 200,
    durationHours: 4,
    lecturesCount: 2,
    certificateIncluded: true,
    language: 'English',
    lastUpdated: '2026-11-01',
    level: 'Intermediate',
    price: 0,
    priceBdt: 0,
    originalPrice: 0,
    originalPriceBdt: 0,
    thumbnail: 'https://staging.thrivingskill.com/thumb.jpg',
    highlights: [],
    prerequisites: [],
    reviews: [],
    isEnrolled: true,
    modules: [
      {
        id: 'sec-1',
        title: 'Module 1',
        lessons: [
          {
            id: '1001',
            title: 'Lesson 1',
            duration: '10:00',
            videoUrl: 'https://player.vimeo.com/video/1',
            isFreePreview: false,
            type: 'lesson',
          },
          {
            id: '1002',
            title: 'Lesson 2',
            duration: '12:00',
            videoUrl: 'https://player.vimeo.com/video/2',
            isFreePreview: false,
            type: 'lesson',
          },
        ],
      },
    ],
  },
];

jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 42,
      username: 'sadia42',
      email: 'sadia42@example.com',
      displayName: 'Sadia Rahman',
    },
    token: 'jwt_verified_learner_42',
    canBypassCourseLocks: false,
  }),
}));

jest.mock('../context/NetworkContext', () => ({
  useNetwork: () => ({
    isOffline: false,
  }),
}));

jest.mock('../context/learning/useCatalogAndBrandingSync', () => ({
  useCatalogAndBrandingSync: () => {
    const ReactActual = require('react');
    const [courses, setCourses] = ReactActual.useState(sampleCourses);
    const coursesRef = ReactActual.useRef(courses);
    coursesRef.current = courses;
    return {
      courses,
      setCourses,
      coursesRef,
      totalCourseCount: courses.length,
      categories: [],
      workshops: [],
      blogPosts: [],
      isLoadingCourses: false,
      coursesError: null,
      refreshCourses: jest.fn(async () => undefined),
      loadCourseDetail: jest.fn(async (id: string) => courses.find((c: Course) => c.id === id)),
      siteBranding: {},
      banners: [],
      partnerLogos: [],
      homeFeatures: [],
      specialBundles: [],
      studentTestimonials: [],
      appRemoteConfig: null,
      isBrandingLoading: false,
      refreshBranding: jest.fn(async () => undefined),
      lastSyncedAt: Date.now(),
      isBackgroundSyncing: false,
    };
  },
}));

describe('Backend-authoritative review persistence, certificate issuance, and cross-device sync', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    const fetchMock = globalThis.fetch as jest.Mock;
    fetchMock.mockReset();
    fetchMock.mockImplementation(() =>
      Promise.reject(new Error('Unmocked network request attempted during Jest unit tests'))
    );
    await AsyncStorage.clear();
    await CacheManager.clearAll();
    HttpClient.setAuthToken('jwt_verified_learner_42');
    await Env.setEnvironment('staging');
  });

  it('submits review to WordPress companion route and refuses local issuance when server rejects incomplete courses', async () => {
    const fetchMock = globalThis.fetch as jest.Mock;
    fetchMock.mockResolvedValueOnce(
      mockJson(
        {
          code: 'course_not_completed',
          message: 'Complete 100% of this course on the server before claiming your certificate.',
        },
        403
      )
    );

    await expect(
      CoursesService.submitCourseReview({
        courseId: '901',
        rating: 5,
        feedback: 'Very practical training.',
        requireCompletion: true,
      })
    ).rejects.toThrow('Complete 100%');

    expect(fetchMock.mock.calls[0][0]).toContain('/thrivingskill/v1/courses/901/submit-review');
    expect(safeParseBody(fetchMock.mock.calls[0][1].body)).toMatchObject({
      rate: 5,
      content: 'Very practical training.',
      require_completion: true,
    });

    fetchMock.mockResolvedValueOnce(
      mockJson(
        {
          status: 'success',
          course_completed: true,
          has_reviewed: true,
          review: {
            id: '888',
            user_name: 'Sadia Rahman',
            rating: 5,
            title: 'Great workflow guide',
            comment: 'Great workflow guide and clear examples.',
            date: '2026-11-26',
          },
          certificate: {
            id: 'cert-901-42',
            courseId: '901',
            courseTitle: 'Executive AI Mastery',
            studentName: 'Sadia Rahman',
            issueDate: 'November 26, 2026',
            credentialId: 'deadbeef1234567890abcdef12345678',
            instructorName: 'Dr. Mentor',
            verificationUrl:
              'https://staging.thrivingskill.com/certificates/deadbeef1234567890abcdef12345678/',
            serverVerified: true,
          },
        },
        200
      )
    );

    const ok = await CoursesService.submitCourseReview({
      courseId: '901',
      rating: 5,
      feedback: 'Great workflow guide and clear examples.',
    });
    expect(ok.courseCompleted).toBe(true);
    expect(ok.certificate?.credentialId).toBe('deadbeef1234567890abcdef12345678');
    expect(ok.certificate?.verificationUrl).toBe(
      'https://staging.thrivingskill.com/certificates/deadbeef1234567890abcdef12345678/'
    );
  });

  it('falls back to LearnPress /review/submit when companion route returns 404 without minting unissued local certificates', async () => {
    const fetchMock = globalThis.fetch as jest.Mock;
    fetchMock
      .mockResolvedValueOnce(mockJson({ code: 'rest_no_route', message: 'Not found' }, 404))
      .mockResolvedValueOnce(mockJson({ status: 'success' }, 200))
      .mockResolvedValueOnce(
        mockJson(
          {
            id: 901,
            name: 'Executive AI Mastery',
            price: 0,
            course_data: { status: 'finished', graduation: 'passed' },
            sections: [],
          },
          200
        )
      )
      .mockResolvedValueOnce(mockJson({ status: 'success', comment_id: 501 }, 200))
      .mockResolvedValueOnce(
        mockJson(
          {
            reviews: {
              reviews: [
                {
                  comment_id: 501,
                  display_name: 'Sadia Rahman',
                  rate: 5,
                  content: 'Persisted directly via LearnPress review endpoint.',
                  comment_date_gmt: '2026-11-26 10:00:00',
                },
              ],
            },
            rated: 5,
            total: 1,
          },
          200
        )
      );

    const result = await CoursesService.submitCourseReview({
      courseId: '901',
      rating: 5,
      feedback: 'Persisted directly via LearnPress review endpoint.',
      requireCompletion: true,
    });

    expect(fetchMock.mock.calls[1][0]).toContain('/learnpress/v1/courses/finish');
    expect(fetchMock.mock.calls[2][0]).toContain('/learnpress/v1/courses/901');
    expect(fetchMock.mock.calls[3][0]).toContain('/learnpress/v1/review/submit');
    expect(safeParseBody(fetchMock.mock.calls[3][1].body)).toMatchObject({
      id: 901,
      rate: 5,
      content: 'Persisted directly via LearnPress review endpoint.',
    });
    expect(result.courseCompleted).toBe(true);
    expect(result.hasReviewed).toBe(true);
    expect(result.certificate).toBeNull();
  });

  it('synchronizes server completion, reviewed state, and certificates across devices and enforces backend failure in LearningContext', async () => {
    const fetchMock = globalThis.fetch as jest.Mock;
    const serverCertKey = 'abcdef1234567890abcdef1234567890';

    // Initial mount on a fresh device (empty AsyncStorage) receives authoritative learning-state
    fetchMock.mockResolvedValueOnce(
      mockJson(
        {
          status: 'success',
          enrolled_course_ids: ['901'],
          reviewed_course_ids: ['901'],
          progress: {
            '901': {
              courseId: '901',
              enrolledDate: '2026-11-20',
              completedLessonIds: ['1001', '1002'],
              isCompleted: true,
              hasReviewed: true,
              completedDate: '2026-11-26',
              certificateId: serverCertKey,
              status: 'finished',
              grade: 'passed',
            },
          },
          certificates: [
            {
              id: 'cert-901-42',
              courseId: '901',
              courseTitle: 'Executive AI Mastery',
              studentName: 'Sadia Rahman',
              issueDate: 'November 26, 2026',
              credentialId: serverCertKey,
              instructorName: 'Dr. Mentor',
              verificationUrl: `https://staging.thrivingskill.com/certificates/${serverCertKey}/`,
              serverVerified: true,
            },
          ],
        },
        200
      )
    );

    const ctxRef: { current: ReturnType<typeof useLearning> | null } = { current: null };
    const Probe = () => {
      const ctx = useLearning();
      ctxRef.current = ctx;
      return <Text testID="cert-count">{ctx.certificates.length}</Text>;
    };

    const screen = await render(
      <LearningProvider>
        <Probe />
      </LearningProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('cert-count').props.children).toBe(1);
      expect(ctxRef.current?.isCertificateUnlocked('901')).toBe(true);
      expect(ctxRef.current?.hasReviewedCourse('901')).toBe(true);
      expect(ctxRef.current?.certificates[0].credentialId).toBe(serverCertKey);
    });

    // If backend rejects a course review/unlock (e.g. course not finished), state must NOT unlock locally
    fetchMock.mockResolvedValueOnce(
      mockJson(
        {
          code: 'course_not_completed',
          message: 'Complete 100% of this course on the server before claiming your certificate.',
        },
        403
      )
    );

    const attemptResult: { error: Error | null } = { error: null };
    await act(async () => {
      try {
        await ctxRef.current!.submitMandatoryCourseReview(
          '999',
          5,
          'Trying to unlock before finishing on server.',
          'Sadia Rahman',
          'Student'
        );
      } catch (err) {
        attemptResult.error = err as Error;
      }
    });

    expect(attemptResult.error?.message).toContain('Complete 100%');
    expect(ctxRef.current?.hasReviewedCourse('999')).toBe(false);
    expect(ctxRef.current?.isCertificateUnlocked('999')).toBe(false);
    expect(ctxRef.current?.certificates.find((c) => c.courseId === '999')).toBeUndefined();

    // Verify CompanionService.fetchLearningState contract explicitly
    fetchMock.mockResolvedValueOnce(
      mockJson({
        status: 'success',
        enrolled_course_ids: [901],
        reviewed_course_ids: [],
        progress: {},
        certificates: [],
      })
    );
    const parsedState = await CompanionService.fetchLearningState();
    expect(parsedState?.enrolledCourseIds).toEqual(['901']);
    expect(parsedState?.certificates).toEqual([]);
  });
});
