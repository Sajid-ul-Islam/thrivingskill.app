import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useGamification } from '../context/GamificationContext';
import { useLearning } from '../context/LearningContext';
import { Header } from '../components/Header';
import { CertificateModal } from '../components/CertificateModal';
import { YouTubeCard } from '../components/YouTubeCard';
import { AnimatedTabContent, CircularProgressRing, SpringPressable, StateView } from '../components/common';
import { useYouTube } from '../context/YouTubeContext';
import { Certificate } from '../types';
import { MIN_TOUCH_TARGET } from '../theme/typography';

interface MyLearningScreenProps {
  onNavigateToCourse: (courseId: string) => void;
  onNavigateToLesson: (courseId: string, lessonId: string) => void;
  onBrowseCourses: () => void;
  onOpenSubscription?: () => void;
  onOpenNotifications?: () => void;
  onOpenYouTube?: () => void;
  onOpenDrawer?: () => void;
}

type TabMode = 'in-progress' | 'history' | 'completed' | 'certificates' | 'saved';

export const MyLearningScreen: React.FC<MyLearningScreenProps> = ({
  onNavigateToCourse,
  onNavigateToLesson,
  onBrowseCourses,
  onOpenSubscription,
  onOpenNotifications,
  onOpenYouTube,
  onOpenDrawer,
}) => {
  const { colors, isDark } = useTheme();
  const { isBangla } = useLanguage();
  const { streakDays } = useGamification();
  const insets = useSafeAreaInsets();
  const { savedVideos, playVideo } = useYouTube();
  const {
    courses,
    userProgress,
    bookmarks,
    certificates,
    getCourseProgressPercentage,
  } = useLearning();

  const [activeTab, setActiveTab] = useState<TabMode>('in-progress');
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

  // Enrolled courses
  const enrolledList = courses.filter((c) => !!userProgress[c.id]);
  const inProgressList = enrolledList.filter((c) => !userProgress[c.id].isCompleted);
  const completedList = enrolledList.filter((c) => userProgress[c.id].isCompleted);
  const savedList = courses.filter((c) => bookmarks.includes(c.id));

  // Build rich watch history list (Section 19 Spec)
  const historyList = enrolledList
    .map((course) => {
      const progress = userProgress[course.id];
      const targetLessonId =
        progress?.lastAccessedLessonId || course.modules[0]?.lessons[0]?.id || '';
      const targetLesson =
        course.modules.flatMap((m) => m.lessons).find((l) => l.id === targetLessonId) ||
        course.modules[0]?.lessons[0];
      const watchSec = progress?.lastWatchPositionSeconds?.[targetLessonId] || 120;
      const percent = getCourseProgressPercentage(course.id);
      return {
        course,
        lesson: targetLesson,
        watchSec,
        progressPercent: percent,
        dateWatched: isBangla ? 'আজ' : 'Today',
      };
    })
    .filter((h) => !!h.lesson);

  // Compute total learning stats
  const totalCompletedLessons = Object.values(userProgress).reduce(
    (acc, p) => acc + p.completedLessonIds.length,
    0
  );
  const totalHoursLearned = (totalCompletedLessons * 0.35).toFixed(1);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title={isBangla ? 'আমার লার্নিং হাব' : 'My Learning Hub'}
        subtitle={isBangla ? 'স্কিল প্রগ্রেস ও পোর্টফোলিও' : 'Skill Progression & Portfolio'}
        onOpenSubscription={onOpenSubscription}
        onOpenNotifications={onOpenNotifications}
        onOpenYouTube={onOpenYouTube}
        onOpenDrawer={onOpenDrawer}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 84 }]}>
        {/* Stats Dashboard Card */}
        <View
          style={[
            styles.statsCard,
            { backgroundColor: colors.surfaceCard, borderColor: colors.border },
          ]}
        >
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <View style={[styles.statIconBg, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="book" size={18} color={colors.primary} />
              </View>
              <Text style={[styles.statNumber, { color: colors.text }]}>{enrolledList.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                {isBangla ? 'এনরোল্ড' : 'Enrolled'}
              </Text>
            </View>

            <View style={[styles.statDivider, { backgroundColor: colors.borderSubtle }]} />

            <View style={styles.statBox}>
              <View style={[styles.statIconBg, { backgroundColor: colors.secondaryLight }]}>
                <Ionicons name="time" size={18} color={colors.secondary} />
              </View>
              <Text style={[styles.statNumber, { color: colors.text }]}>{totalHoursLearned}h</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                {isBangla ? 'মোট সময়' : 'Time Spent'}
              </Text>
            </View>

            <View style={[styles.statDivider, { backgroundColor: colors.borderSubtle }]} />

            <View style={styles.statBox}>
              <View style={[styles.statIconBg, { backgroundColor: colors.accentLight }]}>
                <Ionicons name="ribbon" size={18} color={colors.accent} />
              </View>
              <Text style={[styles.statNumber, { color: colors.text }]}>{certificates.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                {isBangla ? 'সার্টিফিকেট' : 'Certificates'}
              </Text>
            </View>
          </View>
        </View>

        {/* Daily Study Streak Banner */}
        <View
          style={[
            styles.streakBanner,
            {
              backgroundColor: colors.surfaceCard,
              borderColor: '#F59E0B',
            },
          ]}
        >
          <View style={styles.streakFlameWrap}>
            <Text style={styles.streakFlameEmoji}>🔥</Text>
          </View>
          <View style={styles.streakContent}>
            <View style={styles.streakHeaderRow}>
              <Text style={[styles.streakTitle, { color: colors.text }]}>
                {streakDays > 0
                  ? (isBangla ? `${streakDays} দিনের স্টাডি স্ট্রিক` : `${streakDays}-Day Study Streak`)
                  : (isBangla ? 'আজই স্টাডি স্ট্রিক শুরু করুন' : 'Start Your Study Streak Today')}
              </Text>
              <View style={styles.streakRankBadge}>
                <Text style={styles.streakRankText}>
                  {isBangla ? 'শীর্ষ ৫%' : 'Top 5%'}
                </Text>
              </View>
            </View>
            <Text style={[styles.streakSub, { color: colors.textMuted }]}>
              {isBangla
                ? `${totalHoursLearned} ঘণ্টা সম্পন্ন • স্ট্রিক সচল রাখতে আজ অন্তত ১টি লেসন শেষ করুন!`
                : `${totalHoursLearned}h learned • Complete 1 lesson today to keep your streak alive!`}
            </Text>
          </View>
        </View>

        {/* Tabs Bar (Horizontally scrollable so 5 tabs never overflow compact viewports) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.tabsBarScroll, { borderBottomColor: colors.border }]}
          contentContainerStyle={styles.tabsBar}
          accessibilityRole="tablist"
        >
          {[
            { id: 'in-progress', label: `${isBangla ? 'চলমান' : 'In Progress'} (${inProgressList.length})` },
            { id: 'history', label: `${isBangla ? 'হিস্ট্রি' : 'History'} (${historyList.length})` },
            { id: 'completed', label: `${isBangla ? 'সম্পন্ন' : 'Completed'} (${completedList.length})` },
            { id: 'certificates', label: `${isBangla ? 'সার্টিফিকেট' : 'Certificates'} (${certificates.length})` },
            { id: 'saved', label: `${isBangla ? 'সংরক্ষিত' : 'Saved'} (${savedList.length + savedVideos.length})` },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tabItem,
                  isActive && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
                ]}
                onPress={() => setActiveTab(tab.id as TabMode)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={isBangla ? `${tab.label} ট্যাব` : `${tab.label} tab`}
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
        </ScrollView>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          <AnimatedTabContent tabKey={activeTab}>
          {activeTab === 'in-progress' && (
            <>
              {inProgressList.length === 0 ? (
                <StateView
                  mode="empty"
                  icon="school-outline"
                  title={isBangla ? 'চলমান কোনো কোর্স নেই' : 'No courses in progress'}
                  message={
                    isBangla
                      ? 'আমাদের শীর্ষ এক্সিকিউটিভ মাস্টারক্লাসগুলো দেখুন এবং নতুন স্কিল অর্জন শুরু করুন!'
                      : 'Explore our top-rated executive masterclasses and start learning!'
                  }
                  primaryActionLabel={isBangla ? 'ক্যাটালগ দেখুন' : 'Explore Catalog'}
                  onPrimaryAction={onBrowseCourses}
                />
              ) : (
                inProgressList.map((course) => {
                  const percent = getCourseProgressPercentage(course.id);
                  const progress = userProgress[course.id];
                  const targetLessonId =
                    progress?.lastAccessedLessonId || course.modules[0]?.lessons[0]?.id || '';

                  return (
                    <View
                      key={course.id}
                      style={[
                        styles.learningCard,
                        { backgroundColor: colors.surfaceCard, borderColor: colors.border },
                      ]}
                    >
                      <Image source={{ uri: course.thumbnail }} style={styles.cardImage} />
                      <View style={styles.cardBody}>
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                          <Text style={[styles.cardTitle, { color: colors.text, flex: 1 }]} numberOfLines={2}>
                            {course.title}
                          </Text>
                          <CircularProgressRing
                            progress={percent}
                            size={38}
                            strokeWidth={3.5}
                            progressColor={colors.primary}
                            trackColor={colors.surfaceSubtle}
                            textSize={10}
                          />
                        </View>
                        <Text style={[styles.cardInstructor, { color: colors.textMuted }]}>
                          {course.instructor.name}
                        </Text>

                        {/* Progress */}
                        <View style={styles.progressRow}>
                          <View style={[styles.progressTrack, { backgroundColor: colors.surfaceSubtle }]}>
                            <View
                              style={[
                                styles.progressFill,
                                { backgroundColor: colors.primary, width: `${percent}%` },
                              ]}
                            />
                          </View>
                          <Text style={[styles.progressText, { color: colors.primary }]}>
                            {percent}%
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
                              isBangla
                                ? `${course.title} এর সিলেবাস দেখুন`
                                : `View syllabus for ${course.title}`
                            }
                          >
                            <Text style={[styles.syllabusBtnText, { color: colors.text }]}>
                              {isBangla ? 'সিলেবাস' : 'Syllabus'}
                            </Text>
                          </TouchableOpacity>

                          <SpringPressable
                            style={[styles.resumeBtn, { backgroundColor: colors.primary }]}
                            onPress={() => onNavigateToLesson(course.id, targetLessonId)}
                            activeScale={0.96}
                            accessibilityRole="button"
                            accessibilityLabel={
                              isBangla
                                ? `${course.title} এর লেকচার চালিয়ে যান`
                                : `Resume lecture for ${course.title}`
                            }
                          >
                            <Ionicons name="play" size={14} color={colors.onPrimary} />
                            <Text style={[styles.resumeBtnText, { color: colors.onPrimary }]}>
                              {isBangla ? 'চালিয়ে যান' : 'Resume Lecture'}
                            </Text>
                          </SpringPressable>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </>
          )}

          {activeTab === 'history' && (
            <>
              {historyList.length === 0 ? (
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
              ) : (
                historyList.map((item) => (
                  <View
                    key={item.course.id}
                    style={[
                      styles.learningCard,
                      { backgroundColor: colors.surfaceCard, borderColor: colors.border },
                    ]}
                  >
                    <Image source={{ uri: item.course.thumbnail }} style={styles.cardImage} />
                    <View style={styles.cardBody}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <View style={[styles.completedBadge, { backgroundColor: colors.primaryLight }]}>
                          <Ionicons name="time" size={12} color={colors.primary} />
                          <Text style={[styles.completedBadgeText, { color: colors.primary }]}>
                            {item.dateWatched}
                          </Text>
                        </View>
                        <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '700' }}>
                          {item.progressPercent}% {isBangla ? 'সম্পন্ন' : 'Watched'}
                        </Text>
                      </View>

                      <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                        {item.course.title}
                      </Text>

                      <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 8 }} numberOfLines={1}>
                        {isBangla ? 'সর্বশেষ লেসন: ' : 'Last Lesson: '}{item.lesson?.title || (isBangla ? 'কোর্স লেকচার' : 'Course Lecture')}
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
                        accessibilityLabel={
                          isBangla
                            ? `${item.course.title} চালিয়ে যান`
                            : `Resume ${item.course.title}`
                        }
                      >
                        <Ionicons name="play" size={14} color={colors.onPrimary} />
                        <Text style={[styles.resumeBtnText, { color: colors.onPrimary }]}>
                          {isBangla ? 'চালিয়ে যান' : 'Resume'} ({Math.floor(item.watchSec / 60)}m {item.watchSec % 60}s)
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </>
          )}

          {activeTab === 'completed' && (
            <>
              {completedList.length === 0 ? (
                <StateView
                  mode="empty"
                  icon="trophy-outline"
                  title={isBangla ? 'এখনো কোনো কোর্স সম্পন্ন হয়নি' : 'No completed courses yet'}
                  message={
                    isBangla
                      ? 'ভেরিফাইড ডিজিটাল সার্টিফিকেট অর্জন করতে সব মডিউল শেষ করুন ও কুইজ দিন।'
                      : 'Complete all modules and pass quizzes to earn industry-verified certificates.'
                  }
                  primaryActionLabel={isBangla ? 'ক্যাটালগ দেখুন' : 'Explore Catalog'}
                  onPrimaryAction={onBrowseCourses}
                />
              ) : (
                completedList.map((course) => (
                  <View
                    key={course.id}
                    style={[
                      styles.learningCard,
                      { backgroundColor: colors.surfaceCard, borderColor: colors.border },
                    ]}
                  >
                    <Image source={{ uri: course.thumbnail }} style={styles.cardImage} />
                    <View style={styles.cardBody}>
                      <View style={[styles.completedBadge, { backgroundColor: colors.primaryLight }]}>
                        <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                        <Text style={[styles.completedBadgeText, { color: colors.primary }]}>
                          {isBangla ? 'সম্পন্ন' : 'Completed'}
                        </Text>
                      </View>
                      <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
                        {course.title}
                      </Text>
                      <Text style={[styles.cardInstructor, { color: colors.textMuted }]}>
                        {course.instructor.name}
                      </Text>

                      <TouchableOpacity
                        style={[styles.viewCertBtn, { backgroundColor: colors.primaryLight }]}
                        onPress={() => {
                          const cert = certificates.find((c) => c.courseId === course.id);
                          if (cert) setSelectedCert(cert);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={
                          isBangla
                            ? `${course.title} এর ডিজিটাল সার্টিফিকেট দেখুন`
                            : `View digital certificate for ${course.title}`
                        }
                      >
                        <Ionicons name="ribbon" size={16} color={colors.primary} />
                        <Text style={[styles.viewCertText, { color: colors.primary }]}>
                          {isBangla ? 'ডিজিটাল সার্টিফিকেট দেখুন' : 'View Digital Certificate'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </>
          )}

          {activeTab === 'certificates' && (
            <>
              {certificates.length === 0 ? (
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
              ) : (
                certificates.map((cert) => (
                  <TouchableOpacity
                    key={cert.id}
                    style={[
                      styles.certItemCard,
                      {
                        backgroundColor: colors.surfaceCard,
                        borderColor: colors.border,
                        shadowColor: colors.cardShadow,
                      },
                    ]}
                    onPress={() => setSelectedCert(cert)}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel={
                      isBangla
                        ? `${cert.courseTitle} এর ভেরিফাইড সার্টিফিকেট দেখুন`
                        : `View verified digital certificate for ${cert.courseTitle}`
                    }
                  >
                    <View style={[styles.certIconBadge, { backgroundColor: isDark ? 'rgba(217, 119, 6, 0.2)' : '#FEF3C7' }]}>
                      <Ionicons name="ribbon" size={26} color={isDark ? '#FBBF24' : '#D97706'} />
                    </View>

                    <View style={styles.certCol}>
                      <View style={styles.verifiedTag}>
                        <Ionicons name="checkmark-circle" size={11} color={isDark ? '#34D399' : '#047857'} />
                        <Text style={[styles.verifiedTagText, { color: isDark ? '#34D399' : '#047857' }]}>
                          {isBangla ? 'ভেরিফাইড ক্রেডেনশিয়াল' : 'VERIFIED CREDENTIAL'}
                        </Text>
                      </View>
                      <Text style={[styles.certItemTitle, { color: colors.text }]} numberOfLines={2}>
                        {cert.courseTitle}
                      </Text>
                      <Text style={[styles.certItemMeta, { color: colors.textMuted }]}>
                        {isBangla ? 'ইস্যুর তারিখ ' : 'Issued '}{cert.issueDate} • ID: {cert.credentialId}
                      </Text>
                    </View>

                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                ))
              )}
            </>
          )}

          {activeTab === 'saved' && (
            <>
              {savedList.length === 0 && savedVideos.length === 0 ? (
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
                        gap: 6,
                        backgroundColor: '#FF0000',
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 10,
                        marginTop: 14,
                      }}
                      onPress={onOpenYouTube}
                      accessibilityRole="button"
                      accessibilityLabel={
                        isBangla
                          ? 'ইউটিউব মাস্টারক্লাস ব্রাউজ করুন'
                          : 'Browse YouTube Masterclasses'
                      }
                    >
                      <Ionicons name="logo-youtube" size={16} color="#FFFFFF" />
                      <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>
                        {isBangla ? 'ইউটিউব মাস্টারক্লাস ব্রাউজ করুন' : 'Browse YouTube Masterclasses'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <>
                  {/* Saved YouTube Videos Section */}
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

                  {/* Saved Accredited Courses Section */}
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
                          accessibilityLabel={
                            isBangla
                              ? `${course.title} কোর্সের বিস্তারিত দেখুন`
                              : `View details for ${course.title}`
                          }
                        >
                          <Image source={{ uri: course.thumbnail }} style={styles.savedThumb} />
                          <View style={styles.savedInfo}>
                            <Text style={[styles.savedTitle, { color: colors.text }]} numberOfLines={2}>
                              {course.title}
                            </Text>
                            <Text style={[styles.savedPrice, { color: colors.primary }]}>
                              ${course.price.toFixed(2)}
                            </Text>
                          </View>
                          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </>
              )}
            </>
          )}
          </AnimatedTabContent>
        </View>
      </ScrollView>

      {/* Certificate Viewer Modal */}
      <CertificateModal
        visible={!!selectedCert}
        certificate={selectedCert}
        onClose={() => setSelectedCert(null)}
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
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
  },
  statsCard: {
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  streakBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 12,
  },
  streakFlameWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakFlameEmoji: {
    fontSize: 22,
  },
  streakContent: {
    flex: 1,
  },
  streakHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  streakTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  streakRankBadge: {
    backgroundColor: '#FFB606',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  streakRankText: {
    color: '#102F53',
    fontSize: 10,
    fontWeight: '800',
  },
  streakSub: {
    fontSize: 11,
    lineHeight: 15,
  },
  tabsBarScroll: {
    borderBottomWidth: 1,
  },
  tabsBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  tabItem: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    paddingVertical: 10,
    marginRight: 20,
  },
  tabLabel: {
    fontSize: 13,
  },
  tabContent: {
    padding: 16,
  },
  learningCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  cardImage: {
    height: 120,
    width: '100%',
    resizeMode: 'cover',
  },
  cardBody: {
    padding: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 4,
  },
  cardInstructor: {
    fontSize: 12,
    marginBottom: 10,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
  },
  syllabusBtn: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
  },
  syllabusBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  resumeBtn: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  resumeBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    marginBottom: 8,
  },
  completedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  viewCertBtn: {
    minHeight: MIN_TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    marginTop: 8,
  },
  viewCertText: {
    fontSize: 13,
    fontWeight: '700',
  },
  certItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  certIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  certCol: {
    flex: 1,
    marginRight: 8,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  verifiedTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  certItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  certItemMeta: {
    fontSize: 11,
  },
  savedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  savedThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  savedInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  savedTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  savedPrice: {
    fontSize: 13,
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
    maxWidth: 240,
    lineHeight: 18,
  },
  actionBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
