// scripts/check_site_features.js
const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      console.log(`[GET] ${url} -> Status: ${res.statusCode}`);
      resolve(res.statusCode);
    }).on('error', (e) => {
      console.log(`[ERR] ${url} -> ${e.message}`);
      resolve(null);
    });
  });
}

async function run() {
  const urls = [
    'https://thrivingskill.com/buyforyourteam/',
    'https://thrivingskill.com/affiliate/',
    'https://thrivingskill.com/faqs/',
    'https://thrivingskill.com/privacy-policy-bangla/',
    'https://thrivingskill.com/course/',
    'https://thrivingskill.com/courses/',
    'https://thrivingskill.com/blog/'
  ];

  for (const url of urls) {
    await fetchUrl(url);
  }
}

run();
