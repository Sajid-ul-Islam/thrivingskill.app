import { Course } from '../../types';

export type LevelFilter = 'All' | 'Beginner' | 'Intermediate' | 'Advanced';
export type PriceFilter = 'all' | 'free' | 'paid';
export type DurationFilter = 'all' | 'short' | 'in-depth';
export type SortOption = 'popular' | 'newest' | 'rating' | 'price-low' | 'price-high';

export interface HotTopicItem {
  id: string;
  label: string;
  bnLabel: string;
  icon: string;
  type: 'dept' | 'price_free' | 'all';
}

export const HOT_TOPICS: HotTopicItem[] = [
  { id: 'all', label: 'All Courses', bnLabel: 'সব কোর্স', icon: 'sparkles', type: 'all' },
  {
    id: 'thrive-gen',
    label: 'Thrive Gen (Youth)',
    bnLabel: 'থ্রাইভ জেন (ছাত্রছাত্রী)',
    icon: 'school-outline',
    type: 'dept',
  },
  {
    id: 'bundle-courses',
    label: 'Career Bundles',
    bnLabel: 'ক্যারিয়ার বান্ডেল',
    icon: 'layers-outline',
    type: 'dept',
  },
  {
    id: 'generative-ai',
    label: 'AI & ChatGPT',
    bnLabel: 'এআই ও চ্যাটজিপিটি',
    icon: 'hardware-chip-outline',
    type: 'dept',
  },
  {
    id: 'microsoft-excel-courses',
    label: 'Excel Mastery',
    bnLabel: 'এক্সেল স্প্রেডশিট',
    icon: 'grid-outline',
    type: 'dept',
  },
  {
    id: 'free-offer',
    label: '100% Free',
    bnLabel: 'সম্পূর্ণ ফ্রি',
    icon: 'gift-outline',
    type: 'price_free',
  },
  {
    id: 'human-resource-management',
    label: 'HR Management',
    bnLabel: 'এইচআর ম্যানেজমেন্ট',
    icon: 'people-outline',
    type: 'dept',
  },
  {
    id: 'supply-chain-management',
    label: 'Supply Chain',
    bnLabel: 'সাপ্লাই চেইন',
    icon: 'cube-outline',
    type: 'dept',
  },
  {
    id: 'leadership-management',
    label: 'Leadership',
    bnLabel: 'লিডারশিপ',
    icon: 'compass-outline',
    type: 'dept',
  },
  {
    id: 'job-seekers-skills',
    label: 'Career & Jobs',
    bnLabel: 'চাকরি ও ক্যারিয়ার',
    icon: 'briefcase-outline',
    type: 'dept',
  },
];

export const LEVEL_LABELS: Record<LevelFilter, { en: string; bn: string }> = {
  All: { en: 'All', bn: 'সব' },
  Beginner: { en: 'Beginner', bn: 'বিগিনার' },
  Intermediate: { en: 'Intermediate', bn: 'মিড-লেভেল' },
  Advanced: { en: 'Advanced', bn: 'অ্যাডভান্সড' },
};

/**
 * Matches a course against canonical Thriving Skills department categories.
 */
export function matchesCourseDepartment(c: Course, deptId: string): boolean {
  const dId = (deptId || '').toLowerCase();
  const lowerCat = (c.category || '').toLowerCase();
  const slugs = (c.categorySlugs || []).map((s) => s.toLowerCase());

  if (lowerCat === dId || slugs.includes(dId)) return true;

  if (dId === 'business-strategy' || dId.includes('strategy')) {
    return lowerCat.includes('strategy') || slugs.some((s) => s.includes('strategy'));
  }
  if (dId.includes('excel')) {
    return lowerCat.includes('excel') || slugs.some((s) => s.includes('excel'));
  }
  if (dId.includes('generative') || dId.includes('ai') || dId === '4ir') {
    return (
      lowerCat.includes('generative') ||
      lowerCat.includes('4ir') ||
      /\bai\b/i.test(lowerCat) ||
      slugs.some((s) => s.includes('generative') || s.includes('4ir') || /\bai\b/i.test(s))
    );
  }
  if (dId.includes('finance') || dId.includes('account') || dId.includes('legal')) {
    return (
      lowerCat.includes('finance') ||
      lowerCat.includes('account') ||
      lowerCat.includes('legal') ||
      slugs.some((s) => s.includes('finance') || s.includes('account') || s.includes('legal'))
    );
  }
  if (dId.includes('marketing') || dId.includes('sales')) {
    return (
      lowerCat.includes('marketing') ||
      lowerCat.includes('sales') ||
      slugs.some((s) => s.includes('marketing') || s.includes('sales'))
    );
  }
  if (dId.includes('human-resource') || dId.includes('hrm') || dId.includes('hr')) {
    return (
      lowerCat.includes('human') ||
      /\bhr\b/i.test(lowerCat) ||
      slugs.some((s) => s.includes('human') || /\bhr\b/i.test(s) || s.includes('hrm'))
    );
  }
  if (dId.includes('supply-chain') || dId.includes('supply') || dId.includes('logistics')) {
    return (
      lowerCat.includes('supply') ||
      lowerCat.includes('logistics') ||
      slugs.some((s) => s.includes('supply') || s.includes('logistics'))
    );
  }
  if (dId.includes('personal-development') || dId.includes('personal')) {
    return (
      lowerCat.includes('personal') ||
      lowerCat.includes('habit') ||
      slugs.some((s) => s.includes('personal') || s.includes('habit') || s.includes('productivity'))
    );
  }
  if (dId.includes('leadership')) {
    return lowerCat.includes('leadership') || slugs.some((s) => s.includes('leadership'));
  }
  if (dId.includes('data')) {
    return (
      lowerCat.includes('data') ||
      lowerCat.includes('analytics') ||
      slugs.some((s) => s.includes('data') || s.includes('analytics'))
    );
  }
  if (dId.includes('business')) {
    const isStrategy = lowerCat.includes('strategy') || slugs.some((s) => s.includes('strategy'));
    if (isStrategy) return false;
    return lowerCat.includes('business') || slugs.some((s) => s.includes('business'));
  }
  if (dId.includes('bundle')) {
    return (
      c.isCareerBundle || c.title.toLowerCase().includes('bundle') || lowerCat.includes('bundle')
    );
  }
  if (dId.includes('research') || dId.includes('academic')) {
    return (
      lowerCat.includes('research') ||
      lowerCat.includes('academic') ||
      slugs.some((s) => s.includes('research') || s.includes('academic'))
    );
  }
  if (dId.includes('job') || dId.includes('career')) {
    return (
      lowerCat.includes('job') ||
      lowerCat.includes('career') ||
      slugs.some((s) => s.includes('job') || s.includes('career'))
    );
  }
  return false;
}
