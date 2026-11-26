import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { triggerHaptic } from '../../utils/haptics';
import { MIN_TOUCH_TARGET } from '../../theme/typography';
import { shape } from '../../theme/shapes';

interface DownloadQualityModalProps {
  visible: boolean;
  onClose: () => void;
  currentQuality?: string;
  onSelectStreamQuality?: (quality: string) => void;
  lessonTitle: string;
}

export const DownloadQualityModal: React.FC<DownloadQualityModalProps> = ({
  visible,
  onClose,
  currentQuality = 'Auto',
  onSelectStreamQuality,
  lessonTitle,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const streamOptions = [
    {
      id: 'Auto',
      label: 'Auto (Adaptive Streaming)',
      sublabel: 'Dynamically matches your connection speed',
    },
    { id: '1080p', label: '1080p Full HD', sublabel: 'Crispest video for fast Wi-Fi' },
    { id: '720p', label: '720p HD', sublabel: 'Recommended balanced streaming quality' },
    { id: '480p', label: '480p SD', sublabel: 'Steady playback on mobile data' },
    { id: '360p', label: '360p Data Saver', sublabel: 'Lowest mobile data usage' },
  ];

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={styles.backdropTouch}
          activeOpacity={1}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Dismiss quality modal"
        />
        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: colors.surfaceCard,
              borderColor: colors.border,
              paddingBottom: Math.max(insets.bottom, 20),
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.headerIconBg, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="options" size={20} color={colors.primary} />
              </View>
              <View style={styles.headerTitleCol}>
                <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                  Online Streaming Quality
                </Text>
                <Text style={[styles.headerSub, { color: colors.textMuted }]} numberOfLines={1}>
                  {lessonTitle}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Close quality picker"
            >
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Options List */}
          <View style={styles.optionsList}>
            {streamOptions.map((opt) => {
              const isSelected = currentQuality === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.optionCard,
                    {
                      backgroundColor: isSelected
                        ? isDark
                          ? 'rgba(227, 66, 52, 0.12)'
                          : 'rgba(227, 66, 52, 0.06)'
                        : colors.surfaceSubtle,
                      borderColor: isSelected ? '#E34234' : colors.border,
                    },
                  ]}
                  onPress={() => {
                    triggerHaptic('light');
                    if (onSelectStreamQuality) onSelectStreamQuality(opt.id);
                    onClose();
                  }}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${opt.label}`}
                >
                  <View style={styles.optionLeft}>
                    <Ionicons
                      name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={isSelected ? '#E34234' : colors.textMuted}
                    />
                    <View style={styles.optionTextCol}>
                      <Text
                        style={[
                          styles.optionLabel,
                          { color: colors.text, fontWeight: isSelected ? '700' : '600' },
                        ]}
                      >
                        {opt.label}
                      </Text>
                      <Text style={[styles.optionSublabel, { color: colors.textMuted }]}>
                        {opt.sublabel}
                      </Text>
                    </View>
                  </View>

                  {isSelected && <Ionicons name="checkmark" size={20} color="#10B981" />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  backdropTouch: {
    flex: 1,
  },
  sheetContainer: {
    borderTopLeftRadius: shape.large,
    borderTopRightRadius: shape.large,
    borderTopWidth: 1,
    paddingTop: 16,
    paddingHorizontal: 18,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    gap: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    gap: 12,
  },
  headerIconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerTitleCol: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerSub: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  optionsList: {
    paddingVertical: 14,
    gap: 10,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: shape.medium,
    borderWidth: 1,
    gap: 10,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    gap: 12,
  },
  optionTextCol: {
    flex: 1,
    minWidth: 0,
  },
  labelBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  optionLabel: {
    fontSize: 14,
  },
  recommendedBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  recommendedBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  optionSublabel: {
    fontSize: 11,
    marginTop: 2,
  },
  sizeCol: {
    alignItems: 'flex-end',
    gap: 4,
    flexShrink: 0,
  },
  sizeText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
