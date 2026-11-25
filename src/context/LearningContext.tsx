import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Course, UserProgress, Certificate, Note, CategoryId, Review } from '../types';
import { useAuth } from './AuthContext';
import { useNetwork } from './NetworkContext';
import { CoursesService } from '../services/api/coursesService';
import { Endpoints } from '../services/api/endpoints';
import { SyncQueueManager } from '../services/offline/syncQueue';
import { computeRecommendedCourses } from '../utils/recommendations';
import { LearningContextType } from './learning/learningContext.types';
import { buildCertificateRecord } from './learning/learningCatalogData';
import {
  LEARNING_STORAGE_KEYS,
  hydrateUserLearningScope,
  persistUserLearningKey,
} from './learning/learningStorage';
import { useCatalogAndBrandingSync } from './learning/useCatalogAndBrandingSync';

const LearningContext = createContext<LearningContextType>({} as LearningContextType);

export const LearningProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token, canBypassCourseLocks } = useAuth();
  const { isOffline } = useNetwork();
  const userScope = user?.id ? `_u_${user.id}` : '_guest';

  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [userProgress, setUserProgress] = useState<Record<string, UserProgress>>({});
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [rsvpWorkshops, setRsvpWorkshops] = useState<string[]>([]);
  const [categoryAffinities, setCategoryAffinities] = useState<Record<string, number>>({});
  const [searchKeywordsHistory, setSearchKeywordsHistory] = useState<string[]>([]);
  const [reviewedCourseIds, setReviewedCourseIds] = useState<string[]>([]);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [isSyncingOffline, setIsSyncingOffline] = useState<boolean>(false);

  const catalogCoursesRef = useRef<Course[]>([]);

  useEffect(() => {
    const unsub = SyncQueueManager.subscribe((count, isSyncing) => {
      setPendingSyncCount(count);
      setIsSyncingOffline(isSyncing);
    });
    return unsub;
  }, []);

  const syncOfflineData = useCallback(async (force?: boolean) => {
    return SyncQueueManager.processQueue(force);
  }, []);

  const syncUserEnrollments = useCallback(async (): Promise<string[] | null> => {
    if (!user?.id || !token) return null;

    const serverIds = await CoursesService.fetchEnrolledCourseIdsFromServer();
    if (serverIds === null) return null;

    let pendingEnrollIds = new Set<string>();
    try {
      const pending = await SyncQueueManager.getPendingMutations();
      pendingEnrollIds = new Set(
        pending
          .filter((m) => m.action === 'ENROLL_COURSE' && m.payload?.id != null)
          .map((m) => String(m.payload.id))
      );
    } catch {}

    const serverIdSet = new Set(serverIds);
    const today = new Date().toISOString().split('T')[0];

    setUserProgress((prev) => {
      let changed = false;
      const next: Record<string, UserProgress> = {};

      for (const [cId, prog] of Object.entries(prev)) {
        if (serverIdSet.has(cId) || pendingEnrollIds.has(cId)) {
          next[cId] = prog;
        } else {
          changed = true;
        }
      }

      for (const cId of serverIds) {
        if (next[cId]) continue;
        const matchedCourse = catalogCoursesRef.current.find((c) => c.id === cId);
        const firstLessonId = matchedCourse?.modules?.[0]?.lessons?.[0]?.id || `les-${cId}-1`;
        next[cId] = {
          courseId: cId,
          enrolledDate: today,
          completedLessonIds: [],
          lastAccessedLessonId: firstLessonId,
          isCompleted: false,
        };
        changed = true;
      }

      if (!changed) return prev;
      persistUserLearningKey(LEARNING_STORAGE_KEYS.PROGRESS, userScope, next);
      return next;
    });

    return serverIds;
  }, [user?.id, token, userScope]);

  const catalog = useCatalogAndBrandingSync(isOffline, syncUserEnrollments);
  catalogCoursesRef.current = catalog.courses;

  useEffect(() => {
    let active = true;
    SyncQueueManager.setUserScope(userScope);
    setUserProgress({});
    setBookmarks([]);
    setCertificates([]);
    setNotes([]);
    setRsvpWorkshops([]);
    setCategoryAffinities({});
    setSearchKeywordsHistory([]);
    setReviewedCourseIds([]);

    (async () => {
      try {
        const hydrated = await hydrateUserLearningScope(userScope);
        if (!active) return;

        setUserProgress(hydrated.userProgress);
        setBookmarks(hydrated.bookmarks);
        setNotes(hydrated.notes);
        setRsvpWorkshops(hydrated.rsvpWorkshops);
        setCategoryAffinities(hydrated.categoryAffinities);
        setSearchKeywordsHistory(hydrated.searchKeywordsHistory);
        setReviewedCourseIds(hydrated.reviewedCourseIds);
        setCertificates(hydrated.certificates);

        if (user?.id && token) {
          await syncUserEnrollments();
        }
      } catch {}
    })();

    return () => {
      active = false;
    };
  }, [user?.id, token, userScope, syncUserEnrollments]);

  const enrollInCourse = (courseId: string) => {
    const course = catalog.courses.find((c) => c.id === courseId);
    const isPaid = Boolean(
      (course?.priceBdt && course.priceBdt > 0) || (course?.price && course.price > 0)
    );
    if (isPaid || !user?.id) return;

    const firstLessonId = course?.modules?.[0]?.lessons?.[0]?.id || `les-${courseId}-1`;
    setUserProgress((prev) => {
      if (prev[courseId]) return prev;
      const updated = {
        ...prev,
        [courseId]: {
          courseId,
          enrolledDate: new Date().toISOString().split('T')[0],
          completedLessonIds: [],
          lastAccessedLessonId: firstLessonId,
          isCompleted: false,
        },
      };
      persistUserLearningKey(LEARNING_STORAGE_KEYS.PROGRESS, userScope, updated);
      return updated;
    });

    SyncQueueManager.enqueue('ENROLL_COURSE', Endpoints.LEARNPRESS.COURSE_ENROLL, {
      id: courseId,
    }).then(() => {
      SyncQueueManager.processQueue().catch(() => {});
    });
  };

  /**
   * Records enrollment locally ONLY after server-side confirmation (no blind queue mutation).
   */
  const confirmServerEnrollments = useCallback(
    (courseIds: string[]) => {
      const uniqueIds = Array.from(new Set(courseIds.map((id) => String(id)).filter(Boolean)));
      if (uniqueIds.length === 0) return;

      setUserProgress((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const courseId of uniqueIds) {
          if (next[courseId]) continue;
          const course = catalog.coursesRef.current.find((c) => c.id === courseId);
          const firstLessonId = course?.modules?.[0]?.lessons?.[0]?.id || `les-${courseId}-1`;
          next[courseId] = {
            courseId,
            enrolledDate: new Date().toISOString().split('T')[0],
            completedLessonIds: [],
            lastAccessedLessonId: firstLessonId,
            isCompleted: false,
          };
          changed = true;
        }
        if (!changed) return prev;
        persistUserLearningKey(LEARNING_STORAGE_KEYS.PROGRESS, userScope, next);
        return next;
      });
    },
    [catalog.coursesRef, userScope]
  );

  const markLessonCompleted = (courseId: string, lessonId: string) => {
    const course = catalog.courses.find((c) => c.id === courseId);
    if (!course) return;

    const current = userProgress[courseId] || {
      courseId,
      enrolledDate: new Date().toISOString().split('T')[0],
      completedLessonIds: [],
      lastAccessedLessonId: lessonId,
      isCompleted: false,
    };
    if (current.completedLessonIds.includes(lessonId)) return;

    const newCompleted = [...current.completedLessonIds, lessonId];
    const totalLessons = course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0;
    const isCompleted = totalLessons > 0 && newCompleted.length >= totalLessons;
    const userHasReviewed = reviewedCourseIds.includes(courseId) || !!current.hasReviewed;
    let certId = current.certificateId;

    if (isCompleted && userHasReviewed && !certId) {
      const studentName = user?.displayName || user?.name || user?.username || 'Executive Graduate';
      const newCert = buildCertificateRecord(course, studentName, undefined, 'Course Instructor');
      certId = newCert.credentialId;
      setCertificates((prev) => {
        const nextCerts = [newCert, ...prev];
        persistUserLearningKey(LEARNING_STORAGE_KEYS.CERTIFICATES, userScope, nextCerts);
        return nextCerts;
      });
    }

    const updated = {
      ...userProgress,
      [courseId]: {
        ...current,
        completedLessonIds: newCompleted,
        lastAccessedLessonId: lessonId,
        isCompleted,
        hasReviewed: userHasReviewed,
        completedDate: isCompleted
          ? current.completedDate || new Date().toISOString().split('T')[0]
          : current.completedDate,
        certificateId: certId,
      },
    };

    setUserProgress(updated);
    persistUserLearningKey(LEARNING_STORAGE_KEYS.PROGRESS, userScope, updated);

    SyncQueueManager.enqueue('COMPLETE_LESSON', Endpoints.LEARNPRESS.LESSON_FINISH, {
      id: lessonId,
      course_id: courseId,
    }).then(() => {
      SyncQueueManager.processQueue().catch(() => {});
    });
  };

  const toggleBookmark = (courseId: string) => {
    const next = bookmarks.includes(courseId)
      ? bookmarks.filter((id) => id !== courseId)
      : [...bookmarks, courseId];
    setBookmarks(next);
    persistUserLearningKey(LEARNING_STORAGE_KEYS.BOOKMARKS, userScope, next);
  };

  const isBookmarked = (courseId: string) => bookmarks.includes(courseId);

  const addNote = (courseId: string, lessonId: string, text: string, timestamp?: string) => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      courseId,
      lessonId,
      timestamp: timestamp || '00:00',
      text,
      createdAt: new Date().toISOString().split('T')[0],
    };
    const updated = [newNote, ...notes];
    setNotes(updated);
    persistUserLearningKey(LEARNING_STORAGE_KEYS.NOTES, userScope, updated);
  };

  const addCourseReview = (courseId: string, reviewData: Omit<Review, 'id' | 'date'>) => {
    const newReview: Review = {
      ...reviewData,
      id: `rev-${Date.now()}`,
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    };
    catalog.setCourses((prevCourses) =>
      prevCourses.map((c) => {
        if (c.id !== courseId) return c;
        const updatedReviews = [newReview, ...(c.reviews || [])];
        const newAvgRating =
          updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length;
        return {
          ...c,
          reviews: updatedReviews,
          reviewsCount: updatedReviews.length,
          rating: Number(newAvgRating.toFixed(1)),
        };
      })
    );
  };

  const deleteNote = (noteId: string) => {
    const updated = notes.filter((n) => n.id !== noteId);
    setNotes(updated);
    persistUserLearningKey(LEARNING_STORAGE_KEYS.NOTES, userScope, updated);
  };

  const restoreNote = (note: Note) => {
    if (notes.some((n) => n.id === note.id)) return;
    const updated = [note, ...notes];
    setNotes(updated);
    persistUserLearningKey(LEARNING_STORAGE_KEYS.NOTES, userScope, updated);
  };

  const getNotesForLesson = (courseId: string, lessonId: string) =>
    notes.filter((n) => n.courseId === courseId && n.lessonId === lessonId);

  const getCourseProgressPercentage = (courseId: string): number => {
    const course = catalog.courses.find((c) => c.id === courseId);
    if (!course) return 0;
    const progress = userProgress[courseId];
    if (!progress) return 0;
    if (progress.isCompleted) return 100;

    const moduleLessons =
      course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0;
    const totalLessons = moduleLessons > 0 ? moduleLessons : course.lecturesCount || 0;
    if (totalLessons === 0) return 0;
    return Math.min(100, Math.round((progress.completedLessonIds.length / totalLessons) * 100));
  };

  const recordWatchPosition = (courseId: string, lessonId: string, seconds: number) => {
    const current = userProgress[courseId] || {
      courseId,
      enrolledDate: new Date().toISOString().split('T')[0],
      completedLessonIds: [],
      isCompleted: false,
    };
    const updated = {
      ...userProgress,
      [courseId]: {
        ...current,
        lastAccessedLessonId: lessonId,
        lastWatchPositionSeconds: {
          ...(current.lastWatchPositionSeconds || {}),
          [lessonId]: Math.max(0, Math.floor(seconds)),
        },
      },
    };
    setUserProgress(updated);
    persistUserLearningKey(LEARNING_STORAGE_KEYS.PROGRESS, userScope, updated);
  };

  const getWatchPosition = (courseId: string, lessonId: string): number =>
    userProgress[courseId]?.lastWatchPositionSeconds?.[lessonId] || 0;

  const rsvpForWorkshop = (workshopId: string) => {
    if (rsvpWorkshops.includes(workshopId)) return;
    const updated = [...rsvpWorkshops, workshopId];
    setRsvpWorkshops(updated);
    persistUserLearningKey(LEARNING_STORAGE_KEYS.WORKSHOPS, userScope, updated);
  };

  const toggleWorkshopRsvp = (workshopId: string): boolean => {
    const exists = rsvpWorkshops.includes(workshopId);
    const updated = exists
      ? rsvpWorkshops.filter((id) => id !== workshopId)
      : [...rsvpWorkshops, workshopId];
    setRsvpWorkshops(updated);
    persistUserLearningKey(LEARNING_STORAGE_KEYS.WORKSHOPS, userScope, updated);
    return !exists;
  };

  const isRsvpd = (workshopId: string) => rsvpWorkshops.includes(workshopId);
  const getCourseById = (courseId: string) => catalog.courses.find((c) => c.id === courseId);
  const getWorkshopById = (workshopId: string) =>
    catalog.workshops.find((w) => w.id === workshopId);

  const recordCategoryInteraction = (categoryId: string) => {
    if (!categoryId || categoryId === 'all') return;
    setCategoryAffinities((prev) => {
      const updated = { ...prev, [categoryId]: (prev[categoryId] || 0) + 1 };
      persistUserLearningKey(LEARNING_STORAGE_KEYS.AFFINITIES, userScope, updated);
      return updated;
    });
  };

  const recordSearchKeyword = (keyword: string) => {
    const trimmed = keyword.trim().toLowerCase();
    if (!trimmed || trimmed.length < 2) return;
    setSearchKeywordsHistory((prev) => {
      const updated = [trimmed, ...prev.filter((k) => k !== trimmed)].slice(0, 10);
      persistUserLearningKey(LEARNING_STORAGE_KEYS.SEARCH_HISTORY, userScope, updated);
      return updated;
    });
  };

  const hasReviewedCourse = (courseId: string) =>
    reviewedCourseIds.includes(courseId) || !!userProgress[courseId]?.hasReviewed;

  const isCertificateUnlocked = (courseId: string) => {
    if (canBypassCourseLocks) return true;
    const progress = userProgress[courseId];
    return Boolean(progress?.isCompleted && hasReviewedCourse(courseId));
  };

  const unlockCertificateForDev = (courseId: string, studentName?: string): Certificate | null => {
    const course = catalog.courses.find((c) => c.id === courseId);
    if (!course) return null;

    const recipientName =
      studentName || user?.displayName || user?.name || user?.username || 'Executive Developer';
    const current = userProgress[courseId] || {
      courseId,
      enrolledDate: new Date().toISOString().split('T')[0],
      completedLessonIds: course.modules?.flatMap((m) => m.lessons.map((l) => l.id)) || [],
      isCompleted: true,
    };

    let cert = certificates.find((c) => c.courseId === courseId);
    const certId =
      current.certificateId ||
      cert?.credentialId ||
      buildCertificateRecord(course, recipientName).credentialId;

    if (!cert) {
      cert = buildCertificateRecord(course, recipientName, certId);
      setCertificates((prev) => {
        const nextCerts = [cert!, ...prev.filter((c) => c.courseId !== courseId)];
        persistUserLearningKey(LEARNING_STORAGE_KEYS.CERTIFICATES, userScope, nextCerts);
        return nextCerts;
      });
    }

    if (!reviewedCourseIds.includes(courseId)) {
      const nextReviewed = [...reviewedCourseIds, courseId];
      setReviewedCourseIds(nextReviewed);
      persistUserLearningKey(LEARNING_STORAGE_KEYS.REVIEWS, userScope, nextReviewed);
    }

    const updated = {
      ...userProgress,
      [courseId]: {
        ...current,
        completedLessonIds:
          course.modules?.flatMap((m) => m.lessons.map((l) => l.id)) || current.completedLessonIds,
        isCompleted: true,
        hasReviewed: true,
        certificateId: certId,
        completedDate: current.completedDate || new Date().toISOString().split('T')[0],
      },
    };
    setUserProgress(updated);
    persistUserLearningKey(LEARNING_STORAGE_KEYS.PROGRESS, userScope, updated);
    return cert;
  };

  const submitMandatoryCourseReview = (
    courseId: string,
    rating: number,
    feedback: string,
    userName = 'Executive Graduate',
    userRole = 'Learner'
  ): Certificate | null => {
    addCourseReview(courseId, { userName, userAvatar: '', rating, comment: feedback, userRole });

    const nextReviewed = reviewedCourseIds.includes(courseId)
      ? reviewedCourseIds
      : [...reviewedCourseIds, courseId];
    setReviewedCourseIds(nextReviewed);
    persistUserLearningKey(LEARNING_STORAGE_KEYS.REVIEWS, userScope, nextReviewed);

    const course = catalog.courses.find((c) => c.id === courseId);
    const current = userProgress[courseId] || {
      courseId,
      enrolledDate: new Date().toISOString().split('T')[0],
      completedLessonIds: [],
      isCompleted: true,
    };

    let certId = current.certificateId;
    let cert: Certificate | null = null;

    if (!certId && course) {
      cert = buildCertificateRecord(course, userName);
      certId = cert.credentialId;
      setCertificates((prev) => {
        const nextCerts = [cert!, ...prev];
        persistUserLearningKey(LEARNING_STORAGE_KEYS.CERTIFICATES, userScope, nextCerts);
        return nextCerts;
      });
    } else if (certId) {
      cert = certificates.find((c) => c.credentialId === certId || c.courseId === courseId) || null;
    }

    const updated = {
      ...userProgress,
      [courseId]: { ...current, isCompleted: true, hasReviewed: true, certificateId: certId },
    };
    setUserProgress(updated);
    persistUserLearningKey(LEARNING_STORAGE_KEYS.PROGRESS, userScope, updated);
    return cert;
  };

  const getRecommendedCourses = () =>
    computeRecommendedCourses({
      courses: catalog.courses,
      categories: catalog.categories,
      userProgress,
      categoryAffinities,
      searchKeywordsHistory,
    });

  return (
    <LearningContext.Provider
      value={{
        courses: catalog.courses,
        totalCourseCount: catalog.totalCourseCount,
        categories: catalog.categories,
        workshops: catalog.workshops,
        hasActiveLiveWorkshop: catalog.workshops.some((w) => !!w.isLive),
        blogPosts: catalog.blogPosts,
        isLoadingCourses: catalog.isLoadingCourses,
        coursesError: catalog.coursesError,
        userProgress,
        bookmarks,
        certificates,
        notes,
        rsvpWorkshops,
        selectedCategory,
        searchQuery,
        setSelectedCategory,
        setSearchQuery,
        refreshCourses: catalog.refreshCourses,
        loadCourseDetail: catalog.loadCourseDetail,
        enrollInCourse,
        confirmServerEnrollments,
        markLessonCompleted,
        toggleBookmark,
        isBookmarked,
        addNote,
        deleteNote,
        restoreNote,
        getNotesForLesson,
        getCourseProgressPercentage,
        recordWatchPosition,
        getWatchPosition,
        addCourseReview,
        rsvpForWorkshop,
        toggleWorkshopRsvp,
        isRsvpd,
        getCourseById,
        getWorkshopById,
        recordCategoryInteraction,
        recordSearchKeyword,
        getRecommendedCourses,
        reviewedCourseIds,
        hasReviewedCourse,
        isCertificateUnlocked,
        unlockCertificateForDev,
        submitMandatoryCourseReview,
        pendingSyncCount,
        isSyncingOffline,
        syncOfflineData,
        siteBranding: catalog.siteBranding,
        banners: catalog.banners,
        partnerLogos: catalog.partnerLogos,
        homeFeatures: catalog.homeFeatures,
        specialBundles: catalog.specialBundles,
        studentTestimonials: catalog.studentTestimonials,
        appRemoteConfig: catalog.appRemoteConfig,
        isBrandingLoading: catalog.isBrandingLoading,
        refreshBranding: catalog.refreshBranding,
        lastSyncedAt: catalog.lastSyncedAt,
        isBackgroundSyncing: catalog.isBackgroundSyncing,
      }}
    >
      {children}
    </LearningContext.Provider>
  );
};

export const useLearning = () => useContext(LearningContext);
