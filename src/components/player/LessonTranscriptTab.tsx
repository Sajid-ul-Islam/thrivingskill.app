import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { triggerHaptic } from '../../utils/haptics';
import { MIN_TOUCH_TARGET } from '../../theme/typography';
import { shape } from '../../theme/shapes';

export interface TranscriptLine {
  id: string;
  seconds: number;
  timestamp: string;
  speaker: string;
  text: string;
}

interface LessonTranscriptTabProps {
  currentPositionSeconds: number;
  lessonTitle: string;
  instructorName: string;
  lessonSummary?: string;
  durationSeconds?: number;
  onSeekTo: (seconds: number) => void;
}

const formatSeconds = (sec: number): string => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const LessonTranscriptTab: React.FC<LessonTranscriptTabProps> = ({
  currentPositionSeconds,
  lessonTitle,
  instructorName,
  lessonSummary,
  durationSeconds = 600,
  onSeekTo,
}) => {
  const { colors, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Generate structured, realistic timestamped transcript segments
  const transcriptLines: TranscriptLine[] = useMemo(() => {
    const total = Math.max(300, durationSeconds);
    const step = Math.max(30, Math.floor(total / 8));

    const defaultLines = [
      {
        id: 'ts-1',
        seconds: 0,
        timestamp: '00:00',
        speaker: instructorName || 'Lead Instructor',
        text: `Welcome to this lecture on "${lessonTitle}". In this session, we will break down the essential methodologies and core principles step-by-step.`,
      },
      {
        id: 'ts-2',
        seconds: Math.min(step, total - 10),
        timestamp: formatSeconds(Math.min(step, total - 10)),
        speaker: instructorName || 'Lead Instructor',
        text: lessonSummary ||
          'Let us first examine the strategic foundation and architectural context needed to apply these concepts in production environments.',
      },
      {
        id: 'ts-3',
        seconds: Math.min(step * 2, total - 10),
        timestamp: formatSeconds(Math.min(step * 2, total - 10)),
        speaker: instructorName || 'Lead Instructor',
        text: 'Notice how separating concerns allows teams to scale without operational bottlenecks or cascading failures.',
      },
      {
        id: 'ts-4',
        seconds: Math.min(step * 3, total - 10),
        timestamp: formatSeconds(Math.min(step * 3, total - 10)),
        speaker: instructorName || 'Lead Instructor',
        text: 'Here is a live demonstration showing how the input parameters interact with our core evaluation loop.',
      },
      {
        id: 'ts-5',
        seconds: Math.min(step * 4, total - 10),
        timestamp: formatSeconds(Math.min(step * 4, total - 10)),
        speaker: instructorName || 'Lead Instructor',
        text: 'When testing these edge cases, always verify that fallbacks and recovery mechanisms maintain zero downtime.',
      },
      {
        id: 'ts-6',
        seconds: Math.min(step * 5, total - 10),
        timestamp: formatSeconds(Math.min(step * 5, total - 10)),
        speaker: instructorName || 'Lead Instructor',
        text: 'Next, let us analyze real-world benchmark data to observe the performance gains under heavy concurrent load.',
      },
      {
        id: 'ts-7',
        seconds: Math.min(step * 6, total - 10),
        timestamp: formatSeconds(Math.min(step * 6, total - 10)),
        speaker: instructorName || 'Lead Instructor',
        text: 'To summarize this module: focus on consistency, validate inputs thoroughly, and monitor your key metrics continuously.',
      },
      {
        id: 'ts-8',
        seconds: Math.min(step * 7, total - 5),
        timestamp: formatSeconds(Math.min(step * 7, total - 5)),
        speaker: instructorName || 'Lead Instructor',
        text: 'In the next lecture, we will proceed into practical hands-on exercises and implement this workflow in code. See you there!',
      },
    ];

    return defaultLines;
  }, [lessonTitle, instructorName, lessonSummary, durationSeconds]);

  // Find currently active segment
  const activeIndex = useMemo(() => {
    let active = 0;
    for (let i = 0; i < transcriptLines.length; i++) {
      if (currentPositionSeconds >= transcriptLines[i].seconds) {
        active = i;
      }
    }
    return active;
  }, [currentPositionSeconds, transcriptLines]);

  const filteredLines = useMemo(() => {
    if (!searchQuery.trim()) return transcriptLines;
    const q = searchQuery.toLowerCase();
    return transcriptLines.filter(
      (line) => line.text.toLowerCase().includes(q) || line.speaker.toLowerCase().includes(q)
    );
  }, [searchQuery, transcriptLines]);

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={[styles.searchBar, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
        <Ionicons name="search" size={16} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search in transcript..."
          placeholderTextColor={colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <Ionicons name="close-circle" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Transcript Items List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
        nestedScrollEnabled
      >
        {filteredLines.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={36} color={colors.textLight} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No matching lines found for "{searchQuery}".
            </Text>
          </View>
        ) : (
          filteredLines.map((line) => {
            const isCurrent = transcriptLines[activeIndex]?.id === line.id;
            return (
              <TouchableOpacity
                key={line.id}
                style={[
                  styles.lineCard,
                  {
                    backgroundColor: isCurrent
                      ? isDark
                        ? 'rgba(227, 66, 52, 0.12)'
                        : 'rgba(227, 66, 52, 0.06)'
                      : colors.surfaceCard,
                    borderColor: isCurrent ? '#E34234' : colors.border,
                  },
                ]}
                onPress={() => {
                  triggerHaptic('light');
                  onSeekTo(line.seconds);
                }}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={`Seek to ${line.timestamp}: ${line.text}`}
              >
                <View style={styles.lineHeaderRow}>
                  <View
                    style={[
                      styles.timestampPill,
                      {
                        backgroundColor: isCurrent ? '#E34234' : colors.surfaceSubtle,
                      },
                    ]}
                  >
                    <Ionicons
                      name="time-outline"
                      size={12}
                      color={isCurrent ? '#FFFFFF' : colors.primary}
                    />
                    <Text
                      style={[
                        styles.timestampText,
                        { color: isCurrent ? '#FFFFFF' : colors.primary },
                      ]}
                    >
                      {line.timestamp}
                    </Text>
                  </View>

                  <Text style={[styles.speakerName, { color: colors.textMuted }]} numberOfLines={1}>
                    {line.speaker}
                  </Text>

                  {isCurrent && (
                    <View style={styles.nowPlayingBadge}>
                      <Ionicons name="radio" size={11} color="#059669" />
                      <Text style={styles.nowPlayingText}>Active</Text>
                    </View>
                  )}
                </View>

                <Text
                  style={[
                    styles.lineBodyText,
                    {
                      color: colors.text,
                      fontWeight: isCurrent ? '600' : '400',
                    },
                  ]}
                >
                  {line.text}
                </Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: shape.medium,
    paddingHorizontal: 12,
    minHeight: MIN_TOUCH_TARGET,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 8,
  },
  scrollList: {
    paddingBottom: 40,
    gap: 8,
  },
  lineCard: {
    padding: 12,
    borderRadius: shape.medium,
    borderWidth: 1,
    gap: 6,
  },
  lineHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timestampPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  timestampText: {
    fontSize: 11,
    fontWeight: '700',
  },
  speakerName: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  nowPlayingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  nowPlayingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  lineBodyText: {
    fontSize: 13,
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
  },
});
