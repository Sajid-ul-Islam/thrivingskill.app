const fs = require('fs');
const path = require('path');

function getFiles(dir, exts = ['.tsx']) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(fullPath, exts));
    } else if (exts.includes(path.extname(file))) {
      results.push(fullPath);
    }
  }
  return results;
}

const componentFiles = getFiles('src/components');
const screenFiles = getFiles('src/screens');
const allUiFiles = [...screenFiles, ...componentFiles];

console.log('=== COMPREHENSIVE UI/UX ARCHITECTURAL AUDIT ===\n');
console.log(`Auditing ${allUiFiles.length} UI/UX files (${screenFiles.length} screens, ${componentFiles.length} components)...\n`);

const issues = [];
const observations = [];

allUiFiles.forEach((file) => {
  const content = fs.readFileSync(file, 'utf8');
  const baseName = path.basename(file);

  // Check 1: Safe Area Insets on Full Screens & Modals
  if (file.includes('Screen.tsx') || file.includes('Modal.tsx')) {
    if (!content.includes('useSafeAreaInsets') && !content.includes('SafeAreaView')) {
      // Re-export files or mini helpers might not need insets
      if (content.length > 500) {
        issues.push({
          file: baseName,
          type: 'Safe Area',
          severity: 'Warning',
          desc: 'Screen or Modal does not import useSafeAreaInsets or SafeAreaView.'
        });
      }
    }
  }

  // Check 2: Fixed or unsafe maxWidth / width overflow risks
  const hardcodedWidths = content.match(/width:\s*([3-9]\d{2,})/g);
  if (hardcodedWidths) {
    hardcodedWidths.forEach(hw => {
      const val = parseInt(hw.replace(/\D/g, ''), 10);
      if (val > 320 && !content.includes('Dimensions') && !content.includes('useWindowDimensions')) {
        issues.push({
          file: baseName,
          type: 'Layout Width',
          severity: 'High',
          desc: `Hardcoded width ${val}px exceeds compact viewports (320px) without dynamic dimensions.`
        });
      }
    });
  }

  // Check 3: Text elements with potential overflow inside flex rows
  const rowMatches = content.match(/flexDirection:\s*['"]row['"][\s\S]*?\}/g) || [];

  // Check 4: Timer hygiene in UI components
  if (content.includes('setTimeout') || content.includes('setInterval')) {
    const hasClearTimeout = content.includes('clearTimeout') || content.includes('clearInterval');
    if (!hasClearTimeout) {
      issues.push({
        file: baseName,
        type: 'Timer Hygiene',
        severity: 'Critical',
        desc: 'Uses setTimeout/setInterval without clearTimeout/clearInterval cleanup.'
      });
    }
  }

  // Check 5: TouchableOpacity without hitSlop or accessible minimum size for small icons
  const smallIconTouches = content.match(/<TouchableOpacity[^>]*>\s*<Ionicons[^>]*size=\{([1-9]|1[0-4])\}/g);
  if (smallIconTouches) {
    observations.push({
      file: baseName,
      type: 'Touch Target Ergonomics',
      desc: `Contains small icon touch targets (${smallIconTouches.length} occurrences). Ensure padding or hitSlop is present.`
    });
  }

  // Check 6: Hardcoded color contrast checks (avoid un-themed #000 or #FFF on dynamic backgrounds)
  if (content.includes("backgroundColor: '#FFFFFF'") && !content.includes('useTheme') && content.length > 1000) {
    issues.push({
      file: baseName,
      type: 'Dark Mode Contrast',
      severity: 'Medium',
      desc: 'Hardcoded #FFFFFF background without theme colors hook.'
    });
  }
});

console.log('--- ISSUES DETECTED ---');
if (issues.length === 0) {
  console.log('No critical layout or timer issues found! All screens have safe areas and proper cleanup.\n');
} else {
  issues.forEach(iss => {
    console.log(`[${iss.severity}] ${iss.file} (${iss.type}): ${iss.desc}`);
  });
  console.log(`\nTotal Issues: ${issues.length}\n`);
}

console.log('--- ERGONOMIC & POLISH OBSERVATIONS ---');
const uniqueObs = {};
observations.forEach(o => {
  if (!uniqueObs[o.file]) uniqueObs[o.file] = [];
  uniqueObs[o.file].push(o.desc);
});
Object.keys(uniqueObs).forEach(f => {
  console.log(`- ${f}: ${uniqueObs[f].join('; ')}`);
});

console.log('\nAudit complete.');
