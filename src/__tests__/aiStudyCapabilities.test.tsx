import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { GeminiNanoService } from '../services/ai/geminiNanoService';
import { AiTutorService } from '../services/ai/aiTutorService';
import { AiAssessmentService } from '../services/ai/aiAssessmentService';
import { getDomainQuestionsForCourse } from '../data/domainQuizBank';
import { computeRecommendedCourses } from '../utils/recommendations';
import { LessonAiTutorModal } from '../components/player/LessonAiTutorModal';
import { Course, Lesson, UserProgress } from '../types';

jest.mock('@expo/vector-icons/Ionicons', () => {
  const ReactActual = require('react');
  const { Text } = require('react-native');
  return (props: any) => ReactActual.createElement(Text, null, props.name);
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

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
  useLanguage: () => ({ isBangla: false }),
}));

describe('Honest AI gating, BM25 keyword search & recommendations, and verified quizzes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (GeminiNanoService as any).cachedStatus = null;
    (GeminiNanoService as any).lastCheckTime = 0;
  });

  it('reports GeminiNanoService unavailable unless on-device model weights are loaded and refuses canned fallback', async () => {
    expect(await GeminiNanoService.isAvailable()).toBe(false);
    await expect(GeminiNanoService.generateText('Explain this lesson')).rejects.toThrow(
      'not available'
    );
  });

  it('returns honest unavailable notice in AiTutorService instead of canned keyword replies, while searching real lesson summaries', async () => {
    const baseContext = {
      courseId: '9001',
      courseTitle: 'Supply Chain Operations',
      moduleTitle: 'Inventory Management',
      lessonId: '9002',
      lessonTitle: 'Safety Stock Formulas',
      instructorName: 'Faculty',
    };

    const unavailableRes = await AiTutorService.askTutorDetailed(
      'Give me a test question or summary point',
      baseContext,
      [],
      false
    );
    expect(unavailableRes.available).toBe(false);
    expect(unavailableRes.source).toBe('unavailable');
    expect(unavailableRes.text).toContain('unavailable');
    expect(unavailableRes.text).not.toContain('zero-hallucination');

    const groundedRes = await AiTutorService.askTutorDetailed(
      'How do we calculate safety stock buffer during demand spikes?',
      {
        ...baseContext,
        lessonSummary:
          'Safety stock acts as a buffer against unexpected supplier delays and sudden demand spikes. Reorder point combines lead time demand with safety stock.',
      },
      [],
      false
    );
    expect(groundedRes.available).toBe(true);
    expect(groundedRes.source).toBe('lesson-search');
    expect(groundedRes.text).toContain('Safety stock acts as a buffer');
    expect(groundedRes.text).toContain('Keyword Search');

    // Two unrelated sentences sharing only a broad domain ("business") must NOT false-match
    const unrelatedRes = await AiTutorService.askTutorDetailed(
      'How do we calculate quarterly tax compliance?',
      {
        ...baseContext,
        lessonSummary:
          'Business leadership strategy focuses on growing executive management revenue and enterprise teams.',
      },
      [],
      false
    );
    expect(unrelatedRes.available).toBe(false);
    expect(unrelatedRes.source).toBe('unavailable');
  });

  it('never falls back to unrelated domain questions or canned 3-item boilerplate quizzes', async () => {
    // Substring "ai" inside "Retail" / "Training" must not trigger generative-ai quiz bank
    expect(getDomainQuestionsForCourse('Retail Store Training', 'retail', false)).toEqual([]);

    const noQuizResult = await AiAssessmentService.generateDiagnosticQuiz(
      {
        courseId: '701',
        courseTitle: 'Retail Store Training',
        courseCategory: 'retail',
        moduleTitle: 'Store Ops',
        lessonId: '702',
        lessonTitle: 'Floor Merchandising',
        instructorName: 'Mentor',
      },
      false
    );
    expect(noQuizResult).toEqual([]);

    const realLesson: Lesson = {
      id: '702',
      title: 'Floor Merchandising',
      duration: '10:00',
      quiz: [
        {
          id: 'lq-1',
          question: 'Which metric measures sales per square foot?',
          options: ['Footfall', 'Sales density', 'Shrinkage', 'SKU count'],
          correctAnswerIndex: 1,
          explanation: 'Sales density divides revenue by retail floor area.',
        },
      ],
    };
    const verifiedQuiz = await AiAssessmentService.generateDiagnosticQuiz(
      {
        courseId: '701',
        courseTitle: 'Retail Store Training',
        courseCategory: 'retail',
        moduleTitle: 'Store Ops',
        lessonId: '702',
        lessonTitle: 'Floor Merchandising',
        instructorName: 'Mentor',
      },
      false,
      { currentLesson: realLesson }
    );
    expect(verifiedQuiz).toHaveLength(1);
    expect(verifiedQuiz[0].correctIndex).toBe(1);
  });

  it('uses LiteRT semantic similarity + behavioral weights in recommendations without Gemini Nano labels', () => {
    const courses: Course[] = [
      {
        id: 'c-ux',
        title: 'Figma Design Systems & Prototyping',
        subtitle: 'UI wireframes and layout typography',
        description: 'Build scalable product interfaces in Figma',
        category: 'design',
        slug: 'figma',
        instructor: {
          id: 'i1',
          name: 'Instructor',
          title: 'Lead',
          company: 'TS',
          avatar: '',
          bio: '',
          rating: 4.5,
          studentsCount: 100,
          coursesCount: 1,
        },
        rating: 4.5,
        reviewsCount: 5,
        enrolledCount: 100,
        durationHours: 3,
        lecturesCount: 8,
        certificateIncluded: true,
        language: 'English',
        lastUpdated: '2026-01-01',
        level: 'Beginner',
        price: 10,
        originalPrice: 20,
        priceBdt: 1000,
        thumbnail: '',
        highlights: [],
        prerequisites: [],
        modules: [],
        reviews: [],
      },
      {
        id: 'c-fin',
        title: 'Corporate Accounting Fundamentals',
        subtitle: 'Ledger and balance sheets',
        description: 'Standard financial accounting',
        category: 'finance',
        slug: 'accounting',
        instructor: {
          id: 'i1',
          name: 'Instructor',
          title: 'Lead',
          company: 'TS',
          avatar: '',
          bio: '',
          rating: 4.5,
          studentsCount: 100,
          coursesCount: 1,
        },
        rating: 4.5,
        reviewsCount: 5,
        enrolledCount: 100,
        durationHours: 3,
        lecturesCount: 8,
        certificateIncluded: true,
        language: 'English',
        lastUpdated: '2026-01-01',
        level: 'Beginner',
        price: 10,
        originalPrice: 20,
        priceBdt: 1000,
        thumbnail: '',
        highlights: [],
        prerequisites: [],
        modules: [],
        reviews: [],
      },
    ];

    const progress: Record<string, UserProgress> = {};
    const rec = computeRecommendedCourses({
      courses,
      categories: [],
      userProgress: progress,
      categoryAffinities: {},
      searchKeywordsHistory: ['wireframe', 'typography'],
      limit: 2,
    });

    expect(rec.courses[0].id).toBe('c-ux');
    expect(rec.rationale).not.toContain('Gemini Nano');
    expect(rec.rationaleBn).not.toContain('জেমিনাই ন্যানো');
  });

  it('displays honest AI Unavailable status badge inside LessonAiTutorModal when AICore is missing', async () => {
    await render(
      <LessonAiTutorModal
        visible={true}
        context={{
          courseId: '10',
          courseTitle: 'Course',
          moduleTitle: 'Mod',
          lessonId: '20',
          lessonTitle: 'Lesson One',
          instructorName: 'Mentor',
        }}
        onClose={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('ai-tutor-status-badge')).toBeTruthy();
      expect(screen.getByText('Study Assistant (AI Unavailable)')).toBeTruthy();
    });
  });
});
