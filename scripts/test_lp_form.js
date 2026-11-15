const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function test() {
  const html = await fetchUrl('https://thrivingskill.com/courses/project-financing-for-banking-professionals/');
  const idx = html.indexOf('lp-btn-add-item-to-cart');
  if (idx !== -1) {
    console.log('Surrounding HTML:');
    console.log(html.substring(Math.max(0, idx - 400), Math.min(html.length, idx + 400)));
  }
}

test();
