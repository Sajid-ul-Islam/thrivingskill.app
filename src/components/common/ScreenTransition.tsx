import React, { useRef, useEffect, useState } from 'react';
import {
  Animated,
  StyleSheet,
  StyleProp,
  ViewStyle,
  Easing,
  AccessibilityInfo,
} from 'react-native';

export type ScreenTransitionDirection =
  | 'forward'
  | 'backward'
  | 'horizontal'
  | 'vertical'
  | 'fade';

export interface ScreenTransitionProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  direction?: ScreenTransitionDirection;
  duration?: number;
}

/**
 * Flagship screen navigation transition wrapper.
 * Features:
 * - Direction-aware spatial translation (forward, backward, vertical, fade).
 * - Authentic iOS / Material cubic-bezier deceleration (0.16, 1, 0.3, 1).
 * - Subtle micro-depth scaling (0.985 -> 1.0) to give natural physical presence.
 * - WCAG AA accessibility compliance via automatic AccessibilityInfo reduceMotion detection.
 * - 100% native thread execution via useNativeDriver: true.
 */
export const ScreenTransition: React.FC<ScreenTransitionProps> = ({
  children,
  style,
  direction = 'forward',
  duration = 240,
}) => {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });

    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      if (mounted) setReduceMotion(enabled);
    });

    return () => {
      mounted = false;
      sub?.remove?.();
    };
  }, []);

  const isHorizontal = direction === 'horizontal' || direction === 'forward' || direction === 'backward';
  const isBackward = direction === 'backward';
  const isVertical = direction === 'vertical';
  const isFade = direction === 'fade';

  // Physical starting offsets:
  // forward / horizontal: +30px (glides smoothly from right with depth)
  // backward: -24px (glides smoothly from left)
  // vertical: +22px (glides smoothly from bottom)
  // fade: 0px (pure cross-fade with subtle micro-scale)
  const initialOffset = reduceMotion
    ? 0
    : isBackward
    ? -24
    : isHorizontal
    ? 30
    : isVertical
    ? 22
    : 0;

  const initialScale = reduceMotion
    ? 1
    : isFade
    ? 0.992
    : isBackward
    ? 0.99
    : 0.985;

  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(initialOffset)).current;
  const scaleAnim = useRef(new Animated.Value(initialScale)).current;

  useEffect(() => {
    opacityAnim.setValue(0);
    translateAnim.setValue(initialOffset);
    scaleAnim.setValue(initialScale);

    if (reduceMotion) {
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: Math.min(duration, 140),
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      return;
    }

    const animations: Animated.CompositeAnimation[] = [
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: Math.round(duration * 0.9),
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: true,
      }),
    ];

    if (!isFade) {
      animations.push(
        Animated.timing(translateAnim, {
          toValue: 0,
          duration,
          // Cubic bezier curve (0.16, 1, 0.3, 1) provides authentic native iOS/Material deceleration
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          useNativeDriver: true,
        })
      );
    }

    Animated.parallel(animations).start();
  }, [direction, duration, initialOffset, initialScale, isFade, opacityAnim, scaleAnim, translateAnim, reduceMotion]);

  const transform = reduceMotion
    ? []
    : isFade
    ? [{ scale: scaleAnim }]
    : isVertical
    ? [{ translateY: translateAnim }, { scale: scaleAnim }]
    : [{ translateX: translateAnim }, { scale: scaleAnim }];

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          opacity: opacityAnim,
          transform,
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
