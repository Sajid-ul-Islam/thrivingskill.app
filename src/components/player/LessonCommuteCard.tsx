import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { triggerHaptic } from '../../utils/haptics';
import { LiveAudioWaveform } from './LiveAudioWaveform';
import { Lesson, Course } from '../../types';

interface LessonCommuteCardProps {
  currentLesson: Lesson;
  course: Course;
  moduleTitle?: string;
  isPlaying: boolean;
  currentPositionSeconds: number;
  totalLessonSeconds: number;
  playbackSpeed: string;
  hasPrevLesson: boolean;
  hasNextLesson: boolean;
  onTogglePlay: () => void;
  onRewind: (sec: number) => void;
  onForward: (sec: number) => void;
  onPrevLesson: () => void;
  onNextLesson: () => void;
  onCycleSpeed: () => void;
  formatSeconds: (sec: number) => string;
}

export const LessonCommuteCard: React.FC<LessonCommuteCardProps> = ({
  currentLesson,
  course,
  moduleTitle,
  isPlaying,
  currentPositionSeconds,
  playbackSpeed,
  hasPrevLesson,
  hasNextLesson,
  onTogglePlay,
  onRewind,
  onForward,
  onPrevLesson,
  onNextLesson,
  onCycleSpeed,
  formatSeconds,
}) => {
  const { colors, isDark } = useTheme();
  const { isBangla } = useLanguage();

  return (
    <View
      style={[
        styles.commutePlayerCard,
        { backgroundColor: isDark ? colors.surfaceCard : '#102F53' },
      ]}
    >
      <View style={styles.commuteHeaderBadge}>
        <Ionicons name="leaf" size={13} color="#10B981" />
        <Text style={styles.commuteHeaderBadgeText}>
          {isBangla
            ? 'কমিউট মোড সক্রিয় • ব্যান্ডউইথ সাশ্রয় (-৮৫%)'
            : 'Commute Mode Active • Bandwidth Saver (-85%)'}
        </Text>
      </View>

      <LiveAudioWaveform isPlaying={isPlaying} primaryColor="#FFB606" accentColor="#E34234" />

      <Text style={styles.commuteLessonTitle} numberOfLines={1}>
        {currentLesson.title}
      </Text>
      <Text style={styles.commuteInstructorText}>
        {course.instructor.name} • {moduleTitle}
      </Text>

      <View style={styles.commuteControlsRow}>
        <TouchableOpacity
          style={styles.commuteSkipBtn}
          onPress={() => {
            triggerHaptic('light');
            onRewind(15);
          }}
          accessibilityRole="button"
          accessibilityLabel="Rewind 15 seconds"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="play-back" size={20} color="#FFFFFF" />
          <Text style={styles.skipSecText}>15s</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            triggerHaptic('light');
            onPrevLesson();
          }}
          disabled={!hasPrevLesson}
          style={[styles.commuteSkipBtn, !hasPrevLesson && { opacity: 0.4 }]}
          accessibilityRole="button"
          accessibilityLabel="Previous lesson"
          accessibilityState={{ disabled: !hasPrevLesson }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="play-skip-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.commuteMainPlayBtn, { backgroundColor: '#FFB606' }]}
          onPress={() => {
            triggerHaptic('light');
            onTogglePlay();
          }}
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? 'Pause audio playback' : 'Play audio playback'}
        >
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={26} color="#102F53" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            triggerHaptic('light');
            onNextLesson();
          }}
          disabled={!hasNextLesson}
          style={[styles.commuteSkipBtn, !hasNextLesson && { opacity: 0.4 }]}
          accessibilityRole="button"
          accessibilityLabel="Next lesson"
          accessibilityState={{ disabled: !hasNextLesson }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="play-skip-forward" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.commuteSkipBtn}
          onPress={() => {
            triggerHaptic('light');
            onForward(30);
          }}
          accessibilityRole="button"
          accessibilityLabel="Fast forward 30 seconds"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="play-forward" size={20} color="#FFFFFF" />
          <Text style={styles.skipSecText}>30s</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.commuteBottomBar}>
        <Text style={styles.commuteTimeText}>
          {formatSeconds(currentPositionSeconds)} / {currentLesson.duration}
        </Text>
        <View style={styles.bgPlaybackNotice}>
          <Ionicons name="radio" size={12} color="#10B981" />
          <Text style={styles.bgPlaybackText}>
            {isBangla ? 'ব্যাকগ্রাউন্ড অডিও সক্রিয়' : 'Background Playback Active'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.speedPill}
          onPress={() => {
            triggerHaptic('selection');
            onCycleSpeed();
          }}
          accessibilityRole="button"
          accessibilityLabel={`Playback speed ${playbackSpeed}`}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.speedPillText}>{playbackSpeed}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  commutePlayerCard: {
    width: '100%',
    height: '100%',
    padding: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commuteHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  commuteHeaderBadgeText: {
    color: '#10B981',
    fontSize: 10.5,
    fontWeight: '700',
  },
  commuteLessonTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
    marginHorizontal: 12,
  },
  commuteInstructorText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    textAlign: 'center',
  },
  commuteControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  commuteSkipBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  skipSecText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
  commuteMainPlayBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commuteBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  commuteTimeText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  bgPlaybackNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bgPlaybackText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '700',
  },
  speedPill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  speedPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
