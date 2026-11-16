const fs = require('fs');
const path = require('path');

function getFiles(dir, exts = ['.tsx']) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
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

const files = [
  ...getFiles('src/screens'),
  ...getFiles('src/components')
];

console.log(`Scanning ${files.length} UI files for UI/UX improvement opportunities...\n`);

const findings = {
  smallTouchTargets: [],
  missingAccessibilityOnButtons: [],
  hardcodedColors: [],
  missingKeyboardConfigs: [],
  deadHandlers: []
};

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const relPath = path.relative(process.cwd(), file).replace(/\\/g, '/');

  // 1. Small touch targets without hitSlop
  // Look for width/height < 44 or styles with small dimensions without hitSlop
  const touchableMatches = content.match(/<(TouchableOpacity|Pressable|TouchableHighlight)[^>]*>/g) || [];
  touchableMatches.forEach(tag => {
    if (tag.includes('hitSlop')) return;
    // Check if inline style has small dimensions
    const smallDimMatch = tag.match(/(?:width|height|size):\s*([1-3][0-9]|[1-9])\b/);
    if (smallDimMatch) {
      findings.smallTouchTargets.push({
        file: relPath,
        snippet: tag.slice(0, 100),
        reason: `Dimension ${smallDimMatch[0]} < 44 without hitSlop`
      });
    }
  });

  // 2. Dead handlers
  const deadMatch = content.match(/onPress=\{\(\)\s*=>\s*\{\}\}/g);
  if (deadMatch) {
    findings.deadHandlers.push({
      file: relPath,
      count: deadMatch.length
    });
  }

  // 3. TextInput missing accessibility or keyboard configs
  const inputMatches = content.match(/<TextInput[^>]*>/g) || [];
  inputMatches.forEach(tag => {
    if (!tag.includes('accessibilityLabel') && !tag.includes('placeholder')) {
      findings.missingKeyboardConfigs.push({
        file: relPath,
        snippet: tag.slice(0, 80),
        reason: 'TextInput missing accessibilityLabel and placeholder'
      });
    }
  });

  // 4. Raw hardcoded dark/light colors that could break theme
  // e.g., color: '#000' or color: '#fff' or color: '#111' without theme reference
  const hardcodedColors = content.match(/(?:color|backgroundColor):\s*['"](#000000|#ffffff|#fff|#000|#333333|#111111|#222222|#666666|#999999)['"]/gi);
  if (hardcodedColors) {
    // Only flag if not using theme or in an un-themed style
    const suspicious = hardcodedColors.filter(c => {
      // White text on dark primary button is normal (#fff on brand)
      return true;
    });
    if (suspicious.length > 5) {
      findings.hardcodedColors.push({
        file: relPath,
        count: suspicious.length,
        examples: [...new Set(suspicious)].slice(0, 3)
      });
    }
  }
});

console.log('--- FINDINGS SUMMARY ---');
console.log(`Small Touch Targets (<44dp without hitSlop): ${findings.smallTouchTargets.length}`);
findings.smallTouchTargets.slice(0, 15).forEach(f => {
  console.log(`  - [${f.file}] ${f.reason}: ${f.snippet.replace(/\n/g, ' ')}`);
});

console.log(`\nDead Handlers (onPress={() => {}}): ${findings.deadHandlers.length}`);
findings.deadHandlers.forEach(f => {
  console.log(`  - [${f.file}]: ${f.count} dead handler(s)`);
});

console.log(`\nTextInput Polish Items: ${findings.missingKeyboardConfigs.length}`);
findings.missingKeyboardConfigs.forEach(f => {
  console.log(`  - [${f.file}]: ${f.reason}`);
});

console.log(`\nFiles with >5 Hardcoded Color Constants: ${findings.hardcodedColors.length}`);
findings.hardcodedColors.slice(0, 10).forEach(f => {
  console.log(`  - [${f.file}]: ${f.count} occurrences (${f.examples.join(', ')})`);
});
