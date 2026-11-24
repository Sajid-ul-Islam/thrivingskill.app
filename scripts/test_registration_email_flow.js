/**
 * Automated Verification Script for Post-Registration Confirmation & Email Notification Flow.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
let failures = 0;
let passed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName}`);
    failures++;
  }
}

console.log('--- 1. Testing AuthModal.tsx for Registration Success & Email Notification ---');
const authModalPath = path.join(rootDir, 'src/components/modals/AuthModal.tsx');
const authModalCode = fs.readFileSync(authModalPath, 'utf8');

assert(authModalCode.includes('register_success'), 'AuthMode includes register_success');
assert(authModalCode.includes('registeredSuccessEmail'), 'AuthModal has registeredSuccessEmail state');
assert(authModalCode.includes("setMode('register_success')"), 'handleRegister switches to register_success mode');
assert(authModalCode.includes('handleOpenMailApp'), 'AuthModal has handleOpenMailApp function');
assert(authModalCode.includes('registeredEmailHighlight'), 'AuthModal renders registeredEmailHighlight card');
assert(authModalCode.includes('guidanceCard'), 'AuthModal renders guidanceCard checklist');
assert(authModalCode.includes('Open Email App') && authModalCode.includes('ইমেইল অ্যাপ খুলুন'), 'AuthModal has Open Email App action in both EN & BN');
assert(authModalCode.includes('Proceed to Sign In') && authModalCode.includes('পাসওয়ার্ড দিয়ে সাইন ইন করুন'), 'AuthModal has Proceed to Sign In action');
assert(authModalCode.includes('Spam') || authModalCode.includes('স্প্যাম'), 'AuthModal explicitly guides user to check Spam / Junk / Promotions');

console.log('\n--- 2. Testing AuthContext.tsx for Deferred Modal Dismissal & Registration Lifecycle ---');
const authContextPath = path.join(rootDir, 'src/context/AuthContext.tsx');
const authContextCode = fs.readFileSync(authContextPath, 'utf8');

assert(authContextCode.includes('saveUserSession = async (loggedInUser: WpUser | UserProfile, dismissModal: boolean = true)'), 'saveUserSession accepts dismissModal parameter');
assert(authContextCode.includes('login = async (username: string, password: string, dismissModal: boolean = true)'), 'login accepts dismissModal parameter');
assert(authContextCode.includes('await login(username, password, false)'), 'register does not auto-dismiss modal when auto-logging in');
assert(authContextCode.includes('Promise<{ success: boolean; emailSent: boolean; autoLoggedIn: boolean }'), 'register returns structured result with emailSent indicator');

console.log(`\nResults: ${passed} Passed, ${failures} Failed.`);
if (failures > 0) {
  process.exit(1);
} else {
  console.log('ALL REGISTRATION SUCCESS & EMAIL NOTIFICATION TESTS PASSED!');
  process.exit(0);
}
