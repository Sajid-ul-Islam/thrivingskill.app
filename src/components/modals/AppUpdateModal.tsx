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
import Ionicons from '@expo/vector-icons/Ionicons';
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
  const [checked, setChecked] = useState(false);

  const handleCheck = async () => {
    triggerHaptic('light');
    setIsChecking(true);
    setChecked(false);

    const result = await AppUpdateService.checkForUpdate();
    setIsChecking(false);
    setChecked(true);

    if (result.isDownloaded) {
      triggerHaptic('success');
      setUpdateReady(true);
    } else {
      showToast({ message: "You're on the latest version!", type: 'success' });
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
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.overlay, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <View
          style={[styles.sheet, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}
          accessibilityViewIsModal={true}
        >
          {/* Handle bar */}
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(16,47,83,0.08)' }]}>
              <Ionicons name="cloud-download-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: colors.text }]}>App Updates</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>Version 1.4.0</Text>
            </View>
            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]}
              onPress={() => { triggerHaptic('light'); onClose(); }}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* State card */}
          {updateReady ? (
            <View style={[styles.stateCard, { backgroundColor: colors.successLight, borderColor: colors.success }]}>
              <Ionicons name="checkmark-circle" size={40} color={colors.success} />
              <Text style={[styles.stateTitle, { color: colors.success }]}>Update Ready!</Text>
              <Text style={[styles.stateBody, { color: colors.text }]}>
                A new version of Thriving Skills is downloaded and ready. Tap below to apply it now.
              </Text>
            </View>
          ) : checked ? (
            <View style={[styles.stateCard, { backgroundColor: isDark ? colors.surfaceSubtle : '#F0FDF4', borderColor: colors.success }]}>
              <Ionicons name="shield-checkmark-outline" size={40} color={colors.success} />
              <Text style={[styles.stateTitle, { color: colors.text }]}>You're up to date</Text>
              <Text style={[styles.stateBody, { color: colors.textMuted }]}>
                Thriving Skills is running the latest version. We'll notify you when a new update arrives.
              </Text>
            </View>
          ) : (
            <View style={[styles.stateCard, { backgroundColor: isDark ? colors.surfaceSubtle : '#F8FAFC', borderColor: colors.border }]}>
              <Ionicons name="sync-circle-outline" size={40} color={colors.primary} />
              <Text style={[styles.stateTitle, { color: colors.text }]}>Keep Your App Fresh</Text>
              <Text style={[styles.stateBody, { color: colors.textMuted }]}>
                Get new lessons, features, and fixes instantly — no app store visit needed.
              </Text>
            </View>
          )}

          {/* Action button */}
          {updateReady ? (
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.success }]}
              onPress={handleRestart}
              accessibilityRole="button"
              accessibilityLabel="Apply update and restart"
            >
              <Ionicons name="refresh" size={18} color={colors.onSuccess} />
              <Text style={[styles.btnText, { color: colors.onSuccess }]}>Apply Update & Restart</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.primary, opacity: isChecking ? 0.75 : 1 }]}
              onPress={handleCheck}
              disabled={isChecking}
              accessibilityRole="button"
              accessibilityLabel="Check for updates"
            >
              {isChecking ? (
                <>
                  <ActivityIndicator size="small" color={colors.onPrimary} />
                  <Text style={[styles.btnText, { color: colors.onPrimary }]}>Checking…</Text>
                </>
              ) : (
                <>
                  <Ionicons name="sync-outline" size={18} color={colors.onPrimary} />
                  <Text style={[styles.btnText, { color: colors.onPrimary }]}>Check for Updates</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <Text style={[styles.hint, { color: colors.textMuted }]}>
            Updates also apply automatically each time you open the app.
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: shape.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...typography.h3,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  closeBtn: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: shape.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stateCard: {
    borderRadius: shape.large,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  stateTitle: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  stateBody: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: shape.medium,
    gap: 8,
    minHeight: MIN_TOUCH_TARGET,
    marginBottom: 12,
  },
  btnText: {
    fontSize: 15,
    fontWeight: '800',
  },
  hint: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 4,
  },
});
