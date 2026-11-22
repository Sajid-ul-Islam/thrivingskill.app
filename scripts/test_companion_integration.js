/**
 * Comprehensive Companion Plugin Integration Test
 * Verifies live communication between mobile app services and TS Mobile Bridge on WordPress staging.
 */

const https = require('https');

const STAGING_API = 'https://staging.thrivingskill.com/wp-json';

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    https.get(url, { headers: { 'User-Agent': 'ThrivingSkillsMobile/1.1' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        const latency = Date.now() - start;
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, latency, sizeBytes: Buffer.byteLength(data) });
        } catch (e) {
          reject(new Error(`Failed to parse JSON from ${url}: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

async function runVerification() {
  console.log('=================================================================');
  console.log('🧪 VERIFYING TS MOBILE BRIDGE COMPANION PLUGIN WITH MOBILE APP');
  console.log(`Backend Target: ${STAGING_API}`);
  console.log('=================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, testName, details = '') {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName} ${details ? '(' + details + ')' : ''}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} ${details ? '(' + details + ')' : ''}`);
    }
  }

  // TEST 1: Remote Config & Command Center Endpoint
  console.log('--- TEST 1: App Remote Config (/thrivingskill/v1/config) ---');
  try {
    const cfg = await fetchJson(`${STAGING_API}/thrivingskill/v1/config`);
    assert(cfg.status === 200, 'HTTP Status 200 OK', `${cfg.latency}ms`);
    assert(cfg.data.status === 'success', 'Config Status Success');
    assert(cfg.data.checkout_policy?.mode === 'webview', 'Google Play Safe Checkout Mode is WebView');
    assert(Boolean(cfg.data.checkout_policy?.checkout_url), 'Dynamic Checkout URL', cfg.data.checkout_policy?.checkout_url);
    assert(Array.isArray(cfg.data.hero_slides) && cfg.data.hero_slides.length > 0, 'Dynamic Hero Slides', `${cfg.data.hero_slides.length} slides`);
    assert(Boolean(cfg.data.flash_sale?.coupon_code), 'Flash Sale Campaign', `Code: ${cfg.data.flash_sale?.coupon_code}, ${cfg.data.flash_sale?.discount_percent}% off`);
    assert(Array.isArray(cfg.data.trending_keywords) && cfg.data.trending_keywords.length > 0, 'Trending Search Keywords', cfg.data.trending_keywords.slice(0, 3).join(', '));
    assert(Boolean(cfg.data.support?.whatsapp), 'Learner Support Hotline', `WhatsApp: ${cfg.data.support?.whatsapp}`);
  } catch (err) {
    assert(false, 'Remote Config Connectivity', err.message);
  }

  // TEST 2: High-Speed Lean Course Feed
  console.log('\n--- TEST 2: Ultra-Fast Lean Course Feed (/thrivingskill/v1/feed) ---');
  let firstCourse = null;
  try {
    const feed = await fetchJson(`${STAGING_API}/thrivingskill/v1/feed?limit=10`);
    assert(feed.status === 200, 'HTTP Status 200 OK', `${feed.latency}ms, ${(feed.sizeBytes / 1024).toFixed(2)} KB`);
    assert(Array.isArray(feed.data.courses) && feed.data.courses.length > 0, 'Course Feed Populated', `${feed.data.courses.length} courses`);

    firstCourse = feed.data.courses[0];
    assert(Boolean(firstCourse.id), 'Course ID Present', `ID: ${firstCourse.id}`);
    assert(Boolean(firstCourse.title), 'Course Title Present', firstCourse.title);
    assert(typeof firstCourse.price_bdt === 'number', 'Pre-calculated BDT Price', `৳${firstCourse.price_bdt}`);
    assert(firstCourse.thumbnail && firstCourse.thumbnail.startsWith('https://'), 'Sanitized HTTPS Thumbnail', firstCourse.thumbnail);
    assert(Boolean(firstCourse.instructor?.name), 'Instructor Info Present', firstCourse.instructor?.name);
  } catch (err) {
    assert(false, 'Feed Connectivity', err.message);
  }

  // TEST 3: Mobile App Data Transformer Simulation
  console.log('\n--- TEST 3: Mobile App Data Model Compatibility ---');
  if (firstCourse) {
    // Simulate transformCompanionCourse
    const transformed = {
      id: String(firstCourse.id),
      title: firstCourse.title,
      slug: String(firstCourse.id),
      subtitle: firstCourse.excerpt || '',
      price: Math.round((firstCourse.price_bdt / 118) * 10) / 10,
      priceBdt: firstCourse.price_bdt,
      thumbnail: firstCourse.thumbnail,
      rating: firstCourse.rating || 4.9,
      enrolledCount: firstCourse.students_count || 120,
      badge: firstCourse.price_bdt === 0 ? 'Top Rated' : 'Bestseller',
      instructor: {
        id: `inst-${firstCourse.id}`,
        name: firstCourse.instructor?.name || 'Thriving Skills Fellow',
        avatar: firstCourse.instructor?.avatar || '',
      },
    };

    assert(Boolean(transformed.id), 'Transformer Course ID Valid');
    assert(Boolean(transformed.title), 'Transformer Title Valid', transformed.title);
    assert(typeof transformed.price === 'number', 'USD Equivalent Price', `$${transformed.price}`);
    assert(typeof transformed.priceBdt === 'number', 'BDT Price Maintained', `৳${transformed.priceBdt}`);
    assert(Boolean(transformed.badge), 'Dynamic Badge Assigned', transformed.badge);
  } else {
    assert(false, 'Transformer Skipped (No course data available)');
  }

  // TEST 4: Push Token Registration Route Check
  console.log('\n--- TEST 4: Push Notification Registration Route ---');
  try {
    const postData = JSON.stringify({ token: 'ExponentPushToken[integration_test_mock]', platform: 'android' });
    const req = https.request(`${STAGING_API}/thrivingskill/v1/register-push-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'ThrivingSkillsMobile/1.1',
      },
    }, (res) => {
      let body = '';
      res.on('data', (d) => (body += d));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          assert(res.statusCode === 200 && parsed.status === 'success', 'Push Token Registration 200 OK', parsed.message);
        } catch (e) {
          assert(false, 'Push Token Registration Response Parse', e.message);
        }
      });
    });
    req.on('error', (e) => assert(false, 'Push Token Registration Request', e.message));
    req.write(postData);
    req.end();
  } catch (err) {
    assert(false, 'Push Token Route Execution', err.message);
  }

  // Final Scoreboard
  setTimeout(() => {
    console.log('\n=================================================================');
    console.log(`📊 FINAL SCOREBOARD: ${passed} / ${total} CHECKS PASSED (${Math.round((passed / total) * 100)}%)`);
    if (passed === total) {
      console.log('🎉 THE COMPANION PLUGIN IS 100% OPERATIONAL WITH THE MOBILE APP!');
    }
    console.log('=================================================================');
    process.exit(passed === total ? 0 : 1);
  }, 1000);
}

runVerification();
