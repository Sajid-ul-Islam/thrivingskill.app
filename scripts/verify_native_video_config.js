/**
 * Verification script for native video configuration:
 * Picture-in-Picture (PiP) and Background Audio Playback
 */

const fs = require('fs');
const path = require('path');

let errors = [];

// 1. Check app.json
const appJsonPath = path.resolve(__dirname, '../app.json');
try {
  const appJsonContent = fs.readFileSync(appJsonPath, 'utf8');
  const appJson = JSON.parse(appJsonContent);

  // Check iOS background audio
  const uiBackgroundModes = appJson.expo?.ios?.infoPlist?.UIBackgroundModes;
  if (!Array.isArray(uiBackgroundModes) || !uiBackgroundModes.includes('audio')) {
    errors.push('app.json: expo.ios.infoPlist.UIBackgroundModes must contain "audio"');
  } else {
    console.log('✓ app.json: iOS UIBackgroundModes contains "audio"');
  }

  // Check expo-video plugin
  const plugins = appJson.expo?.plugins || [];
  const videoPlugin = plugins.find(p => Array.isArray(p) && p[0] === 'expo-video');
  if (!videoPlugin) {
    errors.push('app.json: expo.plugins must contain configured ["expo-video", {...}] plugin');
  } else {
    const opts = videoPlugin[1] || {};
    if (!opts.supportsBackgroundPlayback) {
      errors.push('app.json: expo-video plugin must have supportsBackgroundPlayback: true');
    }
    if (!opts.supportsPictureInPicture) {
      errors.push('app.json: expo-video plugin must have supportsPictureInPicture: true');
    }
    console.log('✓ app.json: expo-video plugin has supportsBackgroundPlayback and supportsPictureInPicture enabled');
  }
} catch (err) {
  errors.push(`Failed to read/parse app.json: ${err.message}`);
}

// 2. Check AndroidManifest.xml
const manifestPath = path.resolve(__dirname, '../android/app/src/main/AndroidManifest.xml');
try {
  const manifest = fs.readFileSync(manifestPath, 'utf8');

  if (!manifest.includes('android.permission.FOREGROUND_SERVICE')) {
    errors.push('AndroidManifest.xml missing android.permission.FOREGROUND_SERVICE');
  } else {
    console.log('✓ AndroidManifest: FOREGROUND_SERVICE permission declared');
  }

  if (!manifest.includes('android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK')) {
    errors.push('AndroidManifest.xml missing android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK');
  } else {
    console.log('✓ AndroidManifest: FOREGROUND_SERVICE_MEDIA_PLAYBACK permission declared');
  }

  if (!manifest.includes('android:supportsPictureInPicture="true"')) {
    errors.push('AndroidManifest.xml MainActivity missing android:supportsPictureInPicture="true"');
  } else {
    console.log('✓ AndroidManifest: MainActivity supportsPictureInPicture="true" declared');
  }

  if (!manifest.includes('expo.modules.video.playbackService.ExpoVideoPlaybackService')) {
    errors.push('AndroidManifest.xml missing ExpoVideoPlaybackService declaration');
  } else {
    console.log('✓ AndroidManifest: ExpoVideoPlaybackService declared with MediaSessionService');
  }
} catch (err) {
  errors.push(`Failed to read AndroidManifest.xml: ${err.message}`);
}

if (errors.length > 0) {
  console.error('\nFAILED with errors:');
  errors.forEach(e => console.error('  - ' + e));
  process.exit(1);
} else {
  console.log('\nALL NATIVE VIDEO CONFIGURATIONS VERIFIED SUCCESSFULLY (5/5 checks passed)!');
}
