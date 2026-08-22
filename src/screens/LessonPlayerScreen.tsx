import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLearning } from '../context/LearningContext';
import { Header } from '../components/Header';
import { QuizModal } from '../components/QuizModal';
import { NotesModal } from '../components/NotesModal';
import { CertificateModal } from '../components/CertificateModal';
import { Lesson } from '../types';

interface LessonPlayerScreenProps {
  courseId: string;
  lessonId: string;
  onBack: () => void;
  onSelectLesson: (courseId: string, lessonId: string) => void;
}

type PlayerTab = 'curriculum' | 'overview' | 'notes' | 'resources';

export const LessonPlayerScreen: React.FC<LessonPlayerScreenProps> = ({
  courseId,
  lessonId,
  onBack,
  onSelectLesson,
}) => {
  const { colors, isDark } = useTheme();
  const {
    getCourseById,
    userProgress,
    markLessonCompleted,
    getNotesForLesson,
    certificates,
  } = useLearning();

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<string>('1.0x');
  const [activeTab, setActiveTab] = useState<PlayerTab>('curriculum');
  const [quizModalVisible, setQuizModalVisible] = useState<boolean>(false);
  const [notesModalVisible, setNotesModalVisible] = useState<boolean>(false);
  const [certModalVisible, setCertModalVisible] = useState<boolean>(false);

  const course = getCourseById(courseId);

  // Flatten lessons list for next/prev navigation
  const allLessons: { moduleTitle: string; lesson: Lesson }[] = [];
  course?.modules.forEach((mod) => {
    mod.lessons.forEach((l) => {
      allLessons.push({ moduleTitle: mod.title, lesson: l });
    });
  });

  const currentLessonIndex = allLessons.findIndex((item) => item.lesson.id === lessonId);
  const currentItem = allLessons[currentLessonIndex] || allLessons[0];
  const currentLesson = currentItem?.lesson;

  const progress = course ? userProgress[course.id] : undefined;
  const isLessonCompleted = progress?.completedLessonIds.includes(currentLesson?.id || '') || false;
  const lessonNotes = currentLesson ? getNotesForLesson(courseId, currentLesson.id) : [];

  const handleNextLesson = () => {
    if (currentLessonIndex < allLessons.length - 1) {
      const nextL = allLessons[currentLessonIndex + 1].lesson;
      onSelectLesson(courseId, nextL.id);
    }
  };

  const handlePrevLesson = () => {
    if (currentLessonIndex > 0) {
      const prevL = allLessons[currentLessonIndex - 1].lesson;
      onSelectLesson(courseId, prevL.id);
    }
  };

  const handleMarkComplete = () => {
    if (!currentLesson || !course) return;
    markLessonCompleted(course.id, currentLesson.id);

    const totalLessons = allLessons.length;
    const completedCount = (progress?.completedLessonIds.length || 0) + (isLessonCompleted ? 0 : 1);

    if (completedCount >= totalLessons) {
      Alert.alert(
        '🏆 Congratulations!',
        `You have completed all lessons for "${course.title}". Your verified certificate is ready!`,
        [
          {
            text: 'View Certificate',
            onPress: () => setCertModalVisible(true),
          },
          {
            text: 'Awesome',
          },
        ]
      );
    }
  };

  const cycleSpeed = () => {
    const speeds = ['1.0x', '1.25x', '1.5x', '2.0x'];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextIdx]);
  };

  if (!course || !currentLesson) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header showBack onBack={onBack} title="Lesson Player" />
        <View style={styles.centerContainer}>
          <Text style={{ color: colors.text }}>Lesson not found.</Text>
        </View>
      </View>
    );
  }

  const userCert = certificates.find((c) => c.courseId === course.id);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        showBack
        onBack={onBack}
        title={course.title}
        subtitle={currentItem?.moduleTitle}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Interactive Video Player Simulation */}
        <View style={styles.playerContainer}>
          <Image source={{ uri: course.thumbnail }} style={styles.playerVideoBg} />
          <View style={styles.playerOverlay}>
            {/* Center Play/Pause & Skip buttons */}
            <View style={styles.playerControlsRow}>
              <TouchableOpacity
                onPress={handlePrevLesson}
                disabled={currentLessonIndex === 0}
                style={[styles.skipBtn, currentLessonIndex === 0 && { opacity: 0.4 }]}
              >
                <Ionicons name="play-skip-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.mainPlayBtn}
                onPress={() => setIsPlaying(!isPlaying)}
              >
                <Ionicons name={isPlaying ? 'pause' : 'play'} size={32} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleNextLesson}
                disabled={currentLessonIndex === allLessons.length - 1}
                style={[
                  styles.skipBtn,
                  currentLessonIndex === allLessons.length - 1 && { opacity: 0.4 },
                ]}
              >
                <Ionicons name="play-skip-forward" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Bottom Scrubber & Info */}
            <View style={styles.playerBottomBar}>
              <View style={styles.timelineRow}>
                <View style={styles.scrubberTrack}>
                  <View style={[styles.scrubberProgress, { width: '42%' }]} />
                  <View style={styles.scrubberThumb} />
                </View>
              </View>

              <View style={styles.playerMetaRow}>
                <Text style={styles.playerTimeText}>04:15 / {currentLesson.duration}</Text>

                <View style={styles.playerActionButtons}>
                  <TouchableOpacity style={styles.speedPill} onPress={cycleSpeed}>
                    <Text style={styles.speedPillText}>{playbackSpeed}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.fullscreenBtn}
                    onPress={() => Alert.alert('Fullscreen', 'Rotated to landscape player.')}
                  >
                    <Ionicons name="scan-outline" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Lesson Title & Completion CTA */}
        <View style={styles.lessonHeaderCard}>
          <View style={styles.titleCol}>
            <Text style={[styles.lessonTitle, { color: colors.text }]}>
              {currentLesson.title}
            </Text>
            <Text style={[styles.lessonInstructor, { color: colors.textMuted }]}>
              {course.instructor.name} • {course.instructor.company}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.completeBtn,
              {
                backgroundColor: isLessonCompleted ? colors.primaryLight : colors.primary,
              },
            ]}
            onPress={handleMarkComplete}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isLessonCompleted ? 'checkmark-circle' : 'checkmark'}
              size={16}
              color={isLessonCompleted ? colors.primary : '#FFFFFF'}
            />
            <Text
              style={[
                styles.completeBtnText,
                { color: isLessonCompleted ? colors.primary : '#FFFFFF' },
              ]}
            >
              {isLessonCompleted ? 'Completed' : 'Mark Done'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Interactive Lesson Navigation & Tools Tab Strip */}
        <View style={[styles.tabsStrip, { borderBottomColor: colors.border }]}>
          {[
            { id: 'curriculum', label: 'Playlist', icon: 'list' },
            { id: 'overview', label: 'Overview', icon: 'information-circle' },
            { id: 'notes', label: `Notes (${lessonNotes.length})`, icon: 'document-text' },
            { id: 'resources', label: 'Files', icon: 'download' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tabButton,
                  isActive && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
                ]}
                onPress={() => setActiveTab(tab.id as PlayerTab)}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={15}
                  color={isActive ? colors.primary : colors.textMuted}
                />
                <Text
                  style={[
                    styles.tabButtonText,
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

        {/* Tab Content Panels */}
        <View style={styles.tabPanel}>
          {activeTab === 'curriculum' && (
            <View style={styles.curriculumList}>
              {allLessons.map((item, idx) => {
                const isSelected = item.lesson.id === currentLesson.id;
                const isCompleted = progress?.completedLessonIds.includes(item.lesson.id);

                return (
                  <TouchableOpacity
                    key={item.lesson.id}
                    style={[
                      styles.playlistRow,
                      isSelected && {
                        backgroundColor: colors.surfaceSubtle,
                        borderColor: colors.primary,
                      },
                      { borderColor: colors.border },
                    ]}
                    onPress={() => onSelectLesson(courseId, item.lesson.id)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.playlistIconBg,
                        {
                          backgroundColor: isCompleted
                            ? colors.primaryLight
                            : isSelected
                            ? colors.primary
                            : colors.surfaceSubtle,
                        },
                      ]}
                    >
                      {isCompleted ? (
                        <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                      ) : isSelected ? (
                        <Ionicons name="play" size={14} color="#FFFFFF" />
                      ) : (
                        <Text style={[styles.playlistIndex, { color: colors.textMuted }]}>
                          {idx + 1}
                        </Text>
                      )}
                    </View>

                    <View style={styles.playlistInfo}>
                      <Text
                        style={[
                          styles.playlistTitle,
                          {
                            color: isSelected ? colors.primary : colors.text,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {item.lesson.title}
                      </Text>
                      <Text style={[styles.playlistDuration, { color: colors.textLight }]}>
                        {item.lesson.duration}
                      </Text>
                    </View>

                    {item.lesson.quiz && (
                      <TouchableOpacity
                        style={[styles.quizPill, { backgroundColor: colors.secondaryLight }]}
                        onPress={() => setQuizModalVisible(true)}
                      >
                        <Ionicons name="help-circle" size={12} color={colors.secondary} />
                        <Text style={[styles.quizPillText, { color: colors.secondary }]}>Quiz</Text>
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {activeTab === 'overview' && (
            <View style={styles.overviewContainer}>
              <Text style={[styles.overviewHeading, { color: colors.text }]}>
                Lesson Description
              </Text>
              <Text style={[styles.overviewText, { color: colors.textMuted }]}>
                {currentLesson.summary ||
                  'In this lecture, you will explore core operational frameworks and practical workflows designed for maximum business productivity.'}
              </Text>

              {currentLesson.quiz && (
                <View
                  style={[
                    styles.quizCallout,
                    { backgroundColor: colors.surfaceCard, borderColor: colors.secondary },
                  ]}
                >
                  <View style={styles.quizCalloutLeft}>
                    <Ionicons name="school" size={24} color={colors.secondary} />
                    <View>
                      <Text style={[styles.quizCalloutTitle, { color: colors.text }]}>
                        Knowledge Check Available
                      </Text>
                      <Text style={[styles.quizCalloutSub, { color: colors.textMuted }]}>
                        Test your retention with {currentLesson.quiz.length} practical questions.
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.startQuizBtn, { backgroundColor: colors.secondary }]}
                    onPress={() => setQuizModalVisible(true)}
                  >
                    <Text style={styles.startQuizText}>Take Quiz</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {activeTab === 'notes' && (
            <View style={styles.notesTab}>
              <View style={styles.notesHeader}>
                <Text style={[styles.notesTitle, { color: colors.text }]}>
                  Your Notes for this Lecture
                </Text>
                <TouchableOpacity
                  style={[styles.takeNoteBtn, { backgroundColor: colors.primary }]}
                  onPress={() => setNotesModalVisible(true)}
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                  <Text style={styles.takeNoteText}>New Note</Text>
                </TouchableOpacity>
              </View>

              {lessonNotes.length === 0 ? (
                <View style={styles.emptyNotesBox}>
                  <Ionicons name="document-text-outline" size={36} color={colors.textLight} />
                  <Text style={[styles.emptyNotesText, { color: colors.textMuted }]}>
                    No notes yet. Tap "New Note" to capture key insights at any timestamp!
                  </Text>
                </View>
              ) : (
                lessonNotes.map((n) => (
                  <View
                    key={n.id}
                    style={[
                      styles.noteCard,
                      { backgroundColor: colors.surfaceCard, borderColor: colors.border },
                    ]}
                  >
                    <Text style={[styles.noteTimestamp, { color: colors.primary }]}>
                      Timestamp: {n.timestamp}
                    </Text>
                    <Text style={[styles.noteBody, { color: colors.text }]}>{n.text}</Text>
                  </View>
                ))
              )}
            </View>
          )}

          {activeTab === 'resources' && (
            <View style={styles.resourcesTab}>
              {[
                { name: 'Executive_AI_Prompt_Playbook.pdf', size: '2.4 MB', type: 'PDF' },
                { name: 'Financial_Model_Template_v3.xlsx', size: '1.8 MB', type: 'Excel' },
                { name: 'People_Analytics_Framework.docx', size: '850 KB', type: 'Doc' },
              ].map((res, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.resourceRow,
                    { backgroundColor: colors.surfaceCard, borderColor: colors.border },
                  ]}
                  onPress={() => Alert.alert('Downloading Resource', `Downloading ${res.name}...`)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.fileIconBg, { backgroundColor: colors.primaryLight }]}>
                    <Ionicons name="document-attach" size={18} color={colors.primary} />
                  </View>
                  <View style={styles.fileMeta}>
                    <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1}>
                      {res.name}
                    </Text>
                    <Text style={[styles.fileSize, { color: colors.textMuted }]}>
                      {res.type} • {res.size}
                    </Text>
                  </View>
                  <Ionicons name="download-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Quiz Modal */}
      {currentLesson.quiz && (
        <QuizModal
          visible={quizModalVisible}
          questions={currentLesson.quiz}
          onClose={() => setQuizModalVisible(false)}
          onPass={() => {
            markLessonCompleted(course.id, currentLesson.id);
            Alert.alert('Quiz Passed! ✅', 'Lesson marked as completed.');
          }}
        />
      )}

      {/* Notes Modal */}
      <NotesModal
        visible={notesModalVisible}
        courseId={course.id}
        lessonId={currentLesson.id}
        onClose={() => setNotesModalVisible(false)}
      />

      {/* Certificate Modal */}
      <CertificateModal
        visible={certModalVisible}
        certificate={userCert || null}
        onClose={() => setCertModalVisible(false)}
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
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerContainer: {
    height: 220,
    backgroundColor: '#000000',
    position: 'relative',
  },
  playerVideoBg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    opacity: 0.7,
  },
  playerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'space-between',
    padding: 14,
  },
  playerControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 30,
  },
  skipBtn: {
    padding: 8,
  },
  mainPlayBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(5, 150, 105, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerBottomBar: {
    gap: 6,
  },
  timelineRow: {
    width: '100%',
  },
  scrubberTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    position: 'relative',
  },
  scrubberProgress: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  scrubberThumb: {
    position: 'absolute',
    left: '42%',
    top: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  playerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerTimeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  playerActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  speedPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 6,
  },
  speedPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  fullscreenBtn: {
    padding: 2,
  },
  lessonHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    gap: 12,
  },
  titleCol: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    lineHeight: 22,
  },
  lessonInstructor: {
    fontSize: 12,
  },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  completeBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tabsStrip: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginRight: 18,
    gap: 6,
  },
  tabButtonText: {
    fontSize: 13,
  },
  tabPanel: {
    padding: 16,
  },
  curriculumList: {
    gap: 8,
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  playlistIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  playlistIndex: {
    fontSize: 12,
    fontWeight: '700',
  },
  playlistInfo: {
    flex: 1,
  },
  playlistTitle: {
    fontSize: 13,
    marginBottom: 2,
  },
  playlistDuration: {
    fontSize: 11,
  },
  quizPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  quizPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  overviewContainer: {
    gap: 12,
  },
  overviewHeading: {
    fontSize: 15,
    fontWeight: '700',
  },
  overviewText: {
    fontSize: 13,
    lineHeight: 20,
  },
  quizCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 10,
  },
  quizCalloutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  quizCalloutTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  quizCalloutSub: {
    fontSize: 11,
    marginTop: 2,
  },
  startQuizBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  startQuizText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  notesTab: {
    gap: 12,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  takeNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  takeNoteText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyNotesBox: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyNotesText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 240,
  },
  noteCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  noteTimestamp: {
    fontSize: 11,
    fontWeight: '700',
  },
  noteBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  resourcesTab: {
    gap: 10,
  },
  resourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  fileIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  fileMeta: {
    flex: 1,
  },
  fileName: {
    fontSize: 13,
    fontWeight: '600',
  },
  fileSize: {
    fontSize: 11,
    marginTop: 2,
  },
});
