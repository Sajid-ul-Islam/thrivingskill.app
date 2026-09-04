import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Switch,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSaaS } from '../context/SaaSContext';
import { useLanguage } from '../context/LanguageContext';
import { AppUpdateModal } from './AppUpdateModal';

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
  onOpenUpdate,
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
  const [updateModalVisible, setUpdateModalVisible] = useState(false);

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
      {/* Left Area: Back Button or App Brand Icon */}
      <View style={styles.leftRow}>
        {showBack ? (
          <View style={styles.backGroup}>
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: colors.surfaceSubtle }]}
              onPress={onBack}
              activeOpacity={0.7}
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={20} color={colors.text} />
            </TouchableOpacity>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.brandAppIconSmall}
              resizeMode="contain"
            />
          </View>
        ) : (
          <View style={styles.brandRow}>
            {/* App (Brand) Icon in Top Left Corner */}
            <Image
              source={require('../../assets/icon.png')}
              style={styles.brandAppIcon}
              resizeMode="contain"
            />

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

        {/* In-App OTA Update Checker */}
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: colors.surfaceSubtle }]}
          onPress={() => {
            if (onOpenUpdate) {
              onOpenUpdate();
            } else {
              setUpdateModalVisible(true);
            }
          }}
          activeOpacity={0.7}
          accessibilityLabel="Check for In-App Updates"
        >
          <Ionicons name="cloud-download-outline" size={18} color="#10B981" />
        </TouchableOpacity>

        {/* Quick Menu (Theme, Language, Workspace in one clean popup) */}
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: colors.surfaceSubtle }]}
          onPress={() => setQuickMenuVisible(true)}
          activeOpacity={0.7}
          accessibilityLabel="Quick Menu"
        >
          <Ionicons name="ellipsis-vertical" size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Quick Settings & Workspace Drawer Modal */}
      <Modal
        visible={quickMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setQuickMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setQuickMenuVisible(false)}
        >
          <View
            style={[
              styles.quickMenuCard,
              {
                backgroundColor: colors.surfaceCard,
                borderColor: colors.border,
                shadowColor: colors.text,
              },
            ]}
          >
            {/* Quick Header */}
            <View style={styles.quickHeader}>
              <View>
                <Text style={[styles.quickTitle, { color: colors.text }]}>Quick Preferences</Text>
                <Text style={[styles.quickSub, { color: colors.textMuted }]}>
                  {activeWorkspace.name}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setQuickMenuVisible(false)}>
                <Ionicons name="close" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* In-App OTA Updates Item */}
            <TouchableOpacity
              style={[styles.quickMenuItem, { borderBottomColor: colors.border }]}
              onPress={() => {
                setQuickMenuVisible(false);
                if (onOpenUpdate) {
                  onOpenUpdate();
                } else {
                  setUpdateModalVisible(true);
                }
              }}
            >
              <View style={[styles.menuIconBg, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <Ionicons name="cloud-download" size={16} color="#10B981" />
              </View>
              <View style={styles.menuItemTextCol}>
                <Text style={[styles.menuItemLabel, { color: colors.text }]}>Check for In-App Updates</Text>
                <Text style={[styles.menuItemSub, { color: colors.textMuted }]}>
                  OTA Update (no APK rebuild required)
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>

            {/* Language Toggle Row */}
            <TouchableOpacity
              style={[styles.quickMenuItem, { borderBottomColor: colors.border }]}
              onPress={() => {
                toggleLanguage();
              }}
            >
              <View style={[styles.menuIconBg, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="language" size={16} color={colors.primary} />
              </View>
              <View style={styles.menuItemTextCol}>
                <Text style={[styles.menuItemLabel, { color: colors.text }]}>App Language</Text>
                <Text style={[styles.menuItemSub, { color: colors.textMuted }]}>
                  {language === 'en' ? 'English (EN)' : 'বাংলা (BN)'}
                </Text>
              </View>
              <Ionicons name="swap-horizontal" size={16} color={colors.textMuted} />
            </TouchableOpacity>

            {/* Dark Mode Toggle Row */}
            <View style={[styles.quickMenuItem, { borderBottomColor: colors.border }]}>
              <View style={[styles.menuIconBg, { backgroundColor: colors.surfaceSubtle }]}>
                <Ionicons name={isDark ? 'moon' : 'sunny'} size={16} color={colors.text} />
              </View>
              <View style={styles.menuItemTextCol}>
                <Text style={[styles.menuItemLabel, { color: colors.text }]}>Appearance</Text>
                <Text style={[styles.menuItemSub, { color: colors.textMuted }]}>
                  {isDark ? 'Dark Theme' : 'Light Theme'}
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: '#CBD5E1', true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Workspace Switcher Header */}
            <Text style={[styles.wsSectionLabel, { color: colors.textMuted }]}>
              WORKSPACE CONTEXT
            </Text>

            {/* Workspace List */}
            {workspaces.map((ws) => {
              const isSelected = ws.id === activeWorkspace.id;
              return (
                <TouchableOpacity
                  key={ws.id}
                  style={[
                    styles.wsItem,
                    isSelected && [styles.wsItemActive, { backgroundColor: colors.surfaceSubtle }],
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
          </View>
        </TouchableOpacity>
      </Modal>

      {/* In-App OTA Update Modal */}
      <AppUpdateModal
        visible={updateModalVisible}
        onClose={() => setUpdateModalVisible(false)}
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
  brandAppIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  brandAppIconSmall: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },
  backGroup: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    paddingTop: 65,
    paddingHorizontal: 16,
  },
  quickMenuCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  quickHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  quickTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  quickSub: {
    fontSize: 11,
    marginTop: 1,
  },
  quickMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 10,
  },
  menuIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemTextCol: {
    flex: 1,
  },
  menuItemLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  menuItemSub: {
    fontSize: 11,
    marginTop: 1,
  },
  wsSectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginTop: 12,
    marginBottom: 6,
  },
  wsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 10,
    marginBottom: 4,
  },
  wsItemActive: {},
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
