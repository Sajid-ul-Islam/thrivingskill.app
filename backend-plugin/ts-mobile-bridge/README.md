# TS Mobile Bridge (WordPress Companion Plugin)

Official WordPress companion plugin (`backend-plugin/ts-mobile-bridge/ts-mobile-bridge.php`) for the **Thriving Skills** mobile application (React Native / Expo v1.4.0).

---

## Architecture & Security

1. **Google Play Safe Hybrid Checkout**: Keeps web-based checkout (`mode: 'webview'`) for policy compliance.
2. **Bounded & Scoped Lean Course Feed**: Delivers lean course cards (`/wp-json/thrivingskill/v1/feed`) bounded to `limit` `1..50` with per-query transient caching (`page` + `limit` in cache key) and authentic ratings/student counts (`null` when absent).
3. **Hardened Account Registration & Email OTP Verification**: Checks `users_can_register`, enforces IP & email rate limits, defers user creation until 6-digit email OTP verification completes, assigns the `subscriber` role, prevents email enumeration, and supports resend & password-reset OTP confirmation.
4. **Paywall & Session Hardening**: Locks `/lessons/{id}` to published lessons for enrolled users (or admins) unless explicitly marked as free preview, verifies server order/enrollment state via `/enrollments`, issues single-use `/auth/webview-handoff` checkout URLs, and supports `/revoke-token` blocklisting.
5. **Authenticated Push Token Table & Expo Receipt Pruning**: Stores deduplicated tokens linked to `user_id` in custom table `{$wpdb->prefix}tsmb_push_tokens` (no silent 10,000-token eviction) and automatically prunes `DeviceNotRegistered` tokens from Expo push responses and receipts.
6. **Clean Uninstall Cleanup**: `register_uninstall_hook` removes all `tsmb_*` options, transients, cron hooks, and custom tables on uninstall.

---

## Packaging & Deployment

ZIP archives are built automatically in CI (`.github/workflows/ci.yml` artifact `ts-mobile-bridge-plugin`) and excluded from Git (`backend-plugin/*.zip`).

To build `backend-plugin/ts-mobile-bridge.zip` locally for manual WordPress upload:

```bash
node scripts/package_plugin.js
# or
python scripts/package_plugin.py
```

Upload to Staging WordPress Admin first (**Plugins -> Add New -> Upload Plugin** -> `ts-mobile-bridge.zip` -> **Activate**), run `node scripts/test_layer2_staging_integration.js --strict-companion --journey`, and promote to Production only after Staging passes (`node scripts/test_layer2_staging_integration.js --base-url https://thrivingskill.com --strict-companion`).

---

## Registered REST Endpoints (`thrivingskill/v1`)

| Endpoint | Method | Auth | Description |
| :--- | :---: | :---: | :--- |
| `/config` | `GET` | Public | App version gates (`1.4.0`), `plugin_version` (`1.4.0`), maintenance mode, WP-timezone flash sale status, banners, and support channels. |
| `/feed` | `GET` | Public | Paginated, cache-scoped course feed (`limit` clamped `1..50`, `page >= 1`, `nocache` admin-only). |
| `/lessons/{id}` | `GET` | Enrolled / Preview | Published lesson metadata and parsed video stream metadata (`401`/`403` paywall for unenrolled paid lessons and non-admin drafts). |
| `/enrollments` | `GET` | Auth required | Authoritative server enrollment list and WooCommerce/LearnPress order payment verification. |
| `/learning-state` | `GET` | Auth required | Server-authoritative enrollments, completion progress, certificates, watch positions, and gamification state. |
| `/engagement-sync` | `POST` | Auth required | Monotonic cross-device streak/XP merge and monotonic `watch_positions` persistence. |
| `/courses/{id}/submit-review` | `POST` | Auth required | Completion-gated course review submission and authoritative certificate issuance trigger. |
| `/certificates/verify` | `GET` | Public | Verifies issued certificate credential codes and renders public verification metadata. |
| `/corporate-inquiry` | `POST` | Public (rate-limited) | Persists enterprise B2B training leads into `tsmb_corporate_inquiries`. |
| `/support-tickets` | `GET` / `POST` | Auth required | User-scoped learner support ticket creation and status tracking (`tsmb_support_tickets`). |
| `/register` | `POST` | Public (rate-limited) | Initiates email OTP registration without enumerating existing accounts. |
| `/verify-registration` | `POST` | Public (rate-limited) | Verifies 6-digit email OTP, activates `subscriber` user, and issues Bearer token. |
| `/resend-registration` | `POST` | Public (rate-limited) | Re-dispatches 6-digit email verification OTP with IP & email cooldown limits. |
| `/auth/reset-password/confirm` | `POST` | Public (rate-limited) | Confirms password-reset OTP/key cleanly with rate limiting. |
| `/revoke-token` | `POST` | Auth required | Blocklists the current session token (or increments user `token_version` for all devices). |
| `/auth/webview-handoff` | `POST` | Auth required | Issues a short-lived single-use login handoff URL for authenticated WebView checkout. |
| `/register-push-token` | `POST` | Auth required | Registers/updates Expo push token linked to authenticated `user_id`. |
| `/admin/analytics` | `GET` | Admin (`manage_options`) | Consolidated platform analytics bundle (overview, users, enrollments, revenue, course performance, conversion, sources & unsupported metrics). |
| `/admin/analytics/{overview,users,enrollments,revenue,courses,conversions}` | `GET` | Admin (`manage_options`) | Section-scoped administrator analytics endpoints with `preset`, `start_date`, `end_date`, `course_id`, and `refresh` filters. |

## Testing Layers

- **Isolated Unit Suite**: `composer test:unit` (`phpunit -c phpunit.xml.dist`, `tests/Unit/TsMobileBridgeTest.php`)
- **WordPress + LearnPress + WooCommerce Integration Suite**: `composer test:integration` (`phpunit -c phpunit.integration.xml.dist`, `tests/Integration/WordPressIntegrationTest.php`, provisioned via `bin/install-wp-tests.sh`)
