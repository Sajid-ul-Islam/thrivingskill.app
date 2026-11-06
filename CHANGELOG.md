# 📜 Changelog

All notable changes to the **Thriving Skills (TSL) Mobile App** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.4.0] - 2026-11-06

### 🛠️ Fixed & Audited (Full Codebase Health Audit)
- **Hardcoded Student Names Eradicated**:
  - Replaced hardcoded `'Sajid-ul Islam'` in `LessonPlayerScreen.tsx`, `CourseDetailScreen.tsx`, and `LearningContext.tsx` with dynamic authenticated student identity: `user?.displayName || user?.username || 'Executive Graduate'`.
- **Memory & Timer Leak Resolution**:
  - Resolved `setTimeout` timer leak in `PaymentModal.tsx` using `useRef<ReturnType<typeof setTimeout> | null>(null)` with component unmount teardown effect.
- **Type Safety & Strictness**:
  - Fixed cross-platform timer type in `PaymentModal.tsx` to `ReturnType<typeof setTimeout>`.
  - Added missing `phone?: string;` property to `WpUser` interface in `src/types/index.ts`.
  - Added `onNavigateToCourse` and `onNavigateToLesson` to `ProfileScreenProps`.
  - Achieved **0 TypeScript errors** on `npm run typecheck` across all 75 source files.
- **Automated Verification Tooling**:
  - Built and deployed `scripts/audit_app.js` to perform continuous 5-dimension static analysis across all files for import resolution, StyleSheet keys, timer hygiene, and unhandled JSON operations.

### 📚 Documentation Suite Overhaul
- Added and aligned the complete documentation suite:
  - `prd.md`: Product Requirements Document
  - `trd.md`: Technical Requirements Document
  - `todo.md`: Task Management & Roadmap
  - `bugfix.md`: Bug Fix & Incident Resolution Log
  - `agents.md`: AI Agents Specification & Operating Instructions
  - `context.md`: Project Context & Domain Reference
  - `featurs.md`: Master Features Inventory
  - `skills.md`: Antigravity Skills & Tooling Manual
  - `README.md`: Modernized with badges, quickstart, and documentation links.

---

## [1.3.0] - 2026-10-24

### 🚀 Added
- **Authenticated Learner Profile & Analytics Dashboard (CR-05)**:
  - **Visual Learning Analytics Data Chart**: High-contrast SVG Circular Mastery Donut Chart and 7-day Weekly Learning Velocity Bar Chart with active streak badge (`🔥 X-Day Streak`).
  - **Active Enrolled Courses Shelf**: Filtered display of in-progress courses with real-time progress bars and instant "Continue Learning" CTA.
  - **Graduated Courses Shelf**: Dedicated showcase of 100% completed courses with Sunshine Gold (`#FFB606`) graduate ribbon and one-tap "View Certificate" trigger.
  - **Core KPI Metrics Cards**: Displaying Enrolled Courses, Graduated Courses, Total Study Hours, and Verified Certificates.
  - **ThrivingSkills Brand Color Harmonization**: Full implementation of `#102F53` Deep Navy, `#FFB606` Sunshine Gold, and `#E34234` Crimson accents across the profile and navigation headers.

---

## [1.2.0] - 2026-10-05

### 🚀 Added
- **Local Mobile Financial Services (MFS) Checkout**:
  - Interactive payment gateway modal (`PaymentModal.tsx`) supporting bKash, Nagad, DBBL Rocket, and Credit/Debit Cards.
  - Promo code and coupon verification engine (`TS50`, `EID2026`, `SKILLPRO`, `FREEPASS`) with dynamic price calculations.
  - Automatic LearnPress course enrollment upon payment confirmation.
- **Bilingual Localization System**:
  - Complete English ⇄ Bengali toggle in `LanguageContext.tsx` with persistent language preference.
- **Offline Download Manager**:
  - Local caching and video download orchestration via `OfflineManager.ts` with background sync queue.

---

## [1.1.0] - 2026-09-18

### 🚀 Added
- **Behavior-Based Course Recommendations (CR-01)**:
  - Real-time affinity tracking based on user course browsing, enrollment, and category frequency.
  - Search history tracking dynamically weighting course relevance.
  - Dedicated shelf on Home Screen: **"আপনার পছন্দের ভিত্তিতে প্রস্তাবিত / Recommended For You"** with transparent reasoning tags.
- **Mandatory Course Review & Certificate Gating (CR-02)**:
  - `MandatoryReviewModal` component featuring interactive 1–5 star ratings and multiline qualitative feedback.
  - Strict certificate gating: certificate remains locked until a review is submitted.
- **Continuous Video Auto-Play (CR-03)**:
  - Automated 5-second countdown overlay on lesson completion displaying upcoming lesson title, circular progress, "Play Now", and "Cancel" buttons.
- **Mobile Number + SMS OTP Authentication (CR-04)**:
  - Phone-based registration and login for Bangladeshi numbers (`+880`).
  - 6-digit OTP verification with 60-second cooldown resend timer.

---

## [1.0.0] - 2026-09-04

### 🌟 Initial Production Release
- **LMS Engine**: Full LearnPress REST API integration, course catalog, category filters, curriculum outline, and progress tracking.
- **Curriculum & Lesson Player**: Native video player, HTML lesson reader, and interactive quiz engine with score calculation.
- **Certificates**: Digital certificate generator with QR verification code, issue dates, and course completion badges.
- **Offline Mode**: Local caching and offline lesson downloads via `AsyncStorage`.
- **Localization**: Native bilingual support for Bengali (বাংলা) and English.
