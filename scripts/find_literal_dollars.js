const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      if (f !== 'node_modules' && f !== '.git' && f !== 'android' && f !== 'ios' && f !== '.expo' && f !== 'dist') {
        walkDir(dirPath, callback);
      }
    } else {
      callback(dirPath);
    }
  });
}

const found = [];

walkDir('./src', (filePath) => {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (
      line.includes('>${') ||
      line.includes('>$') ||
      line.includes('"$') ||
      line.includes("'$") ||
      line.includes('`$') ||
      /\$\d/.test(line) ||
      /\$\s*\{.*price/i.test(line) ||
      /\$\s*\{.*cost/i.test(line) ||
      /\$\s*\{.*fee/i.test(line) ||
      /\$\s*\{.*amount/i.test(line) ||
      /USD/i.test(line) ||
      /dollar/i.test(line)
    ) {
      found.push({ file: filePath, lineNum: idx + 1, line: line.trim() });
    }
  });
});

console.log(`Found ${found.length} potential currency occurrences in src:`);
found.forEach(item => {
  console.log(`${item.file}:${item.lineNum} -> ${item.line}`);
});
