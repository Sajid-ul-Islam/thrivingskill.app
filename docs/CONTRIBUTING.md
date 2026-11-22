# 🤝 Contributing to Thriving Skills (TSL) Mobile App

Welcome to the **Thriving Skills Limited** mobile engineering team! This handbook outlines the technical standards, Git workflows, quality assurance gates, build commands, and hotfix release procedures required to build and maintain a world-class, production-grade application.

---

## 📑 Table of Contents
1. [Developer Onboarding & Setup](#1-developer-onboarding--setup)
2. [Git Workflow & Branching Strategy](#2-git-workflow--branching-strategy)
3. [Commit Message Standards (Conventional Commits)](#3-commit-message-standards)
4. [Pull Requests & Code Review Protocol](#4-pull-requests--code-review-protocol)
5. [Quality Assurance & Type Safety](#5-quality-assurance--type-safety)
6. [Cloud Builds (EAS Build)](#6-cloud-builds-eas-build)
7. [Production Hotfixes & OTA Updates (EAS Update)](#7-production-hotfixes--ota-updates)
8. [Code Style & Best Practices](#8-code-style--best-practices)

---

## 1. Developer Onboarding & Setup

### Prerequisites
- **Node.js**: `v20.x` (LTS recommended)
- **Package Manager**: `npm` (v10+)
- **Mobile Testing**: 
  - Install **Expo Go** from Google Play Store or Apple App Store on your physical phone, OR
  - Setup an Android Studio emulator / Xcode simulator.

### Setup Instructions
1. **Clone the repository:**
   ```bash
   git clone https://github.com/Sajid-ul-Islam/thrivingskill.app.git
   cd thrivingskill.app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Open `.env` and fill in any required API keys (e.g., `EXPO_PUBLIC_GEMINI_API_KEY`).

4. **Start the local development server:**
   ```bash
   npm start
   ```
   Scan the terminal QR code using **Expo Go** on your device.

---

## 2. Git Workflow & Branching Strategy

We follow a structured **GitHub Flow** with branch protection rules on `master`. **Never push code directly to `master`.**

```
master (Production) ────●─────────────────────●─────── (EAS Production / OTA Update)
                         \                   /
feature/review-gating     ●─────●─────●─────● (Pull Request + CI Check)
```

### Branch Naming Conventions
| Branch Prefix | Purpose | Example |
| :--- | :--- | :--- |
| `feature/` | New functionality, screens, or components | `feature/bkash-direct-checkout` |
| `fix/` | Bug fixes and non-critical repairs | `fix/video-aspect-ratio` |
| `hotfix/` | Critical production emergencies | `hotfix/otp-sms-rate-limit` |
| `docs/` | Documentation, guides, and specifications | `docs/api-contracts` |
| `refactor/` | Code refactoring without behavior change | `refactor/learning-context-cleanup` |

### Step-by-Step Feature Development Flow
1. **Always pull the latest `master` before branching:**
   ```bash
   git checkout master
   git pull origin master
   ```
2. **Create your feature branch:**
   ```bash
   git checkout -b feature/my-new-feature
   ```
3. **Develop, verify types locally, and commit:**
   ```bash
   npm run typecheck
   git add .
   git commit -m "feat: implement my new feature"
   ```
4. **Push your branch to GitHub:**
   ```bash
   git push origin feature/my-new-feature
   ```
5. **Open a Pull Request on GitHub** targeting `master`.

---

## 3. Commit Message Standards

We enforce [Conventional Commits](https://www.conventionalcommits.org/). Each commit must use one of the standard prefixes:

- `feat:` A new user-facing or technical feature
- `fix:` A bug fix
- `docs:` Documentation changes only
- `refactor:` Code restructuring that does not fix a bug or add a feature
- `perf:` Performance optimizations
- `test:` Adding or correcting tests
- `chore:` Build scripts, package updates, or configuration changes

**Examples:**
```bash
git commit -m "feat: add continuous video autoplay with 5-second countdown"
git commit -m "fix: gate certificate download until mandatory review is completed"
git commit -m "docs: add API schema for mobile OTP authentication"
```

---

## 4. Pull Requests & Code Review Protocol

### PR Guidelines
1. Fill out the provided **PR Template** completely.
2. Link the corresponding issue or requirement.
3. Attach screenshots/recordings for any visual UI changes.
4. Ensure GitHub Actions CI passes with a green checkmark.

### Review Expectations
- Every PR requires **at least 1 approving review** before merging.
- Reviewers will check for:
  - Strict TypeScript compliance (no `any` without strong justification).
  - Bilingual UI parity (all text accessible in both English and Bangla).
  - Offline-first resilience (graceful handling of network timeouts).
  - Memory leak prevention (proper cleanup of timers, event listeners, and subscriptions).

---

## 5. Quality Assurance & Type Safety

Before pushing or opening a PR, run the local quality checks:

```bash
# 1. Strict TypeScript type check
npm run typecheck

# 2. Dry-run export verification
npx expo export --dump-sourcemap=false
```

> ⚠️ **Zero-Tolerance Rule:** Pull requests with TypeScript errors or broken imports will be blocked automatically by the CI pipeline.

---

## 6. Cloud Builds (EAS Build)

We utilize Expo Application Services (EAS) for cloud builds.

### 1. Internal QA / Testing APK (`preview` profile)
Generates an installable `.apk` that team members, QA testers, and stakeholders can download directly onto Android devices:
```bash
npm run build:preview
# or: eas build --profile preview --platform android
```

### 2. Official Production Release (`production` profile)
Generates an optimized `.aab` (Android App Bundle) ready for upload to Google Play Console:
```bash
npm run build:prod
# or: eas build --profile production --platform android
```

---

## 7. Production Hotfixes & OTA Updates

For production bug fixes, choose the appropriate deployment path:

### Path A: Over-The-Air (OTA) Instant Patch ⚡
If your hotfix affects **JavaScript, React components, styling, or business logic** (no native library additions):
1. Create a `hotfix/` branch from `master`.
2. Implement the fix and verify: `npm run typecheck`.
3. Merge into `master`.
4. Deploy an immediate OTA patch without waiting for Google Play review:
   ```bash
   eas update --channel production --message "Hotfix: resolve video countdown overlay timing"
   ```
Users receive the update automatically when they restart the app!

### Path B: Native Binary Release 📦
If you modified `app.json` native permissions or added new native libraries:
1. Increment `version` and `android.versionCode` in `app.json`.
2. Run `npm run build:prod`.
3. Submit the new `.aab` to Google Play Console (Internal testing track first).

---

## 8. Code Style & Best Practices

1. **Bilingual First**: All user-facing text should support both English and Bengali (`bn`). Use existing patterns from `src/context/LocalizationContext.tsx` or bilingual helper constants.
2. **Strict Typing**: All Context states, API response payloads, and Component props must have dedicated TypeScript interfaces.
3. **Safe Storage**: Use `AsyncStorage` with defensive JSON parsing (`try...catch`) and prefix storage keys with `@thriving_skill_`.
4. **Resilient APIs**: Always wrap network calls with the centralized service in `src/services/api/` or `src/services/wordpressApi.ts` to benefit from automatic retries, in-memory caching, and offline fallbacks.
