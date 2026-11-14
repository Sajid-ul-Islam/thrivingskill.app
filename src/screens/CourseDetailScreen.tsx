import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  AppState,
  AppStateStatus,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useLearning } from '../context/LearningContext';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { CurriculumAccordion } from '../components/CurriculumAccordion';
import { AnimatedTabContent, SpringPressable, CircularProgressRing, StateView } from '../components/common';
import { PaymentModal } from '../components/PaymentModal';
import { CourseQnATab } from '../components/CourseQnATab';
import { MandatoryReviewModal } from '../components/MandatoryReviewModal';
import { useLanguage } from '../context/LanguageContext';
import { useYouTube } from '../context/YouTubeContext';
import { useFeedback } from '../context/FeedbackContext';
import { findRelatedVideoForCourse } from '../services/youtubeService';
import { CoursesService } from '../services/api/coursesService';
import { Env } from '../config/env';
import { MIN_TOUCH_TARGET } from '../theme/typography';
import { Lesson } from '../types';

interface CourseDetailScreenProps {
  courseId: string;
  onBack: () => void;
  onNavigateToLesson: (courseId: string, lessonId: string) => void;
}

export const CourseDetailScreen: React.FC<CourseDetailScreenProps> = ({
  courseId,
  onBack,
  onNavigateToLesson,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { t, isBangla } = useLanguage();
  const { showToast } = useFeedback();
  const {
    getCourseById,
    loadCourseDetail,
    userProgress,
    enrollInCourse,
    isBookmarked,
    toggleBookmark,
    getCourseProgressPercentage,
    addCourseReview,
    hasReviewedCourse,
    isCertificateUnlocked,
    submitMandatoryCourseReview,
    recordCategoryInteraction,
    refreshCourses,
  } = useLearning();
  const { user, isAuthenticated, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<'curriculum' | 'qna' | 'instructor' | 'reviews'>('curriculum');
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [certPreviewVisible, setCertPreviewVisible] = useState(false);
  const [mandatoryReviewVisible, setMandatoryReviewVisible] = useState(false);
  const [writeReviewModalVisible, setWriteReviewModalVisible] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (courseId) {
      setLoadingDetail(true);
      loadCourseDetail(courseId)
        .catch(() => {})
        .finally(() => {
          if (isMounted) setLoadingDetail(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [courseId]);

  const course = getCourseById(courseId);
  if (!course) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header showBack onBack={onBack} title={isBangla ? 'কোর্সের বিবরণ' : 'Course Details'} />
        <View style={[styles.notFoundCenter, { paddingHorizontal: 20 }]}>
          {loadingDetail ? (
            <StateView
              mode="loading"
              title={isBangla ? 'কোর্সের বিবরণ লোড হচ্ছে…' : 'Loading course details…'}
              message={
                isBangla
                  ? 'কারিকুলাম, মেন্টর তথ্য ও প্রিভিউ লেকচার আনা হচ্ছে।'
                  : 'Fetching curriculum, mentor info, and preview lectures.'
              }
            />
          ) : (
            <StateView
              mode="error"
              title={isBangla ? 'কোর্স পাওয়া যায়নি' : 'Course not found'}
              message={
                isBangla
                  ? 'এই মুহূর্তে কোর্সটি লোড করা সম্ভব হয়নি। অনুগ্রহ করে আবার চেষ্টা করুন বা ক্যাটালগে ফিরে যান।'
                  : "We couldn't load this course right now. Please try again or return to the catalog."
              }
              primaryActionLabel={isBangla ? 'আবার চেষ্টা করুন' : 'Retry'}
              onPrimaryAction={() => loadCourseDetail(courseId).catch(() => {})}
              secondaryActionLabel={isBangla ? 'ফিরে যান' : 'Go Back'}
              onSecondaryAction={onBack}
            />
          )}
        </View>
      </View>
    );
  }

  // Master Admin bypass or verified role handled by useAuth
  const isEnrolled = !!userProgress[course.id];
  const progressPercent = getCourseProgressPercentage(course.id);
  const bookmarked = isBookmarked(course.id);
  const { videos, playVideo } = useYouTube();
  const trailerVideo = findRelatedVideoForCourse(course, videos);
  const isPaidCourse = Boolean((course.priceBdt && course.priceBdt > 0) || (course.price && course.price > 0));

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && !isEnrolled && courseId) {
        refreshCourses().catch(() => {});
      }
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [courseId, isEnrolled, refreshCourses]);

  const discountPercent =
    course.originalPriceBdt && course.priceBdt && course.originalPriceBdt > course.priceBdt
      ? Math.round(((course.originalPriceBdt - course.priceBdt) / course.originalPriceBdt) * 100)
      : course.originalPrice && course.price && course.originalPrice > course.price
      ? Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100)
      : 0;

  useEffect(() => {
    if (course?.category) {
      recordCategoryInteraction(course.category);
    }
  }, [course?.category]);

  const handleSubmitMandatoryReview = (rating: number, feedback: string) => {
    submitMandatoryCourseReview(
      course.id,
      rating,
      feedback,
      user?.displayName || user?.username || 'Executive Graduate',
      'Student'
    );
    setMandatoryReviewVisible(false);
    setCertPreviewVisible(true);
    Alert.alert(
      isBangla ? 'সার্টিফিকেট আনলক হয়েছে! 🎓' : 'Certificate Unlocked! 🎓',
      isBangla
        ? 'আপনার রিভিউ সফলভাবে যুক্ত হয়েছে এবং সার্টিফিকেট আনলক করা হয়েছে।'
        : 'Thank you for your review! Your official verified certificate is now unlocked.'
    );
  };

  const handleEnrollOrResume = () => {
    if (isAdmin) {
      const targetLessonId =
        userProgress[course.id]?.lastAccessedLessonId ||
        course.modules[0]?.lessons[0]?.id ||
        '';
      if (targetLessonId) {
        onNavigateToLesson(course.id, targetLessonId);
      }
      return;
    }
    if (!isEnrolled) {
      if ((course.priceBdt && course.priceBdt > 0) || (course.price && course.price > 0)) {
        setPaymentModalVisible(true);
        return;
      }
      enrollInCourse(course.id);
      if (isAuthenticated) {
        CoursesService.enrollCourse(course.id).catch(() => {});
      }
      Alert.alert(
        isBangla ? 'সফলভাবে ভর্তি সম্পন্ন হয়েছে! 🎉' : 'Enrolled Successfully! 🎉',
        isBangla
          ? `আপনি সফলভাবে "${course.title}" কোর্সে যুক্ত হয়েছেন। চলুন প্রথম লেকচার শুরু করি!`
          : `You have been enrolled in "${course.title}". Let's start the first lesson!`,
        [
          {
            text: isBangla ? 'শেখা শুরু করুন' : 'Start Learning',
            onPress: () => {
              const firstLessonId = course.modules[0]?.lessons[0]?.id;
              if (firstLessonId) onNavigateToLesson(course.id, firstLessonId);
            },
          },
        ]
      );
    } else {
      const targetLessonId =
        userProgress[course.id]?.lastAccessedLessonId ||
        course.modules[0]?.lessons[0]?.id ||
        '';
      onNavigateToLesson(course.id, targetLessonId);
    }
  };

  const handleSelectLesson = (lesson: Lesson) => {
    onNavigateToLesson(course.id, lesson.id);
  };

  const handleSubmitReview = () => {
    if (!reviewComment.trim()) {
      Alert.alert(
        isBangla ? 'রিভিউ আবশ্যক' : 'Review Required',
        isBangla ? 'অনুগ্রহ করে এই কোর্স সম্পর্কে আপনার মতামত লিখুন।' : 'Please share your feedback or experience with this course.'
      );
      return;
    }
    setIsSubmittingReview(true);
    addCourseReview(course.id, {
      userName: user?.displayName || user?.username || 'Executive Learner',
      userAvatar:
        user?.avatar ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      rating: reviewRating,
      comment: reviewComment.trim(),
      userRole: isEnrolled ? 'Enrolled Student' : 'Verified Learner',
      company: 'Corporate Professional',
    });
    setIsSubmittingReview(false);
    setWriteReviewModalVisible(false);
    setReviewComment('');
    Alert.alert(
      isBangla ? 'রিভিউ জমা দেওয়া হয়েছে! 🌟' : 'Review Submitted! 🌟',
      isBangla
        ? 'আপনার রেটিং এবং মতামতের জন্য ধন্যবাদ। এটি অন্য শিক্ষার্থীদের সঠিক সিদ্ধান্ত নিতে সহায়তা করবে।'
        : 'Thank you for your rating and review. Your feedback helps fellow executives make informed learning decisions.'
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        showBack
        onBack={onBack}
        title={isBangla ? 'কোর্স বিবরণ' : 'Course Overview'}
        rightAction={
          <TouchableOpacity
            style={[styles.headerBookmark, { backgroundColor: colors.surfaceSubtle }]}
            onPress={() => {
              const wasBookmarked = bookmarked;
              toggleBookmark(course.id);
              showToast({
                message: wasBookmarked
                  ? (isBangla ? 'সংরক্ষিত তালিকা থেকে সরানো হয়েছে' : 'Removed from Saved')
                  : (isBangla ? 'কোর্সটি সংরক্ষণ করা হয়েছে' : 'Saved course to My Hub'),
                type: wasBookmarked ? 'info' : 'success',
                actionLabel: wasBookmarked ? (isBangla ? 'পূর্বাবস্থায়' : 'Undo') : undefined,
                onAction: wasBookmarked ? () => toggleBookmark(course.id) : undefined,
              });
            }}
            accessibilityRole="button"
            accessibilityLabel={bookmarked ? (isBangla ? 'বুকমার্ক সরান' : 'Remove bookmark') : (isBangla ? 'কোর্স বুকমার্ক করুন' : 'Save course bookmark')}
          >
            <Ionicons
              name={bookmarked ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={bookmarked ? colors.primary : colors.text}
            />
          </TouchableOpacity>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 12) + 100 }]}>
        {/* Thumbnail Hero with Preview Button */}
        <View style={styles.heroWrapper}>
          <Image source={{ uri: course.thumbnail }} style={styles.heroThumbnail} />
          {course.badge && (
            <View style={[styles.badgeTag, { backgroundColor: colors.badgeBackground }]}>
              <Text style={[styles.badgeText, { color: colors.badgeText }]}>{course.badge}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.previewPlayBtn, { backgroundColor: 'rgba(0,0,0,0.7)' }]}
            onPress={() => {
              if (isEnrolled || isAdmin) {
                handleEnrollOrResume();
                return;
              }
              if (trailerVideo) {
                playVideo(trailerVideo, 'modal');
                return;
              }
              const previewLesson = course.modules[0]?.lessons.find((l) => l.isFreePreview);
              if (previewLesson) {
                onNavigateToLesson(course.id, previewLesson.id);
              } else {
                handleEnrollOrResume();
              }
            }}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={
              isEnrolled || isAdmin
                ? 'Resume course lecture'
                : trailerVideo
                ? 'Watch Video Trailer'
                : 'Watch Free Preview'
            }
          >
            <Ionicons name="play" size={28} color="#FFFFFF" />
            <Text style={styles.previewBtnText}>
              {isEnrolled || isAdmin
                ? (isBangla ? 'কোর্স শুরু / চালিয়ে যান' : 'Resume Course')
                : trailerVideo
                ? (isBangla ? 'ট্রেইলার ভিডিও দেখুন' : 'Watch Video Trailer')
                : (isBangla ? 'ফ্রি প্রিভিউ দেখুন' : 'Watch Free Preview')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Course Video Trailer Banner */}
        {trailerVideo && (
          <TouchableOpacity
            style={[
              styles.trailerCard,
              {
                backgroundColor: isDark ? '#1F2937' : '#EFF6FF',
                borderColor: isDark ? '#374151' : '#BFDBFE',
              },
            ]}
            onPress={() => playVideo(trailerVideo, 'modal')}
            activeOpacity={0.88}
          >
            <View style={styles.trailerThumbWrapper}>
              <Image source={{ uri: trailerVideo.thumbnail }} style={styles.trailerThumb} />
              <View style={styles.trailerPlayOverlay}>
                <Ionicons name="play" size={14} color="#FFFFFF" />
              </View>
            </View>
            <View style={styles.trailerInfo}>
              <View style={styles.trailerBadgeRow}>
                <View style={styles.trailerBadge}>
                  <Ionicons name="logo-youtube" size={12} color="#FF0000" />
                  <Text style={styles.trailerBadgeText}>
                    {isBangla ? 'ফ্রি কোর্স ট্রেইলার' : 'FREE COURSE TRAILER'}
                  </Text>
                </View>
                {trailerVideo.duration ? (
                  <Text style={[styles.trailerDuration, { color: colors.textMuted }]}>
                    {trailerVideo.duration}
                  </Text>
                ) : null}
              </View>
              <Text style={[styles.trailerTitle, { color: colors.text }]} numberOfLines={1}>
                {trailerVideo.title}
              </Text>
              <Text style={[styles.trailerPrompt, { color: colors.primary }]}>
                {isBangla ? 'মেন্টরের পরিচিতি ভিডিও দেখুন →' : 'Watch free mentor overview →'}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Content Header */}
        <View style={styles.mainInfo}>
          <Text style={[styles.courseTitle, { color: colors.text }]}>{course.title}</Text>
          <Text style={[styles.courseSubtitle, { color: colors.textMuted }]}>
            {course.subtitle}
          </Text>

          {/* Stats Bar */}
          <View style={[styles.statsBar, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
            <View style={styles.statCell}>
              <Ionicons name="star" size={16} color={colors.starColor} />
              <Text style={[styles.statValue, { color: colors.text }]} numberOfLines={1}>{course.rating}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]} numberOfLines={1}>({course.reviewsCount})</Text>
            </View>

            <View style={[styles.statDivider, { backgroundColor: colors.borderSubtle }]} />

            <View style={styles.statCell}>
              <Ionicons name="people-outline" size={16} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.text }]} numberOfLines={1}>
                {course.enrolledCount.toLocaleString()}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]} numberOfLines={1}>
                {isBangla ? 'এনরোল্ড' : 'Enrolled'}
              </Text>
            </View>

            <View style={[styles.statDivider, { backgroundColor: colors.borderSubtle }]} />

            <View style={styles.statCell}>
              <Ionicons name="time-outline" size={16} color={colors.secondary} />
              <Text style={[styles.statValue, { color: colors.text }]} numberOfLines={1}>
                {course.durationHours}h
              </Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]} numberOfLines={1}>
                {isBangla ? 'মোট' : 'Total'}
              </Text>
            </View>
          </View>

          {/* Highlights */}
          <View style={[styles.highlightsCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
            <Text style={[styles.highlightsHeading, { color: colors.text }]}>
              {isBangla ? 'যা যা শিখবেন' : "What You'll Master"}
            </Text>
            <View style={styles.highlightsList}>
              {course.highlights.map((item, idx) => (
                <View key={idx} style={styles.highlightRow}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                  <Text style={[styles.highlightText, { color: colors.text }]}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Institutional Trust & Partners Strip */}
          <View style={[styles.trustStripCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Ionicons name="shield-checkmark" size={15} color={colors.primary} />
              <Text style={[styles.trustStripTitle, { color: colors.primary }]}>
                {isBangla ? 'শীর্ষ অ্যাকাডেমিক ও কর্পোরেট পার্টনারদের আস্থা' : 'TRUSTED BY TOP ACADEMIC & ENTERPRISE PARTNERS'}
              </Text>
            </View>

            <View style={styles.partnerLogosRow}>
              <View style={[styles.partnerTag, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
                <Ionicons name="school-outline" size={13} color={colors.text} />
                <Text style={[styles.partnerTagText, { color: colors.text }]}>Dhaka University (DU)</Text>
              </View>
              <View style={[styles.partnerTag, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
                <Ionicons name="people-outline" size={13} color={colors.text} />
                <Text style={[styles.partnerTagText, { color: colors.text }]}>DUCSU</Text>
              </View>
              <View style={[styles.partnerTag, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
                <Ionicons name="library-outline" size={13} color={colors.text} />
                <Text style={[styles.partnerTagText, { color: colors.text }]}>North South Univ (NSU)</Text>
              </View>
            </View>

            <View style={styles.trustFeaturesRow}>
              <View style={styles.trustFeatureItem}>
                <Ionicons name="infinite-outline" size={13} color={colors.secondary} />
                <Text style={[styles.trustFeatureText, { color: colors.textMuted }]}>
                  {isBangla ? 'আজীবন অ্যাক্সেস' : 'Lifetime Access'}
                </Text>
              </View>
              <View style={styles.trustFeatureItem}>
                <Ionicons name="phone-portrait-outline" size={13} color={colors.primary} />
                <Text style={[styles.trustFeatureText, { color: colors.textMuted }]}>
                  {isBangla ? 'মোবাইল ও ওয়েব' : 'Mobile & Web'}
                </Text>
              </View>
              <View style={styles.trustFeatureItem}>
                <Ionicons name="ribbon-outline" size={13} color="#10B981" />
                <Text style={[styles.trustFeatureText, { color: colors.textMuted }]}>
                  {isBangla ? 'ভেরিফাইড সার্টিফিকেট' : 'Verified Credential'}
                </Text>
              </View>
            </View>
          </View>

          {/* Official Certificate Card & Preview Trigger */}
          <View style={[styles.certPromoCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
            <View style={styles.certPromoLeft}>
              <View style={[styles.certIconBg, { backgroundColor: isDark ? 'rgba(217, 119, 6, 0.2)' : '#FEF3C7' }]}>
                <Ionicons name="ribbon" size={20} color={isDark ? '#FBBF24' : '#D97706'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.certPromoTitle, { color: colors.text }]}>
                  {isBangla ? 'অফিসিয়াল সার্টিফিকেট অন্তর্ভুক্ত' : 'Official Certificate Included'}
                </Text>
                <Text style={[styles.certPromoSub, { color: colors.textMuted }]}>
                  {isBangla
                    ? 'ভেরিফাইড ডিজিটাল ক্রেডেনশিয়াল যা সরাসরি লিঙ্কডইনে শেয়ারযোগ্য।'
                    : 'Verified digital credential directly shareable to LinkedIn.'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.certPreviewBtn,
                {
                  backgroundColor:
                    userProgress[course.id]?.isCompleted && !hasReviewedCourse(course.id)
                      ? '#FEF2F2'
                      : colors.surfaceSubtle,
                  borderColor:
                    userProgress[course.id]?.isCompleted && !hasReviewedCourse(course.id)
                      ? '#EF4444'
                      : colors.border,
                },
              ]}
              onPress={() => {
                if (userProgress[course.id]?.isCompleted && !hasReviewedCourse(course.id)) {
                  setMandatoryReviewVisible(true);
                } else {
                  setCertPreviewVisible(true);
                }
              }}
              accessibilityRole="button"
              accessibilityLabel={
                isBangla ? 'সার্টিফিকেট প্রিভিউ অথবা আনলক করতে রিভিউ' : 'Certificate preview or review to unlock'
              }
            >
              <Ionicons
                name={
                  userProgress[course.id]?.isCompleted && !hasReviewedCourse(course.id)
                    ? 'lock-closed'
                    : 'ribbon-outline'
                }
                size={14}
                color={
                  userProgress[course.id]?.isCompleted && !hasReviewedCourse(course.id)
                    ? '#EF4444'
                    : colors.primary
                }
              />
              <Text
                style={[
                  styles.certPreviewBtnText,
                  {
                    color:
                      userProgress[course.id]?.isCompleted && !hasReviewedCourse(course.id)
                        ? '#EF4444'
                        : colors.primary,
                  },
                ]}
              >
                {userProgress[course.id]?.isCompleted
                  ? hasReviewedCourse(course.id)
                    ? isBangla
                      ? 'সার্টিফিকেট'
                      : 'Certificate'
                    : isBangla
                    ? 'লক (রিভিউ দিন)'
                    : 'Review to Unlock'
                  : isBangla
                  ? 'প্রিভিউ'
                  : 'Preview'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Navigation Tabs (Curriculum / Q&A / Instructor / Reviews) */}
          <View style={[styles.tabsBar, { borderBottomColor: colors.border }]} accessibilityRole="tablist">
            {[
              {
                id: 'curriculum',
                label: isBangla
                  ? `কারিকুলাম (${course.modules.length})`
                  : `Curriculum (${course.modules.length})`,
              },
              { id: 'qna', label: isBangla ? 'প্রশ্নোত্তর ফোরাম' : 'Q&A Forum' },
              { id: 'instructor', label: isBangla ? 'মেন্টর' : 'Instructor' },
              {
                id: 'reviews',
                label: isBangla
                  ? `রিভিউ (${course.reviews.length})`
                  : `Reviews (${course.reviews.length})`,
              },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.tabItem,
                    isActive && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
                  ]}
                  onPress={() => setActiveTab(tab.id as any)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={tab.label}
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
          </View>

          {/* Tab Content */}
          <AnimatedTabContent tabKey={activeTab}>
          {activeTab === 'curriculum' && (
            <View style={styles.curriculumTab}>
              <CurriculumAccordion
                courseId={course.id}
                modules={course.modules}
                isEnrolled={isEnrolled}
                isAdmin={isAdmin}
                onSelectLesson={handleSelectLesson}
              />
            </View>
          )}

          {activeTab === 'qna' && (
            <CourseQnATab courseId={course.id} />
          )}

          {activeTab === 'instructor' && (
            <View
              style={[
                styles.instructorCard,
                { backgroundColor: colors.surfaceCard, borderColor: colors.border },
              ]}
            >
              <View style={styles.instructorHeader}>
                <Image source={{ uri: course.instructor.avatar }} style={styles.instructorAvatar} />
                <View style={styles.instructorMeta}>
                  <Text style={[styles.instructorName, { color: colors.text }]}>
                    {course.instructor.name}
                  </Text>
                  <Text style={[styles.instructorTitle, { color: colors.primary }]}>
                    {course.instructor.title}
                  </Text>
                  <Text style={[styles.instructorCompany, { color: colors.textMuted }]}>
                    {course.instructor.company}
                  </Text>
                </View>
              </View>

              <Text style={[styles.instructorBio, { color: colors.text }]}>
                {course.instructor.bio}
              </Text>

              <View style={[styles.instructorStats, { backgroundColor: colors.surfaceSubtle }]}>
                <View style={styles.instStatItem}>
                  <Text style={[styles.instStatVal, { color: colors.text }]}>
                    {course.instructor.rating}
                  </Text>
                  <Text style={[styles.instStatLbl, { color: colors.textMuted }]}>Rating</Text>
                </View>
                <View style={styles.instStatItem}>
                  <Text style={[styles.instStatVal, { color: colors.text }]}>
                    {course.instructor.studentsCount.toLocaleString()}
                  </Text>
                  <Text style={[styles.instStatLbl, { color: colors.textMuted }]}>Students</Text>
                </View>
                <View style={styles.instStatItem}>
                  <Text style={[styles.instStatVal, { color: colors.text }]}>
                    {course.instructor.coursesCount}
                  </Text>
                  <Text style={[styles.instStatLbl, { color: colors.textMuted }]}>Courses</Text>
                </View>
              </View>
            </View>
          )}

          {activeTab === 'reviews' && (
            <View style={styles.reviewsTab}>
              {/* Write a Review Button */}
              <TouchableOpacity
                style={[
                  styles.writeReviewCTA,
                  { backgroundColor: colors.primaryLight, borderColor: colors.primary },
                ]}
                onPress={() => setWriteReviewModalVisible(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="star" size={16} color={colors.primary} />
                <Text style={[styles.writeReviewCTAText, { color: colors.primary }]}>
                  {isBangla ? 'আপনার মূল্যবান রিভিউ ও রেটিং দিন ★' : 'Rate & Write a Review ★'}
                </Text>
              </TouchableOpacity>

              {course.reviews.length === 0 ? (
                <Text style={[styles.noReviews, { color: colors.textMuted }]}>
                  No reviews yet for this cohort.
                </Text>
              ) : (
                course.reviews.map((rev) => (
                  <View
                    key={rev.id}
                    style={[
                      styles.reviewCard,
                      { backgroundColor: colors.surfaceCard, borderColor: colors.border },
                    ]}
                  >
                    <View style={styles.reviewTop}>
                      <Image source={{ uri: rev.userAvatar }} style={styles.reviewAvatar} />
                      <View style={styles.reviewMeta}>
                        <Text style={[styles.reviewUser, { color: colors.text }]}>
                          {rev.userName}
                        </Text>
                        <Text style={[styles.reviewRole, { color: colors.textMuted }]}>
                          {rev.userRole}
                        </Text>
                      </View>
                      <View style={styles.ratingStars}>
                        <Ionicons name="star" size={14} color={colors.starColor} />
                        <Text style={[styles.ratingValText, { color: colors.text }]}>
                          {rev.rating}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.reviewComment, { color: colors.text }]}>{rev.comment}</Text>
                  </View>
                ))
              )}
            </View>
          )}
          </AnimatedTabContent>
        </View>
      </ScrollView>

      {/* Sticky Bottom Enrollment Bar */}
      <View
        style={[
          styles.bottomEnrollBar,
          {
            backgroundColor: colors.surfaceCard,
            borderTopColor: colors.border,
            shadowColor: colors.cardShadow,
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}>
        {isAdmin ? (
          <View style={styles.bottomPriceCol}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="shield-checkmark" size={14} color="#D97706" />
              <Text style={[styles.bottomPriceLabel, { color: '#D97706', fontWeight: '800' }]}>
                {isBangla ? 'অ্যাডমিন অ্যাক্সেস' : 'ADMIN ACCESS'}
              </Text>
            </View>
            <Text style={[styles.enrolledStatus, { color: colors.textMuted }]}>
              {isBangla ? 'সকল লেকচার আনলক করা হয়েছে' : 'All course videos unlocked'}
            </Text>
          </View>
        ) : !isEnrolled ? (
          <View style={styles.bottomPriceCol}>
            <View style={styles.priceRow}>
              <Text style={[styles.bottomPrice, { color: colors.primary }]} numberOfLines={1}>
                {isPaidCourse
                  ? (isBangla ? 'সদস্য অ্যাক্সেস' : 'Member Access')
                  : (isBangla ? 'বিনামূল্যে' : 'Free Course')}
              </Text>
            </View>
            <Text style={[styles.bottomPriceLabel, { color: colors.textMuted }]} numberOfLines={1} ellipsizeMode="tail">
              {isBangla ? 'লাইফটাইম অ্যাক্সেস • সার্টিফিকেট' : 'Lifetime Access • Certificate'}
            </Text>
          </View>
        ) : (
          <View style={styles.bottomPriceCol}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <CircularProgressRing
                progress={progressPercent}
                size={34}
                strokeWidth={3.5}
                progressColor={colors.primary}
                trackColor={colors.surfaceSubtle}
                textSize={9}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.bottomPriceLabel, { color: colors.primary, fontWeight: '700' }]} numberOfLines={1}>
                  {isBangla ? `এনরোল্ড (${progressPercent}%)` : `Enrolled (${progressPercent}%)`}
                </Text>
                <Text style={[styles.enrolledStatus, { color: colors.textMuted }]}>
                  {userProgress[course.id]?.isCompleted
                    ? (isBangla ? 'সম্পন্ন 🎓' : 'Completed 🎓')
                    : (isBangla ? 'চলমান ⏳' : 'In Progress ⏳')}
                </Text>
              </View>
            </View>
          </View>
        )}

        <SpringPressable
          activeScale={0.96}
          style={[
          styles.enrollCTAButton,
          {
            backgroundColor: isAdmin
              ? '#102F53'
              : isEnrolled
              ? colors.primary
              : isPaidCourse
              ? '#FFB606'
              : colors.primary,
          },
        ]}
          onPress={handleEnrollOrResume}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel={
            isEnrolled
              ? (isBangla ? 'লেসনে যান' : 'Resume Course')
              : isPaidCourse
              ? (isBangla ? 'অ্যাকাউন্ট অ্যাক্সেস সিঙ্ক করুন' : 'Sync Member Access')
              : (isBangla ? 'বিনামূল্যে ভর্তি হন' : 'Enroll for Free')
          }
        >
          <Ionicons
            name={isAdmin ? 'play-circle' : isEnrolled ? 'play' : isPaidCourse ? 'sync' : 'flash'}
            size={18}
            color={isAdmin ? '#FFFFFF' : !isEnrolled && isPaidCourse ? '#102F53' : colors.onPrimary}
          />
          <Text
            style={[
              styles.enrollCTAText,
              {
                color: isAdmin ? '#FFFFFF' : !isEnrolled && isPaidCourse ? '#102F53' : colors.onPrimary,
                fontWeight: !isEnrolled && isPaidCourse ? '800' : '700',
              },
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {isAdmin
              ? (isBangla ? 'কোর্স ভিডিও দেখুন' : 'Play Course (Admin)')
              : isEnrolled
              ? (isBangla ? 'লেসনে যান' : 'Resume Course')
              : isPaidCourse
              ? (isBangla ? 'অ্যাক্সেস সিঙ্ক করুন' : 'Sync Access')
              : (isBangla ? 'বিনামূল্যে ভর্তি হন' : 'Enroll for Free')}
          </Text>
        </SpringPressable>
      </View>

      {/* CR-02: Mandatory Course Review Modal before Certificate Unlock */}
      <MandatoryReviewModal
        visible={mandatoryReviewVisible}
        courseTitle={course.title}
        instructorName={course.instructor.name}
        onSubmit={handleSubmitMandatoryReview}
        onDismissLater={() => setMandatoryReviewVisible(false)}
      />

      {/* Local Payment Gateway Modal */}
      <PaymentModal
        visible={paymentModalVisible}
        course={course}
        onClose={() => setPaymentModalVisible(false)}
        onSuccess={(cId) => {
          enrollInCourse(cId);
          const firstLessonId = course.modules[0]?.lessons[0]?.id;
          if (firstLessonId) onNavigateToLesson(course.id, firstLessonId);
        }}
      />

      {/* Interactive Official Certificate Preview Modal */}
      <Modal
        visible={certPreviewVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCertPreviewVisible(false)}
      >
        <View style={styles.certModalOverlay}>
          <View style={[styles.certModalCard, { backgroundColor: isDark ? '#1C1D22' : '#FFFDF9' }]}>
            {/* Modal Header */}
            <View style={styles.certModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="shield-checkmark" size={18} color="#D97706" />
                <Text style={[styles.certModalTitle, { color: colors.text }]}>Official Certificate Preview</Text>
              </View>
              <TouchableOpacity
                onPress={() => setCertPreviewVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* The Certificate Canvas */}
              <View style={[styles.certCanvas, { borderColor: '#D4AF37', backgroundColor: isDark ? '#121316' : '#FFFFFF' }]}>
                {/* Gold Inner Border */}
                <View style={[styles.certInnerBorder, { borderColor: '#D4AF37' }]}>
                  {/* Top Seal & Organization Header */}
                  <View style={styles.certCanvasHeader}>
                    <Image
                      source={require('../../assets/icon.png')}
                      style={{ width: 34, height: 34, borderRadius: 8, marginBottom: 4 }}
                      resizeMode="contain"
                    />
                    <Text style={[styles.certOrgName, { color: colors.text }]}>
                      THRIVING SKILLS LIMITED
                    </Text>
                    <Text style={[styles.certOrgLoc, { color: colors.textMuted }]}>
                      DHAKA, BANGLADESH • SDG-4 QUALITY EDUCATION
                    </Text>
                  </View>

                  <View style={styles.certRibbonRow}>
                    <View style={styles.certLine} />
                    <Text style={styles.certMainHeading}>CERTIFICATE OF ACHIEVEMENT</Text>
                    <View style={styles.certLine} />
                  </View>

                  <Text style={[styles.certPresentedTo, { color: colors.textMuted }]}>
                    THIS IS PROUDLY PRESENTED TO
                  </Text>

                  <Text style={[styles.certLearnerName, { color: colors.text }]}>
                    {user?.displayName || user?.username || 'Executive Graduate'}
                  </Text>
                  <View style={[styles.nameUnderline, { backgroundColor: '#D4AF37' }]} />

                  <Text style={[styles.certBodyText, { color: colors.textMuted }]}>
                    for successfully mastering all curriculum modules and professional competencies in
                  </Text>

                  <Text style={[styles.certCourseName, { color: colors.primary }]}>
                    {course.title}
                  </Text>

                  {/* Verification Seal & Credential ID */}
                  <View style={styles.certMetaRow}>
                    <View style={styles.certQrBox}>
                      <Ionicons name="qr-code-outline" size={34} color={colors.text} />
                      <Text style={[styles.certVerifyText, { color: colors.textMuted }]}>Scan to Verify</Text>
                    </View>

                    <View style={styles.certGoldSeal}>
                      <Ionicons name="medal" size={20} color="#D97706" />
                      <Text style={styles.certSealText}>VERIFIED</Text>
                      <Text style={styles.certSealSub}>CREDENTIAL</Text>
                    </View>

                    <View style={styles.certSigCol}>
                      <Text style={styles.sigCursive}>Abdullah Al Mahmud</Text>
                      <View style={[styles.sigLine, { backgroundColor: colors.border }]} />
                      <Text style={[styles.sigTitle, { color: colors.textMuted }]}>
                        Md. Abdullah Al Mahmud
                      </Text>
                      <Text style={[styles.sigSub, { color: colors.textMuted }]}>
                        CEO, Thriving Skills Ltd.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.certIdRow}>
                    <Text style={[styles.certIdText, { color: colors.textMuted }]}>
                      Credential ID: TSL-CERT-{course.id}-2026 • thrivingskill.com/verify
                    </Text>
                  </View>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.certModalActions}>
                <TouchableOpacity
                  style={[styles.certShareBtn, { backgroundColor: '#0A66C2' }]}
                  onPress={() => {
                    const now = new Date();
                    const certId = `TSL-CERT-${course.id}-2026`;
                    const verifyUrl = `${Env.SITE_URL.replace(/\/+$/, '')}/verify/${certId}`;
                    const linkedinUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(
                      course.title
                    )}&organizationName=${encodeURIComponent('Thriving Skills')}&issueYear=${now.getFullYear()}&issueMonth=${
                      now.getMonth() + 1
                    }&certUrl=${encodeURIComponent(verifyUrl)}&certId=${encodeURIComponent(certId)}`;
                    Linking.openURL(linkedinUrl).catch(() => {
                      Alert.alert('LinkedIn Credential 🔗', `Visit ${verifyUrl} to verify or share credential #${certId}.`);
                    });
                  }}
                >
                  <Ionicons name="logo-linkedin" size={16} color="#FFFFFF" />
                  <Text style={styles.certShareBtnText}>Add to LinkedIn Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.certCloseBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
                  onPress={() => setCertPreviewVisible(false)}
                >
                  <Text style={[styles.certCloseBtnText, { color: colors.text }]}>Close Preview</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Interactive Write a Review Modal */}
      <Modal
        visible={writeReviewModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setWriteReviewModalVisible(false)}
      >
        <View style={styles.reviewModalOverlay}>
          <View style={[styles.reviewModalCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
            <View style={styles.reviewModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="star" size={20} color="#F59E0B" />
                <Text style={[styles.reviewModalTitle, { color: colors.text }]}>
                  {isBangla ? 'কোর্স রেটিং ও রিভিউ' : 'Rate & Review Course'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setWriteReviewModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.reviewCourseTitle, { color: colors.text }]}>
                {course.title}
              </Text>
              <Text style={[styles.reviewModalSub, { color: colors.textMuted }]}>
                {isBangla
                  ? 'আপনার অভিজ্ঞতার ওপর ভিত্তি করে রেটিং এবং মূল্যবান মতামত শেয়ার করুন।'
                  : 'Select your rating score and write your genuine learning experience.'}
              </Text>

              {/* Star Rating Selector */}
              <View style={styles.starsSelectorRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setReviewRating(star)}
                    style={styles.starTouch}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={star <= reviewRating ? 'star' : 'star-outline'}
                      size={32}
                      color="#F59E0B"
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[styles.ratingFeedbackLabel, { color: colors.primary }]}>
                {reviewRating === 5
                  ? '★★★★★ Outstanding / 5.0'
                  : reviewRating === 4
                  ? '★★★★ Very Good / 4.0'
                  : reviewRating === 3
                  ? '★★★ Good / 3.0'
                  : reviewRating === 2
                  ? '★★ Fair / 2.0'
                  : '★ Needs Improvement / 1.0'}
              </Text>

              {/* Comment Input */}
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                {isBangla ? 'আপনার রিভিউ লিখুন' : 'Your Detailed Feedback'}
              </Text>
              <TextInput
                style={[
                  styles.reviewTextInput,
                  {
                    backgroundColor: colors.surfaceSubtle,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder={
                  isBangla
                    ? 'কোর্স কনটেন্ট, ইন্সট্রাক্টরের দক্ষতা ও আপনার অর্জিত অভিজ্ঞতা সম্পর্কে লিখুন...'
                    : 'Share how this masterclass improved your executive skillset and workplace productivity...'
                }
                placeholderTextColor={colors.textMuted}
                value={reviewComment}
                onChangeText={setReviewComment}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              {/* Actions */}
              <View style={styles.reviewModalActions}>
                <TouchableOpacity
                  style={[styles.submitReviewBtn, { backgroundColor: colors.primary }]}
                  onPress={handleSubmitReview}
                  disabled={isSubmittingReview}
                  activeOpacity={0.88}
                >
                  <Ionicons name="checkmark-circle" size={18} color={colors.onPrimary} />
                  <Text style={[styles.submitReviewBtnText, { color: colors.onPrimary }]}>
                    {isBangla ? 'রিভিউ সাবমিট করুন' : 'Submit Review'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.cancelReviewBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
                  onPress={() => setWriteReviewModalVisible(false)}
                >
                  <Text style={[styles.cancelReviewBtnText, { color: colors.textMuted }]}>
                    {isBangla ? 'বাতিল' : 'Cancel'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  notFoundCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBookmark: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroWrapper: {
    height: 220,
    position: 'relative',
  },
  heroThumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  badgeTag: {
    position: 'absolute',
    top: 14,
    left: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  previewPlayBtn: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  previewBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  trailerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  trailerThumbWrapper: {
    width: 68,
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000',
  },
  trailerThumb: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  trailerPlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trailerInfo: {
    flex: 1,
  },
  trailerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  trailerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trailerBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FF0000',
    letterSpacing: 0.5,
  },
  trailerDuration: {
    fontSize: 10,
    fontWeight: '600',
  },
  trailerTitle: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
  },
  trailerPrompt: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  mainInfo: {
    padding: 16,
  },
  courseTitle: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
    marginBottom: 6,
  },
  courseSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  statCell: {
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  highlightsCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  highlightsHeading: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  highlightsList: {
    gap: 8,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  highlightText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  tabsBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  tabItem: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    paddingVertical: 10,
    marginRight: 16,
  },
  tabLabel: {
    fontSize: 13,
  },
  curriculumTab: {
    marginTop: 4,
  },
  instructorCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  instructorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  instructorAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  instructorMeta: {
    flex: 1,
  },
  instructorName: {
    fontSize: 15,
    fontWeight: '700',
  },
  instructorTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  instructorCompany: {
    fontSize: 11,
    marginTop: 1,
  },
  instructorBio: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  instructorStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    borderRadius: 10,
  },
  instStatItem: {
    alignItems: 'center',
  },
  instStatVal: {
    fontSize: 14,
    fontWeight: '700',
  },
  instStatLbl: {
    fontSize: 11,
  },
  reviewsTab: {
    gap: 12,
  },
  noReviews: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 20,
  },
  reviewCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  reviewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  reviewMeta: {
    flex: 1,
  },
  reviewUser: {
    fontSize: 13,
    fontWeight: '700',
  },
  reviewRole: {
    fontSize: 11,
  },
  ratingStars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingValText: {
    fontSize: 13,
    fontWeight: '700',
  },
  reviewComment: {
    fontSize: 13,
    lineHeight: 18,
  },
  bottomEnrollBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    gap: 8,
  },
  bottomPriceCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  bottomPriceLabel: {
    fontSize: 10.5,
    textTransform: 'uppercase',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
    flexWrap: 'wrap',
  },
  bottomPrice: {
    fontSize: 19,
    fontWeight: '800',
  },
  bottomOriginalPrice: {
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  detailDiscountTag: {
    backgroundColor: '#E34234',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 2,
  },
  detailDiscountText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  enrolledStatus: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  enrollCTAButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    flexShrink: 0,
    maxWidth: '56%',
  },
  enrollCTAText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
    flexShrink: 1,
  },
  // Trust Strip
  trustStripCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginTop: 12,
  },
  trustStripTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  partnerLogosRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  partnerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  partnerTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  trustFeaturesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
    paddingTop: 8,
  },
  trustFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trustFeatureText: {
    fontSize: 11,
    fontWeight: '500',
  },
  // Certificate Card Promo
  certPromoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginTop: 12,
    gap: 10,
  },
  certPromoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  certIconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  certPromoTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  certPromoSub: {
    fontSize: 10.5,
    marginTop: 2,
    lineHeight: 14,
  },
  certPreviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  certPreviewBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  // Certificate Modal & Canvas
  certModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    padding: 14,
  },
  certModalCard: {
    borderRadius: 20,
    padding: 16,
    maxHeight: '92%',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  certModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  certModalTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  certCanvas: {
    borderRadius: 12,
    borderWidth: 3,
    padding: 6,
    marginVertical: 4,
  },
  certInnerBorder: {
    borderWidth: 1.5,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  certCanvasHeader: {
    alignItems: 'center',
    marginBottom: 10,
  },
  certOrgName: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
  certOrgLoc: {
    fontSize: 8.5,
    fontWeight: '600',
    marginTop: 1,
    letterSpacing: 0.5,
  },
  certRibbonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 8,
    width: '100%',
  },
  certLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D4AF37',
  },
  certMainHeading: {
    fontSize: 10,
    fontWeight: '900',
    color: '#D4AF37',
    letterSpacing: 1.2,
  },
  certPresentedTo: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 4,
  },
  certLearnerName: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4,
    textAlign: 'center',
  },
  nameUnderline: {
    width: 140,
    height: 1.5,
    marginVertical: 4,
  },
  certBodyText: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 14,
    paddingHorizontal: 8,
  },
  certCourseName: {
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
    marginVertical: 6,
  },
  certMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(212, 175, 55, 0.4)',
  },
  certQrBox: {
    alignItems: 'center',
  },
  certVerifyText: {
    fontSize: 7.5,
    marginTop: 2,
    fontWeight: '600',
  },
  certGoldSeal: {
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  certSealText: {
    fontSize: 6.5,
    fontWeight: '900',
    color: '#D97706',
  },
  certSealSub: {
    fontSize: 5.5,
    fontWeight: '800',
    color: '#D97706',
  },
  certSigCol: {
    alignItems: 'center',
  },
  sigCursive: {
    fontSize: 12,
    fontStyle: 'italic',
    fontWeight: '700',
    color: '#3B82F6',
  },
  sigLine: {
    width: 90,
    height: 1,
    marginVertical: 2,
  },
  sigTitle: {
    fontSize: 8.5,
    fontWeight: '700',
  },
  sigSub: {
    fontSize: 7.5,
  },
  certIdRow: {
    marginTop: 10,
  },
  certIdText: {
    fontSize: 8,
    fontWeight: '500',
  },
  certModalActions: {
    marginTop: 14,
    gap: 8,
  },
  certShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  certShareBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  certCloseBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  certCloseBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  writeReviewCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 16,
    gap: 8,
  },
  writeReviewCTAText: {
    fontSize: 13,
    fontWeight: '800',
  },
  reviewModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  reviewModalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    padding: 20,
    maxHeight: '85%',
  },
  reviewModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  reviewModalTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  reviewCourseTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  reviewModalSub: {
    fontSize: 12,
    marginBottom: 16,
    lineHeight: 18,
  },
  starsSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 10,
  },
  starTouch: {
    padding: 4,
  },
  ratingFeedbackLabel: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  reviewTextInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 13,
    minHeight: 90,
    marginBottom: 18,
  },
  reviewModalActions: {
    gap: 8,
    marginBottom: 16,
  },
  submitReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    gap: 8,
  },
  submitReviewBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  cancelReviewBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
  },
  cancelReviewBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
