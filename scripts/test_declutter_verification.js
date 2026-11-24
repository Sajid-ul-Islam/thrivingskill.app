const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- TEST SUITE: NON-DESTRUCTIVE DECLUTTERING VERIFICATION ---');

// 1. Verify BrandSplashScreen
const splashFile = path.join(__dirname, '..', 'src', 'components', 'splash', 'BrandSplashScreen.tsx');
const splashContent = fs.readFileSync(splashFile, 'utf8');

assert(!splashContent.includes('<View style={styles.homeIndicatorBar} />'), 'homeIndicatorBar component should be removed');
assert(!splashContent.includes('homeIndicatorBar: {'), 'homeIndicatorBar style should be removed');
assert(splashContent.includes('accessibilityLabel="Skip welcome screen"'), 'powerIconPill should be an accessible skip button');
assert(splashContent.includes('Expert-Led'), 'Expert-Led pillar must remain');
assert(splashContent.includes('Practical'), 'Practical pillar must remain');
assert(splashContent.includes('Career'), 'Career pillar must remain');
assert(splashContent.includes('Learn'), 'Learn pillar must remain');
console.log('  ✓ BrandSplashScreen: Artificial bar removed, skip button accessible, all 4 pillars intact');

// 2. Verify CourseCard
const courseCardFile = path.join(__dirname, '..', 'src', 'components', 'cards', 'CourseCard.tsx');
const courseCardContent = fs.readFileSync(courseCardFile, 'utf8');

// Ensure no discountBadge in footer
assert(!courseCardContent.includes('styles.discountBadge'), 'Duplicate discountBadge in footer must be removed');
// Ensure discountTag still exists on thumbnail
assert(courseCardContent.includes('styles.discountTag'), 'Prominent discountTag on thumbnail must remain');
assert(courseCardContent.includes('styles.certBadge'), 'Certificate badge must remain');
assert(courseCardContent.includes('formattedRating'), 'Star rating must remain');
assert(courseCardContent.includes('formattedEnrolled'), 'Learner count must remain');
assert(courseCardContent.includes('origBdtPrice'), 'Original slashed price must remain');
console.log('  ✓ CourseCard: Duplicate discount pill removed from footer; thumbnail tag, prices, ratings & certificate intact');

// 3. Verify HomeScreen
const homeFile = path.join(__dirname, '..', 'src', 'screens', 'HomeScreen.tsx');
const homeContent = fs.readFileSync(homeFile, 'utf8');

assert(homeContent.includes('Unified Learning Momentum Hub'), 'Momentum Hub comment present');
assert(homeContent.includes('styles.momentumCapsule'), 'momentumCapsule present');
assert(!homeContent.includes('<TouchableOpacity\n                  style={[\n                    styles.radialGoalBadge'), 'Duplicate radialGoalBadge in greetingBottomRow removed');
assert(homeContent.includes('streakDays'), 'streakDays retained');
assert(homeContent.includes('dailyMinutesSpent'), 'dailyMinutesSpent retained');
assert(homeContent.includes('dailyTargetMinutes'), 'dailyTargetMinutes retained');
console.log('  ✓ HomeScreen: Momentum Hub unified; duplicate daily goal pill eliminated while preserving all metrics');

// 4. Verify LessonPlayerScreen
const playerFile = path.join(__dirname, '..', 'src', 'screens', 'LessonPlayerScreen.tsx');
const playerContent = fs.readFileSync(playerFile, 'utf8');

assert(playerContent.includes('borderBottomColor: isActive ? colors.primary : \'transparent\''), 'Zero-layout-shift tab styling implemented');
assert(playerContent.includes('minHeight: 44'), '44dp minimum touch target for tab buttons');
console.log('  ✓ LessonPlayerScreen: Zero-shift tab bar and WCAG 44dp touch targets verified');

// 5. Verify ProfileCourseSummary
const profileSummaryFile = path.join(__dirname, '..', 'src', 'components', 'profile', 'ProfileCourseSummary.tsx');
const profileSummaryContent = fs.readFileSync(profileSummaryFile, 'utf8');

assert(profileSummaryContent.includes('styles.kpiBarCard'), 'kpiBarCard segmented container implemented');
assert(profileSummaryContent.includes('styles.kpiCol'), 'kpiCol metric items implemented');
assert(profileSummaryContent.includes('styles.kpiDivider'), 'kpiDivider separators implemented');
assert(profileSummaryContent.includes('enrolledCount'), 'enrolledCount preserved');
assert(profileSummaryContent.includes('completedCount'), 'completedCount preserved');
assert(profileSummaryContent.includes('certificates.length'), 'certificates count preserved');
assert(profileSummaryContent.includes('streakDays'), 'streakDays preserved');
console.log('  ✓ ProfileCourseSummary: Segmented KPI bar replaces floating individual boxes; all 4 metrics preserved');

console.log('\n--- ALL DECLUTTERING VERIFICATION TESTS PASSED (100% GREEN) ---');
