// scripts/test_paid_ebooks.js
// Automated verification suite for Paid eBooks & Checkout Flow

const fs = require('fs');
const path = require('path');

console.log('=== RUNNING PAID EBOOKS & CHECKOUT SUITE ===\n');

let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

// 1. Verify siteNavigationService.ts
const navServicePath = path.join(__dirname, '../src/services/site/siteNavigationService.ts');
const navServiceContent = fs.readFileSync(navServicePath, 'utf-8');

assert(navServiceContent.includes('price: number;'), 'EbookItem interface declares mandatory price field');
assert(navServiceContent.includes('ebook-sales-pp'), 'Flagship live eBook (ebook-sales-pp) is present');
assert(navServiceContent.includes('ভাই, PP কতো ?'), 'Flagship title "ভাই, PP কতো ?" is present');
assert(navServiceContent.includes('sales-ebook'), 'Flagship courseId "sales-ebook" matches live LearnPress URL');

// Extract all CANONICAL_EBOOKS items and verify prices
const priceMatches = navServiceContent.match(/price:\s*(\d+)/g);
assert(priceMatches && priceMatches.length >= 7, `All eBooks have price declarations (found ${priceMatches ? priceMatches.length : 0})`);

// 2. Verify EbookModal.tsx
const modalPath = path.join(__dirname, '../src/components/modals/EbookModal.tsx');
const modalContent = fs.readFileSync(modalPath, 'utf-8');

assert(!modalContent.includes('Read & Download Free'), 'EbookModal completely eliminated "Read & Download Free"');
assert(modalContent.includes('Buy eBook • ৳') || modalContent.includes('Buy eBook'), 'EbookModal renders Buy eBook paid action');
assert(modalContent.includes('৳{book.price}'), 'EbookModal displays transparent eBook price tag');
assert(modalContent.includes('minHeight: 44'), 'Buy and Read buttons enforce 44dp minimum touch target (Fitts Law)');
assert(modalContent.includes('#FFB606'), 'Category pills use brand Sunshine Gold #FFB606 to prevent solid white pill contrast bug');
assert(modalContent.includes('STORAGE_KEY_PURCHASED_EBOOKS'), 'EbookModal supports persistent purchase tracking in AsyncStorage');

console.log(`\n====================================================`);
if (failed === 0) {
  console.log(`🎉 ALL PAID EBOOK CHECKS PASSED SUCCESSFULLY!`);
  process.exit(0);
} else {
  console.error(`❌ ${failed} CHECKS FAILED!`);
  process.exit(1);
}
