import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BannerPayload, BannerType } from '../../context/FeedbackContext';
import { shape } from '../../theme/shapes';
import { typography } from '../../theme/typography';
import { triggerHaptic } from '../../utils/haptics';
import { SpringPressable } from './SpringPressable';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental &&
  !(UIManager as any).__hasSetLayoutAnim
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
  (UIManager as any).__hasSetLayoutAnim = true;
}

interface ModernBannerProps {
  banner: BannerPayload | null;
  onDismiss: () => void;
  sticky?: boolean;
}

const BANNER_THEME: Record<
  BannerType,
  {
    bg: string;
    border: string;
    icon: string;
    iconColor: string;
    iconBg: string;
    titleColor: string;
    textColor: string;
    actionBg: string;
    actionText: string;
  }
> = {
  info: {
    bg: '#F0F9FF',
    border: '#BAE6FD',
    icon: 'information-circle-outline',
    iconColor: '#0284C7',
    iconBg: '#E0F2FE',
    titleColor: '#0369A1',
    textColor: '#0C4A6E',
    actionBg: '#0284C7',
    actionText: '#FFFFFF',
  },
  warning: {
    bg: '#FFFBEB',
    border: '#FDE68A',
    icon: 'alert-circle-outline',
    iconColor: '#D97706',
    iconBg: '#FEF3C7',
    titleColor: '#92400E',
    textColor: '#78350F',
    actionBg: '#D97706',
    actionText: '#FFFFFF',
  },
  error: {
    bg: '#FEF2F2',
    border: '#FECACA',
    icon: 'close-circle-outline',
    iconColor: '#DC2626',
    iconBg: '#FEE2E2',
    titleColor: '#991B1B',
    textColor: '#7F1D1D',
    actionBg: '#DC2626',
    actionText: '#FFFFFF',
  },
  success: {
    bg: '#ECFDF5',
    border: '#A7F3D0',
    icon: 'checkmark-circle-outline',
    iconColor: '#059669',
    iconBg: '#D1FAE5',
    titleColor: '#065F46',
    textColor: '#064E3B',
    actionBg: '#059669',
    actionText: '#FFFFFF',
  },
  promo: {
    bg: '#102F53',
    border: '#FFB606',
    icon: 'sparkles-outline',
    iconColor: '#FFB606',
    iconBg: 'rgba(255, 182, 6, 0.2)',
    titleColor: '#FFB606',
    textColor: '#F8FAFC',
    actionBg: '#FFB606',
    actionText: '#102F53',
  },
};

export const ModernBanner: React.FC<ModernBannerProps> = ({
  banner,
  onDismiss,
  sticky = false,
}) => {
  const insets = useSafeAreaInsets();
  const heightAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (banner) {
      Animated.parallel([
        Animated.spring(heightAnim, {
          toValue: 1,
          friction: 8,
          tension: 100,
          useNativeDriver: false,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(heightAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: false,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [banner?.id, heightAnim, opacityAnim]);

  if (!banner) return null;

  const type = banner.type || 'info';
  const theme = BANNER_THEME[type];

  const handleDismiss = () => {
    triggerHaptic('light');
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Animated.timing(opacityAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: false,
    }).start(() => onDismiss());
  };

  const handleAction = () => {
    triggerHaptic('medium');
    const cb = banner.onAction;
    onDismiss();
    if (cb) cb();
  };

  return (
    <Animated.View
      style={[
        styles.wrapper,
        sticky && {
          position: 'absolute',
          top: Math.max(insets.top, Platform.OS === 'ios' ? 44 : 20),
          left: 12,
          right: 12,
          zIndex: 9995,
        },
        {
          opacity: opacityAnim,
          transform: [
            {
              scaleY: heightAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.7, 1],
              }),
            },
          ],
        },
      ]}
      accessibilityRole="alert"
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.bg,
            borderColor: theme.border,
          },
        ]}
      >
        {/* Left Status Icon */}
        <View style={[styles.iconBadge, { backgroundColor: theme.iconBg }]}>
          <Ionicons
            name={(banner.icon || theme.icon) as any}
            size={20}
            color={theme.iconColor}
          />
        </View>

        {/* Text Section */}
        <View style={styles.textWrap}>
          <Text style={[typography.h6, styles.title, { color: theme.titleColor }]}>
            {banner.title}
          </Text>
          {banner.message ? (
            <Text
              style={[typography.bodySmall, styles.message, { color: theme.textColor }]}
              numberOfLines={2}
            >
              {banner.message}
            </Text>
          ) : null}
        </View>

        {/* Action Button */}
        {banner.actionLabel && banner.onAction && (
          <SpringPressable
            style={[styles.actionBtn, { backgroundColor: theme.actionBg }]}
            onPress={handleAction}
            accessibilityRole="button"
            accessibilityLabel={banner.actionLabel}
          >
            <Text style={[styles.actionText, { color: theme.actionText }]}>
              {banner.actionLabel}
            </Text>
          </SpringPressable>
        )}

        {/* Close Button */}
        {banner.dismissible !== false && (
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={handleDismiss}
            accessibilityRole="button"
            accessibilityLabel="Dismiss banner"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={18} color={theme.iconColor} />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    marginVertical: 6,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: shape.large,
    borderWidth: 1.5,
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: shape.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textWrap: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  message: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: shape.full,
    marginRight: 8,
    minHeight: 36,
    minWidth: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontWeight: '700',
    fontSize: 12,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: shape.full,
  },
});
