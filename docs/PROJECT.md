# Project: Thriving Skills Mobile Application Enhancements

## Architecture
- **Client Application**: React Native (Expo) TypeScript mobile application for iOS & Android.
- **Backend**: WordPress Staging CMS & LMS at `https://staging.thrivingskill.com/wp-json`.
  - LearnPress JWT Authentication: `/learnpress/v1/token`
  - Dynamic Registration: `/learnpress/v1/token/register`
  - Password Reset: `/learnpress/v1/users/reset-password`
  - Password Change: `/learnpress/v1/users/change-password`
  - Profile Fetch: `GET /wp/v2/users/me?context=edit` & `GET /learnpress/v1/users/{id}`
  - Profile Update: `POST /wp/v2/users/me`
- **Theme & Design System**:
  - Shapes: `src/theme/shapes.ts` (Material Design 3 tokens: none, extraSmall, small, medium, large, largeIncreased, extraLarge, full).
  - Colors: `src/theme/colors.ts` (Brand Deep Navy `#102F53`, Sunshine Gold `#FFB606`, Crimson/Coral `#E34234`, Surfaces `#F8FAFC` / `#1E293B`).
  - Tactile Touch: Native `Pressable` with `android_ripple` and WCAG 48dp touch targets.
- **State & Context**:
  - `AuthContext`: Manages authenticated user state, JWT Bearer tokens, roles, and profile persistence.
  - `ProfileScreen`: Displays user profile, learning progress, authenticated password change, and role-guarded app preferences.
  - `AuthModal`: Handles login, registration, password recovery, and error feedback.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | M3 Bottom Nav Pill Capsule | Active tab icon renders inside M3 pill indicator capsule (60x32, shape.full) with label underneath and minHeight 48dp | M1 | R1, Survey UI |
| 2 | Unified M3 Shape Tokens | Define `src/theme/shapes.ts` and replace arbitrary corner radii in key components | M1 | R1, Survey UI |
| 3 | 48dp Minimum Touch Targets | Enforce 48dp minimum touch dimension or hitSlop on all interactive touchables | M1 | R1, Survey UI |
| 4 | Tactile Feedback | Provide native `Pressable` with `android_ripple` and tactile feedback | M1 | R1, Survey UI |
| 5 | Brand Color Cleansing | Eliminate off-brand `#102E52` typo and `#F59E0B` rating colors in favor of `#102F53` and `#FFB606` | M1 | R1, Survey UI |
| 6 | BrandDrawer Timer Hygiene | Fix unhandled timer in `BrandDrawer.tsx:85` with `useRef` + cleanup | M1 | R6, Survey Flows |
| 7 | Strict Admin Role Verification | Strictly verify `user?.roles?.includes('administrator')` without loose string matching | M2 | R2, Survey API |
| 8 | Preferences Admin Portal Guard | Completely hide WordPress Admin Portal link in `ProfileScreen.tsx` for non-admin users | M2 | R2, Survey Flows |
| 9 | Login Error Differentiation | Differentiate invalid username (`[lp_jwt_auth] invalid_username`) vs incorrect password (`[lp_jwt_auth] incorrect_password`) in `AuthModal.tsx` | M2 | R4, Survey API |
| 10 | Forgot Password Flow | Implement reset password flow calling `POST /learnpress/v1/users/reset-password` | M2 | R4, Survey API |
| 11 | SaaSContext Timer Hygiene | Fix unhandled timer in `SaaSContext.tsx:253` with `useRef` + cleanup | M2 | R6, Survey Flows |
| 12 | User Profile Service Integration | Add `updateProfile` in `UserService.ts` calling `POST /wp/v2/users/me` with Bearer auth | M3 | R3, Survey API |
| 13 | Profile Screen Live Data & Edit | Eliminate hardcoded mock strings in `ProfileScreen.tsx`, bind to live user profile, and persist updates | M3 | R3, Survey Flows |
| 14 | Authenticated Password Change | Wire live password change modal in `ProfileScreen.tsx` calling `POST /learnpress/v1/users/change-password` | M3 | R4, Survey API |
| 15 | Cross-Session Profile Persistence | Ensure updated profile details persist in `AuthContext` and `AsyncStorage` across reloads | M3 | R3, Survey Flows |
| 16 | E2E Test Suite (Tiers 1-4) | Comprehensive opaque-box test runner validating all features against staging backend | M4 (E2E) | Dual Track |
| 17 | Adversarial Hardening (Tier 5) & Audit | Challenger gap testing, edge-case hardening, and Forensic Auditor integrity verification | M4 (Final) | Dual Track |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1: M3 UI-UX & Shapes Architecture | `src/theme/shapes.ts`, `App.tsx` pill capsule, 48dp touch targets, tactile feedback, color cleansing, BrandDrawer timer | none | DONE (shapes.ts, pill capsule, 48dp touch targets, timer clean) |
| 2 | M2: Auth & Role Guard | `AuthModal.tsx` error differentiation, forgot password flow, `ProfileScreen.tsx` admin portal role guard, SaaSContext timer | M1 | DONE (error differentiation, forgot password, admin guard, timer clean) |
| 3 | M3: Profile Updates & Live LMS Sync | `UserService.ts`, `ProfileScreen.tsx` live data & save profile, live password change modal, reload persistence | M2 | DONE (updateProfile, changePassword, ProfileScreen live data & save, AsyncStorage reload persistence) |
| 4 | M4: Final E2E Verification & Adversarial Hardening | E2E Test Suite execution (Tiers 1-4), Tier 5 adversarial stress testing, Forensic Auditor verification | M1, M2, M3 | DONE (73/73 E2E tests pass, 16/16 & 15/15 adversarial stress tests pass, CLEAN audit verdict) |

## Interface Contracts
### `src/theme/shapes.ts`
```typescript
export const shape = {
  none: 0,
  extraSmall: 4,
  small: 8,
  medium: 12,
  large: 16,
  largeIncreased: 20,
  extraLarge: 28,
  full: 9999,
} as const;

export type ShapeTokens = typeof shape;
export type ShapeKey = keyof typeof shape;
```

### `UserService.ts`
```typescript
export interface ProfileUpdatePayload {
  name?: string;
  first_name?: string;
  last_name?: string;
  nickname?: string;
  description?: string;
  phone?: string;
}

export interface ChangePasswordPayload {
  old_password: string;
  new_password: string;
  confirm_password: string;
}

// updateProfile(payload: ProfileUpdatePayload): Promise<UserProfile>
// changePassword(payload: ChangePasswordPayload): Promise<{ code: string; message: string }>
// resetPassword(userLogin: string): Promise<{ code: string; message: string }>
```

### Admin Role Check Contract
```typescript
// Strict check:
export const isUserAdmin = (user?: { roles?: string[] } | null): boolean => {
  return Array.isArray(user?.roles) && user.roles.includes('administrator');
};
```

## Code Layout
- `App.tsx` — Main application shell & bottom navigation tab bar.
- `src/theme/` — Theme tokens (`colors.ts`, `shapes.ts`, `typography.ts`).
- `src/components/common/` — Common UI elements (`Header.tsx`, `CategoryPills.tsx`, `SearchSpotlightBar.tsx`, `BrandDrawer.tsx`).
- `src/components/modals/` — Modals (`AuthModal.tsx`, `AppUpdateModal.tsx`, `NotificationModal.tsx`).
- `src/screens/` — Application screens (`ProfileScreen.tsx`, `CoursesScreen.tsx`, `HomeScreen.tsx`, `YouTubeVideosScreen.tsx`).
- `src/services/` — Network client and domain services (`api/httpClient.ts`, `auth/AuthService.ts`, `user/UserService.ts`).
- `src/context/` — Context providers (`AuthContext.tsx`, `SaaSContext.tsx`, `ThemeContext.tsx`).
- `scripts/` — Verification & test scripts (`audit_app.js`, `e2e_smoke_test.js`).
