import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { triggerHaptic } from '../../utils/haptics';
import { Note } from '../../types';

interface LessonNotesTabProps {
  lessonNotes: Note[];
  insetsBottom: number;
  onOpenNewNote: () => void;
  onSeekTo: (seconds: number) => void;
  onDeleteNote: (note: Note) => void;
  showToast: (options: { message: string; type?: 'info' | 'success' | 'warning' | 'error'; actionLabel?: string; onAction?: () => void }) => void;
}

export const LessonNotesTab: React.FC<LessonNotesTabProps> = ({
  lessonNotes,
  insetsBottom,
  onOpenNewNote,
  onSeekTo,
  onDeleteNote,
  showToast,
}) => {
  const { colors, isDark } = useTheme();
  const { isBangla } = useLanguage();

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.tabContentScroll, { paddingBottom: Math.max(insetsBottom, 16) + 80 }]}
      nestedScrollEnabled
    >
      <View style={styles.notesHeader}>
        <View style={styles.notesTitleCol}>
          <Text style={[styles.notesTitle, { color: colors.text }]}>
            {isBangla ? `লেকচার নোটস (${lessonNotes.length})` : `Lecture Notes (${lessonNotes.length})`}
          </Text>
          <Text style={[styles.notesSub, { color: colors.textMuted }]}>
            {isBangla ? 'টাইমস্ট্যাম্পযুক্ত বুকমার্ক ও ব্যক্তিগত পয়েন্ট' : 'Timestamped bookmarks & insights'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.takeNoteBtn, { backgroundColor: colors.primary }]}
          onPress={onOpenNewNote}
          accessibilityRole="button"
          accessibilityLabel="New Note"
        >
          <Ionicons name="add" size={15} color={colors.onPrimary} />
          <Text style={[styles.takeNoteText, { color: colors.onPrimary }]}>
            {isBangla ? 'নতুন নোট' : 'New Note'}
          </Text>
        </TouchableOpacity>
      </View>

      {lessonNotes.length === 0 ? (
        <View style={styles.emptyNotesBox}>
          <Ionicons name="document-text-outline" size={36} color={colors.textLight} />
          <Text style={[styles.emptyNotesText, { color: colors.textMuted }]}>
            {isBangla
              ? 'এখনো কোনো নোট যুক্ত করা হয়নি। যেকোনো মুহূর্তে গুরুত্বপূর্ণ বিষয় বুকমার্ক করতে "+ নোট" বাটনে ট্যাপ করুন!'
              : 'No notes yet. Tap "+ Note" below to bookmark key moments at any timestamp!'}
          </Text>
        </View>
      ) : (
        lessonNotes.map((n) => (
          <View
            key={n.id}
            style={[
              styles.noteCard,
              { backgroundColor: colors.surfaceCard, borderColor: colors.border },
            ]}
          >
            <View style={styles.noteTopRow}>
              <TouchableOpacity
                style={[
                  styles.noteTimestampPill,
                  { backgroundColor: isDark ? 'rgba(255, 182, 6, 0.18)' : '#FEF3C7' },
                ]}
                onPress={() => {
                  triggerHaptic('light');
                  const sec = n.timestamp.includes(':')
                    ? n.timestamp.split(':').reduce((acc, time) => 60 * acc + +time, 0)
                    : 0;
                  onSeekTo(sec);
                  showToast({ message: `Jumped to ${n.timestamp}`, type: 'info' });
                }}
                accessibilityRole="button"
                accessibilityLabel={`Jump to video timestamp ${n.timestamp}`}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="time-outline" size={12} color={isDark ? '#FBBF24' : '#102F53'} />
                <Text
                  style={[
                    styles.noteTimestampText,
                    { color: isDark ? '#FBBF24' : '#102F53' },
                  ]}
                >
                  {n.timestamp}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('warning');
                  onDeleteNote(n);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Delete note"
              >
                <Ionicons name="trash-outline" size={15} color={colors.textLight} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.noteBody, { color: colors.text }]}>{n.text}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  tabContentScroll: {
    padding: 16,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  notesTitleCol: {
    flex: 1,
    marginRight: 10,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  notesSub: {
    fontSize: 11,
  },
  takeNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  takeNoteText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyNotesBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
    gap: 12,
  },
  emptyNotesText: {
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
  },
  noteCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  noteTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  noteTimestampPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  noteTimestampText: {
    fontSize: 11,
    fontWeight: '700',
  },
  noteBody: {
    fontSize: 13,
    lineHeight: 18,
  },
});
