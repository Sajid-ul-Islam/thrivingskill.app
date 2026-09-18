# TSL Mobile App — Client Functional Requirements & CyberCraft Proposal Gap Analysis

**Project**: Thriving Skills Executive Mobile Learning Application (Android & iOS)  
**Client**: Thriving Skills Limited (TSL)  
**Vendor Document Analyzed**: `Thriving-Skills-Mobile-App-Proposal-Cybrcraft-Presentable.docx` (CyberCraft Proposal, 17 September 2026)  
**Date**: 18 September 2026  
**Document Status**: Official Client Requirements & Feasibility Review  

---

## 1. Executive Summary

This document captures four (4) newly specified, critical functional requirements requested by the client (**Thriving Skills Limited**) and evaluates them against the formal commercial proposal submitted by **CyberCraft** (`Thriving-Skills-Mobile-App-Proposal-Cybrcraft-Presentable.docx`).

The four client requirements are:
1. **CR-01: User Behavior-Based Course Recommendation Engine on Home Screen**
2. **CR-02: Mandatory Course Review (1–5 Stars + Text Feedback) before Certificate Release**
3. **CR-03: Continuous Video Auto-Play (Automatic Next Lesson Transition)**
4. **CR-04: Mobile Number + SMS OTP Authentication for Login & Registration**

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
│ CR-04   │ Mobile Number SMS OTP Auth        │ Lower friction for BD mobile users │
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

### CR-04: Mobile Number + SMS OTP Authentication
- **Client Prompt**: *"mobile number OTP দিয়ে login এবং রেজিস্ট্রেশন যেন করতে পারে।"*
- **Functional Description**:
  Replace or supplement traditional email/password authentication with frictionless Mobile Number verification using a 6-digit SMS One-Time Password (OTP).
- **Workflow & Verification**:
  1. **Mobile Input**: User enters their Bangladeshi mobile number with prefix `+880 1X-XXXXXXXX` (e.g. `017XXXXXXXX` or `013XXXXXXXX`).
  2. **OTP Dispatch**: The app requests the backend to generate a cryptographically secure 6-digit OTP and dispatches it via a Bangladeshi SMS gateway.
  3. **Verification Screen**:
     - 6-box auto-focusing numeric input field.
     - 60-second countdown timer for the "Resend Code" action.
     - Rate-limiting protection (maximum 3 OTP requests per 15 minutes to prevent SMS billing abuse).
  4. **Seamless Identity Resolution**:
     - If the mobile number exists in WordPress/LearnPress, the user is authenticated and issued a JWT token.
     - If the number is new, a student account is automatically created in WordPress using the verified phone number, with auto-login.

---

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
│ CR-04   │ Mobile Number SMS OTP Auth    │ ❌ EXCLUDED       │ ✅ INCLUDED       │ Option B Deliverable  │
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

#### 4. CR-04: Mobile Number + SMS OTP Authentication
- **CyberCraft Proposal Scope**:
  - **Option A (BDT 50,000)**:
    - *Section 4.1*: Specifies **only Email & Password JWT Login**: *"WordPress JWT Login: Existing students log in using their email and password with silent session persistence. Student Registration: New users create accounts directly within the app and receive immediate JWT auto-login."*
    - Mobile SMS OTP is **strictly excluded** from Option A.
  - **Option B (BDT 80,000)**:
    - *Section 5*: Explicitly includes: *"**Mobile Number SMS OTP Authentication**: Registration and login via Bangladeshi mobile numbers (+880) with 6-digit SMS OTP verification, expiry timers, resend limits, and rate limiting."*
    - *Section 7*: Specifies client prerequisites: *"Active account with a Bangladeshi SMS aggregator (e.g. Greenweb, BulkSMS BD, or SSL Wireless) with funded SMS balance for OTP verification."*
    - *Section 8*: Identifies client-owned recurring costs: *"SMS gateway usage charges (~0.25 to 0.40 BDT per SMS OTP) in Option B."*
- **Gap Analysis**:
  - **CR-04 is a core differentiator between CyberCraft Option A and Option B.**
  - If Thriving Skills signs **Option A (BDT 50,000)**, CyberCraft will **NOT** build SMS OTP.
  - If Thriving Skills signs **Option B (BDT 80,000)**, CyberCraft has committed to delivering full SMS OTP login and registration.
  - In addition, Thriving Skills must purchase an SMS gateway plan from a Bangladeshi provider (Greenweb, BulkSMS BD, or SSL Wireless) with budget for OTP SMS charges.

---

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

1. **Adopt Option B or Formalize Scope Extension**:
   - To have **Mobile Number SMS OTP Authentication (CR-04)** officially built and backed by CyberCraft, Thriving Skills should select **Option B (BDT 80,000)** in the agreement sign-off block.
   - If Thriving Skills chooses Option A (BDT 50,000), a formal written addendum must be negotiated for SMS OTP.

2. **Secure a Bangladeshi SMS Aggregator**:
   - Thriving Skills should open an account with a licensed SMS aggregator (recommended: **Greenweb BD** or **SSL Wireless SMS**) and deposit an initial SMS balance (e.g. 2,000–5,000 BDT at ~0.30 BDT/SMS).
   - CyberCraft requires the SMS API credentials (`api_key`, `sender_id`, `endpoint`) to integrate into the `tsl-app-bridge.php` WordPress plugin.

3. **Incorporate CR-01, CR-02, and CR-03 into Sprint Deliverables**:
   - **CR-01 (Behavioral Recommendation)**: Deliverable via app-side weighted scoring.
   - **CR-02 (Mandatory Review before Certificate)**: Deliverable via LearnPress course completion hook.
   - **CR-03 (Video Auto-Play)**: Deliverable via video player event listeners with user cancel option.

---

*Document compiled for Thriving Skills Limited and stored as `client requirement.md`.*
