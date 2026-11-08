# Handoff Report: UI Architecture, Material Design 3, Shapes, Touch Targets, and Tactile Feedback

**Agent**: `explorer_survey_ui_1`  
**Date**: 2026-11-08  
**Task Objective**: Survey the Thriving Skills mobile app codebase for UI architecture, Material Design 3 enhancements, shapes, touch targets, tactile feedback, and brand color tokens.  
**Baseline Repository Health**: Verified via `npm run typecheck` (exit code 0) and `node scripts/audit_app.js` (exit code 0).

---

## 1. Observation

Direct, verbatim code observations across the repository:

### 1.1 Bottom Navigation Tab Bar in `App.tsx`
- **Location**: `App.tsx` (lines 183-238, 349-390)
- **Active / Inactive Rendering**:
  Tabs are rendered using `TouchableOpacity`:
  ```tsx
  // App.tsx:198-209
  <TouchableOpacity
    key={tab.id}
    style={[
      styles.tabButton,
      isActive && {
        backgroundColor: colors.primaryLight,
        borderRadius: 14,
      },
    ]}
    onPress={() => navigateToTab(tab.id)}
    activeOpacity={0.7}
  >
  ```
  - `styles.tabButton` has `flex: 1`, `alignItems: 'center'`, `justifyContent: 'center'`, `paddingVertical: 3`. There is no explicit `minHeight: 48`.
  - When `isActive` is true, `backgroundColor: colors.primaryLight` and `borderRadius: 14` are applied to the **entire tab column** (wrapping both the icon and the text label).
  - Inactive tabs render `tab.iconOutline` with `color: colors.tabInactive` and label `fontWeight: '500'`.
  - The badge is positioned at `styles.tabBadge` (`top: -4`, `right: -8`, `borderRadius: 7.5`).
  - Neither `Pressable` nor `android_ripple` is utilized.

### 1.2 Shape Tokens & Arbitrary Corner Radii
- **Location**: `src/theme/shapes.ts` currently does **not exist**.
- `src/theme/` contains only `colors.ts`.
- Ripgrep search across `src/` revealed over **450 instances** of hardcoded arbitrary `borderRadius` integers:
  - `borderRadius: 2`, `3`, `4`, `6`, `7`, `7.5`, `8`, `9`, `10`, `11`, `12`, `14`, `15`, `16`, `18`, `19`, `20`, `22`, `24`, `28`, `32`, `60`, `70`.
  - Key concrete examples:
    - `App.tsx:204`: active tab button `borderRadius: 14`
    - `App.tsx:376`: tab badge `borderRadius: 7.5`
    - `src/components/common/Header.tsx:180`: brandAppIcon `borderRadius: 8`
    - `src/components/common/Header.tsx:215`: iconButton `borderRadius: 18`
    - `src/components/common/Header.tsx:225`: notifBadge `borderRadius: 8`
    - `src/components/common/CategoryPills.tsx:123`: category pill `borderRadius: 20`
    - `src/components/common/CategoryPills.tsx:142`: countBadge `borderRadius: 10`
    - `src/components/common/SearchSpotlightBar.tsx:89`: searchBox `borderRadius: 14`
    - `src/components/common/SearchSpotlightBar.tsx:105`: cmdKChip `borderRadius: 10`
    - `src/components/common/SearchSpotlightBar.tsx:132`: tagPill `borderRadius: 12`
    - `src/components/cards/CourseCard.tsx:241`: card `borderRadius: 16`
    - `src/components/cards/CourseCard.tsx:266`: badgeTag `borderRadius: 6`
    - `src/components/cards/CourseCard.tsx:401`: horizontalCard `borderRadius: 14`
    - `src/components/cards/CourseCard.tsx:419`: horizontalThumb `borderRadius: 10`
    - `src/components/cards/CourseCard.tsx:433`: bookmarkBtn `borderRadius: 15`
    - `src/components/common/BrandDrawer.tsx:596`: closeBtn `borderRadius: 16`
    - `src/components/common/BrandDrawer.tsx:642`: switchWsBtn `borderRadius: 8`
    - `src/components/common/BrandDrawer.tsx:678`: navItem `borderRadius: 10`
    - `src/components/common/BrandDrawer.tsx:685`: navIconBg `borderRadius: 8`
    - `src/screens/ProfileScreen.tsx:1485`: cardGroup `borderRadius: 16`
    - `src/screens/ProfileScreen.tsx:1513`: corporateCard `borderRadius: 14`
    - `src/screens/ProfileScreen.tsx:1542`: editProfileBtn `borderRadius: 8`
    - `src/screens/ProfileScreen.tsx:1675`: invoiceReceiptBtn `borderRadius: 8`

### 1.3 Touch Target Dimensions (48dp Minimum)
Direct inspection of touchable dimensions identified multiple elements violating the 48dp minimum touch target:
1. `src/components/common/SearchSpotlightBar.tsx` (lines 129-134):
   ```tsx
   tagPill: {
     paddingHorizontal: 9,
     paddingVertical: 4,
     borderRadius: 12,
     borderWidth: 1,
   },
   tagText: {
     fontSize: 11,
     fontWeight: '600',
   },
   ```
   Total computed height: `11 + 4*2 + 2 = 21dp`. No `hitSlop` or `minHeight`.
2. `src/screens/ProfileScreen.tsx` (lines 1536-1546):
   ```tsx
   editProfileBtn: {
     flexDirection: 'row',
     alignItems: 'center',
     gap: 4,
     paddingHorizontal: 10,
     paddingVertical: 5,
     borderRadius: 8,
     borderWidth: 1,
     alignSelf: 'flex-start',
     marginTop: 6,
   },
   ```
   Total computed height: `11 + 5*2 + 2 = 23dp`. No `hitSlop` or `minHeight`.
3. `src/screens/ProfileScreen.tsx` (lines 1669-1677):
   `invoiceReceiptBtn`: `paddingVertical: 6, fontSize: 11` -> height ~25dp. No `hitSlop`.
4. `src/screens/CoursesScreen.tsx` (lines 422-428):
   ```tsx
   viewToggleBtn: {
     width: 32,
     height: 32,
     borderRadius: 8,
     alignItems: 'center',
     justifyContent: 'center',
   },
   ```
   Fixed dimensions 32x32dp. Used on lines 206 and 221 with No `hitSlop`.
5. `src/screens/CoursesScreen.tsx` (lines 408-417, 439-447):
   `levelPill` and `sortBtn`: `paddingVertical: 6, fontSize: 12` -> height ~26dp. No `hitSlop`.
6. `src/components/common/CategoryPills.tsx` (lines 118-125):
   `pill`: `paddingVertical: 8, fontSize: 13` -> height ~32dp. No `hitSlop` or `minHeight: 48`.
7. `src/components/common/BrandDrawer.tsx` (lines 636-645):
   `switchWsBtn`: `paddingVertical: 5, fontSize: 11` -> height ~23dp. No `hitSlop`.
8. `src/components/modals/AuthModal.tsx` (lines 403-413, 622-625, 645-652):
   `closeButton`: 32x32dp without `hitSlop`.
   `changePhoneBtn`: `paddingVertical: 4` -> height ~20dp without `hitSlop`.
   `quickFillBtn`: `paddingVertical: 6` -> height ~24dp without `hitSlop`.
9. `src/components/modals/NotificationModal.tsx` (lines 221-235):
   `closeBtn`: `padding: 4` around 22dp icon (30x30dp) without `hitSlop`.
   `filterPill`: `paddingVertical: 6` -> height ~26dp without `hitSlop`.
10. `App.tsx` (lines 361-366):
    `tabButton`: `paddingVertical: 3` without `minHeight: 48`.

### 1.4 Tactile Feedback (`Pressable` & `android_ripple`)
- Grep search for `<Pressable` across `src/` and `App.tsx`: **0 results**.
- Grep search for `android_ripple` across `src/` and `App.tsx`: **0 results**.
- 100% of interactive components utilize `TouchableOpacity` with variable `activeOpacity` (0.7 to 0.88), providing only an iOS opacity fade without native Android ripple or elevated tactile state.

### 1.5 Color Tokens & Brand Preservation
- **Theme Definition** in `src/theme/colors.ts`:
  - Deep Navy: `primary: '#102F53'`, `brandNavy: '#102F53'`, `primaryGradientStart: '#102F53'`
  - Sunshine Gold: `brandGold: '#FFB606'`, `starColor: '#FFB606'`
  - Crimson / Coral: `accent: '#E34234'`, `brandRed: '#E34234'`, `primaryGradientEnd: '#E34234'`
  - Surfaces:
    - Light: `background: '#F8FAFC'`, `surface: '#FFFFFF'`
    - Dark: `surface: '#0F192C'`, `secondaryLight: '#1E293B'`, `background: '#070D18'`
- **Detected Discrepancies & Off-Brand Variations**:
  1. **Off-Brand Navy `#102E52`**:
     Eight occurrences of hardcoded `#102E52` (deviating from official `#102F53`):
     - `src/screens/YouTubeVideosScreen.tsx:205` (`backgroundColor: isSelected ? '#102E52' : colors.surface`)
     - `src/screens/YouTubeVideosScreen.tsx:206` (`borderColor: isSelected ? '#102E52' : colors.border`)
     - `src/screens/YouTubeVideosScreen.tsx:217` (`color: ... ? '#102E52' : colors.textMuted`)
     - `src/components/cards/YouTubeCard.tsx:88` (`color: saved ? '#102E52' : colors.textMuted`)
     - `src/components/cards/YouTubeCard.tsx:160` (`backgroundColor: saved ? '#102E52' : 'rgba(0,0,0,0.6)'`)
     - `src/components/player/YouTubePlayerModal.tsx:273` (`backgroundColor: '#102E52'`)
     - `src/components/player/YouTubePlayerModal.tsx:739` (`backgroundColor: '#102E52'`)
     - `src/components/player/YouTubePlayerModal.tsx:778` (`backgroundColor: '#102E52'`)
  2. **Hardcoded Gold / Rating Variations `#F59E0B`**:
     Tailwind Amber `#F59E0B` is hardcoded across 30+ locations for star ratings and badges (e.g. `HomeScreen.tsx:710-714`, `CourseDetailScreen.tsx:859`, `SpecialBundleCard.tsx:68`) instead of using `colors.starColor` or `colors.brandGold` (`#FFB606`).
  3. **Hardcoded Brand Hex Values**:
     Multiple components directly hardcode `'#102F53'`, `'#FFB606'`, and `'#E34234'` as raw strings rather than referencing theme tokens from `useTheme().colors`.

---

## 2. Logic Chain

1. **Bottom Navigation Architecture (`App.tsx`)**:
   - *Observation 1.1* shows `styles.tabButton` receives `backgroundColor: colors.primaryLight` and `borderRadius: 14` when `isActive` is true.
   - *Reasoning*: Because the background is applied to the button root wrapping both icon and text, the whole tab column becomes a blocky card, violating Material Design 3 Navigation Bar specifications where the indicator is a pill capsule specifically containing the icon, with the text label displayed cleanly below.
   - *Conclusion*: In `App.tsx`, the tab button must be refactored so the pill indicator capsule (`width: 60-64`, `height: 32`, `borderRadius: 16` or `shape.full`) wraps only the icon. The label should be placed outside the pill indicator capsule with a 4dp margin.

2. **Unified M3 Shape Tokens (`src/theme/shapes.ts`)**:
   - *Observation 1.2* confirms that `src/theme/shapes.ts` does not exist, and arbitrary numbers from 2 to 70 are hardcoded in >450 locations.
   - *Reasoning*: Without a centralized shape system, components have visual inconsistencies (e.g., cards use 14, 16, 18 interchangeably; buttons use 8, 10, 12, 14, 16; badges use 6, 7.5, 8, 10).
   - *Conclusion*: A unified shape token definition file `src/theme/shapes.ts` must be created following Material Design 3 shape scale (`none: 0`, `extraSmall: 4`, `small: 8`, `medium: 12`, `large: 16`, `largeIncreased: 20`, `extraLarge: 28`, `full: 9999`). All component and screen corner radii can then cleanly map to these tokens.

3. **Touch Target Dimensions**:
   - *Observation 1.3* documents 10 distinct interactive UI elements with heights between 20dp and 32dp that lack `hitSlop` or `minHeight: 48`.
   - *Reasoning*: Mobile users on Android and iOS frequently miss or accidentally tap adjacent items when touch targets fall below 48x48dp. This directly breaches WCAG 2.5.5 and requirement R1.
   - *Conclusion*: Small icon buttons and compact pills must be augmented with `hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}` (or appropriate offsets), and row items/tabs must declare `minHeight: 48`.

4. **Tactile Touch Feedback**:
   - *Observation 1.4* proves that `Pressable` and `android_ripple` have zero occurrences in the codebase.
   - *Reasoning*: `TouchableOpacity` only performs an opacity dim on touch. On Android, this feels like an unstyled web view rather than a native Material 3 application.
   - *Conclusion*: Core interactive components (Bottom Navigation tabs, primary CTA buttons, category chips, card touchables) should adopt `Pressable` with `android_ripple` on Android and gentle press opacity on iOS.

5. **Brand Color Fidelity**:
   - *Observation 1.5* isolates eight instances of the typo `#102E52` in YouTube features, alongside widespread hardcoded `#F59E0B` for stars.
   - *Reasoning*: Unchecked hex values degrade brand consistency and violate Rule 2 (Strict Brand Identity Preservation).
   - *Conclusion*: Replace all instances of `#102E52` with brand Deep Navy `#102F53` (or `colors.primary`). Replace hardcoded `#F59E0B` for ratings with `colors.starColor` (`#FFB606`).

---

## 3. Caveats

1. **Read-Only Scope**: This report is purely analytical; no source code files outside `.agents/teamwork/explorer_survey_ui_1/` have been modified.
2. **HitSlop vs Layout Sizing**: Where visual elements (such as 32dp icon buttons or compact filter chips) are intentionally small to preserve visual density in dense lists or headers, `hitSlop` should be used rather than increasing visual dimensions, preventing unwanted layout breakage.
3. **Modal Diversity**: There are 18 modal files in `src/components/modals/`. While common modals (`AuthModal`, `AppUpdateModal`, `NotificationModal`) were inspected in depth, other secondary modals follow similar patterns and will benefit from the standardized close button and button token rules.
4. **Third-Party Libraries**: React Native built-in `Pressable` natively supports `android_ripple` without requiring `react-native-gesture-handler` or additional native dependencies.

---

## 4. Conclusion & Structural Recommendations

### 4.1 Recommendation 1: Implement `src/theme/shapes.ts`
Create `src/theme/shapes.ts`:
```typescript
/**
 * Material Design 3 Shape Tokens
 * Reference: https://m3.material.io/styles/shape/overview
 */
export const shape = {
  none: 0,
  extraSmall: 4,      // 4dp: micro badges, progress bars, indicator tracks
  small: 8,           // 8dp: small buttons, chips, text inputs, small badges
  medium: 12,         // 12dp: compact cards, container boxes, list items
  large: 16,          // 16dp: standard cards, modal containers, hero items
  largeIncreased: 20, // 20dp: large hero cards, banners
  extraLarge: 28,     // 28dp: dialogs, bottom sheets, floating action sheets
  full: 9999,         // Pill / Capsule / Circle: M3 active tab indicator, pill buttons, circular avatars
} as const;

export type ShapeTokens = typeof shape;
export type ShapeKey = keyof typeof shape;
```

### 4.2 Recommendation 2: M3 Pill Indicator Capsule in `App.tsx`
Refactor the bottom tab bar in `App.tsx`:
```tsx
// Replacement pattern for App.tsx:195-236
{tabItems.map((tab) => {
  const isActive = activeTab === tab.id;
  return (
    <Pressable
      key={tab.id}
      style={styles.tabButton}
      onPress={() => navigateToTab(tab.id)}
      android_ripple={{
        color: isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(16, 47, 83, 0.08)',
        borderless: true,
        radius: 32,
      }}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={tab.label}
    >
      <View
        style={[
          styles.tabPillIndicator,
          isActive && {
            backgroundColor: isDark ? 'rgba(56, 189, 248, 0.16)' : colors.primaryLight,
          },
        ]}
      >
        <Ionicons
          name={(isActive ? tab.icon : tab.iconOutline) as any}
          size={21}
          color={isActive ? colors.primary : colors.tabInactive}
        />
        {tab.badgeCount && tab.badgeCount > 0 ? (
          <View style={[styles.tabBadge, { backgroundColor: colors.accent }]}>
            <Text style={styles.tabBadgeText}>{tab.badgeCount}</Text>
          </View>
        ) : null}
      </View>
      <Text
        style={[
          styles.tabButtonLabel,
          {
            color: isActive ? colors.primary : colors.tabInactive,
            fontWeight: isActive ? '700' : '500',
          },
        ]}
        numberOfLines={1}
      >
        {tab.label}
      </Text>
    </Pressable>
  );
})}
```
With corresponding StyleSheet updates in `App.tsx`:
```tsx
tabButton: {
  alignItems: 'center',
  justifyContent: 'center',
  flex: 1,
  minHeight: 48,
  paddingVertical: 4,
},
tabPillIndicator: {
  width: 60,
  height: 32,
  borderRadius: shape.full, // 9999
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  backgroundColor: 'transparent',
},
tabBadge: {
  position: 'absolute',
  top: 1,
  right: 12,
  minWidth: 16,
  height: 16,
  borderRadius: shape.full,
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: 3,
},
tabBadgeText: {
  color: '#FFFFFF',
  fontSize: 8.5,
  fontWeight: '800',
},
tabButtonLabel: {
  fontSize: 10.5,
  marginTop: 3,
},
```

### 4.3 Recommendation 3: Enforce 48dp Minimum Touch Targets
Target files and changes:
- `SearchSpotlightBar.tsx`: add `hitSlop={{ top: 12, bottom: 12, left: 6, right: 6 }}` to `styles.tagPill`.
- `ProfileScreen.tsx`: add `hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}` to `styles.editProfileBtn` and `styles.invoiceReceiptBtn`.
- `CoursesScreen.tsx`: add `hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}` to `styles.viewToggleBtn`, `styles.levelPill`, and `styles.sortBtn`.
- `CategoryPills.tsx`: add `hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}` to `styles.pill`.
- `BrandDrawer.tsx`: add `hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}` to `styles.switchWsBtn` and footer social icon buttons.
- `AuthModal.tsx`, `NotificationModal.tsx`, `AppUpdateModal.tsx`: add `hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}` to `closeBtn` / `closeButton`.

### 4.4 Recommendation 4: Brand Color Cleansing
- Fix `#102E52` typo in `YouTubeVideosScreen.tsx` (lines 205, 206, 217), `YouTubeCard.tsx` (lines 88, 160), and `YouTubePlayerModal.tsx` (lines 273, 739, 778) -> replace with `#102F53`.
- Replace hardcoded rating `#F59E0B` in `HomeScreen.tsx`, `SpecialBundleCard.tsx`, and `CourseDetailScreen.tsx` with `colors.starColor` / `colors.brandGold` (`#FFB606`).

---

## 5. Verification Method

To independently verify all findings and validate future implementations:

1. **TypeScript Typecheck**:
   ```powershell
   npm run typecheck
   ```
   Must pass with 0 errors (`tsc --noEmit`).

2. **Repository Consistency Audit**:
   ```powershell
   node scripts/audit_app.js
   ```
   Must exit with code 0 (0 broken imports, 0 missing styles, 0 unhandled timers).

3. **Verify Shape Token Creation**:
   Inspect `src/theme/shapes.ts` to ensure tokens (`none`, `extraSmall`, `small`, `medium`, `large`, `largeIncreased`, `extraLarge`, `full`) are exported and type-safe.

4. **Verify Bottom Navigation Pill Capsule**:
   Inspect `App.tsx` lines 183-238 to confirm the active capsule is applied to `styles.tabPillIndicator` (around the icon) rather than the whole `styles.tabButton`, and that `minHeight: 48` is declared.

5. **Verify Brand Navy & Star Colors**:
   Run grep for the invalid typo:
   ```powershell
   # In PowerShell / ripgrep
   rg "#102E52" src/
   ```
   Must return 0 results.

6. **Invalidation Conditions**:
   - If `styles.tabButton` wraps text and icon together inside the pill background.
   - If arbitrary non-token `borderRadius` values continue to be introduced.
   - If any button or touchable has interactive touch dimensions less than 48dp without `hitSlop`.
