import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { triggerHaptic } from '../../utils/haptics';
import { shape } from '../../theme/shapes';
import { formatSeconds } from './lessonHelpers';

interface LessonFocusPanelProps {
  colors: any;
  isBangla: boolean;
  currentPositionSeconds: number;
  totalLessonSeconds: number;
  currentLessonIndex: number;
  totalLessonsCount: number;
  onExitFocus: () => void;
  onPrevLesson: () => void;
  onNextLesson: () => void;
}

export const LessonFocusPanel: React.FC<LessonFocusPanelProps> = ({
  colors,
  isBangla,
  currentPositionSeconds,
  totalLessonSeconds,
  currentLessonIndex,
  totalLessonsCount,
  onExitFocus,
  onPrevLesson,
  onNextLesson,
}) => {
  const progressPct =
    totalLessonSeconds > 0
      ? Math.min(100, Math.round((currentPositionSeconds / totalLessonSeconds) * 100))
      : 0;

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
      <View
        style={{
          backgroundColor: colors.surfaceCard,
          borderColor: 'rgba(227, 66, 52, 0.25)',
          borderWidth: 1,
          borderRadius: shape.large,
          padding: 16,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: 'rgba(227, 66, 52, 0.12)',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 8,
            }}
          >
            <Ionicons name="sparkles" size={13} color="#E34234" />
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#E34234', letterSpacing: 0.5 }}>
              {isBangla ? 'ফোকাস মোড সক্রিয়' : 'FOCUS MODE • DISTRACTION-FREE'}
            </Text>
          </View>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surfaceSubtle,
            }}
            onPress={() => {
              triggerHaptic('light');
              onExitFocus();
            }}
            accessibilityRole="button"
            accessibilityLabel="Exit focus mode"
          >
            <Ionicons name="close" size={14} color={colors.text} />
            <Text style={{ fontSize: 11, fontWeight: '600', color: colors.text }}>
              {isBangla ? 'প্রস্থান' : 'Exit Focus'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ marginBottom: 16 }}>
          <View
            style={{
              height: 6,
              borderRadius: 3,
              backgroundColor: colors.surfaceSubtle,
              overflow: 'hidden',
              marginBottom: 6,
            }}
          >
            <View
              style={{
                height: '100%',
                borderRadius: 3,
                width: `${progressPct}%`,
                backgroundColor: '#E34234',
              }}
            />
          </View>
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <Text style={{ fontSize: 11, fontWeight: '500', color: colors.textMuted }}>
              {formatSeconds(currentPositionSeconds)} / {formatSeconds(totalLessonSeconds)}
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#E34234' }}>
              {progressPct}% Complete
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity
            style={[
              {
                flex: 1,
                minHeight: 44,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                borderRadius: shape.medium,
                borderWidth: 1,
                paddingHorizontal: 12,
              },
              currentLessonIndex === 0
                ? { borderColor: colors.border, opacity: 0.4 }
                : { borderColor: colors.border, backgroundColor: colors.surfaceSubtle },
            ]}
            disabled={currentLessonIndex === 0}
            onPress={onPrevLesson}
            accessibilityRole="button"
            accessibilityLabel="Previous lesson"
          >
            <Ionicons name="arrow-back" size={14} color={colors.text} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }}>
              {isBangla ? 'পূর্ববর্তী' : 'Previous'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              {
                flex: 1,
                minHeight: 44,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                borderRadius: shape.medium,
                borderWidth: 1,
                paddingHorizontal: 12,
              },
              currentLessonIndex === totalLessonsCount - 1
                ? { borderColor: colors.border, opacity: 0.4 }
                : { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
            disabled={currentLessonIndex === totalLessonsCount - 1}
            onPress={onNextLesson}
            accessibilityRole="button"
            accessibilityLabel="Next lesson"
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.onPrimary }}>
              {isBangla ? 'পরবর্তী পাঠ' : 'Next Lesson'}
            </Text>
            <Ionicons name="arrow-forward" size={14} color={colors.onPrimary} />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};
