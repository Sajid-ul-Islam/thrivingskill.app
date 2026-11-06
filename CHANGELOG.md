# 📜 Changelog

All notable changes to the **Thriving Skills (TSL) Mobile App** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.4.2] - 2026-11-07

### ♿ Accessibility & Modern Web Guidance Implementation
- **Dynamic Accessible Error & Status Announcements**:
  - Injected `accessibilityRole="alert"` and `accessibilityLiveRegion="polite"` on dynamic error notices in `AuthModal.tsx` and `MandatoryReviewModal.tsx`.
  - Added `accessibilityRole="status"` on verification and success message banners.
- **Browser Autofill & Form Semantics**:
  - Configured `autoComplete="email"`, `autoComplete="tel"`, `autoComplete="name"`, and `autoComplete="one-time-code"` across authentication and payment forms.
  - Enabled browser password autofill (`current-password` / `new-password`) with `textContentType` integration.
- **Semantic Dialog & Button Controls**:
  - Enforced `accessibilityViewIsModal={true}` across all modal containers (`AuthModal`, `PaymentModal`, `CertificateModal`, `MandatoryReviewModal`, `CorporateInquiryModal`).
  - Added explicit `accessibilityRole="button"` and `accessibilityLabel` for icon-only close buttons, password visibility toggles, and catalog cards.
  - Configured payment method selectors with `accessibilityRole="radio"` and `accessibilityState={{ selected }}`.
- **Timer Hygiene & Memory Safety**:
  - Eliminated unhandled `setTimeout` calls in `CertificateModal.tsx` using `pdfTimerRef` and `copyTimerRef` with component unmount teardown.
- **Compiler Health**:
  - Maintained 100% strict TypeScript compliance (0 errors) across all 117 files.

---

## [1.4.1] - 2026-11-06

### 🚀 Upgraded (Google Android & Architecture Standards)
- **Google Play Store Production Compliance**:
  - Added monotonic `android.versionCode: 10400` in `app.json`.
  - Configured Android 12+ Adaptive Splash Screen API with `#102F53` Deep Navy background and contained branding asset.
  - Added `android.softwareKeyboardLayoutMode: "resize"` to prevent virtual keyboard obscuring checkout/auth forms.
  - Enabled deep linking URI scheme `thrivingskill://`.
- **EAS Build Architecture Upgrade**:
  - Configured `eas.json` production profile to output Google Play-mandated Android App Bundle (`.aab`) with resource split optimization.
  - Retained fast standalone `.apk` distribution for team `preview` testing.
- **Component Architecture Modularization**:
  - Decomposed flat 34-component directory into clean domain submodules:
    - `src/components/common/`: Shared UI primitives and headers.
    - `src/components/cards/`: Course and event catalog cards.
    - `src/components/modals/`: Interactive dialogs and payment bottom sheets.
    - `src/components/player/`: Video curriculum accordion and player controls.
    - `src/components/analytics/`: High-contrast SVG progress charts.
  - Preserved complete backward compatibility with root and subdirectory `index.ts` barrel exports.
  - Verified 0 broken imports and 0 compiler errors across all 117 source files.

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
