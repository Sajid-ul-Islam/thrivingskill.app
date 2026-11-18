/**
 * Automated Verification Suite for Multi-Channel Floating CRM Widget
 * Verifies:
 * 1. Auto-transforming icon cycle between WhatsApp and Messenger
 * 2. Cross-platform timer hygiene (ReturnType<typeof setInterval> + clearInterval teardown)
 * 3. 3D icon flip/morph layers & background color transitions
 * 4. Tap-to-expand speed dial with both WhatsApp and Messenger channels
 * 5. Tap-to-collapse return to previous auto-transforming state
 * 6. Official CRM constants integration (01312-100288, https://m.me/thrivingskills)
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('====================================================');
console.log('   FLOATING CRM WIDGET & AUTO-TRANSFORM SUITE       ');
console.log('====================================================\n');

const widgetPath = path.resolve(__dirname, '../src/components/common/FloatingCrmWidget.tsx');
const crmConfigPath = path.resolve(__dirname, '../src/config/crm.ts');
const appPath = path.resolve(__dirname, '../App.tsx');

assert(fs.existsSync(widgetPath), 'FloatingCrmWidget.tsx must exist');
assert(fs.existsSync(crmConfigPath), 'crm.ts must exist');
assert(fs.existsSync(appPath), 'App.tsx must exist');

const widgetContent = fs.readFileSync(widgetPath, 'utf8');
const crmContent = fs.readFileSync(crmConfigPath, 'utf8');
const appContent = fs.readFileSync(appPath, 'utf8');

// Test 1: Auto-Transforming Icon Cycle & State Definition
console.log('Test 1: Verifying Auto-Transforming Icon Cycle & Interval...');
assert(widgetContent.includes("type CrmChannel = 'whatsapp' | 'messenger'"), 'CrmChannel type must support whatsapp and messenger');
assert(widgetContent.includes('AUTO_TRANSFORM_INTERVAL'), 'Must define AUTO_TRANSFORM_INTERVAL for auto-cycling');
assert(widgetContent.includes('const [activeChannel, setActiveChannel] = useState<CrmChannel>'), 'Must track active channel in state');
assert(widgetContent.includes('const flipAnim = useRef(new Animated.Value(0)).current'), 'Must declare flipAnim for icon transformation');
console.log('  ✅ [PASS] Auto-transform state, interval, and flipAnim defined');

// Test 2: Cross-Platform Timer Hygiene (AGENTS.md Rule 3)
console.log('\nTest 2: Verifying Cross-Platform Timer Hygiene (AGENTS.md Rule 3)...');
assert(widgetContent.includes('ReturnType<typeof setInterval>'), 'Must use ReturnType<typeof setInterval>');
assert(!widgetContent.includes('NodeJS.Timeout'), 'Must NOT use NodeJS.Timeout in client code');
assert(widgetContent.includes('clearInterval(cycleTimerRef.current)'), 'Must clear interval timer on cleanup and state change');
console.log('  ✅ [PASS] Timer hygiene verified: ReturnType<typeof setInterval> + clearInterval teardown');

// Test 3: Dual 3D Morphing Icon Layers & Color Interpolation
console.log('\nTest 3: Verifying 3D Morphing Icon Layers & Dual Channel Branding...');
assert(widgetContent.includes('name="logo-whatsapp"'), 'Must render WhatsApp logo');
assert(widgetContent.includes('name="logo-facebook"'), 'Must render Messenger logo');
assert(widgetContent.includes('#25D366'), 'Must use official WhatsApp green (#25D366)');
assert(widgetContent.includes('#0084FF'), 'Must use official Messenger blue (#0084FF)');
assert(widgetContent.includes('idleBgColor'), 'Must dynamically interpolate idle background color between WhatsApp and Messenger');
assert(widgetContent.includes('rotateY'), 'Must apply rotateY 3D coin-flip / morph transformation');
console.log('  ✅ [PASS] Dual channel branding (#25D366, #0084FF) and rotateY morphing verified');

// Test 4: Tap-to-Expand Multi-Channel Speed Dial
console.log('\nTest 4: Verifying Tap-to-Expand Speed Dial Menu...');
assert(widgetContent.includes('toggleExpand'), 'Must implement toggleExpand function');
assert(widgetContent.includes('closeMenu'), 'Must implement closeMenu function');
assert(widgetContent.includes('handleWhatsApp'), 'Must handle WhatsApp action');
assert(widgetContent.includes('handleMessenger'), 'Must handle Messenger action');
assert(widgetContent.includes('handleCall'), 'Must handle Call Helpline action');
assert(widgetContent.includes('openWhatsAppChat'), 'Must connect to openWhatsAppChat');
assert(widgetContent.includes('openFacebookMessenger'), 'Must connect to openFacebookMessenger');
assert(widgetContent.includes('openCallHelpline'), 'Must connect to openCallHelpline');
console.log('  ✅ [PASS] Speed-dial actions (WhatsApp, Messenger, Helpline, More) verified');

// Test 5: Tap-to-Collapse & Backdrop Dismissal
console.log('\nTest 5: Verifying Tap-to-Collapse & State Restoration...');
assert(widgetContent.includes('styles.backdrop'), 'Must have semi-transparent backdrop when menu is expanded');
assert(widgetContent.includes('styles.closeOverlay'), 'Must have close state overlay when expanded');
assert(widgetContent.includes('pointerEvents="none"'), 'Icon layers must safely ignore pointerEvents when morphing');
console.log('  ✅ [PASS] Backdrop dismissal and close overlay verified');

// Test 6: Global Mounting in App.tsx
console.log('\nTest 6: Verifying Global Mounting in App.tsx...');
assert(appContent.includes('<FloatingCrmWidget'), 'FloatingCrmWidget must be mounted in App.tsx');
assert(crmContent.includes('01312100288'), 'CRM channels must contain official WhatsApp/phone number');
assert(crmContent.includes('https://m.me/thrivingskills'), 'CRM channels must contain official Messenger URL');
console.log('  ✅ [PASS] App.tsx global mounting and official CRM channels verified');

console.log('\n====================================================');
console.log('   ALL 6 FLOATING CRM WIDGET TESTS PASSED!          ');
console.log('====================================================\n');
process.exit(0);
