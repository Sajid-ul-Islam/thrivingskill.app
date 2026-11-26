# Product Requirements Document (PRD)
## Thriving Skills Mobile Learning Application (Android & iOS)

**Project Name**: Thriving Skills Executive Mobile Learning Application  
**Client / Owner**: Thriving Skills Limited (TSL), Dhaka, Bangladesh  
**Platform**: Cross-Platform Native Mobile (iOS & Android via React Native / Expo)  
**Backend**: WordPress REST API v2 + LearnPress LMS REST API v1  
**Version**: 1.4.0  
**Status**: Production Ready / Feature Complete  

---

## 1. Executive Summary & Product Vision

Thriving Skills Limited (TSL) is a premier professional development and corporate e-learning platform in Bangladesh. The Thriving Skills Mobile Application delivers a frictionless, executive-grade mobile learning experience that empowers corporate professionals, university students, and lifelong learners to master high-demand modern skills—including Generative AI, Data Analytics, Corporate Leadership, Financial Modeling, and Supply Chain Management.

The mobile app maintains bidirectional synchronization with the live WordPress/LearnPress LMS platform (`https://thrivingskill.com`), ensuring that student enrollments, course progression, quiz attempts, payments, reviews, and certificates remain synchronized across web and mobile.

---

## 2. Target User Personas

| Persona | Description | Key Motivations | Core App Features Used |
| :--- | :--- | :--- | :--- |
| **Executive / Working Professional** | Mid-to-senior corporate manager looking for upskilling in AI, leadership, and analytics. | Quick micro-learning on commutes, verifiable credentials for LinkedIn, seamless payments. | Offline downloads, 5s auto-play, PDF certificates, bKash/Nagad checkout, AI Copilot. |
| **University Graduate / Job Seeker** | Fresh graduate looking for practical skills to secure high-paying jobs in Bangladesh or remotely. | Low cost/scholarships, localized Bangla instruction, guided roadmaps. | Behavior recommendations (CR-01), bilingual toggle, gamified learning streaks. |
| **Corporate HR / L&D Manager** | Enterprise client training teams of 20–500 employees. | Bulk enrollments, team performance tracking, customized corporate cohorts. | Enterprise B2B Team Hub, corporate diagnostic skill assessments, inquiry forms. |

---

## 3. Core Functional Requirements (Client Requirements CR-01 to CR-05)

### CR-01: Behavior-Based Course Recommendation Engine
* **Objective**: Replace static course lists with personalized, dynamic recommendations on the Home Screen based on the student's individual learning behavior.
* **Signals Analyzed**:
  1. *Category Affinity*: Percentage of time spent watching specific categories (e.g., AI vs. Leadership).
  2. *Search & Query History*: Keywords searched in the app's spotlight search bar.
  3. *Skill Level Affinity*: Beginner, Intermediate, or Executive Masterclass based on completed courses.
  4. *Watch Dwell Time*: Courses where preview lessons were sampled for > 60 seconds.
* **UI Presentation**: Dedicated Home Screen shelf labeled **"Recommended For You / আপনার জন্য বিশেষ প্রস্তাবিত"** with dynamic rationale subtext (e.g., *"Based on your interest in Generative AI"*).

### CR-02: Mandatory Course Review Gate for Certificate Release
* **Objective**: Ensure 100% course feedback capture and authentic social proof before students obtain course completion certificates.
* **Business Logic**:
  1. Triggered automatically when course progress reaches 100% (all lessons and chapter quizzes completed).
  2. Displays non-dismissible `MandatoryReviewModal` requiring:
     - 1 to 5 Star Interactive Rating.
     - Written qualitative feedback (minimum character threshold).
  3. "View / Download Certificate" CTA remains strictly locked until review submission is confirmed.
  4. Upon submission, the verified digital certificate is issued with real-time student identity, unique credential ID, and social share links (LinkedIn & Facebook).

### CR-03: Continuous Video Auto-Play (5-Second Countdown)
* **Objective**: Frictionless binge-learning experience without requiring manual touches between consecutive lessons.
* **Business Logic**:
  1. Triggers when video playback finishes or progress $\ge 98\%$.
  2. Displays sleek 5-second countdown banner with "Play Now" and "Cancel / Pause" controls.
  3. Automatically marks lesson complete, syncs progress, and boots the next video lesson seamlessly.

### CR-04: Native LearnPress JWT Authentication & Simplified 4-Field Onboarding
* **Objective**: Frictionless, secure user onboarding and authentication directly synchronized with `https://thrivingskill.com`.
* **Business Logic**:
  1. **Simplified 4-Field Registration**: Full Name, Email, Phone Number, and Password. Replaced cumbersome multi-step webview links with instant in-app account provisioning.
  2. **Auto-Generated Usernames**: Automatically extracts a unique, clean username from the student's email (e.g. `sajidislam582`), completely eliminating registration friction.
  3. **Instant Auto-Login**: Automatically acquires JWT session token upon registration and authenticates the user immediately.
  4. **Dual Endpoint Support**: Primary integration via companion plugin `/thrivingskill/v1/register` with fallback to native `/learnpress/v1/token/register`.
  5. **Direct JWT Login**: Authenticates via `POST /learnpress/v1/token` with username/email and password.
  6. **Token Freshness Validation**: Token validation via `POST /learnpress/v1/token/validate` and encrypted local credential hydration.
  7. **Native Password Recovery**: Password recovery via `action=lostpassword` directly connected to WordPress.

### CR-05: Authenticated Learner Profile & Bi-directional Live Sync
* **Objective**: Transform the student profile into an executive learning dashboard with real-time bi-directional synchronization with `https://thrivingskill.com`.
* **Key Modules**:
  1. *In-App Profile Editing*: Direct editing of Name, Bio, Phone, City, Social Links, and Avatar with instant persistence to `/wp/v2/users/me` and `/learnpress/v1/users/{id}`.
  2. *Web-to-App Automatic Sync*: Background `AppState` listener and pull-to-refresh pulling live website changes down to the mobile app seamlessly.
  3. *Circular Skill Mastery Donut Chart*: SVG gauge showing aggregate percentage mastery across all enrolled courses.
  4. *Weekly Velocity Bar Chart*: 7-day activity tracking (Mon–Sun) with active study streak indicator (`🔥 X-Day Streak`).
  5. *KPI Cards*: Total Enrolled Courses, Graduated Courses, Total Study Hours, and Verified Certificates.
  6. *Active Enrolled Courses Shelf*: In-progress courses with quick "Continue Learning" CTA.
  7. *Graduated Courses Shelf*: 100% completed courses with one-tap "View Certificate" action in Accent Red (`#E34234`) and Deep Navy (`#102F53`) graduate badges.

---

## 4. Brand Identity & Aesthetic Specifications

The application strictly implements the official Thriving Skills Limited brand palette (in strict parity with `https://thrivingskill.com` and `.agents/rules/ui-ux-design-laws.md`):
* **Deep Royal Blue / Navy (`#102F53`)**: Primary brand identity, headers, primary buttons, card accents, and primary light-mode typography.
* **Accent Crimson / Red (`#E34234`)**: Primary call-to-action buttons, certificate actions, notification badges, active indicators, and discount tags.
* **Pure White & Layered Navy Surfaces (`#FFFFFF`, `#F5F7FA`, `#0B1420`, `#162538`)**: High-contrast, WCAG AA compliant typography and card surfaces.
* **Rating Stars Only (`#FFB606`)**: Reserved solely for course rating star icons (`starColor`), matching Eduma/LearnPress rating stars on the live website.
* **Bilingual Typography**: Clean Latin sans-serif paired with optimized Bengali system fonts.

---

## 5. Non-Functional Requirements & Performance Standards

1. **Cold Start Time**: Launch to interactive state in under 1.8 seconds on mid-tier Android devices.
2. **Offline-First Resilience**: Enrolled lesson metadata, offline study deck text notes, and completion sync queues remain accessible without internet connection (encrypted offline video binaries remain in Milestone 7 backlog; see [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md)).
3. **Data Reduction**: Two-tier memory and persistent cache ensuring repeat screen transitions make 0 unnecessary network roundtrips.
4. **Memory Hygiene**: Zero memory leaks; all timer handles (`setTimeout`, `setInterval`) explicitly cleared on component unmount using safe cross-platform refs.
5. **Type Safety**: 100% TypeScript coverage with `tsc --noEmit` returning zero errors.

---

## 6. Release Criteria & Verification Matrix

| Milestone | Deliverable | Status |
| :--- | :--- | :--- |
| **Milestone 1** | Native UI Architecture & Bilingual Design Tokens | ✅ Completed |
| **Milestone 2** | Live WordPress REST API & LearnPress Course Sync | ✅ Completed |
| **Milestone 3** | Hybrid WooCommerce / SSLCommerz WebView Checkout & Autofill Sync | ✅ Implemented (Layer 3 Gateway QA pending) |
| **Milestone 4** | Client Requirements CR-01 through CR-05 | ✅ Completed |
| **Milestone 5** | Full App Static Analysis, Bug Eradication & Git Remote Sync | ✅ Completed |
| **Milestone 6** | EAS Standalone Android Production APK/AAB | 🚀 In Progress |
