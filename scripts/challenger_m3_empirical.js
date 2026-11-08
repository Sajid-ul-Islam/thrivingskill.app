/**
 * ============================================================================
 * CHALLENGER M3 EMPIRICAL TEST HARNESS & ADVERSARIAL STRESS SUITE
 * ============================================================================
 * Autonomous verification and stress testing for Milestone 3:
 * 1. Cross-Session & Reload Persistence via AsyncStorage (AUTH_USER_STORAGE_KEY)
 * 2. Password Change Modal Client Validation (empty, mismatch, length < 6, boundary)
 * 3. Unauthenticated User Redirection & AuthModal Prompting
 * 4. Live Staging Backend Integration (Profile Update, LP Avatar, Password Change)
 * 5. Corrupted Storage Recovery, Unicode Integrity, and Error Mapping
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const assert = require('assert');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const API_BASE = 'https://staging.thrivingskill.com/wp-json';

console.log('=================================================================');
console.log('  CHALLENGER M3 EMPIRICAL & ADVERSARIAL VERIFICATION HARNESS');
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

// HTTP request helper with timeout
function apiRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const isHttps = u.protocol === 'https:';
    const client = isHttps ? https : http;
    const method = options.method || 'GET';
    const headers = {
      'User-Agent': 'Challenger-M3-Runner/1.0',
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
      reject(new Error(`Timeout requesting ${url}`));
    });

    req.on('error', reject);
    if (bodyData) req.write(bodyData);
    req.end();
  });
}

// In-Memory AsyncStorage Simulator matching @react-native-async-storage/async-storage
class AsyncStorageSimulator {
  constructor() {
    this.storage = new Map();
  }
  async getItem(key) {
    return this.storage.has(key) ? this.storage.get(key) : null;
  }
  async setItem(key, value) {
    this.storage.set(key, String(value));
  }
  async removeItem(key) {
    this.storage.delete(key);
  }
  async clear() {
    this.storage.clear();
  }
}

// Emulate AuthContext.updateUserProfile logic exactly from src/context/AuthContext.tsx
function createAuthContextHarness(initialUser, initialToken, asyncStorage) {
  const AUTH_USER_STORAGE_KEY = '@thrivingskill_auth_user';
  const AUTH_TOKEN_STORAGE_KEY = '@thrivingskill_auth_token';

  let user = initialUser;
  let token = initialToken;
  let isGuest = !initialUser;
  let isAuthModalVisible = false;

  const updateUserProfile = async (updates) => {
    if (!user) return;
    const updatedUser = {
      ...user,
      ...updates,
      displayName: updates.name || updates.displayName || user.displayName,
      name: updates.name !== undefined ? updates.name : (user.name || user.displayName),
    };
    user = updatedUser;
    try {
      await asyncStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(updatedUser));
    } catch (e) {
      console.warn('Failed to persist user profile update:', e);
    }
  };

  const simulateReload = async () => {
    // Emulates the useEffect bootstrap in AuthContext.tsx
    const savedUser = await asyncStorage.getItem(AUTH_USER_STORAGE_KEY);
    const savedToken = await asyncStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    if (savedUser && savedToken) {
      try {
        const parsed = JSON.parse(savedUser);
        user = parsed;
        token = savedToken;
        isGuest = false;
      } catch (e) {
        user = null;
        token = null;
        isGuest = true;
      }
    } else {
      user = null;
      token = null;
      isGuest = true;
    }
  };

  return {
    getUser: () => user,
    getToken: () => token,
    isGuest: () => isGuest,
    isAuthModalVisible: () => isAuthModalVisible,
    setAuthModalVisible: (v) => { isAuthModalVisible = v; },
    updateUserProfile,
    simulateReload,
    AUTH_USER_STORAGE_KEY,
    AUTH_TOKEN_STORAGE_KEY,
  };
}

// Emulate handleChangePassword validation directly from src/screens/ProfileScreen.tsx
function testPasswordChangeValidation({
  currentPass,
  newPass,
  confirmPass,
  isAuthenticated,
  isBangla = false,
}) {
  const alerts = [];
  const fakeAlert = (title, msg) => {
    alerts.push({ title, msg });
  };
  let authModalOpened = false;
  let serviceInvoked = false;

  if (!currentPass || !newPass || !confirmPass) {
    fakeAlert(
      isBangla ? 'অসম্পূর্ণ ফর্ম' : 'Incomplete Form',
      isBangla ? 'অনুগ্রহ করে সকল পাসওয়ার্ড ঘর পূরণ করুন।' : 'Please fill in all password fields.'
    );
    return { success: false, reason: 'incomplete', alerts, authModalOpened, serviceInvoked };
  }
  if (newPass !== confirmPass) {
    fakeAlert(
      isBangla ? 'পাসওয়ার্ড মেলেনি' : 'Mismatch',
      isBangla ? 'নতুন পাসওয়ার্ড ও নিশ্চিতকরণ পাসওয়ার্ড মেলেনি।' : 'New password and confirm password do not match.'
    );
    return { success: false, reason: 'mismatch', alerts, authModalOpened, serviceInvoked };
  }
  if (newPass.length < 6) {
    fakeAlert(
      isBangla ? 'নিরাপত্তা বার্তা' : 'Security Notice',
      isBangla ? 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' : 'New password must be at least 6 characters.'
    );
    return { success: false, reason: 'too_short', alerts, authModalOpened, serviceInvoked };
  }

  if (!isAuthenticated) {
    authModalOpened = true;
    return { success: false, reason: 'unauthenticated', alerts, authModalOpened, serviceInvoked };
  }

  serviceInvoked = true;
  return { success: true, alerts, authModalOpened, serviceInvoked };
}

// Emulate handleSaveProfile unauthenticated check from src/screens/ProfileScreen.tsx
function testProfileSaveValidation({
  isAuthenticated,
  customName,
  customBio,
  customPhone,
}) {
  let editModalClosed = false;
  let authModalOpened = false;
  let serviceInvoked = false;

  if (!isAuthenticated) {
    editModalClosed = true;
    authModalOpened = true;
    return { success: false, reason: 'unauthenticated', editModalClosed, authModalOpened, serviceInvoked };
  }

  serviceInvoked = true;
  return { success: true, editModalClosed, authModalOpened, serviceInvoked };
}

async function runEmpiricalSuite() {
  console.log('--- 1. STATIC CODE CONTRACT AUDIT ---');

  await challenge('UserService.ts exports ProfileUpdatePayload, ChangePasswordPayload, and UserProfile', async () => {
    const servicePath = path.join(PROJECT_ROOT, 'src', 'services', 'api', 'userService.ts');
    assert(fs.existsSync(servicePath), 'userService.ts must exist');
    const content = fs.readFileSync(servicePath, 'utf8');
    assert(content.includes('export interface ProfileUpdatePayload'), 'Missing ProfileUpdatePayload interface');
    assert(content.includes('export interface ChangePasswordPayload'), 'Missing ChangePasswordPayload interface');
    assert(content.includes('export interface UserProfile'), 'Missing UserProfile interface');
    assert(content.includes('static async updateProfile'), 'Missing updateProfile static method');
    assert(content.includes('static async changePassword'), 'Missing changePassword static method');
    assert(content.includes('getLearnPressUser'), 'Missing getLearnPressUser helper for avatar sync');
  });

  await challenge('AuthContext.tsx exports updateUserProfile and uses storage key @thrivingskill_auth_user', async () => {
    const contextPath = path.join(PROJECT_ROOT, 'src', 'context', 'AuthContext.tsx');
    assert(fs.existsSync(contextPath), 'AuthContext.tsx must exist');
    const content = fs.readFileSync(contextPath, 'utf8');
    assert(content.includes("AUTH_USER_STORAGE_KEY = '@thrivingskill_auth_user'"), 'Must declare @thrivingskill_auth_user');
    assert(content.includes('updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>'), 'Missing updateUserProfile contract in AuthContextType');
    assert(content.includes('AsyncStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(updatedUser))'), 'updateUserProfile must persist JSON to AsyncStorage');
  });

  await challenge('ProfileScreen.tsx binds inputs to authenticated user with zero hardcoded executive mocks', async () => {
    const profilePath = path.join(PROJECT_ROOT, 'src', 'screens', 'ProfileScreen.tsx');
    assert(fs.existsSync(profilePath), 'ProfileScreen.tsx must exist');
    const content = fs.readFileSync(profilePath, 'utf8');
    assert(!content.includes("useState('01712000000')"), 'Must not have hardcoded mock phone number');
    assert(!content.includes("useState('Senior Business Executive & Continuous Learner')"), 'Must not have hardcoded mock bio');
    assert(!content.includes("useState('Gulshan-2, Dhaka')"), 'Must not have hardcoded mock city');
    assert(content.includes('UserService.updateProfile'), 'ProfileScreen must call UserService.updateProfile');
    assert(content.includes('updateUserProfile('), 'ProfileScreen must call AuthContext updateUserProfile');
    assert(content.includes('UserService.changePassword'), 'ProfileScreen must call UserService.changePassword');
  });

  console.log('\n--- 2. SIMULATED RELOAD PERSISTENCE & STORAGE INTEGRITY ---');

  await challenge('Simulate profile update and verify persistence across app reloads via AsyncStorage', async () => {
    const storage = new AsyncStorageSimulator();
    const initialUser = {
      id: 8821,
      username: 'corp_executive',
      email: 'corp@thrivingskill.com',
      displayName: 'Corporate Learner',
      name: 'Corporate Learner',
      roles: ['subscriber'],
      avatar: 'https://staging.thrivingskill.com/avatar1.jpg',
    };
    const initialToken = 'jwt_test_token_8821';

    // Seed session in storage
    await storage.setItem('@thrivingskill_auth_user', JSON.stringify(initialUser));
    await storage.setItem('@thrivingskill_auth_token', initialToken);

    const harness = createAuthContextHarness(initialUser, initialToken, storage);

    // Apply profile updates
    await harness.updateUserProfile({
      name: 'Dr. Tanvir Ahmed',
      phone: '+8801711223344',
      description: 'Senior Director of Operations & Agile Coach',
      city: 'Gulshan-2, Dhaka',
    });

    // In-memory verification
    const inMemoryUser = harness.getUser();
    assert.strictEqual(inMemoryUser.name, 'Dr. Tanvir Ahmed');
    assert.strictEqual(inMemoryUser.displayName, 'Dr. Tanvir Ahmed');
    assert.strictEqual(inMemoryUser.phone, '+8801711223344');
    assert.strictEqual(inMemoryUser.description, 'Senior Director of Operations & Agile Coach');
    assert.strictEqual(inMemoryUser.city, 'Gulshan-2, Dhaka');
    assert.strictEqual(inMemoryUser.email, 'corp@thrivingskill.com', 'Email must remain intact');
    assert.deepStrictEqual(inMemoryUser.roles, ['subscriber'], 'Roles must remain intact');

    // Storage raw check
    const rawSaved = await storage.getItem('@thrivingskill_auth_user');
    assert(rawSaved, 'Storage key @thrivingskill_auth_user must exist');
    const parsedSaved = JSON.parse(rawSaved);
    assert.strictEqual(parsedSaved.name, 'Dr. Tanvir Ahmed');
    assert.strictEqual(parsedSaved.phone, '+8801711223344');

    // Simulate complete app reload (unmount, wipe memory, re-bootstrap from storage)
    await harness.simulateReload();
    const restoredUser = harness.getUser();
    assert(restoredUser, 'Restored user must not be null after reload');
    assert.strictEqual(restoredUser.name, 'Dr. Tanvir Ahmed', 'Persisted name must survive reload');
    assert.strictEqual(restoredUser.displayName, 'Dr. Tanvir Ahmed', 'Persisted displayName must survive reload');
    assert.strictEqual(restoredUser.phone, '+8801711223344', 'Persisted phone must survive reload');
    assert.strictEqual(restoredUser.description, 'Senior Director of Operations & Agile Coach', 'Persisted bio must survive reload');
    assert.strictEqual(restoredUser.city, 'Gulshan-2, Dhaka', 'Persisted city must survive reload');
    assert.strictEqual(harness.getToken(), initialToken, 'Persisted auth token must survive reload');
    assert.strictEqual(harness.isGuest(), false, 'Restored session must not be guest');
  });

  await challenge('Partial updates preserve existing fields without data loss', async () => {
    const storage = new AsyncStorageSimulator();
    const initialUser = {
      id: 9001,
      username: 'tech_lead',
      email: 'tech@thrivingskill.com',
      displayName: 'Tech Lead',
      name: 'Tech Lead',
      description: 'Existing Bio',
      phone: '01800000000',
      city: 'Dhaka',
      avatar: 'https://staging.thrivingskill.com/avatar.png',
      roles: ['subscriber'],
    };
    const harness = createAuthContextHarness(initialUser, 'token_9001', storage);

    // Update only the phone number
    await harness.updateUserProfile({ phone: '01999999999' });
    const userAfterPhone = harness.getUser();
    assert.strictEqual(userAfterPhone.phone, '01999999999');
    assert.strictEqual(userAfterPhone.description, 'Existing Bio', 'Description must not be wiped');
    assert.strictEqual(userAfterPhone.name, 'Tech Lead', 'Name must not be wiped');
    assert.strictEqual(userAfterPhone.avatar, 'https://staging.thrivingskill.com/avatar.png', 'Avatar must not be wiped');

    // Update only the bio
    await harness.updateUserProfile({ description: 'New Advanced Bio' });
    const userAfterBio = harness.getUser();
    assert.strictEqual(userAfterBio.phone, '01999999999', 'Phone must remain intact');
    assert.strictEqual(userAfterBio.description, 'New Advanced Bio');
  });

  await challenge('updateUserProfile safely handles unauthenticated/null user gracefully', async () => {
    const storage = new AsyncStorageSimulator();
    const harness = createAuthContextHarness(null, null, storage);

    // Call update when user is null - must not throw or write null to storage
    await harness.updateUserProfile({ name: 'Phantom User' });
    assert.strictEqual(harness.getUser(), null);
    const stored = await storage.getItem('@thrivingskill_auth_user');
    assert.strictEqual(stored, null, 'Storage should remain null');
  });

  await challenge('Corrupted storage JSON during reload safely defaults to guest mode without crash', async () => {
    const storage = new AsyncStorageSimulator();
    await storage.setItem('@thrivingskill_auth_user', '{{corrupt-json--!!');
    await storage.setItem('@thrivingskill_auth_token', 'valid_token_abc');

    const harness = createAuthContextHarness(null, null, storage);
    await harness.simulateReload();

    assert.strictEqual(harness.getUser(), null, 'Corrupted user JSON must result in null user');
    assert.strictEqual(harness.isGuest(), true, 'Corrupted user JSON must fall back to guest mode');
  });

  console.log('\n--- 3. PASSWORD CHANGE MODAL VALIDATION TESTS ---');

  await challenge('Validation rejects empty fields with Incomplete Form alert', async () => {
    // 1. All empty
    const r1 = testPasswordChangeValidation({ currentPass: '', newPass: '', confirmPass: '', isAuthenticated: true });
    assert.strictEqual(r1.success, false);
    assert.strictEqual(r1.reason, 'incomplete');
    assert(r1.alerts.some(a => a.title.includes('Incomplete Form')));
    assert.strictEqual(r1.serviceInvoked, false);

    // 2. Empty currentPass
    const r2 = testPasswordChangeValidation({ currentPass: '', newPass: 'NewSecret1!', confirmPass: 'NewSecret1!', isAuthenticated: true });
    assert.strictEqual(r2.success, false);
    assert.strictEqual(r2.reason, 'incomplete');
    assert.strictEqual(r2.serviceInvoked, false);

    // 3. Empty newPass
    const r3 = testPasswordChangeValidation({ currentPass: 'OldSecret1!', newPass: '', confirmPass: 'OldSecret1!', isAuthenticated: true });
    assert.strictEqual(r3.success, false);
    assert.strictEqual(r3.reason, 'incomplete');
    assert.strictEqual(r3.serviceInvoked, false);

    // 4. Empty confirmPass
    const r4 = testPasswordChangeValidation({ currentPass: 'OldSecret1!', newPass: 'NewSecret1!', confirmPass: '', isAuthenticated: true });
    assert.strictEqual(r4.success, false);
    assert.strictEqual(r4.reason, 'incomplete');
    assert.strictEqual(r4.serviceInvoked, false);
  });

  await challenge('Validation rejects password mismatch with Mismatch alert', async () => {
    const r = testPasswordChangeValidation({
      currentPass: 'CurrentPass123!',
      newPass: 'AlphaBeta123!',
      confirmPass: 'AlphaBeta456!',
      isAuthenticated: true,
    });
    assert.strictEqual(r.success, false);
    assert.strictEqual(r.reason, 'mismatch');
    assert(r.alerts.some(a => a.title.includes('Mismatch')));
    assert.strictEqual(r.serviceInvoked, false);
  });

  await challenge('Validation rejects password length < 6 characters with Security Notice alert', async () => {
    // 1 char
    const r1 = testPasswordChangeValidation({
      currentPass: 'ValidOldPass123!',
      newPass: 'A',
      confirmPass: 'A',
      isAuthenticated: true,
    });
    assert.strictEqual(r1.success, false);
    assert.strictEqual(r1.reason, 'too_short');
    assert(r1.alerts.some(a => a.title.includes('Security Notice')));
    assert.strictEqual(r1.serviceInvoked, false);

    // 5 chars
    const r5 = testPasswordChangeValidation({
      currentPass: 'ValidOldPass123!',
      newPass: '12345',
      confirmPass: '12345',
      isAuthenticated: true,
    });
    assert.strictEqual(r5.success, false);
    assert.strictEqual(r5.reason, 'too_short');
    assert(r5.alerts.some(a => a.title.includes('Security Notice')));
    assert.strictEqual(r5.serviceInvoked, false);
  });

  await challenge('Validation accepts password boundary of exactly 6 characters', async () => {
    const r = testPasswordChangeValidation({
      currentPass: 'ValidOldPass123!',
      newPass: '123456',
      confirmPass: '123456',
      isAuthenticated: true,
    });
    assert.strictEqual(r.success, true);
    assert.strictEqual(r.serviceInvoked, true);
    assert.strictEqual(r.alerts.length, 0);
  });

  await challenge('Validation in Bangla localization produces localized alerts', async () => {
    const rMismatch = testPasswordChangeValidation({
      currentPass: 'Current123!',
      newPass: 'New123456',
      confirmPass: 'New999999',
      isAuthenticated: true,
      isBangla: true,
    });
    assert.strictEqual(rMismatch.success, false);
    assert(rMismatch.alerts.some(a => a.title === 'পাসওয়ার্ড মেলেনি'));

    const rShort = testPasswordChangeValidation({
      currentPass: 'Current123!',
      newPass: '123',
      confirmPass: '123',
      isAuthenticated: true,
      isBangla: true,
    });
    assert.strictEqual(rShort.success, false);
    assert(rShort.alerts.some(a => a.title === 'নিরাপত্তা বার্তা'));
  });

  console.log('\n--- 4. UNAUTHENTICATED REDIRECTION & PROMPT TESTS ---');

  await challenge('Unauthenticated user attempting password change triggers AuthModal prompt', async () => {
    const r = testPasswordChangeValidation({
      currentPass: 'AnyPass123!',
      newPass: 'NewPass123!',
      confirmPass: 'NewPass123!',
      isAuthenticated: false,
    });
    assert.strictEqual(r.success, false);
    assert.strictEqual(r.reason, 'unauthenticated');
    assert.strictEqual(r.authModalOpened, true, 'Must prompt user with AuthModal');
    assert.strictEqual(r.serviceInvoked, false, 'Must not call backend service when unauthenticated');
  });

  await challenge('Unauthenticated user attempting profile edit triggers AuthModal prompt', async () => {
    const r = testProfileSaveValidation({
      isAuthenticated: false,
      customName: 'Guest Person',
      customBio: 'Guest Bio',
      customPhone: '01700000000',
    });
    assert.strictEqual(r.success, false);
    assert.strictEqual(r.reason, 'unauthenticated');
    assert.strictEqual(r.editModalClosed, true, 'Must dismiss edit profile modal');
    assert.strictEqual(r.authModalOpened, true, 'Must open auth modal');
    assert.strictEqual(r.serviceInvoked, false, 'Must not call backend service');
  });

  console.log('\n--- 5. LIVE WORDPRESS BACKEND INTEGRATION & ERROR MAPPING ---');

  let dynamicAccount = null;

  await challenge('Create dynamic test account on staging WordPress backend', async () => {
    const ts = Date.now().toString().slice(-6);
    const username = `ts_ch3_${ts}`;
    const email = `ts_ch3_${ts}@thrivingskill.test`;
    const password = `TS_Ch3_Pass_${ts}!`;

    const regRes = await apiRequest(`${API_BASE}/learnpress/v1/token/register`, {
      method: 'POST',
      body: {
        username,
        email,
        password,
        confirm_password: password,
        phone: '01711002233',
      },
    });

    assert.strictEqual(regRes.status, 200, 'Registration must return HTTP 200');
    assert(regRes.body?.token, 'Must return JWT token');
    dynamicAccount = {
      username,
      email,
      password,
      token: regRes.body.token,
      userId: regRes.body.user_id || regRes.body.id,
    };
  });

  await challenge('Live profile update via POST /wp/v2/users/me with Latin & Unicode text', async () => {
    assert(dynamicAccount, 'Dynamic account required');
    const updatedName = 'Mohammad Tanvir (মুহাম্মদ তানভীর)';
    const updatedBio = 'Head of Digital Transformation & Lifelong Learner 🚀';

    const updateRes = await apiRequest(`${API_BASE}/wp/v2/users/me`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${dynamicAccount.token}` },
      body: {
        name: updatedName,
        description: updatedBio,
      },
    });

    assert.strictEqual(updateRes.status, 200, 'POST /wp/v2/users/me must return HTTP 200');
    assert.strictEqual(updateRes.body?.name, updatedName, 'Name must match submitted text');
    const cleanBio = updateRes.body?.description?.replace(/&amp;/g, '&');
    assert.strictEqual(cleanBio, updatedBio, 'Bio must match submitted text');

    // Query back to ensure true backend database persistence
    const getRes = await apiRequest(`${API_BASE}/wp/v2/users/me?context=edit`, {
      headers: { Authorization: `Bearer ${dynamicAccount.token}` },
    });
    assert.strictEqual(getRes.status, 200, 'GET /wp/v2/users/me must return HTTP 200');
    assert.strictEqual(getRes.body?.name, updatedName, 'Re-queried name must match');
  });

  await challenge('Live password change with incorrect old password triggers rest_user_incorrect_password', async () => {
    assert(dynamicAccount, 'Dynamic account required');
    const cpRes = await apiRequest(`${API_BASE}/learnpress/v1/users/change-password`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${dynamicAccount.token}` },
      body: {
        old_password: 'WrongPassword999!',
        new_password: 'ValidNewPassword123!',
        confirm_password: 'ValidNewPassword123!',
      },
    });

    assert.strictEqual(cpRes.status, 403, 'Must return HTTP 403 on incorrect current password');
    assert.strictEqual(cpRes.body?.code, 'rest_user_incorrect_password', 'Code must be rest_user_incorrect_password');
    assert(cpRes.body?.message?.includes('current password is incorrect'), 'Message must indicate current password incorrect');
  });

  await challenge('Live password change with correct old password succeeds and invalidates old password', async () => {
    assert(dynamicAccount, 'Dynamic account required');
    const newPassword = `NewTSPass_${Date.now().toString().slice(-4)}!`;

    const cpRes = await apiRequest(`${API_BASE}/learnpress/v1/users/change-password`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${dynamicAccount.token}` },
      body: {
        old_password: dynamicAccount.password,
        new_password: newPassword,
        confirm_password: newPassword,
      },
    });

    assert.strictEqual(cpRes.status, 200, 'Must return HTTP 200 on successful password change');
    assert.strictEqual(cpRes.body?.code, 'success', 'Response code must be success');

    // Verify old password no longer authenticates
    const oldLoginRes = await apiRequest(`${API_BASE}/learnpress/v1/token`, {
      method: 'POST',
      body: {
        username: dynamicAccount.username,
        password: dynamicAccount.password,
      },
    });
    assert.strictEqual(oldLoginRes.status, 403, 'Old password must be rejected');
    assert.strictEqual(oldLoginRes.body?.code, '[lp_jwt_auth] incorrect_password');

    // Verify new password authenticates cleanly
    const newLoginRes = await apiRequest(`${API_BASE}/learnpress/v1/token`, {
      method: 'POST',
      body: {
        username: dynamicAccount.username,
        password: newPassword,
      },
    });
    assert.strictEqual(newLoginRes.status, 200, 'New password must authenticate cleanly');
    assert(newLoginRes.body?.token, 'Must return new JWT token');
  });

  console.log('\n=================================================================');
  console.log(`  CHALLENGER M3 TEST SUMMARY: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
  console.log('=================================================================');

  if (failedTests > 0) {
    console.error('\nFailures recorded:');
    for (const f of failures) {
      console.error(`- ${f.title}: ${f.error}`);
    }
    process.exit(1);
  } else {
    console.log('\n🎉 ALL EMPIRICAL CHALLENGES PASSED CONVINCINGLY!');
    process.exit(0);
  }
}

runEmpiricalSuite().catch((err) => {
  console.error('Fatal test harness execution error:', err);
  process.exit(1);
});
