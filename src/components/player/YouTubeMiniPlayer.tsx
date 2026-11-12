import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useYouTube } from '../../context/YouTubeContext';
import { SpringPressable } from '../common/SpringPressable';
import { shape } from '../../theme/shapes';
import { MIN_TOUCH_TARGET } from '../../theme/typography';

interface YouTubeMiniPlayerProps {
  bottomOffset?: number;
}

export const YouTubeMiniPlayer: React.FC<YouTubeMiniPlayerProps> = ({ bottomOffset = 64 }) => {
  const { colors, isDark } = useTheme();
  const { activeVideo, playerMode, maximizePlayer, closePlayer } = useYouTube();

  const translateY = useRef(new Animated.Value(70)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const isClosingRef = useRef(false);

  useEffect(() => {
    if (playerMode === 'mini' && activeVideo) {
      isClosingRef.current = false;
      translateY.setValue(70);
      opacity.setValue(0);

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [playerMode, activeVideo?.id]);

  const handleDismiss = () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 70,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start(() => {
      closePlayer();
      isClosingRef.current = false;
    });
  };

  if (playerMode !== 'mini' || !activeVideo) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          bottom: bottomOffset,
          backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
          borderColor: colors.border,
          shadowColor: '#000',
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      {/* Tap anywhere on main area to restore full player */}
      <TouchableOpacity
        style={styles.mainContent}
        onPress={maximizePlayer}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`Resume watching ${activeVideo.title}`}
      >
        <View style={styles.thumbnailWrapper}>
          <Image source={{ uri: activeVideo.thumbnail }} style={styles.thumbnail} />
          <View style={styles.playDot}>
            <Ionicons name="play" size={10} color="#FFFFFF" />
          </View>
        </View>

        <View style={styles.infoContainer}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {activeVideo.title}
          </Text>
          <View style={styles.subRow}>
            <View style={styles.liveIndicator} />
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Playing in background • Tap to expand
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Control Buttons */}
      <View style={styles.controlsRow}>
        <SpringPressable
          style={[styles.controlBtn, { backgroundColor: isDark ? '#2C2C2E' : '#F3F4F6' }]}
          onPress={maximizePlayer}
          activeScale={0.88}
          accessibilityLabel="Expand video"
        >
          <Ionicons name="expand-outline" size={18} color={colors.text} />
        </SpringPressable>

        <SpringPressable
          style={[styles.controlBtn, { backgroundColor: isDark ? '#2C2C2E' : '#F3F4F6' }]}
          onPress={handleDismiss}
          activeScale={0.88}
          accessibilityLabel="Close player"
        >
          <Ionicons name="close" size={18} color={colors.text} />
        </SpringPressable>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 12,
    right: 12,
    minHeight: 60,
    borderRadius: shape.large,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    zIndex: 9999,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  thumbnailWrapper: {
    width: 64,
    height: 40,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  playDot: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    backgroundColor: '#FF0000',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF0000',
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '500',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 6,
  },
  controlBtn: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: shape.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
