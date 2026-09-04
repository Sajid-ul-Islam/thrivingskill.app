import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle, DimensionValue } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface SkeletonBoxProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle;
}

export const SkeletonBox: React.FC<SkeletonBoxProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
}) => {
  const { isDark } = useTheme();
  const pulseAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  const baseColor = isDark ? '#27272A' : '#E2E8F0';

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: baseColor,
          opacity: pulseAnim,
        },
        style,
      ]}
    />
  );
};

export const CourseCardSkeleton: React.FC<{ horizontal?: boolean }> = ({ horizontal = false }) => {
  const { colors } = useTheme();

  if (horizontal) {
    return (
      <View style={[styles.horizontalCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
        <SkeletonBox width={120} height={100} borderRadius={12} />
        <View style={styles.horizontalInfo}>
          <SkeletonBox width={60} height={14} borderRadius={4} style={{ marginBottom: 6 }} />
          <SkeletonBox width="90%" height={16} borderRadius={4} style={{ marginBottom: 6 }} />
          <SkeletonBox width="60%" height={14} borderRadius={4} style={{ marginBottom: 8 }} />
          <View style={styles.row}>
            <SkeletonBox width={45} height={14} borderRadius={4} />
            <SkeletonBox width={70} height={18} borderRadius={6} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.verticalCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
      <SkeletonBox width="100%" height={140} borderRadius={12} style={{ marginBottom: 12 }} />
      <View style={{ paddingHorizontal: 4 }}>
        <SkeletonBox width={75} height={16} borderRadius={4} style={{ marginBottom: 8 }} />
        <SkeletonBox width="100%" height={18} borderRadius={4} style={{ marginBottom: 6 }} />
        <SkeletonBox width="70%" height={18} borderRadius={4} style={{ marginBottom: 12 }} />
        <View style={[styles.row, { justifyContent: 'space-between' }]}>
          <SkeletonBox width={80} height={14} borderRadius={4} />
          <SkeletonBox width={60} height={20} borderRadius={6} />
        </View>
      </View>
    </View>
  );
};

export const VideoCardSkeleton: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.videoCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
      <SkeletonBox width={180} height={105} borderRadius={12} style={{ marginBottom: 8 }} />
      <SkeletonBox width={80} height={14} borderRadius={4} style={{ marginBottom: 6 }} />
      <SkeletonBox width={160} height={16} borderRadius={4} style={{ marginBottom: 6 }} />
      <SkeletonBox width={110} height={14} borderRadius={4} />
    </View>
  );
};

export const CategoryPillSkeleton: React.FC = () => {
  return (
    <View style={styles.pillRow}>
      <SkeletonBox width={80} height={34} borderRadius={18} />
      <SkeletonBox width={110} height={34} borderRadius={18} />
      <SkeletonBox width={95} height={34} borderRadius={18} />
      <SkeletonBox width={120} height={34} borderRadius={18} />
    </View>
  );
};

const styles = StyleSheet.create({
  verticalCard: {
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  horizontalCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    gap: 12,
    marginBottom: 12,
  },
  horizontalInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  videoCard: {
    width: 200,
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    marginRight: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
});
