# ThrivingSkills UI/UX Design Principles & Psychological Laws Rule

All screens, modals, cards, navigation flows, and interactive components in `src/` MUST satisfy the **Core UI Design Principles**, **Peter Morville's UX Honeycomb**, and **Key Psychological Laws of UI/UX**:

## 1. Psychological Laws (Mandatory Enforcements)
- **Miller's Law (5–7 Item Chunking)**: Never place more than 7 interactive rows inside a single unchunked `cardGroup`, tab strip, or form step. Split dense lists (such as Profile settings) into labeled Gestalt sections of 3–5 items each.
- **Hick's Law (Minimal Choice Overhead)**: Keep bottom navigation to 3–5 core destinations, keep filter/category strips focused, and highlight one clear primary CTA per view or modal footer.
- **Fitts's Law (`>= 44dp` Targets & Safe Separation)**: Every interactive button, modal close/back icon, header action, pill/toggle, and list row MUST provide at least `MIN_TOUCH_TARGET` (`44x44 dp`) hit area. Keep primary CTAs within the thumb zone and isolate destructive actions (`Delete Account`, `Sign Out`) in a dedicated danger/account group away from routine links.
- **Jakob's Law (Familiar Mobile Conventions)**: Use bottom tab navigation (no hamburger side drawers for primary navigation), platform-respecting back icons (`chevron-back` on iOS, `arrow-back` on Android), pull-to-refresh on feeds, and consistent top-right close controls on modals.
- **Aesthetic-Usability Effect**: Use shared design tokens exclusively (`src/theme/colors.ts`, `src/theme/shapes.ts`, `src/theme/typography.ts`) for visual harmony, consistent radii, and clean light/dark surface contrast.

## 2. Core UI Principles & UX Honeycomb (Mandatory Enforcements)
- **Visual Hierarchy & Consistency**: Use `typography` tokens (`h1`–`h6`, `body`, `bodySmall`, `caption`, `overline`, `button`) and `shape` tokens rather than arbitrary font sizes or radii.
- **Proximity & Alignment**: Use `16dp` outer horizontal margins, `cardGroup` containers for related rows, and `borderSubtle` dividers between sibling rows only.
- **Contrast & Accessibility**: Enforce WCAG AA contrast (`>= 4.5:1` body, `>= 3.0:1` large/icons) across light & dark themes. Do not render low-contrast bright greens (`#10B981`) as text on white/light surfaces—use `colors.success` (`#047857` light / `#34D399` dark). Add `accessibilityRole` and `accessibilityLabel` to interactive controls.
- **Immediate Feedback**: Provide tactile/visual/textual confirmation for every user action via `SpringPressable`, `triggerHaptic()`, and non-blocking `useFeedback().showToast()` (with `Undo` support on reversible actions). Never leave dead `onPress={() => {}}` handlers.
- **Adaptive States & Credibility**: Never leave blank loading, empty, offline, or error screens—render `<StateView mode="..." />` and `<OfflineBanner />`, and preserve bilingual EN/BN support (`useLanguage()`).

## 3. Verification Requirement
Before concluding UI/UX work, run and pass:
- `npm run typecheck`
- `node scripts/verify_wcag_contrast.js`
- `node scripts/verify_ux_principles.js`
- `node scripts/verify_ui_ux_laws.js`
