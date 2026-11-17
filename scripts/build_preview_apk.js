const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const androidDir = path.resolve(__dirname, '..', 'android');
const gradlewBat = path.join(androidDir, 'gradlew.bat');

const env = {
  ...process.env,
  JAVA_HOME: 'C:\\Users\\deenb\\tools\\jdk17',
  ANDROID_HOME: 'C:\\Users\\deenb\\tools',
  ANDROID_SDK_ROOT: 'C:\\Users\\deenb\\tools',
  PATH: `C:\\Users\\deenb\\tools\\jdk17\\bin;C:\\Users\\deenb\\tools\\platform-tools;${process.env.PATH}`,
};

console.log('--- STARTING LOCAL ANDROID PREVIEW APK BUILD ---');
console.log('Working Directory:', androidDir);
console.log('JAVA_HOME:', env.JAVA_HOME);
console.log('ANDROID_HOME:', env.ANDROID_HOME);

const gradlew = spawn(gradlewBat, ['assembleRelease', '--no-daemon'], {
  cwd: androidDir,
  env,
  shell: true,
  stdio: 'inherit',
});

gradlew.on('close', (code) => {
  console.log(`\nGradle finished with exit code: ${code}`);
  if (code === 0) {
    const apkDir = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'release');
    if (fs.existsSync(apkDir)) {
      const files = fs.readdirSync(apkDir).filter((f) => f.endsWith('.apk'));
      console.log('Generated APKs in release directory:');
      files.forEach((f) => {
        const fullPath = path.join(apkDir, f);
        const stats = fs.statSync(fullPath);
        console.log(`- ${f} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
      });
    }
  }
  process.exit(code);
});
