/**
 * Central API Endpoints Registry
 * Defines all route paths for WordPress Core, LearnPress, and WooCommerce.
 */

export const Endpoints = {
  // --------------------------------------------------------------------------
  // LearnPress v1 Endpoints (LMS Courses, Lessons, Quizzes, Auth)
  // --------------------------------------------------------------------------
  LEARNPRESS: {
    // Authentication & JWT
    TOKEN: '/learnpress/v1/token',
    TOKEN_VALIDATE: '/learnpress/v1/token/validate',
    TOKEN_REGISTER: '/learnpress/v1/token/register',

    // Courses
    COURSES: '/learnpress/v1/courses',
    COURSE_DETAIL: (id: string | number) => `/learnpress/v1/courses/${id}`,
    COURSE_ENROLL: '/learnpress/v1/courses/enroll',
    COURSE_FINISH: '/learnpress/v1/courses/finish',
    COURSE_RETAKE: '/learnpress/v1/courses/retake',
    COURSE_CATEGORIES: '/learnpress/v1/course_category',
    COURSE_CATEGORY_DETAIL: (id: string | number) => `/learnpress/v1/course_category/${id}`,
    SECTIONS_BY_COURSE: (courseId: string | number) =>
      `/learnpress/v1/sections/sections-by-course-id/${courseId}`,
    SECTION_ITEMS: (sectionId: string | number) =>
      `/learnpress/v1/section-items/items/${sectionId}`,

    // Lessons
    LESSONS: '/learnpress/v1/lessons',
    LESSON_DETAIL: (id: string | number) => `/learnpress/v1/lessons/${id}`,
    LESSON_FINISH: '/learnpress/v1/lessons/finish',

    // Quizzes & Questions
    QUIZZES: '/learnpress/v1/quiz',
    QUIZ_DETAIL: (id: string | number) => `/learnpress/v1/quiz/${id}`,
    QUIZ_START: '/learnpress/v1/quiz/start',
    QUIZ_FINISH: '/learnpress/v1/quiz/finish',
    QUIZ_CHECK_ANSWER: '/learnpress/v1/quiz/check_answer',
    QUESTIONS: '/learnpress/v1/questions',

    // User Progress & Profile
    USERS: '/learnpress/v1/users',
    USER_DETAIL: (id: string | number) => `/learnpress/v1/users/${id}`,
    USER_CHANGE_PASSWORD: '/learnpress/v1/users/change-password',
    USER_RESET_PASSWORD: '/learnpress/v1/users/reset-password',
    USER_DELETE: '/learnpress/v1/users/delete',
  },

  // --------------------------------------------------------------------------
  // WordPress Core v2 Endpoints
  // --------------------------------------------------------------------------
  WORDPRESS: {
    POSTS: '/wp/v2/posts',
    POST_DETAIL: (id: string | number) => `/wp/v2/posts/${id}`,
    CATEGORIES: '/wp/v2/categories',
    COURSE_CATEGORIES: '/wp/v2/course_category',
    TAGS: '/wp/v2/tags',
    PAGES: '/wp/v2/pages',
    MEDIA: '/wp/v2/media',
    MEDIA_DETAIL: (id: string | number) => `/wp/v2/media/${id}`,
    CURRENT_USER: '/wp/v2/users/me',
  },

  // --------------------------------------------------------------------------
  // WooCommerce Store Endpoints (Optional for commerce/purchases)
  // --------------------------------------------------------------------------
  WOOCOMMERCE: {
    PRODUCTS: '/wc/store/v1/products',
    PRODUCT_DETAIL: (id: string | number) => `/wc/store/v1/products/${id}`,
    CATEGORIES: '/wc/store/v1/products/categories',
    CART: '/wc/store/v1/cart',
    CHECKOUT: '/wc/store/v1/checkout',
  },

  // --------------------------------------------------------------------------
  // Thriving Skills Mobile Bridge (Companion Plugin Endpoints)
  // --------------------------------------------------------------------------
  COMPANION: {
    CONFIG: '/thrivingskill/v1/config',
    FEED: '/thrivingskill/v1/feed',
    LESSON_DETAIL: (id: string | number) => `/thrivingskill/v1/lessons/${id}`,
    REGISTER_PUSH_TOKEN: '/thrivingskill/v1/register-push-token',
    REGISTER: '/thrivingskill/v1/register',
    VERIFY_REGISTRATION: '/thrivingskill/v1/verify-registration',
  },

  // --------------------------------------------------------------------------
  // Thriving Skills OTP Authentication Routes
  // --------------------------------------------------------------------------
  TSL: {
    SEND_OTP: '/tsl/v1/auth/send-otp',
    VERIFY_OTP: '/tsl/v1/auth/verify-otp',
  },
} as const;
