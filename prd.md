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

### CR-04: Mobile Number + SMS OTP Authentication
* **Objective**: Minimize onboarding friction for Bangladeshi smartphone users who prefer phone numbers over email/password.
* **Business Logic**:
  1. Supports Bangladeshi mobile numbers (`+880 1X-XXXXXXXX`).
  2. 6-digit secure OTP dispatch with 60-second cooldown timer on resend.
  3. Rate limiting (max 3 OTP requests per 15 minutes) to protect against SMS gateway abuse.
  4. Fallback to direct Email and Password authentication with zero social SDK lock-in.

### CR-05: Authenticated Learner Profile & Analytics Dashboard
* **Objective**: Transform the student profile into an executive learning dashboard showcasing progress, certificates, and data visualization.
* **Key Modules**:
  1. *Circular Skill Mastery Donut Chart*: SVG gauge showing aggregate percentage mastery across all enrolled courses.
  2. *Weekly Velocity Bar Chart*: 7-day activity tracking (Mon–Sun) with active study streak indicator (`🔥 X-Day Streak`).
  3. *KPI Cards*: Total Enrolled Courses, Graduated Courses, Total Study Hours, and Verified Certificates.
  4. *Active Enrolled Courses Shelf*: In-progress courses with quick "Continue Learning" CTA.
  5. *Graduated Courses Shelf*: 100% completed courses with one-tap "View Certificate" action and Sunshine Gold (`#FFB606`) graduate ribbon.

---

## 4. Brand Identity & Aesthetic Specifications

The application strictly implements the official Thriving Skills Limited brand palette:
* **Deep Navy (`#102F53`)**: Primary brand identity, headers, card backgrounds in dark mode, and navigation accents.
* **Sunshine Gold (`#FFB606`)**: Accent color, graduation ribbons, star ratings, certificate borders, and achievement badges.
* **Crimson / Coral (`#E34234`)**: Primary call-to-action buttons, active indicators, and high-priority notices.
* **Crisp Slate & Surface Whites (`#F8FAFC`, `#FFFFFF`, `#0F192C`)**: High-contrast, WCAG AAA compliant text and card surfaces.
* **Bilingual Typography**: Clean Latin sans-serif paired with optimized Bengali system fonts.

---

## 5. Non-Functional Requirements & Performance Standards

1. **Cold Start Time**: Launch to interactive state in under 1.8 seconds on mid-tier Android devices.
2. **Offline-First Resilience**: All enrolled lesson metadata, notes, and downloaded media accessible without internet connection.
3. **Data Reduction**: Two-tier memory and persistent cache ensuring repeat screen transitions make 0 unnecessary network roundtrips.
4. **Memory Hygiene**: Zero memory leaks; all timer handles (`setTimeout`, `setInterval`) explicitly cleared on component unmount using safe cross-platform refs.
5. **Type Safety**: 100% TypeScript coverage with `tsc --noEmit` returning zero errors.

---

## 6. Release Criteria & Verification Matrix

| Milestone | Deliverable | Status |
| :--- | :--- | :--- |
| **Milestone 1** | Native UI Architecture & Bilingual Design Tokens | ✅ Completed |
| **Milestone 2** | Live WordPress REST API & LearnPress Course Sync | ✅ Completed |
| **Milestone 3** | Local MFS Payments (bKash, Nagad, Rocket) & Promo Engine | ✅ Completed |
| **Milestone 4** | Client Requirements CR-01 through CR-05 | ✅ Completed |
| **Milestone 5** | Full App Static Analysis, Bug Eradication & Git Remote Sync | ✅ Completed |
| **Milestone 6** | EAS Standalone Android Production APK/AAB | 🚀 In Progress |
