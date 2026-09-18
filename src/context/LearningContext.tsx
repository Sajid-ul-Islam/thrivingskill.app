import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Course, UserProgress, Certificate, Note, CategoryId, Workshop, Category, WpPost, Review } from '../types';
import { COURSES as INITIAL_COURSES, INITIAL_CERTIFICATES, WORKSHOPS, CATEGORIES as INITIAL_CATEGORIES } from '../data/mockData';
import {
  fetchWpCourses,
  fetchWpCategories,
  fetchWpPosts,
  fetchWpCourseDetail,
} from '../services/wordpressApi';

const PROGRESS_STORAGE_KEY = '@thriving_skill_progress';
const BOOKMARKS_STORAGE_KEY = '@thriving_skill_bookmarks';
const NOTES_STORAGE_KEY = '@thriving_skill_notes';
const WORKSHOPS_STORAGE_KEY = '@thriving_skill_rsvps';
const AFFINITIES_STORAGE_KEY = '@thriving_skill_affinities';
const SEARCH_HISTORY_STORAGE_KEY = '@thriving_skill_searches';
const REVIEWS_STORAGE_KEY = '@thriving_skill_reviewed_courses';

interface LearningContextType {
  courses: Course[];
  categories: Category[];
  blogPosts: WpPost[];
  isLoadingCourses: boolean;
  userProgress: Record<string, UserProgress>;
  bookmarks: string[];
  certificates: Certificate[];
  notes: Note[];
  rsvpWorkshops: string[];
  selectedCategory: CategoryId;
  searchQuery: string;
  setSelectedCategory: (cat: CategoryId) => void;
  setSearchQuery: (query: string) => void;
  refreshCourses: () => Promise<void>;
  loadCourseDetail: (courseId: string) => Promise<Course>;
  enrollInCourse: (courseId: string) => void;
  markLessonCompleted: (courseId: string, lessonId: string) => void;
  toggleBookmark: (courseId: string) => void;
  isBookmarked: (courseId: string) => boolean;
  addNote: (courseId: string, lessonId: string, text: string, timestamp?: string) => void;
  deleteNote: (noteId: string) => void;
  getNotesForLesson: (courseId: string, lessonId: string) => Note[];
  getCourseProgressPercentage: (courseId: string) => number;
  recordWatchPosition: (courseId: string, lessonId: string, seconds: number) => void;
  getWatchPosition: (courseId: string, lessonId: string) => number;
  addCourseReview: (courseId: string, review: Omit<Review, 'id' | 'date'>) => void;
  rsvpForWorkshop: (workshopId: string) => void;
  isRsvpd: (workshopId: string) => boolean;
  getCourseById: (courseId: string) => Course | undefined;
  getWorkshopById: (workshopId: string) => Workshop | undefined;

  // Behavior-based Recommendations (CR-01)
  recordCategoryInteraction: (categoryId: string) => void;
  recordSearchKeyword: (keyword: string) => void;
  getRecommendedCourses: () => { courses: Course[]; rationale: string; rationaleBn: string };

  // Mandatory Review & Certificate Gating (CR-02)
  reviewedCourseIds: string[];
  hasReviewedCourse: (courseId: string) => boolean;
  isCertificateUnlocked: (courseId: string) => boolean;
  submitMandatoryCourseReview: (
    courseId: string,
    rating: number,
    feedback: string,
    userName?: string,
    userRole?: string
  ) => Certificate | null;
}

const LearningContext = createContext<LearningContextType>({} as LearningContextType);

export const LearningProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [courses, setCourses] = useState<Course[]>(INITIAL_COURSES);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [blogPosts, setBlogPosts] = useState<WpPost[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Initial user progress for rich instant interactive demo
  const [userProgress, setUserProgress] = useState<Record<string, UserProgress>>({
    '86355': {
      courseId: '86355',
      enrolledDate: '2026-08-15',
      completedLessonIds: ['86356'],
      lastAccessedLessonId: '86357',
      isCompleted: false,
    },
    'course-1': {
      courseId: 'course-1',
      enrolledDate: '2026-08-10',
      completedLessonIds: ['l1', 'l2'],
      lastAccessedLessonId: 'l3',
      isCompleted: false,
    },
  });

  const [bookmarks, setBookmarks] = useState<string[]>(['86335', '85330']);
  const [certificates, setCertificates] = useState<Certificate[]>(INITIAL_CERTIFICATES);
  const [notes, setNotes] = useState<Note[]>([
    {
      id: 'note-1',
      courseId: '86355',
      lessonId: '86356',
      timestamp: '01:15',
      text: 'Emotional Intelligence consists of Self-Awareness, Self-Regulation, Motivation, Empathy, and Social Skills.',
      createdAt: '2026-08-16',
    },
  ]);
  const [rsvpWorkshops, setRsvpWorkshops] = useState<string[]>(['ws-1']);

  // Behavior tracking & mandatory reviews state
  const [categoryAffinities, setCategoryAffinities] = useState<Record<string, number>>({
    'generative-ai': 4,
    'excel-data': 3,
  });
  const [searchKeywordsHistory, setSearchKeywordsHistory] = useState<string[]>(['ai', 'excel']);
  const [reviewedCourseIds, setReviewedCourseIds] = useState<string[]>([]);

  // Fetch live courses, categories, and blog posts from WordPress
  const loadWordPressData = useCallback(async () => {
    setIsLoadingCourses(true);
    try {
      const [wpCourses, wpCategories, wpPosts] = await Promise.allSettled([
        fetchWpCourses({ perPage: 40 }),
        fetchWpCategories(),
        fetchWpPosts({ perPage: 6 }),
      ]);

      if (wpCourses.status === 'fulfilled' && wpCourses.value.length > 0) {
        setCourses(wpCourses.value);
      }
      if (wpCategories.status === 'fulfilled' && wpCategories.value.length > 0) {
        setCategories(wpCategories.value);
      }
      if (wpPosts.status === 'fulfilled' && wpPosts.value.length > 0) {
        setBlogPosts(wpPosts.value);
      }
    } catch (err) {
      console.warn('Error fetching WordPress backend data:', err);
    } finally {
      setIsLoadingCourses(false);
    }
  }, []);

  // On mount: load local storage + fetch live WP data
  useEffect(() => {
    (async () => {
      try {
        const [
          savedProgress,
          savedBookmarks,
          savedNotes,
          savedWorkshops,
          savedAffinities,
          savedSearches,
          savedReviews,
        ] = await Promise.all([
          AsyncStorage.getItem(PROGRESS_STORAGE_KEY),
          AsyncStorage.getItem(BOOKMARKS_STORAGE_KEY),
          AsyncStorage.getItem(NOTES_STORAGE_KEY),
          AsyncStorage.getItem(WORKSHOPS_STORAGE_KEY),
          AsyncStorage.getItem(AFFINITIES_STORAGE_KEY),
          AsyncStorage.getItem(SEARCH_HISTORY_STORAGE_KEY),
          AsyncStorage.getItem(REVIEWS_STORAGE_KEY),
        ]);

        if (savedProgress) setUserProgress(JSON.parse(savedProgress));
        if (savedBookmarks) setBookmarks(JSON.parse(savedBookmarks));
        if (savedNotes) setNotes(JSON.parse(savedNotes));
        if (savedWorkshops) setRsvpWorkshops(JSON.parse(savedWorkshops));
        if (savedAffinities) setCategoryAffinities(JSON.parse(savedAffinities));
        if (savedSearches) setSearchKeywordsHistory(JSON.parse(savedSearches));
        if (savedReviews) setReviewedCourseIds(JSON.parse(savedReviews));
      } catch {
        // Safe fallback
      }

      // Fetch live data from WordPress backend
      loadWordPressData();
    })();
  }, [loadWordPressData]);

  const refreshCourses = async () => {
    await loadWordPressData();
  };

  const loadCourseDetail = async (courseId: string): Promise<Course> => {
    try {
      const detail = await fetchWpCourseDetail(courseId);
      // Update in our courses list if it has richer sections
      setCourses((prev) => {
        const idx = prev.findIndex((c) => c.id === courseId);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = detail;
          return next;
        }
        return [detail, ...prev];
      });
      return detail;
    } catch {
      const existing = courses.find((c) => c.id === courseId);
      if (existing) return existing;
      throw new Error('Course not found');
    }
  };

  const saveState = async (key: string, data: any) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch {}
  };

  const enrollInCourse = (courseId: string) => {
    if (userProgress[courseId]) return;
    const course = courses.find((c) => c.id === courseId);
    const firstLessonId = course?.modules[0]?.lessons[0]?.id || `les-${courseId}-1`;
    const updated = {
      ...userProgress,
      [courseId]: {
        courseId,
        enrolledDate: new Date().toISOString().split('T')[0],
        completedLessonIds: [],
        lastAccessedLessonId: firstLessonId,
        isCompleted: false,
      },
    };
    setUserProgress(updated);
    saveState(PROGRESS_STORAGE_KEY, updated);
  };

  const markLessonCompleted = (courseId: string, lessonId: string) => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return;

    const current = userProgress[courseId] || {
      courseId,
      enrolledDate: new Date().toISOString().split('T')[0],
      completedLessonIds: [],
      lastAccessedLessonId: lessonId,
      isCompleted: false,
    };

    const newCompleted = current.completedLessonIds.includes(lessonId)
      ? current.completedLessonIds
      : [...current.completedLessonIds, lessonId];

    const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
    const isCompleted = totalLessons > 0 && newCompleted.length >= totalLessons;

    const userHasReviewed = reviewedCourseIds.includes(courseId) || !!current.hasReviewed;
    let certId = current.certificateId;

    // Certificate is ONLY generated if the course is completed AND the user has submitted a review (CR-02)
    if (isCompleted && userHasReviewed && !certId) {
      certId = `TS-2026-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      const newCert: Certificate = {
        id: `cert-${Date.now()}`,
        courseId: course.id,
        courseTitle: course.title,
        studentName: 'Sajid Islam',
        issueDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        credentialId: certId,
        instructorName: course.instructor.name,
        verificationUrl: `https://thrivingskill.com/verify/${certId}`,
      };
      setCertificates((prev) => [newCert, ...prev]);
    }

    const updated = {
      ...userProgress,
      [courseId]: {
        ...current,
        completedLessonIds: newCompleted,
        lastAccessedLessonId: lessonId,
        isCompleted,
        hasReviewed: userHasReviewed,
        completedDate: isCompleted ? (current.completedDate || new Date().toISOString().split('T')[0]) : current.completedDate,
        certificateId: certId,
      },
    };

    setUserProgress(updated);
    saveState(PROGRESS_STORAGE_KEY, updated);
  };

  const toggleBookmark = (courseId: string) => {
    const next = bookmarks.includes(courseId)
      ? bookmarks.filter((id) => id !== courseId)
      : [...bookmarks, courseId];
    setBookmarks(next);
    saveState(BOOKMARKS_STORAGE_KEY, next);
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
    saveState(NOTES_STORAGE_KEY, updated);
  };

  const addCourseReview = (courseId: string, reviewData: Omit<Review, 'id' | 'date'>) => {
    const newReview: Review = {
      ...reviewData,
      id: `rev-${Date.now()}`,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };
    setCourses((prevCourses) =>
      prevCourses.map((c) => {
        if (c.id === courseId) {
          const updatedReviews = [newReview, ...(c.reviews || [])];
          const newAvgRating =
            updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length;
          return {
            ...c,
            reviews: updatedReviews,
            reviewsCount: updatedReviews.length,
            rating: Number(newAvgRating.toFixed(1)),
          };
        }
        return c;
      })
    );
  };

  const deleteNote = (noteId: string) => {
    const updated = notes.filter((n) => n.id !== noteId);
    setNotes(updated);
    saveState(NOTES_STORAGE_KEY, updated);
  };

  const getNotesForLesson = (courseId: string, lessonId: string) => {
    return notes.filter((n) => n.courseId === courseId && n.lessonId === lessonId);
  };

  const getCourseProgressPercentage = (courseId: string): number => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return 0;
    const progress = userProgress[courseId];
    if (!progress) return 0;

    const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
    if (totalLessons === 0) return 0;

    return Math.round((progress.completedLessonIds.length / totalLessons) * 100);
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
    saveState(PROGRESS_STORAGE_KEY, updated);
  };

  const getWatchPosition = (courseId: string, lessonId: string): number => {
    const progress = userProgress[courseId];
    return progress?.lastWatchPositionSeconds?.[lessonId] || 0;
  };

  const rsvpForWorkshop = (workshopId: string) => {
    if (rsvpWorkshops.includes(workshopId)) return;
    const updated = [...rsvpWorkshops, workshopId];
    setRsvpWorkshops(updated);
    saveState(WORKSHOPS_STORAGE_KEY, updated);
  };

  const isRsvpd = (workshopId: string) => rsvpWorkshops.includes(workshopId);

  const getCourseById = (courseId: string) => courses.find((c) => c.id === courseId);
  const getWorkshopById = (workshopId: string) => WORKSHOPS.find((w) => w.id === workshopId);

  const recordCategoryInteraction = (categoryId: string) => {
    if (!categoryId || categoryId === 'all') return;
    setCategoryAffinities((prev) => {
      const current = prev[categoryId] || 0;
      const updated = { ...prev, [categoryId]: current + 1 };
      saveState(AFFINITIES_STORAGE_KEY, updated);
      return updated;
    });
  };

  const recordSearchKeyword = (keyword: string) => {
    const trimmed = keyword.trim().toLowerCase();
    if (!trimmed || trimmed.length < 2) return;
    setSearchKeywordsHistory((prev) => {
      const filtered = prev.filter((k) => k !== trimmed);
      const updated = [trimmed, ...filtered].slice(0, 10);
      saveState(SEARCH_HISTORY_STORAGE_KEY, updated);
      return updated;
    });
  };

  const hasReviewedCourse = (courseId: string) => {
    return reviewedCourseIds.includes(courseId) || !!userProgress[courseId]?.hasReviewed;
  };

  const isCertificateUnlocked = (courseId: string) => {
    const progress = userProgress[courseId];
    if (!progress || !progress.isCompleted) return false;
    return hasReviewedCourse(courseId);
  };

  const submitMandatoryCourseReview = (
    courseId: string,
    rating: number,
    feedback: string,
    userName = 'Sajid Islam',
    userRole = 'Learner'
  ): Certificate | null => {
    // 1. Record review on course object
    addCourseReview(courseId, {
      userName,
      userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
      rating,
      comment: feedback,
      userRole,
    });

    // 2. Mark as reviewed in persistent list
    const nextReviewed = reviewedCourseIds.includes(courseId)
      ? reviewedCourseIds
      : [...reviewedCourseIds, courseId];
    setReviewedCourseIds(nextReviewed);
    saveState(REVIEWS_STORAGE_KEY, nextReviewed);

    // 3. Find course & unlock certificate
    const course = courses.find((c) => c.id === courseId);
    const current = userProgress[courseId] || {
      courseId,
      enrolledDate: new Date().toISOString().split('T')[0],
      completedLessonIds: [],
      isCompleted: true,
    };

    let certId = current.certificateId;
    let cert: Certificate | null = null;

    if (!certId && course) {
      certId = `TS-2026-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      cert = {
        id: `cert-${Date.now()}`,
        courseId: course.id,
        courseTitle: course.title,
        studentName: userName,
        issueDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        credentialId: certId,
        instructorName: course.instructor?.name || 'Thriving Skills Instructor',
        verificationUrl: `https://thrivingskill.com/verify/${certId}`,
      };
      setCertificates((prev) => [cert!, ...prev]);
    } else if (certId) {
      cert = certificates.find((c) => c.credentialId === certId || c.courseId === courseId) || null;
    }

    const updated = {
      ...userProgress,
      [courseId]: {
        ...current,
        isCompleted: true,
        hasReviewed: true,
        certificateId: certId,
      },
    };
    setUserProgress(updated);
    saveState(PROGRESS_STORAGE_KEY, updated);

    return cert;
  };

  const getRecommendedCourses = (): { courses: Course[]; rationale: string; rationaleBn: string } => {
    const scoreByCat: Record<string, number> = { ...categoryAffinities };

    Object.keys(userProgress).forEach((cId) => {
      const c = courses.find((item) => item.id === cId);
      if (c && c.category) {
        scoreByCat[c.category] = (scoreByCat[c.category] || 0) + 3;
      }
    });

    let topCatId = '';
    let topScore = 0;
    Object.entries(scoreByCat).forEach(([catId, score]) => {
      if (score > topScore) {
        topScore = score;
        topCatId = catId;
      }
    });

    const topCatObj = categories.find((c) => c.id === topCatId);

    const scoredCourses = courses.map((course) => {
      let score = 0;
      const progress = userProgress[course.id];

      // Completed courses receive a penalty so user sees new recommendations
      if (progress?.isCompleted) {
        score -= 80;
      } else if (progress && progress.completedLessonIds.length > 0) {
        score += 15;
      }

      // Category affinity boost
      const catAffinity = scoreByCat[course.category] || 0;
      score += Math.min(50, catAffinity * 10);

      // Search keyword matches
      if (searchKeywordsHistory.length > 0) {
        const titleLower = course.title.toLowerCase();
        const descLower = (course.description || '').toLowerCase();
        const matches = searchKeywordsHistory.some(
          (kw) => titleLower.includes(kw) || descLower.includes(kw)
        );
        if (matches) score += 30;
      }

      // Rating quality score
      score += (course.rating || 4.5) * 4;

      // Popularity score
      score += Math.min(15, Math.log10((course.enrolledCount || 100) + 1) * 5);

      // Badges
      if (course.badge === 'Bestseller' || course.badge === 'Trending') score += 10;

      return { course, score };
    });

    scoredCourses.sort((a, b) => b.score - a.score);
    const recommended = scoredCourses.slice(0, 6).map((item) => item.course);

    let rationale = 'Curated based on top trending & your learning preferences';
    let rationaleBn = 'জনপ্রিয় স্কিল ও রেটিংয়ের উপর ভিত্তি করে আপনার জন্য বিশেষভাবে নির্বাচিত';

    if (topCatObj && topScore > 2) {
      rationale = `Based on your interest in ${topCatObj.name}`;
      rationaleBn = `আপনার "${topCatObj.banglaName || topCatObj.name}" বিষয়ক সক্রিয় আগ্রহের ভিত্তিতে প্রস্তাবিত`;
    }

    return { courses: recommended, rationale, rationaleBn };
  };

  return (
    <LearningContext.Provider
      value={{
        courses,
        categories,
        blogPosts,
        isLoadingCourses,
        userProgress,
        bookmarks,
        certificates,
        notes,
        rsvpWorkshops,
        selectedCategory,
        searchQuery,
        setSelectedCategory,
        setSearchQuery,
        refreshCourses,
        loadCourseDetail,
        enrollInCourse,
        markLessonCompleted,
        toggleBookmark,
        isBookmarked,
        addNote,
        deleteNote,
        getNotesForLesson,
        getCourseProgressPercentage,
        recordWatchPosition,
        getWatchPosition,
        addCourseReview,
        rsvpForWorkshop,
        isRsvpd,
        getCourseById,
        getWorkshopById,
        recordCategoryInteraction,
        recordSearchKeyword,
        getRecommendedCourses,
        reviewedCourseIds,
        hasReviewedCourse,
        isCertificateUnlocked,
        submitMandatoryCourseReview,
      }}
    >
      {children}
    </LearningContext.Provider>
  );
};

export const useLearning = () => useContext(LearningContext);
