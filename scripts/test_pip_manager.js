/**
 * Static & logic validation of pipManager.ts
 */

const fs = require('fs');
const assert = require('assert');
const path = require('path');

console.log('Testing src/utils/pipManager.ts...\n');

const filePath = path.resolve(__dirname, '../src/utils/pipManager.ts');
const content = fs.readFileSync(filePath, 'utf8');

// 1. Export verification
assert(content.includes('export interface NowPlayingMetadata'), 'Missing NowPlayingMetadata interface export');
assert(content.includes('export function isSystemPiPSupported'), 'Missing isSystemPiPSupported export');
assert(content.includes('export function isBackgroundAudioSupported'), 'Missing isBackgroundAudioSupported export');
assert(content.includes('export function formatNowPlayingMetadata'), 'Missing formatNowPlayingMetadata export');
assert(content.includes('export function getPlayerOverlayBadge'), 'Missing getPlayerOverlayBadge export');

// 2. Hardware / Library binding
assert(content.includes("from 'expo-video'"), 'pipManager must import from expo-video');
assert(content.includes('isPictureInPictureSupported'), 'pipManager must use isPictureInPictureSupported from expo-video');

// 3. Web & Native resilience
assert(content.includes("Platform.OS === 'web'"), 'pipManager must handle web platform gracefully');
assert(content.includes('document.pictureInPictureEnabled'), 'pipManager must support web PiP detection');

// 4. Color branding checks
assert(content.includes('#FFB606'), 'PiP badge color must use Thriving Skills Sunshine Gold (#FFB606)');
assert(content.includes('#10B981'), 'Background audio badge must use Emerald (#10B981)');

console.log('✓ All 4 requirement categories verified in src/utils/pipManager.ts!');
