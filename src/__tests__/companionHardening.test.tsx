import React from 'react';
import { render } from '@testing-library/react-native';

const fs = require('fs');
const path = require('path');
import { transformCompanionCourse, transformWpCourse } from '../services/api/transformers';
import {
  CompanionService,
  isFlashSaleActive,
  resolveSupportContacts,
} from '../services/api/companionService';
import { CoursesService } from '../services/api/coursesService';
import { LessonsService } from '../services/api/lessonsService';
import { CacheManager } from '../services/cache/cacheManager';
import { HttpClient } from '../services/api/httpClient';
import { Env } from '../config/env';
import { FlashSaleBanner } from '../components/home/FlashSaleBanner';
import { CourseCard } from '../components/cards/CourseCard';

jest.mock('../context/ThemeContext', () => ({
  useTheme: () => ({
    isDark: false,
    colors: {
      primary: '#102F53',
      onPrimary: '#FFFFFF',
      accent: '#E34234',
      onAccent: '#FFFFFF',
      surfaceCard: '#FFFFFF',
      surfaceSubtle: '#F5F7FA',
      border: '#E2E8F0',
      borderSubtle: '#E2E8F0',
      text: '#102F53',
      textMuted: '#64748B',
      badgeBackground: '#102F53',
      badgeText: '#FFFFFF',
      starColor: '#FFB606',
    },
  }),
}));

jest.mock('../context/LanguageContext', () => ({
  useLanguage: () => ({ isBangla: false, language: 'en' }),
}));

jest.mock('../context/FeedbackContext', () => ({
  useFeedback: () => ({ showToast: jest.fn() }),
}));

jest.mock('../context/LearningContext', () => ({
  useLearning: () => ({
    userProgress: {},
    isBookmarked: () => false,
    toggleBookmark: jest.fn(),
    getCourseProgressPercentage: () => 0,
  }),
}));

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

describe('Companion Plugin Hardening & Issues 7-9 Compliance', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    HttpClient.setAuthToken(null);
    await Env.setEnvironment('staging');
  });

  it('keeps only ts-mobile-bridge plugin without duplicate directories or zip archives', () => {
    const repoRoot = process.cwd();
    const backendDir = path.join(repoRoot, 'backend-plugin');

    expect(fs.existsSync(path.join(backendDir, 'thriving-skills-mobile-bridge'))).toBe(false);
    expect(fs.existsSync(path.join(backendDir, 'thriving-skills-mobile-bridge.zip'))).toBe(false);
    expect(fs.existsSync(path.join(backendDir, 'ts-mobile-bridge.zip'))).toBe(false);

    const phpPath = path.join(backendDir, 'ts-mobile-bridge', 'ts-mobile-bridge.php');
    expect(fs.existsSync(phpPath)).toBe(true);
    const php = fs.readFileSync(phpPath, 'utf8');

    // Issue 9 invariants
    expect(php).not.toContain('TSMB_Auto_Updates');
    expect(php).not.toContain('auto_update_plugins');
    expect(php).toContain('register_uninstall_hook');
    expect(php).toContain("get_option('tsmb_latest_app_version', '1.4.0')");
    expect(php).toContain("public const NAMESPACE = 'tsl/v1'");
    expect(php).toContain("'/auth/send-otp'");
    expect(php).toContain("'/auth/verify-otp'");
    expect(php).toContain('wp_get_environment_type()');

    // Issue 7 invariants
    expect(php).toContain('users_can_register');
    expect(php).toContain('random_bytes(');
    expect(php).toContain('random_int(');
    expect(php).toContain('public const MIN_PASSWORD_LENGTH = 12');
    expect(php).toContain('tsmb_push_tokens');
    expect(php).toContain('DeviceNotRegistered');
    expect(php).not.toContain('registration-error-email-exists');
    expect(php).not.toContain('10000');

    // Issue 8 invariants
    expect(php).toContain('public const MAX_FEED_LIMIT = 50');
    expect(php).toContain("current_user_can('manage_options')");
    expect(php).toContain('wp_timezone()');
    expect(php).toContain('current_datetime()');
    expect(php).toContain('wp_date(');
    expect(php).not.toContain('strtotime(');
    expect(php).not.toContain('+8801700000000');
    expect(php).not.toContain('+88029876543');
    expect(php).not.toMatch(/\brating['"]?\s*=>\s*4\.9\b/);
    expect(php).not.toMatch(/students_count['"]?\s*=>[^;\n]*\b120\b/);

    // Issue 1 paywall invariants
    expect(php).toContain("'permission_callback' => [__CLASS__, 'check_lesson_access']");
    expect(php).not.toMatch(
      /register_rest_route\(self::NAMESPACE,\s*'\/lessons\/\(\?P<id>\\d\+\)',\s*\[\s*'methods'\s*=>\s*'GET',\s*'callback'\s*=>\s*\[__CLASS__,\s*'get_lesson_detail'\],\s*'permission_callback'\s*=>\s*'__return_true'/
    );
    expect(php).toContain("post_status !== 'publish'");
    expect(php).toContain('is_user_enrolled_in_any_lesson_course');
    expect(php).toContain("'/enrollments'");
    expect(php).toContain('guard_learnpress_paid_enroll');
    expect(php).toContain('filter_learnpress_can_enroll_course');
  });

  it('transforms courses with null rating and student counts instead of fabricated defaults', () => {
    const companionCourse = transformCompanionCourse({
      id: 49518,
      title: 'Creating Winning Mindset',
      excerpt: 'Build resilient leadership habits.',
      price_bdt: 500,
      students_count: null,
      rating: null,
      reviews_count: null,
    });

    expect(companionCourse.rating).toBeNull();
    expect(companionCourse.reviewsCount).toBeNull();
    expect(companionCourse.enrolledCount).toBeNull();
    expect(companionCourse.instructor.rating).toBeNull();
    expect(companionCourse.instructor.studentsCount).toBeNull();
    expect(companionCourse.instructor.coursesCount).toBeNull();

    const wpCourse = transformWpCourse({
      id: 90001,
      name: 'Sample Course Without Stats',
      price: 500,
      rating: 0,
      count_students: 0,
    });

    expect(wpCourse.rating).toBeNull();
    expect(wpCourse.reviewsCount).toBeNull();
    expect(wpCourse.enrolledCount).toBeNull();
  });

  it('preserves authentic rating and student counts when returned by backend', () => {
    const course = transformCompanionCourse({
      id: 72481,
      title: 'Real Estate Sales Mastering',
      price_bdt: 1500,
      students_count: 84,
      rating: 4.7,
      reviews_count: 12,
    });

    expect(course.rating).toBe(4.7);
    expect(course.enrolledCount).toBe(84);
    expect(course.reviewsCount).toBe(12);
  });

  it('hides rating and student count elements on CourseCard when null', async () => {
    const courseWithoutStats = transformCompanionCourse({
      id: 55001,
      title: 'Clean Course Card',
      price_bdt: 500,
      students_count: null,
      rating: null,
      reviews_count: null,
    });

    const { queryByText } = await render(
      <CourseCard course={courseWithoutStats} onPress={jest.fn()} />
    );

    expect(queryByText('Clean Course Card')).toBeTruthy();
    expect(queryByText(/learners/i)).toBeNull();
    expect(queryByText('4.9')).toBeNull();
    expect(queryByText('4.8')).toBeNull();
  });

  it('clamps companion /feed limit to 50 and sends push tokens only when authenticated with Expo format', async () => {
    const fetchMock = globalThis.fetch as jest.Mock;
    fetchMock.mockResolvedValueOnce(
      mockJson({ count: 1, page: 1, limit: 50, total_pages: 1, courses: [{ id: 1 }] }, 200)
    );

    const feedRes = await CompanionService.fetchLeanFeed(100000, 1);
    expect(feedRes?.courses).toHaveLength(1);
    expect(fetchMock.mock.calls[0][0]).toContain('/thrivingskill/v1/feed?limit=50&page=1');
    expect(fetchMock.mock.calls[0][0]).not.toContain('nocache');

    // Invalid token format or missing auth should never send a request
    expect(await CompanionService.registerPushToken('not_an_expo_token', 'android')).toBe(false);
    expect(
      await CompanionService.registerPushToken('ExponentPushToken[valid_token_123456]', 'android')
    ).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Authenticated with valid Expo push token succeeds
    HttpClient.setAuthToken('jwt_user_token');
    fetchMock.mockResolvedValueOnce(mockJson({ status: 'success' }, 200));
    expect(
      await CompanionService.registerPushToken('ExponentPushToken[valid_token_123456]', 'android')
    ).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toContain('/thrivingskill/v1/register-push-token');
  });

  it('enforces fixed end date for flash sales and hides expired or disabled banners', async () => {
    const now = 1_800_000_000_000;

    expect(isFlashSaleActive(null, now)).toBe(false);
    expect(
      isFlashSaleActive(
        {
          active: false,
          title: 'Disabled',
          coupon_code: 'NONE',
          discount_percent: 20,
          end_timestamp: Math.floor(now / 1000) + 3600,
        },
        now
      )
    ).toBe(false);
    expect(
      isFlashSaleActive(
        {
          active: true,
          title: 'No End Date',
          coupon_code: 'NOEND',
          discount_percent: 20,
          end_timestamp: null,
        },
        now
      )
    ).toBe(false);
    expect(
      isFlashSaleActive(
        {
          active: true,
          title: 'Expired Sale',
          coupon_code: 'OLD',
          discount_percent: 20,
          end_timestamp: Math.floor(now / 1000) - 60,
        },
        now
      )
    ).toBe(false);

    const expiredRender = await render(
      <FlashSaleBanner
        sale={{
          active: true,
          title: 'Expired Campaign',
          coupon_code: 'EXPIRED',
          discount_percent: 50,
          end_timestamp: Math.floor(Date.now() / 1000) - 300,
        }}
      />
    );
    expect(expiredRender.toJSON()).toBeNull();

    const activeRender = await render(
      <FlashSaleBanner
        sale={{
          active: true,
          title: 'Weekend AI Sprint',
          coupon_code: 'AI20',
          discount_percent: 20,
          end_timestamp: Math.floor(Date.now() / 1000) + 3600,
        }}
      />
    );
    expect(activeRender.queryByText('Weekend AI Sprint')).toBeTruthy();
  });

  it('normalizes empty support defaults gracefully without placeholders', () => {
    expect(resolveSupportContacts({ whatsapp: '', email: '   ', helpline: null })).toEqual({
      whatsapp: null,
      email: null,
      helpline: null,
    });
  });

  it('rejects lesson detail when server returns 401/403 without falling back to stale cache', async () => {
    const fetchMock = globalThis.fetch as jest.Mock;
    await CacheManager.set(
      'lesson_detail_86358',
      {
        id: 86358,
        name: 'Stale Paid Lesson',
        content: '',
        videoUrl: 'https://player.vimeo.com/video/123',
      },
      -1
    );

    fetchMock
      .mockResolvedValueOnce(
        mockJson({ code: 'rest_not_logged_in', message: 'Auth required' }, 401)
      )
      .mockResolvedValueOnce(
        mockJson({ code: 'lp_jwt_rest_cannot_view', message: 'Forbidden' }, 401)
      );

    await expect(LessonsService.getLessonDetail(86358)).rejects.toThrow();
  });

  it('enforces server-driven enrollment verification across cancelled, failed, pending, and confirmed orders', async () => {
    const fetchMock = globalThis.fetch as jest.Mock;

    // Unauthenticated check returns not enrolled
    HttpClient.setAuthToken(null);
    expect(await CoursesService.verifyServerEnrollment('88180')).toEqual({
      enrolled: false,
      enrolledCourseIds: [],
      reason: 'unauthenticated',
    });

    HttpClient.setAuthToken('jwt_user_token');

    // Failed WooCommerce order keeps course locked
    fetchMock.mockResolvedValueOnce(
      mockJson(
        {
          status: 'success',
          enrolled: false,
          enrolled_course_ids: [],
          order_status: 'failed',
          payment_confirmed: false,
        },
        200
      )
    );
    expect(
      await CoursesService.verifyServerEnrollment('88180', {
        orderId: '997',
        orderKey: 'wc_order_failed',
      })
    ).toMatchObject({ enrolled: false, orderStatus: 'failed', reason: 'payment_failed' });

    // Cancelled WooCommerce order keeps course locked
    fetchMock.mockResolvedValueOnce(
      mockJson(
        {
          status: 'success',
          enrolled: false,
          enrolled_course_ids: [],
          order_status: 'cancelled',
          payment_confirmed: false,
        },
        200
      )
    );
    expect(
      await CoursesService.verifyServerEnrollment('88180', {
        orderId: '997',
        orderKey: 'wc_order_cancel',
      })
    ).toMatchObject({ enrolled: false, orderStatus: 'cancelled', reason: 'payment_cancelled' });

    // Completed order with server enrollment unlocks course and bundle courses
    fetchMock.mockResolvedValueOnce(
      mockJson(
        {
          status: 'success',
          enrolled: true,
          enrolled_course_ids: [88180, 88181],
          order_status: 'completed',
          payment_confirmed: true,
        },
        200
      )
    );
    expect(
      await CoursesService.verifyServerEnrollment('88180', {
        orderId: '998',
        orderKey: 'wc_order_ok',
      })
    ).toEqual({
      enrolled: true,
      enrolledCourseIds: ['88180', '88181'],
      orderStatus: 'completed',
    });

    // LearnPress fallback when companion route returns 404 still respects course_data.status
    fetchMock.mockResolvedValueOnce(mockJson({ code: 'rest_no_route' }, 404)).mockResolvedValueOnce(
      mockJson(
        {
          id: 86355,
          name: 'Paid Course',
          price: 500,
          course_data: { status: '' },
        },
        200
      )
    );
    expect(await CoursesService.verifyServerEnrollment('86355')).toMatchObject({
      enrolled: false,
      reason: 'not_enrolled',
    });
  });
});
