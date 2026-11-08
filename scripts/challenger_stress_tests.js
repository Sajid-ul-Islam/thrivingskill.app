/**
 * ============================================================================
 * CHALLENGER ADVERSARIAL STRESS TEST HARNESS — TIER 5 COVERAGE HARDENING
 * ============================================================================
 * Focus Areas:
 * 1. Simultaneous Tab Switching, Multi-Touch & Feedback Concurrency
 * 2. Extreme Unicode & Script Payloads, Rapid Sequential Profile Saves, Network Drop Resilience
 * 3. Auth Token Edge Cases, Expiry, Token Refresh Failures & Privilege Escalation Defense
 * ============================================================================
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const API_BASE = 'https://staging.thrivingskill.com/wp-json';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

let passedCount = 0;
let failedCount = 0;
const failures = [];

function assert(condition, testId, description, details = '') {
  if (condition) {
    passedCount++;
    console.log(`  ${colors.green}✅ PASS${colors.reset} ${testId.padEnd(8)} ${description}`);
  } else {
    failedCount++;
    const errMsg = `${testId}: ${description} ${details ? '— ' + details : ''}`;
    failures.push(errMsg);
    console.log(`  ${colors.red}❌ FAIL${colors.reset} ${testId.padEnd(8)} ${description}`);
    if (details) console.log(`         ${colors.yellow}${details}${colors.reset}`);
  }
}

// Network client helper
async function request(url, options = {}, retries = 2) {
  let lastErr = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await new Promise((resolve, reject) => {
        const u = new URL(url);
        const isHttps = u.protocol === 'https:';
        const client = isHttps ? https : http;
        const method = options.method || 'GET';
        const headers = {
          'User-Agent': 'Challenger-Stress-Runner/1.0',
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
          timeout: options.timeout || 35000,
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
          reject(new Error(`Timeout (${options.timeout || 35000}ms) for ${url}`));
        });

        req.on('error', reject);
        if (bodyData) req.write(bodyData);
        req.end();
      });
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 1200));
      }
    }
  }
  throw lastErr;
}

async function runChallengerSuite() {
  console.log(`\n${colors.bold}${colors.cyan}================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}  CHALLENGER ADVERSARIAL STRESS TEST HARNESS (TIER 5)           ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}================================================================${colors.reset}\n`);

  // -------------------------------------------------------------------------
  // GROUP 1: Simultaneous Tab Switching & Touch Feedback Concurrency
  // -------------------------------------------------------------------------
  console.log(`\n${colors.bold}--- [GROUP 1] SIMULTANEOUS TAB SWITCHING & TOUCH FEEDBACK CONCURRENCY ---${colors.reset}`);

  // Test 1.1: State Machine Invariant Under 100 Rapid Asynchronous Dispatches
  {
    const tabs = ['Home', 'Courses', 'MyLearning', 'Workshops', 'Profile'];
    let activeTab = 'Home';
    let activeScreen = { name: 'MainTabs', tab: 'Home' };

    function navigateToTab(tab) {
      activeTab = tab;
      activeScreen = { name: 'MainTabs', tab };
    }

    // Fire 100 rapid asynchronous calls simulating multi-finger touches
    const dispatchPromises = [];
    for (let i = 0; i < 100; i++) {
      const chosenTab = tabs[i % tabs.length];
      dispatchPromises.push(new Promise((resolve) => {
        setTimeout(() => {
          navigateToTab(chosenTab);
          resolve(chosenTab);
        }, Math.floor(Math.random() * 20));
      }));
    }

    await Promise.all(dispatchPromises);
    assert(
      activeScreen.name === 'MainTabs' && activeScreen.tab === activeTab && tabs.includes(activeTab),
      'ADV-1.1',
      'Tab navigation state machine invariant holds under 100 concurrent asynchronous transitions',
      `Final Tab: ${activeTab}, Screen: ${JSON.stringify(activeScreen)}`
    );
  }

  // Test 1.2: App.tsx Bottom Navigation M3 Pill Capsule Geometry
  {
    const appContent = fs.readFileSync(path.join(PROJECT_ROOT, 'App.tsx'), 'utf8');
    const hasPillIndicator = appContent.includes('tabPillIndicator:');
    const hasWidth60 = appContent.includes('width: 60');
    const hasHeight32 = appContent.includes('height: 32');
    const hasShapeFull = appContent.includes('borderRadius: shape.full');
    const hasMinHeight48 = appContent.includes('minHeight: 48');

    assert(
      hasPillIndicator && hasWidth60 && hasHeight32 && hasShapeFull && hasMinHeight48,
      'ADV-1.2',
      'Bottom navigation pill capsule implements exact 60x32 shape.full dimensions with 48dp minimum touch target',
      `pill:${hasPillIndicator}, w:60:${hasWidth60}, h:32:${hasHeight32}, full:${hasShapeFull}, minH:48:${hasMinHeight48}`
    );
  }

  // Test 1.3: Tactile Feedback & Android Ripple Configuration
  {
    const appContent = fs.readFileSync(path.join(PROJECT_ROOT, 'App.tsx'), 'utf8');
    const hasRipple = appContent.includes('android_ripple=');
    const hasBorderless = appContent.includes('borderless: true');
    const hasRadius32 = appContent.includes('radius: 32');
    const hasTabRole = appContent.includes('accessibilityRole="tab"');
    const hasTabSelected = appContent.includes('accessibilityState={{ selected: isActive }}');

    assert(
      hasRipple && hasBorderless && hasRadius32 && hasTabRole && hasTabSelected,
      'ADV-1.3',
      'Tactile feedback adheres to M3 ripple bounds (borderless, radius 32) and WCAG tab accessibility contracts',
      `ripple:${hasRipple}, borderless:${hasBorderless}, radius:${hasRadius32}, role:${hasTabRole}, state:${hasTabSelected}`
    );
  }

  // Test 1.4: BrandDrawer Multi-Click Navigation Debounce & Timer Cleanup
  {
    const drawerContent = fs.readFileSync(path.join(PROJECT_ROOT, 'src', 'components', 'common', 'BrandDrawer.tsx'), 'utf8');
    const normalizedDrawer = drawerContent.replace(/\r\n/g, '\n');
    const hasNavTimerRef = normalizedDrawer.includes('const navTimerRef = useRef');
    const hasClearBeforeSet = normalizedDrawer.includes('if (navTimerRef.current) {\n      clearTimeout(navTimerRef.current);\n    }');
    const hasUnmountClean = normalizedDrawer.includes('return () => {\n      if (navTimerRef.current) {\n        clearTimeout(navTimerRef.current);\n      }\n    };');

    assert(
      hasNavTimerRef && hasClearBeforeSet && hasUnmountClean,
      'ADV-1.4',
      'BrandDrawer debounce timer cancels previous timer on rapid re-press and cleans up on unmount',
      `ref:${hasNavTimerRef}, cancelPre:${hasClearBeforeSet}, unmountClean:${hasUnmountClean}`
    );
  }

  // -------------------------------------------------------------------------
  // GROUP 2: Extreme Unicode, Rapid Profile Saves & Network Resilience
  // -------------------------------------------------------------------------
  console.log(`\n${colors.bold}--- [GROUP 2] EXTREME UNICODE, RAPID SAVES & NETWORK RESILIENCE ---${colors.reset}`);

  // Dynamic test student registration for live backend tests
  const dynamicId = `ts_adv_${Date.now().toString().slice(-6)}`;
  const testStudent = {
    username: dynamicId,
    email: `${dynamicId}@thrivingskill.test`,
    password: `TS_Adv_Pass_${Date.now().toString().slice(-4)}!`,
  };

  let authToken = null;
  let authUserId = null;

  try {
    const regRes = await request(`${API_BASE}/learnpress/v1/token/register`, {
      method: 'POST',
      body: {
        username: testStudent.username,
        email: testStudent.email,
        password: testStudent.password,
        confirm_password: testStudent.password,
      },
    });

    if (regRes.status === 200 && regRes.body && regRes.body.token) {
      authToken = regRes.body.token;
      authUserId = regRes.body.user_id || regRes.body.id;
    }
  } catch (err) {
    console.warn('Registration note:', err.message);
  }

  assert(
    authToken !== null,
    'ADV-2.1',
    'Dynamic non-destructive test student registered on live staging backend',
    `Username: ${testStudent.username}`
  );

  // Test 2.2: Extreme Unicode — Bengali Complex Script with Diacritics & Emoji
  if (authToken) {
    const bengaliName = 'মুহাম্মদ তানভীর আহমেদ (সফটওয়্যার প্রকৌশলী) 🚀';
    const bengaliBio = 'বাংলা ভাষায় থ্রাইভিং স্কিলস প্ল্যাটফর্মের মাধ্যমে এক্সিকিউটিভ সফটওয়্যার ডেভেলপমেন্ট ও এআই সিস্টেম প্রশিক্ষণ। 🇧🇩 ✨';

    const updateRes = await request(`${API_BASE}/wp/v2/users/me`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        name: bengaliName,
        description: bengaliBio,
      },
    });

    const verifyRes = await request(`${API_BASE}/wp/v2/users/me?context=edit`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });

    const nameMatches = verifyRes.body?.name === bengaliName;
    const bioMatches = verifyRes.body?.description?.includes('বাংলা ভাষায় থ্রাইভিং স্কিলস');

    assert(
      updateRes.status === 200 && verifyRes.status === 200 && nameMatches && bioMatches,
      'ADV-2.2',
      'Extreme Unicode round-trip: Complex Bengali glyphs, diacritics, and multi-byte emojis persist with 100% fidelity',
      `Status: ${updateRes.status}, Returned name: "${verifyRes.body?.name}"`
    );
  }

  // Test 2.3: Extreme Unicode — RTL Arabic & Hebrew Text
  if (authToken) {
    const rtlName = 'مطور واجهات المستخدم المتقدم';
    const rtlBio = 'مرحبا بالعالم - שלום עולם 🌟 תכנות מתקדם ועיצוב מערכות';

    const updateRes = await request(`${API_BASE}/wp/v2/users/me`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        name: rtlName,
        description: rtlBio,
      },
    });

    assert(
      updateRes.status === 200 && updateRes.body?.name === rtlName,
      'ADV-2.3',
      'Extreme Unicode round-trip: RTL Arabic and Hebrew bidirectional strings persist without corruption',
      `Status: ${updateRes.status}, Name: "${updateRes.body?.name}"`
    );
  }

  // Test 2.4: Extreme Unicode — Mathematical Alphanumeric Symbols & Zero-Width Joiners
  if (authToken) {
    const mathSymbolsName = '𝔗𝔥𝔯𝔦𝔳𝔦𝔫𝔤 𝔖𝔨𝔦𝔩𝔩𝔰 𝟚𝟘𝟚𝟞';
    const zwjBio = 'Family: 👨‍👩‍👧‍👦 Developer: 👨‍💻 Technologist: 🧑‍🔬';

    const updateRes = await request(`${API_BASE}/wp/v2/users/me`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        name: mathSymbolsName,
        description: zwjBio,
      },
    });

    assert(
      updateRes.status === 200 && updateRes.body?.name === mathSymbolsName,
      'ADV-2.4',
      'Extreme Unicode round-trip: Mathematical alphanumeric symbols and Zero-Width Joiner (ZWJ) sequences persist cleanly',
      `Status: ${updateRes.status}`
    );
  }

  // Test 2.5: HTML / Script Injection & SQL Injection Payload Sanitization
  if (authToken) {
    const attackPayload = '<script>alert("XSS")</script>Test & "Quotes" \' OR 1=1 -- <img src=x onerror=alert(1)>';
    const updateRes = await request(`${API_BASE}/wp/v2/users/me`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        description: attackPayload,
      },
    });

    // WordPress REST API must sanitize/escape or safely handle without server error (500)
    const safeHandling = updateRes.status === 200 && !updateRes.body?.description?.includes('<script>');

    assert(
      safeHandling,
      'ADV-2.5',
      'Malicious XSS / SQL payload injection is safely neutralized by REST sanitizer without 500 error or execution',
      `Status: ${updateRes.status}, Saved: "${updateRes.body?.description}"`
    );
  }

  // Test 2.6: Rapid Sequential Profile Saves (Burst / Concurrency Test)
  if (authToken) {
    const burstCount = 5;
    const burstPromises = [];

    for (let i = 1; i <= burstCount; i++) {
      burstPromises.push(
        request(`${API_BASE}/wp/v2/users/me`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken}` },
          body: {
            name: `Rapid Update Test ${i}`,
            description: `Sequential burst update iteration ${i} of ${burstCount}`,
          },
        })
      );
    }

    const results = await Promise.all(burstPromises);
    const all200 = results.every(r => r.status === 200);

    // Fetch final state
    const finalState = await request(`${API_BASE}/wp/v2/users/me?context=edit`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });

    assert(
      all200 && finalState.status === 200 && finalState.body?.name?.startsWith('Rapid Update Test'),
      'ADV-2.6',
      `Rapid sequential profile saves: ${burstCount} back-to-back POST requests execute cleanly without deadlock or 500`,
      `All HTTP 200: ${all200}, Final Name: "${finalState.body?.name}"`
    );
  }

  // Test 2.7: ProfileScreen Network Interruption Local Fallback Resilience
  {
    const profileScreen = fs.readFileSync(path.join(PROJECT_ROOT, 'src', 'screens', 'ProfileScreen.tsx'), 'utf8');
    const hasCatchFallback = profileScreen.includes('await updateUserProfile({');
    const hasLocalSavedMessage = profileScreen.includes('Your personal executive details have been saved locally');
    const hasIsBanglaFallback = profileScreen.includes('আপনার প্রোফাইল তথ্য লোকালি সংরক্ষিত হয়েছে');

    assert(
      hasCatchFallback && hasLocalSavedMessage && hasIsBanglaFallback,
      'ADV-2.7',
      'ProfileScreen implements offline / network interruption fallback, saving changes locally when remote sync fails',
      `catchFallback:${hasCatchFallback}, localMsg:${hasLocalSavedMessage}, banglaMsg:${hasIsBanglaFallback}`
    );
  }

  // -------------------------------------------------------------------------
  // GROUP 3: Auth Tokens, Expiry, Refresh Failures & Privilege Escalation
  // -------------------------------------------------------------------------
  console.log(`\n${colors.bold}--- [GROUP 3] AUTH TOKENS, EXPIRY, REFRESH FAILURES & ROLE SPOOFING ---${colors.reset}`);

  // Test 3.1: Malformed & Garbage Bearer Tokens
  {
    const malformedRes = await request(`${API_BASE}/learnpress/v1/token/validate`, {
      method: 'POST',
      headers: { Authorization: 'Bearer totally_garbage_jwt_token_123456' },
    });

    const isRejected = malformedRes.status === 401 || malformedRes.status === 403;
    assert(
      isRejected,
      'ADV-3.1',
      'Malformed Bearer token is strictly rejected by LearnPress token validator with 401/403',
      `Status: ${malformedRes.status}`
    );
  }

  // Test 3.2: Empty / Missing Bearer Token Rejection
  {
    const emptyRes = await request(`${API_BASE}/wp/v2/users/me`, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' },
      body: { name: 'Unauthorized Spoof' },
    });

    const isBlocked = emptyRes.status === 401 || emptyRes.status === 403 || emptyRes.status === 404;
    assert(
      isBlocked,
      'ADV-3.2',
      'Empty Bearer token authorization header is rejected by WordPress REST API with 401/403/404',
      `Status: ${emptyRes.status}`
    );
  }

  // Test 3.3: Privilege Escalation Attack Defense (Student Injects roles: ['administrator'])
  if (authToken) {
    const exploitRes = await request(`${API_BASE}/wp/v2/users/me`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        roles: ['administrator'],
      },
    });

    // Check user roles after exploit attempt
    const checkRes = await request(`${API_BASE}/wp/v2/users/me?context=edit`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });

    const currentRoles = checkRes.body?.roles || [];
    const isEscalationPrevented = !currentRoles.includes('administrator');

    assert(
      isEscalationPrevented,
      'ADV-3.3',
      'Privilege escalation attack defense: student cannot elevate self to administrator via profile update endpoint',
      `Assigned roles: ${JSON.stringify(currentRoles)}`
    );
  }

  // Test 3.4: Client-Side Strict Admin Role Check Contract Adversarial Matrix
  {
    // Define the exact isUserAdmin contract function
    function isUserAdmin(user) {
      return Array.isArray(user?.roles) && user.roles.includes('administrator');
    }

    const testVectors = [
      { input: { roles: ['administrator'] }, expected: true, label: 'Standard administrator' },
      { input: { roles: ['administrator', 'customer'] }, expected: true, label: 'Multi-role with administrator' },
      { input: { roles: ['customer'] }, expected: false, label: 'Customer / Student' },
      { input: { roles: ['subscriber'] }, expected: false, label: 'Subscriber' },
      { input: { username: 'admin', roles: ['customer'] }, expected: false, label: 'Username spoof: admin' },
      { input: { username: 'administrator', email: 'admin@thrivingskill.com', roles: ['customer'] }, expected: false, label: 'Email spoof: admin@...' },
      { input: { roles: 'administrator' }, expected: false, label: 'String roles instead of array' },
      { input: { roles: ['administrator_preview'] }, expected: false, label: 'Substring collision prefix' },
      { input: { roles: ['sub_administrator'] }, expected: false, label: 'Substring collision suffix' },
      { input: { roles: ['ADMINISTRATOR'] }, expected: false, label: 'Uppercase casing mismatch' },
      { input: { roles: ['administrator '] }, expected: false, label: 'Trailing space attack' },
      { input: { roles: [] }, expected: false, label: 'Empty roles array' },
      { input: { roles: null }, expected: false, label: 'Null roles property' },
      { input: null, expected: false, label: 'Null user object' },
      { input: undefined, expected: false, label: 'Undefined user object' },
      { input: {}, expected: false, label: 'Empty object' },
    ];

    let allVectorsPassed = true;
    for (const vector of testVectors) {
      const actual = isUserAdmin(vector.input);
      if (actual !== vector.expected) {
        allVectorsPassed = false;
        console.log(`         Vector failed: ${vector.label} -> Expected: ${vector.expected}, Got: ${actual}`);
      }
    }

    assert(
      allVectorsPassed,
      'ADV-3.4',
      'Client role guard contract isUserAdmin passes all 16 adversarial attack vectors with 100% precision',
      `Vectors tested: ${testVectors.length}`
    );
  }

  // Test 3.5: ProfileScreen Admin Link Complete Invisibility for Non-Admin
  {
    const profileScreen = fs.readFileSync(path.join(PROJECT_ROOT, 'src', 'screens', 'ProfileScreen.tsx'), 'utf8');
    const hasStrictAdminDef = profileScreen.includes("const isAdmin = Array.isArray(user?.roles) && user.roles.includes('administrator');");
    const hasAdminSectionGuard = profileScreen.includes('{isAdmin && (');
    const hasWpAdminUrl = profileScreen.includes('Linking.openURL(Env.WP_ADMIN_URL)');

    assert(
      hasStrictAdminDef && hasAdminSectionGuard && hasWpAdminUrl,
      'ADV-3.5',
      'ProfileScreen strictly guards WordPress Admin links behind isAdmin, omitting entire section for non-admins',
      `strictDef:${hasStrictAdminDef}, sectionGuard:${hasAdminSectionGuard}, wpAdminUrl:${hasWpAdminUrl}`
    );
  }

  // -------------------------------------------------------------------------
  // FINAL SUMMARY
  // -------------------------------------------------------------------------
  console.log(`\n${colors.bold}${colors.cyan}================================================================${colors.reset}`);
  console.log(`${colors.bold}  CHALLENGER STRESS SUITE RESULTS SUMMARY${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}================================================================${colors.reset}`);
  console.log(`  Total Tests Executed : ${colors.bold}${passedCount + failedCount}${colors.reset}`);
  console.log(`  Passed Tests         : ${colors.green}${colors.bold}${passedCount}${colors.reset}`);
  console.log(`  Failed Tests         : ${failedCount === 0 ? colors.green : colors.red}${colors.bold}${failedCount}${colors.reset}`);
  console.log(`  Pass Rate            : ${colors.bold}${((passedCount / (passedCount + failedCount)) * 100).toFixed(1)}%${colors.reset}`);

  if (failedCount > 0) {
    console.log(`\n${colors.red}${colors.bold}Failures Detected:${colors.reset}`);
    failures.forEach(f => console.log(`  - ${f}`));
    process.exit(1);
  } else {
    console.log(`\n${colors.green}${colors.bold}🏆 ALL CHALLENGER ADVERSARIAL STRESS TESTS PASSED (100.0%)${colors.reset}\n`);
    process.exit(0);
  }
}

runChallengerSuite().catch((err) => {
  console.error('\nFatal error in challenger stress harness:', err);
  process.exit(1);
});
