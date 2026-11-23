import React, { useState, useEffect, useRef } from 'react';
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

type SleepTimerOption = 'off' | '15m' | '30m' | '45m' | 'end';

const toBanglaNum = (str: string | number): string => {
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(str).replace(/[0-9]/g, (w) => banglaDigits[+w]);
};

export const LessonCommuteCard: React.FC<LessonCommuteCardProps> = ({
  currentLesson,
  course,
  moduleTitle,
  isPlaying,
  currentPositionSeconds,
  totalLessonSeconds,
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

  const [sleepTimerOption, setSleepTimerOption] = useState<SleepTimerOption>('off');
  const [sleepRemainingSec, setSleepRemainingSec] = useState<number | null>(null);
  const sleepIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (sleepIntervalRef.current) {
      clearInterval(sleepIntervalRef.current);
      sleepIntervalRef.current = null;
    }

    if (sleepTimerOption === 'off' || sleepRemainingSec === null) {
      return;
    }

    if (isPlaying && sleepRemainingSec > 0) {
      sleepIntervalRef.current = setInterval(() => {
        setSleepRemainingSec((prev) => {
          if (prev === null || prev <= 1) {
            if (sleepIntervalRef.current) {
              clearInterval(sleepIntervalRef.current);
              sleepIntervalRef.current = null;
            }
            onTogglePlay();
            triggerHaptic('medium');
            setSleepTimerOption('off');
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (sleepIntervalRef.current) {
        clearInterval(sleepIntervalRef.current);
        sleepIntervalRef.current = null;
      }
    };
  }, [sleepTimerOption, isPlaying, onTogglePlay]);

  const cycleSleepTimer = () => {
    triggerHaptic('selection');
    const options: SleepTimerOption[] = ['off', '15m', '30m', '45m', 'end'];
    const currentIdx = options.indexOf(sleepTimerOption);
    const nextOption = options[(currentIdx + 1) % options.length];
    setSleepTimerOption(nextOption);

    if (nextOption === '15m') setSleepRemainingSec(15 * 60);
    else if (nextOption === '30m') setSleepRemainingSec(30 * 60);
    else if (nextOption === '45m') setSleepRemainingSec(45 * 60);
    else if (nextOption === 'end') {
      const remainingSec = Math.max(30, totalLessonSeconds - currentPositionSeconds);
      setSleepRemainingSec(remainingSec);
    } else {
      setSleepRemainingSec(null);
    }
  };

  const getSleepTimerLabel = (): string => {
    if (sleepTimerOption === 'off') {
      return isBangla ? 'স্লিপ' : 'Sleep';
    }
    if (sleepRemainingSec !== null) {
      const mins = Math.floor(sleepRemainingSec / 60);
      const secs = sleepRemainingSec % 60;
      const formatted = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
      return isBangla ? toBanglaNum(formatted) : formatted;
    }
    switch (sleepTimerOption) {
      case '15m': return isBangla ? '১৫ মি.' : '15m';
      case '30m': return isBangla ? '৩০ মি.' : '30m';
      case '45m': return isBangla ? '৪৫ মি.' : '45m';
      case 'end': return isBangla ? 'পাঠ শেষে' : 'End';
      default: return isBangla ? 'স্লিপ' : 'Sleep';
    }
  };

  // Bandwidth calculation: 1080p stream ~ 3.5 MB/min vs 64k AAC ~ 0.3 MB/min => 3.2 MB saved per min
  const minutesPlayed = Math.max(0, currentPositionSeconds) / 60;
  const mbSaved = (minutesPlayed * 3.2).toFixed(1);
  const mbSavedText = isBangla
    ? `সাশ্রয়: ${toBanglaNum(mbSaved)} MB (-৮৫%)`
    : `Saved: ${mbSaved} MB (-85%)`;

  return (
    <View
      style={[
        styles.commutePlayerCard,
        { backgroundColor: isDark ? colors.surfaceCard : '#102F53' },
      ]}
    >
      <View style={styles.commuteTopRow}>
        <View style={styles.commuteHeaderBadge}>
          <Ionicons name="leaf" size={12} color="#10B981" />
          <Text style={styles.commuteHeaderBadgeText}>{mbSavedText}</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.sleepTimerPill,
            sleepTimerOption !== 'off' && styles.sleepTimerPillActive,
          ]}
          onPress={cycleSleepTimer}
          accessibilityRole="button"
          accessibilityLabel={
            sleepTimerOption === 'off'
              ? 'Configure sleep timer'
              : `Sleep timer active: ${getSleepTimerLabel()}`
          }
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={sleepTimerOption !== 'off' ? 'moon' : 'moon-outline'}
            size={12}
            color={sleepTimerOption !== 'off' ? '#FFB606' : '#FFFFFF'}
          />
          <Text
            style={[
              styles.sleepTimerText,
              sleepTimerOption !== 'off' && { color: '#FFB606', fontWeight: '800' },
            ]}
          >
            {getSleepTimerLabel()}
          </Text>
        </TouchableOpacity>
      </View>

      <LiveAudioWaveform isPlaying={isPlaying} primaryColor={isDark ? colors.primary : '#102F53'} accentColor="#E34234" />

      <Text style={styles.commuteLessonTitle} numberOfLines={1}>
        {currentLesson.title}
      </Text>
      <Text style={styles.commuteInstructorText} numberOfLines={1}>
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
          style={[styles.commuteMainPlayBtn, { backgroundColor: '#E34234' }]}
          onPress={() => {
            triggerHaptic('light');
            onTogglePlay();
          }}
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? 'Pause audio playback' : 'Play audio playback'}
        >
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={26} color="#FFFFFF" />
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
            {isBangla ? 'ব্যাকগ্রাউন্ড সক্রিয়' : 'Background Active'}
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
    padding: 14,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commuteTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  commuteHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 10,
  },
  commuteHeaderBadgeText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '700',
  },
  sleepTimerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 10,
  },
  sleepTimerPillActive: {
    backgroundColor: 'rgba(255, 182, 6, 0.2)',
    borderColor: 'rgba(255, 182, 6, 0.4)',
    borderWidth: 1,
  },
  sleepTimerText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '600',
  },
  commuteLessonTitle: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
    textAlign: 'center',
    marginHorizontal: 12,
  },
  commuteInstructorText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11.5,
    textAlign: 'center',
  },
  commuteControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
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
    width: 52,
    height: 52,
    borderRadius: 26,
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
    fontSize: 9.5,
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
