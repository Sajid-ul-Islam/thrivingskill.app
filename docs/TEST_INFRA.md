# Three-Layer Testing Architecture & Verification Infrastructure

> Replaces the earlier conceptual dual-track proposal and removes the nonexistent `scripts/e2e_full_suite.js` reference.  
> See [`IMPLEMENTATION_STATUS.md`](./IMPLEMENTATION_STATUS.md) for current verification status across every feature.

---

## 1. Three-Layer Quality Strategy

Thriving Skills verifies release readiness across three complementary layers so static checks never masquerade as live backend or hardware proofs:

| Layer | Purpose | Runs Automatically In | Entrypoint |
| :--- | :--- | :--- | :--- |
| **Layer 1 — Automated Code & Contract Checks** | Static types, lint, format, security scan, version sync, structural hygiene, PHPUnit unit + real WordPress/LearnPress/WooCommerce integration suites, Jest unit/component suite (with mocked network/native bridges), Expo bundle dry-run | [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) on every push & PR | `npm run test:ci` |
| **Layer 2 — Staging Backend Integration & E2E Journey** | Live HTTP verification against `https://staging.thrivingskill.com` (v1.2 & v1.3 route contracts, plugin version parity, auth/paywall boundaries, and authenticated Course Journey E2E) | [`.github/workflows/staging-e2e.yml`](../.github/workflows/staging-e2e.yml) (push to `master`, tags `v*.*.*`, weekly, manual dispatch) & release gate in [`.github/workflows/eas-build.yml`](../.github/workflows/eas-build.yml) | `npm run test:staging` / `npm run test:e2e:journey` |
| **Layer 3 — Real Physical Device QA** | Android & iOS physical hardware validation (3G throttling, offline/online transitions, background/foreground, video streams, WebView SSLCommerz gateway redirects, cold restart) | Pre-release manual QA gate | [`REAL_DEVICE_TEST_CHECKLIST.md`](./REAL_DEVICE_TEST_CHECKLIST.md) |

---

## 2. Layer 1 — Automated Code & Component Testing

Layer 1 requires **no network access or Staging credentials** and runs in CI on every commit:

1. **Version Source-of-Truth Gate (`scripts/sync_version.js --check`)**:
   - Validates `package.json`, `package-lock.json`, `app.json` (`version` & monotonic `versionCode`), `src/config/appVersion.ts`, companion plugin defaults (`ts-mobile-bridge.php`), and documentation match, with no hardcoded runtime `'1.4.x'` literals outside `src/config/appVersion.ts`.
2. **TypeScript, ESLint, Prettier & Secret Scans**:
   - `npm run typecheck` (`tsc --noEmit`, 0 errors required).
   - `npm run lint`, `npm run format:check`, Gitleaks secret scan, `npm audit`.
3. **Jest Unit & Component Suite (`npm run test:coverage`)**:
   - Mocked unit/component suites under `src/__tests__/`:
     - `authService.test.ts` & `sessionLifecycle.test.tsx` (JWT login/expiry/refresh, SecureStore hydration)
     - `catalogAndReviews.test.ts` & `reviewAndCertificateSync.test.tsx` (catalog normalization, mandatory review submission, certificate verification)
     - `enrollmentFlows.test.tsx`, `PaymentModal.test.tsx`, `checkoutHelpers.test.ts` (enrollment flow, WebView checkout & autofill helpers)
     - `aiStudyCapabilities.test.tsx`, `ThriveGenHub.test.tsx`, `recommendations.test.ts`, `videoResolver.test.tsx`, `pushAndTelemetry.test.tsx`, `companionHardening.test.tsx`, `httpClient.test.ts`, `env.test.ts`, `navigationAndDeepLinks.test.tsx`
4. **Structural & Hygiene Audits (`npm run test:structural` / `scripts/run_all_tests.js`)**:
   - `scripts/audit_app.js`: broken imports, missing `StyleSheet` keys, unmanaged timers (`NodeJS.Timeout` or uncleaned `setTimeout`/`setInterval`), empty handlers.
   - Domain structural verifiers (`test_security_hardening.js`, `test_optimizations.js`, `verify_ui_ux_laws.js`, `verify_wcag_contrast.js`, `verify_ux_principles.js`, `test_profile_and_checkout_sync.js`, `test_paid_ebooks.js`, `test_auth_registration_fixes.js`, `verify_dual_environment.js`).
5. **WordPress Companion Plugin Tests & Prebuild**:
   - PHP syntax lint, PHPCS, isolated PHPUnit unit suite (`backend-plugin/phpunit.xml.dist` -> `backend-plugin/tests/Unit/TsMobileBridgeTest.php`), real MySQL WordPress + LearnPress + WooCommerce integration suite (`backend-plugin/phpunit.integration.xml.dist` -> `backend-plugin/tests/Integration/WordPressIntegrationTest.php`, provisioned via `backend-plugin/bin/install-wp-tests.sh`), plugin ZIP packaging, Android `expo prebuild --platform android`, and `expo export --dump-sourcemap=false`.

---

## 3. Layer 2 — Live Staging Backend Integration & E2E Journeys

Script: [`scripts/test_layer2_staging_integration.js`](../scripts/test_layer2_staging_integration.js)  
Workflow: [`.github/workflows/staging-e2e.yml`](../.github/workflows/staging-e2e.yml)

### What Layer 2 Verifies Against `https://staging.thrivingskill.com`:
- **Health & Route Contracts**: `/wp-json` discovery, `/thrivingskill/v1/config` (`plugin_version` parity check against `TSMB_VERSION`), `/thrivingskill/v1/feed`, `/thrivingskill/v1/lessons/{id}`, `/learnpress/v1/courses`, `/wc/store/v1/cart`, and deployment audit for `ts-mobile-bridge v1.2.0` + `v1.3.0` endpoints (`/enrollments`, `/learning-state`, `/courses/{id}/submit-review`, `/certificates/verify`, `/auth/webview-handoff`, `/revoke-token`, `/verify-registration`, `/resend-registration`, `/auth/reset-password/confirm`, `/corporate-inquiry`, `/support-tickets`, `/engagement-sync`). `--strict-companion` fails when the Staging server is missing expected endpoints or reports a mismatched plugin version.
- **Auth & Paywall Security Boundaries**:
  - `T1.4.3`: Empty username (`POST /learnpress/v1/token`) returns HTTP 403 `[lp_jwt_auth] empty_username`.
  - `T1.4.1`: Invalid username (`POST /learnpress/v1/token`) returns HTTP 403 `[lp_jwt_auth] invalid_username`.
  - Unauthenticated requests to `/wp/v2/users/me`, `/thrivingskill/v1/register-push-token`, paid `/lessons/{id}`, `/enrollments`, `/learning-state`, `/support-tickets`, and `/engagement-sync` are rejected with HTTP 401/403.
- **End-to-End Course Journey (`--journey`)**:
  Executed on Staging E2E runs (`staging-e2e.yml`) and release gate (`eas-build.yml`), failing loudly if `STAGING_TEST_USERNAME` / `STAGING_TEST_PASSWORD` secrets are missing (unless `--allow-unauthenticated-skip` is passed manually):
  1. Learner Login (`POST /learnpress/v1/token`) & JWT validation (`/token/validate`)
  2. Profile bi-directional round-trip sync & restore (`GET`/`POST /wp/v2/users/me`)
  3. Support ticket read (`GET /thrivingskill/v1/support-tickets`) & monotonic watch-position engagement sync (`POST /thrivingskill/v1/engagement-sync`)
  4. Course & lesson catalog inspection (`/learnpress/v1/courses/{id}`, `/thrivingskill/v1/lessons/{id}`)
  5. Paid course checkout WebView handoff readiness (`/thrivingskill/v1/auth/webview-handoff`)
  6. Course enrollment (`POST /learnpress/v1/courses/enroll`)
  7. Lesson completion (`POST /learnpress/v1/lessons/finish`)
  8. Course completion (`POST /learnpress/v1/courses/finish`)
  9. Mandatory/course review submission (`/thrivingskill/v1/courses/{id}/submit-review` or LP `/learnpress/v1/review/submit`)
  10. Certificate verification (`GET /thrivingskill/v1/certificates/verify`)

> **Important Note on Paid Gateway Redirects**: Live bKash/Nagad/card redirects through SSLCommerz require human/OTP gateway interaction and are therefore verified in **Layer 3 (Real Physical Device QA)** rather than headless Node requests.

---

## 4. Layer 3 — Real Physical Device QA

Complete [`REAL_DEVICE_TEST_CHECKLIST.md`](./REAL_DEVICE_TEST_CHECKLIST.md) on physical Android and iOS hardware before submitting a Play Store AAB or TestFlight build.

---

## 5. Quick Command Reference

```bash
# Layer 1 — Offline Version Sync, Static Checks, Structural Suite & Jest Coverage
npm run test:ci

# Layer 1 — WordPress Companion Plugin PHPUnit Suite
npm run test:php

# Layer 2 — Staging Read-Only Contracts & Auth Security Boundaries
npm run test:staging

# Layer 2 — Full Authenticated Staging Course E2E Journey
STAGING_TEST_USERNAME=your_staging_user STAGING_TEST_PASSWORD=your_password npm run test:e2e:journey

# Enforce v1.2.0 Companion Plugin Endpoints (Release Gate)
node scripts/test_layer2_staging_integration.js --strict-companion --journey
```
