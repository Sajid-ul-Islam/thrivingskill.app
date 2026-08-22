# Thriving Skills — SaaS Executive Upskilling & Workforce Transformation Platform

<div align="center">
  <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80" alt="Logo" width="80" height="80" style="border-radius: 40px;" />
  <h3>Bridging Academic Learning to Industry Excellence</h3>
  <p>Practical Executive Upskilling in Generative AI, Financial Modeling, Data Analytics, HR & Strategic Leadership</p>
</div>

---

## ⚡ SaaS Industry-Grade Features

### 💎 Multi-Tier Subscription & Billing Engine
- **Starter (Free)**, **Pro Executive ($29/mo or $290/yr)**, and **Enterprise Scale ($79/seat/mo)** plans.
- Monthly / Annual switcher with instant 20% discount calculation.
- Feature comparison matrix, plan entitlement gating, and invoice receipt generation.

### 🏢 B2B Enterprise Team Hub & Workforce Analytics
- **Multi-Tenant Workspace Switcher**: Toggle between **Personal Profile** and **Apex Corp Enterprise Portal**.
- **Real-Time Seat Management**: Provision and manage enterprise team licenses (e.g. 18 / 25 seats active).
- **Department Competency Matrix**: AI-assessed proficiency benchmarks across AI, Financial Modeling, Analytics, and Leadership.
- **Team Roster & Course Assignments**: Assign executive curricula with due dates, track employee progress, and export audit reports (CSV).

### 🤖 Executive AI Skill Copilot
- Context-aware conversational AI tutor for business leaders.
- Quick prompt blueprints: *Audit DCF Financial Models*, *Draft RTCC AI Prompts*, *Generate 30-Day Team Upskilling Roadmaps*, and *Boardroom Roleplay*.

### 📊 Diagnostic Skill Assessment Engine
- 5-domain executive diagnostic test with instant readiness scoring (0–100%).
- Visual competency breakdown across domains and 1-click enrollment into recommended pathways.

### 🏆 Verifiable Digital Credentials & Notification Center
- Real-time SaaS notifications for team assignments, live clinics, and certificate releases.
- Shareable industry-verified certificates with QR verification codes and LinkedIn badges.

---

## 🛠️ Tech Stack

- **Framework**: React Native with [Expo SDK 51](https://expo.dev)
- **Language**: TypeScript (Strict type safety)
- **State & Storage**: React Context + `@react-native-async-storage/async-storage` (SaaSContext, LearningContext, ThemeContext)
- **UI & Icons**: `@expo/vector-icons` (Ionicons), `react-native-safe-area-context`
- **Gradients**: `expo-linear-gradient`

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the App
```bash
# Start Metro bundler
npm start

# Run on Android emulator / device
npm run android

# Run on iOS simulator
npm run ios

# Run on Web browser
npm run web
```

---

## 📁 Project Structure

```
thrivingskill.app/
├── App.tsx                              # Root Shell, SaaS Navigation & Modal Router
├── src/
│   ├── components/                      # Reusable UI & Modal Library
│   │   ├── Header.tsx                   # Enterprise Header (Workspace Picker, Plan Badge, Notifications)
│   │   ├── SubscriptionModal.tsx        # Multi-Tier SaaS Pricing & Billing Modal
│   │   ├── NotificationModal.tsx        # Real-Time SaaS Notification Center
│   │   ├── SkillAssessmentModal.tsx     # Executive Diagnostic Skill Test & Radar
│   │   ├── EnterpriseSeatModal.tsx      # Team Seat Provisioning & Member Invite
│   │   ├── CertificateModal.tsx         # Verified Credential Viewer & QR Sharing
│   │   ├── CorporateInquiryModal.tsx    # B2B Enterprise Inquiry Portal
│   │   ├── CourseCard.tsx               # Masterclass Card with Pro/Enterprise Badges
│   │   ├── LiveWorkshopCard.tsx         # Interactive Cohort Clinic RSVP Card
│   │   ├── CurriculumAccordion.tsx      # Module & Lesson Playlist Accordion
│   │   ├── QuizModal.tsx                # Multiple-Choice Knowledge Check Runner
│   │   ├── NotesModal.tsx               # Timestamped In-Lecture Note Taker
│   │   └── ProgressBar.tsx              # Smooth Progress Bar Component
│   ├── context/
│   │   ├── SaaSContext.tsx              # Subscriptions, Workspaces, Team Analytics, AI Copilot
│   │   ├── LearningContext.tsx          # Course Progress, Enrollments & Certificates
│   │   └── ThemeContext.tsx             # Dark & Light Mode Color Tokens
│   ├── screens/
│   │   ├── HomeScreen.tsx               # SaaS Hero, Quick Action 4-Grid & Curated Masterclasses
│   │   ├── CoursesScreen.tsx            # Course Catalog with Level Filters & Pro Badges
│   │   ├── SkillCopilotScreen.tsx       # Executive AI Tutor & Prompt Blueprint Engine
│   │   ├── EnterpriseTeamScreen.tsx     # B2B Team Hub, Seat Allocation & Skill Competency
│   │   ├── MyLearningScreen.tsx         # Learner Portfolio, In-Progress Courses & Credentials
│   │   ├── WorkshopsScreen.tsx          # Live Masterclasses & Clinics
│   │   ├── ProfileScreen.tsx            # SaaS Account, Subscription Management & Invoices
│   │   ├── CourseDetailScreen.tsx       # Masterclass Overview, Syllabus & Reviews
│   │   └── LessonPlayerScreen.tsx       # Video Lecture Player, Scrubber, Notes & Quiz
│   ├── data/
│   │   └── mockData.ts                  # Course Catalog, Workshops & Corporate Alumni
│   ├── theme/
│   │   └── colors.ts                    # Emerald & Indigo Executive Tokens
│   └── types/
│       └── index.ts                     # TypeScript Definitions (SaaS Tiers, Workspaces, Teams)
└── package.json
```

