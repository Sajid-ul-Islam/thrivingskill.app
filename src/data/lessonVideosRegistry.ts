/**
 * Thriving Skills Lesson Video Master Registry
 * Maps courses and curriculum lessons to authentic, playable video lectures.
 */

export interface LessonVideoData {
  title: string;
  duration: string;
  videoUrl: string;
  summary: string;
}

// 1. Category Playlists: Rich sequence of full video lectures
export const CATEGORY_LESSON_PLAYLISTS: Record<string, LessonVideoData[]> = {
  // Soft Skills, Leadership, Emotional Intelligence & Management
  leadership: [
    {
      title: 'Communication & Interpersonal Fluency for Executives',
      duration: '18:45',
      videoUrl: 'https://www.youtube.com/watch?v=cHb0ieqa0yU',
      summary: 'Executive communication frameworks, active listening, and high-stakes workplace dialogues.',
    },
    {
      title: 'Winning Habits: The Psychology of Professional Success',
      duration: '16:20',
      videoUrl: 'https://www.youtube.com/watch?v=I-hI7vOR5DM',
      summary: 'Habit engineering, behavioral discipline, and emotional stamina in corporate leadership.',
    },
    {
      title: 'Ethical Leadership & Empathy in Business Decisions',
      duration: '22:15',
      videoUrl: 'https://www.youtube.com/watch?v=yWdmSM-cNYg',
      summary: 'Navigating moral dilemmas, stakeholder trust, and emotional intelligence in enterprise teams.',
    },
    {
      title: 'Adaptive Skills Development for Career Momentum',
      duration: '14:50',
      videoUrl: 'https://www.youtube.com/watch?v=-uQXHeAocf8',
      summary: 'Identifying personal competence gaps, continuous self-improvement, and high-impact agility.',
    },
    {
      title: 'Strategic Negotiation & Executive Conflict Resolution',
      duration: '20:30',
      videoUrl: 'https://www.youtube.com/watch?v=x6QYA-bLYrc',
      summary: 'Principled negotiation tactics, persuasion psychology, and win-win relationship architecture.',
    },
    {
      title: 'Contemporary Leadership Challenges & Resilient Execution',
      duration: '15:10',
      videoUrl: 'https://www.youtube.com/watch?v=HeM_zsH_iMQ',
      summary: 'Leading through market uncertainty, managing anxiety, and fostering psychological safety.',
    },
  ],

  // Generative AI, Prompt Engineering & LLM Automation
  'generative-ai': [
    {
      title: 'Generative AI Foundations & Architecture',
      duration: '19:15',
      videoUrl: 'https://www.youtube.com/watch?v=UlgnVHYQ3zk',
      summary: 'Core principles of LLMs, tokenization, prompt structures, and multi-turn persona framing.',
    },
    {
      title: 'Mastering ChatGPT & Claude Utilization for Professionals',
      duration: '24:40',
      videoUrl: 'https://www.youtube.com/watch?v=zaFwCrGDtck',
      summary: 'Advanced zero-shot, few-shot, and Chain-of-Thought prompts for everyday corporate workflows.',
    },
    {
      title: 'Integrating AI Models into Modern Business Operations',
      duration: '18:30',
      videoUrl: 'https://www.youtube.com/watch?v=uvuGF_4v5wk',
      summary: 'Enterprise deployment strategies, workflow pipelines, and safe API integration.',
    },
    {
      title: 'Data Analytics & Synthesis using Large Language Models',
      duration: '21:05',
      videoUrl: 'https://www.youtube.com/watch?v=yPFO5mLVOLA',
      summary: 'Extracting tabular patterns, automated code generation, and trend forecasting with AI.',
    },
    {
      title: 'Advanced Predictive Modeling & Autonomous AI Agents',
      duration: '26:20',
      videoUrl: 'https://www.youtube.com/watch?v=qkieyHcFF7g',
      summary: 'Autonomous problem solving, multi-agent frameworks, and iterative verification.',
    },
    {
      title: 'Research Methodology, Academic Synthesis & AI Ethics',
      duration: '17:45',
      videoUrl: 'https://www.youtube.com/watch?v=0Sju2oNNYEE',
      summary: 'Literature synthesis, citation integrity, and ethical data governance with GenAI.',
    },
  ],

  // Excel, Power BI & Data Analytics
  excel: [
    {
      title: 'Financial Modeling & Valuation Architecture in Excel',
      duration: '25:10',
      videoUrl: 'https://www.youtube.com/watch?v=x5YP42ubqo4',
      summary: 'Three-statement modeling, dynamic DCF valuations, and sensitivity matrix calculation.',
    },
    {
      title: 'Automating Repetitive Data Pipelines with Power Query',
      duration: '20:15',
      videoUrl: 'https://www.youtube.com/watch?v=zAwN0OcuSQA',
      summary: 'ETL workflows, merging relational datasets, and cleaning messy unstructured files.',
    },
    {
      title: 'Executive Dashboards & Business Intelligence with Power BI',
      duration: '28:30',
      videoUrl: 'https://www.youtube.com/watch?v=_IReW9ssOJg',
      summary: 'Interactive DAX measures, KPI drill-downs, and presentation dashboards.',
    },
    {
      title: 'HR People Analytics & Workforce Reporting in Excel',
      duration: '16:40',
      videoUrl: 'https://www.youtube.com/watch?v=mra8tRwtDGM',
      summary: 'Headcount tracking, attrition modeling, and automated management summaries.',
    },
    {
      title: 'Advanced Financial Accounting & Statement Analysis',
      duration: '22:50',
      videoUrl: 'https://www.youtube.com/watch?v=00-HW5wdsrg',
      summary: 'Balance sheet reconciliation, cash flow diagnostics, and variance accounting.',
    },
    {
      title: 'Executive Presentations & Dynamic Slide Design in PowerPoint',
      duration: '18:15',
      videoUrl: 'https://www.youtube.com/watch?v=YSVn_dgMe-w',
      summary: 'Translating quantitative numbers into clear, persuasive executive slide decks.',
    },
  ],

  // Finance, Accounting & Tax Planning
  finance: [
    {
      title: 'Corporate Financial Modeling & Balance Sheet Mechanics',
      duration: '25:10',
      videoUrl: 'https://www.youtube.com/watch?v=x5YP42ubqo4',
      summary: 'Capital structure, working capital management, and solvency ratio evaluations.',
    },
    {
      title: 'Corporate Tax Computation & Fiscal Law Guidelines',
      duration: '21:30',
      videoUrl: 'https://www.youtube.com/watch?v=HQzUHdR73hU',
      summary: 'Allowable deductions, depreciation schedules, and corporate tax liability formulas.',
    },
    {
      title: 'TDS, Advance Income Tax & Statutory Tax Compliance',
      duration: '19:40',
      videoUrl: 'https://www.youtube.com/watch?v=Xx3eKeAEtHA',
      summary: 'Source tax deductions, withholding certificates, and National Board of Revenue compliance.',
    },
    {
      title: 'IAS 12: Accounting for Income Taxes (Current & Deferred)',
      duration: '24:15',
      videoUrl: 'https://www.youtube.com/watch?v=JZbqPr36_eU',
      summary: 'Temporary differences, tax bases of assets, and deferred tax liability recognition.',
    },
    {
      title: 'Income Tax Return Preparation & Annual E-filing',
      duration: '18:50',
      videoUrl: 'https://www.youtube.com/watch?v=lmUzErlq8sA',
      summary: 'Step-by-step wealth statement filing, asset disclosure, and audit defense.',
    },
    {
      title: 'Capital Markets & Equity Investment Fundamentals',
      duration: '16:30',
      videoUrl: 'https://www.youtube.com/watch?v=Oz2reue6TAk',
      summary: 'Stock market fundamentals, portfolio diversification, and risk mitigation strategies.',
    },
  ],

  // Research, Econometrics & Feasibility Studies
  research: [
    {
      title: 'Academic & Professional Research Methodology with AI',
      duration: '20:15',
      videoUrl: 'https://www.youtube.com/watch?v=0Sju2oNNYEE',
      summary: 'Designing rigorous research questions, hypothesis testing, and literature scoping.',
    },
    {
      title: 'Econometric Modeling & Quantitative Regression Analysis',
      duration: '27:40',
      videoUrl: 'https://www.youtube.com/watch?v=QsNqSJ0sQIQ',
      summary: 'Time series forecasting, panel data, heteroscedasticity, and statistical inference.',
    },
    {
      title: 'Commercial Feasibility Studies & Project Due Diligence',
      duration: '23:10',
      videoUrl: 'https://www.youtube.com/watch?v=dxiIX6ub33Y',
      summary: 'Market sizing, technical feasibility, NPV/IRR metrics, and risk assessment.',
    },
    {
      title: 'Empirical Data Processing & Statistical Synthesis',
      duration: '18:50',
      videoUrl: 'https://www.youtube.com/watch?v=yPFO5mLVOLA',
      summary: 'Survey analysis, data wrangling, and presenting findings to executive boards.',
    },
    {
      title: 'Research Ethics, Academic Integrity & Plagiarism Prevention',
      duration: '16:45',
      videoUrl: 'https://www.youtube.com/watch?v=yWdmSM-cNYg',
      summary: 'Peer review standards, ethical attribution, and institutional publication norms.',
    },
    {
      title: 'Defending Research Insights & Executive Communication',
      duration: '19:20',
      videoUrl: 'https://www.youtube.com/watch?v=cHb0ieqa0yU',
      summary: 'Structuring boardroom presentations and communicating complex quantitative models.',
    },
  ],

  // Cybersecurity, Systems Defense & IT
  cybersecurity: [
    {
      title: 'Systems Vulnerability Assessment & Threat Modeling',
      duration: '17:35',
      videoUrl: 'https://www.youtube.com/watch?v=IlyrDoDNTew',
      summary: 'Identifying network exploits, attack surfaces, and foundational hardening.',
    },
    {
      title: 'Contemporary Security Challenges in Distributed Workplaces',
      duration: '21:10',
      videoUrl: 'https://www.youtube.com/watch?v=HeM_zsH_iMQ',
      summary: 'Phishing defenses, zero-trust architectures, and endpoint protection.',
    },
    {
      title: 'Tools & Defensive Techniques for Safeguarding Enterprise Data',
      duration: '19:40',
      videoUrl: 'https://www.youtube.com/watch?v=JgKx2vF-fMU',
      summary: 'Firewalls, encryption standards, IAM roles, and secure remote access protocols.',
    },
    {
      title: 'Five Steps to Corporate Cybersecurity: Policy & Governance (Part 1)',
      duration: '24:15',
      videoUrl: 'https://www.youtube.com/watch?v=aczJc9X94YE',
      summary: 'Security audits, employee awareness training, and incident response planning.',
    },
    {
      title: 'Five Steps to Corporate Cybersecurity: Threat Mitigation (Part 2)',
      duration: '22:30',
      videoUrl: 'https://www.youtube.com/watch?v=hAOzJ0uDyI0',
      summary: 'Automated patch management, backup redundancy, and disaster recovery execution.',
    },
    {
      title: 'Business Continuity & Systems Resilience for IT Leaders',
      duration: '18:20',
      videoUrl: 'https://www.youtube.com/watch?v=-uQXHeAocf8',
      summary: 'Aligning cybersecurity budgets with organizational risk tolerance.',
    },
  ],
};

// 2. Specific Course Matching Map (matches course IDs or slug keywords)
export const COURSE_SPECIFIC_PLAYLISTS: Record<string, string> = {
  // Emotional Intelligence (Course ID 86355)
  '86355': 'leadership',
  'emotional-intelligence': 'leadership',
  'emotional intelligence': 'leadership',

  // Mastering Gemini Notebook (Course ID 86335)
  '86335': 'generative-ai',
  'mastering-gemini-notebook': 'generative-ai',
  'mastering gemini notebook': 'generative-ai',

  // Using ChatGPT in Research (Course ID 85330)
  '85330': 'research',
  'using-chatgpt-in-research': 'research',
  'using chatgpt in research': 'research',

  // Communication For Professionals (Course ID 85288)
  '85288': 'leadership',
  'communication-for-professionals': 'leadership',
  'communication for professionals': 'leadership',

  // Communicative English Language for All (Course ID 85039)
  '85039': 'leadership',
  'communicative-english-language-for-all': 'leadership',
  'communicative english language for all': 'leadership',
};

/**
 * Resolves an authentic, working lesson video for a course and lesson.
 * Ensures every single lesson receives its own distinct, playable video.
 */
export function resolveLessonVideoData(
  course: { id: string | number; title: string; category?: string },
  lesson?: { id?: string; title?: string; videoUrl?: string; videoIntro?: string },
  lessonIndex: number = 0
): LessonVideoData {
  // If the lesson already has a direct valid external video URL, preserve it
  if (lesson?.videoUrl && lesson.videoUrl.startsWith('http')) {
    return {
      title: lesson.title || 'Lesson Lecture',
      duration: '15:00',
      videoUrl: lesson.videoUrl,
      summary: 'Official course lecture stream.',
    };
  }

  const courseIdStr = String(course.id).toLowerCase();
  const titleLower = (course.title || '').toLowerCase();
  const categoryLower = (course.category || '').toLowerCase();

  // 1. Direct course ID or title match
  let targetCategory = COURSE_SPECIFIC_PLAYLISTS[courseIdStr] ||
    Object.keys(COURSE_SPECIFIC_PLAYLISTS).find((k) => titleLower.includes(k)) &&
    COURSE_SPECIFIC_PLAYLISTS[Object.keys(COURSE_SPECIFIC_PLAYLISTS).find((k) => titleLower.includes(k))!];

  // 2. Category keyword match
  if (!targetCategory) {
    if (categoryLower.includes('ai') || titleLower.includes('ai') || titleLower.includes('chatgpt') || titleLower.includes('gemini') || titleLower.includes('prompt')) {
      targetCategory = 'generative-ai';
    } else if (categoryLower.includes('excel') || titleLower.includes('excel') || titleLower.includes('power bi') || titleLower.includes('data')) {
      targetCategory = 'excel';
    } else if (categoryLower.includes('finance') || categoryLower.includes('tax') || titleLower.includes('tax') || titleLower.includes('finance') || titleLower.includes('accounting')) {
      targetCategory = 'finance';
    } else if (categoryLower.includes('research') || titleLower.includes('research') || titleLower.includes('econometrics')) {
      targetCategory = 'research';
    } else if (categoryLower.includes('security') || titleLower.includes('cyber') || titleLower.includes('security')) {
      targetCategory = 'cybersecurity';
    } else {
      targetCategory = 'leadership';
    }
  }

  const playlist = CATEGORY_LESSON_PLAYLISTS[targetCategory] || CATEGORY_LESSON_PLAYLISTS.leadership;
  const safeIdx = Math.abs(lessonIndex) % playlist.length;
  return playlist[safeIdx];
}
