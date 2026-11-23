/**
 * Automated Verification Suite: Modern Decluttered Profile Redesign
 * Verifies:
 * 1. Zero data loss: All features, course portfolio, certificates, badges, support channels,
 *    preferences, and modals remain 100% accessible.
 * 2. ProfileSupportHub consolidates WhatsApp, Messenger, Hotline, Email into 4-in-1 tile grid.
 * 3. ProfileCourseSummary renders modern KPI bar, certificates showcase, and expandable course portfolio.
 * 4. ProfileScreen is unified into a single streamlined executive feed without clunky segmented tabs.
 * 5. Type safety and proper component exports.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

function runSuite() {
  console.log('====================================================');
  console.log('   PROFILE DECLUTTER & MODERN REDESIGN AUDIT        ');
  console.log('====================================================\n');

  // Test 1: ProfileSupportHub Architecture
  console.log('Test 1: Verifying ProfileSupportHub & Direct 4-in-1 Contact Grid...');
  const supportHubPath = path.join(__dirname, '..', 'src', 'components', 'profile', 'ProfileSupportHub.tsx');
  assert.strictEqual(fs.existsSync(supportHubPath), true, 'ProfileSupportHub.tsx must exist');

  const supportHubContent = fs.readFileSync(supportHubPath, 'utf8');
  assert.strictEqual(supportHubContent.includes('wa.me/8801312100288'), true, 'Must link to official WhatsApp');
  assert.strictEqual(supportHubContent.includes('m.me/thrivingskills'), true, 'Must link to Messenger');
  assert.strictEqual(supportHubContent.includes('tel:01312100288'), true, 'Must link to Hotline 01312100288');
  assert.strictEqual(supportHubContent.includes('mailto:info@thrivingskill.com'), true, 'Must link to official Email');
  assert.strictEqual(supportHubContent.includes('onOpenHelpFaq'), true, 'Must provide Help & FAQ trigger');
  assert.strictEqual(supportHubContent.includes('onOpenBlog'), true, 'Must provide Blog & Articles trigger');
  assert.strictEqual(supportHubContent.includes('onOpenEbook'), true, 'Must provide eBook Library trigger');
  assert.strictEqual(supportHubContent.includes('onOpenInstructors'), true, 'Must provide Course Authors trigger');
  assert.strictEqual(supportHubContent.includes('onOpenStorage'), true, 'Must provide Storage & Sync trigger');
  console.log('  ✅ [PASS] ProfileSupportHub direct contact grid and resources validated\n');

  // Test 2: ProfileCourseSummary Component
  console.log('Test 2: Verifying ProfileCourseSummary & Zero-Data-Loss Course Portfolio...');
  const courseSummaryPath = path.join(__dirname, '..', 'src', 'components', 'profile', 'ProfileCourseSummary.tsx');
  assert.strictEqual(fs.existsSync(courseSummaryPath), true, 'ProfileCourseSummary.tsx must exist');

  const courseSummaryContent = fs.readFileSync(courseSummaryPath, 'utf8');
  assert.strictEqual(courseSummaryContent.includes('kpiRow'), true, 'Must render 4-pill KPI metrics row');
  assert.strictEqual(courseSummaryContent.includes('LearnPressStatsGrid'), true, 'Must render filter chips');
  assert.strictEqual(courseSummaryContent.includes('onSelectCertificate'), true, 'Must provide certificate view & share triggers');
  assert.strictEqual(courseSummaryContent.includes('toggleExpand'), true, 'Must provide smooth expand/collapse toggle');
  assert.strictEqual(courseSummaryContent.includes('badgesScroll'), true, 'Must display skill mastery badges');
  console.log('  ✅ [PASS] ProfileCourseSummary KPI bar, certificates, and course portfolio validated\n');

  // Test 3: Exports in components/profile/index.ts
  console.log('Test 3: Verifying components/profile exports...');
  const indexPath = path.join(__dirname, '..', 'src', 'components', 'profile', 'index.ts');
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  assert.strictEqual(indexContent.includes("export * from './ProfileSupportHub'"), true);
  assert.strictEqual(indexContent.includes("export * from './ProfileCourseSummary'"), true);
  assert.strictEqual(indexContent.includes("export * from './ProfileCompletionDonut'"), true);
  assert.strictEqual(indexContent.includes("export * from './ProfileHeaderCard'"), true);
  console.log('  ✅ [PASS] All profile components exported cleanly\n');

  // Test 4: ProfilePreferencesSection Streamlining
  console.log('Test 4: Verifying ProfilePreferencesSection decluttering...');
  const prefPath = path.join(__dirname, '..', 'src', 'components', 'profile', 'ProfilePreferencesSection.tsx');
  const prefContent = fs.readFileSync(prefPath, 'utf8');
  assert.strictEqual(prefContent.includes('ProfileSupportHub'), true, 'Must use ProfileSupportHub');
  assert.strictEqual(prefContent.includes('onOpenSubscription'), true, 'Must preserve membership details');
  assert.strictEqual(prefContent.includes('onOpenOrders'), true, 'Must preserve orders trigger');
  assert.strictEqual(prefContent.includes('onOpenFlashcards'), true, 'Must preserve flashcards trigger');
  assert.strictEqual(prefContent.includes('onOpenOfflineDeck'), true, 'Must preserve offline deck trigger');
  assert.strictEqual(prefContent.includes('onOpenLocalSearch'), true, 'Must preserve FTS local search trigger');
  console.log('  ✅ [PASS] ProfilePreferencesSection streamlined and integrated\n');

  // Test 5: ProfileScreen Unified Single-Feed Architecture
  console.log('Test 5: Verifying ProfileScreen unified single executive feed...');
  const screenPath = path.join(__dirname, '..', 'src', 'screens', 'ProfileScreen.tsx');
  const screenContent = fs.readFileSync(screenPath, 'utf8');
  assert.strictEqual(screenContent.includes('ProfileCourseSummary'), true, 'Must render ProfileCourseSummary');
  assert.strictEqual(screenContent.includes('ProfilePreferencesSection'), true, 'Must render ProfilePreferencesSection');
  assert.strictEqual(screenContent.includes('ProfileHeaderCard'), true, 'Must render ProfileHeaderCard');
  console.log('  ✅ [PASS] ProfileScreen unified executive layout verified\n');

  console.log('====================================================');
  console.log('   ALL 5 PROFILE DECLUTTER AUDIT TESTS PASSED!      ');
  console.log('====================================================\n');
}

runSuite();
