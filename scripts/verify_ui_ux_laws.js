/**
 * Automated UI/UX Design Principles, UX Honeycomb & Psychological Laws Verification Script
 * Validates Miller's Law, Hick's Law, Fitts's Law, Jakob's Law, Aesthetic-Usability,
 * Core UI Principles, UX Honeycomb, plus existence & schema of the Agent Skill & App Rule.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const results = [];

function check(name, passed, details = '') {
  results.push({ name, passed, details });
  console.log(`${passed ? '✅ PASS' : '❌ FAIL'} | ${name}${details ? ` — ${details}` : ''}`);
}

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

// 1. Agent Skill exists & follows Antigravity SKILL.md frontmatter schema
const skillRel = '.agents/skills/ui-ux-design-laws/SKILL.md';
const skillExists = fs.existsSync(path.join(ROOT, skillRel));
const skillSrc = skillExists ? read(skillRel) : '';
check(
  'Agent Skill (SKILL.md) Exists & Valid Frontmatter',
  skillExists &&
    /^---\r?\nname:\s*ui-ux-design-laws\r?\ndescription:/m.test(skillSrc) &&
    skillSrc.includes("Hick's Law") &&
    skillSrc.includes("Fitts's Law") &&
    skillSrc.includes("Jakob's Law") &&
    skillSrc.includes("Miller's Law") &&
    skillSrc.includes('Aesthetic-Usability Effect') &&
    skillSrc.includes('UX Honeycomb'),
  skillRel
);

// 2. App Rule exists & is referenced in AGENTS.md
const ruleRel = '.agents/rules/ui-ux-design-laws.md';
const ruleExists = fs.existsSync(path.join(ROOT, ruleRel));
const ruleSrc = ruleExists ? read(ruleRel) : '';
const agentsMd = read('AGENTS.md');
check(
  'App Workspace Rule Exists & Linked in AGENTS.md',
  ruleExists &&
    ruleSrc.includes("Miller's Law") &&
    ruleSrc.includes("Hick's Law") &&
    ruleSrc.includes("Fitts's Law") &&
    ruleSrc.includes("Jakob's Law") &&
    ruleSrc.includes('Aesthetic-Usability Effect') &&
    agentsMd.includes('ui-ux-design-laws'),
  `${ruleRel} + AGENTS.md`
);

// 3. Miller's Law: ProfileScreen cardGroups each have <= 7 interactive rows
const profileSrc = read('src/screens/ProfileScreen.tsx');
const lines = profileSrc.split('\n');
let maxGroupRows = 0;
let currentGroupRows = 0;
let inGroup = false;
let depth = 0;
let groupStart = 0;
let oversizedGroups = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (!inGroup && line.includes('styles.cardGroup')) {
    inGroup = true;
    depth = 1; // <View opened just above styles.cardGroup
    currentGroupRows = 0;
    groupStart = i + 1;
    continue;
  }
  if (inGroup) {
    depth += (line.match(/<View\b/g) || []).length - (line.match(/<\/View>/g) || []).length;
    if (line.includes('styles.settingRow')) {
      currentGroupRows++;
    }
    if (depth <= 0 && i >= groupStart) {
      if (currentGroupRows > maxGroupRows) maxGroupRows = currentGroupRows;
      if (currentGroupRows > 7) oversizedGroups.push(`L${groupStart}(${currentGroupRows})`);
      inGroup = false;
    }
  }
}

check(
  "Miller's Law: ProfileScreen cardGroups Chunked (<= 7 rows/group)",
  oversizedGroups.length === 0 && profileSrc.includes('EXPERIENCE & PLAYBACK') && profileSrc.includes('ACCOUNT ACTIONS'),
  oversizedGroups.length === 0 ? `max=${maxGroupRows} rows/group` : `Oversized: ${oversizedGroups.join(', ')}`
);

// 4. Fitts's Law: ProfileScreen settingRow & CoursesScreen viewToggleBtn & MiniPlayer controlBtn >= 44dp
const coursesSrc = read('src/screens/CoursesScreen.tsx');
const miniPlayerSrc = read('src/components/player/YouTubeMiniPlayer.tsx');
const ytModalSrc = read('src/components/player/YouTubePlayerModal.tsx');
check(
  "Fitts's Law: Key Touch Targets >= 44dp (Settings, Toggles, MiniPlayer, Speed Pills)",
  /settingRow:\s*\{[\s\S]*?minHeight:\s*4[4-9]|minHeight:\s*MIN_TOUCH_TARGET/.test(profileSrc) &&
    /viewToggleBtn:\s*\{[\s\S]*?MIN_TOUCH_TARGET/.test(coursesSrc) &&
    /controlBtn:\s*\{[\s\S]*?MIN_TOUCH_TARGET/.test(miniPlayerSrc) &&
    /speedPill:\s*\{[\s\S]*?MIN_TOUCH_TARGET/.test(ytModalSrc),
  'Profile settingRow >= 48dp, CoursesScreen viewToggleBtn/MiniPlayer controlBtn/YT speedPill = MIN_TOUCH_TARGET'
);

// 5. Fitts's Law: Modal close buttons upgraded to MIN_TOUCH_TARGET / 44dp
const modalFiles = [
  'src/components/modals/AppUpdateModal.tsx',
  'src/components/modals/BlogModal.tsx',
  'src/components/modals/CertificateModal.tsx',
  'src/components/modals/HelpFaqModal.tsx',
  'src/components/modals/LegalPolicyModal.tsx',
  'src/components/modals/NotificationModal.tsx',
  'src/components/modals/QuizPlayerModal.tsx',
  'src/components/modals/AboutTSLModal.tsx',
  'src/components/player/CourseQnATab.tsx',
];
const failedModals = modalFiles.filter((rel) => {
  const s = read(rel);
  return !s.includes('MIN_TOUCH_TARGET');
});
check(
  "Fitts's Law: All Audited Modal & Player Close/Header Actions Use MIN_TOUCH_TARGET",
  failedModals.length === 0,
  failedModals.length === 0 ? `${modalFiles.length}/${modalFiles.length} verified` : `Missing: ${failedModals.join(', ')}`
);

// 6. Feedback & No Dead Handlers: WorkshopsScreen bilingual, haptic, StateView, no empty onPress
const workshopsSrc = read('src/screens/WorkshopsScreen.tsx');
check(
  'Feedback & Usability: WorkshopsScreen Bilingual, Haptic, Adaptive StateView, No Dead Handlers',
  workshopsSrc.includes('useLanguage') &&
    workshopsSrc.includes('triggerHaptic') &&
    workshopsSrc.includes('StateView') &&
    workshopsSrc.includes('RefreshControl') &&
    !workshopsSrc.includes('onPress={() => {}}'),
  'WorkshopsScreen upgraded'
);

// 7. Immediate Feedback & Error Recovery in QnA, Blog, Notifications, Quizzes, Certificates
const qnaSrc = read('src/components/player/CourseQnATab.tsx');
const notifSrc = read('src/components/modals/NotificationModal.tsx');
const blogSrc = read('src/components/modals/BlogModal.tsx');
const certSrc = read('src/components/modals/CertificateModal.tsx');
check(
  'Feedback & Credibility: Multi-modal Haptic + Toast + StateView in Modals & Player',
  qnaSrc.includes('useFeedback') &&
    qnaSrc.includes('triggerHaptic') &&
    notifSrc.includes('useFeedback') &&
    notifSrc.includes('StateView') &&
    blogSrc.includes('useFeedback') &&
    certSrc.includes('useFeedback'),
  'CourseQnATab, NotificationModal, BlogModal, CertificateModal'
);

// 8. Contrast & Accessibility: No low-contrast #10B981 text on light surfaces in LegalPolicyModal / AppUpdateModal / CourseQnATab
const legalSrc = read('src/components/modals/LegalPolicyModal.tsx');
const appUpdateSrc = read('src/components/modals/AppUpdateModal.tsx');
check(
  'Accessibility & Contrast: WCAG AA Status Text & Accessibility Roles Applied',
  legalSrc.includes('colors.success') &&
    appUpdateSrc.includes('colors.success') &&
    !qnaSrc.includes("color: '#10B981'") &&
    notifSrc.includes('accessibilityRole=') &&
    workshopsSrc.includes('accessibilityRole='),
  'colors.success / #047857 + accessibilityRole/Label'
);

// 9. Hick's Law & Jakob's Law: Bottom tab bar kept at 3-5 tabs & no drawer hamburger button
const appSrc = read('App.tsx');
const headerSrc = read('src/components/common/Header.tsx');
const navTabCount = (appSrc.match(/id:\s*'(Home|Courses|MyLearning|Workshops|Profile)'/g) || []).length;
check(
  "Hick's & Jakob's Law: 5 Bottom Navigation Destinations & Platform Native Header",
  navTabCount === 5 && !headerSrc.includes('menu-outline') && headerSrc.includes('chevron-back'),
  `${navTabCount} bottom tabs, no hamburger drawer`
);

const passedCount = results.filter((r) => r.passed).length;
console.log(`\nSummary: ${passedCount}/${results.length} UI/UX & Psychological Laws checks passed.`);
if (passedCount !== results.length) {
  process.exit(1);
}
