import React, { useRef, useMemo } from 'react';
import {
  Pressable,
  Animated,
  StyleProp,
  StyleSheet,
  ViewStyle,
  PressableProps,
  GestureResponderEvent,
} from 'react-native';
import { triggerHaptic, HapticKind } from '../../utils/haptics';

export interface SpringPressableProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  activeScale?: number;
  activeOpacity?: number;
  friction?: number;
  tension?: number;
  haptic?: HapticKind;
}

const OUTER_LAYOUT_KEYS = new Set<keyof ViewStyle>([
  'flex',
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'alignSelf',
  'width',
  'minWidth',
  'maxWidth',
  'height',
  'minHeight',
  'maxHeight',
  'aspectRatio',
  'margin',
  'marginTop',
  'marginBottom',
  'marginLeft',
  'marginRight',
  'marginHorizontal',
  'marginVertical',
  'marginStart',
  'marginEnd',
  'position',
  'top',
  'bottom',
  'left',
  'right',
  'start',
  'end',
  'zIndex',
]);

/**
 * High-performance tactile pressable with native-driven spring scale and optional opacity.
 * Splits outer flex/positioning layout onto Pressable and visual/inner styles onto Animated.View
 * so flex: 1, absolute positioning, and card padding never collapse or clip children.
 */
export const SpringPressable: React.FC<SpringPressableProps> = ({
  children,
  style,
  activeScale = 0.97,
  activeOpacity,
  friction = 7,
  tension = 120,
  haptic = 'selection',
  onPressIn,
  onPressOut,
  disabled,
  ...rest
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const { outerStyle, innerStyle } = useMemo(() => {
    const flat = StyleSheet.flatten(style) || {};
    const outer: Record<string, any> = {};
    const inner: Record<string, any> = {};

    Object.entries(flat).forEach(([key, val]) => {
      if (val === undefined) return;
      if (OUTER_LAYOUT_KEYS.has(key as keyof ViewStyle)) {
        outer[key] = val;
      } else {
        inner[key] = val;
      }
    });

    if (
      outer.width !== undefined ||
      outer.flex !== undefined ||
      outer.flexGrow !== undefined ||
      outer.alignSelf === 'stretch'
    ) {
      inner.width = '100%';
    }

    if (
      outer.height !== undefined ||
      outer.flex !== undefined ||
      outer.flexGrow !== undefined
    ) {
      inner.flexGrow = 1;
    }

    if (inner.position === undefined) {
      inner.position = 'relative';
    }

    return {
      outerStyle: outer as ViewStyle,
      innerStyle: inner as ViewStyle,
    };
  }, [style]);

  const handlePressIn = (event: GestureResponderEvent) => {
    if (!disabled) {
      if (haptic !== 'none') {
        triggerHaptic(haptic);
      }
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
      style={outerStyle}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          innerStyle,
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
