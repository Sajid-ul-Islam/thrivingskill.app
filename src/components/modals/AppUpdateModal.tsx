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
  const [apkUpdateReady, setApkUpdateReady] = useState(false);
  const [apkUrl, setApkUrl] = useState<string | null>(null);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [changelog, setChangelog] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  const handleCheck = async () => {
    triggerHaptic('light');
    setIsChecking(true);
    setChecked(false);
    setUpdateReady(false);
    setApkUpdateReady(false);

    const result = await AppUpdateService.checkForUpdate();
    setIsChecking(false);
    setChecked(true);

    if (result.isDownloaded) {
      triggerHaptic('success');
      setUpdateReady(true);
      showToast({ message: 'New update downloaded and ready to apply!', type: 'success' });
    } else if (result.isApkUpdateAvailable) {
      triggerHaptic('success');
      setApkUpdateReady(true);
      setApkUrl(result.apkDownloadUrl || null);
      setLatestVersion(result.latestVersion || '1.4.1');
      setChangelog(result.changelog || null);
      showToast({ message: `Version ${result.latestVersion || '1.4.1'} available!`, type: 'info' });
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

  const handleDownloadApk = async () => {
    triggerHaptic('medium');
    await AppUpdateService.downloadApk(apkUrl);
  };

  const updateInfo = AppUpdateService.getUpdateInfo();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.overlay, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.surfaceCard, borderColor: colors.border },
          ]}
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
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                v{updateInfo.currentVersion} • Channel: {updateInfo.channel}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]}
              onPress={() => {
                triggerHaptic('light');
                onClose();
              }}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Channel Info Capsule */}
          <View
            style={[
              styles.channelBadgeRow,
              { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
            ]}
          >
            <View style={styles.channelBadgeItem}>
              <Ionicons name="git-branch-outline" size={13} color={colors.primary} />
              <Text style={[styles.channelBadgeText, { color: colors.text }]}>
                EAS OTA Channel: <Text style={{ fontWeight: '700' }}>{updateInfo.channel}</Text>
              </Text>
            </View>
            <View style={styles.channelBadgeItem}>
              <Ionicons name="layers-outline" size={13} color={colors.secondary} />
              <Text style={[styles.channelBadgeText, { color: colors.text }]}>
                Runtime: <Text style={{ fontWeight: '700' }}>{updateInfo.runtimeVersion}</Text>
              </Text>
            </View>
          </View>

          {/* State card */}
          {updateReady ? (
            <View
              style={[
                styles.stateCard,
                { backgroundColor: colors.successLight, borderColor: colors.success },
              ]}
            >
              <Ionicons name="checkmark-circle" size={40} color={colors.success} />
              <Text style={[styles.stateTitle, { color: colors.success }]}>OTA Update Ready!</Text>
              <Text style={[styles.stateBody, { color: colors.text }]}>
                A new version of Thriving Skills is downloaded and ready over-the-air. Tap below to
                apply it now.
              </Text>
            </View>
          ) : apkUpdateReady ? (
            <View
              style={[
                styles.stateCard,
                {
                  backgroundColor: isDark ? colors.surfaceSubtle : '#EFF6FF',
                  borderColor: colors.primary,
                },
              ]}
            >
              <Ionicons name="arrow-down-circle-outline" size={40} color={colors.primary} />
              <Text style={[styles.stateTitle, { color: colors.primary }]}>
                New Version Available (v{latestVersion})
              </Text>
              <Text style={[styles.stateBody, { color: colors.text }]}>
                {changelog ||
                  'A new build is published on the self-hosted distribution server. Tap below to download the latest APK.'}
              </Text>
            </View>
          ) : checked ? (
            <View
              style={[
                styles.stateCard,
                {
                  backgroundColor: isDark ? colors.surfaceSubtle : '#F0FDF4',
                  borderColor: colors.success,
                },
              ]}
            >
              <Ionicons name="shield-checkmark-outline" size={40} color={colors.success} />
              <Text style={[styles.stateTitle, { color: colors.text }]}>You're up to date</Text>
              <Text style={[styles.stateBody, { color: colors.textMuted }]}>
                Thriving Skills is running the latest version (v{updateInfo.currentVersion}). OTA
                updates are active on channel "{updateInfo.channel}".
              </Text>
            </View>
          ) : (
            <View
              style={[
                styles.stateCard,
                {
                  backgroundColor: isDark ? colors.surfaceSubtle : '#F8FAFC',
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons name="sync-circle-outline" size={40} color={colors.primary} />
              <Text style={[styles.stateTitle, { color: colors.text }]}>Keep Your App Fresh</Text>
              <Text style={[styles.stateBody, { color: colors.textMuted }]}>
                Get new lessons, features, and fixes instantly via OTA updates or direct self-hosted
                server downloads.
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
              <Text style={[styles.btnText, { color: colors.onSuccess }]}>
                Apply Update & Restart
              </Text>
            </TouchableOpacity>
          ) : apkUpdateReady ? (
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.primary }]}
              onPress={handleDownloadApk}
              accessibilityRole="button"
              accessibilityLabel="Download APK update"
            >
              <Ionicons name="download-outline" size={18} color={colors.onPrimary} />
              <Text style={[styles.btnText, { color: colors.onPrimary }]}>
                Download Latest APK (v{latestVersion})
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.btn,
                { backgroundColor: colors.primary, opacity: isChecking ? 0.75 : 1 },
              ]}
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
                  <Text style={[styles.btnText, { color: colors.onPrimary }]}>
                    Check for Updates
                  </Text>
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
    borderTopLeftRadius: shape.large,
    borderTopRightRadius: shape.large,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: shape.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...typography.h3,
  },
  subtitle: {
    ...typography.caption,
    marginTop: 2,
  },
  closeBtn: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: shape.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: shape.medium,
    borderWidth: 1,
  },
  channelBadgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  channelBadgeText: {
    fontSize: 11,
  },
  stateCard: {
    borderRadius: shape.medium,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  stateTitle: {
    ...typography.h4,
    textAlign: 'center',
  },
  stateBody: {
    ...typography.body,
    textAlign: 'center',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: shape.medium,
    minHeight: MIN_TOUCH_TARGET,
    gap: 8,
  },
  btnText: {
    ...typography.button,
  },
  hint: {
    ...typography.caption,
    textAlign: 'center',
  },
});
