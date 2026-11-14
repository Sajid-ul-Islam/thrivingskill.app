const { execSync } = require('child_process');
const fs = require('fs');

console.log('--- 1. TYPECHECK ---');
try {
  const out = execSync('npm run typecheck', { encoding: 'utf8' });
  console.log('TYPECHECK: SUCCESS');
} catch (err) {
  console.log('TYPECHECK FAILED:\n', err.stdout || err.message);
}

console.log('\n--- 2. AUDIT APP ---');
try {
  const out = execSync('node scripts/audit_app.js', { encoding: 'utf8' });
  console.log(out);
} catch (err) {
  console.log('AUDIT APP FAILED:\n', err.stdout || err.message);
}

console.log('\n--- 3. COMPREHENSIVE UI/UX & LAWS ---');
try {
  const out1 = execSync('node scripts/comprehensive_ui_ux_audit.js', { encoding: 'utf8' });
  console.log(out1);
  const out2 = execSync('node scripts/verify_ui_ux_laws.js', { encoding: 'utf8' });
  console.log(out2);
} catch (err) {
  console.log('UI/UX AUDIT FAILED:\n', err.stdout || err.message);
}

console.log('\n--- 4. WCAG & LAYOUT ---');
try {
  const out1 = execSync('node scripts/verify_wcag_contrast.js', { encoding: 'utf8' });
  console.log(out1);
  const out2 = execSync('node scripts/verify_layout_and_safe_areas.js', { encoding: 'utf8' });
  console.log(out2);
} catch (err) {
  console.log('WCAG/LAYOUT FAILED:\n', err.stdout || err.message);
}
