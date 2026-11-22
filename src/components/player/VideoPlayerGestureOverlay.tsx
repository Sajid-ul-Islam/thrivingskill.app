import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  LayoutChangeEvent,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { triggerHaptic } from '../../utils/haptics';
import { MIN_TOUCH_TARGET } from '../../theme/typography';
import { shape } from '../../theme/shapes';

export interface VideoPlayerGestureOverlayProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentPositionSeconds: number;
  totalDurationSeconds: number;
  onSeekTo: (seconds: number) => void;
  onRewind: (seconds?: number) => void;
  onForward: (seconds?: number) => void;
  playbackSpeed: string;
  onCycleSpeed: () => void;
  videoQuality: string;
  onOpenQualityModal: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onTriggerPiP: () => void;
  title: string;
  subtitle?: string;
  isLocked: boolean;
  onToggleLock: () => void;
}

const formatSeconds = (sec: number): string => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const VideoPlayerGestureOverlay: React.FC<VideoPlayerGestureOverlayProps> = ({
  isPlaying,
  onTogglePlay,
  currentPositionSeconds,
  totalDurationSeconds,
  onSeekTo,
  onRewind,
  onForward,
  playbackSpeed,
  onCycleSpeed,
  videoQuality,
  onOpenQualityModal,
  isFullscreen,
  onToggleFullscreen,
  onTriggerPiP,
  title,
  subtitle,
  isLocked,
  onToggleLock,
}) => {
  const [controlsVisible, setControlsVisible] = useState<boolean>(true);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 360, height: 202 });

  // Ripple feedback states for double-tap seek
  const [leftRippleActive, setLeftRippleActive] = useState<boolean>(false);
  const [rightRippleActive, setRightRippleActive] = useState<boolean>(false);
  const leftRippleAnim = useRef(new Animated.Value(0)).current;
  const rightRippleAnim = useRef(new Animated.Value(0)).current;

  // Edge gesture states: brightness (left) & volume (right)
  const [brightnessLevel, setBrightnessLevel] = useState<number>(75);
  const [volumeLevel, setVolumeLevel] = useState<number>(80);
  const [hudType, setHudType] = useState<'brightness' | 'volume' | null>(null);

  // Timer refs conforming to AGENTS.md Rule 3
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hudTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const singleTapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapRef = useRef<{ time: number; x: number }>({ time: 0, x: 0 });
  const touchStartRef = useRef<{ x: number; y: number; edge: 'left' | 'right' | 'none'; initialVal: number }>({
    x: 0,
    y: 0,
    edge: 'none',
    initialVal: 0,
  });

  // Keep state refs up to date
  const isLockedRef = useRef<boolean>(isLocked);
  isLockedRef.current = isLocked;
  const brightnessRef = useRef<number>(brightnessLevel);
  brightnessRef.current = brightnessLevel;
  const volumeRef = useRef<number>(volumeLevel);
  volumeRef.current = volumeLevel;

  // Teardown timers on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (hudTimeoutRef.current) clearTimeout(hudTimeoutRef.current);
      if (singleTapTimeoutRef.current) clearTimeout(singleTapTimeoutRef.current);
    };
  }, []);

  // Auto-hide controls after 3 seconds of inactivity if playing
  const resetControlsTimer = () => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying && !isLocked) {
      controlsTimeoutRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, 3000);
    }
  };

  useEffect(() => {
    if (controlsVisible && isPlaying && !isLocked) {
      resetControlsTimer();
    }
  }, [controlsVisible, isPlaying, isLocked]);

  const showHud = (type: 'brightness' | 'volume') => {
    setHudType(type);
    if (hudTimeoutRef.current) clearTimeout(hudTimeoutRef.current);
    hudTimeoutRef.current = setTimeout(() => {
      setHudType(null);
    }, 1400);
  };

  const triggerDoubleTapSeek = (isLeft: boolean) => {
    triggerHaptic('light');
    if (isLeft) {
      onRewind(10);
      setLeftRippleActive(true);
      leftRippleAnim.setValue(0);
      Animated.sequence([
        Animated.timing(leftRippleAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(leftRippleAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start(() => setLeftRippleActive(false));
    } else {
      onForward(10);
      setRightRippleActive(true);
      rightRippleAnim.setValue(0);
      Animated.sequence([
        Animated.timing(rightRippleAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(rightRippleAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start(() => setRightRippleActive(false));
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const width = dimensions.width || 360;
        const isLeftEdge = locationX < width * 0.35;
        const isRightEdge = locationX > width * 0.65;

        touchStartRef.current = {
          x: locationX,
          y: locationY,
          edge: isLeftEdge ? 'left' : isRightEdge ? 'right' : 'none',
          initialVal: isLeftEdge ? brightnessRef.current : isRightEdge ? volumeRef.current : 0,
        };
      },
      onPanResponderMove: (_, gestureState) => {
        if (isLockedRef.current) return;

        const { edge, initialVal } = touchStartRef.current;
        if (edge === 'none') return;

        // Vertical swipe sensitivity: -dy increases value, +dy decreases
        const height = dimensions.height || 200;
        const deltaPercent = Math.round((-gestureState.dy / height) * 100);
        const newVal = Math.max(0, Math.min(100, initialVal + deltaPercent));

        if (edge === 'left') {
          setBrightnessLevel(newVal);
          showHud('brightness');
        } else if (edge === 'right') {
          setVolumeLevel(newVal);
          showHud('volume');
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        const isSwipe = Math.abs(gestureState.dy) > 10 || Math.abs(gestureState.dx) > 10;
        if (isSwipe) return;

        // Handle Tap / Double Tap
        const now = Date.now();
        const { locationX } = evt.nativeEvent;
        const last = lastTapRef.current;
        const delta = now - last.time;

        if (isLockedRef.current) {
          // If locked, tapping just pulses the lock indicator / button
          triggerHaptic('light');
          setControlsVisible(true);
          resetControlsTimer();
          return;
        }

        if (delta < 320 && Math.abs(locationX - last.x) < 80) {
          // Double Tap Detected!
          if (singleTapTimeoutRef.current) {
            clearTimeout(singleTapTimeoutRef.current);
            singleTapTimeoutRef.current = null;
          }
          lastTapRef.current = { time: 0, x: 0 };
          const isLeft = locationX < (dimensions.width || 360) / 2;
          triggerDoubleTapSeek(isLeft);
        } else {
          // First tap recorded, defer single tap toggle to distinguish from double tap
          lastTapRef.current = { time: now, x: locationX };
          if (singleTapTimeoutRef.current) clearTimeout(singleTapTimeoutRef.current);
          singleTapTimeoutRef.current = setTimeout(() => {
            setControlsVisible((prev) => !prev);
            resetControlsTimer();
          }, 320);
        }
      },
    })
  ).current;

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setDimensions({ width, height });
    }
  };

  const percent = totalDurationSeconds > 0
    ? Math.min(100, Math.max(0, (currentPositionSeconds / totalDurationSeconds) * 100))
    : 0;

  return (
    <View style={styles.overlayContainer} onLayout={onLayout} {...panResponder.panHandlers}>
      {/* DOUBLE TAP REWIND RIPPLE (LEFT) */}
      {leftRippleActive && (
        <Animated.View
          style={[
            styles.seekRippleBubble,
            styles.leftRipplePos,
            {
              opacity: leftRippleAnim,
              transform: [
                {
                  scale: leftRippleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.6, 1.2],
                  }),
                },
              ],
            },
          ]}
          pointerEvents="none"
        >
          <Ionicons name="play-back" size={28} color="#FFFFFF" />
          <Text style={styles.seekRippleText}>10s</Text>
        </Animated.View>
      )}

      {/* DOUBLE TAP FORWARD RIPPLE (RIGHT) */}
      {rightRippleActive && (
        <Animated.View
          style={[
            styles.seekRippleBubble,
            styles.rightRipplePos,
            {
              opacity: rightRippleAnim,
              transform: [
                {
                  scale: rightRippleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.6, 1.2],
                  }),
                },
              ],
            },
          ]}
          pointerEvents="none"
        >
          <Ionicons name="play-forward" size={28} color="#FFFFFF" />
          <Text style={styles.seekRippleText}>10s</Text>
        </Animated.View>
      )}

      {/* VERTICAL EDGE SWIPE HUD (BRIGHTNESS / VOLUME) */}
      {hudType !== null && (
        <View style={styles.hudOverlay} pointerEvents="none">
          <View style={styles.hudCard}>
            <Ionicons
              name={
                hudType === 'brightness'
                  ? brightnessLevel > 50
                    ? 'sunny'
                    : 'sunny-outline'
                  : volumeLevel === 0
                  ? 'volume-mute'
                  : volumeLevel > 50
                  ? 'volume-high'
                  : 'volume-medium'
              }
              size={22}
              color="#FFFFFF"
            />
            <View style={styles.hudProgressBarTrack}>
              <View
                style={[
                  styles.hudProgressBarFill,
                  {
                    height: `${hudType === 'brightness' ? brightnessLevel : volumeLevel}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.hudPercentText}>
              {hudType === 'brightness' ? brightnessLevel : volumeLevel}%
            </Text>
          </View>
        </View>
      )}

      {/* SCREEN LOCKED FLOATING PADLOCK BADGE */}
      {isLocked ? (
        <View style={styles.lockedContainer}>
          <TouchableOpacity
            style={styles.padlockUnlockBtn}
            onPress={() => {
              triggerHaptic('medium');
              onToggleLock();
            }}
            accessibilityRole="button"
            accessibilityLabel="Screen is locked. Tap to unlock screen controls."
          >
            <Ionicons name="lock-closed" size={22} color="#E34234" />
            <Text style={styles.padlockUnlockText}>Screen Locked • Tap to Unlock</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* NORMAL CONTROLS OVERLAY */
        controlsVisible && (
          <View style={styles.controlsLayer} pointerEvents="box-none">
            {/* TOP BAR: Title, PiP, Screen Lock, Fullscreen */}
            <View style={styles.topControlBar}>
              <View style={styles.topTitleCol}>
                <Text style={styles.topLessonTitle} numberOfLines={1}>
                  {title}
                </Text>
                {subtitle && (
                  <Text style={styles.topLessonSub} numberOfLines={1}>
                    {subtitle}
                  </Text>
                )}
              </View>

              <View style={styles.topActionsRow}>
                {/* PiP Floating Window Button */}
                <TouchableOpacity
                  style={styles.topIconBtn}
                  onPress={() => {
                    triggerHaptic('medium');
                    onTriggerPiP();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Picture-in-picture floating window"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="albums-outline" size={18} color="#FFFFFF" />
                </TouchableOpacity>

                {/* Screen Lock Button */}
                <TouchableOpacity
                  style={styles.topIconBtn}
                  onPress={() => {
                    triggerHaptic('medium');
                    onToggleLock();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Lock screen touches"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="lock-open-outline" size={18} color="#FFFFFF" />
                </TouchableOpacity>

                {/* Fullscreen / Landscape Mode Toggle */}
                <TouchableOpacity
                  style={[
                    styles.topIconBtn,
                    isFullscreen && { backgroundColor: '#102F53', borderColor: '#E34234', borderWidth: 1 },
                  ]}
                  onPress={() => {
                    triggerHaptic('light');
                    onToggleFullscreen();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={isFullscreen ? "Exit landscape mode" : "Enter landscape mode"}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={isFullscreen ? 'contract-outline' : 'scan-outline'}
                    size={18}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* CENTER CONTROLS: Rewind 10s, Play/Pause, Forward 10s */}
            <View style={styles.centerControlsRow} pointerEvents="box-none">
              <TouchableOpacity
                style={styles.centerSeekBtn}
                onPress={() => {
                  triggerDoubleTapSeek(true);
                  resetControlsTimer();
                }}
                accessibilityRole="button"
                accessibilityLabel="Rewind 10 seconds"
              >
                <Ionicons name="play-back" size={24} color="#FFFFFF" />
                <Text style={styles.centerSeekText}>10s</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.centerPlayPauseBtn}
                onPress={() => {
                  triggerHaptic('light');
                  onTogglePlay();
                  resetControlsTimer();
                }}
                accessibilityRole="button"
                accessibilityLabel={isPlaying ? "Pause video" : "Play video"}
              >
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={30}
                  color="#FFFFFF"
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.centerSeekBtn}
                onPress={() => {
                  triggerDoubleTapSeek(false);
                  resetControlsTimer();
                }}
                accessibilityRole="button"
                accessibilityLabel="Fast forward 10 seconds"
              >
                <Ionicons name="play-forward" size={24} color="#FFFFFF" />
                <Text style={styles.centerSeekText}>10s</Text>
              </TouchableOpacity>
            </View>

            {/* BOTTOM BAR: Progress Bar, Time, Speed Pill, Media3 Quality Pill */}
            <View style={styles.bottomControlBar}>
              {/* Scrub Track */}
              <View style={styles.progressTrackContainer}>
                <View style={styles.progressTrackBg}>
                  <View style={[styles.progressTrackFill, { width: `${percent}%` }]} />
                </View>
              </View>

              <View style={styles.bottomMetaRow}>
                {/* Time Display */}
                <Text style={styles.timeText}>
                  {formatSeconds(currentPositionSeconds)} / {formatSeconds(totalDurationSeconds)}
                </Text>

                <View style={styles.bottomRightPills}>
                  {/* Media3 ExoPlayer Quality Pill */}
                  <TouchableOpacity
                    style={styles.qualityPill}
                    onPress={() => {
                      triggerHaptic('light');
                      onOpenQualityModal();
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Video streaming quality: ${videoQuality}`}
                  >
                    <Ionicons name="options-outline" size={12} color="#FFFFFF" />
                    <Text style={styles.qualityPillText}>{videoQuality}</Text>
                  </TouchableOpacity>

                  {/* ONE-TAP SPEED PILL: Cycles 1.0x -> 1.25x -> 1.5x -> 2.0x -> 0.75x */}
                  <TouchableOpacity
                    style={[
                      styles.speedPill,
                      playbackSpeed !== '1.0x' && styles.speedPillActive,
                    ]}
                    onPress={() => {
                      triggerHaptic('light');
                      onCycleSpeed();
                      resetControlsTimer();
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Playback speed: ${playbackSpeed}. Tap to cycle speed.`}
                  >
                    <Text style={styles.speedPillText}>{playbackSpeed}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
    zIndex: 20,
  },
  controlsLayer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
    justifyContent: 'space-between',
  },
  topControlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 10,
    gap: 8,
  },
  topTitleCol: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  topLessonTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  topLessonSub: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  topActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  topIconBtn: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  centerControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  centerSeekBtn: {
    minWidth: 46,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: 23,
    padding: 6,
  },
  centerSeekText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: -2,
  },
  centerPlayPauseBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#102F53',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  bottomControlBar: {
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  progressTrackContainer: {
    height: 14,
    justifyContent: 'center',
    marginBottom: 4,
  },
  progressTrackBg: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressTrackFill: {
    height: '100%',
    backgroundColor: '#E34234',
  },
  bottomMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bottomRightPills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qualityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 47, 83, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: shape.medium,
    minHeight: 28,
    gap: 4,
  },
  qualityPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  speedPill: {
    backgroundColor: 'rgba(16, 47, 83, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: shape.medium,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  speedPillActive: {
    backgroundColor: '#E34234',
    borderColor: '#E34234',
    borderRadius: shape.medium,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seekRippleBubble: {
    position: 'absolute',
    top: '32%',
    width: 80,
    height: 80,
    borderRadius: shape.full,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderWidth: 1.5,
    borderColor: '#E34234',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
  },
  leftRipplePos: {
    left: '12%',
  },
  rightRipplePos: {
    right: '12%',
  },
  seekRippleText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  hudOverlay: {
    position: 'absolute',
    top: '20%',
    alignSelf: 'center',
    zIndex: 35,
  },
  hudCard: {
    backgroundColor: 'rgba(16, 47, 83, 0.94)',
    borderRadius: shape.large,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    width: 68,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    gap: 8,
  },
  hudProgressBarTrack: {
    width: 8,
    height: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: shape.extraSmall,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  hudProgressBarFill: {
    width: '100%',
    backgroundColor: '#E34234',
    borderRadius: shape.extraSmall,
  },
  hudPercentText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  lockedContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 40,
  },
  padlockUnlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#102F53',
    borderColor: '#E34234',
    borderWidth: 1.5,
    borderRadius: shape.full,
    paddingHorizontal: 18,
    paddingVertical: 10,
    minHeight: MIN_TOUCH_TARGET,
    gap: 8,
    elevation: 4,
  },
  padlockUnlockText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
