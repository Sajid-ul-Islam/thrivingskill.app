const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const files = [
  'src/screens/ProfileScreen.tsx',
  'src/screens/WorkshopsScreen.tsx',
  'src/screens/CoursesScreen.tsx',
  'src/screens/HomeScreen.tsx',
  'src/screens/CourseDetailScreen.tsx',
  'src/screens/LessonPlayerScreen.tsx',
  'src/screens/MyLearningScreen.tsx',
  'src/screens/YouTubeVideosScreen.tsx',
  ...fs.readdirSync(path.join(ROOT, 'src/components/modals')).filter(f => f.endsWith('.tsx')).map(f => 'src/components/modals/' + f),
  ...fs.readdirSync(path.join(ROOT, 'src/components/player')).filter(f => f.endsWith('.tsx')).map(f => 'src/components/player/' + f),
];

// Accurate tokenizer that tracks curly braces, quotes, and tags
function findTouchablesWithoutA11y(filePath) {
  const content = fs.readFileSync(path.join(ROOT, filePath), 'utf8');
  const lines = content.split('\n');
  const missing = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/<(TouchableOpacity|Pressable|SpringPressable)\b/);
    if (match) {
      const tag = match[1];
      // Gather lines until tag is closed
      let tagContent = '';
      let depth = 0;
      let j = i;
      let inString = false;
      let stringChar = '';
      let finished = false;

      for (; j < lines.length; j++) {
        const curLine = lines[j];
        for (let k = 0; k < curLine.length; k++) {
          const ch = curLine[k];
          const prev = k > 0 ? curLine[k - 1] : '';

          if (inString) {
            if (ch === stringChar && prev !== '\\') {
              inString = false;
            }
          } else {
            if (ch === '"' || ch === "'" || ch === '`') {
              inString = true;
              stringChar = ch;
            } else if (ch === '{') {
              depth++;
            } else if (ch === '}') {
              depth--;
            } else if (ch === '>' && depth === 0 && prev !== '=') {
              tagContent += curLine.substring(0, k + 1);
              finished = true;
              break;
            }
          }
        }
        if (finished) break;
        tagContent += curLine + '\n';
      }

      const hasRole = tagContent.includes('accessibilityRole');
      const hasLabel = tagContent.includes('accessibilityLabel');
      if (!hasRole && !hasLabel) {
        missing.push({ line: i + 1, tag });
      }
    }
  }

  return missing;
}

console.log('=== ACCURATE ACCESSIBILITY AUDIT ===\n');
let totalMissing = 0;
for (const f of files) {
  const missing = findTouchablesWithoutA11y(f);
  if (missing.length > 0) {
    totalMissing += missing.length;
    console.log(`${f} (${missing.length} missing):`);
    console.log('  Lines:', missing.map(m => m.line).join(', '));
  }
}
console.log(`\nTotal truly missing accessibility tags: ${totalMissing}`);
