/**
 * Canonical Release Version Synchronizer & Validator
 *
 * Single source of truth: package.json -> "version" (strict X.Y.Z semver)
 * Derived Android monotonic versionCode: major * 10000 + minor * 100 + patch
 *
 * Usage:
 *   node scripts/sync_version.js --check
 *   node scripts/sync_version.js --check --tag v1.4.0
 *   node scripts/sync_version.js --write
 *   node scripts/sync_version.js --write 1.5.0
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function parseSemver(raw) {
  const cleaned = String(raw || '')
    .trim()
    .replace(/^v/, '');
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(cleaned);
  if (!match) {
    throw new Error(`Invalid strict X.Y.Z semver version: "${raw}"`);
  }
  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3]);
  return {
    version: `${major}.${minor}.${patch}`,
    major,
    minor,
    patch,
    versionCode: major * 10000 + minor * 100 + patch,
  };
}

function compareSemver(a, b) {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (pa.major !== pb.major) return pa.major - pb.major;
  if (pa.minor !== pb.minor) return pa.minor - pb.minor;
  return pa.patch - pb.patch;
}

function readText(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

function writeText(relPath, content) {
  const fullPath = path.join(ROOT, relPath);
  const existing = fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8') : null;
  if (existing === content) return false;
  fs.writeFileSync(fullPath, content, 'utf8');
  return true;
}

function readJson(relPath) {
  return JSON.parse(readText(relPath));
}

function writeJson(relPath, obj) {
  const text = JSON.stringify(obj, null, 2) + '\n';
  return writeText(relPath, text);
}

function generateAppVersionTs(version, versionCode) {
  return `/**
 * Canonical Release Version Source of Truth
 *
 * Auto-synced from \`package.json\` by \`node scripts/sync_version.js --write\`.
 * Do not edit manually — CI runs \`npm run version:check\` to enforce parity across
 * \`package.json\`, \`app.json\`, runtime UI strings, companion plugin defaults, and docs.
 */
export const APP_VERSION = '${version}';
export const APP_VERSION_CODE = ${versionCode};
`;
}

function applyRegexReplacement(relPath, regex, replacement, label, writeMode, issues) {
  const fullPath = path.join(ROOT, relPath);
  if (!fs.existsSync(fullPath)) {
    issues.push(`${relPath}: missing file (${label})`);
    return;
  }
  const content = readText(relPath);
  if (!regex.test(content)) {
    issues.push(`${relPath}: expected pattern not found (${label})`);
    return;
  }
  const next = content.replace(regex, replacement);
  if (next !== content) {
    if (writeMode) {
      writeText(relPath, next);
      console.log(`Updated ${relPath} (${label})`);
    } else {
      issues.push(`${relPath}: version drift detected for ${label}`);
    }
  }
}

function walkTsFiles(dirRel) {
  const results = [];
  const startDir = path.join(ROOT, dirRel);
  if (!fs.existsSync(startDir)) return results;

  function visit(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '__tests__') continue;
        visit(full);
      } else if (/\.(ts|tsx)$/.test(entry.name)) {
        results.push(path.relative(ROOT, full).replace(/\\/g, '/'));
      }
    }
  }

  visit(startDir);
  return results;
}

function parseArgs(argv) {
  let mode = 'check';
  let explicitVersion = null;
  let tag = null;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--write') {
      mode = 'write';
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        explicitVersion = next;
        i++;
      }
    } else if (arg === '--check') {
      mode = 'check';
    } else if (arg === '--tag') {
      tag = argv[i + 1] || null;
      i++;
    }
  }

  return { mode, explicitVersion, tag };
}

function main() {
  const { mode, explicitVersion, tag } = parseArgs(process.argv.slice(2));
  const writeMode = mode === 'write';
  const pkg = readJson('package.json');

  const target = parseSemver(explicitVersion || pkg.version);
  const { version, versionCode } = target;
  const issues = [];

  if (writeMode && explicitVersion && pkg.version !== version) {
    pkg.version = version;
    writeJson('package.json', pkg);
    console.log(`Updated package.json -> ${version}`);
  }

  // 1. package-lock.json
  const lock = readJson('package-lock.json');
  let lockChanged = false;
  if (lock.version !== version) {
    if (writeMode) {
      lock.version = version;
      lockChanged = true;
    } else {
      issues.push(`package-lock.json: root version is "${lock.version}", expected "${version}"`);
    }
  }
  if (lock.packages && lock.packages[''] && lock.packages[''].version !== version) {
    if (writeMode) {
      lock.packages[''].version = version;
      lockChanged = true;
    } else {
      issues.push(
        `package-lock.json: packages[""].version is "${lock.packages[''].version}", expected "${version}"`
      );
    }
  }
  if (writeMode && lockChanged) {
    writeJson('package-lock.json', lock);
    console.log(`Updated package-lock.json -> ${version}`);
  }

  // 2. app.json
  const appJson = readJson('app.json');
  let appChanged = false;
  if (!appJson.expo || appJson.expo.version !== version) {
    if (writeMode) {
      appJson.expo.version = version;
      appChanged = true;
    } else {
      issues.push(`app.json: expo.version is "${appJson.expo?.version}", expected "${version}"`);
    }
  }
  if (!appJson.expo?.android || appJson.expo.android.versionCode !== versionCode) {
    if (writeMode) {
      appJson.expo.android = appJson.expo.android || {};
      appJson.expo.android.versionCode = versionCode;
      appChanged = true;
    } else {
      issues.push(
        `app.json: expo.android.versionCode is ${appJson.expo?.android?.versionCode}, expected ${versionCode}`
      );
    }
  }
  if (writeMode && appChanged) {
    writeJson('app.json', appJson);
    console.log(`Updated app.json -> ${version} (versionCode ${versionCode})`);
  }

  // 3. src/config/appVersion.ts
  const expectedAppVersionTs = generateAppVersionTs(version, versionCode);
  const currentAppVersionTs = fs.existsSync(path.join(ROOT, 'src/config/appVersion.ts'))
    ? readText('src/config/appVersion.ts')
    : '';
  if (currentAppVersionTs !== expectedAppVersionTs) {
    if (writeMode) {
      writeText('src/config/appVersion.ts', expectedAppVersionTs);
      console.log(`Updated src/config/appVersion.ts -> ${version} (${versionCode})`);
    } else {
      issues.push(
        `src/config/appVersion.ts does not match package.json (${version} / ${versionCode}). Run: npm run version:sync`
      );
    }
  }

  // 4. Documentation & Companion Plugin Defaults
  applyRegexReplacement(
    'README.md',
    /Release-v\d+\.\d+\.\d+-blue/g,
    `Release-v${version}-blue`,
    'Release badge',
    writeMode,
    issues
  );
  applyRegexReplacement(
    'README.md',
    /v1\.0\.0 through v\d+\.\d+\.\d+/g,
    `v1.0.0 through v${version}`,
    'Changelog range',
    writeMode,
    issues
  );
  applyRegexReplacement(
    'README.md',
    /### Recent Enhancements \(v\d+\.\d+\.\d+\)/g,
    `### Recent Enhancements (v${version})`,
    'Recent Enhancements heading',
    writeMode,
    issues
  );
  applyRegexReplacement(
    'docs/README.md',
    /v1\.0\.0 through v\d+\.\d+\.\d+/g,
    `v1.0.0 through v${version}`,
    'Docs README changelog range',
    writeMode,
    issues
  );
  applyRegexReplacement(
    'docs/TODO.md',
    /\*\*Current Version\*\*:\s*\d+\.\d+\.\d+/g,
    `**Current Version**: ${version}`,
    'TODO Current Version header',
    writeMode,
    issues
  );
  applyRegexReplacement(
    'docs/PRD.md',
    /\*\*Version\*\*:\s*\d+\.\d+\.\d+/g,
    `**Version**: ${version}`,
    'PRD Version header',
    writeMode,
    issues
  );
  applyRegexReplacement(
    'docs/TRD.md',
    /\*\*Document Version\*\*:\s*\d+\.\d+\.\d+/g,
    `**Document Version**: ${version}`,
    'TRD Document Version header',
    writeMode,
    issues
  );
  applyRegexReplacement(
    'docs/TRD.md',
    /`android\.versionCode:\s*\d+`\s*\(Release v\d+\.\d+\.\d+\)/g,
    `\`android.versionCode: ${versionCode}\` (Release v${version})`,
    'TRD monotonic versionCode',
    writeMode,
    issues
  );
  applyRegexReplacement(
    'docs/IMPLEMENTATION_STATUS.md',
    /\*\*App Release Version\*\*:\s*\d+\.\d+\.\d+\s*\(Build \d+\)/g,
    `**App Release Version**: ${version} (Build ${versionCode})`,
    'IMPLEMENTATION_STATUS release version',
    writeMode,
    issues
  );
  applyRegexReplacement(
    'backend-plugin/ts-mobile-bridge/README.md',
    /React Native \/ Expo v\d+\.\d+\.\d+/g,
    `React Native / Expo v${version}`,
    'Companion README app version',
    writeMode,
    issues
  );
  applyRegexReplacement(
    'backend-plugin/ts-mobile-bridge/README.md',
    /App version gates \(`\d+\.\d+\.\d+`\)/g,
    `App version gates (\`${version}\`)`,
    'Companion README /config gate example',
    writeMode,
    issues
  );
  applyRegexReplacement(
    'backend-plugin/ts-mobile-bridge/ts-mobile-bridge.php',
    /get_option\('tsmb_latest_app_version',\s*'\d+\.\d+\.\d+'\)/g,
    `get_option('tsmb_latest_app_version', '${version}')`,
    'PHP default tsmb_latest_app_version',
    writeMode,
    issues
  );
  applyRegexReplacement(
    'backend-plugin/ts-mobile-bridge/ts-mobile-bridge.php',
    /\$\_POST\['latest_version'\]\s*\?\?\s*'\d+\.\d+\.\d+'/g,
    `$_POST['latest_version'] ?? '${version}'`,
    'PHP admin save default',
    writeMode,
    issues
  );
  applyRegexReplacement(
    'backend-plugin/ts-mobile-bridge/ts-mobile-bridge.php',
    /name="latest_version"([^\r\n]*?)placeholder="\d+\.\d+\.\d+"/g,
    `name="latest_version"$1placeholder="${version}"`,
    'PHP admin placeholder',
    writeMode,
    issues
  );

  // 5. CHANGELOG top shipped version guard (must not exceed canonical package.json version)
  const changelog = readText('docs/CHANGELOG.md');
  const shippedMatch = changelog.match(/^## \[(\d+\.\d+\.\d+)\]/m);
  if (!shippedMatch) {
    issues.push('docs/CHANGELOG.md: missing released `## [X.Y.Z]` heading');
  } else if (compareSemver(shippedMatch[1], version) !== 0) {
    issues.push(
      `docs/CHANGELOG.md: top released section is [${shippedMatch[1]}], expected [${version}] (use ## [Unreleased] for post-release work)`
    );
  }

  // 6. Guard against hardcoded app version strings in runtime app code outside src/config/appVersion.ts
  for (const rel of walkTsFiles('src')) {
    if (rel === 'src/config/appVersion.ts') continue;
    const text = readText(rel);
    const lines = text.split(/\r?\n/);
    lines.forEach((line, idx) => {
      if (/v?1\.4\.\d+/.test(line) && !line.trim().startsWith('//') && !line.trim().startsWith('*')) {
        issues.push(`${rel}:${idx + 1}: hardcoded version literal found ("${line.trim()}") — use APP_VERSION from src/config/appVersion`);
      }
    });
  }

  // 7. Optional tag validation for EAS/Release CI (vX.Y.Z must equal package.json version)
  const rawTag = tag || (process.env.GITHUB_REF_TYPE === 'tag' ? process.env.GITHUB_REF_NAME : null);
  if (rawTag && /^v?\d+\.\d+\.\d+$/.test(rawTag.trim())) {
    const parsedTag = parseSemver(rawTag);
    if (parsedTag.version !== version) {
      issues.push(`Git release tag "${rawTag}" does not match package.json version "${version}"`);
    }
  }

  if (issues.length > 0) {
    console.error('\n❌ Version synchronization check failed:');
    for (const issue of issues) {
      console.error(`  - ${issue}`);
    }
    console.error('\nRun `npm run version:sync` (or inspect docs/CHANGELOG.md) to resolve.\n');
    process.exit(1);
  }

  console.log(`✅ Version check passed: canonical release ${version} (Build ${versionCode})`);
}

main();
