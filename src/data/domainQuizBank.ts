export interface DomainQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  questionBn?: string;
  optionsBn?: string[];
  explanationBn?: string;
}

export const DOMAIN_QUIZ_BANK: Record<string, DomainQuizQuestion[]> = {
  'generative-ai': [
    {
      id: 'ai-q1',
      question: 'In the RTCC Prompt Engineering model, what does the "C" represent?',
      questionBn: 'RTCC প্রম্পট ইঞ্জিনিয়ারিং মডেলে "C" অক্ষরটি কী নির্দেশ করে?',
      options: [
        'Computation & Code',
        'Context & Constraints',
        'Creativity & Cloud',
        'Cost & Calibration',
      ],
      optionsBn: [
        'কম্পিউটেশন ও কোড',
        'কনটেক্সট ও কনস্ট্রেইন্টস',
        'সৃজনশীলতা ও ক্লাউড',
        'খরচ ও ক্যালিব্রেশন',
      ],
      correctIndex: 1,
      explanation:
        'RTCC stands for Role, Task, Context, and Constraints — ensuring reliable structured output from LLMs.',
      explanationBn:
        'RTCC মানে হলো Role (ভূমিকা), Task (কাজ), Context (প্রেক্ষাপট), এবং Constraints (সীমাবদ্ধতা) — যা এআই থেকে সঠিক উত্তর পাওয়ার ফ্রেমওয়ার্ক।',
    },
    {
      id: 'ai-q2',
      question:
        'What is the most effective architectural approach to reduce AI hallucinations in business reporting?',
      questionBn:
        'ব্যবসায়িক রিপোর্টিংয়ে এআই এর কাল্পনিক বা ভুল তথ্য (Hallucination) কমানোর সবচেয়ে নির্ভরযোগ্য উপায় কী?',
      options: [
        'Increase temperature to maximum (1.0)',
        'Retrieval-Augmented Generation (RAG) with source document injection',
        'Shortening the prompt to a single word',
        'Disabling prompt system constraints',
      ],
      optionsBn: [
        'টেম্পারেচার সর্বোচ্চ বাড়িয়ে দেওয়া',
        'সোর্স ডকুমেন্ট ইনজেকশন বা RAG প্রযুক্তি ব্যবহার করা',
        'প্রম্পট ছোট করে এক শব্দে আনা',
        'সিস্টেম সীমাবদ্ধতা বন্ধ করা',
      ],
      correctIndex: 1,
      explanation:
        'Grounding the LLM with factual source text (RAG / Context injection) dramatically eliminates hallucinations.',
      explanationBn:
        'সঠিক তথ্যসূত্র বা ডকুমেন্ট প্রম্পটে ইনজেক্ট করলে (RAG) এআই কাল্পনিক তথ্য তৈরি না করে শুধুমাত্র তথ্যের ভিত্তিতে উত্তর দেয়।',
    },
    {
      id: 'ai-q3',
      question:
        'How does adjusting LLM temperature from 0.8 to 0.1 impact enterprise automated data extraction?',
      questionBn:
        'এলএলএম-এর টেম্পারেচার ০.৮ থেকে ০.১ এ নামিয়ে আনলে এন্টারপ্রাইজ ডেটা এক্সট্রাকশনে কী প্রভাব পড়ে?',
      options: [
        'Increases creative storytelling output',
        'Enforces deterministic, reproducible, and standardized outputs',
        'Slows down model generation speed by 50%',
        'Causes random token drops',
      ],
      optionsBn: [
        'সৃজনশীল গল্প লেখার ক্ষমতা বাড়ায়',
        'আউটপুটকে সম্পূর্ণ সুনির্দিষ্ট, নির্ভরযোগ্য ও পুনরাবৃত্তিযোগ্য করে',
        'মডেলের কাজের গতি অর্ধেক কমিয়ে দেয়',
        'এলোমেলো টোকেন মুছে দেয়',
      ],
      correctIndex: 1,
      explanation:
        'Low temperature (near 0) minimizes probability randomness, making responses highly predictable and consistent for data tasks.',
      explanationBn:
        'টেম্পারেচার কম রাখলে মডেলের এলোমেলো অনুমানের সুযোগ কমে যায় এবং ডেটা অ্যানালাইসিসে একদম নির্ভুল উত্তর পাওয়া যায়।',
    },
  ],
  excel: [
    {
      id: 'xl-q1',
      question:
        'Which modern Excel formula provides two-way vertical and horizontal lookups without column number indexing?',
      questionBn: 'কোন আধুনিক এক্সেল ফর্মুলা কোনো কলাম ইনডেক্স নম্বর ছাড়াই দ্বিমুখী লুকআপ সম্পন্ন করতে পারে?',
      options: ['VLOOKUP', 'HLOOKUP', 'XLOOKUP', 'CONCATENATE'],
      optionsBn: ['VLOOKUP', 'HLOOKUP', 'XLOOKUP', 'CONCATENATE'],
      correctIndex: 2,
      explanation:
        'XLOOKUP natively searches in any direction, returns arrays, and defaults to exact match without requiring numeric column offsets.',
      explanationBn:
        'XLOOKUP স্বয়ংক্রিয়ভাবে যেকোনো দিকে লুকআপ করতে পারে এবং কলাম নম্বর গোনার কোনো ঝামেলা ছাড়াই সরাসরি মান রিটার্ন করে।',
    },
    {
      id: 'xl-q2',
      question:
        'In Excel dynamic arrays, what causes a #SPILL! error when executing formulas like =FILTER() or =SORT()?',
      questionBn: 'এক্সেলে =FILTER() বা =SORT() ফর্মুলা চালানোর সময় #SPILL! এরর কেন আসে?',
      options: [
        'Formula syntax contains typos',
        'Non-empty cells in the expected output range are blocking the formula results',
        'The workbook is saved in CSV format',
        'Hardware memory ran out',
      ],
      optionsBn: [
        'ফর্মুলার বানানে ভুল থাকলে',
        'ফলাফল আসার নির্ধারিত সেলে আগে থেকেই অন্য কোনো লেখা বা ডেটা থাকলে',
        'ফাইলটি CSV ফরম্যাটে সেভ থাকলে',
        'কম্পিউটারের র‍্যাম শেষ হয়ে গেলে',
      ],
      correctIndex: 1,
      explanation:
        'Dynamic array formulas spill results across multiple cells; if any blocking cell contains data, Excel raises #SPILL! until cleared.',
      explanationBn:
        'ডাইনামিক অ্যারে ফর্মুলার ফল একাধিক সেলে ছড়ায়। যদি সেই সেলগুলোর কোনোটিতে আগে থেকেই কিছু লেখা থাকে, তবে #SPILL! দেখায়।',
    },
    {
      id: 'xl-q3',
      question:
        'When building scalable financial and corporate models, why is hardcoding numbers in calculation formulas discouraged?',
      questionBn:
        'করপোরেট বা ফিন্যান্সিয়াল মডেল তৈরিতে ফর্মুলার ভেতর সরাসরি সংখ্যা বসানো (Hardcoding) কেন নিরুৎসাহিত করা হয়?',
      options: [
        'Excel slows down recalculation',
        'It obscures assumptions, prevents dynamic sensitivity testing, and leads to audit errors',
        'Hardcoded numbers turn negative automatically',
        'It limits sheet rows to 1,000',
      ],
      optionsBn: [
        'এক্সেল ধীরগতির হয়ে যায়',
        'অনুমানগুলো লুকিয়ে থাকে, সেনসিটিভিটি টেস্ট করা যায় না এবং অডিট এরর তৈরি হয়',
        'সংখ্যাগুলো স্বয়ংক্রিয়ভাবে নেগেটিভ হয়ে যায়',
        'রো সংখ্যা ১০০০ এর মধ্যে সীমাবদ্ধ হয়ে যায়',
      ],
      correctIndex: 1,
      explanation:
        'Separating assumptions into dedicated input cells maintains model auditability and lets variables update instantly across scenarios.',
      explanationBn:
        'ইনপুট আলাদা সেলে রাখলে যেকোনো সময় পরিবর্তন সহজে করা যায় এবং অডিটে কোনো গরমিল ধরা পড়ে না।',
    },
  ],
  finance: [
    {
      id: 'fin-q1',
      question:
        'What does the Debt Service Coverage Ratio (DSCR) measure in corporate and project financing?',
      questionBn: 'করপোরেট ও প্রজেক্ট ফাইন্যান্সিংয়ে ডেট সার্ভিস কভারেজ রেশিও (DSCR) কী পরিমাপ করে?',
      options: [
        'Total equity divided by total assets',
        'Cash flow available to service principal and interest debt obligations',
        'Annual marketing expenditure vs revenue',
        'Gross profit margin percentage',
      ],
      optionsBn: [
        'মোট ইকুইটি ও মোট সম্পদের অনুপাত',
        'ঋণের আসল ও সুদ পরিশোধ করার মতো পর্যাপ্ত নগদ প্রবাহ আছে কি না',
        'বার্ষিক বিপণন খরচ ও আয়ের অনুপাত',
        'মোট মুনাফার শতকরা হার',
      ],
      correctIndex: 1,
      explanation:
        'A DSCR above 1.25x indicates that operating cash flow comfortably covers current debt service requirements.',
      explanationBn:
        'DSCR নির্দেশ করে যে প্রতিষ্ঠানের পরিচালন নগদ প্রবাহ দিয়ে ব্যাংকের ঋণের কিস্তি ও সুদ পরিশোধ করা সম্ভব কি না (১.২৫ এর বেশি নিরাপদ)।',
    },
    {
      id: 'fin-q2',
      question:
        'In a Discounted Cash Flow (DCF) valuation, why should the terminal growth rate generally not exceed long-term GDP growth?',
      questionBn:
        'ডিসিএফ (DCF) ভ্যালুয়েশনে টার্মিনাল গ্রোথ রেট কেন দেশের দীর্ঘমেয়াদি জিডিপি প্রবৃদ্ধির বেশি হওয়া উচিত নয়?',
      options: [
        'Valuation formulas crash above 5%',
        'A rate higher than GDP implies the company will eventually outgrow the entire macroeconomic economy',
        'Taxes increase exponentially',
        'Discount rates drop to zero',
      ],
      optionsBn: [
        'ফর্মুলা ৫% এর বেশি গ্রহণ করে না',
        'জিডিপির চেয়ে বেশি হলে তাত্ত্বিকভাবে বোঝায় প্রতিষ্ঠানটি একসময় দেশের পুরো অর্থনীতির চেয়ে বড় হয়ে যাবে',
        'কর অনেক বেড়ে যায়',
        'ডিসকাউন্ট রেট শূন্য হয়ে যায়',
      ],
      correctIndex: 1,
      explanation:
        'In perpetuity, no individual corporate firm can mathematically grow faster than the economy supporting it.',
      explanationBn:
        'চিরস্থায়ী মেয়াদে কোনো একক কোম্পানি যে অর্থনীতিতে রয়েছে তার চেয়ে দ্রুতগতিতে অনির্দিষ্টকাল বাড়তে পারে না।',
    },
  ],
  leadership: [
    {
      id: 'lead-q1',
      question:
        'According to the Minto Pyramid Principle, how should executive presentations and board memos be structured?',
      questionBn: 'মিন্টো পিরামিড প্রিন্সিপাল অনুযায়ী বোর্ড মেমো বা প্রেজেন্টেশন কীভাবে সাজানো উচিত?',
      options: [
        'Chronological order of research activities',
        'Top-down: Core recommendation/conclusion first, followed by grouped supporting arguments',
        'Bottom-up: Present all raw data before revealing the main proposal on the final slide',
        'Alphabetical index of ideas',
      ],
      optionsBn: [
        'কাজের সময়ক্রম অনুযায়ী',
        'টপ-ডাউন: মূল সিদ্ধান্ত বা সুপারিশ প্রথমে, তারপর সহায়ক যুক্তিগুলো উপস্থাপন করা',
        'বটম-আপ: সব ডেটা বিস্তারিত দেখিয়ে একদম শেষে মূল প্রস্তাব রাখা',
        'বর্ণানুক্রমিকভাবে',
      ],
      correctIndex: 1,
      explanation:
        'Busy executives need the answer upfront (Answer-First) to contextualize supporting arguments immediately.',
      explanationBn:
        'উচ্চপদস্থ নির্বাহীদের কাছে প্রথমে মূল সিদ্ধান্ত বা সমাধান উপস্থাপন করতে হয়, যাতে তারা দ্রুত বিষয়টি ধরতে পারেন।',
    },
    {
      id: 'lead-q2',
      question:
        'In Daniel Goleman’s Emotional Intelligence framework, what is the fundamental foundation for empathy and self-regulation?',
      questionBn:
        'ড্যানিয়েল গোলম্যানের ইমোশনাল ইন্টেলিজেন্স মডেলে সহানুভূতি ও আত্মনিয়ন্ত্রণের মূল ভিত্তি কোনটি?',
      options: ['Cognitive IQ', 'Self-Awareness', 'Authoritative Command', 'Extroversion'],
      optionsBn: ['সাধারণ আইকিউ', 'আত্ম-সচেতনতা (Self-Awareness)', 'কঠোর কর্তৃত্ব', 'বহির্মুখী স্বভাব'],
      correctIndex: 1,
      explanation:
        'Self-awareness is the bedrock of EQ; recognizing your own emotions and triggers is essential before managing teams or reading others.',
      explanationBn:
        'নিজের আবেগ ও প্রতিক্রিয়া বুঝতে পারাই (আত্ম-সচেতনতা) অন্যদের অনুধাবন ও সফল নেতৃত্বের মূল ভিত্তি।',
    },
  ],
  'data-science': [
    {
      id: 'ds-q1',
      question:
        'When analyzing customer retention and recurring revenue, why is cohort analysis superior to aggregate monthly churn?',
      questionBn:
        'গ্রাহক ধরে রাখা এবং সাবস্ক্রিপশন আয়ের বিশ্লেষণে সামগ্রিক চার্নের চেয়ে কোহর্ট অ্যানালাইসিস কেন বেশি কার্যকর?',
      options: [
        'It requires less computation',
        'It tracks specific join-period groups over time, identifying exactly when and why user drop-offs occur',
        'It eliminates seasonality automatically',
        'It works only on mobile apps',
      ],
      optionsBn: [
        'হিসাব করা সহজ',
        'নির্দিষ্ট সময়ে যুক্ত হওয়া দলগুলোকে ট্র্যাক করে বোঝা যায় কোন পর্যায়ে গ্রাহকরা ড্রপ করছে',
        'মৌসুমি প্রভাব দূর করে',
        'শুধু অ্যাপে কাজ করে',
      ],
      correctIndex: 1,
      explanation:
        'Cohort charts reveal behavioral patterns tied to onboarding cohorts and product updates rather than masking shifts in monthly averages.',
      explanationBn:
        'কোহর্ট অ্যানালাইসিস দেখায় কোন ব্যাচের গ্রাহক কতদিন পর চলে যাচ্ছে, যা সামগ্রিক মাসিক হিসাবে বোঝা যায় না।',
    },
    {
      id: 'ds-q2',
      question:
        'In SQL database queries, what is the distinct advantage of window functions (e.g. ROW_NUMBER, OVER (PARTITION BY...))?',
      questionBn: 'এসকিউএল কোয়েরিতে উইন্ডো ফাংশনের (যেমন ROW_NUMBER() OVER (...)) মূল সুবিধা কী?',
      options: [
        'They delete duplicate rows permanently',
        'They perform aggregate calculations across row subsets without collapsing individual rows like GROUP BY does',
        'They encrypt column data',
        'They bypass database indexing',
      ],
      optionsBn: [
        'ডুপ্লিকেট রো চিরতরে মুছে দেয়',
        'GROUP BY এর মতো রো সংক্ষিপ্ত না করেই প্রতিটি সারির পাশাপাশি সামগ্রিক হিসাব বের করা যায়',
        'কলামের ডেটা এনক্রিপ্ট করে',
        'ইনডেক্সিং বাতিল করে',
      ],
      correctIndex: 1,
      explanation:
        'Window functions preserve row identities while calculating running totals, rankings, and moving averages.',
      explanationBn:
        'উইন্ডো ফাংশন প্রতিটি রো অক্ষুণ্ণ রেখে র‍্যাঙ্কিং বা রানিং টোটাল হিসাব করার অসাধারণ সুবিধা দেয়।',
    },
  ],
};

/**
 * Returns domain-tailored questions for a given course title or category.
 */
export function getDomainQuestionsForCourse(
  courseTitle: string,
  categoryId?: string,
  isBangla?: boolean
): {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}[] {
  const titleLower = (courseTitle || '').toLowerCase();
  const cat = (categoryId || '').toLowerCase();

  let selectedDomain = 'general';

  if (
    cat.includes('ai') ||
    cat.includes('generative') ||
    titleLower.includes('ai') ||
    titleLower.includes('chatgpt') ||
    titleLower.includes('prompt') ||
    titleLower.includes('notebooklm') ||
    titleLower.includes('gemini')
  ) {
    selectedDomain = 'generative-ai';
  } else if (
    titleLower.includes('excel') ||
    titleLower.includes('spreadsheet') ||
    titleLower.includes('vlookup')
  ) {
    selectedDomain = 'excel';
  } else if (
    cat.includes('finance') ||
    cat.includes('banking') ||
    cat.includes('account') ||
    titleLower.includes('financ') ||
    titleLower.includes('banking') ||
    titleLower.includes('valuation') ||
    titleLower.includes('stock') ||
    titleLower.includes('credit') ||
    titleLower.includes('cotton')
  ) {
    selectedDomain = 'finance';
  } else if (
    cat.includes('data') ||
    cat.includes('science') ||
    cat.includes('analytics') ||
    titleLower.includes('data') ||
    titleLower.includes('analytics') ||
    titleLower.includes('powerbi') ||
    titleLower.includes('sql')
  ) {
    selectedDomain = 'data-science';
  } else if (
    cat.includes('leadership') ||
    cat.includes('management') ||
    cat.includes('hr') ||
    titleLower.includes('leadership') ||
    titleLower.includes('management') ||
    titleLower.includes('presentation') ||
    titleLower.includes('communication') ||
    titleLower.includes('mindset')
  ) {
    selectedDomain = 'leadership';
  } else {
    // Default to generative-ai if tech or general leadership
    selectedDomain = 'generative-ai';
  }

  const list = DOMAIN_QUIZ_BANK[selectedDomain] || DOMAIN_QUIZ_BANK['generative-ai'];

  return list.map((item) => ({
    id: item.id,
    question: isBangla && item.questionBn ? item.questionBn : item.question,
    options: isBangla && item.optionsBn ? item.optionsBn : item.options,
    correctIndex: item.correctIndex,
    explanation: isBangla && item.explanationBn ? item.explanationBn : item.explanation,
  }));
}
