import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, ViewStyle } from 'react-native';
import { triggerHaptic } from '../../utils/haptics';

interface Particle {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  rotation: Animated.Value;
  color: string;
  size: number;
  isCircle: boolean;
}

const BRAND_CONFETTI_COLORS = [
  '#102F53', // Deep Navy
  '#E34234', // Crimson / Coral
  '#1D4476', // Royal Blue Light
  '#FFFFFF', // Pure White
  '#047857', // Emerald
  '#3B82F6', // Tech Blue
  '#8B5CF6', // Purple
];

interface ConfettiBurstProps {
  active: boolean;
  onComplete?: () => void;
  count?: number;
  duration?: number;
  style?: ViewStyle;
}

export const ConfettiBurst: React.FC<ConfettiBurstProps> = ({
  active,
  onComplete,
  count = 42,
  duration = 2400,
  style,
}) => {
  const { width, height } = Dimensions.get('window');
  const particlesRef = useRef<Particle[]>([]);

  if (particlesRef.current.length === 0) {
    const list: Particle[] = [];
    for (let i = 0; i < count; i++) {
      list.push({
        id: i,
        x: new Animated.Value(width / 2),
        y: new Animated.Value(height * 0.4),
        opacity: new Animated.Value(1),
        rotation: new Animated.Value(0),
        color: BRAND_CONFETTI_COLORS[i % BRAND_CONFETTI_COLORS.length],
        size: Math.floor(Math.random() * 8) + 6,
        isCircle: i % 3 === 0,
      });
    }
    particlesRef.current = list;
  }

  useEffect(() => {
    if (!active) return;

    triggerHaptic('success');

    const animations = particlesRef.current.map((p) => {
      const angle = Math.random() * 2 * Math.PI;
      const velocity = Math.random() * (width * 0.45) + 60;
      const targetX = width / 2 + Math.cos(angle) * velocity;
      const targetY = height * 0.4 + Math.sin(angle) * velocity + (Math.random() * 250 + 80); // gravity fall

      // Reset
      p.x.setValue(width / 2);
      p.y.setValue(height * 0.4);
      p.opacity.setValue(1);
      p.rotation.setValue(0);

      return Animated.parallel([
        Animated.timing(p.x, {
          toValue: targetX,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(p.y, {
          toValue: targetY,
          duration,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(duration * 0.6),
          Animated.timing(p.opacity, {
            toValue: 0,
            duration: duration * 0.4,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(p.rotation, {
          toValue: (Math.random() - 0.5) * 12,
          duration,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.parallel(animations).start(() => {
      if (onComplete) onComplete();
    });
  }, [active, duration, width, height, onComplete]);

  if (!active) return null;

  return (
    <View style={[styles.overlay, style]} pointerEvents="none">
      {particlesRef.current.map((p) => {
        const spin = p.rotation.interpolate({
          inputRange: [-10, 10],
          outputRange: ['-360deg', '360deg'],
        });

        return (
          <Animated.View
            key={p.id}
            style={[
              styles.particle,
              {
                width: p.size,
                height: p.isCircle ? p.size : p.size * 1.6,
                borderRadius: p.isCircle ? p.size / 2 : 2,
                backgroundColor: p.color,
                opacity: p.opacity,
                transform: [{ translateX: p.x }, { translateY: p.y }, { rotate: spin }],
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 9999,
  },
  particle: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
