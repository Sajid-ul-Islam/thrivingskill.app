/**
 * ============================================================================
 * CHALLENGER M2 EMPIRICAL TEST HARNESS & ADVERSARIAL STRESS SUITE
 * ============================================================================
 * Autonomous verification and stress testing for Milestone 2:
 * 1. Auth error differentiation in AuthModal.tsx (invalid_username vs incorrect_password vs others)
 * 2. Live Forgot Password flow against https://staging.thrivingskill.com/wp-json/learnpress/v1/users/reset-password
 * 3. Strict administrator check in ProfileScreen.tsx with edge cases (null, spoofing, etc.)
 * 4. SaaSContext timer hygiene (useRef, clearTimeout on unmount)
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const assert = require('assert');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const API_BASE = 'https://staging.thrivingskill.com/wp-json';

console.log('=================================================================');
console.log('  CHALLENGER M2 EMPIRICAL & ADVERSARIAL VERIFICATION HARNESS');
console.log('=================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

async function challenge(title, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  [PASS] ${title}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] ${title}`);
    console.error(`         Reason: ${err.message}`);
    failedTests++;
    failures.push({ title, error: err.message });
  }
}

// Network client helper
function apiRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const method = options.method || 'GET';
    const headers = {
      'User-Agent': 'Challenger-M2-Runner/1.0',
      'Accept': 'application/json, text/plain, */*',
      ...options.headers,
    };
    let bodyData = null;

    if (options.body) {
      bodyData = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
      headers['Content-Length'] = Buffer.byteLength(bodyData);
    }

    const req = https.request({
      hostname: u.hostname,
      port: 443,
      path: u.pathname + u.search,
      method,
      headers,
      timeout: 30000,
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

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Timeout requesting ${url}`));
    });

    req.on('error', reject);
    if (bodyData) req.write(bodyData);
    req.end();
  });
}

// Emulate error parsing function directly from AuthModal.tsx
function parseAuthModalError(err) {
  const code = String(err?.code || err?.data?.code || '');
  const message = String(err?.message || '');

  if (code.includes('invalid_username')) {
    return 'Username or email is not registered. Please check your spelling or create an account.';
  } else if (code.includes('incorrect_password')) {
    return "Incorrect password. Please try again or tap 'Forgot Password' below.";
  } else if (code.includes('empty_username')) {
    return 'Please enter your username or email address.';
  } else if (
    message.includes('Phone Number is required field') ||
    message.includes('registration-custom-required-field') ||
    code.includes('phone')
  ) {
    return 'WordPress requires a phone number for registration. Please enter your mobile number in the Phone Number field above or contact support.';
  } else if (code.includes('username_exists')) {
    return 'This username is already registered. Please choose another username or sign in.';
  } else if (code.includes('email_exists')) {
    return 'An account with this email already exists. Please sign in or reset your password.';
  } else {
    return message || 'Authentication failed. Please check your credentials.';
  }
}

// Emulate reset password error parsing from AuthModal.tsx
function parseResetPasswordResult(err) {
  const code = String(err?.code || err?.data?.code || '');
  const msg = String(err?.message || '');

  if (code.includes('error_not_user') || msg.includes('error_not_user') || msg.includes('Invalid username or email')) {
    return 'User not found. No account is registered with this username or email.';
  } else if (code.includes('error_santize_login') || msg.includes('Enter a username')) {
    return 'Enter a valid username or email address.';
  } else {
    return msg || 'Failed to send password reset email. Please try again.';
  }
}

async function runAllChallenges() {
  console.log('--- SUITE 1: AUTHMODAL ERROR DIFFERENTIATION & PARSING ---');

  await challenge('C1.1: AuthModal source contains error code differentiation logic', () => {
    const authModalPath = path.join(PROJECT_ROOT, 'src', 'components', 'modals', 'AuthModal.tsx');
    assert(fs.existsSync(authModalPath), 'AuthModal.tsx must exist');
    const content = fs.readFileSync(authModalPath, 'utf8');

    assert(content.includes("code.includes('invalid_username')"), 'Must check for invalid_username');
    assert(content.includes("code.includes('incorrect_password')"), 'Must check for incorrect_password');
    assert(content.includes("code.includes('empty_username')"), 'Must check for empty_username');
    assert(content.includes("Forgot Password"), 'Must reference Forgot Password in incorrect password message');
  });

  await challenge('C1.2: invalid_username produces expected distinct user-friendly message', () => {
    const errorCases = [
      { code: '[lp_jwt_auth] invalid_username' },
      { code: 'invalid_username' },
      { data: { code: '[lp_jwt_auth] invalid_username' } },
      { code: '[lp_jwt_auth] invalid_username', message: 'Unknown username.' },
    ];
    for (const ec of errorCases) {
      const msg = parseAuthModalError(ec);
      assert.strictEqual(
        msg,
        'Username or email is not registered. Please check your spelling or create an account.',
        `Failed for case: ${JSON.stringify(ec)}`
      );
    }
  });

  await challenge('C1.3: incorrect_password produces expected distinct message pointing to Forgot Password', () => {
    const errorCases = [
      { code: '[lp_jwt_auth] incorrect_password' },
      { code: 'incorrect_password' },
      { data: { code: '[lp_jwt_auth] incorrect_password' } },
      { code: '[lp_jwt_auth] incorrect_password', message: 'The password you entered is incorrect.' },
    ];
    for (const ec of errorCases) {
      const msg = parseAuthModalError(ec);
      assert.strictEqual(
        msg,
        "Incorrect password. Please try again or tap 'Forgot Password' below.",
        `Failed for case: ${JSON.stringify(ec)}`
      );
    }
  });

  await challenge('C1.4: Error messages for invalid_username and incorrect_password are strictly distinct', () => {
    const msgInvalidUser = parseAuthModalError({ code: '[lp_jwt_auth] invalid_username' });
    const msgIncorrectPass = parseAuthModalError({ code: '[lp_jwt_auth] incorrect_password' });
    assert.notStrictEqual(msgInvalidUser, msgIncorrectPass, 'Messages must not be identical');
    assert(msgInvalidUser.includes('not registered'), 'invalid_username must indicate user not registered');
    assert(msgIncorrectPass.includes('Incorrect password'), 'incorrect_password must indicate incorrect password');
    assert(msgIncorrectPass.includes('Forgot Password'), 'incorrect_password must mention Forgot Password');
  });

  await challenge('C1.5: empty_username produces distinct guidance', () => {
    const msg = parseAuthModalError({ code: '[lp_jwt_auth] empty_username' });
    assert.strictEqual(msg, 'Please enter your username or email address.');
  });

  await challenge('C1.6: Fallback error handling handles empty object and generic strings', () => {
    const emptyErr = parseAuthModalError({});
    assert.strictEqual(emptyErr, 'Authentication failed. Please check your credentials.');

    const genericErr = parseAuthModalError({ message: 'Network timeout 504' });
    assert.strictEqual(genericErr, 'Network timeout 504');

    const nullErr = parseAuthModalError(null);
    assert.strictEqual(nullErr, 'Authentication failed. Please check your credentials.');
  });

  console.log('\n--- SUITE 2: FORGOT PASSWORD FLOW & RESET-PASSWORD ENDPOINT ---');

  await challenge('C2.1: AuthModal provides 48dp touchable "Forgot Password?" option and forgot_password mode', () => {
    const authModalPath = path.join(PROJECT_ROOT, 'src', 'components', 'modals', 'AuthModal.tsx');
    const content = fs.readFileSync(authModalPath, 'utf8');

    assert(content.includes("setMode('forgot_password')"), 'Must switch mode to forgot_password');
    assert(content.includes('handleResetPassword'), 'Must declare handleResetPassword handler');
    assert(content.includes('AuthService.resetPassword'), 'Must invoke AuthService.resetPassword');
    assert(content.includes('Send Password Reset Link'), 'Must have button for sending reset link');

    // Check 48dp touchable styling
    assert(content.includes('minHeight: 48') || content.includes('forgotPasswordTouch'), 'Must have accessible touchable container');
  });

  let liveTestUser = null;

  await challenge('C2.2: Live Registration on Staging creates non-destructive test user', async () => {
    const ts = Date.now().toString().slice(-6);
    const username = `ch_m2_${ts}`;
    const email = `ch_m2_${ts}@thrivingskill.test`;
    const password = `TS_Challenger_${ts}!`;

    const res = await apiRequest(`${API_BASE}/learnpress/v1/token/register`, {
      method: 'POST',
      body: { username, email, password, confirm_password: password },
    });

    assert.strictEqual(res.status, 200, `Registration must return HTTP 200, got ${res.status}: ${JSON.stringify(res.body)}`);
    assert(res.body && res.body.token, 'Registration response must contain auth token');
    liveTestUser = { username, email, password, token: res.body.token, id: res.body.user_id || res.body.id };
    console.log(`         Registered live staging user: ${email}`);
  });

  await challenge('C2.3: Live staging POST /learnpress/v1/users/reset-password succeeds for registered user', async () => {
    assert(liveTestUser, 'Must have registered test user');
    const res = await apiRequest(`${API_BASE}/learnpress/v1/users/reset-password`, {
      method: 'POST',
      body: { user_login: liveTestUser.email },
    });

    assert.strictEqual(res.status, 200, `Reset password must return HTTP 200, got ${res.status}: ${JSON.stringify(res.body)}`);
    assert.strictEqual(res.body?.code, 'success', `Response code must be "success", got: ${res.body?.code}`);
    assert(res.body?.message?.includes('emailed'), `Message should mention emailed link: ${res.body?.message}`);
  });

  await challenge('C2.4: Live staging POST /learnpress/v1/users/reset-password also succeeds with username', async () => {
    assert(liveTestUser, 'Must have registered test user');
    const res = await apiRequest(`${API_BASE}/learnpress/v1/users/reset-password`, {
      method: 'POST',
      body: { user_login: liveTestUser.username },
    });

    assert.strictEqual(res.status, 200, `Reset password with username must return HTTP 200, got ${res.status}: ${JSON.stringify(res.body)}`);
    assert.strictEqual(res.body?.code, 'success', `Response code must be "success", got: ${res.body?.code}`);
  });

  await challenge('C2.5: Live staging POST /learnpress/v1/users/reset-password rejects non-existent user with HTTP 500 error_not_user', async () => {
    const ghostEmail = `non_existent_ghost_${Date.now()}@thrivingskill.test`;
    const res = await apiRequest(`${API_BASE}/learnpress/v1/users/reset-password`, {
      method: 'POST',
      body: { user_login: ghostEmail },
    });

    assert.strictEqual(res.status, 500, `Non-existent user must return HTTP 500, got ${res.status}`);
    assert.strictEqual(res.body?.code, 'error_not_user', `Error code must be error_not_user, got ${res.body?.code}`);
    const parsed = parseResetPasswordResult(res.body);
    assert.strictEqual(parsed, 'User not found. No account is registered with this username or email.');
  });

  await challenge('C2.6: Live staging POST /learnpress/v1/users/reset-password rejects empty user_login with HTTP 500 error_santize_login', async () => {
    const res = await apiRequest(`${API_BASE}/learnpress/v1/users/reset-password`, {
      method: 'POST',
      body: { user_login: '' },
    });

    assert.strictEqual(res.status, 500, `Empty user_login must return HTTP 500, got ${res.status}`);
    assert.strictEqual(res.body?.code, 'error_santize_login', `Error code must be error_santize_login, got ${res.body?.code}`);
    const parsed = parseResetPasswordResult(res.body);
    assert.strictEqual(parsed, 'Enter a valid username or email address.');
  });

  await challenge('C2.7: Live staging POST /learnpress/v1/token produces differentiated error codes in live execution', async () => {
    // Test 1: invalid username
    const resInvalidUser = await apiRequest(`${API_BASE}/learnpress/v1/token`, {
      method: 'POST',
      body: { username: 'unregistered_challenger_99999999', password: 'SomePass123!' },
    });
    assert.strictEqual(resInvalidUser.status, 403, 'Must return 403');
    assert.strictEqual(resInvalidUser.body?.code, '[lp_jwt_auth] invalid_username');
    const msgUser = parseAuthModalError(resInvalidUser.body);
    assert(msgUser.includes('not registered'));

    // Test 2: existing user with wrong password
    assert(liveTestUser, 'Must have live test user');
    const resWrongPass = await apiRequest(`${API_BASE}/learnpress/v1/token`, {
      method: 'POST',
      body: { username: liveTestUser.username, password: 'WrongPassword456!' },
    });
    assert.strictEqual(resWrongPass.status, 403, 'Must return 403');
    assert.strictEqual(resWrongPass.body?.code, '[lp_jwt_auth] incorrect_password');
    const msgPass = parseAuthModalError(resWrongPass.body);
    assert(msgPass.includes('Incorrect password'));
  });

  console.log('\n--- SUITE 3: STRICT ADMINISTRATOR ROLE CHECK IN PROFILESCREEN ---');

  const profileScreenPath = path.join(PROJECT_ROOT, 'src', 'screens', 'ProfileScreen.tsx');
  const profileContent = fs.readFileSync(profileScreenPath, 'utf8');

  await challenge('C3.1: ProfileScreen uses strict Array.isArray and roles.includes("administrator")', () => {
    assert(profileContent.includes("const isAdmin = Array.isArray(user?.roles) && user.roles.includes('administrator');"),
      'Must contain exact strict role contract');

    // Ensure NO loose heuristics remain
    assert(!profileContent.includes("user?.username?.toLowerCase() === 'admin'"), 'Must NOT check username for admin');
    assert(!profileContent.includes("user?.email?.toLowerCase().includes('admin@')"), 'Must NOT check email for admin@');
  });

  await challenge('C3.2: ProfileScreen guards WordPress Admin Portal shortcut under APP PREFERENCES', () => {
    const adminBlockIndex = profileContent.indexOf('WordPress Admin Portal (WP-Admin)');
    assert(adminBlockIndex !== -1, 'WordPress Admin Portal (WP-Admin) text must exist in ProfileScreen');

    const sliceBefore = profileContent.substring(adminBlockIndex - 600, adminBlockIndex);
    assert(sliceBefore.includes('{isAdmin && ('), 'WP-Admin portal link in APP PREFERENCES must be wrapped in {isAdmin && (');

    const sliceAfter = profileContent.substring(adminBlockIndex, adminBlockIndex + 600);
    assert(sliceAfter.includes(')}'), 'WP-Admin portal link block must be closed with )}');
  });

  await challenge('C3.2b: ProfileScreen guards Admin Management Console section', () => {
    const consoleIndex = profileContent.indexOf('ADMIN MANAGEMENT CONSOLE');
    assert(consoleIndex !== -1, 'ADMIN MANAGEMENT CONSOLE must exist');
    const sliceBefore = profileContent.substring(consoleIndex - 200, consoleIndex);
    assert(sliceBefore.includes('{isAdmin && ('), 'Admin Management Console must be wrapped in {isAdmin && (');
  });

  await challenge('C3.3: Strict isUserAdmin unit edge-case matrix evaluation', () => {
    // Extract exact expression logic from ProfileScreen line 133
    const isUserAdmin = (user) => Array.isArray(user?.roles) && user.roles.includes('administrator');

    // Edge cases that MUST return FALSE:
    const falseCases = [
      { name: 'null', user: null },
      { name: 'undefined', user: undefined },
      { name: 'empty object', user: {} },
      { name: 'username admin without roles', user: { username: 'admin' } },
      { name: 'email admin@thrivingskill.com without roles', user: { email: 'admin@thrivingskill.com' } },
      { name: 'username admin and email admin@ with empty roles', user: { username: 'admin', email: 'admin@domain.com', roles: [] } },
      { name: 'customer role', user: { roles: ['customer'] } },
      { name: 'subscriber role', user: { roles: ['subscriber'] } },
      { name: 'instructor role', user: { roles: ['instructor'] } },
      { name: 'editor role', user: { roles: ['editor'] } },
      { name: 'author role', user: { roles: ['author'] } },
      { name: 'contributor role', user: { roles: ['contributor'] } },
      { name: 'string roles property instead of array', user: { roles: 'administrator' } },
      { name: 'object roles property instead of array', user: { roles: { 0: 'administrator' } } },
      { name: 'substring matching attempt', user: { roles: ['not_an_administrator'] } },
      { name: 'sub-role assistant attempt', user: { roles: ['admin_assistant'] } },
      { name: 'uppercase ADMINISTRATOR (WordPress roles are lowercase)', user: { roles: ['ADMINISTRATOR'] } },
      { name: 'numbers array', user: { roles: [1, 2, 3] } },
      { name: 'boolean roles', user: { roles: true } },
    ];

    for (const fc of falseCases) {
      assert.strictEqual(
        isUserAdmin(fc.user),
        false,
        `Edge case "${fc.name}" failed: expected false but got true for ${JSON.stringify(fc.user)}`
      );
    }

    // Cases that MUST return TRUE:
    const trueCases = [
      { name: 'exact administrator array', user: { roles: ['administrator'] } },
      { name: 'administrator along with customer', user: { roles: ['customer', 'administrator'] } },
      { name: 'administrator along with subscriber and instructor', user: { roles: ['subscriber', 'instructor', 'administrator'] } },
    ];

    for (const tc of trueCases) {
      assert.strictEqual(
        isUserAdmin(tc.user),
        true,
        `Case "${tc.name}" failed: expected true but got false for ${JSON.stringify(tc.user)}`
      );
    }
  });

  console.log('\n--- SUITE 4: SAASCONTEXT TIMER HYGIENE & CLEANUP ---');

  await challenge('C4.1: SaaSContext uses useRef for copilot timer and performs unmount cleanup', () => {
    const saasContextPath = path.join(PROJECT_ROOT, 'src', 'context', 'SaaSContext.tsx');
    assert(fs.existsSync(saasContextPath), 'SaaSContext.tsx must exist');
    const content = fs.readFileSync(saasContextPath, 'utf8');

    // 1. Imports useRef
    assert(content.includes('useRef'), 'Must import useRef from react');

    // 2. Declares copilotTimerRef
    assert(content.includes('copilotTimerRef = useRef'), 'Must declare copilotTimerRef via useRef');

    // 3. Implements useEffect unmount cleanup
    const hasUnmountCleanup = content.includes('if (copilotTimerRef.current)') &&
      content.includes('clearTimeout(copilotTimerRef.current)');
    assert(hasUnmountCleanup, 'Must clear copilotTimerRef.current on component unmount');

    // 4. In sendCopilotMessage, clears prior timer before scheduling new one
    const sendCopilotIdx = content.indexOf('const sendCopilotMessage =');
    assert(sendCopilotIdx !== -1, 'sendCopilotMessage must exist');
    const sendCopilotBody = content.substring(sendCopilotIdx, sendCopilotIdx + 600);
    assert(sendCopilotBody.includes('if (copilotTimerRef.current)'), 'Must check existing timer before scheduling');
    assert(sendCopilotBody.includes('clearTimeout(copilotTimerRef.current)'), 'Must clearTimeout on existing timer');
    assert(sendCopilotBody.includes('copilotTimerRef.current = setTimeout'), 'Must assign new timer to copilotTimerRef.current');
  });

  await challenge('C4.2: Zero unhandled setTimeout or bare NodeJS.Timeout in SaaSContext.tsx', () => {
    const saasContextPath = path.join(PROJECT_ROOT, 'src', 'context', 'SaaSContext.tsx');
    const content = fs.readFileSync(saasContextPath, 'utf8');

    // Disallow NodeJS.Timeout in client code
    assert(!content.includes('NodeJS.Timeout'), 'Must NOT use NodeJS.Timeout in client code (violates Rule 3)');

    // Count setTimeout instances
    const setTimeoutMatches = content.match(/setTimeout\s*\(/g) || [];
    assert.strictEqual(setTimeoutMatches.length, 1, `Expected exactly 1 setTimeout in SaaSContext.tsx, found ${setTimeoutMatches.length}`);

    // Count setInterval instances
    const setIntervalMatches = content.match(/setInterval\s*\(/g) || [];
    assert.strictEqual(setIntervalMatches.length, 0, `Expected 0 setInterval in SaaSContext.tsx, found ${setIntervalMatches.length}`);
  });

  console.log('\n=================================================================');
  console.log(`  CHALLENGER RESULTS: ${passedTests} / ${totalTests} PASSED (${failedTests} FAILED)`);
  console.log('=================================================================\n');

  if (failedTests > 0) {
    console.error('FAILURES SUMMARY:');
    failures.forEach((f, idx) => {
      console.error(`  ${idx + 1}. ${f.title}: ${f.error}`);
    });
    process.exit(1);
  } else {
    console.log('ALL ADVERSARIAL CHALLENGES PASSED EMPIRICALLY!');
    process.exit(0);
  }
}

runAllChallenges().catch(err => {
  console.error('Unhandled fatal error in challenger runner:', err);
  process.exit(1);
});
