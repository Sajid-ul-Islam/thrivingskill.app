import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  PanResponder,
  Platform,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ToastPayload, ToastType } from '../../context/FeedbackContext';
import { shape } from '../../theme/shapes';
import { typography } from '../../theme/typography';
import { triggerHaptic } from '../../utils/haptics';

interface ActionToastProps {
  toast: ToastPayload | null;
  onDismiss: () => void;
  bottomOffset?: number;
}

const TOAST_THEME: Record<
  ToastType,
  {
    bg: string;
    border: string;
    icon: string;
    iconBg: string;
    actionBg: string;
    actionText: string;
    accentGlow: string;
  }
> = {
  success: {
    bg: '#064E3B',
    border: '#10B981',
    icon: 'checkmark-circle',
    iconBg: 'rgba(16, 185, 129, 0.25)',
    actionBg: '#10B981',
    actionText: '#FFFFFF',
    accentGlow: 'rgba(16, 185, 129, 0.35)',
  },
  info: {
    bg: '#102F53',
    border: '#E34234',
    icon: 'information-circle',
    iconBg: 'rgba(227, 66, 52, 0.25)',
    actionBg: '#E34234',
    actionText: '#FFFFFF',
    accentGlow: 'rgba(227, 66, 52, 0.3)',
  },
  warning: {
    bg: '#78350F',
    border: '#F59E0B',
    icon: 'alert-circle',
    iconBg: 'rgba(245, 158, 11, 0.25)',
    actionBg: '#FEF3C7',
    actionText: '#78350F',
    accentGlow: 'rgba(245, 158, 11, 0.35)',
  },
  error: {
    bg: '#7F1D1D',
    border: '#EF4444',
    icon: 'warning',
    iconBg: 'rgba(239, 68, 68, 0.25)',
    actionBg: '#FEE2E2',
    actionText: '#7F1D1D',
    accentGlow: 'rgba(239, 68, 68, 0.35)',
  },
};

export const ActionToast: React.FC<ActionToastProps> = ({
  toast,
  onDismiss,
  bottomOffset,
}) => {
  const insets = useSafeAreaInsets();
  const isTop = toast?.position === 'top';

  const translateYAnim = useRef(new Animated.Value(isTop ? -40 : 40)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  // Swipe-to-dismiss gesture handling
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 8;
      },
      onPanResponderMove: (_, gestureState) => {
        // Drag in the dismissal direction
        if (isTop && gestureState.dy < 0) {
          translateYAnim.setValue(gestureState.dy);
        } else if (!isTop && gestureState.dy > 0) {
          translateYAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const threshold = 35;
        const shouldDismiss = isTop ? gestureState.dy < -threshold : gestureState.dy > threshold;

        if (shouldDismiss) {
          triggerHaptic('light');
          Animated.timing(translateYAnim, {
            toValue: isTop ? -100 : 100,
            duration: 150,
            useNativeDriver: true,
          }).start(() => onDismiss());
        } else {
          // Snap back
          Animated.spring(translateYAnim, {
            toValue: 0,
            friction: 7,
            tension: 100,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (!toast) return;

    translateYAnim.setValue(isTop ? -32 : 32);
    opacityAnim.setValue(0);
    scaleAnim.setValue(0.92);

    Animated.parallel([
      Animated.spring(translateYAnim, {
        toValue: 0,
        friction: 8,
        tension: 120,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [toast?.id, isTop, opacityAnim, scaleAnim, translateYAnim]);

  if (!toast) return null;

  const theme = TOAST_THEME[toast.type];
  const resolvedTop = isTop ? Math.max(insets.top, Platform.OS === 'ios' ? 44 : 24) + 8 : undefined;
  const resolvedBottom = !isTop
    ? bottomOffset ?? Math.max(insets.bottom, 16) + 74
    : undefined;

  const handleActionPress = () => {
    triggerHaptic('medium');
    const callback = toast.onAction;
    onDismiss();
    if (callback) callback();
  };

  const handleDismiss = () => {
    triggerHaptic('light');
    Animated.timing(opacityAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => onDismiss());
  };

  return (
    <Animated.View
      style={[
        styles.wrapper,
        isTop ? { top: resolvedTop } : { bottom: resolvedBottom },
        {
          opacity: opacityAnim,
          transform: [
            { translateY: translateYAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
      pointerEvents="box-none"
      {...panResponder.panHandlers}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.bg,
            borderColor: theme.border,
            shadowColor: theme.accentGlow,
          },
        ]}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
      >
        {/* Left Icon Pill */}
        <View style={[styles.iconWrap, { backgroundColor: theme.iconBg }]}>
          <Ionicons
            name={(toast.icon || theme.icon) as any}
            size={18}
            color="#FFFFFF"
          />
        </View>

        {/* Message / Title Container */}
        <View style={styles.contentWrap}>
          {toast.title ? (
            <Text style={[typography.h6, styles.titleText]} numberOfLines={1}>
              {toast.title}
            </Text>
          ) : null}
          <Text style={[typography.bodyMedium, styles.message]} numberOfLines={2}>
            {toast.message}
          </Text>
        </View>

        {/* Action Button */}
        {toast.actionLabel && toast.onAction ? (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.actionBg }]}
            onPress={handleActionPress}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={toast.actionLabel}
          >
            <Text style={[typography.h6, { color: theme.actionText }]}>{toast.actionLabel}</Text>
          </TouchableOpacity>
        ) : null}

        {/* Dismiss Button */}
        <TouchableOpacity
          style={styles.dismissBtn}
          onPress={handleDismiss}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Dismiss notification"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="close" size={18} color="rgba(255, 255, 255, 0.85)" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9998,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 440,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: shape.largeIncreased,
    borderWidth: 1.5,
    elevation: 8,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: shape.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contentWrap: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 8,
  },
  titleText: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: 2,
    fontSize: 13,
  },
  message: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: shape.full,
    marginRight: 8,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: shape.full,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
});
