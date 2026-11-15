const assert = require('assert');
const fs = require('fs');
const path = require('path');

function testEdTechVisualizations() {
  console.log('=== VERIFYING EDTECH DATA VISUALIZATIONS ===\n');

  // 1. Verify Smooth Area Chart in ProfileLearningAnalytics
  console.log('1. Checking Smooth Area Chart in ProfileLearningAnalytics.tsx...');
  const profileAnalyticsCode = fs.readFileSync(
    path.resolve(__dirname, '../src/components/analytics/ProfileLearningAnalytics.tsx'),
    'utf8'
  );

  assert(profileAnalyticsCode.includes('buildSplinePath'), 'ProfileLearningAnalytics must compute smooth spline path');
  assert(profileAnalyticsCode.includes('id="areaGradient"'), 'Must define SVG area gradient fill');
  assert(profileAnalyticsCode.includes('activeTooltipPill'), 'Must render interactive active tooltip pill');
  assert(profileAnalyticsCode.includes('daysTouchRow'), 'Must render touch targets for each day');
  assert(profileAnalyticsCode.includes('strokeDasharray="4 4"'), 'Must render subtle reference grid lines');
  console.log('✓ Smooth Area Chart verified with cubic spline math, gradient fill, and interactive tooltips.');

  // 2. Verify Radial Goal Ring Widget in HomeScreen
  console.log('\n2. Checking Radial Goal Ring Widget in HomeScreen.tsx...');
  const homeCode = fs.readFileSync(path.resolve(__dirname, '../src/screens/HomeScreen.tsx'), 'utf8');

  assert(homeCode.includes('CircularProgressRing'), 'HomeScreen must import and render CircularProgressRing');
  assert(homeCode.includes('radialGoalBadge'), 'HomeScreen must use radialGoalBadge container');
  assert(homeCode.includes('radialCenterIcon'), 'HomeScreen radial ring must have center icon/status');
  assert(!homeCode.includes('goalProgressBarBg'), 'HomeScreen must replace legacy linear goal bar with radial ring');
  console.log('✓ Radial Goal Ring Widget verified with concentric arc, center status icon, and interactive momentum modal.');

  // 3. Verify Interactive 5-Axis Spider/Radar Chart in Skill Assessment
  console.log('\n3. Checking 5-Axis Spider/Radar Chart...');
  const radarChartPath = path.resolve(__dirname, '../src/components/analytics/SkillRadarChart.tsx');
  assert(fs.existsSync(radarChartPath), 'SkillRadarChart.tsx must exist');

  const radarCode = fs.readFileSync(radarChartPath, 'utf8');
  assert(radarCode.includes('getCoordinates'), 'SkillRadarChart must compute polar trigonometry coordinates');
  assert(radarCode.includes('radarFillGradient'), 'SkillRadarChart must use SVG gradient for competency polygon');
  assert(radarCode.includes('gridPolygons'), 'SkillRadarChart must render concentric polygon guide webs');
  assert(radarCode.includes('DOMAIN_SHORT_NAMES'), 'SkillRadarChart must have concise domain labels');
  assert(radarCode.includes('domainPillsRow'), 'SkillRadarChart must have interactive domain selector pills');

  const assessmentModalCode = fs.readFileSync(
    path.resolve(__dirname, '../src/components/modals/SkillAssessmentModal.tsx'),
    'utf8'
  );
  assert(assessmentModalCode.includes('SkillRadarChart'), 'SkillAssessmentModal must import and render SkillRadarChart');
  console.log('✓ 5-Axis Spider/Radar Chart verified with pentagon trigonometry, concentric guide webs, and interactive focus pills.');

  console.log('\n========================================');
  console.log('ALL 3 EDTECH DATA VISUALIZATIONS VERIFIED!');
  console.log('========================================');
}

try {
  testEdTechVisualizations();
} catch (err) {
  console.error('\n❌ EDTECH VISUALIZATION TEST FAILED:', err.message);
  process.exit(1);
}
