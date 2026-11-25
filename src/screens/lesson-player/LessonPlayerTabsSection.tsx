import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  LessonActionBar,
  LessonPlaylistTab,
  LessonNotesTab,
  LessonTranscriptTab,
  CourseQnATab,
} from '../../components';
import { Course, Lesson, Note } from '../../types';
import { lessonPlayerStyles as styles } from './lessonPlayerStyles';

export type PlayerTab = 'curriculum' | 'notes' | 'transcript' | 'qna';

interface LessonPlayerTabsSectionProps {
  course: Course;
  courseId: string;
  currentLesson: Lesson;
  displayLesson: Lesson;
  allLessons: { moduleTitle: string; lesson: Lesson }[];
  completedLessonIds: string[];
  isCourseCompleted: boolean;
  isEnrolled: boolean;
  isPrivileged: boolean;
  isLessonCompleted: boolean;
  lessonNotes: Note[];
  currentPositionSeconds: number;
  totalLessonSeconds: number;
  screenWidth: number;
  insetsBottom: number;
  colors: any;
  activeTab: PlayerTab;
  tabs: { id: PlayerTab; label: string; icon: any }[];
  tabScrollViewRef: React.RefObject<React.ElementRef<typeof ScrollView> | null>;
  onTabPress: (tabId: PlayerTab, index: number) => void;
  onTabScrollEnd: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onOpenFlashcards: () => void;
  onOpenAiTutor: () => void;
  onMarkComplete: () => void;
  onSelectLesson: (courseId: string, lessonId: string) => void;
  onOpenQuiz: (lesson: Lesson) => void;
  onOpenCertModal: () => void;
  onOpenNotesFAB: () => void;
  onSeekTo: (sec: number) => void;
  onDeleteNote: (note: Note) => void;
  showToast: (opts: any) => void;
}

export const LessonPlayerTabsSection: React.FC<LessonPlayerTabsSectionProps> = ({
  course,
  courseId,
  currentLesson,
  displayLesson,
  allLessons,
  completedLessonIds,
  isCourseCompleted,
  isEnrolled,
  isPrivileged,
  isLessonCompleted,
  lessonNotes,
  currentPositionSeconds,
  totalLessonSeconds,
  screenWidth,
  insetsBottom,
  colors,
  activeTab,
  tabs,
  tabScrollViewRef,
  onTabPress,
  onTabScrollEnd,
  onOpenFlashcards,
  onOpenAiTutor,
  onMarkComplete,
  onSelectLesson,
  onOpenQuiz,
  onOpenCertModal,
  onOpenNotesFAB,
  onSeekTo,
  onDeleteNote,
  showToast,
}) => (
  <>
    <LessonActionBar
      currentLesson={displayLesson}
      course={course}
      isLessonCompleted={isLessonCompleted}
      onOpenFlashcards={onOpenFlashcards}
      onOpenAiTutor={onOpenAiTutor}
      onMarkComplete={onMarkComplete}
    />

    <View style={[styles.tabsStrip, { borderBottomColor: colors.border }]}>
      {tabs.map((tab, idx) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tabButton,
              { borderBottomColor: isActive ? colors.primary : 'transparent' },
            ]}
            onPress={() => onTabPress(tab.id, idx)}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
          >
            <Ionicons
              name={tab.icon}
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
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>

    <ScrollView
      ref={tabScrollViewRef}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      onMomentumScrollEnd={onTabScrollEnd}
      style={styles.horizontalPagingScroll}
    >
      <View style={{ width: screenWidth }}>
        <LessonPlaylistTab
          course={course}
          currentLessonId={currentLesson.id}
          allLessons={allLessons}
          completedLessonIds={completedLessonIds}
          isCourseCompleted={isCourseCompleted}
          isEnrolled={isEnrolled}
          isAdmin={isPrivileged}
          insetsBottom={insetsBottom}
          onSelectLesson={(nextLessonId) => onSelectLesson(courseId, nextLessonId)}
          onOpenQuiz={onOpenQuiz}
          onOpenCertModal={onOpenCertModal}
        />
      </View>

      <View style={{ width: screenWidth }}>
        <LessonNotesTab
          lessonNotes={lessonNotes}
          insetsBottom={insetsBottom}
          onOpenNewNote={onOpenNotesFAB}
          onSeekTo={onSeekTo}
          onDeleteNote={onDeleteNote}
          showToast={showToast}
        />
      </View>

      <View style={{ width: screenWidth, flex: 1, paddingHorizontal: 16, paddingTop: 10 }}>
        <LessonTranscriptTab
          currentPositionSeconds={currentPositionSeconds}
          lessonTitle={displayLesson.title}
          instructorName={course.instructor.name}
          lessonSummary={displayLesson.summary}
          durationSeconds={totalLessonSeconds}
          onSeekTo={onSeekTo}
        />
      </View>

      <View style={{ width: screenWidth }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.tabContentScroll,
            { paddingBottom: Math.max(insetsBottom, 16) + 80 },
          ]}
          nestedScrollEnabled
        >
          <CourseQnATab courseId={course.id} currentLessonTitle={currentLesson.title} />
        </ScrollView>
      </View>
    </ScrollView>

    <TouchableOpacity
      style={styles.notesFAB}
      onPress={onOpenNotesFAB}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel="Add Note at current video timestamp"
    >
      <Ionicons name="create" size={18} color="#FFFFFF" />
      <Text style={styles.notesFABText}>+ Note</Text>
    </TouchableOpacity>
  </>
);
