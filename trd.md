# Technical Requirements Document (TRD)
## Thriving Skills Mobile Learning Application

**Project Name**: Thriving Skills Executive Mobile Learning Application  
**Runtime**: React Native 0.76.7 / Expo SDK 52 / React 18.3.1  
**Language**: TypeScript 5.3.3 (Strict Mode)  
**Backend**: WordPress Core REST API v2 + LearnPress LMS REST API v1  
**Document Version**: 1.4.0  
**Status**: Implemented & Verified (0 TypeScript Errors)  

---

## 1. System Architecture Overview

The Thriving Skills mobile app follows a clean, modular, layered architecture designed for extreme offline resilience, high rendering performance, and bidirectional WordPress/LearnPress synchronization.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER (UI)                         │
│  Screens: Home, Explore, My Learning, Lesson Player, Profile, Copilot  │
│  Components: CourseCard, VideoPlayer, PaymentModal, ReviewModal, etc. │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ consumes
┌───────────────────────────────────▼────────────────────────────────────┐
│                       APPLICATION STATE CONTEXTS                       │
│  AuthContext │ LearningContext │ GamificationContext │ LanguageContext │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ calls
┌───────────────────────────────────▼────────────────────────────────────┐
│                          DOMAIN SERVICES LAYER                         │
│   courseService   │   authService   │   paymentService   │   blogService   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ uses
┌───────────────────────────────────▼────────────────────────────────────┐
│                    NETWORK & PERSISTENCE INFRASTRUCTURE                 │
│    httpClient (Retries, Timeout, AbortController, Error Formatter)     │
│    CacheManager (L1 In-Memory + L2 Persistent AsyncStorage, TTL)      │
│    OfflineManager (Asset Download, Progress Sync Queue)                │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS / REST
┌───────────────────────────────────▼────────────────────────────────────┐
│                      WORDPRESS / LEARNPRESS BACKEND                    │
│    LearnPress v1 Endpoints  │  WordPress v2 Endpoints  │  bKash/Nagad   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack & Key Dependencies

| Dependency | Version | Purpose |
| :--- | :--- | :--- |
| `react-native` | `0.76.7` | Cross-platform native runtime |
| `expo` | `~52.0.37` | Mobile tooling framework & native modules |
| `typescript` | `^5.3.3` | Static typing & interface definitions |
| `@react-navigation/native` | `^7.0.14` | Core navigation container |
| `@react-navigation/bottom-tabs` | `^7.2.0` | Primary app navigation bar |
| `expo-av` | `~15.0.2` | Native high-performance video streaming & playback |
| `react-native-svg` | `15.8.0` | Vector rendering for analytics charts & badges |
| `@react-native-async-storage/async-storage` | `1.23.1` | Local persistent storage |
| `lucide-react-native` | `^0.475.0` | Clean vector iconography |

---

## 3. State Management & Context Model

The application isolates concerns into six (6) React Context Providers:

1. **`AuthContext`** (`src/context/AuthContext.tsx`):
   - Manages JWT token lifecycle, active `WpUser`, login/registration/logout, and profile sync.
   - Fallback authentication mechanisms (Email/Password & Mobile OTP) without third-party OAuth lock-ins.
2. **`LearningContext`** (`src/context/LearningContext.tsx`):
   - Manages enrolled courses, lesson progress mapping (`userProgress[courseId]`), completed lessons, quiz scores, certificates, and student reviews.
   - Enforces CR-01 (Behavior metrics tracking) and CR-02 (Review gate verification).
3. **`GamificationContext`** (`src/context/GamificationContext.tsx`):
   - Tracks daily learning streaks, XP points, study time records, and unlocked achievement badges.
4. **`LanguageContext`** (`src/context/LanguageContext.tsx`):
   - Manages instant bilingual toggle between English (`en`) and Bengali (`bn`) with deep translation dictionaries.
5. **`ThemeContext`** (`src/context/ThemeContext.tsx`):
   - Injects ThrivingSkills brand tokens (`#102F53`, `#FFB606`, `#E34234`) with Light and Dark theme switching.
6. **`OfflineContext`** (`src/context/OfflineContext.tsx`):
   - Monitors network connectivity status via NetInfo and manages offline download jobs.

---

## 4. Backend REST API Specifications

The application connects to `https://thrivingskill.com/wp-json` with fallbacks for staging environments:

### Core LearnPress LMS Endpoints
* `POST /learnpress/v1/token`: Issues user JWT bearer token for valid credentials.
* `POST /learnpress/v1/token/validate`: Verifies existing session token integrity.
* `POST /learnpress/v1/token/register`: Registers a new student account (`username`, `email`, `password`).
* `GET /learnpress/v1/courses`: Fetches course catalog with pagination, search, and category filters.
* `GET /learnpress/v1/courses/:id`: Returns full curriculum hierarchy (sections, lessons, quizzes).
* `POST /learnpress/v1/courses/enroll`: Enrolls the authenticated student into a course.
* `GET /learnpress/v1/lessons/:id`: Fetches lesson markdown, duration, and video stream URL.
* `POST /learnpress/v1/lessons/finish`: Marks a lesson as finished on the LMS.
* `GET /learnpress/v1/quiz/:id` & `POST /learnpress/v1/quiz/finish`: Interactive assessment execution.

### Resilience & Transformation Architecture
* **`httpClient.ts`**:
  - Implements exponential backoff retries (3 attempts).
  - Strict 12-second abort timeout via native `AbortController`.
  - DNS resolution error translation (e.g., catching `java.net.UnknownHostException` and presenting human-friendly offline guidance).
* **`transformers.ts`**:
  - Automatically synthesizes fallback curriculum sections if LearnPress returns empty or malformed curriculum arrays, guaranteeing the video player never crashes.

---

## 5. Recommendation Engine Algorithm (CR-01)

The recommendation engine in `LearningContext.tsx` calculates a dynamic relevance score $S_c$ for every course $c$ in the catalog using four weighted behavioral dimensions:

$$S_c = w_{\text{cat}} \cdot C(c) + w_{\text{search}} \cdot K(c) + w_{\text{level}} \cdot L(c) + w_{\text{dwell}} \cdot D(c)$$

Where:
* $C(c) \in [0, 1]$: Category affinity based on proportion of student's completed lessons in the same category ($w_{\text{cat}} = 0.40$).
* $K(c) \in [0, 1]$: Keyword match between course title/tags and user's search history ($w_{\text{search}} = 0.25$).
* $L(c) \in [0, 1]$: Career level match (Beginner vs. Intermediate vs. Executive) ($w_{\text{level}} = 0.20$).
* $D(c) \in [0, 1]$: Dwell time score on preview lessons ($w_{\text{dwell}} = 0.15$).

Courses already 100% completed are automatically filtered out of the recommendation shelf and routed to the Graduated shelf (CR-05).

---

## 6. Memory Hygiene & Timer Safety Standards

To eliminate memory leaks and runtime warnings in React Native:
1. **Cross-Platform Timer Typing**: All timer references use `useRef<ReturnType<typeof setTimeout> | null>(null)` instead of `NodeJS.Timeout`.
2. **Unmount Teardown**: Every component executing delayed asynchronous workflows (e.g. `PaymentModal.tsx`, `LessonPlayerScreen.tsx`, `AuthModal.tsx`) must register an explicit cleanup effect:
   ```typescript
   useEffect(() => {
     return () => {
       if (timerRef.current) clearTimeout(timerRef.current);
     };
   }, []);
   ```
3. **Safe Async Updates**: Component state updates following network requests verify mount state to prevent updates on unmounted trees.

---

## 7. TypeScript Compilation & Build Pipeline

* **Type Checking**: Strict mode typechecking verified via `tsc --noEmit`. Exits with code 0.
* **Codebase Scanner**: Automated verification script located at `scripts/audit_app.js` runs across all 117 source files to validate:
  - Relative import integrity.
  - StyleSheet property completeness.
  - Timer cleanup presence.
  - Absence of unsanitized `JSON.parse()`.

---

## 8. Android Enterprise Production & Play Store Architecture

The mobile application conforms to modern Google Android (API 34/35) and Play Store standards:

### 1. Android Manifest & App Configuration (`app.json`)
* **Monotonic Version Code**: `android.versionCode: 10400` (Release v1.4.0) compliant with Google Play Console submission requirements.
* **Android 12+ Adaptive Splash API**: Dedicated `splash` node configured with `#102F53` Deep Navy background and contained branding asset (`splash-icon.png`), preventing transition jumps on Android 12–15.
* **Window Soft Input & Keyboard Handling**: Explicit `softwareKeyboardLayoutMode: "resize"` ensuring authentication and payment checkout forms remain fully visible above the virtual keyboard.
* **Adaptive App Icons**: Density-independent vector layers configured for foreground, background, and monochrome icons for modern Android Material You theming.
* **Deep Linking**: Custom URI scheme `thrivingskill://` enabled for app linking and payment redirection.

### 2. EAS Build & Release Pipeline (`eas.json`)
* **Development Profile**: Internal distribution with `developmentClient: true` for on-device debugging.
* **Preview Profile**: Generates standalone test `.apk` for QA and team test devices.
* **Production Profile**: Configured for Google Play distribution with `buildType: "app-bundle"` (`.aab`), enabling dynamic feature delivery, split APKs, and resource optimization.

### 3. Modular UI Component Hierarchy
`src/components/` is organized into clean, domain-specific modules with root and subfolder barrel exports:
* `src/components/common/`: Primitive reusable UI controls (Header, ProgressBar, CategoryPills).
* `src/components/cards/`: Content cards (CourseCard, WorkshopCard, SummitCard, YouTubeCard).
* `src/components/modals/`: Interactive modals (AuthModal, PaymentModal, CertificateModal, ReviewModal).
* `src/components/player/`: Video player controls (CurriculumAccordion, QnATab, MiniPlayer).
* `src/components/analytics/`: High-fidelity SVG progress charts (ProfileLearningAnalytics).
