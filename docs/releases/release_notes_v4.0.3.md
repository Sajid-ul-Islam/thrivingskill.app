# Thriving Skills Mobile Application — v4.0.3-preview

### Client Review Corrections & Feature Release (17 November 2026)

This release addresses all 8 change requests and corrections from the official client review document (`Thriving_Skills_App_Review_and_new_requirment.md`):

---

### Key Updates & Corrections:

1. **CR-1: Branded Splash Screen & Mandatory Login Access Control**
   - Splash sequence displaying official Thriving Skills icon, branded wordmark, and official tagline: `জাতির দক্ষতা বিনির্মাণে • Building a Skilled Nation`.
   - Mandatory authentication gate blocks unauthenticated browsing; guest bypass disabled so students must log in to access the platform.

2. **CR-2: Home Page Declutter & Visual Hierarchy**
   - Clean, lightweight layout matching the approved client reference:
     1. Personalized executive greeting & study streak ring
     2. Spotlight course search bar
     3. Single promotional hero banner
     4. Organized category course carousels

3. **CR-3: Home Category Carousels with Auto-Scroll**
   - Department carousels rendered in exact requested sequence:
     1. *Upcoming Live Training (আসন্ন লাইভ ট্রেনিং)*
     2. *Generative AI (জেনারেটিভ এআই)*
     3. *Marketing (মার্কেটিং)*
     4. *Human Resource (হিউম্যান রিসোর্স)*
     5. *Supply Chain (সাপ্লাই চেইন)*
     6. *Finance & Accounting (ফাইন্যান্স ও অ্যাকাউন্টিং)*
     7. *Special Bundles (বান্ডেল)*
   - Right-to-left 3-second auto-scroll animation with strict unmount timer cleanup.

4. **CR-4: All Courses Department Navigation Grid & Section Jump**
   - Department category grid at top of the catalog for fast navigation.
   - Per-department carousels with smooth auto-scroll to the tapped department row on the same page.
   - Individual "See All →" triggers for drilled-down grid view with quick return button.

5. **CR-5: Bundle 5-Course Breakdown & Automatic Multi-Course Unlock**
   - Cart summary displays all 5 included sub-courses with crossed-out pricing and bundle discount badge (`-40%`).
   - Payment confirmation immediately enrolls and unlocks all 5 sub-courses in the learner's profile.

6. **CR-6: Review Gating & Video Download Removal**
   - Course review submission locked to actively enrolled students only. Non-enrolled users see locked status with enrollment requirement notice.
   - Offline video download buttons removed across player and quality modals to safeguard proprietary intellectual property.

7. **CR-7: Video Player Single Progress Bar & Smoothness**
   - Embedded Vimeo & YouTube iframes configured with `controls=0` to suppress native player controls and eliminate the duplicated progress bar.
   - Gestures overlay auto-hides after 3 seconds without obscuring the video viewport.

8. **CR-8: My Achievements (Certificates & Social Sharing)**
   - Dedicated "My Achievements" horizontal showcase positioned directly above "My Course Portfolio".
   - Displays certificate cards with 96% score badge, completion date, and direct Facebook & LinkedIn sharing actions.

---

### Verification Metrics:
- **TypeScript**: 0 errors (`npm run typecheck` passed)
- **Code Audit**: 0 broken imports, 0 missing styles, 0 unhandled timers across 160 files
- **UI/UX Laws**: 9/9 passed (`verify_ui_ux_laws.js`)
- **Layout & Safe Areas**: 31/31 passed (`verify_layout_and_safe_areas.js`)
- **WCAG Contrast**: 0 contrast warnings (`verify_wcag_contrast.js`)
- **Mobile UX Principles**: 14/14 passed (`verify_ux_principles.js`)
- **EAS OTA Update**: Published to `preview` channel (Group ID: `47c9cb6a-83c0-4623-806c-bba9cd7f6efc`)

### Assets Included:
- `thrivingskill-v4.0.3-preview.apk` (50.61 MB signed APK ready for installation on Android devices)
