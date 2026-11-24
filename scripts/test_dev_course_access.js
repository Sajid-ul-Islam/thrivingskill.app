/**
 * Automated Verification Script for Developer / Admin Master Course Access,
 * Video Streaming, Reviews, Certificates, and Brand Colors.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
let failures = 0;
let passed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName}`);
    failures++;
  }
}

console.log('--- 1. Testing AuthContext.tsx for Dev / Admin Bypass Capabilities ---');
const authContextPath = path.join(rootDir, 'src/context/AuthContext.tsx');
const authContextCode = fs.readFileSync(authContextPath, 'utf8');

assert(authContextCode.includes('canBypassCourseLocks: boolean;'), 'AuthContextType exports canBypassCourseLocks');
assert(authContextCode.includes('devModeUnlocked: boolean;'), 'AuthContextType exports devModeUnlocked');
assert(authContextCode.includes('setDevModeUnlocked: (unlocked: boolean) => Promise<void>;'), 'AuthContextType exports setDevModeUnlocked');
assert(authContextCode.includes('const canBypassCourseLocks = isAdmin || isDevEffective;'), 'canBypassCourseLocks accounts for admin and dev mode');
assert(authContextCode.includes('@thrivingskill_admin_bypass') && authContextCode.includes('@ts_auth_admin_bypass'), 'AuthContext synchronizes both admin bypass storage keys');

console.log('--- 2. Testing LearningContext.tsx for Dev Certificate Unlocking ---');
const learningContextPath = path.join(rootDir, 'src/context/LearningContext.tsx');
const learningContextCode = fs.readFileSync(learningContextPath, 'utf8');

assert(learningContextCode.includes('unlockCertificateForDev: (courseId: string, studentName?: string) => Certificate | null;'), 'LearningContextType exports unlockCertificateForDev');
assert(learningContextCode.includes('unlockCertificateForDev: (courseId: string'), 'LearningContext implements unlockCertificateForDev');
assert(learningContextCode.includes('canBypassCourseLocks') && learningContextCode.includes('isCertificateUnlocked = (courseId: string) => {'), 'isCertificateUnlocked checks canBypassCourseLocks');

console.log('--- 3. Testing LessonPlayerScreen.tsx for Video & Testing Bypass ---');
const lessonPlayerPath = path.join(rootDir, 'src/screens/LessonPlayerScreen.tsx');
const lessonPlayerCode = fs.readFileSync(lessonPlayerPath, 'utf8');

assert(lessonPlayerCode.includes('const isPrivileged = isAdmin || Boolean(canBypassCourseLocks);'), 'LessonPlayerScreen defines isPrivileged from isAdmin and canBypassCourseLocks');
assert(lessonPlayerCode.includes('const canPlayVideo = isPrivileged || isEnrolled || isFreePreview;'), 'canPlayVideo allows privileged playback without enrollment');
assert(lessonPlayerCode.includes('isAdmin={isPrivileged}'), 'LessonPlaylistTab receives isPrivileged as isAdmin');
assert(lessonPlayerCode.includes('unlockCertificateForDev'), 'LessonPlayerScreen connects unlockCertificateForDev');
assert(lessonPlayerCode.includes('Master bypass: Unrestricted playback of all course videos'), 'LessonPlayerScreen shows dev bypass banner with quick testing actions');

console.log('--- 4. Testing CourseDetailScreen.tsx for Paywall Bypass & Dev Actions ---');
const courseDetailPath = path.join(rootDir, 'src/screens/CourseDetailScreen.tsx');
const courseDetailCode = fs.readFileSync(courseDetailPath, 'utf8');

assert(courseDetailCode.includes('const isPrivileged = isAdmin || Boolean(canBypassCourseLocks);'), 'CourseDetailScreen defines isPrivileged');
assert(courseDetailCode.includes('if (isPrivileged) {') && courseDetailCode.includes('onNavigateToLesson(course.id, targetLessonId)'), 'CourseDetailScreen bypasses PaymentModal directly to LessonPlayer');
assert(courseDetailCode.includes('isAdmin={isPrivileged}') && courseDetailCode.includes('isEnrolled={isEnrolled || isPrivileged}'), 'CourseDetailScreen passes isPrivileged to Curriculum and Reviews');
assert(courseDetailCode.includes('ADMINISTRATOR ACCESS') && courseDetailCode.includes('DEVELOPER ACCESS'), 'CourseDetailScreen displays Dev / Admin Bypass Banner');

console.log('--- 5. Testing DeveloperOptionsModal.tsx for Standard Mode Restoration ---');
const devModalPath = path.join(rootDir, 'src/components/modals/DeveloperOptionsModal.tsx');
const devModalCode = fs.readFileSync(devModalPath, 'utf8');

assert(devModalCode.includes('handleReturnToStandardMode'), 'DeveloperOptionsModal implements handleReturnToStandardMode');
assert(devModalCode.includes('Switch to Standard Mode'), 'DeveloperOptionsModal renders button to return to standard mode');
assert(devModalCode.includes('@thrivingskill_admin_bypass') && devModalCode.includes('@ts_auth_admin_bypass'), 'DeveloperOptionsModal toggles both bypass keys');

console.log('--- 6. Testing Brand Color Hygiene (#E34234 / No Yellow in Modals) ---');
const certModalPath = path.join(rootDir, 'src/components/modals/CertificateModal.tsx');
const certModalCode = fs.readFileSync(certModalPath, 'utf8');
const yellowRegex = /#FFB606|#FEF3C7|#F59E0B|#D97706|#B45309/;

assert(!yellowRegex.test(certModalCode), 'CertificateModal.tsx has zero yellow or amber hex tokens');

const certPreviewModalPath = path.join(rootDir, 'src/components/course-detail/CourseCertificatePreviewModal.tsx');
const certPreviewModalCode = fs.readFileSync(certPreviewModalPath, 'utf8');
assert(!yellowRegex.test(certPreviewModalCode), 'CourseCertificatePreviewModal.tsx has zero yellow or amber hex tokens');

const mandatoryReviewModalPath = path.join(rootDir, 'src/components/modals/MandatoryReviewModal.tsx');
const mandatoryReviewModalCode = fs.readFileSync(mandatoryReviewModalPath, 'utf8');
assert(!yellowRegex.test(mandatoryReviewModalCode), 'MandatoryReviewModal.tsx has zero yellow or amber hex tokens');

console.log(`\nResults: ${passed} Passed, ${failures} Failed.`);
if (failures > 0) {
  process.exit(1);
} else {
  console.log('ALL DEV & ADMIN ACCESS AND COLOR TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
}
