import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
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
  CourseQnATab,
  AnimatedTabContent,
  StateView,
  ScrollToTopPill,
  CourseDetailHero,
  CourseInstructorSection,
  CourseReviewsSection,
  CourseStickyBottomBar,
} from '../components';
import { courseDetailStyles as styles } from './course-detail/courseDetailStyles';
import { CourseDetailModals } from './course-detail/CourseDetailModals';
import { useLanguage } from '../context/LanguageContext';
import { useYouTube } from '../context/YouTubeContext';
import { useFeedback } from '../context/FeedbackContext';
import { findRelatedVideoForCourse } from '../services/youtubeService';
import { CoursesService } from '../services/api/coursesService';
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
    certificates,
    confirmServerEnrollments,
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
  const { user, isAuthenticated, isAdmin, canBypassCourseLocks, setAuthModalVisible } = useAuth();
  const { videos, playVideo } = useYouTube();
  const isPrivileged = isAdmin || Boolean(canBypassCourseLocks);

  const [activeTab, setActiveTab] = useState<'curriculum' | 'qna' | 'instructor' | 'reviews'>(
    'curriculum'
  );
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isEnrollingFree, setIsEnrollingFree] = useState(false);
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
  const trailerVideo = findRelatedVideoForCourse(course, videos);

  const handleSubmitMandatoryReview = async (rating: number, feedback: string) => {
    const cert = await submitMandatoryCourseReview(
      course.id,
      rating,
      feedback,
      user?.displayName || user?.username || 'Executive Graduate',
      'Student'
    );
    setMandatoryReviewVisible(false);
    if (cert) {
      setCertPreviewVisible(true);
      Alert.alert(
        isBangla ? 'সার্টিফিকেট আনলক হয়েছে! 🎓' : 'Certificate Unlocked! 🎓',
        isBangla
          ? 'আপনার রিভিউ সফলভাবে যুক্ত হয়েছে এবং সার্টিফিকেট আনলক করা হয়েছে।'
          : 'Thank you for your review! Your official verified certificate is now unlocked.'
      );
    } else {
      Alert.alert(
        isBangla ? 'রিভিউ সংরক্ষিত হয়েছে' : 'Review Saved',
        isBangla
          ? 'আপনার রিভিউ সার্ভারে সংরক্ষণ করা হয়েছে।'
          : 'Your review has been saved on the server.'
      );
    }
  };

  const resolveInitialLessonId = () => {
    const savedId = userProgress[course.id]?.lastAccessedLessonId;
    const allLessonIds = course.modules?.flatMap((m) => m.lessons || []).map((l) => l.id) || [];
    if (savedId && (allLessonIds.length === 0 || allLessonIds.includes(savedId))) {
      return savedId;
    }
    return allLessonIds[0] || '';
  };

  const handleEnrollOrResume = async () => {
    if (isPrivileged || isEnrolled) {
      const targetLessonId = resolveInitialLessonId();
      if (targetLessonId) {
        onNavigateToLesson(course.id, targetLessonId);
      }
      return;
    }

    const isPaid = Boolean(
      (course.priceBdt && course.priceBdt > 0) || (course.price && course.price > 0)
    );
    if (isPaid) {
      setPaymentModalVisible(true);
      return;
    }

    if (!isAuthenticated) {
      Alert.alert(
        isBangla ? 'সাইন ইন প্রয়োজন' : 'Sign In Required',
        isBangla
          ? 'ফ্রি কোর্সে ভর্তি হতে ও অগ্রগতি সংরক্ষণ করতে অনুগ্রহ করে আপনার অ্যাকাউন্টে সাইন ইন করুন।'
          : 'Please sign in to enroll in this free course and save your progress.',
        [
          { text: isBangla ? 'বাতিল' : 'Cancel', style: 'cancel' },
          {
            text: isBangla ? 'সাইন ইন করুন' : 'Sign In',
            onPress: () => setAuthModalVisible(true),
          },
        ]
      );
      return;
    }

    if (isEnrollingFree) return;
    setIsEnrollingFree(true);
    try {
      await CoursesService.enrollCourse(course.id);
      confirmServerEnrollments([course.id]);
      refreshCourses().catch(() => {});
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
    } catch (err: any) {
      Alert.alert(
        isBangla ? 'ভর্তি সম্পন্ন করা যায়নি' : 'Enrollment Failed',
        err?.message ||
          (isBangla
            ? 'এই মুহূর্তে কোর্সটিতে ভর্তি সম্পন্ন করা যায়নি। অনুগ্রহ করে ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।'
            : 'Could not complete enrollment right now. Please check your connection and try again.')
      );
    } finally {
      setIsEnrollingFree(false);
    }
  };

  const handleSelectLesson = (lesson: Lesson) => {
    if (!isPrivileged && !isEnrolled && !lesson.isFreePreview) {
      handleEnrollOrResume();
      return;
    }
    onNavigateToLesson(course.id, lesson.id);
  };

  const handleSubmitReview = async () => {
    if (!isAuthenticated) {
      Alert.alert(
        isBangla ? 'সাইন ইন প্রয়োজন' : 'Sign In Required',
        isBangla
          ? 'কোর্সে রিভিউ দিতে অনুগ্রহ করে সাইন ইন করুন।'
          : 'Please sign in to submit a course review.'
      );
      setAuthModalVisible(true);
      return;
    }
    if (!reviewComment.trim() || reviewComment.trim().length < 5) {
      Alert.alert(
        isBangla ? 'রিভিউ আবশ্যক' : 'Review Required',
        isBangla
          ? 'অনুগ্রহ করে এই কোর্স সম্পর্কে অন্তত ৫ অক্ষরের মতামত লিখুন।'
          : 'Please write at least 5 characters sharing your experience with this course.'
      );
      return;
    }
    setIsSubmittingReview(true);
    try {
      const serverResult = await CoursesService.submitCourseReview({
        courseId: course.id,
        rating: reviewRating,
        feedback: reviewComment.trim(),
        requireCompletion: false,
      });
      if (serverResult.review) {
        addCourseReview(course.id, {
          userName:
            serverResult.review.userName || user?.displayName || user?.username || 'Learner',
          userAvatar: user?.avatar || '',
          rating: serverResult.review.rating,
          comment: serverResult.review.comment,
          userRole: isPrivileged
            ? 'Developer / Admin Reviewer'
            : isEnrolled
              ? 'Enrolled Student'
              : 'Verified Learner',
        });
      }
      setWriteReviewModalVisible(false);
      setReviewComment('');
      Alert.alert(
        isBangla ? 'রিভিউ জমা দেওয়া হয়েছে! 🌟' : 'Review Submitted! 🌟',
        isBangla
          ? 'আপনার রেটিং এবং মতামত সার্ভারে সংরক্ষিত হয়েছে।'
          : 'Thank you! Your rating and review have been saved to your account.'
      );
    } catch (err: any) {
      Alert.alert(
        isBangla ? 'রিভিউ জমা দেওয়া যায়নি' : 'Review Submission Failed',
        err?.message ||
          (isBangla
            ? 'সার্ভারে রিভিউ সংরক্ষণ করা যায়নি।'
            : 'Could not save your review on the server right now.')
      );
    } finally {
      setIsSubmittingReview(false);
    }
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
        title={showHeaderTitle ? course.title : isBangla ? 'কোর্স বিবরণ' : 'Course Overview'}
        subtitle={showHeaderTitle ? (isBangla ? 'কোর্স বিবরণ' : 'Course Overview') : undefined}
        rightAction={
          <TouchableOpacity
            style={[styles.headerBookmark, { backgroundColor: colors.surfaceSubtle }]}
            onPress={() => {
              const wasBookmarked = bookmarked;
              toggleBookmark(course.id);
              showToast({
                message: wasBookmarked
                  ? isBangla
                    ? 'সংরক্ষিত তালিকা থেকে সরানো হয়েছে'
                    : 'Removed from Saved'
                  : isBangla
                    ? 'কোর্সটি সংরক্ষণ করা হয়েছে'
                    : 'Saved course to My Hub',
                type: wasBookmarked ? 'info' : 'success',
                actionLabel: wasBookmarked ? (isBangla ? 'পূর্বাবস্থায়' : 'Undo') : undefined,
                onAction: wasBookmarked ? () => toggleBookmark(course.id) : undefined,
              });
            }}
            accessibilityRole="button"
            accessibilityLabel={
              bookmarked
                ? isBangla
                  ? 'বুকমার্ক সরান'
                  : 'Remove bookmark'
                : isBangla
                  ? 'কোর্স বুকমার্ক করুন'
                  : 'Save course bookmark'
            }
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
          <View
            style={[
              styles.devBypassBanner,
              { backgroundColor: '#102F53', borderColor: 'rgba(227, 66, 52, 0.4)' },
            ]}
          >
            <View style={styles.devBypassHeader}>
              <View style={styles.devBypassBadge}>
                <Ionicons name="shield-checkmark" size={14} color="#E34234" />
                <Text style={styles.devBypassTitle}>
                  {isAdmin ? 'ADMINISTRATOR ACCESS' : 'DEVELOPER ACCESS'}
                </Text>
              </View>
              <Text style={styles.devBypassSubtitle}>
                {isBangla
                  ? 'কোর্সের সকল লেকচার ও ফিচার আনলক করা হয়েছে'
                  : 'All course lectures unlocked for testing'}
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
                  isLoading={loadingDetail}
                  onSelectLesson={handleSelectLesson}
                  onLockedLessonPress={handleSelectLesson}
                />
              </View>
            )}

            {activeTab === 'qna' && <CourseQnATab courseId={course.id} />}

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
        isEnrolling={isEnrollingFree}
        progressPercent={progressPercent}
        isCompleted={isCompleted}
        insetsBottom={insets.bottom}
        onEnrollOrResume={handleEnrollOrResume}
      />

      <CourseDetailModals
        course={course}
        userName={user?.displayName || user?.username || 'Executive Graduate'}
        isPrivileged={isPrivileged}
        isCompleted={isCompleted}
        isUnlocked={isPrivileged || isCertificateUnlocked(course.id)}
        hasReviewed={isPrivileged || hasReviewedCourse(course.id)}
        certificateId={
          certificates.find((c) => c.courseId === course.id)?.credentialId ||
          userProgress[course.id]?.certificateId ||
          (isPrivileged ? `TS-2026-DEV${course.id.slice(-4).toUpperCase()}` : undefined)
        }
        verificationUrl={certificates.find((c) => c.courseId === course.id)?.verificationUrl}
        mandatoryReviewVisible={mandatoryReviewVisible}
        paymentModalVisible={paymentModalVisible}
        certPreviewVisible={certPreviewVisible}
        writeReviewModalVisible={writeReviewModalVisible}
        reviewRating={reviewRating}
        reviewComment={reviewComment}
        isSubmittingReview={isSubmittingReview}
        onCloseMandatoryReview={() => setMandatoryReviewVisible(false)}
        onOpenMandatoryReview={() => setMandatoryReviewVisible(true)}
        onSubmitMandatoryReview={handleSubmitMandatoryReview}
        onClosePayment={() => setPaymentModalVisible(false)}
        onPaymentSuccess={() => {
          setPaymentModalVisible(false);
          const firstLessonId = course.modules?.[0]?.lessons?.[0]?.id;
          if (firstLessonId) onNavigateToLesson(course.id, firstLessonId);
        }}
        onCloseCertPreview={() => setCertPreviewVisible(false)}
        onChangeRating={setReviewRating}
        onChangeComment={setReviewComment}
        onSubmitReview={handleSubmitReview}
        onCloseWriteReview={() => setWriteReviewModalVisible(false)}
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
