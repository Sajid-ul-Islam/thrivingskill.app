import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { YouTubeVideo } from '../data/youtubeVideos';

interface YouTubeCardProps {
  video: YouTubeVideo;
  onPress: (video: YouTubeVideo) => void;
  width?: number;
  layout?: 'card' | 'horizontal';
}

export const YouTubeCard: React.FC<YouTubeCardProps> = ({
  video,
  onPress,
  width,
  layout = 'card',
}) => {
  const { colors, isDark } = useTheme();

  if (layout === 'horizontal') {
    return (
      <TouchableOpacity
        style={[
          styles.horizontalContainer,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
        onPress={() => onPress(video)}
        activeOpacity={0.8}
      >
        <View style={styles.horizontalThumbWrapper}>
          <Image source={{ uri: video.thumbnail }} style={styles.horizontalThumb} />
          {video.duration ? (
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>{video.duration}</Text>
            </View>
          ) : null}
          <View style={styles.playIconSmall}>
            <Ionicons name="play" size={12} color="#FFFFFF" />
          </View>
        </View>

        <View style={styles.horizontalInfo}>
          <Text style={[styles.horizontalTitle, { color: colors.text }]} numberOfLines={2}>
            {video.title}
          </Text>
          <View style={styles.metaRow}>
            <Text style={[styles.metaText, { color: colors.textMuted }]}>{video.views}</Text>
            {video.views && video.published ? (
              <Text style={[styles.metaDot, { color: colors.textMuted }]}>•</Text>
            ) : null}
            <Text style={[styles.metaText, { color: colors.textMuted }]}>{video.published}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.cardContainer,
        { backgroundColor: colors.surface, borderColor: colors.border },
        width ? { width } : undefined,
      ]}
      onPress={() => onPress(video)}
      activeOpacity={0.85}
    >
      <View style={styles.thumbWrapper}>
        <Image source={{ uri: video.thumbnail }} style={styles.thumbImage} />
        {video.duration ? (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{video.duration}</Text>
          </View>
        ) : null}
        <View style={styles.playOverlay}>
          <View style={styles.playButton}>
            <Ionicons name="play" size={20} color="#FFFFFF" style={{ marginLeft: 2 }} />
          </View>
        </View>
        <View style={styles.ytLogoBadge}>
          <Ionicons name="logo-youtube" size={14} color="#FF0000" />
        </View>
      </View>

      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
          {video.title}
        </Text>

        <View style={styles.footerRow}>
          <View style={styles.metaRow}>
            <Text style={[styles.metaText, { color: colors.textMuted }]}>{video.views}</Text>
            {video.views && video.published ? (
              <Text style={[styles.metaDot, { color: colors.textMuted }]}>•</Text>
            ) : null}
            <Text style={[styles.metaText, { color: colors.textMuted }]}>{video.published}</Text>
          </View>

          <View style={styles.watchNowBadge}>
            <Text style={styles.watchNowText}>Watch</Text>
            <Ionicons name="arrow-forward" size={11} color="#FF0000" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
  },
  thumbWrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000000',
    position: 'relative',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  playOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF0000',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
  ytLogoBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 8,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  metaText: {
    fontSize: 11,
  },
  metaDot: {
    fontSize: 11,
  },
  watchNowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  watchNowText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF0000',
  },
  // Horizontal layout styles
  horizontalContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
    gap: 12,
  },
  horizontalThumbWrapper: {
    width: 120,
    height: 68,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000',
  },
  horizontalThumb: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  playIconSmall: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -11 }, { translateY: -11 }],
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FF0000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  horizontalInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  horizontalTitle: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 4,
  },
});
