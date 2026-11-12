const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const files = [
  'src/screens/ProfileScreen.tsx',
  'src/screens/WorkshopsScreen.tsx',
  'src/screens/CoursesScreen.tsx',
  'src/screens/HomeScreen.tsx',
  'src/screens/CourseDetailScreen.tsx',
  'src/screens/LessonPlayerScreen.tsx',
  'src/screens/MyLearningScreen.tsx',
  'src/screens/YouTubeVideosScreen.tsx',
  ...fs.readdirSync(path.join(ROOT, 'src/components/modals')).filter(f => f.endsWith('.tsx')).map(f => 'src/components/modals/' + f),
  ...fs.readdirSync(path.join(ROOT, 'src/components/player')).filter(f => f.endsWith('.tsx')).map(f => 'src/components/player/' + f),
];

for (const rel of files) {
  const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const findings = [];

  // Check TouchableOpacity / Pressable without accessibilityRole or accessibilityLabel
  const touchables = [...src.matchAll(/<(TouchableOpacity|Pressable|SpringPressable)\b([\s\S]*?)>/g)];
  let missingA11y = 0;
  for (const m of touchables) {
    if (!m[2].includes('accessibilityRole') && !m[2].includes('accessibilityLabel')) missingA11y++;
  }
  if (missingA11y > 0) findings.push(`a11y_missing=${missingA11y}/${touchables.length}`);

  // Check Feedback (useFeedback / triggerHaptic / SpringPressable)
  if (!src.includes('useFeedback') && !src.includes('triggerHaptic') && !src.includes('SpringPressable')) {
    findings.push('no_haptic_or_toast');
  }

  // Check Typography & Shape tokens
  if (!src.includes('typography') && (src.match(/fontSize\s*:/g) || []).length >= 3) {
    findings.push('no_typography_tokens');
  }
  if (!src.includes('shape') && (src.match(/borderRadius\s*:/g) || []).length >= 4) {
    findings.push('no_shape_tokens');
  }

  // Check closeBtn/headerBtn/backBtn/shareBtn/filterPill sizing or hitSlop
  const closeMatch = src.match(/(closeBtn|backBtn|shareBtn|markAllBtn|headerBtn|controlBtn)\s*:\s*\{([^}]*)\}/g);
  if (closeMatch) {
    for (const block of closeMatch) {
      const has44 = /minWidth\s*:\s*(4[4-9]|[5-9]\d)|width\s*:\s*(4[4-9]|[5-9]\d)|minHeight\s*:\s*(4[4-9]|[5-9]\d)|height\s*:\s*(4[4-9]|[5-9]\d)/.test(block);
      if (!has44 && !src.includes('TOUCH_HIT_SLOP') && !src.includes('hitSlop')) {
        findings.push(`small_btn_no_hitslop: ${block.split(':')[0].trim()}`);
      }
    }
  }

  // Check CelebrationToast / AppUpdateModal / BlogModal / HelpFaqModal / QuizModal / QuizPlayerModal / NotificationModal / AboutTSLModal
  if (findings.length) {
    console.log(`${rel}: ${findings.join(', ')}`);
  }
}
