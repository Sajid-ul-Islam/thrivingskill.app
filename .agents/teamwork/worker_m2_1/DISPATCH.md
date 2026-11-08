# Task Assignment

Role: Worker (Milestone 2: Auth & Role Guard)
Working Directory: d:\Repo\thrivingskill.app\.agents\teamwork\worker_m2_1\
Original Request: d:\Repo\thrivingskill.app\.agents\teamwork\ORIGINAL_REQUEST.md
Project Document: d:\Repo\thrivingskill.app\PROJECT.md
Spec Miner Report: d:\Repo\thrivingskill.app\.agents\teamwork\specminer_survey_api_2\handoff.md
Survey Flows Report: d:\Repo\thrivingskill.app\.agents\teamwork\explorer_survey_flows_3\handoff.md
## 2026-11-08T10:03:04Z
You are worker_m2_1.
Your working directory is d:\Repo\thrivingskill.app\.agents\teamwork\worker_m2_1\

Task Objective:
Implement Milestone 2: Auth error differentiation, Forgot Password flow, strict WordPress administrator role guard in ProfileScreen preferences, and SaaSContext timer hygiene.

Instructions:
1. Read ORIGINAL_REQUEST.md at d:\Repo\thrivingskill.app\.agents\teamwork\ORIGINAL_REQUEST.md, PROJECT.md at d:\Repo\thrivingskill.app\PROJECT.md, AGENTS.md at d:\Repo\thrivingskill.app\AGENTS.md, and specminer handoff report at d:\Repo\thrivingskill.app\.agents\teamwork\specminer_survey_api_2\handoff.md.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

File Ownership:
You have exclusive write access to:
- `src/components/modals/AuthModal.tsx`
- `src/screens/ProfileScreen.tsx` (specifically lines 133-136 for strict isAdmin contract and lines 470-486 for wrapping Admin Portal preference item)
- `src/context/SaaSContext.tsx`

Implementation Steps:
1. In `src/components/modals/AuthModal.tsx`:
   - Differentiate login errors using `err.code` from staging API:
     * If `err.code?.includes('invalid_username')` -> display distinct error: "Username or email is not registered. Please check your spelling or create an account."
     * If `err.code?.includes('incorrect_password')` -> display distinct error: "Incorrect password. Please try again or tap 'Forgot Password' below."
     * Handle other errors with appropriate specific feedback.
   - Implement Forgot / Reset Password flow:
     * Add "Forgot Password?" touchable option on the login dialog.
     * When initiated, prompt/input for username or email and invoke `POST /learnpress/v1/users/reset-password` with `{ user_login: email_or_username.trim() }` (target backend: `https://staging.thrivingskill.com/wp-json`).
     * On HTTP 200 `{ code: 'success' }`: display success confirmation that a reset link has been emailed.
     * On error (`error_not_user`): display clear notification that the user was not found.
2. In `src/screens/ProfileScreen.tsx`:
   - Implement strict WordPress administrator role verification at lines 133-136:
     `const isAdmin = Array.isArray(user?.roles) && user.roles.includes('administrator');`
     Remove all loose string heuristics (`user?.username?.toLowerCase() === 'admin' || user?.email?.includes('admin@')`).
   - Under `APP PREFERENCES` (lines 470-486), strictly wrap the "WordPress Admin Portal" link / preference item in `{isAdmin && ( ... )}` so it is completely hidden from non-admin users and unauthenticated guests.
3. In `src/context/SaaSContext.tsx`:
   - Inspect line 253 for unhandled timer (`setTimeout(...)`). Fix cross-platform timer hygiene: use `useRef<ReturnType<typeof setTimeout> | null>(null)` and clear the timer on component unmount in a `useEffect` cleanup function (Rule 3).
4. Verification:
   - Run `npm run typecheck` (`tsc --noEmit`) - must exit with 0 errors.
   - Run `node scripts/audit_app.js` - must pass with 0 errors.
   - Run `node scripts/e2e_full_suite.js --tier=1` and verify R2 and R4 tests pass.
5. Document all work in `d:\Repo\thrivingskill.app\.agents\teamwork\worker_m2_1\handoff.md`.
6. Send completion message to orchestrator.

## 2026-11-08T10:13:29Z
**Context**: Milestone 2 Implementation (Auth error differentiation, Forgot Password, Admin portal role guard, SaaSContext timer)
**Content**: Please report your current progress on implementing the Milestone 2 deliverables.
**Action**: Provide a status update and estimated completion of handoff.md.
