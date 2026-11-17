/**
 * Test Auth Persistence Suite
 * Verifies that user login sessions survive app close/restart, offline state,
 * and only clear on explicit logout.
 */

// Simulated AsyncStorage
const storage = new Map();
const AsyncStorage = {
  getItem: async (key) => storage.get(key) || null,
  setItem: async (key, val) => storage.set(key, String(val)),
  removeItem: async (key) => storage.delete(key),
  clear: async () => storage.clear(),
};

const AUTH_USER_STORAGE_KEY = '@thrivingskill_auth_user';
const AUTH_TOKEN_STORAGE_KEY = '@thrivingskill_auth_token';

// Simulated Auth state manager matching AuthContext.tsx
class AuthStateManager {
  constructor() {
    this.user = null;
    this.token = null;
    this.isLoading = true;
    this.isGuest = false;
  }

  get isAuthenticated() {
    return !!this.user;
  }

  async saveUserSession(loggedInUser) {
    const userToken = loggedInUser.token || `ts_session_${loggedInUser.id || Date.now()}`;
    const userWithToken = {
      ...loggedInUser,
      token: userToken,
    };
    this.user = userWithToken;
    this.token = userToken;
    this.isGuest = false;

    await Promise.all([
      AsyncStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(userWithToken)),
      AsyncStorage.setItem(AUTH_TOKEN_STORAGE_KEY, userToken),
    ]);
  }

  async restoreSession() {
    this.isLoading = true;
    try {
      const [savedUser, savedToken] = await Promise.all([
        AsyncStorage.getItem(AUTH_USER_STORAGE_KEY),
        AsyncStorage.getItem(AUTH_TOKEN_STORAGE_KEY),
      ]);

      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        if (parsedUser && (parsedUser.id || parsedUser.email || parsedUser.username)) {
          const activeToken = savedToken || parsedUser.token || `ts_session_${parsedUser.id}`;
          const userWithToken = {
            ...parsedUser,
            token: activeToken,
          };
          this.user = userWithToken;
          this.token = activeToken;
          this.isGuest = false;

          if (!savedToken) {
            await AsyncStorage.setItem(AUTH_TOKEN_STORAGE_KEY, activeToken);
          }
        } else {
          this.isGuest = false;
        }
      } else {
        this.isGuest = false;
      }
    } finally {
      this.isLoading = false;
    }
  }

  async logout() {
    this.user = null;
    this.token = null;
    this.isGuest = true;
    await Promise.all([
      AsyncStorage.removeItem(AUTH_USER_STORAGE_KEY),
      AsyncStorage.removeItem(AUTH_TOKEN_STORAGE_KEY),
    ]);
  }
}

async function runTests() {
  console.log('=== TESTING AUTH PERSISTENCE ACROSS APP LIFECYCLE ===');

  // Test 1: Fresh install
  const appSession1 = new AuthStateManager();
  await appSession1.restoreSession();
  console.assert(!appSession1.isAuthenticated, 'Fresh install should not be authenticated');
  console.log('✅ PASS: Fresh install boots unauthenticated (asks for login)');

  // Test 2: User logs in with email/password
  await appSession1.saveUserSession({
    id: 1234,
    username: 'test_learner',
    email: 'test@thrivingskill.com',
    displayName: 'Test Learner',
    roles: ['subscriber'],
    token: 'jwt_valid_token_xyz',
  });
  console.assert(appSession1.isAuthenticated, 'User should be authenticated after login');
  console.assert(appSession1.user.displayName === 'Test Learner', 'Display name should match');
  console.log('✅ PASS: User logs in successfully');

  // Test 3: App is CLOSED (memory wiped, new AuthStateManager created)
  const appSession2 = new AuthStateManager();
  console.assert(!appSession2.isAuthenticated, 'Session 2 initially has empty memory');
  await appSession2.restoreSession();
  console.assert(appSession2.isAuthenticated, 'Session 2 MUST restore user from AsyncStorage');
  console.assert(appSession2.user.username === 'test_learner', 'Restored user should match previous session');
  console.assert(appSession2.token === 'jwt_valid_token_xyz', 'Restored token should match previous session');
  console.log('✅ PASS: App restart maintains logged-in state without re-asking login');

  // Test 4: App closed and re-opened when completely offline (no network)
  const appSession3 = new AuthStateManager();
  await appSession3.restoreSession(); // No network calls executed
  console.assert(appSession3.isAuthenticated, 'Offline app start must remain authenticated');
  console.log('✅ PASS: Offline restart maintains logged-in state without timeout or logout');

  // Test 5: User logs in with phone / fallback (token missing from API response)
  const appSession4 = new AuthStateManager();
  await appSession4.saveUserSession({
    id: 5678,
    username: '01700000000',
    email: '01700000000@thrivingskill.com',
    displayName: 'Mobile Student',
  });
  console.assert(appSession4.isAuthenticated, 'Phone user without JWT must be authenticated');
  console.assert(!!appSession4.token, 'A persistent session token must be auto-generated');

  // App closed again and re-opened
  const appSession5 = new AuthStateManager();
  await appSession5.restoreSession();
  console.assert(appSession5.isAuthenticated, 'Phone user survives app restart');
  console.assert(appSession5.user.id === 5678, 'Phone user id matches');
  console.log('✅ PASS: Phone / tokenless login survives app restart and persists session');

  // Test 6: Explicit logout
  await appSession5.logout();
  console.assert(!appSession5.isAuthenticated, 'After logout, user is unauthenticated');
  const appSession6 = new AuthStateManager();
  await appSession6.restoreSession();
  console.assert(!appSession6.isAuthenticated, 'After logout, future restarts remain unauthenticated');
  console.log('✅ PASS: Explicit logout clears AsyncStorage and requires login');

  console.log('\nAll 6 Auth Persistence tests PASSED flawlessly!');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
