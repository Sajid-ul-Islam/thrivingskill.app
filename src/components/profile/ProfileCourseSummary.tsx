import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Platform,
  LayoutAnimation,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Course, Certificate, LearnPressCourseFilter, UserProgress } from '../../types';
import { GamificationBadge } from './ProfilePreferencesSection';
import { LearnPressStatsGrid } from '../cards/LearnPressStatsGrid';
import { shape } from '../../theme/shapes';
import { MIN_TOUCH_TARGET } from '../../theme/typography';
import { triggerHaptic } from '../../utils/haptics';
import { getSafeImageSource } from '../../utils/imageUtils';
import { useFeedback } from '../../context/FeedbackContext';

interface ProfileCourseSummaryProps {
  isAuthenticated: boolean;
  isDark: boolean;
  colors: any;
  isBangla: boolean;
  enrolledCount: number;
  completedCount: number;
  streakDays: number;
  certificates: Certificate[];
  badges: GamificationBadge[];
  displayedCourses: Course[];
  portfolioTab: LearnPressCourseFilter;
  setPortfolioTab: (tab: LearnPressCourseFilter) => void;
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
}

export const ProfileCourseSummary: React.FC<ProfileCourseSummaryProps> = ({
  isAuthenticated,
  isDark,
  colors,
  isBangla,
  enrolledCount,
  completedCount,
  streakDays,
  certificates,
  badges,
  displayedCourses,
  portfolioTab,
  setPortfolioTab,
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
}) => {
  const { showPopup } = useFeedback();
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    triggerHaptic('selection');
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setIsExpanded((prev) => !prev);
  };

  const visibleCourses = isExpanded ? displayedCourses : displayedCourses.slice(0, 2);

  return (
    <View style={styles.container}>
      {/* Unauthenticated Guest Sign-In Banner */}
      {!isAuthenticated && (
        <View
          style={[
            styles.guestBanner,
            { backgroundColor: colors.surfaceCard, borderColor: colors.primary },
          ]}
        >
          <View style={[styles.guestIconBg, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="person-circle-outline" size={24} color={colors.primary} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.guestTitle, { color: colors.text }]}>
              {isBangla ? 'অগ্রগতি সিঙ্ক করতে সাইন ইন করুন' : 'Sign In to Sync Your Learning'}
            </Text>
            <Text style={[styles.guestSub, { color: colors.textMuted }]}>
              {isBangla
                ? 'আপনার এনরোল করা কোর্স ও সার্টিফিকেট ক্লাউডে সুরক্ষিত রাখুন।'
                : 'Keep your courses, certificates, and daily streak synced across devices.'}
            </Text>
            <TouchableOpacity
              style={[styles.guestLoginBtn, { backgroundColor: colors.primary }]}
              onPress={onOpenAuthModal}
              accessibilityRole="button"
            >
              <Ionicons name="log-in-outline" size={15} color={colors.onPrimary} />
              <Text style={[styles.guestLoginBtnText, { color: colors.onPrimary }]}>
                {isBangla ? 'সাইন ইন / রেজিস্ট্রেশন' : 'Sign In / Register'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Modern Unified Executive KPI Bar */}
      <View
        style={[
          styles.kpiBarCard,
          {
            backgroundColor: colors.surfaceCard,
            borderColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.kpiCol}
          onPress={() => onNavigateTab('MyLearning')}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={
            isBangla ? `এনরোল্ড কোর্স ${enrolledCount}টি` : `Enrolled courses ${enrolledCount}`
          }
        >
          <Ionicons name="book-outline" size={15} color={colors.primary} />
          <Text style={[styles.kpiVal, { color: colors.primary }]}>{enrolledCount}</Text>
          <Text style={[styles.kpiLabel, { color: colors.textMuted }]} numberOfLines={1}>
            {isBangla ? 'এনরোল্ড' : 'Enrolled'}
          </Text>
        </TouchableOpacity>

        <View style={[styles.kpiDivider, { backgroundColor: colors.border }]} />

        <TouchableOpacity
          style={styles.kpiCol}
          onPress={() => onNavigateTab('MyLearning')}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={
            isBangla ? `সম্পন্ন কোর্স ${completedCount}টি` : `Completed courses ${completedCount}`
          }
        >
          <Ionicons name="checkmark-done-circle-outline" size={15} color="#10B981" />
          <Text style={[styles.kpiVal, { color: '#10B981' }]}>{completedCount}</Text>
          <Text style={[styles.kpiLabel, { color: colors.textMuted }]} numberOfLines={1}>
            {isBangla ? 'সম্পন্ন' : 'Completed'}
          </Text>
        </TouchableOpacity>

        <View style={[styles.kpiDivider, { backgroundColor: colors.border }]} />

        <TouchableOpacity
          style={styles.kpiCol}
          onPress={() => {
            if (certificates.length > 0) onSelectCertificate(certificates[0]);
          }}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={
            isBangla ? `সনদপত্র ${certificates.length}টি` : `Certificates ${certificates.length}`
          }
        >
          <Ionicons name="ribbon-outline" size={15} color="#E34234" />
          <Text style={[styles.kpiVal, { color: '#E34234' }]}>{certificates.length}</Text>
          <Text style={[styles.kpiLabel, { color: colors.textMuted }]} numberOfLines={1}>
            {isBangla ? 'সনদপত্র' : 'Certificates'}
          </Text>
        </TouchableOpacity>

        <View style={[styles.kpiDivider, { backgroundColor: colors.border }]} />

        <TouchableOpacity
          style={styles.kpiCol}
          onPress={() => onNavigateTab('MyLearning')}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={
            isBangla ? `স্টাডি স্ট্রিক ${streakDays} দিন` : `Study streak ${streakDays} days`
          }
        >
          <Ionicons name="flame" size={15} color="#E11D48" />
          <Text style={[styles.kpiVal, { color: '#E11D48' }]}>{streakDays}d</Text>
          <Text style={[styles.kpiLabel, { color: colors.textMuted }]} numberOfLines={1}>
            {isBangla ? 'স্ট্রিক' : 'Streak'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Verified Certificates Showcase */}
      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {isBangla ? 'আমার অর্জন ও সনদপত্র' : 'Verified Certificates'}
          </Text>
          {certificates.length > 0 && (
            <TouchableOpacity
              onPress={() => onSelectCertificate(certificates[0])}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[styles.headerActionLink, { color: colors.primary }]}>
                {isBangla
                  ? `সবগুলো (${certificates.length}) →`
                  : `View All (${certificates.length}) →`}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {certificates.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.certsScroll}
          >
            {certificates.map((cert) => (
              <View
                key={cert.id}
                style={[
                  styles.certCard,
                  { backgroundColor: colors.surfaceCard, borderColor: colors.border },
                ]}
              >
                <View style={styles.certTopRow}>
                  <View style={styles.certBrand}>
                    <View style={styles.certRibbonCircle}>
                      <Ionicons name="ribbon" size={13} color="#E34234" />
                    </View>
                    <Text style={[styles.certBrandText, { color: colors.text }]}>
                      Thriving <Text style={{ color: '#E34234' }}>Skills</Text>
                    </Text>
                  </View>
                  <View style={styles.certScoreBadge}>
                    <Text style={styles.certScoreText}>96% Score</Text>
                  </View>
                </View>

                <Text style={[styles.certCourseTitle, { color: colors.text }]} numberOfLines={2}>
                  {cert.courseTitle}
                </Text>

                <Text style={[styles.certIssueDate, { color: colors.textMuted }]}>
                  Issued: {cert.issueDate}
                </Text>

                <View style={[styles.certActionRow, { borderTopColor: colors.borderSubtle }]}>
                  <TouchableOpacity
                    style={[styles.certBtn, { backgroundColor: colors.primary }]}
                    onPress={() => {
                      triggerHaptic('light');
                      onSelectCertificate(cert);
                    }}
                  >
                    <Ionicons name="eye-outline" size={12} color={colors.onPrimary} />
                    <Text
                      style={[styles.certBtnText, { color: colors.onPrimary }]}
                      numberOfLines={1}
                    >
                      {isBangla ? 'সনদ দেখুন' : 'View Cert'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.certShareBtn,
                      { borderColor: colors.border, backgroundColor: colors.surfaceSubtle },
                    ]}
                    onPress={() => {
                      triggerHaptic('light');
                      onSelectCertificate(cert);
                    }}
                  >
                    <Ionicons name="share-social-outline" size={13} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        ) : (
          <View
            style={[
              styles.emptyCertBanner,
              { backgroundColor: colors.surfaceCard, borderColor: colors.border },
            ]}
          >
            <View style={[styles.emptyCertIconBg, { backgroundColor: 'rgba(227, 66, 52, 0.12)' }]}>
              <Ionicons name="ribbon-outline" size={20} color="#E34234" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.emptyCertTitle, { color: colors.text }]}>
                {isBangla ? 'ডিজিটাল সার্টিফিকেট আনলক করুন' : 'Unlock Your Official Certificate'}
              </Text>
              <Text style={[styles.emptyCertSub, { color: colors.textMuted }]}>
                {isBangla
                  ? 'যেকোনো কোর্স ১০০% সম্পন্ন করলেই ভেরিফাইড সনদপত্র যুক্ত হবে।'
                  : 'Complete 100% of any masterclass to earn an accredited certificate.'}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Achievement Badges Showcase */}
      {badges && badges.length > 0 && (
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 8 }]}>
            {isBangla ? 'অর্জিত স্কিল ব্যাজসমূহ' : 'Skill Mastery Badges'}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.badgesScroll}
          >
            {badges.map((b) => (
              <View
                key={b.id}
                style={[
                  styles.badgeCard,
                  {
                    backgroundColor: b.isUnlocked ? colors.surfaceCard : colors.surfaceSubtle,
                    borderColor: b.isUnlocked ? b.color : colors.border,
                    opacity: b.isUnlocked ? 1 : 0.6,
                  },
                ]}
              >
                <View style={[styles.badgeIconBox, { backgroundColor: b.color + '18' }]}>
                  <Ionicons
                    name={b.icon as any}
                    size={18}
                    color={b.isUnlocked ? b.color : colors.textMuted}
                  />
                </View>
                <Text style={[styles.badgeTitle, { color: colors.text }]} numberOfLines={1}>
                  {isBangla ? b.banglaTitle : b.title}
                </Text>
                <Text
                  style={[styles.badgeStatus, { color: b.isUnlocked ? b.color : colors.textMuted }]}
                >
                  {b.isUnlocked
                    ? isBangla
                      ? '✓ আনলক'
                      : '✓ Unlocked'
                    : isBangla
                      ? '🔒 লক'
                      : '🔒 Locked'}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Enrolled Courses Portfolio Module */}
      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="school" size={16} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {isBangla ? 'আমার কোর্স পোর্টফোলিও' : 'My Course Portfolio'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => onNavigateTab('MyLearning')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.headerActionLink, { color: colors.primary }]}>
              {isBangla ? 'লার্নিং হাব →' : 'Learning Hub →'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filter Chips - Compact pills to eliminate redundancy with top KPI bar */}
        <LearnPressStatsGrid
          stats={lpStats}
          activeFilter={portfolioTab}
          onSelectFilter={(filter) => setPortfolioTab(filter)}
          colors={colors}
          isBangla={isBangla}
          isDark={isDark}
          compactTabs={true}
        />

        {/* Course Cards List */}
        {displayedCourses.length === 0 ? (
          <View
            style={[
              styles.emptyCourseCard,
              { backgroundColor: colors.surfaceCard, borderColor: colors.border },
            ]}
          >
            <Ionicons name="school-outline" size={28} color={colors.textMuted} />
            <Text style={[styles.emptyCourseTitle, { color: colors.text }]}>
              {portfolioTab === 'passed'
                ? isBangla
                  ? 'এখনো কোনো কোর্স উত্তীর্ণ হয়নি'
                  : 'No passed courses yet'
                : isBangla
                  ? 'কোনো কোর্স এনরোল করা নেই'
                  : 'No enrolled courses found'}
            </Text>
            <TouchableOpacity
              style={[styles.browseCatalogBtn, { backgroundColor: colors.primary }]}
              onPress={() => onNavigateTab('Courses')}
              accessibilityRole="button"
            >
              <Text style={[styles.browseCatalogText, { color: colors.onPrimary }]}>
                {isBangla ? 'কোর্স ক্যাটালগ দেখুন' : 'Explore Courses'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {visibleCourses.map((course) => {
              const prog = userProgress[course.id];
              const courseStatus = getCourseStatus(course.id);
              const isGraduated = courseStatus === 'passed' || courseStatus === 'finished';
              const totalLessons =
                course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0;
              const completedCountForCourse = prog?.completedLessonIds?.length || 0;
              const pct =
                totalLessons > 0
                  ? Math.min(100, Math.round((completedCountForCourse / totalLessons) * 100))
                  : 0;
              const targetLessonId =
                prog?.lastAccessedLessonId || course.modules?.[0]?.lessons?.[0]?.id || '';
              const cert = certificates.find((c) => c.courseId === course.id);

              const badgeColor =
                courseStatus === 'passed'
                  ? '#16A34A'
                  : courseStatus === 'failed'
                    ? '#EF4444'
                    : '#8B5CF6';
              const badgeBg =
                courseStatus === 'passed'
                  ? '#DCFCE7'
                  : courseStatus === 'failed'
                    ? '#FEE2E2'
                    : '#EDE9FE';

              return (
                <View
                  key={course.id}
                  style={[
                    styles.courseCard,
                    { backgroundColor: colors.surfaceCard, borderColor: colors.border },
                  ]}
                >
                  <Image
                    source={getSafeImageSource(course.thumbnail)}
                    style={styles.courseThumb}
                    {...(Platform.OS === 'web' ? { referrerPolicy: 'no-referrer' } : {})}
                  />
                  <View style={styles.courseContent}>
                    <View style={styles.courseStatusRow}>
                      <View
                        style={[
                          styles.statusPill,
                          { backgroundColor: isDark ? `${badgeColor}25` : badgeBg },
                        ]}
                      >
                        <Text style={[styles.statusText, { color: badgeColor }]}>
                          {courseStatus.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={[styles.coursePercentText, { color: colors.primary }]}>
                        {courseStatus === 'passed' ? '100%' : `${pct}%`}
                      </Text>
                    </View>

                    <Text style={[styles.courseTitle, { color: colors.text }]} numberOfLines={1}>
                      {course.title}
                    </Text>

                    <View style={[styles.progressTrack, { backgroundColor: colors.surfaceSubtle }]}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            backgroundColor: courseStatus === 'passed' ? '#16A34A' : colors.primary,
                            width: `${Math.max(pct, isGraduated ? 100 : 8)}%`,
                          },
                        ]}
                      />
                    </View>

                    <View style={styles.courseBtnRow}>
                      {courseStatus === 'passed' && cert && hasReviewedCourse(course.id) ? (
                        <TouchableOpacity
                          style={[styles.cardActionBtn, { backgroundColor: '#E34234' }]}
                          onPress={() => onSelectCertificate(cert)}
                        >
                          <Ionicons name="ribbon" size={12} color="#FFFFFF" />
                          <Text style={[styles.cardActionBtnText, { color: '#FFFFFF' }]}>
                            {isBangla ? 'সনদপত্র' : 'Certificate'}
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={[styles.cardActionBtn, { backgroundColor: colors.primary }]}
                          onPress={() => {
                            if (targetLessonId && onNavigateToLesson) {
                              onNavigateToLesson(course.id, targetLessonId);
                            } else {
                              onNavigateToCourse?.(course.id);
                            }
                          }}
                        >
                          <Ionicons name="play" size={11} color={colors.onPrimary} />
                          <Text style={[styles.cardActionBtnText, { color: colors.onPrimary }]}>
                            {isBangla ? 'চালিয়ে যান' : 'Continue'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}

            {/* Expand / Collapse Button if more than 2 courses */}
            {displayedCourses.length > 2 && (
              <TouchableOpacity
                style={[
                  styles.toggleExpandBtn,
                  { borderColor: colors.border, backgroundColor: colors.surfaceSubtle },
                ]}
                onPress={toggleExpand}
              >
                <Text style={[styles.toggleExpandText, { color: colors.primary }]}>
                  {isExpanded
                    ? isBangla
                      ? 'সংক্ষিপ্ত করুন ↑'
                      : 'Show Less ↑'
                    : isBangla
                      ? `আরও ${displayedCourses.length - 2}টি কোর্স দেখুন ↓`
                      : `Show All ${displayedCourses.length} Courses ↓`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: shape.large,
    borderWidth: 1,
    gap: 12,
    marginBottom: 14,
  },
  guestIconBg: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    marginBottom: 2,
  },
  guestSub: {
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 8,
  },
  guestLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 7,
    gap: 5,
  },
  guestLoginBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  kpiBarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: shape.large,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  kpiCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  kpiDivider: {
    width: 1,
    height: 24,
  },
  kpiVal: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  kpiLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 1,
  },
  sectionBlock: {
    marginBottom: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerActionLink: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  certsScroll: {
    gap: 10,
    paddingBottom: 4,
  },
  certCard: {
    width: 210,
    borderRadius: shape.large,
    borderWidth: 1,
    padding: 12,
  },
  certTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  certBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  certRibbonCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#102F53',
    alignItems: 'center',
    justifyContent: 'center',
  },
  certBrandText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  certScoreBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  certScoreText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#10B981',
  },
  certCourseTitle: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    marginBottom: 4,
    minHeight: 32,
  },
  certIssueDate: {
    fontSize: 10,
    marginBottom: 10,
  },
  certActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  certBtn: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderRadius: 6,
    gap: 4,
  },
  certBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    flexShrink: 1,
  },
  certShareBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: shape.medium,
    borderWidth: 1,
    gap: 10,
  },
  emptyCertIconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCertTitle: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  emptyCertSub: {
    fontSize: 10.5,
    lineHeight: 14,
    marginTop: 1,
  },
  badgesScroll: {
    gap: 8,
    paddingBottom: 4,
  },
  badgeCard: {
    width: 86,
    padding: 8,
    borderRadius: shape.medium,
    borderWidth: 1,
    alignItems: 'center',
  },
  badgeIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  badgeTitle: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  badgeStatus: {
    fontSize: 8.5,
    fontWeight: '700',
    marginTop: 2,
  },
  courseCard: {
    flexDirection: 'row',
    padding: 10,
    borderRadius: shape.medium,
    borderWidth: 1,
    gap: 10,
    alignItems: 'center',
  },
  courseThumb: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#102F53',
  },
  courseContent: {
    flex: 1,
    minWidth: 0,
  },
  courseStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  statusPill: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  coursePercentText: {
    fontSize: 11,
    fontWeight: '800',
  },
  courseTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    marginBottom: 6,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  courseBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cardActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 5,
    gap: 3,
  },
  cardActionBtnText: {
    fontSize: 10,
    fontWeight: '700',
  },
  toggleExpandBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: shape.small,
    borderWidth: 1,
    marginTop: 2,
  },
  toggleExpandText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyCourseCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 14,
    borderRadius: shape.medium,
    borderWidth: 1,
    gap: 6,
  },
  emptyCourseTitle: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  browseCatalogBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 4,
  },
  browseCatalogText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
