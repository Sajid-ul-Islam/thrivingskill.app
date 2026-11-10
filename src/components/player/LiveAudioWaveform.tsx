import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';

interface LiveAudioWaveformProps {
  isPlaying: boolean;
  barCount?: number;
  primaryColor?: string;
  accentColor?: string;
}

export const LiveAudioWaveform: React.FC<LiveAudioWaveformProps> = ({
  isPlaying,
  barCount = 20,
  primaryColor = '#FFB606',
  accentColor = '#E34234',
}) => {
  const animatedValues = useRef(
    Array.from({ length: barCount }, () => new Animated.Value(0.2))
  ).current;

  useEffect(() => {
    if (!isPlaying) {
      animatedValues.forEach((val) => {
        val.stopAnimation();
        Animated.timing(val, {
          toValue: 0.18,
          duration: 180,
          useNativeDriver: true,
        }).start();
      });
      return;
    }

    const animations = animatedValues.map((val, i) => {
      const duration = 380 + ((i * 67) % 400);
      const delay = (i * 28) % 200;
      const peakScale = 0.35 + ((i % 6) * 0.12);

      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, {
            toValue: peakScale,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0.18,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
    });

    Animated.parallel(animations).start();

    return () => {
      animatedValues.forEach((val) => val.stopAnimation());
    };
  }, [isPlaying, animatedValues]);

  return (
    <View style={styles.container}>
      {animatedValues.map((val, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bar,
            {
              backgroundColor: i % 2 === 0 ? primaryColor : accentColor,
              transform: [{ scaleY: val }],
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 64,
    paddingHorizontal: 16,
  },
  bar: {
    width: 4.5,
    height: 60,
    borderRadius: 3,
  },
});
