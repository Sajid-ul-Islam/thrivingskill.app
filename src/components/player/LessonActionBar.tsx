import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { SpringPressable } from '../common/SpringPressable';
import { triggerHaptic } from '../../utils/haptics';
import { Lesson, Course } from '../../types';

interface LessonActionBarProps {
  currentLesson: Lesson;
  course: Course;
  isLessonCompleted: boolean;
  onOpenFlashcards: () => void;
  onOpenAiTutor: () => void;
  onMarkComplete: () => void;
}

export const LessonActionBar: React.FC<LessonActionBarProps> = ({
  currentLesson,
  course,
  isLessonCompleted,
  onOpenFlashcards,
  onOpenAiTutor,
  onMarkComplete,
}) => {
  const { colors, isDark } = useTheme();
  const { isBangla } = useLanguage();

  return (
    <View style={[styles.lessonHeaderCard, { borderBottomColor: colors.border }]}>
      <View style={styles.titleCol}>
        <Text style={[styles.lessonTitle, { color: colors.text }]} numberOfLines={1}>
          {currentLesson.title}
        </Text>
        <Text style={[styles.lessonInstructor, { color: colors.textMuted }]}>
          {currentLesson.duration
            ? `${course.instructor.name} • ${currentLesson.duration}`
            : course.instructor.name}
        </Text>
      </View>

      <View style={styles.actionRowRight}>
        {/* Study Assistant Trigger */}
        <TouchableOpacity
          style={[
            styles.aiTutorBtn,
            {
              backgroundColor: isDark ? 'rgba(227, 66, 52, 0.12)' : '#FEE2E2',
              borderColor: '#E34234',
            },
          ]}
          onPress={() => {
            triggerHaptic('light');
            onOpenAiTutor();
          }}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={isBangla ? 'স্টাডি অ্যাসিস্ট্যান্ট খুলুন' : 'Open Study Assistant'}
        >
          <Ionicons name="sparkles" size={14} color="#E34234" />
          <Text
            style={[styles.aiTutorBtnText, { color: isDark ? '#FF8A80' : '#E34234' }]}
            numberOfLines={1}
          >
            {isBangla ? 'স্টাডি' : 'Study Helper'}
          </Text>
        </TouchableOpacity>

        {/* Spaced repetition flashcards */}
        <TouchableOpacity
          style={[
            styles.headerActionBtn,
            { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
          ]}
          onPress={() => {
            triggerHaptic('light');
            onOpenFlashcards();
          }}
          accessibilityRole="button"
          accessibilityLabel="Study active recall flashcards"
        >
          <Ionicons name="layers-outline" size={16} color={colors.primary} />
        </TouchableOpacity>

        {/* Mark Complete Button */}
        <SpringPressable
          style={[
            styles.completeBtn,
            {
              backgroundColor: isLessonCompleted ? colors.primaryLight : colors.primary,
            },
          ]}
          onPress={onMarkComplete}
          activeScale={0.96}
          accessibilityRole="button"
          accessibilityLabel={
            isLessonCompleted ? 'Lesson already completed' : 'Mark lesson as complete'
          }
        >
          <Ionicons
            name={isLessonCompleted ? 'checkmark-circle' : 'checkmark'}
            size={15}
            color={isLessonCompleted ? colors.primary : colors.onPrimary}
          />
          <Text
            style={[
              styles.completeBtnText,
              { color: isLessonCompleted ? colors.primary : colors.onPrimary },
            ]}
            numberOfLines={1}
          >
            {isLessonCompleted
              ? isBangla
                ? 'সম্পন্ন'
                : 'Completed'
              : isBangla
                ? 'সম্পন্ন'
                : 'Complete'}
          </Text>
        </SpringPressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  lessonHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  titleCol: {
    flex: 1,
    minWidth: 0,
  },
  lessonTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  lessonInstructor: {
    fontSize: 12,
  },
  actionRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiTutorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  aiTutorBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  headerActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
  },
  completeBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
