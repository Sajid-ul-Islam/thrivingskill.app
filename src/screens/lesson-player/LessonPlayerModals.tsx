import React from 'react';
import { Alert } from 'react-native';
import {
  QuizModal,
  QuizPlayerModal,
  NotesModal,
  CertificateModal,
  MandatoryReviewModal,
  PaymentModal,
  DownloadQualityModal,
  QuickNoteBottomSheet,
  PiPFloatingPlayer,
  LessonAiTutorModal,
} from '../../components';
import { SpacedRepetitionModal } from '../../components/modals/SpacedRepetitionModal';
import { Certificate, Course, Lesson } from '../../types';
import { formatSeconds } from './lessonHelpers';

interface LessonPlayerModalsProps {
  course: Course;
  currentLesson: Lesson;
  displayLesson: Lesson;
  moduleTitle?: string;
  isBangla: boolean;
  isPlaying: boolean;
  isQuickNoteOpen: boolean;
  aiTutorVisible: boolean;
  isPiPActive: boolean;
  qualityModalVisible: boolean;
  streamQuality: string;
  quizModalVisible: boolean;
  quizPlayerVisible: boolean;
  selectedQuizLesson: Lesson | null;
  notesModalVisible: boolean;
  mandatoryReviewVisible: boolean;
  certModalVisible: boolean;
  paymentModalVisible: boolean;
  isFlashcardsVisible: boolean;
  userCert: Certificate | null;
  currentPositionSeconds: number;
  setIsQuickNoteOpen: (v: boolean) => void;
  setAiTutorVisible: (v: boolean) => void;
  setIsPiPActive: (v: boolean) => void;
  setQualityModalVisible: (v: boolean) => void;
  setStreamQuality: (q: string) => void;
  setQuizModalVisible: (v: boolean) => void;
  setQuizPlayerVisible: (v: boolean) => void;
  setSelectedQuizLesson: (l: Lesson | null) => void;
  setNotesModalVisible: (v: boolean) => void;
  setMandatoryReviewVisible: (v: boolean) => void;
  setCertModalVisible: (v: boolean) => void;
  setPaymentModalVisible: (v: boolean) => void;
  setIsFlashcardsVisible: (v: boolean) => void;
  onAddNote: (courseId: string, lessonId: string, text: string, ts?: string) => void;
  onMarkLessonCompleted: (courseId: string, lessonId: string) => void;
  onSeekTo: (sec: number) => void;
  onTogglePlay: () => void;
  onSubmitReview: (rating: number, feedback: string) => Promise<void> | void;
  showToast: (opts: any) => void;
}

export const LessonPlayerModals: React.FC<LessonPlayerModalsProps> = ({
  course,
  currentLesson,
  displayLesson,
  moduleTitle,
  isBangla,
  isPlaying,
  isQuickNoteOpen,
  aiTutorVisible,
  isPiPActive,
  qualityModalVisible,
  streamQuality,
  quizModalVisible,
  quizPlayerVisible,
  selectedQuizLesson,
  notesModalVisible,
  mandatoryReviewVisible,
  certModalVisible,
  paymentModalVisible,
  isFlashcardsVisible,
  userCert,
  currentPositionSeconds,
  setIsQuickNoteOpen,
  setAiTutorVisible,
  setIsPiPActive,
  setQualityModalVisible,
  setStreamQuality,
  setQuizModalVisible,
  setQuizPlayerVisible,
  setSelectedQuizLesson,
  setNotesModalVisible,
  setMandatoryReviewVisible,
  setCertModalVisible,
  setPaymentModalVisible,
  setIsFlashcardsVisible,
  onAddNote,
  onMarkLessonCompleted,
  onSeekTo,
  onTogglePlay,
  onSubmitReview,
  showToast,
}) => {
  const activeQuizSource = selectedQuizLesson?.quiz || currentLesson.quiz;
  const quizQuestions = activeQuizSource?.map((q) => ({
    id: q.id,
    question: q.question,
    options: q.options,
    correctIndex: q.correctAnswerIndex,
    explanation: q.explanation,
  }));

  return (
    <>
      <QuickNoteBottomSheet
        visible={isQuickNoteOpen}
        timestamp={formatSeconds(currentPositionSeconds)}
        lessonTitle={currentLesson.title}
        onSaveNote={(text, ts) => {
          onAddNote(course.id, currentLesson.id, text, ts);
          showToast({ message: `Note saved at ${ts}`, type: 'success' });
        }}
        onClose={() => setIsQuickNoteOpen(false)}
      />

      <LessonAiTutorModal
        visible={aiTutorVisible}
        course={course}
        currentLesson={currentLesson}
        context={{
          courseId: course.id,
          courseTitle: course.title,
          courseCategory: course.category,
          moduleTitle: moduleTitle || '',
          lessonId: displayLesson.id,
          lessonTitle: displayLesson.title,
          lessonSummary: displayLesson.summary,
          instructorName: course.instructor.name,
          currentTimestamp: formatSeconds(currentPositionSeconds),
        }}
        onClose={() => setAiTutorVisible(false)}
      />

      <PiPFloatingPlayer
        visible={isPiPActive}
        isPlaying={isPlaying}
        onTogglePlay={onTogglePlay}
        onMaximize={() => setIsPiPActive(false)}
        onClose={() => setIsPiPActive(false)}
        title={currentLesson.title}
        currentTimeFormatted={formatSeconds(currentPositionSeconds)}
      />

      <DownloadQualityModal
        visible={qualityModalVisible}
        currentQuality={streamQuality}
        lessonTitle={currentLesson.title}
        onClose={() => setQualityModalVisible(false)}
        onSelectStreamQuality={(q) => {
          setStreamQuality(q);
          showToast({ message: `Streaming quality set to ${q}`, type: 'info' });
        }}
      />

      {currentLesson.quiz && (
        <QuizModal
          visible={quizModalVisible}
          questions={currentLesson.quiz}
          onClose={() => setQuizModalVisible(false)}
          onPass={() => {
            onMarkLessonCompleted(course.id, currentLesson.id);
            Alert.alert('Quiz Passed! 🏆', 'Lesson marked as completed.');
          }}
        />
      )}

      <QuizPlayerModal
        visible={quizPlayerVisible}
        courseTitle={course.title}
        courseCategory={course.category}
        quizId={
          selectedQuizLesson?.quizId ||
          selectedQuizLesson?.id ||
          currentLesson.quizId ||
          currentLesson.id
        }
        questions={quizQuestions}
        onClose={() => {
          setQuizPlayerVisible(false);
          setSelectedQuizLesson(null);
        }}
        onPassed={() => {
          onMarkLessonCompleted(course.id, selectedQuizLesson?.id || currentLesson.id);
          Alert.alert(
            isBangla ? 'কুইজ সম্পন্ন! 🏆' : 'Quiz Passed! 🏆',
            isBangla
              ? 'অধ্যায় সফলভাবে সম্পন্ন হয়েছে এবং অগ্রগতি সংরক্ষিত হয়েছে।'
              : 'Chapter completed and progress saved.'
          );
        }}
      />

      <NotesModal
        visible={notesModalVisible}
        courseId={course.id}
        lessonId={currentLesson.id}
        currentPositionSeconds={currentPositionSeconds}
        onSeekTo={(sec) => {
          onSeekTo(sec);
          setNotesModalVisible(false);
        }}
        onClose={() => setNotesModalVisible(false)}
      />

      <MandatoryReviewModal
        visible={mandatoryReviewVisible}
        courseTitle={course.title}
        instructorName={course.instructor.name}
        onSubmit={onSubmitReview}
        onDismissLater={() => setMandatoryReviewVisible(false)}
      />

      <CertificateModal
        visible={certModalVisible}
        certificate={userCert || null}
        onClose={() => setCertModalVisible(false)}
      />

      <PaymentModal
        visible={paymentModalVisible}
        course={course}
        onClose={() => setPaymentModalVisible(false)}
        onSuccess={() => {
          setPaymentModalVisible(false);
          Alert.alert(
            isBangla ? 'ভর্তি সফল হয়েছে! 🎓' : 'Enrollment Successful! 🎓',
            isBangla
              ? 'কোর্সের সকল ভিডিও এখন আনলক করা হয়েছে।'
              : 'All course videos are now unlocked.'
          );
        }}
      />

      <SpacedRepetitionModal
        visible={isFlashcardsVisible}
        onClose={() => setIsFlashcardsVisible(false)}
        course={course}
      />
    </>
  );
};
