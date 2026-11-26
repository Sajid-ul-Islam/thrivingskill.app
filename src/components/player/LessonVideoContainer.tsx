import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { WebView } from 'react-native-webview';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { triggerHaptic } from '../../utils/haptics';
import { MIN_TOUCH_TARGET } from '../../theme/typography';
import {
  VIDEO_COMING_SOON_MESSAGE,
  VIDEO_COMING_SOON_MESSAGE_BN,
} from '../../data/lessonVideosRegistry';
import { NativeMedia3Player, NativeMedia3PlayerRef } from './NativeMedia3Player';
import { VideoPlayerGestureOverlay } from './VideoPlayerGestureOverlay';
import { LessonCommuteCard } from './LessonCommuteCard';
import { Lesson, Course } from '../../types';

export interface WebViewPlayerController {
  play: () => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
  setPlaybackRate: (rate: number) => void;
}

function appendOrReplaceQueryParams(url: string, params: Record<string, string>): string {
  const decodedUrl = url.replace(/&amp;/gi, '&');
  const hashSplit = decodedUrl.split('#');
  const baseWithQuery = hashSplit[0];
  const fragment = hashSplit[1] ? `#${hashSplit[1]}` : '';
  const qIdx = baseWithQuery.indexOf('?');
  const base = qIdx >= 0 ? baseWithQuery.slice(0, qIdx) : baseWithQuery;
  const rawQuery = qIdx >= 0 ? baseWithQuery.slice(qIdx + 1) : '';
  const searchParams = new URLSearchParams(rawQuery);
  searchParams.delete('controls');
  Object.entries(params).forEach(([key, val]) => {
    if (!searchParams.has(key)) {
      searchParams.set(key, val);
    }
  });
  const qs = searchParams.toString();
  return `${base}${qs ? `?${qs}` : ''}${fragment}`;
}

/**
 * Builds sanitized embed HTML for lesson videos with bidirectional Vimeo/YouTube/HTML5
 * playback telemetry, resume-seek support, and strict HTTPS origin guards.
 */
export function buildLessonVideoHtml(
  activeVideoIntro?: string,
  activeVideoUrl?: string,
  initialSeekSeconds: number = 0,
  initialPlaybackRate: number = 1
): string {
  let embedMarkup = '';
  let detectedHost: 'vimeo' | 'youtube' | 'video' | 'other' = 'other';

  if (activeVideoIntro && activeVideoIntro.includes('<iframe')) {
    const iframeSrcMatch = activeVideoIntro.match(/src=["']([^"']+)["']/i);
    const rawSrc = (iframeSrcMatch?.[1] || '')
      .replace(/&amp;|&#0*38;/gi, '&')
      .replace(/&quot;/gi, '"');
    const isSafeIframe =
      !iframeSrcMatch || (/^(https:)?\/\//i.test(rawSrc) && !/javascript:/i.test(rawSrc));
    if (isSafeIframe) {
      let normalizedSrc = rawSrc.replace(/^\/\//, 'https://');
      if (normalizedSrc.includes('vimeo.com')) {
        detectedHost = 'vimeo';
        normalizedSrc = appendOrReplaceQueryParams(normalizedSrc, {
          autoplay: '1',
          playsinline: '1',
          title: '0',
          byline: '0',
          portrait: '0',
          dnt: '1',
        });
      } else if (
        normalizedSrc.includes('youtube.com') ||
        normalizedSrc.includes('youtube-nocookie.com')
      ) {
        detectedHost = 'youtube';
        normalizedSrc = appendOrReplaceQueryParams(normalizedSrc, {
          autoplay: '1',
          controls: '1',
          playsinline: '1',
          modestbranding: '1',
          rel: '0',
          enablejsapi: '1',
          origin: 'https://thrivingskill.com',
        });
      }
      const escapedSrc = normalizedSrc.replace(/"/g, '&quot;');
      if (escapedSrc) {
        embedMarkup = `<iframe id="tsPlayerFrame" src="${escapedSrc}" width="100%" height="100%" frameborder="0" referrerpolicy="strict-origin-when-cross-origin" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowfullscreen style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;"></iframe>`;
      } else {
        embedMarkup = activeVideoIntro
          .replace(/src=["']\/\//gi, 'src="https://')
          .replace(/width="[^"]*"/gi, 'width="100%"')
          .replace(/height="[^"]*"/gi, 'height="100%"');
      }
    }
  } else if (activeVideoUrl) {
    if (activeVideoUrl.includes('vimeo.com')) {
      detectedHost = 'vimeo';
      let vSrc = activeVideoUrl;
      if (!activeVideoUrl.includes('player.vimeo.com/video/')) {
        const vMatch = activeVideoUrl.match(/vimeo\.com\/(\d+)/);
        const vId = vMatch ? vMatch[1] : '';
        vSrc = vId ? `https://player.vimeo.com/video/${vId}` : '';
      }
      if (vSrc) {
        const vUrlWithParams = appendOrReplaceQueryParams(vSrc, {
          autoplay: '1',
          playsinline: '1',
          title: '0',
          byline: '0',
          portrait: '0',
          dnt: '1',
        });
        embedMarkup = `<iframe id="tsPlayerFrame" src="${vUrlWithParams}" width="100%" height="100%" frameborder="0" referrerpolicy="strict-origin-when-cross-origin" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowfullscreen style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;"></iframe>`;
      }
    } else if (activeVideoUrl.includes('youtube.com') || activeVideoUrl.includes('youtu.be')) {
      detectedHost = 'youtube';
      let ytId = '';
      const yMatch = activeVideoUrl.match(
        /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
      );
      if (yMatch && yMatch[1]) ytId = yMatch[1];
      const ytSrc = ytId
        ? `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&controls=1&playsinline=1&modestbranding=1&rel=0&enablejsapi=1&origin=https://thrivingskill.com`
        : appendOrReplaceQueryParams(activeVideoUrl, {
            autoplay: '1',
            controls: '1',
            playsinline: '1',
            enablejsapi: '1',
            origin: 'https://thrivingskill.com',
          });
      embedMarkup = `<iframe id="tsPlayerFrame" src="${ytSrc}" width="100%" height="100%" frameborder="0" referrerpolicy="strict-origin-when-cross-origin" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowfullscreen style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;"></iframe>`;
    } else if (activeVideoUrl.match(/\.(mp4|m3u8|mpd|webm)($|\?)/i)) {
      detectedHost = 'video';
      embedMarkup = `<video id="media3Player" src="${activeVideoUrl}" controls playsinline webkit-playsinline autoplay style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:contain;background:#000;"></video>`;
    } else {
      const isSafeHttps = activeVideoUrl.startsWith('https://');
      if (isSafeHttps) {
        const escapedUrl = activeVideoUrl.replace(/"/g, '&quot;');
        embedMarkup = `<iframe id="tsPlayerFrame" src="${escapedUrl}" width="100%" height="100%" frameborder="0" referrerpolicy="strict-origin-when-cross-origin" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowfullscreen style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;"></iframe>`;
      } else {
        embedMarkup = `<div style="color:#FFF;font-family:system-ui,sans-serif;text-align:center;padding:40px 20px;"><div style="font-size:32px;margin-bottom:8px;">🔒</div><div>Secure stream required (HTTPS only).</div></div>`;
      }
    }
  } else {
    embedMarkup = `<div style="color:#FFF;font-family:system-ui,sans-serif;text-align:center;padding:40px 20px;"><div style="font-size:28px;margin-bottom:8px;">🎬</div><div>Video coming soon</div></div>`;
  }

  const safeInitialSeek = Math.max(0, Math.floor(initialSeekSeconds || 0));
  const safeInitialRate =
    Number.isFinite(initialPlaybackRate) && initialPlaybackRate > 0 ? initialPlaybackRate : 1;

  const sdkScriptTag =
    detectedHost === 'vimeo'
      ? '<script src="https://player.vimeo.com/api/player.js" async></script>'
      : detectedHost === 'youtube'
        ? '<script src="https://www.youtube.com/iframe_api" async></script>'
        : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background-color: #000000;
      overflow: hidden;
    }
    .video-wrapper {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #000000;
    }
    iframe, video {
      position: absolute;
      top: 0;
      left: 0;
      width: 100% !important;
      height: 100% !important;
      max-width: 100% !important;
      max-height: 100% !important;
      border: 0;
    }
  </style>
  ${sdkScriptTag}
</head>
<body>
  <div class="video-wrapper">
    ${embedMarkup}
  </div>
  <script>
    (function() {
      var initialSeek = ${safeInitialSeek};
      var initialRate = ${safeInitialRate};
      var resumeApplied = false;
      var vimeoPlayer = null;
      var ytPlayer = null;
      var ytPollId = null;

      function post(payload) {
        try {
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(JSON.stringify(payload));
          }
        } catch (e) {}
      }

      window.__TS_PLAYER__ = {
        play: function() {
          try {
            if (vimeoPlayer) { vimeoPlayer.play().catch(function() {}); }
            else if (ytPlayer && ytPlayer.playVideo) { ytPlayer.playVideo(); }
            else {
              var v = document.getElementById('media3Player');
              if (v && v.play) v.play();
            }
          } catch (e) {}
        },
        pause: function() {
          try {
            if (vimeoPlayer) { vimeoPlayer.pause().catch(function() {}); }
            else if (ytPlayer && ytPlayer.pauseVideo) { ytPlayer.pauseVideo(); }
            else {
              var v = document.getElementById('media3Player');
              if (v && v.pause) v.pause();
            }
          } catch (e) {}
        },
        seekTo: function(sec) {
          var target = Math.max(0, Number(sec) || 0);
          try {
            if (vimeoPlayer) { vimeoPlayer.setCurrentTime(target).catch(function() {}); }
            else if (ytPlayer && ytPlayer.seekTo) { ytPlayer.seekTo(target, true); }
            else {
              var v = document.getElementById('media3Player');
              if (v) v.currentTime = target;
            }
          } catch (e) {}
        },
        setRate: function(rate) {
          var targetRate = Number(rate) || 1;
          try {
            if (vimeoPlayer) { vimeoPlayer.setPlaybackRate(targetRate).catch(function() {}); }
            else if (ytPlayer && ytPlayer.setPlaybackRate) { ytPlayer.setPlaybackRate(targetRate); }
            else {
              var v = document.getElementById('media3Player');
              if (v) v.playbackRate = targetRate;
            }
          } catch (e) {}
        }
      };

      function applyInitialSeekAndRate(duration) {
        if (resumeApplied) return;
        resumeApplied = true;
        if (initialSeek > 2 && (!duration || initialSeek < duration - 5)) {
          window.__TS_PLAYER__.seekTo(initialSeek);
        }
        if (initialRate && initialRate !== 1) {
          window.__TS_PLAYER__.setRate(initialRate);
        }
      }

      var videoEl = document.getElementById('media3Player');
      if (videoEl) {
        videoEl.addEventListener('loadedmetadata', function() {
          var dur = Number(videoEl.duration) || 0;
          applyInitialSeekAndRate(dur);
          post({ type: 'VIDEO_LOADED', duration: dur, provider: 'html5' });
        });
        videoEl.addEventListener('play', function() {
          post({ type: 'PLAY_STATE', playing: true, currentTime: Number(videoEl.currentTime) || 0, duration: Number(videoEl.duration) || 0 });
        });
        videoEl.addEventListener('pause', function() {
          post({ type: 'PLAY_STATE', playing: false, currentTime: Number(videoEl.currentTime) || 0, duration: Number(videoEl.duration) || 0 });
        });
        videoEl.addEventListener('timeupdate', function() {
          post({ type: 'PROGRESS', currentTime: Number(videoEl.currentTime) || 0, duration: Number(videoEl.duration) || 0 });
        });
        videoEl.addEventListener('ended', function() {
          post({ type: 'VIDEO_ENDED', currentTime: Number(videoEl.duration) || 0, duration: Number(videoEl.duration) || 0 });
        });
        videoEl.addEventListener('error', function() {
          post({ type: 'VIDEO_ERROR', message: 'HTML5 video stream failed to load' });
        });
      }

      function attachVimeo() {
        var frame = document.getElementById('tsPlayerFrame');
        if (!frame || !window.Vimeo || !window.Vimeo.Player || vimeoPlayer) return false;
        try {
          vimeoPlayer = new window.Vimeo.Player(frame);
          vimeoPlayer.on('loaded', function() {
            vimeoPlayer.getDuration().then(function(dur) {
              var cleanDur = Number(dur) || 0;
              applyInitialSeekAndRate(cleanDur);
              post({ type: 'VIDEO_LOADED', duration: cleanDur, provider: 'vimeo' });
            }).catch(function() {
              post({ type: 'VIDEO_LOADED', duration: 0, provider: 'vimeo' });
            });
          });
          vimeoPlayer.on('play', function(data) {
            post({ type: 'PLAY_STATE', playing: true, currentTime: (data && Number(data.seconds)) || 0, duration: (data && Number(data.duration)) || 0 });
          });
          vimeoPlayer.on('pause', function(data) {
            post({ type: 'PLAY_STATE', playing: false, currentTime: (data && Number(data.seconds)) || 0, duration: (data && Number(data.duration)) || 0 });
          });
          vimeoPlayer.on('timeupdate', function(data) {
            if (!data) return;
            post({ type: 'PROGRESS', currentTime: Number(data.seconds) || 0, duration: Number(data.duration) || 0 });
          });
          vimeoPlayer.on('ended', function(data) {
            post({ type: 'VIDEO_ENDED', currentTime: (data && Number(data.duration)) || 0, duration: (data && Number(data.duration)) || 0 });
          });
          vimeoPlayer.on('error', function(err) {
            post({ type: 'VIDEO_ERROR', message: (err && (err.message || err.name)) || 'Vimeo playback error' });
          });
          return true;
        } catch (e) {
          return false;
        }
      }

      if ('${detectedHost}' === 'vimeo') {
        var vimeoTries = 0;
        var vimeoWait = setInterval(function() {
          vimeoTries++;
          if (attachVimeo() || vimeoTries > 30) {
            clearInterval(vimeoWait);
          }
        }, 250);
      }

      if ('${detectedHost}' === 'youtube') {
        window.onYouTubeIframeAPIReady = function() {
          var frame = document.getElementById('tsPlayerFrame');
          if (!frame || !window.YT || !window.YT.Player) return;
          try {
            ytPlayer = new window.YT.Player('tsPlayerFrame', {
              events: {
                onReady: function(ev) {
                  var dur = ev && ev.target && ev.target.getDuration ? Number(ev.target.getDuration()) || 0 : 0;
                  applyInitialSeekAndRate(dur);
                  post({ type: 'VIDEO_LOADED', duration: dur, provider: 'youtube' });
                },
                onStateChange: function(ev) {
                  if (!ev) return;
                  var dur = ytPlayer && ytPlayer.getDuration ? Number(ytPlayer.getDuration()) || 0 : 0;
                  var cur = ytPlayer && ytPlayer.getCurrentTime ? Number(ytPlayer.getCurrentTime()) || 0 : 0;
                  if (ev.data === window.YT.PlayerState.PLAYING) {
                    post({ type: 'PLAY_STATE', playing: true, currentTime: cur, duration: dur });
                    if (ytPollId) clearInterval(ytPollId);
                    ytPollId = setInterval(function() {
                      if (!ytPlayer || !ytPlayer.getCurrentTime) return;
                      post({ type: 'PROGRESS', currentTime: Number(ytPlayer.getCurrentTime()) || 0, duration: Number(ytPlayer.getDuration()) || dur });
                    }, 500);
                  } else if (ev.data === window.YT.PlayerState.PAUSED) {
                    if (ytPollId) { clearInterval(ytPollId); ytPollId = null; }
                    post({ type: 'PLAY_STATE', playing: false, currentTime: cur, duration: dur });
                  } else if (ev.data === window.YT.PlayerState.ENDED) {
                    if (ytPollId) { clearInterval(ytPollId); ytPollId = null; }
                    post({ type: 'VIDEO_ENDED', currentTime: dur, duration: dur });
                  }
                },
                onError: function(ev) {
                  post({ type: 'VIDEO_ERROR', message: 'YouTube embed error (' + (ev && ev.data) + ')' });
                }
              }
            });
          } catch (e) {}
        };
      }

      var genericFrame = document.getElementById('tsPlayerFrame');
      if (genericFrame) {
        genericFrame.addEventListener('load', function() {
          post({ type: 'IFRAME_READY', provider: '${detectedHost}' });
        });
      }
    })();
  </script>
</body>
</html>`;
}

interface LessonVideoContainerProps {
  course: Course;
  currentLesson: Lesson;
  moduleTitle?: string;
  canPlayVideo: boolean;
  hasVideo?: boolean;
  videoComingSoonMessage?: string;
  isLessonCompleted: boolean;
  isCommuteMode: boolean;
  isPlaying: boolean;
  playbackSpeed: string;
  streamQuality: string;
  initialPositionSeconds?: number;
  isFullscreen: boolean;
  isDeviceLandscape: boolean;
  isScreenLocked: boolean;
  isLoadingVideo: boolean;
  isDirectStream: boolean;
  activeVideoUrl?: string;
  resolvedVideoUrl?: string;
  zoomMeetingUrl?: string | null;
  videoHtml: string;
  windowDimensions: { width: number; height: number };
  currentPositionSeconds: number;
  totalLessonSeconds: number;
  autoplayCountdown: number | null;
  nextLessonTitle?: string;
  hasPrevLesson: boolean;
  hasNextLesson: boolean;
  nativePlayerRef: React.RefObject<NativeMedia3PlayerRef | null>;
  webViewControllerRef?: React.MutableRefObject<WebViewPlayerController | null>;
  previewLesson?: Lesson;
  onSelectLesson: (courseId: string, lessonId: string) => void;
  onOpenPaymentModal: () => void;
  onOpenQuizPlayer: (lesson: Lesson) => void;
  onTogglePlay: () => void;
  onPausePlayback?: () => void;
  onSeekTo: (sec: number) => void;
  onRewind: (sec: number) => void;
  onForward: (sec: number) => void;
  onPrevLesson: () => void;
  onNextLesson: () => void;
  onCycleSpeed: () => void;
  onToggleFullscreen: () => void;
  onToggleScreenLock: () => void;
  onOpenStreamQualityModal: () => void;
  onTriggerPiP: () => void;
  onCancelAutoplay: () => void;
  onMarkComplete: () => void;
  onPictureInPictureStart: () => void;
  onPictureInPictureStop: () => void;
  onProgressUpdate: (sec: number, durationSec?: number) => void;
  onDurationDetected?: (durationSec: number) => void;
  onPlayStateChange: (playing: boolean) => void;
  onVideoEnded?: () => void;
  formatSeconds: (sec: number) => string;
}

export const LessonVideoContainer: React.FC<LessonVideoContainerProps> = ({
  course,
  currentLesson,
  moduleTitle,
  canPlayVideo,
  hasVideo,
  videoComingSoonMessage,
  isLessonCompleted,
  isCommuteMode,
  isPlaying,
  playbackSpeed,
  streamQuality,
  initialPositionSeconds = 0,
  isFullscreen,
  isDeviceLandscape,
  isScreenLocked,
  isLoadingVideo,
  isDirectStream,
  activeVideoUrl,
  resolvedVideoUrl,
  zoomMeetingUrl,
  videoHtml,
  windowDimensions,
  currentPositionSeconds,
  totalLessonSeconds,
  autoplayCountdown,
  nextLessonTitle,
  hasPrevLesson,
  hasNextLesson,
  nativePlayerRef,
  webViewControllerRef,
  previewLesson,
  onSelectLesson,
  onOpenPaymentModal,
  onOpenQuizPlayer,
  onTogglePlay,
  onPausePlayback,
  onSeekTo,
  onRewind,
  onForward,
  onPrevLesson,
  onNextLesson,
  onCycleSpeed,
  onToggleFullscreen,
  onToggleScreenLock,
  onOpenStreamQualityModal,
  onTriggerPiP,
  onCancelAutoplay,
  onMarkComplete,
  onPictureInPictureStart,
  onPictureInPictureStop,
  onProgressUpdate,
  onDurationDetected,
  onPlayStateChange,
  onVideoEnded,
  formatSeconds,
}) => {
  const { colors, isDark } = useTheme();
  const { isBangla } = useLanguage();
  const effectiveHasVideo = hasVideo ?? Boolean(activeVideoUrl);
  const isPaidCourse = Boolean(
    (course.priceBdt && course.priceBdt > 0) || (course.price && course.price > 0)
  );

  const internalWebViewRef = useRef<any>(null);
  const webViewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [webViewError, setWebViewError] = useState<string | null>(null);
  const [isWebViewLoading, setIsWebViewLoading] = useState<boolean>(false);
  const [webViewReloadKey, setWebViewReloadKey] = useState<number>(0);

  useEffect(() => {
    setWebViewError(null);
    if (!isDirectStream && effectiveHasVideo && canPlayVideo && !isLoadingVideo) {
      setIsWebViewLoading(true);
      if (webViewTimeoutRef.current) clearTimeout(webViewTimeoutRef.current);
      webViewTimeoutRef.current = setTimeout(() => {
        setIsWebViewLoading(false);
      }, 6000);
    } else {
      setIsWebViewLoading(false);
    }
    return () => {
      if (webViewTimeoutRef.current) {
        clearTimeout(webViewTimeoutRef.current);
        webViewTimeoutRef.current = null;
      }
    };
  }, [
    currentLesson.id,
    activeVideoUrl,
    videoHtml,
    isDirectStream,
    effectiveHasVideo,
    canPlayVideo,
    isLoadingVideo,
  ]);

  useEffect(() => {
    if (!webViewControllerRef) return;
    if (isDirectStream || !effectiveHasVideo) {
      webViewControllerRef.current = null;
      return;
    }
    webViewControllerRef.current = {
      play: () => {
        internalWebViewRef.current?.injectJavaScript?.(
          'window.__TS_PLAYER__ && window.__TS_PLAYER__.play(); true;'
        );
      },
      pause: () => {
        internalWebViewRef.current?.injectJavaScript?.(
          'window.__TS_PLAYER__ && window.__TS_PLAYER__.pause(); true;'
        );
      },
      seekTo: (seconds: number) => {
        const cleanSec = Math.max(0, Math.floor(seconds));
        internalWebViewRef.current?.injectJavaScript?.(
          `window.__TS_PLAYER__ && window.__TS_PLAYER__.seekTo(${cleanSec}); true;`
        );
      },
      setPlaybackRate: (rate: number) => {
        const cleanRate = Number.isFinite(rate) && rate > 0 ? rate : 1;
        internalWebViewRef.current?.injectJavaScript?.(
          `window.__TS_PLAYER__ && window.__TS_PLAYER__.setRate(${cleanRate}); true;`
        );
      },
    };
    return () => {
      webViewControllerRef.current = null;
    };
  }, [webViewControllerRef, isDirectStream, effectiveHasVideo, currentLesson.id]);

  const handleWebViewMessage = (event: any) => {
    const raw = event?.nativeEvent?.data;
    if (!raw || typeof raw !== 'string') return;
    try {
      const msg = JSON.parse(raw);
      if (!msg || typeof msg.type !== 'string') return;
      if (msg.type === 'VIDEO_LOADED' || msg.type === 'IFRAME_READY') {
        setIsWebViewLoading(false);
        if (typeof msg.duration === 'number' && msg.duration > 0) {
          onDurationDetected?.(msg.duration);
        }
      } else if (msg.type === 'PLAY_STATE') {
        setIsWebViewLoading(false);
        onPlayStateChange(Boolean(msg.playing));
        if (typeof msg.currentTime === 'number') {
          onProgressUpdate(
            msg.currentTime,
            typeof msg.duration === 'number' ? msg.duration : undefined
          );
        }
      } else if (msg.type === 'PROGRESS') {
        setIsWebViewLoading(false);
        if (typeof msg.currentTime === 'number') {
          onProgressUpdate(
            msg.currentTime,
            typeof msg.duration === 'number' ? msg.duration : undefined
          );
        }
      } else if (msg.type === 'VIDEO_ENDED') {
        setIsWebViewLoading(false);
        onPlayStateChange(false);
        if (onVideoEnded) {
          onVideoEnded();
        } else {
          onMarkComplete();
        }
      } else if (msg.type === 'VIDEO_ERROR') {
        setIsWebViewLoading(false);
        onPlayStateChange(false);
        setWebViewError(msg.message || 'Video playback failed');
      }
    } catch {}
  };

  return (
    <View
      style={[
        styles.stickyPlayerFrame,
        isCommuteMode && !isFullscreen && styles.commuteExpandedFrame,
        isFullscreen &&
          (isDeviceLandscape
            ? styles.fullscreenLandscapeFrame
            : [
                styles.forcedLandscapeFrame,
                {
                  width: windowDimensions.height,
                  height: windowDimensions.width,
                  top: (windowDimensions.height - windowDimensions.width) / 2,
                  left: -(windowDimensions.height - windowDimensions.width) / 2,
                },
              ]),
      ]}
    >
      {!canPlayVideo ? (
        /* LOCKED PAYWALL STATE */
        <View
          style={[styles.lockedCard, { backgroundColor: isDark ? colors.surfaceCard : '#102F53' }]}
        >
          <View style={styles.lockedIconBg}>
            <Ionicons name="lock-closed" size={34} color="#E34234" />
          </View>
          <Text style={styles.lockedTitle}>
            {isPaidCourse
              ? isBangla
                ? 'কোর্সটি আনলক করতে এনরোল করুন'
                : 'Unlock Full Course Access'
              : isBangla
                ? 'ফ্রি কোর্সে এনরোল করুন'
                : 'Enroll for Free Access'}
          </Text>
          <Text style={styles.lockedSub}>
            {isPaidCourse
              ? isBangla
                ? 'এই লেসন ও সম্পূর্ণ কোর্স আনলক করতে এনরোলমেন্ট সম্পন্ন করুন অথবা আপনার অ্যাকাউন্ট সিঙ্ক করুন।'
                : 'Purchase enrollment to unlock all lectures and certificates, or sync your existing member access.'
              : isBangla
                ? 'এই ফ্রি কোর্সের সকল লেসন দেখতে এখনই এনরোল করুন অথবা অ্যাকাউন্ট সিঙ্ক করুন।'
                : 'Enroll in this free course or sync your account to access all lectures.'}
          </Text>
          <View style={styles.lockedActionsCol}>
            <TouchableOpacity
              style={styles.lockedPurchaseBtn}
              onPress={onOpenPaymentModal}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel={isPaidCourse ? 'Enroll now to unlock' : 'Enroll and sync access'}
            >
              <Ionicons
                name={isPaidCourse ? 'card-outline' : 'flash-outline'}
                size={15}
                color="#FFFFFF"
              />
              <Text style={styles.lockedPurchaseBtnText}>
                {isPaidCourse
                  ? isBangla
                    ? 'এনরোল ও পেমেন্ট করুন'
                    : 'Enroll Now to Unlock'
                  : isBangla
                    ? 'ফ্রি এনরোল ও সিঙ্ক'
                    : 'Enroll & Sync Access'}
              </Text>
            </TouchableOpacity>

            {previewLesson && previewLesson.id !== currentLesson.id && (
              <TouchableOpacity
                style={styles.lockedPreviewBtn}
                onPress={() => onSelectLesson(course.id, previewLesson.id)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Watch free preview lesson"
              >
                <Ionicons name="play-outline" size={14} color="#FFFFFF" />
                <Text style={styles.lockedPreviewBtnText}>
                  {isBangla ? 'ফ্রি প্রিভিউ দেখুন' : 'Watch Free Preview'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ) : currentLesson.type === 'quiz' ? (
        /* DEDICATED QUIZ HERO FRAME */
        <View
          style={[
            styles.quizHeroCard,
            { backgroundColor: isDark ? colors.surfaceCard : '#102F53' },
          ]}
        >
          <View style={styles.quizHeroBadge}>
            <Ionicons name="help-circle" size={32} color="#E34234" />
          </View>
          <Text style={styles.quizHeroTitle} numberOfLines={1}>
            {currentLesson.title}
          </Text>
          <Text style={styles.quizHeroSub}>
            {isLessonCompleted
              ? isBangla
                ? 'কুইজ সম্পন্ন • জ্ঞান অর্জন সফলভাবে যাচাই করা হয়েছে'
                : 'Quiz Passed • Knowledge Milestone Achieved'
              : isBangla
                ? 'অধ্যায়ভিত্তিক মূল্যায়ন পরীক্ষা • পাস মার্ক ৭০%'
                : 'Chapter Assessment Quiz • 70% to Pass'}
          </Text>
          <TouchableOpacity
            style={[
              styles.quizHeroBtn,
              { backgroundColor: isLessonCompleted ? '#059669' : '#E34234' },
            ]}
            onPress={() => onOpenQuizPlayer(currentLesson)}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="Open Chapter Quiz"
          >
            <Ionicons name={isLessonCompleted ? 'refresh' : 'play'} size={16} color="#FFFFFF" />
            <Text style={[styles.quizHeroBtnText, { color: '#FFFFFF' }]}>
              {isLessonCompleted
                ? isBangla
                  ? 'পুনরায় পরীক্ষা দিন'
                  : 'Retake Chapter Quiz'
                : isBangla
                  ? 'কুইজ শুরু করুন'
                  : 'Start Chapter Quiz'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : isLoadingVideo ? (
        <View style={styles.loadingVideoOverlay}>
          <ActivityIndicator size="large" color="#E34234" />
          <Text style={styles.loadingVideoText}>
            {isBangla ? 'লেকচার ভিডিও লোড হচ্ছে...' : 'Loading lecture video...'}
          </Text>
        </View>
      ) : zoomMeetingUrl ? (
        /* LIVE COHORT MASTERCLASS: Direct Zoom Session Launcher */
        <View
          style={[
            styles.playerContainer,
            {
              backgroundColor: '#102F53',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 20,
            },
          ]}
        >
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: '#2D8CFF25',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 10,
            }}
          >
            <Ionicons name="videocam" size={26} color="#2D8CFF" />
          </View>
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 16,
              fontWeight: '800',
              textAlign: 'center',
              marginBottom: 4,
            }}
          >
            {isBangla ? 'লাইভ জুম মাস্টারক্লাস' : 'Live Cohort Masterclass'}
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: '#2D8CFF',
              paddingHorizontal: 18,
              paddingVertical: 10,
              borderRadius: 8,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              marginTop: 8,
            }}
            onPress={() => {
              triggerHaptic('light');
              Linking.openURL(zoomMeetingUrl).catch(() => {});
            }}
            accessibilityRole="button"
            accessibilityLabel={isBangla ? 'জুমে ক্লাসে যোগ দিন' : 'Launch Live Zoom Session'}
          >
            <Ionicons name="open-outline" size={16} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 }}>
              {isBangla ? 'জুমে ক্লাসে যোগ দিন' : 'Launch Live Zoom Session'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : !effectiveHasVideo ? (
        /* FAIL-CLOSED NO-VIDEO STATE: Shown whenever a lesson has no verified video */
        <View
          testID="video-coming-soon-card"
          style={[
            styles.comingSoonCard,
            { backgroundColor: isDark ? colors.surfaceCard : '#102F53' },
          ]}
        >
          <View style={styles.comingSoonIconBg}>
            <Ionicons name="videocam-off-outline" size={28} color="#E34234" />
          </View>
          <Text style={styles.comingSoonTitle}>
            {isBangla
              ? VIDEO_COMING_SOON_MESSAGE_BN
              : videoComingSoonMessage || VIDEO_COMING_SOON_MESSAGE}
          </Text>
          <Text style={styles.comingSoonSub} numberOfLines={2}>
            {isBangla
              ? 'এই লেসনের ভিডিও এখনো যুক্ত করা হয়নি। নিচের পাঠ বিবরণ দেখুন অথবা পরবর্তী লেসনে যান।'
              : 'This lesson does not have a published video yet. Review the lesson notes below or continue to the next lesson.'}
          </Text>
          {hasNextLesson && (
            <TouchableOpacity
              style={styles.comingSoonNextBtn}
              onPress={() => {
                triggerHaptic('light');
                onNextLesson();
              }}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={isBangla ? 'পরবর্তী লেসনে যান' : 'Continue to next lesson'}
            >
              <Text style={styles.comingSoonNextBtnText}>
                {isBangla ? 'পরবর্তী লেসন' : 'Next Lesson'}
              </Text>
              <Ionicons name="arrow-forward" size={15} color="#102F53" />
            </TouchableOpacity>
          )}
        </View>
      ) : (
        /* ACTUAL REAL VIDEO/AUDIO PLAYER: Keep active media mounted even during Commute Audio Mode */
        <View style={styles.playerContainer}>
          <View
            style={isCommuteMode ? styles.commuteHiddenMedia : styles.playerMediaFill}
            pointerEvents={isCommuteMode ? 'none' : 'auto'}
          >
            {isDirectStream && activeVideoUrl ? (
              <NativeMedia3Player
                ref={nativePlayerRef}
                sourceUrl={activeVideoUrl}
                title={currentLesson.title}
                courseTitle={course?.title}
                playbackSpeed={parseFloat(playbackSpeed) || 1.0}
                initialPositionSeconds={initialPositionSeconds}
                isCommuteMode={isCommuteMode}
                onProgress={onProgressUpdate}
                onPlayStateChange={onPlayStateChange}
                onEnd={onVideoEnded || onMarkComplete}
                onError={(msg) => setWebViewError(msg)}
                onPictureInPictureStart={onPictureInPictureStart}
                onPictureInPictureStop={onPictureInPictureStop}
              />
            ) : (
              <WebView
                key={`wv-${currentLesson.id}-${webViewReloadKey}`}
                ref={internalWebViewRef}
                source={{ html: videoHtml, baseUrl: 'https://thrivingskill.com' }}
                style={styles.videoWebView}
                allowFileAccess={false}
                allowUniversalAccessFromFileURLs={false}
                allowsFullscreenVideo
                javaScriptEnabled
                domStorageEnabled
                mediaPlaybackRequiresUserAction={false}
                allowsInlineMediaPlayback
                originWhitelist={['https://*']}
                mixedContentMode="never"
                androidLayerType="hardware"
                allowsProtectedMedia={true}
                onLoadEnd={() => setIsWebViewLoading(false)}
                onMessage={handleWebViewMessage}
                onError={() => {
                  setIsWebViewLoading(false);
                  setWebViewError('Connection to video server interrupted.');
                }}
                onHttpError={(ev: any) => {
                  const status = ev?.nativeEvent?.statusCode;
                  if (status && status >= 400) {
                    setIsWebViewLoading(false);
                    setWebViewError(`Video stream returned HTTP ${status}.`);
                  }
                }}
                userAgent="Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
              />
            )}
          </View>

          {!isCommuteMode && isWebViewLoading && !webViewError && (
            <View style={styles.loadingVideoOverlay} pointerEvents="none">
              <ActivityIndicator size="large" color="#E34234" />
              <Text style={styles.loadingVideoText}>
                {isBangla ? 'ভিডিও প্লেয়ার প্রস্তুত হচ্ছে...' : 'Preparing video stream...'}
              </Text>
            </View>
          )}

          {!isCommuteMode && webViewError && (
            <View style={styles.loadingVideoOverlay}>
              <Ionicons name="alert-circle-outline" size={32} color="#E34234" />
              <Text
                style={[
                  styles.loadingVideoText,
                  { color: '#FFFFFF', marginTop: 4, textAlign: 'center' },
                ]}
              >
                {isBangla ? 'ভিডিও স্ট্রিমে সংযোগ ব্যর্থ হয়েছে' : webViewError}
              </Text>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                <TouchableOpacity
                  style={styles.videoFallbackBtn}
                  onPress={() => {
                    triggerHaptic('light');
                    setWebViewError(null);
                    setIsWebViewLoading(true);
                    setWebViewReloadKey((k) => k + 1);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={isBangla ? 'পুনরায় চেষ্টা করুন' : 'Retry video stream'}
                >
                  <Ionicons name="refresh" size={14} color="#FFFFFF" />
                  <Text style={styles.videoFallbackBtnText}>
                    {isBangla ? 'আবার চেষ্টা' : 'Retry'}
                  </Text>
                </TouchableOpacity>
                {resolvedVideoUrl && (
                  <TouchableOpacity
                    style={styles.videoFallbackBtn}
                    onPress={() => {
                      triggerHaptic('light');
                      const safeUrl = resolvedVideoUrl.startsWith('//')
                        ? `https:${resolvedVideoUrl}`
                        : resolvedVideoUrl;
                      if (safeUrl.startsWith('https://') || safeUrl.startsWith('http://')) {
                        Linking.openURL(safeUrl).catch(() => {});
                      }
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={
                      isBangla ? 'ব্রাউজারে ভিডিও চালু করুন' : 'Watch in Browser / App'
                    }
                  >
                    <Ionicons name="open-outline" size={14} color="#FFFFFF" />
                    <Text style={styles.videoFallbackBtnText}>
                      {isBangla ? 'ব্রাউজার' : 'Open Browser'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {isCommuteMode ? (
            <View style={styles.commuteOverlay}>
              <LessonCommuteCard
                currentLesson={currentLesson}
                course={course}
                moduleTitle={moduleTitle}
                isPlaying={isPlaying}
                isNativeBackgroundAudio={isDirectStream}
                currentPositionSeconds={currentPositionSeconds}
                totalLessonSeconds={totalLessonSeconds}
                playbackSpeed={playbackSpeed}
                hasPrevLesson={hasPrevLesson}
                hasNextLesson={hasNextLesson}
                onTogglePlay={onTogglePlay}
                onPauseForSleep={onPausePlayback}
                onRewind={onRewind}
                onForward={onForward}
                onPrevLesson={onPrevLesson}
                onNextLesson={onNextLesson}
                onCycleSpeed={onCycleSpeed}
                formatSeconds={formatSeconds}
              />
            </View>
          ) : isDirectStream ? (
            <VideoPlayerGestureOverlay
              isPlaying={isPlaying}
              onTogglePlay={onTogglePlay}
              currentPositionSeconds={currentPositionSeconds}
              totalDurationSeconds={totalLessonSeconds}
              onSeekTo={onSeekTo}
              onRewind={(sec) => onRewind(sec ?? 10)}
              onForward={(sec) => onForward(sec ?? 10)}
              playbackSpeed={playbackSpeed}
              onCycleSpeed={onCycleSpeed}
              videoQuality={streamQuality}
              onOpenQualityModal={onOpenStreamQualityModal}
              isFullscreen={isFullscreen}
              onToggleFullscreen={onToggleFullscreen}
              onTriggerPiP={onTriggerPiP}
              title={currentLesson.title}
              subtitle={moduleTitle}
              isLocked={isScreenLocked}
              onToggleLock={onToggleScreenLock}
            />
          ) : (
            /* Minimalist Floating Controls for Embedded Video (Vimeo / YouTube) */
            <View style={styles.serverPlayerControlsOverlay} pointerEvents="box-none">
              <View style={styles.serverPlayerTopBar} pointerEvents="box-none">
                <View style={styles.serverPlayerTitleBadge} pointerEvents="none">
                  <Ionicons name="play-circle" size={14} color="#E34234" />
                  <Text style={styles.serverPlayerTitleText} numberOfLines={1}>
                    {currentLesson.title}
                  </Text>
                </View>

                <View style={styles.serverPlayerActionsRow}>
                  <TouchableOpacity
                    style={[
                      styles.serverPlayerActionBtn,
                      playbackSpeed !== '1.0x' && styles.serverPlayerActionBtnActive,
                    ]}
                    onPress={onCycleSpeed}
                    accessibilityRole="button"
                    accessibilityLabel={`Playback speed ${playbackSpeed}`}
                  >
                    <Text style={styles.landscapePillText}>{playbackSpeed}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.serverPlayerActionBtn}
                    onPress={onToggleScreenLock}
                    accessibilityRole="button"
                    accessibilityLabel="Lock or unlock screen touches"
                  >
                    <Ionicons
                      name={isScreenLocked ? 'lock-closed' : 'lock-open-outline'}
                      size={16}
                      color={isScreenLocked ? '#E34234' : '#FFFFFF'}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.serverPlayerActionBtn,
                      isFullscreen && styles.serverPlayerActionBtnActive,
                    ]}
                    onPress={onToggleFullscreen}
                    accessibilityRole="button"
                    accessibilityLabel={
                      isFullscreen ? 'Exit landscape mode' : 'Enter landscape mode'
                    }
                  >
                    <Ionicons
                      name={isFullscreen ? 'contract-outline' : 'scan-outline'}
                      size={17}
                      color="#FFFFFF"
                    />
                    <Text style={styles.landscapePillText}>
                      {isFullscreen
                        ? isBangla
                          ? 'প্রস্থান'
                          : 'Exit'
                        : isBangla
                          ? 'ল্যান্ডস্কেপ'
                          : 'Landscape'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {isScreenLocked && (
                <View style={styles.screenLockGuard} pointerEvents="auto">
                  <TouchableOpacity
                    style={styles.unlockPill}
                    onPress={onToggleScreenLock}
                    accessibilityRole="button"
                    accessibilityLabel={
                      isBangla ? 'ভিডিও কন্ট্রোল আনলক করুন' : 'Unlock video controls'
                    }
                  >
                    <Ionicons name="lock-closed" size={18} color="#E34234" />
                    <Text style={styles.unlockPillText}>
                      {isBangla ? 'আনলক করতে ট্যাপ করুন' : 'Tap to Unlock Controls'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Continuous Auto-Play Next Video Countdown Overlay */}
          {autoplayCountdown !== null && (
            <View style={styles.autoplayCountdownOverlay}>
              <View
                style={[
                  styles.autoplayCard,
                  {
                    backgroundColor: isDark ? '#1E1B4B' : '#EEF2FF',
                    borderColor: '#6366F1',
                  },
                ]}
              >
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}
                >
                  <Ionicons name="play-forward-circle" size={18} color="#6366F1" />
                  <Text style={styles.autoplayBadgeText}>
                    {isBangla ? 'স্বয়ংক্রিয় পরবর্তী পাঠ শুরু হচ্ছে' : 'CONTINUOUS AUTO-PLAY'}
                  </Text>
                </View>
                <Text style={styles.autoplayCountdownSec}>{autoplayCountdown}s</Text>
                <Text
                  style={[styles.autoplayNextTitle, { color: isDark ? '#FFFFFF' : '#1F2937' }]}
                  numberOfLines={1}
                >
                  {nextLessonTitle || 'Next Lesson'}
                </Text>
                <View style={styles.autoplayActionsRow}>
                  <TouchableOpacity
                    style={[styles.autoplayCancelBtn, { borderColor: colors.border }]}
                    onPress={onCancelAutoplay}
                    accessibilityRole="button"
                    accessibilityLabel={isBangla ? 'স্বয়ংক্রিয় প্লেব্যাক বাতিল' : 'Cancel auto-play'}
                  >
                    <Text style={[styles.autoplayCancelText, { color: colors.textMuted }]}>
                      {isBangla ? 'বাতিল' : 'Cancel'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.autoplayPlayNowBtn}
                    onPress={onNextLesson}
                    accessibilityRole="button"
                    accessibilityLabel={
                      isBangla ? 'পরবর্তী লেসন এখনই চালু করুন' : 'Play next lesson now'
                    }
                  >
                    <Ionicons name="play" size={14} color="#FFFFFF" />
                    <Text style={styles.autoplayPlayNowText}>
                      {isBangla ? 'এখনই দেখুন' : 'Play Now'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  stickyPlayerFrame: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#0F192C',
    overflow: 'hidden',
    borderRadius: 14,
  },
  commuteExpandedFrame: {
    aspectRatio: undefined,
    minHeight: 236,
  },
  fullscreenLandscapeFrame: {
    width: '100%',
    height: '100%',
    aspectRatio: undefined,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 0,
    zIndex: 9999,
  },
  forcedLandscapeFrame: {
    position: 'absolute',
    aspectRatio: undefined,
    transform: [{ rotate: '90deg' }],
    borderRadius: 0,
    zIndex: 9999,
  },
  playerContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#0F192C',
  },
  playerMediaFill: {
    flex: 1,
  },
  commuteHiddenMedia: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 2,
    height: 2,
    opacity: 0.01,
    overflow: 'hidden',
  },
  commuteOverlay: {
    flex: 1,
    zIndex: 25,
  },
  videoWebView: {
    flex: 1,
    backgroundColor: '#0F192C',
  },
  loadingVideoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    padding: 16,
  },
  loadingVideoText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
  },
  videoFallbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#102F53',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
    borderRadius: 8,
  },
  videoFallbackBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  lockedCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  lockedIconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(227, 66, 52, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  lockedTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  lockedSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11.5,
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
    lineHeight: 16,
  },
  lockedActionsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  lockedPurchaseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E34234',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
  },
  lockedPurchaseBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  lockedPreviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  lockedPreviewBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  quizHeroCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  quizHeroBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(227, 66, 52, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quizHeroTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  quizHeroSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
  },
  quizHeroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
  },
  quizHeroBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  serverPlayerControlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    padding: 10,
  },
  serverPlayerTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serverPlayerTitleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    maxWidth: '52%',
  },
  serverPlayerTitleText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  serverPlayerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  serverPlayerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 14,
  },
  serverPlayerActionBtnActive: {
    backgroundColor: '#102F53',
    borderColor: '#E34234',
    borderWidth: 1,
  },
  landscapePillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  screenLockGuard: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#102F53',
    borderColor: '#E34234',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
  },
  unlockPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  comingSoonCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  comingSoonIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(227, 66, 52, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  comingSoonTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  comingSoonSub: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 14,
    lineHeight: 17,
    marginBottom: 12,
  },
  comingSoonNextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#E34234',
    paddingHorizontal: 16,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: 8,
  },
  comingSoonNextBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  autoplayCountdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    zIndex: 35,
  },
  autoplayCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    width: '85%',
  },
  autoplayBadgeText: {
    color: '#6366F1',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  autoplayCountdownSec: {
    fontSize: 26,
    fontWeight: '900',
    color: '#6366F1',
    marginVertical: 4,
    fontVariant: ['tabular-nums'],
  },
  autoplayNextTitle: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  autoplayActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  autoplayCancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  autoplayCancelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  autoplayPlayNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#6366F1',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  autoplayPlayNowText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
