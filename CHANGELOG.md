# 📜 Changelog

All notable changes to the **Thriving Skills (TSL) Mobile App** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] - 2026-09-18

### 🚀 Added
- **Behavior-Based Course Recommendations (CR-01)**:
  - Real-time affinity tracking based on user course browsing, enrollment, and category frequency (`@thriving_skill_affinities`).
  - Search history tracking (`@thriving_skill_searches`) dynamically weighting course scoring (+50 category affinity, +30 search keyword, +25 high rating).
  - Dedicated bilingual shelf on Home Screen: **"আপনার পছন্দের ভিত্তিতে প্রস্তাবিত / Recommended For You"** with transparent reasoning tags.
- **Mandatory Course Review & Certificate Gating (CR-02)**:
  - `MandatoryReviewModal` component featuring interactive 1–5 star ratings and multiline feedback in English and Bengali.
  - Strict certificate gating: completion of 100% course modules no longer issues a certificate until a review is submitted.
  - Automatic review prompt on final lesson completion and locked certificate button (`🔒 Review to Unlock`) on Course Detail screen.
- **Continuous Video Auto-Play (CR-03)**:
  - Automated 5-second countdown overlay on lesson completion displaying upcoming lesson title, circular progress, "Play Now", and "Cancel" buttons.
  - Smooth automatic advance to the next curriculum lesson upon timer expiry.
- **Mobile Number + SMS OTP Authentication (CR-04)**:
  - Phone-based registration and login for Bangladeshi numbers (`+880`).
  - 6-digit OTP verification with 60-second cooldown resend timer.
  - Live API integration with `/wp-json/tsl/v1/auth/send-otp` and seamless sandbox test code (`123456`).
- **Production Engineering & Collaboration Infrastructure**:
  - GitHub Actions CI workflow (`.github/workflows/ci.yml`) enforcing zero TypeScript compilation errors.
  - Standardized `.github/pull_request_template.md` and issue templates.
  - Comprehensive `CONTRIBUTING.md` developer guide and `eas.json` multi-environment profiles.
  - `.env.example` environment variable template.

---

## [1.0.0] - 2026-09-04

### 🌟 Initial Production Release (40 Core Specifications)
- **LMS Engine**: Full LearnPress REST API integration, course catalog, category filters, curriculum outline, and progress tracking.
- **Curriculum & Lesson Player**: Embedded YouTube/Vimeo video player, HTML lesson reader, and interactive quiz engine with score calculation.
- **Certificates**: Digital certificate generator with QR verification code, issue dates, and course completion badges.
- **Offline Mode**: Local caching and offline lesson downloads via `AsyncStorage`.
- **AI Career Mentor**: Google Gemini 2.5 Flash integration with resilient fallback ladder for real-time career guidance and prompt engineering blueprints.
- **Executive Corporate Identity**: Authentic Thriving Skills executive team credentials, university MoUs (DU, NSU, EU, AUST), and government partnerships (a2i).
- **Localization**: Native bilingual support for Bengali (বাংলা) and English.
- **Universal Search**: Multi-facet modal search supporting courses, instructors, and skill tags.
- **Security**: Token-based authentication, sanitized HTML rendering, and encrypted credential storage.
