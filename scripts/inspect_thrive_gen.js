const https = require('https');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve({ error: e.message, raw: data }); }
      });
    }).on('error', reject);
  });
}

async function run() {
  const page = await fetchJson('https://thrivingskill.com/wp-json/wp/v2/pages?slug=thrive-gen&_embed=1');
  if (Array.isArray(page) && page.length > 0) {
    const p = page[0];
    console.log('Title:', p.title?.rendered);
    console.log('Link:', p.link);
    const content = p.content?.rendered || '';
    // Strip html tags
    const clean = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    console.log('Excerpt / Content preview:', clean.substring(0, 1000));
  } else {
    console.log('Not found:', page);
  }
}

run().catch(console.error);
