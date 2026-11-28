import React from 'react';
import { Alert, Text, View } from 'react-native';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Course } from '../types';
import { CoursesService } from '../services/api/coursesService';
import { LessonsService } from '../services/api/lessonsService';
import { CourseDetailScreen } from '../screens/CourseDetailScreen';
import { LessonPlayerScreen } from '../screens/LessonPlayerScreen';

jest.mock('@expo/vector-icons/Ionicons', () => {
  const ReactActual = require('react');
  const { Text: RNText } = require('react-native');
  return (props: any) => ReactActual.createElement(RNText, null, props.name);
});

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('react-native-webview', () => {
  const ReactActual = require('react');
  const { View: RNView } = require('react-native');
  return {
    WebView: ReactActual.forwardRef(() =>
      ReactActual.createElement(RNView, { testID: 'mock-webview' })
    ),
  };
});

jest.mock('../context/ThemeContext', () => ({
  useTheme: () => ({
    isDark: false,
    colors: {
      background: '#FFFFFF',
      surface: '#FFFFFF',
      surfaceCard: '#FFFFFF',
      surfaceSubtle: '#F8FAFC',
      border: '#E2E8F0',
      borderSubtle: '#E2E8F0',
      text: '#102F53',
      textMuted: '#64748B',
      textLight: '#94A3B8',
      primary: '#102F53',
      primaryLight: '#E8EEF5',
      secondary: '#1D4476',
      secondaryLight: '#EFF6FF',
      accent: '#E34234',
      onPrimary: '#FFFFFF',
      onSecondary: '#FFFFFF',
      onAccent: '#FFFFFF',
      cardShadow: '#000000',
      starColor: '#FFB606',
      badgeBackground: '#102F53',
      badgeText: '#FFFFFF',
    },
  }),
}));

jest.mock('../context/LanguageContext', () => ({
  useLanguage: () => ({
    isBangla: false,
    language: 'en',
    t: (k: string) => k,
  }),
}));

jest.mock('../context/FeedbackContext', () => ({
  useFeedback: () => ({ showToast: jest.fn() }),
}));

jest.mock('../context/YouTubeContext', () => ({
  useYouTube: () => ({ videos: [], playVideo: jest.fn(), savedVideos: [] }),
}));

jest.mock('../context/NetworkContext', () => ({
  useNetwork: () => ({ isOffline: false }),
}));

jest.mock('../context/GamificationContext', () => ({
  useGamification: () => ({
    recordStudyTime: jest.fn(),
    addXP: jest.fn(),
    unlockBadge: jest.fn(),
    triggerCelebration: jest.fn(),
  }),
}));

jest.mock('../theme/responsive', () => ({
  useResponsive: () => ({ isTablet: false, containerClampStyle: {} }),
}));

let mockAuthState: any = {
  user: null,
  token: null,
  isAuthenticated: false,
  isAdmin: false,
  canBypassCourseLocks: false,
  setAuthModalVisible: jest.fn(),
  updateUserProfile: jest.fn(async () => undefined),
};

jest.mock('../context/AuthContext', () => ({
  useAuth: () => mockAuthState,
}));

const mockConfirmServerEnrollments = jest.fn();
const mockRefreshCourses = jest.fn(async () => undefined);
const mockLoadCourseDetail = jest.fn(async (id: string) => mockCourseMap[id]);
const mockEnrollInCourse = jest.fn();

const freeCourse: Course = {
  id: '88032',
  title: 'AI Relevance Course',
  slug: 'ai-relevance',
  subtitle: 'Free AI fundamentals',
  description: 'Free course description',
  category: 'generative-ai',
  instructor: {
    id: 'inst-1',
    name: 'Mentor',
    title: 'Instructor',
    company: 'Thriving Skills',
    avatar: '',
    bio: 'Bio',
    rating: null,
    studentsCount: null,
    coursesCount: null,
  },
  rating: null,
  reviewsCount: null,
  enrolledCount: null,
  durationHours: 1,
  lecturesCount: 1,
  certificateIncluded: true,
  language: 'Bangla',
  lastUpdated: '2026-11',
  level: 'Beginner',
  price: 0,
  originalPrice: 0,
  priceBdt: 0,
  originalPriceBdt: 0,
  thumbnail: 'https://thrivingskill.com/free.jpg',
  highlights: [],
  prerequisites: [],
  modules: [
    {
      id: 'mod-1',
      title: 'Module 1',
      lessons: [
        {
          id: '88033',
          title: 'Getting Started',
          duration: '10:00',
          isFreePreview: false,
          type: 'lesson',
        },
      ],
    },
  ],
  reviews: [],
};

const paidCourse: Course = {
  ...freeCourse,
  id: '86355',
  title: 'Emotional Intelligence',
  slug: 'emotional-intelligence',
  price: 5,
  priceBdt: 500,
  originalPrice: 10,
  originalPriceBdt: 1000,
  modules: [
    {
      id: 'mod-2',
      title: 'Module 1',
      lessons: [
        {
          id: '86356',
          title: 'Introduction (Preview)',
          duration: '08:00',
          isFreePreview: true,
          type: 'lesson',
        },
        {
          id: '86358',
          title: 'Importance of EI',
          duration: '12:00',
          isFreePreview: false,
          type: 'lesson',
        },
      ],
    },
  ],
};

let mockCourseMap: Record<string, Course> = {
  '88032': freeCourse,
  '86355': paidCourse,
};

let mockLearningState: any;

jest.mock('../context/LearningContext', () => {
  const actual = jest.requireActual('../context/LearningContext');
  return {
    ...actual,
    useLearning: () => mockLearningState,
  };
});

jest.mock('../services/api/coursesService', () => ({
  CoursesService: {
    enrollCourse: jest.fn(),
    verifyServerEnrollment: jest.fn(),
    fetchEnrolledCourseIdsFromServer: jest.fn(),
    getWooCommerceProductPricing: jest.fn(async () => null),
    getCourseReviews: jest.fn(async () => ({ reviews: [], rating: null, reviewsCount: null })),
    getCachedCoursesSync: jest.fn(() => []),
    getCachedCategoriesSync: jest.fn(() => []),
    getCachedWorkshopsSync: jest.fn(() => []),
    hydrateCatalogCache: jest.fn(async () => ({ courses: [], categories: [], workshops: [] })),
    subscribeCatalogUpdates: jest.fn(() => () => {}),
    getAllCourses: jest.fn(async () => []),
    getCourseDetail: jest.fn(async (id: string) => mockCourseMap[id]),
  },
}));

jest.mock('../services/api/lessonsService', () => ({
  LessonsService: {
    getLessonDetail: jest.fn(),
  },
}));

jest.mock('../services/api/brandingService', () => {
  const actual = jest.requireActual('../services/api/brandingService');
  return {
    ...actual,
    BrandingService: {
      getSiteBranding: jest.fn(async () => actual.DEFAULT_SITE_BRANDING),
      getDynamicBanners: jest.fn(async () => []),
      getPartnerLogos: jest.fn(async () => []),
      getHomeFeatureCards: jest.fn(async () => []),
      getSpecialBundles: jest.fn(async () => []),
      getStudentTestimonials: jest.fn(async () => []),
    },
  };
});

jest.mock('../services/api/companionService', () => {
  const actual = jest.requireActual('../services/api/companionService');
  const mockCompanion: Record<string, any> = {};
  for (const key of Object.getOwnPropertyNames(actual.CompanionService)) {
    const val = (actual.CompanionService as any)[key];
    if (typeof val === 'function') {
      mockCompanion[key] = val.bind(actual.CompanionService);
    }
  }
  mockCompanion.fetchAppConfig = jest.fn(async () => null);
  mockCompanion.checkServerEnrollment = jest.fn(async () => null);
  mockCompanion.fetchLearningState = jest.fn(async () => null);
  return {
    ...actual,
    CompanionService: mockCompanion,
  };
});

jest.mock('../services/wordpressApi', () => ({
  fetchWpCourses: jest.fn(async () => []),
  fetchWpCategories: jest.fn(async () => []),
  fetchWpPosts: jest.fn(async () => []),
  fetchWpCourseDetail: jest.fn(async (id: string) => mockCourseMap[id]),
  fetchWpLiveWorkshops: jest.fn(async () => []),
}));

describe('Enrollment flows, checkout redirection, preview access, and login sync', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();

    mockAuthState = {
      user: null,
      token: null,
      isAuthenticated: false,
      isAdmin: false,
      canBypassCourseLocks: false,
      setAuthModalVisible: jest.fn(),
      updateUserProfile: jest.fn(async () => undefined),
    };

    mockLearningState = {
      courses: [freeCourse, paidCourse],
      getCourseById: (id: string) => mockCourseMap[id],
      loadCourseDetail: mockLoadCourseDetail,
      userProgress: {},
      enrollInCourse: mockEnrollInCourse,
      confirmServerEnrollments: mockConfirmServerEnrollments,
      isBookmarked: () => false,
      toggleBookmark: jest.fn(),
      getCourseProgressPercentage: () => 0,
      addCourseReview: jest.fn(),
      hasReviewedCourse: () => false,
      isCertificateUnlocked: () => false,
      unlockCertificateForDev: jest.fn(),
      submitMandatoryCourseReview: jest.fn(),
      recordCategoryInteraction: jest.fn(),
      refreshCourses: mockRefreshCourses,
      markLessonCompleted: jest.fn(),
      getNotesForLesson: () => [],
      certificates: [],
      recordWatchPosition: jest.fn(),
      getWatchPosition: () => 0,
      addNote: jest.fn(),
      deleteNote: jest.fn(),
      restoreNote: jest.fn(),
    };

    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  it('requires login before direct free-course enrollment and enrolls on server when authenticated', async () => {
    const onNavigateToLesson = jest.fn();
    await render(
      <CourseDetailScreen
        courseId="88032"
        onBack={jest.fn()}
        onNavigateToLesson={onNavigateToLesson}
      />
    );

    // Guest tapping "Enroll for Free" must prompt login rather than fabricating guest progress
    await fireEvent.press(screen.getByRole('button', { name: 'Enroll for Free' }));
    expect(CoursesService.enrollCourse).not.toHaveBeenCalled();
    expect(mockConfirmServerEnrollments).not.toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith(
      'Sign In Required',
      expect.any(String),
      expect.any(Array)
    );

    // Authenticated learner enrolls directly via server endpoint
    mockAuthState = {
      ...mockAuthState,
      isAuthenticated: true,
      token: 'jwt_ok',
      user: { id: 42, username: 'learner42', email: 'learner42@example.com' },
    };
    (CoursesService.enrollCourse as jest.Mock).mockResolvedValueOnce({ success: true });

    await render(
      <CourseDetailScreen
        courseId="88032"
        onBack={jest.fn()}
        onNavigateToLesson={onNavigateToLesson}
      />
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Enroll for Free' }));

    await waitFor(() => {
      expect(CoursesService.enrollCourse).toHaveBeenCalledWith('88032');
    });
    expect(mockConfirmServerEnrollments).toHaveBeenCalledWith(['88032'], {
      conversionType: 'free_enrollment_confirmed',
    });
    expect(mockEnrollInCourse).not.toHaveBeenCalled();
  });

  it('keeps free course locked when server enrollment fails', async () => {
    mockAuthState = {
      ...mockAuthState,
      isAuthenticated: true,
      token: 'jwt_ok',
      user: { id: 42, username: 'learner42', email: 'learner42@example.com' },
    };
    (CoursesService.enrollCourse as jest.Mock).mockRejectedValueOnce(new Error('Network offline'));

    await render(
      <CourseDetailScreen courseId="88032" onBack={jest.fn()} onNavigateToLesson={jest.fn()} />
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Enroll for Free' }));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Enrollment Failed', 'Network offline');
    });
    expect(mockConfirmServerEnrollments).not.toHaveBeenCalled();
  });

  it('opens checkout bottom drawer when non-enrolled learner clicks Enroll Now or locked lesson on paid course', async () => {
    mockAuthState = {
      ...mockAuthState,
      isAuthenticated: true,
      token: 'jwt_ok',
      user: {
        id: 42,
        username: 'learner42',
        email: 'learner42@example.com',
        displayName: 'Test Learner',
      },
    };

    await render(
      <CourseDetailScreen courseId="86355" onBack={jest.fn()} onNavigateToLesson={jest.fn()} />
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Enroll Now' }));

    await waitFor(() => {
      expect(screen.getByText('Checkout & Enrollment')).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Proceed to Secure Checkout' })).toBeTruthy();
    });
  });

  it('shows paywall instead of "Video coming soon" when server blocks a lesson with 403/401', async () => {
    const authErr: any = new Error('Forbidden');
    authErr.status = 403;
    (LessonsService.getLessonDetail as jest.Mock).mockRejectedValueOnce(authErr);

    await render(
      <LessonPlayerScreen
        courseId="86355"
        lessonId="86356"
        onBack={jest.fn()}
        onSelectLesson={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Unlock Full Course Access')).toBeTruthy();
    });
    expect(screen.queryByTestId('video-coming-soon-card')).toBeNull();
    expect(screen.getByRole('button', { name: 'Enroll now to unlock' })).toBeTruthy();
  });

  it('syncs server enrollments automatically upon login inside LearningProvider', async () => {
    const { LearningProvider: RealLearningProvider, useLearning: useRealLearning } =
      jest.requireActual('../context/LearningContext');

    (CoursesService.fetchEnrolledCourseIdsFromServer as jest.Mock).mockResolvedValue([
      '86355',
      '88032',
    ]);

    const SyncProbe: React.FC = () => {
      const { userProgress } = useRealLearning();
      return (
        <View>
          <Text testID="enrolled-ids">{Object.keys(userProgress).sort().join(',')}</Text>
        </View>
      );
    };

    const { rerender } = await render(
      <RealLearningProvider>
        <SyncProbe />
      </RealLearningProvider>
    );

    expect(screen.getByTestId('enrolled-ids').props.children).toBe('');
    expect(CoursesService.fetchEnrolledCourseIdsFromServer).not.toHaveBeenCalled();

    // Simulate user login
    mockAuthState = {
      ...mockAuthState,
      isAuthenticated: true,
      token: 'jwt_user_token',
      user: { id: 42, username: 'learner42', email: 'learner42@example.com' },
    };

    await act(async () => {
      await rerender(
        <RealLearningProvider>
          <SyncProbe />
        </RealLearningProvider>
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('enrolled-ids').props.children).toBe('86355,88032');
    });
  });
});
