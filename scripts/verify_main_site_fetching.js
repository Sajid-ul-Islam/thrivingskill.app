/**
 * Verification script to probe https://thrivingskill.com REST API
 * Checks all course endpoints, pagination, fields, categories, workshops, and branding.
 */

const https = require('https');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'ThrivingSkills-Mobile-App/1.4.0',
        'Accept': 'application/json',
      },
      timeout: 15000,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: json,
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            rawText: data.slice(0, 500),
            error: e.message,
          });
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function run() {
  console.log('=== PROBING LIVE SITE: https://thrivingskill.com ===\n');

  // 1. Check Site Root
  try {
    const root = await fetchJson('https://thrivingskill.com/wp-json/');
    console.log('1. Site Root Info:');
    console.log('   Status:', root.statusCode);
    if (root.data) {
      console.log('   Site Name:', root.data.name);
      console.log('   Description:', root.data.description);
      console.log('   Namespaces:', root.data.namespaces?.filter(n => n.includes('learnpress') || n.includes('wp/v2')));
    }
  } catch (e) {
    console.error('Root error:', e.message);
  }

  // 2. Check LearnPress Courses Endpoint
  try {
    console.log('\n2. Probing /learnpress/v1/courses (per_page=100):');
    const lpCoursesRes = await fetchJson('https://thrivingskill.com/wp-json/learnpress/v1/courses?per_page=100');
    console.log('   Status:', lpCoursesRes.statusCode);
    console.log('   Headers x-wp-total:', lpCoursesRes.headers['x-wp-total']);
    console.log('   Headers x-wp-totalpages:', lpCoursesRes.headers['x-wp-totalpages']);
    if (Array.isArray(lpCoursesRes.data)) {
      console.log('   Returned count:', lpCoursesRes.data.length);
      console.log('   First 5 Course Titles:');
      lpCoursesRes.data.slice(0, 5).forEach((c, i) => {
        console.log(`     ${i + 1}. [ID: ${c.id}] ${c.name || c.title} (Price: ${c.price}, Students: ${c.count_students})`);
      });

      // Sample first course fields
      if (lpCoursesRes.data.length > 0) {
        const sample = lpCoursesRes.data[0];
        console.log('\n   Sample Course Keys:', Object.keys(sample));
        console.log('   Sample Course ID:', sample.id);
        console.log('   Sample Course Sections:', sample.sections ? sample.sections.length : 'none');
        console.log('   Sample Course Image:', sample.image);
        console.log('   Sample Course Categories:', sample.categories);
        console.log('   Sample Course Instructor:', sample.instructor);
      }

      // Check course details for first course
      if (lpCoursesRes.data[0]) {
        const sampleId = lpCoursesRes.data[0].id;
        console.log(`\n   Probing Course Detail for ID ${sampleId}:`);
        const detailRes = await fetchJson(`https://thrivingskill.com/wp-json/learnpress/v1/courses/${sampleId}`);
        console.log('   Detail Status:', detailRes.statusCode);
        if (detailRes.data) {
          console.log('   Detail Keys:', Object.keys(detailRes.data));
          console.log('   Sections count:', Array.isArray(detailRes.data.sections) ? detailRes.data.sections.length : 0);
          if (Array.isArray(detailRes.data.sections) && detailRes.data.sections.length > 0) {
            console.log('   Section 1 items:', detailRes.data.sections[0].items?.length);
            if (detailRes.data.sections[0].items?.[0]) {
              console.log('   Sample Item in Section:', detailRes.data.sections[0].items[0]);
            }
          }
        }
      }
    } else {
      console.log('   Data is not array:', lpCoursesRes.error || lpCoursesRes.rawText);
    }
  } catch (e) {
    console.error('LP Courses error:', e.message);
  }

  // 3. Check WP core courses endpoint if any (e.g. wp/v2/lp_course or wp/v2/courses)
  try {
    console.log('\n3. Probing WP Core /wp/v2/lp_course:');
    const wpLpRes = await fetchJson('https://thrivingskill.com/wp-json/wp/v2/lp_course?per_page=5');
    console.log('   Status:', wpLpRes.statusCode);
    if (Array.isArray(wpLpRes.data)) {
      console.log('   Count:', wpLpRes.data.length);
    }
  } catch (e) {
    console.log('wp/v2/lp_course probe note:', e.message);
  }

  // 4. Check Categories
  try {
    console.log('\n4. Probing /learnpress/v1/course_category:');
    const catsRes = await fetchJson('https://thrivingskill.com/wp-json/learnpress/v1/course_category?per_page=50');
    console.log('   Status:', catsRes.statusCode);
    if (Array.isArray(catsRes.data)) {
      console.log('   Categories count:', catsRes.data.length);
      catsRes.data.forEach((cat) => {
        console.log(`     - [ID: ${cat.id}] ${cat.name} (${cat.count} courses) [slug: ${cat.slug}]`);
      });
    }
  } catch (e) {
    console.error('Categories error:', e.message);
  }

  // 5. Check Live Workshops (Category 459 or similar)
  try {
    console.log('\n5. Probing Live Workshops (/learnpress/v1/courses?category=459):');
    const wsRes = await fetchJson('https://thrivingskill.com/wp-json/learnpress/v1/courses?category=459&per_page=20');
    console.log('   Status:', wsRes.statusCode);
    if (Array.isArray(wsRes.data)) {
      console.log('   Workshops count:', wsRes.data.length);
      wsRes.data.forEach(w => {
        console.log(`     - [ID: ${w.id}] ${w.name || w.title}`);
      });
    }
  } catch (e) {
    console.error('Workshops error:', e.message);
  }

  // 6. Check Blog Posts
  try {
    console.log('\n6. Probing /wp/v2/posts (per_page=6):');
    const postsRes = await fetchJson('https://thrivingskill.com/wp-json/wp/v2/posts?per_page=6');
    console.log('   Status:', postsRes.statusCode);
    if (Array.isArray(postsRes.data)) {
      console.log('   Posts count:', postsRes.data.length);
      postsRes.data.forEach(p => {
        console.log(`     - [ID: ${p.id}] ${p.title?.rendered}`);
      });
    }
  } catch (e) {
    console.error('Posts error:', e.message);
  }
}

run();
