# Handoff Report: Application Flows, State, Auth & Code Hygiene Survey

**Agent**: `explorer_survey_flows_3`  
**Date**: 2026-11-08  
**Working Directory**: `d:\Repo\thrivingskill.app\.agents\teamwork\explorer_survey_flows_3\`  
**Target Repository**: `d:\Repo\thrivingskill.app`  

---

## 1. Observation

### 1.1 Local Verification & Script Baseline
- **TypeScript Typecheck (`npm run typecheck` / `tsc --noEmit`)**:
  - Command: `npm run typecheck`
  - Exit Code: `0`
  - Total Errors: `0`
  - Verbatim Output:
    ```
    npm notice run thrivingskill.app@1.0.0 typecheck
    npm notice run tsc --noEmit
    ```
- **App Audit Script (`node scripts/audit_app.js`)**:
  - Command: `node scripts/audit_app.js`
  - Exit Code: `0`
  - Total Files Audited: `117`
  - Broken Imports: `0`
  - Broken Asset Requires: `0`
  - Missing Style Definitions: `0`
  - Potential Timer Leaks: `0`
  - Unsafe JSON.parse: `0`
  - Non-blocking Warnings (3 issues discovered):
    - `src\components\modals\AboutTSLModal.tsx:798 -> name: 'Facebook',`
    - `src\components\modals\AboutTSLModal.tsx:799 -> icon: 'logo-facebook',`
    - `src\types\index.ts:287 -> export type SocialPlatform = 'facebook' | 'linkedin';`
- **Live Staging End-to-End Smoke Test (`node scripts/e2e_smoke_test.js`)**:
  - Command: `node scripts/e2e_smoke_test.js`
  - Exit Code: `0`
  - All 6 stages passed: Registration (200), JWT Token Authentication (200), Token Validation (200), Curriculum Query (200), Web Checkout Ping (302), LearnPress Enrollment Handshake (200).

---

### 1.2 WordPress Admin Portal Placement & Access Guard (`ProfileScreen.tsx`)
- **Location 1 (Admin Management Console)**:
  - File: `file:///d:/Repo/thrivingskill.app/src/screens/ProfileScreen.tsx`
  - Lines: `227-255`
  - Renders: "WordPress Admin Dashboard" (`Env.WP_ADMIN_URL`), "Courses & Lessons Management", "Students & Users", "Orders & Enrollment".
  - Current Guard (Line 228):
    ```tsx
    {isAdmin && (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
          {isBangla ? 'অ্যাডমিন কন্ট্রোল সেন্টার' : 'ADMIN MANAGEMENT CONSOLE'}
        </Text>
        ...
    ```
  - Flaw in Role Calculation (Lines 133-136):
    ```typescript
    const isAdmin =
      user?.roles?.includes('administrator') ||
      user?.username?.toLowerCase() === 'admin' ||
      user?.email?.toLowerCase().includes('admin@');
    ```
    *Issue*: Loose string matching allows any unverified user whose email contains `admin@` (e.g. `admin@gmail.com`) or username is `admin` to see admin controls.
- **Location 2 (App Preferences — CRITICAL LEAK)**:
  - File: `file:///d:/Repo/thrivingskill.app/src/screens/ProfileScreen.tsx`
  - Lines: `470-486`
  - Section: `APP PREFERENCES` (`styles.sectionTitle`)
  - Code:
    ```tsx
    {/* WordPress Admin Portal Shortcut */}
    <TouchableOpacity
      style={[styles.settingRow, { borderBottomColor: colors.borderSubtle }]}
      onPress={() => Linking.openURL(Env.WP_ADMIN_URL)}
    >
      <View style={styles.settingLeft}>
        <Ionicons name="settings-outline" size={20} color="#EC4899" />
        <View style={{ marginLeft: 6 }}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            {isBangla ? 'ওয়ার্ডপ্রেস অ্যাডমিন পোর্টাল (WP-Admin)' : 'WordPress Admin Portal (WP-Admin)'}
          </Text>
          <Text style={{ fontSize: 11, color: colors.textMuted }}>
            {Env.WP_ADMIN_URL}
          </Text>
        </View>
      </View>
      <Ionicons name="open-outline" size={16} color={colors.textMuted} />
    </TouchableOpacity>
    ```
  - *Direct Observation*: **There is NO role guard or authentication check on this item whatsoever.** Non-admin users, learners, and guest users all see and can click the WP Admin Portal shortcut.
- **Location 3 (`BrandDrawer.tsx`)**:
  - File: `file:///d:/Repo/thrivingskill.app/src/components/common/BrandDrawer.tsx`
  - Lines: `92-94`
  - `handleOpenWpAdmin` is declared (`Linking.openURL(Env.WP_ADMIN_URL).catch(() => {})`), but is unused in the drawer JSX.

---

### 1.3 User Profile State Loading, Display & Update Integration Points
- **Current State Loading & Display (`ProfileScreen.tsx`)**:
  - Profile card reads `user` from `useAuth()` (Lines 163-210):
    - Avatar: `user?.avatar || 'https://images.unsplash.com/...'`
    - Display Name: `customName || user?.displayName || user?.username || 'Guest Learner'`
    - Verified Badge: `isAdmin ? 'ADMINISTRATOR' : isAuthenticated ? 'STUDENT' : 'GUEST'`
    - Email: `user?.email || 'Explore catalog & courses freely'`
    - Bio: `customBio || (isAuthenticated ? ... : 'Thriving Skills Online Platform')`
  - Hardcoded Mock Values in Component State (Lines 78-81):
    ```typescript
    const [customName, setCustomName] = useState(user?.displayName || user?.username || 'Executive Learner');
    const [customPhone, setCustomPhone] = useState('01712000000');
    const [customBio, setCustomBio] = useState('Senior Business Executive & Continuous Learner');
    const [customCity, setCustomCity] = useState('Gulshan-2, Dhaka');
    ```
    *Issue*: `customPhone`, `customBio`, and `customCity` are static mock placeholders that do not reflect authenticated user data from WordPress, and no `useEffect` resynchronizes them when `user` changes.
- **Edit Profile Modal (`ProfileScreen.tsx`)**:
  - Lines: `1000-1092`
  - Rendered inputs: Full Name (`customName`), Phone Number (`customPhone`), Bio (`customBio`), City (`customCity`). Email input is missing.
  - Handler (Lines 106-109):
    ```typescript
    const handleSaveProfile = () => {
      setEditProfileModalVisible(false);
      Alert.alert('Profile Updated! ✅', 'Your personal executive details have been saved successfully.');
    };
    ```
    *Issue*: Pure client-side mock alert. Does not call `/wp/v2/users/me` or `/learnpress/v1/users/{id}`, and does not update `AuthContext`.
- **Backend Profile Endpoints Verified via Live Probe (`scripts/probe_api_specs.js`)**:
  - `GET /wp-json/wp/v2/users/me` (Authenticated with Bearer token):
    - Status: `200`
    - Returns: `id`, `name`, `slug`, `description`, `avatar_urls`, `roles: ['customer']` (or `['administrator']`).
  - `POST /wp-json/wp/v2/users/me` (Authenticated with Bearer token):
    - Payload: `{ name: 'New Name', description: 'New Bio', nickname: 'New Nickname' }`
    - Status: `200`
    - Response: returns updated `name`, `description`, `nickname`, and `roles`.
  - `GET /wp-json/learnpress/v1/users/{id}`:
    - Status: `200`
    - Returns full LMS profile with enrolled courses, certificates, avatar_url, and `custom_register` phone metadata.

---

### 1.4 Auth Context & Session Lifecycle (`AuthContext.tsx` & `authService.ts`)
- **Persistence (`src/context/AuthContext.tsx`)**:
  - Storage keys:
    - `@thrivingskill_auth_user` (`AUTH_USER_STORAGE_KEY`)
    - `@thrivingskill_auth_token` (`AUTH_TOKEN_STORAGE_KEY`)
  - Initialization (Lines 40-70):
    - Reads both keys from `AsyncStorage`.
    - If found: sets `user`, sets `token`, sets `isGuest(false)`, and triggers background validation `validateWpToken(savedToken)`.
    - If not found: defaults to guest mode (`isGuest: true`).
- **Role Storage & Population (`src/services/api/authService.ts`)**:
  - Lines: `30-50`
  - After LearnPress JWT token is generated (`/learnpress/v1/token`), `AuthService.login` invokes `GET /wp/v2/users/me` to obtain authentic user roles (`userProfile?.roles`).
  - Stored in `WpUser` interface (`src/types/index.ts:24-33`):
    ```typescript
    export interface WpUser {
      id: number | string;
      username: string;
      email: string;
      displayName: string;
      phone?: string;
      avatar?: string;
      token?: string;
      roles?: string[];
    }
    ```
- **Missing Profile Update Method in AuthContext**:
  - `AuthContext` has no method to update the in-memory and persisted `user` object when a user updates their profile. A method like `updateUserProfile(partialUser: Partial<WpUser>)` is required.

---

### 1.5 Login Screen, Error Differentiation & Password Workflows (`AuthModal.tsx`)
- **Login Screen Architecture (`src/components/modals/AuthModal.tsx`)**:
  - Re-exported by `src/components/AuthModal.tsx` and used globally in `App.tsx` (Lines 284-287).
  - Mode state (Line 35): `type AuthMode = 'login' | 'register'`.
  - Error Box (Lines 179-188): Renders `errorMessage` with an alert icon.
  - Current Error Handling in `handleLogin` (Lines 67-78):
    ```typescript
    catch (err: any) {
      if (
        err.message?.includes('Phone Number is required field') ||
        err.message?.includes('registration-custom-required-field')
      ) {
        setErrorMessage('WordPress requires a phone number for registration...');
      } else {
        setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
      }
    }
    ```
- **Live Error Differentiation from Staging Backend (`POST /learnpress/v1/token`)**:
  - **Case 1: Non-Existent Username / Invalid User**:
    - HTTP Status: `403`
    - Response Code: `'[lp_jwt_auth] invalid_username'`
    - Message: `'<strong>Error:</strong> The username <strong>...</strong> is not registered on this site. If you are unsure of your username, try your email address instead.'`
  - **Case 2: Existing User with Incorrect Password**:
    - HTTP Status: `403`
    - Response Code: `'[lp_jwt_auth] incorrect_password'`
    - Message: `'<strong>Error:</strong> The password you entered for the username <strong>...</strong> is incorrect. <a href="...">Lost your password?</a>'`
  - **Case 3: Empty Username/Password**:
    - HTTP Status: `403`
    - Response Code: `'[lp_jwt_auth] empty_username'`
- **Forgot Password Workflow**:
  - In `AuthModal.tsx`: **Zero presence.** There is no "Forgot Password?" button or link.
  - Staging Endpoint Verified: `POST /wp-json/learnpress/v1/users/reset-password`:
    - Payload: `{ user_login: email_or_username }`
    - Success (200): `{ code: 'success', message: 'A link to reset your password has been emailed to you.' }`
    - Non-existent user (500): `{ code: 'error_not_user', message: 'Invalid username or email.', data: null }`
- **Change Password Workflow in `ProfileScreen.tsx`**:
  - Modal: Lines `1094-1170`.
  - Current Handler (Lines 111-129): Mock alert with zero API execution.
  - Staging Endpoint Verified: `POST /wp-json/learnpress/v1/users/change-password` (Authenticated Bearer):
    - Payload: `{ old_password, new_password, confirm_password }`
    - Success (200): `{ code: 'success', message: 'Your password has been updated. Please log in again to continue!' }`

---

### 1.6 Cross-Platform Timer Hygiene Audit
- **`NodeJS.Timeout` Usage**:
  - Total occurrences across all `.ts`, `.tsx`, `.js`: `0` (Fully compliant).
- **Component-by-Component Timer Analysis**:
  1. `src/components/common/BrandDrawer.tsx`:
     - Line 85: `setTimeout(action, 150)` in `handleNav`.
     - *Status*: **Violation of AGENTS.md Rule 3.** Not stored in a `useRef`, not cleared on component unmount.
  2. `src/context/SaaSContext.tsx`:
     - Line 253: `setTimeout(...)` in `sendCopilotMessage`.
     - *Status*: **Violation of AGENTS.md Rule 3.** Not stored in a ref, no cleanup if unmounted.
  3. `src/screens/LessonPlayerScreen.tsx`:
     - Line 135: `const timer = setTimeout(...)` inside `useEffect` (cleared via `clearTimeout(timer)` in return).
     - Line 144: `const interval = setInterval(...)` inside `useEffect` (cleared via `clearInterval(interval)` in return).
     - *Status*: Has cleanup, but declared as local `const` rather than `useRef`.
  4. `src/components/modals/QuizPlayerModal.tsx`:
     - Line 82: `const interval = setInterval(...)` inside `useEffect` (cleared via `clearInterval(interval)` in return).
     - *Status*: Has cleanup, but declared as local `const` rather than `useRef`.
  5. `src/components/modals/PaymentModal.tsx`:
     - Lines 50-63: Declares `syncTimerRef` & `autoCheckTimerRef` via `useRef<ReturnType<typeof setTimeout> | null>(null)` and clears both in `useEffect` unmount.
     - *Status*: **Gold Standard (100% Compliant).**
  6. `src/components/modals/CertificateModal.tsx`:
     - Lines 30-38: Declares `pdfTimerRef` & `copyTimerRef` via `useRef<ReturnType<typeof setTimeout> | null>(null)` and clears both in `useEffect` unmount.
     - *Status*: **Gold Standard (100% Compliant).**
  7. `src/components/common/HeroCarousel.tsx`:
     - Lines 78, 101-104: Declares `timerRef` via `useRef<ReturnType<typeof setInterval> | null>(null)` and clears on unmount.
     - *Status*: **Gold Standard (100% Compliant).**
  8. `src/hooks/useAutoScroll.ts`:
     - Line 51: `resumeTimeoutRef` stored in `useRef<ReturnType<typeof setTimeout> | null>(null)` and cleared in `useEffect` cleanup.
     - *Status*: **Compliant.**

---

## 2. Logic Chain

```
[Observation 1.2B: Lines 470-486 in ProfileScreen.tsx]
       │
       ▼
"WordPress Admin Portal" rendered inside APP PREFERENCES unconditionally
       │
       ▼
Violates Requirement R2: Non-admin users see WP Admin Portal link
       │
       ▼
[Remediation 1]: Remove lines 470-486 OR enclose in {isAdmin && ...}
                 And tighten isAdmin check to strictly test user.roles.includes('administrator').


[Observation 1.5A & 1.5B: Error response codes from /learnpress/v1/token]
       │
       ▼
Backend returns distinct error codes:
  • '[lp_jwt_auth] invalid_username' / 'is not registered on this site'
  • '[lp_jwt_auth] incorrect_password' / 'password you entered ... is incorrect'
       │
       ▼
AuthModal currently catches any error and outputs generic fallback:
  "Authentication failed. Please check your credentials."
       │
       ▼
[Remediation 2]: Parse err.code and err.message in AuthModal.handleLogin:
  • If code/message indicates invalid_username -> "No account found with this username or email. Please check your spelling or register."
  • If code/message indicates incorrect_password -> "Incorrect password entered. Please try again or tap 'Forgot Password?' to reset."


[Observation 1.4D & 1.5C: No Forgot Password in AuthModal.tsx]
       │
       ▼
Backend endpoint /learnpress/v1/users/reset-password tested and working (200 on email)
       │
       ▼
[Remediation 3]: Add Forgot Password UI link below password input in AuthModal.tsx,
                 adding a 'forgot_password' mode that calls AuthService.resetPassword(loginOrEmail).


[Observation 1.3A, 1.3B, 1.3C: Profile state and handlers are static mocks]
       │
       ▼
ProfileScreen edit modal uses mock strings and mock alert, never calling /wp/v2/users/me
       │
       ▼
[Remediation 4]: Connect Edit Profile modal to AuthService.updateProfile / HttpClient.post('/wp/v2/users/me'),
                 populate inputs from active user, and add updateUser to AuthContext to persist to AsyncStorage.


[Observation 1.6B & 1.6C: BrandDrawer.tsx:85 and SaaSContext.tsx:253]
       │
       ▼
Direct setTimeout calls without useRef or unmount cleanup
       │
       ▼
[Remediation 5]: Wrap timeouts in useRef<ReturnType<typeof setTimeout> | null>(null)
                 and add unmount cancellation in useEffect.
```

---

## 3. Caveats

1. **Avatar Upload vs Gravatar**:
   - The WordPress REST API (`/wp/v2/users/me`) returns `avatar_urls` pointing to Gravatar. Uploading a custom binary avatar requires either the WP Media endpoint (`/wp/v2/media`) followed by setting user meta, or selecting from preset executive avatars. Preset executive avatar selection or Gravatar sync is the safest and most reliable mobile pattern.
2. **Phone Number Storage**:
   - LearnPress and custom registration store phone numbers in user meta (`phone`, `billing_phone`, or custom register form). Reading the phone number is best done from `user.phone` or `custom_register` field from `/learnpress/v1/users/{id}`.
3. **Password Change Authentication Invalidation**:
   - When a password is changed via `/learnpress/v1/users/change-password`, the existing JWT token remains valid until expiration, but the WordPress session cookie is updated. The user can either continue with their active token or be prompted to re-login with the new password.
4. **Offline / Network Outage State**:
   - Profile update and password change requests must be wrapped in `try/catch` with clear, user-friendly offline notifications if the network is disconnected.

---

## 4. Conclusion & Concrete Implementation Plan

### 4.1 Required Changes by File

| File | Target Location | Recommended Action |
|---|---|---|
| `src/screens/ProfileScreen.tsx` | Line 133-136 | **Strict Role Guard**: Tighten `isAdmin` to `Boolean(user?.roles?.includes('administrator'))`. Eliminate loose email/username substring matching. |
| `src/screens/ProfileScreen.tsx` | Line 470-486 | **Admin Portal Leak Removal**: Remove the unconditional WP-Admin shortcut from `APP PREFERENCES`, or wrap it strictly inside `{isAdmin && (...)}`. |
| `src/screens/ProfileScreen.tsx` | Line 78-81, 106-109, 1000-1092 | **Real Profile Update Flow**: Remove hardcoded mock strings (`'01712000000'`, etc.). Pre-fill with `user` fields. In `handleSaveProfile`, call API (`/wp/v2/users/me`), update `AuthContext.updateUser`, and display feedback. |
| `src/screens/ProfileScreen.tsx` | Line 111-129, 1094-1170 | **Real Password Change Flow**: In `handleChangePassword`, call `AuthService.changePassword(currentPass, newPass, confirmPass)` against `/learnpress/v1/users/change-password`. |
| `src/components/modals/AuthModal.tsx` | Line 24, 35, 330-350 | **Forgot Password UI & Mode**: Add a `'forgot_password'` view with email input, calling `AuthService.resetPassword(email)` (`/learnpress/v1/users/reset-password`). |
| `src/components/modals/AuthModal.tsx` | Line 67-78 | **Distinct Error Messaging**: Inspect `err.code` and `err.message` to differentiate between invalid username (`invalid_username`) and wrong password (`incorrect_password`). |
| `src/services/api/authService.ts` | New Methods | Add `updateProfile(data: { name?: string; description?: string; nickname?: string })` calling `POST /wp/v2/users/me`, and `changePassword(oldPass, newPass, confirmPass)` calling `POST /learnpress/v1/users/change-password`. |
| `src/context/AuthContext.tsx` | Context & State | Add `updateUser(partialUser: Partial<WpUser>): Promise<void>` to update state and synchronize with `@thrivingskill_auth_user` in `AsyncStorage`. |
| `src/components/common/BrandDrawer.tsx` | Line 85 | **Timer Hygiene**: Wrap `setTimeout` in `navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)` with unmount cleanup in `useEffect`. |
| `src/context/SaaSContext.tsx` | Line 253 | **Timer Hygiene**: Store copilot timeout in ref and cancel on teardown. |

---

## 5. Verification Method

To independently verify these findings and confirm subsequent fixes:

1. **Verify Non-Admin Portal Concealment**:
   - Log in with a standard non-admin account (e.g. `student_...`).
   - Navigate to the Profile tab.
   - Inspect the UI: The "ADMIN MANAGEMENT CONSOLE" section must be hidden, and the "APP PREFERENCES" section must NOT display "WordPress Admin Portal (WP-Admin)".
   - Log in with an administrator account: The "ADMIN MANAGEMENT CONSOLE" section must appear with all administrative links.
2. **Verify Error Differentiation**:
   - In `AuthModal`, submit a non-existent username: The error message must specifically state that the username/email is not registered.
   - In `AuthModal`, submit a valid registered username with an incorrect password: The error message must state that the password is incorrect and direct the user to Forgot Password.
3. **Verify Forgot Password Flow**:
   - In `AuthModal`, click "Forgot Password?", enter a registered email, and submit.
   - Verify that the server returns HTTP 200 with message "A link to reset your password has been emailed to you."
4. **Verify Profile Update Synchronization**:
   - In `ProfileScreen`, open Edit Profile, change display name and bio, and click Save.
   - Restart the app: Verify that the updated name and bio persist from `AsyncStorage`.
5. **Run Project Quality & Audit Commands**:
   ```powershell
   npm run typecheck
   node scripts/audit_app.js
   node scripts/e2e_smoke_test.js
   ```
   *Expected outcome*: Typecheck exits with code 0; `audit_app.js` reports 0 broken imports, 0 missing styles, 0 unhandled timers; and `e2e_smoke_test.js` completes all 6 stages.
