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
import { useTheme } from '../context/ThemeContext';
import { useLearning } from '../context/LearningContext';
import { useSaaS } from '../context/SaaSContext';
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

  // Dynamic slow auto-scroll hook for YouTube videos shelf
  const ytAutoScroll = useAutoScroll({
    speed: 0.45,
    pauseAtEdgeMs: 1800,
    resumeDelayMs: 2800,
  });

  // Find enrolled active course to show "Continue Learning"
  const enrolledCourseIds = Object.keys(userProgress);
  const activeCourseId = enrolledCourseIds[0];
  const activeCourse = courses.find((c) => c.id === activeCourseId);
  const activeProgress = activeCourse ? userProgress[activeCourse.id] : undefined;
  const activeProgressPercent = activeCourse ? getCourseProgressPercentage(activeCourse.id) : 0;

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
        {/* 1. Personalized Greeting Bar & Momentum Capsule */}
        <View style={styles.greetingHeader}>
          <View style={styles.greetingTextCol}>
            <Text style={[styles.greetingTitle, { color: colors.text }]}>
              {isBangla ? 'স্বাগতম, লার্নার 👋' : 'Welcome back, Learner 👋'}
            </Text>
            <Text style={[styles.greetingSubtitle, { color: colors.textMuted }]}>
              {isBangla ? 'আজকে আপনি কোন স্কিল শিখবেন?' : 'What skill will you master today?'}
            </Text>
          </View>

          {/* Compact Momentum Capsule */}
          <View
            style={[
              styles.momentumCapsule,
              {
                backgroundColor: isDark ? colors.surfaceCard : '#FFFFFF',
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.momentumItem}>
              <Text style={styles.flameEmoji}>🔥</Text>
              <Text style={[styles.momentumValue, { color: colors.text }]}>
                {streakDays}d
              </Text>
            </View>
            <View style={[styles.momentumDivider, { backgroundColor: colors.border }]} />
            <View style={styles.momentumItem}>
              <Ionicons name="time" size={13} color={colors.primary} />
              <Text style={[styles.momentumValue, { color: colors.primary }]}>
                {dailyMinutesSpent}m
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

        {/* Trusted Corporate Clients */}
        <View style={styles.trustSection}>
          <Text style={[styles.trustHeading, { color: colors.textMuted }]}>
            TRUSTED BY PROFESSIONALS ACROSS LEADING INSTITUTIONS
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
      </ScrollView>

      <CommunityFeedModal
        visible={communityModalVisible}
        onClose={() => setCommunityModalVisible(false)}
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
  greetingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  greetingTextCol: {
    flex: 1,
    paddingRight: 10,
  },
  greetingTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  greetingSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  momentumCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  momentumItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  flameEmoji: {
    fontSize: 13,
  },
  momentumValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  momentumDivider: {
    width: 1,
    height: 12,
    marginHorizontal: 8,
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
});
