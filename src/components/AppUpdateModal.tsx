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
import { useTheme } from '../context/ThemeContext';
import { AppUpdateService } from '../services/appUpdateService';

interface AppUpdateModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AppUpdateModal: React.FC<AppUpdateModalProps> = ({ visible, onClose }) => {
  const { colors, isDark } = useTheme();
  const [isChecking, setIsChecking] = useState(false);
  const [updateReady, setUpdateReady] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const info = AppUpdateService.getUpdateInfo();

  const handleCheck = async () => {
    setIsChecking(true);
    setStatusMessage(null);

    const result = await AppUpdateService.checkForUpdate();
    setIsChecking(false);
    setStatusMessage(result.message);

    if (result.isDownloaded) {
      setUpdateReady(true);
    }
  };

  const handleRestart = async () => {
    try {
      await AppUpdateService.reloadApp();
    } catch {
      Alert.alert('Restart Required', 'Please close and re-open the app to apply the update.');
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="cloud-download-outline" size={24} color={colors.primary} />
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
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
                    ? 'rgba(16, 185, 129, 0.1)'
                    : isDark
                    ? '#1E293B'
                    : '#EFF6FF',
                  borderColor: updateReady ? '#10B981' : colors.primary,
                },
              ]}
            >
              <Ionicons
                name={updateReady ? 'checkmark-circle' : 'information-circle'}
                size={16}
                color={updateReady ? '#10B981' : colors.primary}
              />
              <Text
                style={[
                  styles.messageText,
                  { color: updateReady ? '#10B981' : colors.text },
                ]}
              >
                {statusMessage}
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          {updateReady ? (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
              onPress={handleRestart}
            >
              <Ionicons name="refresh" size={18} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>Restart & Apply Update</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.primary }]}
              onPress={handleCheck}
              disabled={isChecking}
            >
              {isChecking ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="sync-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.actionBtnText}>Check for Updates</Text>
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
    borderRadius: 20,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(16, 47, 83, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 16,
  },
  infoBox: {
    borderRadius: 14,
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
