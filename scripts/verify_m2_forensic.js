/**
 * Forensic Verification Script for Milestone 2
 * Author: Forensic Auditor (auditor_m2_1)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
const API_BASE = 'https://staging.thrivingskill.com/wp-json';

console.log('================================================================');
console.log('🕵️ FORENSIC INTEGRITY AUDIT — MILESTONE 2');
console.log('================================================================\n');

let pass = 0;
let fail = 0;

function forensicCheck(name, fn) {
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
    pass++;
  } catch (err) {
    console.error(`❌ FAIL: ${name}\n   Violation: ${err.message}`);
    fail++;
  }
}

async function asyncForensicCheck(name, fn) {
  try {
    await fn();
    console.log(`✅ PASS: ${name}`);
    pass++;
  } catch (err) {
    console.error(`❌ FAIL: ${name}\n   Violation: ${err.message}`);
    fail++;
  }
}

function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const bodyData = options.body ? JSON.stringify(options.body) : null;
    const req = https.request({
      hostname: u.hostname,
      port: 443,
      path: u.pathname + u.search,
      method: options.method || 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'TS-ForensicAuditor/1.0',
        ...(bodyData ? { 'Content-Length': Buffer.byteLength(bodyData) } : {}),
        ...options.headers,
      },
      timeout: 25000,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.on('error', reject);
    if (bodyData) req.write(bodyData);
    req.end();
  });
}

async function runAudit() {
  // -------------------------------------------------------------------------
  // 1. Strict Administrator Role Guard Verification in ProfileScreen.tsx
  // -------------------------------------------------------------------------
  console.log('--- Phase 1.1: Strict Administrator Role Guard in ProfileScreen.tsx ---');

  const profileScreenPath = path.join(ROOT, 'src', 'screens', 'ProfileScreen.tsx');
  const profileContent = fs.readFileSync(profileScreenPath, 'utf8');

  forensicCheck('ProfileScreen.tsx defines strict Array.isArray(user?.roles) && user.roles.includes("administrator")', () => {
    assert(profileContent.includes("Array.isArray(user?.roles) && user.roles.includes('administrator')"),
      'Must contain exact strict role check');
  });

  forensicCheck('ProfileScreen.tsx does NOT contain username heuristic spoof vulnerability (user.username === "admin")', () => {
    assert(!profileContent.includes("user?.username?.toLowerCase() === 'admin'"),
      'Vulnerability found: Loose username string comparison still present');
  });

  forensicCheck('ProfileScreen.tsx does NOT contain email heuristic spoof vulnerability (user.email.includes("admin@"))', () => {
    assert(!profileContent.includes("user?.email?.toLowerCase().includes('admin@')"),
      'Vulnerability found: Loose email string comparison still present');
  });

  forensicCheck('ProfileScreen.tsx wraps WordPress Admin Portal shortcut under APP PREFERENCES with {isAdmin && (...)', () => {
    // Find APP PREFERENCES section
    const appPrefIndex = profileContent.indexOf('APP PREFERENCES');
    assert(appPrefIndex > 0, 'APP PREFERENCES section missing');
    const prefSubstring = profileContent.substring(appPrefIndex, appPrefIndex + 1200);
    assert(prefSubstring.includes('{isAdmin && ('), 'WordPress Admin Portal in APP PREFERENCES must be guarded by {isAdmin && (');
    assert(prefSubstring.includes('Env.WP_ADMIN_URL'), 'Env.WP_ADMIN_URL must be inside the guarded block');
  });

  forensicCheck('Mathematical logic test of strict role check across 12 adversarial permutations', () => {
    const isUserAdmin = (user) => Array.isArray(user?.roles) && user.roles.includes('administrator');
    assert.strictEqual(isUserAdmin({ roles: ['administrator'] }), true);
    assert.strictEqual(isUserAdmin({ roles: ['subscriber', 'administrator'] }), true);
    assert.strictEqual(isUserAdmin({ roles: ['administrator', 'customer'] }), true);
    assert.strictEqual(isUserAdmin({ roles: ['customer'] }), false);
    assert.strictEqual(isUserAdmin({ roles: ['subscriber'] }), false);
    assert.strictEqual(isUserAdmin({ roles: ['admin'] }), false);
    assert.strictEqual(isUserAdmin({ roles: ['administrator_assistant'] }), false);
    assert.strictEqual(isUserAdmin({ roles: 'administrator' }), false);
    assert.strictEqual(isUserAdmin({ roles: null }), false);
    assert.strictEqual(isUserAdmin({ username: 'admin' }), false);
    assert.strictEqual(isUserAdmin({ email: 'admin@thrivingskill.com' }), false);
    assert.strictEqual(isUserAdmin(null), false);
    assert.strictEqual(isUserAdmin(undefined), false);
    assert.strictEqual(isUserAdmin({}), false);
  });

  // -------------------------------------------------------------------------
  // 2. Auth Error Code Differentiation & Forgot Password Flow in AuthModal.tsx
  // -------------------------------------------------------------------------
  console.log('\n--- Phase 1.2: Auth Error Differentiation & Forgot Password in AuthModal.tsx ---');

  const authModalPath = path.join(ROOT, 'src', 'components', 'modals', 'AuthModal.tsx');
  const authModalContent = fs.readFileSync(authModalPath, 'utf8');

  forensicCheck('AuthModal.tsx includes forgot_password in AuthMode union', () => {
    assert(authModalContent.includes("type AuthMode = 'login' | 'register' | 'forgot_password';"),
      'AuthMode must include forgot_password');
  });

  forensicCheck('AuthModal.tsx differentiates invalid_username error code with distinct message', () => {
    assert(authModalContent.includes("code.includes('invalid_username')"),
      'Must check invalid_username error code');
    assert(authModalContent.includes('Username or email is not registered'),
      'Must display distinct guidance for invalid/non-existent username');
  });

  forensicCheck('AuthModal.tsx differentiates incorrect_password error code with distinct message', () => {
    assert(authModalContent.includes("code.includes('incorrect_password')"),
      'Must check incorrect_password error code');
    assert(authModalContent.includes('Incorrect password'),
      'Must display distinct guidance for incorrect password');
  });

  forensicCheck('AuthModal.tsx provides accessible Forgot Password touchable with minHeight: 48', () => {
    assert(authModalContent.includes('styles.forgotPasswordTouch'),
      'Must define and use forgotPasswordTouch style');
    assert(authModalContent.includes('minHeight: 48'),
      'forgotPasswordTouch must declare minHeight: 48 for WCAG touch target compliance');
    assert(authModalContent.includes('accessibilityRole="button"'),
      'Forgot Password element must be marked with accessibilityRole="button"');
  });

  forensicCheck('AuthModal.tsx implements genuine handleResetPassword invoking AuthService.resetPassword', () => {
    assert(authModalContent.includes('const handleResetPassword = async () => {'),
      'handleResetPassword method must exist');
    assert(authModalContent.includes('AuthService.resetPassword(userLogin)'),
      'handleResetPassword must invoke AuthService.resetPassword with entered userLogin');
    assert(authModalContent.includes("code.includes('error_not_user')"),
      'Must handle error_not_user when account is not found');
  });

  forensicCheck('Endpoints.ts registers authentic LearnPress reset password endpoint', () => {
    const endpointsPath = path.join(ROOT, 'src', 'services', 'api', 'endpoints.ts');
    const endpointsContent = fs.readFileSync(endpointsPath, 'utf8');
    assert(endpointsContent.includes("USER_RESET_PASSWORD: '/learnpress/v1/users/reset-password'"),
      'USER_RESET_PASSWORD endpoint must be registered as /learnpress/v1/users/reset-password');
  });

  forensicCheck('AuthService.ts resetPassword makes genuine HTTP POST to USER_RESET_PASSWORD', () => {
    const authServicePath = path.join(ROOT, 'src', 'services', 'api', 'authService.ts');
    const authServiceContent = fs.readFileSync(authServicePath, 'utf8');
    assert(authServiceContent.includes('static async resetPassword(email: string): Promise<any> {'),
      'AuthService.resetPassword declaration missing');
    assert(authServiceContent.includes('Endpoints.LEARNPRESS.USER_RESET_PASSWORD'),
      'resetPassword must post to Endpoints.LEARNPRESS.USER_RESET_PASSWORD');
    assert(authServiceContent.includes('user_login: email.trim()'),
      'resetPassword must send user_login payload');
  });

  // -------------------------------------------------------------------------
  // 3. Timer Hygiene in SaaSContext.tsx
  // -------------------------------------------------------------------------
  console.log('\n--- Phase 1.3: Timer Hygiene in SaaSContext.tsx ---');

  const saasContextPath = path.join(ROOT, 'src', 'context', 'SaaSContext.tsx');
  const saasContent = fs.readFileSync(saasContextPath, 'utf8');

  forensicCheck('SaaSContext.tsx imports useRef from react', () => {
    const importLine = saasContent.split('\n')[0];
    assert(importLine.includes('useRef'), 'useRef must be imported from react in SaaSContext.tsx');
  });

  forensicCheck('SaaSContext.tsx declares copilotTimerRef as useRef', () => {
    assert(saasContent.includes('const copilotTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);'),
      'copilotTimerRef must be defined with ReturnType<typeof setTimeout>');
  });

  forensicCheck('SaaSContext.tsx cancels copilotTimerRef in useEffect unmount teardown', () => {
    assert(saasContent.includes('clearTimeout(copilotTimerRef.current);'),
      'clearTimeout must be invoked on copilotTimerRef.current');
  });

  forensicCheck('SaaSContext.tsx stores setTimeout return in copilotTimerRef.current', () => {
    assert(saasContent.includes('copilotTimerRef.current = setTimeout('),
      'setTimeout must be assigned to copilotTimerRef.current');
  });

  // -------------------------------------------------------------------------
  // 4. Live Backend Empirical Verification Against Staging LMS
  // -------------------------------------------------------------------------
  console.log('\n--- Phase 2: Live Backend Empirical Verification ---');

  await asyncForensicCheck('Live Staging: Non-existent username returns [lp_jwt_auth] invalid_username', async () => {
    const res = await request(`${API_BASE}/learnpress/v1/token`, {
      method: 'POST',
      body: { username: 'non_existent_auditor_user_99999', password: 'AnyPassword123!' },
    });
    assert.strictEqual(res.status, 403, `Expected HTTP 403, got ${res.status}`);
    assert.strictEqual(res.body?.code, '[lp_jwt_auth] invalid_username',
      `Expected [lp_jwt_auth] invalid_username, got ${res.body?.code}`);
  });

  await asyncForensicCheck('Live Staging: Dynamic registered student with wrong password returns [lp_jwt_auth] incorrect_password', async () => {
    const ts = Date.now().toString().slice(-6);
    const username = `auditor_m2_${ts}`;
    const email = `auditor_m2_${ts}@thrivingskill.test`;
    const password = `CorrectPassword_${ts}!`;

    // Register user
    const regRes = await request(`${API_BASE}/learnpress/v1/token/register`, {
      method: 'POST',
      body: { username, email, password, confirm_password: password, phone: '01712345678' },
    });
    assert(regRes.body?.token, 'Dynamic registration must succeed');

    // Attempt login with wrong password
    const wrongLoginRes = await request(`${API_BASE}/learnpress/v1/token`, {
      method: 'POST',
      body: { username, password: 'WrongPassword999!' },
    });
    assert.strictEqual(wrongLoginRes.status, 403, `Expected HTTP 403, got ${wrongLoginRes.status}`);
    assert.strictEqual(wrongLoginRes.body?.code, '[lp_jwt_auth] incorrect_password',
      `Expected [lp_jwt_auth] incorrect_password, got ${wrongLoginRes.body?.code}`);

    // Test Forgot Password for registered user
    const resetRes = await request(`${API_BASE}/learnpress/v1/users/reset-password`, {
      method: 'POST',
      body: { user_login: email },
    });
    assert.strictEqual(resetRes.status, 200, `Expected HTTP 200, got ${resetRes.status}`);
    assert.strictEqual(resetRes.body?.code, 'success', `Expected code 'success', got ${resetRes.body?.code}`);
  });

  await asyncForensicCheck('Live Staging: Reset password for non-existent user returns error_not_user', async () => {
    const res = await request(`${API_BASE}/learnpress/v1/users/reset-password`, {
      method: 'POST',
      body: { user_login: 'ghost_non_existent_99999@thrivingskill.test' },
    });
    assert.strictEqual(res.status, 500, `Expected HTTP 500, got ${res.status}`);
    assert.strictEqual(res.body?.code, 'error_not_user', `Expected code 'error_not_user', got ${res.body?.code}`);
  });

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`📊 FORENSIC AUDIT SUMMARY: ${pass} PASSED, ${fail} FAILED`);
  console.log('================================================================');

  if (fail > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAudit().catch(err => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
