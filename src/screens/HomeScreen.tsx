import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  RefreshControl,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
import { SpecialBundleCard } from '../components/SpecialBundleCard';
import { SummitCard } from '../components/SummitCard';
import { YouTubeCard } from '../components/YouTubeCard';
import { CommunityFeedShelf } from '../components/CommunityFeedShelf';
import { CommunityFeedModal } from '../components/CommunityFeedModal';
import { HeroCarousel, CarouselSlide } from '../components/HeroCarousel';
import { QuickActionDock } from '../components/QuickActionDock';
import { SearchSpotlightBar } from '../components/SearchSpotlightBar';
import { CourseCardSkeleton } from '../components/SkeletonLoader';
import { CountdownWidget } from '../components/CountdownWidget';
import { SkillBiteWidget } from '../components/SkillBiteWidget';
import { useYouTube } from '../context/YouTubeContext';
import { useAutoScroll } from '../hooks/useAutoScroll';
import { YOUTUBE_VIDEOS, YOUTUBE_CHANNEL, YouTubeVideo } from '../data/youtubeVideos';
import {
  CORPORATE_CLIENTS,
  SPECIAL_BUNDLES,
  SKILLS_SUMMITS,
  REVIEWS_WALL,
} from '../data/mockData';
import { RootTab } from '../types';
import { AboutTSLModal, AboutTabKey } from '../components/AboutTSLModal';
import { LegalPolicyModal, LegalTabKey } from '../components/LegalPolicyModal';

const FOUNDER_MAHMUD = require('../../assets/team/abdullah_al_mahmud.jpeg');
const FOUNDER_SYED = require('../../assets/team/syed_nuruddin_ahmed.jpeg');

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
  onOpenCommunityFeed?: () => void;
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
  onOpenCommunityFeed,
  onOpenDrawer,
}) => {
  const { colors, isDark } = useTheme();
  const [communityModalVisible, setCommunityModalVisible] = useState(false);
  const [aboutModalVisible, setAboutModalVisible] = useState(false);
  const [aboutInitialTab, setAboutInitialTab] = useState<AboutTabKey>('overview');
  const [legalModalVisible, setLegalModalVisible] = useState(false);
  const [legalInitialTab, setLegalInitialTab] = useState<LegalTabKey>('terms');

  const { t, isBangla } = useLanguage();
  const { streakDays, dailyMinutesSpent, dailyGoalMinutes } = useGamification();
  const {
    courses,
    categories,
    blogPosts,
    isLoadingCourses,
    refreshCourses,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    userProgress,
    getCourseProgressPercentage,
  } = useLearning();
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

  // Dynamic slow auto-scroll hook for YouTube videos shelf
  const ytAutoScroll = useAutoScroll({
    speed: 0.45,
    pauseAtEdgeMs: 1800,
    resumeDelayMs: 2800,
  });

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
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
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
                <TouchableOpacity onPress={() => onNavigateTab('MyLearning')}>
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
                  <Ionicons name="play" size={16} color="#FFFFFF" />
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
          onOpenCopilot={() => onNavigateTab('Copilot')}
          onOpenAssessment={onOpenAssessment}
          onOpenWorkshops={() => onNavigateTab('Workshops')}
          onOpenTeamOrMyLearning={() =>
            onNavigateTab(activeWorkspace.type === 'enterprise' ? 'TeamHub' : 'MyLearning')
          }
        />

        {/* 5. Live Summit Flash Sale Countdown Timer */}
        <CountdownWidget
          onClaimDiscount={() => onNavigateTab('Workshops')}
        />

        {/* 6. Daily Skill Bite Micro-Challenge Widget */}
        <SkillBiteWidget />

        {/* Category Filter Pills */}
        <View style={styles.categorySection}>
          <CategoryPills
            selectedId={selectedCategory}
            categories={categories}
            onSelect={(id) => {
              setSelectedCategory(id);
              if (id !== 'all') {
                onNavigateTab('Courses');
              }
            }}
          />
        </View>

        {/* Special Career Bundles Section (স্পেশাল বান্ডেল কোর্স) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>স্পেশাল বান্ডেল কোর্স</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                সাশ্রয়ী প্যাকেজে ক্যারিয়ার উপযোগী কমপ্লিট স্কিল
              </Text>
            </View>
            <TouchableOpacity onPress={() => onNavigateTab('Courses')}>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>View All ({SPECIAL_BUNDLES.length})</Text>
            </TouchableOpacity>
          </View>

          {SPECIAL_BUNDLES.slice(0, 2).map((bundle) => (
            <SpecialBundleCard
              key={bundle.id}
              bundle={bundle}
              onPress={() => onNavigateTab('Courses')}
            />
          ))}
        </View>

        {/* Popular Executive Masterclasses */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>জনপ্রিয় কোর্সসমূহ</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                Executive Masterclasses in Generative AI, Excel & Finance
              </Text>
            </View>
            <TouchableOpacity onPress={() => onNavigateTab('Courses')}>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>View All ({courses.length})</Text>
            </TouchableOpacity>
          </View>

          {isLoadingCourses && courses.length === 0 ? (
            <>
              <CourseCardSkeleton />
              <CourseCardSkeleton />
            </>
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

        {/* Thriving Skills YouTube Masterclasses */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="logo-youtube" size={20} color="#FF0000" />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>YouTube Masterclasses</Text>
              </View>
              <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                Free industry lessons from {YOUTUBE_CHANNEL.handle}
              </Text>
            </View>
            <TouchableOpacity onPress={onOpenYouTube}>
              <Text style={[styles.seeAllText, { color: '#FF0000', fontWeight: '700' }]}>
                View All ({YOUTUBE_VIDEOS.length}) →
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={ytAutoScroll.scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 14, paddingRight: 16 }}
            {...ytAutoScroll.scrollProps}
          >
            {YOUTUBE_VIDEOS.slice(0, 8).map((ytVideo) => (
              <YouTubeCard
                key={ytVideo.id}
                video={ytVideo}
                width={260}
                onPress={(v) => {
                  ytAutoScroll.pauseTemporarily(4000);
                  playVideo(v, 'modal');
                }}
              />
            ))}
          </ScrollView>
        </View>

        {/* Community & Social Feed (Facebook & LinkedIn) */}
        <CommunityFeedShelf
          onViewAll={() => {
            if (onOpenCommunityFeed) {
              onOpenCommunityFeed();
            } else {
              setCommunityModalVisible(true);
            }
          }}
        />

        {/* National & Regional Skills Summits */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>National Skills Summits</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                Flagship Conferences on 4IR, AI, & Employability
              </Text>
            </View>
            <TouchableOpacity onPress={() => onNavigateTab('Workshops')}>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>All Events →</Text>
            </TouchableOpacity>
          </View>

          {SKILLS_SUMMITS.slice(0, 2).map((summit) => (
            <SummitCard key={summit.id} summit={summit} />
          ))}
        </View>

        {/* Corporate Solutions & SME Consultancy Spotlight */}
        <View
          style={[
            styles.corporateBanner,
            {
              backgroundColor: isDark ? colors.surfaceCard : '#1E1B4B',
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.corporateBadge}>
            <Ionicons name="business" size={14} color="#818CF8" />
            <Text style={styles.corporateBadgeText}>FOR CORPORATE & SME TEAMS</Text>
          </View>
          <Text style={styles.corporateTitle}>
            কাস্টমাইজড Corporate Training & Strategic Advisory
          </Text>
          <Text style={styles.corporateSubtitle}>
            আপনার টিমের পেশাদার দক্ষতা বৃদ্ধি, কার্যকর এবং ফলাফলমুখী করতে আমরা প্রদান করি ডিজিটাল লার্নিং সলিউশন, LMS সেটআপ এবং বিজনেস কনসালটেন্সি।
          </Text>

          <View style={styles.corpServicesGrid}>
            {[
              { title: 'Corporate Training', icon: 'school' },
              { title: 'Digital LMS Platform', icon: 'laptop' },
              { title: 'SME Consultancy', icon: 'briefcase' },
              { title: 'ICT Policy Consulting', icon: 'shield-checkmark' },
            ].map((serv, idx) => (
              <View key={idx} style={styles.corpServItem}>
                <Ionicons name={serv.icon as any} size={14} color="#818CF8" />
                <Text style={styles.corpServText}>{serv.title}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.corporateBtn, { backgroundColor: colors.secondary }]}
            onPress={onOpenCorporateModal}
            activeOpacity={0.85}
          >
            <Text style={styles.corporateBtnText}>Request Enterprise Proposal</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Verified Learners' Wall of Love (Real Reviews) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Learner Experiences</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                What corporate professionals say about Thriving Skills
              </Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.reviewsScroll}
          >
            {REVIEWS_WALL.map((rev) => (
              <View
                key={rev.id}
                style={[
                  styles.reviewCard,
                  {
                    backgroundColor: colors.surfaceCard,
                    borderColor: colors.border,
                    shadowColor: colors.cardShadow,
                  },
                ]}
              >
                <View style={styles.reviewHeader}>
                  <Image source={{ uri: rev.userAvatar }} style={styles.revAvatar} />
                  <View style={styles.revUserCol}>
                    <Text style={[styles.revName, { color: colors.text }]}>{rev.userName}</Text>
                    <Text style={[styles.revRole, { color: colors.textMuted }]}>{rev.userRole}</Text>
                  </View>
                  <View style={styles.starsRow}>
                    <Ionicons name="star" size={12} color="#F59E0B" />
                    <Ionicons name="star" size={12} color="#F59E0B" />
                    <Ionicons name="star" size={12} color="#F59E0B" />
                    <Ionicons name="star" size={12} color="#F59E0B" />
                    <Ionicons name="star" size={12} color="#F59E0B" />
                  </View>
                </View>
                <Text style={[styles.revComment, { color: colors.text }]} numberOfLines={4}>
                  "{rev.comment}"
                </Text>
                <View style={styles.verifiedTag}>
                  <Ionicons name="checkmark-circle" size={12} color={colors.primary} />
                  <Text style={[styles.verifiedTagText, { color: colors.primary }]}>
                    {rev.company || 'Verified Professional'}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Career Insights & Articles (Live from WordPress) */}
        {blogPosts && blogPosts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Career Insights & Articles</Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                  Live publications from Thriving Skills Editorial
                </Text>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.articlesScroll}
            >
              {blogPosts.map((post) => (
                <TouchableOpacity
                  key={post.id}
                  style={[
                    styles.articleCard,
                    {
                      backgroundColor: colors.surfaceCard,
                      borderColor: colors.border,
                      shadowColor: colors.cardShadow,
                    },
                  ]}
                  onPress={() => {
                    post.link && Linking.openURL(post.link).catch(() => {});
                  }}
                  activeOpacity={0.88}
                >
                  {post.featuredImageUrl ? (
                    <Image source={{ uri: post.featuredImageUrl }} style={styles.articleThumb} />
                  ) : (
                    <View style={[styles.articleThumbPlaceholder, { backgroundColor: colors.primary + '15' }]}>
                      <Ionicons name="newspaper-outline" size={32} color={colors.primary} />
                    </View>
                  )}
                  <View style={styles.articleBody}>
                    <View style={styles.articleMeta}>
                      <Text style={[styles.articleDate, { color: colors.primary }]}>{post.date}</Text>
                      <Text style={[styles.articleAuthor, { color: colors.textMuted }]}>• {post.authorName}</Text>
                    </View>
                    <Text style={[styles.articleTitle, { color: colors.text }]} numberOfLines={2}>
                      {post.title}
                    </Text>
                    <Text style={[styles.articleExcerpt, { color: colors.textMuted }]} numberOfLines={2}>
                      {post.excerpt}
                    </Text>
                    <View style={styles.articleFooter}>
                      <Text style={[styles.articleReadMore, { color: colors.primary }]}>Read on Web →</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Founders & Leadership Spotlight */}
        <View style={styles.leadershipSpotlightSection}>
          <View style={[styles.leadershipCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
            <View style={styles.leadershipCardHeader}>
              <View style={[styles.badgePill, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
                <Ionicons name="star" size={12} color="#F59E0B" />
                <Text style={[styles.badgePillText, { color: '#F59E0B' }]}>
                  {isBangla ? 'প্রতিষ্ঠাতা ও নেতৃত্ব' : 'LEADERSHIP & FOUNDERS'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setAboutInitialTab('leadership');
                  setAboutModalVisible(true);
                }}
                style={styles.viewLeadershipBtn}
              >
                <Text style={[styles.viewLeadershipText, { color: colors.primary }]}>
                  {isBangla ? 'টিম প্রোফাইল →' : 'View Bios →'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.leadershipTitle, { color: colors.text }]}>
              {isBangla
                ? 'বাংলাদেশের দক্ষ জনশক্তি ও ৪র্থ শিল্পবিপ্লবের পথপ্রদর্শক'
                : 'Pioneering Future-Ready 4IR Capabilities in Bangladesh'}
            </Text>

            {/* Founder Avatars Row */}
            <View style={styles.foundersRow}>
              {/* Founder 1: Md. Abdullah Al Mahmud */}
              <TouchableOpacity
                style={[styles.founderMiniCard, { borderColor: colors.border, backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}
                onPress={() => {
                  setAboutInitialTab('leadership');
                  setAboutModalVisible(true);
                }}
                activeOpacity={0.8}
              >
                <View style={styles.founderImgContainer}>
                  <Image source={FOUNDER_MAHMUD} style={styles.founderAvatar} />
                  <View style={styles.verifiedDot}>
                    <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                  </View>
                </View>
                <Text style={[styles.founderName, { color: colors.text }]} numberOfLines={1}>
                  Md. Abdullah Al Mahmud
                </Text>
                <Text style={[styles.founderRole, { color: colors.primary }]} numberOfLines={1}>
                  Founder & CEO
                </Text>
              </TouchableOpacity>

              {/* Founder 2: Syed Nuruddin Ahmed */}
              <TouchableOpacity
                style={[styles.founderMiniCard, { borderColor: colors.border, backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}
                onPress={() => {
                  setAboutInitialTab('leadership');
                  setAboutModalVisible(true);
                }}
                activeOpacity={0.8}
              >
                <View style={styles.founderImgContainer}>
                  <Image source={FOUNDER_SYED} style={styles.founderAvatar} />
                  <View style={styles.verifiedDot}>
                    <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                  </View>
                </View>
                <Text style={[styles.founderName, { color: colors.text }]} numberOfLines={1}>
                  Syed Nuruddin Ahmed
                </Text>
                <Text style={[styles.founderRole, { color: colors.secondary }]} numberOfLines={1}>
                  Founder & Chairman
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Trusted Institutional Partners & MoUs */}
        <View style={styles.partnerSection}>
          <View style={styles.partnerHeaderRow}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                <Text style={[styles.partnerBadgeTag, { color: colors.textMuted }]}>
                  {isBangla ? 'অফিসিয়াল পার্টনারশিপ ও সমঝোতা স্মারক' : 'ACCREDITED & RECOGNIZED'}
                </Text>
              </View>
              <Text style={[styles.partnerSectionTitle, { color: colors.text }]}>
                {isBangla ? 'বিশ্ববিদ্যালয় ও প্রাতিষ্ঠানিক পার্টনারসমূহ' : 'Trusted Institutional Partners & MoUs'}
              </Text>
              <Text style={[styles.partnerSectionSubtitle, { color: colors.textMuted }]}>
                {isBangla
                  ? 'শীর্ষ বিশ্ববিদ্যালয়, আইসিটি ডিভিশন (a2i) এবং প্রফেশনাল বডিসমূহের সাথে সমঝোতা চুক্তি'
                  : 'Bilateral MoUs with renowned universities, ICT Division (a2i), and industry councils'}
              </Text>
            </View>
          </View>

          {/* Institutional Partner Cards */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.partnerCardsScroll}>
            {[
              {
                org: 'Eastern University (EU)',
                tag: 'Bilateral MoU',
                tagColor: '#3B82F6',
                icon: 'school-outline',
                desc: 'Official MoU for AI curriculum integration and student capability development.',
              },
              {
                org: 'Dhaka University (DUCSU)',
                tag: 'National Summit',
                tagColor: '#8B5CF6',
                icon: 'business-outline',
                desc: 'Co-organized Bangladesh Skills Summit at DU Senate Bhaban.',
              },
              {
                org: 'North South University',
                tag: '4IR Summit',
                tagColor: '#10B981',
                icon: 'hardware-chip-outline',
                desc: 'Organized the 4IR Skills Summit bridging GenAI and youth skills.',
              },
              {
                org: 'a2i (ICT Division)',
                tag: 'Govt. Alliance',
                tagColor: '#F59E0B',
                icon: 'shield-outline',
                desc: 'Collaboration for nationwide digital literacy and 4IR readiness.',
              },
              {
                org: 'AUST School of Business',
                tag: 'MoU Partner',
                tagColor: '#EC4899',
                icon: 'trophy-outline',
                desc: 'Employability & Skills Summit partner for corporate recruitment.',
              },
              {
                org: 'ICMAB & BASIS',
                tag: 'Professional Body',
                tagColor: '#059669',
                icon: 'ribbon-outline',
                desc: 'Chartered accounting & software industry executive skilling partner.',
              },
            ].map((partner, pIdx) => (
              <TouchableOpacity
                key={pIdx}
                style={[styles.partnerCardItem, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}
                onPress={() => {
                  setAboutInitialTab('partners');
                  setAboutModalVisible(true);
                }}
                activeOpacity={0.75}
              >
                <View style={styles.partnerCardItemHeader}>
                  <View style={[styles.partnerItemIconBg, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                    <Ionicons name={partner.icon as any} size={18} color={partner.tagColor} />
                  </View>
                  <View style={[styles.partnerItemTag, { backgroundColor: partner.tagColor + '18' }]}>
                    <Text style={[styles.partnerItemTagText, { color: partner.tagColor }]}>{partner.tag}</Text>
                  </View>
                </View>
                <Text style={[styles.partnerOrgTitle, { color: colors.text }]} numberOfLines={1}>
                  {partner.org}
                </Text>
                <Text style={[styles.partnerOrgDesc, { color: colors.textMuted }]} numberOfLines={2}>
                  {partner.desc}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={[styles.seeAllPartnersBtn, { borderColor: colors.border, backgroundColor: colors.surfaceSubtle }]}
            onPress={() => {
              setAboutInitialTab('partners');
              setAboutModalVisible(true);
            }}
          >
            <Ionicons name="document-text-outline" size={15} color={colors.primary} />
            <Text style={[styles.seeAllPartnersText, { color: colors.primary }]}>
              {isBangla ? 'সকল পার্টনারশিপ, সামিট ও MoU দেখুন →' : 'View All Institutional Partnerships & MoUs →'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Trusted Corporate Clients */}
        <View style={styles.trustSection}>
          <Text style={[styles.trustHeading, { color: colors.textMuted }]}>
            TRUSTED BY PROFESSIONALS ACROSS LEADING CORPORATIONS
          </Text>
          <View style={styles.clientLogosRow}>
            {CORPORATE_CLIENTS.map((client, index) => (
              <View
                key={index}
                style={[
                  styles.clientChip,
                  { backgroundColor: colors.surfaceCard, borderColor: colors.border },
                ]}
              >
                <Ionicons name={client.logo as any} size={14} color={colors.primary} />
                <Text style={[styles.clientName, { color: colors.text }]}>{client.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Enterprise Brand & Legal Footer */}
        <View style={[styles.enterpriseFooter, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
          <View style={styles.footerBrandRow}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.footerLogo}
              resizeMode="contain"
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.footerBrandName, { color: colors.text }]}>Thriving Skills Limited</Text>
              <Text style={[styles.footerTagline, { color: colors.textMuted }]}>
                Next-Gen AI & Career Excellence Platform
              </Text>
            </View>
          </View>

          {/* Quick Legal and Info Actions */}
          <View style={styles.footerLegalLinksRow}>
            <TouchableOpacity
              style={[styles.legalPillBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
              onPress={() => {
                setLegalInitialTab('terms');
                setLegalModalVisible(true);
              }}
            >
              <Text style={[styles.legalPillText, { color: colors.text }]}>Terms & Conditions</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.legalPillBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
              onPress={() => {
                setLegalInitialTab('privacy');
                setLegalModalVisible(true);
              }}
            >
              <Text style={[styles.legalPillText, { color: colors.text }]}>Privacy Policy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.legalPillBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
              onPress={() => {
                setAboutInitialTab('overview');
                setAboutModalVisible(true);
              }}
            >
              <Text style={[styles.legalPillText, { color: colors.text }]}>About TSL</Text>
            </TouchableOpacity>
          </View>

          {/* Contact / Helpline row */}
          <View style={[styles.footerContactRow, { borderTopColor: colors.borderSubtle, borderBottomColor: colors.borderSubtle }]}>
            <TouchableOpacity
              style={styles.footerContactItem}
              onPress={() => Linking.openURL('tel:01312100288').catch(() => {})}
            >
              <Ionicons name="call-outline" size={14} color={colors.primary} />
              <Text style={[styles.footerContactText, { color: colors.primary }]}>01312 100288</Text>
            </TouchableOpacity>

            <View style={[styles.footerDot, { backgroundColor: colors.border }]} />

            <TouchableOpacity
              style={styles.footerContactItem}
              onPress={() => Linking.openURL('mailto:support@thrivingskill.com').catch(() => {})}
            >
              <Ionicons name="mail-outline" size={14} color={colors.textMuted} />
              <Text style={[styles.footerContactText, { color: colors.textMuted }]}>support@thrivingskill.com</Text>
            </TouchableOpacity>

            <View style={[styles.footerDot, { backgroundColor: colors.border }]} />

            <TouchableOpacity
              style={styles.footerContactItem}
              onPress={() => Linking.openURL('https://thrivingskill.com').catch(() => {})}
            >
              <Ionicons name="globe-outline" size={14} color={colors.textMuted} />
              <Text style={[styles.footerContactText, { color: colors.textMuted }]}>thrivingskill.com</Text>
            </TouchableOpacity>
          </View>

          {/* All Rights Reserved Notice */}
          <View style={styles.footerCopyrightBox}>
            <Text style={[styles.copyrightNotice, { color: colors.textMuted }]}>
              © 2026 Thriving Skills Limited (TSL). All Rights Reserved.
            </Text>
            <Text style={[styles.copyrightSubtext, { color: colors.textMuted }]}>
              Gulshan-2, Dhaka-1212, Bangladesh • Registered Company under RJSC • Powered by Gemini AI
            </Text>
          </View>
        </View>
      </ScrollView>

      <CommunityFeedModal
        visible={communityModalVisible}
        onClose={() => setCommunityModalVisible(false)}
      />

      <AboutTSLModal
        visible={aboutModalVisible}
        onClose={() => setAboutModalVisible(false)}
        initialTab={aboutInitialTab}
        onNavigateTab={onNavigateTab}
      />

      <LegalPolicyModal
        visible={legalModalVisible}
        onClose={() => setLegalModalVisible(false)}
        initialTab={legalInitialTab}
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
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
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
    alignItems: 'center',
    justifyContent: 'space-between',
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
