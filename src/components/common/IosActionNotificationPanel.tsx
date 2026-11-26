import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Image,
  Platform,
  PanResponder,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import {
  PushNotificationService,
  InAppNotification,
} from '../../services/notifications/pushNotificationService';
import { triggerHaptic } from '../../utils/haptics';
import { MIN_TOUCH_TARGET } from '../../theme/typography';
import { getSafeImageSource } from '../../utils/imageUtils';

interface IosActionNotificationPanelProps {
  onNavigateToCourse?: (courseId: string) => void;
  onBookmarkCourse?: (courseId: string) => void;
  onOpenNotifications?: () => void;
}

export const IosActionNotificationPanel: React.FC<IosActionNotificationPanelProps> = ({
  onNavigateToCourse,
  onBookmarkCourse,
  onOpenNotifications,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [activeNotification, setActiveNotification] = useState<InAppNotification | null>(null);
  const [thumbError, setThumbError] = useState(false);

  const translateY = useRef(new Animated.Value(-240)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const autoDismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Subscribe to live notifications dispatched by site sync or app services
  useEffect(() => {
    const unsubscribe = PushNotificationService.subscribe((notif) => {
      // Clear any pending dismissal
      if (autoDismissTimer.current) {
        clearTimeout(autoDismissTimer.current);
      }

      setActiveNotification(notif);
      setThumbError(false);
      triggerHaptic('success');

      // Animate entry from top
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 6,
          speed: 14,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss after 7.5 seconds
      autoDismissTimer.current = setTimeout(() => {
        dismissNotification();
      }, 7500);
    });

    return () => {
      unsubscribe();
      if (autoDismissTimer.current) {
        clearTimeout(autoDismissTimer.current);
      }
    };
  }, []);

  const dismissNotification = () => {
    if (autoDismissTimer.current) {
      clearTimeout(autoDismissTimer.current);
      autoDismissTimer.current = null;
    }

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -240,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setActiveNotification(null);
    });
  };

  // Pan gesture to allow learner to swipe up to dismiss
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy < -6,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -15) {
          triggerHaptic('selection');
          dismissNotification();
        }
      },
    })
  ).current;

  if (!activeNotification) return null;

  const { title, body, type, data } = activeNotification;
  const courseId = data?.courseId;
  const discountPercent = data?.discountPercent;
  const salePrice = data?.salePrice || data?.priceBdt;
  const thumbnail = data?.thumbnail;
  const postUrl = data?.postUrl;

  const isIos = Platform.OS === 'ios';

  const getTypeBadge = () => {
    switch (type) {
      case 'offer':
        return {
          label: '🔥 SPECIAL OFFER',
          bg: '#FEF2F2',
          text: '#DC2626',
          icon: 'flame' as const,
        };
      case 'course':
        return { label: '🎓 NEW COURSE', bg: '#EEF2FF', text: '#4F46E5', icon: 'school' as const };
      case 'recommendation':
        return {
          label: '✨ RECOMMENDED',
          bg: '#FEE2E2',
          text: '#E34234',
          icon: 'sparkles' as const,
        };
      case 'update':
        return {
          label: '📢 PLATFORM UPDATE',
          bg: '#F0FDF4',
          text: '#16A34A',
          icon: 'megaphone' as const,
        };
      default:
        return {
          label: '🔔 NOTIFICATION',
          bg: '#F1F5F9',
          text: '#475569',
          icon: 'notifications' as const,
        };
    }
  };

  const badge = getTypeBadge();

  const handlePrimaryAction = () => {
    triggerHaptic('light');
    dismissNotification();
    if (courseId && onNavigateToCourse) {
      onNavigateToCourse(courseId);
    } else if (postUrl) {
      Linking.openURL(postUrl).catch(() => {});
    } else if (onOpenNotifications) {
      onOpenNotifications();
    }
  };

  const handleBookmarkAction = () => {
    triggerHaptic('selection');
    if (courseId && onBookmarkCourse) {
      onBookmarkCourse(courseId);
    }
    dismissNotification();
  };

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          top: Math.max(insets.top, Platform.OS === 'android' ? 24 : 12) + 4,
          transform: [{ translateY }],
          opacity,
        },
      ]}
      {...panResponder.panHandlers}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.96)' : 'rgba(255, 255, 255, 0.97)',
            borderColor: isDark ? '#334155' : 'rgba(0, 0, 0, 0.08)',
          },
          isIos ? styles.iosShadow : styles.androidElevation,
        ]}
      >
        {/* Top iOS Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.appIdentity}>
            <View style={[styles.appIconBadge, { backgroundColor: '#102F53' }]}>
              <Ionicons name="sparkles" size={10} color="#E34234" />
            </View>
            <Text style={[styles.appName, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              THRIVING <Text style={{ color: '#E34234' }}>SKILLS</Text>
            </Text>
            <Text style={[styles.headerBullet, { color: isDark ? '#64748B' : '#94A3B8' }]}>•</Text>
            <Text style={[styles.timeNow, { color: isDark ? '#94A3B8' : '#64748B' }]}>now</Text>
          </View>

          <View style={[styles.typeBadgePill, { backgroundColor: badge.bg }]}>
            <Text style={[styles.typeBadgeText, { color: badge.text }]}>{badge.label}</Text>
          </View>
        </View>

        {/* Content Body Row */}
        <TouchableOpacity
          style={styles.contentBody}
          onPress={handlePrimaryAction}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel={`${title}, ${body}`}
        >
          {thumbnail && !thumbError ? (
            <Image
              source={getSafeImageSource(thumbnail)}
              style={styles.thumbnail}
              resizeMode="cover"
              onError={() => setThumbError(true)}
              {...(Platform.OS === 'web' ? { referrerPolicy: 'no-referrer' } : {})}
            />
          ) : (
            <View style={[styles.fallbackIcon, { backgroundColor: badge.bg }]}>
              <Ionicons name={badge.icon} size={22} color={badge.text} />
            </View>
          )}

          <View style={styles.textColumn}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {title}
            </Text>
            <Text style={[styles.message, { color: colors.textMuted }]} numberOfLines={2}>
              {body}
            </Text>

            {discountPercent ? (
              <View style={styles.discountPillRow}>
                <View style={styles.discountPill}>
                  <Text style={styles.discountPillText}>-{discountPercent}% OFF</Text>
                </View>
                {salePrice ? (
                  <Text style={[styles.priceTag, { color: colors.primary }]}>৳{salePrice}</Text>
                ) : null}
              </View>
            ) : null}
          </View>
        </TouchableOpacity>

        {/* Action Button Panel (iOS Actionable Notification Panel) */}
        <View style={[styles.actionPanel, { borderTopColor: isDark ? '#334155' : '#F1F5F9' }]}>
          <TouchableOpacity
            style={[styles.primaryActionBtn, { backgroundColor: colors.primary }]}
            onPress={handlePrimaryAction}
            accessibilityRole="button"
            accessibilityLabel={type === 'offer' ? 'Claim offer' : 'View course'}
          >
            <Ionicons
              name={type === 'offer' ? 'flash' : type === 'update' ? 'open-outline' : 'play-circle'}
              size={15}
              color={colors.onPrimary}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.primaryActionText, { color: colors.onPrimary }]}>
              {type === 'offer'
                ? 'অফারটি দেখুন'
                : type === 'recommendation'
                  ? 'কোর্স শুরু করুন'
                  : type === 'update'
                    ? 'ইনসাইট পড়ুন'
                    : 'বিস্তারিত দেখুন'}
            </Text>
          </TouchableOpacity>

          {courseId && onBookmarkCourse ? (
            <TouchableOpacity
              style={[styles.secondaryActionBtn, { borderColor: colors.border }]}
              onPress={handleBookmarkAction}
              accessibilityRole="button"
              accessibilityLabel="Bookmark course"
            >
              <Ionicons
                name="bookmark-outline"
                size={15}
                color={colors.text}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.secondaryActionText, { color: colors.text }]}>সেভ করুন</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={styles.dismissBtn}
            onPress={dismissNotification}
            accessibilityRole="button"
            accessibilityLabel="Dismiss notification"
          >
            <Ionicons name="close" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 9999,
  },
  container: {
    borderRadius: 20,
    borderWidth: 1,
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 14,
    overflow: 'hidden',
  },
  iosShadow: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
  },
  androidElevation: {
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  appIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appIconBadge: {
    width: 18,
    height: 18,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  headerBullet: {
    fontSize: 10,
  },
  timeNow: {
    fontSize: 11,
    fontWeight: '500',
  },
  typeBadgePill: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  contentBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 10,
  },
  thumbnail: {
    width: 52,
    height: 52,
    borderRadius: 12,
  },
  fallbackIcon: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textColumn: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 13.5,
    fontWeight: '700',
    marginBottom: 3,
  },
  message: {
    fontSize: 12,
    lineHeight: 16,
  },
  discountPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  discountPill: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  priceTag: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    paddingTop: 8,
    gap: 8,
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  primaryActionText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  secondaryActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dismissBtn: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
