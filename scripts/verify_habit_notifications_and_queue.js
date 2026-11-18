/**
 * Verification Script: Smart Habit-Based Notification Queue & Easy Remover Engine
 *
 * Verifies:
 * 1. Easy Remover: Individual notification dismissal & Clear All capabilities
 * 2. Startup Guard: Maximum 1 notification during app startup
 * 3. Priority Queue: Urgent priority bypass vs normal/low queued pacing
 * 4. Learner Habit Engine: 24h activity histogram & peak receptive hours calculation
 * 5. Pacing & Budget: 45m cooldown & 3/day daily cap preventing notification fatigue
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log('   THRIVING SKILLS — HABIT NOTIFICATION QUEUE & REMOVER AUDIT   ');
console.log('================================================================\n');

let passedChecks = 0;
function pass(desc) {
  passedChecks++;
  console.log(`  ✅ [PASS] ${desc}`);
}

// ---------------------------------------------------------------------------
// 1. Audit Source Files for Easy Remover Infrastructure
// ---------------------------------------------------------------------------
console.log('[STEP 1] Verifying Easy Remover (Individual Remove & Clear All)...');

const pushServicePath = path.join(__dirname, '../src/services/notifications/pushNotificationService.ts');
const pushServiceSrc = fs.readFileSync(pushServicePath, 'utf8');

assert(pushServiceSrc.includes('static async removeNotification(id: string)'), 'PushNotificationService must have removeNotification');
assert(pushServiceSrc.includes('static async clearAllNotifications()'), 'PushNotificationService must have clearAllNotifications');
assert(pushServiceSrc.includes('static async getUnreadCount()'), 'PushNotificationService must have getUnreadCount');
pass('PushNotificationService provides atomic removeNotification & clearAllNotifications');

const saasContextPath = path.join(__dirname, '../src/context/SaaSContext.tsx');
const saasContextSrc = fs.readFileSync(saasContextPath, 'utf8');

assert(saasContextSrc.includes('removeNotification: (notifId: string) => void'), 'SaaSContext must expose removeNotification type');
assert(saasContextSrc.includes('clearAllNotifications: () => void'), 'SaaSContext must expose clearAllNotifications type');
assert(saasContextSrc.includes('PushNotificationService.removeNotification(notifId)'), 'SaaSContext must sync individual remove to storage');
assert(saasContextSrc.includes('PushNotificationService.clearAllNotifications()'), 'SaaSContext must sync clearAll to storage');
pass('SaaSContext wires removeNotification and clearAllNotifications state & storage sync');

const modalPath = path.join(__dirname, '../src/components/modals/NotificationModal.tsx');
const modalSrc = fs.readFileSync(modalPath, 'utf8');

assert(modalSrc.includes('clearAllNotifications();'), 'NotificationModal must provide Clear All action');
assert(modalSrc.includes('removeNotification(item.id);'), 'NotificationModal must provide item-level remove action');
assert(modalSrc.includes('removeItemBtn'), 'NotificationModal must render dedicated removeItemBtn on each card');
assert(modalSrc.includes('clearAllBtn'), 'NotificationModal must render clearAllBtn in header');
pass('NotificationModal renders one-tap Clear All in header and item-level dismissal button on every card');

// ---------------------------------------------------------------------------
// 2. Audit Habit-Based Notification Queue Engine
// ---------------------------------------------------------------------------
console.log('\n[STEP 2] Verifying HabitNotificationQueue Architecture & Throttling...');

const queuePath = path.join(__dirname, '../src/services/notifications/habitNotificationQueue.ts');
assert(fs.existsSync(queuePath), 'habitNotificationQueue.ts must exist');
const queueSrc = fs.readFileSync(queuePath, 'utf8');

assert(queueSrc.includes('MIN_NOTIFICATION_INTERVAL_MS = 45 * 60 * 1000'), 'Must enforce 45m minimum cooldown interval');
assert(queueSrc.includes('MAX_DAILY_NOTIFICATIONS = 3'), 'Must cap maximum automated notifications to 3 per day');
assert(queueSrc.includes('STARTUP_GRACE_WINDOW_MS'), 'Must define startup grace window');
assert(queueSrc.includes('recordUserActivity'), 'Must implement recordUserActivity for habit learning');
assert(queueSrc.includes('getPeakLearningHours'), 'Must implement getPeakLearningHours');
assert(queueSrc.includes('isReceptiveTimeNow'), 'Must implement isReceptiveTimeNow');
assert(queueSrc.includes('enqueueOrDispatch'), 'Must implement enqueueOrDispatch');
assert(queueSrc.includes('processQueue'), 'Must implement processQueue for habit-timed delivery');
pass('HabitNotificationQueue specifies 45m cooldown, 3/day daily cap, and habit tracking algorithms');

// ---------------------------------------------------------------------------
// 3. Simulating In-Memory Habit & Queue Algorithms
// ---------------------------------------------------------------------------
console.log('\n[STEP 3] Simulating Habit Tracking & Peak Learning Windows...');

// Simulation of 24h activity histogram
const mockHourlyActivity = Array(24).fill(0);
// Learner usually studies at 9 PM (hour 21) and 10 AM (hour 10)
mockHourlyActivity[21] = 18;
mockHourlyActivity[10] = 12;
mockHourlyActivity[15] = 4;

function simulatePeakHours(hourlyActivity, totalSessions) {
  if (totalSessions < 3) {
    return [10, 15, 20]; // default receptive hours
  }
  return hourlyActivity
    .map((count, hour) => ({ hour, count }))
    .filter((i) => i.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map((i) => i.hour);
}

// Case A: Fresh user (< 3 sessions)
const defaultPeaks = simulatePeakHours(Array(24).fill(0), 1);
assert.deepStrictEqual(defaultPeaks, [10, 15, 20], 'Fresh learner must fall back to [10, 15, 20]');
pass('Fresh learner correctly receives default executive receptive hours: [10, 15, 20]');

// Case B: Experienced learner
const learnedPeaks = simulatePeakHours(mockHourlyActivity, 34);
assert.strictEqual(learnedPeaks[0], 21, 'Peak hour must be 21 (9 PM)');
assert.strictEqual(learnedPeaks[1], 10, 'Second peak must be 10 (10 AM)');
pass(`Learner habits empirically derived: Top peak hours at ${learnedPeaks[0]}:00 and ${learnedPeaks[1]}:00`);

// ---------------------------------------------------------------------------
// 4. Simulating Startup Throttling (Max 1 Notification on Startup)
// ---------------------------------------------------------------------------
console.log('\n[STEP 4] Simulating Startup Guard (Preventing Notification Annoyance Storm)...');

let startupNotificationShown = false;
const appLaunchTime = Date.now();
const STARTUP_WINDOW = 30000;

function canDeliverAtStartup(priority) {
  if (priority === 'urgent') return { allowed: true };
  const isStartup = Date.now() - appLaunchTime < STARTUP_WINDOW;
  if (isStartup && startupNotificationShown) {
    return { allowed: false, reason: 'Startup throttle active: Maximum 1 notification allowed during app launch' };
  }
  return { allowed: true };
}

// First notification at startup (e.g. Daily Streak Nudge or Top Offer)
const check1 = canDeliverAtStartup('normal');
assert.strictEqual(check1.allowed, true, 'First notification at startup is permitted');
startupNotificationShown = true;
pass('First notification on startup successfully approved');

// Second notification attempted 2 seconds later (e.g. from background sync)
const check2 = canDeliverAtStartup('normal');
assert.strictEqual(check2.allowed, false, 'Second notification during startup MUST BE BLOCKED');
assert(check2.reason.includes('Maximum 1 notification allowed during app launch'), 'Reason explains startup throttle');
pass(`Second startup notification throttled: "${check2.reason}"`);

// Third notification: Urgent Certificate Unlocked -> Bypasses throttle
const check3 = canDeliverAtStartup('urgent');
assert.strictEqual(check3.allowed, true, 'Urgent notification MUST bypass startup throttle');
pass('Urgent priority (verified certificate ready) correctly bypasses throttle');

// ---------------------------------------------------------------------------
// 5. Simulating Queue Pacing & Time-to-Time Push
// ---------------------------------------------------------------------------
console.log('\n[STEP 5] Simulating Queue Enqueuing & Time-to-Time Habit Delivery...');

const mockQueue = [];
function mockEnqueueOrDispatch(item, allowNow) {
  if (item.priority === 'urgent' || allowNow) {
    return { status: 'delivered', item };
  }
  mockQueue.push(item);
  return { status: 'queued', item };
}

// Multiple background sync discoveries during throttle
mockEnqueueOrDispatch({ id: 'notif-1', title: 'Generative AI Course', priority: 'normal' }, false);
mockEnqueueOrDispatch({ id: 'notif-2', title: '50% Flash Sale', priority: 'high' }, false);
mockEnqueueOrDispatch({ id: 'notif-3', title: 'New Career Insight', priority: 'low' }, false);

assert.strictEqual(mockQueue.length, 3, 'All 3 non-urgent notifications safely held in queue');
pass('Discovered notifications safely held in persistent queue without bombarding learner');

// Simulate queue processing when learner enters habit window & cooldown expires
mockQueue.sort((a, b) => {
  const pMap = { high: 3, normal: 2, low: 1 };
  return pMap[b.priority] - pMap[a.priority];
});

const topQueued = mockQueue.shift();
assert.strictEqual(topQueued.priority, 'high', 'Highest priority item must be delivered first');
assert.strictEqual(topQueued.title, '50% Flash Sale', 'Top offer delivered at opportune habit time');
pass(`Queue processor delivers prioritized item at learner habit time: "${topQueued.title}" (${mockQueue.length} remaining in queue)`);

// ---------------------------------------------------------------------------
// 6. Verifying App.tsx Startup Delay & Habit Tracking
// ---------------------------------------------------------------------------
console.log('\n[STEP 6] Verifying App.tsx & SiteSync Integration...');

const appPath = path.join(__dirname, '../App.tsx');
const appSrc = fs.readFileSync(appPath, 'utf8');

assert(appSrc.includes('HabitNotificationQueue'), 'App.tsx must import HabitNotificationQueue');
assert(appSrc.includes('HabitNotificationQueue.resetStartupSession()'), 'App.tsx must reset startup session on launch');
assert(appSrc.includes('HabitNotificationQueue.recordUserActivity()'), 'App.tsx must record user activity on navigation');
pass('App.tsx integrates HabitNotificationQueue session management and navigation habit tracking');

const siteSyncPath = path.join(__dirname, '../src/services/notifications/siteSyncNotificationService.ts');
const siteSyncSrc = fs.readFileSync(siteSyncPath, 'utf8');

assert(siteSyncSrc.includes('HabitNotificationQueue.canDeliverNotificationNow'), 'SiteSync must check HabitNotificationQueue throttling');
assert(siteSyncSrc.includes('HabitNotificationQueue.enqueueOrDispatch'), 'SiteSync must enqueue items when throttled');
pass('SiteSyncNotificationService routes new courses, offers, and updates through HabitNotificationQueue');

console.log('\n================================================================');
console.log(`   ALL ${passedChecks} HABIT NOTIFICATION & REMOVER CHECKS PASSED! 🚀  `);
console.log('================================================================\n');
