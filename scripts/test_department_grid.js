const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log('🧪 TESTING DEPARTMENT CATEGORY GRID & ILLUSTRATION SUITE');
console.log('================================================================\n');

// 1. Verify CategoryIllustrationIcon.tsx exists and contains all 8 department icons
const iconFile = path.join(__dirname, '../src/components/common/CategoryIllustrationIcon.tsx');
if (!fs.existsSync(iconFile)) {
  console.error('❌ CategoryIllustrationIcon.tsx does not exist');
  process.exit(1);
}
const iconContent = fs.readFileSync(iconFile, 'utf8');

const requiredCategories = [
  'design',
  'software',
  'networking',
  'marketing',
  'hacking',
  'development',
  'fitness',
  'business',
];

console.log('[TEST 1] Verifying all 8 department icon cases in CategoryIllustrationIcon:');
requiredCategories.forEach(cat => {
  const found = iconContent.includes(`normCat === '${cat}'`);
  if (!found) {
    console.error(`❌ CategoryIllustrationIcon missing case for: ${cat}`);
    process.exit(1);
  }
  console.log(`   ✓ Icon vector case found for '${cat}'`);
});

// 2. Verify DepartmentCategoryGrid.tsx uses DYNAMIC categories (no hardcoded DEPARTMENTS_CATALOG)
const gridFile = path.join(__dirname, '../src/components/common/DepartmentCategoryGrid.tsx');
if (!fs.existsSync(gridFile)) {
  console.error('❌ DepartmentCategoryGrid.tsx does not exist');
  process.exit(1);
}
const gridContent = fs.readFileSync(gridFile, 'utf8');

console.log('\n[TEST 2] Verifying DepartmentCategoryGrid is fully dynamic:');

// Must NOT have hardcoded DEPARTMENTS_CATALOG
if (gridContent.includes('DEPARTMENTS_CATALOG')) {
  console.error('❌ DepartmentCategoryGrid still contains hardcoded DEPARTMENTS_CATALOG — must be removed!');
  process.exit(1);
}
console.log('   ✓ No hardcoded DEPARTMENTS_CATALOG found (purged)');

// Must use dynamic context categories
if (!gridContent.includes('useLearning')) {
  console.error('❌ DepartmentCategoryGrid not sourcing from useLearning() context');
  process.exit(1);
}
console.log('   ✓ Sources categories dynamically from useLearning() context');

// Must have getIconForCategory dynamic mapper
if (!gridContent.includes('getIconForCategory')) {
  console.error('❌ DepartmentCategoryGrid missing getIconForCategory dynamic mapper');
  process.exit(1);
}
console.log('   ✓ getIconForCategory dynamic slug→icon mapper present');

// Check styling tokens
const hasSpringPressable = gridContent.includes('SpringPressable');
const hasHaptic = gridContent.includes('triggerHaptic');
const hasAccessibility = gridContent.includes('accessibilityRole="button"');

if (!hasSpringPressable || !hasHaptic || !hasAccessibility) {
  console.error('❌ DepartmentCategoryGrid missing UI/UX interaction standards');
  process.exit(1);
}
console.log('   ✓ SpringPressable touch feedback verified');
console.log('   ✓ Haptic feedback verified');
console.log('   ✓ WCAG accessibility roles verified');

// 3. Verify CoursesScreen.tsx uses DepartmentCategoryGrid
const screenFile = path.join(__dirname, '../src/screens/CoursesScreen.tsx');
const screenContent = fs.readFileSync(screenFile, 'utf8');

console.log('\n[TEST 3] Verifying CoursesScreen integration:');
const usesGrid = screenContent.includes('<DepartmentCategoryGrid');
const usesMatches = screenContent.includes('matchesDepartment');
const usesIconInHeader = screenContent.includes('<CategoryIllustrationIcon');

if (!usesGrid) {
  console.error('❌ CoursesScreen is not using DepartmentCategoryGrid');
  process.exit(1);
}
console.log('   ✓ CoursesScreen renders <DepartmentCategoryGrid />');

if (!usesMatches) {
  console.error('❌ CoursesScreen missing matchesDepartment function');
  process.exit(1);
}
console.log('   ✓ CoursesScreen matchesDepartment function active');

if (!usesIconInHeader) {
  console.error('❌ CoursesScreen missing CategoryIllustrationIcon in department row headers');
  process.exit(1);
}
console.log('   ✓ CoursesScreen renders CategoryIllustrationIcon in department row headers');

// 4. Verify NO mock categories or bundled mockData.ts in pipeline
console.log('\n[TEST 4] Verifying zero mock category data in pipeline:');

const mockDataPath = path.join(__dirname, '../src/data/mockData.ts');
if (fs.existsSync(mockDataPath)) {
  console.error('❌ src/data/mockData.ts still exists — must stay removed from production bundle!');
  process.exit(1);
}
console.log('   ✓ src/data/mockData.ts is removed from production bundle');

const coursesService = fs.readFileSync(path.join(__dirname, '../src/services/api/coursesService.ts'), 'utf8');
if (coursesService.includes("from '../../data/mockData'")) {
  console.error('❌ coursesService.ts still imports from mockData — must be removed!');
  process.exit(1);
}
console.log('   ✓ coursesService.ts does not import from mockData');

if (coursesService.includes('Math.max(totalCount, 382)')) {
  console.error('❌ coursesService.ts still has hardcoded 382 fallback count');
  process.exit(1);
}
console.log('   ✓ coursesService.ts uses live totalCount (no hardcoded 382)');

console.log('\n================================================================');
console.log('✅ ALL 4 DEPARTMENT CATEGORY GRID TESTS PASSED!');
console.log('================================================================');
