import React, { useRef, useEffect } from 'react';
import { Animated, StyleSheet, StyleProp, ViewStyle, Easing } from 'react-native';

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

export const ScreenTransition: React.FC<ScreenTransitionProps> = ({
  children,
  style,
  direction = 'forward',
  duration = 220,
}) => {
  const isHorizontal = direction === 'horizontal' || direction === 'forward' || direction === 'backward';
  const isBackward = direction === 'backward';
  const isVertical = direction === 'vertical';
  const isFade = direction === 'fade';

  // Physical starting offsets:
  // forward / horizontal: +28px (glides smoothly from right)
  // backward: -28px (glides smoothly from left)
  // vertical: +20px (glides smoothly from bottom)
  // fade: 0px (pure cross-fade with subtle micro-scale)
  const initialOffset = isBackward ? -28 : isHorizontal ? 28 : isVertical ? 20 : 0;

  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(initialOffset)).current;
  const scaleAnim = useRef(new Animated.Value(isFade ? 0.992 : 1)).current;

  useEffect(() => {
    opacityAnim.setValue(0);
    translateAnim.setValue(initialOffset);
    if (isFade) {
      scaleAnim.setValue(0.992);
    }

    const animations: Animated.CompositeAnimation[] = [
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ];

    if (isFade) {
      animations.push(
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        })
      );
    } else {
      animations.push(
        Animated.timing(translateAnim, {
          toValue: 0,
          duration,
          // Cubic bezier curve (0.16, 1, 0.3, 1) provides authentic native iOS/Material deceleration without rubber bounce
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          useNativeDriver: true,
        })
      );
    }

    Animated.parallel(animations).start();
  }, [direction, duration, initialOffset, isFade, opacityAnim, scaleAnim, translateAnim]);

  const transform = isFade
    ? [{ scale: scaleAnim }]
    : isVertical
    ? [{ translateY: translateAnim }]
    : [{ translateX: translateAnim }];

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
