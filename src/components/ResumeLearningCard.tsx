import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Course } from '../types';

interface ResumeLearningCardProps {
  course: Course;
  progressPercent: number;
  lastLessonTitle?: string;
  onResume: () => void;
}

export const ResumeLearningCard: React.FC<ResumeLearningCardProps> = ({
  course,
  progressPercent,
  lastLessonTitle,
  onResume,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark ? colors.surfaceCard : '#FFFFFF',
            borderColor: colors.border,
          },
        ]}
      >
        {/* Top Meta Row */}
        <View style={styles.topRow}>
          <View style={[styles.statusBadge, { backgroundColor: `${colors.primary}18` }]}>
            <View style={[styles.pulseDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.statusBadgeText, { color: colors.primary }]}>
              JUMP BACK IN
            </Text>
          </View>
          <Text style={[styles.progressRatio, { color: colors.textMuted }]}>
            {progressPercent}% Complete
          </Text>
        </View>

        {/* Middle Course Info Row */}
        <View style={styles.mainRow}>
          <View style={styles.thumbWrapper}>
            <Image source={{ uri: course.thumbnail }} style={styles.thumbnail} />
            <View style={[styles.thumbPlayIcon, { backgroundColor: colors.primary }]}>
              <Ionicons name="play" size={10} color="#FFFFFF" />
            </View>
          </View>

          <View style={styles.infoCol}>
            <Text style={[styles.courseTitle, { color: colors.text }]} numberOfLines={1}>
              {course.title}
            </Text>
            <Text style={[styles.lessonSub, { color: colors.textMuted }]} numberOfLines={1}>
              Lesson: {lastLessonTitle || course.modules[0]?.lessons[0]?.title || 'Next Lecture'}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={[styles.progressTrack, { backgroundColor: colors.surfaceSubtle }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: colors.primary, width: `${Math.max(5, progressPercent)}%` },
            ]}
          />
        </View>

        {/* CTA Resume Button */}
        <TouchableOpacity
          style={[styles.resumeBtn, { backgroundColor: colors.primary }]}
          onPress={onResume}
          activeOpacity={0.88}
        >
          <Ionicons name="play-circle" size={18} color="#FFFFFF" />
          <Text style={styles.resumeBtnText}>Resume Lesson</Text>
          <Ionicons name="arrow-forward" size={14} color="#FFFFFF" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginVertical: 6,
  },
  card: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 10,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  progressRatio: {
    fontSize: 11,
    fontWeight: '700',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  thumbWrapper: {
    position: 'relative',
    width: 52,
    height: 52,
    borderRadius: 12,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbPlayIcon: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCol: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  lessonSub: {
    fontSize: 12,
    marginTop: 3,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 12,
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  resumeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  resumeBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
