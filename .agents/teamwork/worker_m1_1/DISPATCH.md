## 2026-11-08T09:41:42Z
You are worker_m1_1.
Your working directory is d:\Repo\thrivingskill.app\.agents\teamwork\worker_m1_1\

Task Objective:
Implement Milestone 1: Material Design 3 UI enhancements, M3 shape tokens, bottom navigation pill capsule, touch target compliance, tactile feedback, and brand color cleansing.

Instructions:
1. First, read ORIGINAL_REQUEST.md at d:\Repo\thrivingskill.app\.agents\teamwork\ORIGINAL_REQUEST.md, PROJECT.md at d:\Repo\thrivingskill.app\PROJECT.md, AGENTS.md at d:\Repo\thrivingskill.app\AGENTS.md, and the explorer handoff report at d:\Repo\thrivingskill.app\.agents\teamwork\explorer_survey_ui_1\handoff.md.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

File Ownership:
You have exclusive write access to:
- `src/theme/shapes.ts`
- `App.tsx`
- `src/components/common/BrandDrawer.tsx`
- `src/components/common/SearchSpotlightBar.tsx`
- `src/components/common/CategoryPills.tsx`
- `src/screens/CoursesScreen.tsx`
- `src/screens/YouTubeVideosScreen.tsx`
- `src/components/cards/YouTubeCard.tsx`
- `src/components/player/YouTubePlayerModal.tsx`
- Component star rating styling for brand gold `#FFB606`.

Implementation Steps:
1. Create `src/theme/shapes.ts` exporting canonical M3 shape scale (`none: 0`, `extraSmall: 4`, `small: 8`, `medium: 12`, `large: 16`, `largeIncreased: 20`, `extraLarge: 28`, `full: 9999`) and TypeScript types (`ShapeTokens`, `ShapeKey`).
2. In `App.tsx`:
   - Refactor bottom navigation tab items: wrap the icon inside an M3 pill indicator capsule (`styles.tabPillIndicator`: 60dp width, 32dp height, `borderRadius: shape.full`).
   - Active tab displays the pill indicator capsule with `colors.primaryLight` (or dark mode equivalent); label sits cleanly underneath.
   - Enforce `minHeight: 48` on `styles.tabButton` to satisfy the 48dp minimum touch target.
   - Use `Pressable` with `android_ripple` (`{ color: '...', borderless: true, radius: 32 }`) for tactile touch feedback on Android.
3. Touch targets & tactile feedback:
   - Add `hitSlop` to compact interactive elements in `SearchSpotlightBar.tsx`, `CoursesScreen.tsx`, `CategoryPills.tsx`, and `BrandDrawer.tsx` so all touchables meet or exceed 48x48dp effective touch area.
4. Timer hygiene:
   - In `src/components/common/BrandDrawer.tsx` (line 85), fix the unhandled `setTimeout` by storing it in a `useRef` and clearing it in `useEffect` unmount teardown (Rule 3).
5. Brand color cleansing:
   - Replace all 8 instances of the off-brand `#102E52` typo in `YouTubeVideosScreen.tsx`, `YouTubeCard.tsx`, and `YouTubePlayerModal.tsx` with official Deep Navy `#102F53`.
   - Ensure rating stars utilize `colors.starColor` or brand gold `#FFB606`.
6. Verification:
   - Execute `npm run typecheck` (`tsc --noEmit`) - must exit 0.
   - Execute `node scripts/audit_app.js` - must pass with 0 broken imports, 0 missing styles, 0 unhandled timers.
7. Document your work, commands, and results in `d:\Repo\thrivingskill.app\.agents\teamwork\worker_m1_1\handoff.md`.
8. Send a message to orchestrator upon completion.
