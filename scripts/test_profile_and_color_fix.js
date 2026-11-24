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

console.log('\n=== COMPREHENSIVE VERIFICATION: PROFILE REDUNDANCY, FULL PROFILE VIEW & #E34234 COLOR REPLACEMENT ===\n');

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
assert(
  splashContent.includes("backgroundColor: '#E34234'"),
  'BrandSplashScreen primary CTA button uses #E34234'
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
  fullProfileContent.includes('enrolledCount') &&
  (fullProfileContent.includes('Enrolled Courses') || fullProfileContent.includes('এনরোল্ড কোর্স')),
  'FullProfileModal displays how many courses learner is enrolled in'
);
assert(
  fullProfileContent.includes('certificates') &&
  (fullProfileContent.includes('Certificates Got') || fullProfileContent.includes('অর্জিত সনদ')),
  'FullProfileModal displays how many certificates learner already got'
);
assert(
  fullProfileContent.includes('completedCount') &&
  fullProfileContent.includes('streakDays'),
  'FullProfileModal displays completed courses and study streak'
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

// 4. Yellow to #E34234 Replacement across Profile Components
console.log('\n4. Checking Yellow Replacement with #E34234 across Profile Components:');
const learningPortfolioPath = path.join(__dirname, '..', 'src', 'components', 'profile', 'ProfileLearningPortfolio.tsx');
const learningPortfolioContent = fs.readFileSync(learningPortfolioPath, 'utf8');
assert(
  !learningPortfolioContent.includes('#FFB606') &&
  !learningPortfolioContent.includes('#F59E0B') &&
  !learningPortfolioContent.includes('#FEF3C7'),
  'ProfileLearningPortfolio has 0 yellow hex codes'
);

const preferencesPath = path.join(__dirname, '..', 'src', 'components', 'profile', 'ProfilePreferencesSection.tsx');
const preferencesContent = fs.readFileSync(preferencesPath, 'utf8');
assert(
  !preferencesContent.includes('#FFB606') &&
  !preferencesContent.includes('#F59E0B') &&
  !preferencesContent.includes('#FEF3C7') &&
  !preferencesContent.includes('#FBBF24') &&
  !preferencesContent.includes('#B45309'),
  'ProfilePreferencesSection has 0 yellow hex codes'
);

const supportHubPath = path.join(__dirname, '..', 'src', 'components', 'profile', 'ProfileSupportHub.tsx');
const supportHubContent = fs.readFileSync(supportHubPath, 'utf8');
assert(
  !supportHubContent.includes('#FFB606') &&
  !supportHubContent.includes('#F59E0B') &&
  !supportHubContent.includes('#FEF3C7') &&
  !supportHubContent.includes('#FBBF24') &&
  !supportHubContent.includes('#B45309') &&
  !supportHubContent.includes('colors.brandGold'),
  'ProfileSupportHub has 0 yellow references'
);

const settingsModalPath = path.join(__dirname, '..', 'src', 'components', 'profile', 'ProfileSettingsModal.tsx');
const settingsModalContent = fs.readFileSync(settingsModalPath, 'utf8');
assert(
  !settingsModalContent.includes('#FFB606') &&
  !settingsModalContent.includes('#F59E0B'),
  'ProfileSettingsModal has 0 yellow hex codes'
);

const donutPath = path.join(__dirname, '..', 'src', 'components', 'profile', 'ProfileCompletionDonut.tsx');
const donutContent = fs.readFileSync(donutPath, 'utf8');
assert(
  !donutContent.includes('#FFB606') &&
  !donutContent.includes('#F59E0B') &&
  donutContent.includes("gradientEnd = isComplete ? '#059669' : '#E34234'"),
  'ProfileCompletionDonut uses #E34234 for progress arc and badges'
);

console.log('\n======================================================');
if (failures === 0) {
  console.log('ALL TESTS PASSED! (0 failures)\n');
  process.exit(0);
} else {
  console.error(`FAILED: ${failures} assertion(s) failed!\n`);
  process.exit(1);
}
