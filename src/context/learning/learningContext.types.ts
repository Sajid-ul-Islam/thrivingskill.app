import {
  Course,
  UserProgress,
  Certificate,
  Note,
  CategoryId,
  Workshop,
  Category,
  WpPost,
  Review,
} from '../../types';
import {
  SiteBrandingInfo,
  DynamicCarouselSlide,
  PartnerLogoItem,
  HomeFeatureCardItem,
  SpecialBundlePosterItem,
  StudentTestimonialItem,
} from '../../services/api/brandingService';
import { AppRemoteConfig } from '../../services/api/companionService';

export interface LearningContextType {
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
  confirmServerEnrollments: (courseIds: string[]) => void;
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
  ) => Promise<Certificate | null>;

  // Local-First Outbox Sync (Phase 1)
  pendingSyncCount: number;
  isSyncingOffline: boolean;
  syncOfflineData: (
    force?: boolean
  ) => Promise<{ processed: number; succeeded: number; failed: number }>;

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
