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

async function probeDetails() {
  console.log('================================================================');
  console.log('🔍 DEEP PROBE: CONTEXT=EDIT, ROLES, PROFILE UPDATES, PHONE META');
  console.log('================================================================\n');

  const BASE = 'https://staging.thrivingskill.com/wp-json';

  // Create fresh test user
  const testId = Date.now().toString().slice(-6);
  const testUsername = `ts_probe_${testId}`;
  const testEmail = `ts_probe_${testId}@thrivingskill.test`;
  const testPassword = `TS_Pass_${testId}!`;

  console.log(`Creating user ${testUsername}...`);
  const regRes = await request(`${BASE}/learnpress/v1/token/register`, {
    method: 'POST',
    body: {
      username: testUsername,
      email: testEmail,
      password: testPassword,
      confirm_password: testPassword,
      phone: '01712345678',
    }
  });

  const token = regRes.body?.token;
  const userId = regRes.body?.user_id;
  console.log('Registered:', { status: regRes.status, userId, hasToken: !!token });

  if (!token) {
    console.error('No token, aborting');
    return;
  }

  // 1. Probe /wp/v2/users/me?context=edit
  console.log('\n--- 1. Testing GET /wp/v2/users/me?context=edit ---');
  const meEditRes = await request(`${BASE}/wp/v2/users/me?context=edit`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('1. /wp/v2/users/me?context=edit status:', meEditRes.status);
  console.log('1. Keys returned:', Object.keys(meEditRes.body || {}));
  console.log('1. Roles:', meEditRes.body?.roles);
  console.log('1. Capabilities:', meEditRes.body?.capabilities);
  console.log('1. Extra capabilities:', meEditRes.body?.extra_capabilities);
  console.log('1. Email:', meEditRes.body?.email);

  // 2. Probe updating email and profile fields via /wp/v2/users/me
  console.log('\n--- 2. Testing Profile Update via POST /wp/v2/users/me ---');
  const updateRes1 = await request(`${BASE}/wp/v2/users/me`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: {
      name: 'Dr. Shahriar Khan',
      first_name: 'Shahriar',
      last_name: 'Khan',
      description: 'Senior Business Strategist and Executive Coach.',
      nickname: 'Shahriar',
    }
  });
  console.log('2. Profile name/bio update:', {
    status: updateRes1.status,
    name: updateRes1.body?.name,
    first_name: updateRes1.body?.first_name,
    last_name: updateRes1.body?.last_name,
    description: updateRes1.body?.description,
    roles: updateRes1.body?.roles,
  });

  // 3. Test updating user meta or phone via /wp/v2/users/me
  console.log('\n--- 3. Testing Phone Update via meta/billing ---');
  const updateMetaRes = await request(`${BASE}/wp/v2/users/me`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: {
      meta: {
        phone: '01812345678',
        billing_phone: '01812345678',
      }
    }
  });
  console.log('3. Meta update response:', {
    status: updateMetaRes.status,
    meta: updateMetaRes.body?.meta,
    error: updateMetaRes.body?.message,
    code: updateMetaRes.body?.code,
  });

  // 4. Test PUT/POST on /learnpress/v1/users/{id}
  console.log(`\n--- 4. Testing PUT/POST /learnpress/v1/users/${userId} ---`);
  const lpUpdateRes = await request(`${BASE}/learnpress/v1/users/${userId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: {
      name: 'Updated via LP',
      bio: 'LP bio',
      phone: '01912345678'
    }
  });
  console.log('4. LP user update POST:', {
    status: lpUpdateRes.status,
    body: lpUpdateRes.body
  });

  // 5. Test Change Password Error Scenarios
  console.log('\n--- 5. Testing /learnpress/v1/users/change-password errors ---');
  // 5a: Wrong old password
  const cpWrongOld = await request(`${BASE}/learnpress/v1/users/change-password`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: {
      old_password: 'completely_wrong_pass',
      new_password: 'ValidNewPass123!',
      confirm_password: 'ValidNewPass123!',
    }
  });
  console.log('5a. Wrong old password:', {
    status: cpWrongOld.status,
    body: cpWrongOld.body
  });

  // 5b: Password mismatch
  const cpMismatch = await request(`${BASE}/learnpress/v1/users/change-password`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: {
      old_password: testPassword,
      new_password: 'ValidNewPass123!',
      confirm_password: 'MismatchPass123!',
    }
  });
  console.log('5b. Password mismatch:', {
    status: cpMismatch.status,
    body: cpMismatch.body
  });

  // 5c: Unauthenticated change password
  const cpUnauth = await request(`${BASE}/learnpress/v1/users/change-password`, {
    method: 'POST',
    body: {
      old_password: testPassword,
      new_password: 'ValidNewPass123!',
      confirm_password: 'ValidNewPass123!',
    }
  });
  console.log('5c. Unauthenticated change password:', {
    status: cpUnauth.status,
    body: cpUnauth.body
  });

  // 6. Test /learnpress/v1/users/reset-password edge cases
  console.log('\n--- 6. Testing /learnpress/v1/users/reset-password edge cases ---');
  // 6a: empty user_login
  const rpEmpty = await request(`${BASE}/learnpress/v1/users/reset-password`, {
    method: 'POST',
    body: { user_login: '' }
  });
  console.log('6a. Empty user_login:', {
    status: rpEmpty.status,
    body: rpEmpty.body
  });

  // 6b: reset using username instead of email
  const rpUsername = await request(`${BASE}/learnpress/v1/users/reset-password`, {
    method: 'POST',
    body: { user_login: testUsername }
  });
  console.log('6b. Reset with username:', {
    status: rpUsername.status,
    body: rpUsername.body
  });

  console.log('\n================================================================');
  console.log('✅ DEEP PROBING COMPLETE');
  console.log('================================================================');
}

probeDetails().catch(console.error);
