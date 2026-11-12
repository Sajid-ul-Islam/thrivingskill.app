import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNetwork } from '../../context/NetworkContext';
import { shape } from '../../theme/shapes';
import { typography, MIN_TOUCH_TARGET } from '../../theme/typography';

interface OfflineBannerProps {
  onRetry?: () => Promise<void> | void;
  onOpenOfflineContent?: () => void;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  onRetry,
  onOpenOfflineContent,
}) => {
  const { colors, isDark } = useTheme();
  const { isBangla } = useLanguage();
  const { isOffline, isChecking, retryConnection } = useNetwork();

  if (!isOffline) return null;

  const bgColor = isDark ? '#451A03' : '#FEF3C7';
  const borderColor = isDark ? '#D97706' : '#F59E0B';
  const textColor = isDark ? '#FEF3C7' : '#78350F';
  const actionBg = isDark ? '#FFB606' : '#102F53';
  const actionTextColor = isDark ? '#102F53' : '#FFFFFF';

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
        <Ionicons name="cloud-offline-outline" size={18} color={textColor} />
        <View style={styles.textWrap}>
          <Text style={[typography.h6, { color: textColor }]} numberOfLines={1}>
            {isBangla ? 'অফলাইন মোড — সংযোগ বিচ্ছিন্ন' : 'Offline Mode — Limited Connectivity'}
          </Text>
          <Text style={[typography.caption, { color: textColor }]} numberOfLines={1}>
            {isBangla
              ? 'ক্যাশ করা কোর্স ও ডাউনলোডকৃত লেসন দেখুন'
              : 'Showing cached courses & saved lessons'}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        {onOpenOfflineContent ? (
          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: textColor }]}
            onPress={onOpenOfflineContent}
            accessibilityRole="button"
            accessibilityLabel={isBangla ? 'সেভ করা লেসন দেখুন' : 'View Saved'}
          >
            <Text style={[typography.h6, { color: textColor }]}>
              {isBangla ? 'সেভড' : 'Saved'}
            </Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={[styles.retryBtn, { backgroundColor: actionBg }]}
          onPress={() => retryConnection(onRetry)}
          disabled={isChecking}
          accessibilityRole="button"
          accessibilityLabel={isBangla ? 'পুনরায় চেষ্টা করুন' : 'Retry connection'}
        >
          {isChecking ? (
            <ActivityIndicator size="small" color={actionTextColor} />
          ) : (
            <>
              <Ionicons name="refresh" size={14} color={actionTextColor} />
              <Text style={[typography.h6, { color: actionTextColor }]}>
                {isBangla ? 'রিট্রাই' : 'Retry'}
              </Text>
            </>
          )}
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
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderBottomWidth: 1,
    gap: 8,
  },
  leftCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: 10,
    borderRadius: shape.small,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryBtn: {
    minHeight: MIN_TOUCH_TARGET,
    minWidth: MIN_TOUCH_TARGET,
    paddingHorizontal: 12,
    borderRadius: shape.small,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
});
