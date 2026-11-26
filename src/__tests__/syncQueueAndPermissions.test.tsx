import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SyncQueueManager,
  computeSyncIdempotencyKey,
  validateSyncPayload,
} from '../services/offline/syncQueue';
import { HttpClient } from '../services/api/httpClient';
import { isUserAdmin } from '../context/AuthContext';
import { getJwtRemainingMs, isJwtExpiringSoon } from '../services/api/authService';
import { TelemetryService } from '../services/telemetry/telemetryService';

function encodeJwt(payload: Record<string, any>): string {
  const b64 = (obj: Record<string, any>) =>
    btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}.sig`;
}

describe('SyncQueue isolation, payload validation, idempotency, admin roles & recommendation metrics', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    SyncQueueManager.setUserScope('_u_1');
    TelemetryService.resetRecommendationMetrics();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('captures user scope per operation and halts HTTP replay cleanly on mid-flight account switch', async () => {
    await SyncQueueManager.enqueue('COMPLETE_LESSON', '/learnpress/v1/lessons/finish', {
      id: 101,
      course_id: 10,
    });
    await SyncQueueManager.enqueue('COMPLETE_COURSE', '/learnpress/v1/courses/finish', {
      id: 10,
    });

    let signalFirstStarted!: () => void;
    const firstStarted = new Promise<void>((resolve) => {
      signalFirstStarted = resolve;
    });
    let resolveFirstCall!: () => void;
    const firstCallGate = new Promise<void>((resolve) => {
      resolveFirstCall = resolve;
    });

    const postSpy = jest
      .spyOn(HttpClient, 'post')
      .mockImplementationOnce(async () => {
        signalFirstStarted();
        await firstCallGate;
        return { status: 'success' };
      })
      .mockResolvedValue({ status: 'success' });

    const processPromise = SyncQueueManager.processQueue(false, '_u_1');

    // Wait until mutation #1 HTTP request is genuinely in flight, then switch account
    await firstStarted;
    SyncQueueManager.setUserScope('_u_2');
    await SyncQueueManager.enqueue(
      'ENROLL_COURSE',
      '/learnpress/v1/courses/enroll',
      { id: 99 },
      'POST',
      5,
      '_u_2'
    );

    resolveFirstCall();
    const res = await processPromise;

    // Only mutation #1 fired before switch; mutation #2 remains un-sent in _u_1 and _u_2 stays intact
    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(res.succeeded).toBe(1);

    const remainingU1 = await SyncQueueManager.getPendingMutations('_u_1');
    const pendingU2 = await SyncQueueManager.getPendingMutations('_u_2');

    expect(remainingU1).toHaveLength(1);
    expect(remainingU1[0].action).toBe('COMPLETE_COURSE');
    expect(pendingU2).toHaveLength(1);
    expect(pendingU2[0].payload.id).toBe(99);
  });

  it('prevents concurrent processors against the same scope and preserves enqueues made mid-flight', async () => {
    await SyncQueueManager.enqueue('COMPLETE_LESSON', '/learnpress/v1/lessons/finish', {
      id: 201,
      course_id: 20,
    });

    let signalHttpStarted!: () => void;
    const httpStarted = new Promise<void>((resolve) => {
      signalHttpStarted = resolve;
    });
    let releaseHttp!: () => void;
    const gate = new Promise<void>((resolve) => {
      releaseHttp = resolve;
    });

    const postSpy = jest.spyOn(HttpClient, 'post').mockImplementationOnce(async () => {
      signalHttpStarted();
      await gate;
      return { status: 'success' };
    });

    const p1 = SyncQueueManager.processQueue(false, '_u_1');
    const p2 = SyncQueueManager.processQueue(false, '_u_1');

    // Enqueue another item while processor is mid-flight over the network
    await httpStarted;
    await SyncQueueManager.enqueue(
      'COMPLETE_COURSE',
      '/learnpress/v1/courses/finish',
      { id: 20 },
      'POST',
      5,
      '_u_1'
    );

    releaseHttp();
    const [r1, r2] = await Promise.all([p1, p2]);

    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(r1).toEqual(r2);

    const surviving = await SyncQueueManager.getPendingMutations('_u_1');
    expect(surviving).toHaveLength(1);
    expect(surviving[0].action).toBe('COMPLETE_COURSE');
  });

  it('validates payloads, computes deterministic idempotency keys, and forwards X-Idempotency-Key', async () => {
    await expect(
      SyncQueueManager.enqueue('COMPLETE_LESSON', '/learnpress/v1/lessons/finish', { course_id: 1 })
    ).rejects.toThrow('Invalid payload');

    const badProfile = validateSyncPayload('UPDATE_PROFILE', '/wp/v2/users/me', {
      first_name: 'Sadia',
      roles: ['administrator'],
    });
    expect(badProfile.valid).toBe(false);

    const k1 = computeSyncIdempotencyKey(
      'COMPLETE_LESSON',
      '/learnpress/v1/lessons/finish',
      'POST',
      {
        course_id: 1,
        id: 2,
      }
    );
    const k2 = computeSyncIdempotencyKey(
      'COMPLETE_LESSON',
      '/learnpress/v1/lessons/finish',
      'POST',
      {
        id: 2,
        course_id: 1,
      }
    );
    expect(k1).toBe(k2);

    const first = await SyncQueueManager.enqueue(
      'COMPLETE_LESSON',
      '/learnpress/v1/lessons/finish',
      {
        course_id: 1,
        id: 2,
      }
    );
    const deduped = await SyncQueueManager.enqueue(
      'COMPLETE_LESSON',
      '/learnpress/v1/lessons/finish',
      {
        id: 2,
        course_id: 1,
      }
    );
    expect(deduped.id).toBe(first.id);
    expect(deduped.idempotencyKey).toBe(k1);

    const postSpy = jest.spyOn(HttpClient, 'post').mockResolvedValue({ status: 'success' });
    await SyncQueueManager.processQueue(false, '_u_1');

    expect(postSpy).toHaveBeenCalledWith(
      '/learnpress/v1/lessons/finish',
      { course_id: 1, id: 2 },
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Idempotency-Key': k1,
        }),
      })
    );
  });

  it('restricts isUserAdmin strictly to WordPress administrator/admin roles (not editor/instructor)', () => {
    expect(
      isUserAdmin({
        id: 1,
        username: 'a',
        email: 'a@t.com',
        displayName: 'A',
        roles: ['administrator'],
      })
    ).toBe(true);
    expect(
      isUserAdmin({ id: 2, username: 'b', email: 'b@t.com', displayName: 'B', roles: ['editor'] })
    ).toBe(false);
    expect(
      isUserAdmin({
        id: 3,
        username: 'c',
        email: 'c@t.com',
        displayName: 'C',
        roles: ['instructor'],
      })
    ).toBe(false);
    expect(
      isUserAdmin({
        id: 4,
        username: 'd',
        email: 'd@t.com',
        displayName: 'D',
        roles: ['subscriber'],
      })
    ).toBe(false);
  });

  it('measures JWT remaining TTL and recommendation engagement/conversion attribution', () => {
    const now = 1_700_000_000_000;
    const soonToken = encodeJwt({ exp: Math.floor((now + 5 * 60 * 1000) / 1000) });
    const freshToken = encodeJwt({ exp: Math.floor((now + 24 * 60 * 60 * 1000) / 1000) });

    expect(getJwtRemainingMs(soonToken, now)).toBe(5 * 60 * 1000);
    expect(isJwtExpiringSoon(soonToken, 15 * 60 * 1000, now)).toBe(true);
    expect(isJwtExpiringSoon(freshToken, 15 * 60 * 1000, now)).toBe(false);

    TelemetryService.trackRecommendationImpression(['c1', 'c2'], 'home');
    TelemetryService.trackRecommendationImpression(['c1', 'c2'], 'home'); // deduped
    TelemetryService.trackRecommendationClick('c1', 'ai', 0);
    expect(TelemetryService.trackRecommendationConversion('c99', 'enroll')).toBe(false);
    expect(TelemetryService.trackRecommendationConversion('c1', 'enroll')).toBe(true);

    expect(TelemetryService.getRecommendationMetrics()).toEqual({
      impressions: 1,
      clicks: 1,
      conversions: 1,
      ctr: 1,
      conversionRate: 1,
    });
  });
});
