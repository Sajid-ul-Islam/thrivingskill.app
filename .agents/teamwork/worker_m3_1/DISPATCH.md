## 2026-11-08T10:31:18Z
You are worker_m3_1.
Your working directory is d:\Repo\thrivingskill.app\.agents\teamwork\worker_m3_1\

Task Objective:
Implement Milestone 3: User profile information viewing & updating, live synchronization with WordPress REST API (`/wp/v2/users/me`), LearnPress avatar synchronization, authenticated password change (`/learnpress/v1/users/change-password`), and cross-session persistence.

Instructions:
1. Read ORIGINAL_REQUEST.md at d:\Repo\thrivingskill.app\.agents\teamwork\ORIGINAL_REQUEST.md, PROJECT.md at d:\Repo\thrivingskill.app\PROJECT.md, AGENTS.md at d:\Repo\thrivingskill.app\AGENTS.md, and specminer handoff report at d:\Repo\thrivingskill.app\.agents\teamwork\specminer_survey_api_2\handoff.md.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

File Ownership:
You have exclusive write access to:
- `src/services/api/userService.ts`
- `src/screens/ProfileScreen.tsx`
- `src/context/AuthContext.tsx`

Implementation Steps:
1. In `src/services/api/userService.ts`:
   - Export interface `ProfileUpdatePayload`:
     ```typescript
     export interface ProfileUpdatePayload {
       name?: string;
       first_name?: string;
       last_name?: string;
       nickname?: string;
       description?: string;
       phone?: string;
     }
     ```
   - Export interface `ChangePasswordPayload`:
     ```typescript
     export interface ChangePasswordPayload {
       old_password: string;
       new_password: string;
       confirm_password: string;
     }
     ```
   - Implement `updateProfile(payload: ProfileUpdatePayload): Promise<WpUser>`:
     Calls `POST /wp/v2/users/me` with Bearer auth token and `{ name, first_name, last_name, nickname, description }`. Returns updated user data. (Resolves Defect DEFECT-M3-01 / test T1.3.5 in `scripts/e2e_full_suite.js`).
   - Implement `changePassword(payload: ChangePasswordPayload): Promise<{ code: string; message: string }>`:
     Calls `POST /learnpress/v1/users/change-password` with Bearer auth token and `{ old_password, new_password, confirm_password }`. Handles `rest_user_incorrect_password`.
2. In `src/context/AuthContext.tsx`:
   - Ensure `updateUserProfile(updates: Partial<UserProfile>): Promise<void>` is available to update user state in memory and persist across app reloads via `AsyncStorage`.
3. In `src/screens/ProfileScreen.tsx`:
   - Eliminate hardcoded mock strings (lines 78-81: `'01712000000'`, `'Senior Business Strategist...'`, `'Dhaka, Bangladesh'`).
   - Bind inputs and display fields directly to the authenticated user from `AuthContext` (`user.name`, `user.email`, `user.description`, `user.phone`, `user.avatar_urls`).
   - Implement `handleSaveProfile`:
     Call `userService.updateProfile`, update `AuthContext`, persist to storage, show clear confirmation on success, and exit edit mode.
   - Implement `handleChangePassword`:
     Wire password change modal to call `userService.changePassword` with Bearer auth, show clear feedback on success or wrong old password.
4. Verification:
   - Run `npm run typecheck` (`tsc --noEmit`) - must exit with 0 errors.
   - Run `node scripts/audit_app.js` - must pass with 0 errors.
   - Run `node scripts/e2e_full_suite.js` - ALL 73 TESTS MUST PASS (100%!).
5. Document all work in `d:\Repo\thrivingskill.app\.agents\teamwork\worker_m3_1\handoff.md`.
6. Send completion message to orchestrator.
