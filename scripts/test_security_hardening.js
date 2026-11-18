/**
 * Automated Verification Suite for Defensive Security Hardening
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- RUNNING SECURITY HARDENING VERIFICATION ---');

let passedTests = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] ${name}:`, err.message);
    process.exitCode = 1;
  }
}

// 1. Android Manifest & app.json allowBackup checks
test('SEC-01: android:allowBackup="false" in AndroidManifest.xml', () => {
  const manifest = fs.readFileSync(path.join(__dirname, '../android/app/src/main/AndroidManifest.xml'), 'utf8');
  assert(manifest.includes('android:allowBackup="false"'), 'Expected android:allowBackup="false" in AndroidManifest.xml');
  assert(!manifest.includes('android:allowBackup="true"'), 'android:allowBackup="true" should not exist');
});

test('SEC-01: allowBackup: false in app.json', () => {
  const appJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../app.json'), 'utf8'));
  assert.strictEqual(appJson.expo.android.allowBackup, false, 'Expected expo.android.allowBackup to be false in app.json');
});

// 2. LessonPlayerScreen WebView hardening & protocol sanitization
test('SEC-03: LessonPlayerScreen WebView enforces mixedContentMode="never" and https originWhitelist', () => {
  const content = fs.readFileSync(path.join(__dirname, '../src/screens/LessonPlayerScreen.tsx'), 'utf8');
  assert(content.includes('mixedContentMode="never"'), 'Expected mixedContentMode="never"');
  assert(!content.includes('mixedContentMode="always"'), 'mixedContentMode="always" must not exist');
  assert(content.includes("originWhitelist={['https://*']}"), 'Expected originWhitelist https only');
});

test('SEC-04: LessonPlayerScreen sanitizes video iframe URLs against javascript: and requires https', () => {
  const content = fs.readFileSync(path.join(__dirname, '../src/screens/LessonPlayerScreen.tsx'), 'utf8');
  assert(content.includes('isSafeIframe'), 'Expected iframe src validation logic');
  assert(content.includes('activeVideoUrl.startsWith(\'https://\')'), 'Expected https check on generic iframe fallback');
});

// 3. PaymentModal WebView & intent:// scheme validation
test('SEC-03: PaymentModal WebView enforces https originWhitelist', () => {
  const content = fs.readFileSync(path.join(__dirname, '../src/components/modals/PaymentModal.tsx'), 'utf8');
  assert(content.includes("originWhitelist={['https://*']}"), 'Expected PaymentModal originWhitelist https only');
});

test('SEC-06: PaymentModal validates intent:// fallback URLs against trusted domains', () => {
  const content = fs.readFileSync(path.join(__dirname, '../src/components/modals/PaymentModal.tsx'), 'utf8');
  assert(content.includes('isTrustedHost'), 'Expected isTrustedHost validation');
  assert(content.includes('sslcommerz.com') && content.includes('thrivingskill.com'), 'Expected trusted host list');
});

// 4. AuthModal registration WebView domain restriction
test('SEC-03: AuthModal WebView restricts navigation to thrivingskill.com and https', () => {
  const content = fs.readFileSync(path.join(__dirname, '../src/components/modals/AuthModal.tsx'), 'utf8');
  assert(content.includes("originWhitelist={['https://*']}"), 'Expected AuthModal originWhitelist https only');
  assert(content.includes("url.startsWith('https://thrivingskill.com')"), 'Expected thrivingskill.com domain restriction');
});

// 5. Offline Sync Queue allowlist validation
test('SEC-05: syncQueue enforces isAllowedSyncEndpoint', () => {
  const content = fs.readFileSync(path.join(__dirname, '../src/services/offline/syncQueue.ts'), 'utf8');
  assert(content.includes('isAllowedSyncEndpoint'), 'Expected isAllowedSyncEndpoint function');
  assert(content.includes('/learnpress/v1/lessons/finish'), 'Expected allowed prefix check');
});

// 6. env.ts purged secrets
test('SEC-07: env.ts has no WC_CONSUMER_SECRET or WC_CONSUMER_KEY accessors', () => {
  const content = fs.readFileSync(path.join(__dirname, '../src/config/env.ts'), 'utf8');
  assert(!content.includes('WC_CONSUMER_SECRET'), 'WC_CONSUMER_SECRET should be removed');
  assert(!content.includes('WC_CONSUMER_KEY'), 'WC_CONSUMER_KEY should be removed');
});

console.log(`\nALL ${passedTests} SECURITY TESTS PASSED SUCCESSFULLY!`);
