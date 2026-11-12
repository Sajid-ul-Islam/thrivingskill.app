import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useSaaS } from '../../context/SaaSContext';
import { useFeedback } from '../../context/FeedbackContext';
import { StateView } from '../common';
import { triggerHaptic } from '../../utils/haptics';
import { typography, MIN_TOUCH_TARGET } from '../../theme/typography';
import { shape } from '../../theme/shapes';
import { SaaSNotification } from '../../types';

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
  onNavigateToTab?: (tab: any, courseId?: string) => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  visible,
  onClose,
  onNavigateToTab,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { notifications, markNotificationRead, markAllNotificationsRead } = useSaaS();
  const { showToast } = useFeedback();
  const [filterType, setFilterType] = useState<string>('all');

  const filtered = notifications.filter(
    (n) => filterType === 'all' || n.type === filterType
  );

  const getIconForType = (type: SaaSNotification['type']) => {
    switch (type) {
      case 'assignment':
        return { name: 'calendar', color: '#6366F1', bg: '#EEF2FF' };
      case 'workshop':
        return { name: 'videocam', color: '#059669', bg: '#D1FAE5' };
      case 'certificate':
        return { name: 'ribbon', color: '#F59E0B', bg: '#FEF3C7' };
      case 'ai':
        return { name: 'sparkles', color: '#8B5CF6', bg: '#F3E8FF' };
      default:
        return { name: 'notifications', color: '#64748B', bg: '#F1F5F9' };
    }
  };

  const handleNotificationPress = (notif: SaaSNotification) => {
    markNotificationRead(notif.id);
    if (notif.actionRoute && onNavigateToTab) {
      onClose();
      onNavigateToTab(notif.actionRoute.tab, notif.actionRoute.courseId);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.surfaceCard, borderColor: colors.border, paddingBottom: Math.max(insets.bottom, 20) + 12 },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="notifications" size={20} color={colors.primary} />
              <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
            </View>

            <View style={styles.headerRight}>
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('selection');
                  markAllNotificationsRead();
                  showToast({ message: 'All notifications marked as read', type: 'info' });
                }}
                style={styles.markAllBtn}
                accessibilityRole="button"
                accessibilityLabel="Mark all notifications as read"
              >
                <Text style={[styles.markAllText, { color: colors.primary }]}>Mark all read</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('light');
                  onClose();
                }}
                style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]}
                accessibilityRole="button"
                accessibilityLabel="Close notifications"
              >
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Filter Pills (Hick's Law: 4 tabs) */}
          <View style={styles.filterRow} accessibilityRole="tablist">
            {[
              { id: 'all', label: 'All' },
              { id: 'assignment', label: 'Assignments' },
              { id: 'workshop', label: 'Live Sessions' },
              { id: 'certificate', label: 'Credentials' },
            ].map((f) => (
              <TouchableOpacity
                key={f.id}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor:
                      filterType === f.id ? colors.primary : colors.surfaceSubtle,
                    borderColor: filterType === f.id ? colors.primary : colors.border,
                  },
                ]}
                accessibilityRole="tab"
                accessibilityState={{ selected: filterType === f.id }}
                accessibilityLabel={`Filter by ${f.label}`}
                onPress={() => {
                  triggerHaptic('selection');
                  setFilterType(f.id);
                }}
              >
                <Text
                  style={[
                    styles.filterText,
                    { color: filterType === f.id ? colors.onPrimary : colors.textMuted },
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Notifications List */}
          <ScrollView contentContainerStyle={styles.listContent}>
            {filtered.length === 0 ? (
              <StateView
                mode="empty"
                icon="notifications-off-outline"
                title="No notifications in this category"
                message="You're all caught up on learning updates and credentials."
                compact
              />
            ) : (
              filtered.map((item) => {
                const icon = getIconForType(item.type);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.notifItem,
                      {
                        backgroundColor: item.isRead ? colors.surfaceCard : colors.surfaceSubtle,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => handleNotificationPress(item)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.iconBg, { backgroundColor: icon.bg }]}>
                      <Ionicons name={icon.name as any} size={18} color={icon.color} />
                    </View>

                    <View style={styles.contentCol}>
                      <View style={styles.notifTopRow}>
                        <Text
                          style={[
                            styles.notifTitle,
                            { color: colors.text, fontWeight: item.isRead ? '600' : '800' },
                          ]}
                        >
                          {item.title}
                        </Text>
                        <Text style={[styles.timestamp, { color: colors.textLight }]}>
                          {item.timestamp}
                        </Text>
                      </View>

                      <Text style={[styles.message, { color: colors.textMuted }]}>
                        {item.message}
                      </Text>
                    </View>

                    {!item.isRead && (
                      <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    maxHeight: '80%',
    borderTopLeftRadius: shape.extraLarge,
    borderTopRightRadius: shape.extraLarge,
    borderWidth: 1,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    ...typography.h3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  markAllBtn: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  markAllText: {
    ...typography.caption,
    fontWeight: '700',
  },
  closeBtn: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: shape.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterPill: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: shape.small,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 10,
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  iconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentCol: {
    flex: 1,
  },
  notifTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 13,
    flex: 1,
    marginRight: 6,
  },
  timestamp: {
    fontSize: 11,
  },
  message: {
    fontSize: 12,
    lineHeight: 16,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    alignSelf: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
  },
});
