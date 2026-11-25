import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNetwork } from '../../context/NetworkContext';
import { shape } from '../../theme/shapes';
import { typography, MIN_TOUCH_TARGET } from '../../theme/typography';
import { triggerHaptic } from '../../utils/haptics';

interface OfflineBannerProps {
  onRetry?: () => Promise<void> | void;
  onOpenOfflineContent?: () => void;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ onRetry, onOpenOfflineContent }) => {
  const { isDark } = useTheme();
  const { isBangla } = useLanguage();
  const { isOffline, isChecking, retryConnection, dismissOfflineBanner } = useNetwork();

  if (!isOffline) return null;

  // Strict Brand Tokens: #102F53 (Deep Royal Blue), #E34234 (Accent Red), #FFFFFF (Pure White)
  const bgColor = isDark ? '#1E293B' : '#F8FAFC';
  const borderColor = isDark ? '#334155' : '#E2E8F0';
  const titleColor = isDark ? '#FFFFFF' : '#102F53';
  const subtitleColor = isDark ? '#94A3B8' : '#64748B';
  const iconColor = '#E34234'; // Official Accent Red for network alert
  const actionBg = '#102F53'; // Official Deep Royal Blue
  const actionTextColor = '#FFFFFF';
  const closeColor = isDark ? '#94A3B8' : '#64748B';

  const handleRetry = async () => {
    triggerHaptic();
    const ok = await retryConnection(onRetry);
    if (ok) {
      triggerHaptic();
    }
  };

  const handleDismiss = () => {
    triggerHaptic();
    dismissOfflineBanner();
  };

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: bgColor,
          borderBottomColor: borderColor,
        },
      ]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <View style={styles.leftCol}>
        <Ionicons name="cloud-offline" size={20} color={iconColor} />
        <View style={styles.textWrap}>
          <Text style={[typography.h6, { color: titleColor, fontWeight: '700' }]} numberOfLines={1}>
            {isBangla ? 'অফলাইন মোড — সংযোগ বিচ্ছিন্ন' : 'Offline Mode — Limited Connectivity'}
          </Text>
          <Text style={[typography.caption, { color: subtitleColor }]} numberOfLines={1}>
            {isBangla
              ? 'ক্যাশ করা কোর্স ও ডাউনলোডকৃত লেসন দেখুন'
              : 'Showing cached courses & saved lessons'}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        {onOpenOfflineContent ? (
          <TouchableOpacity
            style={[
              styles.secondaryBtn,
              {
                borderColor: isDark ? '#475569' : '#CBD5E1',
                backgroundColor: isDark ? '#0F192C' : '#FFFFFF',
              },
            ]}
            onPress={onOpenOfflineContent}
            accessibilityRole="button"
            accessibilityLabel={isBangla ? 'সেভ করা লেসন দেখুন' : 'View Saved'}
          >
            <Text style={[typography.h6, { color: titleColor, fontSize: 12 }]}>
              {isBangla ? 'সেভড' : 'Saved'}
            </Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={[styles.retryBtn, { backgroundColor: actionBg }]}
          onPress={handleRetry}
          disabled={isChecking}
          accessibilityRole="button"
          accessibilityLabel={isBangla ? 'পুনরায় চেষ্টা করুন' : 'Retry connection'}
        >
          {isChecking ? (
            <ActivityIndicator size="small" color={actionTextColor} />
          ) : (
            <>
              <Ionicons name="refresh" size={14} color={actionTextColor} />
              <Text
                style={[typography.h6, { color: actionTextColor, fontSize: 13, fontWeight: '700' }]}
              >
                {isBangla ? 'রিট্রাই' : 'Retry'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.closeBtn}
          onPress={handleDismiss}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={isBangla ? 'ব্যানার বন্ধ করুন' : 'Dismiss banner'}
        >
          <Ionicons name="close" size={18} color={closeColor} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 8,
  },
  leftCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  secondaryBtn: {
    minHeight: 36,
    paddingHorizontal: 10,
    borderRadius: shape.small,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryBtn: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: shape.small,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  closeBtn: {
    minHeight: MIN_TOUCH_TARGET,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
});
