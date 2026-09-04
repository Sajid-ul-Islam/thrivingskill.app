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
import { QuizPlayerModal } from '../components/QuizPlayerModal';
import { NotesModal } from '../components/NotesModal';
import { CertificateModal } from '../components/CertificateModal';
import { CourseQnATab } from '../components/CourseQnATab';
import { useLanguage } from '../context/LanguageContext';
import { useGamification } from '../context/GamificationContext';
import { OfflineManager } from '../services/offline/offlineManager';
import { Lesson } from '../types';

interface LessonPlayerScreenProps {
  courseId: string;
  lessonId: string;
  onBack: () => void;
  onSelectLesson: (courseId: string, lessonId: string) => void;
}

type PlayerTab = 'curriculum' | 'qna' | 'overview' | 'notes' | 'resources';

export const LessonPlayerScreen: React.FC<LessonPlayerScreenProps> = ({
  courseId,
  lessonId,
  onBack,
  onSelectLesson,
}) => {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const { recordStudyTime, unlockBadge } = useGamification();
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
  const [isCommuteMode, setIsCommuteMode] = useState<boolean>(false);
  const [quizModalVisible, setQuizModalVisible] = useState<boolean>(false);
  const [quizPlayerVisible, setQuizPlayerVisible] = useState<boolean>(false);
  const [notesModalVisible, setNotesModalVisible] = useState<boolean>(false);
  const [certModalVisible, setCertModalVisible] = useState<boolean>(false);
  const [isDownloaded, setIsDownloaded] = useState<boolean>(false);

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

  useEffect(() => {
    if (currentLesson?.id) {
      OfflineManager.isLessonDownloaded(currentLesson.id).then(setIsDownloaded);
    }
  }, [currentLesson?.id]);

  const handleToggleOffline = async () => {
    if (!currentLesson || !course) return;
    if (isDownloaded) {
      await OfflineManager.removeDownloadedLesson(currentLesson.id);
      setIsDownloaded(false);
      Alert.alert('Offline Storage', 'Lesson removed from offline downloads.');
    } else {
      await OfflineManager.saveLessonOffline(course.id, currentLesson);
      setIsDownloaded(true);
      Alert.alert('Downloaded! 💾', 'Lesson summary & resources saved for offline studying.');
    }
  };

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
    recordStudyTime(10);
    unlockBadge('streak_champ');

    const totalLessons = allLessons.length;
    const completedCount = (progress?.completedLessonIds.length || 0) + (isLessonCompleted ? 0 : 1);

    if (completedCount >= totalLessons) {
      Alert.alert(
        '🏆 Course Completed!',
        `Congratulations! You have completed all lessons for "${course.title}". Your official verified certificate is ready!`,
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
    } else {
      Alert.alert(
        'Lesson Completed! 🎉',
        `Great job mastering "${currentLesson.title}"! Would you like to take a quick knowledge check to test your retention?`,
        [
          {
            text: 'Take Quick Quiz 🧠',
            onPress: () => setQuizPlayerVisible(true),
          },
          {
            text: 'Next Lesson →',
            onPress: handleNextLesson,
          },
        ]
      );
    }
  };

  const cycleSpeed = () => {
    const speeds = ['0.75x', '1.0x', '1.25x', '1.5x', '2.0x'];
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

  const userCert = certificates.find((c) => c.courseId === course.id) || {
    id: `cert-${course.id}`,
    courseId: course.id,
    courseTitle: course.title,
    studentName: 'Sajid-ul Islam',
    issueDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    credentialId: `TS-2026-${course.id.slice(-4).toUpperCase()}`,
    verificationUrl: `https://thrivingskill.com/verify/TS-2026-${course.id.slice(-4).toUpperCase()}`,
    instructorName: course.instructor.name,
  };

  const isCourseCompleted =
    progress?.isCompleted ||
    (allLessons.length > 0 &&
      allLessons.every((item) => progress?.completedLessonIds.includes(item.lesson.id)));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        showBack
        onBack={onBack}
        title={course.title}
        subtitle={currentItem?.moduleTitle}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Mode Switcher: Video vs Commute Audio */}
        <View style={styles.modeSwitchBar}>
          <TouchableOpacity
            style={[
              styles.modeSwitchBtn,
              !isCommuteMode
                ? [styles.modeSwitchActive, { backgroundColor: colors.primary }]
                : { backgroundColor: colors.surfaceSubtle },
            ]}
            onPress={() => setIsCommuteMode(false)}
          >
            <Ionicons
              name="videocam"
              size={15}
              color={!isCommuteMode ? '#FFFFFF' : colors.textMuted}
            />
            <Text
              style={[
                styles.modeSwitchText,
                { color: !isCommuteMode ? '#FFFFFF' : colors.textMuted },
                !isCommuteMode && { fontWeight: '700' },
              ]}
            >
              Video Player
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeSwitchBtn,
              isCommuteMode
                ? [styles.modeSwitchActive, { backgroundColor: '#102F53' }]
                : { backgroundColor: colors.surfaceSubtle },
            ]}
            onPress={() => setIsCommuteMode(true)}
          >
            <Ionicons
              name="headset"
              size={15}
              color={isCommuteMode ? '#FFB606' : colors.textMuted}
            />
            <Text
              style={[
                styles.modeSwitchText,
                { color: isCommuteMode ? '#FFFFFF' : colors.textMuted },
                isCommuteMode && { fontWeight: '700' },
              ]}
            >
              Commute Audio
            </Text>
            <View style={styles.saveDataBadge}>
              <Text style={styles.saveDataBadgeText}>-85% Data</Text>
            </View>
          </TouchableOpacity>
        </View>

        {isCommuteMode ? (
          /* Interactive Commute Mode Player Simulation */
          <View
            style={[
              styles.commutePlayerCard,
              { backgroundColor: isDark ? '#0F192C' : '#102F53' },
            ]}
          >
            <View style={styles.commuteHeaderBadge}>
              <Ionicons name="leaf" size={13} color="#10B981" />
              <Text style={styles.commuteHeaderBadgeText}>
                Commute Mode Active • Bandwidth Saver
              </Text>
            </View>

            {/* Oscillating Audio Waveform */}
            <View style={styles.waveformContainer}>
              {[18, 30, 48, 22, 38, 54, 20, 36, 44, 26, 40, 52, 16, 32, 46, 24, 38, 44, 28, 18].map(
                (h, i) => (
                  <View
                    key={i}
                    style={[
                      styles.waveBar,
                      {
                        height: isPlaying ? h : 8,
                        backgroundColor: i % 2 === 0 ? '#FFB606' : '#E34234',
                      },
                    ]}
                  />
                )
              )}
            </View>

            <Text style={styles.commuteLessonTitle} numberOfLines={1}>
              {currentLesson.title}
            </Text>
            <Text style={styles.commuteInstructorText}>
              {course.instructor.name} • {currentItem?.moduleTitle}
            </Text>

            {/* Commute Controls */}
            <View style={styles.commuteControlsRow}>
              <TouchableOpacity
                style={styles.commuteSkipBtn}
                onPress={() => Alert.alert('Rewind', 'Rewound 15 seconds.')}
              >
                <Ionicons name="play-back" size={20} color="#FFFFFF" />
                <Text style={styles.skipSecText}>15s</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handlePrevLesson}
                disabled={currentLessonIndex === 0}
                style={[styles.commuteSkipBtn, currentLessonIndex === 0 && { opacity: 0.4 }]}
              >
                <Ionicons name="play-skip-back" size={22} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.commuteMainPlayBtn, { backgroundColor: colors.accent }]}
                onPress={() => setIsPlaying(!isPlaying)}
              >
                <Ionicons name={isPlaying ? 'pause' : 'play'} size={28} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleNextLesson}
                disabled={currentLessonIndex === allLessons.length - 1}
                style={[
                  styles.commuteSkipBtn,
                  currentLessonIndex === allLessons.length - 1 && { opacity: 0.4 },
                ]}
              >
                <Ionicons name="play-skip-forward" size={22} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.commuteSkipBtn}
                onPress={() => Alert.alert('Forward', 'Skipped forward 30 seconds.')}
              >
                <Ionicons name="play-forward" size={20} color="#FFFFFF" />
                <Text style={styles.skipSecText}>30s</Text>
              </TouchableOpacity>
            </View>

            {/* Commute Bottom Status Bar */}
            <View style={styles.commuteBottomBar}>
              <Text style={styles.commuteTimeText}>04:15 / {currentLesson.duration}</Text>
              <View style={styles.bgPlaybackNotice}>
                <Ionicons name="radio" size={13} color="#10B981" />
                <Text style={styles.bgPlaybackText}>Background Playback Active</Text>
              </View>
              <TouchableOpacity style={styles.speedPill} onPress={cycleSpeed}>
                <Text style={styles.speedPillText}>{playbackSpeed}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* Interactive Video Player Simulation */
          <View style={styles.playerContainer}>
            <Image source={{ uri: course.thumbnail }} style={styles.playerVideoBg} />
            <View style={styles.playerOverlay}>
              {/* Center Play/Pause & Skip buttons */}
              <View style={styles.playerControlsRow}>
                <TouchableOpacity
                  onPress={() => Alert.alert('Rewind', 'Rewound 10 seconds.')}
                  style={styles.skipBtn}
                >
                  <Ionicons name="play-back" size={20} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handlePrevLesson}
                  disabled={currentLessonIndex === 0}
                  style={[styles.skipBtn, currentLessonIndex === 0 && { opacity: 0.4 }]}
                >
                  <Ionicons name="play-skip-back" size={22} color="#FFFFFF" />
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
                  <Ionicons name="play-skip-forward" size={22} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => Alert.alert('Forward', 'Skipped forward 10 seconds.')}
                  style={styles.skipBtn}
                >
                  <Ionicons name="play-forward" size={20} color="#FFFFFF" />
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
        )}

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

          <View style={styles.actionRowRight}>
            <TouchableOpacity
              style={[
                styles.offlineBtn,
                { backgroundColor: isDownloaded ? colors.primary + '20' : colors.surfaceSubtle, borderColor: colors.border },
              ]}
              onPress={handleToggleOffline}
              accessibilityRole="button"
              accessibilityLabel={isDownloaded ? "Remove downloaded lesson" : "Download lesson for offline studying"}
            >
              <Ionicons
                name={isDownloaded ? 'cloud-done' : 'cloud-download-outline'}
                size={16}
                color={isDownloaded ? colors.primary : colors.textMuted}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.completeBtn,
                {
                  backgroundColor: isLessonCompleted ? colors.primaryLight : colors.primary,
                },
              ]}
              onPress={handleMarkComplete}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={isLessonCompleted ? "Lesson already completed" : "Mark lesson as complete"}
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
                {isLessonCompleted ? t('lessonCompleted') : t('markComplete')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Course Completion & Certificate Banner */}
        {isCourseCompleted && (
          <View
            style={[
              styles.completionBanner,
              {
                backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
                borderColor: '#10B981',
              },
            ]}
          >
            <View style={styles.completionIconWrap}>
              <Ionicons name="trophy" size={26} color="#F59E0B" />
            </View>
            <View style={styles.completionContent}>
              <View style={styles.completionHeaderRow}>
                <Text style={[styles.completionTitle, { color: isDark ? '#A7F3D0' : '#065F46' }]}>
                  Course Completed! 🎉
                </Text>
                <View style={styles.completionXpBadge}>
                  <Text style={styles.completionXpText}>+150 XP</Text>
                </View>
              </View>
              <Text style={[styles.completionSub, { color: isDark ? '#D1FAE5' : '#047857' }]}>
                Congratulations! You've mastered all lectures. Your verified certificate is ready.
              </Text>
              <TouchableOpacity
                style={styles.claimCertCTA}
                onPress={() => setCertModalVisible(true)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="View verified digital certificate"
              >
                <Ionicons name="ribbon" size={15} color="#FFFFFF" />
                <Text style={styles.claimCertCTAText}>View Digital Certificate</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Interactive Lesson Navigation & Tools Tab Strip */}
        <View style={[styles.tabsStrip, { borderBottomColor: colors.border }]}>
          {[
            { id: 'curriculum', label: 'Playlist', icon: 'list' },
            { id: 'qna', label: 'Q&A', icon: 'chatbubbles' },
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
          {activeTab === 'qna' && (
            <View style={{ paddingVertical: 4 }}>
              <CourseQnATab
                courseId={course.id}
                currentLessonTitle={currentLesson.title}
              />
            </View>
          )}

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

              <View
                style={[
                  styles.quizCallout,
                  { backgroundColor: colors.surfaceCard, borderColor: colors.secondary },
                ]}
              >
                <View style={styles.quizCalloutLeft}>
                  <Ionicons name="school" size={24} color={colors.secondary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.quizCalloutTitle, { color: colors.text }]}>
                      Knowledge Check
                    </Text>
                    <Text style={[styles.quizCalloutSub, { color: colors.textMuted }]} numberOfLines={1}>
                      Test your retention on this lecture to earn +25 XP.
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.startQuizBtn, { backgroundColor: colors.secondary }]}
                  onPress={() => setQuizPlayerVisible(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Take knowledge check quiz"
                >
                  <Text style={styles.startQuizText}>Take Quiz</Text>
                </TouchableOpacity>
              </View>
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

      {/* Interactive Assessment Quiz Player Modal */}
      <QuizPlayerModal
        visible={quizPlayerVisible}
        courseTitle={course.title}
        onClose={() => setQuizPlayerVisible(false)}
        onPassed={() => {
          markLessonCompleted(course.id, currentLesson.id);
          Alert.alert('Quiz Passed! 🎓', 'Chapter completed and progress saved.');
        }}
      />

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
    ...StyleSheet.absoluteFill,
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
  actionRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  offlineBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  completionBanner: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 12,
  },
  completionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionContent: {
    flex: 1,
  },
  completionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  completionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  completionXpBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  completionXpText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  completionSub: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  claimCertCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#059669',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  claimCertCTAText: {
    color: '#FFFFFF',
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
  modeSwitchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 10,
  },
  modeSwitchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
  },
  modeSwitchActive: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  modeSwitchText: {
    fontSize: 13,
    fontWeight: '600',
  },
  saveDataBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 2,
  },
  saveDataBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  commutePlayerCard: {
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  commuteHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
    marginBottom: 14,
  },
  commuteHeaderBadgeText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '700',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    gap: 4,
    marginBottom: 14,
    width: '100%',
  },
  waveBar: {
    width: 6,
    borderRadius: 3,
  },
  commuteLessonTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  commuteInstructorText: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
  },
  commuteControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
  },
  commuteSkipBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  skipSecText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    marginTop: -2,
  },
  commuteMainPlayBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#E34234',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  commuteBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  commuteTimeText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    fontWeight: '600',
  },
  bgPlaybackNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  bgPlaybackText: {
    color: '#6EE7B7',
    fontSize: 11,
    fontWeight: '600',
  },
});
