import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  RefreshControl,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useLearning } from '../context/LearningContext';
import { useSaaS } from '../context/SaaSContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useGamification } from '../context/GamificationContext';
import { Header } from '../components/Header';
import { CourseCard } from '../components/CourseCard';
import { HeroCarousel, CarouselSlide } from '../components/HeroCarousel';
import { SearchSpotlightBar } from '../components/SearchSpotlightBar';
import { CourseCardSkeleton, SpringPressable, StateView, CircularProgressRing, ScrollToTopPill } from '../components/common';
import { triggerHaptic } from '../utils/haptics';
import { useYouTube } from '../context/YouTubeContext';
import { RootTab } from '../types';
import { AboutTSLModal, AboutTabKey } from '../components/AboutTSLModal';
import { typography, MIN_TOUCH_TARGET } from '../theme/typography';
import { shape } from '../theme/shapes';
import type { Course } from '../types';

// ─── Category Carousel Row ───────────────────────────────────────────────────

interface CategoryRowProps {
  title: string;
  courses: Course[];
  onNavigateToCourse: (id: string) => void;
  onNavigateTab: (tab: RootTab) => void;
  colors: ReturnType<typeof useTheme>['colors'];
}

const CARD_WIDTH = 240;
const CARD_GAP = 12;
const CARD_SNAP = CARD_WIDTH + CARD_GAP; // 252

const CategoryRow: React.FC<CategoryRowProps> = ({
  title,
  courses,
  onNavigateToCourse,
  onNavigateTab,
  colors,
}) => {
  const flatRef = useRef<FlatList<Course> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const indexRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);

  // Take up to 7 items for the horizontal carousel
  const displayCourses = useMemo(() => courses.slice(0, 7), [courses]);
  const itemCount = displayCourses.length;

  useEffect(() => {
    if (itemCount <= 1) return;

    timerRef.current = setInterval(() => {
      if (isDraggingRef.current) return;
      try {
        indexRef.current = (indexRef.current + 1) % itemCount;
        flatRef.current?.scrollToOffset({
          offset: indexRef.current * CARD_SNAP,
          animated: true,
        });
      } catch {
        // Silently prevent any scroll layout error
      }
    }, 3000);

    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [itemCount]);

  if (itemCount === 0) return null;

  return (
    <View style={{ marginTop: 14 }}>
      {/* Row Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 16,
          marginBottom: 10,
        }}
      >
        <Text
          style={{
            fontSize: 17,
            fontWeight: '800',
            color: colors.text,
            letterSpacing: -0.3,
            flex: 1,
          }}
          numberOfLines={1}
        >
          {title}
        </Text>
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('light');
            onNavigateTab('Courses');
          }}
          style={{
            minHeight: MIN_TOUCH_TARGET,
            minWidth: MIN_TOUCH_TARGET,
            justifyContent: 'center',
            alignItems: 'flex-end',
          }}
          accessibilityRole="button"
          accessibilityLabel={`See all ${title} courses`}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: '700',
              color: '#102F53',
            }}
          >
            See All →
          </Text>
        </TouchableOpacity>
      </View>

      {/* Horizontal FlatList with Safe Offset Scrolling */}
      <FlatList
        ref={flatRef}
        data={displayCourses}
        keyExtractor={(item) => `cat-row-${title}-${item.id}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        initialNumToRender={3}
        maxToRenderPerBatch={4}
        windowSize={3}
        removeClippedSubviews={Platform.OS === 'android'}
        contentContainerStyle={{ paddingHorizontal: 16, gap: CARD_GAP, paddingBottom: 4 }}
        getItemLayout={(_, index) => ({
          length: CARD_SNAP,
          offset: CARD_SNAP * index,
          index,
        })}
        onScrollBeginDrag={() => {
          isDraggingRef.current = true;
        }}
        onScrollEndDrag={() => {
          isDraggingRef.current = false;
        }}
        onMomentumScrollEnd={(e) => {
          isDraggingRef.current = false;
          const offX = e.nativeEvent.contentOffset.x;
          indexRef.current = Math.round(offX / CARD_SNAP);
        }}
        renderItem={({ item }) => (
          <View style={{ width: CARD_WIDTH }}>
            <CourseCard
              course={item}
              onPress={() => {
                triggerHaptic('light');
                onNavigateToCourse(item.id);
              }}
            />
          </View>
        )}
      />
    </View>
  );
};

// ─── HomeScreen Props ─────────────────────────────────────────────────────────

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
  onOpenSupport?: () => void;
}

// ─── HomeScreen ───────────────────────────────────────────────────────────────

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
  onOpenSupport,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [aboutModalVisible, setAboutModalVisible] = useState(false);
  const [aboutInitialTab, setAboutInitialTab] = useState<AboutTabKey>('overview');
  const [showHeaderSearch, setShowHeaderSearch] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollViewRef = useRef<React.ElementRef<typeof ScrollView> | null>(null);

  const { t, isBangla } = useLanguage();
  const { streakDays, dailyMinutesSpent, dailyGoalMinutes } = useGamification();
  const dailyTargetMinutes = dailyGoalMinutes && dailyGoalMinutes > 0 ? dailyGoalMinutes : 30;
  const currentGoalPercent = Math.min(100, Math.round((dailyMinutesSpent / dailyTargetMinutes) * 100));
  const isGoalAchieved = currentGoalPercent >= 100;
  const {
    courses,
    isLoadingCourses,
    coursesError,
    refreshCourses,
    searchQuery,
    setSearchQuery,
    userProgress,
    getCourseProgressPercentage,
    recordCategoryInteraction,
    recordSearchKeyword,
    getRecommendedCourses,
    banners,
    siteBranding,
  } = useLearning();

  const { activeWorkspace, subscriptionTier, assessmentResult } = useSaaS();
  const { lastWatchedVideo, playVideo } = useYouTube();
  const { user, isAuthenticated, isGuest, setAuthModalVisible } = useAuth();

  // Dynamic Time-aware greeting
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
    } else {
      return {
        salutation: isBangla ? 'স্বাগতম' : 'Welcome back',
        icon: 'moon' as const,
        iconColor: '#6366F1',
      };
    }
  }, [isBangla]);

  // Learner Display Name
  const learnerDisplayName = useMemo(() => {
    if (user?.displayName && user.displayName.trim().length > 0) {
      const parts = user.displayName.trim().split(' ');
      return parts[0];
    }
    if (user?.username) {
      return user.username;
    }
    return isBangla ? 'লার্নার' : 'Learner';
  }, [user?.displayName, user?.username, isBangla]);

  // Active enrolled course
  const activeCourse = useMemo(() => {
    const enrolledCourseIds = Object.keys(userProgress);
    const activeCourseId = enrolledCourseIds[0];
    return activeCourseId ? courses.find((c) => c.id === activeCourseId) : undefined;
  }, [userProgress, courses]);

  const activeProgress = activeCourse ? userProgress[activeCourse.id] : undefined;
  const activeProgressPercent = activeCourse ? getCourseProgressPercentage(activeCourse.id) : 0;

  // Subtitle / Momentum context
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

  // ─── CR-3: Per-category filtered course lists ───────────────────────────────

  const upcomingCourses = useMemo(
    () =>
      courses.filter(
        (c) =>
          c.category === 'upcoming' ||
          (c.categorySlugs && c.categorySlugs.includes('upcoming-live-training')),
      ),
    [courses],
  );

  const generativeAiCourses = useMemo(
    () => courses.filter((c) => c.category === 'generative-ai'),
    [courses],
  );

  const marketingCourses = useMemo(
    () =>
      courses.filter(
        (c) => c.category === 'sales-marketing' || c.category === 'marketing',
      ),
    [courses],
  );

  const hrCourses = useMemo(
    () => courses.filter((c) => c.category === 'human-resource-management'),
    [courses],
  );

  const supplyChainCourses = useMemo(
    () =>
      courses.filter(
        (c) => c.categorySlugs && c.categorySlugs.includes('supply-chain-management'),
      ),
    [courses],
  );

  const financeCourses = useMemo(
    () => courses.filter((c) => c.category === 'finance-accounting-legal'),
    [courses],
  );

  const bundleCourses = useMemo(
    () =>
      courses.filter(
        (c) => c.isCareerBundle === true || c.title.includes('Bundle'),
      ),
    [courses],
  );

  // HeroCarousel slide handler
  const handleSelectSlide = (slide: CarouselSlide) => {
    if (slide.actionType === 'summit') {
      onNavigateTab('Workshops');
    } else if (slide.actionType === 'trailer') {
      const aiCourse = courses.find(
        (c) =>
          c.id === slide.targetId ||
          c.category === 'generative-ai' ||
          c.category === 'agentic-ai' ||
          c.title.toLowerCase().includes('ai'),
      );
      if (aiCourse) {
        onNavigateToCourse(aiCourse.id);
      } else {
        onNavigateTab('Courses');
      }
    } else if (slide.actionType === 'course') {
      const excelCourse = courses.find(
        (c) =>
          c.id === slide.targetId ||
          c.category === 'excel' ||
          c.category === 'excel-data' ||
          c.title.toLowerCase().includes('excel'),
      );
      if (excelCourse) {
        onNavigateToCourse(excelCourse.id);
      } else {
        onNavigateTab('Courses');
      }
    } else if (slide.actionType === 'bundle') {
      const bundleCourse = courses.find(
        (c) =>
          (slide.targetId && c.id.toLowerCase() === slide.targetId.toLowerCase()) ||
          c.title.toLowerCase().includes(slide.title.toLowerCase()),
      );
      if (bundleCourse) {
        onNavigateToCourse(bundleCourse.id);
      } else {
        onNavigateTab('Courses');
      }
    } else if (slide.actionType === 'subscription') {
      onOpenSubscription();
    }
  };

  // Scroll dynamics
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;

    if (offsetY > 8 && !isScrolled) {
      setIsScrolled(true);
    } else if (offsetY <= 8 && isScrolled) {
      setIsScrolled(false);
    }

    if (offsetY > 140 && !showHeaderSearch) {
      setShowHeaderSearch(true);
    } else if (offsetY <= 140 && showHeaderSearch) {
      setShowHeaderSearch(false);
    }

    if (offsetY > 480 && !showScrollTop) {
      setShowScrollTop(true);
    } else if (offsetY <= 480 && showScrollTop) {
      setShowScrollTop(false);
    }
  };

  // Category rows definition
  const categoryRows = useMemo(
    () => [
      { title: isBangla ? 'আসন্ন লাইভ ট্রেনিং' : 'Upcoming Live', courses: upcomingCourses },
      { title: isBangla ? 'জেনারেটিভ এআই' : 'Generative AI', courses: generativeAiCourses },
      { title: isBangla ? 'মার্কেটিং' : 'Marketing', courses: marketingCourses },
      { title: isBangla ? 'হিউম্যান রিসোর্স' : 'Human Resource', courses: hrCourses },
      { title: isBangla ? 'সাপ্লাই চেইন' : 'Supply Chain', courses: supplyChainCourses },
      { title: isBangla ? 'ফাইন্যান্স ও অ্যাকাউন্টিং' : 'Finance & Accounting', courses: financeCourses },
      { title: isBangla ? 'বান্ডেল' : 'Bundle', courses: bundleCourses },
    ],
    [
      isBangla,
      upcomingCourses,
      generativeAiCourses,
      marketingCourses,
      hrCourses,
      supplyChainCourses,
      financeCourses,
      bundleCourses,
    ],
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        isScrolled={isScrolled}
        showSearch={showHeaderSearch}
        onOpenSearch={onOpenSearch}
        onOpenSubscription={onOpenSubscription}
        onOpenNotifications={onOpenNotifications}
        onOpenYouTube={onOpenYouTube}
        onOpenDrawer={onOpenDrawer}
        onOpenSupport={onOpenSupport}
        onOpenOfflineContent={() => onNavigateTab('MyLearning')}
      />

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 84 }]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingCourses}
            onRefresh={() => {
              triggerHaptic('light');
              refreshCourses();
            }}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* ── 1. Personalized Greeting Header ── */}
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
            {/* Learner Avatar */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.avatarWrap}
              onPress={() => {
                triggerHaptic('light');
                if (isGuest && !isAuthenticated) {
                  setAuthModalVisible(true);
                } else {
                  onNavigateTab('Profile');
                }
              }}
              accessibilityRole="button"
              accessibilityLabel={isBangla ? 'প্রোফাইল ওপেন করুন' : 'Open profile'}
            >
              {user?.avatar ? (
                <Image
                  source={{ uri: user.avatar }}
                  style={styles.learnerAvatar}
                />
              ) : (
                <View
                  style={[
                    styles.learnerAvatar,
                    styles.avatarInitialsCircle,
                    { backgroundColor: colors.primary, borderColor: colors.primaryLight },
                  ]}
                >
                  <Text style={styles.avatarInitialsText}>
                    {(user?.name || user?.username || (isAuthenticated ? 'Student' : 'Learner')).charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
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

            {/* Greeting Text */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.greetingTextCol}
              onPress={() => {
                triggerHaptic('light');
                if (isGuest && !isAuthenticated) {
                  setAuthModalVisible(true);
                } else {
                  onNavigateTab('Profile');
                }
              }}
              accessibilityRole="button"
              accessibilityLabel={`${greetingInfo.salutation}, ${learnerDisplayName}`}
            >
              <View style={styles.salutationRow}>
                <Ionicons name={greetingInfo.icon} size={13} color={greetingInfo.iconColor} />
                <Text style={[styles.salutationText, { color: colors.textMuted }]}>
                  {greetingInfo.salutation}
                </Text>
                {(subscriptionTier === 'pro' || subscriptionTier === 'enterprise') && (
                  <View style={[styles.proBadge, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7' }]}>
                    <Ionicons name="star" size={10} color="#D97706" />
                    <Text style={styles.proBadgeText}>{subscriptionTier.toUpperCase()}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.greetingTitle, { color: colors.text }]} numberOfLines={1}>
                {learnerDisplayName} 👋
              </Text>
            </TouchableOpacity>

            {/* Momentum Capsule */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.momentumCapsule,
                {
                  backgroundColor: isDark ? colors.surfaceSubtle : '#F8FAFC',
                  borderColor: colors.border,
                },
              ]}
              onPress={() => {
                triggerHaptic('light');
                Alert.alert(
                  isBangla ? 'দৈনিক লার্নিং মোমেন্টাম 🔥' : 'Learning Momentum 🔥',
                  `${isBangla ? '• টানা স্ট্রিক' : '• Streak'}: ${streakDays} ${isBangla ? 'দিন' : 'Days'}\n${isBangla ? '• আজকের সময়' : '• Today\'s Time'}: ${dailyMinutesSpent}m / ${dailyTargetMinutes}m ${isBangla ? 'লক্ষ্য' : 'Goal'}\n\n${isBangla ? 'প্রতিদিন কোর্স ও ভিডিও দেখে নতুন ব্যাজ অর্জন করুন!' : 'Complete lessons and videos to keep up your daily streak!'}`,
                  [
                    {
                      text: isBangla ? 'মাই হাব দেখুন' : 'View My Hub',
                      onPress: () => onNavigateTab('MyLearning'),
                    },
                    { text: isBangla ? 'ঠিক আছে' : 'Got it', style: 'cancel' },
                  ],
                );
              }}
              accessibilityRole="button"
              accessibilityLabel={isBangla ? `দৈনিক স্ট্রিক ${streakDays} দিন, আজকের স্টাডি ${dailyMinutesSpent} মিনিট` : `Daily streak ${streakDays} days, today study ${dailyMinutesSpent} minutes`}
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

          {/* Subtitle + Radial Goal Ring */}
          <View style={styles.greetingBottomRow}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={[styles.greetingSubtitle, { color: colors.textMuted }]} numberOfLines={1}>
                {greetingSubtitleText}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.radialGoalBadge,
                {
                  backgroundColor: isDark ? colors.surfaceSubtle : '#F8FAFC',
                  borderColor: colors.border,
                },
              ]}
              activeOpacity={0.85}
              onPress={() => {
                triggerHaptic('light');
                Alert.alert(
                  isBangla ? 'দৈনিক লক্ষ্য ও মোমেন্টাম 🎯' : 'Daily Study Goal 🎯',
                  `${isBangla ? '• আজকের স্টাডি' : '• Today'}: ${dailyMinutesSpent}m / ${dailyTargetMinutes}m (${currentGoalPercent}% ${isBangla ? 'সম্পন্ন' : 'completed'})\n${isBangla ? '• স্টাডি স্ট্রিক' : '• Study Streak'}: ${streakDays} ${isBangla ? 'দিন' : 'days'} 🔥\n\n${
                    isGoalAchieved
                      ? (isBangla ? 'অভিনন্দন! আজকের লক্ষ্য অর্জিত হয়েছে 🎉' : 'Awesome! You hit today\'s learning goal 🎉')
                      : (isBangla ? `আর মাত্র ${Math.max(0, dailyTargetMinutes - dailyMinutesSpent)} মিনিট স্টাডি করলেই আজকের লক্ষ্য সম্পন্ন!` : `Only ${Math.max(0, dailyTargetMinutes - dailyMinutesSpent)} minutes left to complete today's goal!`)
                  }`,
                  [
                    { text: isBangla ? 'কোর্স চালিয়ে যান' : 'Continue Course', onPress: () => onNavigateTab('MyLearning') },
                    { text: isBangla ? 'ঠিক আছে' : 'OK', style: 'cancel' },
                  ],
                );
              }}
              accessibilityRole="button"
              accessibilityLabel={`Daily Goal: ${dailyMinutesSpent} of ${dailyTargetMinutes} minutes completed`}
            >
              <CircularProgressRing
                progress={currentGoalPercent}
                size={32}
                strokeWidth={3}
                trackColor={isDark ? colors.border : '#E2E8F0'}
                progressColor={isGoalAchieved ? '#10B981' : (colors.brandGold || '#FFB606')}
                showText={false}
                centerContent={
                  <Text
                    style={[
                      styles.radialCenterIcon,
                      {
                        color: isGoalAchieved ? '#10B981' : (colors.brandGold || '#FFB606'),
                      },
                    ]}
                  >
                    {isGoalAchieved ? '✓' : '⚡'}
                  </Text>
                }
              />
              <View style={styles.radialGoalTextCol}>
                <Text style={[styles.radialGoalTitle, { color: colors.text }]}>
                  {dailyMinutesSpent}/{dailyTargetMinutes}m
                </Text>
                <Text style={[styles.radialGoalSub, { color: colors.textMuted }]}>
                  {isBangla ? 'দৈনিক লক্ষ্য' : 'Daily Goal'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 2. Search Bar ── */}
        <SearchSpotlightBar
          onPress={() => onOpenSearch && onOpenSearch()}
          onSelectTag={(query) => {
            recordSearchKeyword(query);
            setSearchQuery(query);
            if (onOpenSearch) onOpenSearch();
          }}
        />

        {/* ── 3. Hero Banner (1 slide max) ── */}
        <HeroCarousel
          slides={banners.slice(0, 1)}
          onSelectSlide={handleSelectSlide}
          onOpenSubscription={onOpenSubscription}
        />

        {/* ── Loading / Error State ── */}
        {isLoadingCourses && courses.length === 0 && (
          <View style={{ paddingHorizontal: 16, marginTop: 14 }}>
            <CourseCardSkeleton />
            <CourseCardSkeleton />
          </View>
        )}

        {!isLoadingCourses && coursesError && courses.length === 0 && (
          <StateView
            mode="error"
            title={isBangla ? 'কোর্স লোড করা যায়নি' : 'Could not load courses'}
            message={coursesError}
            primaryActionLabel={isBangla ? 'আবার চেষ্টা করুন' : 'Retry'}
            onPrimaryAction={refreshCourses}
            compact
          />
        )}

        {/* ── 4. CR-3: Category Carousels ── */}
        {courses.length > 0 &&
          categoryRows.map((row) => (
            <CategoryRow
              key={`cat-${row.title}`}
              title={row.title}
              courses={row.courses}
              onNavigateToCourse={onNavigateToCourse}
              onNavigateTab={onNavigateTab}
              colors={colors}
            />
          ))}

        {/* ── About TSL Footer Card ── */}
        <View style={styles.section}>
          <View
            style={[
              styles.gatewayCard,
              { backgroundColor: colors.surfaceCard, borderColor: colors.border },
            ]}
          >
            <View style={styles.gatewayHeaderRow}>
              <View style={[styles.gatewayIconWrap, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[typography.h4, { color: colors.text }]}>
                  {isBangla ? 'থ্রাইভিং স্কিলস পরিচিতি ও ইকোসিস্টেম' : 'About Thriving Skills & Ecosystem'}
                </Text>
                <Text style={[typography.bodySmall, { color: colors.textMuted }]} numberOfLines={2}>
                  {isBangla
                    ? 'আমাদের মিশন, ভিশন, ফ্যাকাল্টি ও পার্টনারশিপ সম্পর্কে জানুন।'
                    : 'Learn about our mission, executive faculty, corporate partners, and university MoUs.'}
                </Text>
              </View>
            </View>

            <View style={styles.gatewayActionsRow}>
              <SpringPressable
                style={[
                  styles.gatewaySecondaryBtn,
                  { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, flex: 1 },
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
                  {isBangla ? 'আমাদের সম্পর্কে বিস্তারিত জানুন →' : 'Explore About TSL →'}
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

      {/* Scroll to Top Pill */}
      <ScrollToTopPill
        visible={showScrollTop}
        onPress={() => scrollViewRef.current?.scrollTo({ y: 0, animated: true })}
        bottomOffset={Math.max(insets.bottom, 16) + 72}
      />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

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
  avatarInitialsCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialsText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
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
    flexShrink: 0,
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
  radialGoalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    gap: 7,
    minHeight: 40,
  },
  radialCenterIcon: {
    fontSize: 9,
    fontWeight: '800',
  },
  radialGoalTextCol: {
    justifyContent: 'center',
  },
  radialGoalTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: -0.2,
    lineHeight: 14,
  },
  radialGoalSub: {
    fontSize: 9,
    fontWeight: '600',
    lineHeight: 12,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 14,
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
});
