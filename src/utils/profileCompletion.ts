import { UserProfile } from '../services/api/userService';

export interface ProfileCompletionItem {
  id: 'name' | 'email' | 'phone' | 'bio' | 'avatar' | 'city' | 'social_cover';
  label: string;
  labelBn: string;
  weight: number;
  completed: boolean;
  actionText: string;
  actionTextBn: string;
}

export type ProfileStrengthLevel = 'beginner' | 'intermediate' | 'advanced' | 'all-star';

export interface ProfileCompletionResult {
  percentage: number;
  strengthLevel: ProfileStrengthLevel;
  strengthLabel: string;
  strengthLabelBn: string;
  items: ProfileCompletionItem[];
  missingItems: ProfileCompletionItem[];
  completedItems: ProfileCompletionItem[];
  nextAction: ProfileCompletionItem | null;
  isComplete: boolean;
}

/**
 * Validates whether an avatar URL is a personalized user image rather than an empty default placeholder
 */
function isValidAvatar(avatarUrl?: string): boolean {
  if (!avatarUrl || typeof avatarUrl !== 'string') return false;
  const clean = avatarUrl.trim().toLowerCase();
  if (!clean || clean.length < 5) return false;
  // Disallow common default gravatar/empty avatars
  if (clean.includes('d=mp') || clean.includes('d=blank') || clean.includes('default_avatar')) {
    return false;
  }
  return true;
}

/**
 * Validates whether a phone number contains at least 8 digits
 */
function isValidPhone(phone?: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 8;
}

/**
 * Validates whether an email is structurally valid
 */
function isValidEmail(email?: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const clean = email.trim();
  return clean.length >= 5 && clean.includes('@') && clean.includes('.');
}

/**
 * Validates display name or full name
 */
function isValidName(name?: string, displayName?: string, firstName?: string): boolean {
  const candidate = (name || displayName || firstName || '').trim();
  if (candidate.length < 2) return false;
  const lower = candidate.toLowerCase();
  if (
    lower === 'guest learner' ||
    lower === 'অতিথি শিক্ষার্থী' ||
    lower === 'subscriber' ||
    lower === 'admin' ||
    lower === 'null' ||
    lower === 'undefined'
  ) {
    return false;
  }
  return true;
}

/**
 * Validates professional bio / headline
 */
function isValidBio(bio?: string): boolean {
  if (!bio || typeof bio !== 'string') return false;
  const trimmed = bio.trim();
  return trimmed.length >= 5;
}

/**
 * Validates city / location
 */
function isValidCity(city?: string): boolean {
  if (!city || typeof city !== 'string') return false;
  const trimmed = city.trim();
  return trimmed.length >= 2;
}

/**
 * Validates social profiles or cover photo
 */
function isValidSocialOrCover(social?: any, coverPhoto?: string): boolean {
  if (coverPhoto && coverPhoto.trim().length > 5) return true;
  if (social) {
    if (social.linkedin && social.linkedin.trim().length > 3) return true;
    if (social.facebook && social.facebook.trim().length > 3) return true;
    if (social.twitter && social.twitter.trim().length > 3) return true;
    if (social.youtube && social.youtube.trim().length > 3) return true;
  }
  return false;
}

/**
 * Computes LinkedIn-style profile completion score, strength tier, and next action recommendation
 */
export function calculateProfileCompletion(user: UserProfile | null | undefined): ProfileCompletionResult {
  const hasName = isValidName(user?.name, user?.displayName, user?.first_name);
  const hasEmail = isValidEmail(user?.email);
  const hasPhone = isValidPhone(user?.phone);
  const hasBio = isValidBio(user?.description);
  const hasAvatar = isValidAvatar(user?.avatar);
  const hasCity = isValidCity(user?.city);
  const hasSocialCover = isValidSocialOrCover(user?.social, user?.cover_photo);

  const items: ProfileCompletionItem[] = [
    {
      id: 'name',
      label: 'Full Name',
      labelBn: 'পূর্ণ নাম',
      weight: 15,
      completed: hasName,
      actionText: '+ Add Full Name',
      actionTextBn: '+ নাম যোগ করুন',
    },
    {
      id: 'email',
      label: 'Verified Email',
      labelBn: 'যাচাইকৃত ইমেইল',
      weight: 15,
      completed: hasEmail,
      actionText: '+ Verify Email',
      actionTextBn: '+ ইমেইল দিন',
    },
    {
      id: 'phone',
      label: 'Mobile Phone',
      labelBn: 'মোবাইল নম্বর',
      weight: 20,
      completed: hasPhone,
      actionText: '+ Add Phone',
      actionTextBn: '+ ফোন নম্বর দিন',
    },
    {
      id: 'bio',
      label: 'Professional Bio',
      labelBn: 'পেশাগত পরিচিতি',
      weight: 20,
      completed: hasBio,
      actionText: '+ Add Bio',
      actionTextBn: '+ বায়ো লিখুন',
    },
    {
      id: 'avatar',
      label: 'Profile Photo',
      labelBn: 'প্রোফাইল ছবি',
      weight: 15,
      completed: hasAvatar,
      actionText: '+ Add Photo',
      actionTextBn: '+ ছবি আপলোড করুন',
    },
    {
      id: 'city',
      label: 'City / Location',
      labelBn: 'শহর বা অবস্থান',
      weight: 10,
      completed: hasCity,
      actionText: '+ Add City',
      actionTextBn: '+ শহর যোগ করুন',
    },
    {
      id: 'social_cover',
      label: 'Social / Banner',
      labelBn: 'সোশ্যাল বা কভার',
      weight: 5,
      completed: hasSocialCover,
      actionText: '+ Add Social Link',
      actionTextBn: '+ সোশ্যাল লিংক দিন',
    },
  ];

  let rawTotal = 0;
  for (const item of items) {
    if (item.completed) {
      rawTotal += item.weight;
    }
  }

  const percentage = Math.min(Math.max(rawTotal, 0), 100);

  let strengthLevel: ProfileStrengthLevel = 'beginner';
  let strengthLabel = 'Beginner';
  let strengthLabelBn = 'প্রারম্ভিক';

  if (percentage >= 90) {
    strengthLevel = 'all-star';
    strengthLabel = 'All-Star';
    strengthLabelBn = 'অল-স্টার';
  } else if (percentage >= 70) {
    strengthLevel = 'advanced';
    strengthLabel = 'Advanced';
    strengthLabelBn = 'অগ্রসর';
  } else if (percentage >= 40) {
    strengthLevel = 'intermediate';
    strengthLabel = 'Intermediate';
    strengthLabelBn = 'মাঝারি';
  }

  const missingItems = items.filter((item) => !item.completed);
  const completedItems = items.filter((item) => item.completed);

  // Highest priority missing item to nudge user next
  const nextAction = missingItems.length > 0 ? missingItems[0] : null;

  return {
    percentage,
    strengthLevel,
    strengthLabel,
    strengthLabelBn,
    items,
    missingItems,
    completedItems,
    nextAction,
    isComplete: percentage === 100,
  };
}
