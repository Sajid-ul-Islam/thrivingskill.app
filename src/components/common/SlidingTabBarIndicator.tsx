import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View, AccessibilityInfo, Platform } from 'react-native';

export interface SlidingTabBarIndicatorProps {
  activeIndex: number;
  tabCount: number;
  containerWidth: number;
  isDark: boolean;
  accentColor?: string;
}

/**
 * High-performance fluid morphing indicator for bottom tab navigation.
 * Renders:
 * 1. An animated top accent bar that glides smoothly above the active tab.
 * 2. An active capsule glow pill behind the active tab icon with spring physics
 *    and horizontal squash-and-stretch during flight.
 * 100% offloaded to the native render thread via useNativeDriver: true.
 */
export const SlidingTabBarIndicator: React.FC<SlidingTabBarIndicatorProps> = ({
  activeIndex,
  tabCount,
  containerWidth,
  isDark,
  accentColor = '#E34234',
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

  const tabWidth = containerWidth > 0 && tabCount > 0 ? containerWidth / tabCount : 0;
  const pillWidth = 58;
  const topBarWidth = tabWidth > 0 ? Math.min(Math.round(tabWidth * 0.44), 36) : 32;

  // Initial offsets
  const pillTranslateX = useRef(new Animated.Value(0)).current;
  const pillScaleX = useRef(new Animated.Value(1)).current;
  const topBarTranslateX = useRef(new Animated.Value(0)).current;

  // Track if initial layout is completed
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (tabWidth <= 0) return;

    const targetPillX = activeIndex * tabWidth + (tabWidth - pillWidth) / 2;
    const targetTopBarX = activeIndex * tabWidth + (tabWidth - topBarWidth) / 2;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      pillTranslateX.setValue(targetPillX);
      topBarTranslateX.setValue(targetTopBarX);
      return;
    }

    if (reduceMotion) {
      Animated.parallel([
        Animated.timing(pillTranslateX, {
          toValue: targetPillX,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(topBarTranslateX, {
          toValue: targetTopBarX,
          duration: 120,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    // Coordinated physics: spring slide with subtle horizontal stretch
    Animated.parallel([
      Animated.spring(pillTranslateX, {
        toValue: targetPillX,
        friction: 8,
        tension: 130,
        useNativeDriver: true,
      }),
      Animated.spring(topBarTranslateX, {
        toValue: targetTopBarX,
        friction: 8,
        tension: 130,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(pillScaleX, {
          toValue: 1.14, // Subtle stretch mid-motion
          duration: 70,
          useNativeDriver: true,
        }),
        Animated.spring(pillScaleX, {
          toValue: 1.0, // Rebounds upon landing
          friction: 6,
          tension: 160,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [
    activeIndex,
    tabWidth,
    pillWidth,
    topBarWidth,
    reduceMotion,
    pillTranslateX,
    topBarTranslateX,
    pillScaleX,
  ]);

  if (containerWidth <= 0 || tabWidth <= 0) {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* 1. Top Accent Indicator Bar */}
      <Animated.View
        style={[
          styles.topBar,
          {
            width: topBarWidth,
            backgroundColor: accentColor,
            transform: [{ translateX: topBarTranslateX }],
          },
        ]}
      />

      {/* 2. Active Tab Pill Capsule Glow */}
      <Animated.View
        style={[
          styles.capsulePill,
          {
            width: pillWidth,
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(16, 47, 83, 0.08)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(227, 66, 52, 0.20)',
            transform: [{ translateX: pillTranslateX }, { scaleX: pillScaleX }],
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  topBar: {
    position: 'absolute',
    top: -8, // Sits exactly on the top border line of the tab bar
    left: 0,
    height: 2.5,
    borderRadius: 1.5,
  },
  capsulePill: {
    position: 'absolute',
    top: 2, // Centered vertically over the tab icon indicator
    left: 0,
    height: 32,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
