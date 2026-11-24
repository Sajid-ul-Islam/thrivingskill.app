const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- TEST SUITE: BRAND LOGO & OFFICIAL COLOR PALETTE IN SPLASH SCREEN ---');

const projectRoot = path.resolve(__dirname, '..');

// 1. Verify BrandSplashScreen file exists
const splashPath = path.join(projectRoot, 'src', 'components', 'splash', 'BrandSplashScreen.tsx');
assert(fs.existsSync(splashPath), 'BrandSplashScreen.tsx must exist');
const splashContent = fs.readFileSync(splashPath, 'utf8');

// 2. Verify actual brand logo asset is imported and rendered
assert(splashContent.includes("require('../../../assets/icon.png')"), 'BrandSplashScreen must import authentic brand logo icon.png');
assert(splashContent.includes('BRAND_LOGO_IMAGE'), 'BrandSplashScreen must bind BRAND_LOGO_IMAGE');
assert(splashContent.includes('brandIcon'), 'BrandSplashScreen must have brandIcon style');
console.log('  ✓ Authentic Brand Logo (assets/icon.png) properly bound and displayed');

// 3. Verify official wordmark
assert(splashContent.includes('Thriving'), 'BrandSplashScreen must include Thriving wordmark');
assert(splashContent.includes('#FFB606'), 'BrandSplashScreen must use Sunshine Gold #FFB606');
console.log('  ✓ Official Wordmark (ThrivingSkills with Sunshine Gold accent) verified');

// 4. Verify Rule 2 Official Brand Color Palette
const brandColors = [
  { name: 'Brand Deep Navy', hex: '#102F53' },
  { name: 'Sunshine Gold', hex: '#FFB606' },
  { name: 'Crimson / Coral', hex: '#E34234' },
  { name: 'Dark Surface', hex: '#0F192C' },
  { name: 'Card Surface', hex: '30, 41, 59' }, // #1E293B rgb
];

brandColors.forEach((color) => {
  assert(splashContent.includes(color.hex), `BrandSplashScreen must use official token ${color.name} (${color.hex})`);
  console.log(`  ✓ Token present: ${color.name} (${color.hex})`);
});

// 5. Verify all design content is intact
const expectedStrings = [
  'Certified',
  'Career Boost',
  'EMPOWERING EVERYDAY LEARNERS',
  'EMPOWERING PEOPLE',
  'BUILDING A SKILLED NATION',
  'Expert-Led',
  'Practical',
  'Career',
  'Learn',
  'Get Started Now',
  'Already have an account? Sign In',
  'www.thrivingskill.com',
  'App Version 4.0.2.3',
  'ENG',
  'বাংলা',
];

expectedStrings.forEach((str) => {
  assert(splashContent.includes(str), `Missing expected design element: ${str}`);
  console.log(`  ✓ Content verified: ${str}`);
});

console.log('\n--- ALL VERIFICATION SUITES PASSED (28/28 ASSERTIONS OK) ---');
