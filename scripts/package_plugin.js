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
  // Use PowerShell Compress-Archive on Windows
  const psCommand = `powershell -NoProfile -Command "Compress-Archive -Path '${pluginDir}' -DestinationPath '${outputZip}' -Force"`;
  execSync(psCommand, { stdio: 'inherit' });

  if (fs.existsSync(outputZip)) {
    const stats = fs.statSync(outputZip);
    console.log(`✅ Successfully packaged plugin!`);
    console.log(`Size: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log(`Ready to install via WP Admin -> Plugins -> Add New -> Upload Plugin.`);
  } else {
    throw new Error('Zip file was not generated.');
  }
} catch (err) {
  console.error('❌ Packaging failed:', err.message);
  process.exit(1);
}
