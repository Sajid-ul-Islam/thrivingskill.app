// scripts/test_screentime_tracking.js
// Verification suite for Active Screen-Time Tracking, Daily History & Streak Lifecycle

function runTests() {
  console.log('====================================================');
  console.log('  THRIVING SKILLS — SCREEN-TIME & STREAK AUDIT     ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Helper function tests
  function getLocalDateString(d = new Date()) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  console.log('Test 1: Verifying getLocalDateString formatting...');
  const testDate = new Date(2026, 10, 23); // Nov 23, 2026
  const dateStr = getLocalDateString(testDate);
  assert(dateStr === '2026-11-23', `Correctly formatted date: ${dateStr}`);

  // 2. computeWeeklyActivity tests
  function computeWeeklyActivity(dailyHistory = {}, refDate = new Date()) {
    const today = refDate;
    const currentDayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday...
    const distToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + distToMonday);

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayNamesBn = ['সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি', 'রবি'];
    const todayStr = getLocalDateString(today);

    return dayNames.map((day, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      const curDateStr = getLocalDateString(d);
      const minutes = dailyHistory[curDateStr] || 0;
      const hours = Math.round((minutes / 60) * 10) / 10;

      return {
        day,
        dayBn: dayNamesBn[idx],
        hours,
        isToday: curDateStr === todayStr,
      };
    });
  }

  console.log('\nTest 2: Verifying computeWeeklyActivity Mon-Sun generation...');
  const sampleHistory = {
    '2026-11-23': 45, // 0.75h -> 0.8h
    '2026-11-24': 120, // 2.0h
  };
  const week = computeWeeklyActivity(sampleHistory, testDate);
  assert(week.length === 7, `Generates exactly 7 days (length: ${week.length})`);
  assert(week[0].day === 'Mon' && week[6].day === 'Sun', `Starts on Monday (${week[0].day}) and ends on Sunday (${week[6].day})`);
  const todayEntry = week.find((d) => d.isToday);
  assert(!!todayEntry, `Identifies current day (${todayEntry?.day})`);
  assert(todayEntry.hours === 0.8, `Converts 45 minutes to 0.8 hours (hours: ${todayEntry.hours})`);

  // 3. Streak & Daily Accumulation Engine Simulation
  console.log('\nTest 3: Verifying Streak & Screen-Time Accumulation Engine...');
  class GamificationEngine {
    constructor() {
      this.state = {
        streakDays: 0,
        lastActiveDate: '2026-11-20',
        dailyMinutesSpent: 0,
        dailyGoalMinutes: 15,
        totalStudyMinutes: 0,
        dailyHistory: {},
        xp: 0,
      };
    }

    recordStudyTime(minutes, currentDateStr) {
      if (minutes <= 0) return;
      const today = currentDateStr || getLocalDateString();
      const yesterdayDate = new Date(new Date(today).getTime() - 86400000);
      const yesterday = getLocalDateString(yesterdayDate);

      let newStreak = this.state.streakDays;
      const wasActiveToday = this.state.lastActiveDate === today && this.state.dailyMinutesSpent > 0;

      if (!wasActiveToday) {
        if (this.state.lastActiveDate === yesterday && this.state.streakDays > 0) {
          newStreak = this.state.streakDays + 1;
        } else {
          newStreak = 1;
        }
      } else if (newStreak === 0) {
        newStreak = 1;
      }

      const currentDayMins = (this.state.lastActiveDate === today ? this.state.dailyMinutesSpent : 0) + minutes;
      const newHistory = {
        ...(this.state.dailyHistory || {}),
        [today]: currentDayMins,
      };
      const newTotalMinutes = (this.state.totalStudyMinutes || 0) + minutes;

      this.state = {
        ...this.state,
        streakDays: newStreak,
        dailyMinutesSpent: currentDayMins,
        totalStudyMinutes: newTotalMinutes,
        dailyHistory: newHistory,
        lastActiveDate: today,
        xp: (this.state.xp || 0) + minutes * 5,
      };
    }
  }

  const engine = new GamificationEngine();

  // Day 1: Nov 21
  engine.recordStudyTime(5, '2026-11-21');
  assert(engine.state.streakDays === 1, `Day 1 initial study sets streak = 1 (actual: ${engine.state.streakDays})`);
  assert(engine.state.dailyMinutesSpent === 5, `Day 1 minutes = 5 (actual: ${engine.state.dailyMinutesSpent})`);
  assert(engine.state.totalStudyMinutes === 5, `Total minutes = 5 (actual: ${engine.state.totalStudyMinutes})`);

  // Day 1 addition (active screen-time 60s heartbeats)
  engine.recordStudyTime(1, '2026-11-21');
  engine.recordStudyTime(1, '2026-11-21');
  assert(engine.state.streakDays === 1, `Adding minutes on same day maintains streak = 1 (actual: ${engine.state.streakDays})`);
  assert(engine.state.dailyMinutesSpent === 7, `Day 1 accumulated minutes = 7 (actual: ${engine.state.dailyMinutesSpent})`);
  assert(engine.state.totalStudyMinutes === 7, `Total accumulated minutes = 7`);

  // Day 2: Nov 22 (consecutive day)
  engine.recordStudyTime(10, '2026-11-22');
  assert(engine.state.streakDays === 2, `Day 2 consecutive study increments streak to 2 (actual: ${engine.state.streakDays})`);
  assert(engine.state.dailyMinutesSpent === 10, `Day 2 daily minutes reset and set to 10 (actual: ${engine.state.dailyMinutesSpent})`);
  assert(engine.state.totalStudyMinutes === 17, `Total accumulated minutes = 17`);

  // Day 4: Nov 24 (missed Nov 23!)
  engine.recordStudyTime(15, '2026-11-24');
  assert(engine.state.streakDays === 1, `Missed day resets streak to 1 upon new study session (actual: ${engine.state.streakDays})`);
  assert(engine.state.dailyMinutesSpent === 15, `Day 4 daily minutes = 15`);
  assert(engine.state.totalStudyMinutes === 32, `Total accumulated minutes = 32`);
  assert(engine.state.dailyHistory['2026-11-21'] === 7, `History preserved for Nov 21`);
  assert(engine.state.dailyHistory['2026-11-22'] === 10, `History preserved for Nov 22`);
  assert(engine.state.dailyHistory['2026-11-24'] === 15, `History preserved for Nov 24`);

  // 4. Test Total Hours calculation
  console.log('\nTest 4: Verifying Total Hours Learned computation...');
  const userProgress = {
    'c1': {
      lastWatchPositionSeconds: { 'l1': 1800, 'l2': 1200 }, // 3000 sec = 50 min
      completedLessonIds: ['l1'],
    },
    'c2': {
      lastWatchPositionSeconds: { 'l3': 2400 }, // 40 min
      completedLessonIds: ['l3'],
    },
  };

  const totalCompletedLessons = Object.values(userProgress).reduce((acc, p) => acc + p.completedLessonIds.length, 0);
  const totalWatchedSeconds = Object.values(userProgress).reduce((total, prog) => {
    const positions = Object.values(prog.lastWatchPositionSeconds || {});
    return total + positions.reduce((sum, s) => sum + s, 0);
  }, 0); // 5400 sec = 1.5h

  const fromWatchedSec = totalWatchedSeconds / 3600; // 1.5h
  const fromGamificationMins = engine.state.totalStudyMinutes / 60; // 32 / 60 = 0.53h
  const fromCompletedLessons = totalCompletedLessons * 0.35; // 2 * 0.35 = 0.7h
  const totalHoursLearned = Math.max(fromWatchedSec, fromGamificationMins, fromCompletedLessons).toFixed(1);

  assert(totalWatchedSeconds === 5400, `Total watched seconds calculated accurately: 5400s`);
  assert(totalHoursLearned === '1.5', `Total hours learned reflects actual watched time: 1.5h (actual: ${totalHoursLearned}h)`);

  console.log('\n====================================================');
  console.log(`  AUDIT COMPLETE: ${passed} PASSED, ${failed} FAILED `);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
}

runTests();
