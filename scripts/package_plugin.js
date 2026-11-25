/**
 * Package Plugin Script
 * Compresses backend-plugin/ts-mobile-bridge into a POSIX-compliant zip archive
 * ready for upload to WordPress Admin (ignored in git; also built by CI).
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const pluginDir = path.resolve(__dirname, '../backend-plugin/ts-mobile-bridge');
const outputZip = path.resolve(__dirname, '../backend-plugin/ts-mobile-bridge.zip');

console.log('Packaging TS Mobile Bridge WordPress Plugin...');
console.log(`Source: ${pluginDir}`);
console.log(`Output: ${outputZip}`);

if (!fs.existsSync(pluginDir)) {
  console.error('Error: Plugin source directory does not exist:', pluginDir);
  process.exit(1);
}

if (fs.existsSync(outputZip)) {
  fs.unlinkSync(outputZip);
}

try {
  const pyScript = path.resolve(__dirname, 'package_plugin.py');
  const pythonBin = process.platform === 'win32' ? 'python' : 'python3';
  execSync(`${pythonBin} "${pyScript}"`, { stdio: 'inherit' });
} catch (err) {
  console.error('Packaging failed:', err.message);
  process.exit(1);
}
