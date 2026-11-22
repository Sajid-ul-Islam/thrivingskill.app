/**
 * Package Plugin Script
 * Compresses backend-plugin/thriving-skills-mobile-bridge into a zip archive
 * ready for 1-click upload to WordPress Admin.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const pluginDir = path.resolve(__dirname, '../backend-plugin/thriving-skills-mobile-bridge');
const outputZip = path.resolve(__dirname, '../backend-plugin/thriving-skills-mobile-bridge.zip');

console.log('📦 Packaging Thriving Skills Mobile Bridge WordPress Plugin...');
console.log(`Source: ${pluginDir}`);
console.log(`Output: ${outputZip}`);

if (!fs.existsSync(pluginDir)) {
  console.error('❌ Error: Plugin source directory does not exist.');
  process.exit(1);
}

// Remove existing zip if present
if (fs.existsSync(outputZip)) {
  fs.unlinkSync(outputZip);
}

try {
  // Use Python script to guarantee POSIX forward slashes ('/') in the zip archive
  // This avoids Windows backslash directory separator bugs on Linux WordPress servers
  const pyScript = path.resolve(__dirname, 'package_plugin.py');
  execSync(`python "${pyScript}"`, { stdio: 'inherit' });
} catch (err) {
  console.error('❌ Packaging failed:', err.message);
  process.exit(1);
}
