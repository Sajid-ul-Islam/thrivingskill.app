import React, { useRef } from 'react';
import {
  Pressable,
  Animated,
  StyleProp,
  ViewStyle,
  PressableProps,
  GestureResponderEvent,
} from 'react-native';

export interface SpringPressableProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  activeScale?: number;
  activeOpacity?: number;
  friction?: number;
  tension?: number;
}

/**
 * High-performance tactile pressable with native-driven spring scale and optional opacity.
 * Provides micro-interaction feedback on touch.
 */
export const SpringPressable: React.FC<SpringPressableProps> = ({
  children,
  style,
  activeScale = 0.97,
  activeOpacity,
  friction = 7,
  tension = 120,
  onPressIn,
  onPressOut,
  disabled,
  ...rest
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = (event: GestureResponderEvent) => {
    if (!disabled) {
      Animated.spring(scaleAnim, {
        toValue: activeScale,
        friction,
        tension,
        useNativeDriver: true,
      }).start();

      if (activeOpacity !== undefined) {
        Animated.timing(opacityAnim, {
          toValue: activeOpacity,
          duration: 90,
          useNativeDriver: true,
        }).start();
      }
    }
    onPressIn?.(event);
  };

  const handlePressOut = (event: GestureResponderEvent) => {
    if (!disabled) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction,
        tension,
        useNativeDriver: true,
      }).start();

      if (activeOpacity !== undefined) {
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }).start();
      }
    }
    onPressOut?.(event);
  };

  return (
    <Pressable
      {...rest}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          style,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
};
