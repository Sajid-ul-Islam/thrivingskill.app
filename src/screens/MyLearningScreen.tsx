import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useGamification } from '../context/GamificationContext';
import { useLearning } from '../context/LearningContext';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { CertificateModal } from '../components/CertificateModal';
import { MandatoryReviewModal } from '../components/modals/MandatoryReviewModal';
import { YouTubeCard } from '../components/YouTubeCard';
import { AnimatedTabContent, CircularProgressRing, SpringPressable, StateView } from '../components/common';
import { useYouTube } from '../context/YouTubeContext';
import { Certificate, Course, LearnPressCourseFilter } from '../types';
import { LearnPressStatsGrid } from '../components/cards/LearnPressStatsGrid';
import { MIN_TOUCH_TARGET } from '../theme/typography';

interface MyLearningScreenProps {
  onNavigateToCourse: (courseId: string) => void;
  onNavigateToLesson: (courseId: string, lessonId: string) => void;
  onBrowseCourses: () => void;
  onOpenSubscription?: () => void;
  onOpenNotifications?: () => void;
  onOpenYouTube?: () => void;
  onOpenDrawer?: () => void;
  onOpenSupport?: () => void;
}

type TabMode = 'all' | 'in-progress' | 'finished' | 'passed' | 'failed' | 'certificates' | 'history' | 'saved';

export const MyLearningScreen: React.FC<MyLearningScreenProps> = ({
  onNavigateToCourse,
  onNavigateToLesson,
  onBrowseCourses,
  onOpenSubscription,
  onOpenNotifications,
  onOpenYouTube,
  onOpenDrawer,
  onOpenSupport,
}) => {
  const { colors, isDark } = useTheme();
  const { isBangla } = useLanguage();
  const { streakDays } = useGamification();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { savedVideos, playVideo } = useYouTube();
  const {
    courses,
    userProgress,
    bookmarks,
    certificates,
    getCourseProgressPercentage,
    hasReviewedCourse,
    submitMandatoryCourseReview,
  } = useLearning();

  const [activeTab, setActiveTab] = useState<TabMode>('in-progress');
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewTargetCourse, setReviewTargetCourse] = useState<Course | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    if (offsetY > 8 && !isScrolled) {
      setIsScrolled(true);
    } else if (offsetY <= 8 && isScrolled) {
      setIsScrolled(false);
    }
  };

  const getCourseStatus = useCallback((courseId: string): 'in-progress' | 'finished' | 'passed' | 'failed' => {
    const prog = userProgress[courseId];
    if (!prog) return 'in-progress';
    if (prog.status === 'failed' || prog.grade === 'failed') return 'failed';
    if (prog.status === 'passed' || prog.grade === 'passed' || prog.isCompleted) return 'passed';
    if (prog.status === 'finished') return 'finished';
    return 'in-progress';
  }, [userProgress]);

  // Enrolled courses categorized according to live LearnPress (memoized)
  const enrolledList = useMemo(() => courses.filter((c) => !!userProgress[c.id]), [courses, userProgress]);
  const inProgressList = useMemo(() => enrolledList.filter((c) => getCourseStatus(c.id) === 'in-progress'), [enrolledList, getCourseStatus]);
  const finishedList = useMemo(() => enrolledList.filter((c) => {
    const st = getCourseStatus(c.id);
    return st === 'finished' || st === 'passed' || st === 'failed';
  }), [enrolledList, getCourseStatus]);
  const passedList = useMemo(() => enrolledList.filter((c) => getCourseStatus(c.id) === 'passed'), [enrolledList, getCourseStatus]);
  const failedList = useMemo(() => enrolledList.filter((c) => getCourseStatus(c.id) === 'failed'), [enrolledList, getCourseStatus]);
  const savedList = useMemo(() => courses.filter((c) => bookmarks.includes(c.id)), [courses, bookmarks]);

  const lpStats = useMemo(() => ({
    enrolledCount: enrolledList.length,
    inProgressCount: inProgressList.length,
    finishedCount: finishedList.length,
    passedCount: passedList.length,
    failedCount: failedList.length,
  }), [enrolledList.length, inProgressList.length, finishedList.length, passedList.length, failedList.length]);

  // Build rich watch history list (Section 19 Spec) - memoized
  const historyList = useMemo(() => enrolledList
    .map((course) => {
      const progress = userProgress[course.id];
      const targetLessonId =
        progress?.lastAccessedLessonId || course.modules?.[0]?.lessons?.[0]?.id || '';
      const targetLesson =
        course.modules?.flatMap((m) => m.lessons || []).find((l) => l.id === targetLessonId) ||
        course.modules?.[0]?.lessons?.[0];
      const watchSec = progress?.lastWatchPositionSeconds?.[targetLessonId] || 120;
      const percent = getCourseProgressPercentage(course.id);
      return {
        course,
        lesson: targetLesson,
        watchSec,
        progressPercent: percent,
        dateWatched: isBangla ? 'আজ' : 'Today',
      };
    })
    .filter((h) => !!h.lesson), [enrolledList, userProgress, getCourseProgressPercentage, isBangla]);

  // Compute total learning stats
  const totalCompletedLessons = useMemo(() => Object.values(userProgress).reduce(
    (acc, p) => acc + p.completedLessonIds.length,
    0
  ), [userProgress]);
  const totalHoursLearned = useMemo(() => (totalCompletedLessons * 0.35).toFixed(1), [totalCompletedLessons]);

  const renderCourseList = (list: Course[], emptyTitle: string, emptyMessage: string) => {
    if (list.length === 0) {
      return (
        <StateView
          mode="empty"
          icon="school-outline"
          title={emptyTitle}
          message={emptyMessage}
          primaryActionLabel={isBangla ? 'ক্যাটালগ দেখুন' : 'Explore Catalog'}
          onPrimaryAction={onBrowseCourses}
        />
      );
    }

    return (
      <>
        {list.map((course) => {
          const percent = getCourseProgressPercentage(course.id);
          const progress = userProgress[course.id];
          const targetLessonId =
            progress?.lastAccessedLessonId || course.modules[0]?.lessons[0]?.id || '';
          const courseStatus = getCourseStatus(course.id);
          const cert = certificates.find((c) => c.courseId === course.id);

          const badgeConfig = {
            passed: {
              label: isBangla ? 'উত্তীর্ণ' : 'PASSED',
              bg: isDark ? 'rgba(22, 163, 74, 0.25)' : '#DCFCE7',
              color: isDark ? '#4ADE80' : '#15803D',
              icon: 'checkmark-circle' as const,
            },
            failed: {
              label: isBangla ? 'অনুত্তীর্ণ' : 'FAILED',
              bg: isDark ? 'rgba(239, 68, 68, 0.25)' : '#FEE2E2',
              color: isDark ? '#F87171' : '#B91C1C',
              icon: 'close-circle' as const,
            },
            finished: {
              label: isBangla ? 'সম্পন্ন' : 'FINISHED',
              bg: isDark ? 'rgba(79, 70, 229, 0.25)' : '#EEF2FF',
              color: isDark ? '#818CF8' : '#4338CA',
              icon: 'ribbon' as const,
            },
            'in-progress': {
              label: isBangla ? 'চলমান' : 'IN PROGRESS',
              bg: isDark ? 'rgba(147, 51, 234, 0.25)' : '#F5EEFD',
              color: isDark ? '#C084FC' : '#7E22CE',
              icon: 'time' as const,
            },
          }[courseStatus];

          return (
            <View
              key={course.id}
              style={[
                styles.learningCard,
                {
                  backgroundColor: colors.surfaceCard,
                  borderColor:
                    courseStatus === 'failed'
                      ? '#EF4444'
                      : courseStatus === 'passed'
                      ? '#16A34A'
                      : colors.border,
                },
              ]}
            >
              <View style={{ position: 'relative' }}>
                <Image source={{ uri: course.thumbnail }} style={styles.cardImage} />
                <View style={[styles.statusPill, { backgroundColor: badgeConfig.bg }]}>
                  <Ionicons name={badgeConfig.icon} size={10} color={badgeConfig.color} />
                  <Text style={[styles.statusPillText, { color: badgeConfig.color }]}>
                    {badgeConfig.label}
                  </Text>
                </View>
              </View>
              <View style={styles.cardBody}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <Text style={[styles.cardTitle, { color: colors.text, flex: 1 }]} numberOfLines={2}>
                    {course.title}
                  </Text>
                  <CircularProgressRing
                    progress={courseStatus === 'passed' ? 100 : percent}
                    size={38}
                    strokeWidth={3.5}
                    progressColor={
                      courseStatus === 'passed'
                        ? '#16A34A'
                        : courseStatus === 'failed'
                        ? '#EF4444'
                        : colors.primary
                    }
                    trackColor={colors.surfaceSubtle}
                    textSize={10}
                  />
                </View>
                <Text style={[styles.cardInstructor, { color: colors.textMuted }]}>
                  {course.instructor.name}
                </Text>

                {/* Progress */}
                <View style={styles.progressRow}>
                  <View style={[styles.progressTrack, { backgroundColor: colors.surfaceSubtle }]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          backgroundColor:
                            courseStatus === 'passed'
                              ? '#16A34A'
                              : courseStatus === 'failed'
                              ? '#EF4444'
                              : colors.primary,
                          width: `${courseStatus === 'passed' ? 100 : percent}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.progressText,
                      {
                        color:
                          courseStatus === 'passed'
                            ? '#16A34A'
                            : courseStatus === 'failed'
                            ? '#EF4444'
                            : colors.primary,
                      },
                    ]}
                  >
                    {courseStatus === 'passed' ? '100%' : `${percent}%`}
                  </Text>
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[
                      styles.syllabusBtn,
                      { borderColor: colors.border, backgroundColor: colors.surfaceSubtle },
                    ]}
                    onPress={() => onNavigateToCourse(course.id)}
                    accessibilityRole="button"
                    accessibilityLabel={
                      isBangla
                        ? `${course.title} এর সিলেবাস দেখুন`
                        : `View syllabus for ${course.title}`
                    }
                  >
                    <Text style={[styles.syllabusBtnText, { color: colors.text }]}>
                      {isBangla ? 'সিলেবাস' : 'Syllabus'}
                    </Text>
                  </TouchableOpacity>

                  {courseStatus === 'passed' && hasReviewedCourse(course.id) && cert ? (
                    <SpringPressable
                      style={[styles.resumeBtn, { backgroundColor: colors.brandGold }]}
                      onPress={() => setSelectedCert(cert)}
                      activeScale={0.96}
                      accessibilityRole="button"
                      accessibilityLabel={
                        isBangla
                          ? `${course.title} এর সনদপত্র দেখুন`
                          : `View certificate for ${course.title}`
                      }
                    >
                      <Ionicons name="ribbon" size={14} color="#102F53" />
                      <Text style={[styles.resumeBtnText, { color: '#102F53' }]}>
                        {isBangla ? 'সনদপত্র দেখুন' : 'Certificate'}
                      </Text>
                    </SpringPressable>
                  ) : courseStatus === 'passed' && !hasReviewedCourse(course.id) ? (
                    <SpringPressable
                      style={[styles.resumeBtn, { backgroundColor: '#F59E0B' }]}
                      onPress={() => {
                        setReviewTargetCourse(course);
                        setReviewModalVisible(true);
                      }}
                      activeScale={0.96}
                      accessibilityRole="button"
                      accessibilityLabel={
                        isBangla
                          ? `${course.title} এর সার্টিফিকেট আনলক করতে রিভিউ দিন`
                          : `Review to unlock certificate for ${course.title}`
                      }
                    >
                      <Ionicons name="lock-closed" size={14} color="#FFFFFF" />
                      <Text style={[styles.resumeBtnText, { color: '#FFFFFF' }]}>
                        {isBangla ? 'রিভিউ দিন (লক)' : 'Review to Unlock'}
                      </Text>
                    </SpringPressable>
                  ) : courseStatus === 'failed' ? (
                    <SpringPressable
                      style={[styles.resumeBtn, { backgroundColor: '#EF4444' }]}
                      onPress={() => onNavigateToLesson(course.id, targetLessonId)}
                      activeScale={0.96}
                      accessibilityRole="button"
                    >
                      <Ionicons name="refresh" size={14} color="#FFFFFF" />
                      <Text style={[styles.resumeBtnText, { color: '#FFFFFF' }]}>
                        {isBangla ? 'পুনরায় শুরু করুন' : 'Retake'}
                      </Text>
                    </SpringPressable>
                  ) : (
                    <SpringPressable
                      style={[styles.resumeBtn, { backgroundColor: colors.primary }]}
                      onPress={() => onNavigateToLesson(course.id, targetLessonId)}
                      activeScale={0.96}
                      accessibilityRole="button"
                    >
                      <Ionicons name="play" size={14} color={colors.onPrimary} />
                      <Text style={[styles.resumeBtnText, { color: colors.onPrimary }]}>
                        {isBangla ? 'চালিয়ে যান' : 'Resume'}
                      </Text>
                    </SpringPressable>
                  )}
                </View>
              </View>
            </View>
          );
        })}
      </>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title={isBangla ? 'আমার লার্নিং হাব' : 'My Learning Hub'}
        subtitle={isBangla ? 'স্কিল প্রগ্রেস ও পোর্টফোলিও' : 'Skill Progression & Portfolio'}
        isScrolled={isScrolled}
        onOpenSubscription={onOpenSubscription}
        onOpenNotifications={onOpenNotifications}
        onOpenYouTube={onOpenYouTube}
        onOpenDrawer={onOpenDrawer}
        onOpenSupport={onOpenSupport}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 84 }]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Authentic LearnPress 5 KPI Cards matching thrivingskill.com */}
        <LearnPressStatsGrid
          stats={lpStats}
          activeFilter={
            (['all', 'in-progress', 'finished', 'passed', 'failed'].includes(activeTab)
              ? activeTab
              : 'all') as LearnPressCourseFilter
          }
          onSelectFilter={(filter) => setActiveTab(filter as TabMode)}
          colors={colors}
          isBangla={isBangla}
          isDark={isDark}
        />

        {/* Daily Study Streak Banner */}
        <View
          style={[
            styles.streakBanner,
            {
              backgroundColor: colors.surfaceCard,
              borderColor: '#F59E0B',
            },
          ]}
        >
          <View style={styles.streakFlameWrap}>
            <Text style={styles.streakFlameEmoji}>🔥</Text>
          </View>
          <View style={styles.streakContent}>
            <View style={styles.streakHeaderRow}>
              <Text style={[styles.streakTitle, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
                {streakDays > 0
                  ? (isBangla ? `${streakDays} দিনের স্টাডি স্ট্রিক` : `${streakDays}-Day Study Streak`)
                  : (isBangla ? 'আজই স্টাডি স্ট্রিক শুরু করুন' : 'Start Your Study Streak Today')}
              </Text>
              <View style={styles.streakRankBadge}>
                <Text style={styles.streakRankText}>
                  {isBangla ? 'শীর্ষ ৫%' : 'Top 5%'}
                </Text>
              </View>
            </View>
            <Text style={[styles.streakSub, { color: colors.textMuted }]}>
              {isBangla
                ? `${totalHoursLearned} ঘণ্টা সম্পন্ন • স্ট্রিক সচল রাখতে আজ অন্তত ১টি লেসন শেষ করুন!`
                : `${totalHoursLearned}h learned • Complete 1 lesson today to keep your streak alive!`}
            </Text>
          </View>
        </View>

        {/* Tabs Bar (Horizontally scrollable so 5 tabs never overflow compact viewports) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.tabsBarScroll, { borderBottomColor: colors.border }]}
          contentContainerStyle={styles.tabsBar}
          accessibilityRole="tablist"
        >
          {[
            { id: 'all', label: `${isBangla ? 'সকল' : 'All'} (${enrolledList.length})` },
            { id: 'in-progress', label: `${isBangla ? 'চলমান' : 'In Progress'} (${inProgressList.length})` },
            { id: 'finished', label: `${isBangla ? 'সম্পন্ন' : 'Finished'} (${finishedList.length})` },
            { id: 'passed', label: `${isBangla ? 'উত্তীর্ণ' : 'Passed'} (${passedList.length})` },
            { id: 'failed', label: `${isBangla ? 'অনুত্তীর্ণ' : 'Failed'} (${failedList.length})` },
            { id: 'certificates', label: `${isBangla ? 'সার্টিফিকেট' : 'Certificates'} (${certificates.length})` },
            { id: 'history', label: `${isBangla ? 'হিস্ট্রি' : 'History'} (${historyList.length})` },
            { id: 'saved', label: `${isBangla ? 'সংরক্ষিত' : 'Saved'} (${savedList.length + savedVideos.length})` },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tabItem,
                  isActive && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
                ]}
                onPress={() => setActiveTab(tab.id as TabMode)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={isBangla ? `${tab.label} ট্যাব` : `${tab.label} tab`}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: isActive ? colors.primary : colors.textMuted,
                      fontWeight: isActive ? '700' : '500',
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          <AnimatedTabContent tabKey={activeTab}>
          {activeTab === 'all' && (
            renderCourseList(
              enrolledList,
              isBangla ? 'কোনো কোর্স এনরোল করা নেই' : 'No enrolled courses',
              isBangla
                ? 'আমাদের শীর্ষ এক্সিকিউটিভ মাস্টারক্লাসগুলো দেখুন এবং নতুন স্কিল অর্জন শুরু করুন!'
                : 'Explore our top-rated executive masterclasses and start learning!'
            )
          )}

          {activeTab === 'in-progress' && (
            renderCourseList(
              inProgressList,
              isBangla ? 'চলমান কোনো কোর্স নেই' : 'No courses in progress',
              isBangla
                ? 'আমাদের শীর্ষ এক্সিকিউটিভ মাস্টারক্লাসগুলো দেখুন এবং নতুন স্কিল অর্জন শুরু করুন!'
                : 'Explore our top-rated executive masterclasses and start learning!'
            )
          )}

          {activeTab === 'finished' && (
            renderCourseList(
              finishedList,
              isBangla ? 'এখনো কোনো কোর্স সম্পন্ন হয়নি' : 'No finished courses yet',
              isBangla
                ? 'কোর্স শেষ করে সার্টিফিকেট অর্জন করতে সিলেবাস সম্পন্ন করুন।'
                : 'Complete syllabus modules to finish courses and earn verified certificates.'
            )
          )}

          {activeTab === 'passed' && (
            renderCourseList(
              passedList,
              isBangla ? 'এখনো কোনো কোর্স উত্তীর্ণ হয়নি' : 'No passed courses yet',
              isBangla
                ? 'কোর্সের চূড়ান্ত কুইজ ও লেকচার সম্পন্ন করে পাসিং গ্রেড অর্জন করুন।'
                : 'Achieve passing grade by completing final course quizzes and lectures.'
            )
          )}

          {activeTab === 'failed' && (
            renderCourseList(
              failedList,
              isBangla ? 'কোনো অনুত্তীর্ণ কোর্স নেই (চমৎকার!)' : 'No failed courses (Great job!)',
              isBangla
                ? 'আপনার কোনো ফেইল্ড কোর্স রেকর্ড নেই। আপনার শেখা অব্যাহত রাখুন!'
                : 'You have no failed course records. Keep up the high standard!'
            )
          )}

          {activeTab === 'history' && (
            <>
              {historyList.length === 0 ? (
                <StateView
                  mode="empty"
                  icon="time-outline"
                  title={isBangla ? 'এখনো কোনো হিস্ট্রি নেই' : 'No watch history yet'}
                  message={
                    isBangla
                      ? 'আপনার দেখার ইতিহাস ট্র্যাক করতে কোর্সের লেকচার এবং মাস্টারক্লাস দেখা শুরু করুন।'
                      : 'Start watching course lectures and masterclasses to track your viewing history.'
                  }
                  primaryActionLabel={isBangla ? 'কোর্স ব্রাউজ করুন' : 'Browse Courses'}
                  onPrimaryAction={onBrowseCourses}
                />
              ) : (
                historyList.map((item) => (
                  <View
                    key={item.course.id}
                    style={[
                      styles.learningCard,
                      { backgroundColor: colors.surfaceCard, borderColor: colors.border },
                    ]}
                  >
                    <Image source={{ uri: item.course.thumbnail }} style={styles.cardImage} />
                    <View style={styles.cardBody}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, gap: 8 }}>
                        <View style={[styles.completedBadge, { backgroundColor: colors.primaryLight, flexShrink: 1, minWidth: 0, marginRight: 8 }]}>
                          <Ionicons name="time" size={12} color={colors.primary} />
                          <Text style={[styles.completedBadgeText, { color: colors.primary }]} numberOfLines={1}>
                            {item.dateWatched}
                          </Text>
                        </View>
                        <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '700', flexShrink: 0 }}>
                          {item.progressPercent}% {isBangla ? 'সম্পন্ন' : 'Watched'}
                        </Text>
                      </View>

                      <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                        {item.course.title}
                      </Text>

                      <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 8 }} numberOfLines={1}>
                        {isBangla ? 'সর্বশেষ লেসন: ' : 'Last Lesson: '}{item.lesson?.title || (isBangla ? 'কোর্স লেকচার' : 'Course Lecture')}
                      </Text>

                      <View style={styles.progressRow}>
                        <View style={[styles.progressTrack, { backgroundColor: colors.surfaceSubtle }]}>
                          <View
                            style={[
                              styles.progressFill,
                              { backgroundColor: colors.primary, width: `${item.progressPercent}%` },
                            ]}
                          />
                        </View>
                        <Text style={[styles.progressText, { color: colors.primary }]}>
                          {item.progressPercent}%
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={[styles.resumeBtn, { backgroundColor: colors.primary, marginTop: 10 }]}
                        onPress={() => onNavigateToLesson(item.course.id, item.lesson?.id || '')}
                        accessibilityRole="button"
                        accessibilityLabel={
                          isBangla
                            ? `${item.course.title} চালিয়ে যান`
                            : `Resume ${item.course.title}`
                        }
                      >
                        <Ionicons name="play" size={14} color={colors.onPrimary} />
                        <Text style={[styles.resumeBtnText, { color: colors.onPrimary }]}>
                          {isBangla ? 'চালিয়ে যান' : 'Resume'} ({Math.floor(item.watchSec / 60)}m {item.watchSec % 60}s)
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </>
          )}

          {activeTab === 'certificates' && (
            <>
              {certificates.length === 0 ? (
                <StateView
                  mode="empty"
                  icon="ribbon-outline"
                  title={isBangla ? 'কোনো সার্টিফিকেট ইস্যু হয়নি' : 'No certificates issued'}
                  message={
                    isBangla
                      ? 'শেয়ারেবল ক্রেডেনশিয়াল আনলক করতে আপনার সক্রিয় কোর্সগুলো সম্পন্ন করুন।'
                      : 'Finish your active courses to unlock shareable credentials.'
                  }
                  primaryActionLabel={isBangla ? 'কোর্স এক্সপ্লোর করুন' : 'Explore Courses'}
                  onPrimaryAction={onBrowseCourses}
                />
              ) : (
                certificates.map((cert) => {
                const isReviewed = hasReviewedCourse(cert.courseId);
                return (
                  <TouchableOpacity
                    key={cert.id}
                    style={[
                      styles.certItemCard,
                      {
                        backgroundColor: colors.surfaceCard,
                        borderColor: isReviewed ? colors.border : '#F59E0B',
                        shadowColor: colors.cardShadow,
                      },
                    ]}
                    onPress={() => {
                      if (!isReviewed) {
                        const targetCourse = courses.find((c) => c.id === cert.courseId);
                        if (targetCourse) {
                          setReviewTargetCourse(targetCourse);
                        } else {
                          setReviewTargetCourse({
                            id: cert.courseId,
                            title: cert.courseTitle,
                            instructor: { name: cert.instructorName },
                          } as any);
                        }
                        setReviewModalVisible(true);
                      } else {
                        setSelectedCert(cert);
                      }
                    }}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel={
                      isReviewed
                        ? (isBangla
                            ? `${cert.courseTitle} এর ভেরিফাইড সার্টিফিকেট দেখুন`
                            : `View verified digital certificate for ${cert.courseTitle}`)
                        : (isBangla
                            ? `${cert.courseTitle} এর সার্টিফিকেট আনলক করতে রিভিউ দিন`
                            : `Review to unlock certificate for ${cert.courseTitle}`)
                    }
                  >
                    <View
                      style={[
                        styles.certIconBadge,
                        {
                          backgroundColor: isReviewed
                            ? (isDark ? 'rgba(217, 119, 6, 0.2)' : '#FEF3C7')
                            : (isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEF2F2'),
                        },
                      ]}
                    >
                      <Ionicons
                        name={isReviewed ? "ribbon" : "lock-closed"}
                        size={26}
                        color={isReviewed ? (isDark ? '#FBBF24' : '#D97706') : '#EF4444'}
                      />
                    </View>

                    <View style={styles.certCol}>
                      <View style={styles.verifiedTag}>
                        <Ionicons
                          name={isReviewed ? "checkmark-circle" : "lock-closed"}
                          size={11}
                          color={isReviewed ? (isDark ? '#34D399' : '#047857') : '#EF4444'}
                        />
                        <Text
                          style={[
                            styles.verifiedTagText,
                            { color: isReviewed ? (isDark ? '#34D399' : '#047857') : '#EF4444' },
                          ]}
                        >
                          {isReviewed
                            ? (isBangla ? 'ভেরিফাইড ক্রেডেনশিয়াল' : 'VERIFIED CREDENTIAL')
                            : (isBangla ? 'রিভিউ আবশ্যক (লক)' : 'REVIEW REQUIRED (LOCKED)')}
                        </Text>
                      </View>
                      <Text style={[styles.certItemTitle, { color: colors.text }]} numberOfLines={2}>
                        {cert.courseTitle}
                      </Text>
                      <Text style={[styles.certItemMeta, { color: colors.textMuted }]}>
                        {isReviewed
                          ? `${isBangla ? 'ইস্যুর তারিখ ' : 'Issued '}${cert.issueDate} • ID: ${cert.credentialId}`
                          : (isBangla ? 'সার্টিফিকেট আনলক করতে ১-৫ স্টার রেটিং দিন' : 'Rate & review course to unlock certificate')}
                      </Text>
                    </View>

                    <Ionicons
                      name={isReviewed ? "chevron-forward" : "lock-closed-outline"}
                      size={18}
                      color={isReviewed ? colors.textMuted : '#F59E0B'}
                    />
                  </TouchableOpacity>
                );
              })
              )}
            </>
          )}

          {activeTab === 'saved' && (
            <>
              {savedList.length === 0 && savedVideos.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="bookmark-outline" size={48} color={colors.textLight} />
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>
                    {isBangla ? 'কোনো সংরক্ষিত আইটেম নেই' : 'No saved items yet'}
                  </Text>
                  <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                    {isBangla
                      ? 'পরে দেখার জন্য ক্যাটালগ থেকে কোর্স অথবা আমাদের ইউটিউব চ্যানেল থেকে মাস্টারক্লাস বুকমার্ক করুন।'
                      : 'Bookmark courses from the catalog or masterclasses from our YouTube channel to watch later.'}
                  </Text>
                  {onOpenYouTube && (
                    <TouchableOpacity
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        backgroundColor: '#FF0000',
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        minHeight: MIN_TOUCH_TARGET,
                        borderRadius: 10,
                        marginTop: 14,
                      }}
                      onPress={onOpenYouTube}
                      accessibilityRole="button"
                      accessibilityLabel={
                        isBangla
                          ? 'ইউটিউব মাস্টারক্লাস ব্রাউজ করুন'
                          : 'Browse YouTube Masterclasses'
                      }
                    >
                      <Ionicons name="logo-youtube" size={16} color="#FFFFFF" />
                      <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>
                        {isBangla ? 'ইউটিউব মাস্টারক্লাস ব্রাউজ করুন' : 'Browse YouTube Masterclasses'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <>
                  {/* Saved YouTube Videos Section */}
                  {savedVideos.length > 0 && (
                    <View style={{ marginBottom: 20 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                        <Ionicons name="logo-youtube" size={18} color="#FF0000" />
                        <Text style={[styles.sectionHeading, { color: colors.text }]}>
                          {isBangla
                            ? `সংরক্ষিত ইউটিউব মাস্টারক্লাস (${savedVideos.length})`
                            : `Saved YouTube Masterclasses (${savedVideos.length})`}
                        </Text>
                      </View>
                      {savedVideos.map((vid) => (
                        <YouTubeCard
                          key={vid.id}
                          video={vid}
                          layout="horizontal"
                          onPress={(v) => playVideo(v, 'modal')}
                        />
                      ))}
                    </View>
                  )}

                  {/* Saved Accredited Courses Section */}
                  {savedList.length > 0 && (
                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                        <Ionicons name="school-outline" size={18} color={colors.primary} />
                        <Text style={[styles.sectionHeading, { color: colors.text }]}>
                          {isBangla
                            ? `সংরক্ষিত অ্যাক্রেডিটেড কোর্স (${savedList.length})`
                            : `Saved Accredited Courses (${savedList.length})`}
                        </Text>
                      </View>
                      {savedList.map((course) => (
                        <TouchableOpacity
                          key={course.id}
                          style={[
                            styles.savedCard,
                            { backgroundColor: colors.surfaceCard, borderColor: colors.border },
                          ]}
                          onPress={() => onNavigateToCourse(course.id)}
                          activeOpacity={0.85}
                          accessibilityRole="button"
                          accessibilityLabel={
                            isBangla
                              ? `${course.title} কোর্সের বিস্তারিত দেখুন`
                              : `View details for ${course.title}`
                          }
                        >
                          <Image source={{ uri: course.thumbnail }} style={styles.savedThumb} />
                          <View style={styles.savedInfo}>
                            <Text style={[styles.savedTitle, { color: colors.text }]} numberOfLines={2}>
                              {course.title}
                            </Text>
                            <Text style={[styles.savedPrice, { color: colors.primary }]}>
                              {course.priceBdt && course.priceBdt > 0
                                ? `৳ ${course.priceBdt.toLocaleString()}`
                                : course.price > 0
                                ? `৳ ${Math.round(course.price * 120).toLocaleString()}`
                                : (isBangla ? 'বিনামূল্যে' : 'Free')}
                            </Text>
                          </View>
                          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </>
              )}
            </>
          )}
          </AnimatedTabContent>
        </View>
      </ScrollView>

      {/* Certificate Viewer Modal */}
      <CertificateModal
        visible={!!selectedCert}
        certificate={selectedCert}
        onClose={() => setSelectedCert(null)}
      />

      {/* Mandatory Course Review Modal before Certificate Unlock (CR-02) */}
      {reviewTargetCourse && (
        <MandatoryReviewModal
          visible={reviewModalVisible}
          courseTitle={reviewTargetCourse.title}
          instructorName={reviewTargetCourse.instructor?.name || 'Course Instructor'}
          onSubmit={(rating, feedback) => {
            const unlockedCert = submitMandatoryCourseReview(
              reviewTargetCourse.id,
              rating,
              feedback,
              user?.displayName || user?.username || 'Executive Graduate',
              'Course Graduate'
            );
            setReviewModalVisible(false);
            if (unlockedCert) {
              setSelectedCert(unlockedCert);
            }
          }}
          onDismissLater={() => setReviewModalVisible(false)}
        />
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
  },
  statsCard: {
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  streakBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 12,
  },
  streakFlameWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakFlameEmoji: {
    fontSize: 22,
  },
  streakContent: {
    flex: 1,
    minWidth: 0,
  },
  streakHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: 8,
  },
  streakTitle: {
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
    minWidth: 0,
    marginRight: 6,
  },
  streakRankBadge: {
    backgroundColor: '#FFB606',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    flexShrink: 0,
  },
  streakRankText: {
    color: '#102F53',
    fontSize: 10,
    fontWeight: '800',
  },
  streakSub: {
    fontSize: 11,
    lineHeight: 15,
  },
  tabsBarScroll: {
    borderBottomWidth: 1,
  },
  tabsBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  tabItem: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    paddingVertical: 10,
    marginRight: 20,
  },
  tabLabel: {
    fontSize: 13,
  },
  tabContent: {
    padding: 16,
  },
  learningCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  cardImage: {
    height: 120,
    width: '100%',
    resizeMode: 'cover',
  },
  cardBody: {
    padding: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 4,
  },
  cardInstructor: {
    fontSize: 12,
    marginBottom: 10,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
  },
  statusPill: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 4,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  syllabusBtn: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
  },
  syllabusBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  resumeBtn: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  resumeBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    marginBottom: 8,
  },
  completedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  viewCertBtn: {
    minHeight: MIN_TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    marginTop: 8,
  },
  viewCertText: {
    fontSize: 13,
    fontWeight: '700',
  },
  certItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  certIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  certCol: {
    flex: 1,
    marginRight: 8,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  verifiedTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  certItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  certItemMeta: {
    fontSize: 11,
  },
  savedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  savedThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  savedInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  savedTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  savedPrice: {
    fontSize: 13,
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
    maxWidth: 240,
    lineHeight: 18,
  },
  actionBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
