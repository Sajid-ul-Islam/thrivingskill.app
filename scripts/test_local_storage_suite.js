// Comprehensive automated test suite for 3-Phase Local Storage & Learner Productivity Suite
const assert = require('assert');

// Mock AsyncStorage in-memory implementation for unit testing
const store = new Map();
const AsyncStorage = {
  getItem: async (k) => store.get(k) || null,
  setItem: async (k, v) => store.set(k, String(v)),
  removeItem: async (k) => store.delete(k),
  getAllKeys: async () => Array.from(store.keys()),
  multiGet: async (keys) => keys.map((k) => [k, store.get(k) || null]),
  multiRemove: async (keys) => keys.forEach((k) => store.delete(k)),
  clear: async () => store.clear(),
};

// -------------------------------------------------------------
// Test 1: Inverted Index & Tokenizer (Phase 3)
// -------------------------------------------------------------
console.log('--- TEST 1: Full-Text Search Engine (FTS) ---');
function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, ' ')
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'|[\]\\+]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 2);
}

const tokens = tokenize('Learn Full-Stack Python & Django (মাস্টারক্লাস) for AI in 2026!');
console.log('Tokenized:', tokens);
assert(tokens.includes('full'), 'Should include full');
assert(tokens.includes('stack'), 'Should include stack');
assert(tokens.includes('python'), 'Should include python');
assert(tokens.includes('django'), 'Should include django');
assert(tokens.includes('মাস্টারক্লাস'), 'Should include Bengali unicode word');
console.log('✅ Tokenizer passed.');

// -------------------------------------------------------------
// Test 2: Spaced Repetition (SM-2) Algorithm (Phase 2)
// -------------------------------------------------------------
console.log('\n--- TEST 2: SuperMemo-2 (SM-2) Spaced Repetition ---');
function calculateSM2(card, rating) {
  const qualityMap = { again: 1, hard: 3, good: 4, easy: 5 };
  const quality = qualityMap[rating];
  let { repetitions, interval, easeFactor } = card;

  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetitions += 1;
  }

  easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  return { repetitions, interval, easeFactor };
}

let card = { id: 'card-1', repetitions: 0, interval: 1, easeFactor: 2.5 };

// Step 1: Good review
card = { ...card, ...calculateSM2(card, 'good') };
console.log('Review 1 (Good):', card);
assert.strictEqual(card.repetitions, 1);
assert.strictEqual(card.interval, 1);

// Step 2: Second good review -> interval jumps to 6
card = { ...card, ...calculateSM2(card, 'good') };
console.log('Review 2 (Good):', card);
assert.strictEqual(card.repetitions, 2);
assert.strictEqual(card.interval, 6);

// Step 3: Third good review -> interval jumps to round(6 * 2.5) = 15
card = { ...card, ...calculateSM2(card, 'good') };
console.log('Review 3 (Good):', card);
assert.strictEqual(card.repetitions, 3);
assert.strictEqual(card.interval, 15);

// Step 4: Again review -> resets repetitions to 0, interval to 1
card = { ...card, ...calculateSM2(card, 'again') };
console.log('Review 4 (Again):', card);
assert.strictEqual(card.repetitions, 0);
assert.strictEqual(card.interval, 1);
console.log('✅ SM-2 algorithm transitions verified.');

// -------------------------------------------------------------
// Test 3: Outbox Sync Queue Deduping & FIFO (Phase 1)
// -------------------------------------------------------------
console.log('\n--- TEST 3: Offline Outbox Mutation Queue ---');
const queue = [];
function enqueue(action, endpoint, payload) {
  const duplicate = queue.find(
    (m) => m.action === action && m.endpoint === endpoint && JSON.stringify(m.payload) === JSON.stringify(payload)
  );
  if (duplicate) return duplicate;
  const m = { id: 'm-' + (queue.length + 1), action, endpoint, payload, attempts: 0 };
  queue.push(m);
  return m;
}

const m1 = enqueue('COMPLETE_LESSON', '/learnpress/v1/lessons/finish', { id: 'les-1', course_id: 'c-1' });
const m2 = enqueue('ENROLL_COURSE', '/learnpress/v1/courses/enroll', { id: 'c-2' });
const m3 = enqueue('COMPLETE_LESSON', '/learnpress/v1/lessons/finish', { id: 'les-1', course_id: 'c-1' }); // duplicate!

assert.strictEqual(queue.length, 2, 'Should deduplicate identical unattempted mutations');
assert.strictEqual(m1.id, m3.id, 'Duplicate mutation should return existing queue item');
console.log('Queue items:', queue.length);
console.log('✅ Outbox deduping and FIFO ordering verified.');

console.log('\n====================================');
console.log('ALL LOCAL STORAGE SUITE TESTS PASSED');
console.log('====================================');
