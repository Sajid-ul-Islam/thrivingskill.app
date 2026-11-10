# Project Task List & Implementation Roadmap (TODO)
## Thriving Skills Mobile Application

**Current Version**: 1.5.0  
**Current Milestone**: Milestone 6 Completed (UI/UX Motion Overhaul, Vimeo Pro Integration, Local APK Build & GitHub Release)  
**Next Milestone**: Milestone 7 (Direct MFS Gateway SDK, Biometrics & Play Store Submission)  
**Repository**: `https://github.com/Sajid-ul-Islam/thrivingskill.app`  
**Last Updated**: November 2026  

---

## 🚀 Completed Tasks

### Phase 1: Core Foundation & Presentation UI
- [x] React Native 0.76 + Expo 52/58 project scaffolding with TypeScript strict mode.
- [x] Responsive layout with Android safe area handling and notch accommodation.
- [x] Dark Mode and Light Mode theme engine with ThrivingSkills brand tokens (`#102F53`, `#FFB606`, `#E34234`, `#0F192C`/`#1E293B`, `#FFFFFF`/`#F8FAFC`).
- [x] Authentic Bengali typography and slogans (*"শিখুন এবং গড়ুন নিজের ক্যারিয়ার"*).
- [x] Bottom tab navigation hierarchy (Home, My Learning, Explore, Live Workshops, Profile).
- [x] Course card presentation with dynamic star ratings, instructor avatars, and BDT currency formatting (`৳১,৫০০`).
- [x] B2B Enterprise Team Hub & Corporate Training Inquiry modal.

### Phase 2: Live WordPress & LearnPress LMS Integration
- [x] Production WordPress REST API client integration (`https://thrivingskill.com/wp-json`).
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
- [x] Bilingual Bangla ⇄ English switching with persistent language preference (`LanguageContext.tsx`).
- [x] Interactive Lesson Player (`LessonPlayerScreen.tsx`) with commute mode audio and video playback.
- [x] Interactive Quiz assessment engine with immediate score calculations (`QuizPlayerModal.tsx`).
- [x] Offline mode with local storage of lesson notes and downloaded video assets (`OfflineManager.ts`).
- [x] Daily gamification engine (learning streaks, XP points, and achievement badges in `GamificationContext.tsx`).

### Phase 4: Client Functional Requirements (CR-01 to CR-05)
- [x] **CR-01: Behavior-Based Course Recommendation Engine**:
  - Heuristic scoring algorithm calculating category affinity, search tokens, difficulty levels, and dwell time.
  - "Recommended For You / আপনার জন্য বিশেষ প্রস্তাবিত" shelf on Home Screen with dynamic explanation tag.
- [x] **CR-02: Mandatory Course Review Gate for Certificate Release**:
  - Automatic interception modal upon 100% course completion (`MandatoryReviewModal.tsx`).
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

### Phase 5: Codebase Audit & Memory Hygiene
- [x] Full static analysis across all TypeScript files via `scripts/audit_app.js`.
- [x] Replaced hardcoded learner names with authenticated student identities in certificates and reviews.
- [x] Eliminated timer leaks across all components using `useRef<ReturnType<typeof setTimeout>>` and unmount cleanup.
- [x] Fixed `ProfileScreenProps` navigation callbacks (`onNavigateToCourse`, `onNavigateToLesson`).
- [x] Cleaned up residual third-party social login buttons incompatible with WordPress auth.
- [x] Achieved 0 TypeScript compilation errors (`npm run typecheck`).

### Phase 6: Authentic Course Video System (Vimeo Pro & Zoom Cohorts)
- [x] **Vimeo Pro Player Integration**:
  - Discovered that `thrivingskill.com` stores course recorded lectures on Vimeo Pro (`player.vimeo.com`) in `_lp_lesson_video_intro`.
  - Configured `WebView` embedded player with authentic referer headers (`Referer: https://thrivingskill.com`).
  - Created centralized master registry `src/data/lessonVideosRegistry.ts` featuring 36 authentic Vimeo lectures.
- [x] **Live Interactive Zoom Cohort Launcher**:
  - Parser identifying Zoom meeting links inside course summary/meta.
  - Built dedicated "Live Cohort Masterclass (Zoom)" launcher card in `LessonPlayerScreen.tsx`.
- [x] **Compact Playback Toolbar**:
  - Prevented button overflow on small viewports (320px) with compact padding (`paddingHorizontal: 8`, `gap: 8/6`).

### Phase 7: Admin QA Bypass Mode
- [x] Added `isAdminBypass` state and `toggleAdminBypass()` in `AuthContext.tsx`.
- [x] Embedded Admin QA Mode toggle switch in `ProfileScreen.tsx`.
- [x] Added instant bypass logic in `CourseDetailScreen.tsx` and `LessonPlayerScreen.tsx` allowing admin QA to test and inspect all locked lectures without payment gateways.
- [x] Added Admin badge pills in curriculum playlists.

### Phase 8: Local Android APK Build & GitHub Release Pipeline
- [x] Authored standalone PowerShell build script `scripts/build_apk.ps1` for local Gradle/Android compilation.
- [x] Successfully compiled production Android Release APK (`87,544,985 bytes`).
- [x] Uploaded and tagged production release on GitHub (`v1.0.0`) with direct APK download.

### Phase 9: Comprehensive UI/UX Layout & Safe Area Hardening
- [x] Fixed CourseDetailScreen bottom enrollment bar clipping across small viewports (320px–428px).
- [x] Added `useSafeAreaInsets()` to all 13 modals and action sheets:
  - `AuthModal.tsx`
  - `PaymentModal.tsx`
  - `SubscriptionModal.tsx`
  - `NotificationModal.tsx`
  - `MandatoryReviewModal.tsx`
  - `NotesModal.tsx`
  - `QuizPlayerModal.tsx`
  - `SkillAssessmentModal.tsx`
  - `CorporateInquiryModal.tsx`
  - `QuizModal.tsx`
  - `CertificateModal.tsx`
  - `AppUpdateModal.tsx`
  - `YouTubePlayerModal.tsx`
- [x] Hardened touch targets with minimum 44px boundaries or `hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}`.
- [x] Built automated regression test `scripts/verify_layout_and_safe_areas.js` (26/26 passing checks).

### Phase 10: "Buttery Smooth" Motion, Tactile Springs & Micro-Interactions
- [x] **Screen Transitions (`ScreenTransition.tsx`)**:
  - Added native-driven spring and fade entrance animations across all bottom tabs and sub-screens.
- [x] **Physical Spring Pressables (`SpringPressable.tsx`)**:
  - Added tactile scale physics (`scale: 0.96-0.97`) to all major CTAs (Enroll Now, Mark Complete, Submit Quiz, Live Workshops, Bundles).
- [x] **Living Commuter Mode Audio Waveform (`LiveAudioWaveform.tsx`)**:
  - 20-bar native-driven oscillating frequency visualizer running at 60 FPS.
- [x] **Circular Radial Progress Rings (`CircularProgressRing.tsx`)**:
  - SVG radial completion rings in `MyLearningScreen.tsx` and `CourseDetailScreen.tsx`.
- [x] **Milestone Celebration HUD (`CelebrationToast.tsx`)**:
  - Floating top toast with celebratory XP badges on lesson and quiz completion.

---

## 🛠️ In-Progress Tasks

- [ ] **Direct MFS Gateway SDK Transition**:
  - Coordinate with bKash and Nagad developer portals to transition from web-view token checkout to native in-app payment SDKs.
- [ ] **WordPress Staging SMS Gateway Linking**:
  - Coordinate with backend infrastructure to link SMS OTP endpoint with Bangladeshi telco gateway (Banglalink / Grameenphone SMS API).

---

## 🔮 Upcoming Tasks & Future Roadmap (Milestone 7)

### 1. Security & Fast Authentication
- [ ] **Biometric Login (Expo LocalAuthentication)**:
  - Add Fingerprint / Face ID unlock for instant access without re-entering password or waiting for SMS.
- [ ] **Remember Device & Refresh Token Rotation**:
  - Implement silent JWT token renewal to maintain session longevity safely.

### 2. Notifications & Re-Engagement
- [ ] **Push Notification Infrastructure (Expo / Firebase Cloud Messaging)**:
  - Implement automated daily streak notifications (*"🔥 Don't break your 5-day study streak!"*).
  - Instructor live session announcements and Zoom class reminders 15 minutes before broadcast.

### 3. Media & Offline Video Enhancements
- [ ] **Encrypted Offline Video Caching**:
  - Store encrypted video segments locally via `expo-file-system` for true flight/commute offline playback without internet.
- [ ] **Background Audio Service**:
  - Enable continuous commuter lecture playback even when the phone screen is locked.

### 4. Community & Social Learning
- [ ] **In-App Student Discussion & Q&A Replies**:
  - Allow learners to upvote top answers, attach code snippets, and receive push alerts when instructors reply.
- [ ] **Direct 1-on-1 Mentor Consultation Booking**:
  - Direct booking integration with Google Calendar / Calendly for executive mentorship.

### 5. Multi-Platform & App Store Submissions
- [ ] **iPad / Tablet Dual-Pane Layout**:
  - Responsive split-view layout for tablets (Curriculum on left, Video + Notes on right).
- [ ] **Google Play Console Production Submission**:
  - Build signed `.aab` production bundle.
  - Finalize store listing graphics, screenshots, privacy policy URL, and data safety questionnaire.
- [ ] **Apple App Store Preparation**:
  - iOS build profile and App Store review compliance guidelines.

---

## 📊 Verification & QA Commands Reference

```powershell
# 1. Typecheck TypeScript contracts (must exit with 0 errors)
npm run typecheck

# 2. Comprehensive Layout & Safe Area verification (26 checks)
node scripts/verify_layout_and_safe_areas.js

# 3. Static Codebase Health & Timer Hygiene Audit
node scripts/audit_app.js

# 4. Comprehensive UI/UX & Component Polish Audit
node scripts/comprehensive_ui_ux_audit.js

# 5. Local Standalone Android APK Build
powershell -ExecutionPolicy Bypass -File scripts/build_apk.ps1
```
