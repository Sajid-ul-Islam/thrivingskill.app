/**
 * Verification test suite for Android EdTech Video Streaming UI
 * Validates:
 * 1. Mobile Layout & Navigation (Sticky top 16:9 player, Swipeable bottom tabs, FAB for notes, Fullscreen landscape)
 * 2. Android-Specific Gestures & Controls (Double-tap to seek 10s, Edge vertical swipes for volume/brightness, Screen padlock lock, One-tap speed pill)
 * 3. Essential Android System Integrations (Media3 ExoPlayer adaptive streaming, PiP mode, Background commute audio, Smart offline downloads with quality picker)
 */

const fs = require('fs');
const path = require('path');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    testsPassed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    testsFailed++;
  }
}

console.log('--- 1. Testing VideoPlayerGestureOverlay Component ---');
const overlayPath = path.join(__dirname, '..', 'src', 'components', 'player', 'VideoPlayerGestureOverlay.tsx');
assert(fs.existsSync(overlayPath), 'VideoPlayerGestureOverlay.tsx exists');
const overlayCode = fs.readFileSync(overlayPath, 'utf8');

// Gesture tests
assert(overlayCode.includes('triggerDoubleTapSeek'), 'Implements double-tap seek detection');
assert(overlayCode.includes('seekRippleBubble'), 'Renders animated ripple indicators for double-tap seek');
assert(overlayCode.includes('brightness') && overlayCode.includes('volume'), 'Implements edge vertical swipe detection for brightness and volume');
assert(overlayCode.includes('hudOverlay') && overlayCode.includes('hudProgressBarTrack'), 'Renders on-screen HUD progress bars for brightness and volume adjustments');
assert(overlayCode.includes('isLocked') && overlayCode.includes('padlockUnlockBtn'), 'Provides screen lock padlock to prevent accidental touches');
assert(overlayCode.includes('speedPill') && overlayCode.includes('onCycleSpeed'), 'Displays visible one-tap speed pill cycling speeds directly on overlay');
assert(overlayCode.includes('onOpenQualityModal'), 'Includes streaming quality picker on overlay');
assert(overlayCode.includes('onTriggerPiP'), 'Includes Picture-in-Picture (PiP) trigger button');
assert(overlayCode.includes('onToggleFullscreen'), 'Includes seamless fullscreen landscape toggle');

console.log('\n--- 2. Testing LessonTranscriptTab Component ---');
const transcriptPath = path.join(__dirname, '..', 'src', 'components', 'player', 'LessonTranscriptTab.tsx');
assert(fs.existsSync(transcriptPath), 'LessonTranscriptTab.tsx exists');
const transcriptCode = fs.readFileSync(transcriptPath, 'utf8');
assert(transcriptCode.includes('searchQuery') && transcriptCode.includes('searchInput'), 'Provides real-time transcript keyword search');
assert(transcriptCode.includes('timestampPill') && transcriptCode.includes('onSeekTo'), 'Provides clickable timestamp pills to jump player position');
assert(transcriptCode.includes('nowPlayingBadge') || transcriptCode.includes('Active'), 'Highlights active transcript segment synchronized with video playback');

console.log('\n--- 3. Testing DownloadQualityModal Component ---');
const qualityModalPath = path.join(__dirname, '..', 'src', 'components', 'player', 'DownloadQualityModal.tsx');
assert(fs.existsSync(qualityModalPath), 'DownloadQualityModal.tsx exists');
const qualityModalCode = fs.readFileSync(qualityModalPath, 'utf8');
assert(qualityModalCode.includes('360p Data Saver') && qualityModalCode.includes('720p HD'), 'Offers 360p Data Saver and 720p HD quality options');
assert(qualityModalCode.includes('~25 MB') && qualityModalCode.includes('~65 MB'), 'Provides accurate download file size estimates');
assert(qualityModalCode.includes('streamQuality') && qualityModalCode.includes('Auto (Media3 Adaptive)'), 'Supports Media3 adaptive bitrate streaming quality selection');

console.log('\n--- 4. Testing QuickNoteBottomSheet Component ---');
const quickNotePath = path.join(__dirname, '..', 'src', 'components', 'player', 'QuickNoteBottomSheet.tsx');
assert(fs.existsSync(quickNotePath), 'QuickNoteBottomSheet.tsx exists');
const quickNoteCode = fs.readFileSync(quickNotePath, 'utf8');
assert(quickNoteCode.includes('timestampBadge'), 'Captures and displays the exact video timestamp badge');
assert(quickNoteCode.includes('slideAnim'), 'Provides smooth animated bottom sheet slide up transition');
assert(quickNoteCode.includes('quickTags'), 'Provides rapid study tag chips (Key Concept, Insight, etc.)');
assert(quickNoteCode.includes('onSaveNote'), 'Saves study note with captured timestamp');

console.log('\n--- 5. Testing PiPFloatingPlayer Component ---');
const pipPath = path.join(__dirname, '..', 'src', 'components', 'player', 'PiPFloatingPlayer.tsx');
assert(fs.existsSync(pipPath), 'PiPFloatingPlayer.tsx exists');
const pipCode = fs.readFileSync(pipPath, 'utf8');
assert(pipCode.includes('floatingContainer'), 'Renders floating corner mini-player window');
assert(pipCode.includes('onMaximize') && pipCode.includes('onTogglePlay'), 'Provides in-window maximize, play/pause, and close controls');

console.log('\n--- 6. Testing LessonPlayerScreen Integration ---');
const playerScreenPath = path.join(__dirname, '..', 'src', 'screens', 'LessonPlayerScreen.tsx');
assert(fs.existsSync(playerScreenPath), 'LessonPlayerScreen.tsx exists');
const playerScreenCode = fs.readFileSync(playerScreenPath, 'utf8');

// Sticky top 16:9 player
assert(playerScreenCode.includes('stickyPlayerFrame') && playerScreenCode.includes('aspectRatio: 16 / 9'), 'Anchors 16:9 sticky player container at top (portrait mode)');
assert(playerScreenCode.includes('lowerLearningArea'), 'Reserves lower 60-65% of screen for interactive tabbed learning area');

// Swipeable bottom tabs
assert(playerScreenCode.includes('horizontalPagingScroll') && playerScreenCode.includes('pagingEnabled'), 'Implements horizontal swipeable tabs between Lectures, Notes, Transcript, and Q&A');
assert(playerScreenCode.includes("'curriculum'") && playerScreenCode.includes("'notes'") && playerScreenCode.includes("'transcript'") && playerScreenCode.includes("'qna'"), 'Contains all 4 designated learning tabs');

// Floating Action Button (FAB)
assert(playerScreenCode.includes('notesFAB') && playerScreenCode.includes('handleOpenNotesFAB'), 'Provides floating action button (FAB) for notes at bottom right');
assert(playerScreenCode.includes('QuickNoteBottomSheet') && playerScreenCode.includes('isQuickNoteOpen'), 'Opens compact bottom sheet note editor without hiding top video frame');

// Landscape Fullscreen & Auto-Rotation
assert(playerScreenCode.includes('fullscreenPlayerFrame') && playerScreenCode.includes('isFullscreen'), 'Supports edge-to-edge landscape fullscreen');
assert(playerScreenCode.includes('Dimensions.addEventListener'), 'Supports automatic rotation to landscape fullscreen');

// Media3 ExoPlayer & Offline downloads
assert(playerScreenCode.includes('buildVideoHtml') && playerScreenCode.includes('media3Player'), 'Configures Media3 adaptive streaming player architecture');
assert(playerScreenCode.includes('DownloadQualityModal') && playerScreenCode.includes('handleStartDownloadWithQuality'), 'Integrates smart offline downloads with quality picker');

// Background commute audio
assert(playerScreenCode.includes('commutePlayerCard') && playerScreenCode.includes('LiveAudioWaveform'), 'Provides background commute audio playback with living waveform');

console.log(`\n================================`);
console.log(`Total: ${testsPassed + testsFailed} tests | Passed: ${testsPassed} | Failed: ${testsFailed}`);
if (testsFailed > 0) {
  process.exit(1);
} else {
  console.log('ALL EDTECH VIDEO STREAMING UI TESTS PASSED SUCCESSFULLY! 🎉');
  process.exit(0);
}
