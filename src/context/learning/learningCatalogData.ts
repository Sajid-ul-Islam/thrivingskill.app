import { Env } from '../../config/env';
import { Category, Certificate, Course } from '../../types';

export function areDataEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

export function areCoursesEqual(a: Course[], b: Course[]): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  if (a.length === 0) return true;
  if (a[0]?.id !== b[0]?.id || a[a.length - 1]?.id !== b[b.length - 1]?.id) return false;
  const step = Math.max(1, Math.floor(a.length / 20));
  for (let i = 0; i < a.length; i += step) {
    if (a[i]?.id !== b[i]?.id || a[i]?.priceBdt !== b[i]?.priceBdt || a[i]?.title !== b[i]?.title) {
      return false;
    }
  }
  return true;
}

export function buildCertificateRecord(
  course: Course,
  studentName: string,
  existingCredentialId?: string,
  fallbackInstructor: string = 'Thriving Skills Instructor'
): Certificate {
  const credentialId =
    existingCredentialId ||
    `TS-2026-${Math.random().toString(36).substring(2, 8).toUpperCase().padEnd(6, '0')}`;

  return {
    id: `cert-${Date.now()}`,
    courseId: course.id,
    courseTitle: course.title,
    studentName,
    issueDate: new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }),
    credentialId,
    instructorName: course.instructor?.name || fallbackInstructor,
    verificationUrl: `${Env.SITE_URL}/verify/${credentialId}`,
  };
}

export const INITIAL_CANONICAL_CATEGORIES: Category[] = [
  {
    id: 'all',
    name: 'All Courses',
    banglaName: 'সব কোর্স',
    icon: 'grid',
    count: 382,
    color: '#059669',
    slug: 'all',
  },
  {
    id: 'business',
    name: 'Business',
    banglaName: 'ব্যবসা ও বাণিজ্য',
    icon: 'business',
    count: 85,
    color: '#4F46E5',
    slug: 'business',
  },
  {
    id: 'supply-chain-management',
    name: 'Supply Chain Management',
    banglaName: 'সাপ্লাই চেইন ম্যানেজমেন্ট',
    icon: 'cube',
    count: 59,
    color: '#0284C7',
    slug: 'supply-chain-management',
  },
  {
    id: 'microsoft-excel-courses',
    name: 'Microsoft Excel',
    banglaName: 'মাইক্রোসফট এক্সেল',
    icon: 'grid',
    count: 47,
    color: '#107C41',
    slug: 'microsoft-excel-courses',
  },
  {
    id: 'leadership-management',
    name: 'Leadership & Management',
    banglaName: 'নেতৃত্ব ও ব্যবস্থাপনা',
    icon: 'people',
    count: 39,
    color: '#D97706',
    slug: 'leadership-management',
  },
  {
    id: 'personal-development',
    name: 'Personal Development',
    banglaName: 'ব্যক্তিগত দক্ষতা উন্নয়ন',
    icon: 'bulb',
    count: 39,
    color: '#EC4899',
    slug: 'personal-development',
  },
  {
    id: 'generative-ai',
    name: 'Generative AI',
    banglaName: 'জেনারেটিভ এআই',
    icon: 'sparkles',
    count: 38,
    color: '#8B5CF6',
    slug: 'generative-ai',
  },
  {
    id: 'finance-accounting-legal',
    name: 'Finance & Legal',
    banglaName: 'অর্থনীতি ও আইন',
    icon: 'cash',
    count: 35,
    color: '#059669',
    slug: 'finance-accounting-legal',
  },
  {
    id: 'human-resource-management',
    name: 'Human Resource Management',
    banglaName: 'মানব সম্পদ ব্যবস্থাপনা',
    icon: 'briefcase',
    count: 28,
    color: '#6366F1',
    slug: 'human-resource-management',
  },
  {
    id: 'sales-marketing',
    name: 'Sales & Marketing',
    banglaName: 'বিক্রয় ও বিপণন',
    icon: 'trending-up',
    count: 25,
    color: '#F59E0B',
    slug: 'sales-marketing',
  },
  {
    id: 'data-science',
    name: 'Data Science',
    banglaName: 'ডাটা সায়েন্স',
    icon: 'analytics',
    count: 22,
    color: '#06B6D4',
    slug: 'data-science',
  },
  {
    id: 'job-seekers-skills',
    name: 'Job Seekers Skills',
    banglaName: 'চাকরি প্রত্যাশীদের দক্ষতা',
    icon: 'school',
    count: 18,
    color: '#10B981',
    slug: 'job-seekers-skills',
  },
  {
    id: 'research-courses',
    name: 'Research & Academic',
    banglaName: 'গবেষণা ও শিক্ষায়তনিক',
    icon: 'book',
    count: 15,
    color: '#64748B',
    slug: 'research-courses',
  },
];
