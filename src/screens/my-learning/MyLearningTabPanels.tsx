import React from 'react';
import { View, Text, TouchableOpacity, Image, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SpringPressable, CircularProgressRing, YouTubeCard, StateView } from '../../components';
import { getSafeImageSource } from '../../utils/imageUtils';
import { Certificate, Course } from '../../types';
import { MIN_TOUCH_TARGET } from '../../theme/typography';
import { myLearningStyles as styles } from './myLearningStyles';

interface EnrolledCoursesGridProps {
  list: Course[];
  isTablet: boolean;
  isDark: boolean;
  isBangla: boolean;
  colors: any;
  userProgress: Record<string, any>;
  certificates: Certificate[];
  getCourseProgressPercentage: (courseId: string) => number;
  getCourseStatus: (courseId: string) => 'in-progress' | 'finished' | 'passed' | 'failed';
  hasReviewedCourse: (courseId: string) => boolean;
  onNavigateToCourse: (courseId: string) => void;
  onNavigateToLesson: (courseId: string, lessonId: string) => void;
  onSelectCert: (cert: Certificate) => void;
  onOpenMandatoryReview: (course: Course) => void;
}

export const EnrolledCoursesGrid: React.FC<EnrolledCoursesGridProps> = ({
  list,
  isTablet,
  isDark,
  isBangla,
  colors,
  userProgress,
  certificates,
  getCourseProgressPercentage,
  getCourseStatus,
  hasReviewedCourse,
  onNavigateToCourse,
  onNavigateToLesson,
  onSelectCert,
  onOpenMandatoryReview,
}) => (
  <View style={isTablet ? styles.tabletGridContainer : undefined}>
    {list.map((course) => {
      const percent = getCourseProgressPercentage(course.id);
      const progress = userProgress[course.id];
      const targetLessonId =
        progress?.lastAccessedLessonId || course.modules?.[0]?.lessons?.[0]?.id || '';
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

      const statusColor =
        courseStatus === 'passed'
          ? '#16A34A'
          : courseStatus === 'failed'
            ? '#EF4444'
            : colors.primary;

      return (
        <View
          key={course.id}
          style={[
            styles.learningCard,
            isTablet && styles.learningCardTablet,
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
            <Image
              source={getSafeImageSource(course.thumbnail)}
              style={styles.cardImage}
              {...(Platform.OS === 'web' ? { referrerPolicy: 'no-referrer' } : {})}
            />
            <View style={[styles.statusPill, { backgroundColor: badgeConfig.bg }]}>
              <Ionicons name={badgeConfig.icon} size={10} color={badgeConfig.color} />
              <Text style={[styles.statusPillText, { color: badgeConfig.color }]}>
                {badgeConfig.label}
              </Text>
            </View>
          </View>
          <View style={styles.cardBody}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 8,
              }}
            >
              <Text
                style={[
                  styles.cardTitle,
                  {
                    color: colors.text,
                    flex: 1,
                    minWidth: 0,
                    marginRight: 8,
                    lineHeight: isBangla ? 22 : 20,
                  },
                ]}
                numberOfLines={2}
              >
                {course.title}
              </Text>
              <CircularProgressRing
                progress={courseStatus === 'passed' ? 100 : percent}
                size={38}
                strokeWidth={3.5}
                progressColor={statusColor}
                trackColor={colors.surfaceSubtle}
                textSize={10}
              />
            </View>
            <Text style={[styles.cardInstructor, { color: colors.textMuted }]}>
              {course.instructor.name}
            </Text>

            <View style={styles.progressRow}>
              <View style={[styles.progressTrack, { backgroundColor: colors.surfaceSubtle }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: statusColor,
                      width: `${courseStatus === 'passed' ? 100 : percent}%`,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.progressText, { color: statusColor }]}>
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
                  isBangla ? `${course.title} এর সিলেবাস দেখুন` : `View syllabus for ${course.title}`
                }
              >
                <Text style={[styles.syllabusBtnText, { color: colors.text }]}>
                  {isBangla ? 'সিলেবাস' : 'Syllabus'}
                </Text>
              </TouchableOpacity>

              {courseStatus === 'passed' && hasReviewedCourse(course.id) && cert ? (
                <SpringPressable
                  style={[styles.resumeBtn, { backgroundColor: colors.accent }]}
                  onPress={() => onSelectCert(cert)}
                  activeScale={0.96}
                  accessibilityRole="button"
                >
                  <Ionicons name="ribbon" size={14} color={colors.onAccent} />
                  <Text style={[styles.resumeBtnText, { color: colors.onAccent }]}>
                    {isBangla ? 'সনদপত্র দেখুন' : 'Certificate'}
                  </Text>
                </SpringPressable>
              ) : courseStatus === 'passed' && !hasReviewedCourse(course.id) ? (
                <SpringPressable
                  style={[styles.resumeBtn, { backgroundColor: colors.primary }]}
                  onPress={() => onOpenMandatoryReview(course)}
                  activeScale={0.96}
                  accessibilityRole="button"
                >
                  <Ionicons name="lock-closed" size={14} color={colors.onPrimary} />
                  <Text style={[styles.resumeBtnText, { color: colors.onPrimary }]}>
                    {isBangla ? 'রিভিউ দিন (লক)' : 'Review to Unlock'}
                  </Text>
                </SpringPressable>
              ) : (
                <SpringPressable
                  style={[
                    styles.resumeBtn,
                    { backgroundColor: courseStatus === 'failed' ? '#EF4444' : colors.primary },
                  ]}
                  onPress={() => onNavigateToLesson(course.id, targetLessonId)}
                  activeScale={0.96}
                  accessibilityRole="button"
                >
                  <Ionicons
                    name={courseStatus === 'failed' ? 'refresh' : 'play'}
                    size={14}
                    color={courseStatus === 'failed' ? '#FFFFFF' : colors.onPrimary}
                  />
                  <Text
                    style={[
                      styles.resumeBtnText,
                      { color: courseStatus === 'failed' ? '#FFFFFF' : colors.onPrimary },
                    ]}
                  >
                    {courseStatus === 'failed'
                      ? isBangla
                        ? 'পুনরায় শুরু করুন'
                        : 'Retake'
                      : isBangla
                        ? 'চালিয়ে যান'
                        : 'Resume'}
                  </Text>
                </SpringPressable>
              )}
            </View>
          </View>
        </View>
      );
    })}
  </View>
);

export const HistoryTabPanel: React.FC<{
  historyList: {
    course: Course;
    lesson: any;
    watchSec: number;
    progressPercent: number;
    dateWatched: string;
  }[];
  colors: any;
  isBangla: boolean;
  onBrowseCourses: () => void;
  onNavigateToLesson: (courseId: string, lessonId: string) => void;
}> = ({ historyList, colors, isBangla, onBrowseCourses, onNavigateToLesson }) => {
  if (historyList.length === 0) {
    return (
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
    );
  }
  return (
    <>
      {historyList.map((item) => (
        <View
          key={item.course.id}
          style={[
            styles.learningCard,
            { backgroundColor: colors.surfaceCard, borderColor: colors.border },
          ]}
        >
          <Image
            source={getSafeImageSource(item.course.thumbnail)}
            style={styles.cardImage}
            {...(Platform.OS === 'web' ? { referrerPolicy: 'no-referrer' } : {})}
          />
          <View style={styles.cardBody}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 4,
                gap: 8,
              }}
            >
              <View
                style={[
                  styles.completedBadge,
                  {
                    backgroundColor: colors.primaryLight,
                    flexShrink: 1,
                    minWidth: 0,
                    marginRight: 8,
                  },
                ]}
              >
                <Ionicons name="time" size={12} color={colors.primary} />
                <Text
                  style={[styles.completedBadgeText, { color: colors.primary }]}
                  numberOfLines={1}
                >
                  {item.dateWatched}
                </Text>
              </View>
              <Text
                style={{ fontSize: 11, color: colors.primary, fontWeight: '700', flexShrink: 0 }}
              >
                {item.progressPercent}% {isBangla ? 'সম্পন্ন' : 'Watched'}
              </Text>
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
              {item.course.title}
            </Text>
            <Text
              style={{ fontSize: 12, color: colors.textMuted, marginBottom: 8 }}
              numberOfLines={1}
            >
              {isBangla ? 'সর্বশেষ লেসন: ' : 'Last Lesson: '}
              {item.lesson?.title || (isBangla ? 'কোর্স লেকচার' : 'Course Lecture')}
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
            >
              <Ionicons name="play" size={14} color={colors.onPrimary} />
              <Text style={[styles.resumeBtnText, { color: colors.onPrimary }]}>
                {isBangla ? 'চালিয়ে যান' : 'Resume'} ({Math.floor(item.watchSec / 60)}m{' '}
                {item.watchSec % 60}s)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </>
  );
};

export const CertificatesTabPanel: React.FC<{
  certificates: Certificate[];
  courses: Course[];
  colors: any;
  isDark: boolean;
  isBangla: boolean;
  hasReviewedCourse: (id: string) => boolean;
  onBrowseCourses: () => void;
  onSelectCert: (cert: Certificate) => void;
  onOpenMandatoryReview: (course: Course) => void;
}> = ({
  certificates,
  courses,
  colors,
  isDark,
  isBangla,
  hasReviewedCourse,
  onBrowseCourses,
  onSelectCert,
  onOpenMandatoryReview,
}) => {
  if (certificates.length === 0) {
    return (
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
    );
  }
  return (
    <>
      {certificates.map((cert) => {
        const isReviewed = hasReviewedCourse(cert.courseId);
        return (
          <TouchableOpacity
            key={cert.id}
            style={[
              styles.certItemCard,
              {
                backgroundColor: colors.surfaceCard,
                borderColor: isReviewed ? colors.border : colors.accent,
                shadowColor: colors.cardShadow,
              },
            ]}
            onPress={() => {
              if (!isReviewed) {
                const targetCourse = courses.find((c) => c.id === cert.courseId);
                onOpenMandatoryReview(
                  targetCourse ||
                    ({
                      id: cert.courseId,
                      title: cert.courseTitle,
                      instructor: { name: cert.instructorName },
                    } as any)
                );
              } else {
                onSelectCert(cert);
              }
            }}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <View
              style={[
                styles.certIconBadge,
                {
                  backgroundColor: isReviewed
                    ? isDark
                      ? 'rgba(227, 66, 52, 0.16)'
                      : '#FEE2E2'
                    : isDark
                      ? 'rgba(239, 68, 68, 0.2)'
                      : '#FEF2F2',
                },
              ]}
            >
              <Ionicons
                name={isReviewed ? 'ribbon' : 'lock-closed'}
                size={26}
                color={isReviewed ? '#E34234' : '#EF4444'}
              />
            </View>
            <View style={styles.certCol}>
              <View style={styles.verifiedTag}>
                <Ionicons
                  name={isReviewed ? 'checkmark-circle' : 'lock-closed'}
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
                    ? isBangla
                      ? 'ভেরিফাইড ক্রেডেনশিয়াল'
                      : 'VERIFIED CREDENTIAL'
                    : isBangla
                      ? 'রিভিউ আবশ্যক (লক)'
                      : 'REVIEW REQUIRED (LOCKED)'}
                </Text>
              </View>
              <Text style={[styles.certItemTitle, { color: colors.text }]} numberOfLines={2}>
                {cert.courseTitle}
              </Text>
              <Text style={[styles.certItemMeta, { color: colors.textMuted }]}>
                {isReviewed
                  ? `${isBangla ? 'ইস্যুর তারিখ ' : 'Issued '}${cert.issueDate} • ID: ${cert.credentialId}`
                  : isBangla
                    ? 'সার্টিফিকেট আনলক করতে ১-৫ স্টার রেটিং দিন'
                    : 'Rate & review course to unlock certificate'}
              </Text>
            </View>
            <Ionicons
              name={isReviewed ? 'chevron-forward' : 'lock-closed-outline'}
              size={18}
              color={isReviewed ? colors.textMuted : colors.accent}
            />
          </TouchableOpacity>
        );
      })}
    </>
  );
};

export const SavedTabPanel: React.FC<{
  savedList: Course[];
  savedVideos: any[];
  colors: any;
  isBangla: boolean;
  playVideo: (v: any, mode: 'modal' | 'mini') => void;
  onOpenYouTube?: () => void;
  onNavigateToCourse: (courseId: string) => void;
}> = ({
  savedList,
  savedVideos,
  colors,
  isBangla,
  playVideo,
  onOpenYouTube,
  onNavigateToCourse,
}) => {
  if (savedList.length === 0 && savedVideos.length === 0) {
    return (
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
          >
            <Ionicons name="logo-youtube" size={16} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>
              {isBangla ? 'ইউটিউব মাস্টারক্লাস ব্রাউজ করুন' : 'Browse YouTube Masterclasses'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }
  return (
    <>
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
            >
              <Image
                source={getSafeImageSource(course.thumbnail)}
                style={styles.savedThumb}
                {...(Platform.OS === 'web' ? { referrerPolicy: 'no-referrer' } : {})}
              />
              <View style={styles.savedInfo}>
                <Text style={[styles.savedTitle, { color: colors.text }]} numberOfLines={2}>
                  {course.title}
                </Text>
                <Text style={[styles.savedPrice, { color: colors.primary }]}>
                  {course.priceBdt && course.priceBdt > 0
                    ? `৳ ${course.priceBdt.toLocaleString()}`
                    : course.price > 0
                      ? `$${course.price.toLocaleString()}`
                      : isBangla
                        ? 'বিনামূল্যে'
                        : 'Free'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </>
  );
};
