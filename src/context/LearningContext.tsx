import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Course, UserProgress, Certificate, Note, CategoryId, Workshop, Category, WpPost } from '../types';
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
  addNote: (courseId: string, lessonId: string, text: string) => void;
  deleteNote: (noteId: string) => void;
  getNotesForLesson: (courseId: string, lessonId: string) => Note[];
  getCourseProgressPercentage: (courseId: string) => number;
  rsvpForWorkshop: (workshopId: string) => void;
  isRsvpd: (workshopId: string) => boolean;
  getCourseById: (courseId: string) => Course | undefined;
  getWorkshopById: (workshopId: string) => Workshop | undefined;
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
        const [savedProgress, savedBookmarks, savedNotes, savedWorkshops] = await Promise.all([
          AsyncStorage.getItem(PROGRESS_STORAGE_KEY),
          AsyncStorage.getItem(BOOKMARKS_STORAGE_KEY),
          AsyncStorage.getItem(NOTES_STORAGE_KEY),
          AsyncStorage.getItem(WORKSHOPS_STORAGE_KEY),
        ]);

        if (savedProgress) setUserProgress(JSON.parse(savedProgress));
        if (savedBookmarks) setBookmarks(JSON.parse(savedBookmarks));
        if (savedNotes) setNotes(JSON.parse(savedNotes));
        if (savedWorkshops) setRsvpWorkshops(JSON.parse(savedWorkshops));
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

    let certId = current.certificateId;
    if (isCompleted && !certId) {
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
        completedDate: isCompleted ? new Date().toISOString().split('T')[0] : current.completedDate,
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

  const addNote = (courseId: string, lessonId: string, text: string) => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      courseId,
      lessonId,
      timestamp: '02:30',
      text,
      createdAt: new Date().toISOString().split('T')[0],
    };
    const updated = [newNote, ...notes];
    setNotes(updated);
    saveState(NOTES_STORAGE_KEY, updated);
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

  const rsvpForWorkshop = (workshopId: string) => {
    if (rsvpWorkshops.includes(workshopId)) return;
    const updated = [...rsvpWorkshops, workshopId];
    setRsvpWorkshops(updated);
    saveState(WORKSHOPS_STORAGE_KEY, updated);
  };

  const isRsvpd = (workshopId: string) => rsvpWorkshops.includes(workshopId);

  const getCourseById = (courseId: string) => courses.find((c) => c.id === courseId);
  const getWorkshopById = (workshopId: string) => WORKSHOPS.find((w) => w.id === workshopId);

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
        rsvpForWorkshop,
        isRsvpd,
        getCourseById,
        getWorkshopById,
      }}
    >
      {children}
    </LearningContext.Provider>
  );
};

export const useLearning = () => useContext(LearningContext);
