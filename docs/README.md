# 📚 Thriving Skills (TSL) — Documentation Hub & Architecture Portal

Welcome to the centralized documentation repository for the **Thriving Skills** executive mobile application. All product requirements, technical designs, architecture audits, client specifications, proposals, and release records are consolidated here.

---

## 🗂️ Documentation Directory

### 1. Requirements & Roadmap
- 📄 [PRD.md](PRD.md) — Product Requirements Document: Learner personas, business rules, client requirements (CR-01–CR-05), and release criteria.
- 📄 [TRD.md](TRD.md) — Technical Requirements Document: Architecture, state contexts, API layer, recommendation engine, and memory safety.
- 📄 [FEATURES.md](FEATURES.md) — Comprehensive inventory of all 18+ functional modules, screen flows, and client deliverables.
- 📄 [TODO.md](TODO.md) — Milestone execution roadmap, active sprint tasks, and backlog tracker.
- 📄 [TRACK.md](TRACK.md) — Milestones progress and execution log.

### 2. Architecture & Technical Deep Dives
- 📄 [DOCUMENTATION.md](DOCUMENTATION.md) — Full technical architecture guide, service layers, security, offline caching, and native player integration.
- 📄 [TECH_STACK_ANALYSIS.md](TECH_STACK_ANALYSIS.md) — Exhaustive analysis of React Native Expo SDK 52, TypeScript, WordPress/LearnPress REST API, and native bridge.
- 📄 [CONTEXT.md](CONTEXT.md) — Business domain model, WordPress/LearnPress entities, secure storage keys, and authentication flows.
- 📄 [AGENTS.md](AGENTS.md) — Autonomous AI agent pairing guidelines, operating principles, guardrails, and verification checklists.

### 3. Testing, Verification & Quality Assurance
- 📄 [TEST_INFRA.md](TEST_INFRA.md) — Testing infrastructure, 13 automated test suites, CI quality gates, and verification scripts.
- 📄 [TEST_READY.md](TEST_READY.md) — Release readiness checklist and automated verification audit summary.
- 📄 [SKILLS.md](SKILLS.md) — Developer CLI tools, static analysis (`audit_app.js`), build commands, and testing runbooks.
- 📄 [BUGFIX.md](BUGFIX.md) — Chronological bugfix log, root-cause analyses, and resolutions.

### 4. Client Specifications & Governance
- 📄 [client_requirements.md](client_requirements.md) — Full audit of client requirements (CR-01 through CR-05) against the original Cybrcraft project proposal.
- 📄 [TSL_App_specifications.md](TSL_App_specifications.md) — Core application specifications and functional contracts.
- 📄 [Thriving_Skills_App_Review_and_new_requirement.md](Thriving_Skills_App_Review_and_new_requirement.md) — Client review notes, feedback sessions, and incremental feature requests.
- 📁 [proposals/](proposals/) — Original Cybrcraft project proposals (Word documents) and client review PDFs:
  - `Thriving-Skills-Mobile-App-Proposal-Cybrcraft.docx`
  - `Thriving-Skills-Mobile-App-Proposal-Cybrcraft-Revised.docx`
  - `Thriving-Skills-Mobile-App-Proposal-Cybrcraft-Presentable.docx`
  - `Thriving-Skills-Mobile-App-Proposal-Cybrcraft-Backup.docx`
  - `Thriving_Skills_App_Clien_Review.pdf`

### 5. Releases & Versioning
- 📄 [CHANGELOG.md](CHANGELOG.md) — Exhaustive version history from v1.0.0 through v1.4.0.
- 📄 [CONTRIBUTING.md](CONTRIBUTING.md) — Developer workflow, branch strategies, Conventional Commits, and PR guidelines.
- 📁 [releases/](releases/) — Detailed per-version release notes:
  - [release_notes_v1.4.0.md](releases/release_notes_v1.4.0.md) — Simplified 4-field registration, auto-username, habit notifications queue, uniform cards, live DB sync.
  - [release_notes_v4.0.6.md](releases/release_notes_v4.0.6.md)
  - [release_notes_v4.0.4.md](releases/release_notes_v4.0.4.md)
  - [release_notes_v4.0.3.md](releases/release_notes_v4.0.3.md)

---

## 🏛️ Project Architecture Summary

```
thrivingskill.app/
├── android/                 # Native Android project (Gradle, Kotlin, C++ Media3)
├── assets/                  # High-density brand icons, splash screens, SVG badges
├── backend-plugin/          # WordPress Companion REST API plugin (ZIP & source)
├── builds/                  # Local preview APK builds
├── dist/                    # Static web export bundle
├── docs/                    # Centralized Documentation Hub (Specs, TRD, PRD, Releases)
│   ├── proposals/           # Client proposals & review documents (.docx, .pdf)
│   ├── releases/            # Version-specific release notes
│   └── superpowers/plans/   # Architecture and design plans
├── scripts/                 # Automated audit, test runners, packaging, APK builders
├── src/                     # Core React Native TypeScript Application Source
│   ├── components/          # Reusable UI widgets, modals, player, course cards
│   ├── context/             # React context state providers (Auth, Learning, Network, etc.)
│   ├── hooks/               # Custom hooks (navigation, auto-scroll, safe area)
│   ├── i18n/                # Bilingual dictionary (English / বাংলা)
│   ├── screens/             # Primary tab screens & feature views
│   ├── services/            # API clients, offline sync, secure storage, telemetry
│   ├── theme/               # Colors, typography, shapes, responsive grid
│   └── types/               # TypeScript interface contracts & data models
├── App.tsx                  # Root application entry component
├── app.json                 # Expo project manifest & configuration
├── package.json             # NPM dependencies & test/build scripts
├── README.md                # Root project portal & quick start guide
└── tsconfig.json            # Strict TypeScript configuration
```
