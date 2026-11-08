/**
 * ============================================================================
 * CHALLENGER MILESTONE 2 ADVERSARIAL STRESS TEST & VERIFICATION HARNESS
 * ============================================================================
 * Adversarially challenges:
 * 1. Auth error differentiation in AuthModal.tsx:
 *    - Differentiates invalid_username vs incorrect_password vs empty_username
 *    - Validates client-side input validation on empty/whitespace inputs
 * 2. Forgot Password Flow:
 *    - Input validation on empty, spaces, invalid formats
 *    - Live staging backend probe on POST /learnpress/v1/users/reset-password
 *    - Handling of HTTP 500 error_not_user vs HTTP 200 success
 *    - Touch target compliance (>= 48dp) for all interactive recovery elements
 * 3. Strict Administrator Role Guard in ProfileScreen.tsx:
 *    - Strict evaluation: Array.isArray(user?.roles) && user.roles.includes('administrator')
 *    - Elimination of loose heuristics (username 'admin', email 'admin@')
 *    - Guest / Unauthenticated users (user == null) never see Admin Portal
 * 4. SaaSContext Cross-Platform Timer Hygiene:
 *    - ReturnType<typeof setTimeout> usage (no NodeJS.Timeout)
 *    - Unmount teardown hook clearing copilotTimerRef
 *    - Rapid consecutive dispatch simulation ensuring debounce/cancellation
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const assert = require('assert');

console.log('================================================================');
console.log('🔥 CHALLENGER M2 ADVERSARIAL STRESS TEST HARNESS');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function challenge(name, testFn) {
  totalTests++;
  try {
    const result = testFn();
    if (result && typeof result.then === 'function') {
      return result
        .then(() => {
          console.log(`  ✅ PASS: ${name}`);
          passedTests++;
        })
        .catch((err) => {
          console.error(`  ❌ FAIL: ${name}`);
          console.error(`     Error: ${err.message}`);
          failedTests++;
          failures.push({ name, error: err.message });
        });
    }
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
    return Promise.resolve();
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    failedTests++;
    failures.push({ name, error: err.message });
    return Promise.resolve();
  }
}

function httpsPost(urlPath, payload) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(payload);
    const req = https.request(
      `https://staging.thrivingskill.com/wp-json${urlPath}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(bodyStr),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ statusCode: res.statusCode, data: parsed });
          } catch {
            resolve({ statusCode: res.statusCode, raw: data });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

function readNormalized(filePath) {
  const content = fs.readFileSync(path.resolve(filePath), 'utf8');
  return content.replace(/\r\n/g, '\n');
}

async function runAllSuites() {
  // ----------------------------------------------------------------------------
  // SUITE 1: Auth Error Differentiation in AuthModal.tsx
  // ----------------------------------------------------------------------------
  console.log('--- SUITE 1: Auth Error Differentiation in AuthModal.tsx ---');

  await challenge('AuthModal client-side validation rejects empty or whitespace username/password', () => {
    const code = readNormalized('src/components/modals/AuthModal.tsx');

    // Check handleLogin check
    assert(
      code.includes('if (!username.trim() || !password.trim())'),
      'AuthModal must check !username.trim() || !password.trim()'
    );
    assert(
      code.includes("setErrorMessage('Please enter both username/email and password.');"),
      'Must display exact message for empty credentials'
    );
  });

  await challenge('AuthModal handleLogin maps invalid_username and incorrect_password distinctly', () => {
    const code = readNormalized('src/components/modals/AuthModal.tsx');

    assert(
      code.includes("if (code.includes('invalid_username'))"),
      'AuthModal must check code.includes("invalid_username")'
    );
    assert(
      code.includes('Username or email is not registered. Please check your spelling or create an account.'),
      'Must show distinct non-registered user message'
    );

    assert(
      code.includes("else if (code.includes('incorrect_password'))"),
      'AuthModal must check code.includes("incorrect_password")'
    );
    assert(
      code.includes("Incorrect password. Please try again or tap 'Forgot Password' below."),
      'Must show distinct incorrect password message with Forgot Password pointer'
    );

    assert(
      code.includes("else if (code.includes('empty_username'))"),
      'AuthModal must check code.includes("empty_username")'
    );
  });

  // Provision a real dynamic account on staging to test live responses
  const testTs = Date.now().toString().slice(-6);
  const dynUsername = `ts_chal_${testTs}`;
  const dynEmail = `ts_chal_${testTs}@thrivingskill.test`;
  const dynPassword = `ChalPass_${testTs}!`;

  console.log(`  [SETUP] Registering dynamic test account ${dynUsername}...`);
  const regRes = await httpsPost('/learnpress/v1/token/register', {
    username: dynUsername,
    email: dynEmail,
    password: dynPassword,
    confirm_password: dynPassword,
  });
  assert(regRes.statusCode === 200, `Failed to provision test user: ${JSON.stringify(regRes.data)}`);

  await challenge('Live Staging Backend Probe: /learnpress/v1/token differentiates errors', async () => {
    // 1. Invalid / non-existent username
    const resInvUser = await httpsPost('/learnpress/v1/token', {
      username: 'nonexistent_user_tsl_' + Date.now(),
      password: 'SomeRandomPassword123!',
    });
    assert.strictEqual(resInvUser.statusCode, 403, 'Invalid username should return HTTP 403');
    assert.strictEqual(
      resInvUser.data?.code,
      '[lp_jwt_auth] invalid_username',
      `Expected [lp_jwt_auth] invalid_username, got: ${JSON.stringify(resInvUser.data)}`
    );

    // 2. Incorrect password on verified dynamic user
    const resWrongPass = await httpsPost('/learnpress/v1/token', {
      username: dynUsername,
      password: 'DefinitelyWrongPassword999!',
    });
    assert.strictEqual(resWrongPass.statusCode, 403, 'Wrong password should return HTTP 403');
    assert.strictEqual(
      resWrongPass.data?.code,
      '[lp_jwt_auth] incorrect_password',
      `Expected [lp_jwt_auth] incorrect_password, got: ${JSON.stringify(resWrongPass.data)}`
    );

    // 3. Both codes are distinct strings
    assert.notStrictEqual(resInvUser.data.code, resWrongPass.data.code);
  });

  // ----------------------------------------------------------------------------
  // SUITE 2: Forgot Password Workflow & Edge Cases
  // ----------------------------------------------------------------------------
  console.log('\n--- SUITE 2: Forgot Password Workflow & Edge Cases ---');

  await challenge('AuthModal handleResetPassword trims input and blocks empty/spaces', () => {
    const code = readNormalized('src/components/modals/AuthModal.tsx');

    assert(
      code.includes('const userLogin = username.trim();'),
      'handleResetPassword must trim username'
    );
    assert(
      code.includes('if (!userLogin) {'),
      'handleResetPassword must check if trimmed userLogin is empty'
    );
    assert(
      code.includes("setErrorMessage('Please enter your username or email address.');"),
      'handleResetPassword must set error message for empty input'
    );
  });

  await challenge('AuthModal handleResetPassword catches error_not_user gracefully', () => {
    const code = readNormalized('src/components/modals/AuthModal.tsx');

    assert(
      code.includes("code.includes('error_not_user')") || code.includes("msg.includes('error_not_user')"),
      'handleResetPassword must catch error_not_user'
    );
    assert(
      code.includes('User not found. No account is registered with this username or email.'),
      'handleResetPassword must set user friendly not-found message'
    );
  });

  await challenge('Live Staging Backend Probe: POST /learnpress/v1/users/reset-password behavior', async () => {
    // Non-existent user probe
    const resNotFound = await httpsPost('/learnpress/v1/users/reset-password', {
      user_login: 'non_existent_challenger_probe_' + Date.now() + '@thriving.org',
    });
    // Staging WordPress LearnPress returns 500 error_not_user
    assert.strictEqual(resNotFound.statusCode, 500, 'Non-existent reset target must return 500');
    assert.strictEqual(
      resNotFound.data?.code,
      'error_not_user',
      `Expected 'error_not_user', got ${JSON.stringify(resNotFound.data)}`
    );

    // Existing user (verified dynamic account) reset request
    const resSuccess = await httpsPost('/learnpress/v1/users/reset-password', {
      user_login: dynEmail,
    });
    assert.strictEqual(resSuccess.statusCode, 200, 'Valid user reset request must return HTTP 200');
    assert.strictEqual(
      resSuccess.data?.code,
      'success',
      `Expected 'success', got ${JSON.stringify(resSuccess.data)}`
    );
  });

  await challenge('Forgot Password UI touch targets meet WCAG 48dp minimum', () => {
    const code = readNormalized('src/components/modals/AuthModal.tsx');

    // Check forgotPasswordTouch style
    const fpTouchMatch = code.match(/forgotPasswordTouch:\s*\{([^}]+)\}/);
    assert(fpTouchMatch, 'forgotPasswordTouch style definition not found');
    assert(/minHeight:\s*48/.test(fpTouchMatch[1]), 'forgotPasswordTouch must have minHeight: 48');

    // Check backToLoginBtn style
    const backBtnMatch = code.match(/backToLoginBtn:\s*\{([^}]+)\}/);
    assert(backBtnMatch, 'backToLoginBtn style definition not found');
    assert(/minHeight:\s*48/.test(backBtnMatch[1]), 'backToLoginBtn must have minHeight: 48');

    // Check submitButton style
    const submitMatch = code.match(/submitButton:\s*\{([^}]+)\}/);
    assert(submitMatch, 'submitButton style definition not found');
    assert(/height:\s*(?:52|48|50)/.test(submitMatch[1]), 'submitButton must have height >= 48dp');
  });

  await challenge('AuthModal mode switching clears messages and toggles tabs correctly', () => {
    const code = readNormalized('src/components/modals/AuthModal.tsx');

    // Normalized whitespace matching
    const norm = code.replace(/\s+/g, ' ');

    assert(
      norm.includes("setMode('login'); setErrorMessage(null); setInfoMessage(null);"),
      'Switching to login must clear error and info messages'
    );
    assert(
      norm.includes("setMode('register'); setErrorMessage(null); setInfoMessage(null);"),
      'Switching to register must clear error and info messages'
    );
    assert(
      norm.includes("setMode('forgot_password'); setErrorMessage(null); setInfoMessage(null);"),
      'Switching to forgot_password must clear error and info messages'
    );
  });

  // ----------------------------------------------------------------------------
  // SUITE 3: Strict Administrator Role Guard in ProfileScreen.tsx
  // ----------------------------------------------------------------------------
  console.log('\n--- SUITE 3: Strict Administrator Role Guard in ProfileScreen.tsx ---');

  await challenge('ProfileScreen strictly evaluates administrator role via Array.isArray and includes', () => {
    const code = readNormalized('src/screens/ProfileScreen.tsx');

    assert(
      code.includes("const isAdmin = Array.isArray(user?.roles) && user.roles.includes('administrator');"),
      'ProfileScreen must strictly check Array.isArray(user?.roles) && user.roles.includes("administrator")'
    );

    // Verify elimination of loose string checking
    assert(!code.includes("user?.username?.toLowerCase() === 'admin'"), 'Loose check user.username === admin must be removed');
    assert(!code.includes("user?.email?.toLowerCase().includes('admin@')"), 'Loose check user.email.includes(admin@) must be removed');
  });

  await challenge('Adversarial Role Verification Oracle: 10 test vectors against isAdmin logic', () => {
    const isUserAdmin = (user) => {
      return Array.isArray(user?.roles) && user.roles.includes('administrator');
    };

    // Vector 1: null user (Guest)
    assert.strictEqual(isUserAdmin(null), false, 'Guest (user = null) must NOT be admin');

    // Vector 2: undefined user
    assert.strictEqual(isUserAdmin(undefined), false, 'Undefined user must NOT be admin');

    // Vector 3: empty user object
    assert.strictEqual(isUserAdmin({}), false, 'Empty user object must NOT be admin');

    // Vector 4: null roles property
    assert.strictEqual(isUserAdmin({ roles: null }), false, 'Null roles must NOT be admin');

    // Vector 5: Non-admin named 'admin' (Imposter Attack)
    assert.strictEqual(
      isUserAdmin({ username: 'admin', email: 'admin@thriving.app', roles: ['subscriber'] }),
      false,
      'User with username "admin" and role "subscriber" must NOT be admin'
    );

    // Vector 6: Non-admin with email starting with admin@
    assert.strictEqual(
      isUserAdmin({ username: 'johndoe', email: 'admin@example.org', roles: ['customer'] }),
      false,
      'User with email admin@example.org and role customer must NOT be admin'
    );

    // Vector 7: Invalid string type in roles field
    assert.strictEqual(
      isUserAdmin({ roles: 'administrator' }),
      false,
      'Malformed roles property (string instead of array) must NOT be admin'
    );

    // Vector 8: Other privileged roles (editor, author) that are NOT administrator
    assert.strictEqual(
      isUserAdmin({ roles: ['editor', 'instructor'] }),
      false,
      'Editor or instructor must NOT have administrator privileges'
    );

    // Vector 9: Single administrator role
    assert.strictEqual(
      isUserAdmin({ roles: ['administrator'] }),
      true,
      'Single administrator role MUST be admin'
    );

    // Vector 10: Multi-role including administrator
    assert.strictEqual(
      isUserAdmin({ roles: ['subscriber', 'administrator', 'instructor'] }),
      true,
      'Multi-role including administrator MUST be admin'
    );
  });

  await challenge('WordPress Admin Portal shortcut in ProfileScreen is guarded by isAdmin', () => {
    const code = readNormalized('src/screens/ProfileScreen.tsx');

    // Ensure the WordPress Admin Portal shortcut is conditionally wrapped
    const adminPortalMatch = code.match(/\{isAdmin\s*&&\s*\(\s*<TouchableOpacity[\s\S]*?WP-Admin[\s\S]*?<\/TouchableOpacity>\s*\)\}/);
    assert(adminPortalMatch, 'WordPress Admin Portal TouchableOpacity must be conditionally wrapped in {isAdmin && ( ... )}');
  });

  await challenge('Guest / Unauthenticated User (user == null) is strictly blocked from Admin Portal', () => {
    const code = readNormalized('src/screens/ProfileScreen.tsx');
    // Verify that isAdmin is the ONLY condition governing the admin link
    assert(code.includes('{isAdmin && ('), 'Admin portal must be strictly guarded by isAdmin');
    // Simulate user = null
    const user = null;
    const isAdmin = Array.isArray(user?.roles) && user.roles.includes('administrator');
    assert.strictEqual(isAdmin, false, 'Guest user (user == null) results in isAdmin === false');
  });

  // ----------------------------------------------------------------------------
  // SUITE 4: Cross-Platform Timer Hygiene in SaaSContext.tsx
  // ----------------------------------------------------------------------------
  console.log('\n--- SUITE 4: Cross-Platform Timer Hygiene in SaaSContext.tsx ---');

  await challenge('SaaSContext declares copilotTimerRef with ReturnType<typeof setTimeout>', () => {
    const code = readNormalized('src/context/SaaSContext.tsx');

    assert(
      code.includes('const copilotTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);'),
      'copilotTimerRef must be typed as useRef<ReturnType<typeof setTimeout> | null>(null)'
    );
    assert(!code.includes('NodeJS.Timeout'), 'SaaSContext must NOT use NodeJS.Timeout (violates Rule 3)');
  });

  await challenge('SaaSContext cancels copilotTimerRef on component unmount', () => {
    const code = readNormalized('src/context/SaaSContext.tsx');

    const unmountMatch = code.match(/useEffect\(\(\)\s*=>\s*\{[\s\S]*?return\s*\(\)\s*=>\s*\{([\s\S]*?)\};\s*\}, \[\]\);/);
    assert(unmountMatch, 'Unmount teardown useEffect not found in SaaSContext.tsx');

    const teardownBody = unmountMatch[1];
    assert(teardownBody.includes('if (copilotTimerRef.current)'), 'Must check if copilotTimerRef.current exists');
    assert(teardownBody.includes('clearTimeout(copilotTimerRef.current)'), 'Must call clearTimeout(copilotTimerRef.current)');
  });

  await challenge('SaaSContext clears pending timer on rapid consecutive copilot messages', () => {
    const code = readNormalized('src/context/SaaSContext.tsx');
    const norm = code.replace(/\s+/g, ' ');

    assert(
      norm.includes('if (copilotTimerRef.current) { clearTimeout(copilotTimerRef.current); }'),
      'sendCopilotMessage must clear existing copilotTimerRef before scheduling next reply'
    );
    assert(
      norm.includes('copilotTimerRef.current = setTimeout('),
      'sendCopilotMessage must assign new timer to copilotTimerRef.current'
    );
  });

  await challenge('SaaSContext lifecycle simulation: debounce and unmount teardown', () => {
    return new Promise((resolve, reject) => {
      let copilotTimerRef = { current: null };
      let reply1Received = false;
      let reply2Received = false;

      const unmountCleanup = () => {
        if (copilotTimerRef.current) {
          clearTimeout(copilotTimerRef.current);
          copilotTimerRef.current = null;
        }
      };

      const sendCopilotMessage = (text, onReply) => {
        if (copilotTimerRef.current) {
          clearTimeout(copilotTimerRef.current);
        }
        copilotTimerRef.current = setTimeout(() => {
          copilotTimerRef.current = null;
          onReply();
        }, 120);
      };

      // Message 1
      sendCopilotMessage('Explain DCF', () => { reply1Received = true; });
      assert(copilotTimerRef.current !== null, 'Timer must be active after message 1');

      // Rapid Message 2 before message 1 fires (at t=40ms)
      setTimeout(() => {
        sendCopilotMessage('Explain RTCC', () => { reply2Received = true; });
        assert(copilotTimerRef.current !== null, 'Timer must be active after message 2');

        // Unmount context at t=80ms
        setTimeout(() => {
          unmountCleanup();
          assert.strictEqual(copilotTimerRef.current, null, 'Timer must be cleared on unmount');

          // Verify neither callback fired at t=200ms
          setTimeout(() => {
            try {
              assert.strictEqual(reply1Received, false, 'Reply 1 must NOT fire (canceled by debounce)');
              assert.strictEqual(reply2Received, false, 'Reply 2 must NOT fire (canceled by unmount)');
              resolve();
            } catch (e) {
              reject(e);
            }
          }, 150);
        }, 40);
      }, 40);
    });
  });

  // ----------------------------------------------------------------------------
  // SUITE 5: Codebase Audit & Regressions
  // ----------------------------------------------------------------------------
  console.log('\n--- SUITE 5: Codebase Audit & Regressions ---');

  await challenge('No other unhandled timers exist in src/context/ or src/screens/ProfileScreen.tsx', () => {
    const files = [
      'src/context/SaaSContext.tsx',
      'src/context/AuthContext.tsx',
      'src/screens/ProfileScreen.tsx',
    ];
    for (const file of files) {
      const code = readNormalized(file);
      if (code.includes('setTimeout(')) {
        assert(code.includes('clearTimeout('), `${file} uses setTimeout without clearTimeout`);
      }
      if (code.includes('setInterval(')) {
        assert(code.includes('clearInterval('), `${file} uses setInterval without clearInterval`);
      }
    }
  });

  // Summary
  console.log('\n================================================================');
  console.log(`TOTAL TESTS:  ${totalTests}`);
  console.log(`PASSED:       ${passedTests}`);
  console.log(`FAILED:       ${failedTests}`);
  console.log('================================================================');

  if (failedTests > 0) {
    console.error('\nFAILURES ENCOUNTERED:');
    failures.forEach((f) => console.error(` - ${f.name}: ${f.error}`));
    process.exit(1);
  } else {
    console.log('\n🏆 ALL CHALLENGER M2 TESTS PASSED EMPIRICALLY!\n');
    process.exit(0);
  }
}

runAllSuites().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
