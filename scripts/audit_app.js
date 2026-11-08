const fs = require('fs');
const path = require('path');

function getAllFiles(dir, exts = ['.ts', '.tsx']) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules') {
        results = results.concat(getAllFiles(fullPath, exts));
      }
    } else if (exts.some(ext => file.endsWith(ext))) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = getAllFiles('src').concat(['App.tsx']);
console.log('--- AUDITING', files.length, 'FILES ---');

const issues = [];

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split(/\r?\n/);

  // Check 1: Unresolved relative imports
  const importRegex = /from\s+['"](\.[^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const relPath = match[1];
    const dir = path.dirname(f);
    let resolved = path.resolve(dir, relPath);
    const exists =
      fs.existsSync(resolved + '.ts') ||
      fs.existsSync(resolved + '.tsx') ||
      fs.existsSync(resolved + '.js') ||
      fs.existsSync(resolved + '/index.ts') ||
      fs.existsSync(resolved + '/index.tsx') ||
      fs.existsSync(resolved);
    if (!exists) {
      issues.push({ file: f, line: 1, type: 'Broken Import', msg: `Cannot resolve import: ${relPath}` });
    }
  }

  // Check 1b: Unresolved relative requires (assets, images, scripts)
  const requireRegex = /require\(['"](\.[^'"]+)['"]\)/g;
  let reqMatch;
  while ((reqMatch = requireRegex.exec(content)) !== null) {
    const rel = reqMatch[1];
    const dir = path.dirname(f);
    const resolved = path.resolve(dir, rel);
    const exists =
      fs.existsSync(resolved + '.ts') ||
      fs.existsSync(resolved + '.tsx') ||
      fs.existsSync(resolved + '.js') ||
      fs.existsSync(resolved + '.png') ||
      fs.existsSync(resolved + '.jpg') ||
      fs.existsSync(resolved + '.jpeg') ||
      fs.existsSync(resolved);
    if (!exists) {
      issues.push({ file: f, line: 1, type: 'Broken Asset Require', msg: `Cannot resolve require('${rel}')` });
    }
  }

  // Check 2: Missing styles referenced in component
  if (f.endsWith('.tsx') && content.includes('StyleSheet.create')) {
    const styleDefIndex = content.indexOf('StyleSheet.create');
    const styleDefs = content.substring(styleDefIndex);

    lines.forEach((line, idx) => {
      if (idx > styleDefIndex / 40) return; // Skip checking inside style definition
      const styleMatches = line.match(/styles\.([a-zA-Z0-9_]+)/g);
      if (styleMatches) {
        styleMatches.forEach(sm => {
          const styleKey = sm.replace('styles.', '');
          // Check if key exists in styleDefs
          const keyRegex = new RegExp(`\\b${styleKey}\\s*:`);
          if (!keyRegex.test(styleDefs)) {
            issues.push({
              file: f,
              line: idx + 1,
              type: 'Missing Style Definition',
              msg: `styles.${styleKey} is used in JSX but not defined in StyleSheet.create`,
            });
          }
        });
      }
    });
  }

  // Check 3: Check for timer leaks
  if (content.includes('setInterval(') && !content.includes('clearInterval(')) {
    issues.push({ file: f, line: 1, type: 'Potential Timer Leak', msg: 'setInterval used without clearInterval' });
  }

  // Check 4: Check for Facebook / Google social remnants
  lines.forEach((line, idx) => {
    if (
      (line.includes('facebook') || line.includes('Facebook')) &&
      !line.includes('//') &&
      !f.includes('mockData') &&
      !f.includes('client requirement') &&
      !f.includes('client revetment')
    ) {
      issues.push({ file: f, line: idx + 1, type: 'Social Auth Remnant', msg: line.trim() });
    }
  });

  // Check 5: Check for unhandled JSON.parse
  lines.forEach((line, idx) => {
    if (line.includes('JSON.parse(') && !line.includes('try') && !content.includes('try {')) {
      issues.push({ file: f, line: idx + 1, type: 'Unsafe JSON.parse', msg: line.trim() });
    }
  });
});

console.log('Total issues discovered:', issues.length);
issues.forEach(i => console.log(`[${i.type}] ${path.relative('.', i.file)}:${i.line} -> ${i.msg}`));

if (issues.some(i => i.type === 'Broken Import' || i.type === 'Broken Asset Require' || i.type === 'Missing Style Definition')) {
  process.exit(1);
}
