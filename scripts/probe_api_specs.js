const https = require('https');

function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const method = options.method || 'GET';
    const headers = { ...options.headers };
    let bodyData = null;

    if (options.body) {
      bodyData = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
      headers['Content-Length'] = Buffer.byteLength(bodyData);
    }

    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method,
      headers,
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

    req.on('error', reject);
    if (bodyData) req.write(bodyData);
    req.end();
  });
}

async function probe() {
  console.log('================================================================');
  console.log('🔍 SPECIFICATION MINING: WORDPRESS & LEARNPRESS REST API PROBE');
  console.log('================================================================\n');

  const BASE = 'https://staging.thrivingskill.com/wp-json';

  // 1. Probe API Root / Routes Discovery
  console.log('--- 1. Probing Namespaces & Route Availability ---');
  try {
    const rootRes = await request(BASE);
    console.log(`Root status: ${rootRes.status}`);
    const routes = rootRes.body?.routes ? Object.keys(rootRes.body.routes) : [];
    console.log(`Total routes found: ${routes.length}`);
    const lpRoutes = routes.filter(r => r.includes('learnpress') || r.includes('wp/v2/user') || r.includes('lostpassword') || r.includes('password'));
    console.log('Relevant routes:', lpRoutes);
  } catch (e) {
    console.error('Root error:', e.message);
  }

  // 2. Probe LearnPress Token (Authentication Error Handling)
  console.log('\n--- 2. Probing /learnpress/v1/token Error Cases ---');
  // 2a: Non-existent user
  try {
    const nonExistentRes = await request(`${BASE}/learnpress/v1/token`, {
      method: 'POST',
      body: { username: 'non_existent_user_999999', password: 'SomePassword123!' }
    });
    console.log('2a. Non-existent user response:', {
      status: nonExistentRes.status,
      body: nonExistentRes.body
    });
  } catch (e) {
    console.error('2a error:', e.message);
  }

  // 2b: Empty credentials
  try {
    const emptyRes = await request(`${BASE}/learnpress/v1/token`, {
      method: 'POST',
      body: { username: '', password: '' }
    });
    console.log('2b. Empty credentials response:', {
      status: emptyRes.status,
      body: emptyRes.body
    });
  } catch (e) {
    console.error('2b error:', e.message);
  }

  // 3. Register a test user for testing valid vs invalid password & profile
  console.log('\n--- 3. Registering Non-Destructive Test Account ---');
  const testId = Date.now().toString().slice(-6);
  const testUsername = `ts_spec_${testId}`;
  const testEmail = `ts_spec_${testId}@thrivingskill.test`;
  const testPassword = `TS_TestPass_${testId}!`;
  let authToken = null;
  let testUserId = null;

  try {
    const regRes = await request(`${BASE}/learnpress/v1/token/register`, {
      method: 'POST',
      body: {
        username: testUsername,
        email: testEmail,
        password: testPassword,
        confirm_password: testPassword,
      }
    });
    console.log('Register response:', {
      status: regRes.status,
      body: regRes.body
    });
  } catch (e) {
    console.error('Register error:', e.message);
  }

  // 4. Test Existing User with WRONG Password
  console.log('\n--- 4. Probing Wrong Password for Existing User ---');
  try {
    const wrongPassRes = await request(`${BASE}/learnpress/v1/token`, {
      method: 'POST',
      body: { username: testUsername, password: 'WrongPassword999!' }
    });
    console.log('4. Wrong password response:', {
      status: wrongPassRes.status,
      body: wrongPassRes.body
    });
  } catch (e) {
    console.error('4 error:', e.message);
  }

  // 5. Test Successful Token Generation
  console.log('\n--- 5. Probing Successful Token Generation ---');
  try {
    const loginRes = await request(`${BASE}/learnpress/v1/token`, {
      method: 'POST',
      body: { username: testUsername, password: testPassword }
    });
    console.log('5. Successful login response:', {
      status: loginRes.status,
      body: loginRes.body
    });
    if (loginRes.body?.token) {
      authToken = loginRes.body.token;
    }
  } catch (e) {
    console.error('5 error:', e.message);
  }

  // 6. Token validation endpoint
  if (authToken) {
    console.log('\n--- 6. Probing /learnpress/v1/token/validate ---');
    try {
      const valRes = await request(`${BASE}/learnpress/v1/token/validate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('Validate response:', {
        status: valRes.status,
        body: valRes.body
      });
    } catch (e) {
      console.error('Validate error:', e.message);
    }
  }

  // 7. Probe /wp/v2/users/me (Fetch and Update Profile & Role Inspection)
  if (authToken) {
    console.log('\n--- 7. Probing /wp/v2/users/me GET & PUT ---');
    try {
      const meRes = await request(`${BASE}/wp/v2/users/me`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('7a. /wp/v2/users/me GET response:', {
        status: meRes.status,
        body: meRes.body
      });
      if (meRes.body?.id) {
        testUserId = meRes.body.id;
      }
    } catch (e) {
      console.error('7a error:', e.message);
    }

    // Test profile update via /wp/v2/users/me
    try {
      const updateRes = await request(`${BASE}/wp/v2/users/me`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
        body: {
          name: 'Spec Test User Updated',
          description: 'Updated bio from spec probe test.',
          nickname: 'SpecNickname'
        }
      });
      console.log('7b. /wp/v2/users/me POST update response:', {
        status: updateRes.status,
        body: {
          id: updateRes.body?.id,
          name: updateRes.body?.name,
          description: updateRes.body?.description,
          nickname: updateRes.body?.nickname,
          slug: updateRes.body?.slug,
          roles: updateRes.body?.roles,
        }
      });
    } catch (e) {
      console.error('7b error:', e.message);
    }
  }

  // 8. Probe /learnpress/v1/users/{id}
  if (testUserId) {
    console.log(`\n--- 8. Probing /learnpress/v1/users/${testUserId} ---`);
    try {
      const lpUserRes = await request(`${BASE}/learnpress/v1/users/${testUserId}`, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      });
      console.log('8. /learnpress/v1/users/{id} GET response:', {
        status: lpUserRes.status,
        body: lpUserRes.body
      });
    } catch (e) {
      console.error('8 error:', e.message);
    }
  }

  // 9. Probe Password Reset & Recovery Endpoints
  console.log('\n--- 9. Probing Password Reset & Recovery Endpoints ---');
  // 9a: /learnpress/v1/users/reset-password
  try {
    const lpResetRes = await request(`${BASE}/learnpress/v1/users/reset-password`, {
      method: 'POST',
      body: { user_login: testEmail }
    });
    console.log('9a. /learnpress/v1/users/reset-password (with testEmail):', {
      status: lpResetRes.status,
      body: lpResetRes.body
    });
  } catch (e) {
    console.error('9a error:', e.message);
  }

  // 9b: /learnpress/v1/users/reset-password with invalid user
  try {
    const lpResetInvalid = await request(`${BASE}/learnpress/v1/users/reset-password`, {
      method: 'POST',
      body: { user_login: 'non_existent_email_12345@thrivingskill.test' }
    });
    console.log('9b. /learnpress/v1/users/reset-password (invalid user):', {
      status: lpResetInvalid.status,
      body: lpResetInvalid.body
    });
  } catch (e) {
    console.error('9b error:', e.message);
  }

  // 9c: Probe WordPress core lost password endpoints if any
  try {
    const wpLostRes = await request(`${BASE}/wp/v2/users/lostpassword`, {
      method: 'POST',
      body: { user_login: testEmail }
    });
    console.log('9c. /wp/v2/users/lostpassword:', {
      status: wpLostRes.status,
      body: wpLostRes.body
    });
  } catch (e) {
    console.error('9c error:', e.message);
  }

  // 10. Probe /learnpress/v1/users/change-password
  if (authToken) {
    console.log('\n--- 10. Probing /learnpress/v1/users/change-password ---');
    try {
      const changePassRes = await request(`${BASE}/learnpress/v1/users/change-password`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
        body: {
          old_password: testPassword,
          new_password: `${testPassword}_NEW`,
          confirm_password: `${testPassword}_NEW`,
        }
      });
      console.log('10. /learnpress/v1/users/change-password response:', {
        status: changePassRes.status,
        body: changePassRes.body
      });
    } catch (e) {
      console.error('10 error:', e.message);
    }
  }

  console.log('\n================================================================');
  console.log('✅ PROBING COMPLETE');
  console.log('================================================================');
}

probe().catch(console.error);
