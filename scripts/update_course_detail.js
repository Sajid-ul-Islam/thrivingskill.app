const fs = require('fs');
const path = require('path');

const courseDetailPath = path.join(__dirname, '..', 'src', 'screens', 'CourseDetailScreen.tsx');
let raw = fs.readFileSync(courseDetailPath, 'utf8');
const isCrlf = raw.includes('\r\n');
let content = raw.replace(/\r\n/g, '\n');

// 1. handleEnrollOrResume
const oldHandleEnroll = `  const handleEnrollOrResume = () => {
    if (!isEnrolled) {`;

const newHandleEnroll = `  const handleEnrollOrResume = () => {
    if (isAdmin) {
      const targetLessonId =
        userProgress[course.id]?.lastAccessedLessonId ||
        course.modules[0]?.lessons[0]?.id ||
        '';
      if (targetLessonId) {
        onNavigateToLesson(course.id, targetLessonId);
      }
      return;
    }
    if (!isEnrolled) {`;

if (content.includes(oldHandleEnroll)) {
  content = content.replace(oldHandleEnroll, newHandleEnroll);
  console.log('1. Updated handleEnrollOrResume');
} else {
  console.log('1. handleEnrollOrResume already updated or missing');
}

// 2. CurriculumAccordion isAdmin prop
const oldAccordion = `<CurriculumAccordion
                courseId={course.id}
                modules={course.modules}
                isEnrolled={isEnrolled}
                onSelectLesson={handleSelectLesson}
              />`;

const newAccordion = `<CurriculumAccordion
                courseId={course.id}
                modules={course.modules}
                isEnrolled={isEnrolled}
                isAdmin={isAdmin}
                onSelectLesson={handleSelectLesson}
              />`;

if (content.includes(oldAccordion)) {
  content = content.replace(oldAccordion, newAccordion);
  console.log('2. Updated CurriculumAccordion isAdmin prop');
} else {
  console.log('2. CurriculumAccordion already updated or missing');
}

// 3. Bottom bar admin section
const oldBottomPriceCol = `        {!isEnrolled ? (
          <View style={styles.bottomPriceCol}>`;

const newBottomPriceCol = `        {isAdmin ? (
          <View style={styles.bottomPriceCol}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="shield-checkmark" size={14} color="#D97706" />
              <Text style={[styles.bottomPriceLabel, { color: '#D97706', fontWeight: '800' }]}>
                ADMIN ACCESS
              </Text>
            </View>
            <Text style={[styles.enrolledStatus, { color: colors.textMuted }]}>
              All course videos unlocked
            </Text>
          </View>
        ) : !isEnrolled ? (
          <View style={styles.bottomPriceCol}>`;

if (content.includes(oldBottomPriceCol)) {
  content = content.replace(oldBottomPriceCol, newBottomPriceCol);
  console.log('3. Updated bottom bar admin status');
} else {
  console.log('3. bottomPriceCol already updated or missing');
}

// 4. CTA button styling for admin
const oldCtaBtn = `style={[styles.enrollCTAButton, { backgroundColor: isEnrolled ? colors.primary : isPaidCourse ? '#FFB606' : colors.primary }]}`;
const newCtaBtn = `style={[
          styles.enrollCTAButton,
          {
            backgroundColor: isAdmin
              ? '#102F53'
              : isEnrolled
              ? colors.primary
              : isPaidCourse
              ? '#FFB606'
              : colors.primary,
          },
        ]}`;

if (content.includes(oldCtaBtn)) {
  content = content.replace(oldCtaBtn, newCtaBtn);
  console.log('4. Updated CTA button styling');
} else {
  console.log('4. oldCtaBtn already updated or missing');
}

// 5. CTA button text
const oldCtaText = `{isEnrolled
              ? (isBangla ? 'লেসনে যান' : 'Resume Course')
              : isPaidCourse
              ? (isBangla ? 'ওয়েবসাইটে ভর্তি হন' : 'Enroll via Web')
              : (isBangla ? 'বিনামূল্যে ভর্তি হন' : 'Enroll for Free')}`;

const newCtaText = `{isAdmin
              ? (isBangla ? 'কোর্স ভিডিও দেখুন' : 'Play Course (Admin)')
              : isEnrolled
              ? (isBangla ? 'লেসনে যান' : 'Resume Course')
              : isPaidCourse
              ? (isBangla ? 'ওয়েবসাইটে ভর্তি হন' : 'Enroll via Web')
              : (isBangla ? 'বিনামূল্যে ভর্তি হন' : 'Enroll for Free')}`;

if (content.includes(oldCtaText)) {
  content = content.replace(oldCtaText, newCtaText);
  console.log('5. Updated CTA button text');
} else {
  console.log('5. oldCtaText already updated or missing');
}

if (isCrlf) {
  content = content.replace(/\n/g, '\r\n');
}
fs.writeFileSync(courseDetailPath, content, 'utf8');
console.log('Finished updating CourseDetailScreen.tsx');
