import React from 'react';
import { Text, View } from 'react-native';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OfflineManager } from '../services/offline/offlineManager';
import { HttpClient } from '../services/api/httpClient';
import {
  LessonVideoContainer,
  buildLessonVideoHtml,
} from '../components/player/LessonVideoContainer';
import { VideoPlayerGestureOverlay } from '../components/player/VideoPlayerGestureOverlay';
import { LessonTranscriptTab } from '../components/player/LessonTranscriptTab';
import { LearningProvider, useLearning } from '../context/LearningContext';
import { Course, Lesson } from '../types';

jest.mock('react-native-webview', () => {
  const ReactActual = require('react');
  const { View: RNView } = require('react-native');
  return {
    WebView: ReactActual.forwardRef((props: any, _ref: any) =>
      ReactActual.createElement(RNView, { testID: 'mock-lesson-webview', ...props })
    ),
  };
});

jest.mock('../components/player/NativeMedia3Player', () => {
  const ReactActual = require('react');
  const { View: RNView } = require('react-native');
  return {
    NativeMedia3Player: ReactActual.forwardRef((props: any, _ref: any) =>
      ReactActual.createElement(RNView, { testID: 'mock-native-media3-player', ...props })
    ),
  };
});

jest.mock('@expo/vector-icons/Ionicons', () => {
  const ReactActual = require('react');
  const { Text: RNText } = require('react-native');
  return (props: any) => ReactActual.createElement(RNText, null, props.name);
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
    },
  }),
}));

jest.mock('../context/LanguageContext', () => ({
  useLanguage: () => ({ isBangla: false, language: 'en' }),
}));

jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 42, username: 'learner42', email: 'learner42@example.com' },
    token: 'jwt_verified_42',
    canBypassCourseLocks: false,
  }),
}));

jest.mock('../context/NetworkContext', () => ({
  useNetwork: () => ({ isOffline: false }),
}));

const paidCourseSample: Course = {
  id: '88180',
  title: 'Presentation Mastery Using AI',
  slug: 'presentation-mastery-ai',
  subtitle: 'Executive slides workflow',
  description: '',
  category: 'generative-ai',
  instructor: {
    id: 'inst-1',
    name: 'Lead Mentor',
    title: 'Instructor',
    company: 'Thriving Skills',
    avatar: '',
    bio: '',
    rating: 4.9,
    studentsCount: 100,
    coursesCount: 3,
  },
  rating: 4.9,
  reviewsCount: 12,
  enrolledCount: 100,
  durationHours: 2,
  lecturesCount: 2,
  certificateIncluded: true,
  language: 'English',
  lastUpdated: '2026-11',
  level: 'Intermediate',
  price: 15,
  priceBdt: 1500,
  originalPrice: 30,
  originalPriceBdt: 3000,
  thumbnail: 'https://thrivingskill.com/thumb.jpg',
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
          title: 'Free Preview Lesson',
          duration: '05:00',
          isFreePreview: true,
          type: 'lesson',
          videoUrl: 'https://player.vimeo.com/video/1228513027?h=21ffa944fc',
        },
        {
          id: '88182',
          title: 'Paid Lesson 2',
          duration: '10:00',
          isFreePreview: false,
          type: 'lesson',
          videoUrl: 'https://player.vimeo.com/video/1228513099',
        },
      ],
    },
  ],
};

jest.mock('../context/learning/useCatalogAndBrandingSync', () => ({
  useCatalogAndBrandingSync: () => {
    const ReactActual = require('react');
    const [courses] = ReactActual.useState([paidCourseSample]);
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
      loadCourseDetail: jest.fn(async () => paidCourseSample),
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

describe('Online Video Playback, Commute Listening & Offline Study Guide Boundaries', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    HttpClient.setAuthToken(null);
    await AsyncStorage.clear();
  });

  afterEach(() => {
    HttpClient.setAuthToken(null);
    jest.useRealTimers();
  });

  it('stores text study guides only in OfflineManager without fabricated video quality or MB file size metadata', async () => {
    const lesson: Lesson = {
      id: 'l-study-1',
      title: 'Prompt Engineering Frameworks',
      duration: '08:30',
      summary: 'Structured prompting techniques for business workflows.',
    };

    await OfflineManager.saveLessonOffline(
      '88180',
      lesson,
      'Detailed outline for offline revision.',
      'Presentation Mastery Using AI'
    );

    const saved = await OfflineManager.getDownloadedLesson('l-study-1');
    expect(saved).toBeTruthy();
    expect(saved?.content).toBe('Detailed outline for offline revision.');
    expect((saved as any).quality).toBeUndefined();
    expect((saved as any).fileSize).toBeUndefined();
    expect(JSON.stringify(saved)).not.toContain('720p HD');
    expect(JSON.stringify(saved)).not.toContain('65 MB');
  });

  it('saves free-preview resume positions without fabricating paid course enrollment in userProgress', async () => {
    HttpClient.setAuthToken('jwt_verified_42');
    const fetchMock = globalThis.fetch as jest.Mock;
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json', forEach: () => {} },
      json: async () => ({
        status: 'success',
        enrolled_course_ids: [],
        reviewed_course_ids: [],
        progress: {},
        certificates: [],
      }),
      text: async () => '{}',
    });

    const ctxRef: { current: ReturnType<typeof useLearning> | null } = { current: null };
    const Probe = () => {
      const ctx = useLearning();
      ctxRef.current = ctx;
      return <Text testID="enrolled-count">{Object.keys(ctx.userProgress).length}</Text>;
    };

    const { unmount } = await render(
      <LearningProvider>
        <Probe />
      </LearningProvider>
    );

    try {
      await waitFor(() => expect(ctxRef.current).toBeTruthy());
      await waitFor(() => expect(fetchMock).toHaveBeenCalled());

      await act(async () => {
        ctxRef.current?.recordWatchPosition('88180', '88181', 125);
        ctxRef.current?.markLessonCompleted('88180', '88181');
      });

      expect(ctxRef.current?.getWatchPosition('88180', '88181')).toBe(125);
      // Critical security boundary: paid course must remain unenrolled after preview playback
      expect(ctxRef.current?.userProgress['88180']).toBeUndefined();
    } finally {
      await unmount();
    }
  });

  it('builds Vimeo and YouTube embed HTML with interactive controls preserved, SDK telemetry, and resume-seek support', () => {
    const vimeoHtml = buildLessonVideoHtml(
      '<iframe src="https://player.vimeo.com/video/1228513027?h=21ffa944fc&amp;controls=0"></iframe>',
      'https://player.vimeo.com/video/1228513027?h=21ffa944fc',
      95,
      1.25
    );
    expect(vimeoHtml).toContain('https://player.vimeo.com/api/player.js');
    expect(vimeoHtml).toContain('h=21ffa944fc');
    expect(vimeoHtml).toContain('window.__TS_PLAYER__');
    expect(vimeoHtml).toContain('var initialSeek = 95;');
    expect(vimeoHtml).toContain('var initialRate = 1.25;');
    expect(vimeoHtml).not.toContain('controls=0');

    const ytHtml = buildLessonVideoHtml(undefined, 'https://youtu.be/dQw4w9WgXcQ', 40, 1);
    expect(ytHtml).toContain('https://www.youtube.com/iframe_api');
    expect(ytHtml).toContain('youtube-nocookie.com/embed/dQw4w9WgXcQ');
    expect(ytHtml).toContain('controls=1');
    expect(ytHtml).not.toContain('controls=0');
  });

  it('keeps media player mounted inside LessonVideoContainer during Commute Audio Mode and surfaces stream errors cleanly', async () => {
    const sampleLesson: Lesson = paidCourseSample.modules[0].lessons[0];
    const baseProps = {
      course: paidCourseSample,
      currentLesson: sampleLesson,
      moduleTitle: 'Module 1',
      canPlayVideo: true,
      hasVideo: true,
      isLessonCompleted: false,
      isCommuteMode: true,
      isPlaying: true,
      playbackSpeed: '1.0x',
      streamQuality: 'Auto',
      isFullscreen: false,
      isDeviceLandscape: false,
      isScreenLocked: false,
      isLoadingVideo: false,
      isDirectStream: false,
      activeVideoUrl: sampleLesson.videoUrl,
      resolvedVideoUrl: sampleLesson.videoUrl,
      videoHtml: buildLessonVideoHtml(undefined, sampleLesson.videoUrl),
      windowDimensions: { width: 390, height: 844 },
      currentPositionSeconds: 60,
      totalLessonSeconds: 300,
      autoplayCountdown: null,
      hasPrevLesson: false,
      hasNextLesson: true,
      nativePlayerRef: { current: null },
      onSelectLesson: jest.fn(),
      onOpenPaymentModal: jest.fn(),
      onOpenQuizPlayer: jest.fn(),
      onTogglePlay: jest.fn(),
      onPausePlayback: jest.fn(),
      onSeekTo: jest.fn(),
      onRewind: jest.fn(),
      onForward: jest.fn(),
      onPrevLesson: jest.fn(),
      onNextLesson: jest.fn(),
      onCycleSpeed: jest.fn(),
      onToggleFullscreen: jest.fn(),
      onToggleScreenLock: jest.fn(),
      onOpenStreamQualityModal: jest.fn(),
      onTriggerPiP: jest.fn(),
      onCancelAutoplay: jest.fn(),
      onMarkComplete: jest.fn(),
      onPictureInPictureStart: jest.fn(),
      onPictureInPictureStop: jest.fn(),
      onProgressUpdate: jest.fn(),
      onPlayStateChange: jest.fn(),
      formatSeconds: (s: number) => `${s}s`,
    };

    const { rerender, unmount } = await render(<LessonVideoContainer {...baseProps} />);
    // Real audio/video WebView remains mounted behind Commute Card so audio actually plays!
    expect(screen.getByTestId('mock-lesson-webview')).toBeTruthy();
    expect(screen.getByText('Audio Focus Mode')).toBeTruthy();

    // Direct Media3 stream reports honest Background Audio label and remains mounted
    const directProps = {
      ...baseProps,
      isDirectStream: true,
      activeVideoUrl: 'https://cdn.example.com/lesson.mp4',
    };
    await rerender(<LessonVideoContainer {...directProps} />);
    expect(screen.getByTestId('mock-native-media3-player')).toBeTruthy();
    expect(screen.getByText('Background Audio Active')).toBeTruthy();

    // When WebView posts VIDEO_ERROR in video mode, retry & browser fallback appear
    await rerender(<LessonVideoContainer {...baseProps} isCommuteMode={false} />);
    const webview = screen.getByTestId('mock-lesson-webview');
    await act(async () => {
      webview.props.onMessage({
        nativeEvent: { data: JSON.stringify({ type: 'VIDEO_ERROR', message: 'Domain blocked' }) },
      });
    });
    expect(screen.getByText('Domain blocked')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Retry video stream' })).toBeTruthy();
    await unmount();
  });

  it('allows interactive scrub-bar seeking on VideoPlayerGestureOverlay', async () => {
    const onSeekTo = jest.fn();
    const { unmount } = await render(
      <VideoPlayerGestureOverlay
        isPlaying={false}
        onTogglePlay={jest.fn()}
        currentPositionSeconds={30}
        totalDurationSeconds={200}
        onSeekTo={onSeekTo}
        onRewind={jest.fn()}
        onForward={jest.fn()}
        playbackSpeed="1.0x"
        onCycleSpeed={jest.fn()}
        videoQuality="Auto"
        onOpenQualityModal={jest.fn()}
        isFullscreen={false}
        onToggleFullscreen={jest.fn()}
        onTriggerPiP={jest.fn()}
        title="Direct Stream Lesson"
        isLocked={false}
        onToggleLock={jest.fn()}
      />
    );

    const slider = screen.getByRole('adjustable', { name: 'Seek video timeline' });
    await fireEvent.layout(slider, { width: 200, height: 14 });
    await fireEvent(slider, 'responderRelease', { nativeEvent: { locationX: 100 } });
    expect(onSeekTo).toHaveBeenCalledWith(100);
    await unmount();
  });

  it('never fabricates placeholder software quotes in LessonTranscriptTab and supports real timestamp seeking', async () => {
    const onSeekTo = jest.fn();
    const { rerender, unmount } = await render(
      <LessonTranscriptTab
        currentPositionSeconds={0}
        lessonTitle="Digital Marketing Basics"
        instructorName="Mentor"
        durationSeconds={300}
        onSeekTo={onSeekTo}
      />
    );
    try {
      expect(screen.queryByText(/separating concerns/i)).toBeNull();
      expect(screen.queryByText(/evaluation loop/i)).toBeNull();
      expect(screen.getByText(/No written transcript is published/i)).toBeTruthy();

      await rerender(
        <LessonTranscriptTab
          currentPositionSeconds={0}
          lessonTitle="Marketing Funnel"
          instructorName="Mentor"
          lessonContent="[01:30] Understanding top-of-funnel awareness"
          durationSeconds={300}
          onSeekTo={onSeekTo}
        />
      );
      await fireEvent.press(
        screen.getByRole('button', {
          name: /Seek to 01:30: Understanding top-of-funnel awareness/i,
        })
      );
      expect(onSeekTo).toHaveBeenCalledWith(90);
    } finally {
      await unmount();
    }
  });
});
