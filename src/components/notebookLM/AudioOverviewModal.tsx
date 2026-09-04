import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Share,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { AudioOverviewPodcast, PodcastDialogueItem } from '../../types/notebookLM';
import { NotebookLMService } from '../../services/notebookLMService';

interface AudioOverviewModalProps {
  visible: boolean;
  onClose: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const AudioOverviewModal: React.FC<AudioOverviewModalProps> = ({
  visible,
  onClose,
}) => {
  const { colors, isDark } = useTheme();
  const [podcast, setPodcast] = useState<AudioOverviewPodcast>(
    NotebookLMService.getAudioOverview()
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentSec, setCurrentSec] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [activeTab, setActiveTab] = useState<'transcript' | 'takeaways'>('transcript');
  const scrollViewRef = useRef<ScrollView>(null);

  // Playback ticker simulation
  useEffect(() => {
    if (!visible) {
      setIsPlaying(false);
      setCurrentSec(0);
      return;
    }
    setIsPlaying(true);
  }, [visible]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentSec((prev) => {
          const next = prev + 1 * playbackSpeed;
          if (next >= podcast.durationSec) {
            setIsPlaying(false);
            return podcast.durationSec;
          }
          return next;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, playbackSpeed, podcast.durationSec]);

  // Find currently speaking dialogue line
  const currentDialogueIndex = podcast.dialogue.reduce(
    (acc, item, index) => (currentSec >= item.timestampSec ? index : acc),
    0
  );
  const activeSpeaker = podcast.dialogue[currentDialogueIndex]?.speaker || 'Alex';

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSeek = (targetSec: number) => {
    setCurrentSec(Math.min(podcast.durationSec, Math.max(0, targetSec)));
  };

  const handleCycleSpeed = () => {
    const speeds = [0.75, 1.0, 1.25, 1.5, 2.0];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextIdx]);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: podcast.title,
        message: `🎙️ Listen to this AI Deep Dive Audio Overview on Thriving Skills: "${podcast.title}" synthesized from live course sources!`,
      });
    } catch {
      // ignore
    }
  };

  // Waveform bars simulation
  const waveBars = [
    18, 32, 50, 24, 40, 58, 22, 38, 48, 30, 44, 56, 18, 34, 52, 28, 42, 48, 32, 22, 36, 44,
  ];

  const progressPercent = Math.min(100, (currentSec / podcast.durationSec) * 100);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Modal Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.surfaceSubtle }]}
            onPress={onClose}
          >
            <Ionicons name="close" size={20} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.headerTitleCol}>
            <View style={styles.badgeRow}>
              <View style={styles.sparkleBadge}>
                <Ionicons name="sparkles" size={12} color="#FFFFFF" />
                <Text style={styles.sparkleBadgeText}>NotebookLM Audio Overview</Text>
              </View>
            </View>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
              {podcast.title}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.surfaceSubtle }]}
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={19} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Podcast Stage & Waveform Player */}
        <View style={[styles.playerCard, { backgroundColor: isDark ? '#0F192C' : '#102F53' }]}>
          {/* Active Speaker Cards */}
          <View style={styles.hostsRow}>
            {podcast.speakers.map((spk) => {
              const isSpeakingNow = isPlaying && activeSpeaker === spk.name;
              return (
                <View
                  key={spk.name}
                  style={[
                    styles.hostBadge,
                    isSpeakingNow && styles.hostBadgeActive,
                  ]}
                >
                  <View
                    style={[
                      styles.hostAvatar,
                      {
                        backgroundColor:
                          spk.name === 'Alex' ? '#1D4476' : '#E34234',
                      },
                    ]}
                  >
                    <Ionicons
                      name={spk.name === 'Alex' ? 'mic' : 'headset'}
                      size={14}
                      color="#FFFFFF"
                    />
                  </View>
                  <View>
                    <Text style={styles.hostName}>{spk.name}</Text>
                    <Text style={styles.hostRole}>{spk.role}</Text>
                  </View>
                  {isSpeakingNow && (
                    <View style={styles.liveIndicator}>
                      <Text style={styles.liveText}>Speaking</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* Oscillating Soundwave */}
          <View style={styles.waveformRow}>
            {waveBars.map((height, idx) => {
              const animatedH = isPlaying
                ? Math.max(10, Math.sin(currentSec * 2 + idx) * height)
                : 10;
              return (
                <View
                  key={idx}
                  style={[
                    styles.waveBar,
                    {
                      height: animatedH,
                      backgroundColor:
                        idx % 3 === 0
                          ? '#FFB606'
                          : idx % 3 === 1
                          ? '#E34234'
                          : '#3B82F6',
                    },
                  ]}
                />
              );
            })}
          </View>

          {/* Progress Slider Bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>{formatTime(currentSec)}</Text>
              <Text style={styles.timeText}>{podcast.durationFormatted}</Text>
            </View>
          </View>

          {/* Player Transport Controls */}
          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={styles.speedBtn}
              onPress={handleCycleSpeed}
            >
              <Text style={styles.speedText}>{playbackSpeed}x</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipBtn}
              onPress={() => handleSeek(currentSec - 15)}
            >
              <Ionicons name="play-back" size={20} color="#FFFFFF" />
              <Text style={styles.skipText}>-15s</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.playPauseBtn, { backgroundColor: '#E34234' }]}
              onPress={() => setIsPlaying(!isPlaying)}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={26}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipBtn}
              onPress={() => handleSeek(currentSec + 30)}
            >
              <Ionicons name="play-forward" size={20} color="#FFFFFF" />
              <Text style={styles.skipText}>+30s</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.restartBtn}
              onPress={() => handleSeek(0)}
            >
              <Ionicons name="refresh" size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Switcher: Live Transcript vs Key Takeaways */}
        <View style={[styles.tabBar, { backgroundColor: colors.surfaceCard, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === 'transcript' && [styles.tabBtnActive, { borderColor: colors.primary }],
            ]}
            onPress={() => setActiveTab('transcript')}
          >
            <Ionicons
              name="chatbubbles-outline"
              size={16}
              color={activeTab === 'transcript' ? colors.primary : colors.textMuted}
            />
            <Text
              style={[
                styles.tabBtnText,
                { color: activeTab === 'transcript' ? colors.primary : colors.textMuted },
                activeTab === 'transcript' && { fontWeight: '700' },
              ]}
            >
              Live Transcript ({podcast.dialogue.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === 'takeaways' && [styles.tabBtnActive, { borderColor: colors.primary }],
            ]}
            onPress={() => setActiveTab('takeaways')}
          >
            <Ionicons
              name="bulb-outline"
              size={16}
              color={activeTab === 'takeaways' ? colors.primary : colors.textMuted}
            />
            <Text
              style={[
                styles.tabBtnText,
                { color: activeTab === 'takeaways' ? colors.primary : colors.textMuted },
                activeTab === 'takeaways' && { fontWeight: '700' },
              ]}
            >
              Key Takeaways
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content Area */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'transcript' ? (
            <View style={styles.dialogueList}>
              <Text style={[styles.interactiveNotice, { color: colors.textMuted }]}>
                💡 Tap any dialogue line to jump audio directly to that moment
              </Text>

              {podcast.dialogue.map((item: PodcastDialogueItem, idx: number) => {
                const isCurrentTurn = currentDialogueIndex === idx;
                const isAlex = item.speaker === 'Alex';

                return (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.7}
                    style={[
                      styles.dialogueCard,
                      {
                        backgroundColor: isCurrentTurn
                          ? isDark
                            ? '#1E293B'
                            : '#EFF6FF'
                          : colors.surfaceCard,
                        borderColor: isCurrentTurn
                          ? colors.primary
                          : colors.border,
                      },
                    ]}
                    onPress={() => handleSeek(item.timestampSec)}
                  >
                    <View style={styles.dialogueHeader}>
                      <View style={styles.speakerPill}>
                        <View
                          style={[
                            styles.miniDot,
                            { backgroundColor: isAlex ? '#102F53' : '#E34234' },
                          ]}
                        />
                        <Text
                          style={[
                            styles.dialogueSpeaker,
                            { color: isAlex ? colors.primary : '#E34234' },
                          ]}
                        >
                          {item.speaker}
                        </Text>
                        <Text style={[styles.speakerRoleText, { color: colors.textMuted }]}>
                          • {item.speakerRole}
                        </Text>
                      </View>

                      <View style={styles.timeTag}>
                        <Ionicons name="time-outline" size={12} color={colors.textMuted} />
                        <Text style={[styles.timeTagText, { color: colors.textMuted }]}>
                          {item.timestampFormatted}
                        </Text>
                      </View>
                    </View>

                    <Text
                      style={[
                        styles.dialogueBody,
                        { color: colors.text },
                        isCurrentTurn && { fontWeight: '600' },
                      ]}
                    >
                      {item.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.takeawaysContainer}>
              <View style={[styles.takeawayBanner, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
                <Ionicons name="sparkles" size={20} color="#FFB606" />
                <Text style={[styles.takeawayBannerTitle, { color: colors.text }]}>
                  Synthesized Executive Summary
                </Text>
              </View>

              {podcast.keyTakeaways.map((point, i) => (
                <View
                  key={i}
                  style={[
                    styles.takeawayCard,
                    { backgroundColor: colors.surfaceCard, borderColor: colors.border },
                  ]}
                >
                  <View style={[styles.pointNumber, { backgroundColor: colors.primary }]}>
                    <Text style={styles.pointNumberText}>{i + 1}</Text>
                  </View>
                  <Text style={[styles.takeawayText, { color: colors.text }]}>{point}</Text>
                </View>
              ))}
            </View>
          )}
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
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerTitleCol: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sparkleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  sparkleBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerCard: {
    margin: 16,
    padding: 16,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  hostsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 16,
  },
  hostBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 8,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  hostBadgeActive: {
    borderColor: '#FFB606',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  hostAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  hostRole: {
    color: '#94A3B8',
    fontSize: 10,
  },
  liveIndicator: {
    marginLeft: 'auto',
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  liveText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  waveformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    gap: 5,
    marginVertical: 10,
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
  },
  progressSection: {
    marginTop: 6,
    marginBottom: 14,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFB606',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  timeText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 4,
  },
  speedBtn: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  speedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  skipBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
  playPauseBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E34234',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  restartBtn: {
    padding: 6,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderColor: 'transparent',
  },
  tabBtnActive: {
    borderColor: '#102F53',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '500',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  dialogueList: {
    gap: 12,
  },
  interactiveNotice: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 6,
    fontStyle: 'italic',
  },
  dialogueCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  dialogueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  speakerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dialogueSpeaker: {
    fontSize: 13,
    fontWeight: '800',
  },
  speakerRoleText: {
    fontSize: 11,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dialogueBody: {
    fontSize: 13.5,
    lineHeight: 20,
  },
  takeawaysContainer: {
    gap: 12,
  },
  takeawayBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    marginBottom: 4,
  },
  takeawayBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  takeawayCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  pointNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  pointNumberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  takeawayText: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: 20,
    fontWeight: '500',
  },
});
