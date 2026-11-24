import { Env } from '../../config/env';
import { HttpClient } from '../api/httpClient';
import { CacheManager } from '../cache/cacheManager';

export interface SiteFeatureItem {
  id: string;
  title: string;
  banglaTitle: string;
  slug: string;
  webUrl: string;
  pageId: number;
  icon: string;
  section: 'learning' | 'services' | 'company' | 'legal';
  badge?: string;
  description: string;
  banglaDescription: string;
}

export interface PortalServiceItem {
  id: string;
  title: string;
  banglaTitle: string;
  icon: string;
  category: string;
  description: string;
  banglaDescription: string;
  bullets: string[];
  banglaBullets: string[];
  webUrl: string;
}

export interface EbookItem {
  id: string;
  title: string;
  banglaTitle: string;
  author: string;
  coverUrl?: string;
  description: string;
  banglaDescription: string;
  category: string;
  pages?: number;
  readUrl: string;
  downloadUrl?: string;
}

export interface CourseAuthorItem {
  id: string;
  name: string;
  banglaName?: string;
  designation: string;
  banglaDesignation?: string;
  organization: string;
  banglaOrganization?: string;
  avatarUrl?: string;
  localAvatar?: any;
  bio: string;
  banglaBio?: string;
  coursesCount: number;
  studentsCount: number;
  profileUrl: string;
  isFounder?: boolean;
  category?: 'founder' | 'faculty' | 'leadership';
  badge?: string;
  banglaBadge?: string;
  expertise?: string[];
  banglaExpertise?: string[];
}

// Canonical offline fallback definitions for all 14 features from https://thrivingskill.com
export const CANONICAL_SITE_FEATURES: SiteFeatureItem[] = [
  {
    id: 'ebook',
    title: 'eBook',
    banglaTitle: 'ই-বুক লাইব্রেরি',
    slug: 'ebook',
    webUrl: `${Env.SITE_URL}/ebook/`,
    pageId: 76884,
    icon: 'book-outline',
    section: 'learning',
    badge: 'FREE / PRO',
    description: 'Expert-authored career handbooks, guides, and practical skill summaries.',
    banglaDescription: 'অভিজ্ঞ প্রফেশনালদের লেখা ক্যারিয়ার গাইড, চেকলিস্ট ও হ্যান্ডবুক।',
  },
  {
    id: 'blog',
    title: 'Blog',
    banglaTitle: 'ব্লগ ও আর্টিকেল',
    slug: 'blog',
    webUrl: `${Env.SITE_URL}/blog/`,
    pageId: 48679,
    icon: 'newspaper-outline',
    section: 'learning',
    badge: 'UPDATES',
    description: 'Industry insights, emerging trends, AI advancements, and career strategies.',
    banglaDescription: 'শিল্প প্রবণতা, এআই প্রযুক্তি ও পেশাগত দক্ষতা উন্নয়নের বিশ্লেষণধর্মী লেখা।',
  },
  {
    id: 'about-us',
    title: 'About Us',
    banglaTitle: 'আমাদের সম্পর্কে',
    slug: 'about-us',
    webUrl: `${Env.SITE_URL}/about-us/`,
    pageId: 51909,
    icon: 'information-circle-outline',
    section: 'company',
    description: 'Building a skilled nation through accessible, high-impact skill training.',
    banglaDescription: 'দক্ষ জনশক্তি গড়ে তুলতে বিশ্বমানের ব্যবহারিক শিক্ষা প্ল্যাটফর্ম।',
  },
  {
    id: 'services',
    title: 'Services',
    banglaTitle: 'সার্ভিসসমূহ',
    slug: 'services',
    webUrl: `${Env.SITE_URL}/subscription/services/`,
    pageId: 79305,
    icon: 'briefcase-outline',
    section: 'services',
    badge: 'B2B',
    description: 'Enterprise corporate upskilling, content bureau, ICT consulting & licensing.',
    banglaDescription: 'প্রতিষ্ঠানসমূহের জন্য ডিজিটাল রূপান্তর ও প্রশিক্ষণ সমাধান।',
  },
  {
    id: 'our-course-author',
    title: 'Our Course Author',
    banglaTitle: 'আমাদের কোর্স ইন্সট্রাক্টরগণ',
    slug: 'instructors',
    webUrl: `${Env.SITE_URL}/instructors/`,
    pageId: 60044,
    icon: 'people-outline',
    section: 'learning',
    description: 'Top industry practitioners, corporate executives, and university academicians.',
    banglaDescription: 'শীর্ষস্থানীয় কর্পোরেট লিডার ও প্র্যাকটিশনারদের দ্বারা পরিচালিত।',
  },
  {
    id: 'become-an-instructor',
    title: 'Become An Instructor',
    banglaTitle: 'ইন্সট্রাক্টর হিসেবে যুক্ত হোন',
    slug: 'become-an-instructor',
    webUrl: `${Env.SITE_URL}/become-an-instructor/`,
    pageId: 2780,
    icon: 'school-outline',
    section: 'learning',
    badge: 'JOIN US',
    description: 'Monetize your expertise and empower thousands of aspiring professionals.',
    banglaDescription: 'আপনার পেশাগত জ্ঞান ছড়িয়ে দিন এবং নতুন প্রজন্মকে গড়ে তুলুন।',
  },
  {
    id: 'buy-for-team',
    title: 'Buy For Team',
    banglaTitle: 'টিম ও কর্পোরেট সিট',
    slug: 'buyforyourteam',
    webUrl: `${Env.SITE_URL}/buyforyourteam/`,
    pageId: 49455,
    icon: 'business-outline',
    section: 'services',
    badge: 'ENTERPRISE',
    description: 'Bulk team licenses, customized learning tracks, and progress analytics.',
    banglaDescription: 'টিমের পারফরম্যান্স বাড়াতে বাল্ক সাবস্ক্রিপশন ও অ্যানালিটিক্স।',
  },
  {
    id: 'business-consultancy',
    title: 'Business Consultancy',
    banglaTitle: 'বিজনেস কনসালট্যান্সি',
    slug: 'business-consultancy-service',
    webUrl: `${Env.SITE_URL}/subscription/business-consultancy-service/`,
    pageId: 81555,
    icon: 'trending-up-outline',
    section: 'services',
    description: 'End-to-end strategic advisory for scale-ups and corporate transformation.',
    banglaDescription: 'ব্যবসার প্রসারে কৌশলগত দিকনির্দেশনা ও কর্পোরেট পরামর্শ।',
  },
  {
    id: 'affiliate',
    title: 'Affiliate',
    banglaTitle: 'অ্যাফিলিয়েট প্রোগ্রাম',
    slug: 'affiliate',
    webUrl: `${Env.SITE_URL}/affiliate/`,
    pageId: 49458,
    icon: 'gift-outline',
    section: 'services',
    badge: 'EARN',
    description: 'Partner with Thriving Skills and earn recurring commission on course referrals.',
    banglaDescription: 'আমাদের কোর্সের প্রচারণা করে আকর্ষণীয় কমিশন অর্জন করুন।',
  },
  {
    id: 'contact',
    title: 'Contact',
    banglaTitle: 'যোগাযোগ',
    slug: 'contact',
    webUrl: `${Env.SITE_URL}/contact/`,
    pageId: 51911,
    icon: 'call-outline',
    section: 'company',
    description: 'Direct phone, WhatsApp, Messenger, and office support desk.',
    banglaDescription: 'যেকোনো জিজ্ঞাসায় হেল্পলাইন, মেসেঞ্জার বা হোয়াটসঅ্যাপে যোগাযোগ করুন।',
  },
  {
    id: 'privacy-policy',
    title: 'Privacy Policy',
    banglaTitle: 'প্রাইভেসি পলিসি',
    slug: 'privacy-policy',
    webUrl: `${Env.SITE_URL}/privacy-policy/`,
    pageId: 51914,
    icon: 'shield-outline',
    section: 'legal',
    description: 'Official data protection and privacy practices in English.',
    banglaDescription: 'ব্যবহারকারীর তথ্যের নিরাপত্তা ও গোপনীয়তা সংক্রান্ত নীতিমালা।',
  },
  {
    id: 'privacy-policy-bangla',
    title: 'Privacy Policy Bangla',
    banglaTitle: 'প্রাইভেসি পলিসি (বাংলা)',
    slug: 'privacy-policy-bangla',
    webUrl: `${Env.SITE_URL}/privacy-policy-bangla/`,
    pageId: 69410,
    icon: 'shield-checkmark-outline',
    section: 'legal',
    description: 'ব্যবহারকারীর তথ্যের নিরাপত্তা সংক্রান্ত নীতিমালা (বাংলা সংস্করণ)।',
    banglaDescription: 'ব্যবহারকারীর তথ্যের সুরক্ষা ও প্রাতিষ্ঠানিক গোপনীয়তা অঙ্গীকার।',
  },
  {
    id: 'terms-and-conditions',
    title: 'Terms and Conditions',
    banglaTitle: 'টার্মস অ্যান্ড কন্ডিশনস',
    slug: 'terms-and-conditions',
    webUrl: `${Env.SITE_URL}/terms-and-conditions/`,
    pageId: 51916,
    icon: 'document-text-outline',
    section: 'legal',
    description: 'LMS usage rules, course access terms, and platform agreements.',
    banglaDescription: 'কোর্স এক্সেস, সার্টিফিকেট ও প্ল্যাটফর্ম ব্যবহারের নিয়মাবলি।',
  },
  {
    id: 'help',
    title: 'HELP',
    banglaTitle: 'হেল্প ও এফএকিউ',
    slug: 'faqs',
    webUrl: `${Env.SITE_URL}/faqs/`,
    pageId: 51918,
    icon: 'help-circle-outline',
    section: 'company',
    description: 'Frequently asked questions, enrollment guides, and tech troubleshooting.',
    banglaDescription: 'কোর্স এনরোলমেন্ট, সার্টিফিকেট ও অন্যান্য প্রশ্নের দ্রুত সমাধান।',
  },
];

// 7 Core Corporate Services under "Services >"
export const CANONICAL_SERVICES: PortalServiceItem[] = [
  {
    id: 'business-consultancy',
    title: 'Business Consultancy Service',
    banglaTitle: 'বিজনেস কনসালট্যান্সি সার্ভিস',
    icon: 'trending-up-outline',
    category: 'Strategic Advisory & Scaling',
    description: 'Executive advisory, corporate financial modeling, scale-up blueprints, and 1-on-1 monthly strategic calls.',
    banglaDescription: 'ব্যবসার প্রবৃদ্ধি, কৌশলগত আর্থিক পরিকল্পনা এবং ১-অন-১ এক্সিকিউটিভ বিজনেস কনসালট্যান্সি।',
    bullets: [
      'Priority Consultancy (৳1,000–9,000): Unlimited email consulting, monthly 30-min call, live session, 2 custom Excel formats',
      'Premium Consultancy (৳1,500–14,000): Unlimited email consulting, two 30-min calls, live session, 5 custom Excel trackers',
      'Platinum Consultancy (৳2,000–18,000): Unlimited email consulting, four 30-min calls, live session, full business audit & automation',
    ],
    banglaBullets: [
      'প্রায়োরিটি কনসালট্যান্সি (৳১,০০০–৯,০০০): আনলিমিটেড ইমেইল সাপোর্ট, ১টি ৩০-মিনিট কল, ১টি লাইভ সেশন, ২টি এক্সেল ফরম্যাট',
      'প্রিমিয়াম কনসালট্যান্সি (৳১,৫০০–১৪,০০০): আনলিমিটেড ইমেইল সাপোর্ট, ২টি ৩০-মিনিট কল, ১টি লাইভ সেশন, ৫টি এক্সেল ট্র্যাকার',
      'প্লাটিনাম কনসালট্যান্সি (৳২,০০০–১৮,০০০): আনলিমিটেড ইমেইল সাপোর্ট, ৪টি ৩০-মিনিট কল, ১টি লাইভ সেশন, ফুল অটোমেশন ও অডিট',
    ],
    webUrl: `${Env.SITE_URL}/subscription/business-consultancy-service/`,
  },
  {
    id: 'digital-transformation',
    title: 'Digital Transformation Consulting',
    banglaTitle: 'ডিজিটাল রূপান্তর কনসালটিং',
    icon: 'hardware-chip-outline',
    category: 'Enterprise Strategy',
    description: 'Modernize business workflows, migrate to cloud architectures, and implement AI pipelines.',
    banglaDescription: 'ব্যবসায়িক কার্যক্রম ডিজিটালাইজেশন, ক্লাউড মাইগ্রেশন এবং এআই অটোমেশন রূপান্তর।',
    bullets: [
      'Operational workflow audits and automation',
      'AI-first tool stack deployment (ChatGPT, Gemini, Agentic AI)',
      'Enterprise data governance and compliance',
    ],
    banglaBullets: [
      'ওয়ার্কফ্লো অডিট ও অটোমেশন বাস্তবায়ন',
      'এন্টারপ্রাইজ এআই টুলস ডিপ্লয়মেন্ট',
      'ডাটা গভর্ন্যান্স ও সিকিউরিটি কমপ্লায়েন্স',
    ],
    webUrl: `${Env.SITE_URL}/subscription/services/`,
  },
  {
    id: 'content-bureau',
    title: 'Premium Content Bureau',
    banglaTitle: 'প্রিমিয়াম কনটেন্ট ব্যুরো ও কোর্স নির্মাণ',
    icon: 'videocam-outline',
    category: 'Content Production',
    description: 'Full-cycle production of high-impact training materials, SCORM packages, and video curricula.',
    banglaDescription: 'উচ্চমানের ট্রেনিং ভিডিও, স্ক্রিপ্ট, অ্যানিমেশন এবং এসসিওআরএম কনটেন্ট উৎপাদন।',
    bullets: [
      'Studio-grade 4K instructional video production',
      'Interactive quiz banks and practical case studies',
      'Customized enterprise onboarding modules',
    ],
    banglaBullets: [
      'স্টুডিও গ্রেড ৪কে ট্রেনিং ভিডিও নির্মাণ',
      'ইন্টারেক্টিভ কুইজ ও কেস স্টাডি প্রস্তুতি',
      'অনবোর্ডিং ও কমপ্লায়েন্স প্রশিক্ষণ মডিউল',
    ],
    webUrl: `${Env.SITE_URL}/subscription/services/`,
  },
  {
    id: 'company-formation',
    title: 'Company Formation & Legal Advisory',
    banglaTitle: 'কোম্পানি গঠন ও লিগ্যাল অ্যাডভাইজরি',
    icon: 'ribbon-outline',
    category: 'Legal & Compliance',
    description: 'Regulatory compliance, RJSC incorporation, trade licensing, and tax structuring in Bangladesh.',
    banglaDescription: 'আরজেএসসি নিবন্ধন, ট্রেড লাইসেন্স, ভ্যাট/ট্যাক্স এবং করপোরেট লিগ্যাল পরামর্শ।',
    bullets: [
      'RJSC private limited company incorporation',
      'BIDA foreign investment facilitation',
      'IP, trademark, and copyright registration',
    ],
    banglaBullets: [
      'প্রাইভেট লিমিটেড কোম্পানি নিবন্ধন ও আর্টিকলস',
      'বিডা বিনিয়োগ ও ক্লিয়ারেন্স সহায়তা',
      'ট্রেডমার্ক ও আইপি সুরক্ষা নিশ্চিতকরণ',
    ],
    webUrl: `${Env.SITE_URL}/subscription/services/`,
  },
  {
    id: 'ict-policy',
    title: 'ICT & Policy Consulting',
    banglaTitle: 'আইসিটি ও পলিসি কনসালটিং',
    icon: 'shield-checkmark-outline',
    category: 'Public Sector & Governance',
    description: 'Advisory on national digital frameworks, public-private skill partnerships, and institutional capacity building.',
    banglaDescription: 'জাতীয় ডিজিটাল ফ্রেমওয়ার্ক, আইসিটি পলিসি এবং প্রতিষ্ঠানগত দক্ষতা নীতি প্রণয়ন।',
    bullets: [
      'Government and university MoU execution',
      'National 4IR curriculum alignment',
      'Donor-funded project monitoring and evaluation',
    ],
    banglaBullets: [
      'পাবলিক ও প্রাইভেট অংশীদারিত্ব রূপরেখা',
      'চতুর্থ শিল্পবিপ্লব উপযোগী কারিকুলাম বাস্তবায়ন',
      'প্রকল্প মূল্যায়ন ও সক্ষমতা বৃদ্ধি',
    ],
    webUrl: `${Env.SITE_URL}/subscription/services/`,
  },
  {
    id: 'skills-as-a-service',
    title: 'Skills-as-a-Service (Corporate Training)',
    banglaTitle: 'স্কিলস-অ্যাজ-এ-সার্ভিস (কর্পোরেট ট্রেনিং)',
    icon: 'people-outline',
    category: 'Talent Enablement',
    description: 'On-demand training programs for banking, FMCG, telecom, and export-oriented sectors.',
    banglaDescription: 'ব্যাংক, টেলিকম ও বহুজাতিক প্রতিষ্ঠানের কর্মীদের জন্য অন-ডিমান্ড ট্রেনিং প্রোগ্রাম।',
    bullets: [
      'Customized corporate training tracks',
      'Pre- and post-training competency assessments',
      'Real-time managerial progress dashboards',
    ],
    banglaBullets: [
      'কাস্টমাইজড ট্রেনিং ট্র্যাক ও প্র্যাকটিক্যাল ল্যাব',
      'দক্ষতা মূল্যায়ন ও বেঞ্চমার্ক অ্যানালিটিক্স',
      'এইচআর ও ম্যানেজমেন্ট প্রোগ্রেস ড্যাশবোর্ড',
    ],
    webUrl: `${Env.SITE_URL}/subscription/services/`,
  },
  {
    id: 'whitelabel-lms',
    title: 'White-Label LMS Licensing',
    banglaTitle: 'হোয়াইট-লেবেল এলএমএস লাইসেন্সিং',
    icon: 'laptop-outline',
    category: 'EdTech Platform',
    description: 'Turnkey learning management platform with your corporate branding, secure video CDN, and automated exams.',
    banglaDescription: 'আপনার প্রতিষ্ঠানের নিজস্ব ব্র্যান্ডিংয়ে সুরক্ষিত এলএমএস সফটওয়্যার ও ভিডিও সিডিএন।',
    bullets: [
      'Custom domain, logo, and color theming',
      'Encrypted DRM video streaming to prevent piracy',
      'Automated verifiable digital certificates',
    ],
    banglaBullets: [
      'নিজস্ব ডোমেন ও পূর্ণাঙ্গ ব্র্যান্ডিং কাস্টমাইজেশন',
      'পাইরেসি-মুক্ত সুরক্ষিত ভিডিও স্ট্রিমিং',
      'অটোমেটেড ডিজিটাল ভেরিফিকেশন সার্টিফিকেট',
    ],
    webUrl: `${Env.SITE_URL}/subscription/services/`,
  },
];

// Canonical curated eBooks from https://thrivingskill.com/ebook/
export const CANONICAL_EBOOKS: EbookItem[] = [
  {
    id: 'ebook-comm-skills',
    title: 'Effective Communication in Workplace',
    banglaTitle: 'কর্মক্ষেত্রে ফলপ্রসূ যোগাযোগের কৌশল',
    author: 'Thriving Skills Editorial Team',
    category: 'Career & Leadership',
    pages: 64,
    description: 'Master interpersonal communication, persuasive email drafting, executive presentation, and conflict resolution.',
    banglaDescription: 'অফিসিয়াল যোগাযোগ, ক্লায়েন্ট ডিলিং, প্রেজেন্টেশন এবং কনফ্লিক্ট ম্যানেজমেন্টের কার্যকরী নির্দেশিকা।',
    readUrl: `${Env.SITE_URL}/ebook/`,
  },
  {
    id: 'ebook-supply-chain',
    title: 'Supply Chain Management Handbook',
    banglaTitle: 'সাপ্লাই চেইন ম্যানেজমেন্ট হ্যান্ডবুক',
    author: 'Leading Industry Experts',
    category: 'Operations & SCM',
    pages: 112,
    description: 'Comprehensive guide covering procurement, logistics, ERP operations, inventory control, and supply chain analytics.',
    banglaDescription: 'প্রকিউরমেন্ট, লজিস্টিকস, ইনভেন্টরি অপ্টিমাইজেশন ও আন্তর্জাতিক সাপ্লাই চেইনের পূর্ণাঙ্গ গাইড।',
    readUrl: `${Env.SITE_URL}/ebook/`,
  },
  {
    id: 'ebook-digital-marketing',
    title: 'Modern Digital Marketing Playbook',
    banglaTitle: 'ডিজিটাল মার্কেটিং প্র্যাকটিক্যাল প্লেবুক',
    author: 'Growth & Performance Specialists',
    category: 'Marketing & Sales',
    pages: 88,
    description: 'Actionable blueprints for performance ads, SEO optimization, social commerce, and brand positioning in Bangladesh.',
    banglaDescription: 'মেটা ও গুগল অ্যাডস, এসইও, কনটেন্ট মার্কেটিং ও ব্র্যান্ড গ্রোথের স্টেপ-বাই-স্টেপ রোডম্যাপ।',
    readUrl: `${Env.SITE_URL}/ebook/`,
  },
  {
    id: 'ebook-excel-mastery',
    title: 'Excel & Data Analysis Blueprint',
    banglaTitle: 'অ্যাডভান্সড এক্সেল ও ডাটা অ্যানালাইসিস গাইড',
    author: 'Certified Data Analysts',
    category: 'Data & Productivity',
    pages: 96,
    description: 'Formula shortcuts, XLOOKUP, dynamic PivotTables, financial modeling templates, and Power Query essentials.',
    banglaDescription: 'প্রয়োজনীয় ফর্মুলা, পিভট টেবিল, ড্যাশবোর্ড তৈরি এবং ব্যবসায়িক ডাটা বিশ্লেষণের সহজ উপায়।',
    readUrl: `${Env.SITE_URL}/ebook/`,
  },
  {
    id: 'ebook-hr-excellence',
    title: 'Human Resource Management & Labor Law',
    banglaTitle: 'এইচআর ম্যানেজমেন্ট ও বাংলাদেশ শ্রম আইন',
    author: 'Senior HR Practitioners',
    category: 'Human Resources',
    pages: 120,
    description: 'Talent acquisition, KPI frameworks, employee engagement, and practical compliance with Bangladesh Labor Act.',
    banglaDescription: 'ট্যালেন্ট ম্যানেজমেন্ট, পারফরম্যান্স অ্যাপ্রাইজাল ও বাংলাদেশ শ্রম আইনের প্রয়োগবিধি।',
    readUrl: `${Env.SITE_URL}/ebook/`,
  },
  {
    id: 'ebook-generative-ai',
    title: 'Generative AI & Prompt Engineering for Professionals',
    banglaTitle: 'প্রফেশনালদের জন্য জেনারেটিভ এআই ও প্রম্পট ইঞ্জিনিয়ারিং',
    author: 'AI Innovation Lab, Thriving Skills',
    category: 'Artificial Intelligence',
    pages: 80,
    description: 'Practical workflows with ChatGPT, Claude, Midjourney, and Gemini to multiply workplace productivity 10x.',
    banglaDescription: 'দৈনন্দিন কাজে এআই টুলের কার্যকর ব্যবহার, প্রম্পট ফ্রেমওয়ার্ক এবং অটোমেশন গাইড।',
    readUrl: `${Env.SITE_URL}/ebook/`,
  },
];

// Authentic Founder, Leadership & Faculty Team Assets from official thrivingskill.com portal
export const CANONICAL_INSTRUCTORS: CourseAuthorItem[] = [
  {
    id: 'leader-mahmud',
    name: 'Md. Abdullah Al Mahmud',
    banglaName: 'মোঃ আব্দুল্লাহ আল মাহমুদ',
    designation: 'Founder & Chief Executive Officer (CEO)',
    banglaDesignation: 'প্রতিষ্ঠাতা ও প্রধান নির্বাহী কর্মকর্তা',
    organization: 'Thriving Skills Limited',
    localAvatar: require('../../../assets/team/abdullah_al_mahmud.jpeg'),
    bio: 'Visionary founder & CEO spearheading 21st-century human potential development, 4IR skills readiness, and bridging industry-academia gaps across Bangladesh.',
    banglaBio: 'থ্রাইভিং স্কিলসের মূল প্রতিষ্ঠাতা ও স্বপ্নদ্রষ্টা। বাংলাদেশের কর্মক্ষম তরুণদের চতুর্থ শিল্প বিপ্লব (4IR) ও এআই যুগের জন্য দক্ষ করতে নিবেদিতপ্রাণ এডটেক উদ্যোক্তা।',
    coursesCount: 12,
    studentsCount: 45000,
    profileUrl: `${Env.SITE_URL}/our_team/abdullah_al_mahmud/`,
    isFounder: true,
    category: 'founder',
    badge: 'Founder & CEO',
    banglaBadge: 'প্রতিষ্ঠাতা ও সিইও',
    expertise: ['Strategic Leadership', '4IR Skills', 'Corporate Governance', 'EdTech Innovation'],
    banglaExpertise: ['স্ট্র্যাটেজিক লিডারশিপ', '৪র্থ শিল্প বিপ্লব দক্ষতা', 'কর্পোরেট গভর্নেন্স', 'এডটেক ইনোভেশন'],
  },
  {
    id: 'leader-nuruddin',
    name: 'Syed Nuruddin Ahmed',
    banglaName: 'সৈয়দ নুরুদ্দীন আহমেদ',
    designation: 'Founder & Chairman',
    banglaDesignation: 'প্রতিষ্ঠাতা ও চেয়ারম্যান',
    organization: 'Thriving Skills Limited',
    localAvatar: require('../../../assets/team/syed_nuruddin_ahmed.jpeg'),
    bio: 'Senior corporate governance leader, institutional strategist, and founder advocating for sustainable lifelong learning ecosystems and workforce empowerment.',
    banglaBio: 'কর্পোরেট সুশাসন, প্রাতিষ্ঠানিক কৌশল ও জাতীয় মানবসম্পদ উন্নয়নে নিবেদিতপ্রাণ দূরদর্শী উদ্যোক্তা ও প্রতিষ্ঠাতা চেয়ারম্যান।',
    coursesCount: 8,
    studentsCount: 32000,
    profileUrl: `${Env.SITE_URL}/our_team/syed_nuruddin_ahmed/`,
    isFounder: true,
    category: 'founder',
    badge: 'Founder & Chairman',
    banglaBadge: 'প্রতিষ্ঠাতা ও চেয়ারম্যান',
    expertise: ['Institutional Strategy', 'Corporate Ethics', 'Board Governance', 'Human Capital'],
    banglaExpertise: ['প্রাতিষ্ঠানিক কৌশল', 'কর্পোরেট এথিক্স', 'বোর্ড গভর্নেন্স', 'মানবসম্পদ উন্নয়ন'],
  },
  {
    id: 'faculty-don',
    name: 'Ghulam Sumdany Don',
    banglaName: 'গোলাম সামদানী ডন',
    designation: 'Chief Inspirational Officer & Master Trainer',
    banglaDesignation: 'চিফ ইন্সপিরেশনাল অফিসার ও মাস্টার ট্রেইনার',
    organization: 'Don Sumdany Facilitation & Thriving Skills',
    localAvatar: require('../../../assets/team/don_sumdany.png'),
    bio: 'Leading motivational speaker, master corporate trainer, and youth leadership coach having trained over 150,000+ professionals and university graduates.',
    banglaBio: 'বাংলাদেশের শীর্ষস্থানীয় মোটিভেশনাল স্পিকার ও করপোরেট ট্রেইনার। দেড় লক্ষাধিক তরুণ ও প্রফেশনালকে সফল ক্যারিয়ার ও লিডারশিপে অনুপ্রাণিত করেছেন।',
    coursesCount: 6,
    studentsCount: 38500,
    profileUrl: `${Env.SITE_URL}/instructors/`,
    isFounder: false,
    category: 'faculty',
    badge: 'Master Mentor',
    banglaBadge: 'মাস্টার মেন্টর',
    expertise: ['Public Speaking', 'Leadership', 'Sales Psychology', 'Personal Branding'],
    banglaExpertise: ['পাবলিক স্পিকিং', 'লিডারশিপ', 'সেলস সাইকোলজি', 'পার্সোনাল ব্র্যান্ডিং'],
  },
  {
    id: 'faculty-km-ali',
    name: 'K.M. Ali',
    banglaName: 'কে. এম. আলী',
    designation: 'Lead Management Consultant & Ex-CEO',
    banglaDesignation: 'লিড ম্যানেজমেন্ট কনসালট্যান্ট ও সাবেক সিইও',
    organization: 'Ex-CEO Partex Star Group & Leading Conglomerates',
    localAvatar: require('../../../assets/team/km_ali.png'),
    bio: 'Over 35 years of senior C-suite executive leadership experience heading top conglomerates, strategic operations, and high-performance management.',
    banglaBio: 'পারটেক্স স্টার গ্রুপ সহ শীর্ষস্থানীয় করপোরেট কনগ্লোমারেটের সাবেক সিইও। ৩৫+ বছরের সিনিয়র এক্সিকিউটিভ ও স্ট্র্যাটেজিক লিডারশিপের অভিজ্ঞতা।',
    coursesCount: 5,
    studentsCount: 24600,
    profileUrl: `${Env.SITE_URL}/instructors/`,
    isFounder: false,
    category: 'faculty',
    badge: 'Executive Advisor',
    banglaBadge: 'এক্সিকিউটিভ অ্যাডভাইজর',
    expertise: ['C-Suite Leadership', 'Business Turnaround', 'Strategic Planning', 'People Management'],
    banglaExpertise: ['সি-সুইট লিডারশিপ', 'বিজনেস টার্নঅ্যারাউন্ড', 'কৌশলগত পরিকল্পনা', 'পিপল ম্যানেজমেন্ট'],
  },
  {
    id: 'faculty-arif-khan',
    name: 'Arif Khan, CFA, FCMA',
    banglaName: 'আরিফ খান, সিএফএ, এফসিএমএ',
    designation: 'Vice Chairman & Former MD/CEO IDLC Finance',
    banglaDesignation: 'ভাইস চেয়ারম্যান ও সাবেক এমডি/সিইও, আইডিএলসি',
    organization: 'Shanta Asset Management & Ex-Commissioner BSEC',
    localAvatar: require('../../../assets/team/arif_khan.png'),
    bio: 'Eminent capital market strategist, former Commissioner of BSEC, former Managing Director & CEO of IDLC Finance Limited.',
    banglaBio: 'বিশিষ্ট ক্যাপিটাল মার্কেট বিশেষজ্ঞ, সাবেক কমিশনার বিএসইসি এবং আইডিএলসি ফিন্যান্স লিমিটেডের সাবেক ব্যবস্থাপনা পরিচালক ও সিইও।',
    coursesCount: 4,
    studentsCount: 19800,
    profileUrl: `${Env.SITE_URL}/instructors/`,
    isFounder: false,
    category: 'faculty',
    badge: 'Finance Strategist',
    banglaBadge: 'ফিন্যান্স স্ট্র্যাটেজিস্ট',
    expertise: ['Financial Modeling', 'Capital Markets', 'Investment Strategy', 'Corporate Finance'],
    banglaExpertise: ['ফিন্যান্সিয়াল মডেলিং', 'ক্যাপিটাল মার্কেটস', 'ইনভেস্টমেন্ট স্ট্র্যাটেজি', 'কর্পোরেট ফিন্যান্স'],
  },
  {
    id: 'faculty-moinuddin',
    name: 'Dr. Moinuddin Chowdhury',
    banglaName: 'ড. মইনুদ্দিন চৌধুরী',
    designation: 'President SLSD & Corporate Sales Coach',
    banglaDesignation: 'প্রেসিডেন্ট, এসএলএসডি ও কর্পোরেট সেলস কোচ',
    organization: 'Society for Leadership Skills Development (SLSD)',
    localAvatar: require('../../../assets/team/moinuddin_chowdhury.png'),
    bio: 'Prominent leadership strategist, executive sales coach, NLP practitioner, and President of Society for Leadership Skills Development.',
    banglaBio: 'প্রখ্যাত লিডারশিপ স্ট্র্যাটেজিস্ট, এক্সিকিউটিভ সেলস ট্রেইনার এবং সোসাইটি ফর লিডারশিপ স্কিলস ডেভেলপমেন্ট (SLSD)-এর প্রেসিডেন্ট।',
    coursesCount: 5,
    studentsCount: 16500,
    profileUrl: `${Env.SITE_URL}/instructors/`,
    isFounder: false,
    category: 'faculty',
    badge: 'Leadership Coach',
    banglaBadge: 'লিডারশিপ কোচ',
    expertise: ['High-Impact Sales', 'NLP Coaching', 'Negotiation Skills', 'Executive Presence'],
    banglaExpertise: ['হাই-ইমপ্যাক্ট সেলস', 'এনএলপি কোচিং', 'নেগোসিয়েশন স্কিলস', 'এক্সিকিউটিভ প্রেজেন্স'],
  },
  {
    id: 'faculty-mamun-habib',
    name: 'Prof. Dr. Mamun Habib',
    banglaName: 'প্রফেসর ড. মামুন হাবিব',
    designation: 'Professor & Supply Chain Operations Specialist',
    banglaDesignation: 'অধ্যাপক ও সাপ্লাই চেইন অপারেশন্স বিশেষজ্ঞ',
    organization: 'Independent University, Bangladesh (IUB)',
    localAvatar: require('../../../assets/team/mamun_habib.jpeg'),
    bio: 'Internationally recognized academician, author, and researcher with extensive publications in supply chain management and operations research.',
    banglaBio: 'আন্তর্জাতিক খ্যাতিসম্পন্ন অধ্যাপক, গবেষক ও সাপ্লাই চেইন ম্যানেজমেন্ট বিশেষজ্ঞ। বিশ্বজুড়ে বহুল প্রশংসিত রিসার্চ ও টেক্সটবুকের লেখক।',
    coursesCount: 4,
    studentsCount: 14200,
    profileUrl: `${Env.SITE_URL}/instructors/`,
    isFounder: false,
    category: 'faculty',
    badge: 'SCM Academician',
    banglaBadge: 'সাপ্লাই চেইন বিশেষজ্ঞ',
    expertise: ['Supply Chain Management', 'Operations Research', 'Global Logistics', 'Procurement Strategy'],
    banglaExpertise: ['সাপ্লাই চেইন ম্যানেজমেন্ট', 'অপারেশন্স রিসার্চ', 'গ্লোবাল লজিস্টিকস', 'প্রকিউরমেন্ট কৌশল'],
  },
  {
    id: 'faculty-jishu',
    name: 'Jishu Tarafder',
    banglaName: 'যীশু তরফদার',
    designation: 'Chief Consultant & Motivational Author',
    banglaDesignation: 'চিফ কনসালট্যান্ট ও মোটিভেশনাল লেখক',
    organization: 'Corporate Academy & Thriving Skills',
    localAvatar: require('../../../assets/team/jishu_tarafder.png'),
    bio: 'Author of "Creating Winning Mindset", celebrated executive development coach, and consultant for multinational corporations across Asia.',
    banglaBio: 'জনপ্রিয় বই "ক্রিয়েটিং উইনিং মাইন্ডসেট"-এর লেখক, স্বনামধন্য কর্পোরেট ট্রেইনার ও এশিয়া অঞ্চলের শীর্ষ করপোরেট কনসালট্যান্ট।',
    coursesCount: 5,
    studentsCount: 21000,
    profileUrl: `${Env.SITE_URL}/instructors/`,
    isFounder: false,
    category: 'faculty',
    badge: 'Winning Mindset Author',
    banglaBadge: 'লেখক ও মেন্টর',
    expertise: ['Winning Mindset', 'Executive Communication', 'Emotional Intelligence', 'Team Dynamics'],
    banglaExpertise: ['উইনিং মাইন্ডসেট', 'এক্সিকিউটিভ কমিউনিকেশন', 'ইমোশনাল ইন্টেলিজেন্স', 'টিম ডাইনামিক্স'],
  },
  {
    id: 'faculty-humaira',
    name: 'Humaira Sharmeen',
    banglaName: 'হুমায়রা শারমীন',
    designation: 'Lead Microsoft Excel & BI Specialist',
    banglaDesignation: 'লিড মাইক্রোসফট এক্সেল ও বিআই বিশেষজ্ঞ',
    organization: 'Thriving Skills & Bangladesh Excel Summit',
    localAvatar: require('../../../assets/team/humaira_sharmeen.png'),
    bio: 'Senior analytics instructor, Microsoft Excel master trainer, and official mentor for the national Bangladesh Excel Summit championships.',
    banglaBio: 'সিনিয়র অ্যানালিটিক্স ইন্সট্রাক্টর, মাইক্রোসফট এক্সেল মাস্টার ট্রেইনার এবং বাংলাদেশ এক্সেল সামিটের অফিসিয়াল মেন্টর।',
    coursesCount: 7,
    studentsCount: 31200,
    profileUrl: `${Env.SITE_URL}/instructors/`,
    isFounder: false,
    category: 'faculty',
    badge: 'Excel & BI Master',
    banglaBadge: 'এক্সেল ও বিআই মাস্টার',
    expertise: ['Advanced Excel', 'Data Dashboards', 'Power Query', 'Business Analytics'],
    banglaExpertise: ['অ্যাডভান্সড এক্সেল', 'ডাটা ড্যাশবোর্ড', 'পাওয়ার কুয়েরি', 'বিজনেস অ্যানালিটিক্স'],
  },
  {
    id: 'team-yusuf',
    name: 'Yusuf Iqbal',
    banglaName: 'ইউসুফ ইকবাল',
    designation: 'Corporate Accountant & Operations',
    banglaDesignation: 'কর্পোরেট একাউন্ট্যান্ট ও অপারেশনস',
    organization: 'Thriving Skills Limited',
    localAvatar: require('../../../assets/team/yusuf_iqbal.jpeg'),
    bio: 'Leading institutional fiscal planning, university alliances, chambers of commerce partnerships, and operational financial compliance.',
    banglaBio: 'প্রাতিষ্ঠানিক আর্থিক পরিকল্পনা, প্রাতিষ্ঠানিক অডিট, বাণিজ্য সংগঠন ও জাতীয় বিশ্ববিদ্যালয় পার্টনারশিপ সমন্বয়কারী।',
    coursesCount: 3,
    studentsCount: 9500,
    profileUrl: `${Env.SITE_URL}/our_team/yusuf-iqbal/`,
    isFounder: false,
    category: 'leadership',
    badge: 'Finance & Operations',
    banglaBadge: 'ফিন্যান্স ও অপারেশনস',
    expertise: ['Financial Accounting', 'Taxation & Audit', 'Institutional Alliances'],
    banglaExpertise: ['ফিন্যান্সিয়াল একাউন্টিং', 'ট্যাক্স ও অডিট', 'প্রাতিষ্ঠানিক অংশীদারিত্ব'],
  },
  {
    id: 'team-sirajul',
    name: 'Sayed Sirajul Islam',
    banglaName: 'সৈয়দ সিরাজুল ইসলাম',
    designation: 'Senior Admin & Accounts Officer',
    banglaDesignation: 'সিনিয়র অ্যাডমিন ও অ্যাকাউন্টস অফিসার',
    organization: 'Thriving Skills Limited',
    avatarUrl: 'https://thrivingskill.com/wp-content/themes/eduma/images/demo_images/demo_image.jpg',
    bio: 'Heading administrative operations, corporate compliance, office administration, logistics, and accounts management at Thriving Skills Limited.',
    banglaBio: 'থ্রাইভিং স্কিলস লিমিটেডের প্রশাসনিক কার্যক্রম, করপোরেট কমপ্লায়েন্স, লজিস্টিকস ও অ্যাকাউন্টস অপারেশনস ব্যবস্থাপনা।',
    coursesCount: 2,
    studentsCount: 6400,
    profileUrl: `${Env.SITE_URL}/our_team/sayed-sirajul-islam/`,
    isFounder: false,
    category: 'leadership',
    badge: 'Admin & Accounts',
    banglaBadge: 'অ্যাডমিন ও অ্যাকাউন্টস',
    expertise: ['Administrative Operations', 'Corporate Logistics', 'Compliance Management', 'Office Administration'],
    banglaExpertise: ['প্রশাসনিক কার্যক্রম', 'করপোরেট লজিস্টিকস', 'কমপ্লায়েন্স ম্যানেজমেন্ট', 'অফিস প্রশাসন'],
  },
  {
    id: 'team-tareq',
    name: 'Md. Tareq Siddiqui',
    banglaName: 'মোঃ তারেক সিদ্দিকী',
    designation: 'Senior Executive, Production & Content Strategy',
    banglaDesignation: 'সিনিয়র এক্সিকিউটিভ, প্রোডাকশন ও কন্টেন্ট স্ট্র্যাটেজি',
    organization: 'Thriving Skills Limited',
    localAvatar: require('../../../assets/team/tareq_siddiqui.jpeg'),
    bio: 'Driving multimedia instructional production, national skills summits communications, and enterprise video learning experiences.',
    banglaBio: 'ডিজিটাল লার্নিং কন্টেন্ট প্রোডাকশন, স্টুডিও ফ্যাসিলিটেশন এবং ন্যাশনাল স্কিলস সামিটের স্ট্র্যাটেজিক যোগাযোগ সমন্বয়ক।',
    coursesCount: 3,
    studentsCount: 8200,
    profileUrl: `${Env.SITE_URL}/our_team/md-tareq-siddiqui-2/`,
    isFounder: false,
    category: 'leadership',
    badge: 'Production & Media',
    banglaBadge: 'প্রোডাকশন ও মিডিয়া',
    expertise: ['Media Production', 'Instructional Video', 'Summit Orchestration'],
    banglaExpertise: ['মিডিয়া প্রোডাকশন', 'শিক্ষামূলক ভিডিও', 'সামিট অর্কেস্ট্রেশন'],
  },
  {
    id: 'team-noman',
    name: 'Md: Abdulla Al Noman',
    banglaName: 'মোঃ আব্দুল্লাহ আল নোমান',
    designation: 'Web Developer & Platform Administrator',
    banglaDesignation: 'ওয়েব ডেভেলপার ও প্ল্যাটফর্ম অ্যাডমিনিস্ট্রেটর',
    organization: 'Thriving Skills Limited',
    localAvatar: require('../../../assets/team/abdulla_al_noman.jpeg'),
    bio: 'Architecting core LMS infrastructure, enterprise learner portals, web performance optimization, and cybersecurity.',
    banglaBio: 'থ্রাইভিং স্কিলসের মূল এলএমএস আর্কিটেকচার, ওয়েব পোর্টাল সিকিউরিটি এবং এন্টারপ্রাইজ ডিজিটাল লার্নিং ক্লাউড পরিচালনা।',
    coursesCount: 3,
    studentsCount: 7800,
    profileUrl: `${Env.SITE_URL}/our_team/md-abdulla-al-noman/`,
    isFounder: false,
    category: 'leadership',
    badge: 'Platform Engineering',
    banglaBadge: 'প্ল্যাটফর্ম ইঞ্জিনিয়ারিং',
    expertise: ['Web Architecture', 'LMS Security', 'Cloud Infrastructure'],
    banglaExpertise: ['ওয়েব আর্কিটেকচার', 'এলএমএস সিকিউরিটি', 'ক্লাউড ইনফ্রাস্ট্রাকচার'],
  },
  {
    id: 'faculty-saikat',
    name: 'Saikat Barua',
    banglaName: 'সৈকত বড়ুয়া',
    designation: 'Head of HR & Corporate Human Resource Professional',
    banglaDesignation: 'হেড অব এইচআর ও করপোরেট মানবসম্পদ বিশেষজ্ঞ',
    organization: 'Head of HR & Admin, Padma Group',
    avatarUrl: 'https://secure.gravatar.com/avatar/86a5b489636e293e9d9597410b352cf893cc837531ba5ee633cd65c9dd1dd3b0?s=200&d=mm&r=g',
    bio: 'Seasoned HR leader with 16+ years of experience in talent development, organizational culture, performance appraisal, and strategic HR management.',
    banglaBio: 'পদ্মা গ্রুপের হেড অব এইচআর অ্যান্ড অ্যাডমিন। ১৬+ বছরের মানবসম্পদ ব্যবস্থাপনা, ট্যালেন্ট ম্যানেজমেন্ট ও কর্পোরেট ট্রেনিংয়ের অভিজ্ঞতাসম্পন্ন।',
    coursesCount: 4,
    studentsCount: 12800,
    profileUrl: `${Env.SITE_URL}/instructors/`,
    isFounder: false,
    category: 'faculty',
    badge: 'HR Practitioner',
    banglaBadge: 'এইচআর প্র্যাকটিশনার',
    expertise: ['Strategic HRM', 'Performance Appraisal', 'Talent Acquisition', 'Labor Law & Compliance'],
    banglaExpertise: ['স্ট্র্যাটেজিক এইচআরএম', 'পারফরম্যান্স মূল্যায়ন', 'ট্যালেন্ট অ্যাকুইজিশন', 'শ্রম আইন ও কমপ্লায়েন্স'],
  },
  {
    id: 'faculty-nazrul',
    name: 'Dr. Nazrul Islam',
    banglaName: 'ড. নজরুল ইসলাম',
    designation: 'Professor of Management & Dean, School of Business',
    banglaDesignation: 'অধ্যাপক ও ডিন, স্কুল অব বিজনেস',
    organization: 'Leading Business Faculty & Academic Researcher',
    avatarUrl: 'https://secure.gravatar.com/avatar/d3c7abba8088eebb4ca22342944c4c0eb33bb369f48e15770a20088a3e9299ac?s=200&d=mm&r=g',
    bio: 'Eminent professor of Management, HRM and International Business. Extensive publications in international academic journals and executive consulting.',
    banglaBio: 'ব্যবস্থাপনা, এইচআরএম ও আন্তর্জাতিক বাণিজ্যের বিশিষ্ট অধ্যাপক ও গবেষক। স্কুল অব বিজনেসের ডিন হিসেবে দায়িত্ব পালনরত।',
    coursesCount: 3,
    studentsCount: 11400,
    profileUrl: `${Env.SITE_URL}/instructors/`,
    isFounder: false,
    category: 'faculty',
    badge: 'Business Faculty Dean',
    banglaBadge: 'বিজনেস ডিন ও গবেষক',
    expertise: ['International Business', 'Strategic Management', 'Organizational Behavior', 'Academic Research'],
    banglaExpertise: ['আন্তর্জাতিক বাণিজ্য', 'কৌশলগত ব্যবস্থাপনা', 'সাংগঠনিক আচরণ', 'একাডেমিক গবেষণা'],
  },
  {
    id: 'faculty-fahim',
    name: 'Fahim Adnan Khan',
    banglaName: 'ফাহিম আদনান খান',
    designation: 'Corporate Affairs & International Business Specialist',
    banglaDesignation: 'করপোরেট অ্যাফেয়ার্স ও বিজনেস ডেভেলপমেন্ট বিশেষজ্ঞ',
    organization: 'Senior Corporate Affairs Consultant (19+ Years Experience)',
    avatarUrl: 'https://secure.gravatar.com/avatar/8d70454233aee21271f7892a631e26cec1fc23366c0ab9d9f74eed83c29d4d7e?s=200&d=mm&r=g',
    bio: 'Over 19+ years of senior executive experience across corporate affairs, regulatory compliance, strategic communications, and international trade.',
    banglaBio: '১৯+ বছরের সিনিয়র এক্সিকিউটিভ অভিজ্ঞতা। করপোরেট অ্যাফেয়ার্স, রেগুলেটরি কমপ্লায়েন্স, স্ট্র্যাটেজিক কমিউনিকেশন ও বিজনেস ডেভেলপমেন্টে পারদর্শী।',
    coursesCount: 3,
    studentsCount: 9800,
    profileUrl: `${Env.SITE_URL}/instructors/`,
    isFounder: false,
    category: 'faculty',
    badge: 'Corporate Strategist',
    banglaBadge: 'করপোরেট স্ট্র্যাটেজিস্ট',
    expertise: ['Corporate Affairs', 'Regulatory Compliance', 'Strategic Alliances', 'Business Negotiations'],
    banglaExpertise: ['করপোরেট অ্যাফেয়ার্স', 'রেগুলেটরি কমপ্লায়েন্স', 'কৌশলগত অংশীদারিত্ব', 'বিজনেস নেগোসিয়েশন'],
  },
  {
    id: 'faculty-jahid',
    name: 'Jahid Hussain',
    banglaName: 'জাহিদ হোসেন',
    designation: 'International Business & Pharmaceutical Operations Director',
    banglaDesignation: 'আন্তর্জাতিক বাণিজ্য ও ফার্মাসিউটিক্যালস পরিচালক',
    organization: 'Global Export Specialist & Healthcare Consultant',
    avatarUrl: 'https://secure.gravatar.com/avatar/4d2eea19903908075937510088b9b4ac06158dc018d0670543898ff476909c26?s=200&d=mm&r=g',
    bio: 'Senior international business development director specializing in global pharmaceutical supply chain, emerging markets export, and regulatory approvals.',
    banglaBio: 'আন্তর্জাতিক বাণিজ্য উন্নয়ন বিশেষজ্ঞ। গ্লোবাল ফার্মাসিউটিক্যাল এক্সপোর্ট, উদীয়মান বাজার সম্প্রসারণ ও রেগুলেটরি প্রক্রিয়াকরণে অভিজ্ঞ।',
    coursesCount: 3,
    studentsCount: 8600,
    profileUrl: `${Env.SITE_URL}/instructors/`,
    isFounder: false,
    category: 'faculty',
    badge: 'Global Trade Director',
    banglaBadge: 'গ্লোবাল ট্রেড ডিরেক্টর',
    expertise: ['International Trade', 'Pharmaceutical Exports', 'Emerging Markets', 'Global Supply Chain'],
    banglaExpertise: ['আন্তর্জাতিক বাণিজ্য', 'ফার্মা এক্সপোর্ট', 'নতুন বাজার উন্নয়ন', 'গ্লোবাল সাপ্লাই চেইন'],
  },
  {
    id: 'faculty-farhan',
    name: 'Mohammad Osman Farhan Al Harun',
    banglaName: 'মোহাম্মদ ওসমান ফারহান আল হারুন',
    designation: 'Assistant Professor & Corporate Training Consultant',
    banglaDesignation: 'সহকারী অধ্যাপক ও করপোরেট ট্রেনিং কনসালট্যান্ট',
    organization: 'Leading University Faculty & Management Researcher',
    avatarUrl: 'https://secure.gravatar.com/avatar/c72db0f02b1bc26588f21869c85eba014184e465db5acb0fd6cfa1f01f22819f?s=200&d=mm&r=g',
    bio: 'Academician, corporate soft skills trainer, and management researcher. Studied in top UK and Bangladeshi universities.',
    banglaBio: 'সহকারী অধ্যাপক, প্রফেশনাল কর্পোরেট ট্রেইনার ও গবেষক। যুক্তরাজ্য ও বাংলাদেশের স্বনামধন্য বিশ্ববিদ্যালয়ে উচ্চশিক্ষা সম্পন্ন করেছেন।',
    coursesCount: 2,
    studentsCount: 7200,
    profileUrl: `${Env.SITE_URL}/instructors/`,
    isFounder: false,
    category: 'faculty',
    badge: 'Academic Researcher',
    banglaBadge: 'গবেষক ও ট্রেইনার',
    expertise: ['Soft Skills Mastery', 'Corporate Communication', 'Leadership Training', 'Business Research'],
    banglaExpertise: ['সফট স্কিলস', 'করপোরেট কমিউনিকেশন', 'লিডারশিপ ট্রেনিং', 'বিজনেস রিসার্চ'],
  },
  {
    id: 'faculty-tahamid',
    name: 'Tahamid',
    banglaName: 'তাহমিদ',
    designation: 'Lead MS Office & Spreadsheet Associate',
    banglaDesignation: 'মাইক্রোসফট অফিস ও স্প্রেডশিট ট্রেইনার',
    organization: 'Thriving Skills & Bangladesh Excel Summit Facilitation',
    avatarUrl: 'https://secure.gravatar.com/avatar/456dd4b3b92cc10f2fc22e19c66c61ea775738f9be80fcee7e915501c1781e89?s=200&d=mm&r=g',
    bio: 'Dedicated instructor for Microsoft Office productivity applications (Excel, PowerPoint, Word) with over 5+ years of practical training.',
    banglaBio: 'মাইক্রোসফট অফিস অ্যাপ্লিকেশনের (এক্সেল, পাওয়ারপয়েন্ট, ওয়ার্ড) পেশাদার প্রশিক্ষক। শত শত শিক্ষার্থী ও করপোরেট প্রফেশনালদের মেন্টর।',
    coursesCount: 3,
    studentsCount: 10200,
    profileUrl: `${Env.SITE_URL}/instructors/`,
    isFounder: false,
    category: 'faculty',
    badge: 'Office Specialist',
    banglaBadge: 'অফিস স্পেশালিস্ট',
    expertise: ['Microsoft Office 365', 'Data Entry & Formulas', 'Visual Presentations', 'Document Formatting'],
    banglaExpertise: ['মাইক্রোসফট অফিস ৩৬৫', 'ডাটা এন্ট্রি ও ফর্মুলা', 'ভিজ্যুয়াল প্রেজেন্টেশন', 'ডকুমেন্ট ফরম্যাটিং'],
  },
  {
    id: 'faculty-yousuf-sultan',
    name: 'Mufti Yousuf Sultan',
    banglaName: 'মুফতি ইউসুফ সুলতান',
    designation: 'Certified Shariah Advisor & Islamic Banking Expert',
    banglaDesignation: 'সার্টিফাইড শরীয়াহ অ্যাডভাইজর ও ইসলামিক ব্যাংকিং বিশেষজ্ঞ',
    organization: 'Islamic Finance Advisory & Shariah Board Member',
    avatarUrl: 'https://secure.gravatar.com/avatar/3ccd3a9f31b11a25ab558fdccedcfd3690e2657b82172f1905cd27bec3a36670?s=200&d=mm&r=g',
    bio: 'Certified Islamic finance professional, AAOIFI-certified Shariah advisor and auditor, consulting financial institutions and Islamic fintech.',
    banglaBio: 'সার্টিফাইড ইসলামিক ফিন্যান্স প্রফেশনাল, আওফি (AAOIFI) সার্টিফাইড শরীয়াহ উপদেষ্টা ও অডিটর। ইসলামিক ব্যাংকিং কোর্সের প্রধান শিক্ষক।',
    coursesCount: 2,
    studentsCount: 6800,
    profileUrl: `${Env.SITE_URL}/instructors/`,
    isFounder: false,
    category: 'faculty',
    badge: 'Shariah Advisor',
    banglaBadge: 'শরীয়াহ অ্যাডভাইজর',
    expertise: ['Islamic Banking', 'Shariah Governance', 'Halal Investment', 'Islamic FinTech'],
    banglaExpertise: ['ইসলামিক ব্যাংকিং', 'শরীয়াহ গভর্নেন্স', 'হালাল ইনভেস্টমেন্ট', 'ইসলামিক ফিনটেক'],
  },
];

export class SiteNavigationService {
  private static readonly CACHE_KEY_FEATURES = 'site_nav_features_v1';
  private static readonly CACHE_KEY_EBOOKS = 'site_nav_ebooks_v1';
  private static readonly CACHE_KEY_SERVICES = 'site_nav_services_v1';
  private static readonly CACHE_KEY_INSTRUCTORS = 'site_nav_instructors_v2';
  private static readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Get all 14 canonical features with local memory fast-path
   */
  static getFeatures(): SiteFeatureItem[] {
    const cached = CacheManager.getSync<SiteFeatureItem[]>(this.CACHE_KEY_FEATURES);
    return cached && cached.length > 0 ? cached : CANONICAL_SITE_FEATURES;
  }

  /**
   * Get corporate services list
   */
  static getServices(): PortalServiceItem[] {
    const cached = CacheManager.getSync<PortalServiceItem[]>(this.CACHE_KEY_SERVICES);
    return cached && cached.length > 0 ? cached : CANONICAL_SERVICES;
  }

  /**
   * Get eBook catalog
   */
  static getEbooks(): EbookItem[] {
    const cached = CacheManager.getSync<EbookItem[]>(this.CACHE_KEY_EBOOKS);
    return cached && cached.length > 0 ? cached : CANONICAL_EBOOKS;
  }

  /**
   * Get top course authors / instructors
   */
  static getInstructors(): CourseAuthorItem[] {
    const cached = CacheManager.getSync<CourseAuthorItem[]>(this.CACHE_KEY_INSTRUCTORS);
    return cached && cached.length > 0 ? cached : CANONICAL_INSTRUCTORS;
  }

  /**
   * Asynchronously synchronize pages and metadata from the live WordPress REST API.
   * Runs gracefully in the background without blocking the UI.
   */
  static async syncWithLiveBackend(): Promise<void> {
    try {
      // Sync WordPress Pages metadata for the 14 core slugs
      const slugs = CANONICAL_SITE_FEATURES.map((f) => f.slug).join(',');
      const pages = await HttpClient.get<any[]>(
        '/wp/v2/pages',
        {
          slug: slugs,
          per_page: 20,
          _fields: 'id,slug,link,title,excerpt',
        },
        { timeoutMs: 6000 }
      );

      if (Array.isArray(pages) && pages.length > 0) {
        const livePageMap = new Map<string, any>();
        for (const page of pages) {
          if (page.slug) {
            livePageMap.set(page.slug.toLowerCase(), page);
          }
        }

        const updatedFeatures = CANONICAL_SITE_FEATURES.map((feature) => {
          const live = livePageMap.get(feature.slug.toLowerCase());
          if (live) {
            return {
              ...feature,
              pageId: live.id || feature.pageId,
              webUrl: live.link || feature.webUrl,
            };
          }
          return feature;
        });

        await CacheManager.set(this.CACHE_KEY_FEATURES, updatedFeatures, this.CACHE_TTL_MS);
      }

      // Sync live instructors and leadership profiles
      await this.fetchInstructorsFromLiveApi();
    } catch {
      // Fallback silently to offline canonical definitions
    }
  }

  /**
   * Asynchronously synchronize and enrich leadership and faculty members from the live WordPress REST API.
   * Merges authentic canonical data with live user profiles, avatars, and links.
   */
  static async fetchInstructorsFromLiveApi(): Promise<CourseAuthorItem[]> {
    try {
      const users = await HttpClient.get<any[]>(
        '/wp/v2/users',
        {
          per_page: 100,
          _fields: 'id,name,slug,description,avatar_urls,link',
        },
        { timeoutMs: 6500 }
      );

      if (Array.isArray(users) && users.length > 0) {
        const canonical = [...CANONICAL_INSTRUCTORS];
        const userMap = new Map<string, any>();
        users.forEach((u) => {
          if (u.name) userMap.set(u.name.toLowerCase().trim(), u);
          if (u.slug) userMap.set(u.slug.toLowerCase().trim(), u);
        });

        const merged: CourseAuthorItem[] = canonical.map((author) => {
          const liveUser = userMap.get(author.name.toLowerCase().trim()) || userMap.get(author.id.replace(/^(team|faculty|leader)-/, '').toLowerCase());
          if (liveUser) {
            return {
              ...author,
              avatarUrl: liveUser.avatar_urls?.['96'] || liveUser.avatar_urls?.['48'] || author.avatarUrl,
              bio: liveUser.description ? liveUser.description.trim() : author.bio,
              profileUrl: liveUser.link || author.profileUrl,
            };
          }
          return author;
        });

        await CacheManager.set(this.CACHE_KEY_INSTRUCTORS, merged, this.CACHE_TTL_MS);
        return merged;
      }
    } catch {
      // Fallback silently to cached or canonical instructors
    }
    return this.getInstructors();
  }
}
