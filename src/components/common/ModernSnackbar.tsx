import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SnackbarPayload } from '../../context/FeedbackContext';
import { shape } from '../../theme/shapes';
import { typography } from '../../theme/typography';
import { triggerHaptic } from '../../utils/haptics';
import { SpringPressable } from './SpringPressable';

interface ModernSnackbarProps {
  snackbar: SnackbarPayload | null;
  onDismiss: () => void;
  bottomOffset?: number;
}

export const ModernSnackbar: React.FC<ModernSnackbarProps> = ({
  snackbar,
  onDismiss,
  bottomOffset,
}) => {
  const insets = useSafeAreaInsets();
  const translateYAnim = useRef(new Animated.Value(48)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(1)).current;

  // Swipe-down to dismiss gesture
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 8,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateYAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 30) {
          triggerHaptic('light');
          Animated.timing(translateYAnim, {
            toValue: 120,
            duration: 150,
            useNativeDriver: true,
          }).start(() => onDismiss());
        } else {
          Animated.spring(translateYAnim, {
            toValue: 0,
            friction: 8,
            tension: 100,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (!snackbar) return;

    translateYAnim.setValue(48);
    opacityAnim.setValue(0);
    progressAnim.setValue(1);

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
    ]).start();

    // Countdown progress indicator
    if (snackbar.showProgress !== false) {
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: snackbar.durationMs,
        useNativeDriver: false,
      }).start();
    }
  }, [snackbar?.id, snackbar?.durationMs, snackbar?.showProgress, translateYAnim, opacityAnim, progressAnim]);

  if (!snackbar) return null;

  const resolvedBottom =
    bottomOffset ??
    Math.max(insets.bottom, Platform.OS === 'ios' ? 24 : 16) + 72;

  const handleAction = () => {
    triggerHaptic('medium');
    const cb = snackbar.onAction;
    onDismiss();
    if (cb) cb();
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
      {...panResponder.panHandlers}
    >
      <View
        style={styles.container}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
      >
        <View style={styles.contentRow}>
          <Text style={[typography.bodyMedium, styles.message]} numberOfLines={2}>
            {snackbar.message}
          </Text>

          <SpringPressable
            style={styles.actionBtn}
            onPress={handleAction}
            accessibilityRole="button"
            accessibilityLabel={snackbar.actionLabel}
          >
            <Text style={styles.actionText}>{snackbar.actionLabel}</Text>
          </SpringPressable>
        </View>

        {/* Animated Countdown Progress Bar */}
        {snackbar.showProgress !== false && (
          <View style={styles.progressBarTrack}>
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: '#0F192C',
    borderRadius: shape.large,
    borderWidth: 1.5,
    borderColor: '#334155',
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 52,
  },
  message: {
    color: '#F8FAFC',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    flex: 1,
    marginRight: 12,
  },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: shape.full,
    backgroundColor: '#E34234',
    minHeight: 44,
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.3,
  },
  progressBarTrack: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    width: '100%',
  },
  progressBarFill: {
    height: 3,
    backgroundColor: '#E34234',
  },
});
