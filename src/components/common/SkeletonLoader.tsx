import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle, DimensionValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';

interface SkeletonBoxProps {
  width?: DimensionValue;
  height?: DimensionValue;
  aspectRatio?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const SkeletonBox: React.FC<SkeletonBoxProps> = ({
  width = '100%',
  height = 16,
  aspectRatio,
  borderRadius = 8,
  style,
}) => {
  const { isDark } = useTheme();
  const shimmerAnim = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1300,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  const baseColor = isDark ? '#1E293B' : '#E2E8F0';
  const highlightColor = isDark ? '#334155' : '#F8FAFC';

  const translateX = shimmerAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-250, 250],
  });

  return (
    <View
      style={[
        {
          width,
          height: aspectRatio !== undefined ? undefined : height,
          aspectRatio,
          borderRadius,
          backgroundColor: baseColor,
          overflow: 'hidden',
          position: 'relative',
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <LinearGradient
          colors={[baseColor, highlightColor, baseColor]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
};

export const CourseCardSkeleton: React.FC<{ horizontal?: boolean }> = ({ horizontal = false }) => {
  const { colors } = useTheme();

  if (horizontal) {
    return (
      <View style={[styles.horizontalCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
        <SkeletonBox width={104} height={78} borderRadius={12} />
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
      <SkeletonBox width="100%" aspectRatio={4 / 3} borderRadius={12} style={{ marginBottom: 12 }} />
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
