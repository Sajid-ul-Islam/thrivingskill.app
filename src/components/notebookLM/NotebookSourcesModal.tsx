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
import { NotebookSource } from '../../types/notebookLM';
import { NotebookLMService } from '../../services/notebookLMService';

interface NotebookSourcesModalProps {
  visible: boolean;
  onClose: () => void;
  sources: NotebookSource[];
  onSourcesUpdated: () => void;
}

export const NotebookSourcesModal: React.FC<NotebookSourcesModalProps> = ({
  visible,
  onClose,
  sources,
  onSourcesUpdated,
}) => {
  const { colors, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'sources' | 'add'>('sources');
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeCount = sources.filter((s) => s.isSelected).length;
  const totalWords = sources
    .filter((s) => s.isSelected)
    .reduce((sum, s) => sum + s.wordCount, 0);

  const handleToggle = async (id: string) => {
    await NotebookLMService.toggleSource(id);
    onSourcesUpdated();
  };

  const handleSelectAll = async (select: boolean) => {
    for (const src of sources) {
      if (src.isSelected !== select) {
        await NotebookLMService.toggleSource(src.id);
      }
    }
    onSourcesUpdated();
  };

  const handleAddSource = async () => {
    if (!newTitle.trim()) {
      Alert.alert('Title Required', 'Please enter a title for your custom source.');
      return;
    }
    if (!newContent.trim() || newContent.trim().length < 20) {
      Alert.alert(
        'Content Required',
        'Please enter or paste at least a few sentences of study text to ground the AI.'
      );
      return;
    }

    setIsSubmitting(true);
    await NotebookLMService.addCustomSource(newTitle, newContent);
    setNewTitle('');
    setNewContent('');
    setIsSubmitting(false);
    setActiveTab('sources');
    onSourcesUpdated();
    Alert.alert('Source Added 🎉', 'Your custom note is now indexed and active in NotebookLM grounding.');
  };

  const handleDeleteSource = async (id: string) => {
    Alert.alert('Remove Source', 'Are you sure you want to remove this custom source?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await NotebookLMService.deleteSource(id);
          onSourcesUpdated();
        },
      },
    ]);
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
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Notebook Sources
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
              {activeCount} of {sources.length} active • {totalWords.toLocaleString()} words indexed
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.addHeaderBtn,
              { backgroundColor: activeTab === 'add' ? colors.primary : colors.surfaceSubtle },
            ]}
            onPress={() => setActiveTab(activeTab === 'add' ? 'sources' : 'add')}
          >
            <Ionicons
              name={activeTab === 'add' ? 'list' : 'add'}
              size={18}
              color={activeTab === 'add' ? '#FFFFFF' : colors.text}
            />
          </TouchableOpacity>
        </View>

        {/* Tab Switcher */}
        <View style={[styles.tabRow, { backgroundColor: colors.surfaceCard, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'sources' && [styles.tabActive, { borderColor: colors.primary }]]}
            onPress={() => setActiveTab('sources')}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'sources' ? colors.primary : colors.textMuted },
                activeTab === 'sources' && { fontWeight: '700' },
              ]}
            >
              Active Sources ({activeCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'add' && [styles.tabActive, { borderColor: colors.primary }]]}
            onPress={() => setActiveTab('add')}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'add' ? colors.primary : colors.textMuted },
                activeTab === 'add' && { fontWeight: '700' },
              ]}
            >
              + Add Custom Note / Source
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'sources' ? (
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Quick Action Toggles */}
            <View style={styles.quickToggleRow}>
              <Text style={[styles.infoBannerText, { color: colors.textMuted }]}>
                Toggle sources to focus your AI inquiry:
              </Text>
              <View style={styles.quickBtns}>
                <TouchableOpacity
                  onPress={() => handleSelectAll(true)}
                  style={[styles.quickPill, { backgroundColor: colors.surfaceSubtle }]}
                >
                  <Text style={[styles.quickPillText, { color: colors.primary }]}>Select All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleSelectAll(false)}
                  style={[styles.quickPill, { backgroundColor: colors.surfaceSubtle }]}
                >
                  <Text style={[styles.quickPillText, { color: colors.textMuted }]}>Clear</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Sources List */}
            {sources.map((src) => {
              const isCustom = src.id.startsWith('custom-');
              return (
                <TouchableOpacity
                  key={src.id}
                  style={[
                    styles.sourceCard,
                    {
                      backgroundColor: colors.surfaceCard,
                      borderColor: src.isSelected ? colors.primary : colors.border,
                      borderWidth: src.isSelected ? 1.5 : 1,
                    },
                  ]}
                  onPress={() => handleToggle(src.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.sourceCardLeft}>
                    <TouchableOpacity
                      style={[
                        styles.checkbox,
                        {
                          backgroundColor: src.isSelected ? colors.primary : 'transparent',
                          borderColor: src.isSelected ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => handleToggle(src.id)}
                    >
                      {src.isSelected && (
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>

                    <View style={styles.sourceInfo}>
                      <View style={styles.sourceTypeBadge}>
                        <Ionicons
                          name={src.icon as any}
                          size={12}
                          color={src.type === 'youtube' ? '#FF0000' : colors.primary}
                        />
                        <Text style={[styles.sourceTypeText, { color: colors.textMuted }]}>
                          {src.type.toUpperCase()} • {src.wordCount.toLocaleString()} words
                        </Text>
                      </View>

                      <Text
                        style={[
                          styles.sourceTitle,
                          { color: colors.text },
                          src.isSelected && { fontWeight: '700' },
                        ]}
                      >
                        {src.title}
                      </Text>
                      <Text style={[styles.sourceSubtitle, { color: colors.textMuted }]} numberOfLines={1}>
                        {src.subtitle}
                      </Text>
                    </View>
                  </View>

                  {isCustom && (
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDeleteSource(src.id)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : (
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.addCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
              <View style={styles.addCardHeader}>
                <Ionicons name="document-text" size={20} color={colors.primary} />
                <Text style={[styles.addCardTitle, { color: colors.text }]}>
                  Add Custom Text Source
                </Text>
              </View>

              <Text style={[styles.addCardDesc, { color: colors.textMuted }]}>
                Paste lecture transcripts, personal study notes, textbook chapters, or corporate briefs. NotebookLM will index them with exact line citations.
              </Text>

              <Text style={[styles.inputLabel, { color: colors.text }]}>Source Title</Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.surfaceSubtle,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="e.g. My Q3 Financial Analysis Notes"
                placeholderTextColor={colors.textMuted}
                value={newTitle}
                onChangeText={setNewTitle}
              />

              <Text style={[styles.inputLabel, { color: colors.text, marginTop: 14 }]}>
                Source Text / Content
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colors.surfaceSubtle,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="Paste or type notes here..."
                placeholderTextColor={colors.textMuted}
                value={newContent}
                onChangeText={setNewContent}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  { backgroundColor: colors.primary },
                  isSubmitting && { opacity: 0.6 },
                ]}
                onPress={handleAddSource}
                disabled={isSubmitting}
              >
                <Ionicons name="cloud-upload-outline" size={18} color="#FFFFFF" />
                <Text style={styles.submitBtnText}>
                  {isSubmitting ? 'Indexing Source...' : 'Index & Add as Source'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
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
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  addHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderColor: 'transparent',
  },
  tabActive: {
    borderColor: '#102F53',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  quickToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoBannerText: {
    fontSize: 12,
    flex: 1,
  },
  quickBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  quickPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  quickPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  sourceCardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  sourceInfo: {
    flex: 1,
  },
  sourceTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  sourceTypeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sourceTitle: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
    marginBottom: 2,
  },
  sourceSubtitle: {
    fontSize: 11.5,
  },
  deleteBtn: {
    padding: 6,
    marginLeft: 6,
  },
  addCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  addCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  addCardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  addCardDesc: {
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  textInput: {
    height: 44,
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    fontSize: 14,
  },
  textArea: {
    height: 140,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    fontSize: 13.5,
    lineHeight: 20,
    marginBottom: 16,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
