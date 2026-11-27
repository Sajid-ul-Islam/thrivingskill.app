# Project Task List & Implementation Roadmap (TODO)
## Thriving Skills Mobile Application

**Current Version**: 1.4.0  
**Current Milestone**: Companion Plugin `v1.4.0` Deployed to Staging (Admin Analytics, Non-Admin Paywall & Full Completion/Certificate E2E Verified: `76 PASS | 0 WARN | 0 FAIL`)  
**Next Milestone**: Office Release Sign-Off (SSLCommerz Sandbox Click-Through, WordPress Course Meta Fix, Layer 3 Physical QA & Production Promotion)  
**Repository**: `https://github.com/Sajid-ul-Islam/thrivingskill.app`  
**Last Updated**: 2026-11-28

---

## 📅 Immediate Office TODO List (Next Session Priorities)

### P0 — Release Blockers (Must Complete Before Production Promotion)
- [ ] **Complete SSLCommerz Sandbox Checkout & Paid-Course Unlock (`Staging`)**:
  - Open SSLCommerz Sandbox (`testbox`) via `/auth/webview-handoff` for `ts_qa_subscriber` (`#24933`) / Course `#11580` (`৳750`, e.g. retry pending Order `#87794` or place a fresh order).
  - Use **Mobile Banking -> bKash/Nagad -> Success** on SSLCommerz Sandbox (no real card needed), then test a **Fail/Cancel** order too.
  - Verify `GET /wp-json/thrivingskill/v1/enrollments?course_id=11580` flips to `payment_confirmed: true, enrolled: true` on Success (and stays `false` on Fail/Cancel).
- [ ] **Fix Staging Checkout & Course Configuration Quirks Found During QA**:
  - Audit WooCommerce Checkout Field Editor (`thwcfd-field-password validate-required`) on `/checkout/`: disable or conditionally hide `Billing Password *` (`#password`) for already-logged-in users so mobile WebView handoff checkout never fails on an unexpected password prompt.
  - Switch Course `#49518` (*Creating Winning Mindset*) LearnPress **Evaluation** setting from `evaluate_quiz (70%)` -> **`evaluate_lesson`** on both **Staging** and **Production** (the course has `14` lessons and `0` quizzes; `ts-mobile-bridge v1.4.0` already repairs mobile progress cleanly, but fixing postmeta prevents web LearnPress students from hitting `grade = failed` on certificate claim).
- [ ] **Execute Physical Android & iOS Device QA (Layer 3)**:
  - Run the full protocol in [`docs/REAL_DEVICE_TEST_CHECKLIST.md`](./REAL_DEVICE_TEST_CHECKLIST.md) against Staging builds (Vimeo/Media3 playback, 5s autoplay countdown, SSLCommerz MFS redirect recovery, network drop retry, cold restart state).
- [ ] **Promote `ts-mobile-bridge v1.4.0` to Production (`https://thrivingskill.com`)**:
  - Build archive temporarily via `python scripts/package_plugin.py`, upload to `https://thrivingskill.com/wp-admin/plugin-install.php?tab=upload` (delete local `.zip` right after), and run read-only parity verification:
    ```powershell
    node scripts/test_layer2_staging_integration.js --base-url https://thrivingskill.com --strict-companion
    ```

### P1 — Automation, Cleanup & CI Hygiene
- [ ] **Eliminate Manual `.zip` Plugin Uploads**:
  - Choose and implement either a GitHub Actions Staging/Prod deploy workflow (SFTP/SSH + `wp plugin install --force`) or a WordPress `Update URI` / `update_plugins_*` auto-updater inside `ts-mobile-bridge`.
- [ ] **Fix Local `.env` & Verify GitHub Actions Secrets**:
  - Fix `.env` `STAGING_TEST_USERNAME` typo (`sajjadu15-634@diu.edu.bd` -> `sajjadur15-634@diu.edu.bd`) and confirm `STAGING_TEST_USERNAME` / `STAGING_TEST_PASSWORD` GitHub repository secrets match so [staging-e2e.yml](../.github/workflows/staging-e2e.yml) runs `100%` green in CI.
- [ ] **Staging Cleanup**:
  - Cancel/trash temporary QA pending Order `#87794` on Staging if you want Staging Analytics pending counts clean, and optionally delete inactive legacy `Thriving Skills Mobile Bridge 1.0.0` from Staging `plugins.php`.
- [ ] **Wire Paid eBook Server Entitlement Sync (`EbookModal.tsx`)**:
  - Replace local `AsyncStorage` eBook ownership tracking with server-verified WooCommerce/companion entitlement checks.

### ✅ Completed in This Session (`2026-11-27` – `2026-11-28`)
- [x] **Implemented WP Admin Analytics inside `ts-mobile-bridge v1.4.0`**: Six overview/user/enrollment/revenue/course/conversion sections, administrator `manage_options` REST routes (`/thrivingskill/v1/admin/analytics*`), Woo HPOS/legacy deduped confirmed revenue (`৳2,500.00`), manual/free exclusion, transient caching, CSV export — zero new plugin and zero DB schema modifications.
- [x] **Verified Non-Admin `Subscriber` Paywall & Role Guards Live on Staging**: Created `ts_qa_subscriber` (`#24933`, role `subscriber`); confirmed `403` on paid lessons (`#12061`, `#49521`, `/learnpress/v1/lessons/12061`), unpaid `/learnpress/v1/courses/enroll`, `/admin/analytics`, and `/submit-review`, with `200` on free previews (`#12058`, `#49519`).
- [x] **Fixed & Verified 100% Course Completion + Certificate Issuance Live on Staging**: Fixed zero-quiz stale `graduation='failed'` repair + `$wpdb->comments` course-review fallback in [ts-mobile-bridge.php](../backend-plugin/ts-mobile-bridge/ts-mobile-bridge.php), guarded Step 5/Step 7 in [test_layer2_staging_integration.js](../scripts/test_layer2_staging_integration.js), verified `14/14` completion on Course `#49518` (`200` `/submit-review`, LP Cert `#49900` `14bcaee91d0afcdd34e3cf288ebe23aa`, `/certificates/verify` `valid: true`), and passed `--strict-companion --journey` **76 PASS | 0 WARN | 0 SKIP | 0 FAIL**.

---

## 🚀 Completed Tasks

### Phase 1: Core Foundation & Presentation UI
- [x] React Native 0.76 + Expo 52/58 project scaffolding with TypeScript strict mode.
- [x] Responsive layout with Android safe area handling and notch accommodation.
- [x] Dark Mode and Light Mode theme engine with ThrivingSkills brand tokens (`#102F53`, `#E34234`, `#FFFFFF`/`#F5F7FA`, `#0B1420`/`#162538`; `#FFB606` reserved solely for rating stars).
- [x] Authentic Bengali typography and slogans (*"শিখুন এবং গড়ুন নিজের ক্যারিয়ার"*).
- [x] Bottom tab navigation hierarchy (Home, My Learning, Explore, Live Workshops, Profile).
- [x] Course card presentation with dynamic star ratings, instructor avatars, and BDT currency formatting (`৳১,৫০০`).
- [x] B2B Enterprise Team Hub modal UI (`CorporateInquiryModal.tsx` wired to `POST /thrivingskill/v1/corporate-inquiry` with reference IDs & admin inbox tracking).

### Phase 2: Live WordPress & LearnPress LMS Integration
- [x] Production WordPress REST API client integration (`https://thrivingskill.com/wp-json`).
- [x] 370+ Course catalog synchronization with live category taxonomy.
- [x] Course details, sections, and lesson curriculum hierarchy parser.
- [x] Resilient fallback curriculum generator for empty LearnPress course modules.
- [x] WordPress editorial blog articles synchronization with rich-text excerpt rendering.
- [x] Two-tier caching layer (L1 In-Memory + L2 Persistent AsyncStorage) with TTL invalidation.

### Phase 3: Commercial Upgrades & Checkout Integration
- [x] Hybrid WooCommerce + SSLCommerz WebView payment flow (`PaymentModal.tsx`, supporting bKash, Nagad, Rocket & cards via site checkout; no native MFS SDK).
- [x] Coupon and promo code handling via WooCommerce checkout & catalog pricing.
- [x] Instant LearnPress course enrollment polling upon WebView checkout confirmation (`/enrollments`).
- [x] Bilingual Bangla ⇄ English switching with persistent language preference (`LanguageContext.tsx`).
- [x] Interactive Lesson Player (`LessonPlayerScreen.tsx`) with commute mode audio and video playback.
- [x] Interactive Quiz assessment engine with immediate score calculations (`QuizPlayerModal.tsx`).
- [x] Offline Study Deck with `AsyncStorage` JSON lesson summaries/notes & `SyncQueueManager` (`OfflineManager.ts`; videos stream online only).
- [x] Daily gamification engine (learning streaks, XP points, and achievement badges stored locally in `GamificationContext.tsx`).

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
- [x] **CR-04: Native LearnPress JWT Authentication**:
  - Direct JWT token generation (`POST /learnpress/v1/token`) using WordPress username or email and password.
  - In-app student registration (`POST /learnpress/v1/token/register`) directly provisioning accounts in WordPress.
  - Token freshness validation (`POST /learnpress/v1/token/validate`) and persistent encrypted session hydration.
  - Native WordPress password recovery via `action=lostpassword` with deep link handling.
- [x] **CR-05: Authenticated Learner Profile & Analytics Dashboard**:
  - Active Enrolled Courses shelf with progress tracking and direct "Continue Learning" CTA.
  - Graduated Courses shelf with verified completion certificates and Brand Navy/Crimson completion badges (`#102F53` / `#E34234`).
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

### Phase 11: Simplified 4-Field Registration & Bi-directional Live DB Sync
- [x] **Native 4-Field Onboarding Form (`AuthModal.tsx`)**:
  - Replaced cumbersome registration requirements with 4 simple fields: Full Name, Email, Phone, Password.
  - Implemented automatic username generator (`generateUsernameFromEmail`) converting emails to clean handles (e.g. `sajidislam582`).
  - Added direct token exchange auto-login on registration completion without email confirmation link blocks.
- [x] **In-App Profile Management & Live Sync (`ProfileScreen.tsx`, `userService.ts`, `AuthContext.tsx`)**:
  - In-app editing for Name, Bio, Phone, City, Social Links, and Avatar persisting to `/wp/v2/users/me` and `/learnpress/v1/users/{id}`.
  - Automatic `AppState` foreground synchronization pulling web changes down to the mobile app on resume.
  - Pull-to-refresh on profile screen for on-demand live database sync.
- [x] **Companion Plugin Registration Endpoint**:
  - Integrated `/wp-json/thrivingskill/v1/register` companion endpoint with LearnPress fallback.

### Phase 12: Habit Notifications, Uniform Course Cards & Repository Restructuring
- [x] **Habit-Based Notification Queue (`habitNotificationQueue.ts`)**:
  - Scheduled contextual study reminders tuned to learner habit hours with 1-tap dismiss/clear action.
- [x] **Uniform Course Cards Layout**:
  - Standardized card heights (332dp), 16:9 thumbnail ratios, 2-line clamped titles (40dp), and aligned action footers across all screens and carousels.
- [x] **Centralized Documentation & Root Cleanup**:
  - Consolidated all 24+ markdown documents, proposals (.docx), and review PDFs into `docs/` with structured subfolders.
  - Moved local preview APK builds into `builds/`.
  - Cleaned root directory to only contain essential config and entry files.

- [x] **Living Commuter Mode Audio Waveform (`LiveAudioWaveform.tsx`)**:
  - 20-bar native-driven oscillating frequency visualizer running at 60 FPS.
- [x] **Circular Radial Progress Rings (`CircularProgressRing.tsx`)**:
  - SVG radial completion rings in `MyLearningScreen.tsx` and `CourseDetailScreen.tsx`.
- [x] **Milestone Celebration HUD (`CelebrationToast.tsx`)**:
  - Floating top toast with celebratory XP badges on lesson and quiz completion.

---

## 🛠️ Completed v1.2–v1.4 & Ongoing Backlog

- [x] **Deploy Companion Plugin `v1.4.0` (`ts-mobile-bridge`) to Staging**:
  - Deployed via WP Admin with Admin Analytics, `/enrollments`, `/learning-state`, `/engagement-sync`, `/courses/{id}/submit-review`, `/certificates/verify`, `/auth/webview-handoff`, `/corporate-inquiry`, `/support-tickets`, zero-quiz completion repair, & `$wpdb->comments` review fallback (**76 PASS | 0 WARN | 0 FAIL** on Staging; Production promotion tracked in P0 above).
- [x] **Connect Corporate Inquiry Modal (`CorporateInquiryModal.tsx`) to Backend Lead Endpoint**:
  - Persists to WordPress (`tsmb_corporate_inquiries`) with unique reference IDs (`CORP-...`), email alerts, and `Support & Leads` WP Admin inbox; `SupportContactModal.tsx` also tracks learner support tickets (`TS-...`) and `GamificationContext` / `LearningContext` sync streaks & watch positions.

---

## 🔮 Upcoming Tasks & Future Roadmap (Milestone 7)

### 1. Security & Session Longevity
- [ ] **Silent JWT Refresh / Token Rotation**:
  - Implement server-backed token renewal alongside session revocation (`/revoke-token`) to extend active sessions safely without re-login friction.

### 2. Notifications & Re-Engagement
- [ ] **Production Live Cohort & Streak Push Dispatch**:
  - Wire WordPress cron / admin triggers for instructor live-session reminders via `/thrivingskill/v1/register-push-token` (`tsmb_push_tokens`).

### 3. Media & Streaming Enhancements
- [x] **Online Video Streaming Only (No Offline Video Downloads)**:
  - All course lectures stream online via Vimeo Pro, YouTube, or direct Media3 HTTPS streams; `OfflineManager.ts` caches text study guides & notes only (`OfflineStudyDeckModal.tsx`).
- [ ] **Enhanced Background Audio Service**:
  - Continue optimizing lock-screen media controls for direct audio/MP4/HLS lesson streams.

### 4. Direct Native Payments & Store Submission
- [ ] **Native MFS Gateway Evaluation (Optional Post-Launch)**:
  - Keep compliant WooCommerce + SSLCommerz WebView checkout for Google Play release; evaluate direct MFS SDKs where policy-compatible.
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
