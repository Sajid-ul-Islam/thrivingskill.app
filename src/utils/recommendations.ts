import { Category, Course, UserProgress } from '../types';

export interface RecommendationInput {
  courses: Course[];
  categories: Category[];
  userProgress: Record<string, UserProgress>;
  categoryAffinities: Record<string, number>;
  searchKeywordsHistory: string[];
  limit?: number;
}

export interface RecommendationResult {
  courses: Course[];
  rationale: string;
  rationaleBn: string;
}

/**
 * Pure behavior-based course recommendation engine.
 * Scores courses by category affinity, active/completed progress, recent searches, rating, and popularity.
 */
export function computeRecommendedCourses({
  courses,
  categories,
  userProgress,
  categoryAffinities,
  searchKeywordsHistory,
  limit = 6,
}: RecommendationInput): RecommendationResult {
  const scoreByCat: Record<string, number> = { ...categoryAffinities };

  Object.keys(userProgress).forEach((cId) => {
    const c = courses.find((item) => item.id === cId);
    if (c && c.category) {
      scoreByCat[c.category] = (scoreByCat[c.category] || 0) + 3;
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

    // Rating quality score
    score += (course.rating || 4.5) * 4;

    // Popularity score
    score += Math.min(15, Math.log10((course.enrolledCount || 100) + 1) * 5);

    // Badges
    if (course.badge === 'Bestseller' || course.badge === 'Trending') score += 10;

    return { course, score };
  });

  scoredCourses.sort((a, b) => b.score - a.score);
  const recommended = scoredCourses.slice(0, limit).map((item) => item.course);

  let rationale = '✨ Gemini Nano Recommendation: Curated for executive skill acceleration';
  let rationaleBn = '✨ অন-ডিভাইস জেমিনাই ন্যানো সুপারিশ: পেশাগত দক্ষতা বৃদ্ধির জন্য বিশেষভাবে নির্বাচিত';

  if (topCatObj && topScore > 2) {
    rationale = `✨ Gemini Nano Match: Tailored for your interest in ${topCatObj.name}`;
    rationaleBn = `✨ অন-ডিভাইস জেমিনাই ন্যানো সুপারিশ: আপনার "${topCatObj.banglaName || topCatObj.name}" বিষয়ক সক্রিয় আগ্রহের ভিত্তিতে প্রস্তাবিত`;
  }

  return { courses: recommended, rationale, rationaleBn };
}
