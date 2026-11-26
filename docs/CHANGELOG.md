# 📜 Changelog

All notable changes to the **Thriving Skills (TSL) Mobile App** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### 🔒 Security, Auth & Server-Authoritative Learning Hardening
- **Backend-Authoritative Review, Certificates & Cross-Device Sync (Gap 1)**:
  - Added `/learning-state`, `/courses/{id}/submit-review`, and `/certificates/verify` REST endpoints in `ts-mobile-bridge.php` so course completion and reviews are verified and persisted on WordPress before issuing certificates.
  - Updated `LearningContext`, `CompanionService`, `CoursesService`, and UI modals so certificates only unlock from server-verified records and synchronize across devices.
- **Email-Mandatory Registration & Optional Username**:
  - Removed unbacked Phone OTP (`tsl/v1`) and synthetic `@phone.thrivingskill.com` addresses; standardized on unique email registration with optional custom username preservation.
- **Single-Use WebView Checkout Handoff & Session Hygiene**:
  - Added `/webview-handoff` single-use auth handoff so in-app WooCommerce checkout opens authenticated as the logged-in mobile user, plus session-scoped token revocation.
- **Push Notifications, Telemetry, Search & CI Quality**:
  - Purged legacy `ts_push_*` fake tokens, avoided caching synthetic tokens on failure, and scheduled daily streak reminders via `Notifications.scheduleNotificationAsync`.
  - Replaced hash-bucket embeddings with Okapi BM25 keyword search (`src/services/search/bm25.ts`).
  - Added Sentry `sendDefaultPii: false`, `order_key`/credential scrubbing, phone-username stripping, `{ "policy": "fingerprint" }` runtimeVersion, canonical `scripts/sync_version.js`, and PHPUnit test suite in `backend-plugin/tests/`.
- **Version Governance, Biometric Cleanup, Brand Parity & Three-Layer QA**:
  - Standardized release versioning on `package.json` (`1.4.0` / `versionCode: 10400`) via automated `scripts/sync_version.js --check/--write` and generated `src/config/appVersion.ts`.
  - Removed incomplete fake Biometric Unlock toggle/state (`ProfilePreferencesSection.tsx`, `useProfileScreenState.ts`, translations, roadmap).
  - Enforced strict `#102F53` + `#E34234` + `#FFFFFF` brand palette parity with `thrivingskill.com` (`#FFB606` restricted strictly to course rating stars).
  - Added authoritative [`docs/IMPLEMENTATION_STATUS.md`](./IMPLEMENTATION_STATUS.md), runnable Layer 2 Staging E2E suite ([`scripts/test_layer2_staging_integration.js`](../scripts/test_layer2_staging_integration.js) + `.github/workflows/staging-e2e.yml`), and Layer 3 [`docs/REAL_DEVICE_TEST_CHECKLIST.md`](./REAL_DEVICE_TEST_CHECKLIST.md).

---

## [1.4.0] - 2026-11-26

### 🚀 Consolidated v1.4 Release Milestones

#### Registration, Profile Sync & UI Refinements
- **Streamlined Registration & Auto-Login**:
  - Unified native registration in `AuthModal.tsx` with clean username resolution (`resolve_registration_username`) and immediate tokenized sign-in.
- **In-App Profile Editing & Live Database Sync**:
  - Enabled live editing of Full Name, Bio, Phone Number, City, Social Links, and Avatar directly inside `ProfileScreen.tsx` backed by `/wp/v2/users/me` and `/learnpress/v1/users/{id}`.
  - Integrated `AppState` foreground listener in `AuthContext.tsx` and pull-to-refresh on `ProfileScreen.tsx`.
- **Habit-Based Notification Queue & Uniform Course Cards**:
  - Standardized `CourseCard.tsx` geometry (16:9 thumbnail ratio, 2-line title clamp, aligned footer) and stabilized event tab layouts.
- **Consolidated `docs/` Directory**:
  - Organized markdown docs, client proposals, and release notes under `docs/` and preview binaries under `builds/`.

#### Accessibility & Modern Web Guidance
- **Dynamic Accessible Error & Status Announcements**:
  - Injected `accessibilityRole="alert"` and `accessibilityLiveRegion="polite"` on dynamic error notices in `AuthModal.tsx` and `MandatoryReviewModal.tsx`, plus `accessibilityRole="status"` on verification banners.
- **Autofill & Semantic Dialog Controls**:
  - Configured `autoComplete` and `textContentType` across auth and payment forms, `accessibilityViewIsModal={true}` across modals, and `accessibilityRole="radio"` on payment selectors.
- **Timer Hygiene & Memory Safety**:
  - Replaced unhandled `setTimeout` calls in `CertificateModal.tsx` with `useRef` timers cleaned up on unmount.

#### Google Android & Modular Architecture Upgrades
- **Google Play Store Production Compliance**:
  - Added monotonic `android.versionCode: 10400` in `app.json`, Android 12+ Adaptive Splash Screen with `#102F53` background, `android.softwareKeyboardLayoutMode: "resize"`, and `thrivingskill://` deep linking.
- **EAS Build & Component Modularization**:
  - Configured `eas.json` production `.aab` and preview `.apk` profiles and decomposed components into `common/`, `cards/`, `modals/`, `player/`, and `analytics/` submodules.

#### Full Codebase Health Audit & Documentation Alignment
- **Hardcoded Student Names Eradicated**:
  - Replaced hardcoded `'Sajid-ul Islam'` in `LessonPlayerScreen.tsx`, `CourseDetailScreen.tsx`, and `LearningContext.tsx` with dynamic authenticated student identity: `user?.displayName || user?.username || 'Executive Graduate'`.
- **Memory & Timer Leak Resolution**:
  - Resolved `setTimeout` timer leak in `PaymentModal.tsx` using `useRef<ReturnType<typeof setTimeout> | null>(null)` with component unmount teardown effect.
- **Type Safety & Strictness**:
  - Fixed cross-platform timer types to `ReturnType<typeof setTimeout>`, added `phone?: string;` to `WpUser`, added `onNavigateToCourse`/`onNavigateToLesson` to `ProfileScreenProps`, and added `scripts/audit_app.js`.
- **Documentation Suite Overhaul**:
  - Aligned `docs/PRD.md`, `docs/TRD.md`, `docs/TODO.md`, `docs/BUGFIX.md`, `docs/AGENTS.md`, `docs/CONTEXT.md`, and `README.md`.

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
