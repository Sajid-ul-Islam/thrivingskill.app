const fs = require('fs');
const path = require('path');

let failures = 0;
function assert(cond, name, details = '') {
  if (cond) {
    console.log(`  [PASS] ${name}`);
  } else {
    console.error(`  [FAIL] ${name}`);
    if (details) console.error(`         -> ${details}`);
    failures++;
  }
}

console.log('\n=== TESTING DEVELOPER OPTIONS STANDARD MODE SWITCHER ===\n');

// 1. DeveloperOptionsModal Verification
console.log('1. Checking DeveloperOptionsModal.tsx:');
const devModalPath = path.join(__dirname, '..', 'src', 'components', 'modals', 'DeveloperOptionsModal.tsx');
assert(fs.existsSync(devModalPath), 'DeveloperOptionsModal.tsx exists');
const devModalContent = fs.readFileSync(devModalPath, 'utf8');

assert(
  devModalContent.includes('onResetToStandardMode?: () => void;'),
  'DeveloperOptionsModalProps declares onResetToStandardMode callback'
);
assert(
  devModalContent.includes('handleReturnToStandardMode'),
  'DeveloperOptionsModal defines handleReturnToStandardMode handler'
);
assert(
  devModalContent.includes("Env.setEnvironment('production')"),
  'handleReturnToStandardMode restores Live Production environment (thrivingskill.com)'
);
assert(
  devModalContent.includes("AsyncStorage.setItem('@ts_auth_admin_bypass', 'false')"),
  'handleReturnToStandardMode disables admin testing bypass'
);
assert(
  devModalContent.includes("AsyncStorage.setItem('@ts_dev_mode_unlocked', 'false')"),
  'handleReturnToStandardMode locks developer mode in storage'
);
assert(
  devModalContent.includes('standardModeCard') &&
  devModalContent.includes('standardModeBtn') &&
  devModalContent.includes('Switch to Standard Mode'),
  'DeveloperOptionsModal renders prominent Standard / Normal Mode action card with button'
);

// 2. BrandSplashScreen Verification
console.log('\n2. Checking BrandSplashScreen.tsx:');
const splashPath = path.join(__dirname, '..', 'src', 'components', 'splash', 'BrandSplashScreen.tsx');
const splashContent = fs.readFileSync(splashPath, 'utf8');

assert(
  splashContent.includes('onResetToStandardMode={() => {') &&
  splashContent.includes('setIsDevModeUnlocked(false);'),
  'BrandSplashScreen wires onResetToStandardMode to clear isDevModeUnlocked state'
);

// 3. ProfilePreferencesSection Verification
console.log('\n3. Checking ProfilePreferencesSection.tsx:');
const prefPath = path.join(__dirname, '..', 'src', 'components', 'profile', 'ProfilePreferencesSection.tsx');
const prefContent = fs.readFileSync(prefPath, 'utf8');

assert(
  prefContent.includes('onOpenDevOptions?: () => void;') &&
  prefContent.includes('Developer Options Console'),
  'ProfilePreferencesSection shows Developer Console & Return to Standard Mode row when dev mode is active'
);

// 4. ProfileScreen Verification
console.log('\n4. Checking ProfileScreen.tsx:');
const profileScreenPath = path.join(__dirname, '..', 'src', 'screens', 'ProfileScreen.tsx');
const profileScreenContent = fs.readFileSync(profileScreenPath, 'utf8');

assert(
  profileScreenContent.includes('DeveloperOptionsModal') &&
  profileScreenContent.includes('devModalVisible') &&
  profileScreenContent.includes('setDevModalVisible'),
  'ProfileScreen manages and mounts DeveloperOptionsModal'
);
assert(
  profileScreenContent.includes('onOpenDevOptions={() => setDevModalVisible(true)}'),
  'ProfileScreen connects onOpenDevOptions to open DeveloperOptionsModal'
);
assert(
  profileScreenContent.includes('onResetToStandardMode={() => {') &&
  profileScreenContent.includes('setDevModeUnlocked(false);'),
  'ProfileScreen resets dev mode and sets environment to production when standard mode is selected'
);

console.log('\n======================================================');
if (failures === 0) {
  console.log('ALL STANDARD MODE TESTS PASSED! (0 failures)\n');
  process.exit(0);
} else {
  console.error(`FAILED: ${failures} assertion(s) failed!\n`);
  process.exit(1);
}
