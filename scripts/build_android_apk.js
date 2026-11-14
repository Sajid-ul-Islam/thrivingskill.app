const { spawnSync, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const realRootDir = 'D:\\Repo\\thrivingskill.app';
const vDrive = 'T:';
const vRootDir = 'T:\\';
const vAndroidDir = 'T:\\android';
const jdkPath = 'C:\\Users\\deenb\\tools\\jdk17';
const androidToolsPath = 'C:\\Users\\deenb\\tools';

console.log('====================================================');
console.log('      THRIVING SKILLS LOCAL ANDROID APK BUILD       ');
console.log('====================================================\n');

// 1. Ensure Virtual Drive T: is mapped to bypass Windows MAX_PATH limits
try {
  const substList = execSync('subst', { encoding: 'utf-8' });
  if (!substList.includes('T:')) {
    console.log(`[SETUP] Mapping virtual drive ${vDrive} -> ${realRootDir} ...`);
    execSync(`subst ${vDrive} "${realRootDir}"`);
  } else {
    console.log(`[SETUP] Virtual drive ${vDrive} already mapped to workspace.`);
  }
} catch (err) {
  console.warn('[WARN] subst check failed, trying to map directly:', err.message);
  try { execSync(`subst ${vDrive} "${realRootDir}"`); } catch (_) {}
}

// 2. Clean previous build outputs and old CXX cache to prevent CMake path mismatch
const cxxDir = path.join(realRootDir, 'android', 'app', '.cxx');
if (fs.existsSync(cxxDir)) {
  console.log('[CLEAN] Removing previous CXX cache with Win32 long path support...');
  try {
    execSync(`cmd /c "rmdir /s /q \\\\?\\${cxxDir}"`, { stdio: 'ignore' });
  } catch (_) {}
}

const releaseApkPath = path.join(realRootDir, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
if (fs.existsSync(releaseApkPath)) {
  try { fs.unlinkSync(releaseApkPath); } catch (_) {}
}

// 3. Setup Environment
const env = { ...process.env };
env.JAVA_HOME = jdkPath;
env.ANDROID_HOME = androidToolsPath;
env.ANDROID_SDK_ROOT = androidToolsPath;
env.PATH = `${path.join(jdkPath, 'bin')};${env.PATH}`;

console.log(`[INFO] JAVA_HOME set to: ${env.JAVA_HOME}`);
console.log(`[INFO] ANDROID_HOME set to: ${env.ANDROID_HOME}`);

// 4. Run Gradle assembleRelease from T:\android
console.log(`[BUILD] Running gradlew.bat assembleRelease in ${vAndroidDir} ...\n`);
const startTime = Date.now();

const gradlew = path.join(vAndroidDir, 'gradlew.bat');
const result = spawnSync(gradlew, ['assembleRelease'], {
  cwd: vAndroidDir,
  env,
  stdio: 'inherit',
  shell: true,
});

const duration = ((Date.now() - startTime) / 1000).toFixed(1);

if (result.status !== 0) {
  console.error(`\n❌ [ERROR] Gradle build failed with exit code ${result.status} after ${duration}s`);
  process.exit(result.status || 1);
}

// 5. Locate Built APK
let finalApk = null;
const candidateDirs = [
  path.join(realRootDir, 'android', 'app', 'build', 'outputs', 'apk', 'release'),
  path.join(vAndroidDir, 'app', 'build', 'outputs', 'apk', 'release'),
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

// 6. Copy to Root for clean GitHub Release attachment
const targetReleaseApk = path.join(realRootDir, 'thrivingskill-v1.4.0-release.apk');
fs.copyFileSync(finalApk, targetReleaseApk);
console.log(`[ARTIFACT] Copied to root: ${targetReleaseApk} (${sizeMb} MB)`);
