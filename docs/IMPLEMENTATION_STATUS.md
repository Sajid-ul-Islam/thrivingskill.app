# Authoritative Implementation & Verification Status

> **Single Source of Truth** for what is implemented in source code, wired to live backend endpoints, covered by automated tests, and verified on Staging/Production.  
> Consolidates and supersedes conflicting claims across legacy planning and feature documents.

- **App Release Version**: 1.4.0 (Build 10400) *(enforced via `scripts/sync_version.js` from `package.json`)*
- **Companion Plugin (Repository)**: `ts-mobile-bridge v1.3.0` ([ts-mobile-bridge.php](../backend-plugin/ts-mobile-bridge/ts-mobile-bridge.php))
- **Companion Plugin (Staging Observed 2026-11-26)**: Older deployment on `https://staging.thrivingskill.com` exposing `/config` (`latest_version: 1.1.0`), `/feed`, `/lessons/{id}`, `/register`, `/register-push-token`; repo `v1.3.0` hardening and endpoints await ZIP deployment.

---

## 1. Authoritative Feature Implementation Matrix

Legend:
- **Yes**: Implemented and verified in code/tests.
- **Partial**: Core workflow implemented, with an explicit scope limit recorded in Notes.
- **No / Local only**: UI or local state exists without server persistence or native implementation.
- **Needs staging/prod verification**: Implemented in repo, pending Staging/Production plugin deployment or credentialed E2E execution.

| Feature | UI | Local Logic | Backend | Automated Test | Production Verified | Notes & Observed Evidence |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Login (LearnPress JWT + WebView Handoff)** | Yes | Yes | Yes | Yes | To verify | `AuthModal.tsx`, `AuthService.login`, `SecureStorageService`; Staging `POST /learnpress/v1/token` verified live (`T1.4.1`, `T1.4.3`); JWT expiry helpers (`getJwtRemainingMs`, `isJwtExpiringSoon`); repo `v1.2.0` adds `/revoke-token` & `/auth/webview-handoff`; Jest `authService.test.ts` + `sessionLifecycle.test.tsx`. |
| **Registration & Email Verification** | Yes | Yes | Partial | Yes | To verify | Native email-mandatory onboarding (`AuthModal.tsx`, `AuthService.register`; unbacked Phone OTP `tsl/v1` removed); Staging active `POST /thrivingskill/v1/register`; OTP verify/resend in repo `v1.2.0`; Jest + `test_auth_registration_fixes.js`. |
| **Password Reset & Change Password** | Yes | Yes | Yes | Partial | To verify | `AuthModal.tsx`, `ChangePasswordModal.tsx`; LearnPress `/users/reset-password` & `/users/change-password` active on Staging; repo `v1.2.0` adds OTP reset confirmation. |
| **Payment (WooCommerce + SSLCommerz WebView)** | Yes | Yes | Yes | Partial | To verify | `PaymentModal.tsx`, `ProfileOrdersModal.tsx`, `usePaymentCheckout.ts`; authenticated WooCommerce WebView handoff + enrollment polling (`/wc/store/v1/cart` + SSLCommerz active on Staging; `/auth/webview-handoff` in repo `v1.2.0`). **No direct native bKash/Nagad/Rocket SDK.** Gateway fail/cancel/timeout scenarios require Layer 3 QA. |
| **Course Catalog, Search & Filters** | Yes | Yes | Yes | Yes | To verify | `HomeScreen.tsx`, `ExploreScreen.tsx`, `CoursesService`; `/thrivingskill/v1/feed` & `/learnpress/v1/courses` verified live on Staging; Okapi BM25 offline search (`bm25.ts`); Jest `catalogAndReviews.test.ts`, `companionHardening.test.tsx`. |
| **Course Enrollment (Free & Paid)** | Yes | Yes | Yes | Yes | To verify | `CourseDetailScreen.tsx`, `CoursesService.enrollCourse`, `SyncQueueManager`; `/learnpress/v1/courses/enroll` active on Staging; `/thrivingskill/v1/enrollments` & `/learning-state` in repo `v1.2.0`; Jest `enrollmentFlows.test.tsx`. |
| **Lesson Video Playback & CR-03 Auto-Play** | Yes | Yes | Yes | Partial | To verify | `LessonPlayerScreen.tsx`, `LessonPlayerModals.tsx` (5-second countdown), `VideoResolver`, `expo-video`; `GET /thrivingskill/v1/lessons/{id}` active; Jest `videoResolver.test.tsx` + `enrollmentFlows.test.tsx`; hardware playback covered in Layer 3. |
| **Recommendations (CR-01)** | Yes | Yes | Feeds | Yes | To verify | `recommendations.ts` (`computeRecommendedCourses`), category affinity & enrolled exclusion; wired to `TelemetryService` engagement tracking (`impressions`, `clicks`, `conversions`, CTR); Jest `recommendations.test.ts`, `aiStudyCapabilities.test.tsx`, `syncQueueAndPermissions.test.tsx`. |
| **Mandatory Reviews (CR-02)** | Yes | Yes | Needs staging deploy | Yes | No evidence | `MandatoryReviewModal.tsx`, `LearningContext.submitMandatoryCourseReview`, `CoursesService.submitCourseReview`. Staging exposes `/learnpress/v1/review/submit`; repo `v1.2.0` enforces server completion in `/thrivingskill/v1/courses/{id}/submit-review` (`reviewAndCertificateSync.test.tsx`, `TsMobileBridgeTest.php`). |
| **Certificates & Verification** | Yes | Yes | Needs staging deploy | Yes | No evidence | `CertificateModal.tsx`, `CompanionService.verifyCertificate`. Repo `v1.2.0` adds `GET /thrivingskill/v1/certificates/verify` & LP cert auto-grant on completion/review (`reviewAndCertificateSync.test.tsx`, `TsMobileBridgeTest.php`). Dev local cert helper (`unlockCertificateForDev`) is strictly restricted to `__DEV__` builds; backend is authoritative in production. |
| **Learner Profile Sync (CR-05)** | Yes | Yes | Yes | Yes | To verify | `ProfileScreen.tsx`, `EditProfileModal.tsx`, `UserService.updateProfile`; Unicode/Bangla sync via `GET/POST /wp/v2/users/me` + `/learnpress/v1/users/{id}`; `test_profile_and_checkout_sync.js`. |
| **Offline Study Deck & Sync Queue** | Yes | Yes | N/A | Yes | To verify | `OfflineStudyDeckModal.tsx`, `OfflineManager.ts` (JSON text guides), `SyncQueueManager.ts` (per-operation captured user scope, per-scope processor lock & storage mutex preventing cross-account races, payload validation rejecting privilege/malformed fields, deterministic `X-Idempotency-Key`, Jest `syncQueueAndPermissions.test.tsx`). |
| **Offline Video Download** | **Dropped** | Online streaming only | N/A | Yes | To verify | Offline video downloads removed per product scope (`OfflineManager.ts` caches text Study Guides only; `DownloadQualityModal.tsx` selects online streaming quality only; Jest `videoPlaybackAndCommute.test.tsx`). |
| **Push Notifications & Streak Scheduling** | Yes | Yes | Needs staging deploy | Yes | To verify | `NotificationService`, `habitNotificationQueue.ts`; `/thrivingskill/v1/register-push-token` active on Staging currently accepts unauthenticated POST (HTTP 200 found in 2026-11-26 Layer 2 run); repo `v1.3.0` locks down auth + `tsmb_push_tokens` table (`pushAndTelemetry.test.tsx`, `TsMobileBridgeTest.php`). |
| **AI Study Copilot (`ThriveGenHub` & Tutor)** | Yes | Yes | N/A | Yes | To verify | `GeminiNanoService` reports genuine unavailability without Android AICore weights (zero fake fallback or shipped keys); `AiTutorService` / `AiAssessmentService` search loaded lesson text via BM25 (`aiStudyCapabilities.test.tsx`). |
| **Paid eBooks** | Yes | Partial | Partial | Partial | No evidence | `EbookModal.tsx` opens `Env.SITE_URL` web checkout via `Linking.openURL` with local `AsyncStorage` purchase tracking (`test_paid_ebooks.js`); no server entitlement sync endpoint yet. |
| **Corporate Enterprise Inquiries (B2B)** | Yes | Yes | Needs staging deploy | Yes | No evidence | `CorporateInquiryModal.tsx`, `CompanionService.submitCorporateInquiry`; persists reference ID (`CORP-...`) & lead row in `tsmb_corporate_inquiries` (`Support & Leads` WP Admin tab) via `POST /thrivingskill/v1/corporate-inquiry`; Jest `persistenceAndEngagementSync.test.tsx` + `TsMobileBridgeTest.php`. |
| **Learner Support Tickets** | Yes | Yes | Needs staging deploy | Yes | No evidence | `SupportContactModal.tsx` + WhatsApp/Messenger channels; authenticated ticket creation & user-scoped status tracking (`TS-...`, `open` / `in_progress` / `resolved` + advisor reply) via `/thrivingskill/v1/support-tickets` (`Support & Leads` WP Admin tab); Jest + `TsMobileBridgeTest.php`. |
| **Gamification & Cross-Device Watch Sync** | Yes | Yes | Needs staging deploy | Yes | No evidence | `GamificationContext.tsx` & `LearningContext.tsx`; monotonic streak/XP merge & isolated `watch_positions` resume sync via `/thrivingskill/v1/engagement-sync` & `/learning-state`; `SpacedRepetitionService.ts` flashcards remain device-local. |
| **Biometric Authentication** | **Dropped** | Dropped | N/A | N/A | N/A | Incomplete non-functional UI toggle removed completely from app, translations, and roadmap. |

---

## 1b. Security, Role & Architecture Policies

- **Admin Permissions (`isUserAdmin` Policy Confirmed)**: Admin role detection in [AuthContext.tsx](../src/context/AuthContext.tsx) is strictly restricted to verified WordPress `administrator` / `admin` roles (matching server-side `manage_options` capability in [ts-mobile-bridge.php](../backend-plugin/ts-mobile-bridge/ts-mobile-bridge.php)). WordPress blog `editor` and LearnPress `instructor` accounts do **not** receive app administrator badges or course lock bypasses.
- **Authentication Session Renewal Strategy**: LearnPress JWT (`/learnpress/v1/token`) issues stateless tokens without refresh-token rotation, and raw user passwords are never cached for silent re-login. Session longevity relies on startup `AuthService.verifySession()`, client `exp` checks (`getJwtRemainingMs`, `isJwtExpiringSoon`), foreground profile validation, central single-flight HTTP `401` sign-out prompts, and `/revoke-token`. If longer offline session windows are later required, companion plugin Milestone 7 will introduce rotating opaque refresh tokens (`/thrivingskill/v1/auth/refresh`) stored in `SecureStorageService`.
- **Monitoring, Accessibility & Benchmarks**: `@sentry/react-native` PII/secret scrubbing (`beforeSend`, `beforeBreadcrumb`) and WCAG/UI accessibility properties are tested offline; production Sentry event delivery/alerts, TalkBack/VoiceOver audits, SSLCommerz redirect matrices, and real-device performance benchmarks are tracked for physical QA in [REAL_DEVICE_TEST_CHECKLIST.md](./REAL_DEVICE_TEST_CHECKLIST.md).

---

## 2. Companion Plugin Deployment Delta (`Staging` vs `Repo v1.3.0`)

Live `node scripts/test_layer2_staging_integration.js` execution on `2026-11-26` against `https://staging.thrivingskill.com` confirmed:
- Active WordPress / LearnPress / WooCommerce routes (`/learnpress/v1/token`, `/learnpress/v1/courses`, `/learnpress/v1/courses/enroll`, `/learnpress/v1/lessons/finish`, `/learnpress/v1/courses/finish`, `/learnpress/v1/review/submit`, `/wc/store/v1/cart`) and older `thrivingskill/v1` routes (`/config`, `/feed`, `/register`, `/register-push-token`).
- **Pending Staging/Production Plugin Deployment Gaps**:
  1. New `v1.2.0`–`v1.3.0` companion routes (`/enrollments`, `/learning-state`, `/engagement-sync`, `/courses/{id}/submit-review`, `/certificates/verify`, `/auth/webview-handoff`, `/revoke-token`, `/verify-registration`, `/resend-registration`, `/auth/reset-password/confirm`, `/corporate-inquiry`, `/support-tickets`) await plugin upload on Staging.
  2. Staging's older `POST /thrivingskill/v1/register-push-token` still returns HTTP 200 without authentication (fixed in repo `v1.3.0` + verified in `TsMobileBridgeTest.php`).

**Required Manual Staging Verification Once `ts-mobile-bridge.zip` (`v1.3.0`) Is Deployed:**
1. Re-run `node scripts/test_layer2_staging_integration.js --strict-companion --journey` with `STAGING_TEST_USERNAME` & `STAGING_TEST_PASSWORD` to verify HTTP 200 authenticated flows and 401/403 unauthenticated blocks end-to-end.
2. Complete a sandbox course checkout from a fresh email-registered account via single-use `/webview-handoff` and verify order attribution & `/enrollments` unlock.
3. Complete 100% lessons, submit mandatory review, and verify LearnPress certificate issuance & cross-device `/learning-state` sync.
4. Execute the physical device protocol in [`docs/REAL_DEVICE_TEST_CHECKLIST.md`](./REAL_DEVICE_TEST_CHECKLIST.md) (Layer 3) against Staging/Production APK/TestFlight builds.

---

## 3. Three-Layer Testing Model

| Layer | Scope | Automated Trigger | Documentation / Script |
| :--- | :--- | :--- | :--- |
| **Layer 1 — Automated Code & Contract Checks** | Version sync, TypeScript, ESLint, Prettier, Gitleaks, structural/timer audit, WCAG/UI-UX checks, PHPUnit (`TsMobileBridgeTest.php`), Jest coverage (16 suites / 93 tests), Expo prebuild & export | Every push & PR ([`ci.yml`](../.github/workflows/ci.yml)) | `npm run test:ci` / [`TEST_INFRA.md`](./TEST_INFRA.md) |
| **Layer 2 — Staging Backend Integration & E2E** | Live WP/LP/WC/Companion REST contracts, auth error differentiation (`T1.4.1`, `T1.4.3`), and authenticated Course E2E Journey | Weekly, release tags `v*.*.*`, manual dispatch ([`staging-e2e.yml`](../.github/workflows/staging-e2e.yml)) | [`scripts/test_layer2_staging_integration.js`](../scripts/test_layer2_staging_integration.js) |
| **Layer 3 — Real Physical Device QA** | Android & iOS physical devices: slow internet, network interruption, background/foreground, video playback, SSLCommerz gateway redirects, cold restart recovery | Manual release sign-off gate | [`REAL_DEVICE_TEST_CHECKLIST.md`](./REAL_DEVICE_TEST_CHECKLIST.md) |
