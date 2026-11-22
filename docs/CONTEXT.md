# Project Context & Domain Reference (CONTEXT)
## Thriving Skills Mobile Application

This document provides a holistic domain and architectural reference for developers, engineers, and AI agents onboarding to the **Thriving Skills** mobile application.

---

## 1. Business & Domain Overview

**Thriving Skills Limited (TSL)** is an executive education and professional upskilling institute headquartered in Dhaka, Bangladesh. TSL bridges the gap between academic education and corporate employment demands by offering instructor-led and self-paced video courses taught by top industry executives and certified practitioners.

* **Target Audience**: Corporate managers, software engineers, data analysts, university graduates, and enterprise client teams.
* **Core Subject Areas**: Generative AI, Business Intelligence, Corporate Finance, Supply Chain, Human Resources, Agile Project Management, and Executive Leadership.
* **Primary Currency**: Bangladeshi Taka (`৳` BDT).
* **Official Website**: `https://thrivingskill.com/`

---

## 2. Codebase Topology & Directory Structure

```
thrivingskill.app/
├── assets/                     # App icons, splash screens, certificate templates
├── scripts/                    # Codebase scanners, audit utilities & automation
│   └── audit_app.js            # 117-file static analysis & health scanner
├── src/
│   ├── components/             # Modular UI components & design system
│   │   ├── common/             # Base primitives (Header, ProgressBar, CategoryPills)
│   │   ├── cards/              # Domain cards (CourseCard, WorkshopCard, SummitCard)
│   │   ├── modals/             # Full dialogs (AuthModal, PaymentModal, CertificateModal)
│   │   ├── player/             # Video lecture player (CurriculumAccordion, QnA)
│   │   ├── analytics/          # Data visualization (ProfileLearningAnalytics)
│   │   └── index.ts            # Root barrel export + backward-compatible stubs
│   ├── context/                # React State Contexts
│   │   ├── AuthContext.tsx     # JWT authentication & user profile state
│   │   ├── LearningContext.tsx # Course progress, CR-01 engine, certs
│   │   ├── GamificationContext.tsx # Daily streaks, XP points, badges
│   │   ├── LanguageContext.tsx # Bilingual Bangla/English translation
│   │   ├── ThemeContext.tsx    # ThrivingSkills brand token injector
│   │   └── OfflineContext.tsx  # NetInfo network status & downloads
│   ├── screens/                # Primary application screens
│   │   ├── HomeScreen.tsx      # Banner, CR-01 recommendations, categories
│   │   ├── ExploreScreen.tsx   # Search, filters, and full 370+ course catalog
│   │   ├── MyLearningScreen.tsx# In-progress & offline downloaded courses
│   │   ├── CourseDetailScreen.tsx # Syllabus accordion, instructor, reviews
│   │   ├── LessonPlayerScreen.tsx # Lesson streaming, CR-03 auto-play, notes
│   │   ├── ProfileScreen.tsx   # CR-05 Enrolled/Graduated shelves & analytics
│   │   ├── CopilotScreen.tsx   # Interactive AI skill assistant
│   │   └── EnterpriseScreen.tsx# B2B team training & corporate inquiry
│   ├── services/               # Infrastructure & domain services
│   │   ├── api/                # httpClient, apiConfig, transformers
│   │   ├── auth/               # authService (JWT login, register, OTP)
│   │   ├── course/             # courseService (LearnPress REST API sync)
│   │   ├── payment/            # paymentService (bKash/Nagad simulation)
│   │   └── offline/            # offlineManager (file downloads, queues)
│   ├── theme/                  # Brand colors, typography, spacing tokens
│   └── types/                  # TypeScript interfaces and entity types
├── app.json                    # Google Android & iOS production configuration
├── eas.json                    # EAS build profiles (APK preview + AAB production)
├── package.json                # Project dependencies and npm scripts
├── tsconfig.json               # TypeScript strict configuration
└── *.md                        # Documentation and requirements suite
```

---

## 3. Data Entities & Domain Model

```
┌─────────────────┐       1:N       ┌─────────────────┐
│     Course      ├─────────────────┤     Section     │
└────────┬────────┘                 └────────┬────────┘
         │                                   │ 1:N
         │ 1:N                               ▼
         │                          ┌─────────────────┐
         │                          │  Lesson / Quiz  │
         │                          └─────────────────┘
         ▼
┌─────────────────┐       1:1       ┌─────────────────┐
│   Enrollment    ├─────────────────┤  UserProgress   │
│  (Student <->)  │                 │  (% complete)   │
└────────┬────────┘                 └────────┬────────┘
         │                                   │
         ▼ 100% Complete                     ▼ Gated by CR-02
┌─────────────────┐                 ┌─────────────────┐
│   Certificate   │◄────────────────┤  Course Review  │
└─────────────────┘                 └─────────────────┘
```

* **`Course`**: Represents a LearnPress course containing title, description, instructor info, price (BDT), category, duration, and section hierarchy.
* **`Section` & `Lesson`**: Hierarchical curriculum units. Lessons contain duration, video stream URL, content body, and downloadable resources.
* **`UserProgress`**: Maps student watch history, lesson completions, quiz scores, and certificate status per course.
* **`Certificate`**: Cryptographically verifiable credential generated upon 100% course completion and review submission.

---

## 4. Local Storage & Persistence Keys

The app utilizes `@react-native-async-storage/async-storage` for offline and session persistence:

| Storage Key | Type | Description |
| :--- | :--- | :--- |
| `@thriving_skill_user` | `WpUser` | Cached authenticated user profile and JWT token |
| `@thriving_skill_progress` | `Record<string, UserProgress>` | Student lesson completions and quiz scores |
| `@thriving_skill_lang` | `'en' \| 'bn'` | Selected UI language (English or Bengali) |
| `@thriving_skill_theme` | `'light' \| 'dark' \| 'system'` | Theme preference |
| `@thriving_skill_behavior` | `BehaviorMetrics` | User category views, search terms & dwell time for CR-01 |
| `@thriving_skill_gamification` | `GamificationState` | Learning streak count, XP points, and unlocked badges |
| `@thriving_skill_offline_index` | `OfflineIndex` | Metadata and local disk paths of downloaded lessons |

---

## 5. Security & Authentication Architecture

1. **JWT Bearer Tokens**: Authenticated requests dispatch headers formatted as `Authorization: Bearer <token>`.
2. **Session Verification**: Tokens are validated against `/learnpress/v1/token/validate` upon app launch. Expired tokens trigger graceful re-authentication without dropping offline progress.
3. **No Third-Party OAuth Dependency**: Login flows rely purely on direct native WordPress REST API authentication and SMS OTP, avoiding external Facebook/Google SDK breaking changes.
