import React, { useRef, useEffect } from 'react';
import { Animated, StyleSheet, StyleProp, ViewStyle } from 'react-native';

interface ScreenTransitionProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  direction?: 'horizontal' | 'vertical';
  duration?: number;
}

export const ScreenTransition: React.FC<ScreenTransitionProps> = ({
  children,
  style,
  direction = 'horizontal',
  duration = 220,
}) => {
  const opacityAnim = useRef(new Animated.Value(0.15)).current;
  const translateAnim = useRef(new Animated.Value(direction === 'horizontal' ? 24 : 16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }),
      Animated.spring(translateAnim, {
        toValue: 0,
        speed: 18,
        bounciness: 3,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacityAnim, translateAnim, duration]);

  const transform =
    direction === 'horizontal'
      ? [{ translateX: translateAnim }]
      : [{ translateY: translateAnim }];

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
