import { Env } from '../config/env';
import { HttpClient, ApiError, sanitizeWpMessage } from '../services/api/httpClient';

function makeJsonResponse(data: any, status = 200, headers: Record<string, string> = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (key: string) => {
        const found = Object.entries({ 'content-type': 'application/json', ...headers }).find(
          ([k]) => k.toLowerCase() === key.toLowerCase()
        );
        return found ? found[1] : null;
      },
      forEach: (cb: (val: string, key: string) => void) => {
        Object.entries({ 'content-type': 'application/json', ...headers }).forEach(([k, v]) =>
          cb(v, k)
        );
      },
    },
    json: async () => data,
    text: async () => JSON.stringify(data),
  };
}

describe('HttpClient', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    HttpClient.setAuthToken(null);
    HttpClient.setConnectivityListener(null);
    await Env.setEnvironment('staging');
  });

  it('sanitizes WordPress HTML and entities from error messages', () => {
    const cleaned = sanitizeWpMessage(
      '<strong>Error:</strong> Invalid &amp; missing &quot;field&quot;&#039;s value&#8211;retry.'
    );
    expect(cleaned).toBe(`Error: Invalid & missing "field"'s value–retry.`);
  });

  it('deduplicates concurrent identical GET requests via inFlightRequests', async () => {
    let resolveFetch!: (val: any) => void;
    (globalThis.fetch as jest.Mock).mockImplementationOnce(
      () =>
        new Promise((res) => {
          resolveFetch = res;
        })
    );

    const p1 = HttpClient.get('/learnpress/v1/courses', { per_page: 5 }, { skipAuth: true });
    const p2 = HttpClient.get('/learnpress/v1/courses', { per_page: 5 }, { skipAuth: true });

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);

    resolveFetch(makeJsonResponse([{ id: 101, name: 'AI Mastery' }]));
    const [r1, r2] = await Promise.all([p1, p2]);

    expect(r1).toEqual([{ id: 101, name: 'AI Mastery' }]);
    expect(r2).toEqual([{ id: 101, name: 'AI Mastery' }]);

    // After resolution, a fresh GET triggers a new fetch call
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce(
      makeJsonResponse([{ id: 102, name: 'Excel' }])
    );
    await HttpClient.get('/learnpress/v1/courses', { per_page: 5 }, { skipAuth: true });
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it('retries failed GET requests on transient network errors and succeeds on retry', async () => {
    const fetchMock = globalThis.fetch as jest.Mock;
    fetchMock
      .mockRejectedValueOnce(new TypeError('Network request failed'))
      .mockResolvedValueOnce(makeJsonResponse({ ok: true }));

    const result = await HttpClient.get('/learnpress/v1/courses', undefined, {
      skipAuth: true,
      retries: 1,
      allowFallback: false,
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ ok: true });
  });

  it('aborts and throws ApiError 408 REQUEST_TIMEOUT when request exceeds timeoutMs', async () => {
    const listener = jest.fn();
    HttpClient.setConnectivityListener(listener);

    (globalThis.fetch as jest.Mock).mockImplementation((_url: string, init: RequestInit) => {
      return new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => {
          const abortErr = new Error('The operation was aborted');
          abortErr.name = 'AbortError';
          reject(abortErr);
        });
      });
    });

    await expect(
      HttpClient.get('/learnpress/v1/courses', undefined, {
        skipAuth: true,
        retries: 0,
        timeoutMs: 25,
        allowFallback: false,
      })
    ).rejects.toMatchObject({
      name: 'ApiError',
      status: 408,
      code: 'REQUEST_TIMEOUT',
    });

    expect(listener).toHaveBeenCalledWith(false, 'Connection timed out.');
  });

  it('never fails over to staging when production fails with 502 or network error', async () => {
    await Env.setEnvironment('production');
    const fetchMock = globalThis.fetch as jest.Mock;
    fetchMock.mockResolvedValueOnce(makeJsonResponse({ message: 'Bad Gateway' }, 502));

    await expect(
      HttpClient.get('/learnpress/v1/courses', undefined, {
        skipAuth: true,
        retries: 0,
        allowFallback: true,
      })
    ).rejects.toMatchObject({ status: 502 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://thrivingskill.com/wp-json/learnpress/v1/courses'
    );
  });

  it('falls back to Env.FALLBACK_API_URL when staging primary host returns 502', async () => {
    const fetchMock = globalThis.fetch as jest.Mock;
    fetchMock
      .mockResolvedValueOnce(makeJsonResponse({ message: 'Bad Gateway' }, 502))
      .mockResolvedValueOnce(makeJsonResponse({ courses: ['from-fallback'] }, 200));

    const res = await HttpClient.get('/learnpress/v1/courses', undefined, {
      skipAuth: true,
      retries: 0,
      allowFallback: true,
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toContain(Env.FALLBACK_API_URL);
    expect(res).toEqual({ courses: ['from-fallback'] });
  });

  it('attaches Bearer token when skipAuth is false and parses WordPress ApiError cleanly', async () => {
    HttpClient.setAuthToken('jwt-abc-123');
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce(
      makeJsonResponse(
        {
          code: '[lp_jwt_auth] invalid_username',
          message: '<strong>Error:</strong> Invalid credentials',
          data: { status: 403 },
        },
        403
      )
    );

    await expect(
      HttpClient.post('/learnpress/v1/token', { username: 'bad' })
    ).rejects.toBeInstanceOf(ApiError);

    const calledHeaders = (globalThis.fetch as jest.Mock).mock.calls[0][1].headers;
    expect(calledHeaders.Authorization).toBe('Bearer jwt-abc-123');
  });

  it('extracts WordPress pagination metadata and lowercased headers in getWithMeta', async () => {
    const fetchMock = globalThis.fetch as jest.Mock;
    fetchMock.mockResolvedValueOnce(
      makeJsonResponse([{ id: 10 }, { id: 11 }], 200, {
        'X-WP-Total': '42',
        'X-WP-TotalPages': '5',
      })
    );

    const result = await HttpClient.getWithMeta<{ id: number }[]>(
      '/learnpress/v1/courses',
      { page: 1, per_page: 10 },
      { skipAuth: true }
    );

    expect(result.status).toBe(200);
    expect(result.totalCount).toBe(42);
    expect(result.totalPages).toBe(5);
    expect(result.headers['x-wp-total']).toBe('42');
    expect(result.data).toEqual([{ id: 10 }, { id: 11 }]);
  });

  it('deduplicates concurrent identical GET getWithMeta requests and fails over cleanly', async () => {
    let resolvePrimary!: (res: any) => void;
    const primaryPromise = new Promise((resolve) => {
      resolvePrimary = resolve;
    });
    const fetchMock = globalThis.fetch as jest.Mock;
    fetchMock.mockReturnValueOnce(primaryPromise);

    const reqA = HttpClient.getWithMeta('/learnpress/v1/courses', { page: 2 }, { skipAuth: true });
    const reqB = HttpClient.getWithMeta('/learnpress/v1/courses', { page: 2 }, { skipAuth: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    resolvePrimary(
      makeJsonResponse([{ id: 22 }], 200, { 'X-WP-Total': '1', 'X-WP-TotalPages': '1' })
    );
    const [resA, resB] = await Promise.all([reqA, reqB]);
    expect(resA).toEqual(resB);

    fetchMock
      .mockResolvedValueOnce(makeJsonResponse({ message: 'Bad Gateway' }, 502))
      .mockResolvedValueOnce(
        makeJsonResponse([{ id: 99 }], 200, { 'X-WP-Total': '9', 'X-WP-TotalPages': '3' })
      );

    const fallbackMeta = await HttpClient.getWithMeta(
      '/learnpress/v1/courses',
      { page: 3 },
      {
        skipAuth: true,
        retries: 0,
        allowFallback: true,
      }
    );
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fallbackMeta.totalPages).toBe(3);
    expect(fallbackMeta.data).toEqual([{ id: 99 }]);
  });

  it('invokes central 401 listener and clears token for authenticated requests, but skips unauthenticated or suppressed calls', async () => {
    const fetchMock = globalThis.fetch as jest.Mock;
    const unauthorizedListener = jest.fn();
    HttpClient.setUnauthorizedListener(unauthorizedListener);

    // 1. Authenticated request returning HTTP 401 clears token and notifies central handler
    HttpClient.setAuthToken('expired-jwt-token');
    fetchMock.mockResolvedValueOnce(
      makeJsonResponse(
        { code: 'rest_not_logged_in', message: 'Expired', data: { status: 401 } },
        401
      )
    );

    await expect(
      HttpClient.get('/thrivingskill/v1/lessons/101', undefined, { retries: 0 })
    ).rejects.toMatchObject({ status: 401, code: 'rest_not_logged_in' });

    expect(unauthorizedListener).toHaveBeenCalledTimes(1);
    expect(unauthorizedListener).toHaveBeenCalledWith({
      endpoint: '/thrivingskill/v1/lessons/101',
      status: 401,
      code: 'rest_not_logged_in',
    });
    expect(await HttpClient.getAuthToken()).toBeNull();

    // 2. skipAuth: true (e.g., login failure) returning 401 must NOT trigger session-expired listener
    fetchMock.mockResolvedValueOnce(
      makeJsonResponse({ code: 'invalid_credentials', message: 'Wrong login' }, 401)
    );
    await expect(
      HttpClient.post('/learnpress/v1/token', { username: 'a', password: 'b' }, { skipAuth: true })
    ).rejects.toMatchObject({ status: 401 });
    expect(unauthorizedListener).toHaveBeenCalledTimes(1);

    // 3. Guest call with no token returning 401 must NOT trigger listener
    fetchMock.mockResolvedValueOnce(
      makeJsonResponse({ code: 'rest_not_logged_in', message: 'Auth required' }, 401)
    );
    await expect(
      HttpClient.get('/thrivingskill/v1/lessons/102', undefined, { retries: 0 })
    ).rejects.toMatchObject({ status: 401 });
    expect(unauthorizedListener).toHaveBeenCalledTimes(1);

    // 4. suppressUnauthorizedHandler: true suppresses listener even with active token
    HttpClient.setAuthToken('probe-token');
    fetchMock.mockResolvedValueOnce(makeJsonResponse({ code: 'rest_not_logged_in' }, 401));
    await expect(
      HttpClient.get('/wp/v2/users/me', undefined, {
        retries: 0,
        suppressUnauthorizedHandler: true,
      })
    ).rejects.toMatchObject({ status: 401 });
    expect(unauthorizedListener).toHaveBeenCalledTimes(1);

    HttpClient.setUnauthorizedListener(null);
  });
});
