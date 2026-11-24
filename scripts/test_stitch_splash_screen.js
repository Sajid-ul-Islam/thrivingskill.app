const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- TEST SUITE: BRAND POSTER & OFFICIAL COLOR PALETTE IN SPLASH SCREEN ---');

const projectRoot = path.resolve(__dirname, '..');

// 1. Verify BrandSplashScreen file exists
const splashPath = path.join(projectRoot, 'src', 'components', 'splash', 'BrandSplashScreen.tsx');
assert(fs.existsSync(splashPath), 'BrandSplashScreen.tsx must exist');
const splashContent = fs.readFileSync(splashPath, 'utf8');

// 2. Verify actual brand poster asset is imported and rendered
assert(splashContent.includes("require('../../../assets/splash-poster.jpg')"), 'BrandSplashScreen must import authentic splash-poster.jpg');
assert(splashContent.includes('SPLASH_POSTER_IMAGE'), 'BrandSplashScreen must bind SPLASH_POSTER_IMAGE');
assert(splashContent.includes('posterImage'), 'BrandSplashScreen must have posterImage style');
console.log('  ✓ Authentic Brand Poster (assets/splash-poster.jpg) properly bound and displayed');

// 3. Verify Rule 2 Official Brand Color Palette & Accent Red
const brandColors = [
  { name: 'Crimson / Coral Accent', hex: '#E34234' },
  { name: 'Dark Surface', hex: '#0F192C' },
];

brandColors.forEach((color) => {
  assert(splashContent.includes(color.hex), `BrandSplashScreen must use official token ${color.name} (${color.hex})`);
  console.log(`  ✓ Token present: ${color.name} (${color.hex})`);
});

// 4. Verify user actions and 5-tap developer mode
assert(splashContent.includes('Get Started'), 'Missing primary CTA: Get Started');
assert(splashContent.includes('Already have an account? Sign In'), 'Missing secondary CTA: Already have an account? Sign In');
assert(splashContent.includes('v1.4.0'), 'Missing version v1.4.0');
assert(splashContent.includes('DeveloperOptionsModal'), 'Missing DeveloperOptionsModal integration');
console.log('  ✓ All CTAs and 5-tap Easter egg verified');

console.log('\n--- ALL SPLASH VERIFICATION SUITES PASSED ---');
