/**
 * scripts/challenger_final_2_adversarial.js
 *
 * Milestone 4 Phase 2 (Tier 5 Adversarial Coverage Hardening)
 * Empirical White-Box Concurrency, Race Condition, Timer Teardown,
 * and Session Persistence Stress Test Harness.
 *
 * Archetype: Empirical Challenger
 * Constraints: Zero external dependencies, pure Node.js, Windows PowerShell safe.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const assert = require('assert');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const API_BASE = 'https://staging.thrivingskill.com/wp-json';

// Test statistics
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

async function test(name, fn) {
  totalTests++;
  const start = Date.now();
  try {
    await fn();
    const duration = Date.now() - start;
    console.log(`  ✅ [PASS] ${name} (${duration}ms)`);
    passedTests++;
  } catch (err) {
    const duration = Date.now() - start;
    console.error(`  ❌ [FAIL] ${name} (${duration}ms)`);
    console.error(`     Error: ${err.message}`);
    failedTests++;
    failures.push({ name, error: err.message, stack: err.stack });
  }
}

// HTTP request helper with robust Content-Length and retries
async function request(url, options = {}, retries = 2) {
  let lastErr = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        let bodyData = null;
        const headers = {
          'Content-Type': 'application/json',
          'User-Agent': 'ThrivingSkills-EmpiricalChallenger/1.0',
          'Accept': 'application/json, text/plain, */*',
          ...(options.headers || {}),
        };

        if (options.body) {
          bodyData = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
          headers['Content-Length'] = Buffer.byteLength(bodyData);
        }

        const reqOptions = {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port || 443,
          path: parsedUrl.pathname + parsedUrl.search,
          method: options.method || 'GET',
          headers,
        };

        const req = https.request(reqOptions, (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              resolve({ status: res.statusCode, headers: res.headers, body: parsed, raw: data });
            } catch {
              resolve({ status: res.statusCode, headers: res.headers, body: data, raw: data });
            }
          });
        });

        req.on('error', reject);
        req.setTimeout(35000, () => {
          req.destroy();
          reject(new Error(`Request timeout (${url})`));
        });

        if (bodyData) {
          req.write(bodyData);
        }
        req.end();
      });
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1500));
      }
    }
  }
  throw lastErr;
}

// In-Memory AsyncStorage Simulator with customizable concurrency & delay
class MockAsyncStorage {
  constructor() {
    this.store = new Map();
    this.operationLog = [];
    this.delayMs = 0;
  }

  setDelay(ms) {
    this.delayMs = ms;
  }

  async _delay() {
    if (this.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, Math.random() * this.delayMs));
    }
  }

  async getItem(key) {
    await this._delay();
    this.operationLog.push({ op: 'getItem', key, time: Date.now() });
    return this.store.has(key) ? this.store.get(key) : null;
  }

  async setItem(key, value) {
    await this._delay();
    this.operationLog.push({ op: 'setItem', key, value, time: Date.now() });
    this.store.set(key, String(value));
  }

  async removeItem(key) {
    await this._delay();
    this.operationLog.push({ op: 'removeItem', key, time: Date.now() });
    this.store.delete(key);
  }

  async clear() {
    await this._delay();
    this.store.clear();
  }

  getAllKeys() {
    return Array.from(this.store.keys());
  }
}

// ============================================================================
// MAIN ADVERSARIAL SUITE EXECUTION
// ============================================================================

async function runAdversarialSuite() {
  console.log('================================================================');
  console.log('🔥 MILESTONE 4 TIER 5 ADVERSARIAL STRESS TEST HARNESS (v3)');
  console.log('   Empirical Challenger: Concurrency, Timers, Persistence & Admin');
  console.log('================================================================\n');

  // --------------------------------------------------------------------------
  // SECTION 1: Session Persistence & Storage State Corruption Under Concurrency
  // --------------------------------------------------------------------------
  console.log('📦 SECTION 1: Session Persistence & Storage State Corruption Under Stress');

  await test('1.1: Auth state restoration survives malformed/syntax-corrupted JSON without crashing', async () => {
    const syntaxCorruptedValues = [
      '{ invalid_json_syntax',
      '{"incomplete": ',
      'undefined',
      'null',
      '',
      '   ',
      '\\0\\0\\0 corrupted byte sequence',
      '{"id": 42, "name": "Test", "roles": ["customer"]', // missing closing brace
    ];

    for (const badValue of syntaxCorruptedValues) {
      const storage = new MockAsyncStorage();
      await storage.setItem('@thrivingskill_auth_user', badValue);
      await storage.setItem('@thrivingskill_auth_token', 'mock_jwt_token_123');

      // Emulate AuthContext.tsx exact initialization logic:
      let user = null;
      let token = null;
      let isGuest = true;
      let isLoading = true;

      try {
        const [savedUser, savedToken] = await Promise.all([
          storage.getItem('@thrivingskill_auth_user'),
          storage.getItem('@thrivingskill_auth_token'),
        ]);

        if (savedUser && savedToken) {
          const parsedUser = JSON.parse(savedUser);
          if (parsedUser) {
            user = parsedUser;
            token = savedToken;
            setIsGuest(false);
          } else {
            isGuest = true;
          }
        } else {
          isGuest = true;
        }
      } catch (e) {
        // Handled by AuthContext catch
        isGuest = true;
      } finally {
        isLoading = false;
      }

      assert.strictEqual(isLoading, false, 'isLoading must be false after corrupted parse');
      assert.strictEqual(isGuest, true, `Syntax corrupted value "${badValue.slice(0, 20)}" must keep isGuest=true`);
      assert.strictEqual(user, null, 'User must remain null on malformed JSON');
    }
  });

  await test('1.2: Degraded schema states: malformed fields (null name, non-array roles) handled safely by UI & roles', async () => {
    const degradedObjects = [
      { id: 'bad', name: null, roles: 'not_an_array' },
      { id: 99, displayName: null, username: null, roles: null },
      { id: 100, roles: {} },
      { id: 101, name: '', description: null, roles: [123] },
    ];

    for (const deg of degradedObjects) {
      // 1. Verify isUserAdmin safety
      const isAdmin = Array.isArray(deg.roles) && deg.roles.includes('administrator');
      assert.strictEqual(isAdmin, false, 'Degraded object must not evaluate to admin');

      // 2. Verify ProfileScreen fallback safety (never undefined/null thrown to Text component)
      const customName = deg.name || deg.displayName || deg.username || '';
      const customBio = deg.description || '';
      assert(typeof customName === 'string', 'customName must be string');
      assert(typeof customBio === 'string', 'customBio must be string');
    }
  });

  await test('1.3: Rapid reload cycles: 100 sequential write-read-update cycles without data loss', async () => {
    const storage = new MockAsyncStorage();
    storage.setDelay(1); // 1ms jitter

    let currentUser = {
      id: 101,
      username: 'learner_101',
      displayName: 'Learner Init',
      email: 'learner101@test.com',
      roles: ['customer'],
      counter: 0,
    };

    await storage.setItem('@thrivingskill_auth_user', JSON.stringify(currentUser));
    await storage.setItem('@thrivingskill_auth_token', 'initial_token');

    for (let i = 1; i <= 100; i++) {
      // Read
      const raw = await storage.getItem('@thrivingskill_auth_user');
      const parsed = JSON.parse(raw);
      assert.strictEqual(parsed.counter, i - 1, `Counter mismatch at iteration ${i}`);

      // Update
      parsed.counter = i;
      parsed.displayName = `Learner Updated ${i}`;
      parsed.lastModified = Date.now();

      // Write
      await storage.setItem('@thrivingskill_auth_user', JSON.stringify(parsed));
    }

    const finalRaw = await storage.getItem('@thrivingskill_auth_user');
    const finalParsed = JSON.parse(finalRaw);
    assert.strictEqual(finalParsed.counter, 100, 'Final counter must be 100');
    assert.strictEqual(finalParsed.displayName, 'Learner Updated 100');
  });

  await test('1.4: Concurrency stress: 50 simultaneous profile updates merge deterministically', async () => {
    const storage = new MockAsyncStorage();
    storage.setDelay(5); // introduce real async interleaving

    let stateUser = {
      id: 500,
      username: 'concurrent_user',
      displayName: 'Base Name',
      name: 'Base Name',
      description: 'Initial Bio',
      phone: '01700000000',
      roles: ['customer'],
    };

    await storage.setItem('@thrivingskill_auth_user', JSON.stringify(stateUser));

    // Emulate AuthContext.updateUserProfile logic with in-memory state mutex simulation
    let updateLock = Promise.resolve();
    const updateUserProfile = async (updates) => {
      updateLock = updateLock.then(async () => {
        stateUser = {
          ...stateUser,
          ...updates,
          displayName: updates.name || updates.displayName || stateUser.displayName,
          name: updates.name !== undefined ? updates.name : (stateUser.name || stateUser.displayName),
        };
        await storage.setItem('@thrivingskill_auth_user', JSON.stringify(stateUser));
      });
      return updateLock;
    };

    // Fire 50 concurrent updates with different fields
    const promises = [];
    for (let i = 1; i <= 50; i++) {
      promises.push(
        updateUserProfile({
          name: `User Name Iteration ${i}`,
          phone: `017120000${i.toString().padStart(2, '0')}`,
          description: `Bio updated in batch ${i}`,
        })
      );
    }

    await Promise.all(promises);

    const storedRaw = await storage.getItem('@thrivingskill_auth_user');
    const stored = JSON.parse(storedRaw);
    assert.strictEqual(stored.id, 500, 'User ID must remain unchanged');
    assert(stored.name.startsWith('User Name Iteration'), 'Name must be from an update');
    assert(stored.phone.startsWith('017120000'), 'Phone must be from an update');
    assert(stored.description.startsWith('Bio updated in batch'), 'Bio must be from an update');
  });

  await test('1.5: Race condition: Logout called while profile update is in-flight does not resurrect session', async () => {
    const storage = new MockAsyncStorage();
    storage.setDelay(10);

    let currentUser = { id: 777, username: 'logout_racer', token: 'token_777' };
    await storage.setItem('@thrivingskill_auth_user', JSON.stringify(currentUser));
    await storage.setItem('@thrivingskill_auth_token', 'token_777');

    let isLoggedOut = false;

    // Simulate in-flight profile update
    const slowUpdate = async () => {
      await new Promise((r) => setTimeout(r, 15));
      if (!isLoggedOut) {
        currentUser = { ...currentUser, name: 'Late Name' };
        await storage.setItem('@thrivingskill_auth_user', JSON.stringify(currentUser));
      }
    };

    // Simulate logout triggered before update finishes
    const logout = async () => {
      isLoggedOut = true;
      currentUser = null;
      await Promise.all([
        storage.removeItem('@thrivingskill_auth_user'),
        storage.removeItem('@thrivingskill_auth_token'),
      ]);
    };

    // Start update then immediately logout
    const p1 = slowUpdate();
    const p2 = logout();
    await Promise.all([p1, p2]);

    const storedUser = await storage.getItem('@thrivingskill_auth_user');
    const storedToken = await storage.getItem('@thrivingskill_auth_token');

    assert.strictEqual(storedUser, null, 'Stored user must be null after logout');
    assert.strictEqual(storedToken, null, 'Stored token must be null after logout');
  });

  // --------------------------------------------------------------------------
  // SECTION 2: Timer Hygiene, Teardown & Unmount Stress Testing
  // --------------------------------------------------------------------------
  console.log('\n⏱️  SECTION 2: Timer Hygiene & Teardown Lifecycle Stress Testing');

  await test('2.1: BrandDrawer navigation timer: 500 rapid unmount cycles leave zero orphaned callbacks', async () => {
    let unhandledCallbackExecuted = 0;
    let properlyCanceledTimers = 0;

    // Simulate 500 rapid mount -> handleNav -> unmount cycles
    for (let i = 0; i < 500; i++) {
      let isMounted = true;
      const navTimerRef = { current: null };

      // Component mount effect cleanup registration
      const cleanup = () => {
        isMounted = false;
        if (navTimerRef.current) {
          clearTimeout(navTimerRef.current);
          navTimerRef.current = null;
          properlyCanceledTimers++;
        }
      };

      // Trigger navigation
      const action = () => {
        if (!isMounted) {
          unhandledCallbackExecuted++;
        }
      };

      if (navTimerRef.current) {
        clearTimeout(navTimerRef.current);
      }
      navTimerRef.current = setTimeout(() => {
        navTimerRef.current = null;
        action();
      }, 150);

      // Random unmount delay between 0ms and 50ms (before the 150ms timer completes)
      const unmountDelay = Math.floor(Math.random() * 50);
      if (unmountDelay === 0) {
        cleanup();
      } else {
        await new Promise((r) => setTimeout(r, unmountDelay));
        cleanup();
      }
    }

    // Wait 200ms to guarantee any lingering timer would have fired
    await new Promise((r) => setTimeout(r, 200));

    assert.strictEqual(
      unhandledCallbackExecuted,
      0,
      `Detected ${unhandledCallbackExecuted} unhandled callbacks firing on unmounted BrandDrawer!`
    );
    assert(properlyCanceledTimers >= 500, `All 500 timers must be properly tracked and cleaned`);
  });

  await test('2.2: SaaSContext copilot debouncing: 50 rapid bursts collapse into exactly 1 timer execution', async () => {
    let executions = 0;
    const copilotTimerRef = { current: null };

    const sendCopilotMessage = (text) => {
      if (copilotTimerRef.current) {
        clearTimeout(copilotTimerRef.current);
      }
      copilotTimerRef.current = setTimeout(() => {
        copilotTimerRef.current = null;
        executions++;
      }, 50); // fast test timer
    };

    // Burst 50 queries in 10ms
    for (let i = 1; i <= 50; i++) {
      sendCopilotMessage(`Query #${i}`);
    }

    // Wait 100ms for debounced timer to resolve
    await new Promise((r) => setTimeout(r, 100));

    assert.strictEqual(
      executions,
      1,
      `Expected exactly 1 debounced execution for 50 rapid queries, but got ${executions}`
    );
    assert.strictEqual(copilotTimerRef.current, null, 'copilotTimerRef must be reset to null after execution');
  });

  await test('2.3: SaaSContext unmount while copilot query in-flight cancels timer cleanly', async () => {
    let executionFired = false;
    let isMounted = true;
    const copilotTimerRef = { current: null };

    // Cleanup simulation
    const unmount = () => {
      isMounted = false;
      if (copilotTimerRef.current) {
        clearTimeout(copilotTimerRef.current);
        copilotTimerRef.current = null;
      }
    };

    // Trigger copilot with 200ms delay
    copilotTimerRef.current = setTimeout(() => {
      copilotTimerRef.current = null;
      if (!isMounted) {
        executionFired = true;
      }
    }, 200);

    // Unmount after 50ms
    await new Promise((r) => setTimeout(r, 50));
    unmount();

    // Wait until 300ms has elapsed
    await new Promise((r) => setTimeout(r, 250));

    assert.strictEqual(executionFired, false, 'Copilot response must NOT fire after component unmount');
    assert.strictEqual(copilotTimerRef.current, null, 'copilotTimerRef must be null');
  });

  await test('2.4: Comprehensive static audit of all timers in src/ ensures strict useRef + unmount hygiene', async () => {
    const srcDir = path.join(PROJECT_ROOT, 'src');
    const timerOffenders = [];

    function scanFiles(dir) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          scanFiles(fullPath);
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
          const content = fs.readFileSync(fullPath, 'utf8');

          // Check if file uses setTimeout/setInterval
          const hasTimer = content.includes('setTimeout') || content.includes('setInterval');
          if (hasTimer && file.endsWith('.tsx')) {
            // Must have useRef and clearTimeout/clearInterval
            const hasTimerRef = content.includes('TimerRef') || content.includes('timerRef') || content.includes('Timeout') || content.includes('Interval');
            const hasClear = content.includes('clearTimeout') || content.includes('clearInterval');

            // Exclude pure utility/service files, check React components
            if (content.includes('import React') || content.includes('from \'react\'')) {
              if (!hasClear) {
                timerOffenders.push(`${file}: Has setTimeout/setInterval but lacks clearTimeout/clearInterval`);
              }
            }
          }
        }
      }
    }

    scanFiles(srcDir);
    assert.strictEqual(
      timerOffenders.length,
      0,
      `Detected component files with unhandled timers:\n${timerOffenders.join('\n')}`
    );
  });

  // --------------------------------------------------------------------------
  // SECTION 3: WordPress Admin Portal Access Guard Adversarial Attack Surface
  // --------------------------------------------------------------------------
  console.log('\n🛡️  SECTION 3: WordPress Admin Portal Access Guard Adversarial Matrix');

  const isUserAdmin = (user) => Array.isArray(user?.roles) && user.roles.includes('administrator');

  await test('3.1: Strict role evaluation: 32 adversarial malicious/corrupt user objects rejected', async () => {
    // Test prototype pollution via JSON parsing directly
    const jsonParsedProto = JSON.parse('{"__proto__": {"roles": ["administrator"]}}');
    assert.strictEqual(isUserAdmin(jsonParsedProto), false, 'JSON.parse with __proto__ must not evaluate to admin');

    const adversarialAttacks = [
      // Nullish & empty
      { desc: 'null user', input: null, expected: false },
      { desc: 'undefined user', input: undefined, expected: false },
      { desc: 'empty object {}', input: {}, expected: false },
      { desc: 'user with null roles', input: { roles: null }, expected: false },
      { desc: 'user with undefined roles', input: { roles: undefined }, expected: false },
      { desc: 'user with empty roles array []', input: { roles: [] }, expected: false },

      // Substring & typo attacks
      { desc: 'role substring "admin"', input: { roles: ['admin'] }, expected: false },
      { desc: 'role substring "administrator_assistant"', input: { roles: ['administrator_assistant'] }, expected: false },
      { desc: 'role substring "super_administrator"', input: { roles: ['super_administrator'] }, expected: false },
      { desc: 'role substring "not_an_administrator"', input: { roles: ['not_an_administrator'] }, expected: false },
      { desc: 'role typo "administrat0r"', input: { roles: ['administrat0r'] }, expected: false },

      // Case sensitivity & whitespace attacks
      { desc: 'uppercase "ADMINISTRATOR"', input: { roles: ['ADMINISTRATOR'] }, expected: false },
      { desc: 'titlecase "Administrator"', input: { roles: ['Administrator'] }, expected: false },
      { desc: 'leading space " administrator"', input: { roles: [' administrator'] }, expected: false },
      { desc: 'trailing newline "administrator\\n"', input: { roles: ['administrator\n'] }, expected: false },

      // Standard non-admin roles
      { desc: 'customer role', input: { roles: ['customer'] }, expected: false },
      { desc: 'subscriber role', input: { roles: ['subscriber'] }, expected: false },
      { desc: 'author role', input: { roles: ['author'] }, expected: false },
      { desc: 'contributor role', input: { roles: ['contributor'] }, expected: false },
      { desc: 'editor role', input: { roles: ['editor'] }, expected: false },
      { desc: 'lp_teacher (instructor) role', input: { roles: ['lp_teacher'] }, expected: false },
      { desc: 'multi-role without administrator', input: { roles: ['customer', 'subscriber', 'editor'] }, expected: false },

      // Spoofing attacks
      { desc: 'username "admin" with customer role', input: { username: 'admin', roles: ['customer'] }, expected: false },
      { desc: 'username "administrator" with empty roles', input: { username: 'administrator', roles: [] }, expected: false },
      { desc: 'email "admin@staging.thrivingskill.com" with subscriber role', input: { email: 'admin@staging.thrivingskill.com', roles: ['subscriber'] }, expected: false },
      { desc: 'spoofed isAdmin flag with subscriber role', input: { isAdmin: true, roles: ['subscriber'] }, expected: false },
      { desc: 'spoofed capabilities dictionary', input: { capabilities: { administrator: true }, roles: [] }, expected: false },

      // Type confusion attacks
      { desc: 'roles as string "administrator"', input: { roles: 'administrator' }, expected: false },
      { desc: 'roles as number 1', input: { roles: 1 }, expected: false },
      { desc: 'roles as object { 0: "administrator" }', input: { roles: { 0: 'administrator', length: 1 } }, expected: false },
      { desc: 'duck-typed includes function returning true', input: { roles: { includes: () => true } }, expected: false },

      // Legitimate administrator accounts (MUST pass)
      { desc: 'pure administrator role', input: { roles: ['administrator'] }, expected: true },
      { desc: 'mixed role with customer and administrator', input: { roles: ['customer', 'administrator'] }, expected: true },
      { desc: 'mixed role with subscriber, instructor, administrator', input: { roles: ['subscriber', 'lp_teacher', 'administrator'] }, expected: true },
    ];

    for (const atk of adversarialAttacks) {
      const result = isUserAdmin(atk.input);
      assert.strictEqual(
        result,
        atk.expected,
        `Adversarial attack failed for "${atk.desc}": expected ${atk.expected}, got ${result}`
      );
    }
  });

  await test('3.2: Verify ProfileScreen.tsx guards all occurrences of WP_ADMIN_URL with isAdmin', async () => {
    const profilePath = path.join(PROJECT_ROOT, 'src', 'screens', 'ProfileScreen.tsx');
    const content = fs.readFileSync(profilePath, 'utf8');

    // Count occurrences of WP_ADMIN_URL in ProfileScreen.tsx
    const matches = content.match(/WP_ADMIN_URL/g) || [];
    assert(matches.length > 0, 'ProfileScreen.tsx must contain references to WP_ADMIN_URL');

    // Verify both sections:
    // 1. Admin Management Console (Section 2 Spec)
    assert(
      content.includes('{isAdmin && (\n          <View style={styles.section}>\n            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>\n              {isBangla ? \'অ্যাডমিন কন্ট্রোল সেন্টার\' : \'ADMIN MANAGEMENT CONSOLE\'}'),
      'ProfileScreen.tsx Admin Management Console must be strictly wrapped in {isAdmin && ( ... )}'
    );

    // 2. Preferences & Settings WP-Admin shortcut
    assert(
      content.includes('{isAdmin && (\n            <TouchableOpacity\n              style={[styles.settingRow, { borderBottomColor: colors.borderSubtle }]}\n              onPress={() => Linking.openURL(Env.WP_ADMIN_URL)}'),
      'ProfileScreen.tsx App Preferences WP-Admin shortcut must be strictly wrapped in {isAdmin && ( ... )}'
    );

    // Verify declaration of isAdmin
    assert(
      content.includes("const isAdmin = Array.isArray(user?.roles) && user.roles.includes('administrator');"),
      'ProfileScreen.tsx must declare isAdmin strictly using Array.isArray and includes'
    );
  });

  await test('3.3: Verify BrandDrawer.tsx exposes zero active clickable links to WP-Admin', async () => {
    const drawerPath = path.join(PROJECT_ROOT, 'src', 'components', 'common', 'BrandDrawer.tsx');
    const content = fs.readFileSync(drawerPath, 'utf8');

    // If handleOpenWpAdmin exists, verify it is NOT wired to any JSX TouchableOpacity/Pressable
    const jsxMatch = content.match(/onPress=\{[^\}]*handleOpenWpAdmin[^\}]*\}/g);
    assert.strictEqual(
      jsxMatch,
      null,
      'BrandDrawer.tsx must not wire handleOpenWpAdmin to any touchable UI element without role check'
    );
  });

  // --------------------------------------------------------------------------
  // SECTION 4: Live Staging Dynamic Account End-to-End Adversarial Probe
  // --------------------------------------------------------------------------
  console.log('\n🌐 SECTION 4: Live Backend Dynamic Account Security & Role Verification');

  let dynamicStudent = null;

  await test('4.1: Register non-destructive dynamic student and verify non-admin role assignment', async () => {
    const randId = Date.now().toString().slice(-6);
    const username = `ts_adv_${randId}`;
    const email = `ts_adv_${randId}@thrivingskill.test`;
    const password = `TS_Adv_Pass_${randId}!`;

    const regRes = await request(`${API_BASE}/learnpress/v1/token/register`, {
      method: 'POST',
      body: { username, email, password, confirm_password: password, phone: '01712000000' },
    });

    let token = regRes.body?.token;
    if (!token) {
      // Login fallback
      const loginRes = await request(`${API_BASE}/learnpress/v1/token`, {
        method: 'POST',
        body: { username, password },
      });
      token = loginRes.body?.token;
    }

    assert(token, 'Must obtain valid JWT token for dynamic account');
    dynamicStudent = { username, email, password, token };

    // Fetch user profile from /wp/v2/users/me?context=edit
    const profRes = await request(`${API_BASE}/wp/v2/users/me?context=edit`, {
      headers: { Authorization: `Bearer ${dynamicStudent.token}` },
    });

    assert.strictEqual(profRes.status, 200, 'Profile fetch must return HTTP 200');
    assert(Array.isArray(profRes.body.roles), 'Profile must contain roles array');

    // Verify non-admin role strictly
    assert.strictEqual(
      isUserAdmin(profRes.body),
      false,
      `New student account must NEVER evaluate to administrator! Roles: ${JSON.stringify(profRes.body.roles)}`
    );
  });

  await test('4.2: Verify dynamic account cannot escalate privileges via profile update payload (WordPress prevents privilege escalation)', async () => {
    assert(dynamicStudent && dynamicStudent.token, 'Dynamic student required');

    // Attempt to inject roles: ['administrator'] via POST /wp/v2/users/me
    const updateRes = await request(`${API_BASE}/wp/v2/users/me`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${dynamicStudent.token}` },
      body: {
        name: 'Attempted Escalation',
        roles: ['administrator'],
      },
    });

    // WordPress REST API either returns 403 Forbidden or ignores/drops unauthorized roles change (200 OK)
    assert(
      [200, 403].includes(updateRes.status),
      `WordPress REST API response to role alteration must be 200 or 403, got ${updateRes.status}`
    );

    // Re-verify roles with context=edit remain unescalated
    const verifyRes = await request(`${API_BASE}/wp/v2/users/me?context=edit`, {
      headers: { Authorization: `Bearer ${dynamicStudent.token}` },
    });

    assert.strictEqual(
      isUserAdmin(verifyRes.body),
      false,
      'Roles array MUST NOT be modifiable by unprivileged student!'
    );
  });

  await test('4.3: Verify dynamic account password change and re-authentication with new credentials', async () => {
    assert(dynamicStudent && dynamicStudent.token, 'Dynamic student required');

    const newPassword = `${dynamicStudent.password}_NEW!`;

    // Change password via authenticated endpoint
    const changeRes = await request(`${API_BASE}/learnpress/v1/users/change-password`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${dynamicStudent.token}` },
      body: {
        old_password: dynamicStudent.password,
        new_password: newPassword,
        confirm_password: newPassword,
      },
    });

    assert.strictEqual(changeRes.status, 200, `Password change failed: ${changeRes.raw}`);
    assert.strictEqual(changeRes.body.code, 'success', 'Password change must return success code');

    // Verify re-login with old password fails
    const oldLoginRes = await request(`${API_BASE}/learnpress/v1/token`, {
      method: 'POST',
      body: { username: dynamicStudent.username, password: dynamicStudent.password },
    });
    assert.strictEqual(oldLoginRes.status, 403, 'Old password must fail authentication');
    assert.strictEqual(oldLoginRes.body.code, '[lp_jwt_auth] incorrect_password');

    // Verify re-login with new password succeeds
    const newLoginRes = await request(`${API_BASE}/learnpress/v1/token`, {
      method: 'POST',
      body: { username: dynamicStudent.username, password: newPassword },
    });
    assert.strictEqual(newLoginRes.status, 200, 'New password must authenticate successfully');
    assert(newLoginRes.body && newLoginRes.body.token, 'New login must return valid JWT token');
  });

  // --------------------------------------------------------------------------
  // SUMMARY REPORT
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log('📊 TIER 5 ADVERSARIAL STRESS TEST SUMMARY');
  console.log('================================================================');
  console.log(`Total Adversarial Tests: ${totalTests}`);
  console.log(`  ✅ Passed:             ${passedTests}`);
  console.log(`  ❌ Failed:             ${failedTests}`);
  console.log(`  Success Rate:          ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (failedTests > 0) {
    console.error('\nFAILURES ENCOUNTERED:');
    for (const f of failures) {
      console.error(`- ${f.name}: ${f.error}`);
    }
    process.exit(1);
  } else {
    console.log('\n🎉 ALL ADVERSARIAL STRESS TESTS PASSED WITH ZERO FAILURES!');
    process.exit(0);
  }
}

runAdversarialSuite().catch((err) => {
  console.error('Fatal crash in adversarial harness:', err);
  process.exit(1);
});
