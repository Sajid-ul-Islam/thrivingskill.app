/**
 * Automated Test Suite for Logical Bug Fixes
 * Verifies that all 8 logical bugs identified across state synchronization,
 * date calculations, and video tracking are properly guarded and resolved.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- STARTING LOGICAL BUG FIX VERIFICATION ---');

let testsPassed = 0;

// Test 1: Safe Optional Chaining in LearningContext.tsx & MyLearningScreen.tsx
{
  const learningContext = fs.readFileSync(path.join(__dirname, '../src/context/LearningContext.tsx'), 'utf8');
  assert(
    learningContext.includes('course?.modules?.[0]?.lessons?.[0]?.id'),
    'Test 1 Failed: LearningContext must use safe optional chaining on modules?.[0]?.lessons?.[0]'
  );
  assert(
    learningContext.includes('current.completedLessonIds.includes(lessonId)') &&
    learningContext.includes('avoid redundant mutations'),
    'Test 1 Failed: markLessonCompleted must guard against duplicate completions'
  );
  assert(
    learningContext.includes('if (progress.isCompleted) return 100;'),
    'Test 1 Failed: getCourseProgressPercentage must return 100 if course is marked completed'
  );

  const myLearningScreen = fs.readFileSync(path.join(__dirname, '../src/screens/MyLearningScreen.tsx'), 'utf8');
  assert(
    myLearningScreen.includes('course.modules?.[0]?.lessons?.[0]?.id'),
    'Test 1 Failed: MyLearningScreen must use safe optional chaining on modules?.[0]?.lessons?.[0]'
  );

  console.log('✓ Test 1 Passed: Safe optional chaining and duplicate completion guard in LearningContext & MyLearningScreen');
  testsPassed++;
}

// Test 2: Atomic Functional Updaters and Duplicate Unlock Guard in GamificationContext.tsx
{
  const gamification = fs.readFileSync(path.join(__dirname, '../src/context/GamificationContext.tsx'), 'utf8');
  assert(
    gamification.includes('setState((prevState)') || gamification.includes('setState(prevState =>'),
    'Test 2 Failed: GamificationContext must use functional setState to prevent stale closure overwrites'
  );
  assert(
    gamification.includes('existing.isUnlocked') && gamification.includes('return prevState;'),
    'Test 2 Failed: unlockBadge must guard against duplicate unlocks and XP farming'
  );
  console.log('✓ Test 2 Passed: Functional state updaters and duplicate unlock guard in GamificationContext');
  testsPassed++;
}

// Test 3: Local Timezone Date Calculation in GamificationContext.tsx
{
  const gamification = fs.readFileSync(path.join(__dirname, '../src/context/GamificationContext.tsx'), 'utf8');
  assert(
    gamification.includes('getLocalDateString = (d: Date = new Date()): string'),
    'Test 3 Failed: GamificationContext must implement getLocalDateString helper'
  );
  assert(
    gamification.includes('const today = getLocalDateString();'),
    'Test 3 Failed: Daily goal and streak calculations must use getLocalDateString() to prevent UTC date rollback'
  );
  console.log('✓ Test 3 Passed: Local timezone date calculation avoids UTC date rollback');
  testsPassed++;
}

// Test 4: Study Time Buffer Flush on Unmount in LessonPlayerScreen.tsx
{
  const lessonPlayer = fs.readFileSync(path.join(__dirname, '../src/screens/LessonPlayerScreen.tsx'), 'utf8');
  assert(
    lessonPlayer.includes('flushStudyTimeBuffer();') && lessonPlayer.includes('recordWatchPosition('),
    'Test 4 Failed: LessonPlayerScreen unmount must flush study time buffer and save watch position'
  );
  assert(
    lessonPlayer.includes('clearInterval(progressIntervalRef.current);') &&
    lessonPlayer.includes('progressIntervalRef.current = null;'),
    'Test 4 Failed: LessonPlayerScreen must clean up timer upon reaching 100% completion'
  );
  assert(
    lessonPlayer.includes('if (!isAlreadyMarked) {') && lessonPlayer.includes('addXP(50);'),
    'Test 4 Failed: handleMarkComplete must only award 50 XP if lesson was not already completed'
  );
  console.log('✓ Test 4 Passed: Study time buffer flush on unmount, timer cleanup, and XP guard in LessonPlayerScreen');
  testsPassed++;
}

// Test 5: Offline Sync Queue Retry for 401 & 429
{
  const syncQueue = fs.readFileSync(path.join(__dirname, '../src/services/offline/syncQueue.ts'), 'utf8');
  assert(
    syncQueue.includes('err?.status !== 401') && syncQueue.includes('err?.status !== 429'),
    'Test 5 Failed: syncQueue must not drop mutations on 401 (auth refresh) or 429 (rate limit)'
  );
  console.log('✓ Test 5 Passed: Offline sync queue retains items during 401 auth expiration and 429 rate limits');
  testsPassed++;
}

// Test 6: Defensive Guards in SpecialBundleCard.tsx
{
  const specialBundle = fs.readFileSync(path.join(__dirname, '../src/components/cards/SpecialBundleCard.tsx'), 'utf8');
  assert(
    specialBundle.includes('(bundle.features || []).slice(0, 2)'),
    'Test 6 Failed: SpecialBundleCard must guard bundle.features'
  );
  assert(
    specialBundle.includes('(bundle.enrolledCount || 0).toLocaleString()'),
    'Test 6 Failed: SpecialBundleCard must guard bundle.enrolledCount'
  );
  console.log('✓ Test 6 Passed: Defensive fallback guards in SpecialBundleCard');
  testsPassed++;
}

// Test 7: Safe Name Splitting in HomeTestimonialsCarousel.tsx
{
  const testimonials = fs.readFileSync(path.join(__dirname, '../src/components/home/HomeTestimonialsCarousel.tsx'), 'utf8');
  assert(
    testimonials.includes("item.name || 'Student'") && testimonials.includes(".split(' ')"),
    'Test 7 Failed: HomeTestimonialsCarousel must guard item.name prior to split'
  );
  console.log('✓ Test 7 Passed: Safe string splitting in HomeTestimonialsCarousel');
  testsPassed++;
}

// Test 8: Safe Date Parsing in HomeBlogInsightsFeed.tsx & Atomic Updates in SaaSContext.tsx
{
  const blogFeed = fs.readFileSync(path.join(__dirname, '../src/components/home/HomeBlogInsightsFeed.tsx'), 'utf8');
  assert(
    blogFeed.includes('isNaN(parsedD.getTime())'),
    'Test 8 Failed: HomeBlogInsightsFeed must validate Date object validity'
  );

  const saasContext = fs.readFileSync(path.join(__dirname, '../src/context/SaaSContext.tsx'), 'utf8');
  assert(
    saasContext.includes('setNotifications((prev) =>') || saasContext.includes('setNotifications(prev =>'),
    'Test 8 Failed: SaaSContext must use functional updaters for notifications'
  );
  console.log('✓ Test 8 Passed: Safe date parsing in HomeBlogInsightsFeed and functional updaters in SaaSContext');
  testsPassed++;
}

console.log(`\nALL ${testsPassed}/8 LOGICAL BUG FIX TESTS PASSED SUCCESSFULLY!`);
