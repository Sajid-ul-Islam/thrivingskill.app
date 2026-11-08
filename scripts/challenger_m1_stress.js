/**
 * ============================================================================
 * CHALLENGER MILESTONE 1 ADVERSARIAL STRESS TEST & VERIFICATION HARNESS
 * ============================================================================
 * Adversarially challenges:
 * 1. App.tsx M3 Bottom Nav Pill Capsule (dark & light mode, capsule geometry,
 *    active/inactive state, badge placement, label typography, WCAG contrast)
 * 2. Android tactile ripple configuration (borderless, radius, theme-aware color)
 * 3. BrandDrawer timer hygiene and unmount teardown simulation
 * 4. 48dp touch target compliance and hitSlop expansion
 * 5. M3 shape tokens integrity and import validation across components
 * 6. Brand color cleansing (#102E52 elimination and #FFB606 star rating)
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('🔥 CHALLENGER M1 ADVERSARIAL STRESS TEST HARNESS');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function challenge(name, testFn) {
  totalTests++;
  try {
    testFn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    failedTests++;
    failures.push({ name, error: err.message });
  }
}

// ----------------------------------------------------------------------------
// SUITE 1: Bottom Navigation M3 Pill Capsule & Theme Color Behavior
// ----------------------------------------------------------------------------
console.log('--- SUITE 1: Bottom Navigation M3 Pill Capsule & Theme Behavior ---');

challenge('App.tsx defines M3 Pill Capsule around active icon only (not label)', () => {
  const appCode = fs.readFileSync(path.resolve('App.tsx'), 'utf8');

  // Verify tabPillIndicator wrapper in JSX: style={[styles.tabPillIndicator, ...]}
  const pillMatch = appCode.match(/<View\s+style=\{\[\s*styles\.tabPillIndicator[\s\S]*?<\/View>/);
  assert(pillMatch, 'styles.tabPillIndicator wrapper not found in App.tsx');

  const pillContent = pillMatch[0];
  assert(pillContent.includes('<Ionicons'), 'Ionicons must be inside tabPillIndicator');
  assert(!pillContent.includes('styles.tabButtonLabel'), 'tabButtonLabel must NOT be inside tabPillIndicator (label belongs outside capsule in M3)');

  // Verify label is sibling under Pressable
  assert(appCode.includes('styles.tabButtonLabel'), 'tabButtonLabel must be rendered under Pressable');
});

challenge('Pill Capsule dimensions and shape match M3 specifications (60x32, shape.full)', () => {
  const appCode = fs.readFileSync(path.resolve('App.tsx'), 'utf8');

  // Check tabPillIndicator stylesheet
  const styleMatch = appCode.match(/tabPillIndicator:\s*\{([^}]+)\}/);
  assert(styleMatch, 'tabPillIndicator style definition not found');
  const styleBody = styleMatch[1];

  assert(/width:\s*60/.test(styleBody), 'tabPillIndicator must have width: 60');
  assert(/height:\s*32/.test(styleBody), 'tabPillIndicator must have height: 32');
  assert(/borderRadius:\s*shape\.full/.test(styleBody), 'tabPillIndicator must use shape.full');
  assert(/alignItems:\s*'center'/.test(styleBody), 'tabPillIndicator must align items center');
  assert(/justifyContent:\s*'center'/.test(styleBody), 'tabPillIndicator must justify content center');
});

challenge('Light mode and dark mode capsule background colors behave correctly', () => {
  const appCode = fs.readFileSync(path.resolve('App.tsx'), 'utf8');
  const colorsCode = fs.readFileSync(path.resolve('src/theme/colors.ts'), 'utf8');

  // Check light mode color extraction
  assert(colorsCode.includes("primaryLight: '#E8EEF5'"), 'lightColors.primaryLight must be #E8EEF5');
  assert(colorsCode.includes("primary: '#102F53'"), 'lightColors.primary must be #102F53');

  // Check dark mode colors
  assert(colorsCode.includes("primary: '#38BDF8'"), 'darkColors.primary must be #38BDF8');

  // Check App.tsx active background logic
  const normalizedApp = appCode.replace(/\s+/g, ' ');
  assert(
    normalizedApp.includes("backgroundColor: isDark ? 'rgba(56, 189, 248, 0.16)' : colors.primaryLight"),
    'App.tsx must conditionally apply rgba(56, 189, 248, 0.16) in dark mode and colors.primaryLight in light mode'
  );

  // Inactive tab pill background is transparent
  assert(appCode.includes("backgroundColor: 'transparent'"), 'Inactive tabPillIndicator must default to transparent');
});

challenge('Active vs Inactive Tab label styling and icon color differentiation', () => {
  const appCode = fs.readFileSync(path.resolve('App.tsx'), 'utf8');

  // Active icon color: colors.primary; inactive: colors.tabInactive
  assert(appCode.includes('color={isActive ? colors.primary : colors.tabInactive}'), 'Icon color must toggle between colors.primary and colors.tabInactive');

  // Active label: colors.primary & fontWeight '700'; inactive: colors.tabInactive & fontWeight '500'
  assert(appCode.includes("color: isActive ? colors.primary : colors.tabInactive"), 'Label color must toggle between primary and tabInactive');
  assert(appCode.includes("fontWeight: isActive ? '700' : '500'"), "Label fontWeight must toggle between '700' and '500'");
});

// ----------------------------------------------------------------------------
// SUITE 2: Tactile Ripple Configuration on Android
// ----------------------------------------------------------------------------
console.log('\n--- SUITE 2: Android Tactile Ripple Configuration ---');

challenge('Pressable uses theme-aware android_ripple with borderless: true and radius: 32', () => {
  const appCode = fs.readFileSync(path.resolve('App.tsx'), 'utf8');

  const rippleMatch = appCode.match(/android_ripple=\{([^}]+)\}/);
  assert(rippleMatch, 'android_ripple configuration missing in App.tsx');
  const rippleBody = rippleMatch[1];

  // Borderless setting
  assert(/borderless:\s*true/.test(rippleBody), 'android_ripple must have borderless: true');

  // Radius setting
  assert(/radius:\s*32/.test(rippleBody), 'android_ripple must have radius: 32');

  // Dynamic color
  assert(/color:\s*isDark\s*\?\s*'rgba\(56,\s*189,\s*248,\s*0\.12\)'\s*:\s*'rgba\(16,\s*47,\s*83,\s*0\.08\)'/.test(rippleBody),
    'android_ripple color must dynamically switch between dark sky cyan and light brand navy');
});

challenge('Pressable declares complete accessibility roles and state for bottom tabs', () => {
  const appCode = fs.readFileSync(path.resolve('App.tsx'), 'utf8');

  assert(appCode.includes('accessibilityRole="tab"'), 'Pressable must have accessibilityRole="tab"');
  assert(appCode.includes('accessibilityState={{ selected: isActive }}'), 'Pressable must declare accessibilityState={{ selected: isActive }}');
  assert(appCode.includes('accessibilityLabel={tab.label}'), 'Pressable must declare accessibilityLabel={tab.label}');
});

// ----------------------------------------------------------------------------
// SUITE 3: Timer Hygiene & Teardown in BrandDrawer.tsx
// ----------------------------------------------------------------------------
console.log('\n--- SUITE 3: BrandDrawer Timer Hygiene & Teardown Simulation ---');

challenge('BrandDrawer.tsx uses useRef<ReturnType<typeof setTimeout> | null>(null)', () => {
  const drawerCode = fs.readFileSync(path.resolve('src/components/common/BrandDrawer.tsx'), 'utf8');

  assert(
    drawerCode.includes('const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);'),
    'BrandDrawer must declare navTimerRef using ReturnType<typeof setTimeout>'
  );
  assert(!drawerCode.includes('NodeJS.Timeout'), 'BrandDrawer must NOT use NodeJS.Timeout (violates Rule 3)');
});

challenge('BrandDrawer.tsx cancels navTimerRef on component unmount', () => {
  const drawerCode = fs.readFileSync(path.resolve('src/components/common/BrandDrawer.tsx'), 'utf8');

  // Check useEffect teardown
  const useEffectMatch = drawerCode.match(/useEffect\(\(\)\s*=>\s*\{[\s\S]*?return\s*\(\)\s*=>\s*\{([\s\S]*?)\};\s*\}, \[\]\);/);
  assert(useEffectMatch, 'useEffect unmount hook missing in BrandDrawer.tsx');

  const teardownBody = useEffectMatch[1];
  assert(teardownBody.includes('if (navTimerRef.current)'), 'Teardown must check if navTimerRef.current is truthy');
  assert(teardownBody.includes('clearTimeout(navTimerRef.current)'), 'Teardown must call clearTimeout(navTimerRef.current)');
});

challenge('BrandDrawer.tsx clears pending timer on rapid consecutive handleNav calls', () => {
  const drawerCode = fs.readFileSync(path.resolve('src/components/common/BrandDrawer.tsx'), 'utf8');

  const handleNavMatch = drawerCode.match(/const handleNav = \([\s\S]*?150\);\s*\};/);
  assert(handleNavMatch, 'handleNav implementation not found');

  const handleNavBody = handleNavMatch[0];
  assert(handleNavBody.includes('if (navTimerRef.current)'), 'handleNav must check if a timer already exists');
  assert(handleNavBody.includes('clearTimeout(navTimerRef.current)'), 'handleNav must clear pending timer before starting new one');
  assert(handleNavBody.includes('navTimerRef.current = null;'), 'handleNav must set navTimerRef.current = null when timer fires');
});

challenge('BrandDrawer lifecycle simulation: rapid calls and unmount teardown', () => {
  return new Promise((resolve, reject) => {
    // Simulate BrandDrawer component state
    let navTimerRef = { current: null };
    let callback1Called = false;
    let callback2Called = false;

    const teardown = () => {
      if (navTimerRef.current) {
        clearTimeout(navTimerRef.current);
        navTimerRef.current = null;
      }
    };

    const handleNav = (action) => {
      if (navTimerRef.current) {
        clearTimeout(navTimerRef.current);
      }
      navTimerRef.current = setTimeout(() => {
        navTimerRef.current = null;
        action();
      }, 150);
    };

    // Step 1: Trigger first navigation
    handleNav(() => { callback1Called = true; });
    assert(navTimerRef.current !== null, 'navTimerRef must hold active timer after call 1');

    // Step 2: Trigger rapid second navigation before 150ms
    handleNav(() => { callback2Called = true; });
    assert(navTimerRef.current !== null, 'navTimerRef must hold active timer after call 2');

    // Step 3: Simulate component unmount at t=30ms
    teardown();
    assert(navTimerRef.current === null, 'navTimerRef must be cleared on unmount');

    // Step 4: Advance beyond 150ms and assert NO callbacks fired
    setTimeout(() => {
      try {
        assert(!callback1Called, 'Callback 1 should have been canceled by second handleNav');
        assert(!callback2Called, 'Callback 2 should have been canceled by unmount teardown');
        resolve();
      } catch (e) {
        reject(e);
      }
    }, 200);
  });
});

// ----------------------------------------------------------------------------
// SUITE 4: Touch Target Dimensions (>= 48dp)
// ----------------------------------------------------------------------------
console.log('\n--- SUITE 4: 48dp Minimum Touch Target Compliance ---');

challenge('App.tsx tabButton enforces minHeight: 48', () => {
  const appCode = fs.readFileSync(path.resolve('App.tsx'), 'utf8');
  const match = appCode.match(/tabButton:\s*\{([^}]+)\}/);
  assert(match, 'tabButton style definition not found');
  assert(/minHeight:\s*48/.test(match[1]), 'tabButton must declare minHeight: 48');
});

challenge('SearchSpotlightBar.tsx searchBox enforces minHeight: 48', () => {
  const code = fs.readFileSync(path.resolve('src/components/common/SearchSpotlightBar.tsx'), 'utf8');
  const match = code.match(/searchBox:\s*\{([^}]+)\}/);
  assert(match, 'searchBox style definition not found');
  assert(/minHeight:\s*48/.test(match[1]), 'searchBox must declare minHeight: 48');
});

challenge('SearchSpotlightBar.tsx tagPill touchable has hitSlop expanding to >= 48dp', () => {
  const code = fs.readFileSync(path.resolve('src/components/common/SearchSpotlightBar.tsx'), 'utf8');
  assert(
    code.includes('hitSlop={{ top: 12, bottom: 12, left: 6, right: 6 }}'),
    'tagPill must have hitSlop expanding touch target'
  );
});

challenge('CategoryPills.tsx pill touchable has hitSlop expanding to >= 48dp', () => {
  const code = fs.readFileSync(path.resolve('src/components/common/CategoryPills.tsx'), 'utf8');
  assert(
    code.includes('hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}'),
    'Category pill must have hitSlop expanding touch target'
  );
});

challenge('CoursesScreen.tsx controls have hitSlop expanding to >= 48dp', () => {
  const code = fs.readFileSync(path.resolve('src/screens/CoursesScreen.tsx'), 'utf8');
  assert(code.includes('hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}'), 'viewToggleBtn / sortBtn must have hitSlop');
  assert(code.includes('hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}'), 'levelPill / priceFilterBtn must have hitSlop');
});

challenge('BrandDrawer.tsx actionRow has minHeight: 48 and switchWsBtn has hitSlop', () => {
  const code = fs.readFileSync(path.resolve('src/components/common/BrandDrawer.tsx'), 'utf8');
  const actionRowMatch = code.match(/actionRow:\s*\{([^}]+)\}/);
  assert(actionRowMatch, 'actionRow style not found');
  assert(/minHeight:\s*48/.test(actionRowMatch[1]), 'actionRow must declare minHeight: 48');
  assert(code.includes('hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}'), 'switchWsBtn must have hitSlop');
});

// ----------------------------------------------------------------------------
// SUITE 5: Unified M3 Shape Tokens Integrity
// ----------------------------------------------------------------------------
console.log('\n--- SUITE 5: Unified M3 Shape Tokens Integrity ---');

challenge('src/theme/shapes.ts exports complete M3 shape scale with as const', () => {
  const shapesCode = fs.readFileSync(path.resolve('src/theme/shapes.ts'), 'utf8');
  assert(shapesCode.includes('none: 0'), 'none: 0 missing');
  assert(shapesCode.includes('extraSmall: 4'), 'extraSmall: 4 missing');
  assert(shapesCode.includes('small: 8'), 'small: 8 missing');
  assert(shapesCode.includes('medium: 12'), 'medium: 12 missing');
  assert(shapesCode.includes('large: 16'), 'large: 16 missing');
  assert(shapesCode.includes('largeIncreased: 20'), 'largeIncreased: 20 missing');
  assert(shapesCode.includes('extraLarge: 28'), 'extraLarge: 28 missing');
  assert(shapesCode.includes('full: 9999'), 'full: 9999 missing');
  assert(shapesCode.includes('as const'), 'shape object must be declared as const');
  assert(shapesCode.includes('export type ShapeTokens'), 'ShapeTokens type missing');
  assert(shapesCode.includes('export type ShapeKey'), 'ShapeKey type missing');
});

challenge('All shape token usages across modified components reference valid keys', () => {
  const validKeys = new Set(['none', 'extraSmall', 'small', 'medium', 'large', 'largeIncreased', 'extraLarge', 'full']);

  const filesToCheck = [
    'App.tsx',
    'src/components/common/BrandDrawer.tsx',
    'src/components/common/CategoryPills.tsx',
    'src/components/common/SearchSpotlightBar.tsx',
    'src/screens/CoursesScreen.tsx',
    'src/screens/YouTubeVideosScreen.tsx',
    'src/components/cards/YouTubeCard.tsx',
    'src/components/cards/SpecialBundleCard.tsx',
    'src/components/player/YouTubePlayerModal.tsx',
  ];

  for (const rel of filesToCheck) {
    const fullPath = path.resolve(rel);
    const content = fs.readFileSync(fullPath, 'utf8');
    const matches = content.matchAll(/shape\.([a-zA-Z0-9_]+)/g);
    for (const m of matches) {
      const token = m[1];
      assert(validKeys.has(token), `Invalid shape token "${token}" used in ${rel}`);
    }
  }
});

// ----------------------------------------------------------------------------
// SUITE 6: Brand Color Cleansing
// ----------------------------------------------------------------------------
console.log('\n--- SUITE 6: Brand Color Cleansing ---');

challenge('Zero occurrences of typo #102E52 in src/ and App.tsx', () => {
  function scan(dir) {
    const list = fs.readdirSync(dir);
    for (const item of list) {
      const full = path.join(dir, item);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        if (item !== 'node_modules' && !item.startsWith('.')) {
          scan(full);
        }
      } else if (item.endsWith('.ts') || item.endsWith('.tsx') || item.endsWith('.js')) {
        const text = fs.readFileSync(full, 'utf8');
        assert(!text.includes('#102E52'), `Found off-brand typo #102E52 in ${full}`);
      }
    }
  }

  scan(path.resolve('src'));
  const appText = fs.readFileSync(path.resolve('App.tsx'), 'utf8');
  assert(!appText.includes('#102E52'), 'Found off-brand typo #102E52 in App.tsx');
});

challenge('Star ratings use official brand gold starColor (#FFB606) in cards & modals', () => {
  const ytModal = fs.readFileSync(path.resolve('src/components/player/YouTubePlayerModal.tsx'), 'utf8');
  assert(ytModal.includes('colors.starColor'), 'YouTubePlayerModal must use colors.starColor');
  assert(!ytModal.includes('color="#F59E0B"'), 'YouTubePlayerModal must not use hardcoded #F59E0B for stars');

  const bundle = fs.readFileSync(path.resolve('src/components/cards/SpecialBundleCard.tsx'), 'utf8');
  assert(bundle.includes('colors.starColor'), 'SpecialBundleCard must use colors.starColor');
  assert(!bundle.includes('color="#F59E0B"'), 'SpecialBundleCard must not use hardcoded #F59E0B for stars');
});

// ----------------------------------------------------------------------------
// SUITE 7: Boundary & Stress Cases
// ----------------------------------------------------------------------------
console.log('\n--- SUITE 7: Boundary & Stress Cases ---');

challenge('App.tsx tab badges handle 0 count by hiding and > 0 count by displaying', () => {
  const appCode = fs.readFileSync(path.resolve('App.tsx'), 'utf8');
  assert(
    appCode.includes('tab.badgeCount && tab.badgeCount > 0 ?'),
    'App.tsx must strictly check tab.badgeCount > 0 before rendering badge'
  );
  assert(
    appCode.includes('styles.tabBadge'),
    'App.tsx must style tabBadge with shape.full'
  );
});

challenge('App.tsx tab label truncation: numberOfLines={1}', () => {
  const appCode = fs.readFileSync(path.resolve('App.tsx'), 'utf8');
  assert(
    appCode.includes('numberOfLines={1}'),
    'Tab button label must enforce numberOfLines={1} to prevent capsule overflow'
  );
});

challenge('Theme colors.ts contains all required brand tokens in both palettes', () => {
  const colorsCode = fs.readFileSync(path.resolve('src/theme/colors.ts'), 'utf8');
  // Both lightColors and darkColors must define brandNavy, brandRed, brandGold, primary, starColor
  const requiredTokens = ['brandNavy', 'brandRed', 'brandGold', 'primary', 'starColor', 'tabBarBg', 'tabBarBorder', 'tabActive', 'tabInactive'];
  for (const token of requiredTokens) {
    const occurrences = (colorsCode.match(new RegExp(`\\b${token}:`, 'g')) || []).length;
    assert(occurrences >= 2, `Token "${token}" must be defined in both lightColors and darkColors (found ${occurrences})`);
  }
});

// Wait for any async simulations
setTimeout(() => {
  console.log('\n================================================================');
  console.log(`TOTAL TESTS:  ${totalTests}`);
  console.log(`PASSED:       ${passedTests}`);
  console.log(`FAILED:       ${failedTests}`);
  console.log('================================================================');

  if (failedTests > 0) {
    console.error('\nFAILURES ENCOUNTERED:');
    failures.forEach(f => console.error(` - ${f.name}: ${f.error}`));
    process.exit(1);
  } else {
    console.log('\n🏆 ALL CHALLENGER TESTS PASSED SUCCESSFULLY!\n');
    process.exit(0);
  }
}, 300);
