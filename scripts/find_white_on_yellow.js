const fs = require('fs');
const path = require('path');

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('colors.primary')) return;

  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Find TouchableOpacity / SpringPressable / Pressable / View with backgroundColor: colors.primary
    if (
      line.includes('backgroundColor: colors.primary') ||
      line.includes('backgroundColor: colors.secondary') ||
      line.includes("backgroundColor: isDark ? '#FFFFFF'")
    ) {
      // Find the closing tag or up to 20 lines
      for (let j = i; j < Math.min(lines.length, i + 25); j++) {
        const childLine = lines[j];
        if (
          childLine.includes("color: '#FFFFFF'") ||
          childLine.includes('color: "#FFFFFF"') ||
          childLine.includes("color='#FFFFFF'") ||
          childLine.includes('color="#FFFFFF"')
        ) {
          console.log(`[WHITE ON PRIMARY] ${filePath}:${j + 1}`);
          console.log(`   Button (${i + 1}): ${line.trim()}`);
          console.log(`   Text/Icon (${j + 1}): ${childLine.trim()}\n`);
        }
      }
    }
  }
}

function walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory() && f.name !== 'node_modules' && f.name !== '.git') {
      walk(p);
    } else if (f.isFile() && (f.name.endsWith('.tsx') || f.name.endsWith('.ts'))) {
      checkFile(p);
    }
  }
}

walk(path.join(__dirname, '..', 'src'));
