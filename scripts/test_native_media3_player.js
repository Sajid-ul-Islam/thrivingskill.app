/**
 * Static & logic validation of NativeMedia3Player.tsx
 */

const fs = require('fs');
const assert = require('assert');
const path = require('path');

console.log('Testing src/components/player/NativeMedia3Player.tsx...\n');

const filePath = path.resolve(__dirname, '../src/components/player/NativeMedia3Player.tsx');
const content = fs.readFileSync(filePath, 'utf8');

// 1. Export verification
assert(content.includes('export interface NativeMedia3PlayerProps'), 'Missing NativeMedia3PlayerProps interface');
assert(content.includes('export interface NativeMedia3PlayerRef'), 'Missing NativeMedia3PlayerRef interface');
assert(content.includes('export const NativeMedia3Player'), 'Missing NativeMedia3Player component export');

// 2. expo-video integration
assert(content.includes("from 'expo-video'"), 'Must import useVideoPlayer and VideoView from expo-video');
assert(content.includes('useVideoPlayer'), 'Must use useVideoPlayer hook');
assert(content.includes('VideoView'), 'Must render VideoView');

// 3. Picture-in-Picture & Background configuration
assert(content.includes('allowsPictureInPicture'), 'VideoView must have allowsPictureInPicture prop');
assert(content.includes('startsPictureInPictureAutomatically'), 'VideoView must have startsPictureInPictureAutomatically prop');
assert(content.includes('staysActiveInBackground = true'), 'Player must configure staysActiveInBackground');
assert(content.includes('showNowPlayingNotification = true'), 'Player must configure showNowPlayingNotification');

// 4. Imperative handles for PiP and playback
assert(content.includes('startPictureInPicture: async ()'), 'Ref must expose startPictureInPicture method');
assert(content.includes('stopPictureInPicture: async ()'), 'Ref must expose stopPictureInPicture method');
assert(content.includes('enterFullscreen: async ()'), 'Ref must expose enterFullscreen method');
assert(content.includes('exitFullscreen: async ()'), 'Ref must expose exitFullscreen method');

// 5. Index export check
const indexPath = path.resolve(__dirname, '../src/components/player/index.ts');
const indexContent = fs.readFileSync(indexPath, 'utf8');
assert(indexContent.includes("export * from './NativeMedia3Player'"), 'index.ts must export NativeMedia3Player');

console.log('✓ All 5 requirement categories verified for NativeMedia3Player.tsx!');
