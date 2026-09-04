import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
  Linking,
  Share,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import YoutubePlayer from 'react-native-youtube-iframe';
import { useTheme } from '../context/ThemeContext';
import { useLearning } from '../context/LearningContext';
import { useYouTube } from '../context/YouTubeContext';
import { YouTubeVideo, YOUTUBE_CHANNEL } from '../data/youtubeVideos';
import { findRelatedCourse } from '../services/youtubeService';

interface YouTubePlayerModalProps {
  visible: boolean;
  video: YouTubeVideo | null;
  onClose: () => void;
  onSelectVideo?: (video: YouTubeVideo) => void;
  onNavigateToCourse?: (courseId: string) => void;
  onMinimize?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const YouTubePlayerModal: React.FC<YouTubePlayerModalProps> = ({
  visible,
  video,
  onClose,
  onSelectVideo,
  onNavigateToCourse,
  onMinimize,
}) => {
  const { colors, isDark } = useTheme();
  const { courses } = useLearning();
  const { videos, isSaved, toggleSaveVideo, minimizePlayer } = useYouTube();
  const [currentVideo, setCurrentVideo] = useState<YouTubeVideo | null>(video);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [playerLoading, setPlayerLoading] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playerError, setPlayerError] = useState<string | null>(null);

  // Sync state if prop changes
  React.useEffect(() => {
    if (video) {
      setCurrentVideo(video);
      setPlaybackSpeed(1);
      setIsPlaying(true);
      setPlayerError(null);
      setPlayerLoading(true);
    }
  }, [video]);

  const handleSetSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
  };

  if (!currentVideo) {
    return null;
  }

  const saved = isSaved(currentVideo.id);
  const relatedCourse = findRelatedCourse(currentVideo, courses);
  const relatedVideos = videos.filter((v) => v.id !== currentVideo.id);

  const handleShare = async () => {
    try {
      await Share.share({
        title: currentVideo.title,
        message: `${currentVideo.title}\n\nWatch on Thriving Skills YouTube: ${currentVideo.url}`,
        url: currentVideo.url,
      });
    } catch {
      // Ignored
    }
  };

  const handleOpenYouTube = () => {
    Linking.openURL(currentVideo.url);
  };

  const handleOpenChannel = () => {
    Linking.openURL(YOUTUBE_CHANNEL.url);
  };

  const handleSelectRelated = (v: YouTubeVideo) => {
    setCurrentVideo(v);
    setIsPlaying(true);
    setPlayerError(null);
    setPlayerLoading(true);
    if (onSelectVideo) {
      onSelectVideo(v);
    }
  };

  const handleMinimize = () => {
    if (onMinimize) {
      onMinimize();
    } else {
      minimizePlayer();
    }
  };

  const handleCoursePress = () => {
    if (relatedCourse && onNavigateToCourse) {
      onClose();
      onNavigateToCourse(relatedCourse.id);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header Bar */}
        <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
          {/* Minimize / Down Arrow */}
          <TouchableOpacity
            style={[styles.headerBtn, { backgroundColor: isDark ? '#333' : '#E5E7EB' }]}
            onPress={handleMinimize}
            accessibilityLabel="Minimize player"
          >
            <Ionicons name="chevron-down" size={20} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.ytBadge}>
            <Ionicons name="logo-youtube" size={18} color="#FF0000" />
            <Text style={styles.ytBadgeText}>YouTube Player</Text>
          </View>

          {/* Close Button */}
          <TouchableOpacity
            style={[styles.headerBtn, { backgroundColor: isDark ? '#333' : '#E5E7EB' }]}
            onPress={onClose}
            accessibilityLabel="Close player"
          >
            <Ionicons name="close" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Player Section (16:9 aspect ratio) */}
        <View style={styles.playerContainer}>
          {Platform.OS === 'web' ? (
            <iframe
              src={`https://www.youtube.com/embed/${currentVideo.id}?autoplay=1&playsinline=1`}
              style={{ width: '100%', height: '100%', border: 'none' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <View style={{ width: SCREEN_WIDTH, height: (SCREEN_WIDTH * 9) / 16, position: 'relative' }}>
              <YoutubePlayer
                height={(SCREEN_WIDTH * 9) / 16}
                width={SCREEN_WIDTH}
                play={isPlaying}
                videoId={currentVideo.id}
                playbackRate={playbackSpeed}
                onReady={() => setPlayerLoading(false)}
                onChangeState={(state: string) => {
                  if (state === 'ended') setIsPlaying(false);
                }}
                onError={(error: string) => {
                  setPlayerError(error);
                  setPlayerLoading(false);
                }}
                initialPlayerParams={{
                  controls: true,
                  modestbranding: true,
                  preventFullScreen: false,
                  rel: false,
                }}
                webViewProps={{
                  androidLayerType: 'hardware',
                  allowsInlineMediaPlayback: true,
                }}
              />
              {playerLoading && !playerError && (
                <View style={styles.playerLoadingOverlay}>
                  <ActivityIndicator size="small" color="#FF0000" />
                  <Text style={styles.playerLoadingText}>Loading video...</Text>
                </View>
              )}
              {playerError && (
                <View style={styles.playerErrorOverlay}>
                  <Ionicons name="alert-circle-outline" size={26} color="#EF4444" />
                  <Text style={styles.playerErrorText}>
                    Playback error ({playerError})
                  </Text>
                  <TouchableOpacity style={styles.errorOpenBtn} onPress={handleOpenYouTube}>
                    <Ionicons name="logo-youtube" size={14} color="#FFFFFF" />
                    <Text style={styles.errorOpenBtnText}>Watch in YouTube App</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Fast YouTube App Fallback Bar */}
        <TouchableOpacity
          style={[styles.quickYtFallback, { backgroundColor: isDark ? '#27272A' : '#FEF2F2' }]}
          onPress={handleOpenYouTube}
          activeOpacity={0.8}
        >
          <Ionicons name="logo-youtube" size={15} color="#FF0000" />
          <Text style={[styles.quickYtFallbackText, { color: isDark ? '#FCA5A5' : '#DC2626' }]}>
            Having playback trouble? Tap to open in YouTube app
          </Text>
          <Ionicons name="open-outline" size={13} color="#FF0000" />
        </TouchableOpacity>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Video Metadata Card */}
          <View style={[styles.metaCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.videoTitle, { color: colors.text }]}>{currentVideo.title}</Text>

            <View style={styles.statsRow}>
              {currentVideo.duration ? (
                <View style={styles.statBadge}>
                  <Ionicons name="time-outline" size={13} color={colors.textMuted} />
                  <Text style={[styles.statText, { color: colors.textMuted }]}>{currentVideo.duration}</Text>
                </View>
              ) : null}

              {currentVideo.views ? (
                <View style={styles.statBadge}>
                  <Ionicons name="eye-outline" size={13} color={colors.textMuted} />
                  <Text style={[styles.statText, { color: colors.textMuted }]}>{currentVideo.views}</Text>
                </View>
              ) : null}

              {currentVideo.published ? (
                <View style={styles.statBadge}>
                  <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
                  <Text style={[styles.statText, { color: colors.textMuted }]}>{currentVideo.published}</Text>
                </View>
              ) : null}
            </View>

            {/* Action Buttons Row */}
            <View style={styles.actionRow}>
              {/* Save to Watch Later Toggle */}
              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  saved
                    ? { backgroundColor: '#102E52', borderColor: '#102E52' }
                    : { backgroundColor: colors.background, borderColor: colors.border },
                ]}
                onPress={() => toggleSaveVideo(currentVideo.id)}
              >
                <Ionicons
                  name={saved ? 'bookmark' : 'bookmark-outline'}
                  size={16}
                  color={saved ? '#FFFFFF' : colors.text}
                />
                <Text
                  style={[
                    styles.saveBtnText,
                    { color: saved ? '#FFFFFF' : colors.text, fontWeight: saved ? '700' : '600' },
                  ]}
                >
                  {saved ? 'Saved' : 'Watch Later'}
                </Text>
              </TouchableOpacity>

              {/* Share */}
              <TouchableOpacity
                style={[styles.shareBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
                onPress={handleShare}
              >
                <Ionicons name="share-social-outline" size={16} color={colors.text} />
                <Text style={[styles.shareBtnText, { color: colors.text }]}>Share</Text>
              </TouchableOpacity>

              {/* Open in YouTube */}
              <TouchableOpacity style={styles.openYouTubeBtn} onPress={handleOpenYouTube}>
                <Ionicons name="logo-youtube" size={16} color="#FFFFFF" />
                <Text style={styles.openYouTubeText}>YouTube</Text>
              </TouchableOpacity>
            </View>

            {/* Playback Speed Controls */}
            <View style={[styles.speedRow, { borderTopColor: colors.border }]}>
              <View style={styles.speedLabelWrapper}>
                <Ionicons name="speedometer-outline" size={14} color={colors.textMuted} />
                <Text style={[styles.speedLabel, { color: colors.textMuted }]}>Speed</Text>
              </View>
              <View style={styles.speedPills}>
                {[0.75, 1, 1.25, 1.5, 2].map((spd) => {
                  const isActive = playbackSpeed === spd;
                  return (
                    <TouchableOpacity
                      key={spd}
                      style={[
                        styles.speedPill,
                        {
                          backgroundColor: isActive ? colors.primary : isDark ? '#2C2C2E' : '#F3F4F6',
                          borderColor: isActive ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => handleSetSpeed(spd)}
                      accessibilityLabel={`Set playback speed to ${spd}x`}
                    >
                      <Text
                        style={[
                          styles.speedPillText,
                          {
                            color: isActive ? '#FFFFFF' : colors.text,
                            fontWeight: isActive ? '800' : '600',
                          },
                        ]}
                      >
                        {spd === 1 ? '1.0x' : `${spd}x`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Course Cross-Linking Card (Free-to-Paid Conversion) */}
          {relatedCourse && onNavigateToCourse && (
            <View style={[styles.coursePromoCard, { backgroundColor: isDark ? '#16283C' : '#EEF6FF', borderColor: colors.primary }]}>
              <View style={styles.promoHeaderRow}>
                <View style={styles.badgePill}>
                  <Ionicons name="school" size={13} color="#059669" />
                  <Text style={styles.badgePillText}>FULL ACCREDITED COURSE</Text>
                </View>
                <Text style={styles.certificateTag}>Includes Certificate</Text>
              </View>

              <Text style={[styles.coursePromoTitle, { color: colors.text }]}>
                {relatedCourse.title}
              </Text>
              <Text style={[styles.coursePromoSub, { color: colors.textMuted }]} numberOfLines={2}>
                {relatedCourse.subtitle}
              </Text>

              <View style={styles.courseMetaRow}>
                <View style={styles.courseMetaItem}>
                  <Ionicons name="star" size={13} color="#F59E0B" />
                  <Text style={[styles.courseMetaText, { color: colors.text }]}>{relatedCourse.rating}</Text>
                </View>
                <Text style={styles.courseMetaDot}>•</Text>
                <View style={styles.courseMetaItem}>
                  <Ionicons name="time-outline" size={13} color={colors.textMuted} />
                  <Text style={[styles.courseMetaText, { color: colors.textMuted }]}>{relatedCourse.durationHours} hrs</Text>
                </View>
                <Text style={styles.courseMetaDot}>•</Text>
                <View style={styles.courseMetaItem}>
                  <Ionicons name="people-outline" size={13} color={colors.textMuted} />
                  <Text style={[styles.courseMetaText, { color: colors.textMuted }]}>{relatedCourse.enrolledCount} enrolled</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.viewCourseBtn} onPress={handleCoursePress}>
                <Text style={styles.viewCourseBtnText}>Enroll in Full Course & Syllabus</Text>
                <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}

          {/* Channel Banner */}
          <TouchableOpacity
            style={[styles.channelCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={handleOpenChannel}
          >
            <View style={styles.channelAvatar}>
              <Ionicons name="logo-youtube" size={24} color="#FF0000" />
            </View>
            <View style={styles.channelInfo}>
              <Text style={[styles.channelName, { color: colors.text }]}>{YOUTUBE_CHANNEL.name}</Text>
              <Text style={[styles.channelHandle, { color: colors.textMuted }]}>{YOUTUBE_CHANNEL.handle}</Text>
            </View>
            <View style={styles.subscribeBtn}>
              <Text style={styles.subscribeText}>Visit Channel</Text>
            </View>
          </TouchableOpacity>

          {/* More Videos from Channel */}
          <View style={styles.relatedSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>More Masterclasses</Text>
              <Text style={[styles.sectionCount, { color: colors.textMuted }]}>
                {relatedVideos.length} videos
              </Text>
            </View>

            {relatedVideos.slice(0, 15).map((rel) => {
              return (
                <TouchableOpacity
                  key={rel.id}
                  style={[styles.relatedCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => handleSelectRelated(rel)}
                  activeOpacity={0.8}
                >
                  <View style={styles.relatedThumbContainer}>
                    <Image source={{ uri: rel.thumbnail }} style={styles.relatedThumb} />
                    {rel.duration ? (
                      <View style={styles.relatedDurationBadge}>
                        <Text style={styles.durationBadgeText}>{rel.duration}</Text>
                      </View>
                    ) : null}
                    <View style={styles.playOverlayMini}>
                      <Ionicons name="play" size={14} color="#FFFFFF" />
                    </View>
                  </View>

                  <View style={styles.relatedContent}>
                    <Text style={[styles.relatedTitle, { color: colors.text }]} numberOfLines={2}>
                      {rel.title}
                    </Text>
                    <View style={styles.relatedMeta}>
                      {rel.views ? <Text style={[styles.relatedMetaText, { color: colors.textMuted }]}>{rel.views}</Text> : null}
                      {rel.views && rel.published ? <Text style={[styles.relatedMetaDot, { color: colors.textMuted }]}>•</Text> : null}
                      {rel.published ? <Text style={[styles.relatedMetaText, { color: colors.textMuted }]}>{rel.published}</Text> : null}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ytBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ytBadgeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF0000',
  },
  playerContainer: {
    width: SCREEN_WIDTH,
    height: (SCREEN_WIDTH * 9) / 16,
    backgroundColor: '#000000',
  },
  webView: {
    flex: 1,
    backgroundColor: '#000000',
  },
  playerLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  playerLoadingText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  quickYtFallback: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  quickYtFallbackText: {
    fontSize: 12,
    fontWeight: '600',
  },
  playerErrorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  playerErrorText: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorOpenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    marginTop: 4,
  },
  errorOpenBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  metaCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  videoTitle: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 24,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  saveBtnText: {
    fontSize: 13,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  shareBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  openYouTubeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#FF0000',
  },
  openYouTubeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  // Speed Row
  speedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  speedLabelWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  speedLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  speedPills: {
    flexDirection: 'row',
    gap: 6,
  },
  speedPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedPillText: {
    fontSize: 11,
  },
  // Course Cross-Linking Card
  coursePromoCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 8,
  },
  promoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(5, 150, 105, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  certificateTag: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  coursePromoTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  coursePromoSub: {
    fontSize: 12,
    lineHeight: 16,
  },
  courseMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  courseMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  courseMetaText: {
    fontSize: 12,
    fontWeight: '600',
  },
  courseMetaDot: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  viewCourseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#102E52',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 6,
  },
  viewCourseBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  // Channel Card
  channelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  channelAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 0, 0, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelInfo: {
    flex: 1,
  },
  channelName: {
    fontSize: 15,
    fontWeight: '700',
  },
  channelHandle: {
    fontSize: 12,
    marginTop: 2,
  },
  subscribeBtn: {
    backgroundColor: '#102E52',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  subscribeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  relatedSection: {
    marginTop: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionCount: {
    fontSize: 12,
  },
  relatedCard: {
    flexDirection: 'row',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  relatedThumbContainer: {
    width: 120,
    height: 68,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000',
  },
  relatedThumb: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  relatedDurationBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  playOverlayMini: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  relatedContent: {
    flex: 1,
    justifyContent: 'center',
  },
  relatedTitle: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 4,
  },
  relatedMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  relatedMetaText: {
    fontSize: 11,
  },
  relatedMetaDot: {
    fontSize: 11,
  },
});
