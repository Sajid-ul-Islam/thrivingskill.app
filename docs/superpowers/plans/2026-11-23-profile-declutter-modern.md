# Profile Section Declutter & Modern Executive Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Declutter the Profile section into a modern, minimalist, single-feed executive dashboard while preserving 100% of information and features from the live platform.

**Architecture:** Transform `ProfileScreen.tsx` from a disjointed tabbed view into a unified, high-hierarchy executive account center. Consolidate repetitive course lists and stats into a sleek, expandable credentials module, replace fragmented support rows with a modern 4-in-1 contact tile bar, and group 35+ settings rows into semantic Gestalt cards following Miller's and Hick's Laws.

**Tech Stack:** React Native, TypeScript, Expo Vector Icons, React Native SVG, Haptic Feedback, Brand Theme Tokens (`#102F53`, `#FFB606`, `#E34234`, `#0B1420`, `#FFFFFF`).

**Spec:** User directive: "Approach B, but with modern and cleanness - dont lose any information/data, every info from actual site has to be rendered such a way that it looks minimalist but modern and smooth."

## Global Constraints
- Zero Data Loss: All courses, certificates, badges, orders, memory tools, preferences, support channels, and legal info must remain accessible.
- Brand Token Compliance: Primary Navy `#102F53`, Sunshine Gold `#FFB606`, Accent Coral `#E34234`, Dark Background `#0B1420`, Card Dark `#162538`, Elevated `#24364B`, Light Surfaces `#FFFFFF` / `#F8FAFC`.
- Type Safety: `npm run typecheck` must exit with code 0.
- Touch Target Compliance: All interactive buttons must have `minHeight >= 44` or hitSlop >= 44x44 dp (Fitts's Law).
- Error Prevention: Destructive actions (Sign Out, Delete Account, Clear Cache) must have explicit confirmation dialogs.

## Review Focus
1. User with 0 courses vs user with multiple enrolled courses (graceful empty states and clean cards).
2. Unauthenticated user state (clear, non-intrusive sign-in invitation card without breaking layout).
3. Dark and Light mode contrast across all cards, badges, and text.
4. Smooth accordion / expandable course portfolio toggle without jitter.
5. All 4 support triggers (WhatsApp, Messenger, Phone, Email) launch system handlers cleanly.

---

### Task 1: Create Modern Profile Support Hub Component (`ProfileSupportHub.tsx`)
Consolidates the 4 separate support rows into a sleek 4-tile horizontal grid with brand icons, and groups FAQ, Blog, eBook, and Authors into a clean, modern resource card.

**Files:**
- Create: `src/components/profile/ProfileSupportHub.tsx`
- Modify: `src/components/profile/index.ts`
- Test: `scripts/test_profile_declutter.js`

- [ ] **Step 1.1**: Create `ProfileSupportHub.tsx` with:
  - 4-tile horizontal contact grid: WhatsApp (`#25D366`), Messenger (`#0084FF`), Hotline Call (`#102F53`), Email (`#EA4335`).
  - Sleek resource list: Help & FAQ Center, TSL Blog & Industry Articles, Free eBook Library, and Our Course Authors (Faculty).
  - High-contrast labels, badges, and haptic feedback on tap.
- [ ] **Step 1.2**: Export `ProfileSupportHub` in `src/components/profile/index.ts`.
- [ ] **Step 1.3**: Run `npm run typecheck` to verify export types.

---

### Task 2: Create Modern Course Portfolio Summary Component (`ProfileCourseSummary.tsx`)
Presents the user's enrolled courses and achievements in a clean, expandable executive portfolio card with status filter chips, progress meters, and a direct gateway to the My Learning Hub, ensuring zero course data is lost.

**Files:**
- Create: `src/components/profile/ProfileCourseSummary.tsx`
- Modify: `src/components/profile/index.ts`
- Test: `scripts/test_profile_declutter.js`

- [ ] **Step 2.1**: Implement `ProfileCourseSummary.tsx` with:
  - Header with title "My Course Portfolio", filter chips (`All`, `In Progress`, `Passed`, `Finished`), and "Open Learning Hub →" button.
  - Compact summary view of enrolled courses with progress bars, status badges, and action buttons.
  - Real certificates horizontal showcase with 1-tap view & social share.
  - Skill achievement badges flow (unlocked vs locked).
- [ ] **Step 2.2**: Export `ProfileCourseSummary` in `src/components/profile/index.ts`.
- [ ] **Step 2.3**: Verify TypeScript type safety with `npm run typecheck`.

---

### Task 3: Streamline & Reorganize `ProfilePreferencesSection.tsx`
Refactor the preferences section to use the new `ProfileSupportHub`, eliminate redundant full-page list fatigue, and group settings into clean cards following Miller's Law.

**Files:**
- Modify: `src/components/profile/ProfilePreferencesSection.tsx`
- Test: `scripts/test_profile_declutter.js`

- [ ] **Step 3.1**: Group settings into 4 clean cards:
  - Card 1: `Account Membership & Access` (Plan badge, Manage Plan, Orders & Receipts).
  - Card 2: `Learning & Memory Suite` (Flashcards, Offline Deck, Fast Search).
  - Card 3: `App Preferences & Playback` (Language, Dark Mode, Video Quality, OTA Engine).
  - Card 4: `Security & Storage` (Biometric, Password, Cache, Server Environment).
- [ ] **Step 3.2**: Embed `ProfileSupportHub` inside `ProfilePreferencesSection.tsx`.
- [ ] **Step 3.3**: Ensure all props (`onOpenSubscription`, `onOpenOrders`, `onOpenFlashcards`, `onOpenOfflineDeck`, etc.) are wired cleanly.

---

### Task 4: Unify `ProfileScreen.tsx` into a Single Modern Executive Feed
Remove the top segmented tab switcher (`[ Learning Portfolio ] | [ Settings ]`), render the unified single scroll feed (Header Card $\rightarrow$ Compact KPI Bar $\rightarrow$ Course & Credentials Summary $\rightarrow$ Settings & Tools $\rightarrow$ Support Hub $\rightarrow$ Legal & Secure Exit).

**Files:**
- Modify: `src/screens/ProfileScreen.tsx`
- Test: `scripts/test_profile_declutter.js`

- [ ] **Step 4.1**: Remove the top segmented tab bar state and render both the modern course portfolio summary and reorganized preferences in a continuous, smooth executive layout.
- [ ] **Step 4.2**: Add the compact 3-pill KPI bar (`Enrolled`, `Completed`, `Certificates`) with smooth interactive touch states.
- [ ] **Step 4.3**: Verify all modal triggers (`setEditProfileModalVisible`, `setPaymentHistoryModalVisible`, `setHelpFaqModalVisible`, `setBlogModalVisible`, etc.) remain fully functional.

---

### Task 5: Automated Verification & Audit
Run automated tests and audits to verify zero broken imports, zero type errors, zero data loss, and pristine UI/UX.

**Files:**
- Create: `scripts/test_profile_declutter.js`

- [ ] **Step 5.1**: Write and execute `node scripts/test_profile_declutter.js` testing:
  - All 15+ interactive triggers and modals present and accessible.
  - Zero lost information from the live site.
  - Support channels, memory tools, preferences, and course portfolio properly wired.
- [ ] **Step 5.2**: Run `npm run typecheck` (`tsc --noEmit`).
- [ ] **Step 5.3**: Run `node scripts/audit_app.js` across the 174 codebase files.
- [ ] **Step 5.4**: Commit with conventional commit message and push to `origin/master`.
