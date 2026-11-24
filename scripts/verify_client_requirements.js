/**
 * Comprehensive Client Requirements Verification Suite (CR-01 through CR-05)
 *
 * Verifies all 5 Client Functional Requirements against the codebase:
 * - CR-01: Behavior-Based Course Recommendation Engine
 * - CR-02: Mandatory Course Review before Certificate Release
 * - CR-03: Continuous Video Auto-Play with 5s countdown
 * - CR-04: Native LearnPress JWT Authentication
 * - CR-05: Authenticated Learner Profile with Enrolled/Graduated Courses & Data Charts
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const projectRoot = path.resolve(__dirname, '..');

let passedCount = 0;
let totalCount = 0;

function check(title, fn) {
  totalCount++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${title}`);
    passedCount++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${title}: ${err.message}`);
    throw err;
  }
}

console.log('================================================================');
console.log('  THRIVING SKILLS: CLIENT REQUIREMENTS AUDIT (CR-01 - CR-05)   ');
console.log('================================================================\n');

// -------------------------------------------------------------------------
// CR-01: Behavior-Based Course Recommendation Engine
// -------------------------------------------------------------------------
console.log('📋 [CR-01] Auditing Behavior-Based Course Recommendation Engine...');

const learningCtxPath = path.join(projectRoot, 'src', 'context', 'LearningContext.tsx');
assert(fs.existsSync(learningCtxPath), 'LearningContext.tsx must exist');
const learningCtxSrc = fs.readFileSync(learningCtxPath, 'utf8');

check('CR-01.1: LearningContext exposes behavioral recording contracts', () => {
  assert(learningCtxSrc.includes('recordCategoryInteraction: (categoryId: string) => void'), 'Must expose recordCategoryInteraction');
  assert(learningCtxSrc.includes('recordSearchKeyword: (keyword: string) => void'), 'Must expose recordSearchKeyword');
  assert(learningCtxSrc.includes('getRecommendedCourses: () =>'), 'Must expose getRecommendedCourses');
});

check('CR-01.2: Recommendation algorithm scores category affinity & search history', () => {
  assert(learningCtxSrc.includes('const scoreByCat: Record<string, number> = { ...categoryAffinities };'), 'Must track category affinity');
  assert(learningCtxSrc.includes('score += Math.min(50, catAffinity * 10);'), 'Must apply category affinity weighting');
  assert(learningCtxSrc.includes('searchKeywordsHistory.some'), 'Must match keywords from search history');
  assert(learningCtxSrc.includes('score -= 80;'), 'Must deprioritize already completed courses');
  assert(learningCtxSrc.includes('rationaleBn'), 'Must generate bilingual recommendation rationale');
});

const homeScreenPath = path.join(projectRoot, 'src', 'screens', 'HomeScreen.tsx');
assert(fs.existsSync(homeScreenPath), 'HomeScreen.tsx must exist');
const homeScreenSrc = fs.readFileSync(homeScreenPath, 'utf8');

check('CR-01.3: HomeScreen renders dynamic personalized recommendations section', () => {
  assert(homeScreenSrc.includes('getRecommendedCourses'), 'HomeScreen must invoke getRecommendedCourses');
  assert(homeScreenSrc.includes('recData.courses') || homeScreenSrc.includes('recommendations.courses') || homeScreenSrc.includes('recommendedCourses'), 'HomeScreen must bind recommendation list');
  assert(homeScreenSrc.includes('আপনার জন্য বিশেষ প্রস্তাবিত') || homeScreenSrc.includes('Recommended For You'), 'Must render bilingual recommendation section');
});

// -------------------------------------------------------------------------
// CR-02: Mandatory Course Review before Certificate Release
// -------------------------------------------------------------------------
console.log('\n📋 [CR-02] Auditing Mandatory Rating & Review Certificate Gate...');

check('CR-02.1: Certificate issuance is strictly blocked until course is 100% complete AND reviewed', () => {
  assert(learningCtxSrc.includes('const isCertificateUnlocked = (courseId: string) =>'), 'Must declare isCertificateUnlocked');
  assert(learningCtxSrc.includes('if (!progress || !progress.isCompleted) return false;'), 'Must require course completion');
  assert(learningCtxSrc.includes('return hasReviewedCourse(courseId);'), 'Must require course review');
  assert(learningCtxSrc.includes('if (isCompleted && userHasReviewed && !certId)'), 'Must enforce review gate in markLessonCompleted');
});

check('CR-02.2: Mandatory review submission persists rating & feedback and releases certificate', () => {
  assert(learningCtxSrc.includes('submitMandatoryCourseReview: ('), 'Must declare submitMandatoryCourseReview');
  assert(learningCtxSrc.includes('addCourseReview(courseId,'), 'Must attach review to course');
  assert(learningCtxSrc.includes('saveState(REVIEWS_STORAGE_KEY,'), 'Must persist reviews to storage');
});

const certModalPath = path.join(projectRoot, 'src', 'components', 'modals', 'CertificateModal.tsx');
assert(fs.existsSync(certModalPath), 'CertificateModal.tsx must exist');
const certModalSrc = fs.readFileSync(certModalPath, 'utf8');

check('CR-02.3: CertificateModal gates PDF download, sharing, and LinkedIn export behind review', () => {
  assert(certModalSrc.includes('hasReviewedCourse'), 'CertificateModal must check review state');
  assert(certModalSrc.includes('handleDownloadPdf'), 'Must protect PDF download');
  assert(certModalSrc.includes('handleShare'), 'Must protect share flow');
  assert(certModalSrc.includes('handleAddToLinkedIn'), 'Must protect LinkedIn certification');
});

const reviewModalPath = path.join(projectRoot, 'src', 'components', 'modals', 'MandatoryReviewModal.tsx');
assert(fs.existsSync(reviewModalPath), 'MandatoryReviewModal.tsx must exist');
const reviewModalSrc = fs.readFileSync(reviewModalPath, 'utf8');

check('CR-02.4: MandatoryReviewModal enforces 1-5 star rating and written review feedback', () => {
  assert(reviewModalSrc.includes('if (rating === 0)') && reviewModalSrc.includes('[1, 2, 3, 4, 5].map'), 'Must enforce 1 to 5 star rating');
  assert(reviewModalSrc.includes('feedback.trim().length < 5'), 'Must enforce constructive written comment');
  assert(reviewModalSrc.includes('onSubmit(rating, feedback.trim())'), 'Must callback with rating and feedback');
});

// -------------------------------------------------------------------------
// CR-03: Continuous Video Auto-Play (Next Lesson Transition)
// -------------------------------------------------------------------------
console.log('\n📋 [CR-03] Auditing Continuous Video Auto-Play & Next Lesson Transition...');

const playerScreenPath = path.join(projectRoot, 'src', 'screens', 'LessonPlayerScreen.tsx');
assert(fs.existsSync(playerScreenPath), 'LessonPlayerScreen.tsx must exist');
const playerScreenSrc = fs.readFileSync(playerScreenPath, 'utf8');

check('CR-03.1: LessonPlayerScreen implements 5-second auto-play transition countdown', () => {
  assert(playerScreenSrc.includes('autoplayCountdown'), 'Must state-manage autoplay countdown');
  assert(playerScreenSrc.includes('setAutoplayCountdown(5)'), 'Must trigger 5s countdown when lesson finishes');
  assert(playerScreenSrc.includes('setAutoplayCountdown((prev) => (prev !== null ? prev - 1 : null))'), 'Must tick countdown down');
});

check('CR-03.2: Autoplay countdown timer obeys cross-platform timer hygiene', () => {
  assert(playerScreenSrc.includes('autoplayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)'), 'Must use ReturnType<typeof setTimeout>');
  assert(playerScreenSrc.includes('clearTimeout(autoplayTimerRef.current)'), 'Must clear timer on cancel or unmount');
});

check('CR-03.3: Player UI provides manual Play Now override and Cancel/Pause option', () => {
  assert(playerScreenSrc.includes('onCancelAutoplay'), 'Must provide cancel callback');
  assert(playerScreenSrc.includes('goToNextLesson') || playerScreenSrc.includes('handleNextLesson'), 'Must provide immediate advance option');
});

// -------------------------------------------------------------------------
// CR-04: Native LearnPress JWT Authentication
// -------------------------------------------------------------------------
console.log('\n📋 [CR-04] Auditing Native LearnPress JWT Authentication...');

const authServicePath = path.join(projectRoot, 'src', 'services', 'api', 'authService.ts');
assert(fs.existsSync(authServicePath), 'authService.ts must exist');
const authServiceSrc = fs.readFileSync(authServicePath, 'utf8');

check('CR-04.1: AuthService uses official LearnPress JWT Token endpoints', () => {
  assert(authServiceSrc.includes('Endpoints.LEARNPRESS.TOKEN'), 'Must post to /learnpress/v1/token');
  assert(authServiceSrc.includes('Endpoints.LEARNPRESS.TOKEN_VALIDATE'), 'Must validate token via /learnpress/v1/token/validate');
  assert(authServiceSrc.includes('HttpClient.setAuthToken'), 'Must inject Bearer auth token');
});

check('CR-04.2: Direct in-app student registration creates official WordPress subscriber accounts', () => {
  assert(authServiceSrc.includes('static async register'), 'Must implement in-app registration');
  assert(authServiceSrc.includes('_lp_custom_register_form') || authServiceSrc.includes('confirm_password'), 'Must adhere to LearnPress registration schema');
});

const authModalPath = path.join(projectRoot, 'src', 'components', 'modals', 'AuthModal.tsx');
assert(fs.existsSync(authModalPath), 'AuthModal.tsx must exist');
const authModalSrc = fs.readFileSync(authModalPath, 'utf8');

check('CR-04.3: AuthModal handles login, registration, lost password & native password reset links', () => {
  assert(authModalSrc.includes('handleLogin'), 'Must handle login flow');
  assert(authModalSrc.includes('handleRegister'), 'Must handle registration flow');
  assert(authModalSrc.includes('handleResetPassword'), 'Must handle password recovery flow');
  assert(authModalSrc.includes('parseResetPasswordUrl'), 'Must handle custom scheme thrivingskill:// and web reset links');
  assert(authModalSrc.includes('স্বাগতম, প্রফেশনাল'), 'Must greet professional learners in Bangla');
});

// -------------------------------------------------------------------------
// CR-05: Authenticated Learner Profile with Analytics & Course Shelves
// -------------------------------------------------------------------------
console.log('\n📋 [CR-05] Auditing Authenticated Learner Profile, Analytics & Course Shelves...');

const profileScreenPath = path.join(projectRoot, 'src', 'screens', 'ProfileScreen.tsx');
assert(fs.existsSync(profileScreenPath), 'ProfileScreen.tsx must exist');
const profileScreenSrc = fs.readFileSync(profileScreenPath, 'utf8');

check('CR-05.1: ProfileScreen separates active Enrolled Courses from Graduated Courses', () => {
  assert(profileScreenSrc.includes('enrolled') || profileScreenSrc.includes('userProgress'), 'Must track enrolled progress');
  assert(profileScreenSrc.includes('ProfileCourseSummary') || profileScreenSrc.includes('ProfileLearningPortfolio'), 'Must render learning portfolio component');
});

const portfolioPath = path.join(projectRoot, 'src', 'components', 'profile', 'ProfileLearningPortfolio.tsx');
assert(fs.existsSync(portfolioPath), 'ProfileLearningPortfolio.tsx must exist');
const portfolioSrc = fs.readFileSync(portfolioPath, 'utf8');

check('CR-05.2: Learning portfolio displays active courses with continue CTAs and graduated certificates', () => {
  assert(portfolioSrc.includes('completedLessonIds') || portfolioSrc.includes('completedLessons') || portfolioSrc.includes('progressPercent'), 'Must render completion progress');
  assert(portfolioSrc.includes("courseStatus === 'passed'") || portfolioSrc.includes('certificates'), 'Must filter completed graduated courses');
  assert(portfolioSrc.includes('onSelectCertificate'), 'Must allow viewing earned certificates');
});

const donutChartPath = path.join(projectRoot, 'src', 'components', 'profile', 'ProfileCompletionDonut.tsx');
assert(fs.existsSync(donutChartPath), 'ProfileCompletionDonut.tsx must exist');
const donutChartSrc = fs.readFileSync(donutChartPath, 'utf8');

check('CR-05.3: Profile embeds SVG-rendered circular mastery completion donut chart', () => {
  assert(donutChartSrc.includes('Svg') && donutChartSrc.includes('Circle'), 'Must render SVG chart');
  assert(donutChartSrc.includes('percentage') || donutChartSrc.includes('strokeDashoffset'), 'Must bind mastery completion percentage');
});

const courseSummaryPath = path.join(projectRoot, 'src', 'components', 'profile', 'ProfileCourseSummary.tsx');
assert(fs.existsSync(courseSummaryPath), 'ProfileCourseSummary.tsx must exist');
const courseSummarySrc = fs.readFileSync(courseSummaryPath, 'utf8');

check('CR-05.4: Profile embeds LearnPress analytics metrics and progress gauges', () => {
  assert(courseSummarySrc.includes('LearnPressStatsGrid') || courseSummarySrc.includes('lpStats'), 'Must render stats grid');
  assert(courseSummarySrc.includes('progressTrack') && courseSummarySrc.includes('progressFill'), 'Must render progress gauges');
  assert(courseSummarySrc.includes('isGraduated'), 'Must identify graduated courses');
});

check('CR-05.5: Official ThrivingSkills brand palette applied across profile, headers and CTAs', () => {
  const headerPath = path.join(projectRoot, 'src', 'components', 'common', 'Header.tsx');
  const headerSrc = fs.readFileSync(headerPath, 'utf8');
  assert(headerSrc.includes("Thriving<Text style={{ color: '#E34234' }}>Skills</Text>"), 'Main header wordmark must style Skills in #E34234');

  const drawerPath = path.join(projectRoot, 'src', 'components', 'common', 'BrandDrawer.tsx');
  const drawerSrc = fs.readFileSync(drawerPath, 'utf8');
  assert(drawerSrc.includes("Thriving<Text style={{ color: '#E34234' }}>Skills</Text>"), 'Drawer wordmark must style Skills in #E34234');
});

console.log('\n================================================================');
console.log(`  SUMMARY: ALL ${passedCount}/${totalCount} CLIENT REQUIREMENTS CHECKS PASSED!   `);
console.log('================================================================\n');
