import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  Switch,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Env, ApiEnvironment } from '../../config/env';
import { CacheManager } from '../../services/cache/cacheManager';
import { triggerHaptic } from '../../utils/haptics';

export interface DeveloperOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  onDirectBypass?: () => void;
  onResetToStandardMode?: () => void;
}

export const DeveloperOptionsModal: React.FC<DeveloperOptionsModalProps> = ({
  visible,
  onClose,
  onDirectBypass,
  onResetToStandardMode,
}) => {
  const insets = useSafeAreaInsets();
  const [currentEnv, setCurrentEnv] = useState<ApiEnvironment>(Env.currentEnvironment);
  const [isClearingCache, setIsClearingCache] = useState<boolean>(false);
  const [cacheClearSuccess, setCacheClearSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (visible) {
      setCurrentEnv(Env.currentEnvironment);
    }
  }, [visible]);

  const handleSwitchEnv = async (env: ApiEnvironment) => {
    if (!Env.canSwitchEnvironment || env === currentEnv) return;
    triggerHaptic('medium');
    await Env.setEnvironment(env);
    setCurrentEnv(env);
  };

  const handleClearAppCache = async () => {
    triggerHaptic('warning');
    setIsClearingCache(true);
    setCacheClearSuccess(false);
    try {
      await CacheManager.clearAll();
      setCacheClearSuccess(true);
      triggerHaptic('success');
      setTimeout(() => setCacheClearSuccess(false), 3000);
    } catch {
      Alert.alert('Error', 'Failed to clear cache');
    } finally {
      setIsClearingCache(false);
    }
  };

  const handleReturnToStandardMode = async () => {
    triggerHaptic('success');
    try {
      // 1. Reset server environment to live production
      await Env.setEnvironment('production');
      setCurrentEnv('production');
      // 2. Disable admin bypass
      setAdminBypass(false);
      await Promise.all([
        AsyncStorage.setItem('@thrivingskill_admin_bypass', 'false'),
        AsyncStorage.setItem('@ts_auth_admin_bypass', 'false'),
        // 3. Lock and hide developer options
        AsyncStorage.setItem('@ts_dev_mode_unlocked', 'false'),
      ]);
      // 4. Clear cache to guarantee clean production state
      await CacheManager.clearAll().catch(() => {});
      // 5. Notify parent callback
      onResetToStandardMode?.();
      // 6. Dismiss modal
      onClose();
      Alert.alert(
        'Standard Mode Restored',
        'You have returned to normal mode. Connected to Live Production (thrivingskill.com) with developer options locked.'
      );
    } catch {
      onClose();
    }
  };

  const handleLockDevOptions = async () => {
    triggerHaptic('warning');
    await Env.setEnvironment('production');
    setCurrentEnv('production');
    await Promise.all([
      AsyncStorage.setItem('@thrivingskill_admin_bypass', 'false'),
      AsyncStorage.setItem('@ts_auth_admin_bypass', 'false'),
      AsyncStorage.setItem('@ts_dev_mode_unlocked', 'false'),
    ]);
    onResetToStandardMode?.();
    onClose();
  };

  const { width, height } = Dimensions.get('window');

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.sheetContainer,
            {
              paddingBottom: Math.max(insets.bottom, 16),
              paddingTop: 16,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.devBadge}>
                <Ionicons name="code-slash" size={18} color="#E34234" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Developer Options</Text>
                <Text style={styles.headerSubtitle}>Diagnostics & Testing Console</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Close developer options"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={20} color="#CBD5E1" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Standard Mode Card (Prominent Return to Normal Mode Action) */}
            <View style={styles.standardModeCard}>
              <View style={styles.standardModeHeader}>
                <View style={styles.standardModeBadge}>
                  <Ionicons name="shield-checkmark" size={18} color="#10B981" />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.standardModeTitle}>Standard / Normal Mode</Text>
                    <View style={styles.recommendedBadge}>
                      <Text style={styles.recommendedBadgeText}>NORMAL</Text>
                    </View>
                  </View>
                  <Text style={styles.standardModeDesc}>
                    Exit developer mode and return to standard user experience. Resets server to
                    Live Production (thrivingskill.com), disables test bypasses, and hides developer
                    console.
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.standardModeBtn}
                onPress={handleReturnToStandardMode}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Switch to Standard Mode"
              >
                <Ionicons name="arrow-undo-circle" size={18} color="#FFFFFF" />
                <Text style={styles.standardModeBtnText}>Switch to Standard Mode</Text>
              </TouchableOpacity>
            </View>

            {/* Section 1: Server Environment (Development builds only) */}
            {Env.canSwitchEnvironment && (
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="server-outline" size={16} color="#E34234" />
                  <Text style={styles.sectionTitle}>Server Environment</Text>
                </View>
                <Text style={styles.sectionDesc}>
                  Switch between live production WordPress and staging server.
                </Text>

                <View style={styles.envGrid}>
                  <TouchableOpacity
                    style={[
                      styles.envOption,
                      currentEnv === 'production' && styles.envOptionActive,
                    ]}
                    onPress={() => handleSwitchEnv('production')}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel="Switch to Live Production Environment"
                  >
                    <View style={styles.envOptionHeader}>
                      <Text
                        style={[
                          styles.envOptionTitle,
                          currentEnv === 'production' && styles.envOptionTitleActive,
                        ]}
                      >
                        Live Production
                      </Text>
                      {currentEnv === 'production' && (
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                      )}
                    </View>
                    <Text style={styles.envOptionUrl}>https://thrivingskill.com</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.envOption,
                      currentEnv === 'staging' && styles.envOptionActiveStaging,
                    ]}
                    onPress={() => handleSwitchEnv('staging')}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel="Switch to Staging Server Environment"
                  >
                    <View style={styles.envOptionHeader}>
                      <Text
                        style={[
                          styles.envOptionTitle,
                          currentEnv === 'staging' && styles.envOptionTitleActiveStaging,
                        ]}
                      >
                        Staging Testing
                      </Text>
                      {currentEnv === 'staging' && (
                        <Ionicons name="checkmark-circle" size={16} color="#E34234" />
                      )}
                    </View>
                    <Text style={styles.envOptionUrl}>https://staging.thrivingskill.com</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {onDirectBypass && (
              <View style={styles.sectionCard}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => {
                    triggerHaptic('medium');
                    onClose();
                    onDirectBypass();
                  }}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Bypass Splash to Main App"
                >
                  <Ionicons name="flash-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.actionBtnText}>Bypass Splash to Main App</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Section 3: Cache & Storage Management */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="trash-outline" size={16} color="#38BDF8" />
                <Text style={styles.sectionTitle}>Cache & Storage</Text>
              </View>

              <TouchableOpacity
                style={[styles.outlineBtn, cacheClearSuccess && styles.outlineBtnSuccess]}
                onPress={handleClearAppCache}
                disabled={isClearingCache}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Clear All Cached Data"
              >
                {isClearingCache ? (
                  <ActivityIndicator size="small" color="#38BDF8" />
                ) : (
                  <>
                    <Ionicons
                      name={cacheClearSuccess ? 'checkmark-circle' : 'refresh-outline'}
                      size={16}
                      color={cacheClearSuccess ? '#10B981' : '#38BDF8'}
                    />
                    <Text
                      style={[styles.outlineBtnText, cacheClearSuccess && { color: '#10B981' }]}
                    >
                      {cacheClearSuccess ? 'Cache Cleared Successfully!' : 'Clear All Cached Data'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Section 4: Device & Build Diagnostics */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="information-circle-outline" size={16} color="#CBD5E1" />
                <Text style={styles.sectionTitle}>Build & Device Info</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>App Version</Text>
                <Text style={styles.infoVal}>v1.4.0 (Build 10400)</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Platform / OS</Text>
                <Text style={styles.infoVal}>
                  {Platform.OS} {Platform.Version ? `(${Platform.Version})` : ''}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Screen Viewport</Text>
                <Text style={styles.infoVal}>
                  {Math.round(width)} × {Math.round(height)} dp
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Active API Host</Text>
                <Text
                  style={[
                    styles.infoVal,
                    { color: currentEnv === 'production' ? '#10B981' : '#E34234' },
                  ]}
                >
                  {Env.API_URL.replace(/^https?:\/\//, '')}
                </Text>
              </View>
            </View>

            {/* Lock Dev Options Button */}
            <TouchableOpacity
              style={styles.lockBtn}
              onPress={handleLockDevOptions}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Lock and Hide Developer Options"
            >
              <Ionicons name="lock-closed-outline" size={14} color="#94A3B8" />
              <Text style={styles.lockBtnText}>Lock & Hide Developer Options</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(7, 13, 24, 0.78)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#0F192C',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    borderWidth: 1,
    borderColor: '#22365A',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1B2B4A',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  devBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(227, 66, 52, 0.14)',
    borderWidth: 1,
    borderColor: '#E34234',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  standardModeCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#10B981',
    gap: 12,
  },
  standardModeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  standardModeBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  standardModeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  recommendedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recommendedBadgeText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  standardModeDesc: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 3,
    lineHeight: 16,
  },
  standardModeBtn: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  standardModeBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  sectionCard: {
    backgroundColor: '#14223B',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  sectionDesc: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 16,
  },
  envGrid: {
    gap: 8,
    marginTop: 2,
  },
  envOption: {
    backgroundColor: '#0F192C',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#22365A',
  },
  envOptionActive: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.10)',
  },
  envOptionActiveStaging: {
    borderColor: '#E34234',
    backgroundColor: 'rgba(227, 66, 52, 0.10)',
  },
  envOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  envOptionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  envOptionTitleActive: {
    color: '#10B981',
  },
  envOptionTitleActiveStaging: {
    color: '#E34234',
  },
  envOptionUrl: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  settingItemText: {
    flex: 1,
    paddingRight: 12,
  },
  settingItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  settingItemDesc: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    lineHeight: 15,
  },
  actionBtn: {
    backgroundColor: '#E34234',
    borderRadius: 12,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  outlineBtn: {
    borderWidth: 1,
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderRadius: 12,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  outlineBtnSuccess: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  outlineBtnText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoKey: {
    fontSize: 12,
    color: '#94A3B8',
  },
  infoVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  lockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  lockBtnText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
});
