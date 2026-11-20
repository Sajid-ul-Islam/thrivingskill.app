/**
 * Verification Script: SecureStorageService & Hardware Token Protection
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

console.log('====================================================');
console.log('VERIFYING SECURE STORAGE IMPLEMENTATION');
console.log('====================================================');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passed++;
  } else {
    console.error(`[FAIL] ${message}`);
    failed++;
  }
}

// 1. Check package.json has expo-secure-store
const pkgPath = path.join(root, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
assert(!!pkg.dependencies['expo-secure-store'], 'expo-secure-store must be in package.json dependencies');

// 2. Check app.json has expo-secure-store plugin
const appJsonPath = path.join(root, 'app.json');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
assert(
  appJson.expo.plugins && appJson.expo.plugins.includes('expo-secure-store'),
  'expo-secure-store plugin must be registered in app.json'
);

// 3. Check secureStorage.ts file existence and contract
const secStoragePath = path.join(root, 'src', 'services', 'storage', 'secureStorage.ts');
assert(fs.existsSync(secStoragePath), 'secureStorage.ts must exist');

const secContent = fs.readFileSync(secStoragePath, 'utf8');
assert(secContent.includes('SecureStore.setItemAsync'), 'Must invoke SecureStore.setItemAsync');
assert(secContent.includes('SecureStore.getItemAsync'), 'Must invoke SecureStore.getItemAsync');
assert(secContent.includes('SecureStore.deleteItemAsync'), 'Must invoke SecureStore.deleteItemAsync');
assert(secContent.includes('keychainAccessible: SecureStore.WHEN_UNLOCKED'), 'Must enforce keychain accessibility WHEN_UNLOCKED');
assert(secContent.includes('AsyncStorage.removeItem'), 'Must purge legacy plain-text token upon migration');

// 4. Check HttpClient integration
const httpPath = path.join(root, 'src', 'services', 'api', 'httpClient.ts');
const httpContent = fs.readFileSync(httpPath, 'utf8');
assert(httpContent.includes('SecureStorageService.getAuthToken()'), 'HttpClient must retrieve token from SecureStorageService');

// 5. Check AuthContext integration
const authPath = path.join(root, 'src', 'context', 'AuthContext.tsx');
const authContent = fs.readFileSync(authPath, 'utf8');
assert(authContent.includes('SecureStorageService.getAuthToken()'), 'AuthContext must load token via SecureStorageService');
assert(authContent.includes('SecureStorageService.setAuthToken(userToken)'), 'AuthContext must save token via SecureStorageService');
assert(authContent.includes('SecureStorageService.removeAuthToken()'), 'AuthContext must clear token via SecureStorageService on logout');

console.log('\n====================================================');
console.log(`Summary: ${passed} passed, ${failed} failed`);
console.log('====================================================');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
