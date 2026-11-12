import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useFeedback } from '../../context/FeedbackContext';
import { AppUpdateService } from '../../services/appUpdateService';
import { triggerHaptic } from '../../utils/haptics';
import { typography, MIN_TOUCH_TARGET } from '../../theme/typography';
import { shape } from '../../theme/shapes';

interface AppUpdateModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AppUpdateModal: React.FC<AppUpdateModalProps> = ({ visible, onClose }) => {
  const { colors, isDark } = useTheme();
  const { showToast } = useFeedback();
  const insets = useSafeAreaInsets();
  const [isChecking, setIsChecking] = useState(false);
  const [updateReady, setUpdateReady] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const info = AppUpdateService.getUpdateInfo();

  const handleCheck = async () => {
    triggerHaptic('light');
    setIsChecking(true);
    setStatusMessage(null);

    const result = await AppUpdateService.checkForUpdate();
    setIsChecking(false);
    setStatusMessage(result.message);

    if (result.isDownloaded) {
      triggerHaptic('success');
      setUpdateReady(true);
    } else {
      showToast({ message: result.message, type: 'info' });
    }
  };

  const handleRestart = async () => {
    triggerHaptic('medium');
    try {
      await AppUpdateService.reloadApp();
    } catch {
      Alert.alert('Restart Required', 'Please close and re-open the app to apply the update.');
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View
        style={[
          styles.overlay,
          {
            paddingTop: Math.max(insets.top, 20),
            paddingBottom: Math.max(insets.bottom, 20),
          },
        ]}
      >
        <View
          style={[styles.card, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}
          accessibilityViewIsModal={true}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="cloud-download-outline" size={24} color={colors.primary} />
            </View>
            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]}
              onPress={() => {
                triggerHaptic('light');
                onClose();
              }}
              accessibilityRole="button"
              accessibilityLabel="Close In-App Updates dialog"
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.title, { color: colors.text }]}>In-App Updates (OTA)</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Over-the-air updates deliver the latest features, screens, and bug fixes without reinstalling or rebuilding the APK.
          </Text>

          {/* Current Build Metadata */}
          <View style={[styles.infoBox, { backgroundColor: isDark ? '#0F192C' : '#F8FAFC' }]}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>App Version</Text>
              <Text style={[styles.infoVal, { color: colors.text }]}>v1.0.0 (Expo SDK 57)</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Channel / Environment</Text>
              <Text style={[styles.infoVal, { color: colors.primary }]}>{info.channel}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>OTA Update Engine</Text>
              <View style={styles.statusPill}>
                <View style={[styles.dot, { backgroundColor: info.isEnabled ? '#10B981' : '#F59E0B' }]} />
                <Text style={styles.statusPillText}>
                  {info.isEnabled ? 'EAS Production OTA Active' : 'Metro Live Bundler'}
                </Text>
              </View>
            </View>
            {info.updateId && (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Update ID</Text>
                <Text style={[styles.infoVal, { color: colors.textMuted, fontSize: 11 }]}>
                  {info.updateId.slice(0, 16)}...
                </Text>
              </View>
            )}
          </View>

          {/* Status Message */}
          {statusMessage && (
            <View
              style={[
                styles.messageBox,
                {
                  backgroundColor: updateReady
                    ? colors.successLight
                    : isDark
                    ? '#1E293B'
                    : '#EFF6FF',
                  borderColor: updateReady ? colors.success : colors.primary,
                },
              ]}
            >
              <Ionicons
                name={updateReady ? 'checkmark-circle' : 'information-circle'}
                size={16}
                color={updateReady ? colors.success : colors.primary}
              />
              <Text
                style={[
                  styles.messageText,
                  { color: updateReady ? colors.success : colors.text },
                ]}
              >
                {statusMessage}
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          {updateReady ? (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.success }]}
              onPress={handleRestart}
              accessibilityRole="button"
              accessibilityLabel="Restart and apply update"
            >
              <Ionicons name="refresh" size={18} color={colors.onSuccess} />
              <Text style={[styles.actionBtnText, { color: colors.onSuccess }]}>Restart & Apply Update</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.primary }]}
              onPress={handleCheck}
              disabled={isChecking}
              accessibilityRole="button"
              accessibilityLabel="Check for app updates"
            >
              {isChecking ? (
                <ActivityIndicator size="small" color={colors.onPrimary} />
              ) : (
                <>
                  <Ionicons name="sync-outline" size={18} color={colors.onPrimary} />
                  <Text style={[styles.actionBtnText, { color: colors.onPrimary }]}>Check for Updates</Text>
                </>
              )}
            </TouchableOpacity>
          )}
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
    borderRadius: shape.largeIncreased,
    borderWidth: 1,
    padding: 22,
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
    marginBottom: 14,
  },
  iconCircle: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: shape.full,
    backgroundColor: 'rgba(16, 47, 83, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: shape.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.h3,
    marginBottom: 4,
  },
  subtitle: {
    ...typography.caption,
    marginBottom: 16,
  },
  infoBox: {
    borderRadius: shape.large,
    padding: 12,
    gap: 10,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusPillText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  messageBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
    marginBottom: 16,
  },
  messageText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '500',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
