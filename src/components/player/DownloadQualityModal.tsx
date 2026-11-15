import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { triggerHaptic } from '../../utils/haptics';
import { MIN_TOUCH_TARGET } from '../../theme/typography';
import { shape } from '../../theme/shapes';

interface DownloadQualityModalProps {
  visible: boolean;
  onClose: () => void;
  mode?: 'download' | 'streamQuality';
  currentQuality?: string;
  onSelectStreamQuality?: (quality: string) => void;
  onStartDownload?: (quality: '360p' | '720p' | '1080p') => void;
  lessonTitle: string;
}

export const DownloadQualityModal: React.FC<DownloadQualityModalProps> = ({
  visible,
  onClose,
  mode = 'download',
  currentQuality = '720p',
  onSelectStreamQuality,
  onStartDownload,
  lessonTitle,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const downloadOptions: {
    id: '360p' | '720p' | '1080p';
    label: string;
    sublabel: string;
    size: string;
    icon: string;
    recommended?: boolean;
  }[] = [
    {
      id: '360p',
      label: '360p Data Saver',
      sublabel: 'Optimized for mobile data & quick downloads',
      size: '~25 MB',
      icon: 'cellular-outline',
    },
    {
      id: '720p',
      label: '720p HD Video',
      sublabel: 'Standard crisp high-definition quality',
      size: '~65 MB',
      icon: 'sparkles-outline',
      recommended: true,
    },
    {
      id: '1080p',
      label: '1080p Full HD',
      sublabel: 'Maximum studio fidelity for tablets & desk study',
      size: '~140 MB',
      icon: 'tv-outline',
    },
  ];

  const streamOptions = [
    { id: 'Auto', label: 'Auto (Media3 Adaptive)', sublabel: 'Dynamically adapts to network speed' },
    { id: '1080p', label: '1080p Full HD', sublabel: 'Requires fast Wi-Fi connection' },
    { id: '720p', label: '720p HD', sublabel: 'Recommended balanced bitrate' },
    { id: '480p', label: '480p SD', sublabel: 'Consistent playback on slower networks' },
    { id: '360p', label: '360p Data Saver', sublabel: 'Minimum bandwidth consumption' },
  ];

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.backdropTouch} activeOpacity={1} onPress={onClose} />
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
              <View style={[styles.headerIconBg, { backgroundColor: '#FFB60620' }]}>
                <Ionicons
                  name={mode === 'download' ? 'cloud-download' : 'options'}
                  size={20}
                  color="#FFB606"
                />
              </View>
              <View style={styles.headerTitleCol}>
                <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                  {mode === 'download' ? 'Download Lesson' : 'Streaming Quality'}
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
            {mode === 'download' ? (
              downloadOptions.map((opt) => {
                const isSelected = currentQuality.includes(opt.id);
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.optionCard,
                      {
                        backgroundColor: isSelected
                          ? isDark
                            ? 'rgba(255, 182, 6, 0.12)'
                            : '#FEF9C3'
                          : colors.surfaceSubtle,
                        borderColor: isSelected ? '#FFB606' : colors.border,
                      },
                    ]}
                    onPress={() => {
                      triggerHaptic('light');
                      if (onStartDownload) onStartDownload(opt.id);
                      onClose();
                    }}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`Download in ${opt.label}, ${opt.size}`}
                  >
                    <View style={styles.optionLeft}>
                      <Ionicons
                        name={opt.icon as any}
                        size={22}
                        color={isSelected ? '#FFB606' : colors.textMuted}
                      />
                      <View style={styles.optionTextCol}>
                        <View style={styles.labelBadgeRow}>
                          <Text
                            style={[
                              styles.optionLabel,
                              { color: colors.text, fontWeight: isSelected ? '700' : '600' },
                            ]}
                          >
                            {opt.label}
                          </Text>
                          {opt.recommended && (
                            <View style={styles.recommendedBadge}>
                              <Text style={styles.recommendedBadgeText}>Recommended</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.optionSublabel, { color: colors.textMuted }]}>
                          {opt.sublabel}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.sizeCol}>
                      <Text style={[styles.sizeText, { color: colors.primary }]}>{opt.size}</Text>
                      <Ionicons
                        name={isSelected ? 'checkmark-circle' : 'download-outline'}
                        size={20}
                        color={isSelected ? '#10B981' : colors.textMuted}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              streamOptions.map((opt) => {
                const isSelected = currentQuality === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.optionCard,
                      {
                        backgroundColor: isSelected
                          ? isDark
                            ? 'rgba(255, 182, 6, 0.12)'
                            : '#FEF9C3'
                          : colors.surfaceSubtle,
                        borderColor: isSelected ? '#FFB606' : colors.border,
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
                        color={isSelected ? '#FFB606' : colors.textMuted}
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

                    {isSelected && (
                      <Ionicons name="checkmark" size={20} color="#10B981" />
                    )}
                  </TouchableOpacity>
                );
              })
            )}
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
