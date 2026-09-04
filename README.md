# 🚀 Thriving Skills (TSL) — AI-Powered Executive EdTech & Capability Transformation Platform

[![React Native](https://img.shields.io/badge/React_Native-Expo_SDK_51-20232A?style=for-the-badge&logo=react)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3_Strict-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Google Gemini AI](https://img.shields.io/badge/Google_Gemini-2.5_Flash-8E75B2?style=for-the-badge&logo=google)](https://deepmind.google/technologies/gemini/)
[![Bilingual](https://img.shields.io/badge/Language-English_%7C_বাংলা-10B981?style=for-the-badge)](https://thrivingskill.com)
[![Status](https://img.shields.io/badge/Production-Verified_0_Errors-success?style=for-the-badge)]()

> **Official Mobile Application for [Thriving Skills Limited (thrivingskill.com)](https://thrivingskill.com)**  
> Empowering over 100,000+ professionals, university graduates, and enterprise leaders across Bangladesh and South Asia with future-ready Fourth Industrial Revolution (4IR) capabilities, Generative AI integration, financial modeling, and executive leadership.

---

## 🌟 Vision & Executive Leadership

**Thriving Skills Limited (TSL)** is a premier corporate training, skill acceleration, and EdTech enterprise registered under the Registrar of Joint Stock Companies & Firms (RJSC), Dhaka, Bangladesh.

### 👔 Executive Founders & Core Team
All leadership credentials and photos are authentically sourced from the official [thrivingskill.com leadership portal](https://thrivingskill.com/about/):

- **Md. Abdullah Al Mahmud** — *Founder & Chief Executive Officer (CEO)*  
  Visionary leader in 4IR workforce readiness, corporate strategy, and nationwide skills summits.
- **Syed Nuruddin Ahmed** — *Founder & Chairman*  
  Accomplished corporate governance executive, financial strategist, and investor.
- **Yusuf Iqbal** — *Corporate Accountant & Financial Controller*  
  Lead financial analyst and corporate governance specialist.
- **Tareq Siddiqui** — *Senior Executive & Operations Lead*  
  Enterprise client relations, institutional MoUs, and program management.
- **Abdulla Al Noman** — *Lead Web & Systems Developer*  
  LMS infrastructure architect and full-stack software engineer.

---

## 🤝 Official Institutional Partnerships & Summits

Thriving Skills maintains bilateral Memorandums of Understanding (MoUs) and flagship national summit partnerships with premier universities, government divisions, and chartered professional bodies:

### 🎓 Academic Institutions & Bilateral MoUs
- **Eastern University (EU)**: Official bilateral MoU for integrating AI, prompt engineering, and modern technical tools into academic curricula and student development.
- **University of Dhaka (DU / DUCSU)**: Co-organizer of the national **Bangladesh Skills Summit** held at the historic Dhaka University Senate Bhaban.
- **North South University (NSU CPC)**: Co-organizer of the **4IR Skills Summit**, convening corporate leaders, researchers, and tech pioneers on Generative AI.
- **Ahsanullah University of Science and Technology (AUST School of Business)**: Co-organizer of the **Employability & Skills Summit** connecting graduates directly to corporate recruiters.
- **Comilla University (CoU) & Manarat International University (MIU)**: Nationwide skills development workshops and youth training initiatives.

### 🏛️ Government & National Innovation
- **Aspire to Innovate (a2i)** — *ICT Division & Cabinet Division, Government of Bangladesh*: Strategic collaborator for advancing nationwide digital capabilities, Smart Bangladesh 2041 visions, and 4IR readiness.
- **United Nations SDG-4**: Committed to Quality Education, lifelong vocational learning, and accessible upskilling for all.

### 💼 Apex Industry Councils
- **ICMAB (Institute of Cost & Management Accountants of Bangladesh)**: Professional accounting, corporate finance, and business valuation masterclasses.
- **BASIS (Bangladesh Association of Software and Information Services)**: Strategic linkage with the national IT ecosystem, SoftExpo participation, and bridging tech talent deficits.

---

## 💎 Key Platform Features

### 🤖 Google Gemini AI Executive Career Mentor
- Seamless integration with Google DeepMind's Gemini API (`gemini-2.5-flash`).
- Personalized career path recommendations, CV critique, prompt blueprints, and code explanations.
- Resilient multi-tier model fallback: `gemini-2.5-flash` ➔ `gemini-2.5-pro` ➔ `gemini-1.5-flash` ➔ `gemini-1.5-pro`.
- Active API Key management and live connectivity verification.

### 🌐 Dual-Language Engine (English & বাংলা)
- Instant 1-tap language toggle across the entire application.
- Authentic localized Bengali typography, terminology, and course meta.

### 📺 Official YouTube Ecosystem Integration
- Live synchronized feed from the official [@thrivingskill](https://www.youtube.com/@thrivingskill) channel.
- Micro-learning tutorials, skills clips, Excel formula breakdowns, and live workshop replays with smooth auto-scroll.

### 🏢 B2B Enterprise Team Workspace
- Multi-tenant workspace switcher: personal learning vs corporate team seat allocation.
- Employee skill competency matrix, department progress reports, and team enrollment assignments.

### 📜 Comprehensive Legal Compliance & Rights Reserved
- **Terms of Service**: Strict intellectual property protection, single-device learning rights, and SSLCommerz payment guidelines.
- **Privacy Policy**: Dual-language coverage (English & বাংলা) guaranteeing end-to-end data privacy, zero unauthorized third-party sharing, and full GDPR/local law compliance.
- **All Rights Reserved**: Official registered office coordinates (House 10, Road 53, Gulshan-2, Dhaka-1212) and 24/7 hotline helpline (`+880 1312-100288`).

### 📲 In-App OTA Updates Engine
- Check and install over-the-air platform enhancements instantly without downloading a new APK.

---

## 🛠️ Tech Stack & Architecture

| Layer | Technologies |
|---|---|
| **Core Framework** | React Native with Expo SDK 51 |
| **Language** | TypeScript 5.3 (Strict Type Checking, 0 Warnings/Errors) |
| **Styling & Theme** | Dynamic Dark/Light Mode with custom semantic tokens (`src/theme/colors.ts`) |
| **State Management** | React Context API + `@react-native-async-storage/async-storage` |
| **AI Backend** | Google Gemini Generative AI REST API |
| **Navigation & Modals**| Custom Native Animated Overlays, Bottom Drawers, Safe Area Context |
| **Icons & Media** | `@expo/vector-icons` (Ionicons), `expo-linear-gradient`, bundled team assets |

---

## 📁 Project Structure

```
thrivingskills/
├── assets/
│   ├── icon.png                         # High-res official brand icon
│   ├── splash.png                       # Splash screen asset
│   └── team/                            # Authentic Founder & Verified Team Assets
│       ├── abdullah_al_mahmud.jpeg      # Md. Abdullah Al Mahmud (Founder & CEO)
│       ├── syed_nuruddin_ahmed.jpeg     # Syed Nuruddin Ahmed (Founder & Chairman)
│       ├── yusuf_iqbal.jpeg             # Yusuf Iqbal (Corporate Accountant)
│       ├── tareq_siddiqui.jpeg          # Tareq Siddiqui (Senior Executive)
│       ├── abdulla_al_noman.jpeg        # Abdulla Al Noman (Web Developer)
│       ├── humaira_sharmeen.png         # Lead Excel & Data Specialist
│       ├── moinuddin_chowdhury.png      # Corporate Sales & Leadership
│       └── arif_khan.png, km_ali.png... # Industry Faculty
├── src/
│   ├── components/                      # Reusable UI & Modal Components
│   │   ├── AboutTSLModal.tsx            # Corporate Overview, Team, Partners & MoUs
│   │   ├── LegalPolicyModal.tsx         # Terms & Conditions, Privacy Policy (EN & BN)
│   │   ├── BrandDrawer.tsx              # Hamburger Navigation with Quick Policies
│   │   ├── AppUpdateModal.tsx           # In-App OTA Update Engine
│   │   ├── CommunityFeedModal.tsx       # Student & Alumni Community Shelf
│   │   ├── CourseCard.tsx               # Interactive Masterclass Card
│   │   ├── Header.tsx                   # Enterprise App Header & Search
│   │   └── YouTubeCard.tsx              # YouTube Learning Component
│   ├── context/                         # Global State Providers
│   │   ├── AuthContext.tsx              # WordPress REST & Learner Auth
│   │   ├── GamificationContext.tsx      # Badges, Streaks & Daily Habits
│   │   ├── LanguageContext.tsx          # English / বাংলা Translation Engine
│   │   ├── LearningContext.tsx          # Progress, Quizzes, Certificates
│   │   ├── SaaSContext.tsx              # Enterprise Workspaces & AI Mentorship
│   │   ├── ThemeContext.tsx             # Theme Mode State
│   │   └── YouTubeContext.tsx           # YouTube Media Playback & Cache
│   ├── data/
│   │   ├── mockData.ts                  # Courses, Verified Faculty, Corporates, Reviews
│   │   └── youtubeVideos.ts             # Official YouTube Channel Playlists
│   ├── screens/                         # Primary Mobile Screens
│   │   ├── HomeScreen.tsx               # Hero, Founder Spotlight, Partners, Footer
│   │   ├── CoursesScreen.tsx            # Full Catalog & Filter Engine
│   │   ├── SkillCopilotScreen.tsx       # Google Gemini AI Assistant & Prompt Tools
│   │   ├── EnterpriseTeamScreen.tsx     # B2B Workforce Dashboard & Seat Allocation
│   │   ├── MyLearningScreen.tsx         # Enrolled Masterclasses & Certificates
│   │   └── ProfileScreen.tsx            # Settings, Legal Links, Help & Account
│   ├── theme/
│   │   └── colors.ts                    # Semantic Palette Tokens
│   └── types/
│       └── index.ts                     # Core TypeScript Interfaces
├── app.json                             # Expo Configuration
├── package.json                         # Dependencies and Scripts
└── tsconfig.json                        # Strict TypeScript Rules
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn
- Expo Go app on iOS or Android (or Android Studio / Xcode simulator)

### 2. Installation
```bash
git clone https://github.com/Sajid-ul-Islam/thrivingskill.app.git
cd thrivingskill.app
npm install
```

### 3. Start Development Server
```bash
# Start Metro bundler with Expo Go tunnel
npm start

# Run directly on Android
npm run android

# Run directly on iOS
npm run ios

# Run directly on Web
npm run web
```

### 4. Verify Code Quality & Type Safety
```bash
# Run TypeScript compilation check
npx tsc --noEmit
```

---

## 🔒 Legal & Intellectual Property Notice

**© 2026 Thriving Skills Limited (TSL). All Rights Reserved.**  
All content, course curricula, video assets, brand marks, and technical systems are the exclusive intellectual property of Thriving Skills Limited. Unauthorized reproduction, distribution, or decompilation is strictly prohibited under the Copyright Act of Bangladesh and international intellectual property treaties.

- **Corporate Head Office**: House 10, Road 53, Gulshan-2, Dhaka-1212, Bangladesh
- **Hotline Helpline**: `+880 1312-100288`
- **Official Website**: [thrivingskill.com](https://thrivingskill.com)
- **Support Email**: [support@thrivingskill.com](mailto:support@thrivingskill.com)
