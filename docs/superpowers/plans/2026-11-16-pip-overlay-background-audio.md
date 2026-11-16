# Picture-in-Picture (PiP) Window Overlay & Background Audio Playback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement full system-level Picture-in-Picture (floating video window overlaying other apps like WhatsApp, Chrome, and the Home screen) and uninterrupted background audio playback (with lock-screen controls and now-playing notification) using `expo-video` (Expo SDK 58) and native Android/iOS platform configurations.

**Architecture:** 
1. **Native Configuration**: Configure Expo config plugin `expo-video` in `app.json` (`supportsPictureInPicture: true`, `supportsBackgroundPlayback: true`), iOS `UIBackgroundModes: ["audio"]`, and Android manifest permissions (`FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MEDIA_PLAYBACK`, `ExpoVideoPlaybackService` with `MediaSessionService`).
2. **Lifecycle & PiP Utility (`src/utils/pipManager.ts`)**: Device capability detection (`isPictureInPictureSupported`), automatic PiP state transitions, and safe error handling.
3. **Hardware-Accelerated Native Video Engine (`NativeMedia3Player.tsx`)**: Built on `expo-video` (`VideoView` + `useVideoPlayer`), providing native Media3 (ExoPlayer) / AVPlayer performance with `allowsPictureInPicture: true`, `startsPictureInPictureAutomatically: true`, `staysActiveInBackground: true`, and lock-screen now-playing notifications.
4. **Player Screen Integration (`LessonPlayerScreen.tsx`)**: Dual-engine player that selects `NativeMedia3Player` for direct MP4/HLS streams and enhanced WebView for Vimeo/iframe streams, wired to dedicated PiP overlay triggers and Commute background audio toggles.

**Tech Stack:** React Native 0.88, Expo SDK 58, `expo-video`, Android Media3 / ExoPlayer, Android Picture-in-Picture API, iOS AVPictureInPictureController, TypeScript.

**Spec:** User request: "is it possible to implement, even if customer gets out of the app, the video screen can be played in background or overlaying with other apps? Proceed with Option 1 and Both together".

## Global Constraints

- **Rule 1: Non-Negotiable Type Safety**: `npm run typecheck` must exit with code 0 after every task.
- **Rule 2: Strict Brand Identity**: Adhere to official Thriving Skills color tokens (`#102F53`, `#FFB606`, `#E34234`, `#0F192C`/`#1E293B`, `#FFFFFF`/`#F8FAFC`).
- **Rule 3: Timer Hygiene**: Use `ReturnType<typeof setTimeout>` and clean up in unmount teardowns; never declare `NodeJS.Timeout`.
- **Rule 4: Windows PowerShell Syntax Safety**: Write verification scripts to `scripts/` and run via `node scripts/<script>.js`.
- **Single Source of Truth**: Preserve live WordPress LearnPress video streams and authentic Vimeo/MP4 registries without mock data.

## Review Focus

1. **System PiP Exit & Return**: When user taps Home or switches to another app, the video must not crash or pause unexpectedly; on return, the player must seamlessly resume fullscreen or inline.
2. **Background Audio Continuity**: When screen locks or the app is minimized with Background Audio enabled, audio playback must continue and lock-screen media controls must be responsive.
3. **Platform Fallbacks**: If a device lacks hardware PiP support (e.g. low-end Android or restricted webview), gracefully fallback to in-app floating player without errors.
4. **Dual Engine Synchronization**: Both `NativeMedia3Player` (direct MP4/HLS) and `WebView` (Vimeo/iframes) must accurately report watch positions and completion triggers to `useLearning`.
5. **Memory & Lifecycle Hygiene**: When unmounting `LessonPlayerScreen`, the video player and any background services must release hardware resources properly to prevent memory leaks.

---

### Task 1: Native Platform & Expo Config Plugin Setup

**Files:**
- Modify: `app.json`
- Modify: `android/app/src/main/AndroidManifest.xml`
- Test: `scripts/verify_native_video_config.js`

- [x] Step 1: Update `app.json` plugins section to configure `expo-video` with `supportsBackgroundPlayback: true` and `supportsPictureInPicture: true`.
- [x] Step 2: Add `ios.infoPlist.UIBackgroundModes = ["audio"]` in `app.json`.
- [x] Step 3: Update `android/app/src/main/AndroidManifest.xml`:
  - Add `android:supportsPictureInPicture="true"` to `<activity android:name=".MainActivity" ...>`.
  - Add `android.permission.FOREGROUND_SERVICE` and `android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK`.
  - Add `<service android:name="expo.modules.video.playbackService.ExpoVideoPlaybackService" ...>` with `<action android:name="androidx.media3.session.MediaSessionService"/>`.
- [x] Step 4: Write and run `scripts/verify_native_video_config.js` to validate all native entries.
- [x] Step 5: Run `npm run typecheck` and commit Task 1.

---

### Task 2: Build `pipManager` Utility for System PiP & Background Audio

**Files:**
- Create: `src/utils/pipManager.ts`
- Test: `scripts/test_pip_manager.js`

- [x] Step 1: Implement `src/utils/pipManager.ts` exporting:
  - `isSystemPiPSupported()`: Checks device and platform PiP capability via `isPictureInPictureSupported()` from `expo-video`.
  - `isBackgroundAudioSupported()`: Platform validation for background audio services.
  - `formatMediaNotificationMetadata()`: Formats title, artist ("Thriving Skills"), artwork URL for system lock-screen notifications.
- [x] Step 2: Add safe error-handling wrappers for native PiP entry calls.
- [x] Step 3: Write and run `scripts/test_pip_manager.js`.
- [x] Step 4: Run `npm run typecheck` and commit Task 2.

---

### Task 3: Create Hardware-Accelerated `NativeMedia3Player` Component

**Files:**
- Create: `src/components/player/NativeMedia3Player.tsx`
- Modify: `src/components/player/index.ts`
- Test: `scripts/test_native_media3_player.js`

- [x] Step 1: Implement `NativeMedia3Player.tsx` using `useVideoPlayer` and `VideoView` from `expo-video`.
- [x] Step 2: Configure player properties:
  - `allowsPictureInPicture: true`
  - `startsPictureInPictureAutomatically: true`
  - `staysActiveInBackground: true` (when commute/background mode is active)
  - `showNowPlayingNotification: true`
  - Listeners for playback progress, pause/play, buffer state, and completion.
- [x] Step 3: Add imperative ref methods or callbacks (`startPiP()`, `togglePlay()`, `seekTo()`, `setSpeed()`).
- [x] Step 4: Export `NativeMedia3Player` from `src/components/player/index.ts`.
- [x] Step 5: Write and run `scripts/test_native_media3_player.js`.
- [x] Step 6: Run `npm run typecheck` and commit Task 3.

---

### Task 4: Integrate System PiP & Background Audio into `LessonPlayerScreen`

**Files:**
- Modify: `src/screens/LessonPlayerScreen.tsx`
- Modify: `src/components/player/VideoPlayerGestureOverlay.tsx`
- Test: `scripts/verify_player_pip_integration.js`

- [x] Step 1: In `LessonPlayerScreen.tsx`, inspect video source format:
  - Direct MP4 / HLS (`.m3u8` / `.mp4`) uses `NativeMedia3Player`.
  - Vimeo / iframe embeds use enhanced `WebView` with hardware acceleration and HTML5 PiP.
- [x] Step 2: Wire the top player PiP button to trigger native system PiP (`ref.current?.startPictureInPicture()`) with feedback toast.
- [x] Step 3: Connect "Commute Mode" / Background Audio toggle so student can lock their device while audio continues playing.
- [x] Step 4: Handle app state changes gracefully (`AppState.addEventListener('change', ...)`), ensuring video position is preserved.
- [x] Step 5: Update `VideoPlayerGestureOverlay.tsx` to display PiP overlay shortcut and commute mode status indicators.
- [x] Step 6: Write and run `scripts/verify_player_pip_integration.js`.
- [x] Step 7: Run `npm run typecheck` and commit Task 4.

---

### Task 5: End-to-End Verification, Performance & Quality Audit

**Files:**
- Test: `scripts/verify_pip_background_audio.js`

- [x] Step 1: Run comprehensive verification script `scripts/verify_pip_background_audio.js`.
- [x] Step 2: Run `node scripts/audit_app.js` across all 156+ codebase files (ensure 0 issues).
- [x] Step 3: Run `npm run typecheck` (ensure 0 TypeScript errors).
- [x] Step 4: Review UI against UI/UX Design Laws (Fitts's Law touch targets >= 44x44, brand colors, dark/light parity).
- [x] Step 5: Final git commit and goal completion summary.
