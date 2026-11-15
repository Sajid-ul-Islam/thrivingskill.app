const https = require('https');

function getHeaders(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      resolve({ statusCode: res.statusCode, headers: res.headers });
    }).on('error', reject);
  });
}

async function test() {
  const r1 = await getHeaders('https://thrivingskill.com/checkout/?add-to-cart=88322');
  console.log('checkout ?add-to-cart status:', r1.statusCode, 'location:', r1.headers.location);

  const r2 = await getHeaders('https://thrivingskill.com/cart/?add-to-cart=88322');
  console.log('cart ?add-to-cart status:', r2.statusCode, 'location:', r2.headers.location);

  const r3 = await getHeaders('https://thrivingskill.com/checkout/');
  console.log('checkout status:', r3.statusCode, 'location:', r3.headers.location);
}

test();
