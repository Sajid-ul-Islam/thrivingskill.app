import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { NotebookNote } from '../../types/notebookLM';
import { NotebookLMService } from '../../services/notebookLMService';

interface NotesModalProps {
  visible: boolean;
  onClose: () => void;
  notes: NotebookNote[];
  onNotesUpdated: () => void;
}

export const NotesModal: React.FC<NotesModalProps> = ({
  visible,
  onClose,
  notes,
  onNotesUpdated,
}) => {
  const { colors } = useTheme();
  const [isCreating, setIsCreating] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  const handleSave = async () => {
    if (!noteTitle.trim()) {
      Alert.alert('Title Required', 'Please provide a title for your note.');
      return;
    }
    if (!noteContent.trim()) {
      Alert.alert('Content Required', 'Please enter note content.');
      return;
    }

    await NotebookLMService.saveNote(noteTitle, noteContent);
    setNoteTitle('');
    setNoteContent('');
    setIsCreating(false);
    onNotesUpdated();
  };

  const handleDelete = async (id: string) => {
    await NotebookLMService.deleteNote(id);
    onNotesUpdated();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]}
            onPress={onClose}
          >
            <Ionicons name="close" size={20} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.titleCol}>
            <Text style={[styles.title, { color: colors.text }]}>Notebook Notes</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {notes.length} saved insights & takeaways
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.addBtn,
              { backgroundColor: isCreating ? colors.primary : colors.surfaceSubtle },
            ]}
            onPress={() => setIsCreating(!isCreating)}
          >
            <Ionicons
              name={isCreating ? 'list' : 'add'}
              size={20}
              color={isCreating ? '#FFFFFF' : colors.text}
            />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {isCreating ? (
            <View style={[styles.createCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
              <Text style={[styles.formHeading, { color: colors.text }]}>New Notebook Note</Text>

              <Text style={[styles.fieldLabel, { color: colors.text }]}>Note Title</Text>
              <TextInput
                style={[
                  styles.titleInput,
                  {
                    backgroundColor: colors.surfaceSubtle,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="e.g. Prompt Architecture Summary"
                placeholderTextColor={colors.textMuted}
                value={noteTitle}
                onChangeText={setNoteTitle}
              />

              <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 12 }]}>Note Content</Text>
              <TextInput
                style={[
                  styles.contentInput,
                  {
                    backgroundColor: colors.surfaceSubtle,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="Type your study observations or copy AI responses here..."
                placeholderTextColor={colors.textMuted}
                value={noteContent}
                onChangeText={setNoteContent}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                onPress={handleSave}
              >
                <Ionicons name="save-outline" size={16} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>Save Note</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.notesList}>
              {notes.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="journal-outline" size={48} color={colors.textMuted} />
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>No Notes Yet</Text>
                  <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                    Pin AI responses or tap + to save your executive study notes.
                  </Text>
                </View>
              ) : (
                notes.map((n) => (
                  <View
                    key={n.id}
                    style={[styles.noteCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}
                  >
                    <View style={styles.noteHeader}>
                      <Text style={[styles.noteCardTitle, { color: colors.text }]}>{n.title}</Text>
                      <TouchableOpacity onPress={() => handleDelete(n.id)}>
                        <Ionicons name="trash-outline" size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>

                    <Text style={[styles.noteBody, { color: colors.text }]}>{n.content}</Text>

                    <View style={styles.noteFooter}>
                      <View style={styles.tagsRow}>
                        {n.tags.map((t, idx) => (
                          <View key={idx} style={[styles.tagPill, { backgroundColor: colors.surfaceSubtle }]}>
                            <Text style={[styles.tagText, { color: colors.primary }]}>#{t}</Text>
                          </View>
                        ))}
                      </View>
                      <Text style={[styles.noteTime, { color: colors.textMuted }]}>{n.timestamp}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCol: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  createCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  formHeading: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  titleInput: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  contentInput: {
    height: 120,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    lineHeight: 20,
    marginBottom: 16,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  notesList: {
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 18,
  },
  noteCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  noteCardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    marginRight: 8,
  },
  noteBody: {
    fontSize: 13,
    lineHeight: 19,
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  noteTime: {
    fontSize: 11,
  },
});
