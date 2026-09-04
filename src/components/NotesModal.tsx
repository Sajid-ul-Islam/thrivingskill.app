import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Share,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLearning } from '../context/LearningContext';

interface NotesModalProps {
  visible: boolean;
  courseId: string;
  lessonId: string;
  onClose: () => void;
}

export const NotesModal: React.FC<NotesModalProps> = ({ visible, courseId, lessonId, onClose }) => {
  const { colors } = useTheme();
  const { getNotesForLesson, addNote, deleteNote, courses } = useLearning();
  const [newNoteText, setNewNoteText] = useState('');

  const lessonNotes = getNotesForLesson(courseId, lessonId);
  const currentCourse = courses.find((c) => c.id === courseId);
  const currentLesson = currentCourse?.modules.flatMap((m) => m.lessons).find((l) => l.id === lessonId);

  const handleSaveNote = () => {
    if (!newNoteText.trim()) return;
    addNote(courseId, lessonId, newNoteText.trim());
    setNewNoteText('');
  };

  const handleExportNotes = async () => {
    if (lessonNotes.length === 0) {
      Alert.alert('No Notes', 'Add some study notes first before exporting.');
      return;
    }

    const courseTitle = currentCourse?.title || 'Thriving Skills Course';
    const lessonTitle = currentLesson?.title || 'Lesson Notes';
    const dateStr = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

    let markdown = `# 📝 Study Notes: ${lessonTitle}\n`;
    markdown += `**Course:** ${courseTitle}\n`;
    markdown += `**Date:** ${dateStr}\n`;
    markdown += `**Platform:** Thriving Skills (Executive Learning)\n\n`;
    markdown += `---\n\n`;

    lessonNotes.forEach((note, idx) => {
      const time = new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      markdown += `### Note ${idx + 1} (${time})\n${note.text}\n\n`;
    });

    markdown += `---\n*Exported via Thriving Skills App*`;

    try {
      await Share.share({
        title: `Study Notes - ${lessonTitle}`,
        message: markdown,
      });
    } catch {
      // Ignored
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.surfaceCard, borderColor: colors.border },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <Ionicons name="document-text" size={20} color={colors.primary} />
              <Text style={[styles.headerTitle, { color: colors.text }]}>Study Notes</Text>
            </View>
            <View style={styles.headerRight}>
              {lessonNotes.length > 0 && (
                <TouchableOpacity
                  onPress={handleExportNotes}
                  style={[styles.exportBtn, { backgroundColor: colors.surfaceSubtle }]}
                  accessibilityLabel="Export study notes"
                >
                  <Ionicons name="share-outline" size={16} color={colors.primary} />
                  <Text style={[styles.exportBtnText, { color: colors.primary }]}>Export</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Input field */}
            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
              ]}
            >
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Type a key takeaway, formula, or timestamp note..."
                placeholderTextColor={colors.textLight}
                value={newNoteText}
                onChangeText={setNewNoteText}
                multiline
                numberOfLines={3}
              />
              <TouchableOpacity
                style={[
                  styles.addBtn,
                  { backgroundColor: newNoteText.trim() ? colors.primary : colors.border },
                ]}
                onPress={handleSaveNote}
                disabled={!newNoteText.trim()}
              >
                <Ionicons name="send" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Notes list */}
            <Text style={[styles.notesHeading, { color: colors.textMuted }]}>
              Saved Notes ({lessonNotes.length})
            </Text>

            {lessonNotes.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="create-outline" size={36} color={colors.textLight} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  No notes taken for this lesson yet. Write down your key insights!
                </Text>
              </View>
            ) : (
              <View style={styles.notesList}>
                {lessonNotes.map((note) => (
                  <View
                    key={note.id}
                    style={[
                      styles.noteItem,
                      { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                    ]}
                  >
                    <View style={styles.noteTopRow}>
                      <View style={[styles.timeTag, { backgroundColor: colors.primaryLight }]}>
                        <Ionicons name="time" size={11} color={colors.primary} />
                        <Text style={[styles.timeText, { color: colors.primary }]}>
                          {note.timestamp}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => deleteNote(note.id)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons name="trash-outline" size={16} color={colors.danger} />
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.noteContent, { color: colors.text }]}>{note.text}</Text>
                    <Text style={[styles.noteDate, { color: colors.textLight }]}>
                      {note.createdAt}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    maxHeight: '80%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  exportBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: 20,
  },
  inputWrapper: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  notesHeading: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 240,
    lineHeight: 18,
  },
  notesList: {
    gap: 10,
  },
  noteItem: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  noteTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  noteContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  noteDate: {
    fontSize: 11,
  },
});
