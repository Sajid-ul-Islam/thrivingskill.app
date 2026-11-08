# WordPress & LearnPress REST API Specification & Authentication/User Audit Report

## 1. Observation

Direct live backend probe against `https://staging.thrivingskill.com/wp-json` executed via `scripts/probe_api_specs.js` and `scripts/probe_api_details.js` on 2026-11-08:

### Discovered Route Map (API Root: `https://staging.thrivingskill.com/wp-json`)
From the WordPress root index probe (`GET https://staging.thrivingskill.com/wp-json`):
- `/learnpress/v1/token` — [POST] Issue JWT token for WordPress credentials.
- `/learnpress/v1/token/validate` — [POST] Validate JWT token signature and expiration.
- `/learnpress/v1/token/register` — [POST] Register student account and issue JWT token.
- `/learnpress/v1/users/reset-password` — [POST] Request WordPress password reset email.
- `/learnpress/v1/users/change-password` — [POST] Authenticated user password change.
- `/learnpress/v1/users/(?P<id>[\d]+)` — [GET, POST] LearnPress user profile details and course progress.
- `/wp/v2/users/me` — [GET, POST, PUT] WordPress core profile fetch and update.
- `/wp/v2/users/lostpassword` — [POST] Returns HTTP 404 (`rest_no_route`). WordPress core does not provide a default REST endpoint for lost password.

---

## Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Auth | JWT Token Login | Authenticates user via LearnPress JWT auth handler | `POST` `{ username, password }` | `200 OK` `{ token, user_id, user_login, user_email, user_display_name }` | `403` with distinct `[lp_jwt_auth]` codes | Probe: `/learnpress/v1/token` |
| 2 | Auth | JWT Token Validate | Confirms validity and TTL of stored Bearer token | `POST` with `Authorization: Bearer <token>` | `200 OK` `{ code: "lp_jwt_auth_valid_token", message: "Valid access token.", data: { status: 200, exp } }` | `403` `{ code: "[lp_jwt_auth] invalid_token", data: { status: 403 } }` | Probe: `/learnpress/v1/token/validate` |
| 3 | Auth | Dynamic Registration | Registers new student account and returns JWT token immediately | `POST` `{ username, email, password, confirm_password, phone? }` | `200 OK` `{ token, user_id, user_login, user_email, user_display_name }` | `403` `{ code: "[lp_jwt_auth] email_exists" \| "[lp_jwt_auth] username_exists" }` | Probe: `/learnpress/v1/token/register` |
| 4 | Password | Forgot / Reset Password | Triggers native WordPress core password reset email with reset key link | `POST` `{ user_login: "<email_or_username>" }` | `200 OK` `{ code: "success", message: "A link to reset your password has been emailed to you." }` | `500` `{ code: "error_not_user", message: "Invalid username or email." }` | Probe: `/learnpress/v1/users/reset-password` |
| 5 | Password | Change Password (Auth) | Updates password for authenticated user | `POST` with Bearer auth `{ old_password, new_password, confirm_password }` | `200 OK` `{ code: "success", message: "Your password has been updated. Please log in again to continue!" }` | `403` `{ code: "rest_user_incorrect_password", message: "Your current password is incorrect." }` or `401` `{ code: "rest_cannot_edit" }` | Probe: `/learnpress/v1/users/change-password` |
| 6 | Profile | User Profile Inspection | Retrieves full WordPress profile including roles and capabilities | `GET /wp/v2/users/me?context=edit` with Bearer auth | `200 OK` Schema includes: `id, username, name, email, description, roles, capabilities, avatar_urls` | `401` `{ code: "rest_not_logged_in" }` | Probe: `/wp/v2/users/me?context=edit` |
| 7 | Profile | User Profile Update | Updates display name, first/last name, nickname, bio/description | `POST /wp/v2/users/me` with Bearer auth `{ name, description, first_name, last_name, nickname }` | `200 OK` Returns updated user object with persisted fields | `401` `{ code: "rest_cannot_edit" }` | Probe: `/wp/v2/users/me` |
| 8 | Profile | LearnPress User Details | Retrieves LMS details, enrolled course counts, social links, high-res avatar | `GET /learnpress/v1/users/{id}` with optional Bearer auth | `200 OK` Returns `avatar_url` (500x500 Gravatar), `instructor_data`, `tabs`, `social`, `custom_register` | `404` if user ID not found | Probe: `/learnpress/v1/users/{id}` |
| 9 | Role Guard | Administrator Role Verification | Authoritative WordPress role check for admin portal access | Evaluated from `roles: string[]` on `/wp/v2/users/me?context=edit` | `user.roles.includes('administrator')` | Non-admin users have `roles: ['customer']` or `['subscriber']` | Probe: `testUserId: 24665` role inspection |

---

## Edge Cases

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | Login: Non-existent User | `username: "non_existent_user_999999"`, `password: "SomePassword123!"` | `HTTP 403` Body: `{ code: "[lp_jwt_auth] invalid_username", message: "<strong>Error:</strong> The username <strong>non_existent_user_999999</strong> is not registered on this site. If you are unsure of your username, try your email address instead.", data: { status: 403 } }` |
| 2 | Login: Wrong Password | `username: "ts_spec_288927"`, `password: "WrongPassword999!"` | `HTTP 403` Body: `{ code: "[lp_jwt_auth] incorrect_password", message: "<strong>Error:</strong> The password you entered for the username <strong>ts_spec_288927</strong> is incorrect. <a href=\"https://staging.thrivingskill.com/my-account/lost-password/\">Lost your password?</a>", data: { status: 403 } }` |
| 3 | Login: Empty Username | `username: ""`, `password: ""` | `HTTP 403` Body: `{ code: "[lp_jwt_auth] empty_username", message: "<strong>Error:</strong> The username field is empty.", data: { status: 403 } }` |
| 4 | Reset Password: Valid Email | `user_login: "ts_spec_288927@thrivingskill.test"` | `HTTP 200` Body: `{ code: "success", message: "A link to reset your password has been emailed to you." }` — Triggers standard WordPress reset email dispatch. |
| 5 | Reset Password: Non-existent User | `user_login: "non_existent_email_12345@thrivingskill.test"` | `HTTP 500` Body: `{ code: "error_not_user", message: "Invalid username or email.", data: null }` |
| 6 | Reset Password: Empty Input | `user_login: ""` | `HTTP 500` Body: `{ code: "error_santize_login", message: "Enter a username or email address.", data: null }` |
| 7 | Core WP Lost Password Route | `POST /wp/v2/users/lostpassword` | `HTTP 404` Body: `{ code: "rest_no_route", message: "No route was found matching the URL and request method.", data: { status: 404 } }` — Endpoint does NOT exist on this backend. |
| 8 | Change Password: Wrong Current Pass | `old_password: "wrong"`, `new_password: "NewPass123!"` | `HTTP 403` Body: `{ code: "rest_user_incorrect_password", message: "Your current password is incorrect.", data: { status: 403 } }` |
| 9 | Change Password: Unauthenticated | `Authorization: ""` (omitted header) | `HTTP 401` Body: `{ code: "rest_cannot_edit", message: "Sorry, you are not allowed to edit this user.", data: { status: 401 } }` |
| 10 | Profile Fetch: Default vs Edit Context | `GET /wp/v2/users/me` vs `GET /wp/v2/users/me?context=edit` | In basic `context=view`, `roles` is omitted in the response payload for regular users; with `?context=edit`, WordPress returns full `roles: ['customer']` and `capabilities: { read: true, customer: true, ... }`. |
| 11 | Profile Update: Display Name & Bio | `POST /wp/v2/users/me` with `{ name: "Dr. Shahriar Khan", description: "Senior Business Strategist..." }` | `HTTP 200` Body contains updated `name` and `description` which persist across re-queries. |
| 12 | Role Inspection: Admin False Positives | `username: "admin_tester"`, `roles: ['customer']` | In `ProfileScreen.tsx` (lines 133-136), checking `user?.username?.toLowerCase() === 'admin'` or `user?.email?.toLowerCase().includes('admin@')` creates a security flaw by showing admin portal to unauthorized users. Real verification must test `user?.roles?.includes('administrator') === true`. |

---

## 2. Logic Chain

1. **Authentication Error Differentiation (R4)**:
   - *Observation*: Probing `/learnpress/v1/token` with a non-existent username produces `status: 403` with `code: "[lp_jwt_auth] invalid_username"`. Probing with a valid username and wrong password produces `status: 403` with `code: "[lp_jwt_auth] incorrect_password"`.
   - *Logic*: In `src/services/api/httpClient.ts` (line 156), errors throw an `ApiError(cleanMessage, response.status, errorCode, responseData)`. The `errorCode` carries `[lp_jwt_auth] invalid_username` or `[lp_jwt_auth] incorrect_password`.
   - *Deduction*: In `AuthModal.tsx`, by inspecting `err.code` or `err.data?.code`:
     - If `err.code?.includes('invalid_username')`: Display *"The username or email entered is not registered. Please check your spelling or create an account."*
     - If `err.code?.includes('incorrect_password')`: Display *"Incorrect password. Please try again or tap 'Forgot Password' below."*
     - This directly fulfills R4 without ambiguous generic errors.

2. **Password Recovery Workflow (R4)**:
   - *Observation*: `/wp/v2/users/lostpassword` returns HTTP 404 (`rest_no_route`). In contrast, `POST /learnpress/v1/users/reset-password` with `{ user_login: email }` returns HTTP 200 with `{ code: "success", message: "A link to reset your password has been emailed to you." }`.
   - *Logic*: LearnPress hooks into the core WordPress `retrieve_password()` method, generating a secure reset token and sending the standard WordPress reset email with the link to the user.
   - *Deduction*: The mobile app Forgot Password flow MUST call `POST /learnpress/v1/users/reset-password` with `{ user_login: email.trim() }`. When HTTP 200 is returned, display a confirmation alert indicating the email has been sent. When HTTP 500 (`error_not_user`) is returned, notify the user that no account exists with that email.

3. **Password Change Workflow (R4)**:
   - *Observation*: `POST /learnpress/v1/users/change-password` requires `Authorization: Bearer <token>` and accepts `{ old_password, new_password, confirm_password }`. When `old_password` is invalid, it returns HTTP 403 `{ code: "rest_user_incorrect_password", message: "Your current password is incorrect." }`.
   - *Logic*: Currently, `ProfileScreen.tsx` (lines 111-129) has a purely client-side mock handler that shows an alert and does not contact the server.
   - *Deduction*: `ProfileScreen.tsx` `handleChangePassword` must invoke `UserService.changePassword(currentPass, newPass)` -> `POST /learnpress/v1/users/change-password`.

4. **User Profile Retrieval & Updating (R3)**:
   - *Observation*: `POST /wp/v2/users/me` with Bearer authentication reliably accepts `name`, `first_name`, `last_name`, and `description` (bio), returning HTTP 200 with updated fields. `GET /learnpress/v1/users/{id}` returns the 500x500 high-res `avatar_url`.
   - *Logic*: Currently, `ProfileScreen.tsx` (lines 106-109) has `handleSaveProfile` as an empty local mock. Furthermore, `UserService.ts` only has `getCurrentUser()` and lacks an `updateCurrentUser()` method.
   - *Deduction*: Adding `updateProfile({ name, description, phone })` to `UserService.ts` calling `POST /wp/v2/users/me` will allow users to persist profile updates to WordPress. Phone numbers can be stored in user meta or local profile state.

5. **Strict WordPress Administrator Role Verification (R2)**:
   - *Observation*: In `GET /wp/v2/users/me?context=edit`, WordPress returns `roles: ['customer']` for students and `roles: ['administrator']` for administrators.
   - *Logic*: In `ProfileScreen.tsx` line 133:
     ```ts
     const isAdmin =
       user?.roles?.includes('administrator') ||
       user?.username?.toLowerCase() === 'admin' ||
       user?.email?.toLowerCase().includes('admin@');
     ```
     This fallback heuristic was a mock shortcut that leaks admin options to non-admin users whose username or email contains "admin".
   - *Deduction*: To strictly satisfy R2 ("restrict visibility of the WordPress Admin Portal or admin links strictly to users with verified WordPress administrator roles, hiding them completely for non-admin users"), `isAdmin` must be computed strictly as:
     `const isAdmin = Array.isArray(user?.roles) && user.roles.includes('administrator');`
     And on login, `AuthService.login` must query `GET /wp/v2/users/me?context=edit` to capture authentic WordPress roles.

---

## 3. Caveats

1. **WordPress Avatar Upload**:
   - The WordPress REST API (`/wp/v2/users/me`) does not allow direct binary avatar photo upload without a dedicated custom plugin (like Simple Local Avatars or WP User Avatar); WordPress core uses Gravatar linked to the user's email. LearnPress serves the Gravatar URL at 500x500 resolution via `/learnpress/v1/users/{id}`. If avatar URL editing is desired, updating email changes Gravatar, or the app can store a custom local avatar URI in local storage/user preferences.
2. **Phone Number Storage in WordPress**:
   - WordPress core user table does not possess a native `phone` column. LearnPress registration stores phone numbers inside custom form meta (`_lp_custom_register_form`). When updating via `/wp/v2/users/me`, updating `meta: { phone: ... }` succeeds only if `register_meta` is registered with `show_in_rest: true` on the backend. Storing the phone number in `AuthContext` / `AsyncStorage` alongside the updated profile guarantees seamless cross-session persistence in the mobile app.
3. **Password Reset Email Deliverability**:
   - `/learnpress/v1/users/reset-password` triggers PHP `wp_mail()`. If the staging WordPress server's SMTP daemon is temporarily congested, the API still returns HTTP 200 `{ code: "success" }`. The app should inform the user to check both Inbox and Spam folders.

---

## 4. Conclusion

1. **Authentication Error Codes**:
   - Non-existent user: `err.code?.includes('invalid_username')` -> Show non-existent user error.
   - Wrong password: `err.code?.includes('incorrect_password')` -> Show wrong password error with Forgot Password prompt.
2. **Password Reset Endpoint**:
   - Authoritative endpoint: `POST /learnpress/v1/users/reset-password` with `{ user_login: email }`. (Do NOT use `/wp/v2/users/lostpassword` as it returns 404).
3. **Change Password Endpoint**:
   - Authoritative endpoint: `POST /learnpress/v1/users/change-password` with `{ old_password, new_password, confirm_password }` and Bearer token.
4. **Profile Synchronization**:
   - Fetch: `GET /wp/v2/users/me?context=edit` (fetches `name`, `email`, `description`, `roles`, `avatar_urls`).
   - Update: `POST /wp/v2/users/me` with `{ name, description }` (updates display name and bio).
5. **Strict Admin Portal Guard**:
   - Strict rule: `const isAdmin = Boolean(user?.roles?.includes('administrator'));`. Completely remove string matching on `admin` in username/email.

---

## 5. Verification Method

To independently verify these findings and contracts against the staging backend:
1. Run the standalone API probe scripts:
   ```powershell
   node scripts/probe_api_specs.js
   node scripts/probe_api_details.js
   ```
2. Verify TypeScript integrity across the repository:
   ```powershell
   npm run typecheck
   ```
3. Run the application architecture audit:
   ```powershell
   node scripts/audit_app.js
   ```
4. Invalidation conditions:
   - If `/wp/v2/users/me?context=edit` returns a 401, the JWT token has expired or is malformed.
   - If `/learnpress/v1/users/reset-password` returns a 404, LearnPress REST routes have been altered on the backend.
