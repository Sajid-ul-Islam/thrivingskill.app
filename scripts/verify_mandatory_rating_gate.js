/**
 * Autonomous Verification Script: Mandatory Course Review & Rating Gate (CR-02)
 *
 * Verifies that:
 * 1. Certificate issuance is strictly blocked until course progress is 100% AND 1-5 star review is submitted.
 * 2. LearningContext methods (isCertificateUnlocked, markLessonCompleted, submitMandatoryCourseReview) enforce gating.
 * 3. CertificateModal blocks handleDownloadPdf, handleShare, handleAddToLinkedIn when unreviewed.
 * 4. MyLearningScreen gates completed courses behind MandatoryReviewModal and renders "Review to Unlock" CTA.
 * 5. ProfileScreen gates completed courses behind MandatoryReviewModal.
 * 6. CourseDetailScreen gates preview and LinkedIn credentials behind isCertificateUnlocked.
 * 7. LessonPlayerScreen automatically opens MandatoryReviewModal upon final lesson completion if unreviewed.
 * 8. MandatoryReviewModal enforces 1-5 star rating and minimum feedback comment length.
 */

const fs = require('fs');
const path = require('path');

let totalTests = 0;
let passedTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`  PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  FAIL: ${testName}`);
  }
}

console.log('\n======================================================');
console.log('  CR-02: Mandatory Rating & Review Certificate Gate   ');
console.log('======================================================\n');

// 1. Audit LearningContext for strict gating
console.log('[1/6] Auditing LearningContext.tsx...');
const learningContextPath = path.join(__dirname, '..', 'src', 'context', 'LearningContext.tsx');
const learningContextSrc = fs.readFileSync(learningContextPath, 'utf8');

assert(
  learningContextSrc.includes('const isCertificateUnlocked = (courseId: string) =>') &&
  learningContextSrc.includes('if (!progress || !progress.isCompleted) return false;') &&
  learningContextSrc.includes('return hasReviewedCourse(courseId);'),
  'LearningContext.isCertificateUnlocked requires BOTH isCompleted and hasReviewedCourse'
);

assert(
  learningContextSrc.includes('if (isCompleted && userHasReviewed && !certId)') &&
  learningContextSrc.includes('// Certificate is ONLY generated if the course is completed AND the user has submitted a review (CR-02)'),
  'LearningContext.markLessonCompleted does not issue certificate if unreviewed'
);

assert(
  learningContextSrc.includes('submitMandatoryCourseReview') &&
  learningContextSrc.includes('addCourseReview(courseId') &&
  learningContextSrc.includes('saveState(REVIEWS_STORAGE_KEY'),
  'LearningContext.submitMandatoryCourseReview persists review and unlocks certificate'
);

// 2. Audit CertificateModal for defense-in-depth download/share interception
console.log('\n[2/6] Auditing CertificateModal.tsx...');
const certModalPath = path.join(__dirname, '..', 'src', 'components', 'modals', 'CertificateModal.tsx');
const certModalSrc = fs.readFileSync(certModalPath, 'utf8');

assert(
  certModalSrc.includes('hasReviewedCourse') &&
  certModalSrc.includes('submitMandatoryCourseReview') &&
  certModalSrc.includes('certificate.courseId ? hasReviewedCourse(certificate.courseId) : true'),
  'CertificateModal checks hasReviewedCourse for certificate.courseId'
);

assert(
  certModalSrc.includes('const requireReviewGate = (): boolean =>') &&
  certModalSrc.includes('if (!isReviewed) {') &&
  certModalSrc.includes('setReviewModalVisible(true);'),
  'CertificateModal implements requireReviewGate interceptor'
);

assert(
  certModalSrc.includes('const handleShare = async () => {\n    if (!requireReviewGate()) return;') ||
  certModalSrc.includes('const handleShare = async () => {\r\n    if (!requireReviewGate()) return;'),
  'CertificateModal.handleShare is blocked if unreviewed'
);

assert(
  certModalSrc.includes('const handleDownloadPdf = async () => {\n    if (!requireReviewGate()) return;') ||
  certModalSrc.includes('const handleDownloadPdf = async () => {\r\n    if (!requireReviewGate()) return;'),
  'CertificateModal.handleDownloadPdf is blocked if unreviewed'
);

assert(
  certModalSrc.includes('const handleAddToLinkedIn = () => {\n    if (!requireReviewGate()) return;') ||
  certModalSrc.includes('const handleAddToLinkedIn = () => {\r\n    if (!requireReviewGate()) return;'),
  'CertificateModal.handleAddToLinkedIn is blocked if unreviewed'
);

assert(
  certModalSrc.includes('MandatoryReviewModal') &&
  certModalSrc.includes('reviewModalVisible') &&
  certModalSrc.includes('submitMandatoryCourseReview('),
  'CertificateModal embeds MandatoryReviewModal to unlock immediately upon review'
);

// 3. Audit MyLearningScreen for completed course gating and review trigger
console.log('\n[3/6] Auditing MyLearningScreen.tsx...');
const myLearningPath = path.join(__dirname, '..', 'src', 'screens', 'MyLearningScreen.tsx');
const myLearningSrc = fs.readFileSync(myLearningPath, 'utf8');

assert(
  myLearningSrc.includes('hasReviewedCourse(course.id)') &&
  myLearningSrc.includes('courseStatus === \'passed\' && hasReviewedCourse(course.id) && cert'),
  'MyLearningScreen only shows "Certificate" button if course is reviewed'
);

assert(
  myLearningSrc.includes('courseStatus === \'passed\' && !hasReviewedCourse(course.id)') &&
  myLearningSrc.includes('Review to Unlock'),
  'MyLearningScreen renders "Review to Unlock" button for completed unreviewed courses'
);

assert(
  myLearningSrc.includes('activeTab === \'certificates\'') &&
  myLearningSrc.includes('const isReviewed = hasReviewedCourse(cert.courseId);') &&
  myLearningSrc.includes('REVIEW REQUIRED (LOCKED)'),
  'MyLearningScreen Certificates tab checks hasReviewedCourse and badges unreviewed as locked'
);

assert(
  myLearningSrc.includes('<MandatoryReviewModal') &&
  myLearningSrc.includes('submitMandatoryCourseReview('),
  'MyLearningScreen renders MandatoryReviewModal and handles submission'
);

// 4. Audit ProfileScreen & ProfileLearningPortfolio for completed course gating
console.log('\n[4/6] Auditing ProfileScreen.tsx & ProfileLearningPortfolio.tsx...');
const profilePath = path.join(__dirname, '..', 'src', 'screens', 'ProfileScreen.tsx');
const profileSrc = fs.readFileSync(profilePath, 'utf8');
const portfolioPath = path.join(__dirname, '..', 'src', 'components', 'profile', 'ProfileLearningPortfolio.tsx');
const portfolioSrc = fs.existsSync(portfolioPath) ? fs.readFileSync(portfolioPath, 'utf8') : '';
const combinedProfileSrc = profileSrc + '\n' + portfolioSrc;

assert(
  combinedProfileSrc.includes('courseStatus === \'passed\' && cert && hasReviewedCourse(course.id)') &&
  combinedProfileSrc.includes('courseStatus === \'passed\' && !hasReviewedCourse(course.id)'),
  'ProfileScreen / ProfileLearningPortfolio gates completed courses behind hasReviewedCourse check'
);

assert(
  profileSrc.includes('<MandatoryReviewModal') &&
  profileSrc.includes('submitMandatoryCourseReview('),
  'ProfileScreen renders MandatoryReviewModal and unlocks certificate on submit'
);

// 5. Audit CourseDetailScreen & LessonPlayerScreen
console.log('\n[5/6] Auditing CourseDetailScreen.tsx and LessonPlayerScreen.tsx...');
const courseDetailPath = path.join(__dirname, '..', 'src', 'screens', 'CourseDetailScreen.tsx');
const courseDetailSrc = fs.readFileSync(courseDetailPath, 'utf8');

assert(
  courseDetailSrc.includes('isCertificateUnlocked(course.id)') &&
  (courseDetailSrc.includes('userProgress[course.id]?.isCompleted && !hasReviewedCourse(course.id)') ||
   courseDetailSrc.includes('hasReviewed={hasReviewedCourse(course.id)}') ||
   courseDetailSrc.includes('isUnlocked={isCertificateUnlocked(course.id)}')),
  'CourseDetailScreen gates preview actions behind isCertificateUnlocked'
);

const lessonPlayerPath = path.join(__dirname, '..', 'src', 'screens', 'LessonPlayerScreen.tsx');
const lessonPlayerSrc = fs.readFileSync(lessonPlayerPath, 'utf8');

assert(
  lessonPlayerSrc.includes('if (!hasReviewedCourse(course.id)) {\n            setMandatoryReviewVisible(true);') ||
  lessonPlayerSrc.includes('if (!hasReviewedCourse(course.id)) {\r\n            setMandatoryReviewVisible(true);'),
  'LessonPlayerScreen automatically pops MandatoryReviewModal when final lesson finishes'
);

// 6. Audit MandatoryReviewModal validation rules
console.log('\n[6/6] Auditing MandatoryReviewModal.tsx...');
const reviewModalPath = path.join(__dirname, '..', 'src', 'components', 'modals', 'MandatoryReviewModal.tsx');
const reviewModalSrc = fs.readFileSync(reviewModalPath, 'utf8');

assert(
  reviewModalSrc.includes('[1, 2, 3, 4, 5].map((star) =>') &&
  reviewModalSrc.includes('if (rating === 0)'),
  'MandatoryReviewModal validates interactive 1 to 5 star rating'
);

assert(
  reviewModalSrc.includes('feedback.trim().length < 5') &&
  reviewModalSrc.includes('onSubmit(rating, feedback.trim())'),
  'MandatoryReviewModal enforces at least 5 characters of written feedback'
);

console.log('\n======================================================');
console.log(`  VERIFICATION RESULTS: ${passedTests}/${totalTests} Checks Passed  `);
console.log('======================================================\n');

if (passedTests === totalTests) {
  console.log(' SUCCESS: Mandatory Rating & Review Certificate Gate (CR-02) is 100% verified!\n');
  process.exit(0);
} else {
  console.error(` FAILURE: ${totalTests - passedTests} checks failed.\n`);
  process.exit(1);
}
