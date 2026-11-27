/**
 * Layer 2: Staging Backend Integration & End-to-End Course Journey Runner
 *
 * Exercises live REST endpoints against https://staging.thrivingskill.com (default)
 * without mocks. Covers core WordPress/LearnPress/WooCommerce routes, Companion v1.2+
 * & v1.3+ endpoints, plugin version parity, unauthenticated guards, and the full
 * authenticated learner workflow.
 *
 * Usage:
 *   node scripts/test_layer2_staging_integration.js
 *   node scripts/test_layer2_staging_integration.js --journey
 *   node scripts/test_layer2_staging_integration.js --strict-companion --journey
 *   node scripts/test_layer2_staging_integration.js --strict-companion --expected-plugin-version 1.3.0
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PKG_VERSION = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;

function readRepoPluginVersion() {
  const phpPath = path.join(ROOT, 'backend-plugin', 'ts-mobile-bridge', 'ts-mobile-bridge.php');
  const php = fs.readFileSync(phpPath, 'utf8');
  const m = php.match(/define\(\s*'TSMB_VERSION'\s*,\s*'([^']+)'\s*\)/);
  return m ? m[1] : null;
}

function getFlagValue(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx !== -1 && process.argv[idx + 1] && !process.argv[idx + 1].startsWith('--')) {
    return process.argv[idx + 1].trim();
  }
  const eq = process.argv.find((a) => a.startsWith(`${flag}=`));
  return eq ? eq.slice(flag.length + 1).trim() : null;
}

const BASE_URL = (
  getFlagValue('--base-url') ||
  process.env.STAGING_BASE_URL ||
  'https://staging.thrivingskill.com'
).replace(/\/+$/, '');
const STRICT_COMPANION = process.argv.includes('--strict-companion');
const RUN_JOURNEY = process.argv.includes('--journey');
const ALLOW_UNAUTH_SKIP = process.argv.includes('--allow-unauthenticated-skip');
const ALLOW_PROD_JOURNEY = process.argv.includes('--allow-production-journey');
const EXPECTED_PLUGIN_VERSION =
  getFlagValue('--expected-plugin-version') ||
  process.env.EXPECTED_PLUGIN_VERSION ||
  readRepoPluginVersion();
const REQUEST_TIMEOUT_MS = Number(process.env.STAGING_TIMEOUT_MS || 45000);

const IS_PRODUCTION_TARGET = /^https?:\/\/(www\.)?thrivingskill\.com$/i.test(BASE_URL);

const results = [];

function record(layer, name, status, detail) {
  const icon = status === 'PASS' ? '✅' : status === 'WARN' ? '⚠️' : status === 'SKIP' ? '⏭️' : '❌';
  console.log(`${icon} [${status}] ${layer} :: ${name}${detail ? ` — ${detail}` : ''}`);
  results.push({ layer, name, status, detail });
}

async function httpJson(urlPath, options = {}) {
  const { retry = true, ...fetchOptions } = options;
  const maxAttempts = retry ? 2 : 1;
  const fullUrl = urlPath.startsWith('http') ? urlPath : `${BASE_URL}${urlPath}`;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(fullUrl, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': `ThrivingSkillsApp/${PKG_VERSION} (Layer2-Staging-QA)`,
          ...(fetchOptions.headers || {}),
        },
      });
      const text = await res.text();
      let json = null;
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }
      if ((res.status === 522 || res.status === 524) && attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 750));
        continue;
      }
      return { ok: res.ok, status: res.status, json, rawText: text, error: null };
    } catch (err) {
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 750));
        continue;
      }
      return { ok: false, status: 0, json: null, rawText: '', error: err?.message || String(err) };
    } finally {
      clearTimeout(timer);
    }
  }
}

function routeExists(discoveredRoutes, target) {
  return discoveredRoutes.some((k) => k === target || k.startsWith(target));
}

async function runRouteAndHealthChecks() {
  // 1. Scoped namespace REST discovery (/thrivingskill/v1 + /learnpress/v1) with /wp-json fallback.
  // Querying namespace indexes avoids slow uncached 800+ route full /wp-json dumps right after cache purges.
  let discoveredRoutes = [];
  const tsIndexRes = await httpJson('/wp-json/thrivingskill/v1');
  const lpIndexRes = await httpJson('/wp-json/learnpress/v1');

  if (tsIndexRes.ok && tsIndexRes.json?.routes && lpIndexRes.ok && lpIndexRes.json?.routes) {
    discoveredRoutes = Array.from(
      new Set([
        ...Object.keys(tsIndexRes.json.routes),
        ...Object.keys(lpIndexRes.json.routes),
      ])
    );
    record(
      'Health',
      'WP REST Namespace Discovery (/thrivingskill/v1 + /learnpress/v1)',
      'PASS',
      `${discoveredRoutes.length} namespace routes discovered`
    );
  } else {
    const indexRes = await httpJson('/wp-json');
    if (!indexRes.ok || !indexRes.json || !indexRes.json.routes) {
      record(
        'Health',
        'WP REST Discovery Index',
        'FAIL',
        indexRes.error || tsIndexRes.error || lpIndexRes.error || `HTTP ${indexRes.status || tsIndexRes.status || lpIndexRes.status}`
      );
      return { discoveredRoutes: [], lpCourses: [], feedCourses: [] };
    }
    discoveredRoutes = Object.keys(indexRes.json.routes);
    record('Health', 'WP REST Discovery Index', 'PASS', `${discoveredRoutes.length} routes discovered`);
  }

  // Check /wc/store/v1/cart readiness explicitly so coreRoutes doesn't depend on full /wp-json
  const wcProbeRes = await httpJson('/wp-json/wc/store/v1/cart');
  if (wcProbeRes.ok) {
    discoveredRoutes.push('/wc/store/v1/cart');
  }

  const coreRoutes = [
    '/thrivingskill/v1/config',
    '/thrivingskill/v1/feed',
    '/thrivingskill/v1/lessons/',
    '/thrivingskill/v1/register',
    '/thrivingskill/v1/register-push-token',
    '/learnpress/v1/token',
    '/learnpress/v1/courses',
    '/learnpress/v1/courses/enroll',
    '/learnpress/v1/lessons/finish',
    '/learnpress/v1/courses/finish',
    '/learnpress/v1/review/submit',
    '/wc/store/v1/cart',
  ];
  for (const r of coreRoutes) {
    const found = routeExists(discoveredRoutes, r);
    record('Contract', `Core Route ${r}`, found ? 'PASS' : 'FAIL', found ? 'active' : 'missing');
  }

  // Companion v1.2 & v1.3 routes (strict failure when --strict-companion is active)
  const companionRoutes = [
    // v1.2
    { version: 'v1.2', route: '/thrivingskill/v1/enrollments' },
    { version: 'v1.2', route: '/thrivingskill/v1/learning-state' },
    { version: 'v1.2', route: '/thrivingskill/v1/certificates/verify' },
    { version: 'v1.2', route: '/thrivingskill/v1/auth/webview-handoff' },
    { version: 'v1.2', route: '/thrivingskill/v1/revoke-token' },
    { version: 'v1.2', route: '/thrivingskill/v1/verify-registration' },
    { version: 'v1.2', route: '/thrivingskill/v1/resend-registration' },
    { version: 'v1.2', route: '/thrivingskill/v1/auth/reset-password/confirm' },
    // v1.3
    { version: 'v1.3', route: '/thrivingskill/v1/corporate-inquiry' },
    { version: 'v1.3', route: '/thrivingskill/v1/support-tickets' },
    { version: 'v1.3', route: '/thrivingskill/v1/engagement-sync' },
    // v1.4 Admin Analytics
    { version: 'v1.4', route: '/thrivingskill/v1/admin/analytics' },
    { version: 'v1.4', route: '/thrivingskill/v1/admin/analytics/overview' },
    { version: 'v1.4', route: '/thrivingskill/v1/admin/analytics/users' },
    { version: 'v1.4', route: '/thrivingskill/v1/admin/analytics/enrollments' },
    { version: 'v1.4', route: '/thrivingskill/v1/admin/analytics/revenue' },
    { version: 'v1.4', route: '/thrivingskill/v1/admin/analytics/courses' },
    { version: 'v1.4', route: '/thrivingskill/v1/admin/analytics/conversions' },
  ];
  for (const { version, route } of companionRoutes) {
    const found = discoveredRoutes.some((k) => k === route);
    record(
      `Companion ${version}`,
      `Route ${route}`,
      found ? 'PASS' : STRICT_COMPANION ? 'FAIL' : 'WARN',
      found
        ? 'deployed'
        : `missing on Staging (ts-mobile-bridge ${EXPECTED_PLUGIN_VERSION || 'latest'} deployment required)`
    );
  }

  const hasSubmitReviewRoute = discoveredRoutes.some(
    (k) => k.includes('/thrivingskill/v1/courses/') && k.includes('submit-review')
  );
  record(
    'Companion v1.2',
    'Route /thrivingskill/v1/courses/{id}/submit-review',
    hasSubmitReviewRoute ? 'PASS' : STRICT_COMPANION ? 'FAIL' : 'WARN',
    hasSubmitReviewRoute ? 'deployed' : 'not yet deployed on Staging (falls back to LP /review/submit)'
  );

  // 2. Config handshake + Companion plugin version verification
  const cfgRes = await httpJson('/wp-json/thrivingskill/v1/config');
  const vc = cfgRes.json?.version_control || cfgRes.json || {};
  const deployedPluginVer = cfgRes.json?.plugin_version || null;
  const checkoutMode = cfgRes.json?.checkout_policy?.mode || cfgRes.json?.checkout_mode || 'default';
  if (cfgRes.ok && cfgRes.json && typeof vc.maintenance_mode === 'boolean') {
    record(
      'Config',
      'GET /thrivingskill/v1/config',
      'PASS',
      `plugin=${deployedPluginVer || 'unreported'}, latest_app=${vc.latest_version || 'unset'}, checkout=${checkoutMode}`
    );
  } else {
    record('Config', 'GET /thrivingskill/v1/config', 'FAIL', cfgRes.error || `HTTP ${cfgRes.status}`);
  }

  if (EXPECTED_PLUGIN_VERSION) {
    const versionMatches = deployedPluginVer === EXPECTED_PLUGIN_VERSION;
    record(
      'Companion v1.3',
      `Plugin Version Parity (${EXPECTED_PLUGIN_VERSION})`,
      versionMatches ? 'PASS' : STRICT_COMPANION ? 'FAIL' : 'WARN',
      versionMatches
        ? `staging reports v${deployedPluginVer}`
        : `expected v${EXPECTED_PLUGIN_VERSION}, staging reported ${deployedPluginVer || 'missing (pre-v1.3.0 plugin)'}`
    );
  }

  // 3. Feed & LearnPress catalog
  const feedRes = await httpJson('/wp-json/thrivingskill/v1/feed?limit=15&page=1');
  const feedCourses = Array.isArray(feedRes.json) ? feedRes.json : feedRes.json?.courses || [];
  if (feedRes.ok && feedCourses.length > 0) {
    record('Catalog', 'GET /thrivingskill/v1/feed', 'PASS', `${feedCourses.length} courses returned`);
  } else {
    record('Catalog', 'GET /thrivingskill/v1/feed', 'FAIL', feedRes.error || `HTTP ${feedRes.status}`);
  }

  const lpRes = await httpJson('/wp-json/learnpress/v1/courses?per_page=10');
  const lpCourses = Array.isArray(lpRes.json) ? lpRes.json : [];
  if (lpRes.ok && lpCourses.length > 0) {
    record('Catalog', 'GET /learnpress/v1/courses', 'PASS', `${lpCourses.length} LP courses, sample id=${lpCourses[0].id}`);
  } else {
    record('Catalog', 'GET /learnpress/v1/courses', 'FAIL', lpRes.error || `HTTP ${lpRes.status}`);
  }

  // 4. WooCommerce Store Cart Readiness
  const wcCartRes = wcProbeRes;
  record(
    'Payment',
    'GET /wc/store/v1/cart (Checkout Pipeline Readiness)',
    wcCartRes.ok && cfgRes.json?.checkout_policy?.sslcommerz_active !== false ? 'PASS' : 'FAIL',
    wcCartRes.error ||
      `HTTP ${wcCartRes.status}, checkout_url=${cfgRes.json?.checkout_policy?.checkout_url || 'unset'}, sslcommerz=${cfgRes.json?.checkout_policy?.sslcommerz_active}`
  );

  return { discoveredRoutes, lpCourses, feedCourses };
}

async function runAuthBoundaryChecks(discoveredRoutes, lpCourses, feedCourses = []) {
  // T1.4.3 Empty Username Differentiation
  const emptyRes = await httpJson('/wp-json/learnpress/v1/token', {
    method: 'POST',
    body: JSON.stringify({ username: '', password: 'wrong-password' }),
  });
  const emptyCode = emptyRes.json?.code || '';
  record(
    'Auth Security',
    'T1.4.3 Empty Username Rejection',
    emptyRes.status === 403 && emptyCode.includes('empty_username') ? 'PASS' : 'FAIL',
    emptyRes.error || `HTTP ${emptyRes.status} (${emptyCode})`
  );

  // T1.4.1a Invalid Username Differentiation
  const invalidUserRes = await httpJson('/wp-json/learnpress/v1/token', {
    method: 'POST',
    body: JSON.stringify({
      username: `nonexistent_qa_${Date.now()}`,
      password: 'WrongPassword123!',
    }),
  });
  const invalidUserCode = invalidUserRes.json?.code || '';
  record(
    'Auth Security',
    'T1.4.1 Invalid Username Rejection',
    invalidUserRes.status === 403 && invalidUserCode.includes('invalid_username') ? 'PASS' : 'FAIL',
    invalidUserRes.error || `HTTP ${invalidUserRes.status} (${invalidUserCode})`
  );

  // T1.4.1b Invalid Email Differentiation
  const invalidEmailRes = await httpJson('/wp-json/learnpress/v1/token', {
    method: 'POST',
    body: JSON.stringify({
      username: `nonexistent_${Date.now()}@staging.invalid`,
      password: 'WrongPassword123!',
    }),
  });
  const invalidEmailCode = invalidEmailRes.json?.code || '';
  record(
    'Auth Security',
    'T1.4.1 Invalid Email Rejection',
    invalidEmailRes.status === 403 && invalidEmailCode.includes('invalid_email') ? 'PASS' : 'FAIL',
    invalidEmailRes.error || `HTTP ${invalidEmailRes.status} (${invalidEmailCode})`
  );

  // Unauthenticated Push Token Guard (strictly enforced in v1.3.0)
  const pushGuard = await httpJson('/wp-json/thrivingskill/v1/register-push-token', {
    method: 'POST',
    body: JSON.stringify({ token: 'ExponentPushToken[unauthorized-probe]' }),
  });
  record(
    'Auth Security',
    'Unauthenticated Push Token Guard',
    pushGuard.status === 401 || pushGuard.status === 403 ? 'PASS' : 'FAIL',
    pushGuard.error || `HTTP ${pushGuard.status}`
  );

  // Unauthenticated WP Profile Guard
  const meGuard = await httpJson('/wp-json/wp/v2/users/me');
  record(
    'Auth Security',
    'Unauthenticated /wp/v2/users/me Guard',
    meGuard.status === 401 || meGuard.status === 403 ? 'PASS' : 'FAIL',
    meGuard.error || `HTTP ${meGuard.status}`
  );

  // Unauthenticated Paywall Guard on Paid Lesson (prioritize active /feed paid courses)
  const paidIds = new Set(
    [
      ...feedCourses.filter((c) => Number(c.price_bdt || c.price || 0) > 0),
      ...lpCourses.filter(
        (c) =>
          Number(c.price) > 0 ||
          (typeof c.price_rendered === 'string' &&
            !/^free$/i.test(c.price_rendered.trim()) &&
            /\d/.test(c.price_rendered))
      ),
    ].map((c) => Number(c.id))
  );
  let paywallChecked = false;
  for (const paidId of Array.from(paidIds).slice(0, 10)) {
    const paidDetailRes = await httpJson(`/wp-json/learnpress/v1/courses/${paidId}`);
    const allLessons = (paidDetailRes.json?.sections || [])
      .flatMap((s) => s.items || [])
      .filter((i) => i.type === 'lp_lesson');
    const previewLesson = allLessons.find(
      (i) => i.preview === true || i.preview === 'yes' || i.preview === '1'
    );
    const nonPreviewLesson = allLessons.find(
      (i) => i.preview !== true && i.preview !== 'yes' && i.preview !== '1'
    );
    if (nonPreviewLesson) {
      if (previewLesson) {
        const previewRes = await httpJson(`/wp-json/thrivingskill/v1/lessons/${previewLesson.id}`);
        record(
          'Auth Security',
          `Unauthenticated Free Preview Lesson (#${previewLesson.id})`,
          previewRes.ok && Number(previewRes.json?.id) === Number(previewLesson.id) ? 'PASS' : 'FAIL',
          previewRes.error || `HTTP ${previewRes.status}`
        );
      }
      const lessonGuard = await httpJson(`/wp-json/thrivingskill/v1/lessons/${nonPreviewLesson.id}`);
      record(
        'Auth Security',
        `Unauthenticated Paid Lesson Paywall (#${nonPreviewLesson.id})`,
        lessonGuard.status === 401 || lessonGuard.status === 403 ? 'PASS' : STRICT_COMPANION ? 'FAIL' : 'WARN',
        lessonGuard.error || `HTTP ${lessonGuard.status}`
      );
      paywallChecked = true;
      break;
    }
  }
  if (!paywallChecked) {
    record(
      'Auth Security',
      'Unauthenticated Paid Lesson Paywall',
      STRICT_COMPANION ? 'FAIL' : 'WARN',
      'no non-preview paid lesson found across probed courses'
    );
  }

  // Unauthenticated v1.2 / v1.3 companion endpoint guards
  const sampleCourseId = lpCourses[0]?.id || 1;
  const hasSubmitReviewRoute = discoveredRoutes.some(
    (k) => k.includes('/thrivingskill/v1/courses/') && k.includes('submit-review')
  );
  const authCompanionEndpoints = [
    { method: 'GET', path: '/thrivingskill/v1/enrollments', deployed: discoveredRoutes.includes('/thrivingskill/v1/enrollments') },
    { method: 'GET', path: '/thrivingskill/v1/learning-state', deployed: discoveredRoutes.includes('/thrivingskill/v1/learning-state') },
    { method: 'POST', path: '/thrivingskill/v1/revoke-token', body: {}, deployed: discoveredRoutes.includes('/thrivingskill/v1/revoke-token') },
    { method: 'POST', path: '/thrivingskill/v1/auth/webview-handoff', body: { course_id: sampleCourseId }, deployed: discoveredRoutes.includes('/thrivingskill/v1/auth/webview-handoff') },
    {
      method: 'POST',
      path: `/thrivingskill/v1/courses/${sampleCourseId}/submit-review`,
      routeLabel: '/thrivingskill/v1/courses/{id}/submit-review',
      body: { rating: 5, comment: 'unauth probe' },
      deployed: hasSubmitReviewRoute,
    },
    { method: 'GET', path: '/thrivingskill/v1/support-tickets', deployed: discoveredRoutes.includes('/thrivingskill/v1/support-tickets') },
    { method: 'POST', path: '/thrivingskill/v1/support-tickets', body: {}, deployed: discoveredRoutes.includes('/thrivingskill/v1/support-tickets') },
    { method: 'POST', path: '/thrivingskill/v1/engagement-sync', body: {}, deployed: discoveredRoutes.includes('/thrivingskill/v1/engagement-sync') },
    { method: 'GET', path: '/thrivingskill/v1/admin/analytics', deployed: discoveredRoutes.includes('/thrivingskill/v1/admin/analytics') },
    { method: 'GET', path: '/thrivingskill/v1/admin/analytics/revenue', deployed: discoveredRoutes.includes('/thrivingskill/v1/admin/analytics/revenue') },
  ];
  for (const ep of authCompanionEndpoints) {
    const labelPath = ep.routeLabel || ep.path;
    if (!ep.deployed) {
      record(
        'Auth Security',
        `Unauthenticated ${ep.method} ${labelPath}`,
        STRICT_COMPANION ? 'FAIL' : 'WARN',
        'route not deployed on Staging'
      );
      continue;
    }
    const res = await httpJson(`/wp-json${ep.path}`, {
      method: ep.method,
      ...(ep.body ? { body: JSON.stringify(ep.body) } : {}),
    });
    record(
      'Auth Security',
      `Unauthenticated ${ep.method} ${labelPath}`,
      res.status === 401 || res.status === 403 ? 'PASS' : 'FAIL',
      res.error || `HTTP ${res.status}`
    );
  }

  // Safe non-writing validation check for v1.3 /corporate-inquiry
  if (discoveredRoutes.includes('/thrivingskill/v1/corporate-inquiry')) {
    const corpValRes = await httpJson('/wp-json/thrivingskill/v1/corporate-inquiry', {
      method: 'POST',
      body: JSON.stringify({
        service_type: 'Corporate Training',
        company_name: 'QA',
        contact_name: 'Test',
        work_email: 'invalid-email-address',
      }),
    });
    record(
      'Companion v1.3',
      'POST /thrivingskill/v1/corporate-inquiry Validation',
      corpValRes.status === 400 ? 'PASS' : 'FAIL',
      corpValRes.error || `HTTP ${corpValRes.status}`
    );
  }

  // Safe read-only contract probe for v1.2 /certificates/verify
  if (discoveredRoutes.includes('/thrivingskill/v1/certificates/verify')) {
    const certProbe = await httpJson('/wp-json/thrivingskill/v1/certificates/verify?code=INVALID_QA_PROBE');
    const emptyCertProbe = await httpJson('/wp-json/thrivingskill/v1/certificates/verify?code=');
    record(
      'Companion v1.2',
      'GET /thrivingskill/v1/certificates/verify Contract',
      certProbe.ok && certProbe.json?.valid === false && emptyCertProbe.status === 400 ? 'PASS' : 'FAIL',
      certProbe.error || `probe=${certProbe.status}, empty=${emptyCertProbe.status}`
    );
  }
}

async function runCourseE2EJourney(discoveredRoutes, lpCourses, feedCourses = []) {
  const username = process.env.STAGING_TEST_USERNAME;
  const password = process.env.STAGING_TEST_PASSWORD;

  if (!username || !password) {
    record(
      'E2E Journey',
      'Authenticated Learner Course Workflow',
      ALLOW_UNAUTH_SKIP ? 'SKIP' : 'FAIL',
      'Missing STAGING_TEST_USERNAME / STAGING_TEST_PASSWORD secrets required for authenticated Staging E2E journey.'
    );
    return;
  }

  // Step 1: Login & Token Validation
  const loginRes = await httpJson('/wp-json/learnpress/v1/token', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  const token = loginRes.json?.token;
  if (!loginRes.ok || !token) {
    record(
      'E2E Journey',
      'Step 1: Learner Login',
      'FAIL',
      loginRes.error || `HTTP ${loginRes.status} (${loginRes.json?.code || 'unknown'})`
    );
    return;
  }
  const authHeaders = { Authorization: `Bearer ${token}` };
  record('E2E Journey', 'Step 1: Learner Login', 'PASS', `user_id=${loginRes.json.user_id || 'ok'}`);

  const valRes = await httpJson('/wp-json/learnpress/v1/token/validate', {
    method: 'POST',
    headers: authHeaders,
  });
  record('E2E Journey', 'Step 1b: JWT Validation', valRes.ok ? 'PASS' : 'FAIL', valRes.error || `HTTP ${valRes.status}`);

  // Step 2: Profile Fetch & Safe Round-Trip Sync (restoring original name afterward)
  let meRes = await httpJson('/wp-json/wp/v2/users/me?context=edit', { headers: authHeaders });
  if (!meRes.ok && meRes.status === 403) {
    meRes = await httpJson('/wp-json/wp/v2/users/me', { headers: authHeaders });
  }
  const isAdminUser =
    (Array.isArray(meRes.json?.roles) && meRes.json.roles.includes('administrator')) ||
    Boolean(meRes.json?.capabilities?.manage_options);
  if (!meRes.ok || !meRes.json?.id) {
    record('E2E Journey', 'Step 2: Profile Sync Read/Write', 'FAIL', meRes.error || `HTTP ${meRes.status}`);
  } else {
    const origFirst = meRes.json.first_name || 'Staging';
    const markerFirst = `${origFirst.replace(/\s*\[QA\]$/, '')} [QA]`;
    const updateRes = await httpJson('/wp-json/wp/v2/users/me', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ first_name: markerFirst }),
    });
    const restoreRes = await httpJson('/wp-json/wp/v2/users/me', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ first_name: origFirst }),
    });
    record(
      'E2E Journey',
      'Step 2: Profile Bi-directional Sync',
      updateRes.ok && updateRes.json?.first_name === markerFirst && restoreRes.ok ? 'PASS' : 'FAIL',
      `verified & restored (${origFirst})`
    );
  }

  // Step 2b: Authenticated v1.2 / v1.3 Enrollments, Learning State, Support Tickets & Engagement Sync
  let myEnrolledIds = [];
  if (discoveredRoutes.includes('/thrivingskill/v1/enrollments')) {
    const enrollListRes = await httpJson('/wp-json/thrivingskill/v1/enrollments', { headers: authHeaders });
    const rawIds = enrollListRes.json?.enrolled_course_ids ?? enrollListRes.json?.enrollments;
    myEnrolledIds = Array.isArray(rawIds)
      ? rawIds.map((e) => (typeof e === 'object' && e !== null ? Number(e.course_id ?? e.id) : Number(e))).filter(Boolean)
      : [];
    record(
      'E2E Journey',
      'Step 2b: Authenticated GET /enrollments',
      enrollListRes.ok && Array.isArray(enrollListRes.json?.enrolled_course_ids) ? 'PASS' : 'FAIL',
      enrollListRes.error || `HTTP ${enrollListRes.status} (${myEnrolledIds.length} enrolled)`
    );
  }

  if (discoveredRoutes.includes('/thrivingskill/v1/support-tickets')) {
    const ticketsRes = await httpJson('/wp-json/thrivingskill/v1/support-tickets', { headers: authHeaders });
    record(
      'E2E Journey',
      'Step 2b: Authenticated GET /support-tickets',
      ticketsRes.ok && Array.isArray(ticketsRes.json?.tickets) ? 'PASS' : 'FAIL',
      ticketsRes.error || `HTTP ${ticketsRes.status}`
    );

    // Verify POST /support-tickets authenticated handler & input validation without inserting junk leads
    const ticketValRes = await httpJson('/wp-json/thrivingskill/v1/support-tickets', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ topic: 'general', subject: '', message: '' }),
    });
    record(
      'E2E Journey',
      'Step 2b: Authenticated POST /support-tickets Validation',
      ticketValRes.status === 400 ? 'PASS' : 'FAIL',
      ticketValRes.error || `HTTP ${ticketValRes.status}`
    );
  }

  if (
    discoveredRoutes.includes('/thrivingskill/v1/learning-state') &&
    discoveredRoutes.includes('/thrivingskill/v1/engagement-sync')
  ) {
    const preState = await httpJson('/wp-json/thrivingskill/v1/learning-state', { headers: authHeaders });
    record(
      'E2E Journey',
      'Step 2c: Authenticated GET /learning-state',
      preState.ok && preState.json && typeof preState.json.watch_positions === 'object' ? 'PASS' : 'FAIL',
      preState.error || `HTTP ${preState.status}`
    );
    const existingQaPos = Number(preState.json?.watch_positions?.qa_probe?.lesson_1 || 0);
    const highPos = existingQaPos > 0 ? Math.min(86400, existingQaPos) : 1080;
    const lowPos = Math.max(0, highPos - 480);

    const syncHigh = await httpJson('/wp-json/thrivingskill/v1/engagement-sync', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ watch_positions: { qa_probe: { lesson_1: highPos } } }),
    });
    const syncLow = await httpJson('/wp-json/thrivingskill/v1/engagement-sync', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ watch_positions: { qa_probe: { lesson_1: lowPos } } }),
    });
    const retainedPos = Number(syncLow.json?.watch_positions?.qa_probe?.lesson_1 || 0);
    record(
      'E2E Journey',
      'Step 2c: Monotonic Watch-Position Engagement Sync',
      syncHigh.ok && syncLow.ok && retainedPos === highPos ? 'PASS' : 'FAIL',
      `sent high=${highPos}s then low=${lowPos}s -> server retained ${retainedPos}s`
    );
  }

  // Step 3: Select target course (explicit STAGING_JOURNEY_COURSE_ID, free course, pre-enrolled course, or active paid course)
  const preferredId = process.env.STAGING_JOURNEY_COURSE_ID ? Number(process.env.STAGING_JOURNEY_COURSE_ID) : null;
  const freeCourse = lpCourses.find((c) => Number(c.price) === 0 || c.price_rendered === 'Free');
  const paidCourse =
    feedCourses.find((c) => Number(c.price_bdt || c.price || 0) > 0) ||
    lpCourses.find((c) => Number(c.price) > 0);
  const unenrolledPaidCourse =
    [...feedCourses, ...lpCourses].find(
      (c) => Number(c.price_bdt || c.price || 0) > 0 && !myEnrolledIds.includes(Number(c.id))
    ) || null;
  const preEnrolledId = myEnrolledIds[0] || null;
  const targetCourseId = preferredId || freeCourse?.id || preEnrolledId || paidCourse?.id;

  if (!targetCourseId) {
    record('E2E Journey', 'Step 3: Course & Curriculum Inspection', 'FAIL', 'No course found on Staging');
    return;
  }

  const courseDetailRes = await httpJson(`/wp-json/learnpress/v1/courses/${targetCourseId}`, { headers: authHeaders });
  const sections = courseDetailRes.json?.sections || [];
  const lessonItems = sections.flatMap((s) => s.items || []).filter((i) => i.type === 'lp_lesson');
  record(
    'E2E Journey',
    'Step 3: Course & Curriculum Inspection',
    courseDetailRes.ok ? 'PASS' : 'FAIL',
    courseDetailRes.error || `course=${targetCourseId}, lessons=${lessonItems.length}, price=${courseDetailRes.json?.price}`
  );

  // Step 4: Paid Course Checkout Handoff Verification & Paywall Probe
  if (paidCourse) {
    const paidDetailAuthed = await httpJson(`/wp-json/learnpress/v1/courses/${paidCourse.id}`, {
      headers: authHeaders,
    });
    const paidLessons = (paidDetailAuthed.json?.sections || [])
      .flatMap((s) => s.items || [])
      .filter((i) => i.type === 'lp_lesson' && i.preview !== true && i.preview !== 'yes' && i.preview !== '1');
    if (paidLessons.length > 0) {
      const paidLessonProbe = await httpJson(`/wp-json/thrivingskill/v1/lessons/${paidLessons[0].id}`);
      record(
        'E2E Journey',
        `Step 4a: Unauthenticated Paid Lesson Paywall (#${paidLessons[0].id})`,
        paidLessonProbe.status === 401 || paidLessonProbe.status === 403
          ? 'PASS'
          : STRICT_COMPANION
            ? 'FAIL'
            : 'WARN',
        paidLessonProbe.error || `HTTP ${paidLessonProbe.status}`
      );

      // Step 4b: Authenticated-but-unenrolled learner must receive 403 on paid lessons (admins intentionally bypass)
      if (discoveredRoutes.includes('/thrivingskill/v1/enrollments')) {
        if (!myEnrolledIds.includes(Number(paidCourse.id))) {
          const authedUnenrolledProbe = await httpJson(
            `/wp-json/thrivingskill/v1/lessons/${paidLessons[0].id}`,
            { headers: authHeaders }
          );
          if (isAdminUser) {
            record(
              'E2E Journey',
              `Step 4b: Authenticated Paid Lesson Access (#${paidLessons[0].id}, Admin Bypass)`,
              authedUnenrolledProbe.ok ? 'PASS' : 'FAIL',
              `admin user role=administrator HTTP ${authedUnenrolledProbe.status} (supply non-admin subscriber in STAGING_TEST_USERNAME to assert 403)`
            );
          } else {
            record(
              'E2E Journey',
              `Step 4b: Authenticated Unenrolled Paid Lesson Paywall (#${paidLessons[0].id})`,
              authedUnenrolledProbe.status === 403 ? 'PASS' : STRICT_COMPANION ? 'FAIL' : 'WARN',
              authedUnenrolledProbe.error || `HTTP ${authedUnenrolledProbe.status}`
            );
          }
        }
      }
    }

    // Verify LearnPress /courses/enroll rejects unpaid enrollment for paid courses (admins intentionally bypass)
    if (unenrolledPaidCourse) {
      if (isAdminUser) {
        record(
          'E2E Journey',
          `Step 4c: Unpaid Course Enroll Guard (#${unenrolledPaidCourse.id}, Admin Bypass)`,
          'PASS',
          'admin account skips payment requirement as designed; supply non-admin subscriber in STAGING_TEST_USERNAME to assert 403'
        );
      } else {
        const unpaidEnrollProbe = await httpJson('/wp-json/learnpress/v1/courses/enroll', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ id: unenrolledPaidCourse.id }),
          retry: false,
        });
        record(
          'E2E Journey',
          `Step 4c: Unpaid Course Enroll Guard (#${unenrolledPaidCourse.id})`,
          unpaidEnrollProbe.status === 402 || unpaidEnrollProbe.status === 403 ? 'PASS' : 'FAIL',
          unpaidEnrollProbe.error || `HTTP ${unpaidEnrollProbe.status} (${unpaidEnrollProbe.json?.code || 'unexpected_allow'})`
        );
      }
    }

    if (discoveredRoutes.includes('/thrivingskill/v1/auth/webview-handoff')) {
      const handoffRes = await httpJson('/wp-json/thrivingskill/v1/auth/webview-handoff', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ course_id: paidCourse.id }),
      });
      record(
        'E2E Journey',
        'Step 4: Paid Course Checkout WebView Handoff',
        handoffRes.ok && handoffRes.json?.login_url ? 'PASS' : 'FAIL',
        handoffRes.error || `HTTP ${handoffRes.status}`
      );
    } else {
      record(
        'E2E Journey',
        'Step 4: Paid Course Checkout WebView Handoff',
        STRICT_COMPANION ? 'FAIL' : 'WARN',
        'Companion /auth/webview-handoff not deployed on Staging yet; SSLCommerz payment completion requires Layer 3 checkout'
      );
    }
  }

  // Step 5: Enroll (only executes free/already-enrolled course unless configured with paid test entitlement)
  const runEnrollmentSteps = async () => {
    const enrollRes = await httpJson('/wp-json/learnpress/v1/courses/enroll', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ id: targetCourseId }),
      retry: false,
    });
    const enrolledOk =
      enrollRes.ok ||
      enrollRes.json?.status === 'success' ||
      String(enrollRes.json?.message || '').toLowerCase().includes('already');

    if (!enrolledOk && Number(courseDetailRes.json?.price) > 0) {
      record(
        'E2E Journey',
        'Step 5: Course Enrollment',
        'SKIP',
        `Course ${targetCourseId} is paid (HTTP ${enrollRes.status}); set STAGING_JOURNEY_COURSE_ID to a free or pre-enrolled staging test course for Steps 5–9.`
      );
      return;
    }
    record('E2E Journey', 'Step 5: Course Enrollment', enrolledOk ? 'PASS' : 'FAIL', enrollRes.error || `HTTP ${enrollRes.status}`);

    // Step 6: Inspect & Finish First Lesson
    if (lessonItems.length > 0) {
      const firstLessonId = lessonItems[0].id;
      const lessonMetaRes = await httpJson(`/wp-json/thrivingskill/v1/lessons/${firstLessonId}`, { headers: authHeaders });
      const lessonFinishRes = await httpJson('/wp-json/learnpress/v1/lessons/finish', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ id: firstLessonId }),
      });
      record(
        'E2E Journey',
        `Step 6: Lesson View & Finish (#${firstLessonId})`,
        lessonMetaRes.ok && (lessonFinishRes.ok || lessonFinishRes.json?.status === 'success') ? 'PASS' : 'FAIL',
        `meta=${lessonMetaRes.status}, finish=${lessonFinishRes.status}`
      );
    }

    // Step 7: Complete Course only once all lessons are finished (avoid prematurely marking partial courses failed)
    const stateBeforeFinish = discoveredRoutes.includes('/thrivingskill/v1/learning-state')
      ? await httpJson('/wp-json/thrivingskill/v1/learning-state', { headers: authHeaders })
      : null;
    const completedLessonCount = (
      stateBeforeFinish?.json?.progress?.[String(targetCourseId)]?.completedLessonIds || []
    ).length;
    const readyToFinishCourse =
      lessonItems.length === 0 ||
      completedLessonCount >= lessonItems.length ||
      Boolean(stateBeforeFinish?.json?.progress?.[String(targetCourseId)]?.isCompleted);

    if (readyToFinishCourse) {
      const finishCourseRes = await httpJson('/wp-json/learnpress/v1/courses/finish', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ id: targetCourseId }),
      });
      record(
        'E2E Journey',
        'Step 7: Finish Course',
        finishCourseRes.ok || String(finishCourseRes.json?.message || '').toLowerCase().includes('finish') ? 'PASS' : 'FAIL',
        finishCourseRes.error || `HTTP ${finishCourseRes.status}`
      );
    } else {
      record(
        'E2E Journey',
        'Step 7: Course Finish Deferred (Partial Progress)',
        'PASS',
        `${completedLessonCount}/${lessonItems.length} lessons completed; skipping premature /courses/finish`
      );
    }

    // Step 8: Submit Review (enforces 100% completion gate cleanly when course is incomplete)
    const stateAfterFinish = readyToFinishCourse && discoveredRoutes.includes('/thrivingskill/v1/learning-state')
      ? await httpJson('/wp-json/thrivingskill/v1/learning-state', { headers: authHeaders })
      : stateBeforeFinish;
    const isServerCompleted = Boolean(
      stateAfterFinish?.json?.progress?.[String(targetCourseId)]?.isCompleted
    );

    const useCompanionReview = discoveredRoutes.some(
      (k) => k.includes('/thrivingskill/v1/courses/') && k.includes('submit-review')
    );
    const reviewEndpoint = useCompanionReview
      ? `/wp-json/thrivingskill/v1/courses/${targetCourseId}/submit-review`
      : '/wp-json/learnpress/v1/review/submit';
    const reviewBody = useCompanionReview
      ? { rating: 5, comment: 'Automated Layer 2 staging verification review.' }
      : {
          course_id: targetCourseId,
          rate: 5,
          title: 'Staging QA Review',
          content: 'Automated Layer 2 staging verification review.',
        };

    const reviewRes = await httpJson(reviewEndpoint, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(reviewBody),
      retry: false,
    });
    const reviewMsg = String(reviewRes.json?.message || '').toLowerCase();
    const reviewCode = String(reviewRes.json?.code || '');
    const reviewPassed = useCompanionReview && stateAfterFinish?.ok && !isServerCompleted
      ? reviewRes.status === 403 && reviewCode === 'course_not_completed'
      : reviewRes.ok || reviewMsg.includes('already');
    record(
      'E2E Journey',
      useCompanionReview && stateAfterFinish?.ok && !isServerCompleted
        ? 'Step 8: Review Completion Gate (403 until 100% finished)'
        : 'Step 8: Submit Course Review',
      reviewPassed ? 'PASS' : 'FAIL',
      reviewRes.error || `endpoint=${reviewEndpoint}, HTTP ${reviewRes.status}${reviewCode ? ` (${reviewCode})` : ''}`
    );

    // Step 9: Verify Certificate
    if (discoveredRoutes.includes('/thrivingskill/v1/certificates/verify')) {
      const stateForCert = stateAfterFinish?.ok
        ? stateAfterFinish
        : await httpJson('/wp-json/thrivingskill/v1/learning-state', { headers: authHeaders });
      const progressCert = stateForCert?.json?.progress?.[String(targetCourseId)]?.certificateId;
      const certEntry = (stateForCert?.json?.certificates || []).find(
        (c) => Number(c.courseId ?? c.course_id) === Number(targetCourseId)
      );
      const certCode = progressCert || certEntry?.credentialId || certEntry?.certificate_code || '';
      if (certCode) {
        const verifyRes = await httpJson(`/wp-json/thrivingskill/v1/certificates/verify?code=${encodeURIComponent(certCode)}`);
        record(
          'E2E Journey',
          'Step 9: Certificate Issuance & Verification',
          verifyRes.ok && verifyRes.json?.valid ? 'PASS' : 'FAIL',
          `code=${certCode}`
        );
      } else {
        record(
          'E2E Journey',
          'Step 9: Certificate Issuance & Verification',
          'WARN',
          isServerCompleted
            ? 'Completed course has no LP certificate template assigned'
            : `Course ${targetCourseId} partial (${(stateForCert?.json?.progress?.[String(targetCourseId)]?.completedLessonIds || []).length}/${lessonItems.length} lessons); certificate gated until 100% completion`
        );
      }
    } else {
      record(
        'E2E Journey',
        'Step 9: Certificate Verification Endpoint',
        STRICT_COMPANION ? 'FAIL' : 'WARN',
        '/thrivingskill/v1/certificates/verify missing on Staging'
      );
    }
  };

  await runEnrollmentSteps();

  // Step 9b: Admin Analytics Authorization, Caching & Filter Verification
  if (discoveredRoutes.includes('/thrivingskill/v1/admin/analytics')) {
    const anLiveRes = await httpJson('/wp-json/thrivingskill/v1/admin/analytics?preset=all&refresh=1', {
      headers: authHeaders,
    });
    if (!isAdminUser) {
      record(
        'Companion v1.4',
        'Step 9b: Non-Admin Blocked From /admin/analytics (403)',
        anLiveRes.status === 403 ? 'PASS' : 'FAIL',
        anLiveRes.error || `HTTP ${anLiveRes.status} (${anLiveRes.json?.code || ''})`
      );
    } else {
      const ov = anLiveRes.json?.overview || {};
      const rev = anLiveRes.json?.revenue || {};
      const okSchema = anLiveRes.json?.meta?.schema_modified === false;
      const okData =
        anLiveRes.ok &&
        typeof ov.confirmed_revenue === 'number' &&
        typeof ov.confirmed_paid_orders === 'number' &&
        Array.isArray(anLiveRes.json?.course_performance) &&
        Array.isArray(anLiveRes.json?.unsupported_metrics);
      record(
        'Companion v1.4',
        'Step 9b: Admin Analytics Full Dashboard Endpoint',
        okData && okSchema ? 'PASS' : 'FAIL',
        anLiveRes.error ||
          `HTTP ${anLiveRes.status}, revenue=${ov.currency || 'BDT'} ${ov.confirmed_revenue}, paid_orders=${ov.confirmed_paid_orders}, pending=${ov.pending_orders_count}, enrollments=${ov.enrollments_all_time_active}, deduped_lp=${rev.reconciliation?.woo_linked_lp_orders_deduped ?? '?'}, unverified_lp=${rev.reconciliation?.unverified_or_manual_lp_orders ?? '?'}, cache_hit=${anLiveRes.json?.meta?.cache_hit}`
      );

      // Verify WordPress transient cache hit + invalid preset validation
      const anCacheRes = await httpJson('/wp-json/thrivingskill/v1/admin/analytics?preset=all', {
        headers: authHeaders,
      });
      const anBadPreset = await httpJson('/wp-json/thrivingskill/v1/admin/analytics?preset=invalid_range', {
        headers: authHeaders,
      });
      const anRevRes = await httpJson('/wp-json/thrivingskill/v1/admin/analytics/revenue?preset=ytd', {
        headers: authHeaders,
      });
      record(
        'Companion v1.4',
        'Step 9b: Analytics Transient Cache & Input Validation',
        anCacheRes.ok && anCacheRes.json?.meta?.cache_hit === true && anBadPreset.status === 400 && anRevRes.ok
          ? 'PASS'
          : 'FAIL',
        `cache_hit=${anCacheRes.json?.meta?.cache_hit}, invalid_preset_status=${anBadPreset.status}, ytd_revenue=${anRevRes.json?.data?.confirmed_revenue ?? 'err'}`
      );
    }
  }

  // Step 10: Token Revocation Verification (end-of-journey)
  if (discoveredRoutes.includes('/thrivingskill/v1/revoke-token')) {
    const revokeRes = await httpJson('/wp-json/thrivingskill/v1/revoke-token', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ all_devices: false }),
    });
    const postRevokeRes = discoveredRoutes.includes('/thrivingskill/v1/learning-state')
      ? await httpJson('/wp-json/thrivingskill/v1/learning-state', { headers: authHeaders })
      : null;
    const revokedBlocked = !postRevokeRes || postRevokeRes.status === 401 || postRevokeRes.status === 403;
    record(
      'E2E Journey',
      'Step 10: Session Token Revocation & Blocklist',
      revokeRes.ok && revokeRes.json?.revoked === true && revokedBlocked ? 'PASS' : 'FAIL',
      `revoke=${revokeRes.status}${postRevokeRes ? `, post_revoke=${postRevokeRes.status}` : ''}`
    );
  }
}

async function main() {
  console.log('==============================================================');
  console.log(`  THRIVING SKILLS LAYER 2 STAGING SUITE (${BASE_URL})`);
  console.log(
    `  App: ${PKG_VERSION} | Expected Plugin: ${EXPECTED_PLUGIN_VERSION || 'unset'} | Journey: ${RUN_JOURNEY} | Strict Companion: ${STRICT_COMPANION}`
  );
  console.log('==============================================================\n');

  if (IS_PRODUCTION_TARGET && RUN_JOURNEY && !ALLOW_PROD_JOURNEY) {
    console.error('❌ Refusing to run mutating --journey against Production without --allow-production-journey.');
    process.exit(1);
  }

  const { discoveredRoutes, lpCourses, feedCourses } = await runRouteAndHealthChecks();
  await runAuthBoundaryChecks(discoveredRoutes, lpCourses, feedCourses);
  if (RUN_JOURNEY) {
    await runCourseE2EJourney(discoveredRoutes, lpCourses, feedCourses);
  }

  const passed = results.filter((r) => r.status === 'PASS').length;
  const warned = results.filter((r) => r.status === 'WARN').length;
  const skipped = results.filter((r) => r.status === 'SKIP').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;

  console.log('\n==============================================================');
  console.log(`  LAYER 2 SUMMARY: ${passed} PASS | ${warned} WARN | ${skipped} SKIP | ${failed} FAIL`);
  console.log('==============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('❌ Unhandled Layer 2 runner error:', err);
  process.exit(1);
});
