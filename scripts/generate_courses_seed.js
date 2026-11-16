const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

function cleanHtml(text) {
  if (!text) return '';
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#8211;/g, '–')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function parseBdtPrice(price, rendered) {
  let bdt = 0;
  if (typeof price === 'number') bdt = price;
  else if (typeof price === 'string') bdt = parseFloat(price.replace(/[^0-9.]/g, '')) || 0;
  else if (rendered) bdt = parseFloat(rendered.replace(/[^0-9.]/g, '')) || 0;
  return bdt;
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function transformWpCourse(raw) {
  const id = String(raw.id || '');
  const seed = hashString(id);
  const title = cleanHtml(raw.name || raw.title || 'Untitled Course');
  const slug = raw.slug || id;
  const excerpt = cleanHtml(raw.excerpt || raw.content || '');
  const bdtPrice = parseBdtPrice(raw.price, raw.price_rendered);
  const origPriceData = parseBdtPrice(raw.origin_price || raw.regular_price, raw.origin_price_rendered);
  const bdtOrigPrice = origPriceData > bdtPrice ? origPriceData : Math.round(bdtPrice * 1.5) || 1200;

  const categorySlugs = [];
  const categoryIds = [];
  let primaryCatSlug = '';

  if (Array.isArray(raw.categories) && raw.categories.length > 0) {
    raw.categories.forEach((cat) => {
      const s = cat.slug || String(cat.id || '');
      if (s && s !== 'published') {
        categorySlugs.push(s);
        if (cat.id || cat.term_id) categoryIds.push(cat.id || cat.term_id);
        if (!primaryCatSlug) primaryCatSlug = s;
      }
    });
  }

  if (!primaryCatSlug) {
    const textToCheck = `${title} ${slug} ${excerpt}`.toLowerCase();
    if (textToCheck.match(/bank|financ|account|tax|vat|audit|cfo|investment/)) {
      primaryCatSlug = 'finance-accounting-legal';
    } else if (textToCheck.match(/generative|prompt|gpt|llm|midjourney|claude|copilot|ai /) || textToCheck.includes(' ai')) {
      primaryCatSlug = 'generative-ai';
    } else if (textToCheck.match(/excel|spreadsheet|vba|pivot/)) {
      primaryCatSlug = 'microsoft-excel-courses';
    } else if (textToCheck.match(/data|python|power bi|tableau|analytics|sql|machine learning|deep learning/)) {
      primaryCatSlug = 'data_science';
    } else if (textToCheck.match(/leader|manage|executive|c-suite|supervis/)) {
      primaryCatSlug = 'leadership-management';
    } else if (textToCheck.match(/market|sales|branding|seo|digital marketing|ad |copywriting/)) {
      primaryCatSlug = 'sales-marketing';
    } else if (textToCheck.match(/supply chain|procurement|logistics|inventory|warehouse|contract/)) {
      primaryCatSlug = 'supply-chain-management';
    } else if (textToCheck.match(/hr|human resource|talent|recruit|payroll|kpi/)) {
      primaryCatSlug = 'human-resource-management';
    } else if (textToCheck.match(/research|academic|thesis|methodology|paper/)) {
      primaryCatSlug = 'research-courses';
    } else if (textToCheck.match(/career|job|interview|resume|cv /)) {
      primaryCatSlug = 'job-seekers-skills';
    } else if (textToCheck.match(/4ir|blockchain|iot|robot/)) {
      primaryCatSlug = '4ir';
    } else {
      primaryCatSlug = 'business';
    }
    categorySlugs.push(primaryCatSlug);
  }

  let thumbnail = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800';
  if (typeof raw.image === 'string' && raw.image.trim().length > 0) {
    thumbnail = raw.image;
  } else if (raw.image?.src) {
    thumbnail = raw.image.src;
  }

  const instructorRaw = raw.instructor || {};
  const instructor = {
    id: String(instructorRaw.id || 'ts-inst-1'),
    name: cleanHtml(instructorRaw.name || 'Thriving Skills Mentor'),
    title: 'Lead Industry Specialist',
    company: 'Thriving Skills Bangladesh',
    avatar: instructorRaw.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300',
    bio: cleanHtml(instructorRaw.bio || 'Experienced practitioner and instructor at Thriving Skills.'),
    rating: 4.8 + ((seed % 3) / 10),
    studentsCount: 200 + (seed % 650),
    coursesCount: 5,
  };

  let badge;
  if (raw.on_sale) badge = 'Trending';
  if (title.toLowerCase().includes('bundle')) badge = 'Special Bundle';
  if (title.toLowerCase().includes('ai') || title.toLowerCase().includes('gemini') || title.toLowerCase().includes('chatgpt')) {
    badge = 'Bestseller';
  }

  return {
    id,
    title,
    slug,
    subtitle: excerpt.slice(0, 120) || 'Practical skills and industry certification for career growth.',
    category: primaryCatSlug,
    categorySlugs,
    categoryIds,
    level: 'All Levels',
    rating: typeof raw.rating === 'number' && raw.rating > 0 ? Number(raw.rating.toFixed(1)) : 0,
    reviewsCount: raw.rating_count || (raw.rating > 0 ? 1 : 0),
    enrolledCount: raw.count_students || 0,
    price: Math.round((bdtPrice / 118) * 10) / 10 || 15,
    priceBdt: bdtPrice,
    originalPrice: Math.round((bdtOrigPrice / 118) * 10) / 10 || 30,
    originalPriceBdt: bdtOrigPrice,
    thumbnail,
    badge,
    durationHours: 4,
    lecturesCount: 6,
    certificateIncluded: true,
    language: 'Bangla & English',
    lastUpdated: raw.date_modified ? raw.date_modified.split('T')[0] : '2026-08',
    instructor,
    highlights: [
      'Learn directly from top industry experts in Bangladesh',
      'Hands-on practical projects ready for your portfolio',
      'Downloadable toolkits, templates, and reference materials',
      'Verified Thriving Skills Certificate of Completion',
    ],
    description: excerpt || 'Comprehensive professional training course on Thriving Skills.',
    prerequisites: ['Basic familiarity with relevant computer/web tools', 'Eagerness to upskill and advance career'],
    modules: [],
    reviews: [],
    skillTrack: title.includes('AI') ? 'Generative AI Career Track' : 'Professional Skills Track',
  };
}

async function generateSeed() {
  console.log('Fetching all courses from https://thrivingskill.com/wp-json/learnpress/v1/courses ...');
  const p1Res = await fetch('https://thrivingskill.com/wp-json/learnpress/v1/courses?per_page=100&page=1');
  const totalPages = parseInt(p1Res.headers.get('x-wp-totalpages') || '1', 10);
  const p1Data = await p1Res.json();
  let allRaw = [...p1Data];

  for (let p = 2; p <= totalPages; p++) {
    const res = await fetch(`https://thrivingskill.com/wp-json/learnpress/v1/courses?per_page=100&page=${p}`);
    const items = await res.json();
    allRaw = allRaw.concat(items);
  }

  const map = new Map();
  allRaw.forEach((c) => {
    if (c && c.id) map.set(String(c.id), c);
  });

  const uniqueCourses = Array.from(map.values()).map(transformWpCourse);
  console.log(`Retrieved ${uniqueCourses.length} unique courses.`);

  const outputPath = path.join(__dirname, '..', 'src', 'data', 'coursesCatalogSeed.json');
  fs.writeFileSync(outputPath, JSON.stringify(uniqueCourses), 'utf8');
  const stat = fs.statSync(outputPath);
  console.log(`Saved seed catalog to ${outputPath} (${(stat.size / 1024).toFixed(1)} KB)`);
}

generateSeed().catch(err => {
  console.error(err);
  process.exit(1);
});
