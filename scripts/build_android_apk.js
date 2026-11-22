const { spawnSync, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const realRootDir = 'D:\\Repo\\thrivingskill.app';
const androidDir = path.join(realRootDir, 'android');
const jdkPath = 'C:\\Users\\deenb\\tools\\jdk17';
const androidToolsPath = 'C:\\Users\\deenb\\tools';

console.log('====================================================');
console.log('      THRIVING SKILLS LOCAL ANDROID APK BUILD       ');
console.log('====================================================\n');

console.log(`[PATH] Build working directory: ${androidDir}`);

// 1. Clean stale caches if --full-clean requested, otherwise perform fast incremental build
const isFullClean = process.argv.includes('--full-clean');
if (isFullClean) {
  const cleanDirs = [
    path.join(androidDir, '.gradle'),
    path.join(androidDir, 'build'),
    path.join(androidDir, 'app', 'build'),
    path.join(androidDir, 'app', '.cxx'),
  ];

  for (const dir of cleanDirs) {
    if (fs.existsSync(dir)) {
      console.log(`[CLEAN] Purging ${dir} ...`);
      try {
        execSync(`cmd /c "rmdir /s /q \\\\?\\${dir}"`, { stdio: 'ignore' });
      } catch (_) {}
    }
  }
} else {
  console.log('[INCREMENTAL] Preserving native C++ and Gradle build cache for fast compilation...');
}

const releaseApkPath = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
if (fs.existsSync(releaseApkPath)) {
  try { fs.unlinkSync(releaseApkPath); } catch (_) {}
}

// 2. Setup Environment
const env = { ...process.env };
env.JAVA_HOME = jdkPath;
env.ANDROID_HOME = androidToolsPath;
env.ANDROID_SDK_ROOT = androidToolsPath;
env.PATH = `${path.join(jdkPath, 'bin')};${env.PATH}`;

console.log(`[INFO] JAVA_HOME: ${env.JAVA_HOME}`);
console.log(`[INFO] ANDROID_HOME: ${env.ANDROID_HOME}`);

// 3. Run Gradle assembleRelease
console.log(`\n[BUILD] Running gradlew.bat assembleRelease in ${androidDir} ...\n`);
const startTime = Date.now();

const gradlew = path.join(androidDir, 'gradlew.bat');
const result = spawnSync(gradlew, ['assembleRelease'], {
  cwd: androidDir,
  env,
  stdio: 'inherit',
  shell: true,
});

const duration = ((Date.now() - startTime) / 1000).toFixed(1);

if (result.status !== 0) {
  console.error(`\n❌ [ERROR] Gradle build failed with exit code ${result.status} after ${duration}s`);
  process.exit(result.status || 1);
}

// 4. Locate Built APK
let finalApk = null;
const candidateDirs = [
  path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'release'),
];

for (const dir of candidateDirs) {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    const apkFile = files.find(f => f.endsWith('.apk'));
    if (apkFile) {
      finalApk = path.join(dir, apkFile);
      break;
    }
  }
}

if (!finalApk || !fs.existsSync(finalApk)) {
  console.error(`\n❌ [ERROR] Expected APK not found in release directories:`);
  candidateDirs.forEach(d => console.error(`   - ${d}`));
  process.exit(1);
}

const stats = fs.statSync(finalApk);
const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);

console.log('\n====================================================');
console.log('✅ [SUCCESS] APK BUILD COMPLETE');
console.log(`   Location : ${finalApk}`);
console.log(`   File Size: ${sizeMb} MB (${stats.size} bytes)`);
console.log(`   Build Time: ${duration} seconds`);
console.log('====================================================\n');

// 5. Copy to builds/ directory for clean GitHub Release attachment
const buildsDir = path.join(realRootDir, 'builds');
if (!fs.existsSync(buildsDir)) {
  fs.mkdirSync(buildsDir, { recursive: true });
}
const targetReleaseApk = path.join(buildsDir, 'thrivingskill-v4.0.6-preview.apk');
fs.copyFileSync(finalApk, targetReleaseApk);
console.log(`[ARTIFACT] Copied to builds/: ${targetReleaseApk} (${sizeMb} MB)`);
