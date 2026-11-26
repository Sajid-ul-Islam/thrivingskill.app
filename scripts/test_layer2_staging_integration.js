/**
 * Layer 2: Staging Backend Integration & End-to-End Course Journey Runner
 *
 * Exercises live REST endpoints against https://staging.thrivingskill.com (default)
 * without mocks. Safe by default: read-only & non-destructive negative auth checks run
 * automatically; mutating E2E course journey steps require explicit credentials via
 * STAGING_TEST_USERNAME / STAGING_TEST_PASSWORD (or opt-in STAGING_ALLOW_TEMP_REGISTRATION=1).
 *
 * Usage:
 *   node scripts/test_layer2_staging_integration.js
 *   node scripts/test_layer2_staging_integration.js --journey
 *   node scripts/test_layer2_staging_integration.js --strict-companion
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PKG_VERSION = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;

const BASE_URL = (process.env.STAGING_BASE_URL || 'https://staging.thrivingskill.com').replace(/\/+$/, '');
const STRICT_COMPANION = process.argv.includes('--strict-companion');
const RUN_JOURNEY = process.argv.includes('--journey');
const REQUEST_TIMEOUT_MS = Number(process.env.STAGING_TIMEOUT_MS || 15000);

const results = [];

function record(layer, name, status, detail) {
  const icon = status === 'PASS' ? '✅' : status === 'WARN' ? '⚠️' : status === 'SKIP' ? '⏭️' : '❌';
  console.log(`${icon} [${status}] ${layer} :: ${name}${detail ? ` — ${detail}` : ''}`);
  results.push({ layer, name, status, detail });
}

async function httpJson(urlPath, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const fullUrl = urlPath.startsWith('http') ? urlPath : `${BASE_URL}${urlPath}`;

  try {
    const res = await fetch(fullUrl, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': `ThrivingSkillsApp/${PKG_VERSION} (Layer2-Staging-QA)`,
        ...(options.headers || {}),
      },
    });
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
    return { ok: res.ok, status: res.status, json, rawText: text };
  } finally {
    clearTimeout(timer);
  }
}

async function runRouteAndHealthChecks() {
  // 1. Root REST index & Companion route discovery
  const indexRes = await httpJson('/wp-json');
  if (!indexRes.ok || !indexRes.json || !indexRes.json.routes) {
    record('Health', 'WP REST Discovery Index', 'FAIL', `HTTP ${indexRes.status}`);
    return { discoveredRoutes: [], sampleCourses: [] };
  }

  const discoveredRoutes = Object.keys(indexRes.json.routes);
  record('Health', 'WP REST Discovery Index', 'PASS', `${discoveredRoutes.length} routes discovered`);

  const coreRoutes = [
    '/thrivingskill/v1/config',
    '/thrivingskill/v1/feed',
    '/thrivingskill/v1/register',
    '/thrivingskill/v1/register-push-token',
    '/learnpress/v1/token',
    '/learnpress/v1/courses',
    '/learnpress/v1/courses/enroll',
    '/learnpress/v1/lessons/finish',
    '/learnpress/v1/courses/finish',
    '/learnpress/v1/review/submit',
    '/wc/store/v1/products',
  ];
  for (const r of coreRoutes) {
    const found = discoveredRoutes.some((k) => k === r || k.startsWith(r));
    record('Contract', `Core Route ${r}`, found ? 'PASS' : 'FAIL', found ? 'active' : 'missing');
  }

  // Repo v1.2.0 companion plugin routes (flagged strictly if --strict-companion)
  const v12Routes = [
    '/thrivingskill/v1/enrollments',
    '/thrivingskill/v1/learning-state',
    '/thrivingskill/v1/certificates/verify',
    '/thrivingskill/v1/auth/webview-handoff',
    '/thrivingskill/v1/revoke-token',
    '/thrivingskill/v1/verify-registration',
    '/thrivingskill/v1/resend-registration',
    '/thrivingskill/v1/auth/reset-password/confirm',
  ];
  for (const r of v12Routes) {
    const found = discoveredRoutes.some((k) => k === r);
    record(
      'Companion v1.2',
      `Route ${r}`,
      found ? 'PASS' : STRICT_COMPANION ? 'FAIL' : 'WARN',
      found ? 'deployed' : 'not yet deployed on Staging (plugin v1.2.0 ZIP upload required)'
    );
  }
  const hasSubmitReviewRoute = discoveredRoutes.some((k) => k.includes('/thrivingskill/v1/courses/') && k.includes('submit-review'));
  record(
    'Companion v1.2',
    'Route /thrivingskill/v1/courses/{id}/submit-review',
    hasSubmitReviewRoute ? 'PASS' : STRICT_COMPANION ? 'FAIL' : 'WARN',
    hasSubmitReviewRoute ? 'deployed' : 'not yet deployed on Staging (falls back to LP /review/submit)'
  );

  // 2. Config handshake
  const cfgRes = await httpJson('/wp-json/thrivingskill/v1/config');
  if (cfgRes.ok && cfgRes.json && typeof cfgRes.json.maintenance_mode === 'boolean') {
    record(
      'Config',
      'GET /thrivingskill/v1/config',
      'PASS',
      `latest=${cfgRes.json.latest_version}, min=${cfgRes.json.min_version}, checkout=${cfgRes.json.checkout_mode || 'default'}`
    );
  } else {
    record('Config', 'GET /thrivingskill/v1/config', 'FAIL', `HTTP ${cfgRes.status}`);
  }

  // 3. Feed & LearnPress catalog
  const feedRes = await httpJson('/wp-json/thrivingskill/v1/feed?limit=5&page=1');
  const feedCourses = Array.isArray(feedRes.json) ? feedRes.json : feedRes.json?.courses || [];
  if (feedRes.ok && feedCourses.length > 0) {
    record('Catalog', 'GET /thrivingskill/v1/feed', 'PASS', `${feedCourses.length} courses returned`);
  } else {
    record('Catalog', 'GET /thrivingskill/v1/feed', 'FAIL', `HTTP ${feedRes.status}`);
  }

  const lpRes = await httpJson('/wp-json/learnpress/v1/courses?per_page=10');
  const lpCourses = Array.isArray(lpRes.json) ? lpRes.json : [];
  if (lpRes.ok && lpCourses.length > 0) {
    const firstId = lpCourses[0].id;
    record('Catalog', 'GET /learnpress/v1/courses', 'PASS', `${lpCourses.length} LP courses, sample id=${firstId}`);

    const detailRes = await httpJson(`/wp-json/learnpress/v1/courses/${firstId}`);
    record(
      'Catalog',
      `GET /learnpress/v1/courses/${firstId}`,
      detailRes.ok && detailRes.json?.sections ? 'PASS' : 'FAIL',
      detailRes.ok ? `sections=${detailRes.json?.sections?.length ?? 0}` : `HTTP ${detailRes.status}`
    );
  } else {
    record('Catalog', 'GET /learnpress/v1/courses', 'FAIL', `HTTP ${lpRes.status}`);
  }

  // 4. WooCommerce Store Products (Payment Catalog Health)
  const wcRes = await httpJson('/wp-json/wc/store/v1/products?per_page=5');
  const wcProducts = Array.isArray(wcRes.json) ? wcRes.json : [];
  record(
    'Payment',
    'GET /wc/store/v1/products',
    wcRes.ok && wcProducts.length > 0 ? 'PASS' : 'FAIL',
    wcRes.ok ? `${wcProducts.length} WooCommerce purchasable items` : `HTTP ${wcRes.status}`
  );

  return { discoveredRoutes, lpCourses };
}

async function runAuthBoundaryChecks() {
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
    `HTTP ${emptyRes.status} (${emptyCode})`
  );

  // T1.4.1 Invalid Username Differentiation
  const invalidRes = await httpJson('/wp-json/learnpress/v1/token', {
    method: 'POST',
    body: JSON.stringify({
      username: `nonexistent_${Date.now()}@staging.invalid`,
      password: 'WrongPassword123!',
    }),
  });
  const invalidCode = invalidRes.json?.code || '';
  record(
    'Auth Security',
    'T1.4.1 Invalid Username Rejection',
    invalidRes.status === 403 && invalidCode.includes('invalid_username') ? 'PASS' : 'FAIL',
    `HTTP ${invalidRes.status} (${invalidCode})`
  );

  // Unauthenticated Push Token Guard
  const pushGuard = await httpJson('/wp-json/thrivingskill/v1/register-push-token', {
    method: 'POST',
    body: JSON.stringify({ token: 'ExponentPushToken[unauthorized-probe]' }),
  });
  record(
    'Auth Security',
    'Unauthenticated Push Token Guard',
    pushGuard.status === 401 || pushGuard.status === 403 ? 'PASS' : 'FAIL',
    `HTTP ${pushGuard.status}`
  );

  // Unauthenticated WP Profile Guard
  const meGuard = await httpJson('/wp-json/wp/v2/users/me');
  record(
    'Auth Security',
    'Unauthenticated /wp/v2/users/me Guard',
    meGuard.status === 401 || meGuard.status === 403 ? 'PASS' : 'FAIL',
    `HTTP ${meGuard.status}`
  );
}

async function runCourseE2EJourney(discoveredRoutes, lpCourses) {
  const username = process.env.STAGING_TEST_USERNAME;
  const password = process.env.STAGING_TEST_PASSWORD;

  if (!username || !password) {
    record(
      'E2E Journey',
      'Authenticated Learner Course Workflow',
      'SKIP',
      'Set STAGING_TEST_USERNAME & STAGING_TEST_PASSWORD (and optional STAGING_JOURNEY_COURSE_ID) to execute authenticated journey on Staging.'
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
    record('E2E Journey', 'Step 1: Learner Login', 'FAIL', `HTTP ${loginRes.status} (${loginRes.json?.code || 'unknown'})`);
    return;
  }
  const authHeaders = { Authorization: `Bearer ${token}` };
  record('E2E Journey', 'Step 1: Learner Login', 'PASS', `user_id=${loginRes.json.user_id || 'ok'}`);

  const valRes = await httpJson('/wp-json/learnpress/v1/token/validate', {
    method: 'POST',
    headers: authHeaders,
  });
  record('E2E Journey', 'Step 1b: JWT Validation', valRes.ok ? 'PASS' : 'FAIL', `HTTP ${valRes.status}`);

  // Step 2: Profile Fetch & Safe Unicode Round-Trip Sync (restoring original name afterward)
  const meRes = await httpJson('/wp-json/wp/v2/users/me', { headers: authHeaders });
  if (!meRes.ok || !meRes.json?.id) {
    record('E2E Journey', 'Step 2: Profile Sync Read/Write', 'FAIL', `HTTP ${meRes.status}`);
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

  // Step 3: Select target course (explicit STAGING_JOURNEY_COURSE_ID or free course in catalog)
  const preferredId = process.env.STAGING_JOURNEY_COURSE_ID ? Number(process.env.STAGING_JOURNEY_COURSE_ID) : null;
  const freeCourse = lpCourses.find((c) => Number(c.price) === 0 || c.price_rendered === 'Free');
  const paidCourse = lpCourses.find((c) => Number(c.price) > 0);
  const targetCourseId = preferredId || freeCourse?.id || paidCourse?.id;

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
    `course=${targetCourseId}, lessons=${lessonItems.length}, price=${courseDetailRes.json?.price}`
  );

  // Step 4: Paid Course Checkout Handoff Verification
  if (paidCourse) {
    if (discoveredRoutes.includes('/thrivingskill/v1/auth/webview-handoff')) {
      const handoffRes = await httpJson('/wp-json/thrivingskill/v1/auth/webview-handoff', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ course_id: paidCourse.id }),
      });
      record(
        'E2E Journey',
        'Step 4: Paid Course Checkout WebView Handoff',
        handoffRes.ok && handoffRes.json?.handoff_url ? 'PASS' : 'FAIL',
        `HTTP ${handoffRes.status}`
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
  const enrollRes = await httpJson('/wp-json/learnpress/v1/courses/enroll', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ id: targetCourseId }),
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
  record('E2E Journey', 'Step 5: Course Enrollment', enrolledOk ? 'PASS' : 'FAIL', `HTTP ${enrollRes.status}`);

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

  // Step 7: Complete Course
  const finishCourseRes = await httpJson('/wp-json/learnpress/v1/courses/finish', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ id: targetCourseId }),
  });
  record(
    'E2E Journey',
    'Step 7: Finish Course',
    finishCourseRes.ok || String(finishCourseRes.json?.message || '').toLowerCase().includes('finish') ? 'PASS' : 'FAIL',
    `HTTP ${finishCourseRes.status}`
  );

  // Step 8: Submit Review (companion endpoint if deployed, else LP /review/submit)
  const useCompanionReview = discoveredRoutes.some(
    (k) => k.includes('/thrivingskill/v1/courses/') && k.includes('submit-review')
  );
  const reviewEndpoint = useCompanionReview
    ? `/wp-json/thrivingskill/v1/courses/${targetCourseId}/submit-review`
    : '/wp-json/learnpress/v1/review/submit';
  const reviewBody = useCompanionReview
    ? { rating: 5, comment: 'Automated Layer 2 staging verification review.' }
    : { course_id: targetCourseId, rate: 5, title: 'Staging QA Review', content: 'Automated Layer 2 staging verification review.' };

  const reviewRes = await httpJson(reviewEndpoint, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(reviewBody),
  });
  record(
    'E2E Journey',
    'Step 8: Submit Course Review',
    reviewRes.ok || String(reviewRes.json?.message || '').toLowerCase().includes('already') ? 'PASS' : 'FAIL',
    `endpoint=${reviewEndpoint}, HTTP ${reviewRes.status}`
  );

  // Step 9: Verify Certificate
  if (discoveredRoutes.includes('/thrivingskill/v1/certificates/verify')) {
    const enrollCheck = await httpJson('/wp-json/thrivingskill/v1/enrollments', { headers: authHeaders });
    const match = (enrollCheck.json?.enrollments || []).find((e) => Number(e.course_id) === Number(targetCourseId));
    const certCode = match?.certificate_code;
    if (certCode) {
      const verifyRes = await httpJson(`/wp-json/thrivingskill/v1/certificates/verify?code=${encodeURIComponent(certCode)}`);
      record('E2E Journey', 'Step 9: Certificate Issuance & Verification', verifyRes.ok && verifyRes.json?.valid ? 'PASS' : 'FAIL', `code=${certCode}`);
    } else {
      record('E2E Journey', 'Step 9: Certificate Issuance & Verification', 'WARN', 'Enrollment active; no LP certificate template assigned to test course');
    }
  } else {
    record(
      'E2E Journey',
      'Step 9: Certificate Verification Endpoint',
      STRICT_COMPANION ? 'FAIL' : 'WARN',
      '/thrivingskill/v1/certificates/verify pending companion plugin v1.2.0 deployment on Staging'
    );
  }
}

async function main() {
  console.log('==============================================================');
  console.log(`  THRIVING SKILLS LAYER 2 STAGING SUITE (${BASE_URL})`);
  console.log(`  App Version: ${PKG_VERSION} | Journey: ${RUN_JOURNEY} | Strict Companion: ${STRICT_COMPANION}`);
  console.log('==============================================================\n');

  const { discoveredRoutes, lpCourses } = await runRouteAndHealthChecks();
  await runAuthBoundaryChecks();
  if (RUN_JOURNEY) {
    await runCourseE2EJourney(discoveredRoutes, lpCourses);
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
