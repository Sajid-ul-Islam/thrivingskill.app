const https = require('https');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ error: e.message, raw: data.substring(0, 300) });
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log('--- AUDITING LIVE SITE PAGES ON https://thrivingskill.com ---');
  
  // 1. Fetch Pages
  const pages = await fetchJson('https://thrivingskill.com/wp-json/wp/v2/pages?per_page=50&_fields=id,title,slug,link');
  console.log(`\nFound ${Array.isArray(pages) ? pages.length : 0} published pages:`);
  if (Array.isArray(pages)) {
    pages.forEach(p => console.log(` - [${p.id}] ${p.title?.rendered} (${p.slug}) -> ${p.link}`));
  }

  // 2. Fetch Blog Posts
  const posts = await fetchJson('https://thrivingskill.com/wp-json/wp/v2/posts?per_page=10&_fields=id,title,slug,link,categories');
  console.log(`\nFound ${Array.isArray(posts) ? posts.length : 0} recent blog posts:`);
  if (Array.isArray(posts)) {
    posts.forEach(p => console.log(` - [${p.id}] ${p.title?.rendered} (${p.slug})`));
  }

  // 3. Fetch LearnPress collections / categories
  const lpCats = await fetchJson('https://thrivingskill.com/wp-json/wp/v2/course_category?per_page=20&_fields=id,name,slug,count');
  console.log(`\nFound ${Array.isArray(lpCats) ? lpCats.length : 0} course categories:`);
  if (Array.isArray(lpCats)) {
    lpCats.forEach(c => console.log(` - [${c.id}] ${c.name} (${c.slug}) -> ${c.count} courses`));
  }
}

run().catch(console.error);
