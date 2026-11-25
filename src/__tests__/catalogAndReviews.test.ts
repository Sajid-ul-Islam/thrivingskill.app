import { Env } from '../config/env';
import { CacheManager } from '../services/cache/cacheManager';
import { CoursesService } from '../services/api/coursesService';
import { HttpClient } from '../services/api/httpClient';
import type { Category, Course, Workshop } from '../types';

function makeJsonResponse(data: any, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (key: string) => (key.toLowerCase() === 'content-type' ? 'application/json' : null),
      forEach: (cb: (val: string, key: string) => void) => {
        cb('application/json', 'content-type');
      },
    },
    json: async () => data,
    text: async () => JSON.stringify(data),
  };
}

describe('CoursesService catalog hydration & live course reviews', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    HttpClient.setAuthToken(null);
    await CacheManager.clearAll();
    await Env.setEnvironment('staging');
  });

  it('returns empty arrays on cold cache with no bundled seed fallback', async () => {
    expect(CoursesService.getCachedCoursesSync()).toEqual([]);
    expect(CoursesService.getCachedCategoriesSync()).toEqual([]);
    expect(CoursesService.getCachedWorkshopsSync()).toEqual([]);
    await expect(CoursesService.getCachedCourses()).resolves.toEqual([]);
  });

  it('hydrates courses, categories, and workshops from AsyncStorage snapshot into sync cache', async () => {
    const sampleCourse = { id: '42', title: 'Supply Chain Live', priceBdt: 1500 } as Course;
    const sampleCategory = { id: 'cat-1', name: 'Operations', count: 1 } as Category;
    const sampleWorkshop = { id: 'ws-1', title: 'Live Ops Q&A' } as Workshop;

    await CacheManager.set('courses_full_catalog', [sampleCourse], 60000);
    await CacheManager.set('categories_list', [sampleCategory], 60000);
    await CacheManager.set('live_workshops_list', [sampleWorkshop], 60000);

    // Simulate memory eviction while AsyncStorage snapshot remains intact
    (CacheManager as any).memoryCache.clear();
    expect(CoursesService.getCachedCoursesSync()).toEqual([]);

    const hydrated = await CoursesService.hydrateCatalogCache();
    expect(hydrated.courses).toEqual([sampleCourse]);
    expect(hydrated.categories).toEqual([sampleCategory]);
    expect(hydrated.workshops).toEqual([sampleWorkshop]);

    expect(CoursesService.getCachedCoursesSync()).toEqual([sampleCourse]);
    expect(CoursesService.getCachedCategoriesSync()).toEqual([sampleCategory]);
    expect(CoursesService.getCachedWorkshopsSync()).toEqual([sampleWorkshop]);
  });

  it('parses LearnPress reviews, strips emails, omits unverified roles, and falls back to snapshot', async () => {
    const fetchMock = globalThis.fetch as jest.Mock;
    fetchMock.mockResolvedValueOnce(
      makeJsonResponse({
        data: {
          rated: 4.86,
          total: 2,
          reviews: {
            reviews: [
              {
                comment_id: 901,
                display_name: 'Nadia <b>Karim</b>',
                user_email: 'nadia@private.example.com',
                user_avatar: 'https://thrivingskill.com/avatar/nadia.jpg',
                rate: 5,
                comment_date_gmt: '2026-10-01 12:30:00',
                content: 'Very practical curriculum.',
              },
              {
                comment_id: 902,
                user_display_name: 'Tariq Hasan',
                user_email: 'tariq@private.example.com',
                rate: 4,
                date: '2026-10-02',
                title: 'Great examples',
              },
            ],
          },
        },
      })
    );

    const live = await CoursesService.getCourseReviews('501', true);
    expect(live.rating).toBe(4.9);
    expect(live.reviewsCount).toBe(2);
    expect(live.reviews).toHaveLength(2);
    expect(live.reviews[0]).toEqual({
      id: '901',
      userName: 'Nadia Karim',
      userAvatar: 'https://thrivingskill.com/avatar/nadia.jpg',
      rating: 5,
      date: '2026-10-01',
      comment: 'Very practical curriculum.',
    });
    expect(live.reviews[0].userRole).toBeUndefined();
    expect(JSON.stringify(live.reviews)).not.toContain('private.example.com');

    // Offline fallback uses the cached snapshot rather than throwing or fabricating data
    fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));
    const offlineFallback = await CoursesService.getCourseReviews('501', true);
    expect(offlineFallback).toEqual(live);
  });

  it('fails closed with empty review state when offline with no cached reviews', async () => {
    (globalThis.fetch as jest.Mock).mockRejectedValueOnce(new TypeError('Offline'));
    const result = await CoursesService.getCourseReviews('999', true);
    expect(result).toEqual({ reviews: [], rating: null, reviewsCount: null });
  });
});
