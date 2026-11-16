const fs = require('fs');
const path = require('path');

function getFiles(dir) {
  let res = [];
  if (!fs.existsSync(dir)) return res;
  fs.readdirSync(dir).forEach(f => {
    const fp = path.join(dir, f);
    if (fs.statSync(fp).isDirectory()) res.push(...getFiles(fp));
    else if (f.endsWith('.tsx')) res.push(fp);
  });
  return res;
}

const files = [...getFiles('src/screens'), ...getFiles('src/components')];
console.log('Checking for dark mode contrast bugs (hardcoded dark text #102F53, #000, #111 on dynamic surfaces)...');

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  const rel = path.relative(process.cwd(), f).replace(/\\/g, '/');
  lines.forEach((l, idx) => {
    // Check for hardcoded dark text color
    if (/(?:color:\s*['"](#102F53|#000000|#000|#1E293B|#0F172A)['"])/i.test(l)) {
      // Exclude if it's on a known light badge, gold background, or inside a ternary (isDark ? ... : '#102F53')
      if (!l.includes('isDark') && !l.includes('brandGold') && !l.includes('gold') && !l.includes('badge') && !l.includes('white')) {
        console.log(`${rel}:${idx + 1}: ${l.trim()}`);
      }
    }
  });
});
