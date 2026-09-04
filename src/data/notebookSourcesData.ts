import {
  NotebookSource,
  AudioOverviewPodcast,
  StudyGuideArtifact,
  FAQArtifact,
  RoadmapArtifact,
  FlashcardsArtifact,
  NotebookNote,
} from '../types/notebookLM';

export const DEFAULT_NOTEBOOK_SOURCES: NotebookSource[] = [
  {
    id: 'src-ai-strategy',
    title: 'Generative AI for Business Leaders & Enterprise Strategy',
    subtitle: 'Official Course Syllabus & Transcript • Thriving Skills Academy',
    type: 'course',
    courseId: 'course-ai-productivity',
    icon: 'sparkles',
    wordCount: 4850,
    isSelected: true,
    content: `Course Title: Generative AI for Business Leaders
Author: Thriving Skills Enterprise Faculty
Overview:
Generative AI represents a seismic shift in operational efficiency. This syllabus breaks down the RTCC Framework (Role, Task, Context, Constraints), enterprise API governance, multi-agent orchestration, and prompt debugging for corporate workflows.

Key Principle: RTCC Prompting Standard
1. Role: Establishes cognitive persona and domain perspective.
2. Task: Crisp, unambiguous operational instruction.
3. Context: Background facts, variables, data bounds, and stakeholder needs.
4. Constraints: Formatting rules, strict character/word limits, banned words, citation requirements.

Enterprise Multi-Agent Architecture:
Rather than relying on single monolithic prompts, high-performing organizations deploy autonomous agent chains: Researcher Agent -> Synthesizer Agent -> Compliance Auditor Agent. This drops hallucination rates from 14.2% down to under 0.8%.`,
    lastUpdated: 'Sep 2026',
  },
  {
    id: 'src-fin-modeling',
    title: 'Financial Modeling & Valuation Masterclass (DCF & LBO)',
    subtitle: 'Module 1-4 Curriculum Handbook • Thriving Skills Finance',
    type: 'course',
    courseId: 'course-financial-modeling',
    icon: 'stats-chart',
    wordCount: 5200,
    isSelected: true,
    content: `Course Title: Financial Modeling & Corporate Valuation
Faculty: Investment Banking Specialists, Thriving Skills
Overview:
Corporate valuation requires rigor in forecasting Free Cash Flow to Firm (FCFF), weighted average cost of capital (WACC), and terminal value multiples.

FCFF Formula:
FCFF = EBIT * (1 - Tax Rate) + Depreciation & Amortization - Change in Net Working Capital - Capital Expenditures (CapEx).

WACC Calculation:
WACC = (E / V * Re) + (D / V * Rd * (1 - Tc))
Where:
- E = Market value of equity
- D = Market value of debt
- V = E + D
- Re = Cost of equity (via CAPM: Rf + Beta * Market Risk Premium)
- Rd = Cost of debt
- Tc = Corporate tax rate

Terminal Value Sensitivity:
Gordon Growth perpetuity model: TV = (FCFF_final * (1 + g)) / (WACC - g).
Note: Long-term perpetual growth rate (g) should never exceed the host country's sovereign nominal GDP growth (standard benchmark: 2.0% - 2.5% in developed markets, 3.5% - 4.5% in emerging markets like Bangladesh).`,
    lastUpdated: 'Aug 2026',
  },
  {
    id: 'src-yt-prompting',
    title: 'Mastering AI Prompting & Autonomous Agents in 2026',
    subtitle: 'YouTube Masterclass Transcript • Thriving Skills Tech Channel',
    type: 'youtube',
    videoId: 'yt-ai-01',
    icon: 'logo-youtube',
    wordCount: 3100,
    isSelected: true,
    content: `YouTube Masterclass Transcript: Episode 42 - Autonomous AI Workflows
Channel: Thriving Skills Official
Host: Senior AI Architect

Timestamp [00:04:15]:
"Welcome back everyone. Today we are debunking why 90% of employees still get mediocre outputs from Claude, Gemini, and ChatGPT. It comes down to one flaw: asking questions instead of constructing constraint-bounded sandboxes.

Timestamp [00:12:30]:
When you ask an LLM to 'write an executive memo', you provide zero temperature boundaries. But when you anchor it to a known corporate standard—say, Amazon's 6-page narrative format—and demand explicit counter-arguments for each proposal, the quality jumps to tier-one management consultancy level.

Timestamp [00:24:50]:
Let's talk about Tool Use and RAG (Retrieval-Augmented Generation). In modern corporate apps like Thriving Skills, NotebookLM uses grounding vectors. That means the AI doesn't hallucinate from training data; it reads the specific PDFs and syllabi you toggle in your active sources drawer."`,
    lastUpdated: 'Sep 2026',
  },
  {
    id: 'src-leadership-comms',
    title: 'Executive Communication & Boardroom Influence',
    subtitle: 'Curriculum & Case Studies • Barbara Minto Pyramid Principle',
    type: 'course',
    courseId: 'course-leadership-comm',
    icon: 'people',
    wordCount: 3900,
    isSelected: true,
    content: `Course Title: Executive Communication & Influence
Overview:
Corporate leaders do not read chronologically. To persuade board members, investors, and C-level stakeholders, recommendations must follow the Minto Pyramid Principle.

Core Framework:
1. Conclusion First (BLUF - Bottom Line Up Front): State the core decision or recommendation in the first 15 seconds.
2. Grouping of Supporting Arguments: Group data into 3 Mutually Exclusive, Collectively Exhaustive (MECE) buckets.
3. Logical Progression: Deductive vs Inductive reasoning depending on audience skepticism.

Handling Boardroom Resistance:
When facing budget pushback from a CFO:
- Never defend with emotional appeals.
- Frame investment as OPEX risk mitigation: "Not funding this automation project costs $120,000 annually in manual reconciliations, with an 8-month payback period."`,
    lastUpdated: 'Jul 2026',
  },
  {
    id: 'src-workforce-report',
    title: 'Bangladesh & South Asia Corporate Skills Demand Index 2026',
    subtitle: 'Thriving Skills Industry Research Report • Q3 Executive Whitepaper',
    type: 'workshop',
    icon: 'newspaper',
    wordCount: 4200,
    isSelected: false,
    content: `Executive Whitepaper: 2026 Corporate Workforce Evolution
Publisher: Thriving Skills Enterprise Insights
Survey Sample: 450 HR Directors & Managing Directors across Dhaka, Chittagong & Regional MNCs.

Key Insights:
1. High-Value Skill Premium: Corporate professionals with verified certifications in Financial Modeling + AI Prompt Automation command a 42% salary premium over peers.
2. The Excel-to-Python Bridge: 68% of finance teams have transitioned standard Excel dashboards to automated reporting pipelines.
3. Continuous Micro-Learning: Companies sponsoring daily micro-learning challenges (like Skill Bite) see a 3.4x higher course completion rate than traditional weekend workshops.`,
    lastUpdated: 'Sep 2026',
  },
];

export const DEFAULT_AUDIO_PODCAST: AudioOverviewPodcast = {
  id: 'podcast-overview-1',
  title: 'Deep Dive: AI Strategy, Financial Mastery & Modern Career Agility',
  topic: 'Synthesized from 4 active Thriving Skills sources',
  durationSec: 285,
  durationFormatted: '04:45',
  speakers: [
    {
      name: 'Alex',
      role: 'Strategy & Enterprise Host',
      avatarColor: '#102F53',
    },
    {
      name: 'Maya',
      role: 'Tech & Analytics Host',
      avatarColor: '#E34234',
    },
  ],
  keyTakeaways: [
    'Why single-shot prompting fails and how the RTCC standard guarantees board-ready results',
    'DCF terminal value traps: Why perpetual growth must never exceed sovereign nominal GDP',
    'The Pyramid Principle: The 15-second BLUF technique for convincing skeptical CFOs',
    'How corporate professionals in Bangladesh and MNCs leverage combined AI + Finance skills for a 42% salary premium',
  ],
  dialogue: [
    {
      speaker: 'Alex',
      speakerRole: 'Strategy Host',
      text: "Hey everyone, welcome back to the Deep Dive! Today we're digging into some really fascinating material uploaded right from the Thriving Skills curriculum.",
      timestampSec: 0,
      timestampFormatted: '00:00',
    },
    {
      speaker: 'Maya',
      speakerRole: 'Tech & Analytics Host',
      text: "Yes! And what struck me immediately when looking across these courses—especially the AI Strategy and Financial Modeling syllabi—is how much the definition of a 'high-value professional' has changed just this year.",
      timestampSec: 14,
      timestampFormatted: '00:14',
    },
    {
      speaker: 'Alex',
      speakerRole: 'Strategy Host',
      text: "Right! Like, remember when everyone panicked and thought AI was just going to replace financial analysts? The curriculum makes a completely different—and frankly much smarter—point.",
      timestampSec: 32,
      timestampFormatted: '00:32',
    },
    {
      speaker: 'Maya',
      speakerRole: 'Tech & Analytics Host',
      text: "Exactly. It doesn't replace the analyst; it multiplies their velocity. But only if you use structured frameworks like RTCC—Role, Task, Context, Constraints. If you just ask ChatGPT 'build me a model', you get garbage.",
      timestampSec: 49,
      timestampFormatted: '00:49',
    },
    {
      speaker: 'Alex',
      speakerRole: 'Strategy Host',
      text: "Oh, 100%! And speaking of financial models, let's talk about that DCF section from the valuation masterclass. Maya, how many times have we seen people mess up Terminal Value?",
      timestampSec: 72,
      timestampFormatted: '01:12',
    },
    {
      speaker: 'Maya',
      speakerRole: 'Tech & Analytics Host',
      text: "All the time! The author explicitly warns that your perpetual growth rate, 'g', can never exceed long-term GDP growth. If your company is modeled to grow at 6% forever, you're implying it will eventually swallow the entire world economy!",
      timestampSec: 90,
      timestampFormatted: '01:30',
    },
    {
      speaker: 'Alex',
      speakerRole: 'Strategy Host',
      text: "Haha, exactly! And when you take that valuation to your board, that's where the Executive Communication syllabus kicks in with the Minto Pyramid Principle.",
      timestampSec: 115,
      timestampFormatted: '01:55',
    },
    {
      speaker: 'Maya',
      speakerRole: 'Tech & Analytics Host',
      text: "Bottom Line Up Front! Never start with a 40-slide backstory on your data cleaning. Tell the CFO in the first 15 seconds: 'We need $50,000 for this tool, it saves $120,000 a year, and the payback period is 8 months.'",
      timestampSec: 135,
      timestampFormatted: '02:15',
    },
    {
      speaker: 'Alex',
      speakerRole: 'Strategy Host',
      text: "Bang! That right there is why the Thriving Skills Industry Report found that professionals combining data literacy with executive presentation command a 42% salary premium.",
      timestampSec: 162,
      timestampFormatted: '02:42',
    },
    {
      speaker: 'Maya',
      speakerRole: 'Tech & Analytics Host',
      text: "So the big takeaway for anyone listening in the app: don't treat AI, finance, or communication in silos. The real magic happens when you connect all three.",
      timestampSec: 188,
      timestampFormatted: '03:08',
    },
    {
      speaker: 'Alex',
      speakerRole: 'Strategy Host',
      text: "Well said, Maya. Dive into the Study Guide and test yourself with the flashcards in this notebook. Catch you on the next Deep Dive!",
      timestampSec: 212,
      timestampFormatted: '03:32',
    },
  ],
};

export const DEFAULT_STUDY_GUIDE: StudyGuideArtifact = {
  title: 'Executive Mastery Study Guide: AI, Valuation & Boardroom Strategy',
  subtitle: 'Compiled across all active Thriving Skills course syllabi and whitepapers',
  sections: [
    {
      title: 'Module 1: The RTCC Enterprise Prompting Protocol',
      keyConcepts: [
        'Role specification bounds the model to high-judgment cognitive personas.',
        'Explicit constraints reduce hallucination rates from 14.2% to under 0.8%.',
        'Multi-agent chains (Researcher -> Drafter -> Auditor) outperform monolithic prompts.',
      ],
      summary:
        'Single-shot conversational prompting is inadequate for enterprise deliverables. Professionals must build reproducible prompt sandboxes using Role, Task, Context, and Constraints (RTCC).',
      formulasOrFrameworks: [
        '[ROLE] Senior Strategy Partner\n[TASK] Evaluate EBITDA margin sensitivity\n[CONTEXT] Revenue +14%, OPEX -3.2%\n[CONSTRAINTS] Max 150 words, 3 bullets, executive tone',
      ],
      examReviewQuestions: [
        {
          question: 'Why does adding a negative constraint (e.g. "Do not use generic buzzwords") improve AI precision?',
          answer:
            'It prunes high-probability generic tokens from the sampling probability distribution, forcing the model to select concrete domain-specific terminology.',
        },
      ],
    },
    {
      title: 'Module 2: Discounted Cash Flow (DCF) & Valuation Mechanics',
      keyConcepts: [
        'Free Cash Flow to Firm (FCFF) strips out debt financing distortions.',
        'WACC represents the opportunity cost of capital for both equity and debt holders.',
        'Gordon Growth Terminal Value must be bounded by nominal GDP growth rates.',
      ],
      summary:
        'Valuation is an exercise in cash conversion, not accounting accruals. DCF models must stress-test terminal values through two-way sensitivity tables across WACC and perpetual growth.',
      formulasOrFrameworks: [
        'FCFF = EBIT(1 - t) + D&A - Delta NWC - CapEx',
        'Terminal Value = (FCFF_n * (1 + g)) / (WACC - g)',
        'Beta_L = Beta_U * [1 + (1 - t) * (D / E)]',
      ],
      examReviewQuestions: [
        {
          question: 'What happens to company valuation if perpetual growth rate (g) exceeds WACC?',
          answer:
            'The denominator becomes negative or approaches zero, producing an infinite or mathematically invalid valuation. This is why g must strictly remain below WACC and GDP.',
        },
      ],
    },
    {
      title: 'Module 3: The Minto Pyramid & Stakeholder Persuasion',
      keyConcepts: [
        'BLUF (Bottom Line Up Front) commands immediate respect from executive audiences.',
        'MECE Principle (Mutually Exclusive, Collectively Exhaustive) eliminates overlapping logic.',
        'Risk framing: Presenting investments as risk mitigation neutralizes CFO skepticism.',
      ],
      summary:
        'Great technical work is useless if not communicated persuasively. The Pyramid Principle structures recommendations deductively for supportive boards and inductively for skeptical stakeholders.',
      examReviewQuestions: [
        {
          question: 'How should an operational automation budget be pitched to a risk-averse CFO?',
          answer:
            'Frame the status quo as a measurable cash bleed ("Doing nothing costs $120k/yr in rework") and highlight a sub-12-month payback period.',
        },
      ],
    },
  ],
  glossary: [
    {
      term: 'RTCC Framework',
      definition: 'Enterprise standard for prompt engineering: Role, Task, Context, Constraints.',
    },
    {
      term: 'WACC',
      definition: 'Weighted Average Cost of Capital: the average after-tax cost of a company’s capital sources.',
    },
    {
      term: 'FCFF',
      definition: 'Free Cash Flow to Firm: cash generated by operations available to all capital providers.',
    },
    {
      term: 'BLUF',
      definition: 'Bottom Line Up Front: executive communication technique stating the primary conclusion immediately.',
    },
    {
      term: 'MECE',
      definition: 'Mutually Exclusive, Collectively Exhaustive: a grouping principle preventing overlaps and gaps.',
    },
  ],
};

export const DEFAULT_FAQ: FAQArtifact = {
  title: 'Executive Briefing & Frequently Asked Questions (FAQ)',
  items: [
    {
      question: 'How does Google NotebookLM grounding prevent AI hallucinations in course materials?',
      answer:
        'NotebookLM restricts the LLM inference window strictly to the verified text chunks inside your active sources. Instead of guessing from internet training data, it indexes the course syllabi and only generates statements backed by verifiable source citations.',
      sourceCitation: 'Source [1]: Generative AI for Business Leaders & Enterprise Strategy',
    },
    {
      question: 'What is the benchmark for terminal growth rate (g) in a DCF model for emerging markets?',
      answer:
        'In emerging markets like Bangladesh, long-term perpetual growth (g) is generally benchmarked between 3.5% and 4.5%, reflecting sovereign nominal GDP growth expectations. In developed markets, it stays strictly between 2.0% and 2.5%.',
      sourceCitation: 'Source [2]: Financial Modeling & Valuation Masterclass',
    },
    {
      question: 'Why are corporate teams deploying multi-agent chains instead of single prompts?',
      answer:
        'Single prompts try to research, draft, format, and audit all at once, leading to token drift and errors. Agent chains separate roles: one agent retrieves facts, another drafts, and a third audits for compliance, dropping error rates to under 0.8%.',
      sourceCitation: 'Source [3]: YouTube Masterclass Transcript: Autonomous AI Workflows',
    },
    {
      question: 'How does the BLUF technique alter executive decision turnaround times?',
      answer:
        'Executive decision-makers make rapid trade-offs. Presenting the Bottom Line Up Front in the first 15 seconds eliminates confusion and aligns the meeting on action items rather than explanatory background.',
      sourceCitation: 'Source [4]: Executive Communication & Boardroom Influence',
    },
    {
      question: 'What skill combination provides the highest salary premium in South Asia for 2026?',
      answer:
        'According to the Thriving Skills Corporate Demand Index, professionals who combine quantitative modeling (Excel/Python/DCF) with AI workflow automation command a 42% salary premium over traditional peers.',
      sourceCitation: 'Source [5]: Bangladesh Corporate Workforce Report 2026',
    },
  ],
};

export const DEFAULT_ROADMAP: RoadmapArtifact = {
  title: '30-Day Executive Upskilling Roadmap',
  targetRole: 'Corporate Manager / Strategic Analyst / Modern Executive',
  milestones: [
    {
      week: 'Week 1',
      title: 'Prompt Architecture & Workflow Automation',
      skills: ['RTCC Prompt Construction', 'Multi-Agent Sandbox Design', 'Zero-Shot & Few-Shot Optimization'],
      recommendedCourse: 'Generative AI for Business Leaders',
      outcome: 'Build 5 automated prompt blueprints saving 6+ hours of manual reporting each week.',
    },
    {
      week: 'Week 2',
      title: 'DCF Mechanics & Valuation Stress Testing',
      skills: ['FCFF Cash Extraction', 'WACC Unlevering/Relevering', 'Sensitivity Tables'],
      recommendedCourse: 'Financial Modeling & Valuation Masterclass',
      outcome: 'Construct a complete 3-statement integrated DCF model with automated sensitivity tables.',
    },
    {
      week: 'Week 3',
      title: 'Executive Storytelling & The Minto Pyramid',
      skills: ['BLUF Executive Framing', 'MECE Argument Decomposition', 'CFO Resistance Neutralization'],
      recommendedCourse: 'Executive Communication & Boardroom Influence',
      outcome: 'Deliver a 5-minute board-level proposal with zero fluff and quantified ROI.',
    },
    {
      week: 'Week 4',
      title: 'Capstone Certification & LinkedIn Credentialing',
      skills: ['Comprehensive Skill Assessment', 'Live Case Study Defense', 'Verifiable Certificate Publishing'],
      recommendedCourse: 'Thriving Skills Capstone Assessment',
      outcome: 'Earn your verifiable QR-backed corporate credential and share directly to LinkedIn.',
    },
  ],
};

export const DEFAULT_FLASHCARDS: FlashcardsArtifact = {
  title: 'Core Concepts Active Recall Deck',
  cards: [
    {
      id: 'fc-1',
      category: 'AI Prompting',
      question: 'What does the acronym RTCC stand for in enterprise prompt engineering?',
      answer: 'Role, Task, Context, Constraints.',
      hint: 'The four building blocks of a professional prompt sandbox.',
      sourceTitle: 'Generative AI for Business Leaders',
    },
    {
      id: 'fc-2',
      category: 'Finance & Valuation',
      question: 'What is the formula for calculating Free Cash Flow to Firm (FCFF)?',
      answer: 'FCFF = EBIT * (1 - Tax Rate) + D&A - Delta NWC - CapEx.',
      hint: 'Starts with EBIT after taxes and adjusts for non-cash and working capital changes.',
      sourceTitle: 'Financial Modeling & Valuation Masterclass',
    },
    {
      id: 'fc-3',
      category: 'Valuation',
      question: 'Why must the perpetual growth rate (g) never exceed long-term GDP growth?',
      answer:
        'Because if a company grew faster than the economy in perpetuity, it would eventually become larger than the entire economy, which is economically impossible.',
      hint: 'Think about economic scale in infinity.',
      sourceTitle: 'Financial Modeling & Valuation Masterclass',
    },
    {
      id: 'fc-4',
      category: 'Communication',
      question: 'What does BLUF stand for and what is its main purpose?',
      answer:
        'Bottom Line Up Front. It ensures senior leaders hear the core decision or recommendation in the first 15 seconds.',
      hint: 'Executive communication technique used in boardrooms.',
      sourceTitle: 'Executive Communication & Boardroom Influence',
    },
    {
      id: 'fc-5',
      category: 'AI Systems',
      question: 'How do multi-agent chains reduce hallucination rates compared to monolithic prompts?',
      answer:
        'By separating tasks into specialized steps: Researcher Agent -> Synthesizer Agent -> Compliance Auditor Agent, reducing errors to under 0.8%.',
      hint: 'Specialization beats general single prompts.',
      sourceTitle: 'YouTube Masterclass: Autonomous AI Workflows',
    },
    {
      id: 'fc-6',
      category: 'Communication',
      question: 'What does the MECE principle mandate for argument grouping?',
      answer: 'Mutually Exclusive, Collectively Exhaustive: categories do not overlap and leave no gaps.',
      hint: 'Barbara Minto framework.',
      sourceTitle: 'Executive Communication & Boardroom Influence',
    },
    {
      id: 'fc-7',
      category: 'Finance',
      question: 'In WACC, why is the cost of debt multiplied by (1 - Tc)?',
      answer: 'Because interest expenses are tax-deductible, creating a corporate tax shield.',
      hint: 'Tax deductibility of interest.',
      sourceTitle: 'Financial Modeling & Valuation Masterclass',
    },
    {
      id: 'fc-8',
      category: 'Workforce Trends',
      question: 'According to the 2026 Workforce Report, what is the salary premium for combined AI + Finance skills?',
      answer: '42% salary premium over peers with single-domain skillsets.',
      hint: 'Found in the South Asia Corporate Demand Index.',
      sourceTitle: 'Bangladesh Corporate Workforce Report 2026',
    },
  ],
};

export const INITIAL_NOTEBOOK_NOTES: NotebookNote[] = [
  {
    id: 'note-1',
    title: '💡 Key Takeaway: The WACC & Terminal Value Trap',
    content:
      'Always check the Gordon Growth perpetual rate (g). If it exceeds 2.5% in developed markets or 4.5% in Bangladesh, challenge the assumption immediately. The denominator (WACC - g) is hyper-sensitive.',
    timestamp: 'Yesterday at 4:15 PM',
    tags: ['Valuation', 'DCF', 'Board Meeting'],
    isIncludedAsSource: true,
  },
  {
    id: 'note-2',
    title: '🤖 RTCC Template for Q3 Marketing Optimization',
    content:
      '[ROLE]: Senior Performance Marketer\n[TASK]: Reallocate $20,000 monthly ad spend between Meta and Google Ads for max ROAS\n[CONTEXT]: CAC on Meta jumped 18%, Google Search conversion remains steady at 4.2%\n[CONSTRAINTS]: 3 scenarios, include expected marginal CPA, under 180 words.',
    timestamp: 'Today at 10:30 AM',
    tags: ['AI Prompt', 'Strategy', 'Marketing'],
    isIncludedAsSource: false,
  },
];
