import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useSaaS } from '../../context/SaaSContext';
import { useLearning } from '../../context/LearningContext';
import { OfflineBanner } from './OfflineBanner';
import { typography, MIN_TOUCH_TARGET } from '../../theme/typography';
import { shape } from '../../theme/shapes';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  showThemeToggle?: boolean;
  rightAction?: React.ReactNode;
  onOpenSubscription?: () => void;
  onOpenNotifications?: () => void;
  onOpenYouTube?: () => void;
  onOpenSearch?: () => void;
  onOpenUpdate?: () => void;
  onOpenDrawer?: () => void;
  onOpenOfflineContent?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBack,
  onBack,
  rightAction,
  onOpenNotifications,
  onOpenSearch,
  onOpenOfflineContent,
}) => {
  const { colors } = useTheme();
  const { unreadNotificationsCount } = useSaaS();
  const { refreshCourses } = useLearning();
  const insets = useSafeAreaInsets();

  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) : 0
  );

  const backIconName = Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back';

  return (
    <View style={{ backgroundColor: colors.surface }}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
            paddingTop: topInset + 6,
          },
        ]}
      >
        {/* Left Area: Back Button + Screen Title OR Clean Brand Logo */}
        <View style={styles.leftRow}>
          {showBack ? (
            <View style={styles.backGroup}>
              <TouchableOpacity
                style={[styles.iconButton, { backgroundColor: colors.surfaceSubtle }]}
                onPress={onBack}
                activeOpacity={0.7}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Ionicons name={backIconName} size={22} color={colors.text} />
              </TouchableOpacity>

              <View style={styles.titleContainer}>
                <Text style={[typography.h4, styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                  {title || 'Thriving Skills'}
                </Text>
                {subtitle && (
                  <Text style={[typography.caption, styles.headerSubtitle, { color: colors.textMuted }]} numberOfLines={1}>
                    {subtitle}
                  </Text>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.brandRow}>
              <Image
                source={require('../../../assets/icon.png')}
                style={styles.brandAppIcon}
                resizeMode="contain"
              />

              <View style={styles.brandTitleCol}>
                <Text style={[typography.h3, styles.brandTitle, { color: colors.text }]}>
                  Thriving<Text style={{ color: colors.primary }}>Skills</Text>
                </Text>
                {title && title !== 'Thriving Skills' ? (
                  <Text style={[typography.caption, { color: colors.textMuted }]} numberOfLines={1}>
                    {title}
                  </Text>
                ) : null}
              </View>
            </View>
          )}
        </View>

        {/* Right Area: Minimal, Uncluttered 1-2 Actions Max (44x44 touch targets) */}
        <View style={styles.rightRow}>
          {rightAction}

          {onOpenSearch && (
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: colors.surfaceSubtle }]}
              onPress={onOpenSearch}
              activeOpacity={0.7}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              accessibilityRole="button"
              accessibilityLabel="Universal Search"
            >
              <Ionicons name="search" size={20} color={colors.text} />
            </TouchableOpacity>
          )}

          {onOpenNotifications && (
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: colors.surfaceSubtle }]}
              onPress={onOpenNotifications}
              activeOpacity={0.7}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              accessibilityRole="button"
              accessibilityLabel="Notifications"
            >
              <Ionicons name="notifications-outline" size={20} color={colors.text} />
              {unreadNotificationsCount > 0 && (
                <View style={[styles.notifBadge, { backgroundColor: colors.danger }]}>
                  <Text style={[styles.notifBadgeText, { color: colors.onDanger }]}>{unreadNotificationsCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      <OfflineBanner
        onRetry={refreshCourses}
        onOpenOfflineContent={onOpenOfflineContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  brandAppIcon: {
    width: 36,
    height: 36,
    borderRadius: shape.small,
  },
  brandTitleCol: {
    justifyContent: 'center',
    flex: 1,
    minWidth: 0,
  },
  brandTitle: {
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  backGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
    minWidth: 0,
  },
  titleContainer: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontWeight: '700',
  },
  headerSubtitle: {
    marginTop: 1,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  iconButton: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: shape.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    zIndex: 10,
    elevation: 3,
    minWidth: 16,
    height: 16,
    borderRadius: shape.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notifBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    lineHeight: 11,
    includeFontPadding: false,
    fontWeight: '800',
  },
});
