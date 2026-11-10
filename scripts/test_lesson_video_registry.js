const fs = require('fs');
const assert = require('assert');

console.log('Testing Thriving Skills Authentic Vimeo Video Master Registry in TypeScript...');
const tsContent = fs.readFileSync('src/data/lessonVideosRegistry.ts', 'utf8');

assert(tsContent.includes("leadership: ["), 'Missing leadership playlist');
assert(tsContent.includes("'generative-ai': ["), 'Missing generative-ai playlist');
assert(tsContent.includes("excel: ["), 'Missing excel playlist');
assert(tsContent.includes("finance: ["), 'Missing finance playlist');
assert(tsContent.includes("research: ["), 'Missing research playlist');
assert(tsContent.includes("cybersecurity: ["), 'Missing cybersecurity playlist');
assert(tsContent.includes("'86355': 'leadership'"), 'Missing Emotional Intelligence ID mapping');
assert(tsContent.includes("export function resolveLessonVideoData"), 'Missing resolveLessonVideoData export');

// Count how many authentic Vimeo videos are defined in the file
const vimeoMatches = tsContent.match(/videoUrl:\s*'https:\/\/player\.vimeo\.com\/video\/([^']+)'/g);
assert(vimeoMatches && vimeoMatches.length >= 30, `Expected at least 30 Vimeo video URLs, found ${vimeoMatches ? vimeoMatches.length : 0}`);

// Ensure zero YouTube fallback URLs remain in the registry
const youtubeMatches = tsContent.match(/youtube\.com/g);
assert(!youtubeMatches, 'Registry must NOT contain any YouTube URLs; all course videos must be authentic Vimeo embeds');

console.log(`✅ Vimeo Master Registry verified: ${vimeoMatches.length} authentic Vimeo lectures across 6 domain categories with 0 YouTube fallbacks.`);
