import React, { useRef, useEffect, useState } from 'react';
import { Text, StyleSheet, TouchableOpacity, Animated, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { triggerHaptic } from '../../utils/haptics';

export interface ScrollToTopPillProps {
  visible: boolean;
  onPress: () => void;
  bottomOffset?: number;
  label?: string;
}

export const ScrollToTopPill: React.FC<ScrollToTopPillProps> = ({
  visible,
  onPress,
  bottomOffset = 84,
  label,
}) => {
  const { colors, isDark } = useTheme();
  const { isBangla } = useLanguage();
  const [mounted, setMounted] = useState(visible);

  const anim = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.spring(anim, {
        toValue: 1,
        tension: 65,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(anim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible, anim]);

  if (!mounted) return null;

  const displayLabel = label || (isBangla ? 'উপরে যান' : 'Back to Top');

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [24, 0],
  });

  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1],
  });

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[
        styles.container,
        {
          bottom: bottomOffset,
          opacity: anim,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.pill,
          {
            backgroundColor: isDark ? colors.surfaceCard : '#FFFFFF',
            borderColor: colors.border,
            shadowColor: '#000000',
          },
        ]}
        onPress={() => {
          triggerHaptic('light');
          onPress();
        }}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={isBangla ? 'পৃষ্ঠার শুরুতে যান' : 'Scroll to top'}
      >
        <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="arrow-up" size={13} color={colors.primary} />
        </View>
        <Text style={[styles.label, { color: colors.text }]}>{displayLabel}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 90,
    elevation: 8,
  },
  pill: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
  },
  iconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
