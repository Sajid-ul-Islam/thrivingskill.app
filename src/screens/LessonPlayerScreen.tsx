import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useLearning } from '../context/LearningContext';
import { useLanguage } from '../context/LanguageContext';
import { useFeedback } from '../context/FeedbackContext';
import { Header, StateView, LessonVideoContainer, buildLessonVideoHtml } from '../components';
import { triggerHaptic } from '../utils/haptics';
import { LessonsService } from '../services/api/lessonsService';
import { Lesson } from '../types';
import { lessonPlayerStyles as styles } from './lesson-player/lessonPlayerStyles';
import { formatSeconds } from './lesson-player/lessonHelpers';
import { useLessonPlayerState } from './lesson-player/useLessonPlayerState';
import { LessonAccessBanners } from './lesson-player/LessonAccessBanners';
import { LessonFocusPanel } from './lesson-player/LessonFocusPanel';
import { LessonPlayerTabsSection } from './lesson-player/LessonPlayerTabsSection';
import { LessonPlayerModals } from './lesson-player/LessonPlayerModals';

interface LessonPlayerScreenProps {
  courseId: string;
  lessonId: string;
  onBack: () => void;
  onSelectLesson: (courseId: string, lessonId: string) => void;
}

export const LessonPlayerScreen: React.FC<LessonPlayerScreenProps> = ({
  courseId,
  lessonId,
  onBack,
  onSelectLesson,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { isBangla } = useLanguage();
  const { showToast } = useFeedback();
  const { addNote, deleteNote, restoreNote, unlockCertificateForDev } = useLearning();

  const p = useLessonPlayerState({ courseId, lessonId, onSelectLesson });
  const { course, currentLesson } = p;

  const memoizedVideoHtml = useMemo(() => {
    if (!p.hasPlayableVideo) return '';
    return buildLessonVideoHtml(p.activeVideoIntro, p.activeVideoUrl, p.initialResumeSeconds, 1.0);
  }, [p.hasPlayableVideo, p.activeVideoIntro, p.activeVideoUrl, p.initialResumeSeconds]);

  if (!course || !currentLesson) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header showBack onBack={onBack} title="Lesson Player" />
        <View style={[styles.centerContainer, { paddingHorizontal: 20 }]}>
          <StateView
            mode="error"
            title="Lesson not found"
            message="This lecture could not be loaded right now. Return to the course syllabus to choose another lesson."
            primaryActionLabel="Go Back"
            onPrimaryAction={onBack}
          />
        </View>
      </View>
    );
  }

  const isCourseCompleted =
    p.progress?.isCompleted ||
    (p.allLessons.length > 0 &&
      p.allLessons.every((item) => p.progress?.completedLessonIds.includes(item.lesson.id)));

  const displayLesson: Lesson = {
    ...currentLesson,
    title: p.resolvedLessonVideo.title || currentLesson.title,
    duration: p.resolvedLessonVideo.duration || currentLesson.duration,
    summary: p.resolvedLessonVideo.summary || currentLesson.summary,
    videoUrl: p.resolvedLessonVideo.videoUrl,
    videoIntro: p.resolvedLessonVideo.videoIntro,
    videoId: p.resolvedLessonVideo.videoId,
    videoType: p.resolvedLessonVideo.videoType,
  };

  const previewLesson =
    course.modules?.flatMap((m) => m.lessons || []).find((l) => l.isFreePreview) ||
    course.modules?.[0]?.lessons?.[0];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar hidden={p.isFullscreen} style={isDark ? 'light' : 'dark'} />

      {!p.isFullscreen && (
        <Header
          showBack
          onBack={onBack}
          title={course.title || 'Course Player'}
          subtitle={p.currentItem?.moduleTitle}
          rightAction={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <TouchableOpacity
                style={[
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    paddingHorizontal: 8,
                    paddingVertical: 5,
                    borderRadius: 14,
                    borderWidth: 1,
                    minHeight: 32,
                  },
                  p.isFocusMode
                    ? { backgroundColor: 'rgba(227, 66, 52, 0.12)', borderColor: '#E34234' }
                    : { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                ]}
                onPress={() => {
                  triggerHaptic('light');
                  p.setIsFocusMode(!p.isFocusMode);
                  showToast({
                    message: !p.isFocusMode
                      ? isBangla
                        ? 'ফোকাস মোড সক্রিয়: ডিস্ট্রাকশন-মুক্ত ভিউ'
                        : 'Focus Mode active: distraction-free viewing'
                      : isBangla
                        ? 'সাধারণ ভিউ সক্রিয়'
                        : 'Standard View active',
                    type: 'info',
                  });
                }}
                accessibilityRole="button"
                accessibilityLabel="Toggle focus mode"
              >
                <Ionicons
                  name={p.isFocusMode ? 'scan' : 'scan-outline'}
                  size={14}
                  color={p.isFocusMode ? '#E34234' : colors.text}
                />
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: p.isFocusMode ? '#E34234' : colors.text,
                  }}
                >
                  Focus
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.commuteToggleBtn,
                  {
                    backgroundColor: p.isCommuteMode ? '#102F53' : colors.surfaceSubtle,
                    borderColor: p.isCommuteMode ? '#102F53' : colors.border,
                  },
                ]}
                onPress={() => {
                  triggerHaptic('light');
                  const nextMode = !p.isCommuteMode;
                  p.setIsCommuteMode(nextMode);
                  showToast({
                    message: nextMode
                      ? p.isDirectStream
                        ? isBangla
                          ? 'ব্যাকগ্রাউন্ড অডিও মোড সক্রিয় (স্ক্রিন বন্ধ করেও চলবে)'
                          : 'Background Audio Mode active (continues with screen locked)'
                        : isBangla
                          ? 'অডিও-ফোকাস শোনার মোড সক্রিয়'
                          : 'Audio Listening Mode active'
                      : isBangla
                        ? 'স্ট্যান্ডার্ড প্লেয়ার সক্রিয়'
                        : 'Standard Player active',
                    type: 'info',
                  });
                }}
                accessibilityRole="button"
                accessibilityLabel="Toggle commute background audio mode"
              >
                <Ionicons
                  name={p.isCommuteMode ? 'headset' : 'headset-outline'}
                  size={16}
                  color={p.isCommuteMode ? '#FFFFFF' : colors.text}
                />
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <LessonAccessBanners
        isPrivileged={p.isPrivileged}
        isAdmin={p.isAdmin}
        isEnrolled={p.isEnrolled}
        isFreePreview={p.isFreePreview}
        isFullscreen={p.isFullscreen}
        isDark={isDark}
        isBangla={isBangla}
        onUnlockTestCert={() => {
          const cert = unlockCertificateForDev(course.id);
          if (cert) p.setCertModalVisible(true);
        }}
        onOpenTestReview={() => p.setMandatoryReviewVisible(true)}
      />

      <View
        style={
          !p.isFullscreen
            ? [styles.videoPlayerWrapper, { backgroundColor: colors.background }]
            : styles.fullscreenWrapper
        }
      >
        <LessonVideoContainer
          course={course}
          currentLesson={displayLesson}
          moduleTitle={p.currentItem?.moduleTitle}
          canPlayVideo={p.canPlayVideo}
          hasVideo={p.hasPlayableVideo}
          videoComingSoonMessage={p.resolvedLessonVideo.comingSoonMessage}
          isLessonCompleted={p.isLessonCompleted}
          isCommuteMode={p.isCommuteMode}
          isPlaying={p.isPlaying}
          playbackSpeed={p.playbackSpeed}
          streamQuality={p.streamQuality}
          initialPositionSeconds={p.initialResumeSeconds}
          isFullscreen={p.isFullscreen}
          isDeviceLandscape={p.isDeviceLandscape}
          isScreenLocked={p.isScreenLocked}
          isLoadingVideo={p.isLoadingVideo}
          isDirectStream={p.isDirectStream}
          activeVideoUrl={p.activeVideoUrl}
          resolvedVideoUrl={p.activeVideoUrl}
          zoomMeetingUrl={p.zoomMeetingUrl}
          videoHtml={memoizedVideoHtml}
          windowDimensions={p.windowDimensions}
          currentPositionSeconds={p.currentPositionSeconds}
          totalLessonSeconds={p.totalLessonSeconds}
          autoplayCountdown={p.autoplayCountdown}
          nextLessonTitle={p.allLessons[p.currentLessonIndex + 1]?.lesson.title}
          hasPrevLesson={p.currentLessonIndex > 0}
          hasNextLesson={p.currentLessonIndex < p.allLessons.length - 1}
          nativePlayerRef={p.nativePlayerRef}
          webViewControllerRef={p.webViewControllerRef}
          previewLesson={previewLesson}
          onSelectLesson={onSelectLesson}
          onOpenPaymentModal={() => p.setPaymentModalVisible(true)}
          onOpenQuizPlayer={(l) => {
            p.setSelectedQuizLesson(l);
            p.setQuizPlayerVisible(true);
          }}
          onTogglePlay={p.handleTogglePlay}
          onPausePlayback={p.handlePausePlayback}
          onSeekTo={p.handleSeekTo}
          onRewind={p.handleRewind}
          onForward={p.handleForward}
          onPrevLesson={p.handlePrevLesson}
          onNextLesson={p.handleNextLesson}
          onCycleSpeed={p.cycleSpeed}
          onToggleFullscreen={p.handleToggleFullscreen}
          onToggleScreenLock={() => {
            triggerHaptic('light');
            p.setIsScreenLocked(!p.isScreenLocked);
            showToast({
              message: !p.isScreenLocked ? 'Screen Touches Locked' : 'Screen Unlocked',
              type: 'info',
            });
          }}
          onOpenStreamQualityModal={p.handleOpenStreamQualityModal}
          onTriggerPiP={p.handleTriggerPiP}
          onCancelAutoplay={() => {
            triggerHaptic('light');
            p.setAutoplayCountdown(null);
          }}
          onMarkComplete={p.handleMarkComplete}
          onVideoEnded={p.completeCurrentLessonAndAdvance}
          onPictureInPictureStart={() => p.setIsSystemPiPActive(true)}
          onPictureInPictureStop={() => p.setIsSystemPiPActive(false)}
          onDurationDetected={(dur) => p.handleLiveProgressUpdate(p.currentPosRef.current, dur)}
          onProgressUpdate={(curr, reportedDuration) => {
            p.handleLiveProgressUpdate(curr, reportedDuration);
            const sec = Math.floor(curr);
            const totalDur = Math.max(p.totalLessonSeconds, Math.round(reportedDuration || 0));

            if (
              currentLesson.quiz &&
              currentLesson.quiz.length > 0 &&
              !p.checkpointTriggeredRef.current[currentLesson.id]
            ) {
              const midpoint = Math.floor((totalDur || 300) / 2);
              if (sec >= midpoint && midpoint >= 30) {
                p.checkpointTriggeredRef.current[currentLesson.id] = true;
                p.handlePausePlayback();
                triggerHaptic('medium');
                p.setSelectedQuizLesson(currentLesson);
                p.setQuizPlayerVisible(true);
                showToast({
                  message: isBangla
                    ? '🎯 ইন-ভিডিও চেকপয়েন্ট কুইজ! সঠিক উত্তর দিয়ে এগিয়ে যান।'
                    : '🎯 In-video checkpoint! Test your understanding before continuing.',
                  type: 'info',
                });
              }
            }

            if (
              totalDur > 60 &&
              sec / totalDur >= 0.85 &&
              p.currentLessonIndex < p.allLessons.length - 1
            ) {
              const nextLessonObj = p.allLessons[p.currentLessonIndex + 1]?.lesson;
              const canPrefetchNext =
                p.isPrivileged || p.isEnrolled || Boolean(nextLessonObj?.isFreePreview);
              if (
                canPrefetchNext &&
                nextLessonObj &&
                p.prefetchedNextLessonRef.current !== nextLessonObj.id
              ) {
                p.prefetchedNextLessonRef.current = nextLessonObj.id;
                LessonsService.getLessonDetail(nextLessonObj.id).catch(() => {});
              }
            }
          }}
          onPlayStateChange={p.setIsPlaying}
          formatSeconds={formatSeconds}
        />
      </View>

      {!p.isFullscreen && (
        <View style={styles.lowerLearningArea}>
          {p.isFocusMode ? (
            <LessonFocusPanel
              colors={colors}
              isBangla={isBangla}
              currentPositionSeconds={p.currentPositionSeconds}
              totalLessonSeconds={p.totalLessonSeconds}
              currentLessonIndex={p.currentLessonIndex}
              totalLessonsCount={p.allLessons.length}
              onExitFocus={() => p.setIsFocusMode(false)}
              onPrevLesson={p.handlePrevLesson}
              onNextLesson={p.handleNextLesson}
            />
          ) : (
            <LessonPlayerTabsSection
              course={course}
              courseId={courseId}
              currentLesson={currentLesson}
              displayLesson={displayLesson}
              rawLessonContent={p.rawLessonContent}
              isStudyGuideSaved={p.isStudyGuideSaved}
              onSaveStudyGuideOffline={p.handleSaveStudyGuideOffline}
              allLessons={p.allLessons}
              completedLessonIds={p.progress?.completedLessonIds || []}
              isCourseCompleted={isCourseCompleted}
              isEnrolled={p.isEnrolled}
              isPrivileged={p.isPrivileged}
              isLessonCompleted={p.isLessonCompleted}
              lessonNotes={p.lessonNotes}
              currentPositionSeconds={p.currentPositionSeconds}
              totalLessonSeconds={p.totalLessonSeconds}
              screenWidth={p.windowDimensions.width}
              insetsBottom={insets.bottom}
              colors={colors}
              activeTab={p.activeTab}
              tabs={p.TABS}
              tabScrollViewRef={p.tabScrollViewRef}
              onTabPress={p.handleTabPress}
              onTabScrollEnd={p.handleTabScrollEnd}
              onOpenFlashcards={() => {
                triggerHaptic('light');
                p.setIsFlashcardsVisible(true);
              }}
              onOpenAiTutor={() => {
                triggerHaptic('light');
                p.setAiTutorVisible(true);
              }}
              onMarkComplete={p.handleMarkComplete}
              onSelectLesson={onSelectLesson}
              onOpenQuiz={(l) => {
                p.setSelectedQuizLesson(l);
                p.setQuizPlayerVisible(true);
              }}
              onOpenCertModal={() => p.setCertModalVisible(true)}
              onOpenNotesFAB={p.handleOpenNotesFAB}
              onSeekTo={p.handleSeekTo}
              onDeleteNote={(n) => {
                deleteNote(n.id);
                showToast({
                  message: 'Note deleted',
                  type: 'info',
                  actionLabel: 'Undo',
                  onAction: () => {
                    restoreNote(n);
                    showToast({ message: 'Note restored', type: 'success' });
                  },
                });
              }}
              showToast={showToast}
            />
          )}
          <View style={{ height: Math.max(insets.bottom, 10) }} />
        </View>
      )}

      <LessonPlayerModals
        course={course}
        currentLesson={currentLesson}
        displayLesson={displayLesson}
        moduleTitle={p.currentItem?.moduleTitle}
        isBangla={isBangla}
        isPlaying={p.isPlaying}
        isQuickNoteOpen={p.isQuickNoteOpen}
        aiTutorVisible={p.aiTutorVisible}
        isPiPActive={p.isPiPActive}
        qualityModalVisible={p.qualityModalVisible}
        streamQuality={p.streamQuality}
        quizModalVisible={p.quizModalVisible}
        quizPlayerVisible={p.quizPlayerVisible}
        selectedQuizLesson={p.selectedQuizLesson}
        notesModalVisible={p.notesModalVisible}
        mandatoryReviewVisible={p.mandatoryReviewVisible}
        certModalVisible={p.certModalVisible}
        paymentModalVisible={p.paymentModalVisible}
        isFlashcardsVisible={p.isFlashcardsVisible}
        userCert={p.userCert}
        currentPositionSeconds={p.currentPositionSeconds}
        setIsQuickNoteOpen={p.setIsQuickNoteOpen}
        setAiTutorVisible={p.setAiTutorVisible}
        setIsPiPActive={p.setIsPiPActive}
        setQualityModalVisible={p.setQualityModalVisible}
        setStreamQuality={p.setStreamQuality}
        setQuizModalVisible={p.setQuizModalVisible}
        setQuizPlayerVisible={p.setQuizPlayerVisible}
        setSelectedQuizLesson={p.setSelectedQuizLesson}
        setNotesModalVisible={p.setNotesModalVisible}
        setMandatoryReviewVisible={p.setMandatoryReviewVisible}
        setCertModalVisible={p.setCertModalVisible}
        setPaymentModalVisible={p.setPaymentModalVisible}
        setIsFlashcardsVisible={p.setIsFlashcardsVisible}
        onAddNote={addNote}
        onMarkLessonCompleted={p.markLessonCompleted}
        onSeekTo={p.handleSeekTo}
        onTogglePlay={p.handleTogglePlay}
        onSubmitReview={p.handleSubmitReview}
        showToast={showToast}
      />
    </View>
  );
};
