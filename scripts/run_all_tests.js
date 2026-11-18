/**
 * Unified Automated Test Suite & Quality Gate Runner
 * Executes all automated tests sequentially and verifies zero regressions.
 */
const { execSync } = require('child_process');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');

const SUITES = [
  { name: '1. Codebase Structural & Timer Audit', script: 'scripts/audit_app.js' },
  { name: '2. Security & WebView Hardening Suite', script: 'scripts/test_security_hardening.js' },
  { name: '3. LearnPress Auth & Mobile SMS OTP Suite', script: 'scripts/test_auth_service.js' },
  { name: '4. Performance & Tree-Shaking Optimizations', script: 'scripts/test_optimizations.js' },
  { name: '5. Auth Lifecycle & Persistence Suite', script: 'scripts/test_auth_persistence.js' },
  { name: '6. Enrollment & Checkout Flow Suite', script: 'scripts/test_enrollment_transition.js' },
];

console.log('====================================================');
console.log('   THRIVING SKILLS — AUTOMATED CI QUALITY GATE      ');
console.log('====================================================\n');

let totalPassed = 0;
let totalFailed = 0;
const startTime = Date.now();

for (const suite of SUITES) {
  console.log(`▶ Running Suite: ${suite.name}...`);
  try {
    const output = execSync(`node ${suite.script}`, {
      cwd: ROOT_DIR,
      stdio: 'pipe',
      encoding: 'utf8',
      env: { ...process.env, CI: 'true' },
    });
    console.log(output.trim());
    console.log(`✅ [PASS] ${suite.name} completed successfully.\n`);
    totalPassed++;
  } catch (err) {
    console.error(`❌ [FAIL] ${suite.name} failed with exit code ${err.status}:`);
    if (err.stdout) console.error(err.stdout.toString());
    if (err.stderr) console.error(err.stderr.toString());
    totalFailed++;
    console.log('');
  }
}

const duration = ((Date.now() - startTime) / 1000).toFixed(2);

console.log('====================================================');
console.log(`   CI SUMMARY: ${totalPassed} Passed, ${totalFailed} Failed in ${duration}s`);
console.log('====================================================');

if (totalFailed > 0) {
  process.exit(1);
} else {
  console.log('🎉 All test suites passed the quality gate!\n');
  process.exit(0);
}
