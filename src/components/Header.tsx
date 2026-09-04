import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
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
  showThemeToggle = true,
  rightAction,
  onOpenSubscription,
  onOpenNotifications,
  onOpenYouTube,
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

  const [workspaceMenuVisible, setWorkspaceMenuVisible] = useState(false);

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
      <View style={styles.leftRow}>
        {showBack ? (
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.surfaceSubtle }]}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.brandRow}>
            {/* Workspace Selector Dropdown Pill */}
            <TouchableOpacity
              style={[
                styles.workspacePill,
                {
                  backgroundColor:
                    activeWorkspace.type === 'enterprise' ? colors.secondaryLight : colors.surfaceSubtle,
                  borderColor:
                    activeWorkspace.type === 'enterprise' ? colors.secondary : colors.border,
                },
              ]}
              onPress={() => setWorkspaceMenuVisible(true)}
              activeOpacity={0.75}
            >
              <Ionicons
                name={activeWorkspace.type === 'enterprise' ? 'business' : 'person-circle'}
                size={16}
                color={activeWorkspace.type === 'enterprise' ? colors.secondary : colors.primary}
              />
              <Text
                style={[
                  styles.workspaceText,
                  { color: activeWorkspace.type === 'enterprise' ? colors.secondary : colors.text },
                ]}
                numberOfLines={1}
              >
                {activeWorkspace.type === 'enterprise' ? 'Apex Corp' : 'Personal'}
              </Text>
              <Ionicons name="chevron-down" size={12} color={colors.textMuted} />
            </TouchableOpacity>

            {/* Plan Badge */}
            {onOpenSubscription && (
              <TouchableOpacity
                style={[styles.planBadge, { backgroundColor: planBadge.bg }]}
                onPress={onOpenSubscription}
                activeOpacity={0.8}
              >
                <Ionicons name={planBadge.icon as any} size={10} color={planBadge.text} />
                <Text style={[styles.planBadgeText, { color: planBadge.text }]}>{planBadge.label}</Text>
              </TouchableOpacity>
            )}
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

      <View style={styles.rightRow}>
        {rightAction}

        {/* Universal Search Button */}
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

        {/* YouTube Channel Button */}
        {onOpenYouTube && (
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: 'rgba(255, 0, 0, 0.08)' }]}
            onPress={onOpenYouTube}
            activeOpacity={0.7}
            accessibilityLabel="YouTube Channel Videos"
          >
            <Ionicons name="logo-youtube" size={18} color="#FF0000" />
          </TouchableOpacity>
        )}

        {/* Notifications Bell with Unread Badge */}
        {onOpenNotifications && (
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.surfaceSubtle }]}
            onPress={onOpenNotifications}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={18} color={colors.text} />
            {unreadNotificationsCount > 0 && (
              <View style={[styles.notifBadge, { backgroundColor: colors.danger }]}>
                <Text style={styles.notifBadgeText}>{unreadNotificationsCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* Language Switcher */}
        <TouchableOpacity
          style={[styles.langButton, { backgroundColor: colors.primaryLight }]}
          onPress={toggleLanguage}
          activeOpacity={0.7}
        >
          <Text style={[styles.langButtonText, { color: colors.primary }]}>
            {language === 'en' ? 'বাংলা' : 'EN'}
          </Text>
        </TouchableOpacity>

        {/* Theme Toggle */}
        {showThemeToggle && (
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.surfaceSubtle }]}
            onPress={toggleTheme}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isDark ? 'sunny' : 'moon'}
              size={18}
              color={isDark ? colors.accent : colors.text}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Workspace Switcher Modal Menu */}
      <Modal
        visible={workspaceMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setWorkspaceMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.workspaceMenuOverlay}
          activeOpacity={1}
          onPress={() => setWorkspaceMenuVisible(false)}
        >
          <View
            style={[
              styles.workspaceMenuCard,
              { backgroundColor: colors.surfaceCard, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.workspaceMenuHeading, { color: colors.textMuted }]}>
              SWITCH WORKSPACE
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
                    setWorkspaceMenuVisible(false);
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
  workspacePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  workspaceText: {
    fontSize: 12,
    fontWeight: '700',
    maxWidth: 110,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  planBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  titleContainer: {
    marginLeft: 12,
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
    position: 'relative',
  },
  langButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langButtonText: {
    fontSize: 11,
    fontWeight: '800',
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
    fontSize: 8,
    fontWeight: '900',
  },
  workspaceMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  workspaceMenuCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  workspaceMenuHeading: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  workspaceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    gap: 10,
  },
  wsIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wsInfo: {
    flex: 1,
  },
  wsName: {
    fontSize: 13,
    fontWeight: '700',
  },
  wsSub: {
    fontSize: 11,
    marginTop: 1,
  },
});
