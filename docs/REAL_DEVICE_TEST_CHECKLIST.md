# Layer 3: Real Physical Device QA Checklist

> Manual pre-release verification protocol for Android and iOS physical hardware prior to Play Store / App Store promotion.  
> Complete **Layer 1** (`npm run test:ci`) and **Layer 2** (`npm run test:e2e:journey`) before executing this checklist.

---

## Release Sign-Off Header

- **Target Release Version**: ______________________ (must match `package.json` & `app.json`)
- **Build Artifact / Commit SHA**: ______________________________________________
- **Environment Tested**: `[ ] Staging (staging.thrivingskill.com)`  `[ ] Production (thrivingskill.com)`
- **QA Operator / Date**: _____________________________________________________

---

## 1. Device Hardware Matrix

| Platform | Device Model | OS Version | Build Type | Status (`PASS`/`FAIL`) | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Android (Primary) | ____________________ | Android ____ | Preview/Release APK/AAB | [ ] PASS / [ ] FAIL | |
| Android (Low-RAM / Mid-Tier) | ____________________ | Android ____ | Release APK | [ ] PASS / [ ] FAIL | |
| iOS (Physical Device) | ____________________ | iOS ____ | TestFlight / Dev Client | [ ] PASS / [ ] FAIL | |

---

## 2. Core Functional & Hardware Scenarios

### A. Cold Start, App Version Gate & Session Recovery
- [ ] **Splash & Config Handshake**: Cold-launching app displays `#102F53` / `#E34234` / `#FFFFFF` splash screen cleanly without layout jump; `/thrivingskill/v1/config` resolves without error.
- [ ] **App Restart & Session Recovery**: Log in -> force-close app from OS recents -> reopen -> authenticated user stays logged in (`SecureStorageService` token intact) with no re-login prompt.
- [ ] **Expired JWT & Account Switch Hygiene**: Simulate expired token -> app surfaces explicit session-expired notice without losing offline mutations; switch accounts while offline mutations are syncing and confirm Account A mutations do not replay into Account B.

### B. Slow Internet, Network Interruption & Offline Sync
- [ ] **Slow 3G / EDGE Throttling**: Enable Android/iOS Developer Network Conditioner (Slow 3G) -> browse catalog & load course details -> skeleton/loading states stay responsive, images fall back cleanly without frozen spinners.
- [ ] **Mid-Lesson Offline Cut**: Start a lesson -> toggle Airplane Mode -> save a Lesson Study Deck note & mark lesson complete -> `SyncQueueManager` queues idempotent mutation cleanly and `OfflineStudyDeckModal` remains readable offline.
- [ ] **Reconnect Replay**: Disable Airplane Mode -> return to app / foreground -> `SyncQueueManager` flushes pending completion/enroll items once without duplicate submissions.

### C. Background / Foreground Transitions
- [ ] **Video Playback Lifecycle**: Play course video lesson -> press Home button / lock screen -> audio/video pauses properly (`expo-video`); returning to foreground resumes playback state without double audio tracks or timer leaks.
- [ ] **Notification Deep Link (Warm & Cold)**: Deliver an Expo push notification with course/lesson payload from killed state AND backgrounded state -> tapping opens target course/lesson reliably.

### D. Video Playback & CR-03 Auto-Play
- [ ] **Multi-Provider Video Streams**: Verify Vimeo Pro, unlisted YouTube, and direct MP4/HLS course videos play smoothly with seek bar, speed/quality controls, and landscape rotation safe areas.
- [ ] **5-Second Auto-Play Countdown (CR-03)**: Reach end of lesson video -> 5-second countdown overlay appears (`Next Lesson` / `Replay` / `Cancel`) -> auto-advances smoothly to next lesson at `0s` and records completion.

### E. Payment Gateway Matrix (WooCommerce + SSLCommerz / bKash / Nagad / Card)
- [ ] **WebView Autofill & Single-Use Handoff**: Open paid course -> tap Enroll -> `PaymentModal` opens authenticated WooCommerce checkout with synced user billing details (name, email, phone).
- [ ] **Success Scenario (bKash / Nagad / Card Sandbox)**: Complete gateway payment -> redirect to order-received page -> `/thrivingskill/v1/enrollments` polling unlocks enrolled status and lessons without requiring app restart.
- [ ] **Failure / Declined Transaction Scenario**: Trigger gateway decline/insufficient-balance error -> verify clean failure message and retry path with course still locked.
- [ ] **User Cancellation / Back Navigation**: Cancel mid-checkout or press hardware Back -> returns cleanly to course screen without unlocking enrollment.
- [ ] **Gateway Redirect Timeout / Loss**: Drop network mid-redirect -> confirm clean retry banner without white blank screen or domain-block error.

### F. Mandatory Review Gate & Certificate Claim (CR-02)
- [ ] Complete 100% lessons in test course -> attempting to claim certificate opens `MandatoryReviewModal` -> submit star rating + review (>= 10 chars) -> server-backed `CertificateModal` renders student name, course title, and verifiable credential URL.

---

## 3. Production Monitoring, Screen Readers & Real-Device Benchmarks

### G. Sentry Crash Delivery & Alert Verification
- [ ] **Production Event Delivery**: Trigger a non-fatal test telemetry/breadcrumb event in a preview/staging build configured with `EXPO_PUBLIC_SENTRY_DSN` -> verify arrival in Sentry Issues UI within 60s.
- [ ] **PII & Secret Scrubbing Check**: Inspect arriving Sentry event payload -> confirm `order_key`, `token`, `tsmb_handoff`, and raw phone-usernames are redacted by `beforeSend` / `beforeBreadcrumb`.
- [ ] **Alert Rules**: Confirm Slack/Email alert rule fires cleanly on fatal JS/native exception spike or elevated crash-free rate drop.

### H. Screen Reader Audits (Android TalkBack & iOS VoiceOver)
- [ ] **Navigation & Focus Order**: Traverse Home, Explore, Course Detail, and Profile tabs using TalkBack (Android) and VoiceOver (iOS) swipe navigation -> logical top-to-bottom order with zero unlabeled icon buttons.
- [ ] **Modal Traps & Error Announcements**: Open `AuthModal`, `PaymentModal`, `MandatoryReviewModal`, and `CertificateModal` -> verify screen reader stays trapped inside open dialog (`accessibilityViewIsModal`) and announces inline form errors (`accessibilityRole="alert"`).
- [ ] **Video Player Controls**: Verify Play/Pause, Seek, Fullscreen, and Commute toggles announce state and meet `>= 44x44dp` hit area cleanly.

### I. Real-Device Performance Benchmarks
Record actual measured timings on target physical devices:

| Benchmark Metric | Target Budget | Android Primary (Measured) | Android Low-RAM (Measured) | iOS Physical (Measured) | Pass/Fail |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Cold Start to Interactive Home Screen | `< 2.5s` | ______ s | ______ s | ______ s | [ ] |
| Course Catalog Fast Scroll (`FlatList`) | Sustained `~60 fps` (no visible jank) | ______ fps | ______ fps | ______ fps | [ ] |
| Video Lesson Open-to-First-Frame (Vimeo/MP4) | `< 3.0s` (Wi-Fi) | ______ s | ______ s | ______ s | [ ] |
| Peak Memory Usage (15 min browsing + video) | No OOM / `< 450 MB` | ______ MB | ______ MB | ______ MB | [ ] |

---

## 4. Defects Found / Blocker Sign-Off

| Severity (`P0`/`P1`/`P2`) | Scenario ID | Device / OS | Description | Linked Issue / PR |
| :--- | :--- | :--- | :--- | :--- |
| | | | | |
