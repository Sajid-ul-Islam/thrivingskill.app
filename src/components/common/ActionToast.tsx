import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ToastPayload, ToastType } from '../../context/FeedbackContext';
import { shape } from '../../theme/shapes';
import { typography, MIN_TOUCH_TARGET } from '../../theme/typography';

interface ActionToastProps {
  toast: ToastPayload | null;
  onDismiss: () => void;
  bottomOffset?: number;
}

const TOAST_THEME: Record<
  ToastType,
  { bg: string; border: string; icon: string; actionBg: string; actionText: string }
> = {
  success: {
    bg: '#065F46',
    border: '#10B981',
    icon: 'checkmark-circle',
    actionBg: '#A7F3D0',
    actionText: '#064E3B',
  },
  info: {
    bg: '#102F53',
    border: '#38BDF8',
    icon: 'information-circle',
    actionBg: '#FFB606',
    actionText: '#102F53',
  },
  warning: {
    bg: '#92400E',
    border: '#FFB606',
    icon: 'alert-circle',
    actionBg: '#FEF3C7',
    actionText: '#78350F',
  },
  error: {
    bg: '#B91C1C',
    border: '#FCA5A5',
    icon: 'warning',
    actionBg: '#FEE2E2',
    actionText: '#7F1D1D',
  },
};

export const ActionToast: React.FC<ActionToastProps> = ({
  toast,
  onDismiss,
  bottomOffset,
}) => {
  const insets = useSafeAreaInsets();
  const translateYAnim = useRef(new Animated.Value(28)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!toast) return;

    translateYAnim.setValue(28);
    opacityAnim.setValue(0);

    Animated.parallel([
      Animated.spring(translateYAnim, {
        toValue: 0,
        friction: 8,
        tension: 110,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [toast?.id, opacityAnim, translateYAnim]);

  if (!toast) return null;

  const theme = TOAST_THEME[toast.type];
  const resolvedBottom = bottomOffset ?? Math.max(insets.bottom, 16) + 74;

  const handleActionPress = () => {
    const callback = toast.onAction;
    onDismiss();
    if (callback) callback();
  };

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          bottom: resolvedBottom,
          opacity: opacityAnim,
          transform: [{ translateY: translateYAnim }],
        },
      ]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.bg,
            borderColor: theme.border,
          },
        ]}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
      >
        <Ionicons name={theme.icon as any} size={20} color="#FFFFFF" style={styles.icon} />

        <Text style={[typography.bodyMedium, styles.message]} numberOfLines={2}>
          {toast.message}
        </Text>

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

        <TouchableOpacity
          style={styles.dismissBtn}
          onPress={onDismiss}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Dismiss notification"
        >
          <Ionicons name="close" size={18} color="#FFFFFF" />
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
    maxWidth: 460,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: shape.large,
    borderWidth: 1,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 8,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: Platform.OS === 'android' ? 10 : 8,
  },
  icon: {
    flexShrink: 0,
  },
  message: {
    flex: 1,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  actionBtn: {
    minHeight: MIN_TOUCH_TARGET,
    minWidth: MIN_TOUCH_TARGET,
    paddingHorizontal: 12,
    borderRadius: shape.small,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  dismissBtn: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
