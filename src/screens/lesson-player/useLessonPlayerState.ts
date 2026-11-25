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
import { NativeMedia3PlayerRef } from '../../components';
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

  const [streamQuality, setStreamQuality] = useState('720p HD');
  const [selectedDownloadQuality, setSelectedDownloadQuality] = useState('720p HD');
  const [qualityModalVisible, setQualityModalVisible] = useState(false);
  const [qualityModalMode, setQualityModalMode] = useState<'download' | 'streamQuality'>(
    'download'
  );
  const [isDownloaded, setIsDownloaded] = useState(false);

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
  const [lessonDetail, setLessonDetail] = useState<LessonDetail | null>(null);
  const [isLoadingVideo, setIsLoadingVideo] = useState(true);
  const [isAccessBlocked, setIsAccessBlocked] = useState(false);
  const [isFlashcardsVisible, setIsFlashcardsVisible] = useState(false);

  const currentPosRef = useRef(currentPositionSeconds);
  currentPosRef.current = currentPositionSeconds;
  const tabScrollViewRef = useRef<React.ElementRef<typeof ScrollView> | null>(null);
  const autoplayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeSecondsBufferRef = useRef(0);
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

  const totalLessonSeconds = parseDurationToSeconds(
    activeLessonDetail?.duration || currentLesson?.duration
  );

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

  useEffect(() => {
    if (currentLesson?.id) {
      OfflineManager.isLessonDownloaded(currentLesson.id).then(setIsDownloaded);
      setCurrentPositionSeconds(getWatchPosition(courseId, currentLesson.id) || 0);
      setAutoplayCountdown(null);
    }
  }, [currentLesson?.id, courseId]);

  useEffect(() => {
    if (course?.category) recordCategoryInteraction(course.category);
  }, [course?.category]);

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

  useEffect(() => {
    if (
      !isPlaying ||
      !currentLesson ||
      !course ||
      autoplayCountdown !== null ||
      !canPlayVideo ||
      isLoadingVideo ||
      !hasPlayableVideo
    )
      return;

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
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        markLessonCompleted(course.id, currentLesson.id);
        flushStudyTimeBuffer();
        addXP(50);
        unlockBadge('streak_champ');
        if (currentLessonIndex >= allLessons.length - 1) {
          setIsPlaying(false);
          if (!hasReviewedCourse(course.id)) setMandatoryReviewVisible(true);
          else setCertModalVisible(true);
        } else {
          setAutoplayCountdown(5);
        }
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
    currentLessonIndex,
    allLessons.length,
    canPlayVideo,
    isLoadingVideo,
    hasPlayableVideo,
  ]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background') {
        flushStudyTimeBuffer();
        if (!isCommuteMode && !isPiPActive && !isSystemPiPActive && course && currentLesson) {
          recordWatchPosition(course.id, currentLesson.id, currentPosRef.current);
        }
      }
    });
    return () => subscription.remove();
  }, [course, currentLesson, isCommuteMode, isPiPActive, isSystemPiPActive, recordWatchPosition]);

  const handleTogglePlay = () => {
    triggerHaptic('light');
    const nextPlaying = !isPlaying;
    setIsPlaying(nextPlaying);
    if (!nextPlaying) flushStudyTimeBuffer();
    if (nativePlayerRef.current) {
      if (nextPlaying) nativePlayerRef.current.play();
      else nativePlayerRef.current.pause();
    }
  };

  const handleSeekOffset = (delta: number) => {
    const next = Math.max(0, currentPosRef.current + delta);
    currentPosRef.current = next;
    setCurrentPositionSeconds(next);
    nativePlayerRef.current?.seekTo(next);
    if (course && currentLesson) recordWatchPosition(course.id, currentLesson.id, next);
  };

  const handleSeekTo = (sec: number) => {
    const next =
      totalLessonSeconds > 0 ? Math.max(0, Math.min(sec, totalLessonSeconds)) : Math.max(0, sec);
    currentPosRef.current = next;
    setCurrentPositionSeconds(next);
    nativePlayerRef.current?.seekTo(next);
    if (course && currentLesson) recordWatchPosition(course.id, currentLesson.id, next);
  };

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
    const completedCount = isAlreadyMarked
      ? progress?.completedLessonIds.length || 0
      : (progress?.completedLessonIds.length || 0) + 1;
    if (completedCount >= allLessons.length) {
      if (!hasReviewedCourse(course.id)) setMandatoryReviewVisible(true);
      else setCertModalVisible(true);
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
    if (newCert) setUnlockedCert(newCert);
    setCertModalVisible(true);
  };

  const cycleSpeed = () => {
    const speeds = ['1.0x', '1.25x', '1.5x', '2.0x', '0.75x'];
    const next = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
    setPlaybackSpeed(next);
    showToast({ message: `Playback speed: ${next}`, type: 'info' });
  };

  const handleOpenNotesFAB = () => {
    triggerHaptic('medium');
    setIsPlaying(false);
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
          : null) || {
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
    streamQuality,
    setStreamQuality,
    selectedDownloadQuality,
    setSelectedDownloadQuality,
    qualityModalVisible,
    setQualityModalVisible,
    qualityModalMode,
    setQualityModalMode,
    isDownloaded,
    setIsDownloaded,
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
    handleRewind: (sec: number = 10) => handleSeekOffset(-sec),
    handleForward: (sec: number = 10) => handleSeekOffset(sec),
    handleSeekTo,
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
      setQualityModalMode('streamQuality');
      setQualityModalVisible(true);
    },
    markLessonCompleted,
  };
}
