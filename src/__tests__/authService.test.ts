import { Platform } from 'react-native';
import { AuthService } from '../services/api/authService';
import { ApiError, HttpClient } from '../services/api/httpClient';
import { Env } from '../config/env';

function safeParseBody(raw: string): Record<string, any> {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function mockJsonResponse(data: any, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (k: string) => (k.toLowerCase() === 'content-type' ? 'application/json' : null),
      forEach: () => {},
    },
    json: async () => data,
    text: async () => JSON.stringify(data),
  };
}

describe('AuthService (with mocked fetch)', () => {
  const originalPlatformOS = Platform.OS;

  beforeEach(async () => {
    jest.clearAllMocks();
    (Platform as { OS: string }).OS = originalPlatformOS;
    HttpClient.setAuthToken(null);
    await Env.setEnvironment('staging');
  });

  afterAll(() => {
    (Platform as { OS: string }).OS = originalPlatformOS;
  });

  it('logs in via LearnPress JWT token endpoint and fetches WordPress user profile', async () => {
    const fetchMock = globalThis.fetch as jest.Mock;
    fetchMock
      .mockResolvedValueOnce(
        mockJsonResponse({
          token: 'jwt_real_token_123',
          user_id: 42,
          user_email: 'learner@staging.thrivingskill.com',
          user_display_name: 'Sadia Rahman',
        })
      )
      .mockResolvedValueOnce(
        mockJsonResponse({
          id: 42,
          slug: 'sadia',
          email: 'sadia@staging.thrivingskill.com',
          name: 'Sadia Rahman',
          roles: ['subscriber'],
          avatar_urls: { '96': 'https://staging.thrivingskill.com/avatar.png' },
        })
      );

    const user = await AuthService.login('sadia@staging.thrivingskill.com', 'SecurePassword123!');

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://staging.thrivingskill.com/wp-json/learnpress/v1/token'
    );
    expect(user.token).toBe('jwt_real_token_123');
    expect(user.displayName).toBe('Sadia Rahman');
    expect(user.roles).toEqual(['subscriber']);
    expect(await HttpClient.getAuthToken()).toBe('jwt_real_token_123');
  });

  it('never creates a fake web session or tsl_web_dev_jwt token on network failure for login or register', async () => {
    (Platform as { OS: string }).OS = 'web';
    const fetchMock = globalThis.fetch as jest.Mock;
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(AuthService.login('user@example.com', 'Password1234!')).rejects.toMatchObject({
      name: 'ApiError',
      code: 'NETWORK_ERROR',
      status: 0,
    });
    expect(await HttpClient.getAuthToken()).toBeNull();

    await expect(
      AuthService.register({
        username: 'webuser',
        email: 'webuser@example.com',
        password: 'VeryLongPassword1234!',
      })
    ).rejects.toMatchObject({
      name: 'ApiError',
      code: 'NETWORK_ERROR',
      status: 0,
    });
    expect(await HttpClient.getAuthToken()).toBeNull();
  });

  it('rejects 4xx and 5xx responses cleanly for login and register without signing in', async () => {
    const fetchMock = globalThis.fetch as jest.Mock;

    // 4xx on login
    fetchMock.mockResolvedValueOnce(
      mockJsonResponse(
        {
          code: '[lp_jwt_auth] incorrect_password',
          message: 'Wrong password',
          data: { status: 403 },
        },
        403
      )
    );
    await expect(AuthService.login('user@example.com', 'wrong')).rejects.toBeInstanceOf(ApiError);
    expect(await HttpClient.getAuthToken()).toBeNull();

    // 5xx on login
    fetchMock.mockResolvedValueOnce(
      mockJsonResponse(
        { code: 'server_error', message: 'Internal Server Error', data: { status: 500 } },
        500
      )
    );
    await expect(AuthService.login('user@example.com', 'pass')).rejects.toMatchObject({
      status: 500,
    });

    // 4xx on register (Companion returns 400 email-exists — must not mask or create session)
    fetchMock.mockResolvedValueOnce(
      mockJsonResponse(
        { code: 'email-exists', message: 'Email already registered', data: { status: 400 } },
        400
      )
    );
    await expect(
      AuthService.register({
        username: 'dupuser',
        email: 'dup@example.com',
        password: 'VeryLongPassword1234!',
      })
    ).rejects.toMatchObject({ status: 400, message: 'Email already registered' });

    // 5xx on register
    fetchMock.mockResolvedValueOnce(
      mockJsonResponse({ code: 'bad_gateway', message: 'Bad Gateway', data: { status: 502 } }, 502)
    );
    await expect(
      AuthService.register({
        username: 'srvuser',
        email: 'srv@example.com',
        password: 'VeryLongPassword1234!',
      })
    ).rejects.toMatchObject({ status: 502 });
  });

  it('registers via Companion endpoint first and falls back to LearnPress register endpoint on 404', async () => {
    const fetchMock = globalThis.fetch as jest.Mock;
    fetchMock
      .mockResolvedValueOnce(
        mockJsonResponse(
          { code: 'rest_no_route', message: 'Not found', data: { status: 404 } },
          404
        )
      )
      .mockResolvedValueOnce(mockJsonResponse({ user_id: 88, status: 200 }, 200));

    const res = await AuthService.register({
      username: 'tanvir2026',
      email: 'tanvir@example.com',
      password: 'VeryLongPassword1234!',
      phone: '01712345678',
      name: 'Tanvir Ahmed',
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toContain('/thrivingskill/v1/register');
    expect(fetchMock.mock.calls[1][0]).toContain('/learnpress/v1/token/register');

    const sentPayload = safeParseBody(fetchMock.mock.calls[1][1].body);
    expect(sentPayload.first_name).toBe('Tanvir');
    expect(sentPayload.last_name).toBe('Ahmed');
    expect(sentPayload.billing_phone).toBe('01712345678');
    expect(res).toEqual({ user_id: 88, status: 200 });
  });

  it('validates existing token and returns false for invalid or missing tokens', async () => {
    expect(await AuthService.validateToken()).toBe(false);

    (globalThis.fetch as jest.Mock).mockResolvedValueOnce(
      mockJsonResponse({ data: { status: 200 } }, 200)
    );
    expect(await AuthService.validateToken('valid_tok')).toBe(true);

    (globalThis.fetch as jest.Mock).mockResolvedValueOnce(
      mockJsonResponse(
        { code: 'lp_jwt_auth_invalid_token', message: 'Invalid', data: { status: 403 } },
        403
      )
    );
    expect(await AuthService.validateToken('bad_tok')).toBe(false);
  });

  it('dispatches and verifies phone OTP via AuthService without accepting fake offline codes', async () => {
    const fetchMock = globalThis.fetch as jest.Mock;
    fetchMock.mockResolvedValueOnce(
      mockJsonResponse({ success: true, message: 'OTP dispatched' }, 200)
    );

    const dispatchRes = await AuthService.sendPhoneOtp('01712 345-678');
    expect(dispatchRes.success).toBe(true);
    expect(safeParseBody(fetchMock.mock.calls[0][1].body)).toEqual({ phone: '01712345678' });

    fetchMock.mockResolvedValueOnce(
      mockJsonResponse(
        { code: 'invalid_otp', message: 'OTP expired or incorrect', data: { status: 403 } },
        403
      )
    );

    await expect(AuthService.verifyPhoneOtp('01712345678', '123456')).rejects.toThrow(
      'OTP expired or incorrect'
    );
  });

  it('detects invalid/expired reset keys in confirmPasswordReset', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      url: 'https://staging.thrivingskill.com/login/?error=invalidkey',
    });

    await expect(
      AuthService.confirmPasswordReset('tanvir', 'badkey', 'NewPass123456!')
    ).rejects.toThrow('invalid or has expired');
  });
});
