# Implementation Status

**App Release Version**: 1.4.0 (Build 10400)

## Verified Feature & Hardening Status

| Area | Status | Notes |
| --- | --- | --- |
| Session & Token Lifecycle | Implemented & Tested | Startup token validation, central 401 sign-out, session-scoped `/revoke-token`, no synthetic `ts_session_*` tokens |
| Paid Enrollment & Course Gate | Implemented & Tested | Paid LearnPress & WooCommerce orders counted and memoized per request; free-preview lessons allowed without auth |
| Email-Unique + Optional Username Auth | Implemented & Tested | Email mandatory & unique for registration; optional requested username kept if available; Phone OTP (`tsl/v1`) and synthetic `@phone.thrivingskill.com` emails removed; billing phone non-unique |
| Checkout WebView Sign-In Handoff | Implemented & Tested | Single-use `/webview-handoff` token exchanges for WordPress auth cookie and redirects to checkout; replay rejected |
| Backend-Authoritative Review & Certificates (Gap 1) | Implemented & Tested | `/learning-state`, `/courses/{id}/submit-review`, and `/certificates/verify` enforce server completion before review persistence and certificate issuance |
| Push Token & Streak Scheduling | Implemented & Tested | Purges legacy `ts_push_*` tokens, avoids storing fake tokens on failure, re-registers changed tokens, schedules daily streak reminders for `reminderHour` |
| Offline Search & AI Tutor Honesty | Implemented & Tested | Okapi BM25 keyword search (`src/services/search/bm25.ts`) replaces hash-bucket embeddings; AI Tutor reports honest unavailability with no client keys |
| Proxy IP & Mail Resilience | Implemented & Tested | Opt-in single trusted proxy header (`CF-Connecting-IP` / `X-Real-IP`) with proxy IP allowlist; `wp_mail_failed` logging and rate-limited `/resend-registration` |
| Release Hygiene, Telemetry & CI | Implemented & Tested | `runtimeVersion: { policy: "fingerprint" }`, Sentry `beforeBreadcrumb`/`beforeSend` PII/order-key scrubbing, PHPUnit plugin test suite, Jest coverage thresholds, pinned GitHub Actions & Gitleaks |

## Manual Verification Pending on Live Staging Server

- Deploy updated `backend-plugin/ts-mobile-bridge/ts-mobile-bridge.php` to staging/production WordPress and verify live end-to-end flows:
  1. Sign in with LearnPress/companion token, open paid lesson, verify push registration returns HTTP 200.
  2. Complete sandbox course checkout from a fresh email-registered account via single-use handoff and verify order attaches to that user.
  3. Complete 100% of lessons, submit mandatory review, and verify LearnPress certificate issuance & cross-device `/learning-state` sync.
  4. Verify Android EAS binary behavior (AICore fallback, Sentry test event, live push delivery) when a build is next triggered.
