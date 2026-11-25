export interface BundleSubCourse {
  id: string;
  title: string;
  priceBdt: number;
}

export interface BundleConfig {
  bundleId: string;
  title: string;
  discountPercent: number;
  subCourses: BundleSubCourse[];
}

export const BUNDLE_COURSES_MAP: Record<string, BundleConfig> = {
  // Finance & Accounting Bundle (ID: 79606)
  '79606': {
    bundleId: '79606',
    title: 'Finance & Accounting Bundle – Financial Modeling, Tax & IAS',
    discountPercent: 40,
    subCourses: [
      { id: '88322', title: 'Project Financing for Banking Professionals', priceBdt: 1000 },
      { id: '87314', title: 'Financial Modeling & Business Valuation', priceBdt: 1200 },
      { id: '83301', title: 'Corporate Tax & VAT Compliance in BD', priceBdt: 1100 },
      { id: '79607', title: 'IAS & IFRS Practical Financial Reporting', priceBdt: 1300 },
      { id: '79608', title: 'Managerial Accounting & Cost Control', priceBdt: 1300 },
    ],
  },
  // Microsoft Excel Bundle (ID: 83348)
  '83348': {
    bundleId: '83348',
    title: 'Microsoft Excel Master Bundle',
    discountPercent: 35,
    subCourses: [
      { id: '9965', title: 'Most Common Features of Excel for Professionals', priceBdt: 750 },
      { id: '83464', title: 'Advanced Excel Formulas, Dashboards & Charts', priceBdt: 1500 },
      { id: '83349', title: 'Power Query & Data Cleaning with Excel', priceBdt: 1200 },
      { id: '83350', title: 'VBA & Macros Automation Masterclass', priceBdt: 1800 },
      { id: '83351', title: 'Financial Analysis Using Excel Pivot Tables', priceBdt: 1200 },
    ],
  },
  // Supply Chain Management Bundle (ID: 83301)
  '83301': {
    bundleId: '83301',
    title: 'Supply Chain Management Bundle',
    discountPercent: 38,
    subCourses: [
      { id: '9917', title: 'Supply Chain Management Fundamentals', priceBdt: 750 },
      { id: '83302', title: 'Procurement, Sourcing & Vendor Negotiation', priceBdt: 1200 },
      { id: '83303', title: 'Logistics, Warehouse & Inventory Optimization', priceBdt: 1200 },
      { id: '83304', title: 'Export-Import (EXIM) Procedures & LC Operations', priceBdt: 1500 },
      { id: '83305', title: 'Demand Planning & Forecasting Operations', priceBdt: 1100 },
    ],
  },
  // AI Bundle (ID: 82638)
  '82638': {
    bundleId: '82638',
    title: 'AI & Generative AI Professional Bundle',
    discountPercent: 45,
    subCourses: [
      { id: '88180', title: 'Presentation Mastery Using AI', priceBdt: 500 },
      { id: '88175', title: 'AI for Digital Creators', priceBdt: 1000 },
      { id: '88170', title: 'AI for Leaders & Decision Makers', priceBdt: 1000 },
      { id: '82639', title: 'Prompt Engineering for Business Workflows', priceBdt: 1200 },
      { id: '82640', title: 'Automating Corporate Tasks with Gemini & ChatGPT', priceBdt: 1500 },
    ],
  },
  // Human Resource Bundle (ID: 80304)
  '80304': {
    bundleId: '80304',
    title: 'Human Resource Bundle – 9 Courses (24 Hours)',
    discountPercent: 42,
    subCourses: [
      { id: '80305', title: 'Strategic HR Leadership & Organization Culture', priceBdt: 1200 },
      { id: '80306', title: 'Bangladesh Labor Law & Employment Compliance', priceBdt: 1500 },
      { id: '80307', title: 'Talent Acquisition, Interviewing & Headhunting', priceBdt: 1000 },
      { id: '80308', title: 'Performance Appraisal (KPI & OKR) Systems', priceBdt: 1200 },
      { id: '80309', title: 'Compensation, Payroll & Benefits Administration', priceBdt: 1400 },
    ],
  },
  // Sales & Marketing Bundle (ID: 82045)
  '82045': {
    bundleId: '82045',
    title: 'Sales & Marketing Accelerator Bundle',
    discountPercent: 40,
    subCourses: [
      { id: '82046', title: 'Digital Marketing & Growth Hacking', priceBdt: 1200 },
      { id: '82047', title: 'B2B Sales Pipeline & Closing Strategies', priceBdt: 1500 },
      { id: '82048', title: 'Social Media Content & Paid Ads Blueprint', priceBdt: 1200 },
      { id: '82049', title: 'Brand Positioning & Consumer Psychology', priceBdt: 1100 },
      { id: '82050', title: 'Copywriting & High-Converting Email Sequences', priceBdt: 1200 },
    ],
  },
};

/**
 * Retrieves bundle configuration strictly by exact course ID (no title-based guessing).
 */
export function getBundleConfigById(courseId: string): BundleConfig | null {
  return BUNDLE_COURSES_MAP[String(courseId)] || null;
}

/**
 * Backward-compatible alias that matches strictly by ID.
 */
export function getBundleConfig(courseId: string): BundleConfig | null {
  return getBundleConfigById(courseId);
}
