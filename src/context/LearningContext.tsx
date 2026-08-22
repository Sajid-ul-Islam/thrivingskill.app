import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Course, UserProgress, Certificate, Note, CategoryId, Workshop } from '../types';
import { COURSES, INITIAL_CERTIFICATES, WORKSHOPS } from '../data/mockData';

const PROGRESS_STORAGE_KEY = '@thriving_skill_progress';
const BOOKMARKS_STORAGE_KEY = '@thriving_skill_bookmarks';
const NOTES_STORAGE_KEY = '@thriving_skill_notes';
const WORKSHOPS_STORAGE_KEY = '@thriving_skill_rsvps';

interface LearningContextType {
  courses: Course[];
  userProgress: Record<string, UserProgress>;
  bookmarks: string[];
  certificates: Certificate[];
  notes: Note[];
  rsvpWorkshops: string[];
  selectedCategory: CategoryId;
  searchQuery: string;
  setSelectedCategory: (cat: CategoryId) => void;
  setSearchQuery: (query: string) => void;
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
  const [courses] = useState<Course[]>(COURSES);
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Initial default enrollment in course-1 for rich instant interactive demo
  const [userProgress, setUserProgress] = useState<Record<string, UserProgress>>({
    'course-1': {
      courseId: 'course-1',
      enrolledDate: '2026-08-10',
      completedLessonIds: ['l1', 'l2'],
      lastAccessedLessonId: 'l3',
      isCompleted: false,
    },
  });

  const [bookmarks, setBookmarks] = useState<string[]>(['course-2']);
  const [certificates, setCertificates] = useState<Certificate[]>(INITIAL_CERTIFICATES);
  const [notes, setNotes] = useState<Note[]>([
    {
      id: 'note-1',
      courseId: 'course-1',
      lessonId: 'l2',
      timestamp: '08:45',
      text: 'RTCC Prompt Model: Role + Task + Context + Constraints ensures reliable structured output for financial reports.',
      createdAt: '2026-08-12',
    },
  ]);
  const [rsvpWorkshops, setRsvpWorkshops] = useState<string[]>(['ws-1']);

  // Load from local storage
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
    })();
  }, []);

  const saveState = async (key: string, data: any) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch {}
  };

  const enrollInCourse = (courseId: string) => {
    if (userProgress[courseId]) return;
    const firstLessonId = courses.find((c) => c.id === courseId)?.modules[0]?.lessons[0]?.id;
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
    const isCompleted = newCompleted.length >= totalLessons;

    let certId = current.certificateId;
    if (isCompleted && !certId) {
      certId = `TS-2026-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      const newCert: Certificate = {
        id: `cert-${Date.now()}`,
        courseId: course.id,
        courseTitle: course.title,
        studentName: 'Alex Rahman',
        issueDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        credentialId: certId,
        instructorName: course.instructor.name,
        verificationUrl: `https://thrivingskill.app/verify/${certId}`,
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
        userProgress,
        bookmarks,
        certificates,
        notes,
        rsvpWorkshops,
        selectedCategory,
        searchQuery,
        setSelectedCategory,
        setSearchQuery,
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
