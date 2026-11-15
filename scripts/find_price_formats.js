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
const priceMatches = [];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    // Check if line formats a price or contains a currency sign or toFixed
    if (/\.toFixed\(|\bprice\b.*[\$৳]|[\$৳].*\bprice\b|['"`]\s*[\$৳]|>\s*[\$৳]|>\s*\$\{|priceBdt/i.test(line)) {
      priceMatches.push({ file, lineNum: idx + 1, line: line.trim() });
    }
  });
});

console.log(`Found ${priceMatches.length} price format occurrences:`);
priceMatches.forEach(m => console.log(`${m.file}:${m.lineNum} -> ${m.line}`));
