---
name: ui-ux-design-laws
description: >-
  Audits, designs, and implements mobile UI/UX in ThrivingSkills against Core UI
  Design Principles, Peter Morville's UX Honeycomb, and Key Psychological Laws
  (Hick's, Fitts's, Jakob's, Miller's, and Aesthetic-Usability Effect). Use when
  creating, modifying, reviewing, or debugging any React Native screen, modal,
  navigation flow, form, or interactive component in this workspace.
---

# UI/UX Design Principles & Psychological Laws Skill

Apply this runbook whenever designing, building, or auditing screens, modals,
and components in the **Thriving Skills** React Native (Expo) application.

---

## 1. Core Frameworks & Codebase Mapping

### A. Core UI Design Principles
1. **Visual Hierarchy**: Use `typography` tokens (`h1`–`h6`, `body`, `bodySmall`, `caption`, `overline`, `button`) from [src/theme/typography.ts](../../../src/theme/typography.ts) and brand accent weighting so headlines, primary values, and primary CTAs lead the eye before secondary metadata.
2. **Consistency**: Reuse shared tokens ([colors.ts](../../../src/theme/colors.ts), [shapes.ts](../../../src/theme/shapes.ts), [typography.ts](../../../src/theme/typography.ts)) and primitives (`Header`, `SpringPressable`, `StateView`) rather than ad-hoc one-off styles.
3. **Proximity & Alignment (Gestalt)**: Group related items into clean `cardGroup` containers with consistent `16dp` outer horizontal gutter and `12–16dp` inner padding. Physically separate unrelated or destructive actions into distinct sections.
4. **Contrast & Accessibility**: Maintain WCAG AA contrast (`>= 4.5:1` normal text, `>= 3.0:1` large/bold text & UI icons) in both light and dark modes. Attach `accessibilityRole` and `accessibilityLabel` (plus `accessibilityState` on tabs/switches) to interactive controls.
5. **Feedback**: Every interactive tap, toggle, submit, delete, copy, or refresh must deliver immediate multi-modal feedback via `SpringPressable` spring motion, `triggerHaptic()` ([src/utils/haptics.ts](../../../src/utils/haptics.ts)), and/or non-blocking confirmation/undo toasts (`useFeedback().showToast()` in [src/context/FeedbackContext.tsx](../../../src/context/FeedbackContext.tsx)).

### B. Core UX Design Principles (Peter Morville's UX Honeycomb)
1. **Usefulness**: Every screen must solve a concrete learner need (enrolled courses, video/audio lessons, quizzes, notes, certificates, live workshops, skill diagnostics). Remove dead buttons (`onPress={() => {}}`) and vanity filler blocks.
2. **Usability**: Keep one primary job per screen, break complex forms into progressive disclosure steps with progress indicators, validate inputs inline, and offer non-destructive recovery (`Undo` toast actions).
3. **Findability**: Support `UniversalSearchModal`, category/status filter tabs, `QuickActionDock`, clear section headers, and predictable `Header` back navigation.
4. **Credibility**: Never render blank screens or silent failures. Use `StateView` (`loading`, `empty`, `offline`, `error`), `OfflineBanner`, accurate LearnPress sync metadata, and authentic Thriving Skills branding (`#102F53`, `#FFB606`, `#E34234`).
5. **Desirability**: Pair clean typography, `shape` radii, dark/light surfaces, and motivational gamification (`CelebrationToast`, XP/streaks, verified certificates) without clutter.
6. **Accessibility**: Honor bilingual EN/BN i18n (`useLanguage()`), `>= 44dp` tap targets, screen-reader labels, and dual light/dark parity.
7. **Value**: Surface clear outcomes (certificate verification, progress tracking, offline resilience, actionable quiz feedback).

### C. Key Psychological Laws of UI/UX
1. **Hick's Law** *(More choices increase decision time)*:
   - Keep bottom navigation to 3–5 destinations (5 tabs max).
   - Limit filter strips, quick-action docks, and multi-step wizards to focused choices (`<= 5–7`).
   - Avoid competing primary CTAs or stacked promotional walls on the home screen.
2. **Fitts's Law** *(Larger, closer targets are faster & less error-prone)*:
   - Every tappable button, close `X`, back chevron, chip, and toggle row MUST meet `>= 44x44 dp` (`MIN_TOUCH_TARGET = 44`).
   - Place primary CTAs in the natural bottom thumb zone (`stickyCTA`, modal footers).
   - Physically isolate destructive actions (`Delete Account`, `Sign Out`) from routine settings/navigation controls.
3. **Jakob's Law** *(Users prefer familiar patterns)*:
   - Use standard mobile conventions: bottom tab bar, platform-aware back icon (`chevron-back` on iOS, `arrow-back` on Android), top-right close `X` on sheets/modals, pull-to-refresh on feeds.
4. **Miller's Law** *(Working memory holds 5–7 chunks)*:
   - Cap card groups (`cardGroup`), onboarding/form steps, and navigation/tab clusters at **3 to 7 items** per group. Split monolithic settings or preference lists into labeled Gestalt groups of 3–5 rows.
5. **Aesthetic-Usability Effect** *(Refined visuals improve perceived ease of use)*:
   - Use consistent `shape` border radii, balanced vertical rhythm, crisp typography hierarchy, and aligned icon + text rows across every screen and modal.

---

## 2. Step-by-Step Workflow When Editing UI

1. **Inspect Before Editing**: Check whether existing shared tokens (`colors`, `typography`, `shape`), `StateView`, `SpringPressable`, `triggerHaptic`, and `useFeedback` are already imported.
2. **Check Chunking & Decision Load**: Verify no settings card group, modal list, or step form exceeds 5–7 unchunked interactive rows (Miller's/Hick's Law).
3. **Verify Touch & Accessibility Contracts**: Confirm every `TouchableOpacity`/`Pressable`/`SpringPressable` has `>= 44x44dp` bounds (or sufficient `hitSlop`), plus `accessibilityRole` and `accessibilityLabel`.
4. **Verify State & Error Recovery**: Account for `loading`, `empty`, `offline`, and `error` states via `StateView`, and provide haptic + toast feedback on mutations.

---

## 3. Mandatory Verification Commands

After any UI/UX change, run all checks and confirm exit code `0`:

```powershell
npm run typecheck
node scripts/audit_app.js
node scripts/verify_wcag_contrast.js
node scripts/verify_ux_principles.js
node scripts/verify_ui_ux_laws.js
node scripts/verify_layout_and_safe_areas.js
```
