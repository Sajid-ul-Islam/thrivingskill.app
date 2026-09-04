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
import { useTheme } from '../context/ThemeContext';
import { useSaaS } from '../context/SaaSContext';

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
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBack,
  onBack,
  rightAction,
  onOpenNotifications,
  onOpenSearch,
  onOpenDrawer,
}) => {
  const { colors } = useTheme();
  const { unreadNotificationsCount } = useSaaS();
  const insets = useSafeAreaInsets();

  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) : 0
  );

  return (
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
      {/* Left Area: Back Button + Screen Title OR Clean Official Brand Icon + Logo */}
      <View style={styles.leftRow}>
        {showBack ? (
          <View style={styles.backGroup}>
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: colors.surfaceSubtle }]}
              onPress={onBack}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={20} color={colors.text} />
            </TouchableOpacity>

            <View style={styles.titleContainer}>
              <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                {title || 'Thriving Skills'}
              </Text>
              {subtitle && (
                <Text style={[styles.headerSubtitle, { color: colors.textMuted }]} numberOfLines={1}>
                  {subtitle}
                </Text>
              )}
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.brandRow}
            onPress={onOpenDrawer}
            disabled={!onOpenDrawer}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Open brand drawer"
          >
            {/* App Brand Icon in Top Left Corner */}
            <Image
              source={require('../../assets/icon.png')}
              style={styles.brandAppIcon}
              resizeMode="contain"
            />

            {/* Clean Brand Typography without noisy pills */}
            <View style={styles.brandTitleCol}>
              <Text style={[styles.brandTitle, { color: colors.text }]}>
                Thriving<Text style={{ color: colors.primary }}>Skills</Text>
              </Text>
            </View>

            {onOpenDrawer && (
              <Ionicons name="menu-outline" size={17} color={colors.textMuted} style={{ marginLeft: 2 }} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Right Area: Minimal, Uncluttered 1-2 Actions Max */}
      <View style={styles.rightRow}>
        {rightAction}

        {/* Universal Search (only when onOpenSearch is passed) */}
        {onOpenSearch && (
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.surfaceSubtle }]}
            onPress={onOpenSearch}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Universal Search"
          >
            <Ionicons name="search" size={18} color={colors.text} />
          </TouchableOpacity>
        )}

        {/* Notifications (only when onOpenNotifications is passed) */}
        {onOpenNotifications && (
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.surfaceSubtle }]}
            onPress={onOpenNotifications}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={18} color={colors.text} />
            {unreadNotificationsCount > 0 && (
              <View style={[styles.notifBadge, { backgroundColor: colors.danger }]}>
                <Text style={styles.notifBadgeText}>{unreadNotificationsCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
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
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandAppIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
  },
  brandTitleCol: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  backGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  titleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notifBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
});
