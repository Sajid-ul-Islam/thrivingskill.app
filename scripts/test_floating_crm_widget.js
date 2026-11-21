/**
 * Automated Verification Suite for Support Chat Floating CRM Widget
 * Verifies:
 * 1. Single Iconic Meta Messenger button (no confusing morphing/flip timers)
 * 2. Cross-platform timer hygiene (no NodeJS.Timeout in client code)
 * 3. Authentic Meta Messenger Branding (#0084FF) & Multi-Channel Speed Dial (WhatsApp, Messenger, Helpline)
 * 4. 1-Tap ON / 1-Tap OFF toggle (no 'X' needed on the button)
 * 5. Reliable touch-through: onStartShouldSetPanResponder: () => false for guaranteed tap response
 * 6. Official CRM constants integration (01312-100288, https://m.me/thrivingskills) & App.tsx mounting
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('====================================================');
console.log('   SUPPORT CHAT FLOATING WIDGET (1-TAP ON/OFF) SUITE ');
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

// Test 1: Single Iconic Button & State Definition
console.log('Test 1: Verifying Single Iconic Button & Clean State Definition...');
assert(widgetContent.includes('const [expanded, setExpanded] = useState'), 'Must track expanded state');
assert(widgetContent.includes('toggleExpand'), 'Must define toggleExpand for 1-tap on/off');
assert(widgetContent.includes('FAB_SIZE'), 'Must define standard FAB_SIZE');
console.log('  ✅ [PASS] Single iconic button state & toggle definition verified');

// Test 2: Cross-Platform Timer Hygiene (AGENTS.md Rule 3)
console.log('\nTest 2: Verifying Cross-Platform Timer Hygiene (AGENTS.md Rule 3)...');
assert(!widgetContent.includes('NodeJS.Timeout'), 'Must NOT use NodeJS.Timeout in client code');
console.log('  ✅ [PASS] Timer hygiene verified: No NodeJS.Timeout in client code');

// Test 3: Authentic Meta Messenger Branding & Multi-Channel Speed Dial
console.log('\nTest 3: Verifying Authentic Messenger Branding & Multi-Channel Speed Dial...');
assert(widgetContent.includes('<MessengerIcon'), 'Must render authentic Meta Messenger icon');
assert(!widgetContent.includes('name="logo-facebook"'), 'FloatingCrmWidget must NOT use logo-facebook for Messenger');
assert(widgetContent.includes('name="logo-whatsapp"'), 'Must provide WhatsApp option in menu');
assert(widgetContent.includes('#25D366'), 'Must use official WhatsApp green (#25D366)');
assert(widgetContent.includes('#0084FF'), 'Must use official Messenger blue (#0084FF)');
console.log('  ✅ [PASS] Dual channel branding (#25D366, #0084FF) and authentic Messenger icon verified');

// Test 4: 1-Tap ON / 1-Tap OFF Speed Dial
console.log('\nTest 4: Verifying 1-Tap ON / 1-Tap OFF Speed Dial Menu...');
assert(widgetContent.includes('toggleExpand'), 'Must implement toggleExpand function');
assert(widgetContent.includes('closeMenu'), 'Must implement closeMenu function');
assert(widgetContent.includes('handleWhatsApp'), 'Must handle WhatsApp action');
assert(widgetContent.includes('handleMessenger'), 'Must handle Messenger action');
assert(widgetContent.includes('handleCall'), 'Must handle Call Helpline action');
assert(widgetContent.includes('openWhatsAppChat'), 'Must connect to openWhatsAppChat');
assert(widgetContent.includes('openFacebookMessenger'), 'Must connect to openFacebookMessenger');
assert(widgetContent.includes('openCallHelpline'), 'Must connect to openCallHelpline');
console.log('  ✅ [PASS] Speed-dial actions (WhatsApp, Messenger, Helpline, More) verified');

// Test 5: Clean Backdrop Dismissal & Reliable Touch Handling (No X Needed)
console.log('\nTest 5: Verifying Reliable Touch-Through & No X Needed...');
assert(widgetContent.includes('styles.backdrop'), 'Must have semi-transparent backdrop when menu is expanded');
assert(widgetContent.includes('onStartShouldSetPanResponder: () => false'), 'Must NOT capture touch on start so taps immediately fire TouchableOpacity onPress');
assert(!widgetContent.includes('styles.closeOverlay'), 'Must NOT replace button icon with X overlay (keeps Messenger identity)');
assert(!widgetContent.includes('dismissTargetContainer'), 'Must NOT show confusing bottom drop-to-dismiss X target');
console.log('  ✅ [PASS] Reliable touch-through and clean 1-tap on/off (no X needed) verified');

// Test 6: Global Mounting in App.tsx & Official CRM Channels
console.log('\nTest 6: Verifying Global Mounting in App.tsx...');
assert(appContent.includes('<FloatingCrmWidget'), 'FloatingCrmWidget must be mounted in App.tsx');
assert(crmContent.includes('01312100288'), 'CRM channels must contain official WhatsApp/phone number');
assert(crmContent.includes('https://m.me/thrivingskills'), 'CRM channels must contain official Messenger URL');
console.log('  ✅ [PASS] App.tsx global mounting and official CRM channels verified');

console.log('\n====================================================');
console.log('   ALL 6 SUPPORT CHAT WIDGET TESTS PASSED!          ');
console.log('====================================================\n');
process.exit(0);
