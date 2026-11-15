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
  
  // Find all buttons or elements with lp- or course or purchase or cart
  const buttons = [...html.matchAll(/<button[^>]*>[\s\S]*?<\/button>/gi)].map(m => m[0]);
  console.log('All buttons:', buttons);

  // Find all links inside the course content or sidebar
  const courseLinks = [...html.matchAll(/<a[^>]*class="[^"]*(button|enroll|purchase|buy|cart)[^"]*"[^>]*>[\s\S]*?<\/a>/gi)].map(m => m[0]);
  console.log('Action links:', courseLinks);

  // Search for "Enroll", "Take this Course", "Start Now", "Buy Now", "Add to cart"
  const textMatches = [...html.matchAll(/>([^<]*(?:Enroll|Buy|Purchase|Cart|Add to|ভর্তি|কোর্স)[^<]*)</gi)].map(m => m[1].trim()).filter(Boolean);
  console.log('Text matches:', [...new Set(textMatches)]);

  // Let's search for LearnPress AJAX or REST calls in script tags
  const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
  scripts.forEach((s) => {
    if (s.includes('lp_') || s.includes('learn_press') || s.includes('singleCourse') || s.includes('checkout')) {
      // Find lpGlobalSettings or singleCourseData
      const matches = s.match(/(lpGlobalSettings|lpData|singleCourseData|lpCourseData)[^;]*/g);
      if (matches) console.log('Script matches:', matches);
    }
  });
}

test();
