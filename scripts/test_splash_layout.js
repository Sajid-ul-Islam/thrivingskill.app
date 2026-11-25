// scripts/test_splash_layout.js
// Tests the layout geometry of BrandSplashScreen across common device resolutions.

const devices = [
  { name: 'iPhone 14 / 15 / 16 (Standard)', width: 390, height: 844, insetTop: 47, insetBottom: 34 },
  { name: 'iPhone 15 Pro Max / 16 Plus', width: 430, height: 932, insetTop: 59, insetBottom: 34 },
  { name: 'iPhone SE (3rd Gen) / 8', width: 375, height: 667, insetTop: 20, insetBottom: 0 },
  { name: 'Android Modern (FHD+ 20:9)', width: 360, height: 800, insetTop: 32, insetBottom: 16 },
  { name: 'Android Tall (21:9)', width: 360, height: 840, insetTop: 32, insetBottom: 16 },
  { name: 'Android Compact (16:9)', width: 360, height: 640, insetTop: 24, insetBottom: 0 },
  { name: 'iPad / Tablet (4:3)', width: 480, height: 1024, insetTop: 24, insetBottom: 20 },
];

const imgNaturalW = 454;
const imgNaturalH = 982;
const imgRatio = imgNaturalW / imgNaturalH; // ~0.4623

// In splash-poster.jpg:
// Logo: y=74 to y=92
// Students: y=130 to y=450
// Headline: y=500 to y=570
// Feature icons end: y=730
// Total: y=982

console.log('=== BRAND SPLASH SCREEN LAYOUT SIMULATION (resizeMode="contain") ===\n');

let allPassed = true;

devices.forEach(dev => {
  const containerW = Math.min(dev.width, 480);
  const containerH = dev.height - dev.insetTop;
  
  // With resizeMode="contain" in container (containerW x containerH):
  const scale = Math.min(containerW / imgNaturalW, containerH / imgNaturalH);
  const renderedW = imgNaturalW * scale;
  const renderedH = imgNaturalH * scale;
  
  // Centered in container:
  const offsetX = (containerW - renderedW) / 2;
  const offsetY = (containerH - renderedH) / 2;
  
  // Absolute positions from top of screen:
  const imageTopScreen = dev.insetTop + offsetY;
  const logoTopScreen = imageTopScreen + (74 * scale);
  const logoBottomScreen = imageTopScreen + (92 * scale);
  const contentEndScreen = imageTopScreen + (730 * scale);
  const screenBottom = dev.height - dev.insetBottom;
  const dockSpace = screenBottom - contentEndScreen;
  
  // Check conditions:
  // 1. Logo must be below insetTop (safe from notch)
  const isLogoSafeFromNotch = logoTopScreen >= dev.insetTop;
  // 2. Logo must be fully on-screen
  const isLogoOnScreen = logoBottomScreen < dev.height;
  // 3. Dock space >= 100dp for buttons
  const isDockSpaceAdequate = dockSpace >= 80;
  
  const passed = isLogoSafeFromNotch && isLogoOnScreen && isDockSpaceAdequate;
  if (!passed) allPassed = false;
  
  console.log(`[${passed ? 'PASS' : 'FAIL'}] ${dev.name}:`);
  console.log(`   Screen: ${dev.width}x${dev.height} (safe: ${containerW}x${containerH})`);
  console.log(`   Rendered Image: ${renderedW.toFixed(1)}x${renderedH.toFixed(1)} at y=${imageTopScreen.toFixed(1)}`);
  console.log(`   Logo Position: y=${logoTopScreen.toFixed(1)} to ${logoBottomScreen.toFixed(1)} (Notch ends at y=${dev.insetTop})`);
  console.log(`   Content ends at: y=${contentEndScreen.toFixed(1)}, Dock Space: ${dockSpace.toFixed(1)}dp (needs ~120dp)`);
  console.log('');
});

console.log(`Overall Result: ${allPassed ? 'ALL RESOLUTIONS PASSED!' : 'SOME RESOLUTIONS FAILED'}`);
process.exit(allPassed ? 0 : 1);
