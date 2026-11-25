import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useGamification } from '../context/GamificationContext';
import { useLearning } from '../context/LearningContext';
import { useAuth } from '../context/AuthContext';
import { useYouTube } from '../context/YouTubeContext';
import {
  Header,
  CertificateModal,
  MandatoryReviewModal,
  AnimatedTabContent,
  StateView,
  LearnPressStatsGrid,
  ProfileLearningAnalytics,
} from '../components';
import { Certificate, Course, LearnPressCourseFilter } from '../types';
import { useResponsive } from '../theme/responsive';
import { myLearningStyles as styles } from './my-learning/myLearningStyles';
import { useMyLearningState } from './my-learning/useMyLearningState';
import {
  EnrolledCoursesGrid,
  HistoryTabPanel,
  CertificatesTabPanel,
  SavedTabPanel,
} from './my-learning/MyLearningTabPanels';

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

type TabMode =
  'all' | 'in-progress' | 'finished' | 'passed' | 'failed' | 'certificates' | 'history' | 'saved';

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
  const { streakDays, weeklyActivity } = useGamification();
  const insets = useSafeAreaInsets();
  const { isTablet, containerClampStyle } = useResponsive();
  const { user } = useAuth();
  const { savedVideos, playVideo } = useYouTube();
  const {
    courses,
    userProgress,
    getCourseProgressPercentage,
    hasReviewedCourse,
    submitMandatoryCourseReview,
  } = useLearning();

  const state = useMyLearningState();
  const [activeTab, setActiveTab] = useState<TabMode>('in-progress');
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewTargetCourse, setReviewTargetCourse] = useState<Course | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    if (offsetY > 8 && !isScrolled) setIsScrolled(true);
    else if (offsetY <= 8 && isScrolled) setIsScrolled(false);
  };

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
      <EnrolledCoursesGrid
        list={list}
        isTablet={isTablet}
        isDark={isDark}
        isBangla={isBangla}
        colors={colors}
        userProgress={userProgress}
        certificates={state.certificates}
        getCourseProgressPercentage={getCourseProgressPercentage}
        getCourseStatus={state.getCourseStatus}
        hasReviewedCourse={hasReviewedCourse}
        onNavigateToCourse={onNavigateToCourse}
        onNavigateToLesson={onNavigateToLesson}
        onSelectCert={setSelectedCert}
        onOpenMandatoryReview={(course) => {
          setReviewTargetCourse(course);
          setReviewModalVisible(true);
        }}
      />
    );
  };

  const tabs = [
    { id: 'all', label: `${isBangla ? 'সকল' : 'All'} (${state.enrolledList.length})` },
    {
      id: 'in-progress',
      label: `${isBangla ? 'চলমান' : 'In Progress'} (${state.inProgressList.length})`,
    },
    { id: 'finished', label: `${isBangla ? 'সম্পন্ন' : 'Finished'} (${state.finishedList.length})` },
    { id: 'passed', label: `${isBangla ? 'উত্তীর্ণ' : 'Passed'} (${state.passedList.length})` },
    { id: 'failed', label: `${isBangla ? 'অনুত্তীর্ণ' : 'Failed'} (${state.failedList.length})` },
    {
      id: 'certificates',
      label: `${isBangla ? 'সার্টিফিকেট' : 'Certificates'} (${state.certificates.length})`,
    },
    { id: 'history', label: `${isBangla ? 'হিস্ট্রি' : 'History'} (${state.historyList.length})` },
    {
      id: 'saved',
      label: `${isBangla ? 'সংরক্ষিত' : 'Saved'} (${state.savedList.length + savedVideos.length})`,
    },
  ];

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
        contentContainerStyle={[
          styles.scrollContent,
          containerClampStyle,
          { paddingBottom: Math.max(insets.bottom, 16) + 84 },
        ]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.analyticsSection}>
          <ProfileLearningAnalytics
            enrolledCount={state.enrolledList.length}
            inProgressCount={state.inProgressList.length}
            completedCount={state.finishedList.length}
            totalHours={state.totalHoursLearned}
            certificatesCount={state.certificates.length}
            completionRate={
              state.enrolledList.length > 0
                ? Math.round((state.finishedList.length / state.enrolledList.length) * 100)
                : 0
            }
            streakDays={streakDays}
            weeklyActivity={weeklyActivity}
            colors={colors}
            isBangla={isBangla}
            activeCourseTab={
              (['all', 'in-progress', 'finished', 'passed', 'failed'].includes(activeTab)
                ? activeTab
                : 'in-progress') as LearnPressCourseFilter
            }
            onSelectTab={(tab) => setActiveTab(tab as TabMode)}
          />
        </View>

        <LearnPressStatsGrid
          stats={state.lpStats}
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

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.tabsBarScroll, { borderBottomColor: colors.border }]}
          contentContainerStyle={styles.tabsBar}
          accessibilityRole="tablist"
        >
          {tabs.map((tab) => {
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

        <View style={styles.tabContent}>
          <AnimatedTabContent tabKey={activeTab}>
            {activeTab === 'all' &&
              renderCourseList(
                state.enrolledList,
                isBangla ? 'কোনো কোর্স এনরোল করা নেই' : 'No enrolled courses',
                isBangla
                  ? 'আমাদের শীর্ষ এক্সিকিউটিভ মাস্টারক্লাসগুলো দেখুন এবং নতুন স্কিল অর্জন শুরু করুন!'
                  : 'Explore our top-rated executive masterclasses and start learning!'
              )}
            {activeTab === 'in-progress' &&
              renderCourseList(
                state.inProgressList,
                isBangla ? 'চলমান কোনো কোর্স নেই' : 'No courses in progress',
                isBangla
                  ? 'আমাদের শীর্ষ এক্সিকিউটিভ মাস্টারক্লাসগুলো দেখুন এবং নতুন স্কিল অর্জন শুরু করুন!'
                  : 'Explore our top-rated executive masterclasses and start learning!'
              )}
            {activeTab === 'finished' &&
              renderCourseList(
                state.finishedList,
                isBangla ? 'এখনো কোনো কোর্স সম্পন্ন হয়নি' : 'No finished courses yet',
                isBangla
                  ? 'কোর্স শেষ করে সার্টিফিকেট অর্জন করতে সিলেবাস সম্পন্ন করুন।'
                  : 'Complete syllabus modules to finish courses and earn verified certificates.'
              )}
            {activeTab === 'passed' &&
              renderCourseList(
                state.passedList,
                isBangla ? 'এখনো কোনো কোর্স উত্তীর্ণ হয়নি' : 'No passed courses yet',
                isBangla
                  ? 'কোর্সের চূড়ান্ত কুইজ ও লেকচার সম্পন্ন করে পাসিং গ্রেড অর্জন করুন।'
                  : 'Achieve passing grade by completing final course quizzes and lectures.'
              )}
            {activeTab === 'failed' &&
              renderCourseList(
                state.failedList,
                isBangla ? 'কোনো অনুত্তীর্ণ কোর্স নেই (চমৎকার!)' : 'No failed courses (Great job!)',
                isBangla
                  ? 'আপনার কোনো ফেইল্ড কোর্স রেকর্ড নেই। আপনার শেখা অব্যাহত রাখুন!'
                  : 'You have no failed course records. Keep up the high standard!'
              )}
            {activeTab === 'history' && (
              <HistoryTabPanel
                historyList={state.historyList}
                colors={colors}
                isBangla={isBangla}
                onBrowseCourses={onBrowseCourses}
                onNavigateToLesson={onNavigateToLesson}
              />
            )}
            {activeTab === 'certificates' && (
              <CertificatesTabPanel
                certificates={state.certificates}
                courses={courses}
                colors={colors}
                isDark={isDark}
                isBangla={isBangla}
                hasReviewedCourse={hasReviewedCourse}
                onBrowseCourses={onBrowseCourses}
                onSelectCert={setSelectedCert}
                onOpenMandatoryReview={(course) => {
                  setReviewTargetCourse(course);
                  setReviewModalVisible(true);
                }}
              />
            )}
            {activeTab === 'saved' && (
              <SavedTabPanel
                savedList={state.savedList}
                savedVideos={savedVideos}
                colors={colors}
                isBangla={isBangla}
                playVideo={playVideo}
                onOpenYouTube={onOpenYouTube}
                onNavigateToCourse={onNavigateToCourse}
              />
            )}
          </AnimatedTabContent>
        </View>
      </ScrollView>

      <CertificateModal
        visible={!!selectedCert}
        certificate={selectedCert}
        onClose={() => setSelectedCert(null)}
      />

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
            if (unlockedCert) setSelectedCert(unlockedCert);
          }}
          onDismissLater={() => setReviewModalVisible(false)}
        />
      )}
    </View>
  );
};
