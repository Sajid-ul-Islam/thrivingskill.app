const fs = require('fs');
const assert = require('assert');

console.log('====================================================');
console.log('VERIFYING MOBILE UX / UI / LAYOUT PRINCIPLES');
console.log('====================================================\n');

let passed = 0;
let failed = 0;

function check(label, fn) {
  try {
    fn();
    console.log(`[PASS] ${label}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] ${label}: ${err.message}`);
    failed++;
  }
}

const read = (p) => fs.readFileSync(p, 'utf8');

// 1. One screen, one job
check('HomeScreen is focused on learning launchpad without bloated footer walls', () => {
  const home = read('src/screens/HomeScreen.tsx');
  assert(!home.includes('REVIEWS_WALL'), 'HomeScreen should not render REVIEWS_WALL carousel');
  assert(!home.includes('CORPORATE_CLIENTS'), 'HomeScreen should not render CORPORATE_CLIENTS wall');
  assert(home.includes('gatewayCard'), 'HomeScreen should render compact Enterprise & About gateway card');
});

check('ProfileScreen separates Learning & Stats from Settings & Account via segmented tabs', () => {
  const profile = read('src/screens/ProfileScreen.tsx');
  assert(profile.includes("profileSection === 'learning'"), 'ProfileScreen missing learning segment');
  assert(profile.includes("profileSection === 'settings'"), 'ProfileScreen missing settings segment');
  assert(profile.includes('ProfileLearningAnalytics'), 'ProfileScreen missing CR-05 ProfileLearningAnalytics');
});

// 2. Progressive disclosure
check('CorporateInquiryModal implements 3-step wizard with progress bar', () => {
  const corp = read('src/components/modals/CorporateInquiryModal.tsx');
  assert(corp.includes('useState<1 | 2 | 3>(1)'), 'CorporateInquiryModal missing 3-step state');
  assert(corp.includes('Step ${step} of 3'), 'CorporateInquiryModal missing step progress label');
  assert(corp.includes('progressFill'), 'CorporateInquiryModal missing visual progress bar');
});

check('AuthModal implements 2-step progressive registration with progress bar', () => {
  const auth = read('src/components/modals/AuthModal.tsx');
  assert(auth.includes('regStep, setRegStep'), 'AuthModal missing regStep state');
  assert(auth.includes('Step {regStep} of 2'), 'AuthModal missing registration step indicator');
  assert(!auth.includes("'+ Env.SITE_URL"), 'AuthModal must not have uninterpolated Env.SITE_URL string');
});

check('PaymentModal includes 2-step member access sync progress stepper', () => {
  const pay = read('src/components/modals/PaymentModal.tsx');
  assert(pay.includes('syncStep'), 'PaymentModal missing syncStep indicator');
  assert(pay.includes('stepperFill'), 'PaymentModal missing visual stepper progress fill');
});

// 3. Immediate feedback (Visual + Haptic + Textual Toasts)
check('Haptic feedback utility and SpringPressable tactile integration exist', () => {
  const haptics = read('src/utils/haptics.ts');
  assert(haptics.includes('triggerHaptic'), 'haptics.ts missing triggerHaptic');
  const spring = read('src/components/common/SpringPressable.tsx');
  assert(spring.includes('triggerHaptic'), 'SpringPressable missing triggerHaptic call');
});

check('Global FeedbackContext & ActionToast are wired into App.tsx', () => {
  const app = read('App.tsx');
  assert(app.includes('FeedbackProvider'), 'App.tsx missing FeedbackProvider');
  assert(app.includes('<ActionToast'), 'App.tsx missing ActionToast');
  const toast = read('src/components/common/ActionToast.tsx');
  assert(toast.includes('accessibilityLiveRegion="polite"'), 'ActionToast missing polite live region');
});

// 4. Error prevention & recovery (Early validation + Undo)
check('Early inline validation exists in AuthModal, CorporateInquiryModal, and ProfileScreen', () => {
  const auth = read('src/components/modals/AuthModal.tsx');
  assert(auth.includes('inlineFieldError') && auth.includes('passwordStrength'), 'AuthModal missing inline validation & strength meter');
  const corp = read('src/components/modals/CorporateInquiryModal.tsx');
  assert(corp.includes('emailError') && corp.includes('companyError'), 'CorporateInquiryModal missing inline field errors');
  const profile = read('src/screens/ProfileScreen.tsx');
  assert(profile.includes('Passwords do not match.'), 'ProfileScreen missing inline password match check');
});

check('Action reversal (Undo) is supported for note deletion, bookmarks, workshops, and offline downloads', () => {
  const learning = read('src/context/LearningContext.tsx');
  assert(learning.includes('restoreNote'), 'LearningContext missing restoreNote');
  assert(learning.includes('toggleWorkshopRsvp'), 'LearningContext missing toggleWorkshopRsvp');
  const notes = read('src/components/modals/NotesModal.tsx');
  assert(notes.includes("actionLabel: 'Undo'") && notes.includes('restoreNote'), 'NotesModal missing Undo toast');
  const wsCard = read('src/components/cards/LiveWorkshopCard.tsx');
  assert(wsCard.includes("actionLabel: 'Undo'"), 'LiveWorkshopCard missing Undo toast');
  const lesson = read('src/screens/LessonPlayerScreen.tsx');
  assert(lesson.includes("actionLabel: 'Undo'"), 'LessonPlayerScreen missing Undo toast for offline removal');
});

// 5 & 8. Visual Hierarchy & Typography (H1-H6 + System Native Stack)
check('Typography system defines strict H1-H6 scale with system-native font stack', () => {
  const typo = read('src/theme/typography.ts');
  ['h1:', 'h2:', 'h3:', 'h4:', 'h5:', 'h6:', 'body:', 'caption:', 'button:'].forEach((k) => {
    assert(typo.includes(k), `typography.ts missing ${k}`);
  });
  assert(typo.includes("ios: 'System'") && typo.includes("android: 'Roboto'"), 'typography.ts must use system-native fonts');
  assert(typo.includes('MIN_TOUCH_TARGET = 44'), 'typography.ts missing MIN_TOUCH_TARGET = 44');
});

// 6. Touch Targets (>= 44x44)
check('Core interactive controls enforce >= 44dp touch target dimensions', () => {
  const header = read('src/components/common/Header.tsx');
  assert(header.includes('width: MIN_TOUCH_TARGET') && header.includes('height: MIN_TOUCH_TARGET'), 'Header iconButton must be 44x44');
  const corp = read('src/components/modals/CorporateInquiryModal.tsx');
  assert(corp.includes('minWidth: MIN_TOUCH_TARGET') && corp.includes('minHeight: MIN_TOUCH_TARGET'), 'CorporateInquiryModal closeBtn must be >= 44dp');
  const yt = read('src/screens/YouTubeVideosScreen.tsx');
  assert(yt.includes('width: MIN_TOUCH_TARGET') && yt.includes('minHeight: MIN_TOUCH_TARGET'), 'YouTubeVideosScreen buttons must be >= 44dp');
  const ws = read('src/screens/WorkshopsScreen.tsx');
  assert(ws.includes('minHeight: 44') || ws.includes('minHeight: MIN_TOUCH_TARGET'), 'WorkshopsScreen filterPill must have >= 44dp minHeight');
});

// 7. Color & Contrast (Light & Dark Mode)
check('CoursesScreen uses colors.onSecondary on secondary pill fill (dark mode WCAG AA)', () => {
  const cs = read('src/screens/CoursesScreen.tsx');
  assert(cs.includes('colors.onSecondary'), 'CoursesScreen levelPill must use colors.onSecondary');
});

// 9 & 10. Thumb-friendly navigation & Platform respect
check('Bottom navigation bar is clean primary nav without Header hamburger drawer clutter', () => {
  const header = read('src/components/common/Header.tsx');
  assert(!header.includes('menu-outline'), 'Header must not show hamburger menu icon');
  assert(header.includes("Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'"), 'Header missing iOS/Android back icon respect');
  const app = read('App.tsx');
  assert(app.includes("Platform.OS === 'android'") && app.includes('tabPillIndicator'), 'App.tsx missing Android/iOS tab bar platform respect');
});

// 11. Responsive & Adaptive States (loading, empty, offline, error)
check('NetworkContext, OfflineBanner, and StateView handle loading, empty, offline, and error states', () => {
  const app = read('App.tsx');
  assert(app.includes('NetworkProvider'), 'App.tsx missing NetworkProvider');
  const header = read('src/components/common/Header.tsx');
  assert(header.includes('<OfflineBanner'), 'Header missing OfflineBanner');
  const sv = read('src/components/common/StateView.tsx');
  ['loading', 'empty', 'offline', 'error'].forEach((m) => {
    assert(sv.includes(`'${m}'`), `StateView missing ${m} mode`);
  });
  ['HomeScreen.tsx', 'CoursesScreen.tsx', 'MyLearningScreen.tsx', 'CourseDetailScreen.tsx', 'LessonPlayerScreen.tsx', 'YouTubeVideosScreen.tsx'].forEach((s) => {
    const content = read(`src/screens/${s}`);
    assert(content.includes('<StateView'), `${s} must use StateView for adaptive states`);
  });
});

console.log(`\nSummary: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
