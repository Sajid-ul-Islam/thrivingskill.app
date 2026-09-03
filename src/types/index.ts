export type CategoryId =
  | 'all'
  | 'generative-ai'
  | 'excel-data'
  | 'finance'
  | 'leadership'
  | 'hr'
  | 'marketing'
  | 'supply-chain'
  | 'research'
  | 'career-track'
  | (string & {});

export interface Category {
  id: CategoryId;
  name: string;
  banglaName?: string;
  icon: string;
  count: number;
  color: string;
  slug?: string;
}

export interface WpUser {
  id: number | string;
  username: string;
  email: string;
  displayName: string;
  avatar?: string;
  token?: string;
  roles?: string[];
}

export interface WpPost {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  link: string;
  authorName: string;
  featuredImageUrl?: string;
  categories: string[];
}

export interface Instructor {
  id: string;
  name: string;
  title: string;
  company: string;
  avatar: string;
  bio: string;
  rating: number;
  studentsCount: number;
  coursesCount: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface Lesson {
  id: string;
  title: string;
  duration: string; // e.g. "12:45"
  videoUrl?: string;
  isFreePreview?: boolean;
  summary?: string;
  quiz?: QuizQuestion[];
  resources?: { name: string; size: string; type: string }[];
}

export interface CourseModule {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Review {
  id: string;
  userName: string;
  userAvatar: string;
  rating: number;
  date: string;
  comment: string;
  userRole: string;
  company?: string;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  subtitle: string;
  category: CategoryId;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  rating: number;
  reviewsCount: number;
  enrolledCount: number;
  price: number; // in USD
  priceBdt?: number; // in BDT (e.g. 1500)
  originalPrice: number;
  originalPriceBdt?: number;
  thumbnail: string;
  previewVideoUrl?: string;
  badge?: 'Bestseller' | 'Trending' | 'New' | 'Top Rated' | 'Corporate Pick' | 'Special Bundle';
  durationHours: number;
  lecturesCount: number;
  certificateIncluded: boolean;
  language: string;
  lastUpdated: string;
  instructor: Instructor;
  highlights: string[];
  description: string;
  prerequisites: string[];
  modules: CourseModule[];
  reviews: Review[];
  isProExclusive?: boolean;
  skillTrack?: string;
  isCareerBundle?: boolean;
}

export interface SpecialBundle {
  id: string;
  title: string;
  banglaTitle: string;
  subtitle: string;
  category: CategoryId;
  coursesIncludedCount: number;
  durationHours: number;
  priceBdt: number;
  originalPriceBdt: number;
  priceUsd: number;
  originalPriceUsd: number;
  thumbnail: string;
  features: string[];
  rating: number;
  enrolledCount: number;
}

export interface SkillsSummit {
  id: string;
  title: string;
  theme: string;
  date: string;
  status: 'Upcoming' | 'Live' | 'Concluded';
  attendeesCount: string;
  keynoteSpeakers: string[];
  bannerImage: string;
  description: string;
  registrationUrl?: string;
}

export interface Workshop {
  id: string;
  title: string;
  description: string;
  speaker: Instructor;
  date: string;
  time: string;
  duration: string;
  seatsLeft: number;
  totalSeats: number;
  isLive?: boolean;
  category: CategoryId;
  thumbnail: string;
  price: number;
  priceBdt?: number;
  isProFree?: boolean;
}

export interface Certificate {
  id: string;
  courseId: string;
  courseTitle: string;
  studentName: string;
  issueDate: string;
  credentialId: string;
  instructorName: string;
  verificationUrl: string;
  skillsEarned?: string[];
}

export interface Note {
  id: string;
  courseId: string;
  lessonId: string;
  timestamp: string;
  text: string;
  createdAt: string;
}

export interface UserProgress {
  courseId: string;
  enrolledDate: string;
  completedLessonIds: string[];
  lastAccessedLessonId?: string;
  isCompleted: boolean;
  completedDate?: string;
  certificateId?: string;
  assignedByManager?: boolean;
  dueDate?: string;
}

// -------------------------------------------------------------
// SaaS Specific Types
// -------------------------------------------------------------

export type SubscriptionTier = 'starter' | 'pro' | 'enterprise';
export type BillingInterval = 'monthly' | 'annual';

export interface PlanFeature {
  id: string;
  title: string;
  starter: boolean | string;
  pro: boolean | string;
  enterprise: boolean | string;
}

export interface Workspace {
  id: string;
  name: string;
  type: 'personal' | 'enterprise';
  role: 'learner' | 'manager' | 'admin';
  companyName?: string;
  logo?: string;
  activeSeats?: number;
  totalSeats?: number;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  avatar: string;
  assignedCourseIds: string[];
  completedCoursesCount: number;
  progressPercent: number;
  lastActive: string;
  skillsMastered: string[];
}

export interface SaaSNotification {
  id: string;
  title: string;
  message: string;
  type: 'assignment' | 'workshop' | 'certificate' | 'system' | 'ai';
  timestamp: string;
  isRead: boolean;
  actionRoute?: { tab: RootTab; courseId?: string };
}

export interface CopilotMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedActions?: string[];
  codeSnippet?: string;
}

export interface SkillAssessmentQuestion {
  id: string;
  domain: string;
  question: string;
  options: { text: string; points: number }[];
}

export interface SkillAssessmentResult {
  completedAt: string;
  overallScore: number;
  domainScores: { domain: string; score: number; maxScore: number }[];
  levelName: string;
  recommendedCourseIds: string[];
  keyInsight: string;
}

export type RootTab = 'Home' | 'Courses' | 'Copilot' | 'MyLearning' | 'TeamHub' | 'Workshops' | 'Profile';

export type ActiveScreen =
  | { name: 'MainTabs'; tab: RootTab }
  | { name: 'CourseDetail'; courseId: string }
  | { name: 'LessonPlayer'; courseId: string; lessonId: string }
  | { name: 'CorporateSolutions' }
  | { name: 'CertificateView'; certificateId: string }
  | { name: 'SkillAssessment' };
