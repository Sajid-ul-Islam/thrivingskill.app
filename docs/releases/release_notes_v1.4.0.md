# Thriving Skills Mobile App v1.4.0

🎉 We are pleased to announce the official **v1.4.0** release of the **Thriving Skills** Android application!

---

## 🚀 What's New & Improved

### 🎨 1. Full UI/UX Design Principles & Psychological Laws Alignment
- **Visual Hierarchy & Brand Identity**: Unified styling following official Thriving Skills color tokens (Brand Deep Navy `#102F53`, Sunshine Gold `#FFB606`, Crimson `#E34234`, Dark Surfaces `#0F192C`/`#1E293B`).
- **Hick's Law**: Reduced cognitive friction across course discovery, enrollments, and lessons with single-job focused screens.
- **Fitts's Law**: Touch targets across all primary actions, buttons, and navigation elements meet or exceed the standard **44x44 dp** size with immediate tactile haptic feedback.
- **Jakob's Law**: Familiar 5-tab bottom navigation, standard native headers, and intuitive Android hardware back-button handling.
- **Miller's Law**: Information chunked into easily digestible 3–7 item card clusters (`cardGroup`).

### 🌐 2. 100% Bilingual Language Parity
- Comprehensive dual-language support for **Bengali (বাংলা)** and **English** across all screens, modals, interactive sheets, badges, and empty/error states.
- Seamless, instant language toggling without app reload.

### 📚 3. Resilient LearnPress LMS Synchronization
- Polling mechanism with exponential backoff (4 retry cycles) ensures enrolled courses and orders appear immediately post-checkout.
- Offline banner and graceful state recovery when connectivity fluctuates.

### ⚡ 4. Architecture & Engineering Polish
- **React Native 0.88.1** & **Expo SDK 58** with Hermes engine.
- 64-bit universal Android architecture (`arm64-v8a`, `x86_64`).
- Strict TypeScript contract adherence (`tsc --noEmit` clean).
- Clean lifecycle timer hygiene preventing unmounted state updates and memory leaks.

---

## 📦 Download & Installation
- **APK Name**: `thrivingskill-v1.4.0-release.apk`
- **Application ID**: `com.thrivingskill.app`
- **Version**: `1.4.0` (Build `10400`)
- **Compatibility**: Android 7.0+ (API level 24+)
