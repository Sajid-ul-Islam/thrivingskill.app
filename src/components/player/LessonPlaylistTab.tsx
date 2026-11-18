import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { triggerHaptic } from '../../utils/haptics';
import { Lesson, Course } from '../../types';

interface LessonPlaylistItem {
  moduleTitle: string;
  lesson: Lesson;
}

interface LessonPlaylistTabProps {
  course: Course;
  currentLessonId: string;
  allLessons: LessonPlaylistItem[];
  completedLessonIds: string[];
  isCourseCompleted: boolean;
  isEnrolled: boolean;
  isAdmin: boolean;
  insetsBottom: number;
  onSelectLesson: (lessonId: string) => void;
  onOpenQuiz: (lesson: Lesson) => void;
  onOpenCertModal: () => void;
}

export const LessonPlaylistTab: React.FC<LessonPlaylistTabProps> = ({
  course,
  currentLessonId,
  allLessons,
  completedLessonIds,
  isCourseCompleted,
  isEnrolled,
  isAdmin,
  insetsBottom,
  onSelectLesson,
  onOpenQuiz,
  onOpenCertModal,
}) => {
  const { colors, isDark } = useTheme();
  const { isBangla } = useLanguage();

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.tabContentScroll, { paddingBottom: Math.max(insetsBottom, 16) + 80 }]}
      nestedScrollEnabled
    >
      {/* Course Completion Banner */}
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
            <Ionicons name="trophy" size={24} color="#F59E0B" />
          </View>
          <View style={styles.completionContent}>
            <View style={styles.completionHeaderRow}>
              <Text style={[styles.completionTitle, { color: isDark ? '#A7F3D0' : '#065F46' }]} numberOfLines={1}>
                Course Completed! 🎓
              </Text>
              <View style={styles.completionXpBadge}>
                <Text style={styles.completionXpText}>+150 XP</Text>
              </View>
            </View>
            <Text style={[styles.completionSub, { color: isDark ? '#D1FAE5' : '#047857' }]}>
              {isBangla
                ? 'অভিনন্দন! আপনি সমস্ত লেকচার সফলভাবে সম্পন্ন করেছেন। আপনার ভেরিফাইড সার্টিফিকেট প্রস্তুত।'
                : "Congratulations! You've mastered all lectures. Your verified certificate is ready."}
            </Text>
            <TouchableOpacity
              style={styles.claimCertCTA}
              onPress={onOpenCertModal}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="View verified digital certificate"
            >
              <Ionicons name="ribbon" size={14} color="#FFFFFF" />
              <Text style={styles.claimCertCTAText}>
                {isBangla ? 'ডিজিটাল সার্টিফিকেট দেখুন' : 'View Digital Certificate'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.curriculumList}>
        {allLessons.map((item) => {
          const isSelected = item.lesson.id === currentLessonId;
          const isCompleted = completedLessonIds.includes(item.lesson.id);
          const itemAccessible = isAdmin || isEnrolled || Boolean(item.lesson.isFreePreview);

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
              onPress={() => {
                if (itemAccessible) {
                  triggerHaptic('light');
                  onSelectLesson(item.lesson.id);
                } else {
                  Alert.alert(
                    isBangla ? 'সদস্যদের জন্য সংরক্ষিত' : 'Enrolled Members Only',
                    isBangla
                      ? 'এই লেসনটি শুধুমাত্র কোর্সে এনরোল করা শিক্ষার্থীদের জন্য।'
                      : 'This lesson is part of your Thriving Skills library. Sign in with an enrolled account to unlock.'
                  );
                }
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`${item.lesson.title}, ${item.lesson.duration || ''}, ${
                isCompleted ? 'completed' : isSelected ? 'playing' : itemAccessible ? 'ready' : 'locked'
              }`}
              accessibilityState={{ selected: isSelected, disabled: !itemAccessible }}
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
                  <Ionicons name="play" size={14} color={colors.onPrimary} />
                ) : itemAccessible ? (
                  <Ionicons name="play-outline" size={14} color={colors.textMuted} />
                ) : (
                  <Ionicons name="lock-closed" size={14} color={colors.textMuted} />
                )}
              </View>

              <View style={styles.playlistInfo}>
                <Text
                  style={[
                    styles.playlistTitle,
                    {
                      color: isSelected ? colors.primary : itemAccessible ? colors.text : colors.textMuted,
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

              {item.lesson.isFreePreview && !isEnrolled && !isAdmin && (
                <View style={[styles.previewBadge, { backgroundColor: colors.secondaryLight }]}>
                  <Text style={[styles.previewText, { color: colors.secondary }]}>Preview</Text>
                </View>
              )}

              {(item.lesson.quiz || item.lesson.type === 'quiz') && (
                <TouchableOpacity
                  style={[styles.quizPill, { backgroundColor: colors.secondaryLight }]}
                  onPress={() => onOpenQuiz(item.lesson)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel="Open quiz"
                >
                  <Ionicons name="help-circle" size={13} color={colors.secondary} />
                  <Text style={[styles.quizPillText, { color: colors.secondary }]}>Quiz</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  tabContentScroll: {
    padding: 16,
  },
  completionBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
  },
  completionIconWrap: {
    paddingTop: 2,
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
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
  },
  completionXpBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  completionXpText: {
    color: '#FFFFFF',
    fontSize: 10,
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
    gap: 6,
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  claimCertCTAText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  curriculumList: {
    gap: 8,
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 12,
  },
  playlistIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
  previewBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  previewText: {
    fontSize: 10,
    fontWeight: '700',
  },
  quizPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  quizPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
