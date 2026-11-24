const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- TEST SUITE: STITCH SPLASH SCREEN INTEGRITY ---');

const projectRoot = path.resolve(__dirname, '..');

// 1. Verify BrandSplashScreen file exists
const splashPath = path.join(projectRoot, 'src', 'components', 'splash', 'BrandSplashScreen.tsx');
assert(fs.existsSync(splashPath), 'BrandSplashScreen.tsx must exist');
const splashContent = fs.readFileSync(splashPath, 'utf8');

// 2. Verify all Stitch design content is present
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

console.log(`Checking ${expectedStrings.length} design elements in BrandSplashScreen.tsx...`);
expectedStrings.forEach((str) => {
  assert(splashContent.includes(str), `Missing expected design element: ${str}`);
  console.log(`  ✓ ${str}`);
});

// 3. Verify Bengali translations exist
const expectedBengali = [
  'সার্টিফাইড',
  'ক্যারিয়ার বুস্ট',
  'প্রতিদিনের দক্ষতা অর্জন',
  'মানুষের ক্ষমতায়ন',
  'জাতির দক্ষতা বিনির্মাণে',
  'এখনই শুরু করুন',
];

console.log(`Checking Bengali translations...`);
expectedBengali.forEach((str) => {
  assert(splashContent.includes(str), `Missing expected Bengali string: ${str}`);
  console.log(`  ✓ ${str}`);
});

// 4. Verify timer hygiene
assert(!splashContent.includes('NodeJS.Timeout'), 'BrandSplashScreen must not use NodeJS.Timeout');

// 5. Verify App.tsx integrates BrandSplashScreen
const appPath = path.join(projectRoot, 'App.tsx');
const appContent = fs.readFileSync(appPath, 'utf8');
assert(appContent.includes('BrandSplashScreen'), 'App.tsx must import and use BrandSplashScreen');
assert(appContent.includes('onGetStarted'), 'App.tsx must pass onGetStarted callback');
assert(appContent.includes('onSignIn'), 'App.tsx must pass onSignIn callback');
assert(!appContent.includes('NodeJS.Timeout'), 'App.tsx must not use NodeJS.Timeout');

console.log('\n--- ALL VERIFICATION SUITES PASSED (25/25 ASSERTIONS OK) ---');
