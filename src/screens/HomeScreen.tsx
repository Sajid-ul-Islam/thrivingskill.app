import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  Platform,
  RefreshControl,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useLearning } from '../context/LearningContext';
import { useSaaS } from '../context/SaaSContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useGamification } from '../context/GamificationContext';
import { useResponsive } from '../theme';
import {
  Header,
  CourseCard,
  HeroCarousel,
  SearchSpotlightBar,
  CourseCardSkeleton,
  SpringPressable,
  StateView,
  ScrollToTopPill,
  AboutTSLModal,
  AboutTabKey,
  PartnerLogoMarquee,
  HomeFeatureGrid,
  SpecialBundlesCarousel,
  HomeTestimonialsCarousel,
  HomeQuickNavPills,
  ThriveGenHub,
  HomeBlogInsightsFeed,
  FlashSaleBanner,
  BlogModal,
  SupportContactModal,
  StaggeredFadeIn,
} from '../components';
import type { WpPost, Course, RootTab } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { typography, MIN_TOUCH_TARGET } from '../theme/typography';
import { homeStyles as styles } from './home/homeStyles';
import { HomeGreetingCard } from './home/HomeGreetingCard';
import { useHomeDashboard } from './home/useHomeDashboard';

interface CategoryRowProps {
  title: string;
  subtitle?: string;
  courses: Course[];
  onNavigateToCourse: (id: string) => void;
  onNavigateTab: (tab: RootTab) => void;
  colors: ReturnType<typeof useTheme>['colors'];
}

const CARD_GAP = 12;

const CategoryRow: React.FC<CategoryRowProps> = ({
  title,
  subtitle,
  courses,
  onNavigateToCourse,
  onNavigateTab,
  colors,
}) => {
  const { isTablet, isLandscape, width } = useResponsive();
  const { isBangla } = useLanguage();
  const flatRef = useRef<FlatList<Course> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const indexRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);

  const displayCourses = useMemo(() => courses.slice(0, 7), [courses]);
  const itemCount = displayCourses.length;
  const effectiveWidth = Math.min(width, 1100);

  const cardWidth = useMemo(() => {
    if (!isTablet) return Math.min(270, Math.max(240, Math.round(width * 0.68)));
    if (itemCount === 2 && !isLandscape) {
      return Math.floor((effectiveWidth - 32 - CARD_GAP) / 2);
    }
    return isLandscape
      ? Math.max(280, Math.floor((effectiveWidth - 48) / 3.2))
      : Math.max(300, Math.floor((effectiveWidth - 48) / 2.2));
  }, [isTablet, isLandscape, effectiveWidth, itemCount, width]);

  const cardSnap = cardWidth + CARD_GAP;

  useEffect(() => {
    if (
      itemCount <= 1 ||
      (isTablet && itemCount <= (isLandscape ? 3 : 2) && itemCount <= 2 && !isLandscape)
    ) {
      return;
    }

    timerRef.current = setInterval(() => {
      if (isDraggingRef.current) return;
      try {
        indexRef.current = (indexRef.current + 1) % itemCount;
        flatRef.current?.scrollToOffset({ offset: indexRef.current * cardSnap, animated: true });
      } catch {}
    }, 3800);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [itemCount, cardSnap, isTablet, isLandscape]);

  if (courses.length === 0) return null;

  return (
    <View style={{ marginTop: 18, marginBottom: 4 }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 16,
          marginBottom: 10,
        }}
      >
        <View style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
          <Text
            style={{ fontSize: 17, fontWeight: '800', color: colors.text, letterSpacing: -0.3 }}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <SpringPressable
          onPress={() => {
            triggerHaptic('light');
            onNavigateTab('Courses');
          }}
          style={{
            minHeight: MIN_TOUCH_TARGET,
            minWidth: MIN_TOUCH_TARGET,
            justifyContent: 'center',
            alignItems: 'flex-end',
            flexShrink: 0,
          }}
          accessibilityRole="button"
          accessibilityLabel={`See all ${title} courses`}
          haptic="light"
          activeScale={0.93}
        >
          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>
            {isBangla ? 'সব দেখুন →' : 'See All →'}
          </Text>
        </SpringPressable>
      </View>

      {itemCount === 1 ? (
        <View style={{ paddingHorizontal: 16 }}>
          <StaggeredFadeIn index={0}>
            <CourseCard
              course={displayCourses[0]}
              horizontal={true}
              onPress={() => {
                triggerHaptic('light');
                onNavigateToCourse(displayCourses[0].id);
              }}
            />
          </StaggeredFadeIn>
        </View>
      ) : isTablet && itemCount === 2 && !isLandscape ? (
        <View
          style={{
            flexDirection: 'row',
            paddingHorizontal: 16,
            gap: CARD_GAP,
            alignItems: 'stretch',
          }}
        >
          {displayCourses.map((item, idx) => (
            <StaggeredFadeIn
              key={`cat-row-${title}-${item.id}`}
              index={idx}
              style={{ flex: 1, height: '100%', alignSelf: 'stretch' }}
            >
              <CourseCard
                course={item}
                onPress={() => {
                  triggerHaptic('light');
                  onNavigateToCourse(item.id);
                }}
              />
            </StaggeredFadeIn>
          ))}
        </View>
      ) : (
        <FlatList
          ref={flatRef}
          data={displayCourses}
          keyExtractor={(item) => `cat-row-${title}-${item.id}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          initialNumToRender={isTablet ? 4 : 3}
          maxToRenderPerBatch={4}
          windowSize={3}
          removeClippedSubviews={Platform.OS === 'android'}
          contentContainerStyle={{
            paddingHorizontal: 16,
            gap: CARD_GAP,
            paddingBottom: 4,
            alignItems: 'stretch',
          }}
          getItemLayout={(_, index) => ({ length: cardSnap, offset: cardSnap * index, index })}
          onScrollBeginDrag={() => {
            isDraggingRef.current = true;
          }}
          onScrollEndDrag={() => {
            isDraggingRef.current = false;
          }}
          onMomentumScrollEnd={(e) => {
            isDraggingRef.current = false;
            indexRef.current = Math.round(e.nativeEvent.contentOffset.x / cardSnap);
          }}
          renderItem={({ item, index }) => (
            <StaggeredFadeIn index={index} style={{ width: cardWidth, alignSelf: 'stretch' }}>
              <CourseCard
                course={item}
                onPress={() => {
                  triggerHaptic('light');
                  onNavigateToCourse(item.id);
                }}
              />
            </StaggeredFadeIn>
          )}
        />
      )}
    </View>
  );
};

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

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateToCourse,
  onNavigateTab,
  onOpenSubscription,
  onOpenNotifications,
  onOpenYouTube,
  onOpenSearch,
  onOpenDrawer,
  onOpenSupport,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { isTablet, containerClampStyle } = useResponsive();
  const [aboutModalVisible, setAboutModalVisible] = useState(false);
  const [aboutInitialTab, setAboutInitialTab] = useState<AboutTabKey>('overview');
  const [blogModalVisible, setBlogModalVisible] = useState(false);
  const [selectedBlogId, setSelectedBlogId] = useState<string | number | undefined>(undefined);
  const [supportModalVisible, setSupportModalVisible] = useState(false);
  const [showHeaderSearch, setShowHeaderSearch] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const scrollViewRef = useRef<React.ElementRef<typeof ScrollView> | null>(null);

  const { isBangla } = useLanguage();
  const { streakDays, dailyMinutesSpent, dailyGoalMinutes } = useGamification();
  const dailyTargetMinutes = dailyGoalMinutes && dailyGoalMinutes > 0 ? dailyGoalMinutes : 30;
  const currentGoalPercent = Math.min(
    100,
    Math.round((dailyMinutesSpent / dailyTargetMinutes) * 100)
  );
  const isGoalAchieved = currentGoalPercent >= 100;

  const {
    courses,
    isLoadingCourses,
    coursesError,
    refreshCourses,
    setSearchQuery,
    userProgress,
    getCourseProgressPercentage,
    recordSearchKeyword,
    getRecommendedCourses,
    banners,
    partnerLogos,
    homeFeatures,
    specialBundles,
    studentTestimonials,
    appRemoteConfig,
    refreshBranding,
    blogPosts,
  } = useLearning();

  const { subscriptionTier } = useSaaS();
  const { user, isAuthenticated, isGuest, setAuthModalVisible } = useAuth();

  useEffect(() => {
    setAvatarError(false);
  }, [user?.avatar]);

  const dashboard = useHomeDashboard({
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
  });

  const handleSelectBlogPost = (post: WpPost) => {
    setSelectedBlogId(post.id);
    setBlogModalVisible(true);
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    if (offsetY > 8 && !isScrolled) setIsScrolled(true);
    else if (offsetY <= 8 && isScrolled) setIsScrolled(false);
    if (offsetY > 140 && !showHeaderSearch) setShowHeaderSearch(true);
    else if (offsetY <= 140 && showHeaderSearch) setShowHeaderSearch(false);
    if (offsetY > 480 && !showScrollTop) setShowScrollTop(true);
    else if (offsetY <= 480 && showScrollTop) setShowScrollTop(false);
  };

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
        contentContainerStyle={[
          styles.scrollContent,
          containerClampStyle,
          { paddingBottom: Math.max(insets.bottom, 16) + 84 },
        ]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingCourses}
            onRefresh={() => {
              triggerHaptic('light');
              refreshCourses();
              refreshBranding(true);
            }}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <HomeGreetingCard
          colors={colors}
          isDark={isDark}
          isTablet={isTablet}
          isBangla={isBangla}
          isAuthenticated={isAuthenticated}
          isGuest={isGuest}
          user={user}
          avatarError={avatarError}
          setAvatarError={setAvatarError}
          setAuthModalVisible={setAuthModalVisible}
          subscriptionTier={subscriptionTier}
          streakDays={streakDays}
          dailyMinutesSpent={dailyMinutesSpent}
          dailyTargetMinutes={dailyTargetMinutes}
          currentGoalPercent={currentGoalPercent}
          isGoalAchieved={isGoalAchieved}
          greetingInfo={dashboard.greetingInfo}
          learnerDisplayName={dashboard.learnerDisplayName}
          greetingSubtitleText={dashboard.greetingSubtitleText}
          onNavigateTab={onNavigateTab}
        />

        <SearchSpotlightBar
          onPress={() => onOpenSearch && onOpenSearch()}
          onSelectTag={(query) => {
            recordSearchKeyword(query);
            setSearchQuery(query);
            if (onOpenSearch) onOpenSearch();
          }}
        />

        <HomeQuickNavPills
          onOpenThriveGen={() => {
            setSearchQuery('thrive-gen');
            onNavigateTab('Courses');
          }}
          onOpenBundles={dashboard.handleViewAllBundles}
          onOpenBlog={() => setBlogModalVisible(true)}
          onOpenSubscription={onOpenSubscription}
          onOpenWorkshops={() => onNavigateTab('Workshops')}
          onOpenAbout={() => {
            setAboutInitialTab('overview');
            setAboutModalVisible(true);
          }}
          onOpenContact={() => setSupportModalVisible(true)}
        />

        <HeroCarousel
          slides={banners}
          onSelectSlide={dashboard.handleSelectSlide}
          onOpenSubscription={onOpenSubscription}
        />

        <FlashSaleBanner
          sale={appRemoteConfig?.flash_sale}
          onPress={() => onNavigateTab('Courses')}
        />
        <PartnerLogoMarquee logos={partnerLogos} />
        <HomeFeatureGrid features={homeFeatures} onSelectFeature={dashboard.handleSelectFeature} />
        <SpecialBundlesCarousel
          bundles={specialBundles}
          onSelectBundle={dashboard.handleSelectSpecialBundle}
          onViewAllBundles={dashboard.handleViewAllBundles}
        />
        <ThriveGenHub
          onSelectCourse={dashboard.handleSelectThriveGenCourse}
          onExploreAllThriveGen={() => {
            setSearchQuery('thrive-gen');
            onNavigateTab('Courses');
          }}
        />

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

        {courses.length > 0 &&
          dashboard.categoryRows.map((row) => (
            <CategoryRow
              key={`cat-${row.title}`}
              title={row.title}
              courses={row.courses}
              onNavigateToCourse={onNavigateToCourse}
              onNavigateTab={onNavigateTab}
              colors={colors}
            />
          ))}

        <HomeBlogInsightsFeed
          posts={blogPosts}
          onSelectPost={handleSelectBlogPost}
          onViewAllPosts={() => setBlogModalVisible(true)}
        />
        <HomeTestimonialsCarousel testimonials={studentTestimonials} />

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
                  {isBangla
                    ? 'থ্রাইভিং স্কিলস পরিচিতি ও ইকোসিস্টেম'
                    : 'About Thriving Skills & Ecosystem'}
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
      <BlogModal
        visible={blogModalVisible}
        initialPostId={selectedBlogId}
        onClose={() => {
          setBlogModalVisible(false);
          setSelectedBlogId(undefined);
        }}
        onSelectCourse={onNavigateToCourse}
      />
      <SupportContactModal
        visible={supportModalVisible}
        onClose={() => setSupportModalVisible(false)}
      />
      <ScrollToTopPill
        visible={showScrollTop}
        onPress={() => scrollViewRef.current?.scrollTo({ y: 0, animated: true })}
        bottomOffset={Math.max(insets.bottom, 16) + 72}
      />
    </View>
  );
};
