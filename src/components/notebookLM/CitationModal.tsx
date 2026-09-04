import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { NotebookCitation } from '../../types/notebookLM';

interface CitationModalProps {
  citation: NotebookCitation | null;
  onClose: () => void;
  onViewSource?: (sourceId: string) => void;
}

export const CitationModal: React.FC<CitationModalProps> = ({
  citation,
  onClose,
  onViewSource,
}) => {
  const { colors, isDark } = useTheme();

  if (!citation) return null;

  return (
    <Modal
      visible={!!citation}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surfaceCard,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.badgeRow}>
              <View style={[styles.citePill, { backgroundColor: colors.primary }]}>
                <Text style={styles.citePillText}>[{citation.citationIndex}]</Text>
              </View>
              <View style={[styles.typeBadge, { backgroundColor: colors.surfaceSubtle }]}>
                <Ionicons
                  name={citation.sourceType === 'youtube' ? 'logo-youtube' : 'document-text'}
                  size={12}
                  color={citation.sourceType === 'youtube' ? '#FF0000' : colors.primary}
                />
                <Text style={[styles.typeBadgeText, { color: colors.textMuted }]}>
                  {citation.sourceType.toUpperCase()} SOURCE
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]}
              onPress={onClose}
            >
              <Ionicons name="close" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Source Title & Section */}
          <Text style={[styles.sourceTitle, { color: colors.text }]}>
            {citation.sourceTitle}
          </Text>
          <Text style={[styles.sectionName, { color: colors.textMuted }]}>
            {citation.section}
          </Text>

          {/* Excerpt Box */}
          <View style={[styles.excerptBox, { backgroundColor: isDark ? '#0F192C' : '#F8FAFC' }]}>
            <View style={styles.quoteIcon}>
              <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.primary} />
            </View>
            <Text style={[styles.excerptText, { color: colors.text }]}>
              "{citation.excerpt}"
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.doneBtn, { backgroundColor: colors.primary }]}
              onPress={onClose}
            >
              <Text style={styles.doneBtnText}>Close Citation</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  citePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  citePillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
    lineHeight: 20,
  },
  sectionName: {
    fontSize: 12,
    marginBottom: 14,
  },
  excerptBox: {
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#102F53',
    marginBottom: 16,
    gap: 6,
  },
  quoteIcon: {
    opacity: 0.8,
  },
  excerptText: {
    fontSize: 13,
    lineHeight: 19,
    fontStyle: 'italic',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  doneBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
