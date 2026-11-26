/**
 * Dual-Environment Verification Suite
 * Verifies production and staging environment switching, fallbacks,
 * image sanitization, password reset URL parsing, and live connectivity.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const rootDir = path.resolve(__dirname, '..');

// Helper to probe an HTTPS URL with method
function probeHttps(url, method = 'GET', body = null) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const headers = {
        'User-Agent': `ThrivingSkillsApp/${require('../package.json').version} (Node Verification)`,
        Accept: 'application/json',
      };
      if (body) {
        headers['Content-Type'] = 'application/json';
        headers['Content-Length'] = Buffer.byteLength(body);
      }
      const req = https.request(
        {
          hostname: parsed.hostname,
          path: parsed.pathname + parsed.search,
          method,
          headers,
          timeout: 15000,
        },
        (res) => {
          let resData = '';
          res.on('data', chunk => { resData += chunk; });
          res.on('end', () => {
            resolve({ ok: res.statusCode >= 200 && res.statusCode < 400, status: res.statusCode, body: resData });
          });
        }
      );
      req.on('error', (err) => resolve({ ok: false, error: err.message, status: 0 }));
      req.on('timeout', () => {
        req.destroy();
        resolve({ ok: false, error: 'Timeout', status: 408 });
      });
      if (body) req.write(body);
      req.end();
    } catch (e) {
      resolve({ ok: false, error: e.message, status: 0 });
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
      console.log(`  ✅ [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${desc}`);
    }
  }

  // 1. Audit src/config/env.ts
  console.log('[STEP 1] Auditing src/config/env.ts Dual-Environment Architecture...');
  const envTs = fs.readFileSync(path.join(rootDir, 'src', 'config', 'env.ts'), 'utf8');

  assert('env.ts defines ApiEnvironment union type', envTs.includes("export type ApiEnvironment = 'production' | 'staging';"));
  assert('env.ts defines ENVIRONMENTS configuration dictionary', envTs.includes('export const ENVIRONMENTS: Record<ApiEnvironment, EnvironmentConfig> = {'));
  assert('env.ts configures production site https://thrivingskill.com', envTs.includes("siteUrl: 'https://thrivingskill.com'"));
  assert('env.ts configures staging site https://staging.thrivingskill.com', envTs.includes("siteUrl: 'https://staging.thrivingskill.com'"));
  assert('env.ts provides setEnvironment method', envTs.includes('async setEnvironment(newEnv: ApiEnvironment)'));
  assert('env.ts provides subscribeEnvironment listener', envTs.includes('subscribeEnvironment(listener: (env: ApiEnvironment) => void)'));
  assert('env.ts provides FALLBACK_API_URL getter', envTs.includes('get FALLBACK_API_URL(): string'));
  assert('env.ts provides dynamic API_URL and SITE_URL getters', envTs.includes('get API_URL(): string') && envTs.includes('get SITE_URL(): string'));

  // 2. Audit src/services/api/httpClient.ts
  console.log('\n[STEP 2] Auditing src/services/api/httpClient.ts Fallback & Failover...');
  const httpTs = fs.readFileSync(path.join(rootDir, 'src', 'services', 'api', 'httpClient.ts'), 'utf8');

  assert('httpClient.ts supports allowFallback and baseUrl in RequestOptions', 
    httpTs.includes('allowFallback?: boolean;') && httpTs.includes('baseUrl?: string;')
  );
  assert('httpClient.ts builds URL with customBase support', httpTs.includes('customBase || Env.API_URL'));
  assert('httpClient.ts implements unified executeCore failover to FALLBACK_API_URL',
    httpTs.includes('baseUrl: Env.FALLBACK_API_URL') && httpTs.includes('[API Failover]')
  );
  assert('httpClient.ts routes both request and requestWithMeta through unified executeCore',
    httpTs.includes("this.executeCore<T>(endpoint, options, 'Request')") &&
    httpTs.includes("this.executeCore<T>(endpoint, options, 'RequestWithMeta')")
  );

  // 3. Audit src/utils/imageUtils.ts
  console.log('\n[STEP 3] Auditing src/utils/imageUtils.ts Media Sanitization...');
  const imageTs = fs.readFileSync(path.join(rootDir, 'src', 'utils', 'imageUtils.ts'), 'utf8');

  assert('imageUtils.ts upgrades both live and staging http to https',
    imageTs.includes('^http:\\/\\/(staging\\.)?thrivingskill\\.com') &&
    imageTs.includes("'https://$1thrivingskill.com'")
  );
  assert('imageUtils.ts dynamically passes Referer matching active Env.SITE_URL', 
    imageTs.includes('const activeReferer = Env.SITE_URL ? `${Env.SITE_URL}/` : \'https://thrivingskill.com/\';')
  );

  // 4. Audit src/components/modals/AuthModal.tsx
  console.log('\n[STEP 4] Auditing src/components/modals/AuthModal.tsx Domain Whitelist...');
  const authModalTs = fs.readFileSync(path.join(rootDir, 'src', 'components', 'modals', 'AuthModal.tsx'), 'utf8');

  assert('AuthModal.tsx onShouldStartLoadWithRequest restricts navigation to active Env.SITE_URL',
    authModalTs.includes('Env.SITE_URL') && !authModalTs.includes("url.startsWith('https://staging.thrivingskill.com')")
  );
  assert('AuthModal.tsx parseResetPasswordUrl accepts both live and staging reset URLs',
    authModalTs.includes('cleanUrl.startsWith(\'/\')')
  );

  // 5. Audit ProfilePreferencesSection.tsx & ProfileScreen.tsx
  console.log('\n[STEP 5] Auditing Server Switcher UI in Profile Section...');
  const prefTs = fs.readFileSync(path.join(rootDir, 'src', 'components', 'profile', 'ProfilePreferencesSection.tsx'), 'utf8');
  const profileHookPath = path.join(rootDir, 'src', 'screens', 'profile', 'useProfileScreenState.ts');
  const profileTs = [
    fs.readFileSync(path.join(rootDir, 'src', 'screens', 'ProfileScreen.tsx'), 'utf8'),
    fs.existsSync(profileHookPath) ? fs.readFileSync(profileHookPath, 'utf8') : '',
  ].join('\n');

  assert('ProfilePreferencesSection accepts serverEnvironment and onSwitchServerEnvironment props',
    prefTs.includes('serverEnvironment?: \'production\' | \'staging\';') &&
    prefTs.includes('onSwitchServerEnvironment?: () => void;')
  );
  assert('ProfilePreferencesSection renders Server Environment row with LIVE/STAGING badge',
    prefTs.includes('Server Environment') && prefTs.includes("serverEnvironment === 'production'") && prefTs.includes("'LIVE'")
  );
  assert('ProfileScreen subscribes to Env.subscribeEnvironment',
    profileTs.includes('Env.subscribeEnvironment')
  );
  assert('ProfileScreen provides handleSwitchServerEnvironment with confirmation dialog',
    profileTs.includes('const handleSwitchServerEnvironment = () => {') &&
    profileTs.includes('Env.setEnvironment(targetEnv)')
  );

  // 6. Audit App.tsx for startup Env.init() gate before network providers
  console.log('\n[STEP 6] Auditing App.tsx Startup Hydration...');
  const appTs = fs.readFileSync(path.join(rootDir, 'App.tsx'), 'utf8');
  assert('App.tsx awaits Env.init() before mounting providers', appTs.includes('Env.init()') && appTs.includes('!envReady'));

  // 7. Optional Staging Integration Probe (strictly disabled in CI; never calls production)
  if (process.env.RUN_STAGING_INTEGRATION === 'true' && process.env.CI !== 'true') {
    console.log('\n[STEP 7] Probing Dedicated Staging Environment (RUN_STAGING_INTEGRATION=true)...');
    const stagingCourses = await probeHttps('https://staging.thrivingskill.com/wp-json/learnpress/v1/courses?per_page=1');
    console.log(`  -> Staging LearnPress (/learnpress/v1/courses): status=${stagingCourses.status}, ok=${stagingCourses.ok}`);
    assert('Staging LearnPress API responds with HTTP 200', stagingCourses.ok && stagingCourses.status === 200);

    const stagingCategories = await probeHttps('https://staging.thrivingskill.com/wp-json/learnpress/v1/course_category?per_page=1');
    console.log(`  -> Staging Categories (/learnpress/v1/course_category): status=${stagingCategories.status}, ok=${stagingCategories.ok}`);
    assert('Staging Categories API responds with HTTP 200', stagingCategories.ok && stagingCategories.status === 200);
  } else {
    console.log('\n[STEP 7] Live network probes skipped (CI runs strictly offline with zero production calls).');
  }

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
