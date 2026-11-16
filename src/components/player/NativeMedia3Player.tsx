import React, { useRef, useImperativeHandle, forwardRef, useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, StyleProp, ViewStyle, Text } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEventListener } from 'expo';
import { formatNowPlayingMetadata } from '../../utils/pipManager';

export interface NativeMedia3PlayerProps {
  sourceUrl: string;
  title: string;
  courseTitle?: string;
  playbackSpeed?: number;
  isCommuteMode?: boolean; // Background audio mode
  onProgress?: (currentTime: number, duration: number) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
  onEnd?: () => void;
  onPictureInPictureStart?: () => void;
  onPictureInPictureStop?: () => void;
  style?: StyleProp<ViewStyle>;
}

export interface NativeMedia3PlayerRef {
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seekTo: (seconds: number) => void;
  startPictureInPicture: () => Promise<void>;
  stopPictureInPicture: () => Promise<void>;
  enterFullscreen: () => Promise<void>;
  exitFullscreen: () => Promise<void>;
  getCurrentTime: () => number;
  getDuration: () => number;
}

export const NativeMedia3Player = forwardRef<NativeMedia3PlayerRef, NativeMedia3PlayerProps>(
  (
    {
      sourceUrl,
      title,
      courseTitle,
      playbackSpeed = 1.0,
      isCommuteMode = false,
      onProgress,
      onPlayStateChange,
      onEnd,
      onPictureInPictureStart,
      onPictureInPictureStop,
      style,
    },
    ref
  ) => {
    const videoViewRef = useRef<VideoView>(null);
    const [isBuffering, setIsBuffering] = useState<boolean>(true);
    const [hasError, setHasError] = useState<boolean>(false);

    const nowPlayingMeta = formatNowPlayingMetadata(title, courseTitle);

    const player = useVideoPlayer(sourceUrl, (p) => {
      p.loop = false;
      p.staysActiveInBackground = true;
      p.showNowPlayingNotification = true;
      p.playbackRate = playbackSpeed;
      p.play();
    });

    // Synchronize background mode and lock-screen metadata
    useEffect(() => {
      if (player) {
        player.staysActiveInBackground = true;
        player.showNowPlayingNotification = true;
      }
    }, [player, isCommuteMode]);

    // Synchronize playback speed
    useEffect(() => {
      if (player && playbackSpeed > 0) {
        try {
          player.playbackRate = playbackSpeed;
        } catch {
          // Ignore invalid rate exceptions gracefully
        }
      }
    }, [player, playbackSpeed]);

    // Handle play state changes
    useEventListener(player, 'playingChange', ({ isPlaying }) => {
      setIsBuffering(false);
      onPlayStateChange?.(isPlaying);
    });

    // Handle time updates
    useEventListener(player, 'timeUpdate', ({ currentTime }) => {
      onProgress?.(currentTime, player.duration || 0);
    });

    // Handle play to end
    useEventListener(player, 'playToEnd', () => {
      onEnd?.();
    });

    // Handle status change for buffering
    useEventListener(player, 'statusChange', ({ status, error }) => {
      if (status === 'loading') {
        setIsBuffering(true);
      } else if (status === 'readyToPlay') {
        setIsBuffering(false);
      } else if (status === 'error') {
        setIsBuffering(false);
        setHasError(true);
      }
    });

    useImperativeHandle(ref, () => ({
      play: () => {
        try {
          player.play();
        } catch {}
      },
      pause: () => {
        try {
          player.pause();
        } catch {}
      },
      togglePlay: () => {
        try {
          if (player.playing) {
            player.pause();
          } else {
            player.play();
          }
        } catch {}
      },
      seekTo: (seconds: number) => {
        try {
          player.currentTime = Math.max(0, seconds);
        } catch {}
      },
      startPictureInPicture: async () => {
        if (videoViewRef.current) {
          await videoViewRef.current.startPictureInPicture();
        }
      },
      stopPictureInPicture: async () => {
        if (videoViewRef.current) {
          await videoViewRef.current.stopPictureInPicture();
        }
      },
      enterFullscreen: async () => {
        if (videoViewRef.current) {
          await videoViewRef.current.enterFullscreen();
        }
      },
      exitFullscreen: async () => {
        if (videoViewRef.current) {
          await videoViewRef.current.exitFullscreen();
        }
      },
      getCurrentTime: () => player?.currentTime || 0,
      getDuration: () => player?.duration || 0,
    }));

    return (
      <View style={[styles.container, style]}>
        <VideoView
          ref={videoViewRef}
          player={player}
          style={styles.videoView}
          allowsPictureInPicture
          startsPictureInPictureAutomatically
          contentFit="contain"
          nativeControls={false}
          onPictureInPictureStart={onPictureInPictureStart}
          onPictureInPictureStop={onPictureInPictureStop}
        />

        {isBuffering && (
          <View style={styles.loadingOverlay} pointerEvents="none">
            <ActivityIndicator size="large" color="#FFB606" />
            <Text style={styles.loadingText}>Buffering Media3 Stream...</Text>
          </View>
        )}

        {hasError && (
          <View style={styles.errorOverlay} pointerEvents="none">
            <Text style={styles.errorText}>Stream error. Switching to fallback...</Text>
          </View>
        )}
      </View>
    );
  }
);

NativeMedia3Player.displayName = 'NativeMedia3Player';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
    overflow: 'hidden',
    position: 'relative',
  },
  videoView: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 8,
    color: '#FFB606',
    fontSize: 12,
    fontWeight: '600',
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 25, 44, 0.85)',
    zIndex: 11,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },
});
