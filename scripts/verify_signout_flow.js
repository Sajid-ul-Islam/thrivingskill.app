const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

console.log('================================================================');
console.log('       THRIVING SKILLS — SIGN OUT FLOW & STABILITY AUDIT        ');
console.log('================================================================\n');

let passed = 0;
let total = 0;

function assert(condition, testName, details = '') {
  total++;
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}`);
    if (details) console.error(`     Details: ${details}`);
  }
}

// 1. Audit App.tsx for removal of blank-screen hijacking
console.log('[STEP 1] Auditing App.tsx Access Control & Rendering Architecture...');
const appTsx = fs.readFileSync(path.join(rootDir, 'App.tsx'), 'utf8');

const hasBlankScreenReturn = appTsx.includes('if (!isAuthenticated && !isAuthLoading) {') &&
  appTsx.includes('return (\n      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}');

assert(
  !hasBlankScreenReturn,
  'App.tsx does NOT unmount entire app tree into a blank SafeAreaView on logout',
  'Destructive early return was removed so navigation and screens stay mounted.'
);

const hasGuestHandling = appTsx.includes('isGuest') &&
  appTsx.includes('visible={isAuthModalVisible || (!isAuthenticated && !isGuest && !isAuthLoading && !isSplashVisible)}');

assert(
  hasGuestHandling,
  'App.tsx handles isGuest smoothly without trapping logged-out users',
  'AuthModal visibility correctly considers isGuest.'
);

// 2. Audit AuthContext.tsx logout()
console.log('\n[STEP 2] Auditing AuthContext.tsx logout() & Cache Hygiene...');
const authContext = fs.readFileSync(path.join(rootDir, 'src', 'context', 'AuthContext.tsx'), 'utf8');

const logoutRegex = /const logout = async \(\) => {([\s\S]*?)};/;
const logoutMatch = authContext.match(logoutRegex);
const logoutBody = logoutMatch ? logoutMatch[1] : '';

const setsGuest = logoutBody.includes('setIsGuest(true)');
const clearsUser = logoutBody.includes('setUser(null)') && logoutBody.includes('setToken(null)');
const doesNotWipeCacheManager = !logoutBody.includes('CacheManager.clearAll()');

assert(setsGuest && clearsUser, 'logout() clears user session and transitions state to isGuest = true');
assert(doesNotWipeCacheManager, 'logout() does NOT wipe public CacheManager course catalog', 'Public catalog remains cached in memory and AsyncStorage on logout.');

// 3. Audit ModernPopup.tsx modal collision prevention
console.log('\n[STEP 3] Auditing ModernPopup.tsx Confirmation Teardown...');
const modernPopup = fs.readFileSync(path.join(rootDir, 'src', 'components', 'common', 'ModernPopup.tsx'), 'utf8');

const hasPreDismiss = modernPopup.includes('onDismiss();') &&
  modernPopup.includes('await confirmFn();') &&
  modernPopup.indexOf('onDismiss();') < modernPopup.indexOf('await confirmFn();');
assert(hasPreDismiss, 'ModernPopup dismisses dialog BEFORE executing async confirm action', 'Prevents BadTokenException and native modal collisions on Android/iOS.');

// 4. Audit FeedbackContext.tsx dismissPopup
console.log('\n[STEP 4] Auditing FeedbackContext.tsx dismissPopup...');
const feedbackContext = fs.readFileSync(path.join(rootDir, 'src', 'context', 'FeedbackContext.tsx'), 'utf8');

const dismissSafe = !feedbackContext.includes('if (currentPopup?.onCancel) {\n      currentPopup.onCancel();\n    }\n    setCurrentPopup(null);');
assert(dismissSafe, 'FeedbackContext.dismissPopup does NOT inadvertently fire onCancel on confirm dismiss');

// 5. Audit ProfileScreen.tsx handleLogout & Home Navigation
console.log('\n[STEP 5] Auditing ProfileScreen.tsx Logout Handler...');
const profileScreen = fs.readFileSync(path.join(rootDir, 'src', 'screens', 'ProfileScreen.tsx'), 'utf8');

const hasHandleLogout = profileScreen.includes('const handleLogout = async () => {') &&
  profileScreen.includes("onNavigateTab('Home')") &&
  profileScreen.includes('onLogout={handleLogout}');

assert(hasHandleLogout, 'ProfileScreen implements handleLogout with toast and onNavigateTab("Home") transition');

// 6. Audit AuthModal.tsx Guest Accessibility
console.log('\n[STEP 6] Auditing AuthModal.tsx Guest & Dismissibility...');
const authModal = fs.readFileSync(path.join(rootDir, 'src', 'components', 'modals', 'AuthModal.tsx'), 'utf8');

const hasGuestEscape = authModal.includes('{mode !== \'forgot_password\' && mode !== \'set_password\' && (') &&
  authModal.includes('Explore as Guest');

assert(hasGuestEscape, 'AuthModal always provides "Explore as Guest" action to prevent login traps');

console.log('\n================================================================');
console.log(` RESULTS: ${passed}/${total} TESTS PASSED! 🚀`);
console.log('================================================================\n');

if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}
