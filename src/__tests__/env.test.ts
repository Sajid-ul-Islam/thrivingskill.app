import AsyncStorage from '@react-native-async-storage/async-storage';
import { Env, ENVIRONMENTS } from '../config/env';

describe('Env configuration', () => {
  beforeEach(async () => {
    await Env.setEnvironment('production');
  });

  it('provides production and staging environment endpoints', () => {
    expect(ENVIRONMENTS.production.siteUrl).toBe('https://thrivingskill.com');
    expect(ENVIRONMENTS.production.apiUrl).toBe('https://thrivingskill.com/wp-json');
    expect(ENVIRONMENTS.staging.siteUrl).toBe('https://staging.thrivingskill.com');
    expect(ENVIRONMENTS.staging.apiUrl).toBe('https://staging.thrivingskill.com/wp-json');
  });

  it('switches environments at runtime, persists to AsyncStorage, and exposes fallback URLs', async () => {
    expect(Env.currentEnvironment).toBe('production');
    expect(Env.API_URL).toBe('https://thrivingskill.com/wp-json');
    expect(Env.FALLBACK_API_URL).toBe('https://staging.thrivingskill.com/wp-json');

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
  });

  it('toggles between environments and notifies active subscribers', async () => {
    const listener = jest.fn();
    const unsubscribe = Env.subscribeEnvironment(listener);

    const next = await Env.toggleEnvironment();
    expect(next).toBe('staging');
    expect(listener).toHaveBeenCalledWith('staging');

    unsubscribe();
    await Env.toggleEnvironment();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('ignores invalid environment values', async () => {
    await Env.setEnvironment('staging');
    await Env.setEnvironment('invalid' as any);
    expect(Env.currentEnvironment).toBe('staging');
  });
});
