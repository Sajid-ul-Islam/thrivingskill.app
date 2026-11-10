import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

interface CircularProgressRingProps {
  progress: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  trackColor?: string;
  progressColor?: string;
  centerContent?: React.ReactNode;
  showText?: boolean;
  textSize?: number;
  textColor?: string;
}

export const CircularProgressRing: React.FC<CircularProgressRingProps> = ({
  progress,
  size = 56,
  strokeWidth = 5,
  trackColor = 'rgba(16, 47, 83, 0.1)',
  progressColor = '#FFB606',
  centerContent,
  showText = true,
  textSize = 11,
  textColor,
}) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${center}, ${center}`}>
          {/* Background Track Circle */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={trackColor}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress Indicator Circle */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={progressColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </G>
      </Svg>
      <View style={styles.centerContainer}>
        {centerContent ? (
          centerContent
        ) : showText ? (
          <Text
            style={[
              styles.percentText,
              { fontSize: textSize, color: textColor || progressColor },
            ]}
          >
            {Math.round(clampedProgress)}%
          </Text>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centerContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentText: {
    fontWeight: '800',
  },
});
