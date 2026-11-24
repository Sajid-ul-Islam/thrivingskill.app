/**
 * Deep UI/UX & Bug Audit Script
 * Audits all screens and components for UI/UX defects, accessibility gaps,
 * theme contrast hazards, flex overflow risks, and brand rule compliance.
 */
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

function getTsxFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getTsxFiles(fullPath));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = getTsxFiles(srcDir);
console.log(`Auditing ${files.length} files across src/ ...`);

const issues = {
  hardcodedPureBlack: [],
  missingAccessibilityOnButtons: [],
  flexRowTruncationRisk: [],
  themeContrastRisk: [],
  imageErrorHandlingRisk: [],
};

files.forEach(filePath => {
  const relPath = path.relative(path.join(__dirname, '..'), filePath);
  const content = fs.readFileSync(filePath, 'utf8');

  // Skip test files, mock data, or config
  if (relPath.includes('__tests__') || relPath.includes('mocks') || relPath.includes('theme\\colors.ts')) {
    return;
  }

  // 1. Check for raw #000000 or #000 in color / backgroundColor (excluding shadowColor: '#000' which is iOS native shadow)
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    // Look for color: '#000' or backgroundColor: '#000' or border: '#000'
    if (
      /(color|backgroundColor|borderColor)\s*:\s*['"]#(000000|000)['"]/i.test(line) &&
      !line.includes('shadowColor')
    ) {
      issues.hardcodedPureBlack.push({ file: relPath, line: idx + 1, code: line.trim() });
    }

    // 2. Theme contrast hazard: background: '#fff' or '#ffffff' with hardcoded dark text without dark mode check
    if (
      /(backgroundColor\s*:\s*['"]#(fff|ffffff)['"])/i.test(line) &&
      !line.includes('isDark') &&
      !line.includes('colors.') &&
      !relPath.includes('theme')
    ) {
      // Check if this component uses useTheme
      if (content.includes('useTheme') && !line.includes('isDark ?')) {
        issues.themeContrastRisk.push({ file: relPath, line: idx + 1, code: line.trim() });
      }
    }
  });

  // 3. Check TouchableOpacity without accessibilityLabel / accessibilityRole
  const touchableMatches = content.match(/<TouchableOpacity[^>]*>/g);
  if (touchableMatches) {
    touchableMatches.forEach(tag => {
      // If it doesn't have accessibilityRole or accessibilityLabel, and isn't just an internal wrapper
      const hasA11y = tag.includes('accessibilityRole') || tag.includes('accessibilityLabel') || tag.includes('aria-label');
      if (!hasA11y) {
        // Exclude backdrop overlay touchables (e.g. activeOpacity={1} onPress={onClose} dismiss overlays)
        if (!tag.includes('activeOpacity={1}') && !tag.includes('styles.modalOverlay') && !tag.includes('styles.backdrop')) {
          issues.missingAccessibilityOnButtons.push({
            file: relPath,
            tag: tag.replace(/\s+/g, ' ').substring(0, 100),
          });
        }
      }
    });
  }

  // 4. Flex Row text truncation risk: <View style={{ flexDirection: 'row' }}> wrapping <Text numberOfLines...> without minWidth: 0 or flex: 1
  if (content.includes('flexDirection: \'row\'') && content.includes('numberOfLines')) {
    // Check if there are flex: 1 styles without minWidth: 0 in the StyleSheet
    const styleMatches = content.match(/{\s*flex:\s*1,\s*[^}]*}/g);
    if (styleMatches) {
      styleMatches.forEach(sm => {
        if (!sm.includes('minWidth: 0') && sm.includes('flexDirection')) {
          issues.flexRowTruncationRisk.push({ file: relPath, snippet: sm.replace(/\s+/g, ' ') });
        }
      });
    }
  }

  // 5. Image components using uri without getSafeImageSource or fallback
  const imgMatches = content.match(/<Image[^>]*source=\{\{\s*uri:[^}]*\}\}[^>]*>/g);
  if (imgMatches) {
    imgMatches.forEach(tag => {
      if (!tag.includes('onError') && !tag.includes('getSafeImageSource')) {
        issues.imageErrorHandlingRisk.push({ file: relPath, tag: tag.replace(/\s+/g, ' ').substring(0, 120) });
      }
    });
  }
});

console.log('\n=== AUDIT RESULTS ===');
console.log(`1. Hardcoded Pure Black (#000000): ${issues.hardcodedPureBlack.length} occurrences`);
issues.hardcodedPureBlack.slice(0, 10).forEach(i => console.log(`   - ${i.file}:${i.line} -> ${i.code}`));

console.log(`\n2. Theme Contrast Risks (Hardcoded #fff in themed components): ${issues.themeContrastRisk.length} occurrences`);
issues.themeContrastRisk.slice(0, 10).forEach(i => console.log(`   - ${i.file}:${i.line} -> ${i.code}`));

console.log(`\n3. Touchables missing Accessibility attributes: ${issues.missingAccessibilityOnButtons.length} occurrences`);
issues.missingAccessibilityOnButtons.slice(0, 10).forEach(i => console.log(`   - ${i.file} -> ${i.tag}`));

console.log(`\n4. Images with bare URI without safety wrapper / onError: ${issues.imageErrorHandlingRisk.length} occurrences`);
issues.imageErrorHandlingRisk.slice(0, 10).forEach(i => console.log(`   - ${i.file} -> ${i.tag}`));
