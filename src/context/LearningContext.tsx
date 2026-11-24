import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Env } from '../config/env';
import { Course, UserProgress, Certificate, Note, CategoryId, Workshop, Category, WpPost, Review } from '../types';
import { WORKSHOPS } from '../data/mockData';
import { useAuth } from './AuthContext';
import { useNetwork } from './NetworkContext';
import { CoursesService } from '../services/api/coursesService';
import { Endpoints } from '../services/api/endpoints';
import { SyncQueueManager } from '../services/offline/syncQueue';
import {
  BrandingService,
  SiteBrandingInfo,
  DynamicCarouselSlide,
  PartnerLogoItem,
  HomeFeatureCardItem,
  SpecialBundlePosterItem,
  StudentTestimonialItem,
  DEFAULT_SITE_BRANDING,
  DEFAULT_CURATED_SLIDES,
  DEFAULT_PARTNER_LOGOS,
  DEFAULT_HOME_FEATURES,
  DEFAULT_SPECIAL_BUNDLES,
  DEFAULT_STUDENT_TESTIMONIALS,
} from '../services/api/brandingService';
import { CompanionService, AppRemoteConfig } from '../services/api/companionService';
import {
  fetchWpCourses,
  fetchWpCategories,
  fetchWpPosts,
  fetchWpCourseDetail,
  fetchWpLiveWorkshops,
} from '../services/wordpressApi';

function areDataEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

function areCoursesEqual(a: Course[], b: Course[]): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  if (a.length === 0) return true;
  if (a[0]?.id !== b[0]?.id || a[a.length - 1]?.id !== b[b.length - 1]?.id) return false;
  const step = Math.max(1, Math.floor(a.length / 20));
  for (let i = 0; i < a.length; i += step) {
    if (
      a[i]?.id !== b[i]?.id ||
      a[i]?.priceBdt !== b[i]?.priceBdt ||
      a[i]?.title !== b[i]?.title
    ) {
      return false;
    }
  }
  return true;
}

const PROGRESS_STORAGE_KEY = '@thriving_skill_progress';
const BOOKMARKS_STORAGE_KEY = '@thriving_skill_bookmarks';
const NOTES_STORAGE_KEY = '@thriving_skill_notes';
const WORKSHOPS_STORAGE_KEY = '@thriving_skill_rsvps';
const AFFINITIES_STORAGE_KEY = '@thriving_skill_affinities';
const SEARCH_HISTORY_STORAGE_KEY = '@thriving_skill_searches';
const REVIEWS_STORAGE_KEY = '@thriving_skill_reviewed_courses';
const CERTIFICATES_STORAGE_KEY = '@thriving_skill_certificates';

interface LearningContextType {
  courses: Course[];
  totalCourseCount: number;
  categories: Category[];
  workshops: Workshop[];
  hasActiveLiveWorkshop: boolean;
  blogPosts: WpPost[];
  isLoadingCourses: boolean;
  coursesError: string | null;
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
  restoreNote: (note: Note) => void;
  getNotesForLesson: (courseId: string, lessonId: string) => Note[];
  getCourseProgressPercentage: (courseId: string) => number;
  recordWatchPosition: (courseId: string, lessonId: string, seconds: number) => void;
  getWatchPosition: (courseId: string, lessonId: string) => number;
  addCourseReview: (courseId: string, review: Omit<Review, 'id' | 'date'>) => void;
  rsvpForWorkshop: (workshopId: string) => void;
  toggleWorkshopRsvp: (workshopId: string) => boolean;
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
  unlockCertificateForDev: (courseId: string, studentName?: string) => Certificate | null;
  submitMandatoryCourseReview: (
    courseId: string,
    rating: number,
    feedback: string,
    userName?: string,
    userRole?: string
  ) => Certificate | null;

  // Local-First Outbox Sync (Phase 1)
  pendingSyncCount: number;
  isSyncingOffline: boolean;
  syncOfflineData: (force?: boolean) => Promise<{ processed: number; succeeded: number; failed: number }>;

  // Dynamic Site Branding & Banners
  siteBranding: SiteBrandingInfo;
  banners: DynamicCarouselSlide[];
  partnerLogos: PartnerLogoItem[];
  homeFeatures: HomeFeatureCardItem[];
  specialBundles: SpecialBundlePosterItem[];
  studentTestimonials: StudentTestimonialItem[];
  appRemoteConfig: AppRemoteConfig | null;
  isBrandingLoading: boolean;
  refreshBranding: (forceRefresh?: boolean) => Promise<void>;

  // Dynamic Live Site Synchronization
  lastSyncedAt: number | null;
  isBackgroundSyncing: boolean;
}

const INITIAL_CANONICAL_CATEGORIES: Category[] = [
  { id: 'all', name: 'All Courses', banglaName: 'সব কোর্স', icon: 'grid', count: 382, color: '#059669', slug: 'all' },
  { id: 'business', name: 'Business', banglaName: 'ব্যবসা ও বাণিজ্য', icon: 'business', count: 85, color: '#4F46E5', slug: 'business' },
  { id: 'supply-chain-management', name: 'Supply Chain Management', banglaName: 'সাপ্লাই চেইন ম্যানেজমেন্ট', icon: 'cube', count: 59, color: '#0284C7', slug: 'supply-chain-management' },
  { id: 'microsoft-excel-courses', name: 'Microsoft Excel', banglaName: 'মাইক্রোসফট এক্সেল', icon: 'grid', count: 47, color: '#107C41', slug: 'microsoft-excel-courses' },
  { id: 'leadership-management', name: 'Leadership & Management', banglaName: 'নেতৃত্ব ও ব্যবস্থাপনা', icon: 'people', count: 39, color: '#D97706', slug: 'leadership-management' },
  { id: 'personal-development', name: 'Personal Development', banglaName: 'ব্যক্তিগত দক্ষতা উন্নয়ন', icon: 'bulb', count: 39, color: '#EC4899', slug: 'personal-development' },
  { id: 'generative-ai', name: 'Generative AI', banglaName: 'জেনারেটিভ এআই', icon: 'sparkles', count: 38, color: '#8B5CF6', slug: 'generative-ai' },
  { id: 'finance-accounting-legal', name: 'Finance & Legal', banglaName: 'অর্থনীতি ও আইন', icon: 'cash', count: 35, color: '#059669', slug: 'finance-accounting-legal' },
  { id: 'human-resource-management', name: 'Human Resource Management', banglaName: 'মানব সম্পদ ব্যবস্থাপনা', icon: 'briefcase', count: 28, color: '#6366F1', slug: 'human-resource-management' },
  { id: 'sales-marketing', name: 'Sales & Marketing', banglaName: 'বিক্রয় ও বিপণন', icon: 'trending-up', count: 25, color: '#F59E0B', slug: 'sales-marketing' },
  { id: 'data-science', name: 'Data Science', banglaName: 'ডাটা সায়েন্স', icon: 'analytics', count: 22, color: '#06B6D4', slug: 'data-science' },
  { id: 'job-seekers-skills', name: 'Job Seekers Skills', banglaName: 'চাকরি প্রত্যাশীদের দক্ষতা', icon: 'school', count: 18, color: '#10B981', slug: 'job-seekers-skills' },
  { id: 'research-courses', name: 'Research & Academic', banglaName: 'গবেষণা ও শিক্ষায়তনিক', icon: 'book', count: 15, color: '#64748B', slug: 'research-courses' },
];

const LearningContext = createContext<LearningContextType>({} as LearningContextType);

export const LearningProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, canBypassCourseLocks } = useAuth();
  const { isOffline } = useNetwork();
  const userScope = user?.id ? `_u_${user.id}` : '_guest';

  // Pre-seed available courses from in-memory / persistent cache for 0ms instant display
  const [courses, setCourses] = useState<Course[]>(() => CoursesService.getCachedCoursesSync());
  const [totalCourseCount, setTotalCourseCount] = useState<number>(() => {
    const initial = CoursesService.getCachedCoursesSync();
    return initial && initial.length > 0 ? initial.length : 0;
  });
  const [categories, setCategories] = useState<Category[]>(() => {
    const initial = CoursesService.getCachedCategoriesSync();
    if (initial && initial.length > 0) return initial;
    return INITIAL_CANONICAL_CATEGORIES;
  });
  const [workshops, setWorkshops] = useState<Workshop[]>(WORKSHOPS);
  const [blogPosts, setBlogPosts] = useState<WpPost[]>([]);
  // Only show blocking loader if no cached courses exist at all
  const [isLoadingCourses, setIsLoadingCourses] = useState<boolean>(() => {
    return CoursesService.getCachedCoursesSync().length === 0;
  });
  const [isBackgroundSyncing, setIsBackgroundSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevOfflineRef = useRef<boolean>(isOffline);
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Clean user-scoped learning state (no hardcoded fake demo enrollments/badges on fresh install)
  const [userProgress, setUserProgress] = useState<Record<string, UserProgress>>({});
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [rsvpWorkshops, setRsvpWorkshops] = useState<string[]>([]);

  // Behavior tracking & mandatory reviews state
  const [categoryAffinities, setCategoryAffinities] = useState<Record<string, number>>({});
  const [searchKeywordsHistory, setSearchKeywordsHistory] = useState<string[]>([]);
  const [reviewedCourseIds, setReviewedCourseIds] = useState<string[]>([]);

  // Local-First Outbox Sync State
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [isSyncingOffline, setIsSyncingOffline] = useState<boolean>(false);

  // Dynamic Site Branding & Hero Banners State
  const [siteBranding, setSiteBranding] = useState<SiteBrandingInfo>(DEFAULT_SITE_BRANDING);
  const [banners, setBanners] = useState<DynamicCarouselSlide[]>(DEFAULT_CURATED_SLIDES);
  const [partnerLogos, setPartnerLogos] = useState<PartnerLogoItem[]>(DEFAULT_PARTNER_LOGOS);
  const [homeFeatures, setHomeFeatures] = useState<HomeFeatureCardItem[]>(DEFAULT_HOME_FEATURES);
  const [specialBundles, setSpecialBundles] = useState<SpecialBundlePosterItem[]>(DEFAULT_SPECIAL_BUNDLES);
  const [studentTestimonials, setStudentTestimonials] = useState<StudentTestimonialItem[]>(DEFAULT_STUDENT_TESTIMONIALS);
  const [appRemoteConfig, setAppRemoteConfig] = useState<AppRemoteConfig | null>(null);
  const [isBrandingLoading, setIsBrandingLoading] = useState<boolean>(false);

  const refreshBranding = useCallback(async (forceRefresh: boolean = false) => {
    try {
      setIsBrandingLoading(true);
      const [
        brandingInfo,
        bannerSlides,
        remoteConfig,
        partners,
        features,
        bundles,
        testimonials,
      ] = await Promise.all([
        BrandingService.getSiteBranding(forceRefresh),
        BrandingService.getDynamicBanners(forceRefresh),
        CompanionService.fetchAppConfig(forceRefresh),
        BrandingService.getPartnerLogos(forceRefresh),
        BrandingService.getHomeFeatureCards(forceRefresh),
        BrandingService.getSpecialBundles(forceRefresh),
        BrandingService.getStudentTestimonials(forceRefresh),
      ]);
      setSiteBranding(brandingInfo);
      if (bannerSlides && bannerSlides.length > 0) {
        setBanners(bannerSlides);
      }
      if (partners && partners.length > 0) {
        setPartnerLogos(partners);
      }
      if (features && features.length > 0) {
        setHomeFeatures(features);
      }
      if (bundles && bundles.length > 0) {
        setSpecialBundles(bundles);
      }
      if (testimonials && testimonials.length > 0) {
        setStudentTestimonials(testimonials);
      }
      if (remoteConfig) {
        setAppRemoteConfig(remoteConfig);
      }
    } catch (err) {
      if (Env.DEBUG_API) {
        console.warn('[LearningContext] Failed to refresh branding:', err);
      }
    } finally {
      setIsBrandingLoading(false);
    }
  }, []);

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

  // Fetch live courses, categories, workshops, and blog posts from WordPress with SWR
  const loadWordPressData = useCallback(async (forceRefresh: boolean = false, silent: boolean = false) => {
    // Only set blocking loading state if we have no cached courses in memory
    setCourses((current) => {
      if (current.length === 0 && !silent) {
        setIsLoadingCourses(true);
      } else {
        setIsBackgroundSyncing(true);
      }
      return current;
    });
    setCoursesError(null);

    try {
      const [wpCourses, wpCategories, wpWorkshops, wpPosts] = await Promise.allSettled([
        fetchWpCourses({ fetchAll: true, forceRefresh }),
        fetchWpCategories({ forceRefresh }),
        fetchWpLiveWorkshops({ forceRefresh }),
        fetchWpPosts({ perPage: 6 }),
      ]);

      if (wpCourses.status === 'fulfilled' && wpCourses.value.length > 0) {
        setCourses((prev) => (areCoursesEqual(prev, wpCourses.value) ? prev : wpCourses.value));
        setTotalCourseCount(wpCourses.value.length);
      } else if (wpCourses.status === 'rejected' && !silent) {
        setCoursesError(wpCourses.reason?.message || 'Unable to sync latest courses.');
      }

      if (wpCategories.status === 'fulfilled' && wpCategories.value.length > 0) {
        const liveCount = wpCourses.status === 'fulfilled' ? wpCourses.value.length : 0;
        const updatedCats = wpCategories.value.map((c) => {
          if (c.id === 'all') {
            return {
              ...c,
              count: Math.max(c.count, liveCount),
            };
          }
          return c;
        });
        setCategories((prev) => (areDataEqual(prev, updatedCats) ? prev : updatedCats));
      }

      if (wpWorkshops.status === 'fulfilled' && wpWorkshops.value.length > 0) {
        setWorkshops((prev) => (areDataEqual(prev, wpWorkshops.value) ? prev : wpWorkshops.value));
      } else if (!silent) {
        setWorkshops(WORKSHOPS);
      }

      if (wpPosts.status === 'fulfilled' && wpPosts.value.length > 0) {
        setBlogPosts((prev) => (areDataEqual(prev, wpPosts.value) ? prev : wpPosts.value));
      }

      setLastSyncedAt(Date.now());
    } catch (err: any) {
      if (!silent) {
        setCoursesError(err?.message || 'Unable to connect to Thriving Skills.');
      }
      if (Env.DEBUG_API) {
        console.warn('Error fetching WordPress backend data:', err);
      }
    } finally {
      if (!silent) {
        setIsLoadingCourses(false);
      } else {
        setIsBackgroundSyncing(false);
      }
    }
  }, []);

  // Hydrate scoped user learning state whenever signed-in account changes
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
        const [
          savedProgress,
          savedBookmarks,
          savedNotes,
          savedWorkshops,
          savedAffinities,
          savedSearches,
          savedReviews,
          savedCertificates,
        ] = await Promise.all([
          AsyncStorage.getItem(`${PROGRESS_STORAGE_KEY}${userScope}`),
          AsyncStorage.getItem(`${BOOKMARKS_STORAGE_KEY}${userScope}`),
          AsyncStorage.getItem(`${NOTES_STORAGE_KEY}${userScope}`),
          AsyncStorage.getItem(`${WORKSHOPS_STORAGE_KEY}${userScope}`),
          AsyncStorage.getItem(`${AFFINITIES_STORAGE_KEY}${userScope}`),
          AsyncStorage.getItem(`${SEARCH_HISTORY_STORAGE_KEY}${userScope}`),
          AsyncStorage.getItem(`${REVIEWS_STORAGE_KEY}${userScope}`),
          AsyncStorage.getItem(`${CERTIFICATES_STORAGE_KEY}${userScope}`),
        ]);

        if (!active) return;
        if (savedProgress) {
          try { setUserProgress(JSON.parse(savedProgress)); } catch {}
        }
        if (savedBookmarks) {
          try { setBookmarks(JSON.parse(savedBookmarks)); } catch {}
        }
        if (savedNotes) {
          try { setNotes(JSON.parse(savedNotes)); } catch {}
        }
        if (savedWorkshops) {
          try { setRsvpWorkshops(JSON.parse(savedWorkshops)); } catch {}
        }
        if (savedAffinities) {
          try { setCategoryAffinities(JSON.parse(savedAffinities)); } catch {}
        }
        if (savedSearches) {
          try { setSearchKeywordsHistory(JSON.parse(savedSearches)); } catch {}
        }
        if (savedReviews) {
          try { setReviewedCourseIds(JSON.parse(savedReviews)); } catch {}
        }
        if (savedCertificates) {
          try { setCertificates(JSON.parse(savedCertificates)); } catch {}
        }
      } catch {
        // Safe fallback
      }
    })();

    return () => {
      active = false;
    };
  }, [userScope]);

  // 1. Initial live catalog fetch on mount
  useEffect(() => {
    loadWordPressData(false, false);
    refreshBranding(false);
  }, [loadWordPressData, refreshBranding]);

  // 2. Real-time background sync when app comes into the foreground (AppState: active)
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        if (Env.DEBUG_API) {
          console.log('[LearningContext] App returned to active. Silently syncing with thrivingskill.com...');
        }
        loadWordPressData(true, true);
        refreshBranding(true);
      }
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      sub.remove();
    };
  }, [loadWordPressData, refreshBranding]);

  // 3. Re-synchronize when device recovers internet connectivity
  useEffect(() => {
    if (prevOfflineRef.current && !isOffline) {
      if (Env.DEBUG_API) {
        console.log('[LearningContext] Connectivity recovered. Synchronizing catalog...');
      }
      loadWordPressData(true, true);
      refreshBranding(true);
    }
    prevOfflineRef.current = isOffline;
  }, [isOffline, loadWordPressData, refreshBranding]);

  // 4. Periodic background sync heartbeat (every 90s while app is in foreground)
  // Cross-Platform Timer Hygiene: Stored in useRef and cleared on unmount
  useEffect(() => {
    heartbeatTimerRef.current = setInterval(() => {
      if (AppState.currentState === 'active' && !isOffline) {
        if (Env.DEBUG_API) {
          console.log('[LearningContext] Background heartbeat poll: checking thrivingskill.com...');
        }
        loadWordPressData(true, true);
      }
    }, 90000);

    return () => {
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }
    };
  }, [isOffline, loadWordPressData]);

  // 5. Subscribe to CoursesService live catalog updates (SWR events)
  useEffect(() => {
    const unsubscribe = CoursesService.subscribeCatalogUpdates(() => {
      if (Env.DEBUG_API) {
        console.log('[LearningContext] Received catalog update notification, revalidating state...');
      }
      loadWordPressData(false, true);
    });
    return unsubscribe;
  }, [loadWordPressData]);

  const refreshCourses = async () => {
    await Promise.all([loadWordPressData(true, false), refreshBranding(true)]);
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
      await AsyncStorage.setItem(`${key}${userScope}`, JSON.stringify(data));
    } catch {}
  };

  const enrollInCourse = (courseId: string) => {
    if (userProgress[courseId]) return;
    const course = courses.find((c) => c.id === courseId);
    const firstLessonId = course?.modules?.[0]?.lessons?.[0]?.id || `les-${courseId}-1`;
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

    // Queue enrollment mutation for offline-first sync with LearnPress
    SyncQueueManager.enqueue('ENROLL_COURSE', Endpoints.LEARNPRESS.COURSE_ENROLL, { id: courseId }).then(() => {
      SyncQueueManager.processQueue().catch(() => {});
    });
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

    // If lesson already completed, avoid redundant mutations and state updates
    if (current.completedLessonIds.includes(lessonId)) {
      return;
    }

    const newCompleted = [...current.completedLessonIds, lessonId];

    const totalLessons = course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0;
    const isCompleted = totalLessons > 0 && newCompleted.length >= totalLessons;

    const userHasReviewed = reviewedCourseIds.includes(courseId) || !!current.hasReviewed;
    let certId = current.certificateId;

    // Certificate is ONLY generated if the course is completed AND the user has submitted a review (CR-02)
    if (isCompleted && userHasReviewed && !certId) {
      const randSuffix = Math.random().toString(36).substring(2, 8).toUpperCase().padEnd(6, '0');
      certId = `TS-2026-${randSuffix}`;
      const newCert: Certificate = {
        id: `cert-${Date.now()}`,
        courseId: course.id,
        courseTitle: course.title,
        studentName: user?.displayName || user?.name || user?.username || 'Executive Graduate',
        issueDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        credentialId: certId,
        instructorName: course.instructor?.name || 'Course Instructor',
        verificationUrl: `${Env.SITE_URL}/verify/${certId}`,
      };
      setCertificates((prev) => {
        const nextCerts = [newCert, ...prev];
        saveState(CERTIFICATES_STORAGE_KEY, nextCerts);
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
        completedDate: isCompleted ? (current.completedDate || new Date().toISOString().split('T')[0]) : current.completedDate,
        certificateId: certId,
      },
    };

    setUserProgress(updated);
    saveState(PROGRESS_STORAGE_KEY, updated);

    // Queue lesson completion mutation for offline-first sync with LearnPress
    SyncQueueManager.enqueue('COMPLETE_LESSON', Endpoints.LEARNPRESS.LESSON_FINISH, { id: lessonId, course_id: courseId }).then(() => {
      SyncQueueManager.processQueue().catch(() => {});
    });
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

  const restoreNote = (note: Note) => {
    if (notes.some((n) => n.id === note.id)) return;
    const updated = [note, ...notes];
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
    if (progress.isCompleted) return 100;

    const moduleLessons = course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0;
    const totalLessons = moduleLessons > 0 ? moduleLessons : (course.lecturesCount || 0);
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

  const toggleWorkshopRsvp = (workshopId: string): boolean => {
    const exists = rsvpWorkshops.includes(workshopId);
    const updated = exists
      ? rsvpWorkshops.filter((id) => id !== workshopId)
      : [...rsvpWorkshops, workshopId];
    setRsvpWorkshops(updated);
    saveState(WORKSHOPS_STORAGE_KEY, updated);
    return !exists;
  };

  const isRsvpd = (workshopId: string) => rsvpWorkshops.includes(workshopId);

  const getCourseById = (courseId: string) => courses.find((c) => c.id === courseId);
  const getWorkshopById = (workshopId: string) => workshops.find((w) => w.id === workshopId);

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
    if (canBypassCourseLocks) return true;
    const progress = userProgress[courseId];
    if (!progress || !progress.isCompleted) return false;
    return hasReviewedCourse(courseId);
  };

  const unlockCertificateForDev = (courseId: string, studentName?: string): Certificate | null => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return null;

    const recipientName =
      studentName ||
      user?.displayName ||
      user?.name ||
      user?.username ||
      'Executive Developer';

    const current = userProgress[courseId] || {
      courseId,
      enrolledDate: new Date().toISOString().split('T')[0],
      completedLessonIds: course.modules?.flatMap((m) => m.lessons.map((l) => l.id)) || [],
      isCompleted: true,
    };

    let cert = certificates.find((c) => c.courseId === courseId);
    let certId = current.certificateId || cert?.credentialId;

    if (!certId) {
      const randSuffix = Math.random().toString(36).substring(2, 8).toUpperCase().padEnd(6, '0');
      certId = `TS-2026-${randSuffix}`;
    }

    if (!cert) {
      cert = {
        id: `cert-${Date.now()}`,
        courseId: course.id,
        courseTitle: course.title,
        studentName: recipientName,
        issueDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        credentialId: certId,
        instructorName: course.instructor?.name || 'Thriving Skills Instructor',
        verificationUrl: `${Env.SITE_URL}/verify/${certId}`,
      };
      setCertificates((prev) => {
        const nextCerts = [cert!, ...prev.filter((c) => c.courseId !== courseId)];
        saveState(CERTIFICATES_STORAGE_KEY, nextCerts);
        return nextCerts;
      });
    }

    if (!reviewedCourseIds.includes(courseId)) {
      const nextReviewed = [...reviewedCourseIds, courseId];
      setReviewedCourseIds(nextReviewed);
      saveState(REVIEWS_STORAGE_KEY, nextReviewed);
    }

    const updated = {
      ...userProgress,
      [courseId]: {
        ...current,
        completedLessonIds: course.modules?.flatMap((m) => m.lessons.map((l) => l.id)) || current.completedLessonIds,
        isCompleted: true,
        hasReviewed: true,
        certificateId: certId,
        completedDate: current.completedDate || new Date().toISOString().split('T')[0],
      },
    };
    setUserProgress(updated);
    saveState(PROGRESS_STORAGE_KEY, updated);

    return cert;
  };

  const submitMandatoryCourseReview = (
    courseId: string,
    rating: number,
    feedback: string,
    userName = 'Executive Graduate',
    userRole = 'Learner'
  ): Certificate | null => {
    // 1. Record review on course object
    addCourseReview(courseId, {
      userName,
      userAvatar: '',
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
      const randSuffix = Math.random().toString(36).substring(2, 8).toUpperCase().padEnd(6, '0');
      certId = `TS-2026-${randSuffix}`;
      cert = {
        id: `cert-${Date.now()}`,
        courseId: course.id,
        courseTitle: course.title,
        studentName: userName,
        issueDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        credentialId: certId,
        instructorName: course.instructor?.name || 'Thriving Skills Instructor',
        verificationUrl: `${Env.SITE_URL}/verify/${certId}`,
      };
      setCertificates((prev) => {
        const nextCerts = [cert!, ...prev];
        saveState(CERTIFICATES_STORAGE_KEY, nextCerts);
        return nextCerts;
      });
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

    let rationale = '✨ Gemini Nano Recommendation: Curated for executive skill acceleration';
    let rationaleBn = '✨ অন-ডিভাইস জেমিনাই ন্যানো সুপারিশ: পেশাগত দক্ষতা বৃদ্ধির জন্য বিশেষভাবে নির্বাচিত';

    if (topCatObj && topScore > 2) {
      rationale = `✨ Gemini Nano Match: Tailored for your interest in ${topCatObj.name}`;
      rationaleBn = `✨ অন-ডিভাইস জেমিনাই ন্যানো সুপারিশ: আপনার "${topCatObj.banglaName || topCatObj.name}" বিষয়ক সক্রিয় আগ্রহের ভিত্তিতে প্রস্তাবিত`;
    }

    return { courses: recommended, rationale, rationaleBn };
  };

  const hasActiveLiveWorkshop = workshops.some((w) => !!w.isLive);

  return (
    <LearningContext.Provider
      value={{
        courses,
        totalCourseCount,
        categories,
        workshops,
        hasActiveLiveWorkshop,
        blogPosts,
        isLoadingCourses,
        coursesError,
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
        submitMandatoryCourseReview,
        pendingSyncCount,
        isSyncingOffline,
        syncOfflineData,
        siteBranding,
        banners,
        partnerLogos,
        homeFeatures,
        specialBundles,
        studentTestimonials,
        appRemoteConfig,
        isBrandingLoading,
        refreshBranding,
        lastSyncedAt,
        isBackgroundSyncing,
      }}
    >
      {children}
    </LearningContext.Provider>
  );
};

export const useLearning = () => useContext(LearningContext);
