# Original User Request

## Initial Request — 2026-11-08T09:26:27Z

Implement the production-grade Material Design 3 UI enhancements, role-based WordPress admin portal access guard, user profile update capabilities, and authentication/password recovery flows for the Thriving Skills mobile app against the staging WordPress backend without AI slop.

Integrity mode: development

## Requirements

### R1. Material Design 3 Clean UI-UX Implementation
- Bottom navigation in `App.tsx` must display an M3 pill indicator capsule around the active tab icon.
- Unified M3 Shape tokens from `src/theme/shapes.ts` must replace arbitrary pixel corner radii.
- All interactive elements and buttons must comply with a 48dp minimum touch target.
- Interactive elements must provide native tactile touch feedback (`Pressable android_ripple` or standard clean touch layers).
- Brand color palette must be strictly preserved: Deep Navy `#102F53`, Sunshine Gold `#FFB606`, Crimson/Coral `#E34234`, Surfaces `#F8FAFC` / `#1E293B`.
- Implementation must be clean, purposeful, and production-grade with zero decorative junk or generic filler text (no AI slop).

### R2. WordPress Admin Portal Guard in App Preferences
- In `ProfileScreen.tsx` or app preferences, restrict visibility of the "WordPress Admin Portal" or admin links strictly to users with verified WordPress administrator roles, hiding them completely for non-admin users.

### R3. User Profile Information Update Option
- Enable authenticated users (students/learners) to view and update their profile information (display name, email, phone number, bio, avatar) directly from within the app.
- Synchronize and persist profile updates with the WordPress REST API endpoints (`/wp/v2/users/me` and `/learnpress/v1/users/{id}`).

### R4. Authentication & Password Recovery / Change Workflow
- Provide distinct, clear error messages on the login screen that differentiate between invalid username / non-existent user and incorrect password.
- Provide a password change / update option in profile settings for authenticated users.
- Provide a Forgot / Reset Password flow in the login dialog that initiates a standard WordPress password reset email containing the reset link via the WordPress backend endpoint (`/learnpress/v1/users/reset-password` or WordPress core reset endpoint).

### R5. WordPress Backend Integration & Environment
- Target the live staging WordPress backend at `https://staging.thrivingskill.com/wp-json`.
- Integrate against LearnPress endpoints (`/learnpress/v1/token`, `/learnpress/v1/token/register`, `/learnpress/v1/courses`, etc.).

### R6. Repository Guardrails & Code Quality Standards
- `npm run typecheck` (`tsc --noEmit`) must exit with code 0.
- `node scripts/audit_app.js` must pass with 0 broken imports, 0 missing styles, and 0 unhandled timers.
- Cross-platform timer hygiene must be strictly maintained: all timers must be stored in a `useRef` and canceled on component unmount.

## Verification Resources
- Staging WordPress API base: `https://staging.thrivingskill.com/wp-json`
- LearnPress dynamic user registration endpoint for non-destructive test accounts: `/wp-json/learnpress/v1/token/register`
- Local verification commands: `npm run typecheck` and `node scripts/audit_app.js`

## Acceptance Criteria

### Material Design 3 UI Compliance
- [ ] Active tab icon in `App.tsx` bottom navigation renders inside an M3 pill indicator capsule.
- [ ] UI components utilize shape tokens defined in `src/theme/shapes.ts`.
- [ ] All interactive buttons and touchables have at least 48dp touch target dimensions.
- [ ] Touch interactions produce tactile feedback (`android_ripple` or touch feedback layer).
- [ ] Colors strictly adhere to `#102F53`, `#FFB606`, `#E34234`, `#F8FAFC`, and `#1E293B`.

### Admin Portal Role Guard
- [ ] Non-admin users logged into the app do not see the WordPress Admin Portal link or option in `ProfileScreen.tsx` or preferences.
- [ ] Only users with verified WordPress administrator roles can see or access the WordPress Admin Portal option.

### User Profile Management
- [ ] Authenticated users can view their current display name, email, phone number, bio, and avatar.
- [ ] Modifying profile information and saving updates the data on the WordPress backend via `/wp/v2/users/me` or `/learnpress/v1/users/{id}`.
- [ ] Updated profile data persists across app reloads.

### Authentication & Password Workflow
- [ ] Entering an invalid or non-existent username displays an error distinct from an incorrect password error.
- [ ] Authenticated users can change their password from the app profile settings and authenticate with the new password.
- [ ] Forgot Password flow triggers a reset email request through the WordPress backend endpoint.

### Verification & Code Standards
- [ ] `npm run typecheck` passes with zero errors.
- [ ] `node scripts/audit_app.js` passes with zero broken imports, missing styles, or unhandled timers.
- [ ] Zero arbitrary AI-generated filler text or decorative placeholder code introduced.
