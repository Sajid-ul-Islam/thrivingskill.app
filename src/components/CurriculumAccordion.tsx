import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CourseModule, Lesson } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useLearning } from '../context/LearningContext';

interface CurriculumAccordionProps {
  courseId: string;
  modules: CourseModule[];
  isEnrolled: boolean;
  activeLessonId?: string;
  onSelectLesson: (lesson: Lesson) => void;
}

export const CurriculumAccordion: React.FC<CurriculumAccordionProps> = ({
  courseId,
  modules,
  isEnrolled,
  activeLessonId,
  onSelectLesson,
}) => {
  const { colors } = useTheme();
  const { userProgress } = useLearning();
  const [expandedModuleIds, setExpandedModuleIds] = useState<string[]>([modules[0]?.id || '']);

  const progress = userProgress[courseId];
  const completedLessonIds = progress?.completedLessonIds || [];

  const toggleModule = (id: string) => {
    if (expandedModuleIds.includes(id)) {
      setExpandedModuleIds(expandedModuleIds.filter((mId) => mId !== id));
    } else {
      setExpandedModuleIds([...expandedModuleIds, id]);
    }
  };

  return (
    <View style={styles.container}>
      {modules.map((mod, index) => {
        const isExpanded = expandedModuleIds.includes(mod.id);
        const moduleCompletedCount = mod.lessons.filter((l) =>
          completedLessonIds.includes(l.id)
        ).length;

        return (
          <View
            key={mod.id}
            style={[
              styles.moduleCard,
              {
                backgroundColor: colors.surfaceCard,
                borderColor: colors.border,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.moduleHeader}
              onPress={() => toggleModule(mod.id)}
              activeOpacity={0.7}
            >
              <View style={styles.moduleHeaderLeft}>
                <View
                  style={[
                    styles.moduleNumberBadge,
                    {
                      backgroundColor:
                        moduleCompletedCount === mod.lessons.length && mod.lessons.length > 0
                          ? colors.primaryLight
                          : colors.surfaceSubtle,
                    },
                  ]}
                >
                  {moduleCompletedCount === mod.lessons.length && mod.lessons.length > 0 ? (
                    <Ionicons name="checkmark" size={14} color={colors.primary} />
                  ) : (
                    <Text style={[styles.moduleNumberText, { color: colors.text }]}>
                      {index + 1}
                    </Text>
                  )}
                </View>

                <View style={styles.moduleTitleCol}>
                  <Text style={[styles.moduleTitle, { color: colors.text }]}>{mod.title}</Text>
                  <Text style={[styles.moduleMeta, { color: colors.textMuted }]}>
                    {mod.lessons.length} lessons • {moduleCompletedCount}/{mod.lessons.length} completed
                  </Text>
                </View>
              </View>

              <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.textMuted}
              />
            </TouchableOpacity>

            {isExpanded && (
              <View style={[styles.lessonsList, { borderTopColor: colors.border }]}>
                {mod.lessons.map((lesson) => {
                  const isCompleted = completedLessonIds.includes(lesson.id);
                  const isActive = activeLessonId === lesson.id;
                  const isAccessible = isEnrolled || lesson.isFreePreview;

                  return (
                    <TouchableOpacity
                      key={lesson.id}
                      style={[
                        styles.lessonRow,
                        isActive && { backgroundColor: colors.surfaceSubtle },
                        { borderBottomColor: colors.borderSubtle },
                      ]}
                      onPress={() => {
                        if (isAccessible) {
                          onSelectLesson(lesson);
                        }
                      }}
                      disabled={!isAccessible}
                      activeOpacity={0.7}
                    >
                      <View style={styles.lessonLeft}>
                        <View
                          style={[
                            styles.lessonStatusIcon,
                            {
                              backgroundColor: isCompleted
                                ? colors.primaryLight
                                : isActive
                                ? colors.primary
                                : colors.surfaceSubtle,
                            },
                          ]}
                        >
                          {isCompleted ? (
                            <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                          ) : isActive ? (
                            <Ionicons name="play" size={12} color="#FFFFFF" />
                          ) : isAccessible ? (
                            <Ionicons name="play-outline" size={14} color={colors.textMuted} />
                          ) : (
                            <Ionicons name="lock-closed" size={14} color={colors.textMuted} />
                          )}
                        </View>

                        <View style={styles.lessonTextCol}>
                          <Text
                            style={[
                              styles.lessonTitle,
                              {
                                color: isActive
                                  ? colors.primary
                                  : isAccessible
                                  ? colors.text
                                  : colors.textMuted,
                                fontWeight: isActive ? '700' : '500',
                              },
                            ]}
                            numberOfLines={1}
                          >
                            {lesson.title}
                          </Text>
                          <View style={styles.lessonDetailsRow}>
                            <Ionicons name="time-outline" size={12} color={colors.textLight} />
                            <Text style={[styles.lessonDuration, { color: colors.textLight }]}>
                              {lesson.duration}
                            </Text>
                            {lesson.quiz && (
                              <View style={styles.quizTag}>
                                <Ionicons name="help-circle-outline" size={12} color={colors.secondary} />
                                <Text style={[styles.quizTagText, { color: colors.secondary }]}>
                                  Quiz
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>

                      {lesson.isFreePreview && !isEnrolled && (
                        <View style={[styles.previewBadge, { backgroundColor: colors.secondaryLight }]}>
                          <Text style={[styles.previewText, { color: colors.secondary }]}>
                            Preview
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  moduleCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  moduleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  moduleNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  moduleNumberText: {
    fontSize: 13,
    fontWeight: '700',
  },
  moduleTitleCol: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  moduleMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  lessonsList: {
    borderTopWidth: 1,
  },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
  },
  lessonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  lessonStatusIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  lessonTextCol: {
    flex: 1,
    marginRight: 8,
  },
  lessonTitle: {
    fontSize: 13,
    marginBottom: 2,
  },
  lessonDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lessonDuration: {
    fontSize: 11,
  },
  quizTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: 8,
  },
  quizTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  previewBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  previewText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
