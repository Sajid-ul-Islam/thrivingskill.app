# 🚀 Thriving Skills (TSL) — AI-Powered Executive EdTech Mobile Platform

[![React Native](https://img.shields.io/badge/React_Native-Expo_SDK_52-20232A?style=for-the-badge&logo=react)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3_Strict-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![CI Quality Gate](https://img.shields.io/badge/CI-Passing_Strict-success?style=for-the-badge&logo=githubactions)](https://github.com/Sajid-ul-Islam/thrivingskill.app/actions)
[![Bilingual](https://img.shields.io/badge/Language-English_%7C_বাংলা-10B981?style=for-the-badge)](https://thrivingskill.com)
[![Version](https://img.shields.io/badge/Release-v1.4.0-blue?style=for-the-badge)](./docs/CHANGELOG.md)

> **Official Mobile Application for [Thriving Skills Limited (thrivingskill.com)](https://thrivingskill.com)**  
> Empowering over 100,000+ professionals, university graduates, and enterprise leaders across Bangladesh with Fourth Industrial Revolution (4IR) capabilities, Generative AI integration, financial modeling, and executive leadership.

---

## 📚 Complete Project Documentation Suite

All detailed specifications, technical architectures, client proposals, and release logs are consolidated in the [docs/](./docs/) directory:

| Specification | Document | Core Scope |
| :--- | :--- | :--- |
| **Documentation Portal** | [docs/README.md](./docs/README.md) | Centralized index of all specifications and architecture guides |
| **Product Requirements** | [PRD.md](./docs/PRD.md) | Vision, target personas, business rules, client requirements, release criteria |
| **Technical Requirements** | [TRD.md](./docs/TRD.md) | Architecture, state contexts, API layer, recommendation algorithm, memory safety |
| **System Architecture** | [DOCUMENTATION.md](./docs/DOCUMENTATION.md) | Comprehensive engineering documentation, services, and native player |
| **Task & Feature Roadmap** | [TODO.md](./docs/TODO.md) | Milestones 1–5 completed, active tasks, upcoming backlog |
| **Bug Fix Log** | [BUGFIX.md](./docs/BUGFIX.md) | Root-cause analysis and resolutions for all identified issues |
| **AI Agents Operating Guide** | [AGENTS.md](./docs/AGENTS.md) | Multi-agent architecture, Antigravity instructions, guardrails & operating rules |
| **Project Context & Domain** | [CONTEXT.md](./docs/CONTEXT.md) | Business domain, WordPress/LearnPress entities, storage keys, security |
| **Features Inventory** | [FEATURES.md](./docs/FEATURES.md) | Exhaustive inventory of all 18+ functional modules and client deliverables |
| **Developer Skills & Tools** | [SKILLS.md](./docs/SKILLS.md) | Automation scripts, `audit_app.js`, commands, testing runbooks |
| **Client Requirements Audit** | [client_requirements.md](./docs/client_requirements.md) | Full audit of CR-01 to CR-05 against CyberCraft proposal |
| **Changelog & History** | [CHANGELOG.md](./docs/CHANGELOG.md) | Detailed version history from v1.0.0 through v1.4.0 |
| **Developer Contributing** | [CONTRIBUTING.md](./docs/CONTRIBUTING.md) | Git workflow, commit conventions, PR standards |
| **Tech Stack Deep Dive** | [TECH_STACK_ANALYSIS.md](./docs/TECH_STACK_ANALYSIS.md) | In-depth evaluation of Expo SDK 52, WordPress REST APIs, and native modules |
| **Testing Infrastructure** | [TEST_INFRA.md](./docs/TEST_INFRA.md) | 13 automated test suites, CI quality gate, and mock assertions |
| **Client Proposals & Reviews** | [docs/proposals/](./docs/proposals/) | Original proposal documents (.docx) and client review audits (.pdf) |
| **Release Archive** | [docs/releases/](./docs/releases/) | Per-version changelogs and build notes (`v1.4.0`, `v4.0.3`–`v4.0.6`) |

---

## 🎯 Key Capabilities & Client Requirements

### Client Functional Requirements (CR-01 to CR-05)
1. **CR-01: Behavior-Based Course Recommendation Engine**:
   - Calculates dynamic learner affinity based on watch history, search keywords, difficulty levels, and dwell time.
   - Showcases personalized course suggestions on the Home Screen under **"Recommended For You / আপনার জন্য বিশেষ প্রস্তাবিত"**.
2. **CR-02: Mandatory Course Review Gate for Certificate Release**:
   - Gated workflow intercepting 100% course completions with a required 1–5 star rating and written review before digital certificate issuance.
3. **CR-03: Continuous Video Auto-Play & Background PiP**:
   - Seamless next-lesson advance with a sleek 5-second countdown banner, animated ring, and "Play Now" / "Cancel" controls.
   - Picture-in-Picture (PiP) and continuous background audio playback for multitasking learners.
4. **CR-04: Native LearnPress JWT Authentication & Instant Onboarding**:
   - Direct, authentic session token exchange (`/learnpress/v1/token`), token validation (`/learnpress/v1/token/validate`), and WordPress email password recovery.
   - Simplified **4-Field Registration** (`fullName`, `email`, `phone`, `password`) with automated unique username generation (`sajidislam582`) and instant tokenized auto-login.
5. **CR-05: Authenticated Learner Profile & Analytics Dashboard**:
   - Enrolled Courses shelf with active progress tracking and direct "Continue Learning" CTA.
   - Graduated Courses shelf with verified completion certificates and Gold ribbon badges.
   - Visual learning analytics: SVG Circular Mastery Donut Chart & 7-day Weekly Velocity Bar Chart.

### Recent Enhancements (v1.4.0)
* **Streamlined 4-Field Registration & Auto-Login**: Eliminates complex registration friction. Full Name, Email, Phone, and Password are all that's required; username is auto-generated from email, and registration immediately logs in without blocking on verification links.
* **In-App Profile Editing & Live Web Sync**: Edit Name, Bio, Phone, City, Social, and Avatars inside the app with persistence to `/wp/v2/users/me` and `/learnpress/v1/users/{id}`. Edits made on `https://thrivingskill.com` automatically sync down to the app via `AppState` foreground detection and pull-to-refresh.
* **Habit-Based Smart Notification Queue**: Background scheduler batches and delivers contextual study reminders during learner habit hours, paired with a simple 1-tap clear/dismiss action.
* **Uniform Course Cards (Pixel-Perfect Consistency)**: Standardized card heights (332dp), uniform 16:9 thumbnail ratios, two-line clamped titles (40dp), and aligned action footers across all screens and carousels.
* **WordPress Companion Plugin**: Single-plugin WordPress companion ([`backend-plugin/ts-mobile-bridge`](./backend-plugin/ts-mobile-bridge)) built as an installable ZIP in CI, providing `/wp-json/thrivingskill/v1/*` and `/wp-json/tsl/v1/auth/*` endpoints with LearnPress fallback.

---

## 🎨 Official Brand Identity Palette

- **Brand Deep Navy (`#102F53`)**: Primary headers, card backgrounds, navigation accents.
- **Sunshine Gold (`#FFB606`)**: Achievement badges, graduation ribbons, star ratings, certificate highlights.
- **Crimson / Coral (`#E34234`)**: Primary CTA buttons, active state indicators.
- **Slate & Crisp Surface Whites (`#F8FAFC`, `#FFFFFF`, `#0F192C`)**: High contrast WCAG AA/AAA compliant text and card surfaces.

---

## 🏛️ Clean Repository Structure

```
thrivingskill.app/
├── android/                 # Native Android project (Gradle, Kotlin, C++ Media3)
├── assets/                  # High-density brand icons, splash screens, SVG badges
├── backend-plugin/          # WordPress Companion REST API plugin (ZIP & source)
├── builds/                  # Local preview APK builds
├── dist/                    # Static web export bundle
├── docs/                    # Centralized Documentation Hub
│   ├── proposals/           # Client proposals & review documents (.docx, .pdf)
│   ├── releases/            # Version-specific release notes
│   └── superpowers/plans/   # Architecture and design plans
├── scripts/                 # Automated audit, test runners, packaging, APK builders
├── src/                     # Core React Native TypeScript Application Source
├── App.tsx                  # Root application entry component
├── app.json                 # Expo project manifest & configuration
├── package.json             # NPM dependencies & test/build scripts
├── README.md                # Root project portal & quick start guide
└── tsconfig.json            # Strict TypeScript configuration
```

---

## 🚀 Quick Start Guide

### 1. Installation
```bash
git clone https://github.com/Sajid-ul-Islam/thrivingskill.app.git
cd thrivingskill.app
npm install
```

### 2. Run Local Development Server
```bash
# Start Metro bundler
npm start

# Run on Android emulator / connected device
npm run android

# Run on iOS simulator
npm run ios

# Run web preview
npm run web
```

### 2b. Environment Variables (`EXPO_PUBLIC_*`)
- **How env values reach builds**: Expo/Metro only inlines **static literal** `process.env.EXPO_PUBLIC_*` references at bundle time (dynamic `process.env[key]` lookups remain `undefined` in release Hermes bundles).
  - Local runs load `.env.development` (or `.env.production` when bundling production, plus `.env.local` overrides; copy `.env.example` as a starting template).
  - EAS cloud builds (`preview`, `production`) inject their `env` blocks directly from [`eas.json`](eas.json).
- **Security rules**:
  - Required variables (`EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_SITE_URL`) are validated on startup in non-production builds before network-calling providers mount.
  - Production builds never fail over to staging and disable runtime server switching.
  - Never place secret credentials (e.g., AI provider keys or WooCommerce secrets) in `EXPO_PUBLIC_*` variables.

### 3. Automated Code Verification & Health Audit
```bash
# ESLint & Prettier verification
npm run lint
npm run format:check

# Strict TypeScript compiler verification (0 errors required)
npm run typecheck

# Full codebase static analysis (imports, styles, timers, JSON parsing)
npm run audit

# Offline Jest test suite with coverage + structural checks
npm run test:ci
```

### 4. EAS Cloud Builds & App Store Submissions
- **Preview Builds**: Triggered automatically on pull requests via [`.github/workflows/eas-build.yml`](.github/workflows/eas-build.yml) (requires `EXPO_TOKEN` repository secret), or manually with `npm run build:preview`.
- **Production Releases**: Triggered automatically on semantic version tags (`v*.*.*`), or manually with `npm run build:prod`.
- **Store Submissions**: Configure Google Play service account (`GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` / `serviceAccountKeyPath`) and Apple App Store Connect (`ascAppId`, `appleTeamId` in `eas.json` or via `EXPO_APPLE_APP_SPECIFIC_PASSWORD`), then run:
```bash
npx eas-cli submit --platform android --profile production
npx eas-cli submit --platform ios --profile production
```

---

## 🔒 Legal & Intellectual Property Notice

**© 2026 Thriving Skills Limited (TSL). All Rights Reserved.**  
All content, course curricula, video assets, brand marks, and technical systems are the exclusive intellectual property of Thriving Skills Limited.

- **Corporate Head Office**: House 10, Road 53, Gulshan-2, Dhaka-1212, Bangladesh
- **Hotline Helpline**: `+880 1312-100288`
- **Official Website**: [thrivingskill.com](https://thrivingskill.com)
- **Support Email**: [support@thrivingskill.com](mailto:support@thrivingskill.com)
