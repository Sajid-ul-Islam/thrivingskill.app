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
| Android (Low-RAM/Older) | ____________________ | Android ____ | Release APK | [ ] PASS / [ ] FAIL | |
| iOS (Physical Device) | ____________________ | iOS ____ | TestFlight / Dev Client | [ ] PASS / [ ] FAIL | |

---

## 2. Core Functional & Hardware Scenarios

### A. Cold Start, App Version Gate & Session Recovery
- [ ] **Splash & Config Handshake**: Cold-launching app displays `#102F53` / `#E34234` / `#FFFFFF` splash screen cleanly without layout jump; `/thrivingskill/v1/config` resolves without error.
- [ ] **App Restart & Session Recovery**: Log in -> force-close app from OS recents -> reopen -> authenticated user stays logged in (`SecureStorageService` token intact) with no re-login prompt.
- [ ] **Expired JWT Recovery**: Simulate or allow token expiration -> app surfaces explicit session-expired notice and prompts re-authentication cleanly without crashing.

### B. Slow Internet, Network Interruption & Offline Sync
- [ ] **Slow 3G / EDGE Throttling**: Enable Android/iOS Developer Network Conditioner (Slow 3G) -> browse catalog & load course details -> skeleton/loading states stay responsive, images fall back cleanly without frozen spinners.
- [ ] **Mid-Lesson Offline Cut**: Start a lesson -> toggle Airplane Mode -> save a Lesson Study Deck note & mark lesson complete -> `SyncQueueManager` queues mutation cleanly and `OfflineStudyDeckModal` remains readable offline.
- [ ] **Reconnect Replay**: Disable Airplane Mode -> return to app / foreground -> `SyncQueueManager` flushes pending completion/enroll items automatically once connectivity returns without duplicate API errors.

### C. Background / Foreground Transitions
- [ ] **Video Playback Lifecycle**: Play course video lesson -> press Home button / lock screen -> audio/video pauses properly cleanly (`expo-video`); returning to foreground resumes playback state without double audio tracks or timer leaks.
- [ ] **Notification Deep Link (Warm & Cold)**: Deliver an Expo push notification with course/lesson payload from killed state AND backgrounded state -> tapping opens target course/lesson reliably.

### D. Video Playback & CR-03 Auto-Play
- [ ] **Multi-Provider Video Streams**: Verify Vimeo Pro, unlisted YouTube, and direct MP4/HLS course videos play smoothly with seek bar, speed/quality controls, and landscape rotation safe areas.
- [ ] **5-Second Auto-Play Countdown (CR-03)**: Reach end of lesson video -> 5-second countdown overlay appears (`Next Lesson` / `Replay` / `Cancel`) -> auto-advances smoothly to next lesson at `0s` and records completion.

### E. Payment Gateway Redirects (WooCommerce + SSLCommerz / MFS)
- [ ] **WebView Autofill & Checkout Handoff**: Open paid course -> tap Enroll -> `PaymentModal` opens checkout with synced user billing details (name, email, phone).
- [ ] **External Gateway Redirect (bKash / Nagad / Card)**: Proceed to SSLCommerz sandbox/payment gateway -> verify external MFS redirect / OTP screen renders cleanly inside WebView (or sanctioned handoff) without white blank screen or domain block.
- [ ] **Payment Cancel / Back Navigation**: Cancel mid-checkout -> app cleanly returns to course screen without marking course enrolled.
- [ ] **Post-Payment Unlock Poll**: Complete test payment -> redirect to order-received page -> `/thrivingskill/v1/enrollments` polling unlocks enrolled status and lessons without requiring app restart.

### F. Mandatory Review Gate & Certificate Claim (CR-02)
- [ ] Complete 100% lessons in test course -> attempting to claim certificate opens `MandatoryReviewModal` -> submit star rating + review (>= 10 chars) -> certificate view (`CertificateModal`) renders student name, course title, and verification code.

---

## 3. Defects Found / Blocker Sign-Off

| Severity (`P0`/`P1`/`P2`) | Scenario ID | Device / OS | Description | Linked Issue / PR |
| :--- | :--- | :--- | :--- | :--- |
| | | | | |
