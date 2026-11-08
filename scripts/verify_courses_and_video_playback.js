const https = require('https');
const assert = require('assert');

console.log('================================================================');
console.log('   THRIVING SKILLS: COURSE FETCHING & VIDEO PLAYBACK AUDIT      ');
console.log('================================================================\n');

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    }).on('error', reject);
  });
}

// Logic replicate matching src/screens/LessonPlayerScreen.tsx & CurriculumAccordion.tsx
function evaluateAccess(user, userProgress, courseId, lesson) {
  const isAdmin = Array.isArray(user?.roles) && user.roles.includes('administrator');
  const isEnrolled = !!(userProgress && userProgress[courseId]);
  const isFreePreview = Boolean(lesson?.isFreePreview);
  const canPlayVideo = isAdmin || isEnrolled || isFreePreview;
  return { isAdmin, isEnrolled, isFreePreview, canPlayVideo };
}

function buildVideoMarkup(activeVideoIntro, activeVideoUrl) {
  let embedMarkup = '';
  if (activeVideoIntro && activeVideoIntro.includes('<iframe')) {
    embedMarkup = activeVideoIntro
      .replace(/width="[^"]*"/gi, 'width="100%"')
      .replace(/height="[^"]*"/gi, 'height="100%"');
  } else if (activeVideoUrl) {
    if (activeVideoUrl.includes('vimeo.com')) {
      const vMatch = activeVideoUrl.match(/\/video\/(\d+)/) || activeVideoUrl.match(/vimeo\.com\/(\d+)/);
      const vId = vMatch ? vMatch[1] : '';
      const vSrc = vId ? `https://player.vimeo.com/video/${vId}?autoplay=1&title=0&byline=0&portrait=0` : activeVideoUrl;
      embedMarkup = `<iframe src="${vSrc}" width="100%" height="100%" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
    } else if (activeVideoUrl.includes('youtube.com') || activeVideoUrl.includes('youtu.be')) {
      let ytId = '';
      const yMatch = activeVideoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
      if (yMatch && yMatch[1]) ytId = yMatch[1];
      const ytSrc = ytId ? `https://www.youtube.com/embed/${ytId}?autoplay=1&playsinline=1&modestbranding=1&rel=0` : activeVideoUrl;
      embedMarkup = `<iframe src="${ytSrc}" width="100%" height="100%" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
    } else if (activeVideoUrl.match(/\.(mp4|m3u8|webm)($|\?)/i)) {
      embedMarkup = `<video src="${activeVideoUrl}" controls autoplay playsinline style="width:100%;height:100%;object-fit:contain;background:#000;"></video>`;
    } else {
      embedMarkup = `<iframe src="${activeVideoUrl}" width="100%" height="100%" frameborder="0" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
    }
  } else {
    embedMarkup = '<div>Loading lecture media stream...</div>';
  }
  return embedMarkup;
}

async function runAudit() {
  console.log('[STEP 1] Verifying Course Fetching from Live WordPress Backend...');
  const coursesRes = await httpsGet('https://staging.thrivingskill.com/wp-json/learnpress/v1/courses?per_page=5');
  assert.strictEqual(coursesRes.status, 200, 'Courses endpoint must return status 200');
  assert.ok(Array.isArray(coursesRes.data), 'Courses response must be an array');
  assert.ok(coursesRes.data.length > 0, 'At least 1 course must be returned');
  console.log(` -> Successfully fetched ${coursesRes.data.length} live courses from LearnPress API!`);
  
  const sampleCourse = coursesRes.data[0];
  console.log(`    Sample Course ID: ${sampleCourse.id}`);
  console.log(`    Sample Course Title: ${sampleCourse.name}`);
  console.log(`    Sample Course Price: ${sampleCourse.price_rendered || sampleCourse.price}`);

  console.log('\n[STEP 2] Verifying Course Detail & Curriculum Fetching...');
  const detailRes = await httpsGet(`https://staging.thrivingskill.com/wp-json/learnpress/v1/courses/${sampleCourse.id}`);
  assert.strictEqual(detailRes.status, 200, 'Course detail endpoint must return 200');
  assert.ok(Array.isArray(detailRes.data.sections), 'Course must include sections array');
  console.log(` -> Sections count: ${detailRes.data.sections.length}`);
  
  const firstSection = detailRes.data.sections[0];
  assert.ok(firstSection, 'First section must exist');
  assert.ok(Array.isArray(firstSection.items), 'First section must have items');
  console.log(`    First Section: "${firstSection.title}" with ${firstSection.items.length} lessons/quizzes`);

  console.log('\n[STEP 3] Verifying Real Video Extraction from Lesson Metadata...');
  // Check known course 11580 lesson 12058 (Vimeo embedded lesson)
  const lessonRes = await httpsGet('https://staging.thrivingskill.com/wp-json/learnpress/v1/lessons/12058');
  assert.strictEqual(lessonRes.status, 200, 'Lesson detail endpoint must return 200');
  const rawLesson = lessonRes.data;
  console.log(` -> Lesson ID 12058 Name: "${rawLesson.name}"`);
  console.log(` -> Has video_intro: ${Boolean(rawLesson.video_intro)}`);
  assert.ok(rawLesson.video_intro && rawLesson.video_intro.includes('vimeo.com'), 'Lesson 12058 must contain Vimeo stream');
  
  // Extract iframe src
  const srcMatch = rawLesson.video_intro.match(/src=["']([^"']+)["']/i);
  const extractedSrc = srcMatch ? srcMatch[1] : '';
  console.log(` -> Extracted Vimeo URL: ${extractedSrc}`);
  assert.ok(extractedSrc.includes('player.vimeo.com/video/446438553'), 'Extracted URL must point to Vimeo player');

  console.log('\n[STEP 4] Verifying Access Control Matrix (Purchased User vs Unpurchased vs Admin)...');
  
  const dummyLessonPaid = { id: '12058', title: 'Full Interview Drill', isFreePreview: false };
  const dummyLessonPreview = { id: '12057', title: 'Intro Lecture', isFreePreview: true };

  // Case A: Unpurchased Regular Student on Locked Lesson
  const studentUser = { id: 'user-1', roles: ['subscriber'], username: 'student' };
  const studentProgressUnpurchased = {};
  const accessA = evaluateAccess(studentUser, studentProgressUnpurchased, '11580', dummyLessonPaid);
  console.log(' Case A (Unpurchased Student, Paid Lesson):');
  console.log(`    canPlayVideo = ${accessA.canPlayVideo} (Expected: false)`);
  assert.strictEqual(accessA.canPlayVideo, false, 'Unpurchased student must NOT be able to play paid lesson');

  // Case B: Unpurchased Student on Free Preview Lesson
  const accessB = evaluateAccess(studentUser, studentProgressUnpurchased, '11580', dummyLessonPreview);
  console.log(' Case B (Unpurchased Student, Free Preview Lesson):');
  console.log(`    canPlayVideo = ${accessB.canPlayVideo} (Expected: true)`);
  assert.strictEqual(accessB.canPlayVideo, true, 'Student must be able to play free preview lesson');

  // Case C: Enrolled / Purchased Student on Paid Lesson
  const studentProgressPurchased = { '11580': { courseId: '11580', completedLessonIds: [] } };
  const accessC = evaluateAccess(studentUser, studentProgressPurchased, '11580', dummyLessonPaid);
  console.log(' Case C (Purchased Student, Paid Lesson):');
  console.log(`    canPlayVideo = ${accessC.canPlayVideo} (Expected: true)`);
  assert.strictEqual(accessC.canPlayVideo, true, 'Purchased student MUST be able to play paid lesson');

  // Case D: Administrator Master Power on Paid Lesson (WITHOUT Purchase / Enrollment)
  const adminUser = { id: 'admin-1', roles: ['administrator'], username: 'wp_admin' };
  const accessD = evaluateAccess(adminUser, studentProgressUnpurchased, '11580', dummyLessonPaid);
  console.log(' Case D (ADMINISTRATOR, Paid Lesson, NO Purchase):');
  console.log(`    isAdmin = ${accessD.isAdmin}`);
  console.log(`    canPlayVideo = ${accessD.canPlayVideo} (Expected: true)`);
  assert.strictEqual(accessD.isAdmin, true, 'User must be recognized as administrator');
  assert.strictEqual(accessD.canPlayVideo, true, 'Administrator MUST have master power to play ANY course video without purchase!');

  console.log('\n[STEP 5] Verifying Video HTML Builder Markup Output...');
  const vimeoMarkup = buildVideoMarkup(rawLesson.video_intro, extractedSrc);
  assert.ok(vimeoMarkup.includes('<iframe'), 'Vimeo markup must produce an iframe tag');
  assert.ok(vimeoMarkup.includes('width="100%"'), 'Vimeo markup must be responsive');
  console.log(' -> Generated responsive Vimeo markup successfully verified!');

  const ytMarkup = buildVideoMarkup('', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  assert.ok(ytMarkup.includes('youtube.com/embed/dQw4w9WgXcQ'), 'YouTube markup must produce an embed iframe');
  console.log(' -> Generated responsive YouTube markup successfully verified!');

  const mp4Markup = buildVideoMarkup('', 'https://example.com/lecture.mp4');
  assert.ok(mp4Markup.includes('<video src="https://example.com/lecture.mp4"'), 'MP4 markup must produce HTML5 video');
  console.log(' -> Generated responsive MP4 video markup successfully verified!');

  console.log('\n================================================================');
  console.log(' [SUCCESS] ALL 5 AUDIT VERIFICATION CHECKS PASSED WITH 0 ERRORS! ');
  console.log('================================================================\n');
}

runAudit().catch((err) => {
  console.error('[AUDIT FAILED]:', err);
  process.exit(1);
});
