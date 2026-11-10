import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface MilestoneCelebrationData {
  title: string;
  subtitle: string;
  xpAwarded?: number;
  icon?: string;
}

interface CelebrationToastProps {
  data: MilestoneCelebrationData | null;
  onDismiss: () => void;
  autoHideDurationMs?: number;
}

export const CelebrationToast: React.FC<CelebrationToastProps> = ({
  data,
  onDismiss,
  autoHideDurationMs = 3800,
}) => {
  const insets = useSafeAreaInsets();
  const scaleAnim = useRef(new Animated.Value(0.75)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(-24)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!data) return;

    // Reset and animate in
    scaleAnim.setValue(0.75);
    opacityAnim.setValue(0);
    translateYAnim.setValue(-24);

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 90,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.spring(translateYAnim, {
        toValue: 0,
        friction: 7,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto hide
    timerRef.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: -30,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onDismiss();
      });
    }, autoHideDurationMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [data, autoHideDurationMs, onDismiss, opacityAnim, scaleAnim, translateYAnim]);

  if (!data) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: Math.max(insets.top, 16) + 12,
          opacity: opacityAnim,
          transform: [{ translateY: translateYAnim }, { scale: scaleAnim }],
        },
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={onDismiss}
        accessibilityRole="alert"
        accessibilityLabel={`${data.title}: ${data.subtitle}`}
      >
        <View style={styles.iconCircle}>
          <Ionicons name={(data.icon as any) || 'trophy'} size={20} color="#FFB606" />
        </View>

        <View style={styles.textCol}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {data.title}
            </Text>
            {data.xpAwarded ? (
              <View style={styles.xpBadge}>
                <Ionicons name="sparkles" size={10} color="#102F53" />
                <Text style={styles.xpText}>+{data.xpAwarded} XP</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.subtitle} numberOfLines={1}>
            {data.subtitle}
          </Text>
        </View>

        <TouchableOpacity onPress={onDismiss} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={16} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#102F53',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FFB606',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 12,
    gap: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 182, 6, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFB606',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3,
  },
  xpText: {
    color: '#102F53',
    fontSize: 10,
    fontWeight: '900',
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  closeBtn: {
    padding: 2,
  },
});
