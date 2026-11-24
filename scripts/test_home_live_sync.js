/**
 * Verification test for Home Live Asset & Animation Sync
 */
const fs = require('fs');
const path = require('path');

console.log('--- Checking Home Live Asset & Animation Sync ---');

// 1. Check BrandingService exports and constants
const brandingPath = path.join(__dirname, '..', 'src', 'services', 'api', 'brandingService.ts');
const brandingContent = fs.readFileSync(brandingPath, 'utf8');

const requiredTokens = [
  'DEFAULT_PARTNER_LOGOS',
  'DEFAULT_HOME_FEATURES',
  'DEFAULT_SPECIAL_BUNDLES',
  'DEFAULT_STUDENT_TESTIMONIALS',
  'getPartnerLogos',
  'getHomeFeatureCards',
  'getSpecialBundles',
  'getStudentTestimonials',
];

for (const token of requiredTokens) {
  if (!brandingContent.includes(token)) {
    console.error(`FAIL: Missing ${token} in brandingService.ts`);
    process.exit(1);
  }
}
console.log('✓ BrandingService contains all asset types and getters');

// 2. Check Partner Logos
const partnerLogos = [
  'BRAC Bank',
  'Amann Group',
  'IPDC Finance',
  'UCB Stock Brokerage',
  'a2i (Aspire to Innovate)',
  'Elite Paint',
  'Runner Group',
  'EU Technical Cooperation',
  'Green Hills',
];

for (const partner of partnerLogos) {
  if (!brandingContent.includes(partner)) {
    console.error(`FAIL: Missing partner logo entry for ${partner}`);
    process.exit(1);
  }
}
console.log('✓ All 9 authentic live partner logos present');

// 3. Check Special Bundles Posters
const bundlePosters = [
  'Finance-and-Accounting.jpg',
  '3.-HR-Bundle.jpg',
  'leadership.jpeg',
  '5.-Excel-Bundle.jpg',
];

for (const poster of bundlePosters) {
  if (!brandingContent.includes(poster)) {
    console.error(`FAIL: Missing promotional poster ${poster}`);
    process.exit(1);
  }
}
console.log('✓ All 4 authentic promotional bundle posters present');

// 4. Check Student Testimonials
const students = [
  'Nobel Haider',
  'Muhammad Imran Sabuj',
  'Kazi Md Siddikul Azam',
  'Mahmuda Akter',
  'Khandker Moniruzzaman',
  'Md. Musfiqur Rahman Bhuiyan',
  'Soumitro Sarkar',
];

for (const student of students) {
  if (!brandingContent.includes(student)) {
    console.error(`FAIL: Missing student testimonial for ${student}`);
    process.exit(1);
  }
}
console.log('✓ All 7 authentic student testimonials present');

// 5. Check component files exist
const componentFiles = [
  'PartnerLogoMarquee.tsx',
  'HomeFeatureGrid.tsx',
  'SpecialBundlesCarousel.tsx',
  'HomeTestimonialsCarousel.tsx',
  'index.ts',
];

for (const file of componentFiles) {
  const filePath = path.join(__dirname, '..', 'src', 'components', 'home', file);
  if (!fs.existsSync(filePath)) {
    console.error(`FAIL: Missing component file ${file}`);
    process.exit(1);
  }
}
console.log('✓ All home component files exist');

// 6. Check HomeScreen integration
const homeScreenPath = path.join(__dirname, '..', 'src', 'screens', 'HomeScreen.tsx');
const homeScreenContent = fs.readFileSync(homeScreenPath, 'utf8');

const homeTokens = [
  '<PartnerLogoMarquee',
  '<HomeFeatureGrid',
  '<SpecialBundlesCarousel',
  '<HomeTestimonialsCarousel',
  'handleSelectFeature',
  'handleSelectSpecialBundle',
];

for (const token of homeTokens) {
  if (!homeScreenContent.includes(token)) {
    console.error(`FAIL: Missing ${token} in HomeScreen.tsx`);
    process.exit(1);
  }
}
console.log('✓ HomeScreen integrates all 4 live sync components');

console.log('\nALL VERIFICATIONS PASSED SUCCESSFULLY!');
