# Dual Track E2E Test Suite Infrastructure & Architecture (Tiers 1-4)
## Thriving Skills Mobile Application (React Native / WordPress LMS)

---

## 1. Executive Summary & Testing Philosophy

The **Dual Track E2E Test Suite** serves as the primary automated quality gate for the Thriving Skills mobile application. It verifies all user requirements established in `ORIGINAL_REQUEST.md` and specifications detailed in `PROJECT.md` against both static source code contracts and the live WordPress / LearnPress staging backend (`https://staging.thrivingskill.com/wp-json`).

### 1.1 Core Principles
1. **Opaque-Box Specification Derivation**: Tests are derived strictly from user requirements (`ORIGINAL_REQUEST.md`) and architectural contracts (`PROJECT.md`), **never** from implementation internals or temporary workarounds.
2. **Dual-Track Independence**: Test creation proceeds in parallel with milestone development. The test suite serves as an unyielding validation baseline for implementing agents.
3. **Non-Destructive Live Testing**: All live backend test runs instantiate dynamic test student accounts via `/learnpress/v1/token/register` with cryptographic timestamps, leaving zero residual mutations or corrupted state on staging databases.
4. **Zero-Dependency PowerShell Compliance**: Implemented in standard Node.js (`scripts/e2e_full_suite.js`), conforming to `AGENTS.md` Rule 4 (Windows PowerShell safe, self-contained, no external runtime dependencies).

---

## 2. Test Architecture & Execution Engine

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       DUAL TRACK E2E RUNNER                                 │
│                   `node scripts/e2e_full_suite.js`                          │
└───────────────────────┬─────────────────────────────┬───────────────────────┘
                        │                             │
        ┌───────────────▼───────────────┐     ┌───────▼───────────────────────┐
        │     STATIC CONTRACT LAYER     │     │      LIVE BACKEND LAYER       │
        ├───────────────────────────────┤     ├───────────────────────────────┤
        │ • M3 Shape Tokens (shapes.ts) │     │ • Dynamic Registration        │
        │ • Brand Color Preservation    │     │ • JWT Token Handshake         │
        │ • Bottom Nav Pill Capsule     │     │ • Token Validation & Expiry   │
        │ • 48dp Minimum Touch Targets  │     │ • Error Differentiation       │
        │ • Tactile Pressable Feedback  │     │ • Profile Sync (wp/v2/users)  │
        │ • Cross-Platform Timer Hygiene│     │ • Password Reset & Change     │
        │ • Strict Admin Role Guard     │     │ • LMS Course Curriculum Sync  │
        │ • TypeScript Typecheck (tsc)  │     │ • Web Checkout Deep Links     │
        └───────────────────────────────┘     └───────────────────────────────┘
```

### 2.1 Layer 1: Static Contract & Design System Layer
- Validates token definitions (`src/theme/shapes.ts`, `src/theme/colors.ts`).
- Enforces Material Design 3 UI structure (`App.tsx` tab indicator pill capsule: 60x32, `shape.full`, minHeight 48dp).
- Scans JSX components for 48dp touch targets and `android_ripple` tactile feedback.
- Audits timer hygiene (`useRef` + unmount cleanup across all React components).
- Enforces strict role verification contract: `isUserAdmin(user)` requires `user?.roles?.includes('administrator')`.

### 2.2 Layer 2: Live Backend & LMS Integration Layer
- Connects over HTTPS to `https://staging.thrivingskill.com/wp-json`.
- Issues non-destructive dynamic registration payloads.
- Validates LearnPress JWT authentication tokens.
- Tests distinct error codes (`[lp_jwt_auth] invalid_username` vs `[lp_jwt_auth] incorrect_password`).
- Verifies profile update persistence on `/wp/v2/users/me`.
- Validates password recovery via `/learnpress/v1/users/reset-password` and authenticated password updates via `/learnpress/v1/users/change-password`.

---

## 3. Four-Tier Test Taxonomy

| Tier | Tier Name | Purpose | Minimum Requirement | Total Cases |
|------|-----------|---------|---------------------|-------------|
| **Tier 1** | **Feature Coverage** | Validates primary behavior & happy paths for each feature | $\ge 5$ test cases per feature | 30 |
| **Tier 2** | **Boundary & Corner Cases** | Stress-tests edge inputs, nulls, invalid states, unicode, error codes | $\ge 5$ test cases per feature | 30 |
| **Tier 3** | **Cross-Feature Combinations** | Tests pairwise interactions across auth, profile, LMS, and roles | Multi-feature dependency chains | 8 |
| **Tier 4** | **Real-World Application Scenarios** | Validates complete end-to-end user workflows and lifecycles | Complete user journeys | 5 |
| **Total** | | | | **73** |

---

## 4. Feature Inventory & Mapping Matrix

| # | Feature Code | Feature Name | Requirement Ref | Primary Target Modules |
|---|--------------|--------------|-----------------|------------------------|
| 1 | `F1_M3_UI` | Material Design 3 UI & Design System | R1 | `src/theme/shapes.ts`, `src/theme/colors.ts`, `App.tsx`, `Header.tsx` |
| 2 | `F2_ADMIN_GUARD` | WordPress Admin Portal Role Guard | R2 | `src/screens/ProfileScreen.tsx`, `src/services/api/authService.ts` |
| 3 | `F3_PROFILE_SYNC` | User Profile Update & LMS Synchronization | R3 | `src/services/api/userService.ts`, `src/screens/ProfileScreen.tsx` |
| 4 | `F4_AUTH_PASS` | Authentication & Password Recovery/Change | R4 | `src/components/modals/AuthModal.tsx`, `src/services/api/authService.ts` |
| 5 | `F5_BACKEND_LMS`| WordPress Staging Backend Integration | R5 | `https://staging.thrivingskill.com/wp-json`, LearnPress REST endpoints |
| 6 | `F6_GUARDRAILS` | Codebase Guardrails & Hygiene | R6 | `npm run typecheck`, `node scripts/audit_app.js`, timer hygiene |

---

## 5. Comprehensive Test Case Catalog

### 5.1 Tier 1: Feature Coverage (30 Test Cases)

#### Feature 1: Material Design 3 UI & Design System (`F1_M3_UI`)
- `T1.1.1`: **M3 Shape Tokens Export**: `src/theme/shapes.ts` must export `shape` object with `none (0)`, `extraSmall (4)`, `small (8)`, `medium (12)`, `large (16)`, `largeIncreased (20)`, `extraLarge (28)`, and `full (9999)`.
- `T1.1.2`: **Official Brand Color Palette**: `src/theme/colors.ts` must define Brand Deep Navy (`#102F53`), Sunshine Gold (`#FFB606`), Crimson/Coral (`#E34234`), and Surfaces (`#F8FAFC` / `#1E293B`).
- `T1.1.3`: **Bottom Nav M3 Pill Capsule**: `App.tsx` active tab must render an M3 pill indicator capsule wrapping the active icon with `shape.full` or `borderRadius: 9999` and dimensions ~60x32.
- `T1.1.4`: **48dp Minimum Touch Dimension**: Bottom navigation tab touch targets in `App.tsx` must enforce minimum height of 48dp (`minHeight: 48`).
- `T1.1.5`: **Tactile Feedback Implementation**: Interactive touch components must utilize `Pressable` with `android_ripple` or tactile touch layer.

#### Feature 2: WordPress Admin Portal Access Guard (`F2_ADMIN_GUARD`)
- `T1.2.1`: **Strict Admin Verification Contract**: `isUserAdmin({ roles: ['administrator'] })` must strictly return `true`.
- `T1.2.2`: **Student/Customer Role Rejection**: `isUserAdmin({ roles: ['customer'] })` and `isUserAdmin({ roles: ['subscriber'] })` must return `false`.
- `T1.2.3`: **Username Spoofing Rejection**: User with `username: 'admin'` but `roles: ['customer']` must return `false`.
- `T1.2.4`: **Email Spoofing Rejection**: User with `email: 'admin@thrivingskill.test'` but `roles: ['customer']` must return `false`.
- `T1.2.5`: **App Preferences Admin Link Guard**: WP-Admin shortcut in `ProfileScreen.tsx` (lines 470-486) must be hidden for non-admin users.

#### Feature 3: User Profile Update & LMS Synchronization (`F3_PROFILE_SYNC`)
- `T1.3.1`: **Live Profile Retrieval**: `GET /wp/v2/users/me?context=edit` with valid Bearer auth returns status 200 with `id`, `name`, `email`, and `roles`.
- `T1.3.2`: **Live Profile Update**: `POST /wp/v2/users/me` with Bearer auth updates `name` and `description` (bio) returning status 200.
- `T1.3.3`: **Profile Persistence Verification**: Subsequent `GET /wp/v2/users/me` confirms updated `name` and `description` are persisted on the backend.
- `T1.3.4`: **LearnPress User Details Query**: `GET /learnpress/v1/users/{id}` returns user LMS record with high-resolution avatar URL.
- `T1.3.5`: **UserService Contract Compliance**: `src/services/api/userService.ts` must expose `updateProfile` matching `ProfileUpdatePayload`.

#### Feature 4: Authentication & Password Workflows (`F4_AUTH_PASS`)
- `T1.4.1`: **Login Invalid Username Differentiation**: `POST /learnpress/v1/token` with non-existent user returns HTTP 403 with code `[lp_jwt_auth] invalid_username`.
- `T1.4.2`: **Login Incorrect Password Differentiation**: `POST /learnpress/v1/token` with valid username and wrong password returns HTTP 403 with code `[lp_jwt_auth] incorrect_password`.
- `T1.4.3`: **Login Empty Username Differentiation**: `POST /learnpress/v1/token` with empty username returns HTTP 403 with code `[lp_jwt_auth] empty_username`.
- `T1.4.4`: **Forgot Password Dispatch**: `POST /learnpress/v1/users/reset-password` with valid registered email returns HTTP 200 with code `success`.
- `T1.4.5`: **Authenticated Password Change**: `POST /learnpress/v1/users/change-password` with valid credentials returns HTTP 200 with code `success`.

#### Feature 5: WordPress Staging Backend Integration (`F5_BACKEND_LMS`)
- `T1.5.1`: **Backend API Discovery & Health**: `GET https://staging.thrivingskill.com/wp-json` returns HTTP 200 with namespaces and route index.
- `T1.5.2`: **Dynamic Student Registration**: `POST /learnpress/v1/token/register` creates non-destructive test student and returns JWT auth token.
- `T1.5.3`: **JWT Token Validation**: `POST /learnpress/v1/token/validate` with Bearer auth confirms token validity and expiration.
- `T1.5.4`: **LearnPress Course Catalog Query**: `GET /learnpress/v1/courses` returns course listings with pricing and IDs.
- `T1.5.5`: **Course Curriculum Exploration**: `GET /learnpress/v1/courses/{id}` returns syllabus sections, lessons, and course details.

#### Feature 6: Codebase Guardrails & Hygiene (`F6_GUARDRAILS`)
- `T1.6.1`: **TypeScript Compiler Verification**: `npm run typecheck` (`tsc --noEmit`) passes with exit code 0.
- `T1.6.2`: **Static App Audit**: `node scripts/audit_app.js` passes with exit code 0 (zero broken imports, zero missing styles).
- `T1.6.3`: **Component Timer Hygiene**: All component timers use `useRef` and unmount cleanup in `useEffect`.
- `T1.6.4`: **Color Typo Elimination**: Zero instances of off-brand `#102E52` typo in active UI components.
- `T1.6.5`: **Theme Token Integrity**: Consistency between `shapes.ts` and `colors.ts` token definitions.

---

### 5.2 Tier 2: Boundary & Corner Cases (30 Test Cases)

#### Feature 1: Material Design 3 UI & Design System (`F1_M3_UI`)
- `T2.1.1`: **Shape Full Numerical Value**: `shape.full` must be numeric $\ge 9999$ for proper capsule pill curvature in React Native.
- `T2.1.2`: **Shape Token Schema Invariants**: All 8 M3 shape tokens must be non-negative integers in ascending or equal order.
- `T2.1.3`: **Sub-48dp HitSlop Compensation**: Any interactive button with computed visual height < 48dp must specify `hitSlop` to achieve 48dp touch dimension.
- `T2.1.4`: **Hex Color Format Compliance**: All color tokens in `src/theme/colors.ts` must be valid uppercase or lowercase hex codes (`#RRGGBB` or `#RRGGBBAA`).
- `T2.1.5`: **Ripple Boundary Containment**: Android ripple configs must specify `borderless: false` or explicit radius to prevent bleeding outside capsule boundaries.

#### Feature 2: WordPress Admin Portal Access Guard (`F2_ADMIN_GUARD`)
- `T2.2.1`: **Null User Boundary**: `isUserAdmin(null)` must return `false` without throwing exception.
- `T2.2.2`: **Undefined User Boundary**: `isUserAdmin(undefined)` must return `false` without throwing exception.
- `T2.2.3`: **Empty Roles Array Boundary**: `isUserAdmin({ roles: [] })` must return `false`.
- `T2.2.4`: **Role Substring Collision**: `isUserAdmin({ roles: ['not_an_administrator', 'admin_helper'] })` must return `false`.
- `T2.2.5`: **Malformed Roles Property**: `isUserAdmin({ roles: 'administrator' as any })` must safely return `false`.

#### Feature 3: User Profile Update & LMS Synchronization (`F3_PROFILE_SYNC`)
- `T2.3.1`: **Empty Bio Boundary**: `POST /wp/v2/users/me` with `description: ""` successfully clears user bio.
- `T2.3.2`: **Unicode & Bengali Text Integrity**: `POST /wp/v2/users/me` with Bengali characters (`নাম: "শাহরিয়ার খান"`, `বিবরণ: "সিনিয়র নির্বাহী কোচ"`) preserves UTF-8 fidelity.
- `T2.3.3`: **Extreme Bio Length Boundary**: `POST /wp/v2/users/me` with 1,000-character bio handles payload without HTTP 500 error.
- `T2.3.4`: **HTML Meta Escaping**: Input containing `<script>alert('xss')</script>` or `&amp;` is safely handled by WordPress REST sanitizer.
- `T2.3.5`: **Unauthenticated Profile Update**: `POST /wp/v2/users/me` without Bearer token returns HTTP 401 (`rest_not_logged_in`).

#### Feature 4: Authentication & Password Workflows (`F4_AUTH_PASS`)
- `T2.4.1`: **Wrong Old Password**: `POST /learnpress/v1/users/change-password` with invalid old password returns HTTP 403 `rest_user_incorrect_password`.
- `T2.4.2`: **Mismatched Confirm Password**: Password change payload with `new_password !== confirm_password` is rejected.
- `T2.4.3`: **Unauthenticated Password Change**: `POST /learnpress/v1/users/change-password` without Bearer token returns HTTP 401 `rest_cannot_edit`.
- `T2.4.4`: **Non-Existent User Reset Password**: `POST /learnpress/v1/users/reset-password` with unknown email returns HTTP 500 `error_not_user`.
- `T2.4.5`: **Empty User Login Reset Password**: `POST /learnpress/v1/users/reset-password` with empty string returns HTTP 500 `error_santize_login`.

#### Feature 5: WordPress Staging Backend Integration (`F5_BACKEND_LMS`)
- `T2.5.1`: **Duplicate Username Registration**: `POST /learnpress/v1/token/register` with existing username returns HTTP 403 `[lp_jwt_auth] username_exists`.
- `T2.5.2`: **Duplicate Email Registration**: `POST /learnpress/v1/token/register` with existing email returns HTTP 403 `[lp_jwt_auth] email_exists`.
- `T2.5.3`: **Malformed / Tampered JWT Validation**: `POST /learnpress/v1/token/validate` with header `Bearer invalid.jwt.token` returns HTTP 403 `[lp_jwt_auth] invalid_token`.
- `T2.5.4`: **Non-Existent Course ID**: `GET /learnpress/v1/courses/9999999` handles missing resource gracefully (404 or empty).
- `T2.5.5`: **Non-Existent LearnPress User ID**: `GET /learnpress/v1/users/9999999` returns HTTP 404.

#### Feature 6: Codebase Guardrails & Hygiene (`F6_GUARDRAILS`)
- `T2.6.1`: **Unmount Cleanup Verification**: Every `useEffect` containing `setTimeout` or `setInterval` returns a cleanup function calling `clearTimeout` / `clearInterval`.
- `T2.6.2`: **Strict Type Contracts**: Interfaces `ProfileUpdatePayload` and `ChangePasswordPayload` avoid `any` types for core string fields.
- `T2.6.3`: **Cross-Platform Path Portability**: Script file operations use `path.join` and normalized slashes to avoid Windows/POSIX path divergence.
- `T2.6.4`: **Local Asset Existence**: All local image files referenced via `require()` exist on disk.
- `T2.6.5`: **JSON Parse Guarding**: All JSON parse calls in network clients and utilities are wrapped in try/catch.

---

### 5.3 Tier 3: Cross-Feature Combinations (8 Test Cases)
- `T3.1`: **Registration -> Profile Update -> Token Validation**: Create student, update name/bio, immediately validate JWT token lifecycle.
- `T3.2`: **Profile Update -> Password Change -> Re-Login**: Update profile, change password via authenticated endpoint, re-login with new password, verify profile persistence.
- `T3.3`: **Dynamic Registration -> Admin Role Check**: Register student account, verify `isUserAdmin` strictly evaluates to `false`, confirm non-admin UI isolation.
- `T3.4`: **Registration -> Forgot Password -> Original Login**: Register student, trigger reset password email, confirm original credentials remain valid until reset key consumed.
- `T3.5`: **Registration with Phone -> Profile Sync**: Register student with phone number, verify profile retrieval and phone metadata synchronization.
- `T3.6`: **Unicode Profile Sync -> Course Curriculum Exploration**: Update user profile with Bengali Unicode text, query course catalog, verify no encoding degradation across LearnPress/WordPress boundaries.
- `T3.7`: **Design System Token Mutual Consistency**: Verify `shapes.ts` tokens and `colors.ts` tokens are imported and co-located in UI screen styles without style collisions.
- `T3.8`: **Sequential Profile Updates with Token Reuse**: Execute rapid sequential profile updates using a single JWT session to verify backend idempotency and session stability.

---

### 5.4 Tier 4: Real-World Application Scenarios (5 Workflows)
- `T4.1`: **Student Full Onboarding & Learning Lifecycle Workflow**:
  - Dynamically register student -> JWT token handshake -> Validate token -> Fetch profile -> Explore course catalog (ID 11580) -> Retrieve syllabus modules -> Ping web checkout deep link bridge -> Perform enrollment handshake.
- `T4.2`: **Student Account Security & Credential Lifecycle Workflow**:
  - Dynamically register student -> Update executive display name and bio -> Change password via authenticated endpoint -> Log in with new password -> Confirm updated profile and valid token.
- `T4.3`: **Privilege Separation & Admin Guard Workflow**:
  - Instantiate student account -> Validate `roles: ['customer']` -> Test spoofed username `admin` and email `admin@...` -> Confirm strict `false` -> Verify ProfileScreen & App Preferences completely hide admin portal.
- `T4.4`: **Authentication Resilience & Recovery Workflow**:
  - Probe non-existent user login -> Verify distinct `invalid_username` error -> Probe incorrect password -> Verify distinct `incorrect_password` error -> Trigger Forgot Password flow -> Confirm reset email dispatch.
- `T4.5`: **Design System & Architecture Guardrail Workflow**:
  - Execute full static audit: verify `shapes.ts` (all 8 M3 tokens), `colors.ts` (all brand colors), M3 tab capsule in `App.tsx`, 48dp touch targets, tactile feedback ripple, 0 broken imports, 0 missing styles, 0 unhandled timers, and `npm run typecheck` 0 errors.

---

## 6. Dynamic Test Account Protocol

To guarantee non-destructive execution against live staging:
1. **Dynamic Identifier**: `ts_e2e_${Date.now().toString().slice(-6)}`
2. **Registration Endpoint**: `POST https://staging.thrivingskill.com/wp-json/learnpress/v1/token/register`
3. **Payload**:
   ```json
   {
     "username": "ts_e2e_XXXXXX",
     "email": "ts_e2e_XXXXXX@thrivingskill.test",
     "password": "TS_E2E_Pass_XXXXXX!",
     "confirm_password": "TS_E2E_Pass_XXXXXX!"
   }
   ```
4. **Safety Guarantee**: Dynamic accounts are isolated, non-administrative (`roles: ['customer']`), and do not overwrite or modify existing user records or courses.

---

## 7. How to Run the Test Suite

```powershell
# Run the complete Dual Track E2E Test Suite (All Tiers 1-4)
node scripts/e2e_full_suite.js

# Run a specific tier
node scripts/e2e_full_suite.js --tier=1
node scripts/e2e_full_suite.js --tier=2
node scripts/e2e_full_suite.js --tier=3
node scripts/e2e_full_suite.js --tier=4

# Run only live backend tests
node scripts/e2e_full_suite.js --live-only

# Run only static contract and design system tests
node scripts/e2e_full_suite.js --static-only
```
