import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
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
  lessonContent?: string;
  durationSeconds?: number;
  onSeekTo: (seconds: number) => void;
}

const formatSeconds = (sec: number): string => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

function parseTimestampPrefix(line: string): { seconds: number; text: string } | null {
  const match = line.match(/^\[?(\d{1,2}):(\d{2})(?::(\d{2}))?\]?\s*(?:[-–—:]\s*)?(.+)$/);
  if (!match) return null;
  const hasHours = match[3] !== undefined;
  const seconds = hasHours
    ? Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3])
    : Number(match[1]) * 60 + Number(match[2]);
  return { seconds, text: match[4].trim() };
}

export const LessonTranscriptTab: React.FC<LessonTranscriptTabProps> = ({
  currentPositionSeconds,
  lessonTitle,
  instructorName,
  lessonSummary,
  lessonContent,
  durationSeconds = 0,
  onSeekTo,
}) => {
  const { colors, isDark } = useTheme();
  const { isBangla } = useLanguage();
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Build lesson outline / transcript strictly from verified lesson content & summary (never fabricated prose)
  const transcriptLines: TranscriptLine[] = useMemo(() => {
    const combinedRaw = [lessonContent, lessonSummary]
      .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
      .join('\n');

    if (!combinedRaw) {
      return [];
    }

    const lines = combinedRaw
      .split(/\r?\n|(?<=[.!?।])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 6 && !/^https?:\/\//i.test(s));

    if (lines.length === 0) {
      return [];
    }

    const speaker = instructorName || lessonTitle || 'Instructor';
    const parsedExplicit = lines.map(parseTimestampPrefix);
    const effectiveTotal = Math.max(60, durationSeconds || lines.length * 45);
    const step = Math.max(10, Math.floor(effectiveTotal / lines.length));

    return lines.map((rawLine, index) => {
      const explicit = parsedExplicit[index];
      const sec = explicit
        ? explicit.seconds
        : Math.min(index * step, Math.max(0, effectiveTotal - 5));
      const cleanText = explicit ? explicit.text : rawLine;
      return {
        id: `ts-${index + 1}`,
        seconds: sec,
        timestamp: formatSeconds(sec),
        speaker,
        text: cleanText,
      };
    });
  }, [lessonTitle, instructorName, lessonSummary, lessonContent, durationSeconds]);

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
      <View
        style={[
          styles.searchBar,
          { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
        ]}
      >
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
        {transcriptLines.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={36} color={colors.textLight} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              {isBangla
                ? 'এই লেসনের জন্য এখনো কোনো লিখিত ট্রান্সক্রিপ্ট বা পাঠ-নোট যুক্ত করা হয়নি। ভিডিও চলাকালীন গুরুত্বপূর্ণ মুহূর্ত সংরক্ষণ করতে "নোটস" ট্যাব ব্যবহার করুন।'
                : 'No written transcript is published for this lesson yet. Use the Notes tab to save timestamped bookmarks while watching.'}
            </Text>
          </View>
        ) : filteredLines.length === 0 ? (
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
