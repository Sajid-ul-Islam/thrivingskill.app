import React, { useRef, useEffect } from 'react';
import { Animated, StyleSheet, StyleProp, ViewStyle } from 'react-native';

interface AnimatedTabContentProps {
  tabKey: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const AnimatedTabContent: React.FC<AnimatedTabContentProps> = ({
  tabKey,
  children,
  style,
}) => {
  const fadeAnim = useRef(new Animated.Value(0.4)).current;
  const slideAnim = useRef(new Animated.Value(6)).current;

  useEffect(() => {
    fadeAnim.setValue(0.4);
    slideAnim.setValue(6);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [tabKey, fadeAnim, slideAnim]);

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
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
