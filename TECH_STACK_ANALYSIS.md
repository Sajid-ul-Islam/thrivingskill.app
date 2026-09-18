# Tech Stack & Architecture Analysis: Implementing Latest Client Requirements

**Document**: Technical Stack, Architecture, and Integration Specification  
**Project**: Thriving Skills Mobile Application (React Native / Expo SDK 51 + WordPress/LearnPress)  
**Date**: 18 September 2026  
**Target Requirements**: CR-01 (Behavioral Recommendations), CR-02 (Mandatory Reviews), CR-03 (Video Auto-Play), CR-04 (SMS OTP Authentication)  

---

## 1. Executive System Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 SYSTEM INTEGRATION ARCHITECTURE                                │
└────────────────────────────────────────────────────────────────────────────────────────────────┘

 ┌─────────────────────────────────────────────────────────────────────────────────────────────┐
 │                               REACT NATIVE MOBILE CLIENT (EXPO)                            │
 │                                                                                             │
 │  ┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────────┐  │
 │  │  UserBehaviorContext    │  │  VideoTransitionEngine  │  │  OTP & AuthContext          │  │
 │  │  - Interaction Logging  │  │  - Playhead Monitor     │  │  - 6-Digit Auto-Focus Inputs│  │
 │  │  - On-Device Scoring    │  │  - 5s Countdown Modal   │  │  - Resend Countdown Timer   │  │
 │  │  - "For You" Shelf UI   │  │  - Auto-Advance Hook    │  │  - Token Secure Storage     │  │
 │  └───────────┬─────────────┘  └───────────┬─────────────┘  └──────────────┬──────────────┘  │
 │              │                            │                               │                 │
 │              ▼                            ▼                               ▼                 │
 │  ┌───────────────────────────────────────────────────────────────────────────────────────┐  │
 │  │                       ReviewGatingInterceptor (CourseDetail & Player)                  │  │
 │  │  - 100% Completion Interception  - Mandatory 1-5★ Selector  - Certificate Hard Lock   │  │
 │  └────────────────────────────────────────┬──────────────────────────────────────────────┘  │
 └───────────────────────────────────────────┼─────────────────────────────────────────────────┘
                                             │ HTTPS REST Calls
                                             ▼
 ┌─────────────────────────────────────────────────────────────────────────────────────────────┐
 │                         WORDPRESS BACKEND ("TSL APP BRIDGE" PLUGIN)                         │
 │                                                                                             │
 │  ┌───────────────────────────────────┐             ┌─────────────────────────────────────┐  │
 │  │  LearnPress Core & REST APIs      │             │  Custom Bridge Endpoints            │  │
 │  │  - /learnpress/v1/courses         │             │  - POST /tsl/v1/auth/send-otp       │  │
 │  │  - /learnpress/v1/lessons/finish  │             │  - POST /tsl/v1/auth/verify-otp     │  │
 │  │  - /learnpress/v1/reviews         │             │  - POST /tsl/v1/courses/{id}/review │  │
 │  └───────────────────────────────────┘             └──────────────────┬──────────────────┘  │
 └───────────────────────────────────────────────────────────────────────┼─────────────────────┘
                                                                         │ cURL API
                                                                         ▼
                                                      ┌─────────────────────────────────────┐
                                                      │  BANGLADESHI SMS GATEWAY AGGREGATOR │
                                                      │  (Greenweb BD / SSL Wireless /      │
                                                      │   BulkSMS BD)                       │
                                                      └─────────────────────────────────────┘
```

---

## 2. Detailed Technical Stack Breakdown by Requirement

### Requirement 1: User Behavior-Based Course Recommendation Engine (`CR-01`)

#### A. Architecture Approach: On-Device Edge Recommendation vs. Server-Side ML
| Evaluation Metric | On-Device Scoring (Recommended) | Server-Side ML Engine |
| :--- | :--- | :--- |
| **Response Latency** | **0 ms (Instant offline/online cache)** | 350–700 ms API network roundtrip |
| **WordPress Server Load** | **Zero additional CPU/DB queries** | High database query load per home screen load |
| **User Privacy** | Local interaction history stays on device | Interaction logs must be stored in database |
| **Implementation Complexity** | Low–Medium (React Context + AsyncStorage) | High (Python/FastAPI or heavy SQL analytics) |

#### B. Frontend Stack & Libraries
- **State Management**: `UserBehaviorContext.tsx` integrated with `LearningContext.tsx`.
- **Local Persistence**: `@react-native-async-storage/async-storage` for storing interaction event logs:
  ```typescript
  interface UserBehaviorProfile {
    categoryAffinities: Record<string, number>; // e.g. { 'AI & Technology': 14, 'Leadership': 8 }
    searchKeywords: string[];                   // e.g. ['excel', 'python', 'supply chain']
    enrolledCategories: string[];
    viewedCourseIds: string[];
    completedSkillLevels: ('Beginner' | 'Intermediate' | 'Advanced')[];
    lastUpdated: number;
  }
  ```
- **Scoring Algorithm**:
  $$\text{Relevance}(C) = w_1 \cdot \text{CategoryOverlap} + w_2 \cdot \text{SearchKeywordMatch} + w_3 \cdot \text{DifficultyFit} + w_4 \cdot \text{CourseRating} - w_5 \cdot \text{IsEnrolled}$$
- **UI Components**:
  - Horizontal recommendation shelf on [`HomeScreen.tsx`](file:///home/bearded/Public/thrivingskills/src/screens/HomeScreen.tsx) with personalized badge: *"Because you are studying Artificial Intelligence"*.

---

### Requirement 2: Mandatory Course Review (1–5 Stars + Text Feedback) before Certificate Unlock (`CR-02`)

#### A. Flow Interception Architecture
1. **Completion Trigger**: When all modules reach 100% in `LessonPlayerScreen.tsx` or `QuizPlayerModal.tsx`.
2. **Gating State Machine**:
   - State `UNREVIEWED`: Certificate button displays 🔒 *"Review Course to Unlock Certificate"*.
   - State `REVIEW_MODAL_OPEN`: Non-dismissible overlay with 1–5 star rating and mandatory multi-line feedback.
   - State `REVIEWED_UNLOCKED`: Verified certificate is generated and previewed via `CertificateModal.tsx`.

#### B. Frontend Stack
- **Component**: `MandatoryReviewModal.tsx` embedded in `CourseDetailScreen.tsx` and `LessonPlayerScreen.tsx`.
- **Form Controls**:
  - Interactive star rating component (5 scalable `Ionicons` star icons with haptic feedback).
  - Multi-line `TextInput` with character counter (minimum 15 characters required).
  - Validation: Submit button remains disabled until both a star rating ($\ge 1$) and feedback text are entered.
- **Local Persistence**: `AsyncStorage` key `@tsl_course_reviews_{courseId}` storing review state for instant offline recognition.

#### C. Backend Stack & Endpoints
- **WordPress Table**: `wp_comments` and `wp_commentmeta`.
- **API Endpoint**: `POST /wp-json/tsl/v1/courses/{id}/review`
  - Headers: `Authorization: Bearer <JWT_TOKEN>`
  - Request Body:
    ```json
    {
      "rating": 5,
      "review_title": "Outstanding Executive Masterclass",
      "review_content": "The case studies on hybrid leadership transformed our department workflow."
    }
    ```
  - Backend Action: Inserts record into `wp_comments` (`comment_type = 'review'`) and updates average rating in course metadata (`_lp_course_rating`).

---

### Requirement 3: Continuous Video Auto-Play Engine (`CR-03`)

#### A. Playback Monitor & Transition State Machine
- **Event Listener**:
  - `status.positionMillis` and `status.durationMillis` checked via playback status callback.
  - Trigger threshold: `positionMillis >= durationMillis - 1200` (within 1.2s of video finish) OR native `onEnd` event.
- **Countdown Overlay Component**:
  - Displays a glassmorphism floating overlay:
    - Text: *"Next Lecture Starting in **5** seconds..."*
    - Visual circular timer progress indicator.
    - **"Play Now"** button (bypasses timer immediately).
    - **"Cancel Auto-Play"** button (dismisses timer and pauses player).

#### B. Frontend Stack
- **Video Engine**: Expo Video / `expo-av` with `useRef` playback controller.
- **Timer Hook**: `useAutoPlayTimer(onTrigger: () => void, durationSeconds = 5)`.
- **Navigation Action**: Calls `onSelectLesson(courseId, nextLesson.id)` and auto-triggers `setIsPlaying(true)` on mount.

---

### Requirement 4: Mobile Number + SMS OTP Authentication (`CR-04`)

#### A. Complete Mobile Number Authentication Stack
```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                            MOBILE NUMBER OTP STACK                               │
├───────────────────┬──────────────────────────────────────────────────────────────┤
│ Layer             │ Technologies & Standards                                     │
├───────────────────┼──────────────────────────────────────────────────────────────┤
│ Client Input      │ React Native TextInput, Phone Input Mask (+880), Auto-Focus  │
│ Token Storage     │ expo-secure-store (Encrypted Keychain / Keystore)            │
│ State Management  │ AuthContext.tsx, LanguageContext.tsx (Bilingual EN/BN)       │
│ Backend API       │ WordPress REST API (tsl-app-bridge.php)                      │
│ Crypto & Security │ wp_hash_password / openssl_random_pseudo_bytes (6-Digit OTP) │
│ OTP Storage       │ WordPress Transients (Redis/Memcached or wp_options)         │
│ SMS Gateway (BD)  │ Greenweb BD / SSL Wireless / BulkSMS BD (HTTP POST REST API) │
└───────────────────┴──────────────────────────────────────────────────────────────┘
```

#### B. SMS Gateway Integration Details (Bangladesh Telecommunication)
To dispatch SMS OTPs across Grameenphone, Robi, Banglalink, and Teletalk networks, Thriving Skills requires integration with an approved Bangladeshi aggregator:

| Provider | Integration Protocol | Delivery Speed | Cost per SMS (Non-Masking) |
| :--- | :--- | :--- | :--- |
| **Greenweb BD** | HTTP REST POST (JSON/Query) | 2–5 seconds | ~0.25 to 0.30 BDT |
| **SSL Wireless** | Enterprise REST XML/JSON API | 1–3 seconds | ~0.35 to 0.40 BDT |
| **BulkSMS BD** | HTTP API (GET/POST) | 3–6 seconds | ~0.25 to 0.30 BDT |

#### C. Backend API Specification in `tsl-app-bridge.php`

##### 1. Send OTP Endpoint
- **URL**: `POST /wp-json/tsl/v1/auth/send-otp`
- **Request Body**:
  ```json
  {
    "phone": "01712000000"
  }
  ```
- **Backend Logic**:
  1. Validates Bangladeshi phone format: `/^(\+8801|01)[3-9]\d{8}$/`.
  2. Rate Limiting: Max 3 OTP requests per phone number within a 15-minute sliding window.
  3. Generates 6-digit numeric OTP (e.g. `491823`).
  4. Stores hashed OTP in WP Transient with 300-second (5 minutes) TTL:
     ```php
     set_transient( 'tsl_otp_' . $sanitized_phone, wp_hash_password($otp), 5 * MINUTE_IN_SECONDS );
     ```
  5. Dispatches SMS via cURL to SMS Gateway.
- **Response**:
  ```json
  {
    "success": true,
    "message": "OTP has been sent via SMS.",
    "expires_in": 300,
    "resend_available_in": 60
  }
  ```

##### 2. Verify OTP & Issue Token Endpoint
- **URL**: `POST /wp-json/tsl/v1/auth/verify-otp`
- **Request Body**:
  ```json
  {
    "phone": "01712000000",
    "otp": "491823"
  }
  ```
- **Backend Logic**:
  1. Checks Transient `tsl_otp_{phone}`. Returns error if expired.
  2. Validates OTP hash using `wp_check_password($otp, $stored_hash)`.
  3. Deletes Transient to prevent OTP replay attacks.
  4. User Lookup:
     - Query `wp_users` where `user_login = $phone` OR meta key `billing_phone = $phone`.
     - **If User Exists**: Authenticate user and issue JWT Bearer token.
     - **If User Is New**: Auto-create user with username `$phone`, email `$phone@thrivingskill.app`, role `subscriber` / `lp_student`, and issue JWT token.
- **Response**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "id": 1420,
      "username": "01712000000",
      "displayName": "Executive Student",
      "email": "01712000000@thrivingskill.app",
      "roles": ["subscriber"]
    }
  }
  ```

---

## 3. Security & Anti-Abuse Architecture

1. **SMS Bombing & Financial Draining Prevention**:
   - Malicious actors repeatedly requesting OTPs can deplete Thriving Skills' SMS gateway account balance.
   - **Mitigation Stack**:
     - IP-based rate limiting (max 5 requests per IP per hour).
     - Phone-based rate limiting (max 3 requests per phone per 15 minutes).
     - Cooldown timer enforced both on client UI (60-second disable) and server side.

2. **Brute-Force OTP Guessing**:
   - Max 3 verification attempts allowed per generated OTP. After 3 failed attempts, the OTP transient is deleted immediately.

3. **Cryptographic Storage**:
   - OTPs are **never stored as plain text** in the database or server logs; they are hashed using `wp_hash_password()`.

---

## 4. Implementation Effort & Timeline

| Component | Frontend Effort (React Native) | Backend Effort (WordPress Plugin) | Third-Party Dependencies |
| :--- | :--- | :--- | :--- |
| **CR-01: Behavioral Recommendations** | 6–8 Hours | 0 Hours (On-Device Engine) | None |
| **CR-02: Mandatory Review Gating** | 4–6 Hours | 2 Hours (Review Hook) | None |
| **CR-03: Continuous Video Auto-Play** | 3–4 Hours | 0 Hours | None |
| **CR-04: Mobile Number SMS OTP** | 8–10 Hours | 6–8 Hours | BD SMS Gateway Account |
| **Total Engineering Time** | **21–28 Hours** | **8–10 Hours** | **1 Provider Setup** |

---

*Authored for Thriving Skills Limited technical evaluation.*
