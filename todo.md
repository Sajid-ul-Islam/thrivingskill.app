# Project Task List & Implementation Roadmap (TODO)
## Thriving Skills Mobile Application

**Current Version**: 1.4.0  
**Current Milestone**: Milestone 5 Completed (Audit, Bug Eradication & Documentation)  
**Next Milestone**: Milestone 6 (EAS Standalone Cloud Build & Play Store Prep)  
**Last Updated**: November 2026  

---

## 🚀 Completed Tasks

### Phase 1: Core Foundation & Presentation UI
- [x] React Native 0.76 + Expo 52 project scaffolding with TypeScript strict mode.
- [x] Responsive layout with Android safe area handling and notch accommodation.
- [x] Dark Mode and Light Mode theme engine with ThrivingSkills brand tokens (`#102F53`, `#FFB606`, `#E34234`).
- [x] Authentic Bengali typography and slogans (*"শিখুন এবং গড়ুন নিজের ক্যারিয়ার"*).
- [x] Bottom tab navigation hierarchy (Home, My Learning, Explore, Copilot, Profile).
- [x] Course card presentation with dynamic star ratings, instructor avatars, and BDT currency formatting.
- [x] AI Skill Copilot conversational screen for executive career guidance.
- [x] B2B Enterprise Team Hub for corporate cohort training.

### Phase 2: Live WordPress & LearnPress LMS Integration
- [x] Production WordPress REST API client integration (`https://thrivingskill.com`).
- [x] 370+ Course catalog synchronization with live category taxonomy.
- [x] Course details, sections, and lesson curriculum hierarchy parser.
- [x] Resilient fallback curriculum generator for empty LearnPress course modules.
- [x] WordPress editorial blog articles synchronization with rich-text excerpt rendering.
- [x] Two-tier caching layer (L1 In-Memory + L2 Persistent AsyncStorage) with TTL invalidation.

### Phase 3: Commercial Upgrades & Local Ecosystem
- [x] Multi-method local MFS payment gateway modal (`PaymentModal.tsx`):
  - bKash (বিকাশ) wallet integration.
  - Nagad (নগদ) wallet integration.
  - DBBL Rocket checkout.
  - Credit/Debit Cards and Internet Banking.
- [x] Coupon and promo code engine (`TS50`, `EID2026`, `SKILLPRO`, `FREEPASS`).
- [x] Instant LearnPress course enrollment upon payment confirmation.
- [x] Bilingual Bangla ⇄ English switching with persistent language preference.
- [x] Interactive Lesson Player (`LessonPlayerScreen.tsx`) with native video playback.
- [x] Interactive Quiz assessment engine with immediate score calculations.
- [x] Offline mode with local storage of lesson notes and downloaded video assets.
- [x] Daily gamification engine (learning streaks, XP points, and achievement badges).

### Phase 4: Client Functional Requirements (CR-01 to CR-05)
- [x] **CR-01: Behavior-Based Course Recommendation Engine**:
  - Heuristic scoring algorithm calculating category affinity, search tokens, difficulty levels, and dwell time.
  - "Recommended For You / আপনার জন্য বিশেষ প্রস্তাবিত" shelf on Home Screen with dynamic explanation tag.
- [x] **CR-02: Mandatory Course Review Gate for Certificate Release**:
  - Automatic interception modal upon 100% course completion.
  - Interactive 1–5 star rating and required qualitative review text.
  - Strict certificate lock enforcement until review submission is confirmed.
- [x] **CR-03: Continuous Video Auto-Play**:
  - Automatic next-lesson transition triggered on playback completion.
  - 5-second countdown overlay with "Play Now" and "Cancel / Pause" controls.
- [x] **CR-04: Mobile Number + SMS OTP Authentication**:
  - Bangladeshi mobile phone format validation (`+880 1X-XXXXXXXX`).
  - 60-second countdown timer on OTP resend with anti-abuse rate limiting.
  - Direct Email and Password authentication fallback without third-party OAuth lock-ins.
- [x] **CR-05: Authenticated Learner Profile & Analytics Dashboard**:
  - Active Enrolled Courses shelf with progress tracking and direct "Continue Learning" CTA.
  - Graduated Courses shelf with verified completion certificates and Gold ribbon badges.
  - SVG Circular Skill Mastery Donut Chart and 7-day Weekly Learning Velocity Bar Chart.
  - Total Study Hours and Certified Achievements KPI metrics.

### Phase 5: Codebase Audit & Bug Eradication
- [x] Full static analysis across all 75 TypeScript files via `scripts/audit_app.js`.
- [x] Replaced hardcoded learner names (`'Sajid-ul Islam'`) with authenticated student identities in certificates and reviews.
- [x] Fixed timer leak in `PaymentModal.tsx` using `useRef<ReturnType<typeof setTimeout>>` and unmount cleanup.
- [x] Added `phone?: string` property to `WpUser` interface.
- [x] Fixed `ProfileScreenProps` navigation callbacks (`onNavigateToCourse`, `onNavigateToLesson`).
- [x] Removed residual third-party social login buttons (Facebook/Google) incompatible with backend WordPress setup.
- [x] Achieved 0 TypeScript compilation errors (`npm run typecheck`).
- [x] Git committed and pushed all fixes to remote `origin/master`.

---

## 🛠️ In-Progress Tasks

- [ ] **WordPress Staging SMS Gateway Hook**: Coordination with backend administrator to link SMS OTP endpoint with Bangladeshi telco gateway (e.g. Banglalink / Grameenphone SMS API).
- [ ] **Domain DNS Routing**: Final verification of staging subdomains vs. production WordPress root URL.

---

## 🔮 Upcoming Tasks & Backlog (Milestone 6)

- [ ] **EAS Standalone Production Build**:
  - Generate release keystore for Android.
  - Configure `eas.json` for optimized production APK and Google Play AAB release.
  - Verify standalone bundle execution and launch times.
- [ ] **Push Notification Infrastructure**:
  - Integrate Expo Push Notifications / Firebase Cloud Messaging (FCM).
  - Automated streak reminders (e.g. *"🔥 Don't break your 5-day study streak!"*).
  - Course announcement notifications from instructors.
- [ ] **Live Interactive Webinars (Zoom / WebRTC)**:
  - Deep-link integration with Zoom SDK or embedded web views for live masterclasses.
- [ ] **Google Play In-App Billing (IAP)**:
  - Complementary payment channel for international learners using foreign credit cards.
