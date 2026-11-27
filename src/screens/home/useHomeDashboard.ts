import { useMemo } from 'react';
import type { CarouselSlide } from '../../components';
import type {
  HomeFeatureCardItem,
  SpecialBundlePosterItem,
} from '../../services/api/brandingService';
import type { ThriveGenCourseItem } from '../../components/home/ThriveGenHub';
import type { Course, RootTab } from '../../types';
import type { RecommendationResult } from '../../utils/recommendations';

export interface DashboardCategoryRow {
  title: string;
  subtitle?: string;
  courses: Course[];
  isRecommendationRow?: boolean;
  recommendationId?: string;
  recommendationSource?: string;
}

export function useHomeDashboard({
  courses,
  userProgress,
  getCourseProgressPercentage,
  getRecommendedCourses,
  setSearchQuery,
  isBangla,
  streakDays,
  user,
  onNavigateToCourse,
  onNavigateTab,
  onOpenSubscription,
}: {
  courses: Course[];
  userProgress: Record<string, any>;
  getCourseProgressPercentage: (courseId: string) => number;
  getRecommendedCourses: () => RecommendationResult;
  setSearchQuery: (q: string) => void;
  isBangla: boolean;
  streakDays: number;
  user: any;
  onNavigateToCourse: (courseId: string) => void;
  onNavigateTab: (tab: RootTab) => void;
  onOpenSubscription: () => void;
}) {
  const greetingInfo = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return {
        salutation: isBangla ? 'শুভ সকাল' : 'Good morning',
        icon: 'sunny' as const,
        iconColor: '#F59E0B',
      };
    } else if (hour >= 12 && hour < 17) {
      return {
        salutation: isBangla ? 'শুভ অপরাহ্ন' : 'Good afternoon',
        icon: 'partly-sunny' as const,
        iconColor: '#3B82F6',
      };
    } else if (hour >= 17 && hour < 21) {
      return {
        salutation: isBangla ? 'শুভ সন্ধ্যা' : 'Good evening',
        icon: 'cloudy-night' as const,
        iconColor: '#8B5CF6',
      };
    }
    return {
      salutation: isBangla ? 'স্বাগতম' : 'Welcome back',
      icon: 'moon' as const,
      iconColor: '#6366F1',
    };
  }, [isBangla]);

  const learnerDisplayName = useMemo(() => {
    if (user?.displayName && user.displayName.trim().length > 0) {
      return user.displayName.trim().split(' ')[0];
    }
    if (user?.username) return user.username;
    return isBangla ? 'লার্নার' : 'Learner';
  }, [user?.displayName, user?.username, isBangla]);

  const activeCourse = useMemo(() => {
    const activeCourseId = Object.keys(userProgress)[0];
    return activeCourseId ? courses.find((c) => c.id === activeCourseId) : undefined;
  }, [userProgress, courses]);

  const activeProgressPercent = activeCourse ? getCourseProgressPercentage(activeCourse.id) : 0;

  const greetingSubtitleText = useMemo(() => {
    if (activeCourse) {
      return isBangla
        ? `চালিয়ে যান: ${activeCourse.title} (${activeProgressPercent}%)`
        : `Resume: ${activeCourse.title} (${activeProgressPercent}%)`;
    }
    if (streakDays > 1) {
      return isBangla
        ? `🔥 ${streakDays} দিনের স্ট্রিক! মোমেন্টাম ধরে রাখুন`
        : `🔥 ${streakDays}-day streak! Keep up your habit`;
    }
    return isBangla ? 'আজকে আপনি কোন নতুন স্কিল শিখবেন?' : 'What skill will you master today?';
  }, [activeCourse, activeProgressPercent, isBangla, streakDays]);

  const popularCourses = useMemo(
    () =>
      courses.length === 0
        ? []
        : [...courses]
            .sort(
              (a, b) =>
                (b.reviewsCount ?? 0) - (a.reviewsCount ?? 0) || (b.rating ?? 0) - (a.rating ?? 0)
            )
            .slice(0, 8),
    [courses]
  );

  const upcomingCourses = useMemo(
    () =>
      courses.filter(
        (c) => c.category === 'upcoming' || c.categorySlugs?.includes('upcoming-live-training')
      ),
    [courses]
  );

  const generativeAiCourses = useMemo(
    () =>
      courses.filter(
        (c) =>
          c.category === 'generative-ai' ||
          c.categorySlugs?.includes('generative-ai') ||
          c.title.toLowerCase().includes(' ai') ||
          c.title.toLowerCase().includes('gpt') ||
          c.title.toLowerCase().includes('gemini')
      ),
    [courses]
  );

  const marketingCourses = useMemo(
    () =>
      courses.filter(
        (c) =>
          c.category === 'sales-marketing' ||
          c.category === 'marketing' ||
          c.categorySlugs?.some((s) =>
            ['sales-marketing', 'sales-marketing-live-training', 'marketing'].includes(s)
          )
      ),
    [courses]
  );

  const businessCourses = useMemo(
    () =>
      courses.filter(
        (c) =>
          c.category === 'business' ||
          c.category === 'business-strategy' ||
          c.category === 'leadership-management' ||
          c.categorySlugs?.some((s) =>
            [
              'business',
              'business-strategy',
              'business-essentials',
              'business-essentials-live-training',
              'siam-city-cement',
            ].includes(s)
          )
      ),
    [courses]
  );

  const careerCourses = useMemo(
    () =>
      courses.filter(
        (c) =>
          c.category === 'job-seekers-skills' ||
          c.category === 'job-seekers' ||
          c.categorySlugs?.some((s) => ['job-seekers-skills', 'get-offer', 'career'].includes(s))
      ),
    [courses]
  );

  const hrCourses = useMemo(
    () =>
      courses.filter(
        (c) =>
          c.category === 'human-resource-management' ||
          c.categorySlugs?.includes('human-resource-management')
      ),
    [courses]
  );

  const supplyChainCourses = useMemo(
    () => courses.filter((c) => c.categorySlugs?.includes('supply-chain-management')),
    [courses]
  );

  const financeCourses = useMemo(
    () =>
      courses.filter(
        (c) =>
          c.category === 'finance-accounting-legal' ||
          c.category === 'finance' ||
          c.categorySlugs?.includes('finance-accounting-legal')
      ),
    [courses]
  );

  const bundleCourses = useMemo(
    () => courses.filter((c) => c.isCareerBundle === true || c.title.includes('Bundle')),
    [courses]
  );

  const categoryRows = useMemo<DashboardCategoryRow[]>(() => {
    const recData: RecommendationResult = getRecommendedCourses
      ? getRecommendedCourses()
      : { recommendationId: '', source: '', courses: [], rationale: '', rationaleBn: '' };
    const recommendedRow: DashboardCategoryRow[] =
      recData.courses && recData.courses.length > 0
        ? [
            {
              title: isBangla ? 'আপনার জন্য বিশেষ প্রস্তাবিত' : 'Recommended For You',
              subtitle: isBangla ? recData.rationaleBn : recData.rationale,
              courses: recData.courses,
              isRecommendationRow: true,
              recommendationId: recData.recommendationId,
              recommendationSource: recData.source,
            },
          ]
        : [];

    const rows: DashboardCategoryRow[] = [
      ...recommendedRow,
      { title: isBangla ? 'জনপ্রিয় কোর্সসমূহ' : 'Popular Courses', courses: popularCourses },
      { title: isBangla ? 'আসন্ন লাইভ ট্রেনিং' : 'Upcoming Live', courses: upcomingCourses },
      { title: isBangla ? 'জেনারেটিভ এআই' : 'Generative AI', courses: generativeAiCourses },
      { title: isBangla ? 'মার্কেটিং ও সেলস' : 'Marketing & Sales', courses: marketingCourses },
      { title: isBangla ? 'ব্যবসা ও লিডারশিপ' : 'Business & Leadership', courses: businessCourses },
      {
        title: isBangla ? 'ফাইন্যান্স ও অ্যাকাউন্টিং' : 'Finance & Accounting',
        courses: financeCourses,
      },
      { title: isBangla ? 'হিউম্যান রিসোর্স' : 'Human Resource', courses: hrCourses },
      { title: isBangla ? 'সাপ্লাই চেইন' : 'Supply Chain', courses: supplyChainCourses },
      { title: isBangla ? 'ক্যারিয়ার ও জব স্কিলস' : 'Career & Job Skills', courses: careerCourses },
      { title: isBangla ? 'বান্ডেল' : 'Bundle', courses: bundleCourses },
    ];

    const activeRows = rows.filter((r) => r.courses && r.courses.length > 0);
    if (activeRows.length <= 1 && courses.length > 0) {
      return [
        { title: isBangla ? 'জনপ্রিয় ও সকল কোর্স' : 'All Featured Courses', courses },
        ...activeRows,
      ];
    }
    return activeRows;
  }, [
    isBangla,
    popularCourses,
    upcomingCourses,
    generativeAiCourses,
    marketingCourses,
    businessCourses,
    financeCourses,
    hrCourses,
    supplyChainCourses,
    careerCourses,
    bundleCourses,
    courses,
    getRecommendedCourses,
  ]);

  const handleSelectSlide = (slide: CarouselSlide) => {
    if (slide.actionType === 'summit') {
      onNavigateTab('Workshops');
    } else if (slide.actionType === 'trailer') {
      const match = courses.find(
        (c) =>
          c.id === slide.targetId ||
          c.category === 'generative-ai' ||
          c.category === 'agentic-ai' ||
          c.title.toLowerCase().includes('ai')
      );
      if (match) onNavigateToCourse(match.id);
      else onNavigateTab('Courses');
    } else if (slide.actionType === 'course') {
      const match = courses.find(
        (c) =>
          c.id === slide.targetId ||
          c.category === 'excel' ||
          c.category === 'excel-data' ||
          c.title.toLowerCase().includes('excel')
      );
      if (match) onNavigateToCourse(match.id);
      else onNavigateTab('Courses');
    } else if (slide.actionType === 'bundle') {
      const match = courses.find(
        (c) =>
          (slide.targetId && c.id.toLowerCase() === slide.targetId.toLowerCase()) ||
          c.title.toLowerCase().includes(slide.title.toLowerCase())
      );
      if (match) onNavigateToCourse(match.id);
      else onNavigateTab('Courses');
    } else if (slide.actionType === 'subscription') {
      onOpenSubscription();
    }
  };

  const handleSelectFeature = (feature: HomeFeatureCardItem) => {
    if (feature.actionType === 'bundle') {
      setSearchQuery('bundle');
      onNavigateTab('Courses');
    } else if (feature.actionType === 'subscription') {
      onOpenSubscription();
    } else if (feature.actionType === 'courses') {
      onNavigateTab('Courses');
    } else if (feature.actionType === 'workshops') {
      onNavigateTab('Workshops');
    }
  };

  const handleSelectSpecialBundle = (bundle: SpecialBundlePosterItem) => {
    const matchingCourse = courses.find(
      (c) =>
        c.id.toLowerCase() === bundle.targetSlug.toLowerCase() ||
        c.title.toLowerCase().includes(bundle.title.toLowerCase()) ||
        (bundle.targetSlug.includes('finance') &&
          (c.title.toLowerCase().includes('finance') || c.category === 'business')) ||
        (bundle.targetSlug.includes('hr') &&
          (c.title.toLowerCase().includes('hr') || c.category === 'business')) ||
        (bundle.targetSlug.includes('excel') &&
          (c.title.toLowerCase().includes('excel') || c.category === 'excel')) ||
        (bundle.targetSlug.includes('leadership') &&
          (c.title.toLowerCase().includes('leadership') || c.category === 'business'))
    );
    if (matchingCourse) {
      onNavigateToCourse(matchingCourse.id);
    } else {
      setSearchQuery(bundle.title);
      onNavigateTab('Courses');
    }
  };

  const handleViewAllBundles = () => {
    setSearchQuery('bundle');
    onNavigateTab('Courses');
  };

  const handleSelectThriveGenCourse = (course: ThriveGenCourseItem) => {
    const matchingCourse = courses.find(
      (c) =>
        c.id.toLowerCase() === course.slug.toLowerCase() ||
        c.title.toLowerCase().includes(course.title.toLowerCase()) ||
        c.title.toLowerCase().includes(course.slug.replace(/-/g, ' '))
    );
    if (matchingCourse) {
      onNavigateToCourse(matchingCourse.id);
    } else {
      setSearchQuery(course.title);
      onNavigateTab('Courses');
    }
  };

  return {
    greetingInfo,
    learnerDisplayName,
    greetingSubtitleText,
    categoryRows,
    handleSelectSlide,
    handleSelectFeature,
    handleSelectSpecialBundle,
    handleViewAllBundles,
    handleSelectThriveGenCourse,
  };
}
