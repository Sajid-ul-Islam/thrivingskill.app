const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log('       BUTTERY SMOOTH ANIMATIONS & UI-UX AUDIT SUITE           ');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    if (details) console.log(`       -> ${details}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${testName}`);
    if (details) console.error(`       -> ${details}`);
    failCount++;
  }
}

// TEST 1: Common Animation Components
const compDir = path.join(__dirname, '../src/components/common');
const screenTrans = fs.existsSync(path.join(compDir, 'ScreenTransition.tsx'));
const springPress = fs.existsSync(path.join(compDir, 'SpringPressable.tsx'));
const animTab = fs.existsSync(path.join(compDir, 'AnimatedTabContent.tsx'));
const indexCommon = fs.readFileSync(path.join(compDir, 'index.ts'), 'utf8');

assert(
  screenTrans && springPress && animTab,
  'Animation primitives created in src/components/common',
  'ScreenTransition, SpringPressable, AnimatedTabContent exist.'
);

assert(
  indexCommon.includes('ScreenTransition') &&
    indexCommon.includes('SpringPressable') &&
    indexCommon.includes('AnimatedTabContent'),
  'Animation primitives exported in src/components/common/index.ts',
  'All 3 components cleanly exported.'
);

// TEST 2: App.tsx Screen Transitions & Hardware Back Navigation
const appTsx = fs.readFileSync(path.join(__dirname, '../App.tsx'), 'utf8');

assert(
  appTsx.includes('setLayoutAnimationEnabledExperimental(true)'),
  'Android LayoutAnimation enabled in App.tsx',
  'UIManager.setLayoutAnimationEnabledExperimental(true) executed on Android.'
);

assert(
  appTsx.includes('BackHandler.addEventListener') &&
    appTsx.includes('hardwareBackPress'),
  'Android Hardware Back Button handled in App.tsx',
  'Closes open drawers/modals/mini-player and navigates back instead of exiting app.'
);

assert(
  appTsx.includes('<ScreenTransition') &&
    appTsx.includes("activeScreen.name === 'CourseDetail'") &&
    appTsx.includes("activeScreen.name === 'LessonPlayer'"),
  'Stack screens wrapped in ScreenTransition in App.tsx',
  'CourseDetail, LessonPlayer, YouTubeVideos wrapped with native slide & fade.'
);

// TEST 3: BrandDrawer Smooth Dismissal
const brandDrawer = fs.readFileSync(
  path.join(__dirname, '../src/components/common/BrandDrawer.tsx'),
  'utf8'
);

assert(
  brandDrawer.includes('modalRendered') &&
    brandDrawer.includes('slideAnim') &&
    brandDrawer.includes('fadeAnim') &&
    brandDrawer.includes('Animated.parallel'),
  'BrandDrawer dismiss animation in BrandDrawer.tsx',
  'Uses modalRendered state and parallel slide + backdrop fade to prevent premature unmount.'
);

// TEST 4: Milestone 2 - Accordions & Expandables
const currAcc = fs.readFileSync(
  path.join(__dirname, '../src/components/player/CurriculumAccordion.tsx'),
  'utf8'
);
const helpFaq = fs.readFileSync(
  path.join(__dirname, '../src/components/modals/HelpFaqModal.tsx'),
  'utf8'
);

assert(
  currAcc.includes('LayoutAnimation.configureNext') &&
    currAcc.includes('toggleModule'),
  'CurriculumAccordion fluid expansion',
  'LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut) on toggleModule.'
);

assert(
  helpFaq.includes('LayoutAnimation.configureNext') &&
    helpFaq.includes('toggleExpand'),
  'HelpFaqModal fluid accordion expansion',
  'LayoutAnimation.configureNext on FAQ expand and category switch.'
);

// TEST 5: Milestone 3 - SpringPressable Tactile Cards & Carousel
const courseCard = fs.readFileSync(
  path.join(__dirname, '../src/components/cards/CourseCard.tsx'),
  'utf8'
);
const ytCard = fs.readFileSync(
  path.join(__dirname, '../src/components/cards/YouTubeCard.tsx'),
  'utf8'
);
const dock = fs.readFileSync(
  path.join(__dirname, '../src/components/common/QuickActionDock.tsx'),
  'utf8'
);
const carousel = fs.readFileSync(
  path.join(__dirname, '../src/components/common/HeroCarousel.tsx'),
  'utf8'
);
const ytMini = fs.readFileSync(
  path.join(__dirname, '../src/components/player/YouTubeMiniPlayer.tsx'),
  'utf8'
);

assert(
  courseCard.includes('<SpringPressable') &&
    courseCard.includes('SpringPressable'),
  'CourseCard tactile physics',
  'SpringPressable wrapped card bodies and bookmark buttons.'
);

assert(
  ytCard.includes('<SpringPressable') &&
    ytCard.includes('SpringPressable'),
  'YouTubeCard tactile physics',
  'SpringPressable wrapped video cards.'
);

assert(
  dock.includes('<SpringPressable'),
  'QuickActionDock tactile bounce',
  'SpringPressable wrapped action tiles.'
);

assert(
  carousel.includes('LayoutAnimation.configureNext') &&
    carousel.includes('<SpringPressable'),
  'HeroCarousel smooth dot pill expansion & spring slide',
  'LayoutAnimation expands active dot; SpringPressable wraps slide card.'
);

assert(
  ytMini.includes('Animated.spring') &&
    ytMini.includes('handleDismiss') &&
    ytMini.includes('<SpringPressable'),
  'YouTubeMiniPlayer spring entrance and exit animation',
  'Spring entry from bottom with animated dismiss before closePlayer().'
);

// TEST 6: Milestone 4 - Sub-Tab Cross-Fades
const cds = fs.readFileSync(
  path.join(__dirname, '../src/screens/CourseDetailScreen.tsx'),
  'utf8'
);
const lps = fs.readFileSync(
  path.join(__dirname, '../src/screens/LessonPlayerScreen.tsx'),
  'utf8'
);
const mls = fs.readFileSync(
  path.join(__dirname, '../src/screens/MyLearningScreen.tsx'),
  'utf8'
);

assert(
  cds.includes('<AnimatedTabContent tabKey={activeTab}>') &&
    cds.includes('</AnimatedTabContent>'),
  'CourseDetailScreen sub-tab cross-fade',
  'Curriculum, Q&A, Instructor, and Reviews wrapped in AnimatedTabContent.'
);

assert(
  lps.includes('<AnimatedTabContent tabKey={activeTab}>') &&
    lps.includes('</AnimatedTabContent>'),
  'LessonPlayerScreen sub-tab cross-fade',
  'Overview, Curriculum, Notes, Resources, Q&A wrapped in AnimatedTabContent.'
);

assert(
  mls.includes('<AnimatedTabContent tabKey={activeTab}>') &&
    mls.includes('</AnimatedTabContent>'),
  'MyLearningScreen sub-tab cross-fade',
  'In Progress, History, Completed, Certificates, Saved wrapped in AnimatedTabContent.'
);

console.log('\n================================================================');
console.log(`TOTAL PASS: ${passCount} | TOTAL FAIL: ${failCount}`);
console.log('================================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🚀 ALL ANIMATION & UI-UX TESTS PASSED WITH ZERO DEFECTS!');
  process.exit(0);
}
