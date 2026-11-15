const fs = require('fs');
const path = require('path');

function getAllFiles(dir, exts = ['.tsx']) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'android' && file !== 'ios') {
        results = results.concat(getAllFiles(fullPath, exts));
      }
    } else {
      if (exts.includes(path.extname(file))) {
        results.push(fullPath);
      }
    }
  });
  return results;
}

const srcDir = path.join(__dirname, '..', 'src');
const tsxFiles = getAllFiles(srcDir);

console.log(`Scanning ${tsxFiles.length} TSX files in src/...`);

const findings = [];

tsxFiles.forEach(filePath => {
  const content = fs.readFileSync(filePath, 'utf8');
  const relPath = path.relative(path.join(__dirname, '..'), filePath).replace(/\\/g, '/');

  // 1. Check for negative margin that could cause overlap
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (/(margin(Top|Bottom|Left|Right)?|margin)\s*:\s*-[1-9]/.test(line)) {
      // allow harmless negative margins like -1 or border overlaps if intentional
      if (!line.includes('// allow-negative') && !line.includes('-1') && !line.includes('-2')) {
        findings.push({
          file: relPath,
          line: idx + 1,
          type: 'Negative Margin',
          detail: line.trim()
        });
      }
    }

    // 2. Check for literal $ followed by digits in JSX (untranslated dollar signs)
    if (/>\s*\$\s*\{?[0-9]/.test(line) || />\s*\$[0-9]/.test(line) || /['"`]\$[0-9]/.test(line)) {
      if (!line.includes('// allow-dollar')) {
        findings.push({
          file: relPath,
          line: idx + 1,
          type: 'Literal Dollar Sign',
          detail: line.trim()
        });
      }
    }
  });

  // 3. Check for Streak / Badge / Chip components inside rows without flexShrink: 0
  // or text next to them without flex: 1 / minWidth: 0
  const streakMatches = content.match(/Streak|Badge|Pill|Chip|Tag/g);
  if (streakMatches) {
    // Check if streak or badge has position: absolute without safe bounding
    lines.forEach((line, idx) => {
      if (/position\s*:\s*['"]absolute['"]/.test(line)) {
        const surrounding = lines.slice(Math.max(0, idx - 5), Math.min(lines.length, idx + 15)).join('\n');
        if (/streak|rank|badge|pill/i.test(surrounding) && !/pointerEvents|zIndex|badgeRow|right:\s*[0-9]+,\s*top:\s*[0-9]+/.test(surrounding)) {
          findings.push({
            file: relPath,
            line: idx + 1,
            type: 'Potential Absolute Collision',
            detail: line.trim()
          });
        }
      }
    });
  }
});

console.log(`Found ${findings.length} potential items:`);
findings.forEach(f => {
  console.log(`[${f.type}] ${f.file}:${f.line} -> ${f.detail}`);
});
