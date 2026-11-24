/**
 * Verification test for Other Pages & Portals Sync (Thrive Gen, Insights, MoUs, Support)
 */
const fs = require('fs');
const path = require('path');

console.log('--- Checking Other Pages & Portals Sync ---');

// 1. Check ThriveGenHub
const tgPath = path.join(__dirname, '..', 'src', 'components', 'home', 'ThriveGenHub.tsx');
if (!fs.existsSync(tgPath)) {
  console.error('FAIL: ThriveGenHub.tsx missing');
  process.exit(1);
}
const tgContent = fs.readFileSync(tgPath, 'utf8');

const tgTiers = ['ssc', 'hsc', 'honours', 'masters'];
for (const tier of tgTiers) {
  if (!tgContent.includes(`level: '${tier}'`)) {
    console.error(`FAIL: Missing academic tier ${tier} in ThriveGenHub.tsx`);
    process.exit(1);
  }
}

const tgCourses = [
  'communicative-english',
  'creating-winning-mindset-2',
  'generative-ai-productivity',
  'winning-habits',
  'mastering-notebooklm',
  'linkedin-networking-career-growth',
  'presentation-mastery-using-ai',
  'chatgpt-in-research',
  'win-an-interview-skills-to-succeed',
];

for (const c of tgCourses) {
  if (!tgContent.includes(c)) {
    console.error(`FAIL: Missing Thrive Gen course ${c}`);
    process.exit(1);
  }
}
console.log('✓ ThriveGenHub verified with all 4 academic tiers & 9 live courses');

// 2. Check HomeBlogInsightsFeed
const blogFeedPath = path.join(__dirname, '..', 'src', 'components', 'home', 'HomeBlogInsightsFeed.tsx');
if (!fs.existsSync(blogFeedPath)) {
  console.error('FAIL: HomeBlogInsightsFeed.tsx missing');
  process.exit(1);
}
const blogFeedContent = fs.readFileSync(blogFeedPath, 'utf8');
const liveArticles = [
  'Staying Relevant in the AI Era',
  'Elevate Your Career: The 10 Essential Skills',
  'Mastering Contract Management',
  'How to Submit Your Income Tax eReturn',
];
for (const art of liveArticles) {
  if (!blogFeedContent.includes(art)) {
    console.error(`FAIL: Missing editorial article ${art}`);
    process.exit(1);
  }
}
console.log('✓ HomeBlogInsightsFeed verified with live thought leadership articles');

// 3. Check HomeQuickNavPills
const navPillsPath = path.join(__dirname, '..', 'src', 'components', 'home', 'HomeQuickNavPills.tsx');
if (!fs.existsSync(navPillsPath)) {
  console.error('FAIL: HomeQuickNavPills.tsx missing');
  process.exit(1);
}
const navPillsContent = fs.readFileSync(navPillsPath, 'utf8');
const expectedPills = [
  'Thrive Gen',
  'Career Bundles',
  'Insights & Blog',
  'Unlimited Pro',
  'Live Workshops',
  'About & MoUs',
  'Support Hub',
];
for (const pill of expectedPills) {
  if (!navPillsContent.includes(pill)) {
    console.error(`FAIL: Missing quick nav pill ${pill}`);
    process.exit(1);
  }
}
console.log('✓ HomeQuickNavPills verified with all 7 website portals');

// 4. Check HomeScreen integration
const homePath = path.join(__dirname, '..', 'src', 'screens', 'HomeScreen.tsx');
const homeContent = fs.readFileSync(homePath, 'utf8');
const homeChecks = [
  '<HomeQuickNavPills',
  '<ThriveGenHub',
  '<HomeBlogInsightsFeed',
  '<BlogModal',
  '<SupportContactModal',
  'handleSelectThriveGenCourse',
  'handleSelectBlogPost',
];
for (const check of homeChecks) {
  if (!homeContent.includes(check)) {
    console.error(`FAIL: Missing ${check} in HomeScreen.tsx`);
    process.exit(1);
  }
}
console.log('✓ HomeScreen verified with all new portals and modals');

// 5. Check CoursesScreen filters
const coursesPath = path.join(__dirname, '..', 'src', 'screens', 'CoursesScreen.tsx');
const coursesContent = fs.readFileSync(coursesPath, 'utf8');
if (!coursesContent.includes("'thrive-gen'") || !coursesContent.includes("'bundle-courses'")) {
  console.error('FAIL: Missing thrive-gen or bundle-courses filters in CoursesScreen.tsx');
  process.exit(1);
}
console.log('✓ CoursesScreen verified with Thrive Gen & Bundles quick chips');

console.log('\nALL OTHER PAGES & PORTALS VERIFICATIONS PASSED!');
