import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
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
import { CourseQnATab } from '../components/CourseQnATab';
import { LiveAudioWaveform } from '../components/player/LiveAudioWaveform';
import { AnimatedTabContent, SpringPressable } from '../components/common';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useGamification } from '../context/GamificationContext';
import { resolveLessonVideoData } from '../data/lessonVideosRegistry';
import { OfflineManager } from '../services/offline/offlineManager';
import { LessonsService, LessonDetail } from '../services/api/lessonsService';
import { Lesson, Certificate } from '../types';

interface LessonPlayerScreenProps {
  courseId: string;
  lessonId: string;
  onBack: () => void;
  onSelectLesson: (courseId: string, lessonId: string) => void;
}

type PlayerTab = 'curriculum' | 'qna' | 'overview' | 'notes' | 'resources';

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
  const { recordStudyTime, unlockBadge, triggerCelebration } = useGamification();
  const {
    getCourseById,
    userProgress,
    enrollInCourse,
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

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<string>('1.0x');
  const [activeTab, setActiveTab] = useState<PlayerTab>('curriculum');
  const [isCommuteMode, setIsCommuteMode] = useState<boolean>(false);
  const [quizModalVisible, setQuizModalVisible] = useState<boolean>(false);
  const [quizPlayerVisible, setQuizPlayerVisible] = useState<boolean>(false);
  const [notesModalVisible, setNotesModalVisible] = useState<boolean>(false);
  const [certModalVisible, setCertModalVisible] = useState<boolean>(false);
  const [mandatoryReviewVisible, setMandatoryReviewVisible] = useState<boolean>(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState<boolean>(false);
  const [autoplayCountdown, setAutoplayCountdown] = useState<number | null>(null);
  const [unlockedCert, setUnlockedCert] = useState<Certificate | null>(null);
  const [isDownloaded, setIsDownloaded] = useState<boolean>(false);
  const [currentPositionSeconds, setCurrentPositionSeconds] = useState<number>(0);
  const [lessonDetail, setLessonDetail] = useState<LessonDetail | null>(null);
  const [isLoadingVideo, setIsLoadingVideo] = useState<boolean>(true);

  const currentPosRef = useRef<number>(currentPositionSeconds);
  currentPosRef.current = currentPositionSeconds;

  // Timer refs conforming to AGENTS.md Rule 3
  const autoplayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const course = getCourseById(courseId);

  // Flatten lessons list for next/prev navigation
  const allLessons: { moduleTitle: string; lesson: Lesson }[] = [];
  course?.modules.forEach((mod) => {
    mod.lessons.forEach((l) => {
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
  const playbackPercent = Math.min(100, Math.round((currentPositionSeconds / (totalLessonSeconds || 1)) * 100));

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

  const formatSeconds = (sec: number): string => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  const handleToggleOffline = async () => {
    if (!currentLesson || !course) return;
    if (isDownloaded) {
      await OfflineManager.removeDownloadedLesson(currentLesson.id);
      setIsDownloaded(false);
      Alert.alert('Offline Storage', 'Lesson removed from offline downloads.');
    } else {
      await OfflineManager.saveLessonOffline(course.id, currentLesson);
      setIsDownloaded(true);
      Alert.alert('Downloaded! 💾', 'Lesson summary & resources saved for offline studying.');
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

  const handleSimulateVideoEnd = () => {
    if (!currentLesson || !course) return;
    setCurrentPositionSeconds(totalLessonSeconds);
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

  const cycleSpeed = () => {
    const speeds = ['0.75x', '1.0x', '1.25x', '1.5x', '2.0x'];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextIdx]);
  };

  if (!course || !currentLesson) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header showBack onBack={onBack} title="Lesson Player" />
        <View style={styles.centerContainer}>
          <Text style={{ color: colors.text }}>Lesson not found.</Text>
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

  // Resolved clean video link for external playback
  const resolvedVideoUrl = activeVideoUrl || fallbackLessonVideo.videoUrl;

  // Check if current lesson is a live cohort masterclass with a Zoom link
  const rawContent = lessonDetail?.content || currentLesson?.summary || '';
  const zoomMatch =
    (activeVideoIntro && activeVideoIntro.match(/https?:\/\/[^\s"'<>]*zoom\.us\/[^\s"'<>]*/i)) ||
    (activeVideoUrl && activeVideoUrl.match(/https?:\/\/[^\s"'<>]*zoom\.us\/[^\s"'<>]*/i)) ||
    (rawContent && rawContent.match(/https?:\/\/[^\s"'<>]*zoom\.us\/[^\s"'<>]*/i));
  const zoomMeetingUrl = zoomMatch ? zoomMatch[0].replace(/&amp;/g, '&') : null;

  // Build responsive embedded HTML player
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
      } else if (activeVideoUrl.match(/\.(mp4|m3u8|webm)($|\?)/i)) {
        embedMarkup = `<video src="${activeVideoUrl}" controls autoplay playsinline style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:contain;background:#000;"></video>`;
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

  const previewLesson = course.modules[0]?.lessons.find((l) => l.isFreePreview);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        showBack
        onBack={onBack}
        title={course.title}
        subtitle={currentItem?.moduleTitle}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 60 }]}>
        {/* Administrator Access Banner if viewing as admin */}
        {isAdmin && (
          <View style={[styles.adminBanner, { backgroundColor: '#102F53', borderColor: '#FFB606' }]}>
            <View style={styles.adminBannerLeft}>
              <Ionicons name="shield-checkmark" size={15} color="#FFB606" />
              <Text style={styles.adminBannerTitle}>ADMINISTRATOR ACCESS ACTIVE</Text>
            </View>
            <Text style={styles.adminBannerSub}>
              {isBangla ? 'অ্যাডমিন ক্ষমতা: কোর্সের সকল ভিডিও আনলক করা হয়েছে' : 'Master bypass: Unrestricted playback of all course videos'}
            </Text>
          </View>
        )}

        {/* Free Preview Banner if guest or unpurchased learner on free preview lesson */}
        {!isAdmin && !isEnrolled && isFreePreview && (
          <View style={[styles.previewBanner, { backgroundColor: '#EFF6FF', borderColor: '#3B82F6' }]}>
            <Ionicons name="sparkles" size={15} color="#3B82F6" />
            <Text style={styles.previewBannerText}>
              {isBangla ? 'ফ্রি প্রিভিউ লেকচার চলছে' : 'Free Preview Lesson • Enroll for Full Access'}
            </Text>
          </View>
        )}

        {/* Mode Switcher: Video vs Commute Audio */}
        <View style={styles.modeSwitchBar}>
          <TouchableOpacity
            style={[
              styles.modeSwitchBtn,
              !isCommuteMode
                ? [styles.modeSwitchActive, { backgroundColor: colors.primary }]
                : { backgroundColor: colors.surfaceSubtle },
            ]}
            onPress={() => setIsCommuteMode(false)}
          >
            <Ionicons
              name="videocam"
              size={15}
              color={!isCommuteMode ? '#FFFFFF' : colors.textMuted}
            />
            <Text
              style={[
                styles.modeSwitchText,
                { color: !isCommuteMode ? '#FFFFFF' : colors.textMuted },
                !isCommuteMode && { fontWeight: '700' },
              ]}
            >
              Video Player
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeSwitchBtn,
              isCommuteMode
                ? [styles.modeSwitchActive, { backgroundColor: '#102F53' }]
                : { backgroundColor: colors.surfaceSubtle },
            ]}
            onPress={() => setIsCommuteMode(true)}
          >
            <Ionicons
              name="headset"
              size={15}
              color={isCommuteMode ? '#FFB606' : colors.textMuted}
            />
            <Text
              style={[
                styles.modeSwitchText,
                { color: isCommuteMode ? '#FFFFFF' : colors.textMuted },
                isCommuteMode && { fontWeight: '700' },
              ]}
            >
              Commute Audio
            </Text>
            <View style={styles.saveDataBadge}>
              <Text style={styles.saveDataBadgeText}>-85% Data</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Video / Commute Player Area */}
        {!canPlayVideo ? (
          /* LOCKED PAYWALL STATE: User has not purchased this course */
          <View style={[styles.lockedCard, { backgroundColor: isDark ? '#0F192C' : '#102F53' }]}>
            <View style={styles.lockedIconBg}>
              <Ionicons name="lock-closed" size={38} color="#FFB606" />
            </View>

            <Text style={styles.lockedTitle}>
              {isBangla ? 'কোর্সটি কেনা হয়নি' : 'Course Not Purchased'}
            </Text>
            <Text style={styles.lockedSub}>
              {isBangla
                ? 'এই প্রিমিয়াম পাঠের ভিডিও দেখতে সম্পূর্ণ কোর্সে ভর্তি হন। আজীবন অ্যাক্সেস, রিসোর্স এবং ভেরিফাইড সার্টিফিকেট অন্তর্ভুক্ত।'
                : 'This premium lesson video requires course enrollment. Purchase this course to get full lifetime access to all lectures, downloadable resources, and verified credentials.'}
            </Text>

            <View style={styles.lockedActionsCol}>
              <TouchableOpacity
                style={styles.lockedPurchaseBtn}
                onPress={() => setPaymentModalVisible(true)}
                activeOpacity={0.88}
                accessibilityRole="button"
                accessibilityLabel="Purchase or enroll in course"
              >
                <Ionicons name="card" size={16} color="#102F53" />
                <Text style={styles.lockedPurchaseBtnText}>
                  {isBangla ? 'কোর্সটি কিনুন / ভর্তি হন' : 'Purchase Course / Enroll'}
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
          /* Interactive Commute Mode Player */
          <View
            style={[
              styles.commutePlayerCard,
              { backgroundColor: isDark ? '#0F192C' : '#102F53' },
            ]}
          >
            <View style={styles.commuteHeaderBadge}>
              <Ionicons name="leaf" size={13} color="#10B981" />
              <Text style={styles.commuteHeaderBadgeText}>
                Commute Mode Active • Bandwidth Saver
              </Text>
            </View>

            {/* Dynamic Living Audio Waveform */}
            <LiveAudioWaveform isPlaying={isPlaying} primaryColor="#FFB606" accentColor="#E34234" />

            <Text style={styles.commuteLessonTitle} numberOfLines={1}>
              {currentLesson.title}
            </Text>
            <Text style={styles.commuteInstructorText}>
              {course.instructor.name} • {currentItem?.moduleTitle}
            </Text>

            {/* Commute Controls */}
            <View style={styles.commuteControlsRow}>
              <TouchableOpacity
                style={styles.commuteSkipBtn}
                onPress={() => handleRewind(15)}
              >
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
                style={[styles.commuteMainPlayBtn, { backgroundColor: colors.accent }]}
                onPress={() => setIsPlaying(!isPlaying)}
              >
                <Ionicons name={isPlaying ? 'pause' : 'play'} size={28} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleNextLesson}
                disabled={currentLessonIndex === allLessons.length - 1}
                style={[
                  styles.commuteSkipBtn,
                  currentLessonIndex === allLessons.length - 1 && { opacity: 0.4 },
                ]}
              >
                <Ionicons name="play-skip-forward" size={22} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.commuteSkipBtn}
                onPress={() => handleForward(30)}
              >
                <Ionicons name="play-forward" size={20} color="#FFFFFF" />
                <Text style={styles.skipSecText}>30s</Text>
              </TouchableOpacity>
            </View>

            {/* Commute Bottom Status Bar */}
            <View style={styles.commuteBottomBar}>
              <Text style={styles.commuteTimeText}>{formatSeconds(currentPositionSeconds)} / {currentLesson.duration}</Text>
              <View style={styles.bgPlaybackNotice}>
                <Ionicons name="radio" size={13} color="#10B981" />
                <Text style={styles.bgPlaybackText}>Background Playback Active</Text>
              </View>
              <TouchableOpacity style={styles.speedPill} onPress={cycleSpeed}>
                <Text style={styles.speedPillText}>{playbackSpeed}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : zoomMeetingUrl ? (
          /* LIVE COHORT MASTERCLASS: Direct Zoom Session Launcher */
          <View style={[styles.playerContainer, { backgroundColor: '#102F53', justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#2D8CFF25', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
              <Ionicons name="videocam" size={28} color="#2D8CFF" />
            </View>
            <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '800', textAlign: 'center', marginBottom: 4 }}>
              {isBangla ? 'লাইভ জুম মাস্টারক্লাস' : 'Live Cohort Masterclass'}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, textAlign: 'center', marginBottom: 16, maxWidth: 280 }}>
              {isBangla
                ? 'এই সেশনটি সরাসরি জুমে অনুষ্ঠিত হবে। ক্লাসে যোগ দিতে নিচের বাটনে ক্লিক করুন।'
                : 'This session is conducted live via Zoom. Click below to launch the live interactive workshop.'}
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: '#2D8CFF',
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
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
          /* ACTUAL REAL VIDEO PLAYER: WebView with responsive embedded video */
          <View style={styles.playerContainer}>
            {isLoadingVideo ? (
              <View style={styles.loadingVideoOverlay}>
                <ActivityIndicator size="large" color="#FFB606" />
                <Text style={styles.loadingVideoText}>Loading video stream...</Text>
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

        {/* Fast Action Scrub / Sim bar under player */}
        {canPlayVideo && (
          <View style={[styles.playbackToolbar, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
            <View style={styles.playbackLeftControls}>
              <TouchableOpacity onPress={() => handleRewind(10)} style={styles.toolBtn}>
                <Ionicons name="play-back" size={18} color={colors.text} />
                <Text style={[styles.toolBtnText, { color: colors.textMuted }]}>10s</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handlePrevLesson} disabled={currentLessonIndex === 0} style={[styles.toolBtn, currentLessonIndex === 0 && { opacity: 0.3 }]}>
                <Ionicons name="play-skip-back" size={18} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleNextLesson} disabled={currentLessonIndex === allLessons.length - 1} style={[styles.toolBtn, currentLessonIndex === allLessons.length - 1 && { opacity: 0.3 }]}>
                <Ionicons name="play-skip-forward" size={18} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleForward(10)} style={styles.toolBtn}>
                <Ionicons name="play-forward" size={18} color={colors.text} />
                <Text style={[styles.toolBtnText, { color: colors.textMuted }]}>10s</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.playbackRightControls}>
              {resolvedVideoUrl && (
                <TouchableOpacity
                  style={[styles.speedPill, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, borderWidth: 1 }]}
                  onPress={() => Linking.openURL(resolvedVideoUrl).catch(() => {})}
                  accessibilityRole="button"
                  accessibilityLabel="Open video externally"
                >
                  <Ionicons name="open-outline" size={13} color={colors.text} />
                  <Text style={[styles.speedPillText, { color: colors.text }]}>Open</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.speedPill} onPress={cycleSpeed}>
                <Text style={styles.speedPillText}>{playbackSpeed}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.speedPill, { backgroundColor: '#E11D4822', borderColor: '#E11D48', borderWidth: 1 }]}
                onPress={handleSimulateVideoEnd}
              >
                <Ionicons name="checkmark-done" size={12} color="#E11D48" />
                <Text style={[styles.speedPillText, { color: '#E11D48' }]}>
                  {isBangla ? 'শেষ' : 'Finish'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Lesson Title & Completion CTA */}
        <View style={styles.lessonHeaderCard}>
          <View style={styles.titleCol}>
            <Text style={[styles.lessonTitle, { color: colors.text }]}>
              {currentLesson.title}
            </Text>
            <Text style={[styles.lessonInstructor, { color: colors.textMuted }]}>
              {course.instructor.name} • {course.instructor.company}
            </Text>
          </View>

          <View style={styles.actionRowRight}>
            <TouchableOpacity
              style={[
                styles.offlineBtn,
                { backgroundColor: isDownloaded ? colors.primary + '20' : colors.surfaceSubtle, borderColor: colors.border },
              ]}
              onPress={handleToggleOffline}
              accessibilityRole="button"
              accessibilityLabel={isDownloaded ? "Remove downloaded lesson" : "Download lesson for offline studying"}
            >
              <Ionicons
                name={isDownloaded ? 'cloud-done' : 'cloud-download-outline'}
                size={16}
                color={isDownloaded ? colors.primary : colors.textMuted}
              />
            </TouchableOpacity>

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
                size={16}
                color={isLessonCompleted ? colors.primary : '#FFFFFF'}
              />
              <Text
                style={[
                  styles.completeBtnText,
                  { color: isLessonCompleted ? colors.primary : '#FFFFFF' },
                ]}
              >
                {isLessonCompleted ? t('lessonCompleted') : t('markComplete')}
              </Text>
            </SpringPressable>
          </View>
        </View>

        {/* Course Completion & Certificate Banner */}
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
              <Ionicons name="trophy" size={26} color="#F59E0B" />
            </View>
            <View style={styles.completionContent}>
              <View style={styles.completionHeaderRow}>
                <Text style={[styles.completionTitle, { color: isDark ? '#A7F3D0' : '#065F46' }]}>
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
                <Ionicons name="ribbon" size={15} color="#FFFFFF" />
                <Text style={styles.claimCertCTAText}>View Digital Certificate</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Interactive Lesson Navigation & Tools Tab Strip */}
        <View style={[styles.tabsStrip, { borderBottomColor: colors.border }]}>
          {[
            { id: 'curriculum', label: 'Playlist', icon: 'list' },
            { id: 'qna', label: 'Q&A', icon: 'chatbubbles' },
            { id: 'overview', label: 'Overview', icon: 'information-circle' },
            { id: 'notes', label: `Notes (${lessonNotes.length})`, icon: 'document-text' },
            { id: 'resources', label: 'Files', icon: 'download' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tabButton,
                  isActive && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
                ]}
                onPress={() => setActiveTab(tab.id as PlayerTab)}
              >
                <Ionicons
                  name={tab.icon as any}
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

        {/* Tab Content Panels */}
        <View style={styles.tabPanel}>
          <AnimatedTabContent tabKey={activeTab}>
          {activeTab === 'qna' && (
            <View style={{ paddingVertical: 4 }}>
              <CourseQnATab
                courseId={course.id}
                currentLessonTitle={currentLesson.title}
              />
            </View>
          )}

          {activeTab === 'curriculum' && (
            <View style={styles.curriculumList}>
              {allLessons.map((item, idx) => {
                const isSelected = item.lesson.id === currentLesson.id;
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
                          'Course Not Purchased',
                          'This lesson is part of the complete course. Please enroll or purchase the course to unlock full access.'
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
                            : itemAccessible
                            ? colors.surfaceSubtle
                            : colors.surfaceSubtle,
                        },
                      ]}
                    >
                      {isCompleted ? (
                        <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                      ) : isSelected ? (
                        <Ionicons name="play" size={14} color="#FFFFFF" />
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

                    {isAdmin && (
                      <View style={[styles.adminPlaylistBadge, { backgroundColor: '#FFB60620' }]}>
                        <Ionicons name="shield-checkmark" size={10} color="#FFB606" />
                        <Text style={styles.adminPlaylistText}>Admin</Text>
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
          )}

          {activeTab === 'overview' && (
            <View style={styles.overviewContainer}>
              <Text style={[styles.overviewHeading, { color: colors.text }]}>
                Lesson Description
              </Text>
              <Text style={[styles.overviewText, { color: colors.textMuted }]}>
                {lessonDetail?.content || currentLesson.summary ||
                  'In this lecture, you will explore core operational frameworks and practical workflows designed for maximum business productivity.'}
              </Text>

              <View
                style={[
                  styles.quizCallout,
                  { backgroundColor: colors.surfaceCard, borderColor: colors.secondary },
                ]}
              >
                <View style={styles.quizCalloutLeft}>
                  <Ionicons name="school" size={24} color={colors.secondary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.quizCalloutTitle, { color: colors.text }]}>
                      Knowledge Check
                    </Text>
                    <Text style={[styles.quizCalloutSub, { color: colors.textMuted }]} numberOfLines={1}>
                      Test your retention on this lecture to earn +25 XP.
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.startQuizBtn, { backgroundColor: colors.secondary }]}
                  onPress={() => setQuizPlayerVisible(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Take knowledge check quiz"
                >
                  <Text style={styles.startQuizText}>Take Quiz</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {activeTab === 'notes' && (
            <View style={styles.notesTab}>
              <View style={styles.notesHeader}>
                <Text style={[styles.notesTitle, { color: colors.text }]}>
                  Your Notes for this Lecture
                </Text>
                <TouchableOpacity
                  style={[styles.takeNoteBtn, { backgroundColor: colors.primary }]}
                  onPress={() => setNotesModalVisible(true)}
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                  <Text style={styles.takeNoteText}>New Note</Text>
                </TouchableOpacity>
              </View>

              {lessonNotes.length === 0 ? (
                <View style={styles.emptyNotesBox}>
                  <Ionicons name="document-text-outline" size={36} color={colors.textLight} />
                  <Text style={[styles.emptyNotesText, { color: colors.textMuted }]}>
                    No notes yet. Tap "New Note" to capture key insights at any timestamp!
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
                    <Text style={[styles.noteTimestamp, { color: colors.primary }]}>
                      Timestamp: {n.timestamp}
                    </Text>
                    <Text style={[styles.noteBody, { color: colors.text }]}>{n.text}</Text>
                  </View>
                ))
              )}
            </View>
          )}

          {activeTab === 'resources' && (
            <View style={styles.resourcesTab}>
              {[
                { name: 'Executive_AI_Prompt_Playbook.pdf', size: '2.4 MB', type: 'PDF' },
                { name: 'Financial_Model_Template_v3.xlsx', size: '1.8 MB', type: 'Excel' },
                { name: 'People_Analytics_Framework.docx', size: '850 KB', type: 'Doc' },
              ].map((res, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.resourceRow,
                    { backgroundColor: colors.surfaceCard, borderColor: colors.border },
                  ]}
                  onPress={() => Alert.alert('Downloading Resource', `Downloading ${res.name}...`)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.fileIconBg, { backgroundColor: colors.primaryLight }]}>
                    <Ionicons name="document-attach" size={18} color={colors.primary} />
                  </View>
                  <View style={styles.fileMeta}>
                    <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1}>
                      {res.name}
                    </Text>
                    <Text style={[styles.fileSize, { color: colors.textMuted }]}>
                      {res.type} • {res.size}
                    </Text>
                  </View>
                  <Ionicons name="download-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
              ))}
            </View>
          )}
          </AnimatedTabContent>
        </View>
      </ScrollView>

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

      {/* Interactive Assessment Quiz Player Modal */}
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
          setCurrentPositionSeconds(sec);
          if (course && currentLesson) recordWatchPosition(course.id, currentLesson.id, sec);
          setNotesModalVisible(false);
          const mins = Math.floor(sec / 60);
          const secs = (sec % 60).toString().padStart(2, '0');
          Alert.alert('Jumped to Video Bookmark ⏱️', `Player seeked to ${mins}:${secs}`);
        }}
        onClose={() => setNotesModalVisible(false)}
      />

      {/* Mandatory Course Review Modal before Certificate Unlock */}
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

      {/* In-Player Payment Modal for Unlocked Access */}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminBanner: {
    flexDirection: 'column',
    paddingVertical: 8,
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
    fontSize: 11,
    fontWeight: '800',
    color: '#FFB606',
    letterSpacing: 0.5,
  },
  adminBannerSub: {
    fontSize: 11,
    color: '#F8FAFC',
  },
  previewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
  },
  previewBannerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  modeSwitchBar: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
  },
  modeSwitchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  modeSwitchActive: {
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modeSwitchText: {
    fontSize: 12,
  },
  saveDataBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  saveDataBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  playerContainer: {
    height: 225,
    backgroundColor: '#000000',
    position: 'relative',
  },
  videoWebView: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
  },
  loadingVideoOverlay: {
    flex: 1,
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
    height: 240,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  lockedIconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 182, 6, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  lockedTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  lockedSub: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 12,
  },
  lockedActionsCol: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  lockedPurchaseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFB606',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  lockedPurchaseBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#102F53',
  },
  lockedPreviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#FFB606',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  lockedPreviewBtnText: {
    fontSize: 13,
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
  playbackToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    flexWrap: 'nowrap',
  },
  playbackLeftControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  toolBtnText: {
    fontSize: 10,
    fontWeight: '600',
  },
  playbackRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  speedPill: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  speedPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  commutePlayerCard: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commuteHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  commuteHeaderBadgeText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    gap: 4,
    marginBottom: 12,
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
  },
  commuteLessonTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  commuteInstructorText: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 16,
  },
  commuteControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 16,
  },
  commuteSkipBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  skipSecText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  commuteMainPlayBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commuteBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  commuteTimeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  bgPlaybackNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bgPlaybackText: {
    color: '#10B981',
    fontSize: 10,
  },
  autoplayCountdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 16,
  },
  autoplayCard: {
    width: '90%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  autoplayBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6366F1',
  },
  autoplayCountdownSec: {
    fontSize: 32,
    fontWeight: '900',
    color: '#6366F1',
    marginVertical: 4,
  },
  autoplayNextTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  autoplayActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  autoplayCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
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
    paddingVertical: 6,
    borderRadius: 6,
  },
  autoplayPlayNowText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  lessonHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  titleCol: {
    flex: 1,
    marginRight: 12,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  lessonInstructor: {
    fontSize: 12,
  },
  actionRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  offlineBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
  },
  completeBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  completionBanner: {
    marginHorizontal: 14,
    marginBottom: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
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
  },
  completionTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  completionXpBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  completionXpText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  completionSub: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  claimCertCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  claimCertCTAText: {
    color: '#FFFFFF',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
  },
  tabButtonText: {
    fontSize: 11,
  },
  tabPanel: {
    padding: 14,
  },
  curriculumList: {
    gap: 8,
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
  },
  playlistIconBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playlistIndex: {
    fontSize: 11,
    fontWeight: '700',
  },
  playlistInfo: {
    flex: 1,
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
  },
  previewText: {
    fontSize: 10,
    fontWeight: '700',
  },
  adminPlaylistBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#FFB60680',
  },
  adminPlaylistText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFB606',
  },
  quizPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  quizPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  overviewContainer: {
    gap: 12,
  },
  overviewHeading: {
    fontSize: 14,
    fontWeight: '700',
  },
  overviewText: {
    fontSize: 13,
    lineHeight: 18,
  },
  quizCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
    gap: 10,
  },
  quizCalloutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  quizCalloutTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  quizCalloutSub: {
    fontSize: 11,
    marginTop: 2,
  },
  startQuizBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
  },
  startQuizText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  notesTab: {
    gap: 12,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notesTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  takeNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  takeNoteText: {
    color: '#FFFFFF',
    fontSize: 11,
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
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  noteTimestamp: {
    fontSize: 11,
    fontWeight: '700',
  },
  noteBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  resourcesTab: {
    gap: 8,
  },
  resourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
  },
  fileIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileMeta: {
    flex: 1,
  },
  fileName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 10,
  },
});
