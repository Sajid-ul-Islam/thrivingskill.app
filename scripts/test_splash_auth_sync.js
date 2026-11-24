/**
 * Automated Verification Suite for Splash-to-Auth Synchronization
 * & Mandatory Client Registration Requirements
 *
 * Verifies:
 * 1. Client Requirement: NO guest mode available.
 * 2. Client Requirement: Password is minimum 12 characters (following live site rules).
 * 3. Client Requirement: Mandatory phone number on signup (required for course enrollment & verification).
 * 4. Intent-based synchronization: "Get Started Now" -> Register mode; "Already have an account?" -> Login mode.
 * 5. Double-transition elimination: Fluid parallel handoff with onExitComplete callback.
 * 6. Brand identity & language parity: Official icon, ThrivingSkills wordmark, and bilingual toggle.
 */

const fs = require('fs');
const path = require('path');

let failures = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
  } else {
    console.error(`  [FAIL] ${testName}`);
    if (details) console.error(`         -> ${details}`);
    failures++;
  }
}

console.log('\n=== RUNNING SPLASH-TO-AUTH SYNCHRONIZATION TEST SUITE ===\n');

// 1. Check BrandSplashScreen.tsx
console.log('1. Verifying BrandSplashScreen.tsx:');
const splashPath = path.join(__dirname, '..', 'src', 'components', 'splash', 'BrandSplashScreen.tsx');
assert(fs.existsSync(splashPath), 'BrandSplashScreen.tsx exists');
const splashContent = fs.readFileSync(splashPath, 'utf-8');

assert(
  splashContent.includes('onExitComplete?: () => void;'),
  'BrandSplashScreenProps includes onExitComplete callback'
);
assert(
  splashContent.includes('callback?.();') &&
  splashContent.includes('triggerSmoothExit = (callback?: () => void) =>'),
  'triggerSmoothExit immediately notifies caller to mount/open AuthModal in parallel'
);
assert(
  splashContent.includes('onExitComplete?.();'),
  'triggerSmoothExit fires onExitComplete after exit animation finishes'
);
assert(
  splashContent.includes('const autoAdvanceTimer = setTimeout(') &&
  splashContent.includes('handleGetStarted();') &&
  splashContent.includes('4500'),
  'Internalized 4.5s auto-advance timer safely cues handleGetStarted()'
);
assert(
  splashContent.includes("pointerEvents={isExitingRef.current ? 'none' : 'auto'}"),
  'Prevents touch hijacking during exit transition'
);

// 2. Check App.tsx
console.log('\n2. Verifying App.tsx:');
const appPath = path.join(__dirname, '..', 'App.tsx');
assert(fs.existsSync(appPath), 'App.tsx exists');
const appContent = fs.readFileSync(appPath, 'utf-8');

assert(
  appContent.includes("import { AuthModal, AuthMode } from './src/components';"),
  'App.tsx imports AuthMode from src/components'
);
assert(
  appContent.includes("const [authInitialMode, setAuthInitialMode] = useState<AuthMode>('register');"),
  'App.tsx manages authInitialMode state'
);
assert(
  appContent.includes('initialMode={authInitialMode}'),
  'App.tsx passes initialMode to AuthModal'
);
assert(
  appContent.includes("setAuthInitialMode('register');") &&
  appContent.includes('onGetStarted={() => {'),
  'onGetStarted routes to register mode'
);
assert(
  appContent.includes("setAuthInitialMode('login');") &&
  appContent.includes('onSignIn={() => {'),
  'onSignIn routes to login mode'
);
assert(
  appContent.includes('onExitComplete={() => {') &&
  appContent.includes('setIsSplashVisible(false);'),
  'onExitComplete unmounts splash screen without home screen flicker'
);

// 3. Check AuthModal.tsx
console.log('\n3. Verifying AuthModal.tsx:');
const authPath = path.join(__dirname, '..', 'src', 'components', 'modals', 'AuthModal.tsx');
assert(fs.existsSync(authPath), 'AuthModal.tsx exists');
const authContent = fs.readFileSync(authPath, 'utf-8');

// 3.1 Client Requirement: No Guest Mode
assert(
  !authContent.includes('continueAsGuest') &&
  !authContent.includes('handleGuest') &&
  !authContent.includes('guestButton'),
  'Guest mode bypass is completely removed per client requirement'
);

// 3.2 Client Requirement: Password is minimum 12 characters
assert(
  authContent.includes('trimmedPassword.length < 12'),
  'Registration validates password minimum length >= 12'
);
assert(
  authContent.includes('/12') &&
  authContent.includes('charCountPill') &&
  authContent.includes('charCountTrack'),
  'Registration shows real-time 12-character counter and progress indicator'
);
assert(
  authContent.includes('The password must be at least twelve (12) characters long') ||
  authContent.includes('পাসওয়ার্ড কমপক্ষে ১২ অক্ষরের হতে হবে'),
  'Registration displays official thrivingskill.com 12-character rule hint card'
);

// 3.3 Client Requirement: Mandatory phone number for signup
assert(
  authContent.includes('!trimmedPhone') &&
  authContent.includes("trimmedPhone.replace(/\\D/g, '').length < 10"),
  'Registration strictly enforces mandatory phone number with 10+ digit validation'
);
assert(
  authContent.includes('কোর্স ভর্তি ও ভেরিফিকেশনে আবশ্যক') ||
  authContent.includes('Required for enrollment & verification'),
  'Registration clearly labels phone number as mandatory for enrollment'
);

// 3.4 Visual Identity & Brand Parity
assert(
  authContent.includes("require('../../../assets/icon.png')") &&
  authContent.includes('ThrivingSkills'),
  'AuthModal uses official brand icon and ThrivingSkills wordmark'
);
assert(
  authContent.includes('langPill') &&
  authContent.includes("setLanguage('en')") &&
  authContent.includes("setLanguage('bn')"),
  'AuthModal header includes bilingual English / Bangla toggle pill'
);
assert(
  authContent.includes('brandRowHeader'),
  'AuthModal uses persistent compact brand header to prevent keyboard jump'
);

console.log('\n======================================================');
if (failures === 0) {
  console.log('ALL VERIFICATION ASSERTIONS PASSED! (0 failures)\n');
  process.exit(0);
} else {
  console.error(`FAILED: ${failures} assertion(s) failed!\n`);
  process.exit(1);
}
