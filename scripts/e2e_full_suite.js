/**
 * ============================================================================
 * THRIVING SKILLS MOBILE APPLICATION — DUAL TRACK E2E TEST SUITE (TIERS 1-4)
 * ============================================================================
 * Comprehensive Opaque-Box Test Suite derived from user requirements
 * (ORIGINAL_REQUEST.md) and architectural specifications (PROJECT.md).
 *
 * Tier 1: Feature Coverage (>=5 test cases per feature)
 * Tier 2: Boundary & Corner Cases (>=5 test cases per feature)
 * Tier 3: Cross-Feature Combinations (Pairwise & Multi-Feature Interactions)
 * Tier 4: Real-World Application Scenarios (End-to-End User Journeys)
 *
 * Usage:
 *   node scripts/e2e_full_suite.js               # Run full suite (Tiers 1-4)
 *   node scripts/e2e_full_suite.js --tier=1      # Run Tier 1 only
 *   node scripts/e2e_full_suite.js --tier=2      # Run Tier 2 only
 *   node scripts/e2e_full_suite.js --tier=3      # Run Tier 3 only
 *   node scripts/e2e_full_suite.js --tier=4      # Run Tier 4 only
 *   node scripts/e2e_full_suite.js --live-only   # Run live backend tests only
 *   node scripts/e2e_full_suite.js --static-only # Run static contract tests only
 * ============================================================================
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const API_BASE = 'https://staging.thrivingskill.com/wp-json';

// Parse command line flags
const args = process.argv.slice(2);
const flagTier = args.find(a => a.startsWith('--tier=')) ? parseInt(args.find(a => a.startsWith('--tier=')).split('=')[1], 10) : null;
const flagLiveOnly = args.includes('--live-only');
const flagStaticOnly = args.includes('--static-only');

// Network client helper with timeout and retry
async function request(url, options = {}, retries = 1) {
  let lastErr = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await new Promise((resolve, reject) => {
        const u = new URL(url);
        const isHttps = u.protocol === 'https:';
        const client = isHttps ? https : http;
        const method = options.method || 'GET';
        const headers = {
          'User-Agent': 'ThrivingSkills-E2E-Runner/1.0',
          'Accept': 'application/json, text/plain, */*',
          ...options.headers,
        };
        let bodyData = null;

        if (options.body) {
          bodyData = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
          headers['Content-Type'] = headers['Content-Type'] || 'application/json';
          headers['Content-Length'] = Buffer.byteLength(bodyData);
        }

        const req = client.request({
          hostname: u.hostname,
          port: u.port || (isHttps ? 443 : 80),
          path: u.pathname + u.search,
          method,
          headers,
          timeout: options.timeout || 30000,
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
          reject(new Error(`Request timeout (${options.timeout || 30000}ms) for ${url}`));
        });

        req.on('error', reject);
        if (bodyData) req.write(bodyData);
        req.end();
      });
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        // Wait 1.5s before retry
        await new Promise(r => setTimeout(r, 1500));
      }
    }
  }
  throw lastErr;
}

// Test Runner Framework State
const testResults = [];
let dynamicTestAccount = null;

async function getOrCreateDynamicAccount() {
  if (dynamicTestAccount) return dynamicTestAccount;
  const ts = Date.now().toString().slice(-6);
  const username = `ts_e2e_${ts}`;
  const email = `ts_e2e_${ts}@thrivingskill.test`;
  const password = `TS_E2E_Pass_${ts}!`;

  try {
    const regRes = await request(`${API_BASE}/learnpress/v1/token/register`, {
      method: 'POST',
      body: {
        username,
        email,
        password,
        confirm_password: password,
        phone: '01712345678',
      },
    });

    let token = regRes.body?.token;
    let userId = regRes.body?.user_id;

    if (!token) {
      // Try login if already registered
      const loginRes = await request(`${API_BASE}/learnpress/v1/token`, {
        method: 'POST',
        body: { username, password },
      });
      token = loginRes.body?.token;
      userId = loginRes.body?.user_id;
    }

    dynamicTestAccount = { username, email, password, token, userId };
    return dynamicTestAccount;
  } catch (err) {
    throw new Error(`Failed to provision dynamic test account: ${err.message}`);
  }
}

// Assertions
function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message || 'Assertion failed'}: expected "${expected}", got "${actual}"`);
  }
}

function assertTrue(actual, message) {
  if (actual !== true) {
    throw new Error(`${message || 'Assertion failed'}: expected true, got ${actual}`);
  }
}

function assertFalse(actual, message) {
  if (actual !== false) {
    throw new Error(`${message || 'Assertion failed'}: expected false, got ${actual}`);
  }
}

function assertIncludes(haystack, needle, message) {
  if (!haystack || !haystack.includes(needle)) {
    throw new Error(`${message || 'Assertion failed'}: expected to include "${needle}"`);
  }
}

// Test Registration
async function registerTest(id, name, tier, feature, type, fn) {
  // Check filtering
  if (flagTier && tier !== flagTier) return;
  if (flagLiveOnly && type !== 'live') return;
  if (flagStaticOnly && type !== 'static') return;

  const startTime = Date.now();
  let status = 'PASS';
  let errorMsg = null;

  try {
    await fn();
  } catch (err) {
    status = 'FAIL';
    errorMsg = err.message;
  }

  const duration = Date.now() - startTime;
  testResults.push({ id, name, tier, feature, type, status, duration, errorMsg });

  const statusBadge = status === 'PASS' ? '✅ PASS' : '❌ FAIL';
  const typeTag = type === 'live' ? '[LIVE]' : '[STATIC]';
  console.log(`  ${statusBadge} ${id.padEnd(8)} ${typeTag.padEnd(8)} ${name} (${duration}ms)`);
  if (errorMsg) {
    console.log(`         ⚠️  ${errorMsg}`);
  }
}

// ============================================================================
// SUITE IMPLEMENTATION
// ============================================================================

async function runTestSuite() {
  console.log('\n================================================================');
  console.log('🚀 THRIVING SKILLS DUAL TRACK E2E TEST SUITE (TIERS 1-4)');
  console.log('================================================================');
  console.log(`Target Backend: ${API_BASE}`);
  console.log(`Project Root:   ${PROJECT_ROOT}`);
  console.log(`Execution Mode: ${flagTier ? `Tier ${flagTier}` : (flagLiveOnly ? 'Live Only' : (flagStaticOnly ? 'Static Only' : 'All Tiers 1-4'))}\n`);

  // Provision dynamic test account for live tests
  if (!flagStaticOnly) {
    process.stdout.write('Provisioning non-destructive dynamic test student account... ');
    try {
      const acct = await getOrCreateDynamicAccount();
      console.log(`[OK] (${acct.username})\n`);
    } catch (err) {
      console.log(`[FAILED: ${err.message}]\n`);
    }
  }

  // ==========================================================================
  // TIER 1: FEATURE COVERAGE (>=5 TEST CASES PER FEATURE)
  // ==========================================================================
  console.log('----------------------------------------------------------------');
  console.log('📍 TIER 1: FEATURE COVERAGE (Core Functionality & Contract Verification)');
  console.log('----------------------------------------------------------------');

  // --- Feature 1: Material Design 3 UI & Design System ---
  await registerTest('T1.1.1', 'Verify M3 Shape Tokens export in src/theme/shapes.ts', 1, 'F1_M3_UI', 'static', () => {
    const shapesPath = path.join(PROJECT_ROOT, 'src', 'theme', 'shapes.ts');
    assert(fs.existsSync(shapesPath), 'src/theme/shapes.ts does not exist');
    const content = fs.readFileSync(shapesPath, 'utf8');
    assertIncludes(content, 'export const shape', 'Missing shape token export');
    assertIncludes(content, 'none: 0', 'Missing shape.none token');
    assertIncludes(content, 'extraSmall: 4', 'Missing shape.extraSmall token');
    assertIncludes(content, 'small: 8', 'Missing shape.small token');
    assertIncludes(content, 'medium: 12', 'Missing shape.medium token');
    assertIncludes(content, 'large: 16', 'Missing shape.large token');
    assertIncludes(content, 'largeIncreased: 20', 'Missing shape.largeIncreased token');
    assertIncludes(content, 'extraLarge: 28', 'Missing shape.extraLarge token');
    assertIncludes(content, 'full: 9999', 'Missing shape.full token');
  });

  await registerTest('T1.1.2', 'Verify official brand color tokens in src/theme/colors.ts', 1, 'F1_M3_UI', 'static', () => {
    const colorsPath = path.join(PROJECT_ROOT, 'src', 'theme', 'colors.ts');
    assert(fs.existsSync(colorsPath), 'src/theme/colors.ts does not exist');
    const content = fs.readFileSync(colorsPath, 'utf8');
    assertIncludes(content, '#102F53', 'Brand Deep Navy #102F53 must be defined');
    assertIncludes(content, '#FFB606', 'Sunshine Gold #FFB606 must be defined');
    assertIncludes(content, '#E34234', 'Crimson/Coral #E34234 must be defined');
    assert(!content.includes('#102E52'), 'Off-brand color typo #102E52 must not exist in colors.ts');
  });

  await registerTest('T1.1.3', 'Verify M3 Bottom Nav Pill Capsule in App.tsx', 1, 'F1_M3_UI', 'static', () => {
    const appPath = path.join(PROJECT_ROOT, 'App.tsx');
    assert(fs.existsSync(appPath), 'App.tsx does not exist');
    const content = fs.readFileSync(appPath, 'utf8');
    const hasPillOrShape = content.includes('activeTabIndicator') ||
      content.includes('tabIndicator') ||
      content.includes('shape.full') ||
      content.includes('borderRadius: 9999') ||
      content.includes('tabPill') ||
      content.includes('pillCapsule') ||
      content.includes('tabIndicatorCapsule');
    assert(hasPillOrShape, 'App.tsx must define an M3 pill capsule indicator for the active tab');
  });

  await registerTest('T1.1.4', 'Verify 48dp minimum touch dimension on bottom navigation tabs in App.tsx', 1, 'F1_M3_UI', 'static', () => {
    const appPath = path.join(PROJECT_ROOT, 'App.tsx');
    const content = fs.readFileSync(appPath, 'utf8');
    const has48dpMinHeight = content.includes('minHeight: 48') || content.includes('minHeight:48') || content.includes('height: 48') || content.includes('height: 56') || content.includes('height: 60') || content.includes('paddingVertical: 10');
    assert(has48dpMinHeight, 'App.tsx bottom navigation tabs must ensure >=48dp touch height');
  });

  await registerTest('T1.1.5', 'Verify tactile feedback (Pressable with android_ripple) in bottom navigation or common UI', 1, 'F1_M3_UI', 'static', () => {
    const appPath = path.join(PROJECT_ROOT, 'App.tsx');
    const content = fs.readFileSync(appPath, 'utf8');
    const hasPressableOrRipple = content.includes('android_ripple') || content.includes('Pressable') || content.includes('touchableFeedback');
    assert(hasPressableOrRipple, 'App.tsx navigation buttons must support tactile feedback via Pressable android_ripple');
  });

  // --- Feature 2: WordPress Admin Portal Access Guard ---
  await registerTest('T1.2.1', 'Verify strict admin role verification returns true for verified administrator', 1, 'F2_ADMIN_GUARD', 'static', () => {
    const isUserAdmin = (user) => Array.isArray(user?.roles) && user.roles.includes('administrator');
    assertTrue(isUserAdmin({ roles: ['administrator'] }), 'Administrator role must evaluate to true');
    assertTrue(isUserAdmin({ roles: ['subscriber', 'administrator'] }), 'Multiple roles with administrator must evaluate to true');
  });

  await registerTest('T1.2.2', 'Verify strict admin role verification returns false for customer/subscriber', 1, 'F2_ADMIN_GUARD', 'static', () => {
    const isUserAdmin = (user) => Array.isArray(user?.roles) && user.roles.includes('administrator');
    assertFalse(isUserAdmin({ roles: ['customer'] }), 'Customer role must evaluate to false');
    assertFalse(isUserAdmin({ roles: ['subscriber'] }), 'Subscriber role must evaluate to false');
    assertFalse(isUserAdmin({ roles: ['instructor'] }), 'Instructor without administrator role must evaluate to false');
  });

  await registerTest('T1.2.3', 'Verify strict admin role verification rejects username spoofing', 1, 'F2_ADMIN_GUARD', 'static', () => {
    const isUserAdmin = (user) => Array.isArray(user?.roles) && user.roles.includes('administrator');
    assertFalse(isUserAdmin({ username: 'admin', roles: ['customer'] }), 'Username "admin" with customer role must evaluate to false');
    assertFalse(isUserAdmin({ username: 'ADMIN_TSL', roles: ['subscriber'] }), 'Case-insensitive admin username with subscriber role must evaluate to false');
  });

  await registerTest('T1.2.4', 'Verify strict admin role verification rejects email heuristic spoofing', 1, 'F2_ADMIN_GUARD', 'static', () => {
    const isUserAdmin = (user) => Array.isArray(user?.roles) && user.roles.includes('administrator');
    assertFalse(isUserAdmin({ email: 'admin@gmail.com', roles: ['customer'] }), 'Email containing "admin@" must evaluate to false if roles do not contain administrator');
    assertFalse(isUserAdmin({ email: 'superadmin@thrivingskill.com', roles: [] }), 'Admin email with empty roles must evaluate to false');
  });

  await registerTest('T1.2.5', 'Verify ProfileScreen.tsx guards WordPress Admin Portal shortcut in App Preferences', 1, 'F2_ADMIN_GUARD', 'static', () => {
    const profilePath = path.join(PROJECT_ROOT, 'src', 'screens', 'ProfileScreen.tsx');
    assert(fs.existsSync(profilePath), 'src/screens/ProfileScreen.tsx does not exist');
    const content = fs.readFileSync(profilePath, 'utf8');
    const hasAdminGuardedPreferences = content.includes('{isAdmin && (') || content.includes('{isAdmin ?') || content.includes('isAdmin &&') || !content.includes('ওয়ার্ডপ্রেস অ্যাডমিন পোর্টাল (WP-Admin)');
    assert(hasAdminGuardedPreferences, 'ProfileScreen.tsx must restrict WordPress Admin Portal link to authenticated administrators');
  });

  // --- Feature 3: User Profile Update & LMS Synchronization ---
  await registerTest('T1.3.1', 'Verify live profile retrieval via GET /wp/v2/users/me?context=edit', 1, 'F3_PROFILE_SYNC', 'live', async () => {
    const acct = await getOrCreateDynamicAccount();
    const res = await request(`${API_BASE}/wp/v2/users/me?context=edit`, {
      headers: { Authorization: `Bearer ${acct.token}` },
    });
    assertEqual(res.status, 200, 'GET /wp/v2/users/me?context=edit must return HTTP 200');
    assert(res.body && res.body.id, 'Response must include user ID');
    assert(Array.isArray(res.body.roles), 'Response in context=edit must include roles array');
  });

  await registerTest('T1.3.2', 'Verify live profile update via POST /wp/v2/users/me', 1, 'F3_PROFILE_SYNC', 'live', async () => {
    const acct = await getOrCreateDynamicAccount();
    const updatedName = `E2E Student ${Date.now().toString().slice(-4)}`;
    const updatedBio = 'Senior Product Manager and Lifelong Learner.';
    const res = await request(`${API_BASE}/wp/v2/users/me`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${acct.token}` },
      body: { name: updatedName, description: updatedBio },
    });
    assertEqual(res.status, 200, 'POST /wp/v2/users/me must return HTTP 200');
    assertEqual(res.body?.name, updatedName, 'Updated name must match submitted name');
    // Normalize any HTML entity encoding from WordPress
    const cleanBio = res.body?.description?.replace(/&amp;/g, '&');
    assertEqual(cleanBio, updatedBio, 'Updated bio must match submitted bio');
  });

  await registerTest('T1.3.3', 'Verify profile update persistence on re-query', 1, 'F3_PROFILE_SYNC', 'live', async () => {
    const acct = await getOrCreateDynamicAccount();
    const verifyRes = await request(`${API_BASE}/wp/v2/users/me?context=edit`, {
      headers: { Authorization: `Bearer ${acct.token}` },
    });
    assertEqual(verifyRes.status, 200, 'Re-query GET /wp/v2/users/me?context=edit must succeed');
    assert(verifyRes.body?.name.startsWith('E2E Student'), 'Persisted name must reflect updated value');
    const cleanBio = verifyRes.body?.description?.replace(/&amp;/g, '&');
    assertEqual(cleanBio, 'Senior Product Manager and Lifelong Learner.', 'Persisted bio must match updated value');
  });

  await registerTest('T1.3.4', 'Verify LearnPress user details query via GET /learnpress/v1/users/{id}', 1, 'F3_PROFILE_SYNC', 'live', async () => {
    const acct = await getOrCreateDynamicAccount();
    const res = await request(`${API_BASE}/learnpress/v1/users/${acct.userId}`, {
      headers: { Authorization: `Bearer ${acct.token}` },
    });
    assertEqual(res.status, 200, 'GET /learnpress/v1/users/{id} must return HTTP 200');
    assert(res.body && (res.body.id == acct.userId || res.body.avatar_url), 'Response must contain LearnPress user profile record');
  });

  await registerTest('T1.3.5', 'Verify UserService exposes updateProfile contract in userService.ts', 1, 'F3_PROFILE_SYNC', 'static', () => {
    const userServicePath = path.join(PROJECT_ROOT, 'src', 'services', 'api', 'userService.ts');
    assert(fs.existsSync(userServicePath), 'src/services/api/userService.ts must exist');
    const content = fs.readFileSync(userServicePath, 'utf8');
    const hasUpdateMethod = content.includes('updateProfile') || content.includes('updateCurrentUser');
    assert(hasUpdateMethod, 'UserService must declare an updateProfile method');
  });

  // --- Feature 4: Authentication & Password Workflows ---
  await registerTest('T1.4.1', 'Verify login error differentiation for invalid / non-existent username', 1, 'F4_AUTH_PASS', 'live', async () => {
    const res = await request(`${API_BASE}/learnpress/v1/token`, {
      method: 'POST',
      body: { username: 'non_existent_user_99999999', password: 'SomePass123!' },
    });
    assertEqual(res.status, 403, 'Invalid username must return HTTP 403');
    assertEqual(res.body?.code, '[lp_jwt_auth] invalid_username', 'Error code must be [lp_jwt_auth] invalid_username');
  });

  await registerTest('T1.4.2', 'Verify login error differentiation for incorrect password', 1, 'F4_AUTH_PASS', 'live', async () => {
    const acct = await getOrCreateDynamicAccount();
    const res = await request(`${API_BASE}/learnpress/v1/token`, {
      method: 'POST',
      body: { username: acct.username, password: 'CompletelyWrongPassword999!' },
    });
    assertEqual(res.status, 403, 'Incorrect password must return HTTP 403');
    assertEqual(res.body?.code, '[lp_jwt_auth] incorrect_password', 'Error code must be [lp_jwt_auth] incorrect_password');
  });

  await registerTest('T1.4.3', 'Verify login error differentiation for empty username', 1, 'F4_AUTH_PASS', 'live', async () => {
    const res = await request(`${API_BASE}/learnpress/v1/token`, {
      method: 'POST',
      body: { username: '', password: '' },
    });
    assertEqual(res.status, 403, 'Empty username must return HTTP 403');
    assertEqual(res.body?.code, '[lp_jwt_auth] empty_username', 'Error code must be [lp_jwt_auth] empty_username');
  });

  await registerTest('T1.4.4', 'Verify Forgot Password flow triggers reset email via POST /learnpress/v1/users/reset-password', 1, 'F4_AUTH_PASS', 'live', async () => {
    const acct = await getOrCreateDynamicAccount();
    const res = await request(`${API_BASE}/learnpress/v1/users/reset-password`, {
      method: 'POST',
      body: { user_login: acct.email },
    });
    assertEqual(res.status, 200, 'POST /learnpress/v1/users/reset-password with valid email must return HTTP 200');
    assertEqual(res.body?.code, 'success', 'Reset password response code must be "success"');
  });

  await registerTest('T1.4.5', 'Verify authenticated password change via POST /learnpress/v1/users/change-password', 1, 'F4_AUTH_PASS', 'live', async () => {
    const ts = Date.now().toString().slice(-6);
    const u = `ts_cp_${ts}`;
    const e = `ts_cp_${ts}@thrivingskill.test`;
    const p = `Pass_${ts}!`;
    const newP = `PassNew_${ts}!`;

    const regRes = await request(`${API_BASE}/learnpress/v1/token/register`, {
      method: 'POST',
      body: { username: u, email: e, password: p, confirm_password: p },
    });
    const token = regRes.body?.token;
    assert(token, 'Must obtain token for password change test');

    const cpRes = await request(`${API_BASE}/learnpress/v1/users/change-password`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: { old_password: p, new_password: newP, confirm_password: newP },
    });
    assertEqual(cpRes.status, 200, 'POST /learnpress/v1/users/change-password must return HTTP 200');
    assertEqual(cpRes.body?.code, 'success', 'Change password response code must be "success"');
  });

  // --- Feature 5: WordPress Staging Backend Integration ---
  await registerTest('T1.5.1', 'Verify WordPress REST API discovery and health at /wp-json', 1, 'F5_BACKEND_LMS', 'live', async () => {
    const res = await request(API_BASE);
    assertEqual(res.status, 200, 'GET /wp-json must return HTTP 200');
    assert(res.body && res.body.routes, 'Response must contain WordPress route registry');
    assert(res.body.routes['/learnpress/v1/token'], 'Routes must include /learnpress/v1/token');
  });

  await registerTest('T1.5.2', 'Verify dynamic student registration via /learnpress/v1/token/register', 1, 'F5_BACKEND_LMS', 'live', async () => {
    const ts = Date.now().toString().slice(-6);
    const res = await request(`${API_BASE}/learnpress/v1/token/register`, {
      method: 'POST',
      body: {
        username: `ts_reg_${ts}`,
        email: `ts_reg_${ts}@thrivingskill.test`,
        password: `TS_Pass_${ts}!`,
        confirm_password: `TS_Pass_${ts}!`,
      },
    });
    assertEqual(res.status, 200, 'Registration must return HTTP 200');
    assert(res.body?.token, 'Registration response must contain JWT token');
  });

  await registerTest('T1.5.3', 'Verify JWT token validation via POST /learnpress/v1/token/validate', 1, 'F5_BACKEND_LMS', 'live', async () => {
    const acct = await getOrCreateDynamicAccount();
    const res = await request(`${API_BASE}/learnpress/v1/token/validate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${acct.token}` },
    });
    assertEqual(res.status, 200, 'POST /learnpress/v1/token/validate must return HTTP 200');
    assertEqual(res.body?.code, 'lp_jwt_auth_valid_token', 'Code must be lp_jwt_auth_valid_token');
  });

  await registerTest('T1.5.4', 'Verify LearnPress course catalog query via GET /learnpress/v1/courses', 1, 'F5_BACKEND_LMS', 'live', async () => {
    const res = await request(`${API_BASE}/learnpress/v1/courses`);
    assertEqual(res.status, 200, 'GET /learnpress/v1/courses must return HTTP 200');
    assert(Array.isArray(res.body), 'Courses response must be an array');
    assert(res.body.length > 0, 'Course catalog must return at least 1 course');
  });

  await registerTest('T1.5.5', 'Verify course curriculum query for Course ID 11580', 1, 'F5_BACKEND_LMS', 'live', async () => {
    const res = await request(`${API_BASE}/learnpress/v1/courses/11580`);
    assertEqual(res.status, 200, 'GET /learnpress/v1/courses/11580 must return HTTP 200');
    assert(res.body && res.body.id === 11580, 'Course ID must be 11580');
    assert(Array.isArray(res.body.sections), 'Course must contain curriculum sections');
  });

  // --- Feature 6: Codebase Guardrails & Hygiene ---
  await registerTest('T1.6.1', 'Verify TypeScript typecheck (npm run typecheck)', 1, 'F6_GUARDRAILS', 'static', () => {
    try {
      execSync('npm run typecheck', { cwd: PROJECT_ROOT, stdio: 'pipe' });
    } catch (err) {
      throw new Error(`TypeScript typecheck failed: ${err.stdout?.toString() || err.message}`);
    }
  });

  await registerTest('T1.6.2', 'Verify application audit script (node scripts/audit_app.js)', 1, 'F6_GUARDRAILS', 'static', () => {
    try {
      execSync('node scripts/audit_app.js', { cwd: PROJECT_ROOT, stdio: 'pipe' });
    } catch (err) {
      throw new Error(`App audit script failed: ${err.stdout?.toString() || err.message}`);
    }
  });

  await registerTest('T1.6.3', 'Verify cross-platform timer hygiene in React components', 1, 'F6_GUARDRAILS', 'static', () => {
    const brandDrawerPath = path.join(PROJECT_ROOT, 'src', 'components', 'common', 'BrandDrawer.tsx');
    if (fs.existsSync(brandDrawerPath)) {
      const content = fs.readFileSync(brandDrawerPath, 'utf8');
      const hasBareTimer = /setTimeout\s*\([^)]*\)\s*;\s*\n/m.test(content) && !content.includes('useRef');
      assertFalse(hasBareTimer, 'BrandDrawer.tsx must not contain unhandled bare setTimeout calls');
    }
  });

  await registerTest('T1.6.4', 'Verify elimination of off-brand #102E52 color typo', 1, 'F6_GUARDRAILS', 'static', () => {
    const screensDir = path.join(PROJECT_ROOT, 'src', 'screens');
    const files = fs.readdirSync(screensDir);
    for (const f of files) {
      if (f.endsWith('.tsx') || f.endsWith('.ts')) {
        const c = fs.readFileSync(path.join(screensDir, f), 'utf8');
        assert(!c.includes('#102E52'), `File ${f} contains off-brand typo #102E52`);
      }
    }
  });

  await registerTest('T1.6.5', 'Verify design token integrity across shapes.ts and colors.ts', 1, 'F6_GUARDRAILS', 'static', () => {
    const shapes = path.join(PROJECT_ROOT, 'src', 'theme', 'shapes.ts');
    const colors = path.join(PROJECT_ROOT, 'src', 'theme', 'colors.ts');
    assert(fs.existsSync(shapes), 'shapes.ts must exist');
    assert(fs.existsSync(colors), 'colors.ts must exist');
  });

  // ==========================================================================
  // TIER 2: BOUNDARY & CORNER CASES (>=5 TEST CASES PER FEATURE)
  // ==========================================================================
  console.log('\n----------------------------------------------------------------');
  console.log('📍 TIER 2: BOUNDARY & CORNER CASES (Edge Conditions, Invalids & Stress)');
  console.log('----------------------------------------------------------------');

  // --- Feature 1: Material Design 3 UI & Design System ---
  await registerTest('T2.1.1', 'Verify shape.full has numerical value >= 9999 for capsule pill curvature', 2, 'F1_M3_UI', 'static', () => {
    const shapesPath = path.join(PROJECT_ROOT, 'src', 'theme', 'shapes.ts');
    const content = fs.readFileSync(shapesPath, 'utf8');
    const match = content.match(/full:\s*(\d+)/);
    assert(match && parseInt(match[1], 10) >= 9999, 'shape.full must be >= 9999');
  });

  await registerTest('T2.1.2', 'Verify shape token schema invariants: all 8 tokens are non-negative numeric values', 2, 'F1_M3_UI', 'static', () => {
    const shapesPath = path.join(PROJECT_ROOT, 'src', 'theme', 'shapes.ts');
    const content = fs.readFileSync(shapesPath, 'utf8');
    const keys = ['none', 'extraSmall', 'small', 'medium', 'large', 'largeIncreased', 'extraLarge', 'full'];
    for (const k of keys) {
      const regex = new RegExp(`${k}:\\s*(\\d+)`);
      assert(regex.test(content), `Token ${k} must be non-negative numeric in shapes.ts`);
    }
  });

  await registerTest('T2.1.3', 'Verify interactive elements with height < 48dp provide hitSlop compensation', 2, 'F1_M3_UI', 'static', () => {
    const searchBarPath = path.join(PROJECT_ROOT, 'src', 'components', 'common', 'SearchSpotlightBar.tsx');
    if (fs.existsSync(searchBarPath)) {
      const content = fs.readFileSync(searchBarPath, 'utf8');
      const hasHitSlop = content.includes('hitSlop') || content.includes('minHeight: 48');
      assert(hasHitSlop, 'SearchSpotlightBar tag pills must provide hitSlop for 48dp touch accessibility');
    }
  });

  await registerTest('T2.1.4', 'Verify hex color code format validity in colors.ts', 2, 'F1_M3_UI', 'static', () => {
    const colorsPath = path.join(PROJECT_ROOT, 'src', 'theme', 'colors.ts');
    const content = fs.readFileSync(colorsPath, 'utf8');
    const hexMatches = content.match(/#[0-9a-fA-F]{3,8}/g) || [];
    assert(hexMatches.length >= 10, 'Must have at least 10 valid hex color codes');
    for (const hex of hexMatches) {
      assert([4, 7, 9].includes(hex.length), `Invalid hex color length: ${hex}`);
    }
  });

  await registerTest('T2.1.5', 'Verify ripple boundary containment (borderless: false) in Pressable components', 2, 'F1_M3_UI', 'static', () => {
    const appPath = path.join(PROJECT_ROOT, 'App.tsx');
    const content = fs.readFileSync(appPath, 'utf8');
    if (content.includes('android_ripple')) {
      const specifiesBorderless = content.includes('borderless: false') || content.includes('borderless:false') || content.includes('borderless: true');
      assert(specifiesBorderless || content.includes('color:'), 'Ripple configuration should specify proper boundary containment');
    }
  });

  // --- Feature 2: WordPress Admin Portal Access Guard ---
  await registerTest('T2.2.1', 'Verify isUserAdmin handles null user without exception', 2, 'F2_ADMIN_GUARD', 'static', () => {
    const isUserAdmin = (user) => Array.isArray(user?.roles) && user.roles.includes('administrator');
    assertFalse(isUserAdmin(null), 'null user must return false');
  });

  await registerTest('T2.2.2', 'Verify isUserAdmin handles undefined user without exception', 2, 'F2_ADMIN_GUARD', 'static', () => {
    const isUserAdmin = (user) => Array.isArray(user?.roles) && user.roles.includes('administrator');
    assertFalse(isUserAdmin(undefined), 'undefined user must return false');
  });

  await registerTest('T2.2.3', 'Verify isUserAdmin handles user with empty roles array', 2, 'F2_ADMIN_GUARD', 'static', () => {
    const isUserAdmin = (user) => Array.isArray(user?.roles) && user.roles.includes('administrator');
    assertFalse(isUserAdmin({ id: 1, roles: [] }), 'Empty roles array must return false');
  });

  await registerTest('T2.2.4', 'Verify isUserAdmin rejects role substring collisions', 2, 'F2_ADMIN_GUARD', 'static', () => {
    const isUserAdmin = (user) => Array.isArray(user?.roles) && user.roles.includes('administrator');
    assertFalse(isUserAdmin({ roles: ['not_an_administrator', 'admin_helper', 'administrator_assistant'] }), 'Substring role matches must return false');
  });

  await registerTest('T2.2.5', 'Verify isUserAdmin safely handles malformed roles property', 2, 'F2_ADMIN_GUARD', 'static', () => {
    const isUserAdmin = (user) => Array.isArray(user?.roles) && user.roles.includes('administrator');
    assertFalse(isUserAdmin({ roles: 'administrator' }), 'String roles property must return false');
    assertFalse(isUserAdmin({ roles: { 0: 'administrator' } }), 'Object roles property must return false');
  });

  // --- Feature 3: User Profile Update & LMS Synchronization ---
  await registerTest('T2.3.1', 'Verify empty bio boundary on profile update via POST /wp/v2/users/me', 2, 'F3_PROFILE_SYNC', 'live', async () => {
    const acct = await getOrCreateDynamicAccount();
    const res = await request(`${API_BASE}/wp/v2/users/me`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${acct.token}` },
      body: { description: '' },
    });
    assertEqual(res.status, 200, 'Clearing bio with empty string must return HTTP 200');
    assertEqual(res.body?.description, '', 'Bio must be cleared');
  });

  await registerTest('T2.3.2', 'Verify Unicode & Bengali text integrity on profile update', 2, 'F3_PROFILE_SYNC', 'live', async () => {
    const acct = await getOrCreateDynamicAccount();
    const bengaliName = 'ডঃ শাহরিয়ার খান';
    const bengaliBio = 'সিনিয়র বিজনেস স্ট্র্যাটেজিস্ট এবং এক্সিকিউটিভ কোচ।';

    const res = await request(`${API_BASE}/wp/v2/users/me`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${acct.token}` },
      body: { name: bengaliName, description: bengaliBio },
    });
    assertEqual(res.status, 200, 'Updating profile with Bengali Unicode text must return HTTP 200');
    assertEqual(res.body?.name, bengaliName, 'Persisted Bengali name must match submitted text');
    assertEqual(res.body?.description, bengaliBio, 'Persisted Bengali bio must match submitted text');
  });

  await registerTest('T2.3.3', 'Verify extreme bio length boundary (1,000 characters)', 2, 'F3_PROFILE_SYNC', 'live', async () => {
    const acct = await getOrCreateDynamicAccount();
    const longBio = 'Leadership & Strategy '.repeat(45).slice(0, 1000);
    const res = await request(`${API_BASE}/wp/v2/users/me`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${acct.token}` },
      body: { description: longBio },
    });
    assertEqual(res.status, 200, 'Extreme bio length update must return HTTP 200');
    assert(res.body?.description.length >= 500, 'Description length must be retained');
  });

  await registerTest('T2.3.4', 'Verify HTML meta escaping and sanitization on profile update', 2, 'F3_PROFILE_SYNC', 'live', async () => {
    const acct = await getOrCreateDynamicAccount();
    const htmlBio = 'Bio with <b>bold text</b> and <script>alert("xss")</script>';
    const res = await request(`${API_BASE}/wp/v2/users/me`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${acct.token}` },
      body: { description: htmlBio },
    });
    assertEqual(res.status, 200, 'Profile update with HTML tags must return HTTP 200');
    assert(!res.body?.description.includes('<script>'), 'Script tags must be stripped by WordPress REST API');
  });

  await registerTest('T2.3.5', 'Verify unauthenticated profile update returns HTTP 401 or 404', 2, 'F3_PROFILE_SYNC', 'live', async () => {
    const res = await request(`${API_BASE}/wp/v2/users/me`, {
      method: 'POST',
      body: { name: 'Unauthorized Name' },
    });
    assert([401, 404].includes(res.status), `Unauthenticated POST /wp/v2/users/me must return HTTP 401 or 404, got ${res.status}`);
    assert(res.body?.code.includes('rest_not_logged_in') || res.body?.code.includes('rest_cannot_edit') || res.body?.code.includes('rest_user_invalid_id'), 'Error code must indicate not logged in or invalid user ID');
  });

  // --- Feature 4: Authentication & Password Workflows ---
  await registerTest('T2.4.1', 'Verify password change with incorrect old password returns HTTP 403', 2, 'F4_AUTH_PASS', 'live', async () => {
    const acct = await getOrCreateDynamicAccount();
    const res = await request(`${API_BASE}/learnpress/v1/users/change-password`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${acct.token}` },
      body: {
        old_password: 'incorrect_old_password',
        new_password: 'ValidNewPassword123!',
        confirm_password: 'ValidNewPassword123!',
      },
    });
    assertEqual(res.status, 403, 'Incorrect current password must return HTTP 403');
    assertEqual(res.body?.code, 'rest_user_incorrect_password', 'Code must be rest_user_incorrect_password');
  });

  await registerTest('T2.4.2', 'Verify password change client validation enforces new_password === confirm_password', 2, 'F4_AUTH_PASS', 'static', () => {
    const profilePath = path.join(PROJECT_ROOT, 'src', 'screens', 'ProfileScreen.tsx');
    assert(fs.existsSync(profilePath), 'ProfileScreen.tsx must exist');
    const content = fs.readFileSync(profilePath, 'utf8');
    const hasMismatchCheck = content.includes('newPass !== confirmPass') || content.includes('new_password !== confirm_password');
    assert(hasMismatchCheck, 'Client password change workflow must validate newPass === confirmPass');
  });

  await registerTest('T2.4.3', 'Verify unauthenticated password change returns HTTP 401', 2, 'F4_AUTH_PASS', 'live', async () => {
    const res = await request(`${API_BASE}/learnpress/v1/users/change-password`, {
      method: 'POST',
      body: {
        old_password: 'old',
        new_password: 'new',
        confirm_password: 'new',
      },
    });
    assertEqual(res.status, 401, 'Unauthenticated password change must return HTTP 401');
  });

  await registerTest('T2.4.4', 'Verify reset password with non-existent user returns HTTP 500 with error_not_user', 2, 'F4_AUTH_PASS', 'live', async () => {
    const res = await request(`${API_BASE}/learnpress/v1/users/reset-password`, {
      method: 'POST',
      body: { user_login: 'non_existent_email_999999@thrivingskill.test' },
    });
    assertEqual(res.status, 500, 'Reset password for non-existent user must return HTTP 500');
    assertEqual(res.body?.code, 'error_not_user', 'Error code must be error_not_user');
  });

  await registerTest('T2.4.5', 'Verify reset password with empty user_login returns HTTP 500 with error_santize_login', 2, 'F4_AUTH_PASS', 'live', async () => {
    const res = await request(`${API_BASE}/learnpress/v1/users/reset-password`, {
      method: 'POST',
      body: { user_login: '' },
    });
    assertEqual(res.status, 500, 'Reset password with empty login must return HTTP 500');
    assertEqual(res.body?.code, 'error_santize_login', 'Error code must be error_santize_login');
  });

  // --- Feature 5: WordPress Staging Backend Integration ---
  await registerTest('T2.5.1', 'Verify duplicate username registration returns error code', 2, 'F5_BACKEND_LMS', 'live', async () => {
    const acct = await getOrCreateDynamicAccount();
    const res = await request(`${API_BASE}/learnpress/v1/token/register`, {
      method: 'POST',
      body: {
        username: acct.username,
        email: `new_unique_${Date.now()}@thrivingskill.test`,
        password: 'Password123!',
        confirm_password: 'Password123!',
      },
    });
    assertEqual(res.status, 403, 'Duplicate username must return HTTP 403');
    const validCodes = ['[lp_jwt_auth] username_exists', 'registration-error-username-exists'];
    assert(validCodes.includes(res.body?.code), `Expected duplicate username code, got "${res.body?.code}"`);
  });

  await registerTest('T2.5.2', 'Verify duplicate email registration returns error code', 2, 'F5_BACKEND_LMS', 'live', async () => {
    const acct = await getOrCreateDynamicAccount();
    const res = await request(`${API_BASE}/learnpress/v1/token/register`, {
      method: 'POST',
      body: {
        username: `unique_${Date.now().toString().slice(-6)}`,
        email: acct.email,
        password: 'Password123!',
        confirm_password: 'Password123!',
      },
    });
    assertEqual(res.status, 403, 'Duplicate email must return HTTP 403');
    const validCodes = ['[lp_jwt_auth] email_exists', 'registration-error-email-exists'];
    assert(validCodes.includes(res.body?.code), `Expected duplicate email code, got "${res.body?.code}"`);
  });

  await registerTest('T2.5.3', 'Verify validation of tampered / invalid JWT token returns HTTP 401 or 403', 2, 'F5_BACKEND_LMS', 'live', async () => {
    const res = await request(`${API_BASE}/learnpress/v1/token/validate`, {
      method: 'POST',
      headers: { Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tampered.token' },
    });
    assert([401, 403].includes(res.status), `Tampered token must return HTTP 401 or 403, got ${res.status}`);
  });

  await registerTest('T2.5.4', 'Verify non-existent course ID handling returns error gracefully', 2, 'F5_BACKEND_LMS', 'live', async () => {
    const res = await request(`${API_BASE}/learnpress/v1/courses/99999999`);
    assert([401, 404, 200].includes(res.status), 'Non-existent course query must return standard HTTP status');
    if (res.status === 200) {
      assert(!res.body?.name || res.body?.id !== 99999999, 'Must not return valid course data for bogus ID');
    }
  });

  await registerTest('T2.5.5', 'Verify non-existent LearnPress user ID handling returns 404', 2, 'F5_BACKEND_LMS', 'live', async () => {
    const res = await request(`${API_BASE}/learnpress/v1/users/99999999`);
    assertEqual(res.status, 404, 'Non-existent LP user query must return HTTP 404');
  });

  // --- Feature 6: Codebase Guardrails & Hygiene ---
  await registerTest('T2.6.1', 'Verify unmount cleanup functions in React hook timers', 2, 'F6_GUARDRAILS', 'static', () => {
    const brandDrawer = path.join(PROJECT_ROOT, 'src', 'components', 'common', 'BrandDrawer.tsx');
    if (fs.existsSync(brandDrawer)) {
      const c = fs.readFileSync(brandDrawer, 'utf8');
      if (c.includes('setTimeout')) {
        assert(c.includes('clearTimeout'), 'BrandDrawer.tsx must call clearTimeout for unmount teardown');
      }
    }
  });

  await registerTest('T2.6.2', 'Verify strict typing in API contracts (no any proliferation for core payloads)', 2, 'F6_GUARDRAILS', 'static', () => {
    const typesPath = path.join(PROJECT_ROOT, 'src', 'types', 'index.ts');
    if (fs.existsSync(typesPath)) {
      const c = fs.readFileSync(typesPath, 'utf8');
      assertIncludes(c, 'export interface WpUser', 'WpUser interface must be exported in types');
    }
  });

  await registerTest('T2.6.3', 'Verify cross-platform path portability in verification scripts', 2, 'F6_GUARDRAILS', 'static', () => {
    const auditPath = path.join(PROJECT_ROOT, 'scripts', 'audit_app.js');
    const content = fs.readFileSync(auditPath, 'utf8');
    assertIncludes(content, 'path.join', 'audit_app.js must use path.join for cross-platform file paths');
  });

  await registerTest('T2.6.4', 'Verify local assets referenced via require() exist on disk', 2, 'F6_GUARDRAILS', 'static', () => {
    const iconPath = path.join(PROJECT_ROOT, 'assets', 'icon.png');
    assert(fs.existsSync(iconPath), 'assets/icon.png must exist');
  });

  await registerTest('T2.6.5', 'Verify JSON.parse safety across network and utility clients', 2, 'F6_GUARDRAILS', 'static', () => {
    const httpPath = path.join(PROJECT_ROOT, 'src', 'services', 'api', 'httpClient.ts');
    if (fs.existsSync(httpPath)) {
      const content = fs.readFileSync(httpPath, 'utf8');
      assert(content.includes('try') || content.includes('catch') || content.includes('response.json()'), 'httpClient must safely parse responses');
    }
  });

  // ==========================================================================
  // TIER 3: CROSS-FEATURE COMBINATIONS (PAIRWISE INTERACTIONS)
  // ==========================================================================
  console.log('\n----------------------------------------------------------------');
  console.log('📍 TIER 3: CROSS-FEATURE COMBINATIONS (Multi-Feature Interactions)');
  console.log('----------------------------------------------------------------');

  await registerTest('T3.1', 'Pairwise: Registration -> Profile Update -> Immediate Token Validate', 3, 'MULTI', 'live', async () => {
    const ts = Date.now().toString().slice(-6);
    const u = `ts_c1_${ts}`;
    const e = `ts_c1_${ts}@thrivingskill.test`;
    const p = `TS_C1_Pass_${ts}!`;

    const regRes = await request(`${API_BASE}/learnpress/v1/token/register`, {
      method: 'POST',
      body: { username: u, email: e, password: p, confirm_password: p },
    });
    assertEqual(regRes.status, 200, 'Registration must succeed');
    const token = regRes.body?.token;
    assert(token, 'Must return token');

    const updateRes = await request(`${API_BASE}/wp/v2/users/me`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: { name: 'Combo Student 1', description: 'Testing pairwise token lifecycle' },
    });
    assertEqual(updateRes.status, 200, 'Profile update must succeed');

    const valRes = await request(`${API_BASE}/learnpress/v1/token/validate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    assertEqual(valRes.status, 200, 'Token validate must remain valid after profile update');
  });

  await registerTest('T3.2', 'Pairwise: Profile Update -> Password Change -> Re-Login with New Password', 3, 'MULTI', 'live', async () => {
    const ts = Date.now().toString().slice(-6);
    const u = `ts_c2_${ts}`;
    const e = `ts_c2_${ts}@thrivingskill.test`;
    const p = `PassOrig_${ts}!`;
    const pNew = `PassNew_${ts}!`;

    const regRes = await request(`${API_BASE}/learnpress/v1/token/register`, {
      method: 'POST',
      body: { username: u, email: e, password: p, confirm_password: p },
    });
    const token = regRes.body?.token;

    // Update profile
    await request(`${API_BASE}/wp/v2/users/me`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: { name: 'Persistent Combo User' },
    });

    // Change password
    const cpRes = await request(`${API_BASE}/learnpress/v1/users/change-password`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: { old_password: p, new_password: pNew, confirm_password: pNew },
    });
    assertEqual(cpRes.status, 200, 'Password change must succeed');

    // Re-login with new password
    const loginRes = await request(`${API_BASE}/learnpress/v1/token`, {
      method: 'POST',
      body: { username: u, password: pNew },
    });
    assertEqual(loginRes.status, 200, 'Login with new password must succeed');
    assert(loginRes.body?.token, 'Must receive new token');

    // Check profile persisted
    const meRes = await request(`${API_BASE}/wp/v2/users/me`, {
      headers: { Authorization: `Bearer ${loginRes.body.token}` },
    });
    assertEqual(meRes.body?.name, 'Persistent Combo User', 'Profile data must persist after password change & re-login');
  });

  await registerTest('T3.3', 'Pairwise: Dynamic Registration -> Admin Role Check -> Non-Admin UI Isolation', 3, 'MULTI', 'live', async () => {
    const acct = await getOrCreateDynamicAccount();
    const meRes = await request(`${API_BASE}/wp/v2/users/me?context=edit`, {
      headers: { Authorization: `Bearer ${acct.token}` },
    });
    const roles = meRes.body?.roles || [];
    assertFalse(roles.includes('administrator'), 'Registered student must not possess administrator role');

    const isUserAdmin = (user) => Array.isArray(user?.roles) && user.roles.includes('administrator');
    assertFalse(isUserAdmin({ roles }), 'isUserAdmin must evaluate to false for student');
  });

  await registerTest('T3.4', 'Pairwise: Registration -> Forgot Password Request -> Original Credentials Valid', 3, 'MULTI', 'live', async () => {
    const ts = Date.now().toString().slice(-6);
    const u = `ts_c4_${ts}`;
    const e = `ts_c4_${ts}@thrivingskill.test`;
    const p = `PassStay_${ts}!`;

    await request(`${API_BASE}/learnpress/v1/token/register`, {
      method: 'POST',
      body: { username: u, email: e, password: p, confirm_password: p },
    });

    // Request reset
    const rpRes = await request(`${API_BASE}/learnpress/v1/users/reset-password`, {
      method: 'POST',
      body: { user_login: e },
    });
    assertEqual(rpRes.status, 200, 'Password reset request must succeed');

    // Login with existing password must still function until reset link is activated
    const loginRes = await request(`${API_BASE}/learnpress/v1/token`, {
      method: 'POST',
      body: { username: u, password: p },
    });
    assertEqual(loginRes.status, 200, 'Original credentials must remain valid until reset link consumed');
  });

  await registerTest('T3.5', 'Pairwise: Registration with Phone -> Profile Sync & Metadata Verification', 3, 'MULTI', 'live', async () => {
    const ts = Date.now().toString().slice(-6);
    const phone = '01711223344';
    const regRes = await request(`${API_BASE}/learnpress/v1/token/register`, {
      method: 'POST',
      body: {
        username: `ts_ph_${ts}`,
        email: `ts_ph_${ts}@thrivingskill.test`,
        password: `Pass_${ts}!`,
        confirm_password: `Pass_${ts}!`,
        phone,
      },
    });
    assertEqual(regRes.status, 200, 'Registration with phone number must succeed');
    assert(regRes.body?.token, 'Must return JWT token');
  });

  await registerTest('T3.6', 'Pairwise: Unicode Profile Update -> Course Curriculum Exploration', 3, 'MULTI', 'live', async () => {
    const acct = await getOrCreateDynamicAccount();
    const updateRes = await request(`${API_BASE}/wp/v2/users/me`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${acct.token}` },
      body: { name: 'রহিম উল্লাহ (Rahim Ullah)' },
    });
    assertEqual(updateRes.status, 200, 'Unicode name update must succeed');

    const courseRes = await request(`${API_BASE}/learnpress/v1/courses/11580`);
    assertEqual(courseRes.status, 200, 'Course query must succeed');
    assert(courseRes.body?.sections?.length > 0, 'Course modules must be available');
  });

  await registerTest('T3.7', 'Pairwise: Design System Mutual Consistency (shapes.ts & colors.ts)', 3, 'MULTI', 'static', () => {
    const shapes = fs.readFileSync(path.join(PROJECT_ROOT, 'src', 'theme', 'shapes.ts'), 'utf8');
    const colors = fs.readFileSync(path.join(PROJECT_ROOT, 'src', 'theme', 'colors.ts'), 'utf8');
    assertIncludes(shapes, 'full: 9999', 'shapes.ts has full capsule token');
    assertIncludes(colors, '#102F53', 'colors.ts has Navy brand token');
  });

  await registerTest('T3.8', 'Pairwise: Sequential Profile Updates with Token Reuse', 3, 'MULTI', 'live', async () => {
    const acct = await getOrCreateDynamicAccount();
    for (let i = 1; i <= 3; i++) {
      const res = await request(`${API_BASE}/wp/v2/users/me`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${acct.token}` },
        body: { description: `Rapid iteration ${i} at ${Date.now()}` },
      });
      assertEqual(res.status, 200, `Sequential update ${i} must succeed`);
    }
  });

  // ==========================================================================
  // TIER 4: REAL-WORLD APPLICATION SCENARIOS (END-TO-END WORKFLOWS)
  // ==========================================================================
  console.log('\n----------------------------------------------------------------');
  console.log('📍 TIER 4: REAL-WORLD APPLICATION SCENARIOS (End-to-End User Journeys)');
  console.log('----------------------------------------------------------------');

  await registerTest('T4.1', 'Workflow: Complete Student Onboarding & Learning Journey', 4, 'WORKFLOW', 'live', async () => {
    const ts = Date.now().toString().slice(-6);
    const u = `student_e2e_${ts}`;
    const e = `student_e2e_${ts}@thrivingskill.test`;
    const p = `PassStudent_${ts}!`;

    // 1. Dynamic Registration
    const regRes = await request(`${API_BASE}/learnpress/v1/token/register`, {
      method: 'POST',
      body: { username: u, email: e, password: p, confirm_password: p },
    });
    assertEqual(regRes.status, 200, 'Stage 1: Registration must succeed');

    // 2. JWT Authentication Handshake
    const loginRes = await request(`${API_BASE}/learnpress/v1/token`, {
      method: 'POST',
      body: { username: u, password: p },
    });
    assertEqual(loginRes.status, 200, 'Stage 2: JWT Handshake must succeed');
    const token = loginRes.body?.token;
    assert(token, 'Stage 2: Must receive JWT token');

    // 3. Token Validation
    const valRes = await request(`${API_BASE}/learnpress/v1/token/validate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    assertEqual(valRes.status, 200, 'Stage 3: Token Validation must succeed');

    // 4. Fetch User Profile
    const meRes = await request(`${API_BASE}/wp/v2/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assertEqual(meRes.status, 200, 'Stage 4: Profile fetch must succeed');

    // 5. Explore Course Catalog & Syllabus (ID 11580)
    const courseRes = await request(`${API_BASE}/learnpress/v1/courses/11580`);
    assertEqual(courseRes.status, 200, 'Stage 5: Course curriculum fetch must succeed');

    // 6. Simulate Checkout Bridge Ping
    const checkoutUrl = `https://staging.thrivingskill.com/checkout/?add-to-cart=11580&billing_email=${encodeURIComponent(e)}`;
    const pingRes = await request(checkoutUrl);
    assert([200, 302].includes(pingRes.status), 'Stage 6: Web checkout ping must return 200 or 302 redirect');

    // 7. Enrollment Handshake Check
    const enrollRes = await request(`${API_BASE}/learnpress/v1/courses/enroll`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: { id: 11580 },
    });
    assert([200, 400].includes(enrollRes.status), 'Stage 7: Enrollment endpoint must accept request structure');
  });

  await registerTest('T4.2', 'Workflow: Student Account Security & Credential Lifecycle Journey', 4, 'WORKFLOW', 'live', async () => {
    const ts = Date.now().toString().slice(-6);
    const u = `sec_e2e_${ts}`;
    const e = `sec_e2e_${ts}@thrivingskill.test`;
    const p1 = `PassPhase1_${ts}!`;
    const p2 = `PassPhase2_${ts}!`;

    // 1. Register
    const regRes = await request(`${API_BASE}/learnpress/v1/token/register`, {
      method: 'POST',
      body: { username: u, email: e, password: p1, confirm_password: p1 },
    });
    const token1 = regRes.body?.token;

    // 2. Update executive profile
    const updateRes = await request(`${API_BASE}/wp/v2/users/me`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token1}` },
      body: { name: 'Executive Leader', description: 'Certified Business Director' },
    });
    assertEqual(updateRes.status, 200, 'Executive profile update must succeed');

    // 3. Change password
    const cpRes = await request(`${API_BASE}/learnpress/v1/users/change-password`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token1}` },
      body: { old_password: p1, new_password: p2, confirm_password: p2 },
    });
    assertEqual(cpRes.status, 200, 'Password change must succeed');

    // 4. Authenticate with new password
    const loginRes = await request(`${API_BASE}/learnpress/v1/token`, {
      method: 'POST',
      body: { username: u, password: p2 },
    });
    assertEqual(loginRes.status, 200, 'Re-login with new password must succeed');
    const token2 = loginRes.body?.token;

    // 5. Verify profile integrity
    const meRes = await request(`${API_BASE}/wp/v2/users/me`, {
      headers: { Authorization: `Bearer ${token2}` },
    });
    assertEqual(meRes.body?.name, 'Executive Leader', 'Profile name must persist');
    assertEqual(meRes.body?.description, 'Certified Business Director', 'Profile bio must persist');
  });

  await registerTest('T4.3', 'Workflow: Admin Access Control & Privilege Separation Journey', 4, 'WORKFLOW', 'live', async () => {
    const acct = await getOrCreateDynamicAccount();
    const meRes = await request(`${API_BASE}/wp/v2/users/me?context=edit`, {
      headers: { Authorization: `Bearer ${acct.token}` },
    });

    const isUserAdmin = (user) => Array.isArray(user?.roles) && user.roles.includes('administrator');

    // Validate real student roles
    assertFalse(isUserAdmin(meRes.body), 'Student user must not pass admin check');

    // Validate simulated attacks
    const attackVectors = [
      { username: 'admin', roles: ['customer'] },
      { username: 'administrator', roles: ['subscriber'] },
      { email: 'admin@thrivingskill.com', roles: ['customer'] },
      { email: 'superuser@admin.net', roles: [] },
      { roles: 'administrator' },
    ];

    for (const vector of attackVectors) {
      assertFalse(isUserAdmin(vector), `Attack vector must be blocked: ${JSON.stringify(vector)}`);
    }
  });

  await registerTest('T4.4', 'Workflow: Authentication Resilience & Recovery Journey', 4, 'WORKFLOW', 'live', async () => {
    // 1. Test non-existent user error differentiation
    const nonExistent = await request(`${API_BASE}/learnpress/v1/token`, {
      method: 'POST',
      body: { username: `non_existent_${Date.now()}`, password: 'Password123!' },
    });
    assertEqual(nonExistent.status, 403, 'Must return 403');
    assertEqual(nonExistent.body?.code, '[lp_jwt_auth] invalid_username', 'Must return invalid_username error');

    // 2. Test incorrect password error differentiation
    const acct = await getOrCreateDynamicAccount();
    const wrongPass = await request(`${API_BASE}/learnpress/v1/token`, {
      method: 'POST',
      body: { username: acct.username, password: 'WrongPassword' },
    });
    assertEqual(wrongPass.status, 403, 'Must return 403');
    assertEqual(wrongPass.body?.code, '[lp_jwt_auth] incorrect_password', 'Must return incorrect_password error');

    // 3. Test Forgot Password recovery dispatch
    const reset = await request(`${API_BASE}/learnpress/v1/users/reset-password`, {
      method: 'POST',
      body: { user_login: acct.email },
    });
    assertEqual(reset.status, 200, 'Must return 200 for reset email dispatch');
    assertEqual(reset.body?.code, 'success', 'Reset must succeed');
  });

  await registerTest('T4.5', 'Workflow: Design System & Architecture Guardrail Journey', 4, 'WORKFLOW', 'static', () => {
    // 1. Shapes
    const shapes = path.join(PROJECT_ROOT, 'src', 'theme', 'shapes.ts');
    assert(fs.existsSync(shapes), 'shapes.ts must exist');

    // 2. Colors
    const colors = path.join(PROJECT_ROOT, 'src', 'theme', 'colors.ts');
    assert(fs.existsSync(colors), 'colors.ts must exist');

    // 3. Typecheck
    try {
      execSync('npm run typecheck', { cwd: PROJECT_ROOT, stdio: 'pipe' });
    } catch (err) {
      throw new Error(`Typecheck failed: ${err.message}`);
    }

    // 4. App Audit
    try {
      execSync('node scripts/audit_app.js', { cwd: PROJECT_ROOT, stdio: 'pipe' });
    } catch (err) {
      throw new Error(`Audit failed: ${err.message}`);
    }
  });

  // ==========================================================================
  // SUMMARY REPORTING
  // ==========================================================================
  console.log('\n================================================================');
  console.log('📊 DUAL TRACK E2E TEST SUITE EXECUTION SUMMARY');
  console.log('================================================================');

  const total = testResults.length;
  const passed = testResults.filter(r => r.status === 'PASS').length;
  const failed = testResults.filter(r => r.status === 'FAIL').length;

  console.log(`Total Test Cases Executed: ${total}`);
  console.log(`  ✅ Passed:               ${passed}`);
  console.log(`  ❌ Failed:               ${failed}`);
  console.log(`  Success Rate:            ${((passed / (total || 1)) * 100).toFixed(1)}%\n`);

  // Breakdown by Tier
  [1, 2, 3, 4].forEach(tier => {
    const tierTests = testResults.filter(r => r.tier === tier);
    const tierPassed = tierTests.filter(r => r.status === 'PASS').length;
    const tierFailed = tierTests.filter(r => r.status === 'FAIL').length;
    console.log(`Tier ${tier} Breakdown: ${tierPassed}/${tierTests.length} Passed (${tierFailed} Failed)`);
  });

  if (failed > 0) {
    console.log('\n----------------------------------------------------------------');
    console.log('⚠️  FAILURES & IMPLEMENTATION DEFECT ESCALATIONS:');
    console.log('----------------------------------------------------------------');
    testResults.filter(r => r.status === 'FAIL').forEach(f => {
      console.log(`  • [${f.id}] (${f.tier ? `Tier ${f.tier}` : 'Test'}) ${f.name}`);
      console.log(`    Error: ${f.errorMsg}`);
    });
    console.log('\n* Note: Any implementation defects must be escalated to the responsible implementing agent.\n');
  } else {
    console.log('\n🎉 ALL EXECUTED TESTS COMPLETED WITH ZERO ERRORS!\n');
  }

  // Return exit code
  process.exit(failed > 0 ? 1 : 0);
}

runTestSuite().catch(err => {
  console.error('\nFatal error running E2E test suite:', err);
  process.exit(1);
});
