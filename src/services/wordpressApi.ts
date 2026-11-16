import { Course, CourseModule, Lesson, Category, WpUser, WpPost, CategoryId, Workshop } from '../types';
import { Env } from '../config/env';
import { CoursesService } from './api/coursesService';
import { PostsService } from './api/postsService';
import { AuthService } from './api/authService';

/**
 * Base WordPress REST API URL dynamically retrieved from environment configuration
 */
export const WP_BASE_URL = Env.API_URL;

// Re-export transformers from dedicated module to prevent require cycles
export {
  cleanHtml,
  parseBdtPrice,
  CATEGORY_COLOR_MAP,
  getCategoryTheme,
  transformWpCourse,
} from './api/transformers';

// ----------------------------------------------------------------------------
// High-Level Service Functions (Bridged to domain services)
// ----------------------------------------------------------------------------

/**
 * Fetch courses using CoursesService
 */
export async function fetchWpCourses(params?: {
  page?: number;
  perPage?: number;
  search?: string;
  categorySlug?: string;
  forceRefresh?: boolean;
  fetchAll?: boolean;
}): Promise<Course[]> {
  if (params?.fetchAll) {
    return CoursesService.getAllCourses(params.forceRefresh);
  }
  return CoursesService.getCourses({
    page: params?.page,
    perPage: params?.perPage,
    search: params?.search,
    category: params?.categorySlug,
    forceRefresh: params?.forceRefresh,
    fetchAll: params?.fetchAll,
  });
}

/**
 * Fetch course detail by ID using CoursesService
 */
export async function fetchWpCourseDetail(courseId: string | number, forceRefresh: boolean = false): Promise<Course> {
  return CoursesService.getCourseDetail(courseId, forceRefresh);
}

/**
 * Fetch categories using CoursesService
 */
export async function fetchWpCategories(params?: { forceRefresh?: boolean }): Promise<Category[]> {
  return CoursesService.getCategories(params?.forceRefresh);
}

/**
 * Fetch authentic live workshops and masterclasses using CoursesService
 */
export async function fetchWpLiveWorkshops(params?: { forceRefresh?: boolean }): Promise<Workshop[]> {
  return CoursesService.getLiveWorkshops(params?.forceRefresh);
}

/**
 * Fetch blog posts using PostsService
 */
export async function fetchWpPosts(params?: { page?: number; perPage?: number }): Promise<WpPost[]> {
  return PostsService.getPosts(params);
}

/**
 * CR-04: Log in user using Native LearnPress JWT Authentication
 */
export async function loginWpUser(username: string, password: string): Promise<WpUser> {
  return AuthService.login(username, password);
}

/**
 * CR-04: Register student account directly in WordPress / LearnPress
 */
export async function registerWpUser(userData: {
  username: string;
  email: string;
  password: string;
  confirm_password?: string;
  phone?: string;
}): Promise<any> {
  return AuthService.register(userData);
}

/**
 * CR-04: Validate JWT token using AuthService
 */
export async function validateWpToken(token: string): Promise<boolean> {
  return AuthService.validateToken(token);
}

/**
 * Optional helper: Send SMS OTP to phone number
 */
export async function sendWpPhoneOtp(phone: string): Promise<{ success: boolean; message: string; testOtp?: string }> {
  return AuthService.sendPhoneOtp(phone);
}

/**
 * Optional helper: Verify SMS OTP and login/register user
 */
export async function verifyWpPhoneOtp(phone: string, otp: string, fullName?: string): Promise<WpUser> {
  return AuthService.verifyPhoneOtp(phone, otp, fullName);
}

/**
 * Confirm password reset via WordPress action=resetpass
 */
export async function confirmWpPasswordReset(login: string, key: string, newPassword: string): Promise<boolean> {
  return AuthService.confirmPasswordReset(login, key, newPassword);
}
