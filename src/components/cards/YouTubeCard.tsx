import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLearning } from '../../context/LearningContext';
import { useYouTube } from '../../context/YouTubeContext';
import { YouTubeVideo } from '../../data/youtubeVideos';
import { findRelatedCourse } from '../../services/youtubeService';
import { shape } from '../../theme/shapes';

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
  const { courses } = useLearning();
  const { isSaved, toggleSaveVideo } = useYouTube();

  const saved = isSaved(video.id);
  const relatedCourse = findRelatedCourse(video, courses);

  if (layout === 'horizontal') {
    return (
      <View
        style={[
          styles.horizontalContainer,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <TouchableOpacity
          style={{ flex: 1, flexDirection: 'row' }}
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
            {relatedCourse && (
              <View style={styles.courseBadgeMini}>
                <Ionicons name="school" size={10} color="#059669" />
                <Text style={styles.courseBadgeMiniText} numberOfLines={1}>
                  {relatedCourse.category.toUpperCase()}
                </Text>
              </View>
            )}

            <Text style={[styles.horizontalTitle, { color: colors.text }]} numberOfLines={2}>
              {video.title}
            </Text>

            <View style={styles.horizontalFooter}>
              <View style={styles.metaRow}>
                {video.views ? <Text style={[styles.metaText, { color: colors.textMuted }]}>{video.views}</Text> : null}
                {video.views && video.published ? <Text style={[styles.metaDot, { color: colors.textMuted }]}>•</Text> : null}
                {video.published ? <Text style={[styles.metaText, { color: colors.textMuted }]}>{video.published}</Text> : null}
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Bookmark button */}
        <TouchableOpacity
          style={styles.bookmarkAction}
          onPress={(e) => { e?.stopPropagation?.(); toggleSaveVideo(video.id); }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={16}
            color={saved ? '#102F53' : colors.textMuted}
          />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.cardContainer,
        { backgroundColor: colors.surface, borderColor: colors.border },
        width ? { width } : undefined,
      ]}
    >
      <TouchableOpacity
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

          {/* Play Overlay */}
          <View style={styles.playOverlay}>
            <View style={styles.playButton}>
              <Ionicons name="play" size={20} color="#FFFFFF" style={{ marginLeft: 2 }} />
            </View>
          </View>

          {/* YouTube logo badge */}
          <View style={styles.ytLogoBadge}>
            <Ionicons name="logo-youtube" size={14} color="#FF0000" />
          </View>
        </View>

        <View style={styles.cardContent}>
        {/* Course Cross-link indicator */}
        {relatedCourse && (
          <View style={styles.courseTagRow}>
            <Ionicons name="school" size={11} color="#059669" />
            <Text style={styles.courseTagText} numberOfLines={1}>
              Full Course: {relatedCourse.title}
            </Text>
          </View>
        )}

        <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
          {video.title}
        </Text>

        <View style={styles.footerRow}>
          <View style={styles.metaRow}>
            {video.views ? <Text style={[styles.metaText, { color: colors.textMuted }]}>{video.views}</Text> : null}
            {video.views && video.published ? <Text style={[styles.metaDot, { color: colors.textMuted }]}>•</Text> : null}
            {video.published ? <Text style={[styles.metaText, { color: colors.textMuted }]}>{video.published}</Text> : null}
          </View>

          <View style={styles.watchNowBadge}>
            <Text style={styles.watchNowText}>Watch</Text>
            <Ionicons name="arrow-forward" size={11} color="#FF0000" />
          </View>
        </View>
      </View>
      </TouchableOpacity>

      {/* Bookmark button on thumbnail as sibling */}
      <TouchableOpacity
        style={[styles.bookmarkThumbBtn, { backgroundColor: saved ? '#102F53' : 'rgba(0,0,0,0.6)' }]}
        onPress={(e) => { e?.stopPropagation?.(); toggleSaveVideo(video.id); }}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <Ionicons
          name={saved ? 'bookmark' : 'bookmark-outline'}
          size={14}
          color="#FFFFFF"
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: shape.large,
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
    borderRadius: shape.extraSmall,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: shape.full,
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
    borderRadius: shape.extraSmall,
  },
  bookmarkThumbBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: shape.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    padding: 12,
  },
  courseTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(5, 150, 105, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: shape.extraSmall,
    alignSelf: 'flex-start',
    marginBottom: 6,
    maxWidth: '100%',
  },
  courseTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
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
    borderRadius: shape.medium,
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
    gap: 12,
  },
  horizontalThumbWrapper: {
    width: 120,
    height: 68,
    borderRadius: shape.small,
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
    borderRadius: shape.full,
    backgroundColor: '#FF0000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  horizontalInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  courseBadgeMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 3,
  },
  courseBadgeMiniText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
  },
  horizontalTitle: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 4,
  },
  horizontalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bookmarkAction: {
    padding: 2,
  },
});
