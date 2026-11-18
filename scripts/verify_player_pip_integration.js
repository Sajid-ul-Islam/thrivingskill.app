/**
 * Verification of LessonPlayerScreen & VideoPlayerGestureOverlay PiP and background audio integration
 */

const fs = require('fs');
const assert = require('assert');
const path = require('path');

console.log('Verifying player PiP & background audio integration...\n');

const playerScreenPath = path.resolve(__dirname, '../src/screens/LessonPlayerScreen.tsx');
const containerPath = path.resolve(__dirname, '../src/components/player/LessonVideoContainer.tsx');
const playerScreen = fs.readFileSync(playerScreenPath, 'utf8') +
  (fs.existsSync(containerPath) ? fs.readFileSync(containerPath, 'utf8') : '');

const overlayPath = path.resolve(__dirname, '../src/components/player/VideoPlayerGestureOverlay.tsx');
const overlay = fs.readFileSync(overlayPath, 'utf8');

// 1. Imports check
assert(playerScreen.includes('NativeMedia3Player'), 'LessonPlayerScreen must import NativeMedia3Player');
assert(playerScreen.includes('NativeMedia3PlayerRef'), 'LessonPlayerScreen must import NativeMedia3PlayerRef');
assert(playerScreen.includes('isSystemPiPSupported'), 'LessonPlayerScreen must import isSystemPiPSupported');
assert(playerScreen.includes('AppState'), 'LessonPlayerScreen must import AppState');

// 2. State & Ref check
assert(playerScreen.includes('nativePlayerRef = useRef<NativeMedia3PlayerRef | null>(null)'), 'Must declare nativePlayerRef');
assert(playerScreen.includes('isDirectStream'), 'Must compute isDirectStream');

// 3. Dual Engine Player Rendering
assert(playerScreen.includes('<NativeMedia3Player'), 'Must render NativeMedia3Player for direct streams');
assert(playerScreen.includes('<WebView'), 'Must render WebView for iframe embeds');

// 4. Handlers synchronization
assert(playerScreen.includes('const handleTogglePlay = () =>'), 'Must declare handleTogglePlay');
assert(playerScreen.includes('const handleTriggerPiP = async () =>'), 'Must declare handleTriggerPiP');
assert(playerScreen.includes('nativePlayerRef.current.seekTo(next)'), 'Seek/rewind/forward must forward to native player');

// 5. AppState background listener
assert(playerScreen.includes('AppState.addEventListener'), 'Must handle AppState lifecycle transitions');

// 6. Overlay PiP button check
assert(overlay.includes('albums-outline'), 'VideoPlayerGestureOverlay must render albums-outline icon for PiP');
assert(overlay.includes('accessibilityLabel="Picture-in-picture floating window"'), 'VideoPlayerGestureOverlay must have accessible PiP label');

console.log('✓ All 6 player integration requirements verified successfully!');
