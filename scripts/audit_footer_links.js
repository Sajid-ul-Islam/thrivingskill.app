// scripts/audit_footer_links.js
const https = require('https');

function fetchBody(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function run() {
  const html = await fetchBody('https://thrivingskill.com/');
  const footerMatch = html.match(/<footer[\s\S]*?<\/footer>/i);
  if (footerMatch) {
    console.log('Footer found, length:', footerMatch[0].length);
    const links = footerMatch[0].match(/href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi);
    console.log('\nFooter links:');
    (links || []).forEach(l => {
      const href = l.match(/href="([^"]*)"/i)[1];
      const text = l.replace(/<[^>]*>/g, '').trim();
      console.log(`  - [${text}] -> ${href}`);
    });
  } else {
    console.log('No footer tag found');
  }
}

run();
