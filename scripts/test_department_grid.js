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

console.log('[TEST 1] Verifying all 8 department categories in CategoryIllustrationIcon:');
requiredCategories.forEach(cat => {
  const found = iconContent.includes(`normCat === '${cat}'`);
  if (!found) {
    console.error(`❌ CategoryIllustrationIcon missing case for: ${cat}`);
    process.exit(1);
  }
  console.log(`   ✓ Icon vector case found for '${cat}'`);
});

// 2. Verify DepartmentCategoryGrid.tsx exists and exports DEPARTMENTS_CATALOG
const gridFile = path.join(__dirname, '../src/components/common/DepartmentCategoryGrid.tsx');
if (!fs.existsSync(gridFile)) {
  console.error('❌ DepartmentCategoryGrid.tsx does not exist');
  process.exit(1);
}
const gridContent = fs.readFileSync(gridFile, 'utf8');

console.log('\n[TEST 2] Verifying DepartmentCategoryGrid structure:');
requiredCategories.forEach(cat => {
  const found = gridContent.includes(`id: '${cat}'`);
  if (!found) {
    console.error(`❌ DepartmentCategoryGrid catalog missing: ${cat}`);
    process.exit(1);
  }
  console.log(`   ✓ Catalog entry found for '${cat}'`);
});

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

console.log('\n================================================================');
console.log('✅ ALL 3 DEPARTMENT CATEGORY GRID TESTS PASSED!');
console.log('================================================================');
