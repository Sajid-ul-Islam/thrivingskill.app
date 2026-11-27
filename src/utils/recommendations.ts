import { Category, Course, UserProgress } from '../types';
import { computeBm25Scores, tokenizeSearchText } from '../services/search/bm25';

export const DEFAULT_RECOMMENDATION_SOURCE = 'home_bm25_behavioral_v1';

export interface RecommendationInput {
  courses: Course[];
  categories: Category[];
  userProgress: Record<string, UserProgress>;
  categoryAffinities: Record<string, number>;
  searchKeywordsHistory: string[];
  limit?: number;
  source?: string;
  recommendationId?: string;
}

export interface RecommendationResult {
  recommendationId: string;
  source: string;
  courses: Course[];
  rationale: string;
  rationaleBn: string;
}

function buildRecommendationId(source: string, courseIds: string[]): string {
  const payload = `${source}:${courseIds.join(',')}`;
  let hash = 2166136261;
  for (let i = 0; i < payload.length; i++) {
    hash ^= payload.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const safeSource = source.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 32) || 'rec';
  return `rec_${safeSource}_${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

/**
 * Pure behavior-based + BM25 keyword course recommendation engine.
 * Scores courses by category affinity, active/completed progress, recent searches,
 * BM25 keyword relevance to engaged history, rating, and popularity.
 */
export function computeRecommendedCourses({
  courses,
  categories,
  userProgress,
  categoryAffinities,
  searchKeywordsHistory,
  limit = 6,
  source = DEFAULT_RECOMMENDATION_SOURCE,
  recommendationId,
}: RecommendationInput): RecommendationResult {
  const scoreByCat: Record<string, number> = { ...categoryAffinities };
  const engagedTexts: string[] = [];

  Object.keys(userProgress).forEach((cId) => {
    const c = courses.find((item) => item.id === cId);
    if (c) {
      if (c.category) {
        scoreByCat[c.category] = (scoreByCat[c.category] || 0) + 3;
      }
      engagedTexts.push(`${c.title} ${c.category || ''} ${c.subtitle || ''}`);
    }
  });

  let topCatId = '';
  let topScore = 0;
  Object.entries(scoreByCat).forEach(([catId, score]) => {
    if (score > topScore) {
      topScore = score;
      topCatId = catId;
    }
  });

  const topCatObj = categories.find((c) => c.id === topCatId);
  if (topCatObj && topScore > 0) {
    engagedTexts.push(topCatObj.name);
  }
  if (searchKeywordsHistory.length > 0) {
    engagedTexts.push(...searchKeywordsHistory.slice(0, 5));
  }

  const profileTokens = tokenizeSearchText(engagedTexts.join(' '), true);
  const bm25CourseScores =
    profileTokens.length > 0
      ? computeBm25Scores(
          profileTokens,
          courses.map((course) => ({
            id: course.id,
            tokens: tokenizeSearchText(
              `${course.title} ${course.category || ''} ${course.subtitle || ''} ${course.description || ''}`,
              true
            ),
          })),
          { allowPrefixMatch: true }
        )
      : new Map();

  const scoredCourses = courses.map((course) => {
    let score = 0;
    const progress = userProgress[course.id];

    // Completed courses receive a penalty so user sees new recommendations
    if (progress?.isCompleted) {
      score -= 80;
    } else if (progress && progress.completedLessonIds.length > 0) {
      score += 15;
    }

    // Category affinity boost
    const catAffinity = scoreByCat[course.category] || 0;
    score += Math.min(50, catAffinity * 10);

    // Search keyword matches
    if (searchKeywordsHistory.length > 0) {
      const titleLower = course.title.toLowerCase();
      const descLower = (course.description || '').toLowerCase();
      const matches = searchKeywordsHistory.some(
        (kw) => titleLower.includes(kw) || descLower.includes(kw)
      );
      if (matches) score += 30;
    }

    // BM25 keyword overlap against learner profile history
    const bm25Entry = bm25CourseScores.get(course.id);
    if (bm25Entry && bm25Entry.score > 0) {
      score += Math.min(25, Math.round(bm25Entry.score * 6));
    }

    // Rating quality score (only when authentic rating exists)
    if (typeof course.rating === 'number' && course.rating > 0) {
      score += course.rating * 4;
    }

    // Popularity score (only when authentic enrollment count exists)
    if (typeof course.enrolledCount === 'number' && course.enrolledCount > 0) {
      score += Math.min(15, Math.log10(course.enrolledCount + 1) * 5);
    }

    // Badges
    if (course.badge === 'Bestseller' || course.badge === 'Trending') score += 10;

    return { course, score };
  });

  scoredCourses.sort((a, b) => b.score - a.score);
  const recommended = scoredCourses.slice(0, limit).map((item) => item.course);

  let rationale = 'Recommended for executive skill acceleration based on your learning activity';
  let rationaleBn = 'আপনার শেখার কার্যক্রম অনুযায়ী পেশাগত দক্ষতা বৃদ্ধির জন্য নির্বাচিত';

  if (topCatObj && topScore > 2) {
    rationale = `Recommended Match: Tailored for your interest in ${topCatObj.name}`;
    rationaleBn = `আপনার আগ্রহের ভিত্তিতে সুপারিশ: "${topCatObj.banglaName || topCatObj.name}" বিষয়ক প্রস্তাবিত কোর্স`;
  }

  const resolvedSource = source.trim() || DEFAULT_RECOMMENDATION_SOURCE;
  const resolvedRecommendationId =
    recommendationId?.trim() ||
    buildRecommendationId(
      resolvedSource,
      recommended.map((item) => String(item.id))
    );

  return {
    recommendationId: resolvedRecommendationId,
    source: resolvedSource,
    courses: recommended,
    rationale,
    rationaleBn,
  };
}
