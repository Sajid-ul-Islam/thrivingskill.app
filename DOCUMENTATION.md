# Thriving Skills Mobile App — Comprehensive Technical Documentation

Welcome to the technical documentation for the **Thriving Skills** frontend Android & cross-platform React Native (Expo) mobile application, integrated with the live **WordPress** & **LearnPress LMS** backend ([thrivingskill.com](https://thrivingskill.com/)).

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Technology Stack](#2-technology-stack)
3. [Environment Configuration (.env)](#3-environment-configuration-env)
4. [Backend API Integration Layer](#4-backend-api-integration-layer)
   - [REST API Endpoints](#rest-api-endpoints)
   - [HttpClient & Error Handling](#httpclient--error-handling)
   - [Two-Tier Cache Manager](#two-tier-cache-manager)
   - [Domain Services](#domain-services)
5. [State Management & Contexts](#5-state-management--contexts)
6. [Screens & Navigation Flow](#6-screens--navigation-flow)
7. [Offline Strategy & Data Resilience](#7-offline-strategy--data-resilience)
8. [Setup, Execution & Build Instructions](#8-setup-execution--build-instructions)
9. [Android & EAS Build Configuration](#9-android--eas-build-configuration)

---

## 1. System Architecture

The application follows a clean layered architecture that separates presentation, state management, domain services, caching, and network communications:

```mermaid
graph TD
    subgraph UI Layer
        A[Screens: Home, Courses, Detail, Lesson, Profile]
        B[Modals: AuthModal, Subscription, Notifications, Assessment]
    end

    subgraph State Management
        C[AuthContext]
        D[LearningContext]
        E[SaaSContext]
        F[ThemeContext]
    end

    subgraph Domain API Layer
        G[Api Facade]
        H[CoursesService]
        I[AuthService]
        J[LessonsService]
        K[PostsService]
        L[UserService]
    end

    subgraph Network & Infrastructure
        M[HttpClient - AbortController, Retries, Bearer Auth]
        N[Endpoints Registry]
        O[CacheManager - Memory + AsyncStorage with TTL]
        P[Env Config - EXPO_PUBLIC_*]
    end

    subgraph Backend Services
        Q[WordPress REST API v2]
        R[LearnPress LMS REST API v1]
        S[WooCommerce Store API]
    end

    UI Layer --> State Management
    State Management --> Domain API Layer
    Domain API Layer --> Network & Infrastructure
    Network & Infrastructure --> Backend Services
    O <--> State Management
```

### Architectural Principles:
1. **Separation of Concerns**: UI components do not call `fetch` directly; they consume Context hooks (`useLearning`, `useAuth`), which invoke typed domain services (`Api.courses`, `Api.auth`).
2. **Offline-First Resilience**: Stale-while-revalidate caching ensures immediate screen rendering upon launch, while background sync updates data seamlessly.
3. **Fail-Safe Fallbacks**: If the backend is temporarily unreachable, catalog seed data protects the user experience from blank screens.
4. **Environment Isolation**: API endpoints, timeouts, and cache rules are governed by configuration variables (`EXPO_PUBLIC_*`) rather than hardcoded URLs.

---

## 2. Technology Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Framework** | [React Native](https://reactnative.dev/) | Version 0.74.5 |
| **Runtime & Tooling** | [Expo SDK 51](https://expo.dev/) | Managed workflow (`~51.0.38`) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Strict mode (`~5.3.3`) |
| **Local Storage** | [`@react-native-async-storage/async-storage`](https://github.com/react-native-async-storage/async-storage) | Persistent cache & auth tokens |
| **Icons & Visuals** | [`@expo/vector-icons`](https://docs.expo.dev/guides/icons/) | Ionicons, Linear Gradients, SVG |
| **Safe Areas** | [`react-native-safe-area-context`](https://github.com/th3rdwave/react-native-safe-area-context) | Notch & bottom bar insets |
| **Styling** | Vanilla React Native `StyleSheet` | Dynamic design tokens for Light & Dark mode |
| **Backend** | WordPress Core + LearnPress LMS | Hosted on `https://thrivingskill.com/` |

---

## 3. Environment Configuration (.env)

The app utilizes Expo's native environment variable mechanism (`EXPO_PUBLIC_*` prefix).

### Configuration Files
- **Template**: [`.env.example`](file:///h:/Repo/thrivingskill.app/.env.example)
- **Active Env**: `.env` or `.env.local` (ignored by git for security)
- **Accessor Module**: [`src/config/env.ts`](file:///h:/Repo/thrivingskill.app/src/config/env.ts)
- **Type Definitions**: [`src/types/env.d.ts`](file:///h:/Repo/thrivingskill.app/src/types/env.d.ts)

### Supported Variables:

| Variable | Type | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `EXPO_PUBLIC_API_URL` | `string` | `https://thrivingskill.com/wp-json` | Base URL for WordPress REST API |
| `EXPO_PUBLIC_SITE_URL` | `string` | `https://thrivingskill.com` | Base website URL |
| `EXPO_PUBLIC_REQUEST_TIMEOUT_MS` | `number` | `15000` (15s) | Request timeout before cancellation |
| `EXPO_PUBLIC_MAX_RETRIES` | `number` | `2` | Max automatic retries for failed requests |
| `EXPO_PUBLIC_CACHE_TTL_MS` | `number` | `300000` (5 mins) | Time-to-Live for cached catalog items |
| `EXPO_PUBLIC_ENABLE_FALLBACK` | `boolean` | `true` | Enable local seed fallback on network failure |
| `EXPO_PUBLIC_DEBUG_API` | `boolean` | `false` (or `__DEV__`) | Output request/response logs in console |
| `EXPO_PUBLIC_WC_CONSUMER_KEY` | `string` | `undefined` | Optional WooCommerce consumer key |
| `EXPO_PUBLIC_WC_CONSUMER_SECRET` | `string` | `undefined` | Optional WooCommerce consumer secret |

---

## 4. Backend API Integration Layer

### REST API Endpoints

All routes are declared in [`src/services/api/endpoints.ts`](file:///h:/Repo/thrivingskill.app/src/services/api/endpoints.ts):

#### LearnPress LMS (`/learnpress/v1`)
- `POST /learnpress/v1/token`: JWT login with WordPress username/password.
- `POST /learnpress/v1/token/validate`: Validates current Bearer token.
- `POST /learnpress/v1/token/register`: Student registration.
- `GET /learnpress/v1/courses`: Course catalog with pagination, search, and category filters.
- `GET /learnpress/v1/courses/:id`: Complete course curriculum with modules, lessons, duration, and preview flags.
- `POST /learnpress/v1/courses/enroll`: Enrolls user into a course.
- `GET /learnpress/v1/course_category`: Active course categories with course counts.
- `GET /learnpress/v1/lessons/:id`: Lesson content and media.
- `POST /learnpress/v1/lessons/finish`: Marks lesson as completed.

#### WordPress Core (`/wp/v2`)
- `GET /wp/v2/posts?_embed`: Blog posts, articles, and career guides with featured media and author metadata.
- `GET /wp/v2/users/me`: Current WordPress user profile.

---

### HttpClient & Error Handling

Located at [`src/services/api/httpClient.ts`](file:///h:/Repo/thrivingskill.app/src/services/api/httpClient.ts):
- **AbortController Integration**: Enforces request timeout to prevent hanging connections.
- **Bearer Token Injection**: Automatically pulls JWT token from `AsyncStorage` / memory and attaches `Authorization: Bearer <token>`.
- **Exponential Backoff Retries**: Idempotent `GET` requests automatically retry up to `MAX_RETRIES` upon network drop.
- **Error Sanitization**: Normalizes WordPress HTML-tagged error responses (e.g., `<strong>Error:</strong> ...`) into clean user messages.

```typescript
// Example custom error structure
export class ApiError extends Error {
  status: number;
  code?: string;
  data?: any;
}
```

---

### Two-Tier Cache Manager

Located at [`src/services/cache/cacheManager.ts`](file:///h:/Repo/thrivingskill.app/src/services/cache/cacheManager.ts):
1. **Tier 1 (Memory Cache)**: Fast in-memory `Map` for immediate synchronous reads during the current app session.
2. **Tier 2 (Disk Cache)**: Persistent storage in `@react-native-async-storage/async-storage` prefixed with `@ts_cache_*`.
3. **Stale-While-Revalidate**: If an item is older than its TTL, stale data can be returned immediately to prevent UI blocking while a fresh network fetch occurs.

---

### Domain Services

Located in `src/services/api/`:
- **`CoursesService`**: Catalog queries, detail fetching, categories, course enrollment.
- **`AuthService`**: JWT authentication, validation, password resets.
- **`LessonsService`**: Lesson retrieval, lesson progress, quiz attempts.
- **`PostsService`**: WordPress articles and news feeds.
- **`UserService`**: Authenticated profile, enrolled courses, certificate tracking.
- **`Api` Facade** (`src/services/api/index.ts`): Unified entry point.

```typescript
import { Api } from './src/services/api';

// Fetch courses
const courses = await Api.courses.getCourses({ page: 1, perPage: 20 });

// Fetch course detail with chapters & lessons
const detail = await Api.courses.getCourseDetail(86355);

// Authenticate user
const user = await Api.auth.login('alex', 'password123');
```

---

## 5. State Management & Contexts

The application utilizes 4 React Context providers defined in `src/context/`:

```
App.tsx
  └── SafeAreaProvider
       └── ThemeProvider
            └── AuthProvider
                 └── SaaSProvider
                      └── LearningProvider
                           └── MainAppContent
```

1. **`AuthProvider`** ([`src/context/AuthContext.tsx`](file:///h:/Repo/thrivingskill.app/src/context/AuthContext.tsx)):
   - Manages user login state, JWT session, and guest mode.
   - Restores session on app cold start and validates token in background.
   - Provides `login()`, `logout()`, `continueAsGuest()`.

2. **`LearningContext`** ([`src/context/LearningContext.tsx`](file:///h:/Repo/thrivingskill.app/src/context/LearningContext.tsx)):
   - Synchronizes courses, categories, and articles with the WordPress backend.
   - Manages user enrollments, completed lessons, notes, and certificates.
   - Persists user progress locally with `@thriving_skill_progress`.

3. **`SaaSContext`** ([`src/context/SaaSContext.tsx`](file:///h:/Repo/thrivingskill.app/src/context/SaaSContext.tsx)):
   - Handles multi-tier subscriptions (Starter, Pro, Enterprise).
   - Manages multi-tenant enterprise team hub, seats allocation, and notifications.

4. **`ThemeContext`** ([`src/context/ThemeContext.tsx`](file:///h:/Repo/thrivingskill.app/src/context/ThemeContext.tsx)):
   - Manages sleek Light and Dark mode color palettes defined in [`src/theme/colors.ts`](file:///h:/Repo/thrivingskill.app/src/theme/colors.ts).

---

## 6. Screens & Navigation Flow

### Primary Tabs:
- **Home (`HomeScreen.tsx`)**:
  - Hero banner with Thriving Skills slogan (*"Empowering People, Building a Skilled Nation"*).
  - Dynamic category pills loaded live from `/learnpress/v1/course_category`.
  - Live courses list with pricing in Bangladeshi Taka (`৳` BDT).
  - Live WordPress editorial articles carousel.
  - Pull-to-refresh synchronization.
- **Explore (`CoursesScreen.tsx`)**:
  - Full catalog filtering, category tabs, and real-time search with debounce.
  - Sorting by Popularity, Rating, Price: Low to High, Price: High to Low.
- **AI Copilot (`SkillCopilotScreen.tsx`)**:
  - AI learning assistant providing prompts, course recommendations, and career roadmaps.
- **My Hub (`MyLearningScreen.tsx`)**:
  - Enrolled courses tracker, active lessons in progress, and earned certificates.
- **Live / Workshops (`WorkshopsScreen.tsx`)**:
  - Interactive live webinar sessions, registration RSVPs, and summit events.
- **Profile (`ProfileScreen.tsx`)**:
  - WordPress user info display (`username`, `email`, connected status).
  - Login / Logout triggers invoking [`AuthModal.tsx`](file:///h:/Repo/thrivingskill.app/src/components/AuthModal.tsx).

### Stack Screens:
- **Course Detail (`CourseDetailScreen.tsx`)**:
  - Loads live curriculum chapters, duration, instructor profile, and BDT pricing.
  - Sticky bottom action bar with enrollment button.
- **Lesson Player (`LessonPlayerScreen.tsx`)**:
  - Video preview, curriculum navigation drawer, interactive lesson completion, and notes.

---

## 7. Offline Strategy & Data Resilience

1. **Initial Startup**:
   - The app immediately attempts to load cached data from `AsyncStorage`.
   - If no cache is present, verified seed data is loaded instantly, guaranteeing a fast First Contentful Paint (FCP).
2. **Background Sync**:
   - The app fetches the latest course catalog and categories from the WordPress backend asynchronously.
   - Upon successful fetch, cache is refreshed transparently without flashing the UI.
3. **Offline Actions**:
   - Lesson progress, notes, bookmarks, and certifications are stored locally in `AsyncStorage` and can be synced once connectivity resumes.

---

## 8. Setup, Execution & Build Instructions

### Prerequisites
- Node.js 18.x or 20.x+
- npm or yarn
- Expo Go app on your physical device (iOS or Android), or an emulator.

### 1. Installation
```bash
npm install
```

### 2. Environment Setup (Optional)
```bash
cp .env.example .env
# Edit .env if you wish to point to a staging or alternate WordPress endpoint
```

### 3. Running Locally with Expo Dev Server
```bash
# Start development server
npx expo start

# Press 'a' in terminal to open Android emulator
# Press 'i' in terminal to open iOS simulator
# Press 'w' in terminal to open in web browser
```

### 4. Testing with Expo Go
1. Start Metro via `npx expo start`.
2. Open **Expo Go** on your Android phone.
3. Scan the QR code in the terminal or enter the URL `exp://<YOUR-LOCAL-IP>:8081`.

---

## 9. Android & EAS Build Configuration

### Android Native Settings ([`app.json`](file:///h:/Repo/thrivingskill.app/app.json))
- **Package Name**: `com.thrivingskill.app`
- **Permissions**: `INTERNET`, `ACCESS_NETWORK_STATE`
- **Adaptive Icons & Splash**: Configured in `./assets/` with brand background `#E6F4FE`.

### EAS Build ([`eas.json`](file:///h:/Repo/thrivingskill.app/eas.json))
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {}
  }
}
```

To build a standalone Android APK:
```bash
# Install EAS CLI
npm install -g eas-cli

# Build preview standalone APK for direct installation
eas build -p android --profile preview
```
