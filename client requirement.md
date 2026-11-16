# TSL Mobile App — Client Functional Requirements & CyberCraft Proposal Gap Analysis

**Project**: Thriving Skills Executive Mobile Learning Application (Android & iOS)  
**Client**: Thriving Skills Limited (TSL)  
**Vendor Document Analyzed**: `Thriving-Skills-Mobile-App-Proposal-Cybrcraft-Presentable.docx` (CyberCraft Proposal, 17 September 2026)  
**Date**: 18 September 2026  
**Document Status**: Official Client Requirements & Feasibility Review  

---

## 1. Executive Summary

This document captures four (4) newly specified, critical functional requirements requested by the client (**Thriving Skills Limited**) and evaluates them against the formal commercial proposal submitted by **CyberCraft** (`Thriving-Skills-Mobile-App-Proposal-Cybrcraft-Presentable.docx`).

The five client requirements are:
1. **CR-01: User Behavior-Based Course Recommendation Engine on Home Screen**
2. **CR-02: Mandatory Course Review (1–5 Stars + Text Feedback) before Certificate Release**
3. **CR-03: Continuous Video Auto-Play (Automatic Next Lesson Transition)**
4. **CR-04: Native LearnPress JWT Authentication for Login, Registration & Password Management**
5. **CR-05: Authenticated Learner Profile with Enrolled Courses, Graduated Courses & Learning Analytics Data Chart**

---

## 2. Detailed Client Functional Requirements

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                          CLIENT REQUIREMENTS AT A GLANCE                         │
├─────────┬───────────────────────────────────┬────────────────────────────────────┤
│ Ref ID  │ Requirement Name                  │ Core Business Objective            │
├─────────┼───────────────────────────────────┼────────────────────────────────────┤
│ CR-01   │ Behavior-Based Course Engine      │ Maximize course discovery & sales  │
│ CR-02   │ Mandatory Review for Certificate  │ Guarantee 100% student feedback    │
│ CR-03   │ Continuous Video Auto-Play        │ Binge-learning & frictionless UX   │
│ CR-04   │ Native LearnPress JWT Auth        │ Direct authentic auth via web API  │
└─────────┴───────────────────────────────────┴────────────────────────────────────┘
```

### CR-01: User Behavior-Based Course Recommendation Engine
- **Client Prompt**: *"মোবাইল অ্যাপের হোমপেজে আমার behaviour উপর base করে যেন কোর্সগুলো শো করে। course recommendation সিস্টেমটা যেন আমার behaviour উপর base করে হয়।"*
- **Functional Description**:
  The mobile application's Home Screen must not merely show static lists of popular or featured courses. Instead, it must dynamically curate and recommend courses tailored to each individual learner's unique behavioral signals.
- **Behavioral Signals Captured**:
  1. **Enrolled & Watched Categories**: If a user spends 70% of their learning time in *Generative AI* and *Data Analytics*, the recommendation engine must prioritize advanced AI and Business Intelligence courses.
  2. **Search & Exploration History**: Keywords searched by the student in the app's spotlight search (e.g. "Excel", "Supply Chain", "Leadership") must increase the relevance score of matching course tags.
  3. **Difficulty / Career Level Affinity**: Learner's affinity towards Beginner, Intermediate, or Executive Masterclasses based on completed courses.
  4. **Watch Dwell Time**: Courses where preview lessons were sampled or watched for more than 60 seconds.
- **UI & UX Placement**:
  - A prominent, dedicated section on the Home Screen labeled: **"Recommended For You / আপনার জন্য বিশেষ প্রস্তাবিত"**.
  - A sub-label explaining the recommendation rationale (e.g., *"Based on your interest in AI & Leadership"*).

---

### CR-02: Mandatory Course Review before Certificate Unlock
- **Client Prompt**: *"সবগুলো module বা ভিডিও ক্লাস দেখা শেষ হলে সবার শেষে রিভিউ অপশনটা mandatory অটো চলে আসবে এবং রিভিউ দেওয়ার পরে তার সার্টিফিকেট শো করবে otherwise সার্টিফিকেট শো করবেন না। রিভিউতে অবশ্যই রিভিউ লিখতে পারবে এবং Star দিতে পারবে ১ থেকে ৫।"*
- **Functional Description**:
  When a student completes 100% of the lessons and modules in a course, certificate issuance must be strictly gated behind an automatic, mandatory course review.
- **Workflow & Rules**:
  1. **Trigger Condition**: Upon completing the final lesson or passing the final chapter quiz (course progress reaches 100%).
  2. **Automated Interception**: Instead of immediately unlocking or presenting the certificate, the app automatically triggers a non-dismissible Review Modal.
  3. **Input Requirements**:
     - **Interactive 1 to 5 Star Rating**: Interactive star selector (1 = Poor, 2 = Fair, 3 = Good, 4 = Very Good, 5 = Excellent).
     - **Written Feedback**: Multi-line text input field requiring a constructive student review.
  4. **Hard Gating Rule**:
     - The "View / Download Certificate" CTA remains **locked / disabled** until the review is successfully submitted.
     - If the user closes the modal or attempts to navigate to the Certificate tab without reviewing, an alert notifies them: *"Please submit your course review to unlock your verified digital certificate."*
     - Upon submission, the review is synced with the backend/local store, and the verified certificate is immediately generated and displayed.

---

### CR-03: Continuous Video Auto-Play (Seamless Next Lesson Transition)
- **Client Prompt**: *"একটা ভিডিও ক্লাস দেখা শেষ হলে যেন অটোমেটিক পরের ভিডিও ক্লাসটি চালু হয় User কে যেনো নেক্সট বাটনে চাপতে না হয়।"*
- **Functional Description**:
  When a video lecture reaches its completion timestamp, the player must automatically advance to and begin playing the subsequent video lesson in sequence without requiring the student to manually touch the screen or press the "Next Lesson" button.
- **User Experience & Controls**:
  1. **Playback Completion Event**: When video progress reaches $\ge 98\%$ or triggers the video player's `onEnd` callback.
  2. **Auto-Advance Countdown Prompt**: A sleek, non-intrusive 5-second countdown overlay displays over the video thumbnail:
     - *"Next Lesson starting in 5... 4... 3... 2... 1..."*
     - **"Play Now"** button (for instant transition).
     - **"Cancel / Pause"** button (in case the student wants to review the current lesson or take notes).
  3. **State Transition**: Marks current lesson as completed, updates the course progress bar, records watch position, and begins playing the next video seamlessly.

---

### CR-04: Native LearnPress JWT Authentication for Login, Registration & Password Management
- **Client Prompt**: *"মোবাইল অ্যাপে লগইন এবং রেজিস্ট্রেশন যেন সরাসরি থ্রাইভিং স্কিলস ওয়েবসাইটের (thrivingskill.com) অ্যাকাউন্টের সাথে সম্পূর্ণ সিনক্রোনাইজড থাকে এবং কোনো থার্ড পার্টি এসএমএস বা অতিরিক্ত জটিলতা ছাড়া সরাসরি JWT অথেনটিকেশন ব্যবহার করে ইউজার লগইন ও রেজিস্ট্রেশন করতে পারে।"*
- **Functional Description**:
  The mobile application directly authenticates against the live WordPress / LearnPress backend at `https://thrivingskill.com` using native JSON Web Tokens (JWT). This guarantees that every registered user on the live site can log in immediately with their existing credentials, and new students created via the app exist instantly in WordPress with zero third-party SMS dependencies or carrier delivery failures.
- **Workflow & Verification**:
  1. **Direct JWT Login (`POST /learnpress/v1/token`)**:
     - User signs in with their standard WordPress username or email address and password.
     - The backend validates credentials and returns a signed cryptographic JWT bearer token along with user metadata.
     - `HttpClient` automatically injects `Authorization: Bearer <token>` into all subsequent authenticated requests (such as course enrollments, quiz submissions, and reviews).
  2. **In-App Student Registration (`POST /learnpress/v1/token/register`)**:
     - Students provide their preferred username, valid email, and password.
     - LearnPress provisions a real student account in the WordPress database, automatically assigns the `subscriber` / student role, and logs the user in immediately.
  3. **Token Validation & Persistence (`POST /learnpress/v1/token/validate`)**:
     - Tokens are persisted securely in local encrypted storage (`AsyncStorage`).
     - On app cold-start, the session is silently verified against `/learnpress/v1/token/validate` without prompting the user to sign in again.
  4. **Native WordPress Password Recovery (`action=lostpassword`)**:
     - Students enter their username or email to trigger an authentic password reset email directly from WordPress.
     - Secure reset links are handled directly in-app or through deep links (`parseResetPasswordUrl`), allowing students to set a new password without leaving the mobile app.

---


---

### CR-05: Authenticated Learner Profile with Enrolled Courses, Graduated Courses & Learning Analytics Data Chart
- **Client Prompt**: *"when user login they shodud see thera enrolled coursed and gradutaed curse and ith data chart on their profile, include this in client requrment /goal implement the featur and bandr clor combinsation should applied on the app"*
- **Functional Description**:
  When a learner logs in to the mobile application, their Profile screen must transform into an executive learning dashboard. It must showcase their active **Enrolled Courses**, **Graduated Courses** (100% completed with certification), and a high-fidelity **Visual Learning Analytics Data Chart** utilizing the authentic ThrivingSkills brand color palette.
- **Key Modules & Capabilities**:
  1. **Visual Learning Analytics Data Chart**:
     - **Circular Skill Mastery Donut Chart**: SVG-rendered progress gauge indicating overall completion percentage across all enrolled programs with multi-segment arcs.
     - **Weekly Learning Velocity Bar Chart**: 7-day activity metrics (Mon–Sun) tracking lessons completed and learning time, highlighted with streak indicators (e.g. "🔥 5-Day Learning Streak").
     - **Core KPI Summary Cards**: Total Enrolled Courses, Graduated Courses, Total Study Hours, and Verified Digital Certificates.
  2. **Active Enrolled Courses Shelf**:
     - Filtered view of courses in progress (`!userProgress[id].isCompleted`).
     - Real-time progress bar (e.g. `8/12 Lessons Complete • 67%`).
     - Instant **"চালিয়ে যান / Continue Learning"** CTA button routing straight to the active lesson player.
     - Engaging empty state with direct course catalog exploration for new students.
  3. **Graduated Courses Shelf**:
     - Dedicated showcase of finished courses (`userProgress[id].isCompleted === true`).
     - Premium **"🎓 Graduated / সম্পন্ন"** badge rendered in ThrivingSkills Sunshine Gold (`#FFB606`).
     - Completion date and score verification badge (`100% Mastery`).
     - One-tap **"সনদপত্র দেখুন / View Certificate"** action that directly launches the interactive `CertificateModal` with PDF download and verification links.
     - Direct course rating and review submission.
  4. **ThrivingSkills Brand Color Harmonization**:
     - **Brand Deep Navy (`#102F53`)**: Primary brand identity, header backgrounds, profile cards, and key navigation accents.
     - **Sunshine Gold (`#FFB606`)**: Achievement badges, graduation ribbons, star ratings, and progress highlights.
     - **Crimson / Coral Accent (`#E34234` / `#E11D48`)**: Primary calls to action, active indicators, and attention alerts.
     - **Crisp Slate & Surface Whites (`#F8FAFC`, `#FFFFFF`, `#0F192C`)**: Accessible high-contrast typography and card surfaces.

## 3. Comparative Gap Analysis with CyberCraft Presentable Proposal

We evaluated each of the four client requirements against the official vendor document:  
**`Thriving-Skills-Mobile-App-Proposal-Cybrcraft-Presentable.docx`** (CyberCraft Proposal, September 2026).

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                               CYBERCRAFT PROPOSAL COMPLIANCE MATRIX                                     │
├─────────┬───────────────────────────────┬───────────────────┬───────────────────┬───────────────────────┤
│ Ref ID  │ Client Requirement            │ Option A (50k BDT)│ Option B (80k BDT)│ Status / Gap Summary  │
├─────────┼───────────────────────────────┼───────────────────┼───────────────────┼───────────────────────┤
│ CR-01   │ Behavior-based Recommendations│ ❌ Not Covered    │ ❌ Not Covered    │ Scope Enhancement     │
│ CR-02   │ Mandatory Review for Cert     │ ❌ Not Covered    │ ❌ Not Covered    │ Custom Business Logic │
│ CR-03   │ Continuous Video Auto-Play    │ ⚠️ Partial (Manual│ ⚠️ Partial (Manual│ UX Workflow Addition  │
│ CR-04   │ Native LearnPress JWT Auth    │ ✅ INCLUDED       │ ✅ INCLUDED       │ Core Production Auth  │
└─────────┴───────────────────────────────┴───────────────────┴───────────────────┴───────────────────────┘
```

---

### Detailed Comparison by Requirement

#### 1. CR-01: Behavior-Based Course Recommendations
- **CyberCraft Proposal Scope**:
  - *Section 4.2*: Proposes a static Home Feed: *"Featured Courses, Popular Courses, New Releases, Free Courses, and Continue Learning banner. Category Filter Pills: Interactive horizontal filter pills for instant category browsing."*
  - *Section 6.1*: States that 85% of features rely on standard WordPress REST endpoints (`/learnpress/v1/courses`).
- **Gap Analysis**:
  - CyberCraft's proposal **does NOT include a personalized machine-learning or behavioral recommendation engine** in either Option A or Option B.
  - The proposal only covers static query filters (e.g. `orderby=date`, `orderby=popularity`).
- **Feasibility & Solution**:
  - **App-First On-Device Recommendation**: The mobile app can capture user interactions (categories enrolled, search keywords, lesson watch history) in local storage, and dynamically re-rank/score the course catalog to produce a personalized **"Recommended For You"** shelf without incurring backend server load.

---

#### 2. CR-02: Mandatory Review & Rating (1–5 Stars) before Certificate Release
- **CyberCraft Proposal Scope**:
  - *Section 4.6*: States: *"Certificate Generation: Automated certificate issuance upon 100% course and quiz completion. Preview & Social Sharing: Certificate viewer modal, image/PDF download, and one-tap LinkedIn Certification sharing."*
- **Gap Analysis**:
  - CyberCraft's proposal issues the certificate **immediately upon reaching 100% completion**, with **no review gating**.
  - Student course reviews are not tied to certificate release in the proposal.
- **Feasibility & Solution**:
  - This is an **app-level business rule**.
  - We can intercept the course completion event in `LessonPlayerScreen.tsx` / `CourseDetailScreen.tsx`:
    1. Check `hasUserSubmittedReview(courseId)`.
    2. If false, auto-launch the Review Modal with 1–5 stars and text input.
    3. Block the certificate unlock until the review is submitted.
    4. Upon submission, invoke `addCourseReview()` and reveal the certificate.

---

#### 3. CR-03: Continuous Video Auto-Play (Auto Next Lesson)
- **CyberCraft Proposal Scope**:
  - *Section 4.3*: Mentions: *"Full Playback Suite: Play, pause, seek scrubber, fullscreen, and variable speed selector... 10-Second Skip Buttons... Lesson Completion Action: Mark lesson complete with instant progress bar update."*
- **Gap Analysis**:
  - CyberCraft's proposal specifies manual lesson navigation (students tap "Next Lesson" or pick from the curriculum drawer). It does not explicitly define automated binge-learning auto-play.
- **Feasibility & Solution**:
  - This is a straightforward frontend enhancement in `LessonPlayerScreen.tsx`.
  - When the video reaches its end (`currentTime >= duration - 1s`), a 5-second countdown triggers, automatically transitioning the player to `nextLesson.id` without user touch.

---

#### 4. CR-04: Native LearnPress JWT Authentication for Login, Registration & Password Recovery
- **WordPress LearnPress REST Scope**:
  - **Direct JWT Token Exchange**:
    - Uses `/learnpress/v1/token` for instant student credential validation and bearer token issuance.
    - Uses `/learnpress/v1/token/register` for instant in-app account creation directly in the WordPress database.
    - Uses `/learnpress/v1/token/validate` for silent session persistence and token freshness verification on cold boot.
    - Uses native WordPress `action=lostpassword` email password recovery.
- **Benefits & Source of Truth**:
  - **Zero SMS Gateway Dependencies**: Eliminates SMS carrier delays, international SMS roaming failures, and monthly recurring telco gateway costs (~0.35 BDT/SMS).
  - **100% Source of Truth Compatibility**: Directly logs in any of the 50,000+ existing students registered on `https://thrivingskill.com` with their existing username or email and password. All new students created in the app exist immediately on the live website.

---


---

#### 5. CR-05: Authenticated Learner Profile with Enrolled/Graduated Courses & Data Chart
- **CyberCraft Proposal Scope**:
  - *Section 4.5*: Describes a generic Profile screen with static account settings: *"User Profile: Display user avatar, name, email, subscription status, and app settings. Settings: Notification toggles, theme switcher, language selector, clear cache, and logout."*
  - Mentions a separate My Learning tab for course listing, but proposes **no learning analytics data charts**, no graduation showcase, and no visual progress graphs on the user profile.
- **Gap Analysis**:
  - CyberCraft proposal lacks personal learning analytics data charts and dedicated Enrolled vs Graduated segmentation on the Profile screen.
- **Feasibility & Solution**:
  - Implemented directly on the Profile screen using React Native SVG data visualization, integrating with `LearningContext` (`userProgress`, `certificates`) and applying authentic brand color styling.

## 4. Technical Architecture & Implementation Blueprint

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                           PROPOSED TECHNICAL BLUEPRINT                           │
└──────────────────────────────────────────────────────────────────────────────────┘

   1. HOMEPAGE RECOMMENDATIONS
      [User Interactions] ──> [AsyncStorage Behavior Log]
                                     │
                                     ▼
      [Course Catalog]    ──> [On-Device Recommendation Algorithm]
                                     │
                                     ▼
                              [Home: "Recommended For You" Shelf]

   2. MANDATORY REVIEW & CERTIFICATE GATING
      [All Lessons 100%]  ──> [Check: Has Reviewed?]
                                     │
                     ┌───────────────┴───────────────┐
                     ▼                               ▼
                 [YES: Reviewed]              [NO: Not Reviewed]
                     │                               │
                     ▼                               ▼
              [Unlock Certificate]           [Auto-Open Mandatory Review Modal]
                                                     │
                                                     ▼
                                             [Submit 1-5★ & Text]
                                                     │
                                                     ▼
                                             [Unlock Certificate]

   3. VIDEO AUTO-PLAY
      [Video Ends (onEnd)] ──> [5-Second Countdown Modal]
                                     │
                                     ▼
                               [Auto-Advance to Next Lesson]

   4. MOBILE NUMBER OTP
      [User Enters Phone]  ──> [POST /tsl/v1/auth/send-otp]
                                     │
                                     ▼
                               [SMS Gateway (SSL Wireless / Greenweb)]
                                     │
                                     ▼
                               [SMS Dispatched to Phone]
                                     │
                                     ▼
      [User Enters 6-Digit OTP] ──> [POST /tsl/v1/auth/verify-otp]
                                     │
                                     ▼
                               [JWT Token Issued & Stored]
```

---

## 5. Commercial & Scope Recommendations for Thriving Skills

1. **Adopt Native LearnPress JWT Authentication (CR-04)**:
   - **Native LearnPress JWT Authentication** is the official production authentication standard for Thriving Skills. It provides instantaneous, secure login and registration directly against `https://thrivingskill.com`, supporting all existing 50,000+ accounts with zero third-party SMS dependencies or ongoing gateway overhead.

2. **Incorporate CR-01, CR-02, and CR-03 into Sprint Deliverables**:
   - **CR-01 (Behavioral Recommendation)**: Deliverable via app-side weighted scoring.
   - **CR-02 (Mandatory Review before Certificate)**: Deliverable via LearnPress course completion hook.
   - **CR-03 (Video Auto-Play)**: Deliverable via video player event listeners with user cancel option.

---

*Document compiled for Thriving Skills Limited and stored as `client requirement.md`.*
