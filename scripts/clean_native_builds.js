const fs = require('fs');
const path = require('path');

function removeDirForce(dirPath) {
  const longPath = '\\\\?\\' + path.resolve(dirPath);
  if (fs.existsSync(longPath)) {
    console.log('Removing:', dirPath);
    try {
      fs.rmSync(longPath, { recursive: true, force: true });
    } catch (e) {
      console.warn('Failed to remove:', dirPath, e.message);
    }
  }
}

// 1. Remove android/app/.cxx and android/app/build
removeDirForce('T:/android/app/.cxx');
removeDirForce('T:/android/app/build');
removeDirForce('T:/android/build');

// 2. Remove node_modules/*/android/build
const nm = 'T:/node_modules';
if (fs.existsSync(nm)) {
  const entries = fs.readdirSync(nm);
  for (const entry of entries) {
    if (entry.startsWith('@')) {
      const scopeDir = path.join(nm, entry);
      const scopedPkgs = fs.readdirSync(scopeDir);
      for (const sp of scopedPkgs) {
        const buildDir = path.join(scopeDir, sp, 'android', 'build');
        removeDirForce(buildDir);
      }
    } else {
      const buildDir = path.join(nm, entry, 'android', 'build');
      removeDirForce(buildDir);
    }
  }
}

console.log('Clean completed successfully.');
