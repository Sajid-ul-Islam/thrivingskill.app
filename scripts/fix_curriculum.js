const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '..', 'src', 'components', 'player', 'CurriculumAccordion.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

// Normalize line endings to \n temporarily
const isCRLF = content.includes('\r\n');
let lines = content.split(/\r?\n/);

let newLines = [];
for (let i = 0; i < lines.length; i++) {
  let line = lines[i];

  if (line.includes('isEnrolled: boolean;')) {
    newLines.push(line);
    newLines.push('  isAdmin?: boolean;');
    continue;
  }

  if (line.includes('isEnrolled,') && lines[i-1]?.includes('modules,')) {
    newLines.push(line);
    newLines.push('  isAdmin = false,');
    continue;
  }

  newLines.push(line);
}

let result = newLines.join(isCRLF ? '\r\n' : '\n');
fs.writeFileSync(targetPath, result, 'utf8');
console.log('Fixed CurriculumAccordion.tsx');
