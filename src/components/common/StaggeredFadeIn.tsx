import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  ViewStyle,
  StyleProp,
  AccessibilityInfo,
  Easing,
} from 'react-native';

export interface StaggeredFadeInProps {
  index: number;
  children: React.ReactNode;
  delayStep?: number;
  maxDelay?: number;
  distance?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Choreographed staggered entrance for list/grid items.
 * Prevents abrupt content popping on network fetch completion.
 * Elevates cards with an exponential cubic-bezier deceleration curve.
 * Automatically falls back to instant opacity transition if reduced motion is enabled.
 */
export const StaggeredFadeIn: React.FC<StaggeredFadeInProps> = ({
  index,
  children,
  delayStep = 35,
  maxDelay = 260,
  distance = 16,
  duration = 240,
  style,
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

  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(distance)).current;

  useEffect(() => {
    const delay = Math.min(index * delayStep, maxDelay);

    if (reduceMotion) {
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: Math.min(duration, 140),
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      return;
    }

    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: duration + 40,
        delay,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, delayStep, maxDelay, distance, duration, reduceMotion, opacityAnim, translateYAnim]);

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          opacity: opacityAnim,
          transform: reduceMotion ? [] : [{ translateY: translateYAnim }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Keeps layout intrinsic to child
  },
});
