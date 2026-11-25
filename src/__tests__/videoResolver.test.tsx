import React from 'react';
import { render } from '@testing-library/react-native';
import {
  VERIFIED_LESSON_VIDEOS,
  VIDEO_COMING_SOON_MESSAGE,
  parseVimeoVideoId,
  parseYouTubeVideoId,
  resolveLessonVideoData,
} from '../data/lessonVideosRegistry';
import { LessonsService } from '../services/api/lessonsService';
import { transformWpCourse } from '../services/api/transformers';
import { CacheManager } from '../services/cache/cacheManager';
import { LessonVideoContainer } from '../components/player/LessonVideoContainer';
import { Course, Lesson } from '../types';

jest.mock('react-native-webview', () => {
  const ReactActual = require('react');
  const { View } = require('react-native');
  return {
    WebView: (props: any) =>
      ReactActual.createElement(View, { testID: 'mock-lesson-webview', ...props }),
  };
});

jest.mock('@expo/vector-icons/Ionicons', () => {
  const ReactActual = require('react');
  const { Text } = require('react-native');
  return (props: any) => ReactActual.createElement(Text, null, props.name);
});

jest.mock('../context/ThemeContext', () => ({
  useTheme: () => ({
    isDark: false,
    colors: {
      surfaceCard: '#FFFFFF',
      surfaceSubtle: '#F8FAFC',
      border: '#E2E8F0',
      text: '#102F53',
      textMuted: '#64748B',
      primary: '#102F53',
      onPrimary: '#FFFFFF',
    },
  }),
}));

jest.mock('../context/LanguageContext', () => ({
  useLanguage: () => ({ isBangla: false, language: 'en' }),
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

describe('resolveLessonVideoData (Issue 2 fail-closed behavior)', () => {
  afterEach(() => {
    Object.keys(VERIFIED_LESSON_VIDEOS).forEach((k) => delete VERIFIED_LESSON_VIDEOS[k]);
  });

  it('extracts Vimeo ID and preserves privacy hash from WordPress videoIntro iframe', () => {
    const data = resolveLessonVideoData(
      { id: '88180', title: 'Presentation Mastery Using AI' },
      {
        id: '88181',
        title: 'Introduction',
        duration: '02 mins',
        summary: 'Course overview.',
        videoIntro:
          '<iframe src="https://player.vimeo.com/video/1228513027?h=21ffa944fc&amp;badge=0&amp;autopause=0" frameborder="0"></iframe>',
      }
    );

    expect(data.hasVideo).toBe(true);
    expect(data.comingSoon).toBe(false);
    expect(data.videoType).toBe('vimeo');
    expect(data.videoId).toBe('1228513027');
    expect(data.videoUrl).toBe(
      'https://player.vimeo.com/video/1228513027?h=21ffa944fc&badge=0&autopause=0'
    );
    expect(data.title).toBe('Introduction');
    expect(data.duration).toBe('02 mins');
    expect(data.summary).toBe('Course overview.');
  });

  it('normalizes direct Vimeo URL and parses YouTube IDs', () => {
    const vimeo = resolveLessonVideoData(undefined, {
      id: 'l2',
      title: 'Direct Vimeo URL',
      duration: '06:30',
      videoUrl: 'https://vimeo.com/555111222',
    });

    expect(vimeo.hasVideo).toBe(true);
    expect(vimeo.videoType).toBe('vimeo');
    expect(vimeo.videoId).toBe('555111222');
    expect(vimeo.videoUrl).toBe('https://player.vimeo.com/video/555111222');
    expect(vimeo.videoIntro).toContain('https://player.vimeo.com/video/555111222');

    const yt = resolveLessonVideoData(undefined, {
      id: 'l3',
      title: 'YouTube Briefing',
      videoUrl: 'https://youtu.be/dQw4w9WgXcQ',
    });

    expect(yt.hasVideo).toBe(true);
    expect(yt.videoType).toBe('youtube');
    expect(yt.videoId).toBe('dQw4w9WgXcQ');
    expect(yt.videoUrl).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
  });

  it('fails closed with "Video coming soon" on missing video and never falls back to fake playlists or default ID 441544660', () => {
    const noVideoZeroTrust = resolveLessonVideoData(
      { id: '99100', title: 'Zero Trust Network Architecture', category: 'cybersecurity' },
      { id: '99101', title: 'Zero Trust Lesson 1', duration: '08 mins', summary: 'Policy design.' }
    );

    expect(noVideoZeroTrust).toEqual({
      hasVideo: false,
      comingSoon: true,
      comingSoonMessage: VIDEO_COMING_SOON_MESSAGE,
      title: 'Zero Trust Lesson 1',
      duration: '08 mins',
      videoUrl: undefined,
      videoIntro: undefined,
      videoId: undefined,
      videoType: 'none',
      summary: 'Policy design.',
    });

    // Substrings like "ai" inside Training/Email/Domain/Retail must NOT trigger fake playlists
    for (const title of [
      'Corporate Training Program',
      'Business Email Writing',
      'Domain Driven Design',
      'Retail Operations Mastery',
    ]) {
      const res = resolveLessonVideoData(
        { id: '88180', title, category: 'ai' },
        { id: 'unassigned', title }
      );
      expect(res.hasVideo).toBe(false);
      expect(res.comingSoon).toBe(true);
      expect(res.videoUrl).toBeUndefined();
      expect(res.duration).toBe('');
      expect(res.summary).toBe('');
    }
  });

  it('fails closed on malformed Vimeo URLs without falling back to 441544660 or generic 15:00 duration', () => {
    expect(parseVimeoVideoId('https://vimeo.com/invalid')).toBeUndefined();
    expect(parseYouTubeVideoId('https://youtube.com/watch?v=short')).toBeUndefined();

    const malformed = resolveLessonVideoData(
      { id: '86355', title: 'Emotional Intelligence' },
      {
        id: 'bad-1',
        title: 'Broken Embed',
        videoIntro: '<iframe src="https://player.vimeo.com/video/not-a-number"></iframe>',
      }
    );

    expect(malformed.hasVideo).toBe(false);
    expect(malformed.comingSoon).toBe(true);
    expect(malformed.videoUrl).toBeUndefined();
    expect(malformed.videoId).toBeUndefined();
    expect(malformed.duration).toBe('');

    const xss = resolveLessonVideoData(undefined, {
      id: 'xss-1',
      title: 'XSS Attempt',
      videoIntro: '<iframe src="javascript:alert(1)"></iframe>',
    });
    expect(xss.hasVideo).toBe(false);
    expect(xss.videoType).toBe('none');
  });

  it('supports optional explicit lesson-ID registry lookups while failing closed on any miss', () => {
    VERIFIED_LESSON_VIDEOS['55001'] = {
      videoUrl: 'https://player.vimeo.com/video/777888999',
      videoType: 'vimeo',
      videoId: '777888999',
    };

    const hit = resolveLessonVideoData(undefined, { id: '55001', title: 'Exact Match' });
    expect(hit.hasVideo).toBe(true);
    expect(hit.videoId).toBe('777888999');

    const miss = resolveLessonVideoData(undefined, { id: '55002', title: 'Other Lesson' });
    expect(miss.hasVideo).toBe(false);
    expect(miss.comingSoon).toBe(true);
    expect(miss.videoUrl).toBeUndefined();
  });
});

describe('WordPress / LearnPress real lesson integration & UI no-video state', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await CacheManager.clearAll?.();
  });

  it('parses LearnPress video_intro ID cleanly and returns videoType "none" when lesson has no video', async () => {
    const fetchMock = globalThis.fetch as jest.Mock;

    // Companion unavailable -> falls back to LearnPress lesson with no video
    fetchMock.mockResolvedValueOnce(mockJson({ code: 'rest_no_route' }, 404)).mockResolvedValueOnce(
      mockJson(
        {
          id: 91001,
          name: 'Unpublished Video Lesson',
          content: 'Read attached slides.',
          excerpt: 'Slide deck overview.',
          duration: '04 mins',
          video_intro: '',
          meta_data: {
            _lp_duration: '04 mins',
            _lp_lesson_video_intro: '',
          },
        },
        200
      )
    );

    const noVideoDetail = await LessonsService.getLessonDetail(91001);
    expect(noVideoDetail.videoType).toBe('none');
    expect(noVideoDetail.videoUrl).toBeUndefined();
    expect(noVideoDetail.videoId).toBeUndefined();
    expect(noVideoDetail.duration).toBe('04 mins');
    expect(noVideoDetail.summary).toBe('Slide deck overview.');

    // Now test LearnPress lesson with valid Vimeo iframe + ?h= privacy hash
    fetchMock.mockResolvedValueOnce(mockJson({ code: 'rest_no_route' }, 404)).mockResolvedValueOnce(
      mockJson(
        {
          id: 91002,
          name: 'Valid Vimeo Lesson',
          content: 'Lecture transcript notes.',
          duration: '05 mins',
          video_intro:
            '<iframe src="https://player.vimeo.com/video/1228513027?h=21ffa944fc&amp;badge=0" frameborder="0"></iframe>',
        },
        200
      )
    );

    const validDetail = await LessonsService.getLessonDetail(91002);
    expect(validDetail.videoType).toBe('vimeo');
    expect(validDetail.videoId).toBe('1228513027');
    expect(validDetail.videoUrl).toBe(
      'https://player.vimeo.com/video/1228513027?h=21ffa944fc&badge=0'
    );
  });

  it('transformWpCourse uses real lesson metadata without inventing fake modules, titles, durations, or Vimeo videos', () => {
    const courseWithoutSections = transformWpCourse({
      id: 77001,
      name: 'Zero Trust Network Architecture',
      price: 1500,
    });
    expect(courseWithoutSections.modules).toEqual([]);
    expect(courseWithoutSections.lecturesCount).toBe(0);

    const courseWithSections = transformWpCourse({
      id: 77002,
      name: 'Zero Trust Network Architecture',
      price: 1500,
      sections: [
        {
          id: 10,
          title: 'Core Security',
          items: [
            {
              id: 77101,
              type: 'lp_lesson',
              title: 'Zero Trust Fundamentals',
              duration: '',
              preview: true,
            },
          ],
        },
      ],
    });

    const lesson = courseWithSections.modules[0].lessons[0];
    expect(lesson.title).toBe('Zero Trust Fundamentals');
    expect(lesson.duration).toBe('');
    expect(lesson.summary).toBe('');
    expect(lesson.videoUrl).toBeUndefined();
    expect(lesson.videoIntro).toBeUndefined();
    expect(lesson.videoType).toBe('none');
  });

  it('LessonVideoContainer displays "Video coming soon" on the no-video path without mounting WebView', async () => {
    const sampleCourse: Course = {
      id: '77002',
      title: 'Zero Trust Network Architecture',
      slug: 'zero-trust',
      subtitle: '',
      description: '',
      category: 'cybersecurity',
      instructor: {
        id: 'inst-1',
        name: 'Security Lead',
        title: 'Instructor',
        company: 'Thriving Skills',
        avatar: '',
        bio: '',
        rating: null,
        studentsCount: null,
        coursesCount: null,
      },
      rating: null,
      reviewsCount: null,
      enrolledCount: null,
      durationHours: 0,
      lecturesCount: 1,
      certificateIncluded: true,
      language: 'English',
      lastUpdated: '2026-11',
      level: 'All Levels',
      price: 10,
      originalPrice: 20,
      thumbnail: 'https://thrivingskill.com/thumb.jpg',
      highlights: [],
      prerequisites: [],
      modules: [],
      reviews: [],
    };
    const sampleLesson: Lesson = {
      id: '77101',
      title: 'Zero Trust Fundamentals',
      duration: '08 mins',
      videoType: 'none',
    };

    const view = await render(
      <LessonVideoContainer
        course={sampleCourse}
        currentLesson={sampleLesson}
        canPlayVideo={true}
        hasVideo={false}
        videoComingSoonMessage="Video coming soon"
        isLessonCompleted={false}
        isCommuteMode={false}
        isPlaying={false}
        playbackSpeed="1.0x"
        streamQuality="720p HD"
        isFullscreen={false}
        isDeviceLandscape={false}
        isScreenLocked={false}
        isLoadingVideo={false}
        isDirectStream={false}
        videoHtml=""
        windowDimensions={{ width: 390, height: 844 }}
        currentPositionSeconds={0}
        totalLessonSeconds={480}
        autoplayCountdown={null}
        hasPrevLesson={false}
        hasNextLesson={false}
        nativePlayerRef={{ current: null }}
        onSelectLesson={jest.fn()}
        onOpenPaymentModal={jest.fn()}
        onOpenQuizPlayer={jest.fn()}
        onTogglePlay={jest.fn()}
        onSeekTo={jest.fn()}
        onRewind={jest.fn()}
        onForward={jest.fn()}
        onPrevLesson={jest.fn()}
        onNextLesson={jest.fn()}
        onCycleSpeed={jest.fn()}
        onToggleFullscreen={jest.fn()}
        onToggleScreenLock={jest.fn()}
        onOpenStreamQualityModal={jest.fn()}
        onTriggerPiP={jest.fn()}
        onCancelAutoplay={jest.fn()}
        onMarkComplete={jest.fn()}
        onPictureInPictureStart={jest.fn()}
        onPictureInPictureStop={jest.fn()}
        onProgressUpdate={jest.fn()}
        onPlayStateChange={jest.fn()}
        formatSeconds={(s) => `${s}`}
      />
    );

    expect(view.getByText('Video coming soon')).toBeTruthy();
    expect(view.queryByTestId('mock-lesson-webview')).toBeNull();
  });
});
