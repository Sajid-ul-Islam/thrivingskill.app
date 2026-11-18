import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { WebView } from 'react-native-webview';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { triggerHaptic } from '../../utils/haptics';
import { NativeMedia3Player, NativeMedia3PlayerRef } from './NativeMedia3Player';
import { VideoPlayerGestureOverlay } from './VideoPlayerGestureOverlay';
import { LessonCommuteCard } from './LessonCommuteCard';
import { Lesson, Course } from '../../types';

interface LessonVideoContainerProps {
  course: Course;
  currentLesson: Lesson;
  moduleTitle?: string;
  canPlayVideo: boolean;
  isLessonCompleted: boolean;
  isCommuteMode: boolean;
  isPlaying: boolean;
  playbackSpeed: string;
  streamQuality: string;
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
  previewLesson?: Lesson;
  onSelectLesson: (courseId: string, lessonId: string) => void;
  onOpenPaymentModal: () => void;
  onOpenQuizPlayer: (lesson: Lesson) => void;
  onTogglePlay: () => void;
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
  onProgressUpdate: (sec: number) => void;
  onPlayStateChange: (playing: boolean) => void;
  formatSeconds: (sec: number) => string;
}

export const LessonVideoContainer: React.FC<LessonVideoContainerProps> = ({
  course,
  currentLesson,
  moduleTitle,
  canPlayVideo,
  isLessonCompleted,
  isCommuteMode,
  isPlaying,
  playbackSpeed,
  streamQuality,
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
  previewLesson,
  onSelectLesson,
  onOpenPaymentModal,
  onOpenQuizPlayer,
  onTogglePlay,
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
  onPlayStateChange,
  formatSeconds,
}) => {
  const { colors, isDark } = useTheme();
  const { isBangla } = useLanguage();

  return (
    <View
      style={[
        styles.stickyPlayerFrame,
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
        <View style={[styles.lockedCard, { backgroundColor: isDark ? colors.surfaceCard : '#102F53' }]}>
          <View style={styles.lockedIconBg}>
            <Ionicons name="lock-closed" size={34} color="#FFB606" />
          </View>
          <Text style={styles.lockedTitle}>
            {isBangla ? 'সদস্যদের জন্য সংরক্ষিত লেসন' : 'Enrolled Member Access'}
          </Text>
          <Text style={styles.lockedSub}>
            {isBangla
              ? 'এই লেসনের সম্পূর্ণ ভিডিও দেখতে অনুগ্রহ করে অ্যাকাউন্ট অ্যাক্সেস সিঙ্ক করুন।'
              : 'Sign in with an enrolled account to access all lectures and certificates.'}
          </Text>
          <View style={styles.lockedActionsCol}>
            <TouchableOpacity
              style={styles.lockedPurchaseBtn}
              onPress={onOpenPaymentModal}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel="Sync account access"
            >
              <Ionicons name="sync" size={15} color="#102F53" />
              <Text style={styles.lockedPurchaseBtnText}>
                {isBangla ? 'অ্যাকাউন্ট অ্যাক্সেস সিঙ্ক করুন' : 'Sync Account Access'}
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
                <Ionicons name="play-outline" size={14} color="#FFB606" />
                <Text style={styles.lockedPreviewBtnText}>
                  {isBangla ? 'ফ্রি প্রিভিউ দেখুন' : 'Watch Free Preview'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ) : currentLesson.type === 'quiz' ? (
        /* DEDICATED QUIZ HERO FRAME */
        <View style={[styles.quizHeroCard, { backgroundColor: isDark ? colors.surfaceCard : '#102F53' }]}>
          <View style={styles.quizHeroBadge}>
            <Ionicons name="help-circle" size={32} color="#FFB606" />
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
              { backgroundColor: isLessonCompleted ? '#059669' : '#FFB606' },
            ]}
            onPress={() => onOpenQuizPlayer(currentLesson)}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="Open Chapter Quiz"
          >
            <Ionicons
              name={isLessonCompleted ? 'refresh' : 'play'}
              size={16}
              color={isLessonCompleted ? '#FFFFFF' : '#102F53'}
            />
            <Text
              style={[
                styles.quizHeroBtnText,
                { color: isLessonCompleted ? '#FFFFFF' : '#102F53' },
              ]}
            >
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
      ) : isCommuteMode ? (
        /* Interactive Commute Audio Mode */
        <LessonCommuteCard
          currentLesson={currentLesson}
          course={course}
          moduleTitle={moduleTitle}
          isPlaying={isPlaying}
          currentPositionSeconds={currentPositionSeconds}
          totalLessonSeconds={totalLessonSeconds}
          playbackSpeed={playbackSpeed}
          hasPrevLesson={hasPrevLesson}
          hasNextLesson={hasNextLesson}
          onTogglePlay={onTogglePlay}
          onRewind={onRewind}
          onForward={onForward}
          onPrevLesson={onPrevLesson}
          onNextLesson={onNextLesson}
          onCycleSpeed={onCycleSpeed}
          formatSeconds={formatSeconds}
        />
      ) : zoomMeetingUrl ? (
        /* LIVE COHORT MASTERCLASS: Direct Zoom Session Launcher */
        <View style={[styles.playerContainer, { backgroundColor: '#102F53', justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
          <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#2D8CFF25', justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
            <Ionicons name="videocam" size={26} color="#2D8CFF" />
          </View>
          <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800', textAlign: 'center', marginBottom: 4 }}>
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
      ) : (
        /* ACTUAL REAL VIDEO PLAYER: WebView with Android Media3 / ExoPlayer & Gesture Overlay */
        <View style={styles.playerContainer}>
          {isLoadingVideo ? (
            <View style={styles.loadingVideoOverlay}>
              <ActivityIndicator size="large" color="#FFB606" />
              <Text style={styles.loadingVideoText}>Loading video stream (Media3)...</Text>
            </View>
          ) : isDirectStream && activeVideoUrl ? (
            <NativeMedia3Player
              ref={nativePlayerRef}
              sourceUrl={activeVideoUrl}
              title={currentLesson.title}
              courseTitle={course?.title}
              playbackSpeed={parseFloat(playbackSpeed) || 1.0}
              isCommuteMode={isCommuteMode}
              onProgress={onProgressUpdate}
              onPlayStateChange={onPlayStateChange}
              onEnd={onMarkComplete}
              onPictureInPictureStart={onPictureInPictureStart}
              onPictureInPictureStop={onPictureInPictureStop}
            />
          ) : (
            <WebView
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
              userAgent="Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
              renderError={() => (
                <View style={styles.loadingVideoOverlay}>
                  <Ionicons name="alert-circle-outline" size={32} color="#FFB606" />
                  <Text style={[styles.loadingVideoText, { color: '#FFFFFF', marginTop: 4 }]}>
                    {isBangla ? 'ভিডিও স্ট্রিমে সংযোগ ব্যর্থ হয়েছে' : 'Video stream unavailable'}
                  </Text>
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
                      accessibilityLabel={isBangla ? 'ব্রাউজারে ভিডিও চালু করুন' : 'Watch in Browser / App'}
                    >
                      <Ionicons name="open-outline" size={14} color="#102F53" />
                      <Text style={styles.videoFallbackBtnText}>
                        {isBangla ? 'ব্রাউজারে ভিডিও চালু করুন' : 'Watch in Browser / App'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            />
          )}

          {/* DUAL-MODE CONTROLLER */}
          {isDirectStream ? (
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
            /* Minimalist Floating Controls for Server-Driven Video */
            <View style={styles.serverPlayerControlsOverlay} pointerEvents="box-none">
              <View style={styles.serverPlayerTopBar} pointerEvents="box-none">
                <View style={styles.serverPlayerTitleBadge} pointerEvents="none">
                  <Ionicons name="play-circle" size={14} color="#FFB606" />
                  <Text style={styles.serverPlayerTitleText} numberOfLines={1}>
                    {currentLesson.title}
                  </Text>
                </View>

                <View style={styles.serverPlayerActionsRow}>
                  <TouchableOpacity
                    style={styles.serverPlayerActionBtn}
                    onPress={onToggleScreenLock}
                    accessibilityRole="button"
                    accessibilityLabel="Lock or unlock screen touches"
                  >
                    <Ionicons
                      name={isScreenLocked ? 'lock-closed' : 'lock-open-outline'}
                      size={16}
                      color={isScreenLocked ? '#FFB606' : '#FFFFFF'}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.serverPlayerActionBtn,
                      isFullscreen && styles.serverPlayerActionBtnActive,
                    ]}
                    onPress={onToggleFullscreen}
                    accessibilityRole="button"
                    accessibilityLabel={isFullscreen ? 'Exit landscape mode' : 'Enter landscape mode'}
                  >
                    <Ionicons
                      name={isFullscreen ? 'contract-outline' : 'scan-outline'}
                      size={17}
                      color="#FFFFFF"
                    />
                    <Text style={styles.landscapePillText}>
                      {isFullscreen ? (isBangla ? 'প্রস্থান' : 'Exit') : (isBangla ? 'ল্যান্ডস্কেপ' : 'Landscape')}
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
                    accessibilityLabel={isBangla ? 'ভিডিও কন্ট্রোল আনলক করুন' : 'Unlock video controls'}
                  >
                    <Ionicons name="lock-closed" size={18} color="#FFB606" />
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
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
                    accessibilityLabel={isBangla ? 'পরবর্তী লেসন এখনই চালু করুন' : 'Play next lesson now'}
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
    backgroundColor: '#000000',
    overflow: 'hidden',
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
    zIndex: 9999,
  },
  forcedLandscapeFrame: {
    position: 'absolute',
    transform: [{ rotate: '90deg' }],
    zIndex: 9999,
  },
  playerContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#000000',
  },
  videoWebView: {
    flex: 1,
    backgroundColor: '#000000',
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
    color: '#FFB606',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
  },
  videoFallbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFB606',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  videoFallbackBtnText: {
    color: '#102F53',
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
    backgroundColor: 'rgba(255, 182, 6, 0.15)',
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
    backgroundColor: '#FFB606',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
  },
  lockedPurchaseBtnText: {
    color: '#102F53',
    fontSize: 12,
    fontWeight: '800',
  },
  lockedPreviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: '#FFB606',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  lockedPreviewBtnText: {
    color: '#FFB606',
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
    backgroundColor: 'rgba(255, 182, 6, 0.15)',
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
    maxWidth: '65%',
  },
  serverPlayerTitleText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  serverPlayerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    borderColor: '#FFB606',
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
    borderColor: '#FFB606',
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
