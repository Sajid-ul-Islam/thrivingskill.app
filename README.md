# 🚀 Thriving Skills (TSL) — AI-Powered Executive EdTech Mobile Platform

[![React Native](https://img.shields.io/badge/React_Native-Expo_SDK_52-20232A?style=for-the-badge&logo=react)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3_Strict-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![CI Quality Gate](https://img.shields.io/badge/CI-Passing_Strict-success?style=for-the-badge&logo=githubactions)](https://github.com/Sajid-ul-Islam/thrivingskill.app/actions)
[![Bilingual](https://img.shields.io/badge/Language-English_%7C_বাংলা-10B981?style=for-the-badge)](https://thrivingskill.com)
[![Version](https://img.shields.io/badge/Release-v1.4.0-blue?style=for-the-badge)](./CHANGELOG.md)

> **Official Mobile Application for [Thriving Skills Limited (thrivingskill.com)](https://thrivingskill.com)**  
> Empowering over 100,000+ professionals, university graduates, and enterprise leaders across Bangladesh with Fourth Industrial Revolution (4IR) capabilities, Generative AI integration, financial modeling, and executive leadership.

---

## 📚 Complete Project Documentation Suite

The project includes an exhaustive technical, product, and architectural specification suite:

| Specification | Document | Core Scope |
| :--- | :--- | :--- |
| **Product Requirements** | [PRD.md](./prd.md) | Vision, target personas, business rules, client requirements, release criteria |
| **Technical Requirements** | [TRD.md](./trd.md) | Architecture, state contexts, API layer, recommendation algorithm, memory safety |
| **Task & Feature Roadmap** | [TODO.md](./todo.md) | Milestones 1–5 completed, active tasks, upcoming backlog |
| **Bug Fix Log** | [BUGFIX.md](./bugfix.md) | Root-cause analysis and resolutions for all identified issues |
| **AI Agents Operating Guide** | [AGENTS.md](./agents.md) | Multi-agent architecture, Antigravity instructions, guardrails & operating rules |
| **Project Context & Domain** | [CONTEXT.md](./context.md) | Business domain, WordPress/LearnPress entities, storage keys, security |
| **Features Inventory** | [FEATURS.md](./featurs.md) | Exhaustive inventory of all 18+ functional modules and client requirements |
| **Developer Skills & Tools** | [SKILLS.md](./skills.md) | Automation scripts, `audit_app.js`, commands, testing runbooks |
| **Client Gap Analysis** | [Client Requirement.md](./client%20requirement.md) | Full audit of CR-01 to CR-05 against CyberCraft proposal |
| **Changelog** | [CHANGELOG.md](./CHANGELOG.md) | Detailed version history from v1.0.0 through v1.4.0 |
| **Developer Contributing** | [CONTRIBUTING.md](./CONTRIBUTING.md) | Git workflow, commit conventions, PR standards |
| **System Architecture** | [DOCUMENTATION.md](./DOCUMENTATION.md) | Comprehensive engineering documentation |

---

## 🎯 Client Functional Requirements (CR-01 to CR-05)

1. **CR-01: Behavior-Based Course Recommendation Engine**:
   - Calculates dynamic learner affinity based on watch history, search keywords, difficulty levels, and dwell time.
   - Showcases personalized course suggestions on the Home Screen under **"Recommended For You / আপনার জন্য বিশেষ প্রস্তাবিত"**.
2. **CR-02: Mandatory Course Review Gate for Certificate Release**:
   - Gated workflow intercepting 100% course completions with a required 1–5 star rating and written review before digital certificate issuance.
3. **CR-03: Continuous Video Auto-Play**:
   - Seamless next-lesson advance with a sleek 5-second countdown banner, animated ring, and "Play Now" / "Cancel" controls.
4. **CR-04: Mobile Number + SMS OTP Authentication**:
   - Frictionless login and registration tailored for Bangladeshi mobile users (`+880 1X-XXXXXXXX`) with 60-second cooldown timers and direct email fallback.
5. **CR-05: Authenticated Learner Profile & Analytics Dashboard**:
   - Enrolled Courses shelf with active progress tracking and direct "Continue Learning" CTA.
   - Graduated Courses shelf with verified completion certificates and Gold ribbon badges.
   - High-fidelity visual learning analytics: SVG Circular Mastery Donut Chart & 7-day Weekly Velocity Bar Chart.

---

## 🎨 Official Brand Identity Palette

- **Brand Deep Navy (`#102F53`)**: Primary headers, card backgrounds, navigation accents.
- **Sunshine Gold (`#FFB606`)**: Achievement badges, graduation ribbons, star ratings, certificate highlights.
- **Crimson / Coral (`#E34234`)**: Primary CTA buttons, active state indicators.
- **Slate & Crisp Surface Whites (`#F8FAFC`, `#FFFFFF`, `#0F192C`)**: High contrast WCAG AAA compliant text and card surfaces.

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
```

### 3. Code Verification & Automated Health Audit
```bash
# Strict TypeScript compiler verification (0 errors required)
npm run typecheck

# Full codebase static analysis (75 files: imports, styles, timers, JSON parsing)
node scripts/audit_app.js
```

---

## 🔒 Legal & Intellectual Property Notice

**© 2026 Thriving Skills Limited (TSL). All Rights Reserved.**  
All content, course curricula, video assets, brand marks, and technical systems are the exclusive intellectual property of Thriving Skills Limited.

- **Corporate Head Office**: House 10, Road 53, Gulshan-2, Dhaka-1212, Bangladesh
- **Hotline Helpline**: `+880 1312-100288`
- **Official Website**: [thrivingskill.com](https://thrivingskill.com)
- **Support Email**: [support@thrivingskill.com](mailto:support@thrivingskill.com)
