const fs = require('fs');
const path = require('path');

console.log('====================================================');
console.log('VERIFYING ON-DEVICE GEMINI NANO VIA GOOGLE AI EDGE');
console.log('====================================================\n');

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passed++;
  } else {
    console.error(`[FAIL] ${testName}`);
    failed++;
  }
}

// 1. Verify android/app/build.gradle minSdk and aicore dependency
const buildGradle = fs.readFileSync('android/app/build.gradle', 'utf8');
assert(
  buildGradle.includes('minSdkVersion 31'),
  'android/app/build.gradle sets minSdkVersion 31 for AICore'
);
assert(
  buildGradle.includes('com.google.ai.edge.aicore:aicore:0.0.1-exp01'),
  'android/app/build.gradle includes implementation("com.google.ai.edge.aicore:aicore:0.0.1-exp01")'
);

// 2. Verify Native Kotlin Module & Package
assert(
  fs.existsSync('android/app/src/main/java/com/thrivingskill/app/aicore/GeminiNanoModule.kt'),
  'GeminiNanoModule.kt exists'
);
const moduleKt = fs.readFileSync(
  'android/app/src/main/java/com/thrivingskill/app/aicore/GeminiNanoModule.kt',
  'utf8'
);
assert(
  moduleKt.includes('class GeminiNanoModule') &&
  moduleKt.includes('com.google.ai.edge.aicore.GenerativeModel') &&
  moduleKt.includes('fun checkStatus') &&
  moduleKt.includes('fun generateText') &&
  moduleKt.includes('fun summarizeLecture') &&
  moduleKt.includes('fun generateSmartReplies') &&
  moduleKt.includes('fun enhanceSearchQuery'),
  'GeminiNanoModule implements all required AICore GenerativeModel methods'
);

assert(
  fs.existsSync('android/app/src/main/java/com/thrivingskill/app/aicore/GeminiNanoPackage.kt'),
  'GeminiNanoPackage.kt exists'
);

const mainApp = fs.readFileSync(
  'android/app/src/main/java/com/thrivingskill/app/MainApplication.kt',
  'utf8'
);
assert(
  mainApp.includes('com.thrivingskill.app.aicore.GeminiNanoPackage()'),
  'MainApplication.kt registers GeminiNanoPackage()'
);

// 3. Verify TypeScript GeminiNanoService
assert(
  fs.existsSync('src/services/ai/geminiNanoService.ts'),
  'geminiNanoService.ts exists'
);
const nanoServiceTs = fs.readFileSync('src/services/ai/geminiNanoService.ts', 'utf8');
assert(
  nanoServiceTs.includes('class GeminiNanoService') &&
  nanoServiceTs.includes('isAvailable') &&
  nanoServiceTs.includes('generateText') &&
  nanoServiceTs.includes('summarizeLecture') &&
  nanoServiceTs.includes('generateSmartReplies') &&
  nanoServiceTs.includes('enhanceSearchQuery') &&
  nanoServiceTs.includes('recommendCourses'),
  'GeminiNanoService exports all core API methods'
);

// 4. Verify In-Lecture AI Copilot (SkillBot)
const aiTutorTs = fs.readFileSync('src/services/ai/aiTutorService.ts', 'utf8');
assert(
  aiTutorTs.includes('GeminiNanoService.isAvailable()') &&
  aiTutorTs.includes('GeminiNanoService.generateText'),
  'AiTutorService integrates on-device Gemini Nano inference for SkillBot'
);
assert(
  aiTutorTs.includes('summarizeLectureOnDevice') &&
  aiTutorTs.includes('getSmartReplies'),
  'AiTutorService provides on-device lecture summary & smart replies'
);

const tutorModal = fs.readFileSync('src/components/player/LessonAiTutorModal.tsx', 'utf8');
assert(
  tutorModal.includes('Gemini Nano') &&
  tutorModal.includes('handleSummarizeLecture') &&
  tutorModal.includes('smartReplies'),
  'LessonAiTutorModal provides Gemini Nano offline badge, quick summarize, and smart replies'
);

// 5. Verify Recommendation Engine
const learningContext = fs.readFileSync('src/context/LearningContext.tsx', 'utf8');
assert(
  learningContext.includes('Gemini Nano') &&
  learningContext.includes('getRecommendedCourses'),
  'LearningContext uses on-device Gemini Nano rationales in recommendation engine'
);

// 6. Verify Search Components
const localSearch = fs.readFileSync('src/components/modals/LocalSearchModal.tsx', 'utf8');
assert(
  localSearch.includes('GeminiNanoService.enhanceSearchQuery') &&
  localSearch.includes('suggestedEnhancement') &&
  localSearch.includes('Nano + LiteRT'),
  'LocalSearchModal provides on-device Gemini Nano query enhancement and proofreading'
);

const universalSearch = fs.readFileSync('src/components/modals/UniversalSearchModal.tsx', 'utf8');
assert(
  universalSearch.includes('GeminiNanoService.enhanceSearchQuery') &&
  universalSearch.includes('suggestedEnhancement'),
  'UniversalSearchModal provides on-device Gemini Nano query enhancement'
);

console.log('\n====================================================');
console.log(`TOTAL CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log('====================================================');

if (failed > 0) process.exit(1);
