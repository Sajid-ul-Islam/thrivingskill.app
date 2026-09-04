import { Course, CourseModule, Lesson, Category, WpUser, WpPost, CategoryId } from '../types';
import { COURSES as FALLBACK_COURSES, CATEGORIES as INITIAL_CATEGORIES } from '../data/mockData';
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
}): Promise<Course[]> {
  return CoursesService.getCourses({
    page: params?.page,
    perPage: params?.perPage,
    search: params?.search,
    category: params?.categorySlug,
  });
}

/**
 * Fetch course detail by ID using CoursesService
 */
export async function fetchWpCourseDetail(courseId: string | number): Promise<Course> {
  return CoursesService.getCourseDetail(courseId);
}

/**
 * Fetch categories using CoursesService
 */
export async function fetchWpCategories(): Promise<Category[]> {
  return CoursesService.getCategories();
}

/**
 * Fetch blog posts using PostsService
 */
export async function fetchWpPosts(params?: { page?: number; perPage?: number }): Promise<WpPost[]> {
  return PostsService.getPosts(params);
}

/**
 * Log in user using AuthService
 */
export async function loginWpUser(username: string, password: string): Promise<WpUser> {
  return AuthService.login(username, password);
}

/**
 * Validate JWT token using AuthService
 */
export async function validateWpToken(token: string): Promise<boolean> {
  return AuthService.validateToken(token);
}
