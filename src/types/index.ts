export type CategoryId =
  | 'all'
  | 'ai-tech'
  | 'finance'
  | 'leadership'
  | 'hr'
  | 'marketing'
  | 'supply-chain'
  | 'productivity';

export interface Category {
  id: CategoryId;
  name: string;
  icon: string;
  count: number;
  color: string;
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
  price: number;
  originalPrice: number;
  thumbnail: string;
  previewVideoUrl?: string;
  badge?: 'Bestseller' | 'Trending' | 'New' | 'Top Rated' | 'Corporate Pick';
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
}

export type RootTab = 'Home' | 'Courses' | 'MyLearning' | 'Workshops' | 'Profile';

export type ActiveScreen =
  | { name: 'MainTabs'; tab: RootTab }
  | { name: 'CourseDetail'; courseId: string }
  | { name: 'LessonPlayer'; courseId: string; lessonId: string }
  | { name: 'CorporateSolutions' }
  | { name: 'CertificateView'; certificateId: string };
