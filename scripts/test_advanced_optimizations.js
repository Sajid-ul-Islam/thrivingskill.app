const { performance } = require('perf_hooks');
const courses = require('../src/data/coursesCatalogSeed.json');

console.log('Total raw courses in seed:', courses.length);

// 1. Build Search Index
const t0 = performance.now();
const indexed = courses.map((c) => ({
  ...c,
  _searchIndex: (
    c._searchIndex ||
    (c.title + ' ' + (c.subtitle || '') + ' ' + (c.instructor && c.instructor.name ? c.instructor.name : '') + ' ' + c.category + ' ' + (c.categorySlugs || []).join(' '))
  ).toLowerCase(),
}));
const tIndex = performance.now() - t0;
console.log('Search index attached in:', tIndex.toFixed(3), 'ms');

// 2. Build Inverted Category Map
const tMapStart = performance.now();
const categoryMap = new Map();
const bundles = [];

for (let i = 0; i < indexed.length; i++) {
  const c = indexed[i];
  if (c.isCareerBundle || c.title.toLowerCase().includes('bundle') || c.slug.toLowerCase().includes('bundle')) {
    bundles.push(c);
  }
  const slugs = new Set([c.category, ...(c.categorySlugs || [])]);
  slugs.forEach((s) => {
    if (!s) return;
    let list = categoryMap.get(s);
    if (!list) {
      list = [];
      categoryMap.set(s, list);
    }
    list.push(c);
  });
}
categoryMap.set('career-track', bundles);
const tMapEnd = performance.now() - tMapStart;
console.log('Inverted category map built in:', tMapEnd.toFixed(3), 'ms');
console.log('Distinct indexed category slugs:', categoryMap.size);

// 3. Test O(1) Category Retrieval vs O(N) Scan
const testCats = ['generative-ai', 'microsoft-excel-courses', 'finance-accounting-legal', 'career-track'];
testCats.forEach((cat) => {
  const tCatStart = performance.now();
  const list = categoryMap.get(cat) || [];
  const tCatEnd = performance.now() - tCatStart;
  console.log(`  -> Category [${cat}]: ${list.length} courses retrieved in ${tCatEnd.toFixed(4)} ms`);
});

// 4. Test Search with Precomputed _searchIndex
const queries = ['formula', 'ai', 'financial', 'supply', 'python'];
queries.forEach((q) => {
  const tQStart = performance.now();
  const query = q.toLowerCase();
  const matched = indexed.filter((c) => c._searchIndex.includes(query));
  const tQEnd = performance.now() - tQStart;
  console.log(`  -> Query "${q}": ${matched.length} courses matched in ${tQEnd.toFixed(4)} ms`);
});
