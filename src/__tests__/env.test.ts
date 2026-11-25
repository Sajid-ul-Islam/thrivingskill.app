import AsyncStorage from '@react-native-async-storage/async-storage';
import { Env, ENVIRONMENTS, resolveFallbackUrl } from '../config/env';

describe('Env configuration', () => {
  const originalEnv = { ...process.env };
  const originalDev = (globalThis as Record<string, unknown>).__DEV__;

  beforeEach(async () => {
    process.env = { ...originalEnv };
    (globalThis as Record<string, unknown>).__DEV__ = true;
    await AsyncStorage.clear();
    await Env.setEnvironment('production');
  });

  afterAll(() => {
    process.env = originalEnv;
    (globalThis as Record<string, unknown>).__DEV__ = originalDev;
  });

  it('provides production and staging environment endpoints', () => {
    expect(ENVIRONMENTS.production.siteUrl).toBe('https://thrivingskill.com');
    expect(ENVIRONMENTS.production.apiUrl).toBe('https://thrivingskill.com/wp-json');
    expect(ENVIRONMENTS.staging.siteUrl).toBe('https://staging.thrivingskill.com');
    expect(ENVIRONMENTS.staging.apiUrl).toBe('https://staging.thrivingskill.com/wp-json');
  });

  it('never fails over from production to staging', async () => {
    await Env.setEnvironment('production');
    expect(Env.currentEnvironment).toBe('production');
    expect(Env.API_URL).toBe('https://thrivingskill.com/wp-json');
    expect(Env.fallbackEnvironment).toBeNull();
    expect(Env.FALLBACK_API_URL).toBe('');
    expect(Env.FALLBACK_SITE_URL).toBe('');

    // Even if someone mistakenly sets a staging fallback URL in production, reject it
    expect(
      resolveFallbackUrl(
        'https://staging.thrivingskill.com/wp-json',
        'production',
        ENVIRONMENTS.production.apiUrl
      )
    ).toBe('');
    expect(
      resolveFallbackUrl(
        'https://staging.thrivingskill.com',
        'production',
        ENVIRONMENTS.production.siteUrl
      )
    ).toBe('');

    // Valid production mirror is allowed
    expect(
      resolveFallbackUrl(
        'https://mirror.thrivingskill.com/wp-json',
        'production',
        ENVIRONMENTS.production.apiUrl
      )
    ).toBe('https://mirror.thrivingskill.com/wp-json');
  });

  it('switches environments in __DEV__, persists to AsyncStorage, and notifies subscribers', async () => {
    expect(Env.canSwitchEnvironment).toBe(true);
    const listener = jest.fn();
    const unsubscribe = Env.subscribeEnvironment(listener);

    await Env.setEnvironment('staging');
    expect(Env.currentEnvironment).toBe('staging');
    expect(Env.SITE_URL).toBe('https://staging.thrivingskill.com');
    expect(Env.API_URL).toBe('https://staging.thrivingskill.com/wp-json');
    expect(Env.WP_ADMIN_URL).toBe('https://staging.thrivingskill.com/wp-admin/');
    expect(Env.ACCOUNT_DELETION_URL).toBe('https://staging.thrivingskill.com/delete-account/');
    expect(Env.FALLBACK_SITE_URL).toBe('https://thrivingskill.com');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@thrivingskill_active_environment',
      'staging'
    );
    expect(listener).toHaveBeenCalledWith('staging');

    unsubscribe();
    await Env.toggleEnvironment();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('ignores invalid environment values and removes AI API keys from Env', async () => {
    await Env.setEnvironment('staging');
    await Env.setEnvironment('invalid' as any);
    expect(Env.currentEnvironment).toBe('staging');
    expect((Env as Record<string, unknown>).GEMINI_API_KEY).toBeUndefined();
    expect((Env as Record<string, unknown>).GOOGLE_API_KEY).toBeUndefined();
  });

  it('locks environment switching and ignores persisted staging overrides in production builds (__DEV__ === false)', async () => {
    (globalThis as Record<string, unknown>).__DEV__ = false;
    process.env.EXPO_PUBLIC_DEFAULT_ENVIRONMENT = 'production';
    process.env.EXPO_PUBLIC_API_URL = 'https://thrivingskill.com/wp-json';
    process.env.EXPO_PUBLIC_SITE_URL = 'https://thrivingskill.com';
    await AsyncStorage.setItem('@thrivingskill_active_environment', 'staging');

    let ProdEnv!: typeof Env;
    jest.isolateModules(() => {
      ProdEnv = require('../config/env').Env;
    });

    expect(ProdEnv.canSwitchEnvironment).toBe(false);
    const resolved = await ProdEnv.init();
    expect(resolved).toBe('production');
    expect(ProdEnv.currentEnvironment).toBe('production');
    expect(ProdEnv.API_URL).toBe('https://thrivingskill.com/wp-json');
    expect(ProdEnv.FALLBACK_API_URL).toBe('');

    // Runtime attempts to switch to staging are ignored in production builds
    await ProdEnv.setEnvironment('staging');
    await ProdEnv.toggleEnvironment();
    expect(ProdEnv.currentEnvironment).toBe('production');
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@thrivingskill_active_environment');
  });

  it('resolves staging URLs for preview profile and throws loudly when required vars are missing in non-production profiles', () => {
    process.env.EXPO_PUBLIC_DEFAULT_ENVIRONMENT = 'staging';
    process.env.EXPO_PUBLIC_API_URL = 'https://staging.thrivingskill.com/wp-json';
    process.env.EXPO_PUBLIC_SITE_URL = 'https://staging.thrivingskill.com';

    let PreviewEnv!: typeof Env;
    jest.isolateModules(() => {
      PreviewEnv = require('../config/env').Env;
    });

    const verified = PreviewEnv.assertRequiredVars({ allowTestBypass: false });
    expect(verified).toEqual({
      apiUrl: 'https://staging.thrivingskill.com/wp-json',
      siteUrl: 'https://staging.thrivingskill.com',
      environment: 'staging',
    });

    expect(() =>
      PreviewEnv.assertRequiredVars({
        allowTestBypass: false,
        overrides: { apiUrl: '' },
      })
    ).toThrow(/Missing required build-time environment variable\(s\): EXPO_PUBLIC_API_URL/);
  });
});
