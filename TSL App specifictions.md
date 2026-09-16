**REQUIREMENTS & FEATURE SPECIFICATION** 

# **Thriving Skills** 

Mobile Learning App — Android & iOS 

## Purpose of This Document 

This document describes the full functional requirements and feature specification for the Thriving Skills Mobile App. It is intended to be shared with mobile app development companies so they can review the scope, propose an implementation approach, and provide an accurate cost and timeline estimate. 

**The mobile app must integrate with the existing Thriving Skills eLearning website so that student accounts, courses, enrollments, payments, and learning progress remain fully synchronized between the website and the mobile app: Website ↔ Mobile App ↔ Backend.** 

## 1. Project Overview 

App Name: Thriving Skills     Platform: Android & iOS 

Purpose: The Thriving Skills Mobile App will provide students with a complete online learning experience, including course discovery, enrollment, online payment, video learning, quizzes, live classes, certificates, progress tracking, notifications, and student support. 

The mobile app must be connected with the existing Thriving Skills eLearning Platform / Website so that users can use the same account, courses, enrollments, payments, and learning progress across the website and mobile app. 

## 2. User Types 

### Student 

Students should be able to: 

- Browse courses 

- Enroll in courses 

- Make payments 

- Watch lessons 

- Attend live classes 

- Complete quizzes 

- Track learning progress 

- Access certificates 

- Contact support 

### Admin 

Administrators should be able to manage: 

- Students 

- Courses 

- Lessons 

- Videos 

- Quizzes 

- Live classes 

- Payments 

- Certificates 

- Notifications 

- Announcements 

- Reports and analytics 

## 3. Main App Navigation 

The bottom navigation should preferably include: 

- Home 

- My Learning 

- Explore 

- Notifications 

- Profile 

### Additional menu options 

- Certificates 

- Watch History 

- Support 

- Settings 

- Help & FAQ 

- Logout 

## 4. Home Page 

### Header 

- Thriving Skills logo 

- Search icon 

- Notification icon 

- Student profile/avatar 

### Main Sections 

- Featured Courses 

- Popular Courses 

- New Courses 

- Free Courses 

- Recommended Courses 

- Bootcamps 

- Course Categories 

- Special Offers / Discounts 

- Upcoming Live Classes 

- Continue Learning 

- Success Stories 

- Student Reviews 

- Announcements 

### Website / App Sections 

The app should provide access to: 

- Courses 

- Course Details 

- Free Courses 

- Bootcamp 

- About Us 

- Success Stories 

- Student Reviews 

- Blog 

- FAQ 

- Contact 

- Login / Registration 

## 5. Course Listing 

Students should be able to browse and search courses. 

### Required Features 

- Course Search 

- Category Filtering 

- Sub-category Filtering 

- Sort by: Newest, Popular, Price, Rating 

- Free / Paid Filter 

- Course Thumbnail 

- Course Title 

- Instructor Name 

- Course Rating 

- Number of Students 

- Course Duration 

- Price 

- Discount Price 

- Course Level 

- Certificate Availability 

## 6. Course Details Page 

Each course should have a complete course information page. 

### Course Information 

- Course Thumbnail 

- Course Title 

- Course Description 

- Instructor Information 

- Course Rating / Reviews 

- Number of Enrolled Students 

- Course Duration 

- Number of Lessons 

- Course Level 

- Certificate Information 

- Course Price 

- Discount Price 

- Enrollment Button 

### Course Content 

- Course Sections / Modules 

- Lessons 

- Video Lessons 

- PDF / Materials 

- Quizzes 

- Live Classes 

### Additional Features 

- Course Preview 

- Related Courses 

- Student Reviews 

- Course Requirements 

- Learning Outcomes 

## 7. User Registration & Login 

Students should be able to create and access their account. 

### Registration 

- Name 

- Email 

- Mobile Number 

- Password 

- Confirm Password 

- OTP Verification 

Login 

- Email / Mobile 

- Password 

- Forgot Password 

- OTP Login Option 

- Remember Me 

Optional Social Login 

- Google Login 

- Apple Login (iOS) 

The same student account should work on both the website and mobile app. 

## 8. Course Enrollment & Payment 

Students should be able to enroll in paid courses directly from the mobile app. 

### Enrollment Process 

_Course → Enroll Now → Checkout → Payment → Successful Payment → Course Added to My Courses_ 

### Payment Methods 

The system should support: 

- bKash 

- Nagad 

- SSLCommerz 

- Card Payment 

- Stripe 

- PayPal 

Payment methods can be enabled or disabled from the Admin Panel. 

### Payment Features 

- Order Summary 

- Coupon / Promo Code 

- Discount Calculation 

- Payment Confirmation 

- Transaction ID 

- Invoice / Receipt 

- Payment History 

- Failed Payment Handling 

- Refund Status 

## 9. Student Dashboard / My Learning 

The Student Dashboard is one of the most important parts of the application. 

### My Courses 

Students can see all enrolled courses. Each course card should display: 

- Course Title 

- Thumbnail 

- Progress Percentage 

- Completed Lessons 

- Remaining Lessons 

- Last Watched Lesson 

- Continue Learning Button 

### Continue Learning 

The app should automatically show the course and lesson the student was last studying, e.g. "Excel Dashboard — Progress: 65% — Last Lesson: Creating Interactive Charts — Continue Learning →" 

## 10. Learning Progress Tracking 

The system must track learning activity. 

### Required Data 

- Course Progress % 

- Completed Lessons 

- Remaining Lessons 

- Video Watch Percentage 

- Last Watched Position 

- Completed Quizzes 

- Quiz Scores 

- Course Completion Status 

- Learning Time 

- Last Activity 

Progress should remain synchronized between the website and mobile app. 

## 11. Video Learning System 

Video learning is a critical feature of the Thriving Skills app. The system should support: 

- Vimeo 

- Cloudflare Stream 

- Other secure video hosting APIs if required in future 

### Video Player Features 

- Play / Pause 

- Seek 

- Fullscreen 

- Playback Speed 

- Video Quality Selection 

- Subtitle Support 

- Volume Control 

- Resume from Last Position 

- Next Lesson 

- Previous Lesson 

- Picture-in-Picture where supported 

- Auto-play Next Lesson 

- Video Progress Tracking 

### Resume Learning 

If a student closes the app at 18:35, the video should resume from approximately 18:35 when they return. 

### Watch Tracking 

The system should record: 

- Video Start 

- Watched Percentage 

- Last Watched Position 

- Completed Status 

- Date / Time of Viewing 

### Lesson Completion 

Students should be able to click "✓ Complete Lesson" — the system should then update the course progress. 

### Video Security 

The app should implement reasonable video protection measures, including: 

- Secure Video URLs 

- Tokenized / Temporary Video Access where supported 

- Prevent Direct Video URL Exposure 

- Download Restriction 

- Screen Recording Protection where technically supported 

- Prevent Unauthorized Course Video Access 

_Note: No mobile application can guarantee 100% prevention of screen recording. The developer should implement the strongest practical protection supported by the selected video provider and mobile OS._ 

## 12. Course Navigation 

_Inside a course: Course → Module → Lesson → Video / Content → Complete → Next Lesson_ 

Students should be able to use: 

- Previous Lesson 

- Next Lesson 

- Course Curriculum 

- Lesson List 

- Completed Lesson Indicator 

- Locked / Unlocked Lesson Indicator 

### Optional 

- Sequential Lesson Completion 

- Prerequisite Lessons 

- Drip Content 

## 13. Video Notes 

Students should be able to create personal notes while watching a lesson. 

- Add Note 

- Edit Note 

- Delete Note 

- Add Note at Current Video Timestamp 

- View All Notes 

### ● Jump to Timestamp 

Example: "12:35 – Important Excel Formula" — clicking the note should take the student directly to that video position. 

## 14. Quiz System 

The platform should include a complete online quiz system. 

### Question Types 

- Multiple Choice (MCQ) 

- True / False 

- Multiple Answer 

- Short Answer 

### Quiz Features 

- Random Questions 

- Question Bank 

- Timer 

- Passing Score 

- Instant Result 

- Attempt Limit 

- Retake Option 

- Question Navigation 

- Previous / Next Question 

- Answer Review 

- Correct / Incorrect Answer Indication 

- Score Calculation 

### Quiz Result 

After submission: Total Questions, Correct Answers, Incorrect Answers, Score, Percentage, Pass / Fail, Attempt Number. Example: "Score: 85% — Status: Passed" 

## 15. Live Class System 

The app should support online live classes. 

- Upcoming Live Classes 

- Live Class Schedule 

- Date & Time 

- Instructor 

- Course Name 

- Join Button 

- Meeting Link 

- Class Reminders 

- Live Class Notifications 

The system should support integration with platforms such as Zoom, Google Meet, and other meeting platforms. Students should receive a notification before the class starts. 

## 16. Certificates 

Students should be able to access certificates after completing eligible courses. 

- Certificate Generation 

- Certificate Preview 

- Certificate Download 

- Certificate Verification 

- Unique Certificate ID 

- Issue Date 

- Course Name 

- Student Name 

- Instructor / Organization Information 

### Optional — Verify Certificate 

A third party should be able to verify a certificate using its unique certificate ID or QR code. 

## 17. Notifications 

The app should support Push Notifications. 

### Notification Types 

- New Course 

- Course Enrollment Confirmation 

- Payment Confirmation 

- Live Class Reminder 

- New Lesson 

- Quiz Result 

- Certificate Available 

- Promotional Offer 

- New Announcement 

Students should be able to manage notification preferences. 

## 18. Announcements 

Admin should be able to publish announcements. Students can view: 

- Important Notices 

- Course Announcements 

- Platform Updates 

- Live Class Announcements 

- Special Offers 

Announcements can be targeted to: All Students, Specific Course Students, Specific User Groups. 

## 19. Watch History 

Students should be able to see their learning history, including Course, Lesson, Last Watched Time, Video Progress, and Date Watched. 

Example: "Excel Dashboard — Creating Charts – 72% watched — Last watched: Today" 

## 20. Student Reviews & Ratings 

Students should be able to rate courses, write reviews, edit reviews, and view other students' reviews (★★★★★). Admin should have the ability to moderate reviews. 

## 21. Search 

The app should have a global search. Students should be able to search Courses, Instructors, Lessons, Categories, and Blog Posts. Search should provide relevant suggestions. 

## 22. Blog 

The app should display Thriving Skills blog content, including Blog Categories, Search, Featured Posts, Latest Posts, and Read Article. Blog content should preferably synchronize with the existing website / CMS. 

## 23. Support 

Students should be able to contact Thriving Skills support through Support Contact, FAQ, Email, Phone, and a WhatsApp Support Link. 

## 24. FAQ & Help Center 

The app should contain Frequently Asked Questions, Payment Help, Course Access Help, Video Problems, Certificate Help, Account Help, and Technical Support. 

## 25. Profile 

Students should be able to manage Profile Photo, Name, Email, Mobile Number, Password, Bio, Address, and Learning Statistics. 

Example profile statistics: "Courses: 8 — Completed: 5 — Certificates: 5" 

## 26. Settings 

### Account 

- Edit Profile 

- Change Password 

- Logout 

### Notifications 

- Push Notifications ON / OFF 

- Course Notifications 

- Promotional Notifications 

- Live Class Reminders 

### Learning 

- Video Quality 

- Playback Speed 

- Auto-play 

- Subtitle Preference 

### App 

- Language 

- Dark Mode 

- Clear Cache 

- Privacy Policy 

- Terms & Conditions 

- About App 

## 27. Security Requirements 

The application must follow modern security practices. 

- Secure Authentication 

- HTTPS / API Encryption 

- Token-based Authentication 

- Secure Password Handling 

- OTP Verification 

- Secure Payment Processing 

- Session Management 

- Role-based Access Control 

- API Authorization 

- Secure Video Access 

- Protection Against Unauthorized Course Access 

Student information and payment information must not be exposed through insecure APIs. 

## 28. Backend / API Integration 

The mobile app should communicate with the Thriving Skills backend through secure APIs. The API should provide: 

- Authentication API 

- User API 

- Course API 

- Enrollment API 

- Payment API 

- Lesson API 

- Video Progress API 

- Quiz API 

- Certificate API 

- Notification API 

- Review API 

- Announcement API 

### Important Requirement 

The mobile app should not use a separate student database unnecessarily. The app should synchronize with the main Thriving Skills platform so that Website ↔ Mobile App ↔ Backend remain synchronized. 

## 29. Admin Panel Requirements 

A web-based Admin Panel should be available to manage the mobile application. 

### Admin Dashboard 

Admin should be able to see: 

- Total Students 

- Active Students 

- Course Enrollments 

- Course Sales 

- Revenue 

- Completed Courses 

- Quiz Statistics 

- Live Class Attendance 

- Certificates Issued 

- App Activity 

### Course Management 

- Create Course 

- Edit Course 

- Delete Course 

- Modules 

- Lessons 

- Videos 

- Materials 

- Quizzes 

### Student Management 

- View Student 

- Edit Student 

- Enrollment History 

- Payment History 

- Learning Progress 

- Quiz Results 

- Certificates 

## 30. Analytics & Reports 

The system should provide analytics for administrators. 

### Course Analytics 

- Total Enrollments 

- Course Completion Rate 

- Average Progress 

- Most Watched Lessons 

- Drop-off Points 

### Student Analytics 

- Active Users 

- Daily Active Users 

- Monthly Active Users 

- Learning Time 

- Course Completion 

- Quiz Performance 

### Business Analytics 

- Course Sales 

- Revenue 

- Payment Methods 

- Refunds 

- Popular Courses 

## 31. Performance Requirements 

The app should be: 

- Fast 

- Lightweight 

- Responsive 

- Optimized for Low / Mid-range Android Devices 

- Optimized for Mobile Internet in Bangladesh 

- Able to Handle Slow Network Conditions 

### Recommended 

- Image Optimization 

- Lazy Loading 

- API Caching 

- Video Adaptive Streaming 

- Pagination 

- Efficient API Calls 

## 32. Compatibility 

### Android 

The app should support modern Android devices and common low / mid-range devices. 

### iOS 

The app should support currently supported iPhone / iOS versions. The developer should confirm the exact minimum OS versions before development based on the selected technology stack. 

## 33. Recommended Technology 

The developer may propose the technology, but the preferred approach is: 

Mobile App — Flutter or React Native 

- One Codebase for Android + iOS 

- Faster Development 

- Easier Maintenance 

- Lower Development Cost 

### Backend 

The backend can use the existing Thriving Skills infrastructure / API or a dedicated backend depending on the current website architecture. 

### Video 

- Vimeo 

- Cloudflare Stream 

### Push Notification 

- Firebase Cloud Messaging (FCM) 

- Apple Push Notification Service (APNs) 

## 34. Important Integration Requirement 

The mobile app must work with the existing Thriving Skills eLearning ecosystem. The developer should first evaluate the existing platform and confirm how the following will be synchronized: 

- Students 

- Login 

- Courses 

- Course Enrollment 

- WooCommerce / Payment Orders 

- Course Progress 

- Lessons 

- Video Progress 

- Quizzes 

- Certificates 

- Notifications 

**The developer must provide a clear API Integration Plan before development begins.** 

## 35. User Journey 

### New Student 

_Install App → Register → Verify OTP → Home → Browse Course → Course Details → Enroll → Payment → Course Added → Start Learning_ 

### Existing Student 

_Install App → Login → My Learning → Continue Learning → Watch Lesson → Complete Lesson → Quiz → Next Lesson_ 

### Course Completion 

_Complete Lessons → Complete Quiz → Meet Course Requirements → Course Completed → Certificate Generated → Certificate Available_ 

## 36. MVP — First Development Phase 

To control the initial development cost, the first version should prioritize the following must-have features: 

- Login / Registration 

- Home 

- Course Listing 

- Course Details 

- Search 

- Course Enrollment 

- Payment 

- My Courses 

- Course Progress 

- Video Player 

- Resume Video 

- Lesson Completion 

- Course Curriculum 

- Quiz 

- Certificates 

- Live Class Schedule / Link 

- Push Notifications 

- Profile 

- Basic Support 

- Basic Admin / API Integration 

## 37. Developer Deliverables 

The app developer/company must provide: 

- UI/UX Design 

- Android App 

- iOS App 

- Backend / API Integration 

- Payment Gateway Integration 

- Video Streaming Integration 

- Push Notification System 

- Authentication System 

- Quiz System 

- Certificate System 

- Testing 

- Bug Fixing 

- App Store Submission 

- Google Play Store Submission 

- Complete Source Code 

- API Documentation 

- Deployment Documentation 

- Post-launch Technical Support 

## 38. Testing Requirements 

Before launch, the developer must test: 

- Registration 

- Login 

- OTP 

- Course Browsing 

- Course Enrollment 

- Payment 

- Failed Payment 

- Video Playback 

- Video Resume 

- Progress Tracking 

- Lesson Completion 

- Quiz 

- Certificate 

- Live Class 

- Push Notifications 

- Profile 

- Logout 

- API Security 

- Different Screen Sizes 

- Slow Internet 

- Android Devices 

- iOS Devices 

## 39. Final Acceptance Criteria 

The project will be considered complete when: 

- Android App works properly 

- iOS App works properly 

- Student accounts synchronize correctly 

- Course enrollment works correctly 

- Payments work correctly 

- Videos play securely 

- Video progress is saved 

- Course progress is synchronized 

- Quizzes work correctly 

- Certificates are generated correctly 

- Notifications work correctly 

- Live class links work correctly 

- Student support works correctly 

- Admin can manage required content 

- No critical security or functional bugs remain 

- Source code and technical documentation are delivered 

## 40. Future Scalability 

The system should be designed so that future features can be added without rebuilding the entire application. Potential future features may include: 

- AI Learning Assistant 

- AI Course Recommendation 

- AI Quiz Generation 

- AI Tutor 

- Personalized Learning Path 

- Leaderboard 

- Referral System 

- Subscription Plans 

- Corporate Training 

- Instructor Dashboard 

- Affiliate System 

- Community / Discussion Forum 

- Multi-language Support 

- Advanced Learning Analytics 

