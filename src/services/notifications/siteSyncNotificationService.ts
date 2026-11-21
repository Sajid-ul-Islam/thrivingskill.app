import AsyncStorage from '@react-native-async-storage/async-storage';
import { HttpClient } from '../api/httpClient';
import { Endpoints } from '../api/endpoints';
import { UserProgress } from '../../types';
import { PushNotificationService } from './pushNotificationService';
import { HabitNotificationQueue } from './habitNotificationQueue';
import { cleanHtml, parseBdtPrice } from '../api/transformers';

const STORAGE_KEY_KNOWN_COURSES = '@thrivingskill_sync_known_course_ids';
const STORAGE_KEY_KNOWN_POSTS = '@thrivingskill_sync_known_post_ids';
const STORAGE_KEY_KNOWN_OFFERS = '@thrivingskill_sync_known_offer_ids';
const STORAGE_KEY_LAST_RECOMMENDATION = '@thrivingskill_sync_last_recom_time';
const STORAGE_KEY_LAST_SYNC = '@thrivingskill_sync_last_timestamp';

// 24 hours between periodic automated recommendations
const RECOMMENDATION_INTERVAL_MS = 24 * 60 * 60 * 1000;

export interface SiteSyncResult {
  newCoursesCount: number;
  newOffersCount: number;
  newPostsCount: number;
  recommendationDispatched: boolean;
  errors: string[];
}

export class SiteSyncNotificationService {
  private static isSyncing = false;

  /**
   * Performs an end-to-end synchronization with https://thrivingskill.com:
   * 1. Fetches live courses from LearnPress REST API.
   * 2. Detects brand-new courses and dispatches push notifications.
   * 3. Detects active discount offers/flash sales and dispatches promotional notifications.
   * 4. Fetches live platform updates/posts and notifies learners.
   * 5. Computes automated course recommendations for Android & iOS notification panels.
   */
  static async syncWithLiveSite(options: {
    userProgress?: Record<string, UserProgress>;
    isBangla?: boolean;
    forceRefresh?: boolean;
    allowInitialHighlights?: boolean;
  } = {}): Promise<SiteSyncResult> {
    const result: SiteSyncResult = {
      newCoursesCount: 0,
      newOffersCount: 0,
      newPostsCount: 0,
      recommendationDispatched: false,
      errors: [],
    };

    if (this.isSyncing) {
      return result;
    }

    this.isSyncing = true;
    const isBangla = options.isBangla ?? false;

    try {
      // 1. Fetch live courses from https://thrivingskill.com/wp-json/learnpress/v1/courses
      let rawCourses: any[] = [];
      try {
        rawCourses = await HttpClient.get<any[]>(
          Endpoints.LEARNPRESS.COURSES,
          { per_page: 50, _t: Date.now() },
          { skipAuth: true, timeoutMs: 12000 }
        );
      } catch (err: any) {
        result.errors.push(`Course fetch failed: ${err?.message || 'Network error'}`);
      }

      if (Array.isArray(rawCourses) && rawCourses.length > 0) {
        await this.processCoursesAndOffers(rawCourses, isBangla, result, options.allowInitialHighlights);
      }

      // 2. Fetch live updates / blog posts from https://thrivingskill.com/wp-json/wp/v2/posts
      let rawPosts: any[] = [];
      try {
        rawPosts = await HttpClient.get<any[]>(
          Endpoints.WORDPRESS.POSTS,
          { per_page: 10, _embed: true, _t: Date.now() },
          { skipAuth: true, timeoutMs: 12000 }
        );
      } catch (err: any) {
        result.errors.push(`Post fetch failed: ${err?.message || 'Network error'}`);
      }

      if (Array.isArray(rawPosts) && rawPosts.length > 0) {
        await this.processSiteUpdates(rawPosts, isBangla, result);
      }

      // 3. Compute and deliver automated recommendations
      if (Array.isArray(rawCourses) && rawCourses.length > 0) {
        const recomDispatched = await this.evaluateAndSendRecommendation(
          rawCourses,
          options.userProgress || {},
          isBangla,
          options.forceRefresh
        );
        result.recommendationDispatched = recomDispatched;
      }

      await AsyncStorage.setItem(STORAGE_KEY_LAST_SYNC, Date.now().toString());
    } catch (globalErr: any) {
      result.errors.push(`Global sync failure: ${globalErr?.message || 'Unknown'}`);
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  /**
   * Processes live courses to detect newly published courses and live discount offers
   */
  private static async processCoursesAndOffers(
    rawCourses: any[],
    isBangla: boolean,
    result: SiteSyncResult,
    allowInitialHighlights: boolean = true
  ): Promise<void> {
    const rawStoredCourses = await AsyncStorage.getItem(STORAGE_KEY_KNOWN_COURSES);
    const knownCourseIds: string[] = rawStoredCourses ? JSON.parse(rawStoredCourses) : [];

    const rawStoredOffers = await AsyncStorage.getItem(STORAGE_KEY_KNOWN_OFFERS);
    const knownOfferIds: string[] = rawStoredOffers ? JSON.parse(rawStoredOffers) : [];

    const isFirstRun = !rawStoredCourses;
    const currentCourseIds: string[] = [];
    const currentOfferIds: string[] = [];

    // Analyze courses
    for (const raw of rawCourses) {
      const id = String(raw.id);
      currentCourseIds.push(id);

      const title = cleanHtml(raw.name || raw.title || 'Executive Course');
      const priceData = parseBdtPrice(raw.price, raw.price_rendered);
      const origPriceData = parseBdtPrice(raw.origin_price || raw.regular_price, raw.origin_price_rendered);

      const price = priceData.bdt;
      const origPrice = origPriceData.bdt > price ? origPriceData.bdt : Math.round(price * 1.5);
      const isOnSale = Boolean(raw.on_sale || (origPrice > price && price > 0));
      const discountPercent = origPrice > price ? Math.round(((origPrice - price) / origPrice) * 100) : 0;

      let thumbnail = 'https://thrivingskill.com/wp-content/uploads/2025/11/Ms-Excel-Advanced-Level.jpg';
      if (typeof raw.image === 'string' && raw.image.trim()) {
        thumbnail = raw.image;
      } else if (raw.image?.src) {
        thumbnail = raw.image.src;
      }

      // Check for New Course
      if (!isFirstRun && !knownCourseIds.includes(id)) {
        result.newCoursesCount++;
        const throttle = await HabitNotificationQueue.canDeliverNotificationNow('normal');
        const isReceptive = await HabitNotificationQueue.isReceptiveTimeNow();
        if (throttle.allowed && isReceptive) {
          await PushNotificationService.notifyNewCourse({
            id,
            title,
            priceBdt: price,
            thumbnail,
          }, isBangla);
          await HabitNotificationQueue.recordDelivery('normal');
        } else {
          const priceText = price ? ` (৳${price})` : '';
          await HabitNotificationQueue.enqueueOrDispatch(
            isBangla ? '🎓 নতুন কোর্স প্রকাশিত হয়েছে!' : '🎓 New Course Published!',
            isBangla
              ? `"${title}" কোর্সটি এখন উপলব্ধ${priceText}। পেশাগত দক্ষতায় এক ধাপ এগিয়ে যান!`
              : `"${title}" is now available${priceText}. Enroll now to level up your career!`,
            'course',
            'normal',
            {
              courseId: id,
              courseName: title,
              priceBdt: price,
              thumbnail,
            }
          );
        }
      }

      // Check for Discount Offer / Flash Sale
      if (isOnSale && discountPercent >= 20) {
        currentOfferIds.push(id);
        const offerKey = `${id}_${price}`;

        // If offer not notified yet, or on first run if initial highlights are allowed
        if (!knownOfferIds.includes(offerKey)) {
          if (!isFirstRun || (allowInitialHighlights && result.newOffersCount === 0)) {
            result.newOffersCount++;
            const throttle = await HabitNotificationQueue.canDeliverNotificationNow('high');
            if (throttle.allowed) {
              await PushNotificationService.notifyCourseOffer({
                id,
                title,
                priceBdt: price,
                originalPriceBdt: origPrice,
                discountPercent,
                thumbnail,
              }, isBangla);
              await HabitNotificationQueue.recordDelivery('high');
            } else {
              const offerTitle = isBangla
                ? `🔥 বিশেষ ছাড়: ${discountPercent}% ছাড়!`
                : `🔥 Special Offer: ${discountPercent}% OFF!`;
              const offerBody = isBangla
                ? `"${title}" এখন মাত্র ৳${price} (পূর্বে ছিল ৳${origPrice})। অফারটি সীমিত সময়ের জন্য!`
                : `Get "${title}" for only ৳${price} (Regular: ৳${origPrice}). Limited time discount!`;
              await HabitNotificationQueue.enqueueOrDispatch(
                offerTitle,
                offerBody,
                'offer',
                'high',
                {
                  courseId: id,
                  courseName: title,
                  priceBdt: price,
                  originalPriceBdt: origPrice,
                  discountPercent,
                  thumbnail,
                }
              );
            }
          }
          knownOfferIds.push(offerKey);
        }
      }
    }

    // Persist discovered sets
    await AsyncStorage.setItem(STORAGE_KEY_KNOWN_COURSES, JSON.stringify(currentCourseIds));
    await AsyncStorage.setItem(STORAGE_KEY_KNOWN_OFFERS, JSON.stringify(knownOfferIds.slice(-50)));
  }

  /**
   * Processes live WordPress updates/blog articles from https://thrivingskill.com/wp-json/wp/v2/posts
   */
  private static async processSiteUpdates(
    rawPosts: any[],
    isBangla: boolean,
    result: SiteSyncResult
  ): Promise<void> {
    const rawStored = await AsyncStorage.getItem(STORAGE_KEY_KNOWN_POSTS);
    const knownPostIds: number[] = rawStored ? JSON.parse(rawStored) : [];
    const isFirstRun = !rawStored;
    const currentPostIds: number[] = [];

    for (const post of rawPosts) {
      const id = Number(post.id);
      currentPostIds.push(id);

      if (!isFirstRun && !knownPostIds.includes(id)) {
        result.newPostsCount++;
        const title = cleanHtml(post.title?.rendered || 'Skill Update');
        const link = post.link || 'https://thrivingskill.com';

        const throttle = await HabitNotificationQueue.canDeliverNotificationNow('low');
        const isReceptive = await HabitNotificationQueue.isReceptiveTimeNow();
        if (throttle.allowed && isReceptive) {
          await PushNotificationService.notifySiteUpdate({
            id,
            title,
            link,
          }, isBangla);
          await HabitNotificationQueue.recordDelivery('low');
        } else {
          await HabitNotificationQueue.enqueueOrDispatch(
            isBangla ? '📢 নতুন আর্টিকেল ও ক্যারিয়ার আপডেট' : '📢 Career Insight & Platform Update',
            isBangla
              ? `"${title}" – থ্রাইভিং স্কিলস-এর নতুন ব্লগ পোস্টটি পড়ুন এবং জানুন গুরুত্বপূর্ণ ইনসাইট!`
              : `"${title}" – Read the latest expert insights and skills guide on Thriving Skills.`,
            'update',
            'low',
            {
              postId: id,
              postTitle: title,
              postUrl: link,
            }
          );
        }
      }
    }

    await AsyncStorage.setItem(STORAGE_KEY_KNOWN_POSTS, JSON.stringify(currentPostIds));
  }

  /**
   * Computes personalized course recommendations based on user progress and active site courses.
   */
  static async evaluateAndSendRecommendation(
    rawCourses: any[],
    userProgress: Record<string, UserProgress>,
    isBangla: boolean,
    force: boolean = false
  ): Promise<boolean> {
    try {
      const lastRecomStr = await AsyncStorage.getItem(STORAGE_KEY_LAST_RECOMMENDATION);
      const lastRecomTime = lastRecomStr ? parseInt(lastRecomStr, 10) : 0;
      const now = Date.now();

      if (!force && now - lastRecomTime < RECOMMENDATION_INTERVAL_MS) {
        return false;
      }

      // Identify user completed and enrolled course IDs
      const enrolledIds = Object.keys(userProgress);
      const completedIds = Object.entries(userProgress)
        .filter(([_, p]) => p.isCompleted)
        .map(([id]) => id);

      // Select candidates not already completed
      const candidates = rawCourses.filter((c: any) => !completedIds.includes(String(c.id)));
      if (candidates.length === 0) return false;

      // Smart recommendation prioritization:
      // If user has enrolled in Excel or Data courses, recommend Generative AI or Productivity.
      // If user is new (0 enrolled), recommend high-impact executive courses.
      let recommended = candidates[0];
      let reason = isBangla
        ? 'জনপ্রিয় এবং বর্তমান চাকরির বাজারে সবচেয়ে চাহিদাসম্পন্ন'
        : 'Trending executive skill for career acceleration';

      if (enrolledIds.length === 0) {
        // Recommend popular flagship courses
        const flagship = candidates.find((c: any) => {
          const name = (c.name || '').toLowerCase();
          return name.includes('excel') || name.includes('generative ai') || name.includes('communication');
        });
        if (flagship) {
          recommended = flagship;
          reason = isBangla
            ? 'নতুন শিক্ষার্থীদের জন্য বিশেষজ্ঞদের বিশেষ রেকমেন্ডেশন'
            : 'Top recommended foundation course for new executives';
        }
      } else {
        // Find next complementary course
        const hasAi = enrolledIds.some((id) => id.includes('ai') || id.includes('prompt'));
        const nextTarget = candidates.find((c: any) => {
          const name = (c.name || '').toLowerCase();
          if (hasAi) return name.includes('research') || name.includes('lead') || name.includes('excel');
          return name.includes('ai') || name.includes('mindset') || name.includes('intelligence');
        });
        if (nextTarget) {
          recommended = nextTarget;
          reason = isBangla
            ? 'আপনার পূর্ববর্তী অগ্রগতির ওপর ভিত্তি করে নির্বাচিত'
            : 'Personalized based on your current executive learning track';
        }
      }

      const id = String(recommended.id);
      const title = cleanHtml(recommended.name || recommended.title || 'Executive Course');
      let thumbnail = 'https://thrivingskill.com/wp-content/uploads/2025/11/Ms-Excel-Advanced-Level.jpg';
      if (typeof recommended.image === 'string' && recommended.image.trim()) {
        thumbnail = recommended.image;
      } else if (recommended.image?.src) {
        thumbnail = recommended.image.src;
      }

      const throttle = await HabitNotificationQueue.canDeliverNotificationNow('normal');
      const isReceptive = await HabitNotificationQueue.isReceptiveTimeNow();

      if (force || (throttle.allowed && isReceptive)) {
        await PushNotificationService.notifyCourseRecommendation({
          id,
          title,
          reason,
          thumbnail,
        }, isBangla);
        await HabitNotificationQueue.recordDelivery('normal');
      } else {
        const recomTitle = isBangla ? '✨ আপনার জন্য বিশেষ কোর্স পরামর্শ' : '✨ Recommended For You';
        const recomBody = isBangla
          ? `${reason}: "${title}" কোর্সটি দিয়ে আপনার দক্ষতা একধাপ এগিয়ে নিন।`
          : `${reason}: Accelerate your learning journey with "${title}".`;
        await HabitNotificationQueue.enqueueOrDispatch(
          recomTitle,
          recomBody,
          'recommendation',
          'normal',
          {
            courseId: id,
            courseName: title,
            recommendationReason: reason,
            thumbnail,
          }
        );
      }

      await AsyncStorage.setItem(STORAGE_KEY_LAST_RECOMMENDATION, now.toString());
      return true;
    } catch {
      return false;
    }
  }
}
