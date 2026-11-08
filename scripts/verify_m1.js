const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== VERIFYING MILESTONE 1 IMPLEMENTATION ===\n');

let passCount = 0;
let failCount = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
    passCount++;
  } catch (err) {
    console.error(`❌ FAIL: ${name}\n   Error: ${err.message}`);
    failCount++;
  }
}

// 1. Shapes Token Verification
test('src/theme/shapes.ts exports canonical M3 shape tokens and types', () => {
  const shapesPath = path.resolve('src/theme/shapes.ts');
  assert(fs.existsSync(shapesPath), 'shapes.ts must exist');
  const content = fs.readFileSync(shapesPath, 'utf8');
  assert(content.includes('none: 0'), 'none: 0 token missing');
  assert(content.includes('extraSmall: 4'), 'extraSmall: 4 token missing');
  assert(content.includes('small: 8'), 'small: 8 token missing');
  assert(content.includes('medium: 12'), 'medium: 12 token missing');
  assert(content.includes('large: 16'), 'large: 16 token missing');
  assert(content.includes('largeIncreased: 20'), 'largeIncreased: 20 token missing');
  assert(content.includes('extraLarge: 28'), 'extraLarge: 28 token missing');
  assert(content.includes('full: 9999'), 'full: 9999 token missing');
  assert(content.includes('export type ShapeTokens'), 'ShapeTokens type missing');
  assert(content.includes('export type ShapeKey'), 'ShapeKey type missing');
});

// 2. App.tsx Bottom Navigation & M3 Pill Capsule
test('App.tsx uses Pressable, android_ripple, and M3 tabPillIndicator capsule', () => {
  const appPath = path.resolve('App.tsx');
  const content = fs.readFileSync(appPath, 'utf8');
  assert(content.includes('Pressable'), 'App.tsx must import and use Pressable');
  assert(content.includes('android_ripple'), 'App.tsx must configure android_ripple for tactile feedback');
  assert(content.includes('styles.tabPillIndicator'), 'App.tsx must wrap tab icon in tabPillIndicator');
  assert(content.includes('minHeight: 48'), 'tabButton must declare minHeight: 48 for touch compliance');
  assert(content.includes('borderRadius: shape.full'), 'tabPillIndicator must use shape.full');
});

// 3. Touch Target Compliance in Common Components
test('SearchSpotlightBar.tsx has hitSlop on tag pills and minHeight: 48 on search box', () => {
  const file = path.resolve('src/components/common/SearchSpotlightBar.tsx');
  const content = fs.readFileSync(file, 'utf8');
  assert(content.includes('hitSlop={{ top: 12, bottom: 12, left: 6, right: 6 }}'), 'tagPill missing hitSlop');
  assert(content.includes('minHeight: 48'), 'searchBox missing minHeight: 48');
  assert(content.includes('shape.large') || content.includes('shape.medium'), 'missing shape tokens in SearchSpotlightBar');
});

test('CategoryPills.tsx has hitSlop on pills and uses shape.full', () => {
  const file = path.resolve('src/components/common/CategoryPills.tsx');
  const content = fs.readFileSync(file, 'utf8');
  assert(content.includes('hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}'), 'pill missing hitSlop');
  assert(content.includes('borderRadius: shape.full'), 'pill must use shape.full');
});

test('CoursesScreen.tsx has hitSlop on viewToggleBtn, levelPill, and sortBtn', () => {
  const file = path.resolve('src/screens/CoursesScreen.tsx');
  const content = fs.readFileSync(file, 'utf8');
  assert(content.includes('hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}'), 'missing viewToggleBtn/sortBtn hitSlop');
  assert(content.includes('hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}'), 'missing levelPill hitSlop');
  assert(content.includes('shape.small'), 'missing shape.small in CoursesScreen');
});

test('BrandDrawer.tsx has hitSlop on switchWsBtn and closeBtn', () => {
  const file = path.resolve('src/components/common/BrandDrawer.tsx');
  const content = fs.readFileSync(file, 'utf8');
  assert(content.includes('hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}'), 'missing hitSlop on switchWsBtn');
  assert(content.includes('minHeight: 48'), 'missing minHeight: 48 on actionRow');
});

// 4. Timer Hygiene
test('BrandDrawer.tsx uses useRef for navTimerRef and cleans up in useEffect unmount', () => {
  const file = path.resolve('src/components/common/BrandDrawer.tsx');
  const content = fs.readFileSync(file, 'utf8');
  assert(content.includes('navTimerRef = useRef'), 'missing navTimerRef');
  assert(content.includes('clearTimeout(navTimerRef.current)'), 'missing clearTimeout on navTimerRef');
  assert(!content.includes('setTimeout(action, 150);'), 'bare unhandled setTimeout must not exist');
});

// 5. Brand Color Cleansing
test('Zero instances of #102E52 typo in src/ directory', () => {
  function scan(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        scan(full);
      } else if (e.name.endsWith('.ts') || e.name.endsWith('.tsx')) {
        const text = fs.readFileSync(full, 'utf8');
        assert(!text.includes('#102E52'), `Found #102E52 in ${full}`);
      }
    }
  }
  scan(path.resolve('src'));
});

test('YouTube components use brand Deep Navy #102F53', () => {
  const files = [
    'src/screens/YouTubeVideosScreen.tsx',
    'src/components/cards/YouTubeCard.tsx',
    'src/components/player/YouTubePlayerModal.tsx',
  ];
  for (const f of files) {
    const text = fs.readFileSync(path.resolve(f), 'utf8');
    assert(text.includes('#102F53'), `${f} must use official brand navy #102F53`);
    assert(!text.includes('#102E52'), `${f} must not contain #102E52`);
  }
});

test('Star ratings in YouTubePlayerModal and SpecialBundleCard use brand gold starColor', () => {
  const ytModal = fs.readFileSync(path.resolve('src/components/player/YouTubePlayerModal.tsx'), 'utf8');
  assert(ytModal.includes('colors.starColor'), 'YouTubePlayerModal star rating must use colors.starColor');

  const bundle = fs.readFileSync(path.resolve('src/components/cards/SpecialBundleCard.tsx'), 'utf8');
  assert(bundle.includes('colors.starColor'), 'SpecialBundleCard star rating must use colors.starColor');
});

console.log(`\nResults: ${passCount} Passed, ${failCount} Failed`);
if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL MILESTONE 1 VERIFICATIONS PASSED!\n');
}
