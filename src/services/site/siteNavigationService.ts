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
  organization: string;
  avatarUrl: string;
  bio: string;
  coursesCount: number;
  studentsCount: number;
  profileUrl: string;
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

// 6 Core Corporate Services under "Services >"
export const CANONICAL_SERVICES: PortalServiceItem[] = [
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

// Canonical certified instructors from https://thrivingskill.com/instructors/
export const CANONICAL_INSTRUCTORS: CourseAuthorItem[] = [
  {
    id: 'author-kamrul',
    name: 'Mohammad Kamrul Hasan',
    banglaName: 'মোহাম্মদ কামরুল হাসান',
    designation: 'Lead Supply Chain & Strategy Specialist',
    organization: 'Thriving Skills & Leading MNCs',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    bio: '20+ years of multinational corporate leadership across supply chain, operations, and strategic management.',
    coursesCount: 14,
    studentsCount: 18450,
    profileUrl: `${Env.SITE_URL}/instructors/`,
  },
  {
    id: 'author-fahim',
    name: 'Fahim Ahmed',
    banglaName: 'ফাহিম আহমেদ',
    designation: 'Senior Digital Transformation Consultant',
    organization: 'Tech Enterprise Solutions',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    bio: 'Specialist in enterprise software architecture, cloud platforms, and generative AI productivity systems.',
    coursesCount: 9,
    studentsCount: 12300,
    profileUrl: `${Env.SITE_URL}/instructors/`,
  },
  {
    id: 'author-nusrat',
    name: 'Dr. Nusrat Jahan',
    banglaName: 'ড. নুসরাত জাহান',
    designation: 'Head of Human Resources & Organizational Development',
    organization: 'Global Consulting Partner',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
    bio: 'Doctorate in Organizational Behavior, certified senior HR consultant and executive leadership coach.',
    coursesCount: 8,
    studentsCount: 9800,
    profileUrl: `${Env.SITE_URL}/instructors/`,
  },
  {
    id: 'author-tareq',
    name: 'Tareq Rahman',
    banglaName: 'তারেক রহমান',
    designation: 'Data Analytics & Financial Modeling Expert',
    organization: 'Financial Advisory Group',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    bio: 'Corporate trainer for financial analysis, advanced Excel dashboards, and business intelligence.',
    coursesCount: 11,
    studentsCount: 15600,
    profileUrl: `${Env.SITE_URL}/instructors/`,
  },
];

export class SiteNavigationService {
  private static readonly CACHE_KEY_FEATURES = 'site_nav_features_v1';
  private static readonly CACHE_KEY_EBOOKS = 'site_nav_ebooks_v1';
  private static readonly CACHE_KEY_SERVICES = 'site_nav_services_v1';
  private static readonly CACHE_KEY_INSTRUCTORS = 'site_nav_instructors_v1';
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
    } catch {
      // Fallback silently to offline canonical definitions
    }
  }
}
