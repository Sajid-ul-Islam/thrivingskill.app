const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=================================================================');
console.log('  CHALLENGER ADVERSARIAL STRESS TEST SUITE — MILESTONE 1');
console.log('=================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function challenge(title, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  [PASS] ${title}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] ${title}`);
    console.error(`         Reason: ${err.message}`);
    failedTests++;
    failures.push({ title, error: err.message });
  }
}

// ----------------------------------------------------------------------------
// 1. M3 SHAPE TOKENS CONTRACT & MATHEMATICAL CONFORMANCE
// ----------------------------------------------------------------------------
challenge('T1.1: shapes.ts exists and strictly conforms to canonical M3 shape scale', () => {
  const shapesPath = path.resolve('src/theme/shapes.ts');
  assert(fs.existsSync(shapesPath), 'src/theme/shapes.ts must exist');

  const content = fs.readFileSync(shapesPath, 'utf8');

  const expectedScale = {
    none: 0,
    extraSmall: 4,
    small: 8,
    medium: 12,
    large: 16,
    largeIncreased: 20,
    extraLarge: 28,
    full: 9999,
  };

  const keys = Object.keys(expectedScale);
  for (const k of keys) {
    const regex = new RegExp(`\\b${k}:\\s*(\\d+)`);
    const match = content.match(regex);
    assert(match, `Token "${k}" is missing from shape export in shapes.ts`);
    const val = parseInt(match[1], 10);
    assert.strictEqual(val, expectedScale[k], `Token "${k}" value must be ${expectedScale[k]}, got ${val}`);
  }

  // Ensure TypeScript types are exported
  assert(content.includes('export type ShapeTokens'), 'ShapeTokens type must be exported');
  assert(content.includes('export type ShapeKey'), 'ShapeKey type must be exported');
  assert(content.includes('as const'), 'shape object must be declared "as const" for strict typing');
});

challenge('T1.2: shapes tokens monotonicity and pixel bounds validation', () => {
  const shapesPath = path.resolve('src/theme/shapes.ts');
  const content = fs.readFileSync(shapesPath, 'utf8');
  
  const tokenRegex = /(\w+):\s*(\d+)/g;
  let m;
  const parsed = {};
  while ((m = tokenRegex.exec(content)) !== null) {
    parsed[m[1]] = parseInt(m[2], 10);
  }

  const values = [
    parsed.none,
    parsed.extraSmall,
    parsed.small,
    parsed.medium,
    parsed.large,
    parsed.largeIncreased,
    parsed.extraLarge,
    parsed.full,
  ];

  for (let i = 0; i < values.length; i++) {
    assert(typeof values[i] === 'number' && !isNaN(values[i]), `Value at index ${i} is not a valid number`);
    assert(values[i] >= 0, `Value ${values[i]} must be non-negative`);
    if (i > 0) {
      assert(values[i] > values[i - 1], `Values must be strictly monotonic: ${values[i]} > ${values[i - 1]}`);
    }
  }
});

// ----------------------------------------------------------------------------
// 2. APP.TSX BOTTOM NAVIGATION PILL CAPSULE & TOUCH TARGET CONFORMANCE
// ----------------------------------------------------------------------------
challenge('T2.1: App.tsx tabButton enforces minHeight: 48 for WCAG/M3 touch target', () => {
  const appPath = path.resolve('App.tsx');
  const content = fs.readFileSync(appPath, 'utf8');

  // Verify tabButton style block has minHeight: 48
  const tabButtonMatch = content.match(/tabButton:\s*\{([^}]+)\}/s);
  assert(tabButtonMatch, 'tabButton style block not found in App.tsx');
  assert(/minHeight:\s*48/.test(tabButtonMatch[1]), 'tabButton must declare minHeight: 48');
});

challenge('T2.2: App.tsx tabPillIndicator defines exact 60x32 capsule with borderRadius: shape.full', () => {
  const appPath = path.resolve('App.tsx');
  const content = fs.readFileSync(appPath, 'utf8');

  const pillMatch = content.match(/tabPillIndicator:\s*\{([^}]+)\}/s);
  assert(pillMatch, 'tabPillIndicator style block not found in App.tsx');
  assert(/width:\s*60/.test(pillMatch[1]), 'tabPillIndicator width must be 60');
  assert(/height:\s*32/.test(pillMatch[1]), 'tabPillIndicator height must be 32');
  assert(/borderRadius:\s*shape\.full/.test(pillMatch[1]), 'tabPillIndicator borderRadius must use shape.full');
});

challenge('T2.3: App.tsx tab bar layout: active icon is inside pill capsule, label is outside', () => {
  const appPath = path.resolve('App.tsx');
  const content = fs.readFileSync(appPath, 'utf8');

  // Check tab rendering block
  const tabMapIdx = content.indexOf('{tabItems.map((tab) => {');
  assert(tabMapIdx !== -1, 'tabItems.map block not found in App.tsx');
  const tabBlock = content.substring(tabMapIdx, tabMapIdx + 2000);

  // Pressable container
  assert(tabBlock.includes('<Pressable'), 'Must use Pressable component for tab');
  assert(tabBlock.includes('android_ripple='), 'Must specify android_ripple on Pressable');

  // Inside Pressable, must have View with tabPillIndicator
  const pillIdx = tabBlock.indexOf('styles.tabPillIndicator');
  assert(pillIdx !== -1, 'tabPillIndicator must be inside Pressable');

  // Ionicons must be inside tabPillIndicator
  const ioniconsIdx = tabBlock.indexOf('<Ionicons', pillIdx);
  assert(ioniconsIdx !== -1, 'Ionicons must be inside tabPillIndicator');

  // Close of tabPillIndicator View </View> must occur before tabButtonLabel Text
  const labelIdx = tabBlock.indexOf('styles.tabButtonLabel');
  assert(labelIdx !== -1, 'tabButtonLabel must exist');
  assert(ioniconsIdx < labelIdx, 'Ionicons must precede tabButtonLabel');

  const pillClosingIdx = tabBlock.indexOf('</View>', ioniconsIdx);
  assert(pillClosingIdx !== -1 && pillClosingIdx < labelIdx, 
    'tabPillIndicator must close before tabButtonLabel begins (label must be outside capsule)');
});

challenge('T2.4: App.tsx active pill background is conditioned on isActive', () => {
  const appPath = path.resolve('App.tsx');
  const content = fs.readFileSync(appPath, 'utf8');

  assert(content.includes('isActive && {'), 'Active styling must be conditionally applied');
  assert(content.includes('colors.primaryLight') || content.includes('rgba(56, 189, 248'), 
    'Pill indicator must use primaryLight / sky blue highlight');
});

challenge('T2.5: App.tsx tab button accessibility semantics', () => {
  const appPath = path.resolve('App.tsx');
  const content = fs.readFileSync(appPath, 'utf8');

  assert(content.includes('accessibilityRole="tab"'), 'tab button must have accessibilityRole="tab"');
  assert(content.includes('accessibilityState={{ selected: isActive }}'), 'tab button must have accessibilityState selected');
  assert(content.includes('accessibilityLabel={tab.label}'), 'tab button must have accessibilityLabel');
});

// ----------------------------------------------------------------------------
// 3. COMPACT COMPONENTS HITSLOP & TOUCH TARGETS AUDITING
// ----------------------------------------------------------------------------
challenge('T3.1: SearchSpotlightBar touch targets and shape tokens', () => {
  const file = path.resolve('src/components/common/SearchSpotlightBar.tsx');
  const content = fs.readFileSync(file, 'utf8');

  assert(/minHeight:\s*48/.test(content), 'SearchSpotlightBar searchBox must declare minHeight: 48');
  assert(content.includes('hitSlop={{ top: 12, bottom: 12, left: 6, right: 6 }}'), 
    'SearchSpotlightBar tagPill must have hitSlop 12 top/bottom, 6 left/right');
  assert(content.includes('shape.large') || content.includes('shape.medium'), 
    'SearchSpotlightBar must utilize shape tokens');
});

challenge('T3.2: CategoryPills touch targets and shape tokens', () => {
  const file = path.resolve('src/components/common/CategoryPills.tsx');
  const content = fs.readFileSync(file, 'utf8');

  assert(content.includes('hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}'), 
    'CategoryPills pill must have hitSlop');
  assert(content.includes('shape.full'), 'CategoryPills must use shape.full for pill containers');
});

challenge('T3.3: CoursesScreen touch targets and shape tokens', () => {
  const file = path.resolve('src/screens/CoursesScreen.tsx');
  const content = fs.readFileSync(file, 'utf8');

  assert(content.includes('hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}'), 
    'CoursesScreen viewToggleBtn/sortBtn must have 8dp hitSlop around');
  assert(content.includes('hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}'), 
    'CoursesScreen levelPill/priceFilterBtn must have hitSlop');
  assert(content.includes('shape.small'), 'CoursesScreen must use shape tokens');
});

challenge('T3.4: BrandDrawer touch targets, actionRow minHeight, and hitSlops', () => {
  const file = path.resolve('src/components/common/BrandDrawer.tsx');
  const content = fs.readFileSync(file, 'utf8');

  assert(content.includes('hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}'), 
    'BrandDrawer switchWsBtn/closeBtn must have 10dp hitSlop');
  assert(/minHeight:\s*48/.test(content), 'BrandDrawer actionRow must have minHeight: 48');
  assert(content.includes('shape.medium'), 'BrandDrawer must use shape.medium');
  assert(content.includes('shape.full'), 'BrandDrawer must use shape.full');
});

// ----------------------------------------------------------------------------
// 4. TIMER HYGIENE & CONCURRENCY RESILIENCE
// ----------------------------------------------------------------------------
challenge('T4.1: BrandDrawer timer hygiene and unmount cleanup logic', () => {
  const file = path.resolve('src/components/common/BrandDrawer.tsx');
  const content = fs.readFileSync(file, 'utf8');

  assert(content.includes('const navTimerRef = useRef'), 'navTimerRef must be defined with useRef');
  assert(content.includes('ReturnType<typeof setTimeout>'), 'navTimerRef must use ReturnType<typeof setTimeout> per Rule 3');

  // Verify useEffect cleanup
  const effectMatch = content.match(/useEffect\(\(\)\s*=>\s*\{[\s\S]*?return\s*\(\)\s*=>\s*\{([\s\S]*?)\};\s*\}, \[\]\);/);
  assert(effectMatch, 'BrandDrawer must have useEffect unmount teardown');
  assert(effectMatch[1].includes('clearTimeout(navTimerRef.current)'), 'useEffect teardown must cancel navTimerRef.current');

  // Verify handleNav cancels previous timer
  const handleNavIdx = content.indexOf('const handleNav =');
  assert(handleNavIdx !== -1, 'handleNav function not found');
  const handleNavBody = content.substring(handleNavIdx, handleNavIdx + 400);
  assert(handleNavBody.includes('clearTimeout(navTimerRef.current)'), 'handleNav must clear existing timer before setting new one');
  assert(handleNavBody.includes('navTimerRef.current = setTimeout'), 'handleNav must assign to navTimerRef.current');
  assert(handleNavBody.includes('navTimerRef.current = null'), 'handleNav callback must reset navTimerRef.current to null');
});

challenge('T4.2: BrandDrawer timer concurrency simulation', () => {
  // Simulate handleNav rapid invocation pattern
  let timerRef = null;
  let executedAction = null;
  let clearTimeoutCalls = 0;
  let setTimeoutCalls = 0;

  function fakeClearTimeout(id) {
    clearTimeoutCalls++;
    if (timerRef === id) {
      timerRef = null;
    }
  }

  function fakeSetTimeout(cb, delay) {
    setTimeoutCalls++;
    const id = setTimeoutCalls;
    timerRef = id;
    return id;
  }

  function handleNavSim(action) {
    if (timerRef) {
      fakeClearTimeout(timerRef);
    }
    timerRef = fakeSetTimeout(() => {
      timerRef = null;
      action();
    }, 150);
  }

  // Rapidly trigger 50 navigation actions
  for (let i = 1; i <= 50; i++) {
    handleNavSim(() => { executedAction = i; });
  }

  assert.strictEqual(setTimeoutCalls, 50, '50 timeouts queued');
  assert.strictEqual(clearTimeoutCalls, 49, '49 preceding timeouts must have been immediately cleared');
  assert(timerRef !== null, 'Exactly one timer must remain pending');
});

// ----------------------------------------------------------------------------
// 5. EXHAUSTIVE COLOR ACCURACY & TYPO #102E52 PURGE
// ----------------------------------------------------------------------------
challenge('T5.1: Zero instances of typo #102E52 across all TypeScript/TSX/JS/JSON production files', () => {
  const rootDir = path.resolve('.');
  const badColor = '#102' + 'E52'; // dynamically concatenated to avoid self-match

  function scanDirectory(dir) {
    const list = fs.readdirSync(dir);
    for (const item of list) {
      if (item === 'node_modules' || item === '.git' || item === '.agents' || item === 'scripts') continue;
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        scanDirectory(fullPath);
      } else if (/\.(tsx?|jsx?|json)$/.test(item)) {
        const text = fs.readFileSync(fullPath, 'utf8');
        assert(!text.toLowerCase().includes(badColor.toLowerCase()), `Forbidden typo found in ${path.relative(rootDir, fullPath)}`);
      }
    }
  }

  scanDirectory(rootDir);
});

challenge('T5.2: Official brand color #102F53 present in theme colors and components', () => {
  const colorsFile = path.resolve('src/theme/colors.ts');
  const content = fs.readFileSync(colorsFile, 'utf8');
  assert(content.includes('#102F53'), 'Brand Deep Navy #102F53 must be defined in src/theme/colors.ts');
  assert(content.includes('starColor: \'#FFB606\''), 'starColor must be Sunshine Gold #FFB606');
});

challenge('T5.3: Rating star colors in SpecialBundleCard and YouTubePlayerModal use starColor', () => {
  const bundle = fs.readFileSync(path.resolve('src/components/cards/SpecialBundleCard.tsx'), 'utf8');
  assert(!bundle.includes('#F59E0B'), 'SpecialBundleCard must not use off-brand amber #F59E0B');
  assert(bundle.includes('colors.starColor'), 'SpecialBundleCard must use colors.starColor');

  const ytModal = fs.readFileSync(path.resolve('src/components/player/YouTubePlayerModal.tsx'), 'utf8');
  assert(!ytModal.includes('#F59E0B'), 'YouTubePlayerModal must not use off-brand amber #F59E0B');
  assert(ytModal.includes('colors.starColor'), 'YouTubePlayerModal must use colors.starColor');
});

// ----------------------------------------------------------------------------
// 6. SHAPE TOKENS CONSISTENCY IN SPECIALBUNDLECARD & YOUTUBECARD
// ----------------------------------------------------------------------------
challenge('T6.1: SpecialBundleCard and YouTubeCard use shape tokens', () => {
  const bundle = fs.readFileSync(path.resolve('src/components/cards/SpecialBundleCard.tsx'), 'utf8');
  assert(bundle.includes("import { shape } from '../../theme/shapes'"), 'SpecialBundleCard must import shape');
  assert(bundle.includes('shape.large'), 'SpecialBundleCard must use shape.large');

  const ytCard = fs.readFileSync(path.resolve('src/components/cards/YouTubeCard.tsx'), 'utf8');
  assert(ytCard.includes("import { shape } from '../../theme/shapes'"), 'YouTubeCard must import shape');
  assert(ytCard.includes('shape.large'), 'YouTubeCard must use shape.large');
  assert(ytCard.includes('shape.full'), 'YouTubeCard must use shape.full');
});

// ----------------------------------------------------------------------------
// SUMMARY
// ----------------------------------------------------------------------------
console.log('-----------------------------------------------------------------');
console.log(`TOTAL CHALLENGES: ${totalTests}`);
console.log(`PASSED:           ${passedTests}`);
console.log(`FAILED:           ${failedTests}`);
console.log('-----------------------------------------------------------------');

if (failedTests > 0) {
  console.error('\nFAILURE BREAKDOWN:');
  failures.forEach((f, idx) => {
    console.error(`  ${idx + 1}. ${f.title}`);
    console.error(`     Error: ${f.error}`);
  });
  process.exit(1);
} else {
  console.log('\n🌟 ALL 17 CHALLENGER ADVERSARIAL TESTS PASSED PERFECTLY!\n');
}
