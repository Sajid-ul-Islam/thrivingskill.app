import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  AppState,
  AppStateStatus,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useLearning } from '../context/LearningContext';
import { useAuth } from '../context/AuthContext';
import {
  Header,
  CurriculumAccordion,
  PaymentModal,
  CourseQnATab,
  MandatoryReviewModal,
  AnimatedTabContent,
  StateView,
  ScrollToTopPill,
  CourseDetailHero,
  CourseInstructorSection,
  CourseReviewsSection,
  CourseStickyBottomBar,
  CourseCertificatePreviewModal,
  CourseWriteReviewModal,
} from '../components';
import { useLanguage } from '../context/LanguageContext';
import { useYouTube } from '../context/YouTubeContext';
import { useFeedback } from '../context/FeedbackContext';
import { findRelatedVideoForCourse } from '../services/youtubeService';
import { CoursesService } from '../services/api/coursesService';
import { MIN_TOUCH_TARGET } from '../theme/typography';
import { shape } from '../theme/shapes';
import { triggerHaptic } from '../utils/haptics';
import { useResponsive } from '../theme/responsive';
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
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { isTablet, containerClampStyle } = useResponsive();
  const { isBangla } = useLanguage();
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
    unlockCertificateForDev,
    submitMandatoryCourseReview,
    recordCategoryInteraction,
    refreshCourses,
  } = useLearning();
  const { user, isAuthenticated, isAdmin, canBypassCourseLocks } = useAuth();
  const isPrivileged = isAdmin || Boolean(canBypassCourseLocks);

  const [activeTab, setActiveTab] = useState<'curriculum' | 'qna' | 'instructor' | 'reviews'>('curriculum');
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [certPreviewVisible, setCertPreviewVisible] = useState(false);
  const [mandatoryReviewVisible, setMandatoryReviewVisible] = useState(false);
  const [writeReviewModalVisible, setWriteReviewModalVisible] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [showHeaderTitle, setShowHeaderTitle] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollViewRef = useRef<React.ElementRef<typeof ScrollView> | null>(null);

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

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && course && !userProgress[course.id] && courseId) {
        refreshCourses().catch(() => {});
      }
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [courseId, course, userProgress, refreshCourses]);

  useEffect(() => {
    if (course?.category) {
      recordCategoryInteraction(course.category);
    }
  }, [course?.category]);

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

  const isEnrolled = !!userProgress[course.id];
  const progressPercent = getCourseProgressPercentage(course.id);
  const isCompleted = !!userProgress[course.id]?.isCompleted;
  const bookmarked = isBookmarked(course.id);
  const { videos, playVideo } = useYouTube();
  const trailerVideo = findRelatedVideoForCourse(course, videos);

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
    if (isPrivileged) {
      const targetLessonId =
        userProgress[course.id]?.lastAccessedLessonId ||
        course.modules?.[0]?.lessons?.[0]?.id ||
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
              const firstLessonId = course.modules?.[0]?.lessons?.[0]?.id;
              if (firstLessonId) onNavigateToLesson(course.id, firstLessonId);
            },
          },
        ]
      );
    } else {
      const targetLessonId =
        userProgress[course.id]?.lastAccessedLessonId ||
        course.modules?.[0]?.lessons?.[0]?.id ||
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
      userAvatar: user?.avatar || '',
      rating: reviewRating,
      comment: reviewComment.trim(),
      userRole: isPrivileged
        ? 'Developer / Admin Reviewer'
        : isEnrolled
        ? 'Enrolled Student'
        : 'Verified Learner',
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

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;

    if (offsetY > 8 && !isScrolled) {
      setIsScrolled(true);
    } else if (offsetY <= 8 && isScrolled) {
      setIsScrolled(false);
    }

    if (offsetY > 220 && !showHeaderTitle) {
      setShowHeaderTitle(true);
    } else if (offsetY <= 220 && showHeaderTitle) {
      setShowHeaderTitle(false);
    }

    if (offsetY > 480 && !showScrollTop) {
      setShowScrollTop(true);
    } else if (offsetY <= 480 && showScrollTop) {
      setShowScrollTop(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        showBack
        onBack={onBack}
        isScrolled={isScrolled}
        title={showHeaderTitle ? course.title : (isBangla ? 'কোর্স বিবরণ' : 'Course Overview')}
        subtitle={showHeaderTitle ? (isBangla ? 'কোর্স বিবরণ' : 'Course Overview') : undefined}
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

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          containerClampStyle,
          { paddingBottom: Math.max(insets.bottom, 12) + 100 },
        ]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Decomposed Hero Section */}
        <CourseDetailHero
          course={course}
          isEnrolled={isEnrolled}
          isAdmin={isPrivileged}
          trailerVideo={trailerVideo}
          isTablet={isTablet}
          hasReviewed={hasReviewedCourse(course.id)}
          isCompleted={isCompleted}
          onPlayTrailer={(video) => playVideo(video, 'modal')}
          onEnrollOrResume={handleEnrollOrResume}
          onNavigateToLesson={(lessonId) => onNavigateToLesson(course.id, lessonId)}
          onOpenCertPreview={() => setCertPreviewVisible(true)}
          onOpenMandatoryReview={() => setMandatoryReviewVisible(true)}
        />

        {/* Administrator / Developer Access Banner & Testing Actions */}
        {isPrivileged && (
          <View style={[styles.devBypassBanner, { backgroundColor: '#102F53', borderColor: 'rgba(227, 66, 52, 0.4)' }]}>
            <View style={styles.devBypassHeader}>
              <View style={styles.devBypassBadge}>
                <Ionicons name="shield-checkmark" size={14} color="#E34234" />
                <Text style={styles.devBypassTitle}>
                  {isAdmin ? 'ADMINISTRATOR ACCESS' : 'DEVELOPER ACCESS'}
                </Text>
              </View>
              <Text style={styles.devBypassSubtitle}>
                {isBangla ? 'কোর্সের সকল লেকচার ও ফিচার আনলক করা হয়েছে' : 'All course lectures unlocked for testing'}
              </Text>
            </View>

            <View style={styles.devActionBtnRow}>
              <TouchableOpacity
                style={styles.devActionBtnPrimary}
                onPress={() => {
                  triggerHaptic('success');
                  const cert = unlockCertificateForDev(course.id);
                  if (cert) {
                    setCertPreviewVisible(true);
                  }
                }}
                accessibilityRole="button"
                accessibilityLabel="Test and Unlock Certificate"
              >
                <Ionicons name="ribbon" size={12} color="#FFFFFF" />
                <Text style={styles.devActionBtnText}>
                  {isBangla ? 'সার্টিফিকেট টেস্ট' : 'Test Certificate'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.devActionBtnSecondary}
                onPress={() => {
                  triggerHaptic('light');
                  setWriteReviewModalVisible(true);
                }}
                accessibilityRole="button"
                accessibilityLabel="Rate and Write Review"
              >
                <Ionicons name="star" size={12} color="#FFFFFF" />
                <Text style={styles.devActionBtnText}>
                  {isBangla ? 'রিভিউ দিন' : 'Write Review'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Navigation Tabs (Curriculum / Q&A / Instructor / Reviews) */}
        <View style={styles.tabsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.tabsBar, { borderBottomColor: colors.border }]}
            accessibilityRole="tablist"
          >
            {[
              {
                id: 'curriculum',
                label: isBangla
                  ? `কারিকুলাম (${course.modules.length})`
                  : `Curriculum (${course.modules.length})`,
              },
              { id: 'qna', label: isBangla ? 'প্রশ্নোত্তর' : 'Q&A' },
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
                    numberOfLines={1}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Tab Content */}
          <AnimatedTabContent tabKey={activeTab}>
            {activeTab === 'curriculum' && (
              <View style={styles.curriculumTab}>
                <CurriculumAccordion
                  courseId={course.id}
                  modules={course.modules}
                  isEnrolled={isEnrolled}
                  isAdmin={isPrivileged}
                  onSelectLesson={handleSelectLesson}
                />
              </View>
            )}

            {activeTab === 'qna' && (
              <CourseQnATab courseId={course.id} />
            )}

            {activeTab === 'instructor' && (
              <CourseInstructorSection instructor={course.instructor} />
            )}

            {activeTab === 'reviews' && (
              <CourseReviewsSection
                reviews={course.reviews}
                isEnrolled={isEnrolled || isPrivileged}
                onOpenWriteReview={() => setWriteReviewModalVisible(true)}
              />
            )}
          </AnimatedTabContent>
        </View>
      </ScrollView>

      {/* Decomposed Sticky Bottom Bar */}
      <CourseStickyBottomBar
        course={course}
        isEnrolled={isEnrolled}
        isAdmin={isPrivileged}
        progressPercent={progressPercent}
        isCompleted={isCompleted}
        insetsBottom={insets.bottom}
        onEnrollOrResume={handleEnrollOrResume}
      />

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
          const firstLessonId = course.modules?.[0]?.lessons?.[0]?.id;
          if (firstLessonId) onNavigateToLesson(course.id, firstLessonId);
        }}
      />

      {/* Interactive Official Certificate Preview Modal */}
      <CourseCertificatePreviewModal
        visible={certPreviewVisible}
        course={course}
        userName={user?.displayName || user?.username || 'Executive Graduate'}
        isUnlocked={isPrivileged || isCertificateUnlocked(course.id)}
        isCompleted={isPrivileged || isCompleted}
        hasReviewed={isPrivileged || hasReviewedCourse(course.id)}
        certificateId={userProgress[course.id]?.certificateId || (isPrivileged ? `TS-2026-DEV${course.id.slice(-4).toUpperCase()}` : undefined)}
        onClose={() => setCertPreviewVisible(false)}
        onOpenMandatoryReview={() => setMandatoryReviewVisible(true)}
      />

      {/* Interactive Write a Review Modal */}
      <CourseWriteReviewModal
        visible={writeReviewModalVisible}
        courseTitle={course.title}
        rating={reviewRating}
        comment={reviewComment}
        isSubmitting={isSubmittingReview}
        onChangeRating={setReviewRating}
        onChangeComment={setReviewComment}
        onSubmit={handleSubmitReview}
        onClose={() => setWriteReviewModalVisible(false)}
      />

      {/* Dynamic Scroll to Top Quick Pill */}
      <ScrollToTopPill
        visible={showScrollTop}
        onPress={() => scrollViewRef.current?.scrollTo({ y: 0, animated: true })}
        bottomOffset={Math.max(insets.bottom, 12) + 84}
      />
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
  tabsContainer: {
    paddingHorizontal: 16,
  },
  tabsBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: 16,
    minWidth: '100%',
  },
  tabItem: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    minWidth: 80,
  },
  tabLabel: {
    fontSize: 12.5,
  },
  curriculumTab: {
    paddingBottom: 8,
  },
  devBypassBanner: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: shape.medium,
    padding: 12,
    borderWidth: 1,
    gap: 8,
  },
  devBypassHeader: {
    gap: 2,
  },
  devBypassBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  devBypassTitle: {
    color: '#E34234',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  devBypassSubtitle: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 11,
  },
  devActionBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  devActionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E34234',
    paddingHorizontal: 10,
    paddingVertical: 5.5,
    borderRadius: 6,
  },
  devActionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5.5,
    borderRadius: 6,
  },
  devActionBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
