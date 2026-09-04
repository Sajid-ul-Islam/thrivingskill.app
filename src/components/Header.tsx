import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSaaS } from '../context/SaaSContext';
import { useLanguage } from '../context/LanguageContext';

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
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBack,
  onBack,
  rightAction,
  onOpenSubscription,
  onOpenNotifications,
  onOpenSearch,
}) => {
  const { colors, toggleTheme, isDark } = useTheme();
  const { language, toggleLanguage } = useLanguage();
  const {
    subscriptionTier,
    activeWorkspace,
    workspaces,
    switchWorkspace,
    unreadNotificationsCount,
  } = useSaaS();

  const [quickMenuVisible, setQuickMenuVisible] = useState(false);

  const getPlanBadgeConfig = () => {
    switch (subscriptionTier) {
      case 'enterprise':
        return { label: 'ENTERPRISE', bg: colors.secondaryLight, text: colors.secondary, icon: 'business' };
      case 'pro':
        return { label: 'PRO', bg: colors.primaryLight, text: colors.primary, icon: 'sparkles' };
      default:
        return { label: 'STARTER', bg: colors.surfaceSubtle, text: colors.textMuted, icon: 'flash' };
    }
  };

  const planBadge = getPlanBadgeConfig();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      {/* Left Area: Back Button or Brand Logo */}
      <View style={styles.leftRow}>
        {showBack ? (
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.surfaceSubtle }]}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.brandRow}>
            {/* Logo Mark */}
            <View style={[styles.brandLogoCircle, { backgroundColor: colors.primary }]}>
              <Ionicons name="school" size={15} color="#FFFFFF" />
            </View>

            {/* Brand Typography */}
            <View style={styles.brandTitleCol}>
              <Text style={[styles.brandTitle, { color: colors.text }]}>
                Thriving<Text style={{ color: colors.primary }}>Skills</Text>
              </Text>
            </View>

            {/* Clean Combined Workspace/Tier Chip */}
            <TouchableOpacity
              style={[
                styles.compactTierPill,
                {
                  backgroundColor:
                    activeWorkspace.type === 'enterprise' ? colors.secondaryLight : colors.primaryLight,
                },
              ]}
              onPress={() => setQuickMenuVisible(true)}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.compactTierText,
                  { color: activeWorkspace.type === 'enterprise' ? colors.secondary : colors.primary },
                ]}
              >
                {activeWorkspace.type === 'enterprise' ? 'Enterprise' : planBadge.label}
              </Text>
              <Ionicons
                name="chevron-down"
                size={10}
                color={activeWorkspace.type === 'enterprise' ? colors.secondary : colors.primary}
              />
            </TouchableOpacity>
          </View>
        )}

        {title && showBack && (
          <View style={styles.titleContainer}>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
              {title}
            </Text>
            {subtitle && (
              <Text style={[styles.headerSubtitle, { color: colors.textMuted }]} numberOfLines={1}>
                {subtitle}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Right Area: Minimal, Uncluttered 2-3 Actions Only */}
      <View style={styles.rightRow}>
        {rightAction}

        {/* Universal Search */}
        {onOpenSearch && (
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.surfaceSubtle }]}
            onPress={onOpenSearch}
            activeOpacity={0.7}
            accessibilityLabel="Universal Search"
          >
            <Ionicons name="search" size={18} color={colors.text} />
          </TouchableOpacity>
        )}

        {/* Notifications */}
        {onOpenNotifications && (
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.surfaceSubtle }]}
            onPress={onOpenNotifications}
            activeOpacity={0.7}
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

        {/* Quick Menu (Theme, Language, Workspace in one clean popup) */}
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: colors.surfaceSubtle }]}
          onPress={() => setQuickMenuVisible(true)}
          activeOpacity={0.7}
          accessibilityLabel="Quick Menu & Preferences"
        >
          <Ionicons name="ellipsis-vertical" size={17} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Clean Quick Sheet (Replaces noisy top bar buttons) */}
      <Modal
        visible={quickMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setQuickMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setQuickMenuVisible(false)}
        >
          <View
            style={[
              styles.menuCard,
              { backgroundColor: colors.surfaceCard, borderColor: colors.border },
            ]}
          >
            <View style={styles.menuHeader}>
              <Text style={[styles.menuHeading, { color: colors.textMuted }]}>
                PREFERENCES & WORKSPACE
              </Text>
              <TouchableOpacity onPress={() => setQuickMenuVisible(false)}>
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Language & Theme Controls Row */}
            <View style={[styles.quickControlsBox, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
              {/* Language Switch */}
              <TouchableOpacity
                style={styles.quickControlItem}
                onPress={() => {
                  toggleLanguage();
                }}
              >
                <Ionicons name="language-outline" size={18} color={colors.primary} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.quickControlLabel, { color: colors.text }]}>Language</Text>
                  <Text style={[styles.quickControlSub, { color: colors.textMuted }]}>
                    {language === 'en' ? 'English (EN)' : 'বাংলা (BN)'}
                  </Text>
                </View>
                <View style={[styles.pillTag, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.pillTagText, { color: colors.primary }]}>
                    Switch to {language === 'en' ? 'বাংলা' : 'EN'}
                  </Text>
                </View>
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {/* Theme Toggle */}
              <View style={styles.quickControlItem}>
                <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color={colors.secondary} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.quickControlLabel, { color: colors.text }]}>Dark Mode</Text>
                  <Text style={[styles.quickControlSub, { color: colors.textMuted }]}>
                    {isDark ? 'Dark theme active' : 'Light theme active'}
                  </Text>
                </View>
                <Switch
                  value={isDark}
                  onValueChange={toggleTheme}
                  trackColor={{ false: '#CBD5E1', true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            {/* Workspaces Section */}
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted, marginTop: 14 }]}>
              SELECT WORKSPACE
            </Text>

            {workspaces.map((ws) => {
              const isSelected = activeWorkspace.id === ws.id;
              return (
                <TouchableOpacity
                  key={ws.id}
                  style={[
                    styles.workspaceItem,
                    isSelected && { backgroundColor: colors.surfaceSubtle },
                  ]}
                  onPress={() => {
                    switchWorkspace(ws.id);
                    setQuickMenuVisible(false);
                  }}
                >
                  <View
                    style={[
                      styles.wsIconCircle,
                      {
                        backgroundColor:
                          ws.type === 'enterprise' ? colors.secondaryLight : colors.primaryLight,
                      },
                    ]}
                  >
                    <Ionicons
                      name={ws.type === 'enterprise' ? 'business' : 'person'}
                      size={16}
                      color={ws.type === 'enterprise' ? colors.secondary : colors.primary}
                    />
                  </View>

                  <View style={styles.wsInfo}>
                    <Text style={[styles.wsName, { color: colors.text }]}>{ws.name}</Text>
                    <Text style={[styles.wsSub, { color: colors.textMuted }]}>
                      {ws.type === 'enterprise'
                        ? `Enterprise Hub • ${ws.activeSeats}/${ws.totalSeats} Seats`
                        : 'Personal Learner Workspace'}
                    </Text>
                  </View>

                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                  )}
                </TouchableOpacity>
              );
            })}

            {/* Subscription CTA */}
            {onOpenSubscription && (
              <TouchableOpacity
                style={[styles.subscriptionBtn, { backgroundColor: colors.primary }]}
                onPress={() => {
                  setQuickMenuVisible(false);
                  onOpenSubscription();
                }}
              >
                <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                <Text style={styles.subscriptionBtnText}>Manage Subscription & Plan</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandLogoCircle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitleCol: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  compactTierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 2,
  },
  compactTierText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  titleContainer: {
    marginLeft: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
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
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notifBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  // Modal Quick Menu
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-start',
    paddingTop: 70,
    paddingHorizontal: 16,
  },
  menuCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  menuHeading: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  quickControlsBox: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  quickControlItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  quickControlLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  quickControlSub: {
    fontSize: 11,
    marginTop: 1,
  },
  pillTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  pillTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 14,
  },
  sectionSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  workspaceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    marginBottom: 4,
  },
  wsIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wsInfo: {
    flex: 1,
    marginLeft: 10,
  },
  wsName: {
    fontSize: 13,
    fontWeight: '700',
  },
  wsSub: {
    fontSize: 11,
    marginTop: 1,
  },
  subscriptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: 12,
    marginTop: 12,
  },
  subscriptionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
