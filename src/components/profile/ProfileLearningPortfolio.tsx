import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Linking, Alert, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { shape } from '../../theme/shapes';
import { MIN_TOUCH_TARGET } from '../../theme/typography';
import { triggerHaptic } from '../../utils/haptics';
import { ProfileLearningAnalytics } from '../analytics/ProfileLearningAnalytics';
import { LearnPressStatsGrid } from '../cards/LearnPressStatsGrid';
import { Course, Certificate, LearnPressCourseFilter, UserProgress } from '../../types';
import { getSafeImageSource } from '../../utils/imageUtils';

interface ProfileLearningPortfolioProps {
  isAuthenticated: boolean;
  isDark: boolean;
  colors: any;
  isBangla: boolean;
  enrolledCount: number;
  inProgressCourses: Course[];
  completedCount: number;
  totalHoursLearned: string;
  completionRate: number;
  streakDays: number;
  portfolioTab: LearnPressCourseFilter;
  setPortfolioTab: (tab: LearnPressCourseFilter) => void;
  certificates: Certificate[];
  displayedCourses: Course[];
  userProgress: Record<string, UserProgress>;
  getCourseStatus: (courseId: string) => 'passed' | 'failed' | 'finished' | 'in-progress';
  hasReviewedCourse: (courseId: string) => boolean;
  lpStats: any;
  onNavigateTab: (tab: any) => void;
  onNavigateToCourse?: (courseId: string) => void;
  onNavigateToLesson?: (courseId: string, lessonId: string) => void;
  onOpenAuthModal: () => void;
  onSelectCertificate: (cert: Certificate) => void;
  onOpenMandatoryReview: (course: Course) => void;
  user: any;
}

export const ProfileLearningPortfolio: React.FC<ProfileLearningPortfolioProps> = ({
  isAuthenticated,
  isDark,
  colors,
  isBangla,
  enrolledCount,
  inProgressCourses,
  completedCount,
  totalHoursLearned,
  completionRate,
  streakDays,
  portfolioTab,
  setPortfolioTab,
  certificates,
  displayedCourses,
  userProgress,
  getCourseStatus,
  hasReviewedCourse,
  lpStats,
  onNavigateTab,
  onNavigateToCourse,
  onNavigateToLesson,
  onOpenAuthModal,
  onSelectCertificate,
  onOpenMandatoryReview,
  user,
}) => {
  return (
    <View>
      {!isAuthenticated && (
        <View style={styles.section}>
          <View
            style={[
              styles.guestBanner,
              { backgroundColor: colors.surfaceCard, borderColor: colors.primary },
            ]}
          >
            <View style={[styles.guestBannerIconBg, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="person-circle-outline" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.guestBannerTitle, { color: colors.text }]}>
                {isBangla ? 'আপনার প্রগ্রেস সিঙ্ক করতে সাইন ইন করুন' : 'Sign in to Sync Your Learning'}
              </Text>
              <Text style={[styles.guestBannerSubtitle, { color: colors.textMuted }]}>
                {isBangla
                  ? 'আপনার এনরোল করা কোর্স, সার্টিফিকেট এবং ডেইলি স্ট্রিক সংরক্ষণ করুন।'
                  : 'Keep your enrolled courses, certificates, and daily streak synced across devices.'}
              </Text>
              <TouchableOpacity
                style={[styles.guestLoginBtn, { backgroundColor: colors.primary }]}
                onPress={onOpenAuthModal}
                accessibilityRole="button"
              >
                <Ionicons name="log-in-outline" size={16} color={colors.onPrimary} />
                <Text style={[styles.guestLoginBtnText, { color: colors.onPrimary }]}>
                  {isBangla ? 'সাইন ইন করুন' : 'Sign In / Register'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* CR-05: Learning Analytics Data Chart */}
      <View style={styles.section}>
        <ProfileLearningAnalytics
          enrolledCount={enrolledCount}
          inProgressCount={inProgressCourses.length}
          completedCount={completedCount}
          totalHours={totalHoursLearned}
          certificatesCount={certificates.length}
          completionRate={completionRate}
          streakDays={streakDays}
          colors={colors}
          isBangla={isBangla}
          activeCourseTab={portfolioTab}
          onSelectTab={(tab) => setPortfolioTab(tab)}
        />
      </View>

      {/* CR-8: My Achievements (Certificates & Social Sharing) */}
      <View style={styles.section}>
        <View style={styles.portfolioHeaderRow}>
          <View style={styles.titleWithIcon}>
            <Text style={[styles.sectionTitleMain, { color: colors.text }]}>
              {isBangla ? 'আমার অর্জন ও সনদ' : 'My Achievements'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              triggerHaptic('light');
              if (certificates.length > 0) {
                onSelectCertificate(certificates[0]);
              } else {
                Alert.alert(
                  isBangla ? 'অর্জন ও সার্টিফিকেট' : 'My Achievements',
                  isBangla
                    ? 'কোর্স সম্পন্ন করলেই আপনার ভেরিফাইড সার্টিফিকেট এখানে প্রদর্শিত হবে।'
                    : 'Complete any course to unlock your verified digital certificate.'
                );
              }
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ minHeight: MIN_TOUCH_TARGET, justifyContent: 'center' }}
            accessibilityRole="button"
            accessibilityLabel="View all achievements"
          >
            <Text style={[styles.seeAllText, { color: colors.primary }]}>
              {isBangla ? `সবগুলো দেখুন (${certificates.length}) →` : `View All (${certificates.length}) →`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Achievements Section: Real Earned Certificates or Clean Empty State */}
        {certificates.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingBottom: 6 }}
          >
            {certificates.map((cert) => (
              <View
                key={cert.id}
                style={{
                  width: 220,
                  backgroundColor: isDark ? colors.surfaceCard : '#FFFFFF',
                  borderRadius: shape.large,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: 14,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06,
                  shadowRadius: 6,
                  elevation: 2,
                }}
              >
              {/* Top Row: Provider & Date */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#102F53', justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="ribbon" size={13} color="#FFB606" />
                  </View>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: colors.text }}>
                    Thriving Skills
                  </Text>
                </View>
                <View style={{ backgroundColor: '#10B98118', paddingHorizontal: 6, paddingVertical: 2, borderRadius: shape.small }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#10B981' }}>
                    96% Score
                  </Text>
                </View>
              </View>

              {/* Course Title */}
              <Text
                style={{ fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 4, height: 36 }}
                numberOfLines={2}
              >
                {cert.courseTitle}
              </Text>

              {/* Issue Date */}
              <Text style={{ fontSize: 10.5, color: colors.textMuted, marginBottom: 12 }}>
                Issued: {cert.issueDate}
              </Text>

              {/* Action Row: View + Social Share Buttons */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: colors.primary,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: shape.small,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    minHeight: 32,
                  }}
                  onPress={() => {
                    triggerHaptic('light');
                    onSelectCertificate(cert);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel={`View certificate for ${cert.courseTitle}`}
                >
                  <Ionicons name="eye-outline" size={12} color={colors.onPrimary} />
                  <Text style={{ color: colors.onPrimary, fontSize: 11, fontWeight: '700' }}>
                    {isBangla ? 'সনদ দেখুন' : 'Certificate'}
                  </Text>
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <TouchableOpacity
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: '#1877F218',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                    onPress={() => {
                      triggerHaptic('light');
                      const url = encodeURIComponent(cert.verificationUrl || 'https://thrivingskill.com');
                      Linking.openURL(`https://www.facebook.com/sharer/sharer.php?u=${url}`).catch(() => {});
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel="Social share certificate post"
                  >
                    <Ionicons name="logo-facebook" size={16} color="#1877F2" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: '#0A66C218',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                    onPress={() => {
                      triggerHaptic('light');
                      const url = encodeURIComponent(cert.verificationUrl || 'https://thrivingskill.com');
                      const title = encodeURIComponent(`Verified Certificate: ${cert.courseTitle}`);
                      Linking.openURL(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}`).catch(() => {});
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel="Share on LinkedIn"
                  >
                    <Ionicons name="logo-linkedin" size={16} color="#0A66C2" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
        ) : (
          <View
            style={{
              padding: 20,
              backgroundColor: isDark ? colors.surfaceCard : '#FFFFFF',
              borderRadius: shape.large,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: colors.primaryLight,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 10,
              }}
            >
              <Ionicons name="ribbon-outline" size={24} color={colors.primary} />
            </View>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: colors.text,
                textAlign: 'center',
                marginBottom: 4,
              }}
            >
              {isBangla ? 'এখনো কোনো সার্টিফিকেট অর্জিত হয়নি' : 'No Certificates Earned Yet'}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: colors.textMuted,
                textAlign: 'center',
                lineHeight: 18,
                maxWidth: 280,
              }}
            >
              {isBangla
                ? 'আপনার এনরোল করা কোর্সটি ১০০% সম্পন্ন করুন এবং ভেরিফাইড সার্টিফিকেট অর্জন করুন।'
                : 'Complete 100% of any enrolled course to unlock your verified digital certificate.'}
            </Text>
          </View>
        )}
      </View>

      {/* CR-05: Enrolled & Graduated Courses Portfolio */}
      <View style={styles.section}>
        <View style={styles.portfolioHeaderRow}>
          <View style={styles.titleWithIcon}>
            <Text style={[styles.sectionTitleMain, { color: colors.text }]}>
              {isBangla ? 'আমার কোর্স পোর্টফোলিও' : 'My Course Portfolio'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => onNavigateTab('MyLearning')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ minHeight: MIN_TOUCH_TARGET, justifyContent: 'center' }}
            accessibilityRole="button"
            accessibilityLabel={isBangla ? 'আমার লার্নিং হাব' : 'My Learning Hub'}
          >
            <Text style={[styles.seeAllText, { color: colors.primary }]}>
              {isBangla ? 'আমার লার্নিং হাব →' : 'My Learning Hub →'}
            </Text>
          </TouchableOpacity>
        </View>

        <LearnPressStatsGrid
          stats={lpStats}
          activeFilter={portfolioTab}
          onSelectFilter={(filter) => setPortfolioTab(filter)}
          colors={colors}
          isBangla={isBangla}
          isDark={isDark}
        />

        {displayedCourses.length === 0 ? (
          <View
            style={[
              styles.emptyCourseCard,
              { backgroundColor: colors.surfaceCard, borderColor: colors.border },
            ]}
          >
            <Ionicons name="school-outline" size={32} color={colors.textMuted} />
            <Text style={[styles.emptyCourseTitle, { color: colors.text }]}>
              {portfolioTab === 'passed'
                ? isBangla
                  ? 'এখনো কোনো কোর্স উত্তীর্ণ হয়নি'
                  : 'No passed courses yet'
                : portfolioTab === 'failed'
                ? isBangla
                  ? 'কোনো অনুত্তীর্ণ কোর্স নেই (চমৎকার!)'
                  : 'No failed courses (Great job!)'
                : portfolioTab === 'finished'
                ? isBangla
                  ? 'এখনো কোনো কোর্স সম্পন্ন হয়নি'
                  : 'No finished courses yet'
                : portfolioTab === 'in-progress'
                ? isBangla
                  ? 'চলমান কোনো কোর্স নেই'
                  : 'No courses in progress'
                : isBangla
                ? 'কোনো কোর্স এনরোল করা নেই'
                : 'No enrolled courses'}
            </Text>
            <Text style={[styles.emptyCourseSub, { color: colors.textMuted }]}>
              {isBangla
                ? 'নতুন কোর্স এক্সপ্লোর করুন এবং আপনার ক্যারিয়ার স্কিল উন্নত করুন।'
                : 'Explore the catalog to start an accredited executive masterclass.'}
            </Text>
            <TouchableOpacity
              style={[styles.emptyActionBtn, { backgroundColor: colors.primary }]}
              onPress={() => onNavigateTab('Courses')}
              accessibilityRole="button"
              accessibilityLabel={isBangla ? 'কোর্স ক্যাটালগ দেখুন' : 'Browse Catalog'}
            >
              <Text style={[styles.emptyActionBtnText, { color: colors.onPrimary }]}>
                {isBangla ? 'কোর্স দেখুন' : 'Browse Catalog'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          displayedCourses.map((course) => {
            const prog = userProgress[course.id];
            const courseStatus = getCourseStatus(course.id);
            const isGraduated = courseStatus === 'passed' || courseStatus === 'finished';
            const totalLessons = course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0;
            const completedCountForCourse = prog?.completedLessonIds?.length || 0;
            const pct = totalLessons > 0 ? Math.min(100, Math.round((completedCountForCourse / totalLessons) * 100)) : 0;
            const targetLessonId = prog?.lastAccessedLessonId || course.modules?.[0]?.lessons?.[0]?.id || '';
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

            return (
              <View
                key={course.id}
                style={[
                  styles.profileCourseCard,
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
                <View style={styles.graduatedThumbContainer}>
                  <Image
                    source={getSafeImageSource(course.thumbnail)}
                    style={styles.courseThumb}
                    {...(Platform.OS === 'web' ? { referrerPolicy: 'no-referrer' } : {})}
                  />
                  <View style={[styles.graduatedCapPill, { backgroundColor: badgeConfig.bg }]}>
                    <Ionicons name={badgeConfig.icon} size={10} color={badgeConfig.color} />
                    <Text style={[styles.graduatedCapText, { color: badgeConfig.color }]}>
                      {badgeConfig.label}
                    </Text>
                  </View>
                </View>
                <View style={styles.courseDetails}>
                  <View style={styles.courseHeaderBadgeRow}>
                    <View style={[styles.courseCategoryTag, { backgroundColor: colors.primaryLight }]}>
                      <Text style={[styles.courseCategoryText, { color: colors.primary }]}>
                        {course.level}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.coursePercentText,
                        {
                          color:
                            courseStatus === 'passed'
                              ? '#16A34A'
                              : courseStatus === 'failed'
                              ? '#EF4444'
                              : colors.primary,
                        },
                      ]}
                    >
                      {courseStatus === 'passed' ? '100% Mastery' : `${pct}%`}
                    </Text>
                  </View>
                  <Text style={[styles.courseCardTitle, { color: colors.text }]} numberOfLines={2}>
                    {course.title}
                  </Text>
                  <View style={styles.courseProgressRow}>
                    <View style={[styles.courseProgressTrack, { backgroundColor: colors.surfaceSubtle }]}>
                      <View
                        style={[
                          styles.courseProgressFill,
                          {
                            backgroundColor:
                              courseStatus === 'passed'
                                ? '#16A34A'
                                : courseStatus === 'failed'
                                ? '#EF4444'
                                : colors.primary,
                            width: `${Math.max(pct, isGraduated ? 100 : 8)}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>
                  {courseStatus === 'passed' && cert && hasReviewedCourse(course.id) ? (
                    <TouchableOpacity
                      style={[styles.certificateActionBtn, { backgroundColor: colors.brandGold }]}
                      onPress={() => onSelectCertificate(cert)}
                      accessibilityRole="button"
                      accessibilityLabel={isBangla ? 'সনদপত্র দেখুন' : 'View Certificate'}
                    >
                      <Ionicons name="ribbon" size={14} color="#102F53" />
                      <Text style={styles.certificateActionBtnText}>
                        {isBangla ? 'সনদপত্র দেখুন' : 'View Certificate'}
                      </Text>
                    </TouchableOpacity>
                  ) : courseStatus === 'passed' && !hasReviewedCourse(course.id) ? (
                    <TouchableOpacity
                      style={[styles.certificateActionBtn, { backgroundColor: '#F59E0B' }]}
                      onPress={() => onOpenMandatoryReview(course)}
                      accessibilityRole="button"
                      accessibilityLabel={isBangla ? 'রিভিউ দিন (লক)' : 'Review to Unlock'}
                    >
                      <Ionicons name="lock-closed" size={14} color="#FFFFFF" />
                      <Text style={[styles.certificateActionBtnText, { color: '#FFFFFF' }]}>
                        {isBangla ? 'রিভিউ দিন (লক)' : 'Review to Unlock'}
                      </Text>
                    </TouchableOpacity>
                  ) : courseStatus === 'failed' ? (
                    <TouchableOpacity
                      style={[styles.continueBtn, { backgroundColor: '#EF4444' }]}
                      onPress={() => {
                        if (targetLessonId && onNavigateToLesson) {
                          onNavigateToLesson(course.id, targetLessonId);
                        } else {
                          onNavigateToCourse?.(course.id);
                        }
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={isBangla ? 'পুনরায় শুরু করুন' : 'Retake Course'}
                    >
                      <Ionicons name="refresh" size={13} color="#FFFFFF" />
                      <Text style={[styles.continueBtnText, { color: '#FFFFFF' }]}>
                        {isBangla ? 'পুনরায় শুরু করুন' : 'Retake Course'}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.continueBtn, { backgroundColor: colors.primary }]}
                      onPress={() => {
                        if (targetLessonId && onNavigateToLesson) {
                          onNavigateToLesson(course.id, targetLessonId);
                        } else {
                          onNavigateToCourse?.(course.id);
                        }
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={isBangla ? 'চালিয়ে যান' : 'Continue Learning'}
                    >
                      <Ionicons name="play" size={13} color={colors.onPrimary} />
                      <Text style={[styles.continueBtnText, { color: colors.onPrimary }]}>
                        {isBangla ? 'চালিয়ে যান' : 'Continue Learning'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  guestBanner: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    alignItems: 'center',
  },
  guestBannerIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  guestBannerSubtitle: {
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 10,
  },
  guestLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    gap: 6,
    alignSelf: 'flex-start',
  },
  guestLoginBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  portfolioHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  sectionTitleMain: {
    fontSize: 16,
    fontWeight: '800',
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 0,
  },
  emptyCourseCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    marginTop: 10,
  },
  emptyCourseTitle: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyCourseSub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 260,
  },
  emptyActionBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  emptyActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  profileCourseCard: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
    gap: 12,
  },
  graduatedThumbContainer: {
    width: 90,
    height: 90,
    position: 'relative',
    borderRadius: 10,
    overflow: 'hidden',
  },
  courseThumb: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  graduatedCapPill: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  graduatedCapText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  courseDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  courseHeaderBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  courseCategoryTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  courseCategoryText: {
    fontSize: 10,
    fontWeight: '700',
  },
  coursePercentText: {
    fontSize: 11,
    fontWeight: '800',
  },
  courseCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 6,
  },
  courseProgressRow: {
    marginBottom: 8,
  },
  courseProgressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  courseProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  certificateActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    gap: 4,
    alignSelf: 'flex-start',
  },
  certificateActionBtnText: {
    color: '#102F53',
    fontSize: 11,
    fontWeight: '800',
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    gap: 4,
    alignSelf: 'flex-start',
  },
  continueBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
