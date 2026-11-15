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

const potentialIssues = [];

tsxFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const rel = path.relative(path.join(__dirname, '..'), file).replace(/\\/g, '/');

  // Find style definitions in StyleSheet.create
  const styleMatch = content.match(/const\s+styles\s*=\s*StyleSheet\.create\(\{([\s\S]*?)\}\);/);
  if (!styleMatch) return;
  const stylesBlock = styleMatch[1];

  // Parse style keys
  const styleDefs = {};
  const regex = /([a-zA-Z0-9_]+)\s*:\s*\{([^}]*)\}/g;
  let m;
  while ((m = regex.exec(stylesBlock)) !== null) {
    styleDefs[m[1]] = m[2];
  }

  // Find row styles
  const rowStyleNames = Object.keys(styleDefs).filter(key => {
    const def = styleDefs[key];
    return def.includes("flexDirection: 'row'") || def.includes('flexDirection: "row"');
  });

  // For each row style, let's see if it has space-between or contains text next to badges
  rowStyleNames.forEach(rowName => {
    const def = styleDefs[rowName];
    const isSpaceBetween = def.includes("justifyContent: 'space-between'") || def.includes('justifyContent: "space-between"');
    const hasGap = def.includes('gap:');

    // Find occurrences in JSX
    const usageRegex = new RegExp(`<View[^>]*style=\\{[^}]*styles\\.${rowName}[^}]*\\}[^>]*>([\\s\\S]*?)<\\/View>`, 'g');
    let u;
    while ((u = usageRegex.exec(content)) !== null) {
      const inner = u[1];
      // Check if inner has a Text tag
      if (inner.includes('<Text') && (inner.includes('Badge') || inner.includes('Pill') || inner.includes('Tag') || inner.includes('Button') || inner.includes('Pressable') || inner.includes('TouchableOpacity') || inner.includes('Ionicons'))) {
        // If it's space-between and no gap, or if text style has no flex or flexShrink
        if (isSpaceBetween && !hasGap) {
          potentialIssues.push({
            file: rel,
            style: rowName,
            issue: 'space-between row with Text and interactive/badge elements without gap',
            snippet: u[0].slice(0, 150).replace(/\n/g, ' ')
          });
        }
      }
    }
  });
});

console.log(`Audited row containers. Found ${potentialIssues.length} candidates:`);
potentialIssues.forEach(p => {
  console.log(`- [${p.file}] ${p.style}: ${p.issue}`);
});
