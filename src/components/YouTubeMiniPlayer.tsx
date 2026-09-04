import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useYouTube } from '../context/YouTubeContext';

interface YouTubeMiniPlayerProps {
  bottomOffset?: number;
}

export const YouTubeMiniPlayer: React.FC<YouTubeMiniPlayerProps> = ({ bottomOffset = 64 }) => {
  const { colors, isDark } = useTheme();
  const { activeVideo, playerMode, maximizePlayer, closePlayer } = useYouTube();

  if (playerMode !== 'mini' || !activeVideo) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        {
          bottom: bottomOffset,
          backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
          borderColor: colors.border,
          shadowColor: '#000',
        },
      ]}
    >
      {/* Tap anywhere on main area to restore full player */}
      <TouchableOpacity
        style={styles.mainContent}
        onPress={maximizePlayer}
        activeOpacity={0.85}
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
        <TouchableOpacity
          style={[styles.controlBtn, { backgroundColor: isDark ? '#2C2C2E' : '#F3F4F6' }]}
          onPress={maximizePlayer}
          accessibilityLabel="Expand video"
        >
          <Ionicons name="expand-outline" size={18} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlBtn, { backgroundColor: isDark ? '#2C2C2E' : '#F3F4F6' }]}
          onPress={closePlayer}
          accessibilityLabel="Close player"
        >
          <Ionicons name="close" size={18} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 12,
    right: 12,
    height: 56,
    borderRadius: 14,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
