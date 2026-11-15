const https = require('https');

function fetchUrl(url, cookie = '') {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Cookie': cookie } }, (res) => {
      let data = '';
      const setCookies = res.headers['set-cookie'] || [];
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ data, statusCode: res.statusCode, headers: res.headers, setCookies }));
    }).on('error', reject);
  });
}

async function test() {
  const r1 = await fetchUrl('https://thrivingskill.com/cart/?add-to-cart=88322');
  console.log('r1 status:', r1.statusCode, 'cookies:', r1.setCookies);
  const cookieHeader = r1.setCookies.map(c => c.split(';')[0]).join('; ');
  
  const r2 = await fetchUrl('https://thrivingskill.com/cart/', cookieHeader);
  console.log('r2 cart html length:', r2.data.length);
  const hasCartItem = r2.data.includes('Project Financing') || r2.data.includes('cart-item') || r2.data.includes('checkout-button');
  console.log('Has cart item:', hasCartItem);
  
  const r3 = await fetchUrl('https://thrivingskill.com/checkout/', cookieHeader);
  console.log('r3 checkout html length:', r3.data.length);
  const hasCheckout = r3.data.includes('billing') || r3.data.includes('payment') || r3.data.includes('bkash');
  console.log('Has checkout elements:', hasCheckout);
  
  // Find payment gateways on checkout
  const gateways = [...r3.data.matchAll(/payment_method_[^"']*/g)].map(m => m[0]);
  console.log('Gateways on checkout page:', [...new Set(gateways)]);
}

test();
