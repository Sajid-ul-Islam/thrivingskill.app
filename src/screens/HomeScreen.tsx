import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useLearning } from '../context/LearningContext';
import { useSaaS } from '../context/SaaSContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useGamification } from '../context/GamificationContext';
import { Header } from '../components/Header';
import { CategoryPills } from '../components/CategoryPills';
import { CourseCard } from '../components/CourseCard';
import { HeroCarousel, CarouselSlide } from '../components/HeroCarousel';
import { QuickActionDock } from '../components/QuickActionDock';
import { SearchSpotlightBar } from '../components/SearchSpotlightBar';
import { CourseCardSkeleton, SpringPressable, StateView } from '../components/common';
import { useYouTube } from '../context/YouTubeContext';
import { RootTab } from '../types';
import { AboutTSLModal, AboutTabKey } from '../components/AboutTSLModal';
import { typography, MIN_TOUCH_TARGET } from '../theme/typography';
import { shape } from '../theme/shapes';

interface HomeScreenProps {
  onNavigateToCourse: (courseId: string) => void;
  onNavigateToLesson: (courseId: string, lessonId: string) => void;
  onNavigateTab: (tab: RootTab) => void;
  onOpenCorporateModal: () => void;
  onOpenSubscription: () => void;
  onOpenNotifications: () => void;
  onOpenAssessment: () => void;
  onOpenYouTube?: () => void;
  onOpenSearch?: () => void;
  onOpenDrawer?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateToCourse,
  onNavigateToLesson,
  onNavigateTab,
  onOpenCorporateModal,
  onOpenSubscription,
  onOpenNotifications,
  onOpenAssessment,
  onOpenYouTube,
  onOpenSearch,
  onOpenDrawer,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [aboutModalVisible, setAboutModalVisible] = useState(false);
  const [aboutInitialTab, setAboutInitialTab] = useState<AboutTabKey>('overview');

  const { t, isBangla } = useLanguage();
  const { streakDays, dailyMinutesSpent, dailyGoalMinutes } = useGamification();
  const {
    courses,
    categories,
    isLoadingCourses,
    coursesError,
    refreshCourses,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    userProgress,
    getCourseProgressPercentage,
    recordCategoryInteraction,
    recordSearchKeyword,
    getRecommendedCourses,
  } = useLearning();

  const {
    courses: recommendedCourses,
    rationale: recRationale,
    rationaleBn: recRationaleBn,
  } = getRecommendedCourses();
  const { activeWorkspace, subscriptionTier, assessmentResult } = useSaaS();
  const { lastWatchedVideo, playVideo } = useYouTube();
  const { user, isAuthenticated, isGuest, setAuthModalVisible } = useAuth();

  // Dynamic Time-aware greeting
  const getGreetingData = () => {
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
    } else {
      return {
        salutation: isBangla ? 'স্বাগতম' : 'Welcome back',
        icon: 'moon' as const,
        iconColor: '#6366F1',
      };
    }
  };

  const greetingInfo = getGreetingData();

  // Learner Display Name (Extracts actual first name or friendly name)
  const learnerDisplayName = (() => {
    if (user?.displayName && user.displayName.trim().length > 0) {
      const parts = user.displayName.trim().split(' ');
      return parts[0];
    }
    if (user?.username) {
      return user.username;
    }
    return isBangla ? 'লার্নার' : 'Learner';
  })();

  // Find enrolled active course to show "Continue Learning"
  const enrolledCourseIds = Object.keys(userProgress);
  const activeCourseId = enrolledCourseIds[0];
  const activeCourse = courses.find((c) => c.id === activeCourseId);
  const activeProgress = activeCourse ? userProgress[activeCourse.id] : undefined;
  const activeProgressPercent = activeCourse ? getCourseProgressPercentage(activeCourse.id) : 0;

  // Subtitle / Momentum context
  const greetingSubtitleText = (() => {
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
  })();

  // Filter courses
  const filteredCourses = courses.filter((course) => {
    const matchesCategory =
      selectedCategory === 'all' || course.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSelectSlide = (slide: CarouselSlide) => {
    if (slide.actionType === 'summit') {
      onNavigateTab('Workshops');
    } else if (slide.actionType === 'trailer') {
      const aiCourse = courses.find((c) => c.id === 'course-ai-productivity');
      if (aiCourse) {
        onNavigateToCourse(aiCourse.id);
      } else {
        onNavigateTab('Courses');
      }
    } else if (slide.actionType === 'course') {
      const excelCourse = courses.find((c) => c.id === 'course-excel-dashboards');
      if (excelCourse) {
        onNavigateToCourse(excelCourse.id);
      } else {
        onNavigateTab('Courses');
      }
    } else if (slide.actionType === 'subscription') {
      onOpenSubscription();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        onOpenSubscription={onOpenSubscription}
        onOpenNotifications={onOpenNotifications}
        onOpenYouTube={onOpenYouTube}
        onOpenSearch={onOpenSearch}
        onOpenDrawer={onOpenDrawer}
        onOpenOfflineContent={() => onNavigateTab('MyLearning')}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 84 }]}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingCourses}
            onRefresh={refreshCourses}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* 1. Personalized Learner Greeting Hero Card */}
        <View
          style={[
            styles.greetingCard,
            {
              backgroundColor: isDark ? colors.surfaceCard : '#FFFFFF',
              borderColor: colors.border,
            },
          ]}
        >
          <LinearGradient
            colors={
              isDark
                ? ['rgba(99, 102, 241, 0.12)', 'rgba(16, 185, 129, 0.04)', 'transparent']
                : ['rgba(99, 102, 241, 0.06)', 'rgba(16, 185, 129, 0.03)', 'transparent']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          <View style={styles.greetingTopRow}>
            {/* Learner Avatar & Identity */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.avatarWrap}
              onPress={() => {
                if (isGuest && !isAuthenticated) {
                  setAuthModalVisible(true);
                } else {
                  onNavigateTab('Profile');
                }
              }}
            >
              <Image
                source={{
                  uri:
                    user?.avatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
                }}
                style={styles.learnerAvatar}
              />
              <View
                style={[
                  styles.avatarOnlineDot,
                  {
                    backgroundColor: isAuthenticated ? '#10B981' : '#F59E0B',
                    borderColor: isDark ? colors.surfaceCard : '#FFFFFF',
                  },
                ]}
              />
            </TouchableOpacity>

            {/* Greeting & Name */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.greetingTextCol}
              onPress={() => {
                if (isGuest && !isAuthenticated) {
                  setAuthModalVisible(true);
                } else {
                  onNavigateTab('Profile');
                }
              }}
            >
              <View style={styles.salutationRow}>
                <Ionicons name={greetingInfo.icon} size={13} color={greetingInfo.iconColor} />
                <Text style={[styles.salutationText, { color: colors.textMuted }]}>
                  {greetingInfo.salutation}
                </Text>
                {(subscriptionTier === 'pro' || subscriptionTier === 'enterprise') && (
                  <View style={[styles.proBadge, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7' }]}>
                    <Ionicons name="sparkles" size={10} color="#D97706" />
                    <Text style={styles.proBadgeText}>{subscriptionTier.toUpperCase()}</Text>
                  </View>
                )}
              </View>

              <Text style={[styles.greetingTitle, { color: colors.text }]} numberOfLines={1}>
                {learnerDisplayName} 👋
              </Text>
            </TouchableOpacity>

            {/* Interactive Momentum & Daily Goal Capsule */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.momentumCapsule,
                {
                  backgroundColor: isDark ? 'rgba(30, 41, 59, 0.8)' : '#F8FAFC',
                  borderColor: colors.border,
                },
              ]}
              onPress={() => {
                Alert.alert(
                  isBangla ? 'দৈনিক লার্নিং মোমেন্টাম 🔥' : 'Learning Momentum 🔥',
                  `${isBangla ? '• টানা স্ট্রিক' : '• Streak'}: ${streakDays} ${isBangla ? 'দিন' : 'Days'}\n${isBangla ? '• আজকের সময়' : '• Today\'s Time'}: ${dailyMinutesSpent}m / ${dailyGoalMinutes || 30}m ${isBangla ? 'লক্ষ্য' : 'Goal'}\n\n${isBangla ? 'প্রতিদিন কোর্স ও ভিডিও দেখে নতুন ব্যাজ অর্জন করুন!' : 'Complete lessons and videos to keep up your daily streak!'}`,
                  [
                    {
                      text: isBangla ? 'মাই হাব দেখুন' : 'View My Hub',
                      onPress: () => onNavigateTab('MyLearning'),
                    },
                    { text: isBangla ? 'ঠিক আছে' : 'Got it', style: 'cancel' },
                  ]
                );
              }}
            >
              <View style={styles.momentumItem}>
                <Text style={styles.flameEmoji}>🔥</Text>
                <Text style={[styles.momentumValue, { color: '#F97316' }]}>
                  {streakDays}d
                </Text>
              </View>
              <View style={[styles.momentumDivider, { backgroundColor: colors.border }]} />
              <View style={styles.momentumItem}>
                <Ionicons name="time" size={12} color={colors.primary} />
                <Text style={[styles.momentumValue, { color: colors.primary }]}>
                  {dailyMinutesSpent}m
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Subtitle & Daily Progress Bar */}
          <View style={styles.greetingBottomRow}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={[styles.greetingSubtitle, { color: colors.textMuted }]} numberOfLines={1}>
                {greetingSubtitleText}
              </Text>
            </View>

            {/* Mini Goal Track */}
            <View style={styles.goalTrackContainer}>
              <View style={[styles.goalProgressBarBg, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]}>
                <View
                  style={[
                    styles.goalProgressBarFill,
                    {
                      backgroundColor: colors.primary,
                      width: `${Math.min(100, Math.round((dailyMinutesSpent / (dailyGoalMinutes || 30)) * 100))}%`,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.goalTargetText, { color: colors.textMuted }]}>
                {dailyMinutesSpent}/{dailyGoalMinutes || 30}m
              </Text>
            </View>
          </View>
        </View>

        {/* 2. Unified Search Spotlight Launcher Bar */}
        <SearchSpotlightBar
          onPress={() => onOpenSearch && onOpenSearch()}
          onSelectTag={(query) => {
            recordSearchKeyword(query);
            setSearchQuery(query);
            if (onOpenSearch) onOpenSearch();
          }}
        />

        {/* Continue Learning Quick-Resume Hero Widget (Placed prominently at top for active learners) */}
        {(activeCourse || lastWatchedVideo) && (
          <View style={[styles.section, { marginTop: 6, marginBottom: 4 }]}>
            <View style={styles.sectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="play-circle" size={18} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {isBangla ? 'চালিয়ে যান' : 'Continue Learning'}
                </Text>
              </View>
              {activeCourse && (
                <TouchableOpacity
                  style={styles.seeAllTouch}
                  onPress={() => onNavigateTab('MyLearning')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                >
                  <Text style={[styles.seeAllText, { color: colors.primary }]}>
                    {isBangla ? 'মাই হাব →' : 'My Hub →'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* In-Progress Course Card */}
            {activeCourse && (
              <TouchableOpacity
                style={[
                  styles.resumeCard,
                  {
                    backgroundColor: colors.surfaceCard,
                    borderColor: colors.border,
                    shadowColor: colors.cardShadow,
                    marginBottom: lastWatchedVideo ? 10 : 0,
                  },
                ]}
                onPress={() => {
                  const targetLessonId =
                    activeProgress?.lastAccessedLessonId ||
                    activeCourse.modules[0]?.lessons[0]?.id ||
                    '';
                  onNavigateToLesson(activeCourse.id, targetLessonId);
                }}
                activeOpacity={0.88}
              >
                <Image source={{ uri: activeCourse.thumbnail }} style={styles.resumeThumb} />
                <View style={styles.resumeInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                    <View style={[styles.miniPill, { backgroundColor: colors.primaryLight }]}>
                      <Text style={[styles.miniPillText, { color: colors.primary }]}>IN PROGRESS</Text>
                    </View>
                    <Text style={[styles.resumeInstructor, { color: colors.textMuted }]} numberOfLines={1}>
                      • {activeCourse.instructor.name}
                    </Text>
                  </View>
                  <Text style={[styles.resumeCourseTitle, { color: colors.text }]} numberOfLines={1}>
                    {activeCourse.title}
                  </Text>

                  <View style={styles.resumeProgressRow}>
                    <View style={[styles.resumeTrack, { backgroundColor: colors.surfaceSubtle }]}>
                      <View
                        style={[
                          styles.resumeFill,
                          { backgroundColor: colors.primary, width: `${Math.max(activeProgressPercent, 8)}%` },
                        ]}
                      />
                    </View>
                    <Text style={[styles.resumePercentText, { color: colors.primary }]}>
                      {activeProgressPercent}%
                    </Text>
                  </View>
                </View>

                <View style={[styles.playBtnBg, { backgroundColor: colors.primary }]}>
                  <Ionicons name="play" size={16} color={colors.onPrimary} />
                </View>
              </TouchableOpacity>
            )}

            {/* Last-Watched YouTube Masterclass */}
            {lastWatchedVideo && (
              <TouchableOpacity
                style={[
                  styles.resumeCard,
                  {
                    backgroundColor: colors.surfaceCard,
                    borderColor: colors.border,
                    shadowColor: colors.cardShadow,
                  },
                ]}
                onPress={() => playVideo(lastWatchedVideo, 'modal')}
                activeOpacity={0.88}
              >
                <View style={{ position: 'relative' }}>
                  <Image source={{ uri: lastWatchedVideo.thumbnail }} style={styles.resumeThumb} />
                  <View style={styles.resumeYtBadge}>
                    <Ionicons name="logo-youtube" size={10} color="#FFFFFF" />
                  </View>
                </View>
                <View style={styles.resumeInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                    <View style={[styles.miniPill, { backgroundColor: 'rgba(255, 0, 0, 0.1)' }]}>
                      <Text style={[styles.miniPillText, { color: '#FF0000' }]}>MASTERCLASS</Text>
                    </View>
                    <Text style={[styles.resumeInstructor, { color: colors.textMuted }]}>
                      • @ThrivingSkills
                    </Text>
                  </View>
                  <Text style={[styles.resumeCourseTitle, { color: colors.text }]} numberOfLines={1}>
                    {lastWatchedVideo.title}
                  </Text>
                  <Text style={[styles.resumeSubText, { color: colors.textMuted }]}>
                    Tap to resume masterclass video
                  </Text>
                </View>

                <View style={[styles.playBtnBg, { backgroundColor: '#FF0000' }]}>
                  <Ionicons name="play" size={16} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* 3. High-Impact Swipeable Hero Carousel */}
        <HeroCarousel
          onSelectSlide={handleSelectSlide}
          onOpenSubscription={onOpenSubscription}
        />

        {/* 4. Streamlined 4-Action Dock */}
        <QuickActionDock
          onOpenCourses={() => onNavigateTab('Courses')}
          onOpenAssessment={onOpenAssessment}
          onOpenWorkshops={() => onNavigateTab('Workshops')}
          onOpenMyLearning={() => onNavigateTab('MyLearning')}
        />

        

        {/* Category Filter Pills */}
        <View style={styles.categorySection}>
          <CategoryPills
            selectedId={selectedCategory}
            categories={categories}
            onSelect={(id) => {
              recordCategoryInteraction(id);
              setSelectedCategory(id);
              if (id !== 'all') {
                onNavigateTab('Courses');
              }
            }}
          />
        </View>

        {/* CR-01: Behavior-Based Course Recommendations Shelf (আপনার পছন্দের ভিত্তিতে স্মার্ট রিকমেন্ডেশন) */}
        {recommendedCourses.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: colors.primaryLight,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 12,
                      gap: 4,
                    }}
                  >
                    <Ionicons name="sparkles" size={12} color={colors.primary} />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>
                      {isBangla ? 'স্মার্ট রিকমেন্ডেশন' : 'FOR YOU'}
                    </Text>
                  </View>
                </View>
                <Text style={[typography.h3, styles.sectionTitle, { color: colors.text }]}>
                  {isBangla ? 'আপনার পছন্দের ভিত্তিতে প্রস্তাবিত' : 'Recommended For You'}
                </Text>
                <Text style={[typography.bodySmall, styles.sectionSubtitle, { color: colors.textMuted }]} numberOfLines={2}>
                  {isBangla ? recRationaleBn : recRationale}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.seeAllTouch}
                onPress={() => onNavigateTab('Courses')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
              >
                <Text style={[styles.seeAllText, { color: colors.primary }]}>
                  {isBangla ? 'সব দেখুন' : 'View All'} ({recommendedCourses.length}) →
                </Text>
              </TouchableOpacity>
            </View>

            {recommendedCourses.slice(0, 3).map((course) => (
              <CourseCard
                key={`rec-${course.id}`}
                course={course}
                onPress={() => {
                  recordCategoryInteraction(course.category);
                  onNavigateToCourse(course.id);
                }}
              />
            ))}
          </View>
        )}

        {/* Popular Executive Masterclasses */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
              <Text style={[typography.h3, styles.sectionTitle, { color: colors.text }]}>
                {isBangla ? 'জনপ্রিয় কোর্সসমূহ' : 'Popular Masterclasses'}
              </Text>
              <Text style={[typography.bodySmall, styles.sectionSubtitle, { color: colors.textMuted }]} numberOfLines={2}>
                {isBangla
                  ? 'জেনারেটিভ এআই, এক্সেল ও ফাইন্যান্সের এক্সিকিউটিভ মাস্টারক্লাস'
                  : 'Executive Masterclasses in Generative AI, Excel & Finance'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => onNavigateTab('Courses')}
              style={[styles.seeAllTouch, { flexShrink: 0 }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={
                isBangla
                  ? `সব কোর্স দেখুন, সর্বমোট ${courses.length} টি`
                  : `View all courses, total ${courses.length}`
              }
            >
              <Text style={[styles.seeAllText, { color: colors.primary }]}>
                {isBangla ? 'সব দেখুন' : 'View All'} ({courses.length}) →
              </Text>
            </TouchableOpacity>
          </View>

          {isLoadingCourses && courses.length === 0 ? (
            <>
              <CourseCardSkeleton />
              <CourseCardSkeleton />
            </>
          ) : coursesError && courses.length === 0 ? (
            <StateView
              mode="error"
              title={isBangla ? 'কোর্স লোড করা যায়নি' : 'Could not load courses'}
              message={coursesError}
              primaryActionLabel={isBangla ? 'আবার চেষ্টা করুন' : 'Retry'}
              onPrimaryAction={refreshCourses}
              compact
            />
          ) : filteredCourses.length === 0 ? (
            <StateView
              mode="empty"
              title={isBangla ? 'কোনো কোর্স পাওয়া যায়নি' : 'No matching courses'}
              message={isBangla ? 'ফিল্টার রিসেট করে সকল কোর্স দেখুন।' : 'Reset filters to browse all executive courses.'}
              primaryActionLabel={isBangla ? 'সকল কোর্স' : 'Reset Filters'}
              onPrimaryAction={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              compact
            />
          ) : (
            filteredCourses.slice(0, 3).map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onPress={() => onNavigateToCourse(course.id)}
              />
            ))
          )}
        </View>

        {/* Streamlined Enterprise & About Gateway Card (Keeps Home focused on Learning Launchpad) */}
        <View style={styles.section}>
          <View
            style={[
              styles.gatewayCard,
              { backgroundColor: colors.surfaceCard, borderColor: colors.border },
            ]}
          >
            <View style={styles.gatewayHeaderRow}>
              <View style={[styles.gatewayIconWrap, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="business-outline" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[typography.h4, { color: colors.text }]}>
                  {isBangla ? 'টিএসএল ইকোসিস্টেম ও কর্পোরেট সল্যুশন' : 'TSL Enterprise & Ecosystem'}
                </Text>
                <Text style={[typography.bodySmall, { color: colors.textMuted }]} numberOfLines={2}>
                  {isBangla
                    ? 'টিম ট্রেনিং, ইউনিভার্সিটি পার্টনারশিপ ও প্রতিষ্ঠান সম্পর্কে জানুন।'
                    : 'Corporate training proposals, university MoUs, and leadership info.'}
                </Text>
              </View>
            </View>

            <View style={styles.gatewayActionsRow}>
              <SpringPressable
                style={[styles.gatewayPrimaryBtn, { backgroundColor: colors.primary }]}
                onPress={onOpenCorporateModal}
                accessibilityRole="button"
                accessibilityLabel="Corporate Solutions"
              >
                <Ionicons name="briefcase-outline" size={16} color={colors.onPrimary} />
                <Text style={[typography.button, { color: colors.onPrimary }]} numberOfLines={1}>
                  {isBangla ? 'কর্পোরেট প্রস্তাব' : 'Corporate Inquiry'}
                </Text>
              </SpringPressable>

              <SpringPressable
                style={[
                  styles.gatewaySecondaryBtn,
                  { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                ]}
                onPress={() => {
                  setAboutInitialTab('overview');
                  setAboutModalVisible(true);
                }}
                accessibilityRole="button"
                accessibilityLabel="About Thriving Skills"
              >
                <Ionicons name="information-circle-outline" size={16} color={colors.text} />
                <Text style={[typography.button, { color: colors.text }]} numberOfLines={1}>
                  {isBangla ? 'আমাদের সম্পর্কে' : 'About TSL'}
                </Text>
              </SpringPressable>
            </View>
          </View>
        </View>
      </ScrollView>

      

      <AboutTSLModal
        visible={aboutModalVisible}
        onClose={() => setAboutModalVisible(false)}
        initialTab={aboutInitialTab}
        onNavigateTab={onNavigateTab}
      />
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
  greetingCard: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
    padding: 13,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  greetingTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 11,
  },
  learnerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: '#6366F1',
  },
  avatarOnlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    zIndex: 10,
    elevation: 3,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  greetingTextCol: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 6,
  },
  salutationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  salutationText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    marginLeft: 4,
  },
  proBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#D97706',
  },
  greetingTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  momentumCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  momentumItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  flameEmoji: {
    fontSize: 12,
  },
  momentumValue: {
    fontSize: 11,
    fontWeight: '800',
  },
  momentumDivider: {
    width: 1,
    height: 11,
    marginHorizontal: 6,
  },
  greetingBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 9,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.15)',
  },
  greetingSubtitle: {
    fontSize: 11,
    fontWeight: '600',
  },
  goalTrackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  goalProgressBarBg: {
    width: 44,
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  goalProgressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  goalTargetText: {
    fontSize: 10,
    fontWeight: '700',
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  seeAllTouch: {
    minHeight: MIN_TOUCH_TARGET,
    minWidth: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
  },
  gatewayCard: {
    borderRadius: shape.large,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  gatewayHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  gatewayIconWrap: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: shape.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gatewayActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  gatewayPrimaryBtn: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: shape.medium,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  gatewaySecondaryBtn: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: shape.medium,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  resumeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  resumeThumb: {
    width: 60,
    height: 60,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  resumeYtBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#FF0000',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniPill: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  miniPillText: {
    fontSize: 9,
    fontWeight: '800',
  },
  resumeSubText: {
    fontSize: 11,
    marginTop: 2,
  },
  resumeInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  resumeCourseTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  resumeInstructor: {
    fontSize: 12,
    marginBottom: 6,
  },
  resumeProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resumeTrack: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  resumeFill: {
    height: '100%',
    borderRadius: 3,
  },
  resumePercentText: {
    fontSize: 11,
    fontWeight: '700',
  },
  playBtnBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categorySection: {
    marginBottom: 6,
  },
  corporateBanner: {
    margin: 16,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  corporateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  corporateBadgeText: {
    color: '#818CF8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  corporateTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 23,
    marginBottom: 6,
  },
  corporateSubtitle: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 17,
    marginBottom: 14,
  },
  corpServicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  corpServItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
  },
  corpServText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '600',
  },
  corporateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  corporateBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reviewsScroll: {
    paddingRight: 16,
    gap: 12,
    paddingBottom: 6,
  },
  reviewCard: {
    width: 280,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  revAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
  },
  revUserCol: {
    flex: 1,
  },
  revName: {
    fontSize: 13,
    fontWeight: '700',
  },
  revRole: {
    fontSize: 10,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 1,
  },
  revComment: {
    fontSize: 12,
    lineHeight: 16,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  trustSection: {
    marginTop: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  trustHeading: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 12,
    textAlign: 'center',
  },
  clientLogosRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  clientChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  clientName: {
    fontSize: 12,
    fontWeight: '600',
  },
  articlesScroll: {
    paddingHorizontal: 16,
    gap: 14,
    paddingBottom: 4,
  },
  articleCard: {
    width: 270,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  articleThumb: {
    width: '100%',
    height: 120,
    backgroundColor: '#1E293B',
  },
  articleThumbPlaceholder: {
    width: '100%',
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  articleBody: {
    padding: 12,
  },
  articleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 4,
  },
  articleDate: {
    fontSize: 10,
    fontWeight: '700',
  },
  articleAuthor: {
    fontSize: 10,
  },
  articleTitle: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 6,
  },
  articleExcerpt: {
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 8,
  },
  articleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  articleReadMore: {
    fontSize: 11,
    fontWeight: '700',
  },
  leadershipSpotlightSection: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  leadershipCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  leadershipCardHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  viewLeadershipBtn: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  viewLeadershipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  leadershipTitle: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 12,
  },
  foundersRow: {
    flexDirection: 'row',
    gap: 12,
  },
  founderMiniCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
  },
  founderImgContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  founderAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#334155',
  },
  verifiedDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    zIndex: 10,
    elevation: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  founderName: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 2,
  },
  founderRole: {
    fontSize: 10.5,
    fontWeight: '600',
    textAlign: 'center',
  },
  partnerSection: {
    marginTop: 16,
    marginBottom: 10,
  },
  partnerHeaderRow: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  partnerBadgeTag: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  partnerSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginTop: 2,
    marginBottom: 3,
  },
  partnerSectionSubtitle: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  partnerCardsScroll: {
    paddingHorizontal: 16,
    gap: 10,
    paddingBottom: 6,
  },
  partnerCardItem: {
    width: 210,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  partnerCardItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  partnerItemIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerItemTag: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  partnerItemTagText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  partnerOrgTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  partnerOrgDesc: {
    fontSize: 10.5,
    lineHeight: 14,
  },
  seeAllPartnersBtn: {
    marginHorizontal: 16,
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  seeAllPartnersText: {
    fontSize: 12,
    fontWeight: '700',
  },
  enterpriseFooter: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 20,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  footerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  footerLogo: {
    width: 38,
    height: 38,
    borderRadius: 9,
  },
  footerBrandName: {
    fontSize: 15,
    fontWeight: '800',
  },
  footerTagline: {
    fontSize: 11,
    marginTop: 1,
  },
  footerLegalLinksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  legalPillBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  legalPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  footerContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 10,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  footerContactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  footerContactText: {
    fontSize: 11,
    fontWeight: '600',
  },
  footerDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  footerCopyrightBox: {
    alignItems: 'center',
  },
  copyrightNotice: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 3,
  },
  copyrightSubtext: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
  },
});
