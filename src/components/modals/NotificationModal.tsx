import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
  ActivityIndicator,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
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
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    syncSiteNotifications,
    isSyncingSite,
  } = useSaaS();
  const { showToast } = useFeedback();
  const [filterType, setFilterType] = useState<string>('all');

  const filtered = notifications.filter((n) => {
    if (filterType === 'all') return true;
    if (filterType === 'offers') return n.type === 'offer';
    if (filterType === 'courses') return n.type === 'course';
    if (filterType === 'recommendations') return n.type === 'recommendation';
    if (filterType === 'updates') return n.type === 'update';
    if (filterType === 'campus') return n.type === 'workshop' || n.type === 'assignment' || n.type === 'certificate';
    return n.type === filterType;
  });

  const getIconForType = (type: SaaSNotification['type']) => {
    switch (type) {
      case 'offer':
        return { name: 'flame', color: '#DC2626', bg: '#FEE2E2' };
      case 'course':
        return { name: 'school', color: '#4F46E5', bg: '#EEF2FF' };
      case 'recommendation':
        return { name: 'sparkles', color: '#D97706', bg: '#FEF3C7' };
      case 'update':
        return { name: 'megaphone', color: '#16A34A', bg: '#DCFCE7' };
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
    const targetCourseId = notif.data?.courseId || notif.actionRoute?.courseId;

    if (targetCourseId && onNavigateToTab) {
      onClose();
      onNavigateToTab('Courses', targetCourseId);
    } else if (notif.data?.postUrl) {
      Linking.openURL(notif.data.postUrl).catch(() => {});
    } else if (notif.actionRoute && onNavigateToTab) {
      onClose();
      onNavigateToTab(notif.actionRoute.tab, notif.actionRoute.courseId);
    }
  };

  const handleSyncWithSite = async () => {
    triggerHaptic('light');
    try {
      const result = await syncSiteNotifications(true);
      const parts: string[] = [];
      if (result.newOffersCount > 0) parts.push(`${result.newOffersCount} offers`);
      if (result.newCoursesCount > 0) parts.push(`${result.newCoursesCount} courses`);
      if (result.newPostsCount > 0) parts.push(`${result.newPostsCount} updates`);

      const summary = parts.length > 0 ? parts.join(', ') : 'Catalog up to date';
      showToast({ message: `Synced with thrivingskill.com (${summary})`, type: 'success' });
    } catch {
      showToast({ message: 'Live site sync temporarily unavailable', type: 'error' });
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: colors.surfaceCard,
              borderColor: colors.border,
              paddingBottom: Math.max(insets.bottom, 20) + 12,
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="notifications" size={20} color={colors.primary} style={{ flexShrink: 0 }} />
              <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                Notifications & Offers
              </Text>
            </View>

            <View style={styles.headerRight}>
              <TouchableOpacity
                onPress={handleSyncWithSite}
                disabled={isSyncingSite}
                style={[styles.syncBtn, { backgroundColor: colors.surfaceSubtle }]}
                accessibilityRole="button"
                accessibilityLabel="Sync notifications from live website"
              >
                {isSyncingSite ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Ionicons name="sync" size={16} color={colors.primary} />
                )}
              </TouchableOpacity>

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
                <Text style={[styles.markAllText, { color: colors.primary }]}>Mark read</Text>
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

          {/* Filter Pills Horizontal Scroll */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
            accessibilityRole="tablist"
          >
            {[
              { id: 'all', label: 'All' },
              { id: 'offers', label: '🔥 Offers' },
              { id: 'courses', label: '🎓 Courses' },
              { id: 'recommendations', label: '✨ For You' },
              { id: 'updates', label: '📢 Insights' },
              { id: 'campus', label: '📅 Sessions' },
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
          </ScrollView>

          {/* Notifications List */}
          <ScrollView contentContainerStyle={styles.listContent}>
            {filtered.length === 0 ? (
              <StateView
                mode="empty"
                icon="notifications-off-outline"
                title="No updates in this category"
                message="You're all caught up on courses, promotional offers, and platform insights."
                compact
              />
            ) : (
              filtered.map((item) => {
                const icon = getIconForType(item.type);
                const discount = item.data?.discountPercent;
                const salePrice = item.data?.salePrice || item.data?.priceBdt;
                const thumbnail = item.data?.thumbnail;

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
                    accessibilityRole="button"
                    accessibilityLabel={`${item.title}, ${item.isRead ? 'read' : 'unread'}`}
                  >
                    {thumbnail ? (
                      <Image source={{ uri: thumbnail }} style={styles.thumbnail} resizeMode="cover" />
                    ) : (
                      <View style={[styles.iconBg, { backgroundColor: icon.bg }]}>
                        <Ionicons name={icon.name as any} size={18} color={icon.color} />
                      </View>
                    )}

                    <View style={styles.contentCol}>
                      <View style={styles.notifTopRow}>
                        <Text
                          style={[
                            styles.notifTitle,
                            { color: colors.text, fontWeight: item.isRead ? '600' : '800' },
                          ]}
                          numberOfLines={1}
                        >
                          {item.title}
                        </Text>
                        <Text style={[styles.timestamp, { color: colors.textLight }]}>
                          {item.timestamp}
                        </Text>
                      </View>

                      <Text style={[styles.message, { color: colors.textMuted }]} numberOfLines={2}>
                        {item.message}
                      </Text>

                      {discount ? (
                        <View style={styles.discountRow}>
                          <View style={styles.discountBadge}>
                            <Text style={styles.discountBadgeText}>-{discount}% OFF</Text>
                          </View>
                          {salePrice ? (
                            <Text style={[styles.salePriceText, { color: colors.primary }]}>
                              ৳{salePrice}
                            </Text>
                          ) : null}
                        </View>
                      ) : null}
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
    maxHeight: '82%',
    borderTopLeftRadius: shape.extraLarge,
    borderTopRightRadius: shape.extraLarge,
    borderWidth: 1,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 8,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    ...typography.h3,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  syncBtn: {
    width: 36,
    height: 36,
    borderRadius: shape.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markAllBtn: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    paddingHorizontal: 8,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterPill: {
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: shape.small,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 10,
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentCol: {
    flex: 1,
    minWidth: 0,
  },
  notifTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
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
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  discountBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  discountBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  salePriceText: {
    fontSize: 12,
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    alignSelf: 'center',
  },
});
