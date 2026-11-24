const fs = require('fs');
const path = require('path');

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('colors.primary')) return;

  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (
      line.includes('backgroundColor: colors.primary') ||
      line.includes('backgroundColor: colors.secondary') ||
      line.includes("backgroundColor: isDark ? '#FFFFFF'")
    ) {
      // Find the text elements inside
      for (let j = i; j < Math.min(lines.length, i + 20); j++) {
        const textMatch = lines[j].match(/<Text[^>]*style=\{?\[?styles\.([a-zA-Z0-9_]+)/);
        if (textMatch) {
          const styleName = textMatch[1];
          // Look for definition of styleName in content
          const styleRegex = new RegExp(`${styleName}:\\s*\\{[^}]*color:\\s*['\"]#(FFFFFF|fff|F8FAFC|F1F5F9)['\"]`, 'i');
          if (styleRegex.test(content)) {
            console.log(`[STYLE WHITE ON PRIMARY] ${filePath}`);
            console.log(`   Button (L${i + 1}): ${line.trim()}`);
            console.log(`   Text (L${j + 1}): ${lines[j].trim()}`);
            console.log(`   Style '${styleName}' defines white text!\n`);
          }
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
