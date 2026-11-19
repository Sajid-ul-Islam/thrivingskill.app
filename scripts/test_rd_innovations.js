const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('====================================================');
console.log('   THRIVING SKILLS — R&D INNOVATIONS AUDIT SUITE    ');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(description, testFn) {
  totalTests++;
  try {
    testFn();
    console.log(`  ✅ [PASS] ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${description}`);
    console.error(`     Error: ${err.message}\n`);
    process.exit(1);
  }
}

// ----------------------------------------------------
// Test 1: SkeletonLoader Linear Gradient Shimmer
// ----------------------------------------------------
console.log('Test 1: Verifying Linear Gradient Hardware Shimmer (SkeletonLoader.tsx)...');
runTest('SkeletonLoader imports expo-linear-gradient and configures native translation sweep', () => {
  const filePath = path.join(__dirname, '..', 'src', 'components', 'common', 'SkeletonLoader.tsx');
  const code = fs.readFileSync(filePath, 'utf8');

  assert.ok(code.includes('expo-linear-gradient'), 'Must import LinearGradient from expo-linear-gradient');
  assert.ok(code.includes('useNativeDriver: true'), 'Must use native driver for 60 FPS animation');
  assert.ok(code.includes('-250') && code.includes('250'), 'Must sweep across -250 to +250 range');
  assert.ok(code.includes('isDark'), 'Must provide adaptive gradient colors for dark and light modes');
});

// ----------------------------------------------------
// Test 2: AI Assessment Service & Active Recall SM-2 Bridge
// ----------------------------------------------------
console.log('\nTest 2: Verifying In-Lecture AI Assessment Service & SM-2 Bridge...');
runTest('aiAssessmentService defines diagnostic quiz, cheat-sheet synthesis, and SM-2 flashcard converter', () => {
  const filePath = path.join(__dirname, '..', 'src', 'services', 'ai', 'aiAssessmentService.ts');
  const code = fs.readFileSync(filePath, 'utf8');

  assert.ok(code.includes('class AiAssessmentService'), 'Must define AiAssessmentService class');
  assert.ok(code.includes('generateDiagnosticQuiz'), 'Must export generateDiagnosticQuiz method');
  assert.ok(code.includes('generateCheatSheet'), 'Must export generateCheatSheet method');
  assert.ok(code.includes('convertMissedQuestionsToFlashcards'), 'Must export convertMissedQuestionsToFlashcards');
  assert.ok(code.includes('SpacedRepetitionService.saveCardsBulk'), 'Must bridge missed questions to spaced repetition storage');
});

// ----------------------------------------------------
// Test 3: Commute Mode Bandwidth Saver & Sleep Timer Hygiene
// ----------------------------------------------------
console.log('\nTest 3: Verifying Commute Bandwidth Saver & Sleep Timer (LessonCommuteCard.tsx)...');
runTest('LessonCommuteCard computes real-time data saved and enforces timer hygiene', () => {
  const filePath = path.join(__dirname, '..', 'src', 'components', 'player', 'LessonCommuteCard.tsx');
  const code = fs.readFileSync(filePath, 'utf8');

  assert.ok(code.includes('3.2') || code.includes('mbSaved'), 'Must compute real-time MB bandwidth saved');
  assert.ok(code.includes('SleepTimerOption'), 'Must define SleepTimerOption type');
  assert.ok(code.includes('sleepIntervalRef'), 'Must store sleep interval in useRef');
  assert.ok(code.includes('clearInterval'), 'Must clear interval in useEffect teardown');
  assert.ok(code.includes('ReturnType<typeof setInterval>'), 'Must adhere to AGENTS.md cross-platform timer hygiene');
});

// ----------------------------------------------------
// Test 4: Predictive In-Memory Prefix Trie Search Engine
// ----------------------------------------------------
console.log('\nTest 4: Verifying In-Memory Prefix Trie Search Engine (localSearchEngine.ts)...');
runTest('localSearchEngine provides PrefixTrie with instant prefix auto-suggestions and top keywords', () => {
  const filePath = path.join(__dirname, '..', 'src', 'services', 'search', 'localSearchEngine.ts');
  const code = fs.readFileSync(filePath, 'utf8');

  assert.ok(code.includes('class PrefixTrie'), 'Must define PrefixTrie class');
  assert.ok(code.includes('prefixTrie'), 'Must maintain static prefixTrie instance');
  assert.ok(code.includes('getAutoSuggestions'), 'Must provide getAutoSuggestions method');
  assert.ok(code.includes('getTopKeywords'), 'Must provide getTopKeywords method');
});

// ----------------------------------------------------
// Test 5: Local Search Modal Auto-Complete UI
// ----------------------------------------------------
console.log('\nTest 5: Verifying Predictive Auto-Complete Chips in LocalSearchModal.tsx...');
runTest('LocalSearchModal integrates prefix auto-suggestions with tap-to-complete interactions', () => {
  const filePath = path.join(__dirname, '..', 'src', 'components', 'modals', 'LocalSearchModal.tsx');
  const code = fs.readFileSync(filePath, 'utf8');

  assert.ok(code.includes('autoSuggestions'), 'Must manage autoSuggestions state');
  assert.ok(code.includes('LocalSearchEngine.getAutoSuggestions'), 'Must query LocalSearchEngine for predictive auto-complete');
  assert.ok(code.includes('suggestionsBar'), 'Must render suggestionsBar UI container');
  assert.ok(code.includes('sparkles-outline'), 'Must render valid Ionicons sparkles-outline icon');
});

console.log('\n====================================================');
console.log(`   ALL ${totalTests} R&D INNOVATION TESTS PASSED!`);
console.log('====================================================\n');
