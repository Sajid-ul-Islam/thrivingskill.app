import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { triggerHaptic } from '../../utils/haptics';
import { MIN_TOUCH_TARGET } from '../../theme/typography';
import { shape } from '../../theme/shapes';

interface QuickNoteBottomSheetProps {
  visible: boolean;
  timestamp: string;
  lessonTitle: string;
  onSaveNote: (text: string, timestamp: string) => void;
  onClose: () => void;
}

export const QuickNoteBottomSheet: React.FC<QuickNoteBottomSheetProps> = ({
  visible,
  timestamp,
  lessonTitle,
  onSaveNote,
  onClose,
}) => {
  const { colors, isDark } = useTheme();
  const [noteText, setNoteText] = useState<string>('');
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 4,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  if (!visible) return null;

  const handleSave = () => {
    if (!noteText.trim()) return;
    triggerHaptic('medium');
    onSaveNote(noteText.trim(), timestamp);
    setNoteText('');
    onClose();
  };

  const quickTags = ['📌 Key Concept', '💡 Insight', '❓ Review Later', '⚙️ Workflow'];

  const addTag = (tag: string) => {
    triggerHaptic('light');
    setNoteText((prev) => (prev ? `${prev} ${tag}` : tag));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.sheetOverlay}
      pointerEvents="box-none"
    >
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: isDark ? colors.surfaceCard : '#FFFFFF',
            borderColor: colors.border,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Top Header */}
        <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <View style={styles.iconCircle}>
              <Ionicons name="create-outline" size={18} color="#102F53" />
            </View>
            <View style={styles.titleCol}>
              <View style={styles.titleTagRow}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Add Study Note</Text>
                <View style={styles.timestampBadge}>
                  <Ionicons name="time" size={12} color="#102F53" />
                  <Text style={styles.timestampText}>{timestamp}</Text>
                </View>
              </View>
              <Text style={[styles.lessonSubtitle, { color: colors.textMuted }]} numberOfLines={1}>
                {lessonTitle}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => {
              triggerHaptic('light');
              onClose();
            }}
            accessibilityRole="button"
            accessibilityLabel="Close note editor"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Quick Tags Strip */}
        <View style={styles.tagsStrip}>
          {quickTags.map((tag, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.tagChip, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
              onPress={() => addTag(tag)}
              accessibilityRole="button"
              accessibilityLabel={`Add tag: ${tag}`}
            >
              <Text style={[styles.tagText, { color: colors.text }]}>{tag}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Note Input */}
        <TextInput
          style={[
            styles.textInput,
            {
              backgroundColor: colors.surfaceSubtle,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
          placeholder="Type your notes, timestamped bookmark, or insight..."
          placeholderTextColor={colors.textLight}
          value={noteText}
          onChangeText={setNoteText}
          multiline
          numberOfLines={3}
          autoFocus
        />

        {/* Actions Row */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.cancelBtn, { borderColor: colors.border }]}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Cancel note"
          >
            <Text style={[styles.cancelText, { color: colors.textMuted }]}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.saveBtn,
              {
                backgroundColor: noteText.trim().length > 0 ? '#FFB606' : colors.surfaceSubtle,
                opacity: noteText.trim().length > 0 ? 1 : 0.6,
              },
            ]}
            onPress={handleSave}
            disabled={!noteText.trim()}
            accessibilityRole="button"
            accessibilityLabel="Save study note"
          >
            <Ionicons
              name="checkmark"
              size={16}
              color={noteText.trim().length > 0 ? '#102F53' : colors.textMuted}
            />
            <Text
              style={[
                styles.saveText,
                { color: noteText.trim().length > 0 ? '#102F53' : colors.textMuted },
              ]}
            >
              Save Note
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  sheetOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 90,
  },
  container: {
    borderTopLeftRadius: shape.large,
    borderTopRightRadius: shape.large,
    borderTopWidth: 1.5,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    padding: 16,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    gap: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    gap: 10,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFB606',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  titleCol: {
    flex: 1,
    minWidth: 0,
  },
  titleTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  timestampBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFB606',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  timestampText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#102F53',
  },
  lessonSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  tagsStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 10,
  },
  tagChip: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: shape.medium,
    padding: 10,
    fontSize: 13,
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: shape.medium,
    borderWidth: 1,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '600',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: shape.medium,
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    gap: 6,
  },
  saveText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
