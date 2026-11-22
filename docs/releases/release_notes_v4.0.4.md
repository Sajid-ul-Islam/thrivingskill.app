# Thriving Skills Mobile Application — v4.0.4-preview

### Comprehensive Feature & Sync Release (18 November 2026)

This release delivers major real-time sync, multi-channel customer support, live notifications, tablet optimization, and CI automated testing across Android and iOS platforms.

---

### Key Features & Enhancements:

1. **Multi-Channel Floating Support Chat Widget (Speed-Dial FAB)**
   - **Auto-Transforming Idle Morph**: Floating action button smoothly performs a 3D coin-flip transition (`rotateY`) and color morph between **WhatsApp Green (`#25D366`)** and **Messenger Blue (`#0084FF`)** on a recurring timer (`3.8s`), signaling 24/7 multi-channel availability.
   - **Tap-to-Expand Speed-Dial Menu**: Tapping the widget reveals direct channel options:
     - *WhatsApp Direct Chat* (`01312-100288`) with instant reply badge.
     - *Facebook Messenger* (`@thrivingskills`) active community inbox.
     - *Official Helpline* direct telephone dialer (`01312-100288`).
     - *Categorized Inquiry Topics & FAQs* full sheet access.
   - **Tap-to-Collapse State Restoration**: Main button transforms to a Deep Navy close button; re-tapping collapses cleanly back to the floating chat-head with the auto-cycling timer resuming.
   - **Messenger Bubble Physics**: Draggable across edges with snap-to-edge docking and drop-to-dismiss zone.

2. **Bi-directional Profile Synchronization (`https://thrivingskill.com`)**
   - Live synchronization with WordPress & LearnPress REST APIs (`/wp/v2/users/me` and `/learnpress/v1/users/<id>`).
   - Profile changes in the mobile app (city, avatar presets, custom avatar URL, cover photo theme, full name) immediately sync to the live website.
   - Profile changes made on the live website automatically reflect in the app upon background resume (`AppState`) and pull-to-refresh.
   - Offline resilience via persistent mutation sync queue.

3. **WooCommerce Checkout Autofill & Seamless Web Experience**
   - Learner identity and contact details (name, phone, email, city, address) automatically detect and pre-fill into the live WooCommerce checkout WebView.
   - Students no longer have to re-enter billing or contact information when purchasing courses or masterclasses.
   - Persistent local caching (`@thrivingskill_checkout_autofill_v1`) with mutation listeners for dynamic gateway updates (bKash, Nagad, cards).

4. **Live Push Notifications & Smart Recommendations**
   - **Native Android Status Bar Drop-Down**: Configured native notification channels (`offers`, `courses`, `recommendations`, `updates`) with custom LED badges and vibrations.
   - **iOS Actionable Notification Panel**: Interactive swipe-to-dismiss notification drawer with quick actions.
   - **Live Site Sync**: Automatic background detection of new courses, discount offers, and flash sales published on `https://thrivingskill.com`.
   - **Smart Recommendation Engine**: Tailors milestone suggestions based on learner enrollment history.

5. **Tablet & Large Screen UI/UX Optimization**
   - Responsive multi-column grid layouts for 7" to 12" Android and iPad screens.
   - Adaptive touch targets exceeding 48x48 dp for enhanced ergonomic comfort.
   - Virtualized lists tuned for high-refresh-rate 120Hz displays.

6. **Decomposition & Quality Infrastructure**
   - Major screen components cleanly decomposed into modular, isolated subcomponents.
   - 9-suite automated CI Quality Gate (`npm run test:ci`) verifying type safety, timer hygiene, security hardening, and enrollment flows.

---

### Verification Metrics:
- **TypeScript Compiler (`tsc --noEmit`)**: 0 errors
- **Code Hygiene Audit (`audit_app.js`)**: 0 broken imports, 0 missing styles, 0 unhandled timers
- **Automated CI Quality Gate (`run_all_tests.js`)**: 9/9 test suites passed
- **Metro Bundler**: Web, iOS (.hbc), and Android (.hbc) dry-run passed
- **EAS OTA Update**: Published to `production` (`9e5a3d76-f273-441e-8563-9a24cce933ce`) and `preview` (`a60cca7d-76bf-49a2-8f51-255d1b105010`)

### Release Artifacts:
- `thrivingskill-v4.0.4-preview.apk` (54.60 MB standalone signed APK for Android devices)
