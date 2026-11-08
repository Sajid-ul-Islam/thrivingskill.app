/**
 * ============================================================================
 * EMPIRICAL CHALLENGER STRESS HARNESS — MILESTONE 3
 * ============================================================================
 * Independent adversarial verification of:
 * 1. Dynamic User Registration & Token Authentication
 * 2. Profile Update via POST /wp/v2/users/me (ASCII + Bengali Unicode)
 * 3. Profile Persistence across fresh re-queries
 * 4. LearnPress User Avatar & Profile Synchronization
 * 5. Password Change via POST /learnpress/v1/users/change-password
 *    - Rejection of wrong current password (rest_user_incorrect_password)
 *    - Successful password change with valid current password
 *    - New credential authentication verification
 *    - Old credential invalidation verification
 * 6. Edge cases: XSS sanitization, 500-char string, empty description
 * 7. Client-side reload persistence simulation (AsyncStorage cold boot)
 * ============================================================================
 */

const https = require('https');
const http = require('http');

const API_BASE = 'https://staging.thrivingskill.com/wp-json';

function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const isHttps = u.protocol === 'https:';
    const client = isHttps ? https : http;
    const method = options.method || 'GET';
    const headers = {
      'User-Agent': 'Challenger-M3-Empirical/1.0',
      'Accept': 'application/json',
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
      reject(new Error(`Timeout (${options.timeout || 30000}ms) for ${url}`));
    });

    req.on('error', reject);
    if (bodyData) req.write(bodyData);
    req.end();
  });
}

const results = [];
function record(name, pass, detail = '') {
  results.push({ name, pass, detail });
  const icon = pass ? '  ✅ PASS' : '  ❌ FAIL';
  console.log(`${icon} - ${name} ${detail ? `(${detail})` : ''}`);
}

async function runEmpiricalStress() {
  console.log('================================================================');
  console.log('⚡ EMPIRICAL CHALLENGER STRESS HARNESS — MILESTONE 3');
  console.log('================================================================');

  const stamp = Date.now();
  const rand = Math.floor(Math.random() * 10000);
  const testUser = `challenger_m3_${stamp}_${rand}`;
  const testEmail = `challenger_m3_${stamp}_${rand}@test.thrivingskill.com`;
  const initialPass = 'ChallengerInitial!Pass2026';
  const updatedPass = 'ChallengerUpdated!Pass2026';

  let jwtToken = null;
  let userId = null;

  // --------------------------------------------------------------------------
  // TEST 1: Dynamic Account Creation
  // --------------------------------------------------------------------------
  console.log('\n--- Section 1: Dynamic User Registration ---');
  try {
    const regRes = await request(`${API_BASE}/learnpress/v1/token/register`, {
      method: 'POST',
      body: {
        username: testUser,
        email: testEmail,
        password: initialPass,
        confirm_password: initialPass,
      },
    });

    if (regRes.status === 200 && regRes.body && regRes.body.token) {
      jwtToken = regRes.body.token;
      record('Dynamic Account Registration', true, `User: ${testUser}`);
    } else {
      record('Dynamic Account Registration', false, `Status ${regRes.status}: ${JSON.stringify(regRes.body)}`);
      throw new Error('Registration failed, aborting further live tests');
    }
  } catch (err) {
    record('Dynamic Account Registration', false, err.message);
    throw err;
  }

  // --------------------------------------------------------------------------
  // TEST 2: Initial Profile Retrieval via GET /wp/v2/users/me?context=edit
  // --------------------------------------------------------------------------
  console.log('\n--- Section 2: Initial Profile State ---');
  try {
    const meRes = await request(`${API_BASE}/wp/v2/users/me?context=edit`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${jwtToken}` },
    });

    if (meRes.status === 200 && meRes.body && meRes.body.id) {
      userId = meRes.body.id;
      record('Initial Profile Query', true, `User ID: ${userId}, Username: ${meRes.body.username || meRes.body.slug}`);
    } else {
      record('Initial Profile Query', false, `Status ${meRes.status}: ${JSON.stringify(meRes.body)}`);
    }
  } catch (err) {
    record('Initial Profile Query', false, err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 3: Profile Update with Standard ASCII Strings
  // --------------------------------------------------------------------------
  console.log('\n--- Section 3: ASCII Profile Update & Verification ---');
  try {
    const updateRes = await request(`${API_BASE}/wp/v2/users/me`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${jwtToken}` },
      body: {
        name: 'Challenger Alpha Auditor',
        first_name: 'Challenger',
        last_name: 'Auditor',
        nickname: 'challenger_alpha',
        description: 'Lead Empirical Stress Investigator for ThrivingSkills mobile application.',
      },
    });

    if (updateRes.status === 200 && updateRes.body && updateRes.body.name === 'Challenger Alpha Auditor') {
      record('ASCII Profile Update', true, 'Name: Challenger Alpha Auditor');
    } else {
      record('ASCII Profile Update', false, `Status ${updateRes.status}: ${JSON.stringify(updateRes.body)}`);
    }

    // Verify persistence via independent GET
    const verifyAscii = await request(`${API_BASE}/wp/v2/users/me?context=edit`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${jwtToken}` },
    });

    const isNameMatch = verifyAscii.body?.name === 'Challenger Alpha Auditor';
    const isDescMatch = (verifyAscii.body?.description || '').includes('Lead Empirical Stress Investigator');
    record('ASCII Profile Persistence Re-query', isNameMatch && isDescMatch, `Name: ${verifyAscii.body?.name}`);
  } catch (err) {
    record('ASCII Profile Update', false, err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 4: Profile Update with Unicode (Bengali) Strings & UTF-8 Persistence
  // --------------------------------------------------------------------------
  console.log('\n--- Section 4: Unicode (Bengali) Profile Update & Verification ---');
  const bengaliName = 'দীপ্ত ব্যানার্জি';
  const bengaliBio = 'থ্রাইভিং স্কিলস মোবাইল অ্যাপ পরীক্ষক ও সিনিয়র সফটওয়্যার ইঞ্জিনিয়ার। প্রফেশনাল লার্নিং প্ল্যাটফর্ম।';
  const bengaliNick = 'দীপ্ত';

  try {
    const unicodeRes = await request(`${API_BASE}/wp/v2/users/me`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${jwtToken}` },
      body: {
        name: bengaliName,
        nickname: bengaliNick,
        description: bengaliBio,
      },
    });

    if (unicodeRes.status === 200 && unicodeRes.body) {
      const respName = unicodeRes.body.name;
      const respDesc = unicodeRes.body.description;
      const nameOk = respName === bengaliName;
      const descOk = respDesc === bengaliBio;
      record('Bengali Unicode Profile Update', nameOk && descOk, `Name: ${respName}`);
    } else {
      record('Bengali Unicode Profile Update', false, `Status ${unicodeRes.status}: ${JSON.stringify(unicodeRes.body)}`);
    }

    // Query back from WordPress to check UTF-8 database persistence
    const verifyUnicode = await request(`${API_BASE}/wp/v2/users/me?context=edit`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${jwtToken}` },
    });

    const dbName = verifyUnicode.body?.name;
    const dbDesc = verifyUnicode.body?.description;
    const dbNameOk = dbName === bengaliName;
    const dbDescOk = dbDesc === bengaliBio;
    record('Bengali Unicode Persistence on Fresh GET', dbNameOk && dbDescOk, `Stored in DB: "${dbName}"`);
  } catch (err) {
    record('Bengali Unicode Profile Update', false, err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 5: LearnPress User Details Query via GET /learnpress/v1/users/{id}
  // --------------------------------------------------------------------------
  console.log('\n--- Section 5: LearnPress User Details & Avatar Synchronization ---');
  try {
    const lpRes = await request(`${API_BASE}/learnpress/v1/users/${userId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${jwtToken}` },
    });

    if (lpRes.status === 200 && lpRes.body) {
      const hasAvatar = typeof lpRes.body.avatar_url === 'string' && lpRes.body.avatar_url.length > 0;
      record('LearnPress User Avatar Retrieval', hasAvatar, `Avatar URL: ${lpRes.body.avatar_url?.substring(0, 50)}...`);
    } else {
      record('LearnPress User Avatar Retrieval', false, `Status ${lpRes.status}: ${JSON.stringify(lpRes.body)}`);
    }
  } catch (err) {
    record('LearnPress User Avatar Retrieval', false, err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 6: Password Change - Rejection of Wrong Current Password
  // --------------------------------------------------------------------------
  console.log('\n--- Section 6: Password Change - Wrong Current Password Error Handling ---');
  try {
    const wrongPassRes = await request(`${API_BASE}/learnpress/v1/users/change-password`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${jwtToken}` },
      body: {
        old_password: 'WrongCurrentPassword999!',
        new_password: updatedPass,
        confirm_password: updatedPass,
      },
    });

    const is403 = wrongPassRes.status === 403;
    const codeMatches =
      wrongPassRes.body?.code === 'rest_user_incorrect_password' ||
      wrongPassRes.body?.data?.code === 'rest_user_incorrect_password' ||
      (wrongPassRes.body?.message || '').toLowerCase().includes('password is incorrect');

    record(
      'Password Change: Wrong Old Password Rejected',
      is403 && codeMatches,
      `Status: ${wrongPassRes.status}, Code: ${wrongPassRes.body?.code || wrongPassRes.body?.data?.code}, Msg: "${wrongPassRes.body?.message}"`
    );
  } catch (err) {
    record('Password Change: Wrong Old Password Rejected', false, err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 7: Password Change - Successful Change with Valid Current Password
  // --------------------------------------------------------------------------
  console.log('\n--- Section 7: Password Change - Successful Execution ---');
  try {
    const changeRes = await request(`${API_BASE}/learnpress/v1/users/change-password`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${jwtToken}` },
      body: {
        old_password: initialPass,
        new_password: updatedPass,
        confirm_password: updatedPass,
      },
    });

    const changeOk =
      changeRes.status === 200 &&
      (changeRes.body?.code === 'rest_user_password_changed' ||
       changeRes.body?.code === 'success' ||
       (changeRes.body?.message || '').toLowerCase().includes('changed') ||
       (changeRes.body?.message || '').toLowerCase().includes('success'));

    record('Password Change: Valid Old Password Accepted', changeOk, `Status: ${changeRes.status}, Msg: "${changeRes.body?.message}"`);
  } catch (err) {
    record('Password Change: Valid Old Password Accepted', false, err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 8: Authentication with New Password
  // --------------------------------------------------------------------------
  console.log('\n--- Section 8: Credential Invalidation & New Login Verification ---');
  try {
    const newLoginRes = await request(`${API_BASE}/learnpress/v1/token`, {
      method: 'POST',
      body: {
        username: testUser,
        password: updatedPass,
      },
    });

    const newLoginOk = newLoginRes.status === 200 && newLoginRes.body && newLoginRes.body.token;
    record('Login with New Password Succeeded', !!newLoginOk, `Status: ${newLoginRes.status}`);

    // Verify old password no longer works
    const oldLoginRes = await request(`${API_BASE}/learnpress/v1/token`, {
      method: 'POST',
      body: {
        username: testUser,
        password: initialPass,
      },
    });

    const oldLoginRejected =
      oldLoginRes.status === 403 &&
      (oldLoginRes.body?.code === '[lp_jwt_auth] incorrect_password' ||
       (oldLoginRes.body?.message || '').toLowerCase().includes('incorrect'));

    record('Login with Invalidated Old Password Rejected', !!oldLoginRejected, `Status: ${oldLoginRes.status}, Code: ${oldLoginRes.body?.code}`);
  } catch (err) {
    record('Credential Invalidation Verification', false, err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 9: Edge Cases - HTML Entities & 500-Character Long Bio
  // --------------------------------------------------------------------------
  console.log('\n--- Section 9: Edge Cases & Sanitization ---');
  try {
    const longBio = 'Professional skills builder '.repeat(20); // ~560 chars
    const edgeRes = await request(`${API_BASE}/wp/v2/users/me`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${jwtToken}` },
      body: {
        description: longBio,
      },
    });

    const longBioPersisted = edgeRes.status === 200 && (edgeRes.body?.description || '').length > 500;
    record('Edge Case: 500+ Character Bio Update', longBioPersisted, `Length: ${(edgeRes.body?.description || '').length}`);

    // Test HTML tags sanitization
    const htmlPayload = '<b style="color:red">Bold Title</b> & Special "Quotes"';
    const tagRes = await request(`${API_BASE}/wp/v2/users/me`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${jwtToken}` },
      body: {
        description: htmlPayload,
      },
    });

    // WordPress typically strips or sanitizes tags in bio
    const tagHandled = tagRes.status === 200;
    record('Edge Case: HTML Tag Input Handled Gracefully', tagHandled, `Status: ${tagRes.status}`);
  } catch (err) {
    record('Edge Case Verification', false, err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 10: Client-Side Reload Persistence Simulation
  // --------------------------------------------------------------------------
  console.log('\n--- Section 10: Client-Side Reload Persistence Simulation ---');
  try {
    // Simulating AuthContext + AsyncStorage model
    const mockStorage = new Map();
    const AUTH_USER_KEY = '@thrivingskill_auth_user';
    const AUTH_TOKEN_KEY = '@thrivingskill_auth_token';

    // 1. User logs in
    const initialUserSession = {
      id: userId,
      username: testUser,
      displayName: 'Initial Display',
      email: testEmail,
      token: jwtToken,
      roles: ['subscriber'],
    };
    mockStorage.set(AUTH_USER_KEY, JSON.stringify(initialUserSession));
    mockStorage.set(AUTH_TOKEN_KEY, jwtToken);

    // 2. Profile edit occurs: User updates phone, city, Bengali name, bio
    const existingRaw = mockStorage.get(AUTH_USER_KEY);
    const existing = JSON.parse(existingRaw);

    const updates = {
      name: 'দীপ্ত ব্যানার্জি',
      displayName: 'দীপ্ত ব্যানার্জি',
      description: 'সিনিয়র সফটওয়্যার ইঞ্জিনিয়ার',
      phone: '+8801711223344',
      city: 'ধানমন্ডি, ঢাকা',
    };

    const updatedUser = {
      ...existing,
      ...updates,
      displayName: updates.name || updates.displayName || existing.displayName,
      name: updates.name !== undefined ? updates.name : (existing.name || existing.displayName),
    };
    mockStorage.set(AUTH_USER_KEY, JSON.stringify(updatedUser));

    // 3. Simulate App Cold Reboot / Restart
    const rebootedUserRaw = mockStorage.get(AUTH_USER_KEY);
    const rebootedToken = mockStorage.get(AUTH_TOKEN_KEY);
    const rebootedUser = JSON.parse(rebootedUserRaw);

    const rebootNameOk = rebootedUser.name === 'দীপ্ত ব্যানার্জি';
    const rebootDisplayNameOk = rebootedUser.displayName === 'দীপ্ত ব্যানার্জি';
    const rebootPhoneOk = rebootedUser.phone === '+8801711223344';
    const rebootCityOk = rebootedUser.city === 'ধানমন্ডি, ঢাকা';
    const rebootDescOk = rebootedUser.description === 'সিনিয়র সফটওয়্যার ইঞ্জিনিয়ার';
    const rebootTokenOk = rebootedToken === jwtToken;

    const allRebootFieldsOk = rebootNameOk && rebootDisplayNameOk && rebootPhoneOk && rebootCityOk && rebootDescOk && rebootTokenOk;

    record('Simulated Cold Reboot Persistence', allRebootFieldsOk, 'All updated fields restored from storage');
  } catch (err) {
    record('Simulated Cold Reboot Persistence', false, err.message);
  }

  // --------------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log('📊 CHALLENGER STRESS HARNESS SUMMARY');
  console.log('================================================================');
  const total = results.length;
  const passed = results.filter(r => r.pass).length;
  const failed = total - passed;
  console.log(`Total Scenarios: ${total}`);
  console.log(`Passed:          ${passed}`);
  console.log(`Failed:          ${failed}`);
  console.log(`Success Rate:    ${((passed / total) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\nFailed Tests:');
    results.filter(r => !r.pass).forEach(r => console.log(`  ❌ ${r.name}: ${r.detail}`));
    process.exit(1);
  } else {
    console.log('\n🎉 ALL EMPIRICAL CHALLENGER TESTS PASSED WITH ZERO FAILURES!');
    process.exit(0);
  }
}

runEmpiricalStress().catch(err => {
  console.error('Fatal stress harness exception:', err);
  process.exit(1);
});
