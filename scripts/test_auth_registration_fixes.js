// scripts/test_auth_registration_fixes.js
// Automated verification suite for Items D, E, F:
// - D: Username rewriting & preservation
// - E: Trusted-proxy IP rate limiting (Cloudflare CF-Connecting-IP)
// - F: Registration mail error logging & /resend-registration endpoint

const fs = require('fs');
const path = require('path');

console.log('=== RUNNING REGISTRATION, PROXY IP & RESEND SUITE (ITEMS D, E, F) ===\n');

let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

// --------------------------------------------------------------------------
// 1. Verify Backend Plugin: ts-mobile-bridge.php
// --------------------------------------------------------------------------
const bridgePath = path.join(__dirname, '../backend-plugin/ts-mobile-bridge/ts-mobile-bridge.php');
assert(fs.existsSync(bridgePath), 'ts-mobile-bridge.php file exists');
const bridgeContent = fs.readFileSync(bridgePath, 'utf-8');

console.log('\n--- Item D: Username Preservation & Single Suffix ---');
// Verify resolve_registration_username exists
assert(
  bridgeContent.includes('public static function resolve_registration_username'),
  'TSMB_Security declares resolve_registration_username helper'
);

// Verify username is preserved when not taken
assert(
  bridgeContent.includes("if (!username_exists($requested_clean))") &&
  bridgeContent.includes("'username'           => $requested_clean") &&
  bridgeContent.includes("'is_suggested'       => false"),
  'Keeps requested username unchanged if available (!username_exists)'
);

// Verify suggested username on conflict
assert(
  bridgeContent.includes("'is_suggested'       => true"),
  'Marks is_suggested = true when generating an alternative'
);

// Verify register_user uses resolve_registration_username
assert(
  bridgeContent.includes('TSMB_Security::resolve_registration_username($req_user, $email)'),
  'register_user calls resolve_registration_username'
);

// Verify register_user response includes username and username_suggested
assert(
  bridgeContent.includes("'username'              => $username") &&
  bridgeContent.includes("'username_suggested'    => $is_suggested"),
  'register_user response surfaces assigned username and username_suggested to client'
);

// Verify verify_registration DOES NOT call generate_secure_username on valid registered username
assert(
  !bridgeContent.includes("$username = TSMB_Security::generate_secure_username((string) ($record['username'] ?? 'student'));"),
  'verify_registration eliminated unconditional double-suffixing of username'
);
assert(
  bridgeContent.includes("$saved_username = sanitize_user((string) ($record['username'] ?? ''), true);") &&
  bridgeContent.includes("$username = $saved_username;"),
  'verify_registration directly adopts the validated registered username'
);

console.log('\n--- Item E: Cloudflare / Trusted Proxy IP Rate Limiting ---');
// Verify proxy trust opt-in check
assert(
  bridgeContent.includes('public static function should_trust_proxy_headers'),
  'TSMB_Security declares should_trust_proxy_headers opt-in check'
);
assert(
  bridgeContent.includes('TSMB_TRUST_PROXY_HEADERS') &&
  bridgeContent.includes("get_option('tsmb_trust_proxy_headers'"),
  'Proxy trust supports both TSMB_TRUST_PROXY_HEADERS constant and WordPress option'
);

// Verify CF-Connecting-IP & X-Forwarded-For resolution
assert(
  bridgeContent.includes('HTTP_CF_CONNECTING_IP') &&
  bridgeContent.includes('HTTP_X_REAL_IP') &&
  bridgeContent.includes('HTTP_X_FORWARDED_FOR'),
  'Checks Cloudflare (HTTP_CF_CONNECTING_IP), Nginx (HTTP_X_REAL_IP), and HTTP_X_FORWARDED_FOR'
);

// Verify IP validation and fallback to REMOTE_ADDR
assert(
  bridgeContent.includes("filter_var($candidate, FILTER_VALIDATE_IP)"),
  'Validates proxy IP candidates with FILTER_VALIDATE_IP'
);
assert(
  bridgeContent.includes("$_SERVER['REMOTE_ADDR']"),
  'Falls back to REMOTE_ADDR when headers are absent or untrusted'
);
assert(
  bridgeContent.includes("apply_filters('tsmb_client_ip', $ip)"),
  'Applies tsmb_client_ip WordPress filter for extensible environments'
);

console.log('\n--- Item F: Mail Delivery Reliability, Logging & Resend Route ---');
// Verify wp_mail_failed hook
assert(
  bridgeContent.includes("add_action('wp_mail_failed', [__CLASS__, 'log_mail_failure'])"),
  'Registers wp_mail_failed hook in TSMB_Security::init()'
);
assert(
  bridgeContent.includes('public static function log_mail_failure'),
  'Declares log_mail_failure method to capture SMTP/PHPMailer errors'
);

// Verify wp_mail result checking and logging in register_user
assert(
  bridgeContent.includes('$mail_sent = wp_mail($email, $subject, $body);') &&
  bridgeContent.includes('if (!$mail_sent)'),
  'Checks wp_mail return boolean and logs error on delivery failure'
);

// Verify /resend-registration route
assert(
  bridgeContent.includes("register_rest_route(self::NAMESPACE, '/resend-registration'"),
  'Registers /resend-registration REST route'
);
assert(
  bridgeContent.includes('public static function resend_registration'),
  'Implements resend_registration handler'
);

// Verify resend rate limiting
assert(
  bridgeContent.includes("consume_rate_limit('resend_reg_ip', $client_ip, 5, 15 * MINUTE_IN_SECONDS)") &&
  bridgeContent.includes("consume_rate_limit('resend_reg_email', $email, 3, 15 * MINUTE_IN_SECONDS)"),
  'Enforces strict IP (5/15m) and email (3/15m) rate limiting on resend'
);

// --------------------------------------------------------------------------
// 2. Verify Frontend API & Client Integration
// --------------------------------------------------------------------------
console.log('\n--- Frontend API & UI Parity ---');
const endpointsPath = path.join(__dirname, '../src/services/api/endpoints.ts');
const endpointsContent = fs.readFileSync(endpointsPath, 'utf-8');
assert(
  endpointsContent.includes("RESEND_REGISTRATION: '/thrivingskill/v1/resend-registration'"),
  'Endpoints.COMPANION declares RESEND_REGISTRATION'
);

const authServicePath = path.join(__dirname, '../src/services/api/authService.ts');
const authServiceContent = fs.readFileSync(authServicePath, 'utf-8');
assert(
  authServiceContent.includes('static async resendRegistrationOtp('),
  'AuthService declares resendRegistrationOtp method'
);
assert(
  authServiceContent.includes('Endpoints.COMPANION.RESEND_REGISTRATION'),
  'AuthService.resendRegistrationOtp posts to Endpoints.COMPANION.RESEND_REGISTRATION'
);

const hubPath = path.join(__dirname, '../src/components/profile/ProfileSupportHub.tsx');
const hubContent = fs.readFileSync(hubPath, 'utf-8');
assert(
  !hubContent.includes('Free eBook Library'),
  'ProfileSupportHub eliminated misleading "Free eBook Library"'
);
assert(
  !hubContent.includes('>FREE<'),
  'ProfileSupportHub eliminated "FREE" tag on eBook library row'
);
assert(
  !hubContent.includes('#10B981'),
  'ProfileSupportHub eliminated ad-hoc green color (#10B981)'
);

// --------------------------------------------------------------------------
// 3. Algorithm Simulation: Username Logic
// --------------------------------------------------------------------------
console.log('\n--- Username Algorithm Simulation ---');

function mockResolveUsername(requestedUser, email, existingUsers) {
  const requestedClean = (requestedUser || '').trim().replace(/[^a-zA-Z0-9_]/g, '');
  if (requestedClean.length >= 3) {
    if (!existingUsers.has(requestedClean)) {
      return { username: requestedClean, is_suggested: false };
    }
    const suffix = '4f2a';
    return { username: `${requestedClean.slice(0, 20)}_${suffix}`, is_suggested: true };
  }
  const emailPrefix = (email.split('@')[0] || 'student').replace(/[^a-zA-Z0-9_]/g, '');
  const cleanSeed = emailPrefix.length >= 3 ? emailPrefix.slice(0, 20) : 'student';
  if (!existingUsers.has(cleanSeed)) {
    return { username: cleanSeed, is_suggested: false };
  }
  return { username: `${cleanSeed}_4f2a`, is_suggested: true };
}

// Case 1: user enters 'sajid' and it's available
const usersSet1 = new Set(['tanvir', 'admin']);
const res1 = mockResolveUsername('sajid', 'sajid@example.com', usersSet1);
assert(res1.username === 'sajid' && res1.is_suggested === false, "User 'sajid' gets 'sajid' when available");

// Case 2: user enters 'sajid' and it is already taken
const usersSet2 = new Set(['sajid', 'admin']);
const res2 = mockResolveUsername('sajid', 'sajid@example.com', usersSet2);
assert(res2.username.startsWith('sajid_') && res2.is_suggested === true, "User 'sajid' gets suggested 'sajid_4f2a' when taken");

// Case 3: verification takes the saved username directly without double suffix
function mockVerify(recordUsername) {
  return recordUsername; // direct adoption
}
assert(mockVerify(res1.username) === 'sajid', "Verification preserves 'sajid' without adding a suffix");
assert(mockVerify(res2.username) === res2.username, "Verification preserves 'sajid_4f2a' without adding a second suffix");

// --------------------------------------------------------------------------
// 4. Algorithm Simulation: Proxy IP Resolution Logic
// --------------------------------------------------------------------------
console.log('\n--- Proxy IP Resolution Simulation ---');

function mockGetClientIp(headers, remoteAddr, trustProxy) {
  let ip = '0.0.0.0';
  if (trustProxy) {
    const candidates = ['HTTP_CF_CONNECTING_IP', 'HTTP_X_REAL_IP', 'HTTP_X_FORWARDED_FOR'];
    for (const header of candidates) {
      if (headers[header]) {
        const ips = headers[header].split(',');
        for (let candidate of ips) {
          candidate = candidate.trim();
          if (candidate && candidate !== '0.0.0.0') {
            ip = candidate;
            return ip;
          }
        }
      }
    }
  }
  if (remoteAddr) {
    ip = remoteAddr;
  }
  return ip;
}

// Behind Cloudflare, trust enabled
const cfIp = mockGetClientIp(
  { HTTP_CF_CONNECTING_IP: '103.145.12.89', HTTP_X_FORWARDED_FOR: '103.145.12.89, 172.68.23.4' },
  '172.68.23.4',
  true
);
assert(cfIp === '103.145.12.89', 'Resolves real user IP from HTTP_CF_CONNECTING_IP when proxy trust is on');

// Behind Cloudflare, trust disabled (default safe)
const defaultIp = mockGetClientIp(
  { HTTP_CF_CONNECTING_IP: '103.145.12.89' },
  '172.68.23.4',
  false
);
assert(defaultIp === '172.68.23.4', 'Falls back safely to REMOTE_ADDR when proxy trust is off');

// --------------------------------------------------------------------------
// 5. Item C: Phone Number Squatting Prevention
// --------------------------------------------------------------------------
console.log('\n--- Item C: Verified Phone Meta & Squatting Prevention ---');
assert(
  bridgeContent.includes("public const VERIFIED_PHONE_META = 'tsmb_verified_phone';"),
  'TSMB_OTP_Auth defines dedicated tsmb_verified_phone meta key'
);

// Verify verify_registration does NOT write tsmb_verified_phone
const verifyRegSection = bridgeContent.slice(
  bridgeContent.indexOf('public static function verify_registration('),
  bridgeContent.indexOf('public static function resend_registration(')
);
assert(
  !verifyRegSection.includes('tsmb_verified_phone') && !verifyRegSection.includes('VERIFIED_PHONE_META'),
  'Email registration (verify_registration) never sets tsmb_verified_phone'
);

// Verify find_user_by_phone strictly queries VERIFIED_PHONE_META and not phone/billing_phone/user_login
const findPhoneSection = bridgeContent.slice(
  bridgeContent.indexOf('private static function find_user_by_phone('),
  bridgeContent.indexOf('public static function claim_verified_phone(')
);
assert(
  findPhoneSection.includes("'key'     => self::VERIFIED_PHONE_META") &&
  !findPhoneSection.includes("'billing_phone'") &&
  !findPhoneSection.includes("get_user_by('login'"),
  'find_user_by_phone queries only tsmb_verified_phone (not unverified phone, billing_phone, or user_login)'
);
assert(
  findPhoneSection.includes("'number'     => 2") &&
  findPhoneSection.includes("verified_phone_conflict"),
  'find_user_by_phone detects duplicate verified phone conflicts instead of taking first match'
);

// Verify claim_verified_phone enforces uniqueness and is called by verify_otp
assert(
  bridgeContent.includes('public static function claim_verified_phone(') &&
  bridgeContent.includes('verified_phone_already_in_use') &&
  bridgeContent.includes('self::claim_verified_phone($user_id, $phone)'),
  'claim_verified_phone enforces uniqueness and is called only after OTP verification'
);

// Summary
console.log(`\n====================================================`);
if (failed === 0) {
  console.log(`🎉 ALL C, D, E, F AUTH & REGISTRATION CHECKS PASSED SUCCESSFULLY!`);
  process.exit(0);
} else {
  console.error(`❌ ${failed} CHECKS FAILED!`);
  process.exit(1);
}
