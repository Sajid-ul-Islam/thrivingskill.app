/**
 * Test Suite: Modern Feedback System (Toast, Snackbar, Banner, Popup)
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

console.log('====================================================');
console.log('VERIFYING MODERN FEEDBACK SUITE (TOAST, SNACKBAR, BANNER, POPUP)');
console.log('====================================================');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passed++;
  } else {
    console.error(`[FAIL] ${message}`);
    failed++;
  }
}

// 1. FeedbackContext contract verification
const ctxPath = path.join(root, 'src', 'context', 'FeedbackContext.tsx');
assert(fs.existsSync(ctxPath), 'FeedbackContext.tsx exists');
const ctx = fs.readFileSync(ctxPath, 'utf8');
assert(ctx.includes('showToast'), 'FeedbackContext defines showToast');
assert(ctx.includes('showSnackbar'), 'FeedbackContext defines showSnackbar');
assert(ctx.includes('showBanner'), 'FeedbackContext defines showBanner');
assert(ctx.includes('showPopup'), 'FeedbackContext defines showPopup');
assert(ctx.includes('dismissToast'), 'FeedbackContext defines dismissToast');
assert(ctx.includes('dismissSnackbar'), 'FeedbackContext defines dismissSnackbar');
assert(ctx.includes('dismissBanner'), 'FeedbackContext defines dismissBanner');
assert(ctx.includes('dismissPopup'), 'FeedbackContext defines dismissPopup');

// 2. ActionToast modern UI-UX verification
const toastPath = path.join(root, 'src', 'components', 'common', 'ActionToast.tsx');
assert(fs.existsSync(toastPath), 'ActionToast.tsx exists');
const toast = fs.readFileSync(toastPath, 'utf8');
assert(toast.includes('PanResponder.create'), 'ActionToast implements PanResponder swipe-to-dismiss');
assert(toast.includes('accessibilityRole="alert"'), 'ActionToast defines accessibilityRole="alert"');
assert(toast.includes('accessibilityLiveRegion="polite"'), 'ActionToast defines polite live region');
assert(toast.includes('isTop'), 'ActionToast supports both top and bottom positioning');

// 3. ModernSnackbar verification
const snackPath = path.join(root, 'src', 'components', 'common', 'ModernSnackbar.tsx');
assert(fs.existsSync(snackPath), 'ModernSnackbar.tsx exists');
const snack = fs.readFileSync(snackPath, 'utf8');
assert(snack.includes('progressBarFill'), 'ModernSnackbar renders animated countdown progress bar');
assert(snack.includes('SpringPressable'), 'ModernSnackbar action uses SpringPressable tactile button');
assert(snack.includes('PanResponder.create'), 'ModernSnackbar implements swipe-down dismiss');
assert(snack.includes('minHeight: 44') || snack.includes('minHeight: 52'), 'ModernSnackbar enforces minimum touch target');

// 4. ModernBanner verification
const bannerPath = path.join(root, 'src', 'components', 'common', 'ModernBanner.tsx');
assert(fs.existsSync(bannerPath), 'ModernBanner.tsx exists');
const banner = fs.readFileSync(bannerPath, 'utf8');
assert(banner.includes('BANNER_THEME'), 'ModernBanner implements semantic theme mappings');
assert(banner.includes('promo:'), 'ModernBanner includes brand promo gradient variant');
assert(banner.includes('LayoutAnimation.configureNext'), 'ModernBanner implements fluid collapse on dismiss');

// 5. ModernPopup verification
const popupPath = path.join(root, 'src', 'components', 'common', 'ModernPopup.tsx');
assert(fs.existsSync(popupPath), 'ModernPopup.tsx exists');
const popup = fs.readFileSync(popupPath, 'utf8');
assert(popup.includes('accessibilityRole="alertdialog"'), 'ModernPopup implements accessibilityRole="alertdialog"');
assert(popup.includes('BackHandler.addEventListener'), 'ModernPopup handles Android hardware back button');
assert(popup.includes('isDestructive'), 'ModernPopup supports destructive action styling');
assert(popup.includes('scaleAnim'), 'ModernPopup implements spring scale-and-fade animation');

// 6. Common index and App.tsx wiring
const indexPath = path.join(root, 'src', 'components', 'common', 'index.ts');
const indexContent = fs.readFileSync(indexPath, 'utf8');
assert(indexContent.includes('ModernSnackbar'), 'common/index.ts exports ModernSnackbar');
assert(indexContent.includes('ModernBanner'), 'common/index.ts exports ModernBanner');
assert(indexContent.includes('ModernPopup'), 'common/index.ts exports ModernPopup');

const appPath = path.join(root, 'App.tsx');
const app = fs.readFileSync(appPath, 'utf8');
assert(app.includes('<ActionToast'), 'App.tsx renders ActionToast');
assert(app.includes('<ModernSnackbar'), 'App.tsx renders ModernSnackbar');
assert(app.includes('<ModernBanner'), 'App.tsx renders ModernBanner');
assert(app.includes('<ModernPopup'), 'App.tsx renders ModernPopup');

console.log('\n====================================================');
console.log(`Summary: ${passed} passed, ${failed} failed`);
console.log('====================================================');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
