# ThrivingSkills UI/UX Design Principles & Psychological Laws Rule

All screens, modals, cards, navigation flows, and interactive components in `src/` MUST satisfy the **Core UI Design Principles**, **Peter Morville's UX Honeycomb**, and **Key Psychological Laws of UI/UX**:

## Color Palette & Brand Tokens (Mandatory)
All visual interfaces, buttons, badges, and progress gauges MUST align with the official Thriving Skills color palette:

### Primary Colors
- **Deep Royal Blue (Primary Brand Color)** — HEX `#102F53`
  - **Usage:** App bar headers, primary buttons, major card backgrounds, main branding elements, and primary text headers.
- **Secondary / Accent Red** — HEX `#E34234`
  - **Usage:** Call-to-action (CTA) highlights, notification badges, active states, important alerts, and discount tags.
- **Pure White** — HEX `#FFFFFF`
  - **Usage:** Card backgrounds, container surfaces in dark modes, body text on dark headers, and negative space separation.

  Light mode vs. Dark mode mapping
Design element

Light mode

Dark mode

Primary brand

#102F53

#102F53

Accent red

#E34234

#E34234

Background

#FFFFFF

#0B1420

Card background

#FFFFFF

#162538

Elevated surface

#F5F7FA

#24364B

Primary text

#102F53

#F1F5F9

Secondary text

#64748B

#A8B5C5

Border

#E2E8F0

#34465A

Important design recommendations
Don't use pure black (#000000). A deep navy background creates a more premium and cohesive appearance.

Keep the brand blue and red consistent. These are your identity colors, not theme-dependent colors.

Use white for text, not large backgrounds. Reserve bright white for important content and contrast.

Avoid excessive red. Use it strategically for CTAs, notifications, discounts and active indicators.

Use layered navy surfaces. Different shades of navy will create visual hierarchy without relying heavily on shadows.

### Enforcement
- Use brand tokens exclusively from `src/theme/colors.ts` (`primary`, `accent`, `surface`, `surfaceCard`, `onPrimary`, `onAccent`, etc.) and never hardcode bare hex values such as `#102F53` / `#E34234` / `#FFFFFF` in component code.
- The brand tokens are the canonical source for these three palette colors; do not re-introduce older alternate brand hues (for example `brandGold`, `danger`, `success`) as replacements for the three primary palette colors.
- Both light and dark themes MUST preserve Deep Royal Blue, Accent Red, and Pure White as the brand identity through equivalent token mappings, not by changing the primary palette owner in dark mode.

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
