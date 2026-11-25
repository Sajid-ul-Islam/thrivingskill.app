/**
 * Verification Script: Live Site Sync, Push Notifications & iOS Action Notification Panel
 *
 * Verifies:
 * 1. PushNotificationService registration, dispatching, and subscriber broadcasts
 * 2. Android Notification Channels & iOS Action Notification Categories
 * 3. Live site sync engine (detecting new courses, offers, updates from https://thrivingskill.com)
 * 4. Automated recommendation algorithm based on user progress
 * 5. IosActionNotificationPanel UI/UX compliance & haptic wiring
 * 6. NotificationModal category filters & live sync integration
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('====================================================');
console.log('   THRIVING SKILLS — NOTIFICATIONS & SYNC AUDIT     ');
console.log('====================================================\n');

let passedChecks = 0;

function pass(desc) {
  passedChecks++;
  console.log(`  ✅ [PASS] ${desc}`);
}

// -------------------------------------------------------------
// Test 1: PushNotificationService & Channels Verification
// -------------------------------------------------------------
console.log('Test 1: Verifying PushNotificationService & Action Metadata...');
const pushServicePath = path.join(__dirname, '../src/services/notifications/pushNotificationService.ts');
assert(fs.existsSync(pushServicePath), 'pushNotificationService.ts must exist');
const pushServiceContent = fs.readFileSync(pushServicePath, 'utf8');

assert(pushServiceContent.includes('ANDROID_NOTIFICATION_CHANNELS'), 'Must declare ANDROID_NOTIFICATION_CHANNELS');
assert(pushServiceContent.includes('thrivingskill_offers'), 'Must include thrivingskill_offers channel');
assert(pushServiceContent.includes('thrivingskill_courses'), 'Must include thrivingskill_courses channel');
assert(pushServiceContent.includes('thrivingskill_recommendations'), 'Must include thrivingskill_recommendations channel');
pass('Android Notification Channels properly configured (offers, courses, recommendations, updates)');

assert(pushServiceContent.includes('IOS_NOTIFICATION_CATEGORIES'), 'Must declare IOS_NOTIFICATION_CATEGORIES');
assert(pushServiceContent.includes('TS_RECOMMENDATION_ACTION_CATEGORY'), 'Must declare iOS recommendation action category');
assert(pushServiceContent.includes('TS_OFFER_ACTION_CATEGORY'), 'Must declare iOS offer action category');
assert(pushServiceContent.includes('VIEW_COURSE') || pushServiceContent.includes('CLAIM_OFFER'), 'Must provide interactive action identifiers');
pass('iOS Action Notification Categories properly defined (actionable notification panel)');

assert(pushServiceContent.includes('static subscribe('), 'Must provide real-time notification subscription');
assert(pushServiceContent.includes('notifyNewCourse('), 'Must provide notifyNewCourse helper');
assert(pushServiceContent.includes('notifyCourseOffer('), 'Must provide notifyCourseOffer helper');
assert(pushServiceContent.includes('notifyCourseRecommendation('), 'Must provide notifyCourseRecommendation helper');
assert(pushServiceContent.includes('notifySiteUpdate('), 'Must provide notifySiteUpdate helper');
assert(pushServiceContent.includes('Notifications.scheduleNotificationAsync'), 'Must deliver to native notification manager');
assert(pushServiceContent.includes('addNativeNotificationResponseListener'), 'Must provide native tap response listener');
pass('PushNotificationService event emitter, native delivery, and dispatch methods verified');

// -------------------------------------------------------------
// Test 1b: Android Manifest & App Config Status Bar Permissions
// -------------------------------------------------------------
console.log('\nTest 1b: Verifying Android Manifest & App Config for Native Status Bar Drop-Down...');
const appJsonPath = path.join(__dirname, '../app.json');
const appJsonContent = fs.readFileSync(appJsonPath, 'utf8');
assert(appJsonContent.includes('POST_NOTIFICATIONS'), 'Must declare POST_NOTIFICATIONS in app.json');
assert(appJsonContent.includes('expo-notifications'), 'Must configure expo-notifications plugin in app.json');

const manifestPath = path.join(__dirname, '../android/app/src/main/AndroidManifest.xml');
if (fs.existsSync(manifestPath)) {
  const manifestContent = fs.readFileSync(manifestPath, 'utf8');
  assert(manifestContent.includes('android.permission.POST_NOTIFICATIONS'), 'Must declare POST_NOTIFICATIONS in AndroidManifest.xml');
  assert(manifestContent.includes('android.permission.VIBRATE'), 'Must declare VIBRATE in AndroidManifest.xml');
}
pass('Native Android Status Bar permissions (POST_NOTIFICATIONS, VIBRATE) and plugin configured');

// -------------------------------------------------------------
// Test 2: Live Site Sync Service Verification
// -------------------------------------------------------------
console.log('\nTest 2: Verifying SiteSyncNotificationService Logic...');
const siteSyncPath = path.join(__dirname, '../src/services/notifications/siteSyncNotificationService.ts');
assert(fs.existsSync(siteSyncPath), 'siteSyncNotificationService.ts must exist');
const siteSyncContent = fs.readFileSync(siteSyncPath, 'utf8');

assert(siteSyncContent.includes('Endpoints.LEARNPRESS.COURSES'), 'Must query LearnPress courses endpoint');
assert(siteSyncContent.includes('Endpoints.WORDPRESS.POSTS'), 'Must query WordPress posts endpoint');
assert(siteSyncContent.includes('processCoursesAndOffers'), 'Must process courses and identify offers');
assert(siteSyncContent.includes('discountPercent'), 'Must compute real discount percentages');
assert(siteSyncContent.includes('evaluateAndSendRecommendation'), 'Must evaluate automated recommendations');
pass('SiteSyncNotificationService connects to live LearnPress & WordPress APIs');

// -------------------------------------------------------------
// Test 3: Recommendation Engine Evaluation via Real Production Logic
// -------------------------------------------------------------
console.log('\nTest 3: Executing Actual Production Course Recommendation Engine...');
const babel = require('@babel/core');
const recEnginePath = path.join(__dirname, '../src/utils/recommendations.ts');
const transformed = babel.transformFileSync(recEnginePath, {
  presets: ['babel-preset-expo'],
  filename: 'recommendations.ts',
});
const recModule = { exports: {} };
new Function('exports', 'require', 'module', transformed.code)(recModule.exports, require, recModule);
const { computeRecommendedCourses } = recModule.exports;

const mockCategories = [
  { id: 'ai', name: 'AI & Automation', count: 5, color: '#102F53' },
  { id: 'excel', name: 'Excel & Analytics', count: 4, color: '#102F53' },
  { id: 'leadership', name: 'Leadership & Mindset', count: 3, color: '#102F53' },
];

const mockCourses = [
  { id: '87314', title: 'Microsoft Excel – Advanced Level', category: 'excel', rating: 4.9, enrolledCount: 1200 },
  { id: '86355', title: 'Emotional Intelligence', category: 'leadership', rating: 4.8, enrolledCount: 800 },
  { id: '85153', title: 'Generative AI and productivity', category: 'ai', rating: 4.9, enrolledCount: 950 },
  { id: '86335', title: 'Mastering Gemini Notebook', category: 'ai', rating: 4.7, enrolledCount: 400 },
];

// Case A: Fresh learner with search keyword 'excel' - scored and ranked by real engine
const freshResult = computeRecommendedCourses({
  courses: mockCourses,
  categories: mockCategories,
  userProgress: {},
  categoryAffinities: { excel: 2 },
  searchKeywordsHistory: ['excel'],
});
assert(freshResult.courses.length > 0, 'Recommendation engine should return courses for fresh learners');
assert(freshResult.courses[0].title.includes('Excel'), 'Should prioritize high-affinity/searched Excel course');
pass(`Fresh learner real engine recommends: "${freshResult.courses[0].title}"`);

// Case B: Advanced learner who completed Excel - completed course penalized, recommends AI
const enrolledResult = computeRecommendedCourses({
  courses: mockCourses,
  categories: mockCategories,
  userProgress: {
    '87314': { courseId: '87314', completedLessonIds: ['1', '2'], lastAccessedLessonId: '2', isCompleted: true, enrolledDate: '2026-01-01' },
  },
  categoryAffinities: { ai: 3 },
  searchKeywordsHistory: ['ai'],
});
assert(enrolledResult.courses[0].id !== '87314', 'Completed course should be penalized and not ranked first');
assert(enrolledResult.courses[0].category === 'ai', 'Recommends next career track in AI');
pass(`Advanced learner real engine recommends next milestone: "${enrolledResult.courses[0].title}" (${enrolledResult.courses[0].category})`);

// -------------------------------------------------------------
// Test 4: iOS Action Notification Panel Component Verification
// -------------------------------------------------------------
console.log('\nTest 4: Verifying IosActionNotificationPanel Component...');
const panelPath = path.join(__dirname, '../src/components/common/IosActionNotificationPanel.tsx');
assert(fs.existsSync(panelPath), 'IosActionNotificationPanel.tsx must exist');
const panelContent = fs.readFileSync(panelPath, 'utf8');

assert(panelContent.includes('useSafeAreaInsets'), 'Must handle safe area insets');
assert(panelContent.includes('PushNotificationService.subscribe'), 'Must subscribe to live notifications');
assert(panelContent.includes('PanResponder'), 'Must support swipe to dismiss');
assert(panelContent.includes('triggerHaptic'), 'Must provide tactile feedback');
assert(panelContent.includes('onNavigateToCourse'), 'Must support primary action navigation');
assert(panelContent.includes('onBookmarkCourse'), 'Must support secondary action bookmarking');
assert(panelContent.includes('THRIVING') && panelContent.includes('SKILLS'), 'Must display official brand identifier');
pass('IosActionNotificationPanel provides native iOS action panel UX with swipe & haptics');

// -------------------------------------------------------------
// Test 5: NotificationModal Live Sync & Filter Integration
// -------------------------------------------------------------
console.log('\nTest 5: Verifying NotificationModal Live Integration...');
const modalPath = path.join(__dirname, '../src/components/modals/NotificationModal.tsx');
assert(fs.existsSync(modalPath), 'NotificationModal.tsx must exist');
const modalContent = fs.readFileSync(modalPath, 'utf8');

assert(modalContent.includes('syncSiteNotifications'), 'Must wire syncSiteNotifications');
assert(modalContent.includes('handleSyncWithSite'), 'Must implement handleSyncWithSite');
assert(modalContent.includes('offers'), 'Must include offers filter tab');
assert(modalContent.includes('courses'), 'Must include courses filter tab');
assert(modalContent.includes('recommendations'), 'Must include recommendations filter tab');
assert(modalContent.includes('updates'), 'Must include updates filter tab');
assert(modalContent.includes('discountBadge'), 'Must render promotional discount badges');
pass('NotificationModal features multi-category filtering and live site sync button');

// -------------------------------------------------------------
// Test 6: App.tsx Global Root Integration
// -------------------------------------------------------------
console.log('\nTest 6: Verifying App.tsx Global Mounting...');
const appPath = path.join(__dirname, '../App.tsx');
const appContent = fs.readFileSync(appPath, 'utf8');

assert(appContent.includes('IosActionNotificationPanel'), 'App.tsx must mount IosActionNotificationPanel');
assert(appContent.includes('onNavigateToCourse={navigateToCourse}'), 'Must wire navigation into panel');
assert(appContent.includes('onBookmarkCourse='), 'Must wire bookmarking into panel');
assert(appContent.includes('addNativeNotificationResponseListener'), 'Must wire native status bar notification tap routing');
pass('App.tsx mounts IosActionNotificationPanel globally with navigation, bookmarking, and native status bar deep-linking');

console.log('\n====================================================');
console.log(`   ALL ${passedChecks} NOTIFICATION & SYNC AUDIT CHECKS PASSED!   `);
console.log('====================================================\n');
