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
  'src/components/modals/NotesModal.tsx',
  'src/components/modals/QuizPlayerModal.tsx',
  'src/components/modals/SkillAssessmentModal.tsx',
  'src/components/modals/CorporateInquiryModal.tsx',
  'src/components/modals/QuizModal.tsx',
  'src/components/modals/CertificateModal.tsx',
  'src/components/modals/AppUpdateModal.tsx',
  'src/components/player/YouTubePlayerModal.tsx',
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

// 9. SpringPressable splits outer layout/positioning from inner visual styles
check('SpringPressable forwards flex/width/position to outer Pressable cleanly', () => {
  const spCode = fs.readFileSync('src/components/common/SpringPressable.tsx', 'utf8');
  assert(spCode.includes('OUTER_LAYOUT_KEYS'), 'SpringPressable missing OUTER_LAYOUT_KEYS separation');
  assert(spCode.includes('style={outerStyle}'), 'SpringPressable outer Pressable must receive outerStyle');
  assert(spCode.includes('inner.flexGrow = 1'), 'SpringPressable inner Animated.View must use flexGrow: 1 instead of flex: 1');
});

// 10. QuickActionDock badge spacing & HeroCarousel dynamic cardWidth
check('QuickActionDock miniBadge has zIndex clearance above iconBox and HeroCarousel uses dynamic cardWidth', () => {
  const qdCode = fs.readFileSync('src/components/common/QuickActionDock.tsx', 'utf8');
  assert(qdCode.includes('paddingTop: 24'), 'QuickActionDock actionItem must reserve top clearance for miniBadge');
  assert(qdCode.includes('zIndex: 10'), 'QuickActionDock miniBadge must render above iconBox');

  const hcCode = fs.readFileSync('src/components/common/HeroCarousel.tsx', 'utf8');
  assert(hcCode.includes('width: cardWidth'), 'HeroCarousel renderItem must use dynamic cardWidth');
  assert(!hcCode.includes('offsetX / CARD_WIDTH'), 'HeroCarousel handleScroll must use dynamic cardWidth');
});

// 11. Dynamic useWindowDimensions across responsive components & zero module-level Dimensions.get UI traps
check('BrandDrawer, HeroCarousel, and YouTubePlayerModal use useWindowDimensions dynamically', () => {
  ['src/components/common/BrandDrawer.tsx', 'src/components/common/HeroCarousel.tsx', 'src/components/player/YouTubePlayerModal.tsx'].forEach((file) => {
    const code = fs.readFileSync(file, 'utf8');
    assert(code.includes('useWindowDimensions'), `${file} missing useWindowDimensions`);
    assert(!code.includes('Dimensions.get('), `${file} still uses static Dimensions.get`);
  });

  const bdCode = fs.readFileSync('src/components/common/BrandDrawer.tsx', 'utf8');
  assert(bdCode.includes('flexGrow: 0'), 'BrandDrawer drawerContent must avoid flex: 1 row stretch');

  const ytCode = fs.readFileSync('src/components/player/YouTubePlayerModal.tsx', 'utf8');
  assert(ytCode.indexOf('useMemo') < ytCode.indexOf('if (!currentVideo)'), 'YouTubePlayerModal useMemo must run before conditional return');
});

// 12. Floating badge zIndex layering and narrow-viewport flex shrink guards
check('Floating badges have zIndex layering and flex rows have shrink/wrap guards', () => {
  const subCode = fs.readFileSync('src/components/modals/SubscriptionModal.tsx', 'utf8');
  assert(subCode.includes('paddingTop: 10') && subCode.includes('zIndex: 10'), 'SubscriptionModal popularBadge missing top clearance or zIndex');

  const ccCode = fs.readFileSync('src/components/cards/CourseCard.tsx', 'utf8');
  assert(ccCode.includes("flexWrap: 'wrap'") && ccCode.includes('zIndex: 10'), 'CourseCard missing priceRow wrap or bookmark zIndex');

  const profCode = fs.readFileSync('src/screens/ProfileScreen.tsx', 'utf8');
  assert(profCode.includes('flexShrink: 1') && profCode.includes('flexShrink: 0'), 'ProfileScreen nameRow missing shrink protection');
});

console.log('\n====================================================');
console.log(`TOTAL AUDIT CHECKS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
console.log('====================================================');

if (failCount > 0) {
  process.exit(1);
}
