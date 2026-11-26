import { useRef, useImperativeHandle, forwardRef, useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, StyleProp, ViewStyle, Text } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEventListener } from 'expo';

export interface NativeMedia3PlayerProps {
  sourceUrl: string;
  title: string;
  courseTitle?: string;
  playbackSpeed?: number;
  initialPositionSeconds?: number;
  isCommuteMode?: boolean; // Background audio mode
  onProgress?: (currentTime: number, duration: number) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
  onEnd?: () => void;
  onError?: (message: string) => void;
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
      initialPositionSeconds = 0,
      isCommuteMode = false,
      onProgress,
      onPlayStateChange,
      onEnd,
      onError,
      onPictureInPictureStart,
      onPictureInPictureStop,
      style,
    },
    ref
  ) => {
    const videoViewRef = useRef<VideoView>(null);
    const [isBuffering, setIsBuffering] = useState<boolean>(true);
    const [hasError, setHasError] = useState<boolean>(false);
    const appliedInitialSeekUrlRef = useRef<string | null>(null);
    const initialSeekRef = useRef<number>(initialPositionSeconds);
    initialSeekRef.current = initialPositionSeconds;

    const player = useVideoPlayer(sourceUrl, (p) => {
      p.loop = false;
      p.staysActiveInBackground = true;
      p.showNowPlayingNotification = true;
      p.playbackRate = playbackSpeed;
      p.play();
    });

    // Reset loading/error state whenever stream source changes
    useEffect(() => {
      setHasError(false);
      setIsBuffering(true);
      appliedInitialSeekUrlRef.current = null;
    }, [sourceUrl]);

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

    // Handle status change for buffering, initial resume seek, and honest stream error surfacing
    useEventListener(player, 'statusChange', ({ status, error }) => {
      if (status === 'loading') {
        setIsBuffering(true);
      } else if (status === 'readyToPlay') {
        setIsBuffering(false);
        setHasError(false);
        const targetSeek = initialSeekRef.current;
        const duration = player.duration || 0;
        if (
          appliedInitialSeekUrlRef.current !== sourceUrl &&
          targetSeek > 2 &&
          (duration <= 0 || targetSeek < duration - 5)
        ) {
          appliedInitialSeekUrlRef.current = sourceUrl;
          try {
            player.currentTime = targetSeek;
          } catch {}
        } else {
          appliedInitialSeekUrlRef.current = sourceUrl;
        }
      } else if (status === 'error') {
        setIsBuffering(false);
        setHasError(true);
        onError?.(error?.message || 'Unable to load media stream.');
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
          startsPictureInPictureAutomatically={!isCommuteMode}
          contentFit="contain"
          nativeControls={false}
          onPictureInPictureStart={onPictureInPictureStart}
          onPictureInPictureStop={onPictureInPictureStop}
        />

        {isBuffering && !hasError && (
          <View style={styles.loadingOverlay} pointerEvents="none">
            <ActivityIndicator size="large" color="#E34234" />
            <Text style={styles.loadingText}>Buffering Media3 Stream...</Text>
          </View>
        )}

        {hasError && (
          <View style={styles.errorOverlay} pointerEvents="none">
            <Text style={styles.errorText}>Stream unavailable. Check connection or retry.</Text>
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
    backgroundColor: '#0F192C',
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
    color: '#FFFFFF',
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
