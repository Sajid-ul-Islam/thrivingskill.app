/**
 * Dual-Environment Verification Suite
 * Verifies production and staging environment switching, fallbacks,
 * image sanitization, password reset URL parsing, and live connectivity.
 */

const https = require('https');

// Helper to probe an HTTPS URL
function probeHttps(url) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const req = https.request(
        {
          hostname: parsed.hostname,
          path: parsed.pathname + parsed.search,
          method: 'GET',
          headers: {
            'User-Agent': 'ThrivingSkillsApp/1.4.0 (Node Verification)',
            Accept: 'application/json',
          },
          timeout: 10000,
        },
        (res) => {
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 400, status: res.statusCode });
        }
      );
      req.on('error', (err) => resolve({ ok: false, error: err.message }));
      req.on('timeout', () => {
        req.destroy();
        resolve({ ok: false, error: 'Timeout' });
      });
      req.end();
    } catch (e) {
      resolve({ ok: false, error: e.message });
    }
  });
}

async function runVerification() {
  console.log('====================================================');
  console.log(' THRIVING SKILLS DUAL-ENVIRONMENT VERIFICATION SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(desc, condition) {
    total++;
    if (condition) {
      console.log(`[PASS] ${desc}`);
      passed++;
    } else {
      console.error(`[FAIL] ${desc}`);
    }
  }

  // Test 1: Verify env module exports and default configuration
  const { Env, ENVIRONMENTS } = require('../src/config/env');
  assert('ENVIRONMENTS contains both production and staging presets', 
    ENVIRONMENTS.production && ENVIRONMENTS.staging &&
    ENVIRONMENTS.production.siteUrl === 'https://thrivingskill.com' &&
    ENVIRONMENTS.staging.siteUrl === 'https://staging.thrivingskill.com'
  );

  // Test 2: Default environment is production
  assert('Default environment is production', Env.currentEnvironment === 'production');
  assert('Default API_URL is https://thrivingskill.com/wp-json', Env.API_URL === 'https://thrivingskill.com/wp-json');
  assert('Default SITE_URL is https://thrivingskill.com', Env.SITE_URL === 'https://thrivingskill.com');
  assert('Fallback API_URL is https://staging.thrivingskill.com/wp-json', Env.FALLBACK_API_URL === 'https://staging.thrivingskill.com/wp-json');
  assert('Fallback SITE_URL is https://staging.thrivingskill.com', Env.FALLBACK_SITE_URL === 'https://staging.thrivingskill.com');

  // Test 3: Environment subscriber notification & dynamic switching
  let subscriberNotifiedWith = null;
  const unsubscribe = Env.subscribeEnvironment((env) => {
    subscriberNotifiedWith = env;
  });

  await Env.setEnvironment('staging');
  assert('Switched environment to staging', Env.currentEnvironment === 'staging');
  assert('Subscriber was notified with "staging"', subscriberNotifiedWith === 'staging');
  assert('Staging API_URL is https://staging.thrivingskill.com/wp-json', Env.API_URL === 'https://staging.thrivingskill.com/wp-json');
  assert('Staging SITE_URL is https://staging.thrivingskill.com', Env.SITE_URL === 'https://staging.thrivingskill.com');
  assert('Staging fallback API_URL points back to production', Env.FALLBACK_API_URL === 'https://thrivingskill.com/wp-json');
  assert('Staging fallback SITE_URL points back to production', Env.FALLBACK_SITE_URL === 'https://thrivingskill.com');

  // Switch back to production
  await Env.setEnvironment('production');
  assert('Switched back to production', Env.currentEnvironment === 'production');
  assert('Subscriber was notified with "production"', subscriberNotifiedWith === 'production');
  unsubscribe();

  // Test 4: Image URI sanitization for both domains
  const { getSafeImageUri } = require('../src/utils/imageUtils');
  const liveImg = getSafeImageUri('http://thrivingskill.com/wp-content/uploads/sample.jpg');
  const stagingImg = getSafeImageUri('http://staging.thrivingskill.com/wp-content/uploads/sample.jpg');
  assert('getSafeImageUri upgrades http://thrivingskill.com to https', liveImg === 'https://thrivingskill.com/wp-content/uploads/sample.jpg');
  assert('getSafeImageUri upgrades http://staging.thrivingskill.com to https', stagingImg === 'https://staging.thrivingskill.com/wp-content/uploads/sample.jpg');

  // Test 5: parseResetPasswordUrl for staging, production, and custom scheme
  const { parseResetPasswordUrl } = require('../src/components/modals/AuthModal');
  const prodReset = parseResetPasswordUrl('https://thrivingskill.com/login/?action=rp&key=xyz123&login=johndoe');
  const stagingReset = parseResetPasswordUrl('https://staging.thrivingskill.com/login/?action=rp&key=stagingKey99&login=stagingUser');
  const customSchemeReset = parseResetPasswordUrl('thrivingskill://reset-password?key=appKey88&login=appUser');

  assert('parseResetPasswordUrl parses production link', prodReset && prodReset.key === 'xyz123' && prodReset.login === 'johndoe');
  assert('parseResetPasswordUrl parses staging link', stagingReset && stagingReset.key === 'stagingKey99' && stagingReset.login === 'stagingUser');
  assert('parseResetPasswordUrl parses custom scheme link', customSchemeReset && customSchemeReset.key === 'appKey88' && customSchemeReset.login === 'appUser');

  // Test 6: Live connectivity to both production and staging endpoints
  console.log('\n--- Probing Live Endpoints ---');
  const prodCourses = await probeHttps('https://thrivingskill.com/wp-json/learnpress/v1/courses?per_page=1');
  console.log(`Live Production Courses (/learnpress/v1/courses): status=${prodCourses.status}, ok=${prodCourses.ok}`);
  assert('Live Production LearnPress API responds with HTTP 200', prodCourses.ok && prodCourses.status === 200);

  const stagingCourses = await probeHttps('https://staging.thrivingskill.com/wp-json/learnpress/v1/courses?per_page=1');
  console.log(`Staging Courses (/learnpress/v1/courses): status=${stagingCourses.status}, ok=${stagingCourses.ok}`);
  assert('Staging LearnPress API responds with HTTP 200', stagingCourses.ok && stagingCourses.status === 200);

  const stagingCompanion = await probeHttps('https://staging.thrivingskill.com/wp-json/thrivingskill/v1/register');
  console.log(`Staging Companion (/thrivingskill/v1/register): status=${stagingCompanion.status}`);
  assert('Staging Companion endpoint is present (returns 400 on empty GET/no payload)', stagingCompanion.status === 400 || stagingCompanion.status === 405);

  console.log('\n====================================================');
  console.log(`VERIFICATION SUMMARY: ${passed}/${total} TESTS PASSED`);
  console.log('====================================================\n');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
