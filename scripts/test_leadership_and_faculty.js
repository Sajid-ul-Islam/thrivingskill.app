/**
 * Automated Verification Script:
 * Leadership & Certified Faculty Live Fetching, Full Profile Flow, and Zero-Yellow Color Conformity
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

function runTests() {
  console.log('=== LEADERSHIP & CERTIFIED FACULTY VERIFICATION SUITE ===\n');

  // Test 1: Verify SiteNavigationService data & methods
  console.log('Test 1: Verifying SiteNavigationService leadership & faculty roster...');
  const siteNavPath = path.join(__dirname, '..', 'src', 'services', 'site', 'siteNavigationService.ts');
  const siteNavContent = fs.readFileSync(siteNavPath, 'utf8');

  // Verify all 6 live leadership members
  const requiredLeadership = [
    'Syed Nuruddin Ahmed',
    'Md. Abdullah Al Mahmud',
    'Yusuf Iqbal',
    'Sayed Sirajul Islam',
    'Md. Tareq Siddiqui',
    'Md: Abdulla Al Noman',
  ];
  for (const name of requiredLeadership) {
    assert.strictEqual(
      siteNavContent.includes(name),
      true,
      `SiteNavigationService must include leadership member: ${name}`
    );
  }
  console.log('  ✅ [PASS] All 6 verified live leadership members present in SiteNavigationService');

  // Verify verified live faculty
  const requiredFaculty = [
    'Saikat Barua',
    'Dr. Nazrul Islam',
    'Fahim Adnan Khan',
    'Jahid Hussain',
    'Mohammad Osman Farhan Al Harun',
    'Tahamid',
    'Mufti Yousuf Sultan',
  ];
  for (const name of requiredFaculty) {
    assert.strictEqual(
      siteNavContent.includes(name),
      true,
      `SiteNavigationService must include faculty member: ${name}`
    );
  }
  console.log('  ✅ [PASS] Verified live faculty members present in SiteNavigationService');

  // Verify fetchInstructorsFromLiveApi method exists
  assert.strictEqual(
    siteNavContent.includes('fetchInstructorsFromLiveApi'),
    true,
    'SiteNavigationService must implement fetchInstructorsFromLiveApi'
  );
  console.log('  ✅ [PASS] fetchInstructorsFromLiveApi implementation verified');

  // Test 2: Verify AboutTSLModal Leadership
  console.log('\nTest 2: Verifying AboutTSLModal Leadership & Color conformity...');
  const aboutPath = path.join(__dirname, '..', 'src', 'components', 'modals', 'AboutTSLModal.tsx');
  const aboutContent = fs.readFileSync(aboutPath, 'utf8');

  assert.strictEqual(
    aboutContent.includes('Sayed Sirajul Islam'),
    true,
    'AboutTSLModal must include Sayed Sirajul Islam'
  );

  const yellowHexRegex = /#(FFB606|FFB800|F59E0B|FEF3C7|FFFBEB)/i;
  assert.strictEqual(
    yellowHexRegex.test(aboutContent),
    false,
    'AboutTSLModal must have 0 yellow hex codes'
  );
  console.log('  ✅ [PASS] AboutTSLModal has Sayed Sirajul Islam and 0 yellow hex codes');

  // Test 3: Verify InstructorsModal component
  console.log('\nTest 3: Verifying InstructorsModal component architecture...');
  const instructorsModalPath = path.join(__dirname, '..', 'src', 'components', 'modals', 'InstructorsModal.tsx');
  const instructorsContent = fs.readFileSync(instructorsModalPath, 'utf8');

  assert.strictEqual(
    instructorsContent.includes('AuthorAvatar'),
    true,
    'InstructorsModal must include AuthorAvatar component'
  );
  assert.strictEqual(
    instructorsContent.includes('avatarFallback'),
    true,
    'AuthorAvatar must have initials avatarFallback'
  );
  assert.strictEqual(
    instructorsContent.includes('fetchInstructorsFromLiveApi'),
    true,
    'InstructorsModal must sync using fetchInstructorsFromLiveApi'
  );
  assert.strictEqual(
    yellowHexRegex.test(instructorsContent),
    false,
    'InstructorsModal must have 0 yellow hex codes'
  );
  console.log('  ✅ [PASS] InstructorsModal has AuthorAvatar fallback, live API sync, and 0 yellow hex codes');

  // Test 4: Verify Profile Flow & Redundancy
  console.log('\nTest 4: Verifying Profile Screen Flow & Redundancy...');
  const profileScreenPath = path.join(__dirname, '..', 'src', 'screens', 'ProfileScreen.tsx');
  const profileScreenContent = fs.readFileSync(profileScreenPath, 'utf8');
  const courseSummaryPath = path.join(__dirname, '..', 'src', 'components', 'profile', 'ProfileCourseSummary.tsx');
  const courseSummaryContent = fs.readFileSync(courseSummaryPath, 'utf8');
  const headerCardPath = path.join(__dirname, '..', 'src', 'components', 'profile', 'ProfileHeaderCard.tsx');
  const headerCardContent = fs.readFileSync(headerCardPath, 'utf8');

  // Verify tapping profile opens full profile modal first
  assert.strictEqual(
    headerCardContent.includes('onViewFullProfile'),
    true,
    'ProfileHeaderCard must support onViewFullProfile'
  );
  assert.strictEqual(
    profileScreenContent.includes('onViewFullProfile'),
    true,
    'ProfileScreen must wire onViewFullProfile'
  );
  assert.strictEqual(
    profileScreenContent.includes('FullProfileModal'),
    true,
    'ProfileScreen must render FullProfileModal'
  );

  // Verify compact tabs to prevent card duplication
  assert.strictEqual(
    courseSummaryContent.includes('compactTabs={true}'),
    true,
    'ProfileCourseSummary must use compactTabs to avoid repeating course portfolio cards'
  );

  // Verify zero yellow in Profile files
  assert.strictEqual(
    yellowHexRegex.test(courseSummaryContent),
    false,
    'ProfileCourseSummary must have 0 yellow hex codes'
  );
  console.log('  ✅ [PASS] Profile flow: tap opens full profile modal, compact tabs eliminate redundancy, 0 yellow in summary');

  // Test 5: Verify AuthModal Language Pill & Logo
  console.log('\nTest 5: Verifying AuthModal Language Pill & Logo color tokens...');
  const authModalPath = path.join(__dirname, '..', 'src', 'components', 'modals', 'AuthModal.tsx');
  const authModalContent = fs.readFileSync(authModalPath, 'utf8');

  assert.strictEqual(
    yellowHexRegex.test(authModalContent),
    false,
    'AuthModal must have 0 yellow hex codes'
  );
  assert.strictEqual(
    authModalContent.includes("color: '#E34234'"),
    true,
    'AuthModal must use #E34234 for active text'
  );
  assert.strictEqual(
    authModalContent.includes("borderColor: '#E34234'"),
    true,
    'AuthModal must use #E34234 for brand logo box border'
  );
  console.log('  ✅ [PASS] AuthModal language pill and logo box use #E34234');

  console.log('\n========================================');
  console.log('ALL VERIFICATION SUITE CHECKS PASSED (5/5)!');
  console.log('========================================\n');
}

runTests();
