import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useTheme } from '../context/ThemeContext';
import { useLearning } from '../context/LearningContext';
import { Header } from '../components/Header';
import { QuizModal } from '../components/QuizModal';
import { QuizPlayerModal } from '../components/QuizPlayerModal';
import { NotesModal } from '../components/NotesModal';
import { CertificateModal } from '../components/CertificateModal';
import { MandatoryReviewModal } from '../components/MandatoryReviewModal';
import { PaymentModal } from '../components/PaymentModal';
import {
  CourseQnATab,
  LiveAudioWaveform,
  VideoPlayerGestureOverlay,
  LessonTranscriptTab,
  DownloadQualityModal,
  QuickNoteBottomSheet,
  PiPFloatingPlayer,
} from '../components/player';
import { SpringPressable, StateView } from '../components/common';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useGamification } from '../context/GamificationContext';
import { useFeedback } from '../context/FeedbackContext';
import { triggerHaptic } from '../utils/haptics';
import { resolveLessonVideoData } from '../data/lessonVideosRegistry';
import { OfflineManager } from '../services/offline/offlineManager';
import { SpacedRepetitionModal } from '../components/modals/SpacedRepetitionModal';
import { LessonsService, LessonDetail } from '../services/api/lessonsService';
import { MIN_TOUCH_TARGET } from '../theme/typography';
import { shape } from '../theme/shapes';
import { Lesson, Certificate } from '../types';

interface LessonPlayerScreenProps {
  courseId: string;
  lessonId: string;
  onBack: () => void;
  onSelectLesson: (courseId: string, lessonId: string) => void;
}

type PlayerTab = 'curriculum' | 'notes' | 'transcript' | 'qna';

export const LessonPlayerScreen: React.FC<LessonPlayerScreenProps> = ({
  courseId,
  lessonId,
  onBack,
  onSelectLesson,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { t, isBangla } = useLanguage();
  const { user, isAdmin } = useAuth();
  const { showToast } = useFeedback();
  const { recordStudyTime, unlockBadge, triggerCelebration } = useGamification();
  const {
    getCourseById,
    userProgress,
    enrollInCourse,
    markLessonCompleted,
    getNotesForLesson,
    addNote,
    deleteNote,
    restoreNote,
    certificates,
    recordWatchPosition,
    getWatchPosition,
    hasReviewedCourse,
    isCertificateUnlocked,
    submitMandatoryCourseReview,
    recordCategoryInteraction,
  } = useLearning();

  const [windowDimensions, setWindowDimensions] = useState(Dimensions.get('window'));
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<string>('1.0x');
  const [activeTab, setActiveTab] = useState<PlayerTab>('curriculum');
  const [isCommuteMode, setIsCommuteMode] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isScreenLocked, setIsScreenLocked] = useState<boolean>(false);
  const [isPiPActive, setIsPiPActive] = useState<boolean>(false);
  const [isQuickNoteOpen, setIsQuickNoteOpen] = useState<boolean>(false);

  // Quality & Download states
  const [streamQuality, setStreamQuality] = useState<string>('720p HD');
  const [selectedDownloadQuality, setSelectedDownloadQuality] = useState<string>('720p HD');
  const [qualityModalVisible, setQualityModalVisible] = useState<boolean>(false);
  const [qualityModalMode, setQualityModalMode] = useState<'download' | 'streamQuality'>('download');
  const [isDownloaded, setIsDownloaded] = useState<boolean>(false);

  // Modals
  const [quizModalVisible, setQuizModalVisible] = useState<boolean>(false);
  const [quizPlayerVisible, setQuizPlayerVisible] = useState<boolean>(false);
  const [notesModalVisible, setNotesModalVisible] = useState<boolean>(false);
  const [certModalVisible, setCertModalVisible] = useState<boolean>(false);
  const [mandatoryReviewVisible, setMandatoryReviewVisible] = useState<boolean>(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState<boolean>(false);
  const [autoplayCountdown, setAutoplayCountdown] = useState<number | null>(null);
  const [unlockedCert, setUnlockedCert] = useState<Certificate | null>(null);
  const [currentPositionSeconds, setCurrentPositionSeconds] = useState<number>(0);
  const [lessonDetail, setLessonDetail] = useState<LessonDetail | null>(null);
  const [isLoadingVideo, setIsLoadingVideo] = useState<boolean>(true);
  const [isFlashcardsVisible, setIsFlashcardsVisible] = useState<boolean>(false);

  const currentPosRef = useRef<number>(currentPositionSeconds);
  currentPosRef.current = currentPositionSeconds;

  // Horizontal Tab ScrollView Ref
  const tabScrollViewRef = useRef<React.ElementRef<typeof ScrollView> | null>(null);

  // Timer refs conforming to AGENTS.md Rule 3
  const autoplayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const course = getCourseById(courseId);

  // Flatten lessons list for next/prev navigation
  const allLessons: { moduleTitle: string; lesson: Lesson }[] = [];
  course?.modules?.forEach((mod) => {
    mod.lessons?.forEach((l) => {
      allLessons.push({ moduleTitle: mod.title, lesson: l });
    });
  });

  const currentLessonIndex = allLessons.findIndex((item) => item.lesson.id === lessonId);
  const currentItem = allLessons[currentLessonIndex] || allLessons[0];
  const currentLesson = currentItem?.lesson;

  // Access Control: Administrator has master power to play all videos without purchase
  const isEnrolled = !!userProgress[course?.id || ''];
  const isFreePreview = Boolean(currentLesson?.isFreePreview);
  const canPlayVideo = isAdmin || isEnrolled || isFreePreview;

  const progress = course ? userProgress[course.id] : undefined;
  const isLessonCompleted = progress?.completedLessonIds.includes(currentLesson?.id || '') || false;
  const lessonNotes = currentLesson ? getNotesForLesson(courseId, currentLesson.id) : [];

  // Listen for screen orientation / dimension changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }: { window: { width: number; height: number } }) => {
      setWindowDimensions(window as any);
      if (window.width > window.height && !isFullscreen) {
        setIsFullscreen(true);
      } else if (window.width <= window.height && isFullscreen) {
        setIsFullscreen(false);
      }
    });
    return () => subscription?.remove();
  }, [isFullscreen]);

  // Fetch actual lesson details and video metadata from backend
  useEffect(() => {
    let isMounted = true;
    if (currentLesson?.id) {
      setIsLoadingVideo(true);
      LessonsService.getLessonDetail(currentLesson.id)
        .then((detail) => {
          if (isMounted) {
            setLessonDetail(detail);
            setIsLoadingVideo(false);
          }
        })
        .catch(() => {
          if (isMounted) {
            setIsLoadingVideo(false);
          }
        });
    }
    return () => {
      isMounted = false;
    };
  }, [currentLesson?.id]);

  // Cleanup all timers on unmount conforming to AGENTS.md Rule 3
  useEffect(() => {
    return () => {
      if (autoplayTimerRef.current) {
        clearTimeout(autoplayTimerRef.current);
        autoplayTimerRef.current = null;
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, []);

  const parseDurationToSeconds = (dur?: string): number => {
    if (!dur) return 600;
    if (dur.includes(':')) {
      const parts = dur.split(':').map((p) => parseInt(p, 10));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) return parts[0] * 60 + parts[1];
      if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    const mins = parseInt(dur, 10);
    return !isNaN(mins) ? mins * 60 : 600;
  };

  const totalLessonSeconds = parseDurationToSeconds(currentLesson?.duration);

  useEffect(() => {
    if (currentLesson?.id) {
      OfflineManager.isLessonDownloaded(currentLesson.id).then(setIsDownloaded);
      const savedSec = getWatchPosition(courseId, currentLesson.id);
      setCurrentPositionSeconds(savedSec || 0);
      setAutoplayCountdown(null);
    }
  }, [currentLesson?.id, courseId]);

  useEffect(() => {
    if (course?.category) {
      recordCategoryInteraction(course.category);
    }
  }, [course?.category]);

  // Continuous Auto-play countdown effect
  useEffect(() => {
    if (autoplayCountdown === null) return;
    if (autoplayCountdown <= 0) {
      setAutoplayCountdown(null);
      if (currentLessonIndex < allLessons.length - 1) {
        const nextL = allLessons[currentLessonIndex + 1].lesson;
        setCurrentPositionSeconds(0);
        onSelectLesson(courseId, nextL.id);
      }
      return;
    }

    if (autoplayTimerRef.current) clearTimeout(autoplayTimerRef.current);
    autoplayTimerRef.current = setTimeout(() => {
      autoplayTimerRef.current = null;
      setAutoplayCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => {
      if (autoplayTimerRef.current) {
        clearTimeout(autoplayTimerRef.current);
        autoplayTimerRef.current = null;
      }
    };
  }, [autoplayCountdown, currentLessonIndex, allLessons, courseId]);

  // Video watch time tracking interval & continuous video auto-play
  useEffect(() => {
    if (!isPlaying || !currentLesson || !course || autoplayCountdown !== null || !canPlayVideo) return;

    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = setInterval(() => {
      const next = currentPosRef.current + 1;
      currentPosRef.current = next;
      setCurrentPositionSeconds(next);

      if (next % 5 === 0) {
        recordWatchPosition(course.id, currentLesson.id, next);
      }
      // Auto-complete & transition when video duration finishes
      if (next >= totalLessonSeconds && totalLessonSeconds > 0) {
        markLessonCompleted(course.id, currentLesson.id);
        recordStudyTime(10);
        unlockBadge('streak_champ');

        const isLastLesson = currentLessonIndex >= allLessons.length - 1;
        if (isLastLesson) {
          setIsPlaying(false);
          if (!hasReviewedCourse(course.id)) {
            setMandatoryReviewVisible(true);
          } else {
            setCertModalVisible(true);
          }
        } else {
          setAutoplayCountdown(5);
        }
      }
    }, 1000);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [isPlaying, currentLesson?.id, course?.id, autoplayCountdown, totalLessonSeconds, currentLessonIndex, allLessons.length, canPlayVideo]);

  const handleRewind = (sec: number = 10) => {
    const next = Math.max(0, currentPosRef.current - sec);
    currentPosRef.current = next;
    setCurrentPositionSeconds(next);
    if (course && currentLesson) recordWatchPosition(course.id, currentLesson.id, next);
  };

  const handleForward = (sec: number = 10) => {
    const next = currentPosRef.current + sec;
    currentPosRef.current = next;
    setCurrentPositionSeconds(next);
    if (course && currentLesson) recordWatchPosition(course.id, currentLesson.id, next);
  };

  const handleSeekTo = (sec: number) => {
    const next = Math.max(0, Math.min(sec, totalLessonSeconds));
    currentPosRef.current = next;
    setCurrentPositionSeconds(next);
    if (course && currentLesson) recordWatchPosition(course.id, currentLesson.id, next);
  };

  const formatSeconds = (sec: number): string => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  const handleOpenDownloadModal = () => {
    triggerHaptic('light');
    setQualityModalMode('download');
    setQualityModalVisible(true);
  };

  const handleOpenStreamQualityModal = () => {
    triggerHaptic('light');
    setQualityModalMode('streamQuality');
    setQualityModalVisible(true);
  };

  const handleStartDownloadWithQuality = async (quality: '360p' | '720p' | '1080p') => {
    if (!currentLesson || !course) return;
    setSelectedDownloadQuality(`${quality} HD`);
    await OfflineManager.saveLessonOffline(
      course.id,
      currentLesson,
      undefined,
      course.title,
      undefined,
      undefined,
      `${quality} HD`
    );
    setIsDownloaded(true);
    showToast({
      message: `Lesson downloaded in ${quality} HD`,
      type: 'success',
      actionLabel: 'Undo',
      onAction: async () => {
        await OfflineManager.removeDownloadedLesson(currentLesson.id);
        setIsDownloaded(false);
        showToast({ message: 'Download removed', type: 'info' });
      },
    });
  };

  const handleToggleOffline = async () => {
    if (!currentLesson || !course) return;
    if (isDownloaded) {
      await OfflineManager.removeDownloadedLesson(currentLesson.id);
      setIsDownloaded(false);
      showToast({
        message: 'Removed from offline downloads',
        type: 'info',
        actionLabel: 'Undo',
        onAction: () => {
          OfflineManager.saveLessonOffline(course.id, currentLesson, undefined, course.title).then(() => {
            setIsDownloaded(true);
            showToast({ message: 'Restored offline lesson', type: 'success' });
          });
        },
      });
    } else {
      handleOpenDownloadModal();
    }
  };

  const handleNextLesson = () => {
    setAutoplayCountdown(null);
    if (currentLessonIndex < allLessons.length - 1) {
      const nextL = allLessons[currentLessonIndex + 1].lesson;
      setCurrentPositionSeconds(0);
      onSelectLesson(courseId, nextL.id);
    }
  };

  const handlePrevLesson = () => {
    setAutoplayCountdown(null);
    if (currentLessonIndex > 0) {
      const prevL = allLessons[currentLessonIndex - 1].lesson;
      setCurrentPositionSeconds(0);
      onSelectLesson(courseId, prevL.id);
    }
  };

  const handleMarkComplete = () => {
    if (!currentLesson || !course) return;
    markLessonCompleted(course.id, currentLesson.id);
    recordStudyTime(10);
    unlockBadge('streak_champ');

    triggerCelebration({
      title: isBangla ? 'পাঠ সম্পন্ন হয়েছে! 🎉' : 'Lesson Mastered! 🎉',
      subtitle: `${currentLesson.title} • +50 XP`,
      xpAwarded: 50,
      icon: 'checkmark-circle',
    });

    const totalLessons = allLessons.length;
    const currentCompleted = progress?.completedLessonIds.length || 0;
    const isAlreadyMarked = progress?.completedLessonIds.includes(currentLesson.id);
    const completedCount = isAlreadyMarked ? currentCompleted : currentCompleted + 1;

    if (completedCount >= totalLessons) {
      if (!hasReviewedCourse(course.id)) {
        setMandatoryReviewVisible(true);
      } else {
        setCertModalVisible(true);
      }
    } else {
      setAutoplayCountdown(5);
    }
  };

  const handleSubmitReview = (rating: number, feedback: string) => {
    if (!course) return;
    const newCert = submitMandatoryCourseReview(
      course.id,
      rating,
      feedback,
      user?.displayName || user?.username || 'Executive Graduate',
      'Course Graduate'
    );
    setMandatoryReviewVisible(false);
    if (newCert) {
      setUnlockedCert(newCert);
    }
    setCertModalVisible(true);
  };

  // ONE-TAP SPEED PILL: Cycles directly without digging into submenus
  const cycleSpeed = () => {
    const speeds = ['1.0x', '1.25x', '1.5x', '2.0x', '0.75x'];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextIdx]);
    showToast({ message: `Playback speed: ${speeds[nextIdx]}`, type: 'info' });
  };

  // FAB Note Trigger: Pauses video, grabs timestamp, opens bottom sheet without hiding top video
  const handleOpenNotesFAB = () => {
    triggerHaptic('medium');
    setIsPlaying(false);
    setIsQuickNoteOpen(true);
  };

  // Tab definitions
  const TABS: { id: PlayerTab; label: string; icon: any }[] = [
    { id: 'curriculum', label: isBangla ? 'লেকচার' : 'Lectures', icon: 'list' },
    { id: 'notes', label: `${isBangla ? 'নোটস' : 'Notes'} (${lessonNotes.length})`, icon: 'document-text' },
    { id: 'transcript', label: isBangla ? 'ট্রান্সক্রিপ্ট' : 'Transcript', icon: 'chatbox-ellipses' },
    { id: 'qna', label: isBangla ? 'প্রশ্ন-উত্তর' : 'Q&A', icon: 'chatbubbles' },
  ];

  const screenWidth = windowDimensions.width;

  const handleTabPress = (tabId: PlayerTab, index: number) => {
    triggerHaptic('light');
    setActiveTab(tabId);
    tabScrollViewRef.current?.scrollTo({ x: index * screenWidth, animated: true });
  };

  const handleTabScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / screenWidth);
    const selected = TABS[index];
    if (selected && selected.id !== activeTab) {
      triggerHaptic('light');
      setActiveTab(selected.id);
    }
  };

  if (!course || !currentLesson) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header showBack onBack={onBack} title="Lesson Player" />
        <View style={[styles.centerContainer, { paddingHorizontal: 20 }]}>
          <StateView
            mode="error"
            title="Lesson not found"
            message="This lecture could not be loaded right now. Return to the course syllabus to choose another lesson."
            primaryActionLabel="Go Back"
            onPrimaryAction={onBack}
          />
        </View>
      </View>
    );
  }

  const isCertUnlocked = isCertificateUnlocked(course.id);
  const certFromList =
    certificates.find((c) => c.courseId === course.id) ||
    (progress?.certificateId
      ? certificates.find((c) => c.credentialId === progress.certificateId)
      : null);

  const userCert =
    unlockedCert ||
    (isCertUnlocked
      ? certFromList || {
          id: `cert-${course.id}`,
          courseId: course.id,
          courseTitle: course.title,
          studentName: user?.displayName || user?.username || 'Executive Graduate',
          issueDate: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          credentialId: progress?.certificateId || `TS-2026-${course.id.slice(-4).toUpperCase()}`,
          verificationUrl: `https://thrivingskill.com/verify/${
            progress?.certificateId || `TS-2026-${course.id.slice(-4).toUpperCase()}`
          }`,
          instructorName: course.instructor.name,
        }
      : null);

  const isCourseCompleted =
    progress?.isCompleted ||
    (allLessons.length > 0 &&
      allLessons.every((item) => progress?.completedLessonIds.includes(item.lesson.id)));

  // Fallback authentic video from Thriving Skills Lesson Video Registry
  const fallbackLessonVideo = resolveLessonVideoData(
    course || { id: courseId, title: 'Course' },
    currentLesson,
    currentLessonIndex >= 0 ? currentLessonIndex : 0
  );

  // Determine active video source & intro markup
  const activeVideoIntro = lessonDetail?.videoIntro || currentLesson?.videoIntro;
  const rawUrl = lessonDetail?.videoUrl || currentLesson?.videoUrl;
  const activeVideoUrl =
    rawUrl ||
    (activeVideoIntro && !activeVideoIntro.includes('<iframe') && (activeVideoIntro.startsWith('http') || activeVideoIntro.includes('vimeo') || activeVideoIntro.includes('youtu'))
      ? activeVideoIntro.trim()
      : undefined) ||
    fallbackLessonVideo.videoUrl;

  const resolvedVideoUrl = activeVideoUrl || fallbackLessonVideo.videoUrl;

  // Live cohort masterclass Zoom detection
  const rawContent = lessonDetail?.content || currentLesson?.summary || '';
  const zoomMatch =
    (activeVideoIntro && activeVideoIntro.match(/https?:\/\/[^\s"'<>]*zoom\.us\/[^\s"'<>]*/i)) ||
    (activeVideoUrl && activeVideoUrl.match(/https?:\/\/[^\s"'<>]*zoom\.us\/[^\s"'<>]*/i)) ||
    (rawContent && rawContent.match(/https?:\/\/[^\s"'<>]*zoom\.us\/[^\s"'<>]*/i));
  const zoomMeetingUrl = zoomMatch ? zoomMatch[0].replace(/&amp;/g, '&') : null;

  // Android Media3 Jetpack architecture with Adaptive Bitrate Streaming (HLS/DASH)
  const buildVideoHtml = () => {
    let embedMarkup = '';
    if (activeVideoIntro && activeVideoIntro.includes('<iframe')) {
      embedMarkup = activeVideoIntro
        .replace(/src=["']\/\//gi, 'src="https://')
        .replace(/width="[^"]*"/gi, 'width="100%"')
        .replace(/height="[^"]*"/gi, 'height="100%"');
      if (!embedMarkup.includes('allow=')) {
        embedMarkup = embedMarkup.replace('<iframe', '<iframe allow="autoplay; fullscreen; picture-in-picture" allowfullscreen');
      }
    } else if (activeVideoUrl) {
      if (activeVideoUrl.includes('vimeo.com')) {
        let vSrc = activeVideoUrl;
        if (!activeVideoUrl.includes('player.vimeo.com/video/')) {
          const vMatch = activeVideoUrl.match(/vimeo\.com\/(\d+)/);
          const vId = vMatch ? vMatch[1] : '';
          vSrc = `https://player.vimeo.com/video/${vId}`;
        }
        const joinChar = vSrc.includes('?') ? '&' : '?';
        const vUrlWithParams = `${vSrc}${joinChar}autoplay=1&title=0&byline=0&portrait=0&dnt=1`;
        embedMarkup = `<iframe src="${vUrlWithParams}" width="100%" height="100%" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;"></iframe>`;
      } else if (activeVideoUrl.includes('youtube.com') || activeVideoUrl.includes('youtu.be')) {
        let ytId = '';
        const yMatch = activeVideoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
        if (yMatch && yMatch[1]) ytId = yMatch[1];
        const ytSrc = ytId ? `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&playsinline=1&modestbranding=1&rel=0&enablejsapi=1` : activeVideoUrl;
        embedMarkup = `<iframe src="${ytSrc}" width="100%" height="100%" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;"></iframe>`;
      } else if (activeVideoUrl.match(/\.(mp4|m3u8|mpd|webm)($|\?)/i)) {
        embedMarkup = `<video id="media3Player" src="${activeVideoUrl}" playsinline webkit-playsinline autoplay style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:contain;background:#000;"></video>`;
      } else {
        embedMarkup = `<iframe src="${activeVideoUrl}" width="100%" height="100%" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;"></iframe>`;
      }
    } else {
      embedMarkup = `<div style="color:#FFF;font-family:system-ui,sans-serif;text-align:center;padding:40px 20px;"><div style="font-size:32px;margin-bottom:8px;">▶️</div><div>Loading lecture media stream...</div></div>`;
    }

    return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
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
</head>
<body>
  <div class="video-wrapper">
    ${embedMarkup}
  </div>
</body>
</html>`;
  };

  const previewLesson =
    course?.modules?.flatMap((m) => m.lessons || []).find((l) => l.isFreePreview) ||
    course?.modules?.[0]?.lessons?.[0];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar hidden={isFullscreen} style={isDark ? 'light' : 'dark'} />

      {/* Top Header (Visible in portrait mode) */}
      {!isFullscreen && (
        <Header
          showBack
          onBack={onBack}
          title={course?.title || 'Course Player'}
          subtitle={currentItem?.moduleTitle}
          rightAction={
            <TouchableOpacity
              style={[
                styles.commuteToggleBtn,
                { backgroundColor: isCommuteMode ? '#102F53' : colors.surfaceSubtle },
              ]}
              onPress={() => {
                triggerHaptic('light');
                setIsCommuteMode(!isCommuteMode);
              }}
              accessibilityRole="button"
              accessibilityLabel="Toggle commute background audio mode"
            >
              <Ionicons
                name={isCommuteMode ? 'headset' : 'headset-outline'}
                size={16}
                color={isCommuteMode ? '#FFB606' : colors.text}
              />
            </TouchableOpacity>
          }
        />
      )}

      {/* Administrator Access Banner */}
      {isAdmin && !isFullscreen && (
        <View style={[styles.adminBanner, { backgroundColor: '#102F53', borderColor: '#FFB606' }]}>
          <View style={styles.adminBannerLeft}>
            <Ionicons name="shield-checkmark" size={14} color="#FFB606" />
            <Text style={styles.adminBannerTitle}>ADMINISTRATOR ACCESS ACTIVE</Text>
          </View>
          <Text style={styles.adminBannerSub}>
            {isBangla ? 'অ্যাডমিন ক্ষমতা: কোর্সের সকল ভিডিও আনলক করা হয়েছে' : 'Master bypass: Unrestricted playback of all course videos'}
          </Text>
        </View>
      )}

      {/* Free Preview Banner */}
      {!isAdmin && !isEnrolled && isFreePreview && !isFullscreen && (
        <View
          style={[
            styles.previewBanner,
            {
              backgroundColor: isDark ? 'rgba(59, 130, 246, 0.16)' : '#EFF6FF',
              borderColor: '#3B82F6',
            },
          ]}
        >
          <Ionicons name="sparkles" size={14} color={isDark ? '#93C5FD' : '#2563EB'} />
          <Text style={[styles.previewBannerText, { color: isDark ? '#93C5FD' : '#1D4ED8' }]}>
            {isBangla ? 'ফ্রি প্রিভিউ লেকচার চলছে' : 'Free Preview Lesson • Enroll for Full Access'}
          </Text>
        </View>
      )}

      {/* 1. STICKY TOP 16:9 VIDEO PLAYER (ANCHORED, NEVER SCROLLS OUT OF VIEW IN PORTRAIT) */}
      <View
        style={[
          styles.stickyPlayerFrame,
          isFullscreen && styles.fullscreenPlayerFrame,
          { width: isFullscreen ? windowDimensions.width : '100%' },
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
                onPress={() => setPaymentModalVisible(true)}
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
                  onPress={() => onSelectLesson(courseId, previewLesson.id)}
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
        ) : isCommuteMode ? (
          /* Interactive Commute Audio Mode */
          <View
            style={[
              styles.commutePlayerCard,
              { backgroundColor: isDark ? colors.surfaceCard : '#102F53' },
            ]}
          >
            <View style={styles.commuteHeaderBadge}>
              <Ionicons name="leaf" size={13} color="#10B981" />
              <Text style={styles.commuteHeaderBadgeText}>
                Commute Mode Active • Bandwidth Saver (-85%)
              </Text>
            </View>
            <LiveAudioWaveform isPlaying={isPlaying} primaryColor="#FFB606" accentColor="#E34234" />
            <Text style={styles.commuteLessonTitle} numberOfLines={1}>
              {currentLesson.title}
            </Text>
            <Text style={styles.commuteInstructorText}>
              {course.instructor.name} • {currentItem?.moduleTitle}
            </Text>
            <View style={styles.commuteControlsRow}>
              <TouchableOpacity style={styles.commuteSkipBtn} onPress={() => handleRewind(15)}>
                <Ionicons name="play-back" size={20} color="#FFFFFF" />
                <Text style={styles.skipSecText}>15s</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handlePrevLesson}
                disabled={currentLessonIndex === 0}
                style={[styles.commuteSkipBtn, currentLessonIndex === 0 && { opacity: 0.4 }]}
              >
                <Ionicons name="play-skip-back" size={22} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.commuteMainPlayBtn, { backgroundColor: '#FFB606' }]}
                onPress={() => setIsPlaying(!isPlaying)}
              >
                <Ionicons name={isPlaying ? 'pause' : 'play'} size={26} color="#102F53" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleNextLesson}
                disabled={currentLessonIndex === allLessons.length - 1}
                style={[styles.commuteSkipBtn, currentLessonIndex === allLessons.length - 1 && { opacity: 0.4 }]}
              >
                <Ionicons name="play-skip-forward" size={22} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.commuteSkipBtn} onPress={() => handleForward(30)}>
                <Ionicons name="play-forward" size={20} color="#FFFFFF" />
                <Text style={styles.skipSecText}>30s</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.commuteBottomBar}>
              <Text style={styles.commuteTimeText}>
                {formatSeconds(currentPositionSeconds)} / {currentLesson.duration}
              </Text>
              <View style={styles.bgPlaybackNotice}>
                <Ionicons name="radio" size={12} color="#10B981" />
                <Text style={styles.bgPlaybackText}>Background Playback Active</Text>
              </View>
              <TouchableOpacity style={styles.speedPill} onPress={cycleSpeed}>
                <Text style={styles.speedPillText}>{playbackSpeed}</Text>
              </TouchableOpacity>
            </View>
          </View>
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
              onPress={() => Linking.openURL(zoomMeetingUrl).catch(() => {})}
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
            ) : (
              <WebView
                source={{ html: buildVideoHtml(), baseUrl: 'https://thrivingskill.com' }}
                style={styles.videoWebView}
                allowsFullscreenVideo
                javaScriptEnabled
                domStorageEnabled
                mediaPlaybackRequiresUserAction={false}
                allowsInlineMediaPlayback
                originWhitelist={['*']}
                mixedContentMode="always"
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
                        onPress={() => Linking.openURL(resolvedVideoUrl).catch(() => {})}
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

            {/* 2. ANDROID-SPECIFIC GESTURES & CONTROLS OVERLAY */}
            <VideoPlayerGestureOverlay
              isPlaying={isPlaying}
              onTogglePlay={() => setIsPlaying(!isPlaying)}
              currentPositionSeconds={currentPositionSeconds}
              totalDurationSeconds={totalLessonSeconds}
              onSeekTo={handleSeekTo}
              onRewind={handleRewind}
              onForward={handleForward}
              playbackSpeed={playbackSpeed}
              onCycleSpeed={cycleSpeed}
              videoQuality={streamQuality}
              onOpenQualityModal={handleOpenStreamQualityModal}
              isFullscreen={isFullscreen}
              onToggleFullscreen={() => {
                triggerHaptic('medium');
                setIsFullscreen(!isFullscreen);
              }}
              onTriggerPiP={() => {
                triggerHaptic('light');
                setIsPiPActive(true);
              }}
              title={currentLesson.title}
              subtitle={currentItem?.moduleTitle}
              isLocked={isScreenLocked}
              onToggleLock={() => {
                setIsScreenLocked(!isScreenLocked);
                showToast({
                  message: !isScreenLocked ? 'Screen Locked' : 'Screen Unlocked',
                  type: 'info',
                });
              }}
            />

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
                    {allLessons[currentLessonIndex + 1]?.lesson.title || 'Next Lesson'}
                  </Text>
                  <View style={styles.autoplayActionsRow}>
                    <TouchableOpacity
                      style={[styles.autoplayCancelBtn, { borderColor: colors.border }]}
                      onPress={() => setAutoplayCountdown(null)}
                    >
                      <Text style={[styles.autoplayCancelText, { color: colors.textMuted }]}>
                        {isBangla ? 'বাতিল' : 'Cancel'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.autoplayPlayNowBtn}
                      onPress={() => {
                        setAutoplayCountdown(null);
                        handleNextLesson();
                      }}
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

      {/* LOWER TABBED LEARNING AREA (LOWER 60-65% OF SCREEN, VISIBLE IN PORTRAIT) */}
      {!isFullscreen && (
        <View style={styles.lowerLearningArea}>
          {/* Quick Info & Action Header */}
          <View style={[styles.lessonHeaderCard, { borderBottomColor: colors.border }]}>
            <View style={styles.titleCol}>
              <Text style={[styles.lessonTitle, { color: colors.text }]} numberOfLines={1}>
                {currentLesson.title}
              </Text>
              <Text style={[styles.lessonInstructor, { color: colors.textMuted }]}>
                {course.instructor.name} • {currentLesson.duration}
              </Text>
            </View>

            <View style={styles.actionRowRight}>
              {/* Spaced repetition flashcards */}
              <TouchableOpacity
                style={[styles.headerActionBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
                onPress={() => {
                  triggerHaptic('light');
                  setIsFlashcardsVisible(true);
                }}
                accessibilityRole="button"
                accessibilityLabel="Study active recall flashcards"
              >
                <Ionicons name="sparkles" size={16} color={colors.brandGold} />
              </TouchableOpacity>

              {/* Offline download quality trigger */}
              <TouchableOpacity
                style={[
                  styles.headerActionBtn,
                  {
                    backgroundColor: isDownloaded ? colors.primary + '20' : colors.surfaceSubtle,
                    borderColor: isDownloaded ? colors.primary : colors.border,
                  },
                ]}
                onPress={handleToggleOffline}
                accessibilityRole="button"
                accessibilityLabel={isDownloaded ? "Manage downloaded lesson" : "Download lesson with quality options"}
              >
                <Ionicons
                  name={isDownloaded ? 'cloud-done' : 'cloud-download-outline'}
                  size={16}
                  color={isDownloaded ? colors.primary : colors.textMuted}
                />
              </TouchableOpacity>

              {/* Mark Complete Button */}
              <SpringPressable
                style={[
                  styles.completeBtn,
                  {
                    backgroundColor: isLessonCompleted ? colors.primaryLight : colors.primary,
                  },
                ]}
                onPress={handleMarkComplete}
                activeScale={0.96}
                accessibilityRole="button"
                accessibilityLabel={isLessonCompleted ? "Lesson already completed" : "Mark lesson as complete"}
              >
                <Ionicons
                  name={isLessonCompleted ? 'checkmark-circle' : 'checkmark'}
                  size={15}
                  color={isLessonCompleted ? colors.primary : colors.onPrimary}
                />
                <Text
                  style={[
                    styles.completeBtnText,
                    { color: isLessonCompleted ? colors.primary : colors.onPrimary },
                  ]}
                >
                  {isLessonCompleted ? t('lessonCompleted') : t('markComplete')}
                </Text>
              </SpringPressable>
            </View>
          </View>

          {/* SWIPEABLE BOTTOM TABS STRIP */}
          <View style={[styles.tabsStrip, { borderBottomColor: colors.border }]}>
            {TABS.map((tab, idx) => {
              const isActive = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.tabButton,
                    isActive && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
                  ]}
                  onPress={() => handleTabPress(tab.id, idx)}
                  accessibilityRole="tab"
                  accessibilityLabel={tab.label}
                >
                  <Ionicons
                    name={tab.icon}
                    size={15}
                    color={isActive ? colors.primary : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.tabButtonText,
                      {
                        color: isActive ? colors.primary : colors.textMuted,
                        fontWeight: isActive ? '700' : '500',
                      },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* HORIZONTAL SWIPEABLE PAGING SCROLLVIEW */}
          <ScrollView
            ref={tabScrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleTabScrollEnd}
            style={styles.horizontalPagingScroll}
          >
            {/* TAB 1: LECTURES (Curriculum Playlist) */}
            <View style={{ width: screenWidth }}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.tabContentScroll, { paddingBottom: Math.max(insets.bottom, 16) + 80 }]}
                nestedScrollEnabled
              >
                {/* Course Completion Banner */}
                {isCourseCompleted && (
                  <View
                    style={[
                      styles.completionBanner,
                      {
                        backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
                        borderColor: '#10B981',
                      },
                    ]}
                  >
                    <View style={styles.completionIconWrap}>
                      <Ionicons name="trophy" size={24} color="#F59E0B" />
                    </View>
                    <View style={styles.completionContent}>
                      <View style={styles.completionHeaderRow}>
                        <Text style={[styles.completionTitle, { color: isDark ? '#A7F3D0' : '#065F46' }]} numberOfLines={1}>
                          Course Completed! 🎓
                        </Text>
                        <View style={styles.completionXpBadge}>
                          <Text style={styles.completionXpText}>+150 XP</Text>
                        </View>
                      </View>
                      <Text style={[styles.completionSub, { color: isDark ? '#D1FAE5' : '#047857' }]}>
                        Congratulations! You've mastered all lectures. Your verified certificate is ready.
                      </Text>
                      <TouchableOpacity
                        style={styles.claimCertCTA}
                        onPress={() => setCertModalVisible(true)}
                        activeOpacity={0.85}
                        accessibilityRole="button"
                        accessibilityLabel="View verified digital certificate"
                      >
                        <Ionicons name="ribbon" size={14} color="#FFFFFF" />
                        <Text style={styles.claimCertCTAText}>View Digital Certificate</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                <View style={styles.curriculumList}>
                  {allLessons.map((item) => {
                    const isSelected = item.lesson.id === currentLesson?.id;
                    const isCompleted = progress?.completedLessonIds.includes(item.lesson.id);
                    const itemAccessible = isAdmin || isEnrolled || Boolean(item.lesson.isFreePreview);

                    return (
                      <TouchableOpacity
                        key={item.lesson.id}
                        style={[
                          styles.playlistRow,
                          isSelected && {
                            backgroundColor: colors.surfaceSubtle,
                            borderColor: colors.primary,
                          },
                          { borderColor: colors.border },
                        ]}
                        onPress={() => {
                          if (itemAccessible) {
                            onSelectLesson(courseId, item.lesson.id);
                          } else {
                            Alert.alert(
                              isBangla ? 'সদস্যদের জন্য সংরক্ষিত' : 'Enrolled Members Only',
                              isBangla
                                ? 'এই লেসনটি শুধুমাত্র কোর্সে এনরোল করা শিক্ষার্থীদের জন্য।'
                                : 'This lesson is part of your Thriving Skills library. Sign in with an enrolled account to unlock.'
                            );
                          }
                        }}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            styles.playlistIconBg,
                            {
                              backgroundColor: isCompleted
                                ? colors.primaryLight
                                : isSelected
                                ? colors.primary
                                : colors.surfaceSubtle,
                            },
                          ]}
                        >
                          {isCompleted ? (
                            <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                          ) : isSelected ? (
                            <Ionicons name="play" size={14} color={colors.onPrimary} />
                          ) : itemAccessible ? (
                            <Ionicons name="play-outline" size={14} color={colors.textMuted} />
                          ) : (
                            <Ionicons name="lock-closed" size={14} color={colors.textMuted} />
                          )}
                        </View>

                        <View style={styles.playlistInfo}>
                          <Text
                            style={[
                              styles.playlistTitle,
                              {
                                color: isSelected ? colors.primary : itemAccessible ? colors.text : colors.textMuted,
                                fontWeight: isSelected ? '700' : '500',
                              },
                            ]}
                            numberOfLines={1}
                          >
                            {item.lesson.title}
                          </Text>
                          <Text style={[styles.playlistDuration, { color: colors.textLight }]}>
                            {item.lesson.duration}
                          </Text>
                        </View>

                        {item.lesson.isFreePreview && !isEnrolled && !isAdmin && (
                          <View style={[styles.previewBadge, { backgroundColor: colors.secondaryLight }]}>
                            <Text style={[styles.previewText, { color: colors.secondary }]}>Preview</Text>
                          </View>
                        )}

                        {item.lesson.quiz && (
                          <TouchableOpacity
                            style={[styles.quizPill, { backgroundColor: colors.secondaryLight }]}
                            onPress={() => setQuizModalVisible(true)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            accessibilityRole="button"
                            accessibilityLabel="Open quiz"
                          >
                            <Ionicons name="help-circle" size={13} color={colors.secondary} />
                            <Text style={[styles.quizPillText, { color: colors.secondary }]}>Quiz</Text>
                          </TouchableOpacity>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            {/* TAB 2: NOTES (Timestamped lecture notes) */}
            <View style={{ width: screenWidth }}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.tabContentScroll, { paddingBottom: Math.max(insets.bottom, 16) + 80 }]}
                nestedScrollEnabled
              >
                <View style={styles.notesHeader}>
                  <View style={styles.notesTitleCol}>
                    <Text style={[styles.notesTitle, { color: colors.text }]}>
                      Lecture Notes ({lessonNotes.length})
                    </Text>
                    <Text style={[styles.notesSub, { color: colors.textMuted }]}>
                      Timestamped bookmarks & insights
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.takeNoteBtn, { backgroundColor: colors.primary }]}
                    onPress={handleOpenNotesFAB}
                    accessibilityRole="button"
                    accessibilityLabel="New Note"
                  >
                    <Ionicons name="add" size={15} color={colors.onPrimary} />
                    <Text style={[styles.takeNoteText, { color: colors.onPrimary }]}>New Note</Text>
                  </TouchableOpacity>
                </View>

                {lessonNotes.length === 0 ? (
                  <View style={styles.emptyNotesBox}>
                    <Ionicons name="document-text-outline" size={36} color={colors.textLight} />
                    <Text style={[styles.emptyNotesText, { color: colors.textMuted }]}>
                      No notes yet. Tap "+ Note" below to bookmark key moments at any timestamp!
                    </Text>
                  </View>
                ) : (
                  lessonNotes.map((n) => (
                    <View
                      key={n.id}
                      style={[
                        styles.noteCard,
                        { backgroundColor: colors.surfaceCard, borderColor: colors.border },
                      ]}
                    >
                      <View style={styles.noteTopRow}>
                        <TouchableOpacity
                          style={[styles.noteTimestampPill, { backgroundColor: '#FFB60620' }]}
                          onPress={() => {
                            triggerHaptic('light');
                            const sec = n.timestamp.includes(':')
                              ? n.timestamp.split(':').reduce((acc, time) => 60 * acc + +time, 0)
                              : 0;
                            handleSeekTo(sec);
                            showToast({ message: `Jumped to ${n.timestamp}`, type: 'info' });
                          }}
                        >
                          <Ionicons name="time-outline" size={12} color="#102F53" />
                          <Text style={styles.noteTimestampText}>{n.timestamp}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => {
                            triggerHaptic('warning');
                            deleteNote(n.id);
                            showToast({
                              message: 'Note deleted',
                              type: 'info',
                              actionLabel: 'Undo',
                              onAction: () => {
                                restoreNote(n);
                                showToast({ message: 'Note restored', type: 'success' });
                              },
                            });
                          }}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          accessibilityRole="button"
                          accessibilityLabel="Delete note"
                        >
                          <Ionicons name="trash-outline" size={15} color={colors.textLight} />
                        </TouchableOpacity>
                      </View>
                      <Text style={[styles.noteBody, { color: colors.text }]}>{n.text}</Text>
                    </View>
                  ))
                )}
              </ScrollView>
            </View>

            {/* TAB 3: TRANSCRIPT (Synchronized interactive transcript) */}
            <View style={{ width: screenWidth, flex: 1, paddingHorizontal: 14 }}>
              <LessonTranscriptTab
                currentPositionSeconds={currentPositionSeconds}
                lessonTitle={currentLesson.title}
                instructorName={course.instructor.name}
                lessonSummary={lessonDetail?.content || currentLesson.summary}
                durationSeconds={totalLessonSeconds}
                onSeekTo={handleSeekTo}
              />
            </View>

            {/* TAB 4: Q&A (Discussion & Questions answered by instructors) */}
            <View style={{ width: screenWidth }}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.tabContentScroll, { paddingBottom: Math.max(insets.bottom, 16) + 80 }]}
                nestedScrollEnabled
              >
                <CourseQnATab
                  courseId={course.id}
                  currentLessonTitle={currentLesson.title}
                />
              </ScrollView>
            </View>
          </ScrollView>

          {/* FLOATING ACTION BUTTON (FAB) FOR NOTES (BOTTOM RIGHT) */}
          <TouchableOpacity
            style={styles.notesFAB}
            onPress={handleOpenNotesFAB}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="Add Note at current video timestamp"
          >
            <Ionicons name="create" size={18} color="#102F53" />
            <Text style={styles.notesFABText}>+ Note</Text>
          </TouchableOpacity>

          {/* COMPACT BOTTOM SHEET NOTE EDITOR (DOES NOT COVER TOP VIDEO FRAME) */}
          <QuickNoteBottomSheet
            visible={isQuickNoteOpen}
            timestamp={formatSeconds(currentPositionSeconds)}
            lessonTitle={currentLesson.title}
            onSaveNote={(text, ts) => {
              addNote(course.id, currentLesson.id, text, ts);
              showToast({ message: `Note saved at ${ts}`, type: 'success' });
            }}
            onClose={() => setIsQuickNoteOpen(false)}
          />
        </View>
      )}

      {/* PICTURE-IN-PICTURE (PiP) FLOATING MINI-PLAYER */}
      <PiPFloatingPlayer
        visible={isPiPActive}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onMaximize={() => setIsPiPActive(false)}
        onClose={() => setIsPiPActive(false)}
        title={currentLesson.title}
        currentTimeFormatted={formatSeconds(currentPositionSeconds)}
      />

      {/* STREAMING & OFFLINE QUALITY MODAL */}
      <DownloadQualityModal
        visible={qualityModalVisible}
        mode={qualityModalMode}
        currentQuality={qualityModalMode === 'download' ? selectedDownloadQuality : streamQuality}
        lessonTitle={currentLesson.title}
        onClose={() => setQualityModalVisible(false)}
        onSelectStreamQuality={(q) => {
          setStreamQuality(q);
          showToast({ message: `Streaming quality set to ${q}`, type: 'info' });
        }}
        onStartDownload={(q) => {
          handleStartDownloadWithQuality(q);
        }}
      />

      {/* Quiz Modal */}
      {currentLesson.quiz && (
        <QuizModal
          visible={quizModalVisible}
          questions={currentLesson.quiz}
          onClose={() => setQuizModalVisible(false)}
          onPass={() => {
            markLessonCompleted(course.id, currentLesson.id);
            Alert.alert('Quiz Passed! 🏆', 'Lesson marked as completed.');
          }}
        />
      )}

      {/* Assessment Quiz Player Modal */}
      <QuizPlayerModal
        visible={quizPlayerVisible}
        courseTitle={course.title}
        quizId={currentLesson.id}
        onClose={() => setQuizPlayerVisible(false)}
        onPassed={() => {
          markLessonCompleted(course.id, currentLesson.id);
          Alert.alert('Quiz Passed! 🎓', 'Chapter completed and progress saved.');
        }}
      />

      {/* Notes Modal */}
      <NotesModal
        visible={notesModalVisible}
        courseId={course.id}
        lessonId={currentLesson.id}
        currentPositionSeconds={currentPositionSeconds}
        onSeekTo={(sec) => {
          handleSeekTo(sec);
          setNotesModalVisible(false);
        }}
        onClose={() => setNotesModalVisible(false)}
      />

      {/* Mandatory Course Review Modal */}
      <MandatoryReviewModal
        visible={mandatoryReviewVisible}
        courseTitle={course.title}
        instructorName={course.instructor.name}
        onSubmit={handleSubmitReview}
        onDismissLater={() => setMandatoryReviewVisible(false)}
      />

      {/* Certificate Modal */}
      <CertificateModal
        visible={certModalVisible}
        certificate={userCert || null}
        onClose={() => setCertModalVisible(false)}
      />

      {/* Payment Modal */}
      <PaymentModal
        visible={paymentModalVisible}
        course={course}
        onClose={() => setPaymentModalVisible(false)}
        onSuccess={(cId) => {
          enrollInCourse(cId);
          setPaymentModalVisible(false);
          Alert.alert(
            isBangla ? 'ভর্তি সফল হয়েছে! 🎓' : 'Enrollment Successful! 🎓',
            isBangla ? 'কোর্সের সকল ভিডিও এখন আনলক করা হয়েছে।' : 'All course videos are now unlocked.'
          );
        }}
      />

      {/* Spaced Repetition Modal */}
      <SpacedRepetitionModal
        visible={isFlashcardsVisible}
        onClose={() => setIsFlashcardsVisible(false)}
        course={course}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commuteToggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminBanner: {
    flexDirection: 'column',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    gap: 2,
  },
  adminBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  adminBannerTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFB606',
    letterSpacing: 0.5,
  },
  adminBannerSub: {
    fontSize: 10,
    color: '#F8FAFC',
  },
  previewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
  },
  previewBannerText: {
    fontSize: 11,
    fontWeight: '700',
  },
  stickyPlayerFrame: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000000',
    position: 'relative',
    zIndex: 10,
  },
  fullscreenPlayerFrame: {
    ...StyleSheet.absoluteFill,
    height: '100%',
    zIndex: 9999,
  },
  playerContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
    position: 'relative',
  },
  videoWebView: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
  },
  loadingVideoOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#000000',
  },
  loadingVideoText: {
    color: '#FFB606',
    fontSize: 12,
    fontWeight: '600',
  },
  lockedCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  lockedIconBg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 182, 6, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  lockedTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  lockedSub: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 15,
    paddingHorizontal: 12,
  },
  lockedActionsCol: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  lockedPurchaseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFB606',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  lockedPurchaseBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#102F53',
  },
  lockedPreviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#FFB606',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  lockedPreviewBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFB606',
  },
  videoFallbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFB606',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  videoFallbackBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#102F53',
  },
  commutePlayerCard: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commuteHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  commuteHeaderBadgeText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
  commuteLessonTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  commuteInstructorText: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 10,
  },
  commuteControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 10,
  },
  commuteSkipBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  skipSecText: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '600',
  },
  commuteMainPlayBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commuteBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    gap: 8,
  },
  commuteTimeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    flexShrink: 0,
  },
  bgPlaybackNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
  },
  bgPlaybackText: {
    color: '#10B981',
    fontSize: 10,
  },
  speedPill: {
    backgroundColor: '#FFB606',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    flexShrink: 0,
  },
  speedPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#102F53',
  },
  autoplayCountdownOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 16,
    zIndex: 50,
  },
  autoplayCard: {
    width: '90%',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  autoplayBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6366F1',
  },
  autoplayCountdownSec: {
    fontSize: 28,
    fontWeight: '900',
    color: '#6366F1',
    marginVertical: 2,
  },
  autoplayNextTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  autoplayActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  autoplayCancelBtn: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  autoplayCancelText: {
    fontSize: 11,
    fontWeight: '600',
  },
  autoplayPlayNowBtn: {
    minHeight: MIN_TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#6366F1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  autoplayPlayNowText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  lowerLearningArea: {
    flex: 1,
    position: 'relative',
  },
  lessonHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 8,
  },
  titleCol: {
    flex: 1,
    minWidth: 0,
    marginRight: 6,
  },
  lessonTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  lessonInstructor: {
    fontSize: 11,
  },
  actionRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeBtn: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 10,
    borderRadius: shape.small,
  },
  completeBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  tabsStrip: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 8,
  },
  tabButton: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  tabButtonText: {
    fontSize: 11,
  },
  horizontalPagingScroll: {
    flex: 1,
  },
  tabContentScroll: {
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  completionBanner: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
  },
  completionIconWrap: {
    marginTop: 2,
  },
  completionContent: {
    flex: 1,
  },
  completionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: 8,
  },
  completionTitle: {
    fontSize: 13,
    fontWeight: '800',
    flex: 1,
    minWidth: 0,
  },
  completionXpBadge: {
    backgroundColor: '#047857',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  completionXpText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  completionSub: {
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 8,
  },
  claimCertCTA: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#047857',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  claimCertCTAText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  curriculumList: {
    gap: 8,
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: shape.medium,
    borderWidth: 1,
    gap: 10,
  },
  playlistIconBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  playlistInfo: {
    flex: 1,
    minWidth: 0,
  },
  playlistTitle: {
    fontSize: 13,
    marginBottom: 2,
  },
  playlistDuration: {
    fontSize: 11,
  },
  previewBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    flexShrink: 0,
  },
  previewText: {
    fontSize: 10,
    fontWeight: '700',
  },
  quizPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    flexShrink: 0,
  },
  quizPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  notesTitleCol: {
    flex: 1,
    minWidth: 0,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  notesSub: {
    fontSize: 11,
    marginTop: 2,
  },
  takeNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: shape.small,
    minHeight: MIN_TOUCH_TARGET,
  },
  takeNoteText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyNotesBox: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyNotesText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  noteCard: {
    padding: 12,
    borderRadius: shape.medium,
    borderWidth: 1,
    marginBottom: 8,
    gap: 6,
  },
  noteTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  noteTimestampPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
    flexShrink: 0,
  },
  noteTimestampText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#102F53',
  },
  noteBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  notesFAB: {
    position: 'absolute',
    bottom: 20,
    right: 18,
    backgroundColor: '#FFB606',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    gap: 6,
    zIndex: 80,
    minHeight: MIN_TOUCH_TARGET,
  },
  notesFABText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#102F53',
  },
});
