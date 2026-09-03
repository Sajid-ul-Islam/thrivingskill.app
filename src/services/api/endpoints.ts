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
  },

  // --------------------------------------------------------------------------
  // WordPress Core v2 Endpoints
  // --------------------------------------------------------------------------
  WORDPRESS: {
    POSTS: '/wp/v2/posts',
    POST_DETAIL: (id: string | number) => `/wp/v2/posts/${id}`,
    CATEGORIES: '/wp/v2/categories',
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
} as const;
