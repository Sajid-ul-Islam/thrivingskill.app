const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        results = results.concat(walk(full));
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(full);
    }
  });
  return results;
}

const files = walk('./src').concat(['./App.tsx']);
const dollarMatches = [];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    // Check if line contains $ that isn't just standard JS template literal without $ currency
    // For example: `${course.price}`, `$${`, `>${...}`, or literal $
    if (line.includes('$')) {
      // Check for price or currency patterns
      if (/(\$\{|`.*\$|\$.*\$|>\s*\$|\$\d|price|fee|cost|BDT|taka)/i.test(line)) {
        // filter out pure math LaTeX $$ or standard ID templates
        if (!line.includes('\\text') && !line.includes('Math.') && !line.includes('id:') && !line.includes('STORAGE_KEY') && !line.includes('userScope')) {
          dollarMatches.push({ file, lineNum: idx + 1, line: line.trim() });
        }
      }
    }
  });
});

console.log(`Found ${dollarMatches.length} currency/dollar candidates:`);
dollarMatches.forEach(m => console.log(`${m.file}:${m.lineNum} -> ${m.line}`));
