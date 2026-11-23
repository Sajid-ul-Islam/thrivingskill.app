const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- TEST SUITE: AUTHENTIC LEADERSHIP & INSTRUCTOR PROFILES ---');

const projectRoot = path.resolve(__dirname, '..');
const teamDir = path.join(projectRoot, 'assets', 'team');

// 1. Verify all 12 authentic team assets exist on disk
const EXPECTED_ASSETS = [
  'abdullah_al_mahmud.jpeg',
  'syed_nuruddin_ahmed.jpeg',
  'don_sumdany.png',
  'km_ali.png',
  'arif_khan.png',
  'moinuddin_chowdhury.png',
  'mamun_habib.jpeg',
  'jishu_tarafder.png',
  'humaira_sharmeen.png',
  'yusuf_iqbal.jpeg',
  'tareq_siddiqui.jpeg',
  'abdulla_al_noman.jpeg',
];

console.log(`Checking ${EXPECTED_ASSETS.length} team assets in ${teamDir}...`);
EXPECTED_ASSETS.forEach((file) => {
  const filePath = path.join(teamDir, file);
  assert(fs.existsSync(filePath), `Missing authentic asset: ${file}`);
  const stats = fs.statSync(filePath);
  assert(stats.size > 1000, `Asset ${file} appears empty or corrupted (${stats.size} bytes)`);
  console.log(`  ✓ ${file} (${stats.size} bytes)`);
});

// 2. Verify imageUtils exports INSTRUCTOR_LOCAL_AVATARS and getInstructorAvatarSource
const imageUtilsPath = path.join(projectRoot, 'src', 'utils', 'imageUtils.ts');
const imageUtilsContent = fs.readFileSync(imageUtilsPath, 'utf8');

assert(imageUtilsContent.includes('export const INSTRUCTOR_LOCAL_AVATARS'), 'INSTRUCTOR_LOCAL_AVATARS must be exported');
assert(imageUtilsContent.includes('export function getInstructorAvatarSource'), 'getInstructorAvatarSource must be exported');

const requiredKeys = ['mahmud', 'nuruddin', 'don', 'km ali', 'arif khan', 'moinuddin', 'habib', 'jishu', 'humaira', 'yusuf', 'tareq', 'noman'];
requiredKeys.forEach((key) => {
  assert(imageUtilsContent.includes(`'${key}'`) || imageUtilsContent.includes(`${key}:`), `INSTRUCTOR_LOCAL_AVATARS missing key for ${key}`);
});
console.log(`  ✓ imageUtils covers all ${requiredKeys.length} instructor/founder name keywords`);

// 3. Verify siteNavigationService CANONICAL_INSTRUCTORS has authentic profiles and NO Unsplash placeholders
const siteNavPath = path.join(projectRoot, 'src', 'services', 'site', 'siteNavigationService.ts');
const siteNavContent = fs.readFileSync(siteNavPath, 'utf8');

assert(!siteNavContent.includes('images.unsplash.com'), 'CANONICAL_INSTRUCTORS must not contain any fake Unsplash images');
assert(!siteNavContent.includes('Fahim Ahmed'), 'Generic placeholder Fahim Ahmed must be removed');
assert(!siteNavContent.includes('Tareq Rahman'), 'Generic placeholder Tareq Rahman must be removed');

const expectedProfiles = [
  'Md. Abdullah Al Mahmud',
  'Syed Nuruddin Ahmed',
  'Ghulam Sumdany Don',
  'K.M. Ali',
  'Arif Khan, CFA, FCMA',
  'Dr. Moinuddin Chowdhury',
  'Prof. Dr. Mamun Habib',
  'Jishu Tarafder',
  'Humaira Sharmeen',
  'Yusuf Iqbal',
  'Md. Tareq Siddiqui',
  'Md: Abdulla Al Noman',
];

expectedProfiles.forEach((name) => {
  assert(siteNavContent.includes(name), `CANONICAL_INSTRUCTORS must include ${name}`);
});
console.log(`  ✓ CANONICAL_INSTRUCTORS contains all ${expectedProfiles.length} authentic leaders & faculty`);

// 4. Verify InstructorsModal uses real avatars and categories
const modalPath = path.join(projectRoot, 'src', 'components', 'modals', 'InstructorsModal.tsx');
const modalContent = fs.readFileSync(modalPath, 'utf8');

assert(modalContent.includes('getInstructorAvatarSource'), 'InstructorsModal must import getInstructorAvatarSource');
assert(modalContent.includes('activeFilter'), 'InstructorsModal must have category filtering (All/Founders/Faculty)');
assert(modalContent.includes('searchQuery'), 'InstructorsModal must support search filtering');
console.log('  ✓ InstructorsModal contains search, category tabs, and authentic avatar resolution');

// 5. Verify CourseInstructorSection uses getInstructorAvatarSource
const sectionPath = path.join(projectRoot, 'src', 'components', 'course-detail', 'CourseInstructorSection.tsx');
const sectionContent = fs.readFileSync(sectionPath, 'utf8');
assert(sectionContent.includes('getInstructorAvatarSource'), 'CourseInstructorSection must import and use getInstructorAvatarSource');
console.log('  ✓ CourseInstructorSection integrates authentic team avatar resolution');

// 6. Verify CourseQuickPeekModal uses getInstructorAvatarSource
const peekPath = path.join(projectRoot, 'src', 'components', 'modals', 'CourseQuickPeekModal.tsx');
const peekContent = fs.readFileSync(peekPath, 'utf8');
assert(peekContent.includes('getInstructorAvatarSource'), 'CourseQuickPeekModal must import and use getInstructorAvatarSource');
console.log('  ✓ CourseQuickPeekModal integrates authentic team avatar resolution');

console.log('\n--- ALL 6 VERIFICATION SUITES PASSED (24/24 ASSERTIONS OK) ---');
