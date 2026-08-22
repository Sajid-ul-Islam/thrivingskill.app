import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLearning } from '../context/LearningContext';
import { Header } from '../components/Header';
import { CurriculumAccordion } from '../components/CurriculumAccordion';
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
  const {
    getCourseById,
    userProgress,
    enrollInCourse,
    isBookmarked,
    toggleBookmark,
    getCourseProgressPercentage,
  } = useLearning();

  const [activeTab, setActiveTab] = useState<'curriculum' | 'instructor' | 'reviews'>('curriculum');

  const course = getCourseById(courseId);
  if (!course) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header showBack onBack={onBack} title="Course Details" />
        <View style={styles.notFoundCenter}>
          <Text style={{ color: colors.text }}>Course not found.</Text>
        </View>
      </View>
    );
  }

  const isEnrolled = !!userProgress[course.id];
  const progressPercent = getCourseProgressPercentage(course.id);
  const bookmarked = isBookmarked(course.id);

  const handleEnrollOrResume = () => {
    if (!isEnrolled) {
      enrollInCourse(course.id);
      Alert.alert(
        'Enrolled Successfully! 🎉',
        `You have been enrolled in "${course.title}". Let's start the first lesson!`,
        [
          {
            text: 'Start Learning',
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        showBack
        onBack={onBack}
        title="Course Overview"
        rightAction={
          <TouchableOpacity
            style={[styles.headerBookmark, { backgroundColor: colors.surfaceSubtle }]}
            onPress={() => toggleBookmark(course.id)}
          >
            <Ionicons
              name={bookmarked ? 'bookmark' : 'bookmark-outline'}
              size={18}
              color={bookmarked ? colors.primary : colors.text}
            />
          </TouchableOpacity>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
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
              const previewLesson = course.modules[0]?.lessons.find((l) => l.isFreePreview);
              if (previewLesson) {
                onNavigateToLesson(course.id, previewLesson.id);
              } else {
                handleEnrollOrResume();
              }
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="play" size={28} color="#FFFFFF" />
            <Text style={styles.previewBtnText}>Watch Free Preview</Text>
          </TouchableOpacity>
        </View>

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
              <Text style={[styles.statValue, { color: colors.text }]}>{course.rating}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>({course.reviewsCount})</Text>
            </View>

            <View style={[styles.statDivider, { backgroundColor: colors.borderSubtle }]} />

            <View style={styles.statCell}>
              <Ionicons name="people-outline" size={16} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {course.enrolledCount.toLocaleString()}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Enrolled</Text>
            </View>

            <View style={[styles.statDivider, { backgroundColor: colors.borderSubtle }]} />

            <View style={styles.statCell}>
              <Ionicons name="time-outline" size={16} color={colors.secondary} />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {course.durationHours}h
              </Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Total</Text>
            </View>
          </View>

          {/* Highlights */}
          <View style={[styles.highlightsCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
            <Text style={[styles.highlightsHeading, { color: colors.text }]}>
              What You'll Master
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

          {/* Navigation Tabs (Curriculum / Instructor / Reviews) */}
          <View style={[styles.tabsBar, { borderBottomColor: colors.border }]}>
            {[
              { id: 'curriculum', label: `Curriculum (${course.modules.length} Modules)` },
              { id: 'instructor', label: 'Instructor' },
              { id: 'reviews', label: `Reviews (${course.reviews.length})` },
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
          {activeTab === 'curriculum' && (
            <View style={styles.curriculumTab}>
              <CurriculumAccordion
                courseId={course.id}
                modules={course.modules}
                isEnrolled={isEnrolled}
                onSelectLesson={handleSelectLesson}
              />
            </View>
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
          },
        ]}
      >
        {!isEnrolled ? (
          <View style={styles.bottomPriceCol}>
            <Text style={[styles.bottomPriceLabel, { color: colors.textMuted }]}>Total Price</Text>
            <View style={styles.priceRow}>
              <Text style={[styles.bottomPrice, { color: colors.primary }]}>
                ${course.price.toFixed(2)}
              </Text>
              <Text style={[styles.bottomOriginalPrice, { color: colors.textMuted }]}>
                ${course.originalPrice.toFixed(2)}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.bottomPriceCol}>
            <Text style={[styles.bottomPriceLabel, { color: colors.primary, fontWeight: '700' }]}>
              Enrolled ({progressPercent}%)
            </Text>
            <Text style={[styles.enrolledStatus, { color: colors.textMuted }]}>
              {userProgress[course.id]?.isCompleted ? 'Completed' : 'In Progress'}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.enrollCTAButton, { backgroundColor: colors.primary }]}
          onPress={handleEnrollOrResume}
          activeOpacity={0.88}
        >
          <Ionicons
            name={isEnrolled ? 'play' : 'flash'}
            size={18}
            color="#FFFFFF"
          />
          <Text style={styles.enrollCTAText}>
            {isEnrolled ? 'Resume Course' : 'Enroll Now'}
          </Text>
        </TouchableOpacity>
      </View>
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
    width: 38,
    height: 38,
    borderRadius: 19,
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
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomPriceCol: {
    justifyContent: 'center',
  },
  bottomPriceLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  bottomPrice: {
    fontSize: 20,
    fontWeight: '800',
  },
  bottomOriginalPrice: {
    fontSize: 13,
    textDecorationLine: 'line-through',
  },
  enrolledStatus: {
    fontSize: 13,
    fontWeight: '600',
  },
  enrollCTAButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  enrollCTAText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
