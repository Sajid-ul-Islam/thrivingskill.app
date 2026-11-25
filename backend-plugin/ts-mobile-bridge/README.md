# TS Mobile Bridge (WordPress Companion Plugin)

Official WordPress companion plugin (`backend-plugin/ts-mobile-bridge/ts-mobile-bridge.php`) for the **Thriving Skills** mobile application (React Native / Expo v1.4.0).

---

## Architecture & Security

1. **Google Play Safe Hybrid Checkout**: Keeps web-based checkout (`mode: 'webview'`) for policy compliance.
2. **Bounded & Scoped Lean Course Feed**: Delivers lean course cards (`/wp-json/thrivingskill/v1/feed`) bounded to `limit` `1..50` with per-query transient caching (`page` + `limit` in cache key) and authentic ratings/student counts (`null` when absent).
3. **Hardened Account Registration & Email OTP Verification**: Checks `users_can_register`, enforces IP & email rate limits, requires 12+ character passwords, uses `random_bytes` usernames, forces the `subscriber` role, prevents email enumeration, and defers account creation until 6-digit email OTP verification completes.
4. **SMS Phone OTP Authentication (`tsl/v1`)**: Implements `/wp-json/tsl/v1/auth/send-otp` and `/wp-json/tsl/v1/auth/verify-otp` with `random_int` + `wp_hash_password`, rate limiting, brute-force lockouts, and zero `testOtp` leakage outside `local`/`development` environments.
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

Upload via WordPress Admin **Plugins -> Add New -> Upload Plugin** (`ts-mobile-bridge.zip`) and click **Activate**.

---

## Registered REST Endpoints

### `thrivingskill/v1`

| Endpoint | Method | Auth | Description |
| :--- | :---: | :---: | :--- |
| `/config` | `GET` | Public | App version gates (`1.4.0`), maintenance mode, WP-timezone flash sale status, banners, and support channels. |
| `/feed` | `GET` | Public | Paginated, cache-scoped course feed (`limit` clamped `1..50`, `page >= 1`, `nocache` admin-only). |
| `/lessons/{id}` | `GET` | Public | Cleaned lesson metadata and parsed video stream metadata. |
| `/register` | `POST` | Public (rate-limited) | Initiates email OTP registration without enumerating existing accounts. |
| `/verify-registration` | `POST` | Public (rate-limited) | Verifies 6-digit email OTP, activates `subscriber` user, and issues Bearer token. |
| `/register-push-token` | `POST` | Auth required | Registers/updates Expo push token linked to authenticated `user_id`. |

### `tsl/v1`

| Endpoint | Method | Auth | Description |
| :--- | :---: | :---: | :--- |
| `/auth/send-otp` | `POST` | Public (rate-limited) | Dispatches 6-digit SMS OTP via configured gateway (or dev hook). |
| `/auth/verify-otp` | `POST` | Public (rate-limited) | Verifies SMS OTP, creates/finds `subscriber` user, and issues Bearer token. |
