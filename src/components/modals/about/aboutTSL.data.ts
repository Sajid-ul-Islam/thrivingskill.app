export type AboutTabKey =
  | 'overview'
  | 'pillars'
  | 'partners'
  | 'summits'
  | 'leadership'
  | 'contact';

export const FOUNDER_IMAGES = {
  abdullah_al_mahmud: require('../../../../assets/team/abdullah_al_mahmud.jpeg'),
  syed_nuruddin_ahmed: require('../../../../assets/team/syed_nuruddin_ahmed.jpeg'),
  yusuf_iqbal: require('../../../../assets/team/yusuf_iqbal.jpeg'),
  tareq_siddiqui: require('../../../../assets/team/tareq_siddiqui.jpeg'),
  abdulla_al_noman: require('../../../../assets/team/abdulla_al_noman.jpeg'),
};

export function getAboutTabs(isBangla: boolean): { key: AboutTabKey; label: string; icon: string }[] {
  return [
    { key: 'overview', label: isBangla ? 'সংক্ষিপ্ত তথ্য' : 'Overview', icon: 'information-circle-outline' },
    { key: 'pillars', label: isBangla ? '৪টি মূল স্তম্ভ' : '4 Pillars', icon: 'layers-outline' },
    { key: 'partners', label: isBangla ? 'পার্টনার্স ও সহযোগী' : 'Partners & MoUs', icon: 'shield-checkmark-outline' },
    { key: 'summits', label: isBangla ? 'সামিট ও ইভেন্ট' : 'Summits', icon: 'ribbon-outline' },
    { key: 'leadership', label: isBangla ? 'নেতৃত্ব ও ফাউন্ডার্স' : 'Founders & Team', icon: 'people-outline' },
    { key: 'contact', label: isBangla ? 'যোগাযোগ ও আইনি' : 'Contact & Legal', icon: 'call-outline' },
  ];
}

export function getPartnerGroups(isBangla: boolean) {
  return [
    {
      category: isBangla
        ? 'জাতীয় বিশ্ববিদ্যালয় ও অ্যাকাডেমিক পার্টনার্স'
        : 'Academic & University Alliances',
      icon: 'school-outline',
      color: '#2563EB',
      items: [
        {
          name: 'University of Dhaka (DU) / DUCSU',
          role: isBangla ? 'জাতীয় স্কিলস সামিট কো-অর্গানাইজার' : 'National Skills Summit Co-Organizer',
          scope: isBangla
            ? 'ঢাকা বিশ্ববিদ্যালয়ের সিনেট ভবনে বাংলাদেশ স্কিলস সামিট আয়োজনের যৌথ অংশীদার। জাতীয় পুনর্গঠন ও কর্মদক্ষতা রূপান্তরে অগ্রণী।'
            : 'Co-organizer of the Bangladesh Skills Summit at the Senate Bhaban, University of Dhaka, advancing national workforce reform.',
          badge: 'DU Senate Bhaban Summit',
        },
        {
          name: 'North South University (NSU)',
          role: isBangla ? '৪আইআর সামিট ও প্লেসমেন্ট পার্টনার' : '4IR Skills Summit & Placement Partner',
          scope: isBangla
            ? 'নর্থ সাউথ ইউনিভার্সিটির ক্যারিয়ার অ্যান্ড প্লেসমেন্ট সেন্টারের (CPC) সাথে ফোর্থ ইন্ডাস্ট্রিয়াল রেভোলিউশন সামিট কো-অর্গানাইজার।'
            : 'Organized the 4th Industrial Revolution (4IR) Skills Summit with NSU’s Career and Placement Center (CPC) to equip youth with modern AI capabilities.',
          badge: 'NSU CPC Partner',
        },
        {
          name: 'Eastern University (EU)',
          role: isBangla ? 'দ্বিপাক্ষিক সমঝোতা স্মারক (MoU) স্বাক্ষরিত' : 'Official Bilateral MoU Signed',
          scope: isBangla
            ? 'শিক্ষা, গবেষণা ও প্রাতিষ্ঠানিক দক্ষতায় এআই (AI) অন্তর্ভুক্তির লক্ষ্যে আনুষ্ঠানিক চুক্তি (MoU) স্বাক্ষরিত। শিক্ষক ও কর্মকর্তাদের এআই প্রশিক্ষণ প্রদান।'
            : 'Signed a formal Memorandum of Understanding (MoU) to integrate Artificial Intelligence into university teaching, student curricula, and administrative workflows.',
          badge: 'Signed AI Integration MoU',
        },
        {
          name: 'Ahsanullah University of Science & Tech (AUST)',
          role: isBangla ? 'এমপ্লয়েবিলিটি সামিট কো-অর্গানাইজার' : 'Employability & Skills Summit Co-Organizer',
          scope: isBangla
            ? 'অস্ট স্কুল অব বিজনেস-এর যৌথ উদ্যোগে এমপ্লয়েবিলিটি অ্যান্ড স্কিলস সামিট, জব ফেয়ার এবং কর্পোরেট একাডেমি ডায়ালগ পরিচালনা।'
            : 'Partnered with AUST School of Business to host the national Employability & Skills Summit, corporate job fairs, and industry masterclasses.',
          badge: 'AUST School of Business',
        },
        {
          name: 'Comilla University (CoU) & Manarat Int. University',
          role: isBangla ? 'দক্ষতা উন্নয়ন কর্মশালা ও ফ্যাকাল্টি পার্টনার' : 'Skills Workshop & Faculty Partner',
          scope: isBangla
            ? 'শিক্ষার্থীদের ক্যারিয়ার প্রস্তুতি, সফটওয়্যার স্কিলস এবং ডেটা অ্যানালিটিক্স প্রশিক্ষণে সক্রিয় প্রাতিষ্ঠানিক অংশীদার।'
            : 'Delivering tailored masterclasses in data literacy, business presentation, and enterprise digital tools for graduating student cohorts.',
          badge: 'Regional Academic Alliances',
        },
      ],
    },
    {
      category: isBangla
        ? 'সরকারি সংস্থা ও আন্তর্জাতিক ফ্রেমওয়ার্ক'
        : 'Government & Innovation Frameworks',
      icon: 'globe-outline',
      color: '#10B981',
      items: [
        {
          name: 'Aspire to Innovate (a2i) — ICT & Cabinet Division',
          role: isBangla ? 'স্মার্ট বাংলাদেশ ও ৪আইআর পার্টনার' : 'National 4IR & Smart Workforce Partner',
          scope: isBangla
            ? 'চতুর্থ শিল্প বিপ্লবের চ্যালেঞ্জ মোকাবিলা এবং জাতীয় তরুণদের ডিজিটাল কর্মসংস্থানে যৌথ উদ্যোগ ও কনফারেন্স কোলাবরেশন।'
            : 'Strategic alignment with a2i (ICT Division & Cabinet Division, Bangladesh) for 4IR skills adoption and tech workforce readiness.',
          badge: 'a2i / ICT Division',
        },
        {
          name: 'United Nations SDG-4 (Quality Education)',
          role: isBangla ? 'টেকসই উন্নয়ন লক্ষ্যমাত্রা ৪.৪ বাস্তবায়ন' : 'UN SDG Goal 4.4 Framework',
          scope: isBangla
            ? 'জীবনব্যাপী শিক্ষা নিশ্চিতকরণ এবং তরুণ প্রজন্মের কর্মসংস্থান ও উদ্যোক্তা দক্ষতায় অবদান রাখতে এসডিজি-৪ মানদণ্ড বাস্তবায়ন।'
            : 'Dedicated to UN Sustainable Development Goal 4: Substantially increasing the percentage of skilled youth and adults ready for entrepreneurship and global careers.',
          badge: 'UN SDG-4 Quality Education',
        },
      ],
    },
    {
      category: isBangla
        ? 'পেশাদার ও জাতীয় শিল্প সমিতি'
        : 'Professional & Industry Associations',
      icon: 'briefcase-outline',
      color: '#8B5CF6',
      items: [
        {
          name: 'ICMAB (Cost & Management Accountants)',
          role: isBangla ? 'প্রফেশনাল ফিন্যান্স স্কিলিং পার্টনার' : 'Professional Finance Skilling Partner',
          scope: isBangla
            ? 'পেশাদার একাউন্ট্যান্টদের জন্য কৃত্রিম বুদ্ধিমত্তা (AI) ও প্রেডিক্টিভ বিজনেস অ্যানালিটিক্স কর্মশালা পরিচালনা।'
            : 'Joint webinars and masterclasses equipping professional cost & management accountants with applied AI in corporate finance.',
          badge: 'Chartered Professional Body',
        },
        {
          name: 'BASIS (Software & Information Services)',
          role: isBangla ? 'আইটি ইন্ডাস্ট্রি লিংকেজ ও সফটএক্সপো' : 'BASIS SoftExpo & Committee Partner',
          scope: isBangla
            ? 'জাতীয় সফটএক্সপোতে সক্রিয় অংশগ্রহণ, আইটি কমিটির প্রতিনিধিত্ব এবং সফটওয়্যার ইন্ডাস্ট্রির স্কিলস গ্যাপ দূরীকরণে কাজ।'
            : 'Engaged with BASIS SoftExpo and standing committees to connect software talent with tech employer demands.',
          badge: 'Apex IT Industry Body',
        },
      ],
    },
  ];
}

export function getNationalSummits() {
  return [
    {
      title: 'Bangladesh Skills Summit',
      badge: 'Flagship National Initiative',
      partner: 'Co-organized with DUCSU (University of Dhaka)',
      venue: 'Dhaka University Senate Bhaban',
      desc: 'Uniting policymakers, corporate titans, and academia to establish Bangladesh as a global hub of skilled human capital.',
      icon: 'business-outline',
      color: '#4F46E5',
    },
    {
      title: '4IR Skills Summit',
      badge: 'Fourth Industrial Revolution',
      partner: 'Organized with North South University (NSU)',
      venue: 'NSU Campus & Hybrid Virtual Stage',
      desc: 'Deep dives into Generative AI, enterprise robotics, prompt engineering, and workforce re-skilling for automated industries.',
      icon: 'hardware-chip-outline',
      color: '#10B981',
    },
    {
      title: 'Bangladesh Blockchain Summit',
      badge: 'Distributed Ledger & Web3',
      partner: 'Industry & Tech Alliances',
      venue: 'National Tech Auditoriums',
      desc: 'National forum on blockchain adoption, smart contracts, fin-tech security, and verifiable credentialing.',
      icon: 'shield-checkmark-outline',
      color: '#8B5CF6',
    },
    {
      title: 'Bangladesh Excel Summit',
      badge: 'Premier Data Championship',
      partner: 'bdexcelsummit.thrivingskill.com',
      venue: 'Annual Live Championship Series',
      desc: 'South Asia’s most popular financial modeling and Microsoft Excel mastery championship with speed formula challenges.',
      icon: 'grid-outline',
      color: '#059669',
    },
    {
      title: 'Employability & Skills Summit',
      badge: 'Youth & Graduate Career Bridge',
      partner: 'Top 30+ University Placement Cells',
      venue: 'Nationwide Campus Drive',
      desc: 'Connecting top graduating talent with leading MNCs, telecommunications giants, and fast-growing tech companies.',
      icon: 'people-outline',
      color: '#E34234',
    },
  ];
}

export function getLeadershipMembers(isBangla: boolean) {
  return [
    {
      name: 'Md. Abdullah Al Mahmud',
      title: isBangla ? 'প্রতিষ্ঠাতা ও প্রধান নির্বাহী কর্মকর্তা (সিইও)' : 'Founder & Chief Executive Officer (CEO)',
      badge: isBangla ? 'প্রতিষ্ঠাতা ও সিইও' : 'Founder & CEO',
      isFounder: true,
      desc: isBangla
        ? 'থ্রাইভিং স্কিলসের মূল প্রতিষ্ঠাতা ও স্বপ্নদ্রষ্টা। বাংলাদেশের কর্মক্ষম তরুণদের চতুর্থ শিল্প বিপ্লব (4IR) ও এআই যুগের জন্য দক্ষ করতে নিবেদিতপ্রাণ এডটেক উদ্যোক্তা।'
        : 'Visionary founder & CEO spearheading 21st-century human potential development, 4IR skills readiness, and bridging industry-academia gaps across Bangladesh.',
      localAvatar: FOUNDER_IMAGES.abdullah_al_mahmud,
      webAvatar: 'https://thrivingskill.com/wp-content/uploads/2015/11/About-us.jpeg',
      profileUrl: 'https://thrivingskill.com/our_team/abdullah_al_mahmud/',
      linkedin: 'https://www.linkedin.com/in/md-abdullah-al-mahmud/',
    },
    {
      name: 'Syed Nuruddin Ahmed',
      title: isBangla ? 'প্রতিষ্ঠাতা ও চেয়ারম্যান' : 'Founder & Chairman',
      badge: isBangla ? 'প্রতিষ্ঠাতা ও চেয়ারম্যান' : 'Founder & Chairman',
      isFounder: true,
      desc: isBangla
        ? 'কর্পোরেট সুশাসন, প্রাতিষ্ঠানিক কৌশল ও জাতীয় মানবসম্পদ উন্নয়নে নিবেদিতপ্রাণ দূরদর্শী উদ্যোক্তা ও প্রতিষ্ঠাতা চেয়ারম্যান।'
        : 'Senior corporate governance leader, institutional strategist, and founder advocating for sustainable lifelong learning ecosystems and workforce empowerment.',
      localAvatar: FOUNDER_IMAGES.syed_nuruddin_ahmed,
      webAvatar:
        'https://thrivingskill.com/wp-content/uploads/2015/11/WhatsApp-Image-2020-10-28-at-2.09.53-PM.jpeg',
      profileUrl: 'https://thrivingskill.com/our_team/syed_nuruddin_ahmed/',
      linkedin: undefined,
    },
    {
      name: 'Yusuf Iqbal',
      title: isBangla ? 'কর্পোরেট একাউন্ট্যান্ট ও অপারেশনস' : 'Corporate Accountant & Operations',
      badge: 'Finance & Operations',
      isFounder: false,
      desc: isBangla
        ? 'প্রাতিষ্ঠানিক আর্থিক পরিকল্পনা, প্রাতিষ্ঠানিক অডিট, বাণিজ্য সংগঠন ও জাতীয় বিশ্ববিদ্যালয় পার্টনারশিপ সমন্বয়কারী।'
        : 'Leading institutional fiscal planning, university alliances, chambers of commerce partnerships, and operational financial compliance.',
      localAvatar: FOUNDER_IMAGES.yusuf_iqbal,
      webAvatar: 'https://thrivingskill.com/wp-content/uploads/2023/06/Yusuf-Iqbal.jpeg',
      profileUrl: 'https://thrivingskill.com/our_team/yusuf-iqbal/',
      linkedin: undefined,
    },
    {
      name: 'Sayed Sirajul Islam',
      title: isBangla ? 'সিনিয়র অ্যাডমিন ও অ্যাকাউন্টস অফিসার' : 'Senior Admin & Accounts Officer',
      badge: isBangla ? 'অ্যাডমিন ও অ্যাকাউন্টস' : 'Admin & Accounts',
      isFounder: false,
      desc: isBangla
        ? 'থ্রাইভিং স্কিলস লিমিটেডের প্রশাসনিক কার্যক্রম, করপোরেট কমপ্লায়েন্স, লজিস্টিকস ও অ্যাকাউন্টস অপারেশনস ব্যবস্থাপনা।'
        : 'Heading administrative operations, corporate compliance, office administration, logistics, and accounts management at Thriving Skills Limited.',
      localAvatar: undefined,
      webAvatar: 'https://thrivingskill.com/wp-content/themes/eduma/images/demo_images/demo_image.jpg',
      profileUrl: 'https://thrivingskill.com/our_team/sayed-sirajul-islam/',
      linkedin: 'https://www.linkedin.com/in/islam-syed/',
    },
    {
      name: 'Md. Tareq Siddiqui',
      title: isBangla ? 'সিনিয়র এক্সিকিউটিভ, প্রোডাকশন' : 'Senior Executive, Production & Content Strategy',
      badge: 'Production & Media',
      isFounder: false,
      desc: isBangla
        ? 'ডিজিটাল লার্নিং কন্টেন্ট প্রোডাকশন, স্টুডিও ফ্যাসিলিটেশন এবং ন্যাশনাল স্কিলস সামিটের স্ট্র্যাটেজিক যোগাযোগ সমন্বয়ক।'
        : 'Driving multimedia instructional production, national skills summits communications, and enterprise video learning experiences.',
      localAvatar: FOUNDER_IMAGES.tareq_siddiqui,
      webAvatar: 'https://thrivingskill.com/wp-content/uploads/2023/06/file.jpeg',
      profileUrl: 'https://thrivingskill.com/our_team/md-tareq-siddiqui-2/',
      linkedin: undefined,
    },
    {
      name: 'Md: Abdulla Al Noman',
      title: isBangla ? 'ওয়েব ডেভেলপার ও প্ল্যাটফর্ম অ্যাডমিনিস্ট্রেটর' : 'Web Developer & Platform Administrator',
      badge: 'Platform Engineering',
      isFounder: false,
      desc: isBangla
        ? 'থ্রাইভিং স্কিলসের মূল এলএমএস আর্কিটেকচার, ওয়েব পোর্টাল সিকিউরিটি এবং এন্টারপ্রাইজ ডিজিটাল লার্নিং ক্লাউড পরিচালনা।'
        : 'Architecting core LMS infrastructure, enterprise learner portals, web performance optimization, and cybersecurity.',
      localAvatar: FOUNDER_IMAGES.abdulla_al_noman,
      webAvatar: 'https://thrivingskill.com/wp-content/uploads/2023/06/nOMAN.jpeg',
      profileUrl: 'https://thrivingskill.com/our_team/md-abdulla-al-noman/',
      linkedin: 'https://linkedin.com/in/abdulla-al-noman-3076b4182/',
    },
  ];
}

export const ABOUT_SOCIAL_CHANNELS = [
  { name: 'Facebook', icon: 'logo-facebook', color: '#1877F2', url: 'https://www.facebook.com/thrivingskills/' },
  { name: 'LinkedIn', icon: 'logo-linkedin', color: '#0A66C2', url: 'https://www.linkedin.com/company/thriving-skills' },
  { name: 'YouTube', icon: 'logo-youtube', color: '#FF0000', url: 'https://www.youtube.com/@ThrivingSkills' },
  { name: 'Twitter / X', icon: 'logo-twitter', color: '#1DA1F2', url: 'https://twitter.com/SkillsThriving' },
  { name: 'Instagram', icon: 'logo-instagram', color: '#E4405F', url: 'https://www.instagram.com/thriving_skills/' },
];
