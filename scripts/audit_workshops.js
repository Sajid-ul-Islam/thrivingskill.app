// scripts/audit_workshops.js
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
    'https://thrivingskill.com/workshops/',
    'https://thrivingskill.com/events/',
    'https://thrivingskill.com/masterclass/',
    'https://thrivingskill.com/instructors/',
    'https://thrivingskill.com/our_team/',
    'https://thrivingskill.com/faq/'
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
