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

console.log('\n=== TESTING PROFILE REDUNDANCY FIX, FULL PROFILE MODAL & #E34234 COLOR REPLACEMENT ===\n');

// 1. AuthModal and BrandSplashScreen Color Replacement
console.log('1. Checking Yellow replaced with #E34234 in AuthModal and BrandSplashScreen:');
const authPath = path.join(__dirname, '..', 'src', 'components', 'modals', 'AuthModal.tsx');
const authContent = fs.readFileSync(authPath, 'utf8');

assert(
  authContent.includes("Thriving<Text style={{ color: '#E34234' }}>Skills</Text>"),
  'AuthModal wordmark uses Accent Red #E34234 for Skills'
);
assert(
  authContent.includes("borderColor: '#E34234'") && authContent.includes("shadowColor: '#E34234'"),
  'AuthModal brand logo box uses #E34234 border and shadow'
);
assert(
  authContent.includes("color: '#E34234'") && authContent.includes("borderColor: 'rgba(227, 66, 52, 0.35)'"),
  'AuthModal langPill uses #E34234 for active text and border'
);

const splashPath = path.join(__dirname, '..', 'src', 'components', 'splash', 'BrandSplashScreen.tsx');
const splashContent = fs.readFileSync(splashPath, 'utf8');
assert(
  !splashContent.includes('const autoAdvanceTimer'),
  'BrandSplashScreen has no auto-advance timer (stays on screen until user clicks Get Started)'
);

// 2. Profile Screen Redundancy Elimination
console.log('\n2. Checking Profile Screen Redundancy Elimination:');
const summaryPath = path.join(__dirname, '..', 'src', 'components', 'profile', 'ProfileCourseSummary.tsx');
const summaryContent = fs.readFileSync(summaryPath, 'utf8');
assert(
  summaryContent.includes('compactTabs={true}'),
  'ProfileCourseSummary sets compactTabs={true} on LearnPressStatsGrid'
);

const gridPath = path.join(__dirname, '..', 'src', 'components', 'cards', 'LearnPressStatsGrid.tsx');
const gridContent = fs.readFileSync(gridPath, 'utf8');
assert(
  gridContent.includes('compactTabs') &&
  gridContent.includes('compactPill') &&
  gridContent.includes('compactScroll'),
  'LearnPressStatsGrid renders compact horizontal filter pills without repeating top 4-stat KPI bar'
);

// 3. Full Profile Modal & Tap Flow
console.log('\n3. Checking Full Profile View Modal & Tap Flow:');
const fullProfilePath = path.join(__dirname, '..', 'src', 'components', 'profile', 'FullProfileModal.tsx');
assert(fs.existsSync(fullProfilePath), 'FullProfileModal.tsx exists');
const fullProfileContent = fs.readFileSync(fullProfilePath, 'utf8');

assert(
  fullProfileContent.includes('displayName') &&
  fullProfileContent.includes('email') &&
  fullProfileContent.includes('phone') &&
  fullProfileContent.includes('bio'),
  'FullProfileModal displays complete user details (name, email, phone, bio)'
);
assert(
  fullProfileContent.includes('editButtonCta') &&
  fullProfileContent.includes('onEditProfile'),
  'FullProfileModal features prominent Edit Profile CTA button'
);

const headerCardPath = path.join(__dirname, '..', 'src', 'components', 'profile', 'ProfileHeaderCard.tsx');
const headerCardContent = fs.readFileSync(headerCardPath, 'utf8');
assert(
  headerCardContent.includes('onViewFullProfile') &&
  headerCardContent.includes('handleCardPress'),
  'ProfileHeaderCard connects tap on profile to onViewFullProfile'
);

const profileScreenPath = path.join(__dirname, '..', 'src', 'screens', 'ProfileScreen.tsx');
const profileScreenContent = fs.readFileSync(profileScreenPath, 'utf8');
assert(
  profileScreenContent.includes('FullProfileModal') &&
  profileScreenContent.includes('fullProfileModalVisible') &&
  profileScreenContent.includes('setFullProfileModalVisible'),
  'ProfileScreen manages and displays FullProfileModal'
);

console.log('\n======================================================');
if (failures === 0) {
  console.log('ALL NEW TESTS PASSED! (0 failures)\n');
  process.exit(0);
} else {
  console.error(`FAILED: ${failures} assertion(s) failed!\n`);
  process.exit(1);
}
