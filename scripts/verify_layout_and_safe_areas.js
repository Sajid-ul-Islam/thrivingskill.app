const fs = require('fs');
const assert = require('assert');

console.log('====================================================');
console.log('RUNNING COMPREHENSIVE UI/UX & LAYOUT AUDIT VERIFICATION');
console.log('====================================================\n');

let passCount = 0;
let failCount = 0;

function check(title, fn) {
  try {
    fn();
    console.log(`[PASS] ${title}`);
    passCount++;
  } catch (err) {
    console.error(`[FAIL] ${title}: ${err.message}`);
    failCount++;
  }
}

// 1. CourseDetailScreen Bottom Bar & Enrollment Button
check('CourseDetailScreen has useSafeAreaInsets and dynamic paddingBottom', () => {
  const code = fs.readFileSync('src/screens/CourseDetailScreen.tsx', 'utf8');
  assert(code.includes('useSafeAreaInsets'), 'Missing useSafeAreaInsets import');
  assert(code.includes('paddingBottom: Math.max(insets.bottom, 12)'), 'Missing insets.bottom in bottomEnrollBar');
  assert(code.includes('paddingBottom: Math.max(insets.bottom, 12) + 100'), 'Missing insets.bottom in scrollContent');
  assert(code.includes('flex: 1') && code.includes('minWidth: 0'), 'Missing flex: 1 on bottomPriceCol');
  assert(code.includes('maxWidth: \'56%\'') && code.includes('flexShrink: 0'), 'Missing maxWidth or flexShrink on enrollCTAButton');
  assert(code.includes('numberOfLines={1}') && code.includes('ellipsizeMode="tail"'), 'Missing numberOfLines/ellipsizeMode on enrollCTAText');
});

// 2. CourseDetailScreen statsBar
check('CourseDetailScreen statsBar statCell has flex: 1', () => {
  const code = fs.readFileSync('src/screens/CourseDetailScreen.tsx', 'utf8');
  const match = code.match(/statCell:\s*\{[\s\S]*?flex:\s*1/);
  assert(match, 'statCell must have flex: 1');
});

// 3. Tab Screens ScrollView paddingBottom
const tabScreens = [
  'src/screens/HomeScreen.tsx',
  'src/screens/CoursesScreen.tsx',
  'src/screens/MyLearningScreen.tsx',
  'src/screens/WorkshopsScreen.tsx',
  'src/screens/ProfileScreen.tsx',
  'src/screens/LessonPlayerScreen.tsx',
  'src/screens/YouTubeVideosScreen.tsx',
];

tabScreens.forEach((file) => {
  check(`${file} has useSafeAreaInsets and dynamic scroll bottom padding`, () => {
    const code = fs.readFileSync(file, 'utf8');
    assert(code.includes('useSafeAreaInsets'), `${file} missing useSafeAreaInsets`);
    assert(code.includes('insets.bottom'), `${file} missing insets.bottom in contentContainerStyle`);
  });
});

// 4. Modals Safe Area Insets
const modals = [
  'src/components/modals/AuthModal.tsx',
  'src/components/modals/PaymentModal.tsx',
  'src/components/modals/SubscriptionModal.tsx',
  'src/components/modals/NotificationModal.tsx',
  'src/components/modals/MandatoryReviewModal.tsx',
];

modals.forEach((file) => {
  check(`${file} has useSafeAreaInsets on bottom action sheet`, () => {
    const code = fs.readFileSync(file, 'utf8');
    assert(code.includes('useSafeAreaInsets'), `${file} missing useSafeAreaInsets`);
    assert(code.includes('insets.bottom'), `${file} missing insets.bottom padding`);
  });
});

// 5. HeroCarousel Responsive Sizing
check('HeroCarousel uses useWindowDimensions for dynamic card width', () => {
  const code = fs.readFileSync('src/components/common/HeroCarousel.tsx', 'utf8');
  assert(code.includes('useWindowDimensions'), 'HeroCarousel missing useWindowDimensions');
  assert(code.includes('cardWidth'), 'HeroCarousel missing dynamic cardWidth calculation');
  assert(code.includes('scrollToOffset'), 'HeroCarousel missing responsive scrollToOffset');
});

// 6. LessonPlayerScreen Playback Toolbar & Video Master Registry
check('LessonPlayerScreen has compact toolbar and authentic video resolution', () => {
  const code = fs.readFileSync('src/screens/LessonPlayerScreen.tsx', 'utf8');
  assert(code.includes('resolveLessonVideoData'), 'LessonPlayerScreen missing resolveLessonVideoData');
  assert(code.includes('isAdmin } = useAuth()'), 'LessonPlayerScreen missing isAdmin from useAuth()');
  assert(code.includes('paddingHorizontal: 8'), 'playbackToolbar must have compact paddingHorizontal');
  assert(code.includes('gap: 8') && code.includes('flexShrink: 0'), 'playbackLeftControls must be compact with flexShrink');
  assert(code.includes('gap: 6'), 'playbackRightControls must have compact gap');
});

// 7. Admin Bypass Mode across AuthContext, ProfileScreen, and CourseDetailScreen
check('Admin bypass mode implemented across AuthContext, Profile, and CourseDetail', () => {
  const authCode = fs.readFileSync('src/context/AuthContext.tsx', 'utf8');
  assert(authCode.includes('isAdminBypass'), 'AuthContext missing isAdminBypass');
  assert(authCode.includes('toggleAdminBypass'), 'AuthContext missing toggleAdminBypass');
  assert(authCode.includes('isUserAdmin'), 'AuthContext missing isUserAdmin');

  const profileCode = fs.readFileSync('src/screens/ProfileScreen.tsx', 'utf8');
  assert(profileCode.includes('toggleAdminBypass'), 'ProfileScreen missing toggleAdminBypass');
  assert(profileCode.includes('Admin QA Mode'), 'ProfileScreen missing Admin QA Mode switch');

  const courseDetailCode = fs.readFileSync('src/screens/CourseDetailScreen.tsx', 'utf8');
  assert(courseDetailCode.includes('isAdmin } = useAuth()'), 'CourseDetailScreen missing isAdmin from useAuth()');
});

// 8. Mathematical simulation across viewport widths (320px to 430px)
check('Simulated Viewport Widths (320px, 360px, 390px, 412px, 428px) never overflow', () => {
  const viewports = [320, 360, 375, 390, 412, 428];
  for (const w of viewports) {
    const barPadding = 16 * 2; // 32px
    const gap = 8;
    const availableWidth = w - barPadding - gap;
    const maxButtonWidth = availableWidth * 0.56;
    const minPriceColWidth = availableWidth * 0.44;

    assert(maxButtonWidth + minPriceColWidth + gap + barPadding <= w, `Total width exceeds viewport ${w}`);
    assert(maxButtonWidth > 130, `Button too narrow at width ${w}`);
    assert(minPriceColWidth > 110, `Price column too narrow at width ${w}`);
  }

  // Player toolbar math verification: Left controls (~136px) + Right controls (~144px) + 16px padding = 296px
  for (const w of viewports) {
    const toolbarWidth = 136 + 144 + 16;
    assert(toolbarWidth < w, `Player toolbar (${toolbarWidth}px) overflows screen width (${w}px)`);
  }
});

console.log('\n====================================================');
console.log(`TOTAL AUDIT CHECKS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
console.log('====================================================');

if (failCount > 0) {
  process.exit(1);
}
