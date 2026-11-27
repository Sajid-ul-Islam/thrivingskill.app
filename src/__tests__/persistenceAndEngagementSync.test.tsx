import React from 'react';
import { Text } from 'react-native';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Endpoints } from '../services/api/endpoints';
import { HttpClient } from '../services/api/httpClient';
import { CompanionService } from '../services/api/companionService';
import { CorporateInquiryModal } from '../components/modals/CorporateInquiryModal';
import { SupportContactModal } from '../components/modals/SupportContactModal';
import {
  GamificationProvider,
  getLocalDateString,
  useGamification,
} from '../context/GamificationContext';
import { LearningProvider, useLearning } from '../context/LearningContext';

jest.mock('@expo/vector-icons/Ionicons', () => {
  const ReactActual = require('react');
  const { Text: RNText } = require('react-native');
  return (props: any) => ReactActual.createElement(RNText, null, props.name);
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

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
      accentLight: '#FEE2E2',
      danger: '#E34234',
      onPrimary: '#FFFFFF',
      onSecondary: '#FFFFFF',
      onAccent: '#FFFFFF',
    },
  }),
}));

jest.mock('../context/LanguageContext', () => ({
  useLanguage: () => ({ isBangla: false, language: 'en' }),
}));

const mockToast = jest.fn();
jest.mock('../context/FeedbackContext', () => ({
  useFeedback: () => ({ showToast: mockToast }),
}));

const mockSetAuthModalVisible = jest.fn();
let mockAuthState = {
  user: {
    id: 42,
    username: 'learner42',
    displayName: 'Tariq Hasan',
    email: 'tariq@example.com',
  } as any,
  token: 'jwt_verified_42' as string | null,
  isAuthenticated: true,
  canBypassCourseLocks: false,
  setAuthModalVisible: mockSetAuthModalVisible,
};

jest.mock('../context/AuthContext', () => ({
  useAuth: () => mockAuthState,
}));

jest.mock('../context/NetworkContext', () => ({
  useNetwork: () => ({ isOffline: false }),
}));

jest.mock('../context/learning/useCatalogAndBrandingSync', () => ({
  useCatalogAndBrandingSync: () => {
    const ReactActual = require('react');
    const [courses] = ReactActual.useState([
      {
        id: '88180',
        title: 'AI Mastery Course',
        slug: 'ai-mastery',
        subtitle: '',
        description: '',
        category: 'generative-ai',
        instructor: {
          id: 'inst-1',
          name: 'Mentor',
          title: 'Instructor',
          company: 'Thriving Skills',
          avatar: '',
          bio: '',
          rating: 4.9,
          studentsCount: 100,
          coursesCount: 2,
        },
        rating: 4.9,
        reviewsCount: 5,
        enrolledCount: 100,
        durationHours: 2,
        lecturesCount: 1,
        certificateIncluded: true,
        language: 'English',
        lastUpdated: '2026-11',
        level: 'Intermediate',
        price: 15,
        priceBdt: 1500,
        originalPrice: 30,
        originalPriceBdt: 3000,
        thumbnail: '',
        highlights: [],
        prerequisites: [],
        reviews: [],
        modules: [
          {
            id: 'mod-1',
            title: 'Module 1',
            lessons: [
              {
                id: '88181',
                title: 'Preview Lesson',
                duration: '05:00',
                isFreePreview: true,
                type: 'lesson',
                videoUrl: 'https://player.vimeo.com/video/1228513027',
              },
            ],
          },
        ],
      },
    ]);
    const coursesRef = ReactActual.useRef(courses);
    coursesRef.current = courses;
    return {
      courses,
      setCourses: jest.fn(),
      coursesRef,
      totalCourseCount: 1,
      categories: [],
      workshops: [],
      blogPosts: [],
      isLoadingCourses: false,
      coursesError: null,
      refreshCourses: jest.fn(async () => undefined),
      loadCourseDetail: jest.fn(async () => courses[0]),
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

function makeJsonResponse(data: any, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => 'application/json', forEach: () => {} },
    json: async () => data,
    text: async () => JSON.stringify(data),
  };
}

describe('Priority 2 Backend Persistence & Engagement Sync', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    (globalThis.fetch as jest.Mock).mockReset();
    (globalThis.fetch as jest.Mock).mockImplementation(() =>
      Promise.reject(new Error('Unmocked network request attempted during Jest unit tests'))
    );
    HttpClient.setAuthToken('jwt_verified_42');
    mockAuthState = {
      user: {
        id: 42,
        username: 'learner42',
        displayName: 'Tariq Hasan',
        email: 'tariq@example.com',
      },
      token: 'jwt_verified_42',
      isAuthenticated: true,
      canBypassCourseLocks: false,
      setAuthModalVisible: mockSetAuthModalVisible,
    };
    await AsyncStorage.clear();
  });

  afterEach(() => {
    HttpClient.setAuthToken(null);
    jest.useRealTimers();
  });

  it('defines corporate inquiry, support tickets, and engagement sync endpoints and parses server payloads', async () => {
    expect((Endpoints.COMPANION as any).CORPORATE_INQUIRY).toBe(
      '/thrivingskill/v1/corporate-inquiry'
    );
    expect((Endpoints.COMPANION as any).SUPPORT_TICKETS).toBe('/thrivingskill/v1/support-tickets');
    expect((Endpoints.COMPANION as any).ENGAGEMENT_SYNC).toBe('/thrivingskill/v1/engagement-sync');

    const fetchMock = globalThis.fetch as jest.Mock;
    fetchMock.mockResolvedValueOnce(
      makeJsonResponse({
        status: 'success',
        enrolled_course_ids: [],
        reviewed_course_ids: [],
        progress: {},
        certificates: [],
        watch_positions: { '88180': { '88181': 195 } },
        gamification: {
          streakDays: 5,
          lastActiveDate: '2026-11-26',
          dailyMinutesSpent: 25,
          dailyGoalMinutes: 20,
          totalStudyMinutes: 140,
          dailyHistory: { '2026-11-26': 25 },
          xp: 480,
          streakFreezes: 1,
          streakFreezeUsedToday: false,
          preferredStudyHour: 21,
          unlockedBadges: [{ id: 'first_step', unlockedAt: '2026-11-20' }],
          updatedAt: 9999,
        },
      })
    );

    const state = await CompanionService.fetchLearningState();
    expect(state?.watchPositions?.['88180']?.['88181']).toBe(195);
    expect(state?.gamification?.xp).toBe(480);
    expect(state?.gamification?.streakDays).toBe(5);
  });

  it('persists CorporateInquiryModal requests via backend API and blocks fake success when request fails', async () => {
    const fetchMock = globalThis.fetch as jest.Mock;
    fetchMock.mockResolvedValueOnce(
      makeJsonResponse({ message: 'Mail server temporarily busy', data: { status: 503 } }, 503)
    );

    const { unmount } = await render(<CorporateInquiryModal visible={true} onClose={jest.fn()} />);

    try {
      await fireEvent.press(screen.getByText('Continue to Contact Info'));
      await fireEvent.changeText(
        screen.getByPlaceholderText('e.g. Apex Holdings / BRAC'),
        'Apex Logistics'
      );
      await fireEvent.changeText(
        screen.getByPlaceholderText('e.g. Tanvir Ahmed, Head of HR'),
        'Nadia Rahman'
      );
      await fireEvent.changeText(
        screen.getByPlaceholderText('name@company.com'),
        'nadia@apex.example.com'
      );
      await fireEvent.press(screen.getByText('Review'));
      await fireEvent.press(screen.getByText('Submit Request'));

      await waitFor(() => {
        expect(screen.getByText(/Could not submit/i)).toBeTruthy();
      });
      expect(screen.queryByText('Proposal Request Received!')).toBeNull();

      fetchMock.mockResolvedValueOnce(
        makeJsonResponse(
          {
            status: 'success',
            reference_id: 'CORP-20261126-AB12CD',
            submitted_at: '2026-11-26 11:00:00',
            inquiry_status: 'new',
          },
          201
        )
      );

      await fireEvent.press(screen.getByText('Submit Request'));
      await waitFor(() => {
        expect(screen.getByText('Proposal Request Received!')).toBeTruthy();
        expect(screen.getByText(/CORP-20261126-AB12CD/)).toBeTruthy();
      });
    } finally {
      await unmount();
    }
  }, 30000);

  it('submits and displays tracked support tickets in SupportContactModal and handles unauthenticated state', async () => {
    const fetchMock = globalThis.fetch as jest.Mock;
    fetchMock.mockResolvedValueOnce(
      makeJsonResponse({
        status: 'success',
        tickets: [
          {
            ticket_id: 'TS-20261126-OLD111',
            topic: 'certificate',
            subject: 'Old verification question',
            message: 'Checking credential URL formatting.',
            status: 'resolved',
            admin_reply: 'Verified and updated.',
            created_at: '2026-11-25 10:00:00',
            updated_at: '2026-11-25 12:00:00',
          },
        ],
      })
    );

    const view = await render(<SupportContactModal visible={true} onClose={jest.fn()} />);
    try {
      await waitFor(() => {
        expect(screen.getByText('TS-20261126-OLD111')).toBeTruthy();
        expect(screen.getByText(/Verified and updated/i)).toBeTruthy();
      });

      fetchMock.mockResolvedValueOnce(
        makeJsonResponse(
          {
            status: 'success',
            ticket: {
              ticket_id: 'TS-20261126-NEW222',
              topic: 'general',
              subject: 'App dark mode sync',
              message: 'Checking how lesson progress appears across phones.',
              status: 'open',
              admin_reply: '',
              created_at: '2026-11-26 11:05:00',
              updated_at: '2026-11-26 11:05:00',
            },
          },
          201
        )
      );

      await fireEvent.changeText(
        screen.getByPlaceholderText(/Brief summary/i),
        'App dark mode sync'
      );
      await fireEvent.changeText(
        screen.getByPlaceholderText(/Describe your issue/i),
        'Checking how lesson progress appears across phones.'
      );
      await fireEvent.press(screen.getByRole('button', { name: /Submit Support Ticket/i }));

      await waitFor(() => {
        expect(screen.getByText('TS-20261126-NEW222')).toBeTruthy();
      });
    } finally {
      await view.unmount();
    }

    // Logged-out visitor sees sign-in CTA instead of crash
    mockAuthState = {
      ...mockAuthState,
      user: null,
      token: null,
      isAuthenticated: false,
    };
    HttpClient.setAuthToken(null);
    const guestView = await render(<SupportContactModal visible={true} onClose={jest.fn()} />);
    try {
      const signInBtn = screen.getByRole('button', { name: /Sign In to Track Tickets/i });
      await fireEvent.press(signInBtn);
      expect(mockSetAuthModalVisible).toHaveBeenCalledWith(true);
    } finally {
      await guestView.unmount();
    }
  }, 30000);

  it('syncs GamificationContext streaks/XP monotonically and isolates server watch_positions from paid enrollment', async () => {
    jest.useFakeTimers();
    const todayStr = getLocalDateString();
    const fetchMock = globalThis.fetch as jest.Mock;
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/learning-state')) {
        return makeJsonResponse({
          status: 'success',
          enrolled_course_ids: [],
          reviewed_course_ids: [],
          progress: {},
          certificates: [],
          watch_positions: { '88180': { '88181': 210 } },
          gamification: {
            streakDays: 6,
            lastActiveDate: todayStr,
            dailyMinutesSpent: 30,
            dailyGoalMinutes: 20,
            totalStudyMinutes: 300,
            dailyHistory: { [todayStr]: 30 },
            xp: 900,
            streakFreezes: 2,
            streakFreezeUsedToday: false,
            preferredStudyHour: 19,
            unlockedBadges: [{ id: 'streak_champ', unlockedAt: todayStr }],
            updatedAt: Date.now(),
          },
        });
      }
      return makeJsonResponse({ status: 'success', watch_positions: {}, gamification: null });
    });

    const gRef: { current: ReturnType<typeof useGamification> | null } = { current: null };
    const lRef: { current: ReturnType<typeof useLearning> | null } = { current: null };

    const Probe = () => {
      const g = useGamification();
      const l = useLearning();
      gRef.current = g;
      lRef.current = l;
      return <Text testID="xp-value">{g.xp}</Text>;
    };

    const { unmount } = await render(
      <GamificationProvider>
        <LearningProvider>
          <Probe />
        </LearningProvider>
      </GamificationProvider>
    );

    try {
      await waitFor(() => {
        expect(gRef.current?.xp).toBe(900);
        expect(gRef.current?.streakDays).toBe(6);
        expect(lRef.current?.getWatchPosition('88180', '88181')).toBe(210);
      });
      // Free-preview server watch position must never unlock paid course in userProgress
      expect(lRef.current?.userProgress['88180']).toBeUndefined();

      await act(async () => {
        gRef.current?.addXP(50);
        lRef.current?.recordWatchPosition('88180', '88181', 240);
      });

      await act(async () => {
        jest.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        const engagementCalls = fetchMock.mock.calls.filter(([u]) =>
          String(u).includes('/thrivingskill/v1/engagement-sync')
        );
        expect(engagementCalls.length).toBeGreaterThanOrEqual(1);
      });
    } finally {
      await unmount();
      jest.clearAllTimers();
      jest.useRealTimers();
    }
  });

  it('retains higher watch positions monotonically when local cache has an older timestamp', async () => {
    // Secondary Device B starts with an older local cached watch position of 600s (10 min)
    await AsyncStorage.setItem(
      '@thriving_skill_watch_positions_u_42',
      JSON.stringify({ '88180': { '88181': 600, '88182': 300 } })
    );

    const fetchMock = globalThis.fetch as jest.Mock;
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/learning-state')) {
        // Server has Device A's newer 1080s (18 min) position for 88181, plus 120s for 88182
        return makeJsonResponse({
          status: 'success',
          enrolled_course_ids: [],
          reviewed_course_ids: [],
          progress: {},
          certificates: [],
          watch_positions: { '88180': { '88181': 1080, '88182': 120 } },
          gamification: null,
        });
      }
      return makeJsonResponse({ status: 'success', watch_positions: {}, gamification: null });
    });

    const lRef: { current: ReturnType<typeof useLearning> | null } = { current: null };
    const Probe = () => {
      lRef.current = useLearning();
      return <Text testID="pos">{lRef.current.getWatchPosition('88180', '88181')}</Text>;
    };

    const { unmount } = await render(
      <LearningProvider>
        <Probe />
      </LearningProvider>
    );

    try {
      await waitFor(() => {
        expect(lRef.current?.getWatchPosition('88180', '88181')).toBe(1080);
        expect(lRef.current?.getWatchPosition('88180', '88182')).toBe(300);
      });
    } finally {
      await unmount();
    }
  });
});
