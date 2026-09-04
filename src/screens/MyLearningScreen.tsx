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
import { useTheme } from '../context/ThemeContext';
import { useLearning } from '../context/LearningContext';
import { Header } from '../components/Header';
import { CertificateModal } from '../components/CertificateModal';
import { YouTubeCard } from '../components/YouTubeCard';
import { useYouTube } from '../context/YouTubeContext';
import { Certificate } from '../types';
import { YouTubeVideo } from '../data/youtubeVideos';

interface MyLearningScreenProps {
  onNavigateToCourse: (courseId: string) => void;
  onNavigateToLesson: (courseId: string, lessonId: string) => void;
  onBrowseCourses: () => void;
  onOpenSubscription?: () => void;
  onOpenNotifications?: () => void;
  onOpenYouTube?: () => void;
}

type TabMode = 'in-progress' | 'completed' | 'certificates' | 'saved';

export const MyLearningScreen: React.FC<MyLearningScreenProps> = ({
  onNavigateToCourse,
  onNavigateToLesson,
  onBrowseCourses,
  onOpenSubscription,
  onOpenNotifications,
  onOpenYouTube,
}) => {
  const { colors } = useTheme();
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

  // Compute total learning stats
  const totalCompletedLessons = Object.values(userProgress).reduce(
    (acc, p) => acc + p.completedLessonIds.length,
    0
  );
  const totalHoursLearned = (totalCompletedLessons * 0.35).toFixed(1);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="My Learning Hub"
        subtitle="Skill Progression & Portfolio"
        onOpenSubscription={onOpenSubscription}
        onOpenNotifications={onOpenNotifications}
        onOpenYouTube={onOpenYouTube}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
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
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Enrolled</Text>
            </View>

            <View style={[styles.statDivider, { backgroundColor: colors.borderSubtle }]} />

            <View style={styles.statBox}>
              <View style={[styles.statIconBg, { backgroundColor: colors.secondaryLight }]}>
                <Ionicons name="time" size={18} color={colors.secondary} />
              </View>
              <Text style={[styles.statNumber, { color: colors.text }]}>{totalHoursLearned}h</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Time Spent</Text>
            </View>

            <View style={[styles.statDivider, { backgroundColor: colors.borderSubtle }]} />

            <View style={styles.statBox}>
              <View style={[styles.statIconBg, { backgroundColor: colors.accentLight }]}>
                <Ionicons name="ribbon" size={18} color={colors.accent} />
              </View>
              <Text style={[styles.statNumber, { color: colors.text }]}>{certificates.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Certificates</Text>
            </View>
          </View>
        </View>

        {/* Tabs Bar */}
        <View style={[styles.tabsBar, { borderBottomColor: colors.border }]}>
          {[
            { id: 'in-progress', label: `In Progress (${inProgressList.length})` },
            { id: 'completed', label: `Completed (${completedList.length})` },
            { id: 'certificates', label: `Certificates (${certificates.length})` },
            { id: 'saved', label: `Saved (${savedList.length + savedVideos.length})` },
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
        <View style={styles.tabContent}>
          {activeTab === 'in-progress' && (
            <>
              {inProgressList.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="school-outline" size={48} color={colors.textLight} />
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>No courses in progress</Text>
                  <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                    Explore our top-rated executive masterclasses and start learning!
                  </Text>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                    onPress={onBrowseCourses}
                  >
                    <Text style={styles.actionBtnText}>Explore Catalog</Text>
                  </TouchableOpacity>
                </View>
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
                        <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
                          {course.title}
                        </Text>
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
                          >
                            <Text style={[styles.syllabusBtnText, { color: colors.text }]}>
                              Syllabus
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.resumeBtn, { backgroundColor: colors.primary }]}
                            onPress={() => onNavigateToLesson(course.id, targetLessonId)}
                          >
                            <Ionicons name="play" size={14} color="#FFFFFF" />
                            <Text style={styles.resumeBtnText}>Resume Lecture</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </>
          )}

          {activeTab === 'completed' && (
            <>
              {completedList.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="trophy-outline" size={48} color={colors.textLight} />
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>No completed courses yet</Text>
                  <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                    Complete all modules and pass quizzes to earn industry-verified certificates.
                  </Text>
                </View>
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
                          Completed
                        </Text>
                      </View>
                      <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
                        {course.title}
                      </Text>
                      <Text style={[styles.cardInstructor, { color: colors.textMuted }]}>
                        {course.instructor.name}
                      </Text>

                      <TouchableOpacity
                        style={[styles.viewCertBtn, { backgroundColor: colors.accentLight }]}
                        onPress={() => {
                          const cert = certificates.find((c) => c.courseId === course.id);
                          if (cert) setSelectedCert(cert);
                        }}
                      >
                        <Ionicons name="ribbon" size={16} color={colors.accent} />
                        <Text style={[styles.viewCertText, { color: colors.accent }]}>
                          View Digital Certificate
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
                <View style={styles.emptyContainer}>
                  <Ionicons name="ribbon-outline" size={48} color={colors.textLight} />
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>No certificates issued</Text>
                  <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                    Finish your active courses to unlock shareable credentials.
                  </Text>
                </View>
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
                  >
                    <View style={[styles.certIconBadge, { backgroundColor: '#FEF3C7' }]}>
                      <Ionicons name="ribbon" size={26} color="#D97706" />
                    </View>

                    <View style={styles.certCol}>
                      <Text style={[styles.certItemTitle, { color: colors.text }]} numberOfLines={2}>
                        {cert.courseTitle}
                      </Text>
                      <Text style={[styles.certItemMeta, { color: colors.textMuted }]}>
                        Issued {cert.issueDate} • ID: {cert.credentialId}
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
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>No saved items yet</Text>
                  <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                    Bookmark courses from the catalog or masterclasses from our YouTube channel to watch later.
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
                    >
                      <Ionicons name="logo-youtube" size={16} color="#FFFFFF" />
                      <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>
                        Browse YouTube Masterclasses
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
                          Saved YouTube Masterclasses ({savedVideos.length})
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
                          Saved Accredited Courses ({savedList.length})
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
  tabsBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  tabItem: {
    paddingVertical: 12,
    marginRight: 18,
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
