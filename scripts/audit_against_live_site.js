// scripts/audit_against_live_site.js
const https = require('https');
const fs = require('fs');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function audit() {
  console.log('=== AUDITING LIVE SITE https://thrivingskill.com ===\n');
  
  // 1. Check Homepage for menus, footer info, phone, email, address
  try {
    const home = await fetchUrl('https://thrivingskill.com/');
    console.log(`[Home] Status: ${home.status}, Size: ${home.data.length}`);
    
    // Check contact info
    const phones = home.data.match(/(?:\+?880|01)[0-9\s-]{8,14}/g);
    console.log('Detected Phones on Home:', [...new Set(phones || [])].slice(0, 5));
    
    const emails = home.data.match(/[a-zA-Z0-9._%+-]+@thrivingskill\.com/g);
    console.log('Detected Emails on Home:', [...new Set(emails || [])]);

    // Check main navigation links
    const navLinks = home.data.match(/href="(https:\/\/thrivingskill\.com\/[^"]*)"/g);
    const uniqueNav = [...new Set(navLinks || [])].map(l => l.replace(/href="|"/g, ''));
    console.log('\nSample Core Pages on Live Site:');
    uniqueNav.filter(u => !u.includes('/wp-content/') && !u.includes('/wp-json/')).slice(0, 20).forEach(u => console.log('  -', u));

    // Check footer address
    const addressMatch = home.data.match(/(?:House|Road|Sector|Uttara|Dhaka|Bangladesh)[^<]{10,100}/gi);
    console.log('\nAddress references:', [...new Set(addressMatch || [])].slice(0, 5));
  } catch (e) {
    console.error('Home fetch error:', e.message);
  }
}

audit();
