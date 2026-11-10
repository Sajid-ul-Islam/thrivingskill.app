const fs = require('fs');
const assert = require('assert');

console.log('Testing Thriving Skills Video Master Registry in TypeScript...');
const tsContent = fs.readFileSync('src/data/lessonVideosRegistry.ts', 'utf8');

assert(tsContent.includes("leadership: ["), 'Missing leadership playlist');
assert(tsContent.includes("'generative-ai': ["), 'Missing generative-ai playlist');
assert(tsContent.includes("excel: ["), 'Missing excel playlist');
assert(tsContent.includes("finance: ["), 'Missing finance playlist');
assert(tsContent.includes("research: ["), 'Missing research playlist');
assert(tsContent.includes("cybersecurity: ["), 'Missing cybersecurity playlist');
assert(tsContent.includes("'86355': 'leadership'"), 'Missing Emotional Intelligence ID mapping');
assert(tsContent.includes("export function resolveLessonVideoData"), 'Missing resolveLessonVideoData export');

// Count how many youtube videos are defined in the file
const videoMatches = tsContent.match(/videoUrl:\s*'https:\/\/www\.youtube\.com\/watch\?v=([\w-]+)'/g);
assert(videoMatches && videoMatches.length >= 30, `Expected at least 30 video URLs, found ${videoMatches ? videoMatches.length : 0}`);

console.log(`✅ Video Master Registry verified: ${videoMatches.length} distinct masterclass lectures across 6 domain categories.`);
