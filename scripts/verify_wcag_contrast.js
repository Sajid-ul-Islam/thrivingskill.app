const fs = require('fs');
const path = require('path');

function hexToRgb(hex) {
  let clean = hex.replace('#', '');
  if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
  if (clean.length !== 6) return null;
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function luminance(r, g, b) {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function contrastRatio(hex1, hex2) {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return null;
  const l1 = luminance(...rgb1);
  const l2 = luminance(...rgb2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

// 1. Verify theme color tokens in src/theme/colors.ts mathematically
const colorsContent = fs.readFileSync('src/theme/colors.ts', 'utf8');
console.log('=== 1. VERIFYING THEME TOKEN CONTRAST (WCAG 2.1) ===');

function parseThemeBlock(blockName) {
  const match = colorsContent.match(new RegExp(`export const ${blockName} = \\{([\\s\\S]*?)\\};`));
  if (!match) return {};
  const obj = {};
  const lines = match[1].split('\n');
  lines.forEach(l => {
    const m = l.match(/(\w+):\s*'(#[0-9A-Fa-f]{3,6})'/);
    if (m) obj[m[1]] = m[2];
  });
  return obj;
}

const light = parseThemeBlock('lightColors');
const dark = parseThemeBlock('darkColors');

const themePairs = [
  ['text on background', 'text', 'background', 4.5],
  ['text on surfaceCard', 'text', 'surfaceCard', 4.5],
  ['textMuted on surfaceCard', 'textMuted', 'surfaceCard', 4.5],
  ['textLight on surfaceCard', 'textLight', 'surfaceCard', 4.5],
  ['primary on surfaceCard', 'primary', 'surfaceCard', 4.5],
  ['onPrimary on primary', 'onPrimary', 'primary', 4.5],
  ['onSecondary on secondary', 'onSecondary', 'secondary', 4.5],
  ['onAccent on accent (bold UI/CTA)', 'onAccent', 'accent', 3.0],
  ['onDanger on danger', 'onDanger', 'danger', 4.5],
  ['onGold on brandGold', 'onGold', 'brandGold', 4.5],
  ['tabActive on tabBarBg', 'tabActive', 'tabBarBg', 4.5],
  ['tabInactive on tabBarBg', 'tabInactive', 'tabBarBg', 4.5],
  ['badgeText on badgeBackground', 'badgeText', 'badgeBackground', 4.5],
];

let tokenFailures = 0;
for (const [modeName, theme] of [['LIGHT', light], ['DARK', dark]]) {
  console.log(`\n--- ${modeName} MODE ---`);
  themePairs.forEach(([label, fgKey, bgKey, minRatio]) => {
    const fg = theme[fgKey];
    const bg = theme[bgKey];
    const ratio = contrastRatio(fg, bg);
    const status = ratio >= minRatio ? 'PASS' : 'FAIL';
    if (status === 'FAIL') tokenFailures++;
    console.log(`[${status}] ${label}: ${fg} on ${bg} = ${ratio ? ratio.toFixed(2) : 'N/A'}:1 (min ${minRatio}:1)`);
  });
}

// 2. Scan all TSX files for remaining white text on theme primary/secondary/accent/danger or gold
function getFiles(dir) {
  let results = [];
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) results.push(...getFiles(p));
    else if (p.endsWith('.tsx')) results.push(p);
  }
  return results;
}

console.log('\n=== 2. SCANNING ALL TSX FILES FOR REMAINING CONTRAST BUGS ===');
const files = ['App.tsx', ...getFiles('src')];
const warnings = [];

files.forEach((file) => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    if (
      (line.includes('backgroundColor: colors.primary') ||
        line.includes('backgroundColor: colors.secondary') ||
        line.includes('backgroundColor: colors.accent') ||
        line.includes('? colors.primary :') ||
        line.includes('? [styles.modeSwitchActive, { backgroundColor: colors.primary }]')) &&
      !line.includes('primaryLight') &&
      !line.includes('secondaryLight') &&
      !line.includes('width:')
    ) {
      const block = lines.slice(idx, Math.min(lines.length, idx + 18)).join('\n');
      const stopAtClose = block.split('</TouchableOpacity>')[0].split('</SpringPressable>')[0];
      if (
        stopAtClose.includes('color="#FFFFFF"') ||
        stopAtClose.includes("color: '#FFFFFF'") ||
        stopAtClose.includes("color: isSelected ? '#FFFFFF'") ||
        stopAtClose.includes("color: isActive ? '#FFFFFF'")
      ) {
        warnings.push(`${file}:${lineNum}: Hardcoded #FFFFFF inside theme-filled button/badge`);
      }
    }

    // Check StyleSheet rule block specifically for white text on Gold/Amber
    if (
      line.includes("backgroundColor: '#FFB606'") ||
      line.includes("backgroundColor: '#F59E0B'") ||
      line.includes("backgroundColor: '#D97706'")
    ) {
      // Find enclosing style rule object up to closing brace }
      const rest = lines.slice(idx).join('\n').split('}')[0];
      if (rest.includes("color: '#FFFFFF'") || rest.includes('color="#FFFFFF"')) {
        warnings.push(`${file}:${lineNum}: White #FFFFFF text/icon inside Gold/Amber rule`);
      }
    }
  });
});

if (warnings.length > 0) {
  console.log(`\nFound ${warnings.length} warnings:`);
  warnings.forEach(w => console.log('  - ' + w));
} else {
  console.log('0 hardcoded white-on-theme or white-on-gold contrast warnings found!');
}

console.log(`\nSummary: Theme Token Failures = ${tokenFailures}, File Scan Warnings = ${warnings.length}`);
if (tokenFailures > 0 || warnings.length > 0) process.exit(1);
