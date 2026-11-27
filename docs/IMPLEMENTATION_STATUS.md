# Authoritative Implementation & Verification Status

> **Single Source of Truth** for what is implemented in source code, wired to live backend endpoints, covered by automated tests, and verified on Staging/Production.  
> Consolidates and supersedes conflicting claims across legacy planning and feature documents.

- **App Release Version**: 1.4.0 (Build 10400) *(enforced via `scripts/sync_version.js` from `package.json`)*
- **Companion Plugin (Repository)**: `ts-mobile-bridge v1.3.0` ([ts-mobile-bridge.php](../backend-plugin/ts-mobile-bridge/ts-mobile-bridge.php))
- **Companion Plugin (Staging Observed 2026-11-27)**: **`ts-mobile-bridge v1.3.0` deployed & Active on `https://staging.thrivingskill.com`** (`/config` reports `plugin_version: 1.3.0`, `latest_version: 1.4.0`; legacy `Thriving Skills Mobile Bridge 1.0.0` Inactive; **Production (`https://thrivingskill.com`) still awaits promotion** after authenticated `--journey` + Layer 3 QA).

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
| **Recommendations (CR-01)** | Yes | Yes | Feeds | Yes | To verify | `recommendations.ts` (`computeRecommendedCourses`), category affinity & enrolled exclusion; wired to `AnalyticsService` / `TelemetryService` click-through attribution (`recommendationId`, `source`, `position`, `learnerId`/`sessionId`, `clickTimestamp`, `conversionTimestamp`, `attributionWindowMs`); Jest `recommendations.test.ts`, `aiStudyCapabilities.test.tsx`, `syncQueueAndPermissions.test.tsx`, `recommendationAttribution.test.tsx`. |
| **Mandatory Reviews (CR-02)** | Yes | Yes | Staging deployed (`v1.3.0`) | Yes | To verify on Prod | `MandatoryReviewModal.tsx`, `LearningContext.submitMandatoryCourseReview`, `CoursesService.submitCourseReview`. Staging `v1.3.0` exposes & guards `POST /thrivingskill/v1/courses/{id}/submit-review` (`HTTP 401` unauthenticated verified live; authenticated journey + Production promotion pending). |
| **Certificates & Verification** | Yes | Yes | Staging deployed (`v1.3.0`) | Yes | To verify on Prod | `CertificateModal.tsx`, `CompanionService.verifyCertificate`. Staging `v1.3.0` exposes `GET /thrivingskill/v1/certificates/verify` (`probe=200`, `empty=400` verified live; `TsMobileBridgeTest.php`). Dev local cert helper (`unlockCertificateForDev`) is strictly restricted to `__DEV__` builds. |
| **Learner Profile Sync (CR-05)** | Yes | Yes | Yes | Yes | To verify | `ProfileScreen.tsx`, `EditProfileModal.tsx`, `UserService.updateProfile`; Unicode/Bangla sync via `GET/POST /wp/v2/users/me` + `/learnpress/v1/users/{id}`; `test_profile_and_checkout_sync.js`. |
| **Offline Study Deck & Sync Queue** | Yes | Yes | N/A | Yes | To verify | `OfflineStudyDeckModal.tsx`, `OfflineManager.ts` (JSON text guides), `SyncQueueManager.ts` (per-operation captured user scope, per-scope processor lock & storage mutex preventing cross-account races, payload validation rejecting privilege/malformed fields, deterministic `X-Idempotency-Key`, Jest `syncQueueAndPermissions.test.tsx`). |
| **Offline Video Download** | **Dropped** | Online streaming only | N/A | Yes | To verify | Offline video downloads removed per product scope (`OfflineManager.ts` caches text Study Guides only; `DownloadQualityModal.tsx` selects online streaming quality only; Jest `videoPlaybackAndCommute.test.tsx`). |
| **Push Notifications & Streak Scheduling** | Yes | Yes | Staging deployed (`v1.3.0`) | Yes | To verify on Prod | `NotificationService`, `habitNotificationQueue.ts`; Staging `v1.3.0` rejects unauthenticated `POST /thrivingskill/v1/register-push-token` with `HTTP 401` (`tsmb_push_tokens` table + WP Admin broadcast hub verified `2026-11-27`; `pushAndTelemetry.test.tsx`, `TsMobileBridgeTest.php`). |
| **AI Study Copilot (`ThriveGenHub` & Tutor)** | Yes | Yes | N/A | Yes | To verify | `GeminiNanoService` reports genuine unavailability without Android AICore weights (zero fake fallback or shipped keys); `AiTutorService` / `AiAssessmentService` search loaded lesson text via BM25 (`aiStudyCapabilities.test.tsx`). |
| **Paid eBooks** | Yes | Partial | Partial | Partial | No evidence | `EbookModal.tsx` opens `Env.SITE_URL` web checkout via `Linking.openURL` with local `AsyncStorage` purchase tracking (`test_paid_ebooks.js`); no server entitlement sync endpoint yet. |
| **Corporate Enterprise Inquiries (B2B)** | Yes | Yes | Staging deployed (`v1.3.0`) | Yes | To verify on Prod | `CorporateInquiryModal.tsx`, `CompanionService.submitCorporateInquiry`; Staging `v1.3.0` exposes `POST /thrivingskill/v1/corporate-inquiry` (`HTTP 400` validation & `Support & Leads` WP Admin tab verified `2026-11-27`; `persistenceAndEngagementSync.test.tsx`, `TsMobileBridgeTest.php`). |
| **Learner Support Tickets** | Yes | Yes | Staging deployed (`v1.3.0`) | Yes | To verify on Prod | `SupportContactModal.tsx` + WhatsApp/Messenger channels; Staging `v1.3.0` guards `/thrivingskill/v1/support-tickets` (`HTTP 401` unauthenticated `GET`/`POST` & `Support & Leads` WP Admin tab verified `2026-11-27`). |
| **Gamification & Cross-Device Watch Sync** | Yes | Yes | Staging deployed (`v1.3.0`) | Yes | To verify on Prod | `GamificationContext.tsx` & `LearningContext.tsx`; Staging `v1.3.0` guards `/thrivingskill/v1/learning-state` & `/engagement-sync` (`HTTP 401` unauthenticated verified `2026-11-27`; monotonic sync verified in Jest + PHPUnit, authenticated Staging `--journey` pending credentials). |
| **Biometric Authentication** | **Dropped** | Dropped | N/A | N/A | N/A | Incomplete non-functional UI toggle removed completely from app, translations, and roadmap. |

---

## 1b. Security, Role & Architecture Policies

- **Admin Permissions (`isUserAdmin` Policy Confirmed)**: Admin role detection in [AuthContext.tsx](../src/context/AuthContext.tsx) is strictly restricted to verified WordPress `administrator` / `admin` roles (matching server-side `manage_options` capability in [ts-mobile-bridge.php](../backend-plugin/ts-mobile-bridge/ts-mobile-bridge.php)). WordPress blog `editor` and LearnPress `instructor` accounts do **not** receive app administrator badges or course lock bypasses.
- **Authentication Session Renewal Strategy**: LearnPress JWT (`/learnpress/v1/token`) issues stateless tokens without refresh-token rotation, and raw user passwords are never cached for silent re-login. Session longevity relies on startup `AuthService.verifySession()`, client `exp` checks (`getJwtRemainingMs`, `isJwtExpiringSoon`), foreground profile validation, central single-flight HTTP `401` sign-out prompts, and `/revoke-token`. If longer offline session windows are later required, companion plugin Milestone 7 will introduce rotating opaque refresh tokens (`/thrivingskill/v1/auth/refresh`) stored in `SecureStorageService`.
- **Monitoring, Accessibility & Benchmarks**: `@sentry/react-native` PII/secret scrubbing (`beforeSend`, `beforeBreadcrumb`) and WCAG/UI accessibility properties are tested offline; production Sentry event delivery/alerts, TalkBack/VoiceOver audits, SSLCommerz redirect matrices, and real-device performance benchmarks are tracked for physical QA in [REAL_DEVICE_TEST_CHECKLIST.md](./REAL_DEVICE_TEST_CHECKLIST.md).

---

## 2. Companion Plugin Deployment Delta (`Staging v1.3.0` vs `Production`)

`ts-mobile-bridge v1.3.0` was uploaded and activated on `https://staging.thrivingskill.com` on `2026-11-27` (`plugins.php` Active `v1.3.0`; legacy `Thriving Skills Mobile Bridge 1.0.0` Inactive; Mobile App Command Center & `Support & Leads` tabs rendering cleanly with 0 PHP errors). Live `node scripts/test_layer2_staging_integration.js --strict-companion` passed **47 / 47** checks (`0 WARN | 0 FAIL`), including unauthenticated free-preview lesson `#49519` (`HTTP 200`) and paid-lesson paywall `#49521` (`HTTP 401`):
- All `v1.2`–`v1.3` companion endpoints (`/enrollments`, `/learning-state`, `/engagement-sync`, `/courses/{id}/submit-review`, `/certificates/verify`, `/auth/webview-handoff`, `/revoke-token`, `/verify-registration`, `/resend-registration`, `/auth/reset-password/confirm`, `/corporate-inquiry`, `/support-tickets`) active and reporting `plugin_version: 1.3.0` / `latest_version: 1.4.0`.
- Unauthenticated security guards verified live (`HTTP 401`) on paid lesson `/lessons/49521`, `/register-push-token`, `/enrollments`, `/learning-state`, `/revoke-token`, `/auth/webview-handoff`, `/courses/{id}/submit-review`, `/support-tickets` (`GET`/`POST`), and `/engagement-sync`, alongside `HTTP 400` `/corporate-inquiry` validation and `/certificates/verify` contract checks.

**Remaining Release Promotion Sequence (Staging Authenticated QA -> Production):**
1. *(Optional cleanup on Staging)* Remove the Inactive legacy `Thriving Skills Mobile Bridge` (`1.0.0`) plugin from Staging `plugins.php`.
2. Run `node scripts/test_layer2_staging_integration.js --strict-companion --journey` with `STAGING_TEST_USERNAME` & `STAGING_TEST_PASSWORD` (including CI workflow secrets) to verify authenticated `/enrollments`, `/learning-state`, monotonic `/engagement-sync`, `/support-tickets`, `/auth/webview-handoff`, unenrolled `403` paywall, `/submit-review`, `/certificates/verify`, and `/revoke-token`.
3. Complete a sandbox course checkout from a fresh email-registered account via single-use `/auth/webview-handoff` and verify order attribution & `/enrollments` unlock.
4. Execute the physical device protocol in [`docs/REAL_DEVICE_TEST_CHECKLIST.md`](./REAL_DEVICE_TEST_CHECKLIST.md) (Layer 3) against Staging APK/TestFlight builds.
5. Promote `ts-mobile-bridge.zip` (`v1.3.0`) to **Production** (`https://thrivingskill.com/wp-admin`) and verify read-only contract parity via `node scripts/test_layer2_staging_integration.js --base-url https://thrivingskill.com --strict-companion`.

---

## 3. Three-Layer Testing Model

| Layer | Scope | Automated Trigger | Documentation / Script |
| :--- | :--- | :--- | :--- |
| **Layer 1 — Automated Code & Contract Checks** | Version sync, TypeScript, ESLint, Prettier, Gitleaks, structural/timer audit, WCAG/UI-UX checks, PHPUnit unit (`tests/Unit/TsMobileBridgeTest.php`) + real WP/LearnPress/WooCommerce integration (`tests/Integration/WordPressIntegrationTest.php`), Jest coverage, Expo prebuild & export | Every push & PR ([`ci.yml`](../.github/workflows/ci.yml)) | `npm run test:ci` / [`TEST_INFRA.md`](./TEST_INFRA.md) |
| **Layer 2 — Staging Backend Integration & E2E** | Live WP/LP/WC/Companion v1.2–v1.3 REST contracts, `plugin_version` parity, auth/paywall error checks, and authenticated Course E2E Journey | Every push to `master`, weekly, release tags `v*.*.*`, manual dispatch ([`staging-e2e.yml`](../.github/workflows/staging-e2e.yml)), and pre-build release gate in [`eas-build.yml`](../.github/workflows/eas-build.yml) | [`scripts/test_layer2_staging_integration.js`](../scripts/test_layer2_staging_integration.js) |
| **Layer 3 — Real Physical Device QA** | Android & iOS physical devices: slow internet, network interruption, background/foreground, video playback, SSLCommerz gateway redirects, cold restart recovery | Manual release sign-off gate | [`REAL_DEVICE_TEST_CHECKLIST.md`](./REAL_DEVICE_TEST_CHECKLIST.md) |
