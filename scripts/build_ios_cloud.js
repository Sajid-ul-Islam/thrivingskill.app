const { spawnSync } = require('child_process');

console.log('====================================================');
console.log('         LAUNCHING EAS CLOUD BUILD FOR iOS          ');
console.log('====================================================\n');

const res = spawnSync('npx', [
  'eas',
  'build',
  '--platform', 'ios',
  '--profile', 'preview',
  '--non-interactive',
  '--json'
], {
  cwd: 'D:\\Repo\\thrivingskill.app',
  stdio: 'inherit',
  shell: true
});

console.log('\nProcess exited with status:', res.status);
process.exit(res.status || 0);
