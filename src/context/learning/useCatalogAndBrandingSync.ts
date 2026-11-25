import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Env } from '../../config/env';
import { Category, Course, Workshop, WpPost } from '../../types';
import { CoursesService } from '../../services/api/coursesService';
import {
  BrandingService,
  SiteBrandingInfo,
  DynamicCarouselSlide,
  PartnerLogoItem,
  HomeFeatureCardItem,
  SpecialBundlePosterItem,
  StudentTestimonialItem,
  DEFAULT_SITE_BRANDING,
  DEFAULT_CURATED_SLIDES,
  DEFAULT_PARTNER_LOGOS,
  DEFAULT_HOME_FEATURES,
  DEFAULT_SPECIAL_BUNDLES,
  DEFAULT_STUDENT_TESTIMONIALS,
} from '../../services/api/brandingService';
import { CompanionService, AppRemoteConfig } from '../../services/api/companionService';
import {
  fetchWpCourses,
  fetchWpCategories,
  fetchWpPosts,
  fetchWpCourseDetail,
  fetchWpLiveWorkshops,
} from '../../services/wordpressApi';
import { INITIAL_CANONICAL_CATEGORIES, areCoursesEqual, areDataEqual } from './learningCatalogData';

export function useCatalogAndBrandingSync(
  isOffline: boolean,
  syncUserEnrollments: () => Promise<string[] | null>
) {
  const [courses, setCourses] = useState<Course[]>(() => CoursesService.getCachedCoursesSync());
  const [totalCourseCount, setTotalCourseCount] = useState<number>(() => {
    const initial = CoursesService.getCachedCoursesSync();
    return initial && initial.length > 0 ? initial.length : 0;
  });
  const [categories, setCategories] = useState<Category[]>(() => {
    const initial = CoursesService.getCachedCategoriesSync();
    if (initial && initial.length > 0) return initial;
    return INITIAL_CANONICAL_CATEGORIES;
  });
  const [workshops, setWorkshops] = useState<Workshop[]>(() =>
    CoursesService.getCachedWorkshopsSync()
  );
  const [blogPosts, setBlogPosts] = useState<WpPost[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState<boolean>(
    () => CoursesService.getCachedCoursesSync().length === 0
  );
  const [isBackgroundSyncing, setIsBackgroundSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [coursesError, setCoursesError] = useState<string | null>(null);

  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevOfflineRef = useRef<boolean>(isOffline);
  const coursesRef = useRef<Course[]>(courses);
  coursesRef.current = courses;

  const [siteBranding, setSiteBranding] = useState<SiteBrandingInfo>(DEFAULT_SITE_BRANDING);
  const [banners, setBanners] = useState<DynamicCarouselSlide[]>(DEFAULT_CURATED_SLIDES);
  const [partnerLogos, setPartnerLogos] = useState<PartnerLogoItem[]>(DEFAULT_PARTNER_LOGOS);
  const [homeFeatures, setHomeFeatures] = useState<HomeFeatureCardItem[]>(DEFAULT_HOME_FEATURES);
  const [specialBundles, setSpecialBundles] =
    useState<SpecialBundlePosterItem[]>(DEFAULT_SPECIAL_BUNDLES);
  const [studentTestimonials, setStudentTestimonials] = useState<StudentTestimonialItem[]>(
    DEFAULT_STUDENT_TESTIMONIALS
  );
  const [appRemoteConfig, setAppRemoteConfig] = useState<AppRemoteConfig | null>(null);
  const [isBrandingLoading, setIsBrandingLoading] = useState<boolean>(false);

  const refreshBranding = useCallback(async (forceRefresh: boolean = false) => {
    try {
      setIsBrandingLoading(true);
      const [brandingInfo, bannerSlides, remoteConfig, partners, features, bundles, testimonials] =
        await Promise.all([
          BrandingService.getSiteBranding(forceRefresh),
          BrandingService.getDynamicBanners(forceRefresh),
          CompanionService.fetchAppConfig(forceRefresh),
          BrandingService.getPartnerLogos(forceRefresh),
          BrandingService.getHomeFeatureCards(forceRefresh),
          BrandingService.getSpecialBundles(forceRefresh),
          BrandingService.getStudentTestimonials(forceRefresh),
        ]);
      setSiteBranding(brandingInfo);
      if (bannerSlides && bannerSlides.length > 0) setBanners(bannerSlides);
      if (partners && partners.length > 0) setPartnerLogos(partners);
      if (features && features.length > 0) setHomeFeatures(features);
      if (bundles && bundles.length > 0) setSpecialBundles(bundles);
      if (testimonials && testimonials.length > 0) setStudentTestimonials(testimonials);
      if (remoteConfig) setAppRemoteConfig(remoteConfig);
    } catch (err) {
      if (Env.DEBUG_API) {
        console.warn('[LearningContext] Failed to refresh branding:', err);
      }
    } finally {
      setIsBrandingLoading(false);
    }
  }, []);

  const loadWordPressData = useCallback(
    async (forceRefresh: boolean = false, silent: boolean = false) => {
      setCourses((current) => {
        if (current.length === 0 && !silent) {
          setIsLoadingCourses(true);
        } else {
          setIsBackgroundSyncing(true);
        }
        return current;
      });
      setCoursesError(null);

      try {
        const [wpCourses, wpCategories, wpWorkshops, wpPosts] = await Promise.allSettled([
          fetchWpCourses({ fetchAll: true, forceRefresh }),
          fetchWpCategories({ forceRefresh }),
          fetchWpLiveWorkshops({ forceRefresh }),
          fetchWpPosts({ perPage: 6 }),
        ]);

        if (wpCourses.status === 'fulfilled' && wpCourses.value.length > 0) {
          setCourses((prev) => (areCoursesEqual(prev, wpCourses.value) ? prev : wpCourses.value));
          setTotalCourseCount(wpCourses.value.length);
        } else if (wpCourses.status === 'rejected' && !silent) {
          setCoursesError(wpCourses.reason?.message || 'Unable to sync latest courses.');
        }

        if (wpCategories.status === 'fulfilled' && wpCategories.value.length > 0) {
          const liveCount = wpCourses.status === 'fulfilled' ? wpCourses.value.length : 0;
          const updatedCats = wpCategories.value.map((c) =>
            c.id === 'all' ? { ...c, count: Math.max(c.count, liveCount) } : c
          );
          setCategories((prev) => (areDataEqual(prev, updatedCats) ? prev : updatedCats));
        }

        if (wpWorkshops.status === 'fulfilled' && wpWorkshops.value.length > 0) {
          setWorkshops((prev) =>
            areDataEqual(prev, wpWorkshops.value) ? prev : wpWorkshops.value
          );
        }

        if (wpPosts.status === 'fulfilled' && wpPosts.value.length > 0) {
          setBlogPosts((prev) => (areDataEqual(prev, wpPosts.value) ? prev : wpPosts.value));
        }

        setLastSyncedAt(Date.now());
      } catch (err: any) {
        if (!silent) {
          setCoursesError(err?.message || 'Unable to connect to Thriving Skills.');
        }
        if (Env.DEBUG_API) {
          console.warn('Error fetching WordPress backend data:', err);
        }
      } finally {
        if (!silent) {
          setIsLoadingCourses(false);
        } else {
          setIsBackgroundSyncing(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    let active = true;
    CoursesService.hydrateCatalogCache()
      .then((snapshot) => {
        if (!active) return;
        if (snapshot.courses.length > 0) {
          setCourses((prev) => (prev.length > 0 ? prev : snapshot.courses));
          setTotalCourseCount((prev) => (prev > 0 ? prev : snapshot.courses.length));
          setIsLoadingCourses(false);
        }
        if (snapshot.categories.length > 0) {
          setCategories((prev) => (prev.length > 1 ? prev : snapshot.categories));
        }
        if (snapshot.workshops.length > 0) {
          setWorkshops((prev) => (prev.length > 0 ? prev : snapshot.workshops));
        }
      })
      .catch(() => {});

    loadWordPressData(false, false);
    refreshBranding(false);
    return () => {
      active = false;
    };
  }, [loadWordPressData, refreshBranding]);

  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        if (Env.DEBUG_API) {
          console.log(
            '[LearningContext] App returned to active. Silently syncing with thrivingskill.com...'
          );
        }
        loadWordPressData(true, true);
        refreshBranding(true);
        syncUserEnrollments().catch(() => {});
      }
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, [loadWordPressData, refreshBranding, syncUserEnrollments]);

  useEffect(() => {
    if (prevOfflineRef.current && !isOffline) {
      if (Env.DEBUG_API) {
        console.log('[LearningContext] Connectivity recovered. Synchronizing catalog...');
      }
      loadWordPressData(true, true);
      refreshBranding(true);
      syncUserEnrollments().catch(() => {});
    }
    prevOfflineRef.current = isOffline;
  }, [isOffline, loadWordPressData, refreshBranding, syncUserEnrollments]);

  useEffect(() => {
    heartbeatTimerRef.current = setInterval(() => {
      if (AppState.currentState === 'active' && !isOffline) {
        if (Env.DEBUG_API) {
          console.log('[LearningContext] Background heartbeat poll: checking thrivingskill.com...');
        }
        loadWordPressData(true, true);
        syncUserEnrollments().catch(() => {});
      }
    }, 90000);

    return () => {
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }
    };
  }, [isOffline, loadWordPressData, syncUserEnrollments]);

  useEffect(() => {
    const unsubscribe = CoursesService.subscribeCatalogUpdates(() => {
      if (Env.DEBUG_API) {
        console.log(
          '[LearningContext] Received catalog update notification, revalidating state...'
        );
      }
      loadWordPressData(false, true);
    });
    return unsubscribe;
  }, [loadWordPressData]);

  const refreshCourses = useCallback(async () => {
    await Promise.all([
      loadWordPressData(true, false),
      refreshBranding(true),
      syncUserEnrollments().catch(() => null),
    ]);
  }, [loadWordPressData, refreshBranding, syncUserEnrollments]);

  const loadCourseDetail = useCallback(async (courseId: string): Promise<Course> => {
    try {
      const [detail, reviewsSnapshot] = await Promise.all([
        fetchWpCourseDetail(courseId),
        CoursesService.getCourseReviews(courseId),
      ]);
      const existing = coursesRef.current.find((c) => c.id === courseId);
      const localReviews = (existing?.reviews || []).filter(
        (r) => !reviewsSnapshot.reviews.some((sr) => sr.id === r.id)
      );
      const mergedReviews =
        reviewsSnapshot.reviews.length > 0 || localReviews.length > 0
          ? [...reviewsSnapshot.reviews, ...localReviews]
          : detail.reviews;
      const enrichedDetail: Course = {
        ...detail,
        reviews: mergedReviews,
        rating: reviewsSnapshot.rating ?? detail.rating,
        reviewsCount:
          reviewsSnapshot.reviewsCount ??
          (mergedReviews.length > 0 ? mergedReviews.length : detail.reviewsCount),
      };

      setCourses((prev) => {
        const idx = prev.findIndex((c) => c.id === courseId);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = enrichedDetail;
          return next;
        }
        return [enrichedDetail, ...prev];
      });
      return enrichedDetail;
    } catch {
      const existing = coursesRef.current.find((c) => c.id === courseId);
      if (existing) return existing;
      throw new Error('Course not found');
    }
  }, []);

  return {
    courses,
    setCourses,
    coursesRef,
    totalCourseCount,
    categories,
    workshops,
    blogPosts,
    isLoadingCourses,
    coursesError,
    siteBranding,
    banners,
    partnerLogos,
    homeFeatures,
    specialBundles,
    studentTestimonials,
    appRemoteConfig,
    isBrandingLoading,
    refreshBranding,
    refreshCourses,
    loadCourseDetail,
    lastSyncedAt,
    isBackgroundSyncing,
  };
}
