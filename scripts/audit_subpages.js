// scripts/audit_subpages.js
const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      console.log(`[GET] ${url} -> Status: ${res.statusCode}`);
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function run() {
  const urls = [
    'https://thrivingskill.com/about-us/',
    'https://thrivingskill.com/terms-conditions/',
    'https://thrivingskill.com/privacy-policy/',
    'https://thrivingskill.com/refund-policy/',
    'https://thrivingskill.com/contact-us/',
    'https://thrivingskill.com/product-category/career-track/',
    'https://thrivingskill.com/product-category/sme-business-consultancy-service/'
  ];

  for (const url of urls) {
    try {
      await fetchUrl(url);
    } catch (e) {
      console.error(`Error on ${url}:`, e.message);
    }
  }
}

run();
