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
import { useTheme } from '../context/ThemeContext';
import { useSaaS } from '../context/SaaSContext';
import { SaaSNotification } from '../types';

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
  const { notifications, markNotificationRead, markAllNotificationsRead } = useSaaS();
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
            { backgroundColor: colors.surfaceCard, borderColor: colors.border },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="notifications" size={20} color={colors.primary} />
              <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
            </View>

            <View style={styles.headerRight}>
              <TouchableOpacity onPress={markAllNotificationsRead} style={styles.markAllBtn}>
                <Text style={[styles.markAllText, { color: colors.primary }]}>Mark all read</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Filter Pills */}
          <View style={styles.filterRow}>
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
                onPress={() => setFilterType(f.id)}
              >
                <Text
                  style={[
                    styles.filterText,
                    { color: filterType === f.id ? '#FFFFFF' : colors.textMuted },
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
              <View style={styles.emptyContainer}>
                <Ionicons name="notifications-off-outline" size={40} color={colors.textLight} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  No notifications in this category
                </Text>
              </View>
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  markAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
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
