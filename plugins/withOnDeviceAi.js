const fs = require('fs');
const path = require('path');
const {
  withAndroidManifest,
  withAppBuildGradle,
  withDangerousMod,
  withMainApplication,
  createRunOncePlugin,
} = require('expo/config-plugins');

const PACKAGE_DEPENDENCIES = [
  'implementation("com.google.android.gms:play-services-tflite-java:16.4.0")',
  'implementation("com.google.android.gms:play-services-tflite-gpu:16.4.0")',
  'implementation("com.google.ai.edge.aicore:aicore:0.0.1-exp01")',
];

const PACKAGE_REGISTRATIONS = [
  'add(com.thrivingskill.app.litert.LiteRtPackage())',
  'add(com.thrivingskill.app.aicore.GeminiNanoPackage())',
];

function copyDirRecursiveSync(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursiveSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Copies custom LiteRT + Gemini Nano Kotlin modules from `native/android/`
 * into the generated Android source tree during `expo prebuild`.
 */
const withOnDeviceAiSources = (config) =>
  withDangerousMod(config, [
    'android',
    async (mod) => {
      const projectRoot = mod.modRequest.projectRoot;
      const sourceDir = path.join(projectRoot, 'native', 'android', 'com', 'thrivingskill', 'app');
      const targetDir = path.join(
        mod.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'java',
        'com',
        'thrivingskill',
        'app'
      );
      copyDirRecursiveSync(sourceDir, targetDir);
      return mod;
    },
  ]);

/**
 * Registers LiteRtPackage and GeminiNanoPackage in MainApplication.kt.
 */
const withOnDeviceAiMainApplication = (config) =>
  withMainApplication(config, (mod) => {
    if (mod.modResults.language !== 'kt') {
      throw new Error('withOnDeviceAi expects Kotlin MainApplication.kt');
    }

    let contents = mod.modResults.contents;
    if (!contents.includes('LiteRtPackage()') || !contents.includes('GeminiNanoPackage()')) {
      const applyRegex = /(PackageList\(this\)\.packages\.apply\s*\{)/;
      if (!applyRegex.test(contents)) {
        throw new Error(
          'Could not locate PackageList(this).packages.apply { in MainApplication.kt'
        );
      }
      const additions = PACKAGE_REGISTRATIONS.filter((line) => !contents.includes(line))
        .map((line) => `          ${line}`)
        .join('\n');
      if (additions) {
        contents = contents.replace(applyRegex, `$1\n${additions}`);
      }
    }

    mod.modResults.contents = contents;
    return mod;
  });

/**
 * Adds Play Services LiteRT & Google AI Edge AICore Gradle dependencies idempotently.
 */
const withOnDeviceAiDependencies = (config) =>
  withAppBuildGradle(config, (mod) => {
    let contents = mod.modResults.contents;
    const missingDeps = PACKAGE_DEPENDENCIES.filter((dep) => !contents.includes(dep));
    if (missingDeps.length > 0) {
      const depsBlockRegex = /(dependencies\s*\{)/;
      if (!depsBlockRegex.test(contents)) {
        throw new Error('Could not locate dependencies { in android/app/build.gradle');
      }
      const block = missingDeps.map((dep) => `    ${dep}`).join('\n');
      contents = contents.replace(depsBlockRegex, `$1\n${block}`);
    }

    // Only upload Sentry source maps/debug symbols from Gradle when SENTRY_AUTH_TOKEN is explicitly provided
    // (or when not disabled via SENTRY_DISABLE_AUTO_UPLOAD=true), so EAS builds succeed cleanly even before
    // Sentry auth secrets are provisioned while remaining automatic once configured.
    if (
      contents.includes('sentry.gradle.kts') &&
      !contents.includes('shouldSentryAutoUploadGeneral')
    ) {
      contents = contents.replace(
        /^(apply from:.*sentry\.gradle\.kts.*)$/m,
        `$1\nproject.ext.shouldSentryAutoUploadGeneral = { ->\n    def token = System.getenv("SENTRY_AUTH_TOKEN")\n    def disabled = System.getenv("SENTRY_DISABLE_AUTO_UPLOAD") == "true"\n    return !disabled && token != null && !token.trim().isEmpty()\n}`
      );
    }

    mod.modResults.contents = contents;
    return mod;
  });

/**
 * Allows `com.google.ai.edge.aicore` (which declares minSdk 31 in its AAR manifest)
 * to merge when the app builds with minSdkVersion 24. GeminiNanoModule checks
 * `Build.VERSION.SDK_INT >= 31` at runtime before initializing AICore.
 */
const withAiCoreManifestOverride = (config) =>
  withAndroidManifest(config, (mod) => {
    const manifest = mod.modResults.manifest;
    manifest.$ = manifest.$ || {};
    if (!manifest.$['xmlns:tools']) {
      manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }

    const usesSdk = Array.isArray(manifest['uses-sdk']) ? manifest['uses-sdk'] : [];
    const existing = usesSdk.find((entry) => entry?.$);
    if (existing) {
      const prevOverride = existing.$['tools:overrideLibrary'] || '';
      const libs = prevOverride
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (!libs.includes('com.google.ai.edge.aicore')) {
        libs.push('com.google.ai.edge.aicore');
      }
      existing.$['tools:overrideLibrary'] = libs.join(',');
    } else {
      usesSdk.push({
        $: {
          'tools:overrideLibrary': 'com.google.ai.edge.aicore',
        },
      });
    }
    manifest['uses-sdk'] = usesSdk;
    return mod;
  });

const withOnDeviceAi = (config) => {
  let next = withOnDeviceAiSources(config);
  next = withOnDeviceAiMainApplication(next);
  next = withOnDeviceAiDependencies(next);
  next = withAiCoreManifestOverride(next);
  return next;
};

module.exports = createRunOncePlugin(withOnDeviceAi, 'with-on-device-ai', '1.0.0');
