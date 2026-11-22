# Thriving Skills Mobile Application — v4.0.6-preview

### Comprehensive Feature & Visual Identity Release (22 November 2026)

This release introduces an upgraded startup splash screen featuring the official learner hero visual, full integration with the upgraded `ts-mobile-bridge` v1.1.0 WordPress companion plugin, dynamic course browsing enhancements, and complete 4:3 course artwork alignment.

---

### What's New in Thriving Skills v4.0.6-preview:

#### 1. 🌟 Dynamic Startup Splash Screen with Learner Hero Portrait
- **Learner Hero Visual**: Integrated the high-fidelity professional learner hero visual (`assets/splash-hero.jpg`) depicting a Bangladeshi executive learner with digital tablet in an ambient learning environment.
- **Ambient Cinematic Backdrop**: Deep navy (`#102F53`) atmospheric background with subtle linear gradient overlay and ambient lighting shimmer.
- **Centerpiece Hero Portrait**: 176×176dp rounded hero frame featuring a glowing Sunshine Gold border (`#FFB606`) with authentic Thriving Skills brand emblem badge pinned to the bottom-right corner.
- **Fluid Entrance Animation**: Coordinated spring scale (`Animated.spring`) and cubic fade-in (`Animated.timing`) for a high-end EdTech startup experience.
- **Brand Typography & Mission Tagline**: Official "Thriving **Skills**" wordmark, golden feature pill chip ("জাতির দক্ষতা বিনির্মাণে"), national mission subtitle ("Building a Skilled Nation • Learn, Grow & Lead"), and LMS workspace status indicator.

#### 2. 🔌 Upgraded Backend Companion Plugin (`ts-mobile-bridge` v1.1.0)
- **5-Tab Mobile Command Center**: Deployed and active on staging WordPress LMS with tabs for:
  1. *Overview & Health*: Real-time mobile connectivity, JWT status, and system telemetry.
  2. *Push Notifications Dispatcher*: Target individual learners or broadcast segmented campaign alerts.
  3. *Telemetry & Diagnostics*: Crash reporting and live mobile analytics logs.
  4. *Learner Sync & Cache Flush*: Instant forced sync for course catalogs, enrollments, and user profiles.
  5. *REST API Inspector*: Live interactive tester for mobile bridge endpoints.
- **Simplified 4-Field Registration**: Native registration (`/learnpress/v1/token/register`) requiring only Full Name, Email, Phone, and Password, with deterministic username generation and instant auto-login.

#### 3. 🎯 Canonical Department Taxonomy & Unique Vector Icons
- **Duplicate Categories Resolved**: Eliminated redundant live-training and sub-topic duplicates from WordPress/LearnPress taxonomies.
- **12 Canonical Subject Disciplines**: Unified catalog into 12 distinct non-overlapping disciplines with custom vector illustrations:
  - Generative AI, Business, Microsoft Excel, Finance & Legal, HRM, Leadership & Management, Personal Development, Sales & Marketing, Supply Chain, Data Science, Job Seekers, Research & Academic.

#### 4. 🎨 Full 4:3 Course Thumbnail Aspect Ratio
- **Natural Aspect Ratio**: Upgraded all course cards, carousels, and workshop cards to full 4:3 ratio matching official Thriving Skills banners (400x300).
- **Zero Letterbox Cropping**: Course titles and instructor portraits display with 100% full visibility and zero distortion.

#### 5. 🚀 Dynamic Course Browsing & Quick Peek Modal
- **Collapsible Catalog Deck**: Interactive toggle between condensed view and rich multi-row category exploration.
- **Trending Hot Topics**: Fast filtering for high-demand topics.
- **Course Quick Peek Modal**: Instantly preview curriculum lectures, duration, pricing, and enroll or bookmark with one tap without losing scroll position.

---

### Verification Metrics:
- **TypeScript Compiler (`tsc --noEmit`)**: 0 errors (Code 0)
- **Codebase Structural & Timer Audit**: 0 broken imports, 0 missing styles, 0 unhandled timers
- **Automated Test Suites**: 13/13 passed (100% success rate)
- **Target Android Architecture**: `arm64-v8a`, `armeabi-v7a`, `x86_64`
