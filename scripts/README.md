# Maintained Scripts (`scripts/`)

Only actively maintained CI, structural QA, and plugin packaging scripts live in this directory. One-off debugging and migration utilities are removed after use (available in Git history if needed).

## Quality Gate & Structural Suites
- **`audit_app.js`** (`npm run audit`): Static AST/regex audit across `src/` and `App.tsx` checking relative imports, asset `require(...)` paths, `StyleSheet` references, `setInterval` cleanup, and unsafe `JSON.parse` usage.
- **`run_all_tests.js`** (`npm run test:structural`): Runs all offline structural and compliance checks sequentially under `CI=true`:
  - `test_security_hardening.js` — WebView origin/scheme allowlists, Android `allowBackup="false"`, and secret hygiene.
  - `test_optimizations.js` — Ionicons tree-shaking, FlatList virtualization, `force-cache` image headers, request dedupe, and touch targets.
  - `verify_live_notifications_and_recommendations.js` — Notification channel & recommendation engine integration audit.
  - `test_profile_and_checkout_sync.js` — Profile & checkout autofill contract checks.
  - `test_floating_crm_widget.js` — Multi-channel CRM widget checks.
  - `test_rd_innovations.js` — Spaced repetition / learning features structural checks.
  - `test_secure_storage.js` — `expo-secure-store` token storage checks.
  - `test_department_grid.js` — Department category grid checks.
  - `test_feedback_suite.js` — Toast, snackbar, banner, and popup accessibility checks.
  - `verify_dual_environment.js` — Live/staging environment configuration & failover checks (network probes disabled in CI).

## UI/UX & Accessibility Audits
- **`verify_wcag_contrast.js`**: Validates WCAG 2.1 color contrast ratios in light/dark themes and scans TSX files for contrast regressions.
- **`verify_ux_principles.js`**: Verifies mobile UX checklist items (haptics, inline validation, undo actions, typography scale, `StateView`).
- **`verify_ui_ux_laws.js`**: Checks Miller's Law, Fitts's Law (`MIN_TOUCH_TARGET`), Hick's Law, and accessibility labels.

## Backend Plugin Packaging
- **`package_plugin.js`** / **`package_plugin.py`**: Packages `backend-plugin/thriving-skills-mobile-bridge` into a POSIX-compliant `.zip` archive for WordPress Admin upload.
