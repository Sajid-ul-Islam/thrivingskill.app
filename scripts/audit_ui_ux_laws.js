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

  // Check TouchableOpacity / Pressable / SpringPressable without accessibilityRole or accessibilityLabel
  let missingA11y = 0;
  let totalTouchables = 0;
  const lines = src.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/<(TouchableOpacity|Pressable|SpringPressable)\b/);
    if (match) {
      totalTouchables++;
      let tagContent = '';
      let depth = 0;
      let inString = false;
      let stringChar = '';
      let finished = false;

      for (let j = i; j < lines.length; j++) {
        const curLine = lines[j];
        for (let k = 0; k < curLine.length; k++) {
          const ch = curLine[k];
          const prev = k > 0 ? curLine[k - 1] : '';

          if (inString) {
            if (ch === stringChar && prev !== '\\') {
              inString = false;
            }
          } else {
            if (ch === '"' || ch === "'" || ch === '`') {
              inString = true;
              stringChar = ch;
            } else if (ch === '{') {
              depth++;
            } else if (ch === '}') {
              depth--;
            } else if (ch === '>' && depth === 0 && prev !== '=') {
              tagContent += curLine.substring(0, k + 1);
              finished = true;
              break;
            }
          }
        }
        if (finished) break;
        tagContent += curLine + '\n';
      }

      const hasRole = tagContent.includes('accessibilityRole');
      const hasLabel = tagContent.includes('accessibilityLabel');
      if (!hasRole && !hasLabel) {
        missingA11y++;
      }
    }
  }

  if (missingA11y > 0) findings.push(`a11y_missing=${missingA11y}/${totalTouchables}`);

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
      const has44 = /minWidth\s*:\s*(4[4-9]|[5-9]\d|MIN_TOUCH_TARGET)|width\s*:\s*(4[4-9]|[5-9]\d|MIN_TOUCH_TARGET)|minHeight\s*:\s*(4[4-9]|[5-9]\d|MIN_TOUCH_TARGET)|height\s*:\s*(4[4-9]|[5-9]\d|MIN_TOUCH_TARGET)/.test(block);
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
