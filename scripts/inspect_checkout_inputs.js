const https = require('https');

function fetchUrl(url, cookie = '') {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Cookie': cookie } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function test() {
  const r1 = await new Promise(resolve => {
    https.get('https://thrivingskill.com/cart/?add-to-cart=88322', { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      const cookie = (res.headers['set-cookie'] || []).map(c => c.split(';')[0]).join('; ');
      resolve(cookie);
    });
  });

  const html = await fetchUrl('https://thrivingskill.com/checkout/', r1);
  const inputs = [...html.matchAll(/<input[^>]*name="([^"]+)"[^>]*>/gi)].map(m => m[1]);
  console.log('Checkout inputs:', inputs);

  // Check if there is a place order button
  const submitBtn = [...html.matchAll(/<button[^>]*id="place_order"[^>]*>[\s\S]*?<\/button>/gi)].map(m => m[0]);
  console.log('Place order button:', submitBtn);
}

test();
