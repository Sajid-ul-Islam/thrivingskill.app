# Thriving Skills Mobile Application (React Native Expo)

<div align="center">
  <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80" alt="Logo" width="80" height="80" style="border-radius: 40px;" />
  <h3>Bridging Academic Learning to Industry Excellence</h3>
  <p>Practical Executive Upskilling in Generative AI, Financial Modeling, Data Analytics, HR & Leadership</p>
</div>

---

## 📱 Features

- **🎓 Comprehensive Course Catalog**: Filter by category (AI, Finance, HR, Leadership, Marketing, Productivity) and difficulty level.
- **🎬 Interactive Lesson Player**: Video lectures with speed toggle (1x-2x), timeline scrubber, lecture checklists, notes, quizzes, and downloadable resources.
- **📊 Interactive Knowledge Checks**: Multiple-choice quizzes with instant reasoning feedback and pass tracking.
- **📝 Live Study Notes**: In-lecture timestamped note-taking persisted to device storage.
- **🏆 Verified Digital Certificates**: Industry-verified credentials with unique verification URLs and sharing capabilities.
- **🗓️ Live Cohort Workshops & Masterclasses**: RSVP for upcoming live webinars and clinics.
- **🏢 Enterprise & Corporate Training**: Corporate skill gap assessment and custom training inquiry portal.
- **🌗 Theme System**: Sleek Dark and Light mode support with curated professional palettes.

---

## 🛠️ Tech Stack

- **Framework**: React Native with [Expo SDK 51](https://expo.dev)
- **Language**: TypeScript
- **State & Storage**: React Context + `@react-native-async-storage/async-storage`
- **UI & Icons**: `@expo/vector-icons` (Ionicons, MaterialCommunityIcons), `react-native-safe-area-context`
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
├── App.tsx                      # Root Navigator & App Shell
├── src/
│   ├── components/              # Reusable UI component library
│   │   ├── Header.tsx           # Brand header with theme toggle
│   │   ├── CourseCard.tsx       # Grid & list course cards
│   │   ├── CategoryPills.tsx    # Category selector
│   │   ├── CurriculumAccordion.tsx # Module & lesson accordion
│   │   ├── QuizModal.tsx        # Interactive quiz runner
│   │   ├── NotesModal.tsx       # Study notes taker
│   │   ├── CertificateModal.tsx # Verified certificate viewer
│   │   ├── LiveWorkshopCard.tsx # Workshop RSVP card
│   │   ├── CorporateInquiryModal.tsx # B2B inquiry modal
│   │   └── ProgressBar.tsx      # Smooth progress indicator
│   ├── context/
│   │   ├── ThemeContext.tsx     # Dark/Light mode provider
│   │   └── LearningContext.tsx  # Course progress & state provider
│   ├── data/
│   │   └── mockData.ts          # Authentic Thriving Skills catalog
│   ├── theme/
│   │   └── colors.ts            # Emerald & Indigo tokens
│   └── types/
│       └── index.ts             # Type definitions
└── package.json
```
