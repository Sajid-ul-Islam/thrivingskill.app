# Backend Persistence (Priority 2) & Staging Deployment Plan

> **For agentic workers:** Implementing natively in-session with `superpowers:executing-plans` discipline, TDD test coverage, and local verification before staging deployment.

**Goal:** Persist Corporate B2B inquiries, Learner Support tickets (with IDs and admin status tracking), and cross-device Study Engagement (streaks/XP + video watch positions) in `ts-mobile-bridge` (`v1.3.0`) and the React Native app, then package, verify, deploy to `staging.thrivingskill.com`, and smoke-test all critical API endpoints.

**Architecture:** Extend `TSMB_Lifecycle` (`ts-mobile-bridge.php`) with two custom tables (`tsmb_corporate_inquiries` and `tsmb_support_tickets`) plus user meta stores (`tsmb_watch_positions_v1`, `tsmb_gamification_v1`). Expose REST routes under `/thrivingskill/v1/`, manage tickets/leads in `TSMB_Admin`, wire React Native services/modals/contexts with timer-safe debounced sync and honest error/loading UI, verify all automated gates locally, build `ts-mobile-bridge.zip`, and deploy & verify on staging.

**Tech Stack:** WordPress PHP 7.4+ (PSR-12 + PHPUnit mocks), React Native 0.76 + Expo 58 + TypeScript, Jest + React Native Testing Library v14.

## Global Constraints
- Preserve brand identity tokens: `#102F53` (deep navy), `#E34234` (crimson), `#FFFFFF`/`#F5F7FA` light surfaces, `#0B1420`/`#162538` dark surfaces; `#FFB606` stars only.
- Enforce `ReturnType<typeof setTimeout>` inside `useRef` with unmount cleanup for all React timers (`AGENTS.md` Rule 3).
- Follow `backend-plugin/phpcs.xml` PSR-12 rules on PHP edits and `$wpdb->prepare` for all queries.
- Never fabricate free-preview enrollment in `userProgress`; keep `watch_positions` strictly isolated from `userProgress` for unenrolled paid courses.
- Do not trigger EAS/APK builds or `git push`; create local git commits and package plugin zip only.
- Never bypass CAPTCHA/Turnstile/WP-Admin authentication challenges automatically.

## Review Focus
1. **Unenrolled Preview Watch Position Isolation**: Syncing `watch_positions` for a free-preview lesson on an unpaid course must NEVER insert the course into `userProgress` (`enrolled_course_ids` remains authoritative).
2. **Failed/Offline Corporate & Support Submission Handling**: Network or 4xx/5xx failures on `CorporateInquiryModal` or `SupportContactModal` MUST NOT mark requests submitted; error messages stay visible for retry without clearing user inputs.
3. **Cross-User Ticket IDOR Prevention**: `GET /support-tickets` MUST filter strictly by `user_id = get_current_user_id()`, never exposing another learner's tickets or contact email.
4. **Monotonic Engagement & Timestamp Sync**: Syncing streaks/XP from a fresh secondary device MUST merge `max(xp)`, `max(totalStudyMinutes)`, union badges, and preserve per-day `dailyHistory` rather than zeroing server state.
5. **WordPress Schema Auto-Upgrade on Live Replace**: Updating plugin files on staging without deactivate/reactivate MUST run `TSMB_Lifecycle::maybe_upgrade()` (`TSMB_DB_VERSION = '1.3.0'`) so new MySQL tables exist cleanly.

---

### Task 1: Backend Plugin Database Schema, REST API & Admin Inbox (`v1.3.0`)

**Files:**
- Modify: `backend-plugin/ts-mobile-bridge/ts-mobile-bridge.php`
- Modify: `backend-plugin/tests/bootstrap.php`
- Modify: `backend-plugin/tests/TsMobileBridgeTest.php`

**Interfaces:**
- Constants: `TSMB_VERSION = '1.3.0'`, `TSMB_DB_VERSION = '1.3.0'`
- `TSMB_Lifecycle::get_leads_table(): string` (`{$wpdb->prefix}tsmb_corporate_inquiries`)
- `TSMB_Lifecycle::get_tickets_table(): string` (`{$wpdb->prefix}tsmb_support_tickets`)
- `POST /thrivingskill/v1/corporate-inquiry`: public rate-limited (`5/hr`) endpoint creating `CORP-...` reference, inserting into `tsmb_corporate_inquiries`, emailing support address, returning `{ status: 'success', reference_id, submitted_at, inquiry_status: 'new' }` (HTTP 201).
- `GET /thrivingskill/v1/support-tickets`: authenticated endpoint returning `{ status: 'success', tickets: [...] }` scoped to current user.
- `POST /thrivingskill/v1/support-tickets`: authenticated rate-limited (`10/hr`) endpoint creating `TS-...` ticket in `tsmb_support_tickets`, emailing support address, returning HTTP 201 with `{ status: 'success', ticket }`.
- `POST /thrivingskill/v1/engagement-sync` + extended `GET /thrivingskill/v1/learning-state`: persists/returns normalized `watch_positions` (`tsmb_watch_positions_v1`) and monotonic `gamification` (`tsmb_gamification_v1`).
- `TSMB_Admin`: new `Support & Leads` tab (`?page=thriving-skills-app&tab=inbox`) with nonce-protected status updates & ticket replies.

- [ ] Add PHPUnit tests in `backend-plugin/tests/TsMobileBridgeTest.php` (plus `TSMB_Fake_WPDB` table storage stubs in `bootstrap.php`) covering corporate inquiry validation/rate limits, user-scoped support ticket creation & retrieval, and engagement sync monotonic merge + `get_learning_state` inclusion.
- [ ] Implement schema, REST endpoints, and admin inbox handlers in `ts-mobile-bridge.php` matching `phpcs.xml`.
- [ ] Verify PHP syntax/style alignment manually against `phpcs.xml` and Node script parity (since PHP/Composer run in CI).

---

### Task 2: API Registry & CompanionService Client Methods

**Files:**
- Modify: `src/services/api/endpoints.ts`
- Modify: `src/services/api/companionService.ts`
- Test: `src/__tests__/persistenceAndEngagementSync.test.tsx` (written first)

**Interfaces:**
- `Endpoints.COMPANION.CORPORATE_INQUIRY`
- `Endpoints.COMPANION.SUPPORT_TICKETS`
- `Endpoints.COMPANION.ENGAGEMENT_SYNC`
- Types in `companionService.ts`: `CorporateInquiryPayload`, `CorporateInquiryReceipt`, `SupportTicketRecord`, `CreateSupportTicketPayload`, `ServerGamificationSnapshot`, extended `ServerLearningState` (`watchPositions?`, `gamification?`)
- Methods in `CompanionService`: `submitCorporateInquiry`, `getSupportTickets`, `createSupportTicket`, `syncEngagementState`, plus coalesced `inFlightLearningStatePromise` inside `fetchLearningState`.

- [ ] Write failing Jest tests in `src/__tests__/persistenceAndEngagementSync.test.tsx` asserting API payloads, error propagation, coalesced `/learning-state` parsing of `watch_positions` & `gamification`.
- [ ] Run Jest test to confirm initial failure before implementation.
- [ ] Implement routes in `endpoints.ts` and typed methods in `companionService.ts`.
- [ ] Re-run Jest test suite and confirm green.

---

### Task 3: Corporate Lead & Support Ticket Modals

**Files:**
- Modify: `src/components/modals/CorporateInquiryModal.tsx`
- Modify: `src/components/modals/SupportContactModal.tsx`
- Test: `src/__tests__/persistenceAndEngagementSync.test.tsx`

**Interfaces:**
- `CorporateInquiryModal`: awaits `CompanionService.submitCorporateInquiry(...)`, renders loading state, displays `referenceId` in confirmation card, surfaces inline error banner without resetting form if submission fails.
- `SupportContactModal`: keeps WhatsApp/Messenger/Helpline/Facebook channels; adds In-App Support Ticket composer + My Tickets list (status badge `open`/`in_progress`/`resolved` + advisor reply) loaded via `CompanionService.getSupportTickets()` when signed in, or clean Sign-In prompt CTA when logged out.

- [ ] Add failing RNTL v14 tests in `src/__tests__/persistenceAndEngagementSync.test.tsx` covering `CorporateInquiryModal` real API success receipt (`CORP-...`) & failure recovery, and `SupportContactModal` ticket creation, listing, and guest prompt.
- [ ] Implement updates in `CorporateInquiryModal.tsx` and `SupportContactModal.tsx` adhering to `MIN_TOUCH_TARGET`, `#102F53`/`#E34234` palette, and dark/light theme parity.
- [ ] Run Jest test suite and verify pass with zero overlapping `act()` warnings.

---

### Task 4: Cross-Device Study Engagement & Watch Position Sync

**Files:**
- Modify: `src/context/GamificationContext.tsx`
- Modify: `src/context/LearningContext.tsx`
- Test: `src/__tests__/persistenceAndEngagementSync.test.tsx`

**Interfaces:**
- `GamificationContext`: removes raw un-tracked `setTimeout`, hydrates monotonic snapshot from `CompanionService.fetchLearningState()` when authenticated (`HttpClient.getAuthToken()`), and debounces `CompanionService.syncEngagementState({ gamification })` inside a `useRef<ReturnType<typeof setTimeout> | null>` cleaned up on unmount.
- `LearningContext`: hydrates non-enrolled `watchPositions` cleanly into `watchPositionsRef` from `serverLearning.watchPositions` without mutating `userProgress` for unenrolled courses, and debounces `CompanionService.syncEngagementState({ watch_positions })` inside a `useRef<ReturnType<typeof setTimeout> | null>` cleaned up on unmount.

- [ ] Add failing Jest tests covering monotonic merge in `GamificationProvider`, watch-position sync without preview enrollment leakage, and unmount timer cleanup.
- [ ] Implement sync logic in `GamificationContext.tsx` and `LearningContext.tsx`.
- [ ] Run all Jest tests (`npm test -- --runInBand --coverage`), `npm run format`, and full verification (`version:check`, `format:check`, `typecheck`, `lint`, `audit`, `test:structural`, `build:dry-run`), plus `node scripts/package_plugin.js`.

---

### Task 5: Package Plugin, Deploy to Staging & Smoke-Test Live Endpoints

**Files:**
- Update: `docs/REAL_DEVICE_TEST_CHECKLIST.md` (mark staging deployment / REST smoke checks verified if executed cleanly)

- [ ] Stage and create clean local git commit before deployment (no push, no APK build).
- [ ] Package `backend-plugin/ts-mobile-bridge.zip` via `node scripts/package_plugin.js`.
- [ ] Check staging (`staging.thrivingskill.com`) WP Admin availability via `browser` subagent; upload `ts-mobile-bridge.zip` (or update plugin) and verify REST routes (`/config`, `/feed`, `/lessons/{id}`, `/learning-state`, `/corporate-inquiry`, `/support-tickets`, `/engagement-sync`) and checkout handoff cleanly, reporting exact observed results.
