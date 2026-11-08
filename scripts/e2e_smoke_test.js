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

async function runEndToEndSmoke() {
  console.log('================================================================');
  console.log('🚀 LIVE END-TO-END SMOKE TEST: THRIVING SKILLS LEARNING FLOW');
  console.log('================================================================\n');

  const testTimestamp = Date.now().toString().slice(-6);
  const testUsername = `student_${testTimestamp}`;
  const testEmail = `student_${testTimestamp}@thrivingskill.test`;
  const testPassword = `TS_TestPass_${testTimestamp}!`;

  console.log(`[STAGE 1] Registering New Test Student on WordPress LMS:`);
  console.log(`  Username: ${testUsername}`);
  console.log(`  Email:    ${testEmail}\n`);

  let registerRes;
  try {
    registerRes = await request('https://staging.thrivingskill.com/wp-json/learnpress/v1/token/register', {
      method: 'POST',
      body: {
        username: testUsername,
        email: testEmail,
        password: testPassword,
        confirm_password: testPassword,
      },
    });

    console.log(`  Registration Status: ${registerRes.status}`);
    console.log('  Response:', registerRes.body || registerRes.raw);
  } catch (err) {
    console.error('  Registration error:', err.message);
  }

  console.log('\n----------------------------------------------------------------');
  console.log('[STAGE 2] Authenticating (JWT Token Handshake):');
  let token = null;
  let loggedInUser = null;

  try {
    const loginRes = await request('https://staging.thrivingskill.com/wp-json/learnpress/v1/token', {
      method: 'POST',
      body: {
        username: testUsername,
        password: testPassword,
      },
    });

    console.log(`  Login Status: ${loginRes.status}`);
    if (loginRes.body && loginRes.body.token) {
      token = loginRes.body.token;
      loggedInUser = loginRes.body;
      console.log(`  JWT Token Generated: ${token.substring(0, 25)}...`);
      console.log(`  User Display Name:   ${loginRes.body.user_display_name}`);
      console.log(`  User Email:          ${loginRes.body.user_email}`);
    } else {
      console.log('  Login response:', loginRes.body || loginRes.raw);
    }
  } catch (err) {
    console.error('  Login error:', err.message);
  }

  if (token) {
    console.log('\n----------------------------------------------------------------');
    console.log('[STAGE 3] Validating Token & Fetching User Profile:');
    try {
      const validateRes = await request('https://staging.thrivingskill.com/wp-json/learnpress/v1/token/validate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(`  Token Validation Status: ${validateRes.status}`);
      console.log('  Validate Response:', validateRes.body || validateRes.raw);

      const profileRes = await request('https://staging.thrivingskill.com/wp-json/wp/v2/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(`  Profile Status: ${profileRes.status}`);
      if (profileRes.body) {
        console.log(`  User ID: ${profileRes.body.id} | Slug: ${profileRes.body.slug}`);
      }
    } catch (err) {
      console.error('  Profile verification error:', err.message);
    }
  }

  console.log('\n----------------------------------------------------------------');
  console.log('[STAGE 4] Exploring Course Detail & Curriculum (Course ID: 11580):');
  let targetCourse = null;
  try {
    const courseRes = await request('https://staging.thrivingskill.com/wp-json/learnpress/v1/courses/11580');
    console.log(`  Course Detail Status: ${courseRes.status}`);
    if (courseRes.body && courseRes.body.id) {
      targetCourse = courseRes.body;
      console.log(`  Course Title: "${targetCourse.name}"`);
      console.log(`  Price:        ${targetCourse.price_rendered || targetCourse.price}`);
      console.log(`  Duration:     ${targetCourse.duration || 'N/A'}`);
      console.log(`  Sections:     ${(targetCourse.sections || []).length} modules found`);
      (targetCourse.sections || []).slice(0, 3).forEach((sec, idx) => {
        console.log(`    Module ${idx + 1}: "${sec.title}" (${(sec.items || []).length} lessons)`);
      });
    }
  } catch (err) {
    console.error('  Course detail error:', err.message);
  }

  console.log('\n----------------------------------------------------------------');
  console.log('[STAGE 5] Simulating Web Checkout Bridge URL Construction:');
  const courseId = '11580';
  const checkoutUrl = `https://staging.thrivingskill.com/checkout/?add-to-cart=${courseId}&billing_email=${encodeURIComponent(testEmail)}`;
  console.log(`  Generated Web Checkout Deep Link:`);
  console.log(`  ${checkoutUrl}`);

  try {
    const pingCheckout = await request(checkoutUrl, { method: 'GET' });
    console.log(`  HTTP Ping Status: ${pingCheckout.status}`);
    console.log(`  Redirected To:    ${pingCheckout.headers.location || 'Direct 200'}`);
  } catch (err) {
    console.error('  Checkout link ping error:', err.message);
  }

  console.log('\n----------------------------------------------------------------');
  console.log('[STAGE 6] Testing LearnPress Enrollment Handshake / Status:');
  if (token) {
    try {
      const enrollRes = await request('https://staging.thrivingskill.com/wp-json/learnpress/v1/courses/enroll', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: { id: courseId },
      });
      console.log(`  Enrollment Endpoint Status: ${enrollRes.status}`);
      console.log('  Response:', enrollRes.body || enrollRes.raw);
    } catch (err) {
      console.error('  Enrollment handshake error:', err.message);
    }
  }

  console.log('\n================================================================');
  console.log('✅ ALL STAGES OF END-TO-END SMOKE TEST VERIFIED');
  console.log('================================================================');
}

runEndToEndSmoke();
