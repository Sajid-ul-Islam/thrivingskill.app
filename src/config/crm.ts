import { Linking } from 'react-native';

/**
 * Official CRM & Support Channels for Thriving Skills
 * Live Single Source of Truth: https://thrivingskill.com
 */
export const CRM_CHANNELS = {
  phone: '01312100288',
  phoneDisplay: '01312-100288',
  whatsappNumber: '8801312100288',
  facebookPage: 'https://www.facebook.com/thrivingskills',
  messengerUrl: 'https://m.me/thrivingskills',
  email: 'info@thrivingskill.com',
  workingHours: 'Sat - Thu: 10:00 AM - 8:00 PM (GMT+6)',
  workingHoursBn: 'শনিবার - বৃহস্পতিবার: সকাল ১০টা - রাত ৮টা',
};

export type CrmInquiryType = 'general' | 'course' | 'payment' | 'live' | 'certificate' | 'corporate';

export const CRM_INQUIRY_PROMPTS: Record<CrmInquiryType, { en: string; bn: string }> = {
  general: {
    en: 'Hello Thriving Skills, I would like to learn more about your courses and services.',
    bn: 'হ্যালো থ্রাইভিং স্কিলস, আমি আপনাদের কোর্স এবং সেবা সম্পর্কে আরও জানতে চাই।',
  },
  course: {
    en: 'Hello Thriving Skills, I have an inquiry about course enrollment and curriculum.',
    bn: 'হ্যালো থ্রাইভিং স্কিলস, কোর্স কারিকুলাম ও ভর্তি সংক্রান্ত তথ্য জানতে চাচ্ছি।',
  },
  payment: {
    en: 'Hello Thriving Skills, I need assistance with course payment (bKash/Nagad/Cards).',
    bn: 'হ্যালো থ্রাইভিং স্কিলস, কোর্স ফি পরিশোধ (বিকাশ/নগদ/কার্ড) সংক্রান্ত সহায়তা প্রয়োজন।',
  },
  live: {
    en: 'Hello Thriving Skills, I need assistance accessing the live masterclass or webinar session.',
    bn: 'হ্যালো থ্রাইভিং স্কিলস, লাইভ মাস্টারক্লাস বা ওয়েবিনারে যুক্ত হওয়ার ব্যাপারে সহযোগিতা চাই।',
  },
  certificate: {
    en: 'Hello Thriving Skills, I have a query regarding my course completion certificate.',
    bn: 'হ্যালো থ্রাইভিং স্কিলস, কোর্স সমাপ্তির সার্টিফিকেট সংক্রান্ত একটি তথ্য জানা প্রয়োজন।',
  },
  corporate: {
    en: 'Hello Thriving Skills, our organization would like to inquire about corporate executive training.',
    bn: 'হ্যালো থ্রাইভিং স্কিলস, আমাদের প্রতিষ্ঠানের জন্য করপোরেট ট্রেনিং সংক্রান্ত তথ্য জানতে চাচ্ছি।',
  },
};

/**
 * Open official WhatsApp with pre-filled message
 */
export async function openWhatsAppChat(inquiryType: CrmInquiryType = 'general', isBangla = false): Promise<boolean> {
  const message = isBangla
    ? CRM_INQUIRY_PROMPTS[inquiryType].bn
    : CRM_INQUIRY_PROMPTS[inquiryType].en;

  const encoded = encodeURIComponent(message);
  const appUrl = `whatsapp://send?phone=${CRM_CHANNELS.whatsappNumber}&text=${encoded}`;
  const webUrl = `https://wa.me/${CRM_CHANNELS.whatsappNumber}?text=${encoded}`;

  try {
    const canOpen = await Linking.canOpenURL(appUrl);
    if (canOpen) {
      await Linking.openURL(appUrl);
      return true;
    }
    await Linking.openURL(webUrl);
    return true;
  } catch {
    try {
      await Linking.openURL(webUrl);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Open official Messenger chat
 */
export async function openFacebookMessenger(): Promise<boolean> {
  const messengerUrl = CRM_CHANNELS.messengerUrl;
  try {
    const canOpen = await Linking.canOpenURL(messengerUrl);
    if (canOpen) {
      await Linking.openURL(messengerUrl);
      return true;
    }
    await Linking.openURL(CRM_CHANNELS.facebookPage);
    return true;
  } catch {
    try {
      await Linking.openURL(CRM_CHANNELS.facebookPage);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Open official Facebook Page
 */
export async function openFacebookPage(): Promise<boolean> {
  const fbAppUrl = 'fb://facewebmodal/f?href=https://www.facebook.com/thrivingskills';
  try {
    const canOpen = await Linking.canOpenURL(fbAppUrl);
    if (canOpen) {
      await Linking.openURL(fbAppUrl);
      return true;
    }
    await Linking.openURL(CRM_CHANNELS.facebookPage);
    return true;
  } catch {
    try {
      await Linking.openURL(CRM_CHANNELS.facebookPage);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Open phone dialer with official helpline
 */
export async function openCallHelpline(): Promise<boolean> {
  const telUrl = `tel:${CRM_CHANNELS.phone}`;
  try {
    await Linking.openURL(telUrl);
    return true;
  } catch {
    return false;
  }
}
