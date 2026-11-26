import { useState, useEffect, useRef } from 'react';
import {
  Dimensions,
  ScaledSize,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  AppState,
  AppStateStatus,
} from 'react-native';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useGamification } from '../../context/GamificationContext';
import { useFeedback } from '../../context/FeedbackContext';
import { useLearning } from '../../context/LearningContext';
import { triggerHaptic } from '../../utils/haptics';
import { resolveLessonVideoData } from '../../data/lessonVideosRegistry';
import { OfflineManager } from '../../services/offline/offlineManager';
import { LessonsService, LessonDetail } from '../../services/api/lessonsService';
import { NativeMedia3PlayerRef, WebViewPlayerController } from '../../components';
import { Lesson } from '../../types';
import { parseDurationToSeconds, extractZoomMeetingUrl } from './lessonHelpers';
import type { PlayerTab } from './LessonPlayerTabsSection';

export function useLessonPlayerState({
  courseId,
  lessonId,
  onSelectLesson,
}: {
  courseId: string;
  lessonId: string;
  onSelectLesson: (courseId: string, lessonId: string) => void;
}) {
  const { isBangla } = useLanguage();
  const { user, isAdmin, canBypassCourseLocks } = useAuth();
  const { showToast } = useFeedback();
  const { recordStudyTime, addXP, unlockBadge, triggerCelebration } = useGamification();
  const {
    getCourseById,
    userProgress,
    markLessonCompleted,
    getNotesForLesson,
    certificates,
    recordWatchPosition,
    getWatchPosition,
    hasReviewedCourse,
    isCertificateUnlocked,
    submitMandatoryCourseReview,
    recordCategoryInteraction,
  } = useLearning();

  const [windowDimensions, setWindowDimensions] = useState(Dimensions.get('window'));
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState('1.0x');
  const [activeTab, setActiveTab] = useState<PlayerTab>('curriculum');
  const [isCommuteMode, setIsCommuteMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isScreenLocked, setIsScreenLocked] = useState(false);
  const [isPiPActive, setIsPiPActive] = useState(false);
  const [isSystemPiPActive, setIsSystemPiPActive] = useState(false);
  const [isQuickNoteOpen, setIsQuickNoteOpen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [aiTutorVisible, setAiTutorVisible] = useState(false);
  const nativePlayerRef = useRef<NativeMedia3PlayerRef | null>(null);
  const webViewControllerRef = useRef<WebViewPlayerController | null>(null);

  const [streamQuality, setStreamQuality] = useState('Auto');
  const [qualityModalVisible, setQualityModalVisible] = useState(false);
  const [isStudyGuideSaved, setIsStudyGuideSaved] = useState(false);

  const [quizModalVisible, setQuizModalVisible] = useState(false);
  const [quizPlayerVisible, setQuizPlayerVisible] = useState(false);
  const [selectedQuizLesson, setSelectedQuizLesson] = useState<Lesson | null>(null);
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [certModalVisible, setCertModalVisible] = useState(false);
  const [mandatoryReviewVisible, setMandatoryReviewVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [autoplayCountdown, setAutoplayCountdown] = useState<number | null>(null);
  const [unlockedCert, setUnlockedCert] = useState<any>(null);
  const [currentPositionSeconds, setCurrentPositionSeconds] = useState(0);
  const [initialResumeSeconds, setInitialResumeSeconds] = useState(0);
  const [reportedDurationSeconds, setReportedDurationSeconds] = useState(0);
  const [lessonDetail, setLessonDetail] = useState<LessonDetail | null>(null);
  const [isLoadingVideo, setIsLoadingVideo] = useState(true);
  const [isAccessBlocked, setIsAccessBlocked] = useState(false);
  const [isFlashcardsVisible, setIsFlashcardsVisible] = useState(false);
  const [hasLiveTelemetry, setHasLiveTelemetry] = useState(false);

  const currentPosRef = useRef(currentPositionSeconds);
  currentPosRef.current = currentPositionSeconds;
  const tabScrollViewRef = useRef<React.ElementRef<typeof ScrollView> | null>(null);
  const autoplayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeSecondsBufferRef = useRef(0);
  const lastStudyTickSecRef = useRef<number | null>(null);
  const lastSavedPosRef = useRef<number>(0);
  const checkpointTriggeredRef = useRef<Record<string, boolean>>({});
  const prefetchedNextLessonRef = useRef<string | null>(null);
  const isManualLandscapeRef = useRef(false);

  const flushStudyTimeBuffer = () => {
    if (activeSecondsBufferRef.current >= 25) {
      recordStudyTime(1);
    }
    activeSecondsBufferRef.current = 0;
  };

  const course = getCourseById(courseId);
  const allLessons: { moduleTitle: string; lesson: Lesson }[] = [];
  course?.modules?.forEach((mod) => {
    mod.lessons?.forEach((l) => allLessons.push({ moduleTitle: mod.title, lesson: l }));
  });

  const currentLessonIndex = allLessons.findIndex((item) => item.lesson.id === lessonId);
  const currentItem = allLessons[currentLessonIndex] || allLessons[0];
  const currentLesson = currentItem?.lesson;

  const isEnrolled = !!userProgress[course?.id || ''];
  const isFreePreview = Boolean(currentLesson?.isFreePreview);
  const isPrivileged = isAdmin || Boolean(canBypassCourseLocks);
  const hasAccessIntent = isPrivileged || isEnrolled || isFreePreview;
  const canPlayVideo = hasAccessIntent && !isAccessBlocked;

  const progress = course ? userProgress[course.id] : undefined;
  const isLessonCompleted = progress?.completedLessonIds.includes(currentLesson?.id || '') || false;
  const lessonNotes = currentLesson ? getNotesForLesson(courseId, currentLesson.id) : [];
  const isDeviceLandscape = windowDimensions.width > windowDimensions.height;

  useEffect(() => {
    const subscription = Dimensions.addEventListener(
      'change',
      ({ window }: { window: ScaledSize }) => {
        setWindowDimensions(window);
        if (window.width > window.height) setIsFullscreen(true);
        else if (window.width <= window.height && !isManualLandscapeRef.current)
          setIsFullscreen(false);
      }
    );
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    let isMounted = true;
    setLessonDetail(null);
    setIsAccessBlocked(false);
    setReportedDurationSeconds(0);
    setHasLiveTelemetry(false);
    lastStudyTickSecRef.current = null;
    if (!currentLesson?.id || !hasAccessIntent) {
      setIsLoadingVideo(false);
      return;
    }
    setIsLoadingVideo(true);
    LessonsService.getLessonDetail(currentLesson.id)
      .then((detail) => {
        if (isMounted) {
          setLessonDetail(detail);
          setIsAccessBlocked(false);
          setIsLoadingVideo(false);
        }
      })
      .catch((err: any) => {
        if (isMounted) {
          setLessonDetail(null);
          if (err?.status === 401 || err?.status === 403) {
            setIsAccessBlocked(true);
          }
          setIsLoadingVideo(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [currentLesson?.id, hasAccessIntent]);

  useEffect(() => {
    return () => {
      flushStudyTimeBuffer();
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

  const activeLessonDetail =
    lessonDetail && currentLesson && String(lessonDetail.id) === String(currentLesson.id)
      ? lessonDetail
      : null;

  const metaDurationSeconds = parseDurationToSeconds(
    activeLessonDetail?.duration || currentLesson?.duration
  );
  const totalLessonSeconds = Math.max(metaDurationSeconds, reportedDurationSeconds);

  const mergedLessonForVideo = currentLesson
    ? {
        id: currentLesson.id,
        title: activeLessonDetail?.name || currentLesson.title,
        duration: activeLessonDetail?.duration || currentLesson.duration,
        summary:
          activeLessonDetail?.summary || activeLessonDetail?.content || currentLesson.summary,
        videoUrl: activeLessonDetail?.videoUrl || currentLesson.videoUrl,
        videoIntro: activeLessonDetail?.videoIntro || currentLesson.videoIntro,
      }
    : undefined;

  const resolvedLessonVideo = resolveLessonVideoData(
    course || { id: courseId, title: 'Course' },
    mergedLessonForVideo
  );
  const hasPlayableVideo = resolvedLessonVideo.hasVideo && Boolean(resolvedLessonVideo.videoUrl);
  const activeVideoIntro = resolvedLessonVideo.videoIntro;
  const activeVideoUrl = resolvedLessonVideo.videoUrl;
  const rawContent = activeLessonDetail?.content || currentLesson?.summary || '';
  const zoomMeetingUrl = extractZoomMeetingUrl([
    activeLessonDetail?.videoIntro,
    currentLesson?.videoIntro,
    activeVideoUrl,
    rawContent,
  ]);
  const isDirectStream = !!(
    activeVideoUrl && activeVideoUrl.match(/\.(mp4|m3u8|mpd|webm|aac|mp3|m4a)($|\?)/i)
  );

  useEffect(() => {
    if (currentLesson?.id) {
      OfflineManager.isLessonDownloaded(currentLesson.id).then(setIsStudyGuideSaved);
      const savedPos = getWatchPosition(courseId, currentLesson.id) || 0;
      setCurrentPositionSeconds(savedPos);
      setInitialResumeSeconds(savedPos);
      lastSavedPosRef.current = savedPos;
      setAutoplayCountdown(null);
      setIsPlaying(true);
    }
  }, [currentLesson?.id, courseId]);

  useEffect(() => {
    if (course?.category) recordCategoryInteraction(course.category);
  }, [course?.category]);

  const completeCurrentLessonAndAdvance = () => {
    if (!currentLesson || !course) return;
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    const wasAlreadyCompleted = progress?.completedLessonIds.includes(currentLesson.id) || false;
    markLessonCompleted(course.id, currentLesson.id);
    flushStudyTimeBuffer();

    if (!wasAlreadyCompleted) {
      addXP(50);
      unlockBadge('streak_champ');
    }

    const completedSet = new Set(progress?.completedLessonIds || []);
    completedSet.add(currentLesson.id);
    const allDone =
      allLessons.length > 0 && allLessons.every((item) => completedSet.has(item.lesson.id));

    if (allDone && isEnrolled) {
      setIsPlaying(false);
      if (!hasReviewedCourse(course.id)) setMandatoryReviewVisible(true);
      else setCertModalVisible(true);
    } else if (currentLessonIndex < allLessons.length - 1) {
      setAutoplayCountdown(5);
    } else {
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    if (autoplayCountdown === null) return;
    if (autoplayCountdown <= 0) {
      setAutoplayCountdown(null);
      if (currentLessonIndex < allLessons.length - 1) {
        const nextL = allLessons[currentLessonIndex + 1]?.lesson;
        if (nextL) {
          setCurrentPositionSeconds(0);
          onSelectLesson(courseId, nextL.id);
        }
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

  // Fallback elapsed timer ONLY for opaque generic iframes that emit no live player telemetry
  const supportsTelemetry =
    isDirectStream ||
    resolvedLessonVideo.videoType === 'vimeo' ||
    resolvedLessonVideo.videoType === 'youtube' ||
    hasLiveTelemetry;

  useEffect(() => {
    if (
      !isPlaying ||
      !currentLesson ||
      !course ||
      autoplayCountdown !== null ||
      !canPlayVideo ||
      isLoadingVideo ||
      !hasPlayableVideo ||
      supportsTelemetry
    ) {
      return;
    }

    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = setInterval(() => {
      const next = currentPosRef.current + 1;
      currentPosRef.current = next;
      setCurrentPositionSeconds(next);

      if (next % 5 === 0) recordWatchPosition(course.id, currentLesson.id, next);
      activeSecondsBufferRef.current += 1;
      if (activeSecondsBufferRef.current >= 60) {
        activeSecondsBufferRef.current -= 60;
        recordStudyTime(1);
      }

      if (next >= totalLessonSeconds && totalLessonSeconds > 0) {
        completeCurrentLessonAndAdvance();
      }
    }, 1000);

    return () => {
      flushStudyTimeBuffer();
      if (course && currentLesson) {
        recordWatchPosition(course.id, currentLesson.id, currentPosRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [
    isPlaying,
    currentLesson?.id,
    course?.id,
    autoplayCountdown,
    totalLessonSeconds,
    canPlayVideo,
    isLoadingVideo,
    hasPlayableVideo,
    supportsTelemetry,
  ]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background') {
        flushStudyTimeBuffer();
        if (course && currentLesson) {
          recordWatchPosition(course.id, currentLesson.id, currentPosRef.current);
        }
      }
    });
    return () => subscription.remove();
  }, [course, currentLesson, recordWatchPosition]);

  const handlePausePlayback = () => {
    setIsPlaying(false);
    flushStudyTimeBuffer();
    if (nativePlayerRef.current) nativePlayerRef.current.pause();
    if (webViewControllerRef.current) webViewControllerRef.current.pause();
  };

  const handleTogglePlay = () => {
    triggerHaptic('light');
    const nextPlaying = !isPlaying;
    setIsPlaying(nextPlaying);
    if (!nextPlaying) flushStudyTimeBuffer();
    if (nativePlayerRef.current) {
      if (nextPlaying) nativePlayerRef.current.play();
      else nativePlayerRef.current.pause();
    }
    if (webViewControllerRef.current) {
      if (nextPlaying) webViewControllerRef.current.play();
      else webViewControllerRef.current.pause();
    }
  };

  const handleSeekTo = (sec: number) => {
    const next =
      totalLessonSeconds > 0 ? Math.max(0, Math.min(sec, totalLessonSeconds)) : Math.max(0, sec);
    currentPosRef.current = next;
    setCurrentPositionSeconds(next);
    nativePlayerRef.current?.seekTo(next);
    webViewControllerRef.current?.seekTo(next);
    if (course && currentLesson) recordWatchPosition(course.id, currentLesson.id, next);
  };

  const handleSeekOffset = (delta: number) => {
    handleSeekTo(currentPosRef.current + delta);
  };

  const handleLiveProgressUpdate = (currSec: number, reportedDuration?: number) => {
    setHasLiveTelemetry(true);
    if (reportedDuration && reportedDuration > 0) {
      const roundedDur = Math.round(reportedDuration);
      setReportedDurationSeconds((prev) => (prev === roundedDur ? prev : roundedDur));
    }

    const sec = Math.max(0, Math.floor(currSec));
    currentPosRef.current = sec;
    setCurrentPositionSeconds(sec);

    if (course && currentLesson && Math.abs(sec - lastSavedPosRef.current) >= 5) {
      lastSavedPosRef.current = sec;
      recordWatchPosition(course.id, currentLesson.id, sec);
    }

    if (lastStudyTickSecRef.current === null || sec < lastStudyTickSecRef.current) {
      lastStudyTickSecRef.current = sec;
    } else if (sec > lastStudyTickSecRef.current) {
      const delta = Math.min(5, sec - lastStudyTickSecRef.current);
      lastStudyTickSecRef.current = sec;
      activeSecondsBufferRef.current += delta;
      if (activeSecondsBufferRef.current >= 60) {
        activeSecondsBufferRef.current -= 60;
        recordStudyTime(1);
      }
    }
  };

  const handleTriggerPiP = async () => {
    triggerHaptic('medium');
    if (isDirectStream && nativePlayerRef.current) {
      try {
        await nativePlayerRef.current.startPictureInPicture();
        setIsSystemPiPActive(true);
        showToast({
          message: isBangla
            ? 'পিকচার-ইন-পিকচার (ভাসমান উইন্ডো) সক্রিয়'
            : 'Picture-in-Picture window activated',
          type: 'success',
        });
        return;
      } catch (err) {
        console.warn('Native PiP could not start', err);
      }
    }
    setIsPiPActive(true);
    showToast({
      message: isBangla ? 'ইন-অ্যাপ ভাসমান প্লেয়ার চালু হয়েছে' : 'In-App Floating Player activated',
      type: 'info',
    });
  };

  const handleToggleFullscreen = () => {
    triggerHaptic('medium');
    const nextFullscreen = !isFullscreen;
    isManualLandscapeRef.current = nextFullscreen;
    setIsFullscreen(nextFullscreen);
    if (isDirectStream && nativePlayerRef.current) {
      if (nextFullscreen) nativePlayerRef.current.enterFullscreen().catch(() => {});
      else nativePlayerRef.current.exitFullscreen().catch(() => {});
    }
  };

  const handleNextLesson = () => {
    flushStudyTimeBuffer();
    setAutoplayCountdown(null);
    const nextL =
      currentLessonIndex < allLessons.length - 1
        ? allLessons[currentLessonIndex + 1]?.lesson
        : undefined;
    if (nextL) {
      setCurrentPositionSeconds(0);
      onSelectLesson(courseId, nextL.id);
    }
  };

  const handlePrevLesson = () => {
    flushStudyTimeBuffer();
    setAutoplayCountdown(null);
    const prevL = currentLessonIndex > 0 ? allLessons[currentLessonIndex - 1]?.lesson : undefined;
    if (prevL) {
      setCurrentPositionSeconds(0);
      onSelectLesson(courseId, prevL.id);
    }
  };

  const handleMarkComplete = () => {
    if (!currentLesson || !course) return;
    const isAlreadyMarked = progress?.completedLessonIds.includes(currentLesson.id);
    markLessonCompleted(course.id, currentLesson.id);
    flushStudyTimeBuffer();
    if (!isAlreadyMarked) {
      addXP(50);
      unlockBadge('streak_champ');
      triggerCelebration({
        title: isBangla ? 'পাঠ সম্পন্ন হয়েছে! 🎉' : 'Lesson Mastered! 🎉',
        subtitle: `${currentLesson.title} • +50 XP`,
        xpAwarded: 50,
        icon: 'checkmark-circle',
      });
    } else {
      showToast({
        message: isBangla ? 'পাঠ ইতিমধ্যে সম্পন্ন করা হয়েছে' : 'Lesson already completed',
        type: 'info',
      });
    }
    const completedSet = new Set(progress?.completedLessonIds || []);
    completedSet.add(currentLesson.id);
    const allCompleted =
      allLessons.length > 0 && allLessons.every((item) => completedSet.has(item.lesson.id));
    if (allCompleted && isEnrolled) {
      if (!hasReviewedCourse(course.id)) setMandatoryReviewVisible(true);
      else setCertModalVisible(true);
    } else if (currentLessonIndex < allLessons.length - 1) {
      setAutoplayCountdown(5);
    }
  };

  const handleSaveStudyGuideOffline = async () => {
    if (!currentLesson || !course) return;
    if (isStudyGuideSaved) {
      await OfflineManager.removeDownloadedLesson(currentLesson.id);
      setIsStudyGuideSaved(false);
      showToast({
        message: isBangla ? 'অফলাইন স্টাডি গাইড সরানো হয়েছে' : 'Removed saved study guide',
        type: 'info',
      });
      return;
    }

    await OfflineManager.saveLessonOffline(
      course.id,
      currentLesson,
      rawContent || undefined,
      course.title
    );
    setIsStudyGuideSaved(true);
    showToast({
      message: isBangla
        ? 'অফলাইন স্টাডি গাইডে সেভ হয়েছে (নোটস শুধুমাত্র)'
        : 'Study guide saved for offline reading',
      type: 'success',
    });
  };

  const handleSubmitReview = async (rating: number, feedback: string) => {
    if (!course) return;
    const newCert = await submitMandatoryCourseReview(
      course.id,
      rating,
      feedback,
      user?.displayName || user?.username || 'Executive Graduate',
      'Course Graduate'
    );
    setMandatoryReviewVisible(false);
    if (newCert) {
      setUnlockedCert(newCert);
      setCertModalVisible(true);
    }
  };

  const cycleSpeed = () => {
    const speeds = ['1.0x', '1.25x', '1.5x', '2.0x', '0.75x'];
    const next = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
    const numericRate = parseFloat(next) || 1.0;
    setPlaybackSpeed(next);
    webViewControllerRef.current?.setPlaybackRate(numericRate);
    showToast({ message: `Playback speed: ${next}`, type: 'info' });
  };

  const handleOpenNotesFAB = () => {
    triggerHaptic('medium');
    handlePausePlayback();
    setIsQuickNoteOpen(true);
  };

  const TABS: { id: PlayerTab; label: string; icon: any }[] = [
    { id: 'curriculum', label: isBangla ? 'লেকচার' : 'Lectures', icon: 'list' },
    {
      id: 'notes',
      label: `${isBangla ? 'নোটস' : 'Notes'} (${lessonNotes.length})`,
      icon: 'document-text',
    },
    { id: 'transcript', label: isBangla ? 'ট্রান্সক্রিপ্ট' : 'Transcript', icon: 'chatbox-ellipses' },
    { id: 'qna', label: isBangla ? 'প্রশ্ন-উত্তর' : 'Q&A', icon: 'chatbubbles' },
  ];

  const handleTabPress = (tabId: PlayerTab, index: number) => {
    triggerHaptic('light');
    setActiveTab(tabId);
    tabScrollViewRef.current?.scrollTo({ x: index * windowDimensions.width, animated: true });
  };

  const handleTabScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / windowDimensions.width);
    const selected = TABS[index];
    if (selected && selected.id !== activeTab) {
      triggerHaptic('light');
      setActiveTab(selected.id);
    }
  };

  const userCert =
    unlockedCert ||
    (course && isCertificateUnlocked(course.id)
      ? certificates.find((c) => c.courseId === course.id) ||
        (progress?.certificateId
          ? certificates.find((c) => c.credentialId === progress.certificateId)
          : null) ||
        null
      : null);

  return {
    course,
    allLessons,
    currentLessonIndex,
    currentItem,
    currentLesson,
    isEnrolled,
    isFreePreview,
    isPrivileged,
    isAdmin,
    canPlayVideo,
    progress,
    isLessonCompleted,
    lessonNotes,
    rawLessonContent: rawContent,
    windowDimensions,
    isDeviceLandscape,
    isPlaying,
    setIsPlaying,
    playbackSpeed,
    activeTab,
    isCommuteMode,
    setIsCommuteMode,
    isFullscreen,
    isScreenLocked,
    setIsScreenLocked,
    isPiPActive,
    setIsPiPActive,
    setIsSystemPiPActive,
    isQuickNoteOpen,
    setIsQuickNoteOpen,
    isFocusMode,
    setIsFocusMode,
    aiTutorVisible,
    setAiTutorVisible,
    nativePlayerRef,
    webViewControllerRef,
    streamQuality,
    setStreamQuality,
    qualityModalVisible,
    setQualityModalVisible,
    isStudyGuideSaved,
    quizModalVisible,
    setQuizModalVisible,
    quizPlayerVisible,
    setQuizPlayerVisible,
    selectedQuizLesson,
    setSelectedQuizLesson,
    notesModalVisible,
    setNotesModalVisible,
    certModalVisible,
    setCertModalVisible,
    mandatoryReviewVisible,
    setMandatoryReviewVisible,
    paymentModalVisible,
    setPaymentModalVisible,
    autoplayCountdown,
    setAutoplayCountdown,
    currentPositionSeconds,
    setCurrentPositionSeconds,
    initialResumeSeconds,
    isLoadingVideo,
    isFlashcardsVisible,
    setIsFlashcardsVisible,
    currentPosRef,
    tabScrollViewRef,
    prefetchedNextLessonRef,
    checkpointTriggeredRef,
    totalLessonSeconds,
    resolvedLessonVideo,
    hasPlayableVideo,
    activeVideoIntro,
    activeVideoUrl,
    zoomMeetingUrl,
    isDirectStream,
    TABS,
    userCert,
    handleTogglePlay,
    handlePausePlayback,
    handleRewind: (sec: number = 10) => handleSeekOffset(-sec),
    handleForward: (sec: number = 10) => handleSeekOffset(sec),
    handleSeekTo,
    handleLiveProgressUpdate,
    completeCurrentLessonAndAdvance,
    handleSaveStudyGuideOffline,
    handleTriggerPiP,
    handleToggleFullscreen,
    handleNextLesson,
    handlePrevLesson,
    handleMarkComplete,
    handleSubmitReview,
    cycleSpeed,
    handleOpenNotesFAB,
    handleTabPress,
    handleTabScrollEnd,
    handleOpenStreamQualityModal: () => {
      triggerHaptic('light');
      setQualityModalVisible(true);
    },
    markLessonCompleted,
  };
}
