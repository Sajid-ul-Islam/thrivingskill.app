<?php

/**
 * Plugin Name: TS Mobile Bridge
 * Plugin URI: https://thrivingskill.com
 * Description: Hardened mobile REST API bridge, remote configuration, push notification engine, and Mobile App Command Center for Thriving Skills.
 * Version: 1.3.0
 * Requires PHP: 7.4
 * Author: Thriving Skills Engineering
 * Author URI: https://thrivingskill.com
 * License: GPLv2 or later
 * Text Domain: ts-mobile-bridge
 */

if (!defined('ABSPATH')) {
    exit;
}

define('TSMB_VERSION', '1.3.0');
define('TSMB_DB_VERSION', '1.3.0');

/* ==========================================================================
   1. PLUGIN LIFECYCLE (SCHEMA, MIGRATIONS & UNINSTALL CLEANUP)
   ========================================================================== */

class TSMB_Lifecycle
{
    public const DB_VERSION_OPTION = 'tsmb_db_version';
    public const PUSH_TABLE_SUFFIX = 'tsmb_push_tokens';
    public const LEADS_TABLE_SUFFIX = 'tsmb_corporate_inquiries';
    public const TICKETS_TABLE_SUFFIX = 'tsmb_support_tickets';
    public const CRON_RECEIPTS_HOOK = 'tsmb_process_expo_receipts';

    public static function get_push_tokens_table(): string
    {
        global $wpdb;
        return $wpdb->prefix . self::PUSH_TABLE_SUFFIX;
    }

    public static function get_leads_table(): string
    {
        global $wpdb;
        return $wpdb->prefix . self::LEADS_TABLE_SUFFIX;
    }

    public static function get_tickets_table(): string
    {
        global $wpdb;
        return $wpdb->prefix . self::TICKETS_TABLE_SUFFIX;
    }

    public static function activate(): void
    {
        self::install_schema();
        self::migrate_legacy_tokens();
        update_option(self::DB_VERSION_OPTION, TSMB_DB_VERSION);
    }

    public static function maybe_upgrade(): void
    {
        $installed = get_option(self::DB_VERSION_OPTION, '');
        if ($installed !== TSMB_DB_VERSION) {
            self::install_schema();
            self::migrate_legacy_tokens();
            update_option(self::DB_VERSION_OPTION, TSMB_DB_VERSION);
        }
    }

    public static function install_schema(): void
    {
        global $wpdb;

        $push_table    = self::get_push_tokens_table();
        $leads_table   = self::get_leads_table();
        $tickets_table = self::get_tickets_table();
        $charset_collate = $wpdb->get_charset_collate();

        if (!function_exists('dbDelta')) {
            $upgrade_file = ABSPATH . 'wp-admin/includes/upgrade.php';
            if (file_exists($upgrade_file)) {
                require_once $upgrade_file;
            }
        }
        if (!function_exists('dbDelta')) {
            return;
        }

        $sql_push = "CREATE TABLE {$push_table} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            user_id bigint(20) unsigned NOT NULL DEFAULT 0,
            token varchar(255) NOT NULL,
            platform varchar(32) NOT NULL DEFAULT 'unknown',
            last_seen datetime NOT NULL,
            created_at datetime NOT NULL,
            PRIMARY KEY  (id),
            UNIQUE KEY uniq_token (token),
            KEY idx_user_id (user_id),
            KEY idx_last_seen (last_seen)
        ) {$charset_collate};";

        $sql_leads = "CREATE TABLE {$leads_table} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            reference_id varchar(40) NOT NULL,
            user_id bigint(20) unsigned NOT NULL DEFAULT 0,
            service_type varchar(120) NOT NULL,
            company_name varchar(180) NOT NULL,
            contact_name varchar(140) NOT NULL,
            work_email varchar(180) NOT NULL,
            phone varchar(64) NOT NULL DEFAULT '',
            team_size varchar(40) NOT NULL DEFAULT '',
            notes text NOT NULL,
            status varchar(32) NOT NULL DEFAULT 'new',
            ip_address varchar(64) NOT NULL DEFAULT '',
            created_at datetime NOT NULL,
            updated_at datetime NOT NULL,
            PRIMARY KEY  (id),
            UNIQUE KEY uniq_reference (reference_id),
            KEY idx_email (work_email),
            KEY idx_status (status),
            KEY idx_created_at (created_at)
        ) {$charset_collate};";

        $sql_tickets = "CREATE TABLE {$tickets_table} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            ticket_id varchar(40) NOT NULL,
            user_id bigint(20) unsigned NOT NULL,
            topic varchar(64) NOT NULL DEFAULT 'general',
            subject varchar(200) NOT NULL,
            message text NOT NULL,
            course_id bigint(20) unsigned NOT NULL DEFAULT 0,
            contact_email varchar(180) NOT NULL DEFAULT '',
            status varchar(32) NOT NULL DEFAULT 'open',
            admin_reply text NOT NULL,
            created_at datetime NOT NULL,
            updated_at datetime NOT NULL,
            PRIMARY KEY  (id),
            UNIQUE KEY uniq_ticket (ticket_id),
            KEY idx_user_status (user_id, status),
            KEY idx_created_at (created_at)
        ) {$charset_collate};";

        dbDelta($sql_push);
        dbDelta($sql_leads);
        dbDelta($sql_tickets);
    }

    public static function migrate_legacy_tokens(): void
    {
        global $wpdb;

        $legacy = get_option('tsmb_registered_push_tokens', null);
        if (is_array($legacy) && !empty($legacy)) {
            $table_name = self::get_push_tokens_table();
            $now_gmt = current_time('mysql', true);

            foreach ($legacy as $token => $meta) {
                if (!is_string($token) || !TSMB_Notifications::is_valid_expo_token($token)) {
                    continue;
                }
                $platform = is_array($meta) && isset($meta['platform'])
                    ? TSMB_Notifications::sanitize_platform((string) $meta['platform'])
                    : 'unknown';
                $user_id = is_array($meta) && isset($meta['user_id']) ? absint($meta['user_id']) : 0;

                $wpdb->query(
                    $wpdb->prepare(
                        "INSERT IGNORE INTO {$table_name} (user_id, token, platform, last_seen, created_at) VALUES (%d, %s, %s, %s, %s)",
                        $user_id,
                        $token,
                        $platform,
                        $now_gmt,
                        $now_gmt
                    )
                );
            }
        }

        delete_option('tsmb_registered_push_tokens');
    }

    public static function uninstall(): void
    {
        global $wpdb;

        $options = [
            'tsmb_min_app_version',
            'tsmb_latest_app_version',
            'tsmb_maintenance_mode',
            'tsmb_banner_active',
            'tsmb_banner_text',
            'tsmb_banner_link',
            'tsmb_hero_slides',
            'tsmb_flash_active',
            'tsmb_flash_title',
            'tsmb_flash_code',
            'tsmb_flash_discount',
            'tsmb_flash_end',
            'tsmb_trending_keywords',
            'tsmb_support_whatsapp',
            'tsmb_support_email',
            'tsmb_support_helpline',
            'tsmb_registered_push_tokens',
            'tsmb_feed_cache_ver',
            'tsmb_sms_gateway_url',
            'tsmb_sms_api_key',
            'tsmb_sms_sender_id',
            'tsmb_android_sha256_fingerprints',
            'tsmb_trust_proxy_headers',
            self::DB_VERSION_OPTION,
        ];

        foreach ($options as $option_name) {
            delete_option($option_name);
        }

        delete_transient('tsmb_mobile_feed_v1');

        $like_transient = $wpdb->esc_like('_transient_tsmb_') . '%';
        $like_timeout = $wpdb->esc_like('_transient_timeout_tsmb_') . '%';
        $wpdb->query(
            $wpdb->prepare(
                "DELETE FROM {$wpdb->options} WHERE option_name LIKE %s OR option_name LIKE %s",
                $like_transient,
                $like_timeout
            )
        );

        $table_name    = self::get_push_tokens_table();
        $leads_table   = self::get_leads_table();
        $tickets_table = self::get_tickets_table();
        $wpdb->query("DROP TABLE IF EXISTS {$table_name}");
        $wpdb->query("DROP TABLE IF EXISTS {$leads_table}");
        $wpdb->query("DROP TABLE IF EXISTS {$tickets_table}");

        wp_clear_scheduled_hook(self::CRON_RECEIPTS_HOOK);
        wp_clear_scheduled_hook(TSMB_Notifications::BATCH_BROADCAST_HOOK);
        if (function_exists('as_unschedule_all_actions')) {
            as_unschedule_all_actions(TSMB_Notifications::BATCH_BROADCAST_HOOK);
        }
    }
}

function tsmb_uninstall_plugin(): void
{
    TSMB_Lifecycle::uninstall();
}

register_activation_hook(__FILE__, [TSMB_Lifecycle::class, 'activate']);
register_uninstall_hook(__FILE__, 'tsmb_uninstall_plugin');

/* ==========================================================================
   2. SECURITY, RATE LIMITING & SIGNED BEARER AUTH
   ========================================================================== */

class TSMB_Security
{
    private const JWT_ISSUER = 'tsmb';
    private const TOKEN_TTL_SECONDS = 604800; // 7 days
    public const TOKEN_VERSION_META = 'tsmb_token_version';
    private static $last_mail_error = null;
    private static $current_token_context = null;

    public static function init(): void
    {
        add_filter('determine_current_user', [__CLASS__, 'determine_current_user'], 20);
        add_filter('determine_current_user', [__CLASS__, 'enforce_revoked_token'], 99);
        add_action('init', [__CLASS__, 'handle_webview_handoff'], 1);
        add_action('wp_mail_failed', [__CLASS__, 'log_mail_failure']);
        add_action('after_password_reset', [__CLASS__, 'on_password_reset'], 10, 1);
        add_action('profile_update', [__CLASS__, 'on_profile_update'], 10, 2);
        add_action('wp_set_password', [__CLASS__, 'on_wp_set_password'], 10, 2);
    }

    public static function reset_request_context(): void
    {
        self::$current_token_context = null;
        self::$last_mail_error = null;
    }

    public static function get_current_token_context(): ?array
    {
        return self::$current_token_context;
    }

    public static function get_user_token_version(int $user_id): int
    {
        $ver = intval(get_user_meta($user_id, self::TOKEN_VERSION_META, true));
        return $ver >= 1 ? $ver : 1;
    }

    public static function revoke_user_tokens(int $user_id): int
    {
        if ($user_id <= 0) {
            return 1;
        }
        $next = self::get_user_token_version($user_id) + 1;
        update_user_meta($user_id, self::TOKEN_VERSION_META, $next);
        return $next;
    }

    public static function revoke_single_token(?string $jti, ?string $raw_jwt = null, int $exp = 0): bool
    {
        $ttl = $exp > time() ? min(self::TOKEN_TTL_SECONDS, $exp - time() + 60) : self::TOKEN_TTL_SECONDS;
        $revoked = false;

        if (is_string($jti) && $jti !== '') {
            set_transient('tsmb_rev_jti_' . hash('sha256', $jti), 1, $ttl);
            $revoked = true;
        }
        if (is_string($raw_jwt) && $raw_jwt !== '') {
            set_transient('tsmb_rev_tok_' . hash('sha256', $raw_jwt), 1, $ttl);
            $revoked = true;
        }

        return $revoked;
    }

    public static function is_jti_revoked(string $jti): bool
    {
        if ($jti === '') {
            return false;
        }
        return get_transient('tsmb_rev_jti_' . hash('sha256', $jti)) !== false;
    }

    public static function is_bearer_token_revoked(): bool
    {
        $auth_header = self::get_authorization_header();
        if ($auth_header === '' || stripos($auth_header, 'Bearer ') !== 0) {
            return false;
        }
        $jwt = trim(substr($auth_header, 7));
        if ($jwt === '') {
            return false;
        }
        return get_transient('tsmb_rev_tok_' . hash('sha256', $jwt)) !== false;
    }

    public static function enforce_revoked_token($user_id)
    {
        if (!empty($user_id) && self::is_bearer_token_revoked()) {
            return 0;
        }
        return $user_id;
    }

    public static function on_password_reset($user): void
    {
        if ($user instanceof WP_User && $user->ID > 0) {
            self::revoke_user_tokens(intval($user->ID));
        }
    }

    public static function on_profile_update($user_id, $old_user_data): void
    {
        $uid = intval($user_id);
        if ($uid <= 0 || !($old_user_data instanceof WP_User)) {
            return;
        }
        $new_user = get_userdata($uid);
        if ($new_user instanceof WP_User && $new_user->user_pass !== $old_user_data->user_pass) {
            self::revoke_user_tokens($uid);
        }
    }

    public static function on_wp_set_password($password, $user_id): void
    {
        $uid = intval($user_id);
        if ($uid > 0) {
            self::revoke_user_tokens($uid);
        }
    }

    public static function log_mail_failure($wp_error): void
    {
        if (is_wp_error($wp_error)) {
            self::$last_mail_error = $wp_error->get_error_message();
            error_log(sprintf('[TSMB Mail Failure] %s', self::$last_mail_error));
        }
    }

    public static function get_last_mail_error(): ?string
    {
        return self::$last_mail_error;
    }

    public static function should_trust_proxy_headers(): bool
    {
        if (defined('TSMB_TRUST_PROXY_HEADERS') && TSMB_TRUST_PROXY_HEADERS) {
            return true;
        }
        return get_option('tsmb_trust_proxy_headers', '0') === '1';
    }

    public static function get_trusted_proxy_header(): string
    {
        $allowed = ['HTTP_CF_CONNECTING_IP', 'HTTP_X_REAL_IP', 'REMOTE_ADDR'];
        if (defined('TSMB_TRUSTED_PROXY_HEADER') && in_array(TSMB_TRUSTED_PROXY_HEADER, $allowed, true)) {
            return TSMB_TRUSTED_PROXY_HEADER;
        }
        $opt = sanitize_text_field((string) get_option('tsmb_trusted_proxy_header', 'HTTP_CF_CONNECTING_IP'));
        return in_array($opt, $allowed, true) ? $opt : 'HTTP_CF_CONNECTING_IP';
    }

    public static function is_remote_addr_trusted_proxy(string $remote_addr): bool
    {
        $raw_list = defined('TSMB_TRUSTED_PROXY_IPS')
            ? (string) TSMB_TRUSTED_PROXY_IPS
            : (string) get_option('tsmb_trusted_proxy_ips', '');
        $trimmed = trim($raw_list);
        if ($trimmed === '') {
            return true;
        }
        $allowed_proxies = array_filter(array_map('trim', preg_split('/[\r\n,]+/', $trimmed) ?: []));
        return in_array($remote_addr, $allowed_proxies, true);
    }

    public static function get_client_ip(): string
    {
        $ip = '0.0.0.0';
        $remote_addr = '';

        if (!empty($_SERVER['REMOTE_ADDR'])) {
            $raw_remote = wp_unslash((string) $_SERVER['REMOTE_ADDR']);
            $clean_remote = sanitize_text_field($raw_remote);
            if (filter_var($clean_remote, FILTER_VALIDATE_IP)) {
                $remote_addr = $clean_remote;
            }
        }

        if (self::should_trust_proxy_headers() && self::is_remote_addr_trusted_proxy($remote_addr)) {
            $header = self::get_trusted_proxy_header();
            if ($header !== 'REMOTE_ADDR' && !empty($_SERVER[$header])) {
                $candidate = trim(sanitize_text_field(wp_unslash((string) $_SERVER[$header])));
                if (filter_var($candidate, FILTER_VALIDATE_IP)) {
                    $ip = $candidate;
                }
            }
        }

        if ($ip === '0.0.0.0' && $remote_addr !== '') {
            $ip = $remote_addr;
        }

        return apply_filters('tsmb_client_ip', $ip);
    }

    public static function pad_mail_timing(float $started_at, bool $dispatched_mail, float $mail_elapsed_sec = 0.0): void
    {
        $floor_key = 'tsmb_mail_timing_floor_ms';
        if ($dispatched_mail) {
            $measured_ms = max(120, min(850, intval(round($mail_elapsed_sec * 1000))));
            set_transient($floor_key, $measured_ms, HOUR_IN_SECONDS);
            return;
        }

        $target_ms = intval(get_transient($floor_key) ?: 250);
        $target_ms = max(120, min(850, $target_ms));
        if (function_exists('random_int')) {
            $target_ms += random_int(-25, 25);
        }
        $elapsed_ms = (microtime(true) - $started_at) * 1000.0;
        $remaining_ms = $target_ms - $elapsed_ms;
        if ($remaining_ms > 5 && !defined('TSMB_DISABLE_TIMING_SLEEP')) {
            usleep(intval($remaining_ms * 1000));
        }
    }

    public static function consume_rate_limit(
        string $bucket,
        string $identifier,
        int $max_requests,
        int $window_seconds
    ) {
        $key = 'tsmb_rl_' . substr(hash('sha256', $bucket . '|' . $identifier), 0, 32);
        $now = time();
        $state = get_transient($key);

        if (!is_array($state) || !isset($state['reset_at']) || intval($state['reset_at']) <= $now) {
            $state = [
                'count'    => 1,
                'reset_at' => $now + $window_seconds,
            ];
            set_transient($key, $state, $window_seconds);
            return true;
        }

        $count = intval($state['count'] ?? 0);
        if ($count >= $max_requests) {
            $retry_after = max(1, intval($state['reset_at']) - $now);
            return new WP_Error(
                'tsmb_rate_limited',
                __('Too many attempts. Please try again later.', 'ts-mobile-bridge'),
                [
                    'status'      => 429,
                    'retry_after' => $retry_after,
                ]
            );
        }

        $state['count'] = $count + 1;
        $remaining_ttl = max(1, intval($state['reset_at']) - $now);
        set_transient($key, $state, $remaining_ttl);
        return true;
    }

    /**
     * Resolves a safe, clean username for registration.
     * If the user provided a username and it is available, keeps it verbatim.
     * If taken or empty, generates a clean suggestion with a random suffix.
     *
     * @param string $requested_user User-provided username (optional).
     * @param string $email User email (used as fallback seed).
     * @return array{username: string, is_suggested: bool, original_requested: string}
     */
    public static function resolve_registration_username(string $requested_user, string $email): array
    {
        $requested_clean = sanitize_user(trim($requested_user), true);

        // If user typed a valid username of at least 3 characters
        if (!empty($requested_clean) && strlen($requested_clean) >= 3) {
            if (!username_exists($requested_clean)) {
                return [
                    'username'           => $requested_clean,
                    'is_suggested'       => false,
                    'original_requested' => $requested_user,
                ];
            }
            // If requested username is taken, generate a clean suggested alternative
            $clean_seed = strtolower((string) preg_replace('/[^a-zA-Z0-9_]/', '', $requested_clean));
            $clean_seed = substr($clean_seed, 0, 20);
            $suffix     = bin2hex(random_bytes(2)); // e.g. sajid_4f2a
            $candidate  = sanitize_user($clean_seed . '_' . $suffix, true);
            $attempts   = 0;
            while (username_exists($candidate) && $attempts < 10) {
                $attempts++;
                $candidate = sanitize_user($clean_seed . '_' . bin2hex(random_bytes(3)), true);
            }
            return [
                'username'           => $candidate,
                'is_suggested'       => true,
                'original_requested' => $requested_user,
            ];
        }

        // No username provided: seed from email prefix
        $email_prefix = explode('@', $email)[0] ?? 'student';
        $clean_seed   = strtolower((string) preg_replace('/[^a-zA-Z0-9_]/', '', $email_prefix));
        if (strlen($clean_seed) < 3) {
            $clean_seed = 'student';
        }
        $clean_seed = substr($clean_seed, 0, 20);

        if (!username_exists($clean_seed)) {
            return [
                'username'           => $clean_seed,
                'is_suggested'       => false,
                'original_requested' => '',
            ];
        }

        $candidate = sanitize_user($clean_seed . '_' . bin2hex(random_bytes(2)), true);
        $attempts  = 0;
        while (username_exists($candidate) && $attempts < 10) {
            $attempts++;
            $candidate = sanitize_user($clean_seed . '_' . bin2hex(random_bytes(3)), true);
        }

        return [
            'username'           => $candidate,
            'is_suggested'       => true,
            'original_requested' => '',
        ];
    }

    public static function generate_secure_username(string $seed = ''): string
    {
        $clean = strtolower((string) preg_replace('/[^a-zA-Z0-9_]/', '', $seed));
        if (strlen($clean) < 3) {
            $clean = 'student';
        }
        $clean = substr($clean, 0, 24);

        $suffix = bin2hex(random_bytes(3));
        $candidate = sanitize_user($clean . '_' . $suffix, true);

        $attempts = 0;
        while (empty($candidate) || username_exists($candidate)) {
            $attempts++;
            $bytes = $attempts > 3 ? 5 : 4;
            $candidate = sanitize_user($clean . '_' . bin2hex(random_bytes($bytes)), true);
            if ($attempts >= 10) {
                $candidate = sanitize_user('student_' . bin2hex(random_bytes(6)), true);
                break;
            }
        }

        return $candidate;
    }

    public static function generate_numeric_otp(int $digits = 6): string
    {
        $max = (int) (10 ** $digits) - 1;
        return str_pad((string) random_int(0, $max), $digits, '0', STR_PAD_LEFT);
    }

    public static function is_dev_environment(): bool
    {
        if (!function_exists('wp_get_environment_type')) {
            return false;
        }
        return in_array(wp_get_environment_type(), ['local', 'development'], true);
    }

    public static function issue_bearer_token(int $user_id, int $ttl = self::TOKEN_TTL_SECONDS): string
    {
        $now = time();
        $ver = self::get_user_token_version($user_id);
        $header = self::base64url_encode(wp_json_encode([
            'alg' => 'HS256',
            'typ' => 'JWT',
        ]));
        $payload = self::base64url_encode(wp_json_encode([
            'iss' => self::JWT_ISSUER,
            'sub' => $user_id,
            'ver' => $ver,
            'iat' => $now,
            'exp' => $now + $ttl,
            'jti' => bin2hex(random_bytes(16)),
        ]));
        $signature = self::base64url_encode(
            hash_hmac('sha256', $header . '.' . $payload, wp_salt('auth'), true)
        );

        return $header . '.' . $payload . '.' . $signature;
    }

    public static function determine_current_user($user_id)
    {
        if (!empty($user_id)) {
            return $user_id;
        }

        $auth_header = self::get_authorization_header();
        if (empty($auth_header) || stripos($auth_header, 'Bearer ') !== 0) {
            return $user_id;
        }

        $jwt = trim(substr($auth_header, 7));
        $parts = explode('.', $jwt);
        if (count($parts) !== 3) {
            return $user_id;
        }

        [$header_b64, $payload_b64, $sig_b64] = $parts;
        $header = json_decode(self::base64url_decode($header_b64), true);
        $payload = json_decode(self::base64url_decode($payload_b64), true);

        // Only handle tokens issued by TSMB; pass others (e.g. LearnPress JWTs) through untouched.
        if (
            !is_array($header) ||
            !is_array($payload) ||
            ($header['alg'] ?? '') !== 'HS256' ||
            ($payload['iss'] ?? '') !== self::JWT_ISSUER
        ) {
            return $user_id;
        }

        $expected_sig = self::base64url_encode(
            hash_hmac('sha256', $header_b64 . '.' . $payload_b64, wp_salt('auth'), true)
        );

        if (!hash_equals($expected_sig, $sig_b64)) {
            return $user_id;
        }

        $exp = intval($payload['exp'] ?? 0);
        $sub = absint($payload['sub'] ?? 0);
        if ($sub <= 0 || $exp < time()) {
            return $user_id;
        }

        $user = get_userdata($sub);
        if (!$user) {
            return $user_id;
        }

        $token_ver = intval($payload['ver'] ?? 0);
        if ($token_ver !== self::get_user_token_version($sub)) {
            return $user_id;
        }

        $jti = (string) ($payload['jti'] ?? '');
        if (self::is_jti_revoked($jti)) {
            return $user_id;
        }

        self::$current_token_context = [
            'user_id' => $sub,
            'jti'     => $jti,
            'exp'     => $exp,
            'raw_jwt' => $jwt,
        ];

        return $sub;
    }

    public static function handle_webview_handoff(): void
    {
        if (is_admin() || !isset($_GET['tsmb_handoff'])) {
            return;
        }

        $raw_code = trim(sanitize_text_field(wp_unslash((string) $_GET['tsmb_handoff'])));
        if ($raw_code === '' || !preg_match('/^[a-f0-9]{32,128}$/i', $raw_code)) {
            return;
        }

        $transient_key = 'tsmb_wv_handoff_' . hash('sha256', $raw_code);
        $record = get_transient($transient_key);
        delete_transient($transient_key);

        nocache_headers();

        if (!is_array($record) || empty($record['user_id'])) {
            wp_safe_redirect(home_url('/'));
            if (!defined('TSMB_TESTING')) {
                exit;
            }
            return;
        }

        $uid  = intval($record['user_id']);
        $user = get_userdata($uid);
        if (!$user) {
            wp_safe_redirect(home_url('/'));
            if (!defined('TSMB_TESTING')) {
                exit;
            }
            return;
        }

        wp_clear_auth_cookie();
        wp_set_current_user($uid);
        wp_set_auth_cookie($uid, false, is_ssl());
        do_action('wp_login', $user->user_login, $user);

        $redirect_to = (string) ($record['redirect_to'] ?? '/');
        $target = wp_validate_redirect($redirect_to, home_url('/'));
        wp_safe_redirect($target);
        if (!defined('TSMB_TESTING')) {
            exit;
        }
    }

    public static function get_authorization_header_public(): string
    {
        return self::get_authorization_header();
    }

    private static function get_authorization_header(): string
    {
        if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
            return trim(sanitize_text_field(wp_unslash((string) $_SERVER['HTTP_AUTHORIZATION'])));
        }
        if (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            return trim(sanitize_text_field(wp_unslash((string) $_SERVER['REDIRECT_HTTP_AUTHORIZATION'])));
        }
        return '';
    }

    private static function base64url_encode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64url_decode(string $data): string
    {
        $remainder = strlen($data) % 4;
        if ($remainder > 0) {
            $data .= str_repeat('=', 4 - $remainder);
        }
        $decoded = base64_decode(strtr($data, '-_', '+/'), true);
        return $decoded !== false ? $decoded : '';
    }
}

/* ==========================================================================
   3. REST API CONTROLLER
   ========================================================================== */

class TSMB_Rest_API
{
    public const NAMESPACE = 'thrivingskill/v1';
    public const MAX_FEED_LIMIT = 50;
    public const DEFAULT_FEED_LIMIT = 30;
    public const MIN_PASSWORD_LENGTH = 12;
    public const USER_META_WATCH_POSITIONS = 'tsmb_watch_positions_v1';
    public const USER_META_GAMIFICATION = 'tsmb_gamification_v1';
    private static $user_paid_courses_cache = [];

    public static function reset_request_caches(): void
    {
        self::$user_paid_courses_cache = [];
    }

    public static function init(): void
    {
        add_action('rest_api_init', [__CLASS__, 'register_routes']);
        add_action('template_redirect', [__CLASS__, 'maybe_serve_certificate_verification'], 2);
        add_action('save_post_lp_course', [__CLASS__, 'clear_feed_cache']);
        add_filter('rest_request_before_callbacks', [__CLASS__, 'guard_learnpress_paid_enroll'], 10, 3);
        add_filter('learn_press_user_can_enroll_course', [__CLASS__, 'filter_learnpress_can_enroll_course'], 10, 3);
        add_filter('learn-press/user/can-enroll/course', [__CLASS__, 'filter_learnpress_can_enroll_course'], 10, 3);
    }

    public static function register_routes(): void
    {
        register_rest_route(self::NAMESPACE, '/config', [
            'methods'             => 'GET',
            'callback'            => [__CLASS__, 'get_config'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route(self::NAMESPACE, '/feed', [
            'methods'             => 'GET',
            'callback'            => [__CLASS__, 'get_feed'],
            'permission_callback' => '__return_true',
            'args'                => [
                'limit' => [
                    'default'           => self::DEFAULT_FEED_LIMIT,
                    'sanitize_callback' => 'absint',
                ],
                'page' => [
                    'default'           => 1,
                    'sanitize_callback' => 'absint',
                ],
            ],
        ]);

        register_rest_route(self::NAMESPACE, '/lessons/(?P<id>\d+)', [
            'methods'             => 'GET',
            'callback'            => [__CLASS__, 'get_lesson_detail'],
            'permission_callback' => [__CLASS__, 'check_lesson_access'],
            'args'                => [
                'id' => [
                    'validate_callback' => function ($param) {
                        return is_numeric($param) && intval($param) > 0;
                    },
                ],
            ],
        ]);

        register_rest_route(self::NAMESPACE, '/enrollments', [
            'methods'             => 'GET',
            'callback'            => [__CLASS__, 'get_user_enrollments'],
            'permission_callback' => [__CLASS__, 'check_authenticated_user'],
            'args'                => [
                'course_id' => [
                    'required'          => false,
                    'sanitize_callback' => 'absint',
                ],
                'order_id' => [
                    'required'          => false,
                    'sanitize_callback' => 'absint',
                ],
                'order_key' => [
                    'required'          => false,
                    'sanitize_callback' => 'sanitize_text_field',
                ],
            ],
        ]);

        register_rest_route(self::NAMESPACE, '/register', [
            'methods'             => 'POST',
            'callback'            => [__CLASS__, 'register_user'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route(self::NAMESPACE, '/verify-registration', [
            'methods'             => 'POST',
            'callback'            => [__CLASS__, 'verify_registration'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route(self::NAMESPACE, '/resend-registration', [
            'methods'             => 'POST',
            'callback'            => [__CLASS__, 'resend_registration'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route(self::NAMESPACE, '/auth/reset-password/confirm', [
            'methods'             => 'POST',
            'callback'            => [__CLASS__, 'confirm_password_reset'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route(self::NAMESPACE, '/revoke-token', [
            'methods'             => 'POST',
            'callback'            => [__CLASS__, 'revoke_token'],
            'permission_callback' => [__CLASS__, 'check_authenticated_user'],
        ]);

        register_rest_route(self::NAMESPACE, '/auth/webview-handoff', [
            'methods'             => 'POST',
            'callback'            => [__CLASS__, 'create_webview_handoff'],
            'permission_callback' => [__CLASS__, 'check_authenticated_user'],
        ]);

        register_rest_route(self::NAMESPACE, '/learning-state', [
            'methods'             => 'GET',
            'callback'            => [__CLASS__, 'get_learning_state'],
            'permission_callback' => [__CLASS__, 'check_authenticated_user'],
        ]);

        register_rest_route(self::NAMESPACE, '/courses/(?P<id>\d+)/submit-review', [
            'methods'             => 'POST',
            'callback'            => [__CLASS__, 'submit_course_review'],
            'permission_callback' => [__CLASS__, 'check_authenticated_user'],
            'args'                => [
                'id' => [
                    'validate_callback' => function ($param) {
                        return is_numeric($param) && intval($param) > 0;
                    },
                ],
            ],
        ]);

        register_rest_route(self::NAMESPACE, '/certificates/verify', [
            'methods'             => 'GET',
            'callback'            => [__CLASS__, 'verify_certificate'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route(self::NAMESPACE, '/corporate-inquiry', [
            'methods'             => 'POST',
            'callback'            => [__CLASS__, 'submit_corporate_inquiry'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route(self::NAMESPACE, '/support-tickets', [
            [
                'methods'             => 'GET',
                'callback'            => [__CLASS__, 'get_support_tickets'],
                'permission_callback' => [__CLASS__, 'check_authenticated_user'],
            ],
            [
                'methods'             => 'POST',
                'callback'            => [__CLASS__, 'create_support_ticket'],
                'permission_callback' => [__CLASS__, 'check_authenticated_user'],
            ],
        ]);

        register_rest_route(self::NAMESPACE, '/engagement-sync', [
            'methods'             => 'POST',
            'callback'            => [__CLASS__, 'sync_engagement_state'],
            'permission_callback' => [__CLASS__, 'check_authenticated_user'],
        ]);
    }

    public static function create_webview_handoff($request)
    {
        $user_id = get_current_user_id();
        if ($user_id <= 0) {
            return new WP_Error('rest_forbidden', __('Authentication required.', 'ts-mobile-bridge'), ['status' => 401]);
        }

        $rl = TSMB_Security::consume_rate_limit('wv_handoff', (string) $user_id, 20, 15 * MINUTE_IN_SECONDS);
        if (is_wp_error($rl)) {
            return $rl;
        }

        $params = $request->get_json_params();
        if (!is_array($params)) {
            $params = [];
        }

        $course_id   = absint($params['course_id'] ?? ($request->get_param('course_id') ?? 0));
        $redirect_in = trim(sanitize_text_field((string) ($params['redirect_to'] ?? ($request->get_param('redirect_to') ?? ''))));

        if ($redirect_in === '' && $course_id > 0) {
            $redirect_in = '/checkout/?add-to-cart=' . $course_id;
        }
        if ($redirect_in === '') {
            $redirect_in = '/checkout/';
        }

        // Convert relative path cleanly to active site origin, or validate same-host URL strictly.
        if (strpos($redirect_in, '/') === 0 && strpos($redirect_in, '//') !== 0) {
            $candidate_url = home_url($redirect_in);
        } else {
            $candidate_url = wp_validate_redirect($redirect_in, home_url('/checkout/'));
        }
        $safe_redirect = wp_validate_redirect($candidate_url, home_url('/checkout/'));

        $code          = bin2hex(random_bytes(32));
        $transient_key = 'tsmb_wv_handoff_' . hash('sha256', $code);
        set_transient(
            $transient_key,
            [
                'user_id'     => $user_id,
                'redirect_to' => $safe_redirect,
                'created_at'  => time(),
            ],
            120
        );

        return rest_ensure_response([
            'status'     => 'success',
            'login_url'  => add_query_arg('tsmb_handoff', $code, home_url('/')),
            'expires_in' => 120,
        ]);
    }

    public static function revoke_token($request)
    {
        $user_id = get_current_user_id();
        if ($user_id <= 0) {
            return new WP_Error('rest_forbidden', __('Authentication required.', 'ts-mobile-bridge'), ['status' => 401]);
        }

        $params      = is_object($request) && method_exists($request, 'get_json_params') ? $request->get_json_params() : [];
        $all_devices = is_array($params) && !empty($params['all_devices']);
        if (!$all_devices && is_object($request) && method_exists($request, 'get_param')) {
            $all_devices = (bool) $request->get_param('all_devices');
        }

        if ($all_devices) {
            $new_ver = TSMB_Security::revoke_user_tokens($user_id);
            return rest_ensure_response([
                'status'        => 'success',
                'revoked'       => true,
                'scope'         => 'all_devices',
                'token_version' => $new_ver,
                'message'       => __('All active mobile sessions have been revoked.', 'ts-mobile-bridge'),
            ]);
        }

        $ctx        = TSMB_Security::get_current_token_context();
        $auth_hdr   = TSMB_Security::get_authorization_header_public();
        $bearer_jwt = (stripos($auth_hdr, 'Bearer ') === 0) ? trim(substr($auth_hdr, 7)) : '';
        $jti        = is_array($ctx) ? (string) ($ctx['jti'] ?? '') : '';
        $exp        = is_array($ctx) ? intval($ctx['exp'] ?? 0) : 0;

        TSMB_Security::revoke_single_token($jti, $bearer_jwt, $exp);

        return rest_ensure_response([
            'status'        => 'success',
            'revoked'       => true,
            'scope'         => 'current_session',
            'token_version' => TSMB_Security::get_user_token_version($user_id),
            'message'       => __('Current device session has been revoked.', 'ts-mobile-bridge'),
        ]);
    }

    public static function get_config()
    {
        $min_version    = get_option('tsmb_min_app_version', '1.0.0');
        $latest_version = get_option('tsmb_latest_app_version', '1.4.0');
        $maintenance    = (bool) get_option('tsmb_maintenance_mode', false);
        $banner_active  = (bool) get_option('tsmb_banner_active', false);
        $banner_text    = (string) get_option('tsmb_banner_text', '');
        $banner_link    = (string) get_option('tsmb_banner_link', '');

        $hero_slides = get_option('tsmb_hero_slides', []);
        if (!is_array($hero_slides)) {
            $hero_slides = [];
        }

        // Flash Sale: default OFF, fixed WP-timezone end date, automatically hidden after expiry.
        $wp_tz          = wp_timezone();
        $now_dt         = current_datetime();
        $now_ts         = $now_dt->getTimestamp();
        $flash_enabled  = (bool) get_option('tsmb_flash_active', false);
        $flash_title    = (string) get_option('tsmb_flash_title', '');
        $flash_code     = (string) get_option('tsmb_flash_code', '');
        $flash_discount = max(0, min(100, intval(get_option('tsmb_flash_discount', 0))));
        $flash_end_raw  = trim((string) get_option('tsmb_flash_end', ''));

        $end_timestamp = null;
        $flash_end_iso = null;
        if ($flash_end_raw !== '') {
            $end_dt = date_create_immutable($flash_end_raw, $wp_tz);
            if ($end_dt !== false) {
                $end_timestamp = $end_dt->getTimestamp();
                $flash_end_iso = $end_dt->format(DATE_ATOM);
            }
        }

        $flash_active = ($flash_enabled && $end_timestamp !== null && $end_timestamp > $now_ts);

        // Trending search keywords (empty array when unconfigured)
        $trending_raw = (string) get_option('tsmb_trending_keywords', '');
        $trending_keywords = array_values(array_filter(array_map('trim', explode(',', $trending_raw))));

        // Learner Support Contact Channels (empty defaults, no fabricated placeholders)
        $support_whatsapp = trim((string) get_option('tsmb_support_whatsapp', ''));
        $support_email    = trim((string) get_option('tsmb_support_email', ''));
        $support_helpline = trim((string) get_option('tsmb_support_helpline', ''));

        return rest_ensure_response([
            'status'          => 'success',
            'version_control' => [
                'min_required_version' => $min_version,
                'latest_version'       => $latest_version,
                'maintenance_mode'     => $maintenance,
            ],
            'checkout_policy' => [
                'mode'              => 'webview',
                'checkout_url'      => home_url('/checkout'),
                'sslcommerz_active' => true,
            ],
            'announcement_banner' => [
                'active'  => $banner_active && $banner_text !== '',
                'message' => $banner_text,
                'target'  => $banner_link,
            ],
            'hero_slides' => $hero_slides,
            'flash_sale'  => [
                'active'           => $flash_active,
                'title'            => $flash_active ? $flash_title : '',
                'coupon_code'      => $flash_active ? $flash_code : '',
                'discount_percent' => $flash_active ? $flash_discount : 0,
                'end_time'         => $flash_end_iso,
                'end_timestamp'    => $end_timestamp,
            ],
            'trending_keywords' => $trending_keywords,
            'support'           => [
                'whatsapp' => $support_whatsapp !== '' ? $support_whatsapp : null,
                'email'    => $support_email !== '' ? $support_email : null,
                'helpline' => $support_helpline !== '' ? $support_helpline : null,
            ],
            'server_time'      => wp_date('Y-m-d H:i:s', $now_ts, $wp_tz),
            'server_timestamp' => $now_ts,
        ]);
    }

    public static function get_feed($request)
    {
        $raw_limit = isset($request['limit']) ? intval($request['limit']) : self::DEFAULT_FEED_LIMIT;
        $limit     = max(1, min(self::MAX_FEED_LIMIT, $raw_limit));
        $page      = max(1, isset($request['page']) ? intval($request['page']) : 1);

        $cache_ver = intval(get_option('tsmb_feed_cache_ver', 1));
        $cache_key = 'tsmb_feed_v2_' . $cache_ver . '_' . md5(wp_json_encode([
            'limit' => $limit,
            'page'  => $page,
        ]));

        // Only administrators may bypass transient caching via ?nocache=1.
        $bypass_cache = !empty($request['nocache']) && current_user_can('manage_options');

        if (!$bypass_cache) {
            $cached = get_transient($cache_key);
            if ($cached !== false) {
                return rest_ensure_response($cached);
            }
        }

        $args = [
            'post_type'      => 'lp_course',
            'post_status'    => 'publish',
            'posts_per_page' => $limit,
            'paged'          => $page,
            'orderby'        => 'date',
            'order'          => 'DESC',
        ];

        $query = new WP_Query($args);
        $post_ids = [];
        if ($query->have_posts()) {
            foreach ($query->posts as $post_obj) {
                $post_ids[] = intval($post_obj->ID);
            }
        }

        $real_student_counts = self::fetch_real_student_counts($post_ids);
        $real_review_stats   = self::fetch_real_review_stats($post_ids);

        $courses = [];
        if ($query->have_posts()) {
            while ($query->have_posts()) {
                $query->the_post();
                $post_id = intval(get_the_ID());

                $price         = get_post_meta($post_id, '_lp_price', true);
                $regular_price = get_post_meta($post_id, '_lp_regular_price', true);
                $duration      = get_post_meta($post_id, '_lp_duration', true);
                $level         = get_post_meta($post_id, '_lp_level', true);

                $bdt_price    = is_numeric($price) ? floatval($price) : 0.0;
                $origin_price = is_numeric($regular_price) ? floatval($regular_price) : $bdt_price;

                $thumb_url = get_the_post_thumbnail_url($post_id, 'medium_large');
                if ($thumb_url) {
                    $thumb_url = set_url_scheme($thumb_url, 'https');
                } else {
                    $site_icon = get_site_icon_url(512);
                    $thumb_url = $site_icon ? set_url_scheme($site_icon, 'https') : null;
                }

                $author_id         = get_the_author_meta('ID');
                $instructor_name   = get_the_author_meta('display_name');
                $instructor_avatar = get_avatar_url($author_id, ['size' => 128]);
                $instructor_avatar = $instructor_avatar ? set_url_scheme($instructor_avatar, 'https') : null;

                $terms    = get_the_terms($post_id, 'course_category');
                $category = null;
                if (!empty($terms) && !is_wp_error($terms)) {
                    $first_term = $terms[0];
                    $category = [
                        'id'   => $first_term->term_id,
                        'name' => $first_term->name,
                        'slug' => $first_term->slug,
                    ];
                }

                $real_students = $real_student_counts[$post_id] ?? null;
                $review_meta   = $real_review_stats[$post_id] ?? null;

                $courses[] = [
                    'id'               => $post_id,
                    'title'            => wp_strip_all_tags(get_the_title()),
                    'excerpt'          => wp_trim_words(wp_strip_all_tags(get_the_excerpt()), 20, '...'),
                    'price_bdt'        => $bdt_price,
                    'origin_price_bdt' => $origin_price > $bdt_price ? $origin_price : null,
                    'is_free'          => ($bdt_price === 0.0),
                    'thumbnail'        => $thumb_url,
                    'duration'         => !empty($duration) ? $duration : 'Self-paced',
                    'level'            => !empty($level) ? $level : 'All Levels',
                    'students_count'   => ($real_students !== null && $real_students > 0) ? $real_students : null,
                    'rating'           => ($review_meta && $review_meta['rating'] > 0) ? $review_meta['rating'] : null,
                    'reviews_count'    => ($review_meta && $review_meta['count'] > 0) ? $review_meta['count'] : null,
                    'instructor'       => [
                        'name'   => !empty($instructor_name) ? $instructor_name : 'Thriving Skills Faculty',
                        'avatar' => $instructor_avatar,
                    ],
                    'category'         => $category,
                ];
            }
            wp_reset_postdata();
        }

        $total_items = intval($query->found_posts);
        $total_pages = max(1, intval($query->max_num_pages));

        $response = [
            'count'       => count($courses),
            'page'        => $page,
            'limit'       => $limit,
            'total'       => $total_items,
            'total_pages' => $total_pages,
            'courses'     => $courses,
        ];

        set_transient($cache_key, $response, 10 * MINUTE_IN_SECONDS);

        return rest_ensure_response($response);
    }

    public static function check_authenticated_user()
    {
        if (!is_user_logged_in() || get_current_user_id() <= 0) {
            return new WP_Error(
                'rest_not_logged_in',
                __('Authentication is required to access this resource.', 'ts-mobile-bridge'),
                ['status' => 401]
            );
        }

        return true;
    }

    public static function check_lesson_access($request)
    {
        $lesson_id  = absint($request['id']);
        $post       = get_post($lesson_id);
        $is_logged  = is_user_logged_in() && get_current_user_id() > 0;
        $is_admin   = $is_logged && current_user_can('manage_options');
        $is_preview = self::is_lesson_free_preview($lesson_id);

        if ($is_admin) {
            return true;
        }

        // Allow genuine LearnPress free-preview lessons for both guests and signed-in learners (rate-limited).
        if ($is_preview) {
            $rl_key = $is_logged ? (string) get_current_user_id() : TSMB_Security::get_client_ip();
            $rl = TSMB_Security::consume_rate_limit(
                'lesson_preview_access',
                $rl_key,
                60,
                MINUTE_IN_SECONDS
            );
            if (is_wp_error($rl)) {
                return $rl;
            }
            return true;
        }

        $auth_check = self::check_authenticated_user();
        if (is_wp_error($auth_check)) {
            return $auth_check;
        }

        $user_id = get_current_user_id();
        $rl = TSMB_Security::consume_rate_limit(
            'lesson_access_user',
            (string) $user_id,
            120,
            MINUTE_IN_SECONDS
        );
        if (is_wp_error($rl)) {
            return $rl;
        }

        // Return uniform 403 for missing, draft, private, or unenrolled lessons to prevent ID enumeration.
        if (!$post || $post->post_type !== 'lp_lesson' || $post->post_status !== 'publish') {
            return new WP_Error(
                'tsmb_lesson_forbidden',
                __('You must be enrolled in this course to access this lesson.', 'ts-mobile-bridge'),
                ['status' => 403]
            );
        }

        if (!self::is_user_enrolled_in_any_lesson_course($user_id, $lesson_id)) {
            return new WP_Error(
                'tsmb_not_enrolled',
                __('You must be enrolled in this course to access this lesson.', 'ts-mobile-bridge'),
                ['status' => 403]
            );
        }

        return true;
    }

    public static function get_lesson_detail($request)
    {
        $lesson_id  = absint($request['id']);
        $post       = get_post($lesson_id);
        $is_logged  = is_user_logged_in() && get_current_user_id() > 0;
        $is_admin   = $is_logged && current_user_can('manage_options');
        $is_preview = self::is_lesson_free_preview($lesson_id);

        if (!$is_admin && !$is_preview) {
            $auth_check = self::check_authenticated_user();
            if (is_wp_error($auth_check)) {
                return $auth_check;
            }
        }

        if (!$post || $post->post_type !== 'lp_lesson') {
            if ($is_admin) {
                return new WP_Error('not_found', __('Lesson not found', 'ts-mobile-bridge'), ['status' => 404]);
            }
            return new WP_Error(
                'tsmb_lesson_forbidden',
                __('You must be enrolled in this course to access this lesson.', 'ts-mobile-bridge'),
                ['status' => 403]
            );
        }

        if ($post->post_status !== 'publish' && !$is_admin) {
            return new WP_Error(
                'tsmb_lesson_forbidden',
                __('You must be enrolled in this course to access this lesson.', 'ts-mobile-bridge'),
                ['status' => 403]
            );
        }

        if (!$is_admin && !$is_preview && !self::is_user_enrolled_in_any_lesson_course(get_current_user_id(), $lesson_id)) {
            return new WP_Error(
                'tsmb_not_enrolled',
                __('You must be enrolled in this course to access this lesson.', 'ts-mobile-bridge'),
                ['status' => 403]
            );
        }

        $video_intro = get_post_meta($lesson_id, '_lp_lesson_video_intro', true);
        $video_url   = get_post_meta($lesson_id, 'video_url', true);
        $thim_video  = get_post_meta($lesson_id, '_thim_lesson_video', true);

        $parsed_video_url = '';
        $video_type       = 'none';
        $video_id         = null;

        $candidates = array_filter([
            is_string($video_url) ? trim($video_url) : '',
            is_string($video_intro) ? trim($video_intro) : '',
            is_string($thim_video) ? trim($thim_video) : '',
            is_string($post->post_content) ? $post->post_content : '',
        ]);

        foreach ($candidates as $candidate) {
            if (preg_match('/<(?:iframe|video|source)[^>]+src=["\']([^"\']+)["\']/i', $candidate, $matches)) {
                $parsed_video_url = html_entity_decode(trim($matches[1]), ENT_QUOTES, 'UTF-8');
                break;
            }
            $decoded_candidate = html_entity_decode(trim($candidate), ENT_QUOTES, 'UTF-8');
            if (strpos($decoded_candidate, '//') === 0) {
                $decoded_candidate = 'https:' . $decoded_candidate;
            }
            if (filter_var($decoded_candidate, FILTER_VALIDATE_URL)) {
                $parsed_video_url = $decoded_candidate;
                break;
            }
            if (preg_match('/(https?:\/\/[^\s"\'<>]*(?:vimeo\.com|youtube\.com|youtu\.be|[^\s"\'<>]+\.(?:mp4|m3u8|webm))[^\s"\'<>]*)/i', $decoded_candidate, $url_matches)) {
                $parsed_video_url = trim($url_matches[1]);
                break;
            }
        }

        if (strpos($parsed_video_url, '//') === 0) {
            $parsed_video_url = 'https:' . $parsed_video_url;
        }

        if (!empty($parsed_video_url)) {
            if (strpos($parsed_video_url, 'vimeo.com') !== false) {
                if (preg_match('/(?:player\.vimeo\.com\/video\/|vimeo\.com\/(?:channels\/[^\/]+\/|groups\/[^\/]+\/videos\/|album\/\d+\/video\/|video\/)?)(\d+)/i', $parsed_video_url, $id_matches)) {
                    $video_type = 'vimeo';
                    $video_id   = $id_matches[1];
                } else {
                    $parsed_video_url = '';
                }
            } elseif (strpos($parsed_video_url, 'youtube.com') !== false || strpos($parsed_video_url, 'youtu.be') !== false) {
                if (preg_match('/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|shorts\/|live\/|watch\?(?:[^#]*&)?v=))([\w-]{11})/i', $parsed_video_url, $yt_matches)) {
                    $video_type = 'youtube';
                    $video_id   = $yt_matches[1];
                } else {
                    $parsed_video_url = '';
                }
            } elseif (preg_match('/\.(mp4|m3u8|mpd|webm)($|\?)/i', $parsed_video_url)) {
                $video_type = 'mp4';
            } else {
                $video_type = 'iframe';
            }
        }

        $raw_duration = get_post_meta($lesson_id, '_lp_duration', true);

        return rest_ensure_response([
            'id'          => $lesson_id,
            'title'       => wp_strip_all_tags($post->post_title),
            'content'     => wp_strip_all_tags($post->post_content),
            'summary'     => wp_strip_all_tags($post->post_excerpt ?: ''),
            'raw_content' => $post->post_content,
            'video_intro' => !empty($video_intro) ? (string) $video_intro : null,
            'video_url'   => $parsed_video_url ? set_url_scheme($parsed_video_url, 'https') : null,
            'video_id'    => $video_id,
            'video_type'  => $video_type,
            'duration'    => !empty($raw_duration) ? wp_strip_all_tags((string) $raw_duration) : '',
        ]);
    }

    public static function get_user_enrollments($request)
    {
        $user_id             = get_current_user_id();
        $course_id           = isset($request['course_id']) ? absint($request['course_id']) : 0;
        $order_id            = isset($request['order_id']) ? absint($request['order_id']) : 0;
        $order_key           = isset($request['order_key']) ? sanitize_text_field((string) $request['order_key']) : '';
        $enrolled_course_ids = self::get_user_enrolled_course_ids($user_id);

        $is_enrolled = false;
        if ($course_id > 0) {
            $is_enrolled = self::is_user_enrolled_in_course($user_id, $course_id);
            if ($is_enrolled && !in_array($course_id, $enrolled_course_ids, true)) {
                $enrolled_course_ids[] = $course_id;
            }
        }

        $order_status      = null;
        $payment_confirmed = false;
        if ($order_id > 0 && function_exists('wc_get_order')) {
            $order = wc_get_order($order_id);
            if ($order) {
                $order_user_id = intval($order->get_user_id());
                $valid_key     = ($order_key === '' || hash_equals((string) $order->get_order_key(), $order_key));
                if ($order_user_id === $user_id && $valid_key) {
                    $order_status      = sanitize_key((string) $order->get_status());
                    $payment_confirmed = ($order->is_paid() || in_array($order_status, ['completed', 'processing'], true));
                }
            }
        }

        return rest_ensure_response([
            'status'              => 'success',
            'user_id'             => $user_id,
            'course_id'           => $course_id > 0 ? $course_id : null,
            'enrolled'            => $is_enrolled,
            'enrolled_course_ids' => array_values(array_unique(array_map('intval', $enrolled_course_ids))),
            'order_id'            => $order_id > 0 ? $order_id : null,
            'order_status'        => $order_status,
            'payment_confirmed'   => $payment_confirmed,
        ]);
    }

    public static function guard_learnpress_paid_enroll($response, $handler, $request)
    {
        if (is_wp_error($response) || !is_object($request) || !method_exists($request, 'get_route')) {
            return $response;
        }

        if ($request->get_route() !== '/learnpress/v1/courses/enroll') {
            return $response;
        }

        if (!is_user_logged_in()) {
            return new WP_Error(
                'rest_not_logged_in',
                __('Authentication is required to enroll in a course.', 'ts-mobile-bridge'),
                ['status' => 401]
            );
        }

        if (current_user_can('manage_options')) {
            return $response;
        }

        $course_id = absint($request->get_param('id'));
        $user_id   = get_current_user_id();
        if ($course_id > 0 && !self::can_user_enroll_paid_course($user_id, $course_id)) {
            return new WP_Error(
                'tsmb_payment_required',
                __('Payment is required before enrolling in this paid course.', 'ts-mobile-bridge'),
                ['status' => 403]
            );
        }

        return $response;
    }

    public static function filter_learnpress_can_enroll_course($can_enroll, $user_or_course, $course_or_user = 0)
    {
        if (!$can_enroll) {
            return $can_enroll;
        }

        $uid = 0;
        $cid = 0;

        // LearnPress core passes ($enrollable, $this [LP_User], $course_id), while newer filters/addons may pass ($can_enroll, $course_id, $user_id).
        if (is_object($user_or_course)) {
            if (method_exists($user_or_course, 'get_id')) {
                $uid = absint($user_or_course->get_id());
            } elseif (isset($user_or_course->ID)) {
                $uid = absint($user_or_course->ID);
            }
            $cid = absint($course_or_user);
        } else {
            $arg2 = absint($user_or_course);
            $arg3 = absint($course_or_user);
            if ($arg2 > 0 && get_post_type($arg2) === 'lp_course') {
                $cid = $arg2;
                $uid = $arg3;
            } elseif ($arg3 > 0 && get_post_type($arg3) === 'lp_course') {
                $cid = $arg3;
                $uid = $arg2;
            } else {
                $cid = $arg2;
                $uid = $arg3;
            }
        }

        if ($uid <= 0) {
            $uid = get_current_user_id();
        }

        if ($uid > 0 && user_can($uid, 'manage_options')) {
            return $can_enroll;
        }

        if ($cid <= 0) {
            return $can_enroll;
        }

        return self::can_user_enroll_paid_course($uid, $cid) ? $can_enroll : false;
    }

    private static function is_lesson_free_preview(int $lesson_id): bool
    {
        if ($lesson_id <= 0) {
            return false;
        }

        $post = get_post($lesson_id);
        if (!$post || $post->post_type !== 'lp_lesson' || $post->post_status !== 'publish') {
            return false;
        }

        $preview_meta = get_post_meta($lesson_id, '_lp_preview', true);
        if (is_bool($preview_meta)) {
            $is_preview = $preview_meta;
        } else {
            $normalized = strtolower(trim((string) $preview_meta));
            $is_preview = in_array($normalized, ['yes', '1', 'true', 'on'], true);
        }

        if (!$is_preview) {
            return false;
        }

        return !empty(self::get_course_ids_for_lesson($lesson_id));
    }

    private static function has_user_paid_for_course(int $user_id, int $course_id): bool
    {
        if ($user_id <= 0 || $course_id <= 0) {
            return false;
        }

        if (isset(self::$user_paid_courses_cache[$user_id])) {
            return isset(self::$user_paid_courses_cache[$user_id][$course_id]);
        }

        $paid_courses = [];

        // Check completed LearnPress orders once per user per request.
        $lp_orders = get_posts([
            'post_type'      => 'lp_order',
            'post_status'    => 'lp-completed',
            'posts_per_page' => 50,
            'fields'         => 'ids',
            'meta_query'     => [
                [
                    'key'     => '_user_id',
                    'value'   => $user_id,
                    'compare' => '=',
                    'type'    => 'NUMERIC',
                ],
            ],
        ]);
        if (is_array($lp_orders) && function_exists('learn_press_get_order')) {
            foreach ($lp_orders as $lp_order_id) {
                $lp_order = learn_press_get_order($lp_order_id);
                if (!$lp_order || !method_exists($lp_order, 'get_items')) {
                    continue;
                }
                foreach ((array) $lp_order->get_items() as $item) {
                    $item_course_id = is_array($item) ? absint($item['course_id'] ?? 0) : 0;
                    if ($item_course_id > 0) {
                        $paid_courses[$item_course_id] = true;
                    }
                }
            }
        }

        // Check paid WooCommerce orders mapped directly to courses or via LearnPress product meta.
        if (function_exists('wc_get_orders')) {
            $wc_orders = wc_get_orders([
                'customer_id' => $user_id,
                'status'      => ['completed', 'processing'],
                'limit'       => 50,
                'orderby'     => 'date',
                'order'       => 'DESC',
            ]);
            if (is_array($wc_orders)) {
                foreach ($wc_orders as $wc_order) {
                    if (!$wc_order || !method_exists($wc_order, 'get_items')) {
                        continue;
                    }
                    $order_status = method_exists($wc_order, 'get_status')
                        ? sanitize_key((string) $wc_order->get_status())
                        : '';
                    $is_paid = (method_exists($wc_order, 'is_paid') && $wc_order->is_paid())
                        || in_array($order_status, ['completed', 'processing'], true);
                    if (!$is_paid) {
                        continue;
                    }

                    foreach ($wc_order->get_items() as $wc_item) {
                        $product_id = method_exists($wc_item, 'get_product_id') ? absint($wc_item->get_product_id()) : 0;
                        if ($product_id <= 0) {
                            continue;
                        }
                        $paid_courses[$product_id] = true;
                        foreach (['_learnpress_course', '_lp_course'] as $meta_key) {
                            $mapped = get_post_meta($product_id, $meta_key, true);
                            if (is_array($mapped)) {
                                foreach (array_map('absint', $mapped) as $mapped_id) {
                                    if ($mapped_id > 0) {
                                        $paid_courses[$mapped_id] = true;
                                    }
                                }
                            } elseif (absint($mapped) > 0) {
                                $paid_courses[absint($mapped)] = true;
                            }
                        }
                    }
                }
            }
        }

        self::$user_paid_courses_cache[$user_id] = $paid_courses;

        if (isset($paid_courses[$course_id])) {
            return true;
        }

        // Fallback single-course LearnPress check in case older LP setups track outside post queries.
        if (function_exists('learn_press_get_user')) {
            $lp_user = learn_press_get_user($user_id);
            if (
                $lp_user &&
                method_exists($lp_user, 'has_purchased_course') &&
                method_exists($lp_user, 'get_course_order') &&
                $lp_user->has_purchased_course($course_id)
            ) {
                $lp_order_id = $lp_user->get_course_order($course_id);
                if ($lp_order_id && function_exists('learn_press_get_order')) {
                    $lp_order = learn_press_get_order($lp_order_id);
                    if ($lp_order && method_exists($lp_order, 'has_status') && $lp_order->has_status('completed')) {
                        self::$user_paid_courses_cache[$user_id][$course_id] = true;
                        return true;
                    }
                }
            }
        }

        return false;
    }

    private static function can_user_enroll_paid_course(int $user_id, int $course_id): bool
    {
        if ($course_id <= 0 || get_post_status($course_id) !== 'publish') {
            return false;
        }

        $price = floatval(get_post_meta($course_id, '_lp_price', true));
        if ($price <= 0 && function_exists('learn_press_get_course')) {
            $lp_course = learn_press_get_course($course_id);
            if ($lp_course && method_exists($lp_course, 'get_price')) {
                $price = floatval($lp_course->get_price());
            }
        }

        if ($price <= 0) {
            return true;
        }

        if ($user_id <= 0) {
            return false;
        }

        return self::is_user_enrolled_in_course($user_id, $course_id)
            || self::has_user_paid_for_course($user_id, $course_id);
    }

    private static function get_course_ids_for_lesson(int $lesson_id): array
    {
        global $wpdb;

        if ($lesson_id <= 0) {
            return [];
        }

        $items_table    = $wpdb->prefix . 'learnpress_section_items';
        $sections_table = $wpdb->prefix . 'learnpress_sections';

        if (
            $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $items_table)) !== $items_table ||
            $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $sections_table)) !== $sections_table
        ) {
            return [];
        }

        $rows = $wpdb->get_col(
            $wpdb->prepare(
                "SELECT DISTINCT s.section_course_id
                 FROM {$items_table} si
                 INNER JOIN {$sections_table} s ON s.section_id = si.section_id
                 INNER JOIN {$wpdb->posts} p ON p.ID = s.section_course_id
                 WHERE si.item_id = %d
                   AND si.item_type = 'lp_lesson'
                   AND p.post_type = 'lp_course'
                   AND p.post_status = 'publish'",
                $lesson_id
            )
        );

        return is_array($rows) ? array_values(array_unique(array_filter(array_map('intval', $rows)))) : [];
    }

    private static function get_user_enrolled_course_ids(int $user_id): array
    {
        global $wpdb;

        if ($user_id <= 0) {
            return [];
        }

        $lp_table = $wpdb->prefix . 'learnpress_user_items';
        if ($wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $lp_table)) !== $lp_table) {
            return [];
        }

        $rows = $wpdb->get_col(
            $wpdb->prepare(
                "SELECT ui.item_id
                 FROM {$lp_table} ui
                 INNER JOIN (
                     SELECT item_id, MAX(user_item_id) AS latest_id
                     FROM {$lp_table}
                     WHERE user_id = %d
                       AND item_type = 'lp_course'
                     GROUP BY item_id
                 ) latest ON latest.latest_id = ui.user_item_id
                 INNER JOIN {$wpdb->posts} p ON p.ID = ui.item_id
                 WHERE p.post_type = 'lp_course'
                   AND p.post_status = 'publish'
                   AND ui.status IN ('enrolled', 'finished', 'purchased')",
                $user_id
            )
        );

        return is_array($rows) ? array_values(array_unique(array_filter(array_map('intval', $rows)))) : [];
    }

    private static function is_user_enrolled_in_course(int $user_id, int $course_id): bool
    {
        if ($user_id <= 0 || $course_id <= 0) {
            return false;
        }

        $course_post = get_post($course_id);
        if (!$course_post || $course_post->post_type !== 'lp_course' || $course_post->post_status !== 'publish') {
            return false;
        }

        if (function_exists('learn_press_get_user')) {
            $lp_user = learn_press_get_user($user_id);
            if (
                $lp_user &&
                method_exists($lp_user, 'has_enrolled_or_finished') &&
                $lp_user->has_enrolled_or_finished($course_id)
            ) {
                return true;
            }
        }

        return in_array($course_id, self::get_user_enrolled_course_ids($user_id), true);
    }

    private static function is_user_enrolled_in_any_lesson_course(int $user_id, int $lesson_id): bool
    {
        $course_ids = self::get_course_ids_for_lesson($lesson_id);
        foreach ($course_ids as $course_id) {
            if (self::is_user_enrolled_in_course($user_id, intval($course_id))) {
                return true;
            }
        }

        return false;
    }

    public static function register_user($request)
    {
        if (!get_option('users_can_register')) {
            return new WP_Error(
                'registration_disabled',
                __('User registration is currently disabled on this site.', 'ts-mobile-bridge'),
                ['status' => 403]
            );
        }

        $client_ip = TSMB_Security::get_client_ip();
        $ip_limit  = TSMB_Security::consume_rate_limit('register_ip', $client_ip, 5, 15 * MINUTE_IN_SECONDS);
        if (is_wp_error($ip_limit)) {
            return $ip_limit;
        }

        $params   = $request->get_json_params();
        if (!is_array($params)) {
            $params = [];
        }

        $email    = strtolower(sanitize_email($params['email'] ?? ''));
        $password = (string) ($params['password'] ?? '');
        $phone    = sanitize_text_field($params['phone'] ?? ($params['billing_phone'] ?? ''));
        $name     = sanitize_text_field($params['name'] ?? ($params['display_name'] ?? ''));
        $req_user = sanitize_user($params['username'] ?? '', true);

        if (empty($email) || !is_email($email)) {
            return new WP_Error(
                'registration-error-invalid-email',
                __('Please provide a valid email address.', 'ts-mobile-bridge'),
                ['status' => 400]
            );
        }

        $email_limit = TSMB_Security::consume_rate_limit('register_email', $email, 3, 15 * MINUTE_IN_SECONDS);
        if (is_wp_error($email_limit)) {
            return $email_limit;
        }

        if (strlen($password) < self::MIN_PASSWORD_LENGTH) {
            return new WP_Error(
                'registration-error-weak-password',
                sprintf(
                    __('Password must be at least %d characters long.', 'ts-mobile-bridge'),
                    self::MIN_PASSWORD_LENGTH
                ),
                ['status' => 400]
            );
        }

        // Perform equivalent work before existence check to avoid timing side-channels.
        $password_hash = wp_hash_password($password);
        $otp           = TSMB_Security::generate_numeric_otp(6);
        $otp_hash      = wp_hash_password($otp);

        $email_already_registered = (bool) email_exists($email);

        $username_data = TSMB_Security::resolve_registration_username($req_user, $email);
        $username      = $username_data['username'];
        $is_suggested  = $username_data['is_suggested'];
        $mail_sent     = false;
        $timing_start  = microtime(true);

        if (!$email_already_registered) {
            $name_parts = preg_split('/\s+/', trim($name));
            $first_name = sanitize_text_field($params['first_name'] ?? ($name_parts[0] ?? ''));
            $last_name  = sanitize_text_field(
                $params['last_name'] ?? (isset($name_parts[1]) ? implode(' ', array_slice($name_parts, 1)) : '')
            );

            $pending_key = 'tsmb_reg_otp_' . hash('sha256', $email);
            set_transient(
                $pending_key,
                [
                    'email'              => $email,
                    'username'           => $username,
                    'username_suggested' => $is_suggested,
                    'password_hash'      => $password_hash,
                    'name'               => $name,
                    'first_name'         => $first_name,
                    'last_name'          => $last_name,
                    'phone'              => $phone,
                    'otp_hash'           => $otp_hash,
                    'attempts'           => 0,
                    'created_at'         => time(),
                ],
                15 * MINUTE_IN_SECONDS
            );

            $subject = __('Verify your Thriving Skills account', 'ts-mobile-bridge');
            $body    = sprintf(
                __("Your 6-digit Thriving Skills verification code is: %s\n\nThis code expires in 15 minutes. If you did not request this registration, you can safely ignore this email.", 'ts-mobile-bridge'),
                $otp
            );

            $mail_begin = microtime(true);
            $mail_sent = wp_mail($email, $subject, $body);
            $mail_elapsed = microtime(true) - $mail_begin;
            if (!$mail_sent) {
                $err_msg = TSMB_Security::get_last_mail_error() ?: 'wp_mail returned false (SMTP/PHPMailer delivery failure)';
                error_log(sprintf('[TSMB Registration] Failed to send OTP email to %s: %s', $email, $err_msg));
            }
            TSMB_Security::pad_mail_timing($timing_start, true, $mail_elapsed);
        } else {
            TSMB_Security::pad_mail_timing($timing_start, false);
        }

        // Identical response for existing and non-existing emails to prevent email enumeration.
        $response = [
            'status'                => 'verification_required',
            'requires_verification' => true,
            'code'                  => 200,
            'message'               => __('If this email address is eligible, a 6-digit verification code has been sent. Please enter the code to activate your account.', 'ts-mobile-bridge'),
            'expires_in'            => 900,
            'username'              => $username,
            'username_suggested'    => $is_suggested,
        ];

        if (TSMB_Security::is_dev_environment() && !$email_already_registered) {
            $response['dev_verification_otp'] = $otp;
            $response['mail_sent']             = $mail_sent;
            if (!$mail_sent) {
                $response['mail_error'] = TSMB_Security::get_last_mail_error() ?: 'wp_mail failed. Please configure SMTP credentials.';
            }
        }

        return rest_ensure_response($response);
    }

    public static function verify_registration($request)
    {
        global $wpdb;

        if (!get_option('users_can_register')) {
            return new WP_Error(
                'registration_disabled',
                __('User registration is currently disabled on this site.', 'ts-mobile-bridge'),
                ['status' => 403]
            );
        }

        $client_ip = TSMB_Security::get_client_ip();
        $ip_limit  = TSMB_Security::consume_rate_limit('verify_reg_ip', $client_ip, 10, 15 * MINUTE_IN_SECONDS);
        if (is_wp_error($ip_limit)) {
            return $ip_limit;
        }

        $params = $request->get_json_params();
        if (!is_array($params)) {
            $params = [];
        }

        $email = strtolower(sanitize_email($params['email'] ?? ''));
        $otp   = trim(sanitize_text_field($params['otp'] ?? ''));

        if (empty($email) || !is_email($email) || !preg_match('/^\d{6}$/', $otp)) {
            return new WP_Error(
                'invalid_verification_request',
                __('Please provide a valid email address and 6-digit verification code.', 'ts-mobile-bridge'),
                ['status' => 400]
            );
        }

        $email_limit = TSMB_Security::consume_rate_limit('verify_reg_email', $email, 5, 15 * MINUTE_IN_SECONDS);
        if (is_wp_error($email_limit)) {
            return $email_limit;
        }

        $pending_key = 'tsmb_reg_otp_' . hash('sha256', $email);
        $record      = get_transient($pending_key);

        if (!is_array($record) || empty($record['otp_hash']) || email_exists($email)) {
            return new WP_Error(
                'verification_failed',
                __('The verification code is invalid or has expired.', 'ts-mobile-bridge'),
                ['status' => 400]
            );
        }

        $attempts = intval($record['attempts'] ?? 0) + 1;
        if ($attempts > 5) {
            delete_transient($pending_key);
            return new WP_Error(
                'too_many_verification_attempts',
                __('Maximum verification attempts exceeded. Please request a new verification code.', 'ts-mobile-bridge'),
                ['status' => 429]
            );
        }

        if (!wp_check_password($otp, (string) $record['otp_hash'])) {
            $record['attempts'] = $attempts;
            set_transient($pending_key, $record, 15 * MINUTE_IN_SECONDS);
            return new WP_Error(
                'verification_failed',
                __('The verification code is invalid or has expired.', 'ts-mobile-bridge'),
                ['status' => 400]
            );
        }

        delete_transient($pending_key);

        // Retain the exact validated username resolved during registration; do not double-suffix.
        $saved_username = sanitize_user((string) ($record['username'] ?? ''), true);
        if (empty($saved_username) || username_exists($saved_username)) {
            // Fallback only if the chosen username was registered in the interim
            $clean_seed = !empty($saved_username) ? $saved_username : 'student';
            $username   = TSMB_Security::generate_secure_username($clean_seed);
        } else {
            $username = $saved_username;
        }

        $display  = !empty($record['name']) ? (string) $record['name'] : $username;

        $user_id = wp_insert_user([
            'user_login'   => $username,
            'user_pass'    => wp_generate_password(24, true, true),
            'user_email'   => $email,
            'display_name' => $display,
            'first_name'   => (string) ($record['first_name'] ?? ''),
            'last_name'    => (string) ($record['last_name'] ?? ''),
            'role'         => 'subscriber',
        ]);

        if (is_wp_error($user_id)) {
            return new WP_Error(
                'registration_failed',
                __('Unable to activate account. Please try again later.', 'ts-mobile-bridge'),
                ['status' => 400]
            );
        }

        // Enforce subscriber role explicitly and restore pre-hashed password cleanly.
        $wp_user = new WP_User($user_id);
        $wp_user->set_role('subscriber');

        if (!empty($record['password_hash'])) {
            $wpdb->update(
                $wpdb->users,
                ['user_pass' => (string) $record['password_hash']],
                ['ID' => $user_id],
                ['%s'],
                ['%d']
            );
            clean_user_cache($user_id);
        }

        $phone = sanitize_text_field((string) ($record['phone'] ?? ''));
        if ($phone !== '') {
            update_user_meta($user_id, 'phone', $phone);
            update_user_meta($user_id, 'phone_number', $phone);
            update_user_meta($user_id, 'billing_phone', $phone);
            update_user_meta($user_id, '_lp_phone', $phone);
        }

        $token = TSMB_Security::issue_bearer_token($user_id);

        return rest_ensure_response([
            'status'            => 'success',
            'code'              => 200,
            'message'           => __('Email verified! Your account is now active.', 'ts-mobile-bridge'),
            'user_id'           => $user_id,
            'username'          => $username,
            'email'             => $email,
            'user_display_name' => $display,
            'token'             => $token,
        ]);
    }

    public static function resend_registration($request)
    {
        $client_ip = TSMB_Security::get_client_ip();
        $ip_limit  = TSMB_Security::consume_rate_limit('resend_reg_ip', $client_ip, 5, 15 * MINUTE_IN_SECONDS);
        if (is_wp_error($ip_limit)) {
            return $ip_limit;
        }

        $params = $request->get_json_params();
        if (!is_array($params)) {
            $params = [];
        }

        $email = strtolower(sanitize_email($params['email'] ?? ''));
        if (empty($email) || !is_email($email)) {
            return new WP_Error(
                'invalid_email',
                __('Please provide a valid email address.', 'ts-mobile-bridge'),
                ['status' => 400]
            );
        }

        $email_limit = TSMB_Security::consume_rate_limit('resend_reg_email', $email, 3, 15 * MINUTE_IN_SECONDS);
        if (is_wp_error($email_limit)) {
            return $email_limit;
        }

        $pending_key  = 'tsmb_reg_otp_' . hash('sha256', $email);
        $record       = get_transient($pending_key);
        $timing_start = microtime(true);

        if (!is_array($record) || empty($record['email']) || email_exists($email)) {
            TSMB_Security::pad_mail_timing($timing_start, false);
            return new WP_Error(
                'no_pending_registration',
                __('No pending registration found for this email address or the code has expired. Please register again.', 'ts-mobile-bridge'),
                ['status' => 400]
            );
        }

        // Generate fresh OTP
        $otp      = TSMB_Security::generate_numeric_otp(6);
        $otp_hash = wp_hash_password($otp);

        $record['otp_hash'] = $otp_hash;
        $record['attempts'] = 0; // Reset attempts for new code
        set_transient($pending_key, $record, 15 * MINUTE_IN_SECONDS);

        $subject = __('Verify your Thriving Skills account (Resend)', 'ts-mobile-bridge');
        $body    = sprintf(
            __("Your new 6-digit Thriving Skills verification code is: %s\n\nThis code expires in 15 minutes. If you did not request this, you can safely ignore this email.", 'ts-mobile-bridge'),
            $otp
        );

        $mail_begin   = microtime(true);
        $mail_sent    = wp_mail($email, $subject, $body);
        $mail_elapsed = microtime(true) - $mail_begin;
        if (!$mail_sent) {
            $err_msg = TSMB_Security::get_last_mail_error() ?: 'wp_mail returned false (SMTP/PHPMailer delivery failure)';
            error_log(sprintf('[TSMB Registration Resend] Failed to deliver OTP email to %s: %s', $email, $err_msg));
        }
        TSMB_Security::pad_mail_timing($timing_start, true, $mail_elapsed);

        $response = [
            'status'     => 'success',
            'code'       => 200,
            'message'    => __('A new verification code has been sent to your email.', 'ts-mobile-bridge'),
            'expires_in' => 900,
        ];

        if (TSMB_Security::is_dev_environment()) {
            $response['dev_verification_otp'] = $otp;
            $response['mail_sent']             = $mail_sent;
            if (!$mail_sent) {
                $response['mail_error'] = TSMB_Security::get_last_mail_error() ?: 'wp_mail failed. Please configure SMTP credentials.';
            }
        }

        return rest_ensure_response($response);
    }

    public static function confirm_password_reset($request)
    {
        $client_ip = TSMB_Security::get_client_ip();
        $ip_limit  = TSMB_Security::consume_rate_limit('reset_confirm_ip', $client_ip, 10, 15 * MINUTE_IN_SECONDS);
        if (is_wp_error($ip_limit)) {
            return $ip_limit;
        }

        $params = $request->get_json_params();
        if (!is_array($params)) {
            $params = [];
        }

        $raw_login    = sanitize_text_field((string) ($params['login'] ?? ($request->get_param('login') ?? '')));
        $key          = sanitize_text_field((string) ($params['key'] ?? ($request->get_param('key') ?? '')));
        $new_password = (string) ($params['password'] ?? ($request->get_param('password') ?? ''));

        if ($raw_login === '' || $key === '') {
            return new WP_Error(
                'invalid_reset_request',
                __('Username and password reset key are required.', 'ts-mobile-bridge'),
                ['status' => 400]
            );
        }

        $login_limit = TSMB_Security::consume_rate_limit(
            'reset_confirm_login',
            strtolower($raw_login),
            5,
            15 * MINUTE_IN_SECONDS
        );
        if (is_wp_error($login_limit)) {
            return $login_limit;
        }

        if (strlen($new_password) < self::MIN_PASSWORD_LENGTH) {
            return new WP_Error(
                'weak_password',
                sprintf(
                    __('Password must be at least %d characters long.', 'ts-mobile-bridge'),
                    self::MIN_PASSWORD_LENGTH
                ),
                ['status' => 400]
            );
        }

        $target_login = $raw_login;
        $user_obj     = get_user_by('login', $raw_login);
        if (!$user_obj && is_email($raw_login)) {
            $user_obj = get_user_by('email', $raw_login);
        }
        if ($user_obj instanceof WP_User) {
            $target_login = $user_obj->user_login;
        }

        $checked_user = check_password_reset_key($key, $target_login);
        if (is_wp_error($checked_user) || !($checked_user instanceof WP_User)) {
            return new WP_Error(
                'invalid_reset_key',
                __('This password reset link is invalid or has expired. Please request a new link.', 'ts-mobile-bridge'),
                ['status' => 400]
            );
        }

        reset_password($checked_user, $new_password);

        return rest_ensure_response([
            'status'  => 'success',
            'code'    => 200,
            'message' => __('Password has been reset successfully.', 'ts-mobile-bridge'),
        ]);
    }

    public static function clear_feed_cache(): void
    {
        $current_ver = intval(get_option('tsmb_feed_cache_ver', 1));
        update_option('tsmb_feed_cache_ver', $current_ver + 1, false);
        delete_transient('tsmb_mobile_feed_v1');
    }

    private static function fetch_real_student_counts(array $post_ids): array
    {
        global $wpdb;

        $counts = [];
        if (empty($post_ids)) {
            return $counts;
        }

        $lp_table = $wpdb->prefix . 'learnpress_user_items';
        $has_lp_table = ($wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $lp_table)) === $lp_table);

        if ($has_lp_table) {
            $placeholders = implode(',', array_fill(0, count($post_ids), '%d'));
            $sql = "SELECT item_id, COUNT(DISTINCT user_id) AS total_students
                    FROM {$lp_table}
                    WHERE item_type = 'lp_course'
                      AND status IN ('enrolled', 'finished', 'purchased')
                      AND item_id IN ({$placeholders})
                    GROUP BY item_id";
            $rows = $wpdb->get_results($wpdb->prepare($sql, ...$post_ids), ARRAY_A);
            if (is_array($rows)) {
                foreach ($rows as $row) {
                    $cid = intval($row['item_id']);
                    $cnt = intval($row['total_students']);
                    if ($cnt > 0) {
                        $counts[$cid] = $cnt;
                    }
                }
            }
        }

        // Check real _lp_students meta only where positive (never use _lp_fake_students or arbitrary fallbacks).
        foreach ($post_ids as $cid) {
            if (!isset($counts[$cid])) {
                $meta_students = get_post_meta($cid, '_lp_students', true);
                if (is_numeric($meta_students) && intval($meta_students) > 0) {
                    $counts[$cid] = intval($meta_students);
                }
            }
        }

        return $counts;
    }

    private static function fetch_real_review_stats(array $post_ids): array
    {
        global $wpdb;

        $stats = [];
        if (empty($post_ids)) {
            return $stats;
        }

        $placeholders = implode(',', array_fill(0, count($post_ids), '%d'));
        $sql = "SELECT c.comment_post_ID AS course_id,
                       AVG(CAST(cm.meta_value AS DECIMAL(4,2))) AS avg_rating,
                       COUNT(DISTINCT c.comment_ID) AS review_count
                FROM {$wpdb->comments} c
                INNER JOIN {$wpdb->commentmeta} cm
                    ON cm.comment_id = c.comment_ID AND cm.meta_key = '_lpr_rating'
                WHERE c.comment_approved = '1'
                  AND c.comment_type = 'review'
                  AND c.comment_post_ID IN ({$placeholders})
                  AND CAST(cm.meta_value AS DECIMAL(4,2)) > 0
                GROUP BY c.comment_post_ID";
        $rows = $wpdb->get_results($wpdb->prepare($sql, ...$post_ids), ARRAY_A);

        if (is_array($rows)) {
            foreach ($rows as $row) {
                $cid = intval($row['course_id']);
                $avg = round(floatval($row['avg_rating']), 1);
                $cnt = intval($row['review_count']);
                if ($avg > 0 && $cnt > 0) {
                    $stats[$cid] = [
                        'rating' => min(5.0, max(1.0, $avg)),
                        'count'  => $cnt,
                    ];
                }
            }
        }

        if (function_exists('learn_press_get_course_rate')) {
            foreach ($post_ids as $cid) {
                if (!isset($stats[$cid])) {
                    $lp_rate = learn_press_get_course_rate($cid, false);
                    if (is_array($lp_rate) && !empty($lp_rate['rated']) && floatval($lp_rate['rated']) > 0) {
                        $stats[$cid] = [
                            'rating' => round(floatval($lp_rate['rated']), 1),
                            'count'  => max(0, intval($lp_rate['total'] ?? 0)),
                        ];
                    }
                }
            }
        }

        return $stats;
    }

    private static function get_course_curriculum_item_ids(int $course_id): array
    {
        global $wpdb;

        if ($course_id <= 0) {
            return [];
        }

        $items_table    = $wpdb->prefix . 'learnpress_section_items';
        $sections_table = $wpdb->prefix . 'learnpress_sections';

        $rows = [];
        if (
            $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $sections_table)) === $sections_table &&
            $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $items_table)) === $items_table
        ) {
            $rows = $wpdb->get_col(
                $wpdb->prepare(
                    "SELECT DISTINCT si.item_id
                     FROM {$items_table} si
                     INNER JOIN {$sections_table} s ON s.section_id = si.section_id
                     INNER JOIN {$wpdb->posts} p ON p.ID = si.item_id
                     WHERE s.section_course_id = %d
                       AND si.item_type IN ('lp_lesson', 'lp_quiz')
                       AND p.post_status = 'publish'",
                    $course_id
                )
            );
        }

        $ids = is_array($rows) ? array_values(array_unique(array_filter(array_map('intval', $rows)))) : [];
        return apply_filters('tsmb_course_curriculum_items', $ids, $course_id);
    }

    private static function get_user_course_item_state(int $user_id, int $course_id): ?array
    {
        global $wpdb;

        if ($user_id <= 0 || $course_id <= 0) {
            return null;
        }

        $lp_table = $wpdb->prefix . 'learnpress_user_items';
        if ($wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $lp_table)) === $lp_table) {
            $rows = $wpdb->get_results(
                $wpdb->prepare(
                    "SELECT user_item_id, item_id, status, graduation, start_time, end_time
                     FROM {$lp_table}
                     WHERE user_id = %d
                       AND item_id = %d
                       AND item_type = 'lp_course'
                     ORDER BY user_item_id DESC
                     LIMIT 1",
                    $user_id,
                    $course_id
                ),
                ARRAY_A
            );
            if (is_array($rows) && !empty($rows[0])) {
                return $rows[0];
            }
        }

        $filtered = apply_filters('tsmb_user_course_item_state', null, $user_id, $course_id);
        if (is_array($filtered)) {
            return $filtered;
        }

        if (function_exists('learn_press_get_user')) {
            $lp_user = learn_press_get_user($user_id);
            if ($lp_user && method_exists($lp_user, 'get_course_data')) {
                $course_data = $lp_user->get_course_data($course_id);
                if ($course_data && method_exists($course_data, 'get_status')) {
                    return [
                        'user_item_id' => method_exists($course_data, 'get_user_item_id') ? intval($course_data->get_user_item_id()) : 0,
                        'item_id'      => $course_id,
                        'status'       => (string) $course_data->get_status(),
                        'graduation'   => method_exists($course_data, 'get_graduation') ? (string) $course_data->get_graduation() : '',
                        'start_time'   => '',
                        'end_time'     => '',
                    ];
                }
            }
        }

        return null;
    }

    private static function get_user_completed_lesson_ids(int $user_id, int $course_id, int $course_user_item_id = 0): array
    {
        global $wpdb;

        if ($user_id <= 0 || $course_id <= 0) {
            return [];
        }

        $lp_table       = $wpdb->prefix . 'learnpress_user_items';
        $items_table    = $wpdb->prefix . 'learnpress_section_items';
        $sections_table = $wpdb->prefix . 'learnpress_sections';

        $completed = [];
        if ($wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $lp_table)) === $lp_table) {
            if ($course_user_item_id > 0) {
                $rows = $wpdb->get_col(
                    $wpdb->prepare(
                        "SELECT DISTINCT item_id
                         FROM {$lp_table}
                         WHERE user_id = %d
                           AND parent_id = %d
                           AND item_type IN ('lp_lesson', 'lp_quiz')
                           AND status = 'completed'",
                        $user_id,
                        $course_user_item_id
                    )
                );
                if (is_array($rows)) {
                    $completed = array_merge($completed, array_map('intval', $rows));
                }
            }

            if (
                empty($completed) &&
                $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $sections_table)) === $sections_table &&
                $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $items_table)) === $items_table
            ) {
                $rows = $wpdb->get_col(
                    $wpdb->prepare(
                        "SELECT DISTINCT ui.item_id
                         FROM {$lp_table} ui
                         INNER JOIN {$items_table} si ON si.item_id = ui.item_id
                         INNER JOIN {$sections_table} s ON s.section_id = si.section_id
                         WHERE ui.user_id = %d
                           AND s.section_course_id = %d
                           AND ui.item_type IN ('lp_lesson', 'lp_quiz')
                           AND ui.status = 'completed'",
                        $user_id,
                        $course_id
                    )
                );
                if (is_array($rows)) {
                    $completed = array_merge($completed, array_map('intval', $rows));
                }
            }
        }

        $completed = array_values(array_unique(array_filter(array_map('intval', $completed))));
        return apply_filters('tsmb_user_completed_lesson_ids', $completed, $user_id, $course_id);
    }

    private static function verify_and_finalize_course_completion(int $user_id, int $course_id): array
    {
        global $wpdb;

        if (!self::is_user_enrolled_in_course($user_id, $course_id)) {
            return [
                'enrolled'             => false,
                'completed'            => false,
                'status'               => '',
                'graduation'           => '',
                'completed_date'       => '',
                'enrolled_date'        => '',
                'completed_lesson_ids' => [],
            ];
        }

        $state          = self::get_user_course_item_state($user_id, $course_id);
        $user_item_id   = is_array($state) ? intval($state['user_item_id'] ?? 0) : 0;
        $status         = is_array($state) ? strtolower((string) ($state['status'] ?? 'enrolled')) : 'enrolled';
        $graduation     = is_array($state) ? strtolower((string) ($state['graduation'] ?? '')) : '';
        $completed_ids  = self::get_user_completed_lesson_ids($user_id, $course_id, $user_item_id);
        $curriculum_ids = self::get_course_curriculum_item_ids($course_id);

        $is_completed = ($status === 'finished' && $graduation !== 'failed');

        if (!$is_completed && !empty($curriculum_ids)) {
            $missing = array_diff($curriculum_ids, $completed_ids);
            if (empty($missing)) {
                if (function_exists('learn_press_get_user')) {
                    $lp_user = learn_press_get_user($user_id);
                    if ($lp_user && method_exists($lp_user, 'finish_course')) {
                        try {
                            $lp_user->finish_course($course_id);
                            $state = self::get_user_course_item_state($user_id, $course_id);
                            if (is_array($state)) {
                                $status     = strtolower((string) ($state['status'] ?? $status));
                                $graduation = strtolower((string) ($state['graduation'] ?? $graduation));
                            }
                        } catch (\Throwable $e) {
                            error_log('[TSMB Completion] LearnPress finish_course note: ' . $e->getMessage());
                        }
                    }
                }

                if ($status !== 'finished') {
                    $lp_table = $wpdb->prefix . 'learnpress_user_items';
                    if (
                        $user_item_id > 0 &&
                        $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $lp_table)) === $lp_table
                    ) {
                        $now_gmt = current_time('mysql', true);
                        $wpdb->update(
                            $lp_table,
                            [
                                'status'     => 'finished',
                                'graduation' => 'passed',
                                'end_time'   => $now_gmt,
                            ],
                            ['user_item_id' => $user_item_id],
                            ['%s', '%s', '%s'],
                            ['%d']
                        );
                        $status     = 'finished';
                        $graduation = 'passed';
                    }
                }

                $is_completed = ($status === 'finished' && $graduation !== 'failed');
            }
        }

        $enrolled_date  = is_array($state) && !empty($state['start_time']) ? substr((string) $state['start_time'], 0, 10) : '';
        $completed_date = ($is_completed && is_array($state) && !empty($state['end_time']) && strpos((string) $state['end_time'], '0000-00-00') !== 0)
            ? substr((string) $state['end_time'], 0, 10)
            : ($is_completed ? gmdate('Y-m-d') : '');

        return [
            'enrolled'             => true,
            'completed'            => $is_completed,
            'status'               => $status,
            'graduation'           => $graduation !== '' ? $graduation : ($is_completed ? 'passed' : 'in-progress'),
            'completed_date'       => $completed_date,
            'enrolled_date'        => $enrolled_date,
            'completed_lesson_ids' => array_map('strval', $completed_ids),
        ];
    }

    private static function get_user_course_review(int $user_id, int $course_id): ?array
    {
        if ($user_id <= 0 || $course_id <= 0) {
            return null;
        }

        $comments = get_comments([
            'post_id' => $course_id,
            'user_id' => $user_id,
            'type'    => 'review',
            'number'  => 1,
            'status'  => 'any',
        ]);

        if (empty($comments)) {
            return null;
        }

        $comment = $comments[0];
        $cid     = intval($comment->comment_ID ?? 0);
        $rating  = intval(get_comment_meta($cid, '_lpr_rating', true));
        $title   = sanitize_text_field((string) get_comment_meta($cid, '_lpr_review_title', true));

        return [
            'id'        => (string) $cid,
            'user_name' => sanitize_text_field((string) ($comment->comment_author ?? 'Learner')),
            'rating'    => $rating > 0 ? min(5, max(1, $rating)) : 5,
            'title'     => $title !== '' ? $title : __('Course Review', 'ts-mobile-bridge'),
            'comment'   => sanitize_textarea_field((string) ($comment->comment_content ?? '')),
            'date'      => substr((string) ($comment->comment_date_gmt ?? gmdate('Y-m-d')), 0, 10),
        ];
    }

    private static function get_user_reviewed_course_ids(int $user_id): array
    {
        if ($user_id <= 0) {
            return [];
        }

        $comments = get_comments([
            'user_id' => $user_id,
            'type'    => 'review',
            'status'  => 'any',
            'number'  => 200,
        ]);

        $ids = [];
        foreach ((array) $comments as $comment) {
            $pid = intval($comment->comment_post_ID ?? 0);
            if ($pid > 0) {
                $ids[] = $pid;
            }
        }
        return array_values(array_unique($ids));
    }

    private static function persist_user_course_review(int $user_id, int $course_id, int $rating, string $title, string $content)
    {
        $existing = self::get_user_course_review($user_id, $course_id);
        if (is_array($existing)) {
            return $existing;
        }

        $user = get_userdata($user_id);
        if (!$user) {
            return new WP_Error('invalid_user', __('User account not found.', 'ts-mobile-bridge'), ['status' => 404]);
        }

        $clean_title = trim(sanitize_text_field($title));
        if ($clean_title === '') {
            $clean_title = wp_html_excerpt(sanitize_text_field($content), 48, '...');
            if ($clean_title === '') {
                $clean_title = __('Course Review', 'ts-mobile-bridge');
            }
        }

        if (function_exists('learn_press_add_course_review')) {
            $comment_id = learn_press_add_course_review([
                'user_id'   => $user_id,
                'course_id' => $course_id,
                'rate'      => $rating,
                'title'     => $clean_title,
                'content'   => $content,
                'force'     => true,
            ]);
            if (is_wp_error($comment_id)) {
                return $comment_id;
            }
        } else {
            $comment_id = wp_insert_comment([
                'comment_post_ID'      => $course_id,
                'comment_author'       => $user->display_name ?: $user->user_login,
                'comment_author_email' => $user->user_email,
                'comment_author_url'   => '',
                'comment_content'      => $content,
                'comment_parent'       => 0,
                'user_id'              => $user_id,
                'comment_approved'     => 1,
                'comment_type'         => 'review',
                'comment_date_gmt'     => gmdate('Y-m-d H:i:s'),
            ]);
            if (!$comment_id || is_wp_error($comment_id)) {
                return new WP_Error('review_save_failed', __('Could not save course review.', 'ts-mobile-bridge'), ['status' => 500]);
            }
            add_comment_meta(intval($comment_id), '_lpr_rating', $rating, true);
            add_comment_meta(intval($comment_id), '_lpr_review_title', $clean_title, true);
        }

        if (class_exists('LP_Course_Review_Cache') && method_exists('LP_Course_Review_Cache', 'instance')) {
            try {
                LP_Course_Review_Cache::instance()->clean_rating($course_id, $user_id);
            } catch (\Throwable $e) {
                // Non-fatal cache clean
            }
        }

        self::clear_feed_cache();

        return self::get_user_course_review($user_id, $course_id) ?: [
            'id'        => (string) intval($comment_id),
            'user_name' => $user->display_name ?: $user->user_login,
            'rating'    => $rating,
            'title'     => $clean_title,
            'comment'   => $content,
            'date'      => gmdate('Y-m-d'),
        ];
    }

    private static function issue_authoritative_certificate(int $user_id, int $course_id, array $review, string $completed_date = ''): array
    {
        $user         = get_userdata($user_id);
        $course_post  = get_post($course_id);
        $student_name = $user && !empty($user->display_name) ? (string) $user->display_name : ($user ? (string) $user->user_login : 'Executive Graduate');
        $course_title = $course_post ? sanitize_text_field((string) $course_post->post_title) : ('Course #' . $course_id);

        $author_id       = $course_post && isset($course_post->post_author) ? intval($course_post->post_author) : 0;
        $author_user     = $author_id > 0 ? get_userdata($author_id) : null;
        $instructor_name = $author_user && !empty($author_user->display_name)
            ? (string) $author_user->display_name
            : 'Thriving Skills Instructor';

        $lp_cert_id = absint(get_post_meta($course_id, '_lp_cert', true));
        if ($lp_cert_id > 0 && get_post_status($lp_cert_id) === 'publish') {
            $credential_id = md5($user_id . ':' . $course_id . ':' . $lp_cert_id);
            update_option('user_cert_' . $credential_id, [
                'user_id'   => $user_id,
                'course_id' => $course_id,
                'cert_id'   => $lp_cert_id,
            ]);
            $cert_slug        = trim((string) get_option('learn_press_lp_cert_slug', 'certificates'), '/');
            $verification_url = home_url('/' . ($cert_slug !== '' ? $cert_slug : 'certificates') . '/' . $credential_id . '/');
        } else {
            $digest           = strtoupper(substr(hash_hmac('sha256', $user_id . ':' . $course_id, wp_salt('auth')), 0, 12));
            $credential_id    = 'TS-' . gmdate('Y') . '-' . $digest;
            $verification_url = add_query_arg('tsmb_cert', $credential_id, home_url('/'));
        }

        $issue_iso  = $completed_date !== '' ? $completed_date : gmdate('Y-m-d');
        $issue_dt   = \DateTimeImmutable::createFromFormat('!Y-m-d', $issue_iso, new \DateTimeZone('UTC'));
        $issue_ts   = $issue_dt instanceof \DateTimeImmutable ? $issue_dt->getTimestamp() : time();
        $issue_date = gmdate('F j, Y', $issue_ts);

        $existing_record = get_option('tsmb_cert_' . $credential_id);
        if (!is_array($existing_record)) {
            update_option('tsmb_cert_' . $credential_id, [
                'credential_id'    => $credential_id,
                'user_id'          => $user_id,
                'course_id'        => $course_id,
                'lp_cert_id'       => $lp_cert_id,
                'course_title'     => $course_title,
                'student_name'     => $student_name,
                'instructor_name'  => $instructor_name,
                'issue_date'       => $issue_date,
                'review_id'        => (string) ($review['id'] ?? ''),
                'verification_url' => $verification_url,
                'issued_at'        => time(),
            ]);
        } else {
            $issue_date = (string) ($existing_record['issue_date'] ?? $issue_date);
        }

        $issued_map = get_user_meta($user_id, 'tsmb_issued_certificates', true);
        if (!is_array($issued_map)) {
            $issued_map = [];
        }
        $issued_map[(string) $course_id] = $credential_id;
        update_user_meta($user_id, 'tsmb_issued_certificates', $issued_map);

        return [
            'id'               => 'cert-' . $course_id . '-' . $user_id,
            'courseId'         => (string) $course_id,
            'courseTitle'      => $course_title,
            'studentName'      => $student_name,
            'issueDate'        => $issue_date,
            'credentialId'     => $credential_id,
            'instructorName'   => $instructor_name,
            'verificationUrl'  => $verification_url,
            'serverVerified'   => true,
        ];
    }

    public static function submit_course_review($request)
    {
        $user_id = get_current_user_id();
        if ($user_id <= 0) {
            return new WP_Error('rest_forbidden', __('Authentication required.', 'ts-mobile-bridge'), ['status' => 401]);
        }

        $rl = TSMB_Security::consume_rate_limit('submit_review', (string) $user_id, 10, 15 * MINUTE_IN_SECONDS);
        if (is_wp_error($rl)) {
            return $rl;
        }

        $course_id = absint($request['id'] ?? 0);
        $post      = get_post($course_id);
        if (!$post || $post->post_type !== 'lp_course' || $post->post_status !== 'publish') {
            return new WP_Error('invalid_course', __('Course not found.', 'ts-mobile-bridge'), ['status' => 404]);
        }

        $params = $request->get_json_params();
        if (!is_array($params)) {
            $params = [];
        }

        $rating  = intval($params['rate'] ?? ($params['rating'] ?? 0));
        $title   = sanitize_text_field((string) ($params['title'] ?? ''));
        $content = trim(sanitize_textarea_field((string) ($params['content'] ?? ($params['feedback'] ?? ($params['comment'] ?? '')))));
        $require_completion = array_key_exists('require_completion', $params) ? (bool) $params['require_completion'] : true;

        if ($rating < 1 || $rating > 5) {
            return new WP_Error('invalid_rating', __('Please select a star rating from 1 to 5.', 'ts-mobile-bridge'), ['status' => 400]);
        }

        if (strlen($content) < 5) {
            return new WP_Error('invalid_review_content', __('Please write at least 5 characters in your review.', 'ts-mobile-bridge'), ['status' => 400]);
        }

        $completion = self::verify_and_finalize_course_completion($user_id, $course_id);
        if (empty($completion['enrolled'])) {
            return new WP_Error('not_enrolled', __('You must be enrolled in this course to submit a review.', 'ts-mobile-bridge'), ['status' => 403]);
        }

        if ($require_completion && empty($completion['completed'])) {
            return new WP_Error(
                'course_not_completed',
                __('Complete 100% of this course on the server before claiming your certificate.', 'ts-mobile-bridge'),
                ['status' => 403]
            );
        }

        $review = self::persist_user_course_review($user_id, $course_id, $rating, $title, $content);
        if (is_wp_error($review)) {
            return $review;
        }

        $certificate = null;
        if (!empty($completion['completed'])) {
            $certificate = self::issue_authoritative_certificate(
                $user_id,
                $course_id,
                $review,
                (string) ($completion['completed_date'] ?? '')
            );
        }

        return rest_ensure_response([
            'status'           => 'success',
            'course_completed' => !empty($completion['completed']),
            'has_reviewed'     => true,
            'review'           => $review,
            'certificate'      => $certificate,
        ]);
    }

    public static function get_learning_state($request)
    {
        $user_id = get_current_user_id();
        if ($user_id <= 0) {
            return new WP_Error('rest_forbidden', __('Authentication required.', 'ts-mobile-bridge'), ['status' => 401]);
        }

        $enrolled_ids  = self::get_user_enrolled_course_ids($user_id);
        $reviewed_ids  = self::get_user_reviewed_course_ids($user_id);
        $reviewed_set  = array_flip($reviewed_ids);
        $progress_map  = [];
        $certificates  = [];

        foreach ($enrolled_ids as $course_id) {
            $completion  = self::verify_and_finalize_course_completion($user_id, intval($course_id));
            $has_review  = isset($reviewed_set[$course_id]);
            $cert_record = null;

            if (!empty($completion['completed']) && $has_review) {
                $review_data = self::get_user_course_review($user_id, intval($course_id));
                if (is_array($review_data)) {
                    $cert_record    = self::issue_authoritative_certificate(
                        $user_id,
                        intval($course_id),
                        $review_data,
                        (string) ($completion['completed_date'] ?? '')
                    );
                    $certificates[] = $cert_record;
                }
            }

            $progress_map[(string) $course_id] = [
                'courseId'           => (string) $course_id,
                'enrolledDate'       => $completion['enrolled_date'] ?: gmdate('Y-m-d'),
                'completedLessonIds' => $completion['completed_lesson_ids'],
                'isCompleted'        => !empty($completion['completed']),
                'hasReviewed'        => $has_review,
                'completedDate'      => $completion['completed_date'] ?: null,
                'certificateId'      => is_array($cert_record) ? $cert_record['credentialId'] : null,
                'status'             => $completion['status'] ?: 'enrolled',
                'grade'              => $completion['graduation'] ?: 'in-progress',
            ];
        }

        return rest_ensure_response([
            'status'              => 'success',
            'enrolled_course_ids' => array_map('strval', $enrolled_ids),
            'reviewed_course_ids' => array_map('strval', $reviewed_ids),
            'progress'            => $progress_map,
            'certificates'        => $certificates,
            'watch_positions'     => self::get_user_watch_positions($user_id),
            'gamification'        => self::get_user_gamification_state($user_id),
        ]);
    }

    public static function verify_certificate($request)
    {
        $code = sanitize_text_field((string) ($request['code'] ?? ($request->get_param('code') ?? '')));
        if ($code === '') {
            return new WP_Error('invalid_code', __('Certificate code is required.', 'ts-mobile-bridge'), ['status' => 400]);
        }

        $record = get_option('tsmb_cert_' . $code);
        if (is_array($record) && !empty($record['user_id']) && !empty($record['course_id'])) {
            $uid        = intval($record['user_id']);
            $cid        = intval($record['course_id']);
            $completion = self::verify_and_finalize_course_completion($uid, $cid);
            $review     = self::get_user_course_review($uid, $cid);
            $valid      = !empty($completion['completed']) && is_array($review);

            return rest_ensure_response([
                'valid'       => $valid,
                'certificate' => $valid ? $record : null,
            ]);
        }

        $lp_record = get_option('user_cert_' . $code);
        if (is_array($lp_record) && !empty($lp_record['user_id']) && !empty($lp_record['course_id'])) {
            $uid        = intval($lp_record['user_id']);
            $cid        = intval($lp_record['course_id']);
            $completion = self::verify_and_finalize_course_completion($uid, $cid);
            $review     = self::get_user_course_review($uid, $cid);
            if (!empty($completion['completed']) && is_array($review)) {
                $issued = self::issue_authoritative_certificate($uid, $cid, $review, (string) ($completion['completed_date'] ?? ''));
                return rest_ensure_response([
                    'valid'       => true,
                    'certificate' => $issued,
                ]);
            }
        }

        return rest_ensure_response([
            'valid'       => false,
            'certificate' => null,
        ]);
    }

    public static function maybe_serve_certificate_verification(): void
    {
        if (!isset($_GET['tsmb_cert'])) {
            return;
        }
        $code = sanitize_text_field(wp_unslash((string) $_GET['tsmb_cert']));
        if ($code === '') {
            return;
        }

        $req = new WP_REST_Request('GET', '/thrivingskill/v1/certificates/verify');
        $req->set_param('code', $code);
        $res  = self::verify_certificate($req);
        $data = ($res instanceof WP_REST_Response) ? $res->get_data() : ['valid' => false];

        nocache_headers();
        header('Content-Type: text/html; charset=utf-8');
        if (empty($data['valid']) || !is_array($data['certificate'])) {
            status_header(404);
            echo '<!doctype html><html><body style="font-family:sans-serif;padding:40px;max-width:560px;margin:auto;"><h2>Certificate Not Verified</h2><p>This credential could not be verified.</p></body></html>';
        } else {
            $c = $data['certificate'];
            status_header(200);
            echo '<!doctype html><html><body style="font-family:sans-serif;padding:40px;max-width:600px;margin:auto;">';
            echo '<h2 style="color:#102F53;">Verified Thriving Skills Certificate</h2>';
            echo '<p><strong>Recipient:</strong> ' . esc_html((string) ($c['student_name'] ?? ($c['studentName'] ?? ''))) . '</p>';
            echo '<p><strong>Course:</strong> ' . esc_html((string) ($c['course_title'] ?? ($c['courseTitle'] ?? ''))) . '</p>';
            echo '<p><strong>Credential ID:</strong> ' . esc_html((string) ($c['credential_id'] ?? ($c['credentialId'] ?? $code))) . '</p>';
            echo '<p><strong>Issued:</strong> ' . esc_html((string) ($c['issue_date'] ?? ($c['issueDate'] ?? ''))) . '</p>';
            echo '</body></html>';
        }
        if (!defined('TSMB_TESTING') || !TSMB_TESTING) {
            exit;
        }
    }

    private static function get_admin_support_email(): string
    {
        $configured = sanitize_email((string) get_option('tsmb_support_email', ''));
        if ($configured !== '' && is_email($configured)) {
            return $configured;
        }
        $admin_email = sanitize_email((string) get_option('admin_email', ''));
        return ($admin_email !== '' && is_email($admin_email)) ? $admin_email : 'support@thrivingskill.com';
    }

    public static function submit_corporate_inquiry($request)
    {
        global $wpdb;

        $params = $request->get_json_params();
        if (!is_array($params)) {
            $params = [];
        }

        $service_type = sanitize_text_field((string) ($params['service_type'] ?? ($params['serviceType'] ?? ($params['service'] ?? 'Corporate Training'))));
        $company_name = sanitize_text_field((string) ($params['company_name'] ?? ($params['companyName'] ?? '')));
        $contact_name = sanitize_text_field((string) ($params['contact_name'] ?? ($params['contactName'] ?? '')));
        $work_email   = sanitize_email((string) ($params['work_email'] ?? ($params['workEmail'] ?? '')));
        $phone        = sanitize_text_field((string) ($params['phone'] ?? ''));
        $team_size    = sanitize_text_field((string) ($params['team_size'] ?? ($params['teamSize'] ?? '20-50')));
        $notes        = sanitize_textarea_field((string) ($params['notes'] ?? ''));

        if ($service_type === '') {
            $service_type = 'Corporate Training';
        }
        if (strlen($company_name) < 2) {
            return new WP_Error('invalid_company_name', __('Company or organization name must be at least 2 characters.', 'ts-mobile-bridge'), ['status' => 400]);
        }
        if (strlen($contact_name) < 2) {
            return new WP_Error('invalid_contact_name', __('Contact name must be at least 2 characters.', 'ts-mobile-bridge'), ['status' => 400]);
        }
        if ($work_email === '' || !is_email($work_email)) {
            return new WP_Error('invalid_work_email', __('Please enter a valid corporate email address.', 'ts-mobile-bridge'), ['status' => 400]);
        }

        $client_ip = TSMB_Security::get_client_ip();
        $rl_ip     = TSMB_Security::consume_rate_limit('corp_inquiry_ip', $client_ip, 5, HOUR_IN_SECONDS);
        if (is_wp_error($rl_ip)) {
            return $rl_ip;
        }
        $rl_email = TSMB_Security::consume_rate_limit('corp_inquiry_email', strtolower($work_email), 5, HOUR_IN_SECONDS);
        if (is_wp_error($rl_email)) {
            return $rl_email;
        }

        TSMB_Lifecycle::maybe_upgrade();
        $table        = TSMB_Lifecycle::get_leads_table();
        $now_gmt      = current_time('mysql', true);
        $reference_id = 'CORP-' . gmdate('Ymd') . '-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 6));
        $user_id      = get_current_user_id();

        $inserted = $wpdb->insert(
            $table,
            [
                'reference_id' => $reference_id,
                'user_id'      => $user_id > 0 ? $user_id : 0,
                'service_type' => substr($service_type, 0, 120),
                'company_name' => substr($company_name, 0, 180),
                'contact_name' => substr($contact_name, 0, 140),
                'work_email'   => substr($work_email, 0, 180),
                'phone'        => substr($phone, 0, 64),
                'team_size'    => substr($team_size, 0, 40),
                'notes'        => substr($notes, 0, 2000),
                'status'       => 'new',
                'ip_address'   => substr($client_ip, 0, 64),
                'created_at'   => $now_gmt,
                'updated_at'   => $now_gmt,
            ],
            ['%s', '%d', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s']
        );

        if ($inserted === false) {
            return new WP_Error('lead_save_failed', __('Could not record corporate inquiry. Please try again.', 'ts-mobile-bridge'), ['status' => 500]);
        }

        if (function_exists('wp_mail')) {
            wp_mail(
                self::get_admin_support_email(),
                sprintf('[Thriving Skills Enterprise] %s (%s)', $company_name, $reference_id),
                sprintf(
                    "Reference: %s\nSolution: %s\nCompany: %s\nContact: %s\nWork Email: %s\nPhone: %s\nTeam Size: %s\nNotes: %s\nSubmitted (UTC): %s\n",
                    $reference_id,
                    $service_type,
                    $company_name,
                    $contact_name,
                    $work_email,
                    $phone !== '' ? $phone : 'N/A',
                    $team_size,
                    $notes !== '' ? $notes : 'N/A',
                    $now_gmt
                )
            );
        }

        return new WP_REST_Response(
            [
                'status'         => 'success',
                'reference_id'   => $reference_id,
                'inquiry_status' => 'new',
                'submitted_at'   => $now_gmt,
            ],
            201
        );
    }

    public static function get_support_tickets($request)
    {
        global $wpdb;

        $user_id = get_current_user_id();
        if ($user_id <= 0) {
            return new WP_Error('rest_forbidden', __('Authentication required.', 'ts-mobile-bridge'), ['status' => 401]);
        }

        $rl = TSMB_Security::consume_rate_limit('support_list', (string) $user_id, 60, MINUTE_IN_SECONDS);
        if (is_wp_error($rl)) {
            return $rl;
        }

        TSMB_Lifecycle::maybe_upgrade();
        $table = TSMB_Lifecycle::get_tickets_table();
        $rows  = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT ticket_id, topic, subject, message, course_id, contact_email, status, admin_reply, created_at, updated_at
                 FROM {$table}
                 WHERE user_id = %d
                 ORDER BY id DESC
                 LIMIT 50",
                $user_id
            ),
            ARRAY_A
        );

        $allowed_statuses = ['open', 'in_progress', 'resolved'];
        $tickets          = [];
        if (is_array($rows)) {
            foreach ($rows as $row) {
                $status = sanitize_key((string) ($row['status'] ?? 'open'));
                if (!in_array($status, $allowed_statuses, true)) {
                    $status = 'open';
                }
                $cid = intval($row['course_id'] ?? 0);
                $tickets[] = [
                    'ticket_id'     => sanitize_text_field((string) ($row['ticket_id'] ?? '')),
                    'topic'         => sanitize_key((string) ($row['topic'] ?? 'general')),
                    'subject'       => sanitize_text_field((string) ($row['subject'] ?? '')),
                    'message'       => sanitize_textarea_field((string) ($row['message'] ?? '')),
                    'course_id'     => $cid > 0 ? (string) $cid : null,
                    'contact_email' => sanitize_email((string) ($row['contact_email'] ?? '')),
                    'status'        => $status,
                    'admin_reply'   => sanitize_textarea_field((string) ($row['admin_reply'] ?? '')),
                    'created_at'    => sanitize_text_field((string) ($row['created_at'] ?? '')),
                    'updated_at'    => sanitize_text_field((string) ($row['updated_at'] ?? '')),
                ];
            }
        }

        return rest_ensure_response([
            'status'  => 'success',
            'tickets' => $tickets,
        ]);
    }

    public static function create_support_ticket($request)
    {
        global $wpdb;

        $user_id = get_current_user_id();
        if ($user_id <= 0) {
            return new WP_Error('rest_forbidden', __('Authentication required.', 'ts-mobile-bridge'), ['status' => 401]);
        }

        $rl = TSMB_Security::consume_rate_limit('support_create', (string) $user_id, 10, HOUR_IN_SECONDS);
        if (is_wp_error($rl)) {
            return $rl;
        }

        $params = $request->get_json_params();
        if (!is_array($params)) {
            $params = [];
        }

        $allowed_topics = ['general', 'payment', 'live', 'certificate', 'corporate', 'bug'];
        $topic          = sanitize_key((string) ($params['topic'] ?? 'general'));
        if (!in_array($topic, $allowed_topics, true)) {
            $topic = 'general';
        }

        $subject   = sanitize_text_field((string) ($params['subject'] ?? ''));
        $message   = sanitize_textarea_field((string) ($params['message'] ?? ''));
        $course_id = absint($params['course_id'] ?? ($params['courseId'] ?? 0));

        if (strlen($subject) < 3) {
            return new WP_Error('invalid_subject', __('Support subject must be at least 3 characters.', 'ts-mobile-bridge'), ['status' => 400]);
        }
        if (strlen($message) < 10) {
            return new WP_Error('invalid_message', __('Please describe your issue in at least 10 characters.', 'ts-mobile-bridge'), ['status' => 400]);
        }

        $user_obj      = get_userdata($user_id);
        $raw_email     = sanitize_email((string) ($params['contact_email'] ?? ($params['contactEmail'] ?? ($user_obj->user_email ?? ''))));
        $contact_email = ($raw_email !== '' && is_email($raw_email))
            ? $raw_email
            : sanitize_email((string) ($user_obj->user_email ?? ''));

        TSMB_Lifecycle::maybe_upgrade();
        $table     = TSMB_Lifecycle::get_tickets_table();
        $now_gmt   = current_time('mysql', true);
        $ticket_id = 'TS-' . gmdate('Ymd') . '-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 6));

        $inserted = $wpdb->insert(
            $table,
            [
                'ticket_id'     => $ticket_id,
                'user_id'       => $user_id,
                'topic'         => $topic,
                'subject'       => substr($subject, 0, 200),
                'message'       => substr($message, 0, 3000),
                'course_id'     => $course_id,
                'contact_email' => substr($contact_email, 0, 180),
                'status'        => 'open',
                'admin_reply'   => '',
                'created_at'    => $now_gmt,
                'updated_at'    => $now_gmt,
            ],
            ['%s', '%d', '%s', '%s', '%s', '%d', '%s', '%s', '%s', '%s', '%s']
        );

        if ($inserted === false) {
            return new WP_Error('ticket_save_failed', __('Could not create support ticket. Please try again.', 'ts-mobile-bridge'), ['status' => 500]);
        }

        if (function_exists('wp_mail')) {
            wp_mail(
                self::get_admin_support_email(),
                sprintf('[Thriving Skills Support %s] %s', $ticket_id, $subject),
                sprintf(
                    "Ticket ID: %s\nUser ID: %d\nEmail: %s\nTopic: %s\nCourse ID: %s\nSubject: %s\nMessage:\n%s\n",
                    $ticket_id,
                    $user_id,
                    $contact_email !== '' ? $contact_email : 'N/A',
                    $topic,
                    $course_id > 0 ? (string) $course_id : 'N/A',
                    $subject,
                    $message
                )
            );
        }

        return new WP_REST_Response(
            [
                'status' => 'success',
                'ticket' => [
                    'ticket_id'     => $ticket_id,
                    'topic'         => $topic,
                    'subject'       => substr($subject, 0, 200),
                    'message'       => substr($message, 0, 3000),
                    'course_id'     => $course_id > 0 ? (string) $course_id : null,
                    'contact_email' => substr($contact_email, 0, 180),
                    'status'        => 'open',
                    'admin_reply'   => '',
                    'created_at'    => $now_gmt,
                    'updated_at'    => $now_gmt,
                ],
            ],
            201
        );
    }

    public static function get_user_watch_positions(int $user_id): array
    {
        if ($user_id <= 0) {
            return [];
        }
        $raw = get_user_meta($user_id, self::USER_META_WATCH_POSITIONS, true);
        return self::normalize_watch_positions(is_array($raw) ? $raw : []);
    }

    private static function normalize_watch_positions(array $raw): array
    {
        $clean = [];
        foreach ($raw as $cid => $lessons) {
            $cid_key = trim((string) $cid);
            if ($cid_key === '' || !preg_match('/^[A-Za-z0-9_-]{1,32}$/', $cid_key) || !is_array($lessons)) {
                continue;
            }
            $lesson_map = [];
            foreach ($lessons as $lid => $sec) {
                $lid_key = trim((string) $lid);
                if ($lid_key === '' || !preg_match('/^[A-Za-z0-9_-]{1,32}$/', $lid_key) || !is_numeric($sec)) {
                    continue;
                }
                $lesson_map[$lid_key] = max(0, min(86400, intval($sec)));
                if (count($lesson_map) >= 120) {
                    break;
                }
            }
            if (!empty($lesson_map)) {
                $clean[$cid_key] = $lesson_map;
            }
            if (count($clean) >= 150) {
                break;
            }
        }
        return $clean;
    }

    public static function get_user_gamification_state(int $user_id): ?array
    {
        if ($user_id <= 0) {
            return null;
        }
        $raw = get_user_meta($user_id, self::USER_META_GAMIFICATION, true);
        if (!is_array($raw) || empty($raw)) {
            return null;
        }
        return self::normalize_gamification_snapshot($raw);
    }

    private static function normalize_gamification_snapshot(array $raw): array
    {
        $last_active = trim((string) ($raw['lastActiveDate'] ?? gmdate('Y-m-d')));
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $last_active)) {
            $last_active = gmdate('Y-m-d');
        }

        $daily_history = [];
        if (isset($raw['dailyHistory']) && is_array($raw['dailyHistory'])) {
            foreach ($raw['dailyHistory'] as $day => $mins) {
                $day_str = trim((string) $day);
                if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $day_str) && is_numeric($mins)) {
                    $daily_history[$day_str] = max(0, min(1440, intval($mins)));
                }
            }
            ksort($daily_history);
            if (count($daily_history) > 90) {
                $daily_history = array_slice($daily_history, -90, 90, true);
            }
        }

        $badges_by_id = [];
        $raw_badges   = $raw['unlockedBadges'] ?? ($raw['badges'] ?? []);
        if (is_array($raw_badges)) {
            foreach ($raw_badges as $badge) {
                if (is_string($badge)) {
                    $bid = sanitize_key($badge);
                    $at  = $last_active;
                } elseif (is_array($badge) && (!isset($badge['isUnlocked']) || !empty($badge['isUnlocked']))) {
                    $bid = sanitize_key((string) ($badge['id'] ?? ''));
                    $at  = trim((string) ($badge['unlockedAt'] ?? $last_active));
                } else {
                    continue;
                }
                if ($bid === '') {
                    continue;
                }
                if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $at)) {
                    $at = $last_active;
                }
                $badges_by_id[$bid] = [
                    'id'         => $bid,
                    'unlockedAt' => $at,
                ];
            }
        }

        return [
            'streakDays'            => max(0, min(3650, intval($raw['streakDays'] ?? 0))),
            'lastActiveDate'        => $last_active,
            'dailyMinutesSpent'     => max(0, min(1440, intval($raw['dailyMinutesSpent'] ?? 0))),
            'dailyGoalMinutes'      => max(5, min(240, intval($raw['dailyGoalMinutes'] ?? 15))),
            'totalStudyMinutes'     => max(0, min(525600, intval($raw['totalStudyMinutes'] ?? 0))),
            'dailyHistory'          => $daily_history,
            'xp'                    => max(0, min(999999, intval($raw['xp'] ?? 0))),
            'streakFreezes'         => max(0, min(10, intval($raw['streakFreezes'] ?? 1))),
            'streakFreezeUsedToday' => !empty($raw['streakFreezeUsedToday']),
            'preferredStudyHour'    => max(0, min(23, intval($raw['preferredStudyHour'] ?? 20))),
            'unlockedBadges'        => array_values($badges_by_id),
            'updatedAt'             => max(0, intval($raw['updatedAt'] ?? 0)),
        ];
    }

    private static function merge_gamification_snapshot(?array $existing, array $incoming): array
    {
        if (!is_array($existing) || empty($existing)) {
            return $incoming;
        }

        $merged_history = $existing['dailyHistory'] ?? [];
        foreach (($incoming['dailyHistory'] ?? []) as $day => $mins) {
            $merged_history[$day] = max(intval($merged_history[$day] ?? 0), intval($mins));
        }
        ksort($merged_history);
        if (count($merged_history) > 90) {
            $merged_history = array_slice($merged_history, -90, 90, true);
        }

        $badge_map = [];
        foreach (($existing['unlockedBadges'] ?? []) as $b) {
            if (!empty($b['id'])) {
                $badge_map[$b['id']] = $b;
            }
        }
        foreach (($incoming['unlockedBadges'] ?? []) as $b) {
            if (!empty($b['id']) && !isset($badge_map[$b['id']])) {
                $badge_map[$b['id']] = $b;
            }
        }

        $existing_date = (string) ($existing['lastActiveDate'] ?? '');
        $incoming_date = (string) ($incoming['lastActiveDate'] ?? '');
        if ($incoming_date > $existing_date) {
            $last_active  = $incoming_date;
            $streak_days  = intval($incoming['streakDays'] ?? 0);
            $daily_mins   = intval($incoming['dailyMinutesSpent'] ?? 0);
            $freeze_today = !empty($incoming['streakFreezeUsedToday']);
        } elseif ($incoming_date === $existing_date) {
            $last_active  = $existing_date;
            $streak_days  = max(intval($existing['streakDays'] ?? 0), intval($incoming['streakDays'] ?? 0));
            $daily_mins   = max(intval($existing['dailyMinutesSpent'] ?? 0), intval($incoming['dailyMinutesSpent'] ?? 0));
            $freeze_today = !empty($existing['streakFreezeUsedToday']) || !empty($incoming['streakFreezeUsedToday']);
        } else {
            $last_active  = $existing_date;
            $streak_days  = intval($existing['streakDays'] ?? 0);
            $daily_mins   = intval($existing['dailyMinutesSpent'] ?? 0);
            $freeze_today = !empty($existing['streakFreezeUsedToday']);
        }

        $use_incoming_prefs = intval($incoming['updatedAt'] ?? 0) >= intval($existing['updatedAt'] ?? 0);

        return [
            'streakDays'            => $streak_days,
            'lastActiveDate'        => $last_active,
            'dailyMinutesSpent'     => $daily_mins,
            'dailyGoalMinutes'      => $use_incoming_prefs ? $incoming['dailyGoalMinutes'] : $existing['dailyGoalMinutes'],
            'totalStudyMinutes'     => max(intval($existing['totalStudyMinutes'] ?? 0), intval($incoming['totalStudyMinutes'] ?? 0)),
            'dailyHistory'          => $merged_history,
            'xp'                    => max(intval($existing['xp'] ?? 0), intval($incoming['xp'] ?? 0)),
            'streakFreezes'         => $use_incoming_prefs ? $incoming['streakFreezes'] : $existing['streakFreezes'],
            'streakFreezeUsedToday' => $freeze_today,
            'preferredStudyHour'    => $use_incoming_prefs ? $incoming['preferredStudyHour'] : $existing['preferredStudyHour'],
            'unlockedBadges'        => array_values($badge_map),
            'updatedAt'             => max(intval($existing['updatedAt'] ?? 0), intval($incoming['updatedAt'] ?? 0)),
        ];
    }

    public static function sync_engagement_state($request)
    {
        $user_id = get_current_user_id();
        if ($user_id <= 0) {
            return new WP_Error('rest_forbidden', __('Authentication required.', 'ts-mobile-bridge'), ['status' => 401]);
        }

        $rl = TSMB_Security::consume_rate_limit('engagement_sync', (string) $user_id, 60, MINUTE_IN_SECONDS);
        if (is_wp_error($rl)) {
            return $rl;
        }

        $params = $request->get_json_params();
        if (!is_array($params)) {
            $params = [];
        }

        $watch_positions = self::get_user_watch_positions($user_id);
        $raw_positions   = $params['watch_positions'] ?? ($params['watchPositions'] ?? null);
        if (is_array($raw_positions)) {
            $incoming_pos = self::normalize_watch_positions($raw_positions);
            foreach ($incoming_pos as $cid => $lesson_map) {
                $existing_course = $watch_positions[$cid] ?? [];
                foreach ($lesson_map as $lid => $sec) {
                    $existing_course[$lid] = $sec;
                }
                $watch_positions[$cid] = $existing_course;
            }
            $watch_positions = self::normalize_watch_positions($watch_positions);
            update_user_meta($user_id, self::USER_META_WATCH_POSITIONS, $watch_positions);
        }

        $gamification     = self::get_user_gamification_state($user_id);
        $raw_gamification = $params['gamification'] ?? null;
        if (is_array($raw_gamification)) {
            $normalized_incoming = self::normalize_gamification_snapshot($raw_gamification);
            $gamification        = self::merge_gamification_snapshot($gamification, $normalized_incoming);
            update_user_meta($user_id, self::USER_META_GAMIFICATION, $gamification);
        }

        return rest_ensure_response([
            'status'          => 'success',
            'watch_positions' => $watch_positions,
            'gamification'    => $gamification,
        ]);
    }
}

/* ==========================================================================
   4. ANDROID APP LINKS & DEEP LINK ROUTING
   ========================================================================== */

class TSMB_DeepLinks
{
    public static function init(): void
    {
        add_action('template_redirect', [__CLASS__, 'maybe_serve_assetlinks'], 1);
    }

    public static function get_fingerprints(): array
    {
        $raw = (string) get_option('tsmb_android_sha256_fingerprints', '');
        if ($raw === '') {
            return [];
        }
        $lines = preg_split('/[\r\n,]+/', $raw) ?: [];
        $valid = [];
        foreach ($lines as $line) {
            $fp = strtoupper(trim($line));
            if (preg_match('/^([0-9A-F]{2}:){31}[0-9A-F]{2}$/', $fp)) {
                $valid[] = $fp;
            }
        }
        return array_values(array_unique($valid));
    }

    public static function maybe_serve_assetlinks(): void
    {
        $request_uri = isset($_SERVER['REQUEST_URI']) ? (string) wp_unslash($_SERVER['REQUEST_URI']) : '';
        $path = (string) parse_url($request_uri, PHP_URL_PATH);
        if ($path !== '/.well-known/assetlinks.json') {
            return;
        }

        status_header(200);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: public, max-age=3600');

        $fingerprints = self::get_fingerprints();
        $payload = [
            [
                'relation' => ['delegate_permission/common.handle_all_urls'],
                'target'   => [
                    'namespace'                => 'android_app',
                    'package_name'             => 'com.thrivingskill.app',
                    'sha256_cert_fingerprints' => $fingerprints,
                ],
            ],
        ];
        echo wp_json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
        exit;
    }
}

class TSMB_Notifications
{
    private const EXPO_SEND_URL = 'https://exp.host/--/api/v2/push/send';
    private const EXPO_RECEIPTS_URL = 'https://exp.host/--/api/v2/push/getReceipts';
    public const BATCH_BROADCAST_HOOK = 'tsmb_process_push_broadcast_batch';
    private const BROADCAST_CHUNK_SIZE = 100;

    public static function init(): void
    {
        TSMB_DeepLinks::init();
        add_action('rest_api_init', [__CLASS__, 'register_routes']);
        add_action('transition_post_status', [__CLASS__, 'handle_post_transition'], 10, 3);
        add_action(TSMB_Lifecycle::CRON_RECEIPTS_HOOK, [__CLASS__, 'process_expo_receipts'], 10, 1);
        add_action(self::BATCH_BROADCAST_HOOK, [__CLASS__, 'process_broadcast_batch'], 10, 2);
    }

    public static function register_routes(): void
    {
        register_rest_route(TSMB_Rest_API::NAMESPACE, '/register-push-token', [
            'methods'             => 'POST',
            'callback'            => [__CLASS__, 'register_token'],
            'permission_callback' => [__CLASS__, 'permission_check'],
            'args'                => [
                'token' => [
                    'required'          => true,
                    'sanitize_callback' => 'sanitize_text_field',
                ],
                'platform' => [
                    'required'          => false,
                    'sanitize_callback' => 'sanitize_text_field',
                ],
            ],
        ]);
    }

    public static function permission_check()
    {
        if (!is_user_logged_in() || get_current_user_id() <= 0) {
            return new WP_Error(
                'rest_forbidden',
                __('Authentication is required to register a push notification token.', 'ts-mobile-bridge'),
                ['status' => 401]
            );
        }
        return true;
    }

    public static function is_valid_expo_token(string $token): bool
    {
        return (bool) preg_match('/^(?:ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]{8,128}\]$/', trim($token));
    }

    public static function sanitize_platform(string $raw): string
    {
        $clean = strtolower(sanitize_text_field(trim($raw)));
        return in_array($clean, ['android', 'ios', 'web'], true) ? $clean : 'unknown';
    }

    public static function register_token($request)
    {
        global $wpdb;

        $user_id   = get_current_user_id();
        $client_ip = TSMB_Security::get_client_ip();

        $ip_limit = TSMB_Security::consume_rate_limit('push_reg_ip', $client_ip, 20, 15 * MINUTE_IN_SECONDS);
        if (is_wp_error($ip_limit)) {
            return $ip_limit;
        }

        $user_limit = TSMB_Security::consume_rate_limit('push_reg_user', (string) $user_id, 20, 15 * MINUTE_IN_SECONDS);
        if (is_wp_error($user_limit)) {
            return $user_limit;
        }

        $token    = trim((string) ($request['token'] ?? ''));
        $platform = self::sanitize_platform((string) ($request['platform'] ?? 'unknown'));

        if (!self::is_valid_expo_token($token)) {
            return new WP_Error(
                'invalid_token',
                __('Invalid Expo push token format.', 'ts-mobile-bridge'),
                ['status' => 400]
            );
        }

        TSMB_Lifecycle::maybe_upgrade();
        $table   = TSMB_Lifecycle::get_push_tokens_table();
        $now_gmt = current_time('mysql', true);

        $saved = $wpdb->query(
            $wpdb->prepare(
                "INSERT INTO {$table} (user_id, token, platform, last_seen, created_at)
                 VALUES (%d, %s, %s, %s, %s)
                 ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), platform = VALUES(platform), last_seen = VALUES(last_seen)",
                $user_id,
                $token,
                $platform,
                $now_gmt,
                $now_gmt
            )
        );

        if ($saved === false) {
            return new WP_Error(
                'push_registration_failed',
                __('Could not save push notification token.', 'ts-mobile-bridge'),
                ['status' => 500]
            );
        }

        return rest_ensure_response([
            'status'  => 'success',
            'user_id' => $user_id,
            'message' => __('Push token registered successfully', 'ts-mobile-bridge'),
        ]);
    }

    public static function get_registered_count(): int
    {
        global $wpdb;
        $table = TSMB_Lifecycle::get_push_tokens_table();
        if ($wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $table)) !== $table) {
            return 0;
        }
        return intval($wpdb->get_var("SELECT COUNT(*) FROM {$table}"));
    }

    public static function handle_post_transition($new_status, $old_status, $post): void
    {
        if ($new_status === 'publish' && $old_status !== 'publish' && $post->post_type === 'lp_course') {
            $title   = wp_strip_all_tags(get_the_title($post->ID));
            $message = sprintf(
                __('New Course Alert: %s is now available on Thriving Skills!', 'ts-mobile-bridge'),
                $title
            );

            self::send_expo_push([
                'title' => __('New Course Published!', 'ts-mobile-bridge'),
                'body'  => $message,
                'data'  => [
                    'course_id' => $post->ID,
                    'courseId'  => (string) $post->ID,
                    'screen'    => 'CourseDetail',
                ],
            ]);
        }
    }

    public static function send_broadcast(string $title, string $body, array $data = []): array
    {
        return self::dispatch_push_to_all_tokens([
            'title' => $title,
            'body'  => $body,
            'data'  => $data,
        ]);
    }

    public static function send_expo_push(array $payload): void
    {
        self::dispatch_push_to_all_tokens($payload);
    }

    public static function process_expo_receipts(array $receipt_map): void
    {
        if (empty($receipt_map)) {
            return;
        }

        $receipt_ids = array_keys($receipt_map);
        $chunks      = array_chunk($receipt_ids, 500);
        $dead_tokens = [];

        foreach ($chunks as $chunk) {
            $res = wp_remote_post(self::EXPO_RECEIPTS_URL, [
                'headers'  => [
                    'Accept'       => 'application/json',
                    'Content-Type' => 'application/json',
                ],
                'body'     => wp_json_encode(['ids' => $chunk]),
                'timeout'  => 15,
                'blocking' => true,
            ]);

            if (is_wp_error($res)) {
                continue;
            }

            $decoded = json_decode((string) wp_remote_retrieve_body($res), true);
            $data    = is_array($decoded) && isset($decoded['data']) && is_array($decoded['data'])
                ? $decoded['data']
                : [];

            foreach ($data as $receipt_id => $receipt) {
                if (
                    is_array($receipt) &&
                    ($receipt['status'] ?? '') === 'error' &&
                    ($receipt['details']['error'] ?? '') === 'DeviceNotRegistered' &&
                    isset($receipt_map[$receipt_id])
                ) {
                    $dead_tokens[] = $receipt_map[$receipt_id];
                }
            }
        }

        self::delete_tokens($dead_tokens);
    }

    public static function delete_tokens(array $tokens): void
    {
        global $wpdb;

        $clean_tokens = array_values(array_unique(array_filter($tokens, 'is_string')));
        if (empty($clean_tokens)) {
            return;
        }

        $table = TSMB_Lifecycle::get_push_tokens_table();
        if ($wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $table)) !== $table) {
            return;
        }

        foreach (array_chunk($clean_tokens, 200) as $batch) {
            $placeholders = implode(',', array_fill(0, count($batch), '%s'));
            $sql = "DELETE FROM {$table} WHERE token IN ({$placeholders})";
            $wpdb->query($wpdb->prepare($sql, ...$batch));
        }
    }

    private static function dispatch_push_to_all_tokens(array $payload): array
    {
        global $wpdb;

        $table = TSMB_Lifecycle::get_push_tokens_table();
        if ($wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $table)) !== $table) {
            return ['success' => false, 'count' => 0, 'pruned' => 0, 'queued' => false, 'error' => 'Push tokens table unavailable.'];
        }

        $total = intval($wpdb->get_var("SELECT COUNT(*) FROM {$table}"));
        if ($total <= 0) {
            return ['success' => false, 'count' => 0, 'pruned' => 0, 'queued' => false, 'error' => 'No registered devices found.'];
        }

        // Queue batch chunks asynchronously via Action Scheduler (with WP-Cron fallback)
        // so large token lists never block an admin HTTP request.
        self::schedule_broadcast_batch($payload, 0);

        return [
            'success' => true,
            'queued'  => true,
            'count'   => $total,
            'pruned'  => 0,
        ];
    }

    private static function schedule_broadcast_batch(array $payload, int $after_id): void
    {
        if (function_exists('as_schedule_single_action')) {
            as_schedule_single_action(time(), self::BATCH_BROADCAST_HOOK, [$payload, $after_id], 'tsmb-push');
            return;
        }
        wp_schedule_single_event(time(), self::BATCH_BROADCAST_HOOK, [$payload, $after_id]);
    }

    public static function process_broadcast_batch(array $payload, int $after_id = 0): void
    {
        global $wpdb;

        $table = TSMB_Lifecycle::get_push_tokens_table();
        if ($wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $table)) !== $table) {
            return;
        }

        $rows = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT id, token FROM {$table} WHERE id > %d ORDER BY id ASC LIMIT %d",
                $after_id,
                self::BROADCAST_CHUNK_SIZE
            ),
            ARRAY_A
        );

        if (empty($rows) || !is_array($rows)) {
            return;
        }

        $batch       = [];
        $last_id     = $after_id;
        $dead_tokens = [];
        $receipt_map = [];

        foreach ($rows as $row) {
            $last_id = max($last_id, intval($row['id'] ?? 0));
            $token   = (string) ($row['token'] ?? '');
            if ($token !== '') {
                $batch[] = $token;
            }
        }

        if (!empty($batch)) {
            $messages = [];
            foreach ($batch as $token) {
                $messages[] = [
                    'to'       => $token,
                    'sound'    => 'default',
                    'title'    => $payload['title'] ?? 'Thriving Skills',
                    'body'     => $payload['body'] ?? '',
                    'data'     => $payload['data'] ?? [],
                    'priority' => 'high',
                ];
            }

            $res = wp_remote_post(self::EXPO_SEND_URL, [
                'headers'  => [
                    'Accept'       => 'application/json',
                    'Content-Type' => 'application/json',
                ],
                'body'     => wp_json_encode($messages),
                'timeout'  => 10,
                'blocking' => true,
            ]);

            if (!is_wp_error($res)) {
                $decoded = json_decode((string) wp_remote_retrieve_body($res), true);
                $tickets = is_array($decoded) && isset($decoded['data']) && is_array($decoded['data'])
                    ? $decoded['data']
                    : [];

                foreach ($tickets as $idx => $ticket) {
                    if (!isset($batch[$idx]) || !is_array($ticket)) {
                        continue;
                    }
                    if (
                        ($ticket['status'] ?? '') === 'error' &&
                        ($ticket['details']['error'] ?? '') === 'DeviceNotRegistered'
                    ) {
                        $dead_tokens[] = $batch[$idx];
                    } elseif (($ticket['status'] ?? '') === 'ok' && !empty($ticket['id'])) {
                        $receipt_map[(string) $ticket['id']] = $batch[$idx];
                    }
                }
            }
        }

        if (!empty($dead_tokens)) {
            self::delete_tokens($dead_tokens);
        }

        if (!empty($receipt_map)) {
            foreach (array_chunk($receipt_map, 500, true) as $offset => $chunk_map) {
                wp_schedule_single_event(
                    time() + (15 * MINUTE_IN_SECONDS) + intval($offset),
                    TSMB_Lifecycle::CRON_RECEIPTS_HOOK,
                    [$chunk_map]
                );
            }
        }

        if (count($rows) === self::BROADCAST_CHUNK_SIZE && $last_id > $after_id) {
            self::schedule_broadcast_batch($payload, $last_id);
        }
    }
}

/* ==========================================================================
   6. WP ADMIN SETTINGS DASHBOARD (MOBILE APP COMMAND CENTER)
   ========================================================================== */

class TSMB_Admin
{
    public static function sanitize_hero_slides(array $raw_slides): array
    {
        $sanitized = [];
        foreach ($raw_slides as $idx => $slide) {
            if (!is_array($slide)) {
                continue;
            }
            if (count($sanitized) >= 20) {
                break;
            }

            $raw_id = sanitize_key((string) ($slide['id'] ?? ('slide_' . ($idx + 1))));
            $title  = sanitize_text_field((string) ($slide['title'] ?? ''));
            if ($title === '') {
                continue;
            }

            $image_raw = trim((string) ($slide['image_url'] ?? ''));
            $image_url = '';
            if ($image_raw !== '') {
                $cleaned_img = esc_url_raw($image_raw, ['https', 'http']);
                if (is_string($cleaned_img) && preg_match('#^https?://#i', $cleaned_img)) {
                    $image_url = $cleaned_img;
                }
            }

            $target_raw = trim(sanitize_text_field((string) ($slide['target'] ?? '')));
            $target     = '';
            if ($target_raw !== '') {
                if (preg_match('#^https?://#i', $target_raw)) {
                    $target = esc_url_raw($target_raw, ['https', 'http']);
                } elseif (!preg_match('/^[a-zA-Z][a-zA-Z0-9+.-]*:/', $target_raw)) {
                    $target = $target_raw;
                }
            }

            $sanitized[] = [
                'id'          => $raw_id !== '' ? $raw_id : ('slide_' . ($idx + 1)),
                'tag'         => sanitize_text_field((string) ($slide['tag'] ?? '')),
                'title'       => $title,
                'subtitle'    => sanitize_text_field((string) ($slide['subtitle'] ?? '')),
                'button_text' => sanitize_text_field((string) ($slide['button_text'] ?? '')),
                'image_url'   => $image_url,
                'target'      => $target,
            ];
        }

        return $sanitized;
    }

    public static function init(): void
    {
        add_action('admin_menu', [__CLASS__, 'add_menu']);
        add_action('admin_init', [__CLASS__, 'handle_actions']);
    }

    public static function add_menu(): void
    {
        add_menu_page(
            'Thriving Skills Mobile App Command Center',
            'Mobile App',
            'manage_options',
            'thriving-skills-app',
            [__CLASS__, 'render_page'],
            'dashicons-smartphone',
            30
        );
    }

    public static function handle_actions(): void
    {
        if (isset($_POST['tsmb_send_push_broadcast'])) {
            check_admin_referer('tsmb_push_broadcast_nonce');
            if (!current_user_can('manage_options')) {
                return;
            }

            $title  = sanitize_text_field(wp_unslash($_POST['push_title'] ?? ''));
            $body   = sanitize_textarea_field(wp_unslash($_POST['push_message'] ?? ''));
            $screen = sanitize_text_field(wp_unslash($_POST['push_screen'] ?? 'home'));
            $target = sanitize_text_field(wp_unslash($_POST['push_target_id'] ?? ''));

            if ($title === '' || $body === '') {
                add_settings_error('tsmb_notices', 'push_empty', 'Please enter both Title and Message for the push notification.', 'error');
                return;
            }

            $data = ['screen' => $screen];
            if ($target !== '') {
                $data['course_id'] = $target;
                $data['courseId']  = $target;
                $data['url']       = $target;
            }

            $res = TSMB_Notifications::send_broadcast($title, $body, $data);
            if ($res['success']) {
                $msg = !empty($res['queued'])
                    ? sprintf('Push broadcast queued for %d active devices via background batching.', intval($res['count']))
                    : sprintf('Push broadcast dispatched to %d active devices (%d invalid tokens pruned).', intval($res['count']), intval($res['pruned'] ?? 0));
                add_settings_error('tsmb_notices', 'push_sent', $msg, 'updated');
            } else {
                add_settings_error('tsmb_notices', 'push_err', 'Notice: ' . esc_html((string) ($res['error'] ?? '')), 'warning');
            }
            return;
        }

        if (isset($_POST['tsmb_save_settings'])) {
            check_admin_referer('tsmb_save_settings_nonce');
            if (!current_user_can('manage_options')) {
                return;
            }

            $submitted_tab = sanitize_key(wp_unslash($_GET['tab'] ?? ''));

            if ($submitted_tab === 'version') {
                update_option('tsmb_min_app_version', sanitize_text_field(wp_unslash($_POST['min_version'] ?? '1.0.0')));
                update_option('tsmb_latest_app_version', sanitize_text_field(wp_unslash($_POST['latest_version'] ?? '1.4.0')));
                update_option('tsmb_maintenance_mode', isset($_POST['maintenance_mode']) ? 1 : 0);
                update_option('tsmb_android_sha256_fingerprints', sanitize_textarea_field(wp_unslash($_POST['android_sha256_fingerprints'] ?? '')));
                update_option('tsmb_trust_proxy_headers', isset($_POST['trust_proxy_headers']) ? '1' : '0');
                $allowed_headers = ['HTTP_CF_CONNECTING_IP', 'HTTP_X_REAL_IP', 'REMOTE_ADDR'];
                $chosen_header = sanitize_text_field(wp_unslash($_POST['trusted_proxy_header'] ?? 'HTTP_CF_CONNECTING_IP'));
                update_option(
                    'tsmb_trusted_proxy_header',
                    in_array($chosen_header, $allowed_headers, true) ? $chosen_header : 'HTTP_CF_CONNECTING_IP'
                );
                update_option(
                    'tsmb_trusted_proxy_ips',
                    sanitize_textarea_field(wp_unslash($_POST['trusted_proxy_ips'] ?? ''))
                );
            } elseif ($submitted_tab === 'banners') {
                update_option('tsmb_banner_active', isset($_POST['banner_active']) ? 1 : 0);
                update_option('tsmb_banner_text', sanitize_text_field(wp_unslash($_POST['banner_text'] ?? '')));
                update_option('tsmb_banner_link', sanitize_text_field(wp_unslash($_POST['banner_link'] ?? '')));

                if (isset($_POST['hero_slides_json'])) {
                    $raw_json = wp_unslash((string) $_POST['hero_slides_json']);
                    $decoded  = json_decode($raw_json, true);
                    if (is_array($decoded)) {
                        $sanitized_slides = self::sanitize_hero_slides($decoded);
                        update_option('tsmb_hero_slides', $sanitized_slides);
                    } else {
                        add_settings_error(
                            'tsmb_notices',
                            'invalid_hero_json',
                            'Hero slides JSON must be a valid JSON array.',
                            'error'
                        );
                    }
                }
            } elseif ($submitted_tab === 'flash') {
                $flash_active = isset($_POST['flash_active']) ? 1 : 0;
                $flash_end    = trim(sanitize_text_field(wp_unslash($_POST['flash_end'] ?? '')));
                $flash_end_dt = $flash_end !== '' ? date_create_immutable($flash_end, wp_timezone()) : false;

                if ($flash_active && ($flash_end_dt === false || $flash_end_dt->getTimestamp() <= current_datetime()->getTimestamp())) {
                    add_settings_error(
                        'tsmb_notices',
                        'flash_invalid_end',
                        'Flash sale requires a valid future End Date & Time in the WordPress timezone (YYYY-MM-DD HH:MM:SS). Countdown banner remains hidden until a future end time is saved.',
                        'warning'
                    );
                }

                update_option('tsmb_flash_active', $flash_active);
                update_option('tsmb_flash_title', sanitize_text_field(wp_unslash($_POST['flash_title'] ?? '')));
                update_option('tsmb_flash_code', sanitize_text_field(wp_unslash($_POST['flash_code'] ?? '')));
                update_option('tsmb_flash_discount', max(0, min(100, intval($_POST['flash_discount'] ?? 0))));
                update_option('tsmb_flash_end', $flash_end);
            } elseif ($submitted_tab === 'chips') {
                update_option('tsmb_trending_keywords', sanitize_text_field(wp_unslash($_POST['trending_keywords'] ?? '')));
                update_option('tsmb_support_whatsapp', sanitize_text_field(wp_unslash($_POST['support_whatsapp'] ?? '')));
                update_option('tsmb_support_email', sanitize_email(wp_unslash($_POST['support_email'] ?? '')));
                update_option('tsmb_support_helpline', sanitize_text_field(wp_unslash($_POST['support_helpline'] ?? '')));
            }

            if (isset($_POST['purge_cache'])) {
                TSMB_Rest_API::clear_feed_cache();
                add_settings_error('tsmb_notices', 'cache_purged', 'Mobile feed cache purged successfully!', 'updated');
            } else {
                add_settings_error('tsmb_notices', 'settings_saved', 'Mobile App Command Center settings saved successfully!', 'updated');
            }
            return;
        }

        if (isset($_POST['tsmb_update_ticket'])) {
            check_admin_referer('tsmb_update_ticket_nonce');
            if (!current_user_can('manage_options')) {
                return;
            }
            global $wpdb;
            TSMB_Lifecycle::maybe_upgrade();
            $ticket_id = sanitize_text_field(wp_unslash($_POST['ticket_id'] ?? ''));
            $status    = sanitize_key(wp_unslash($_POST['ticket_status'] ?? 'open'));
            $reply     = sanitize_textarea_field(wp_unslash($_POST['admin_reply'] ?? ''));
            if (!in_array($status, ['open', 'in_progress', 'resolved'], true)) {
                $status = 'open';
            }
            if ($ticket_id !== '') {
                $wpdb->update(
                    TSMB_Lifecycle::get_tickets_table(),
                    [
                        'status'      => $status,
                        'admin_reply' => substr($reply, 0, 2000),
                        'updated_at'  => current_time('mysql', true),
                    ],
                    ['ticket_id' => $ticket_id],
                    ['%s', '%s', '%s'],
                    ['%s']
                );
                add_settings_error('tsmb_notices', 'ticket_updated', 'Support ticket ' . esc_html($ticket_id) . ' updated.', 'updated');
            }
            return;
        }

        if (isset($_POST['tsmb_update_lead'])) {
            check_admin_referer('tsmb_update_lead_nonce');
            if (!current_user_can('manage_options')) {
                return;
            }
            global $wpdb;
            TSMB_Lifecycle::maybe_upgrade();
            $reference_id = sanitize_text_field(wp_unslash($_POST['reference_id'] ?? ''));
            $status       = sanitize_key(wp_unslash($_POST['lead_status'] ?? 'new'));
            if (!in_array($status, ['new', 'contacted', 'closed'], true)) {
                $status = 'new';
            }
            if ($reference_id !== '') {
                $wpdb->update(
                    TSMB_Lifecycle::get_leads_table(),
                    [
                        'status'     => $status,
                        'updated_at' => current_time('mysql', true),
                    ],
                    ['reference_id' => $reference_id],
                    ['%s', '%s'],
                    ['%s']
                );
                add_settings_error('tsmb_notices', 'lead_updated', 'Corporate inquiry ' . esc_html($reference_id) . ' updated.', 'updated');
            }
        }
    }

    public static function render_page(): void
    {
        $active_tab = isset($_GET['tab']) ? sanitize_key(wp_unslash($_GET['tab'])) : 'broadcast';

        $min_version    = get_option('tsmb_min_app_version', '1.0.0');
        $latest_version = get_option('tsmb_latest_app_version', '1.4.0');
        $maintenance    = (bool) get_option('tsmb_maintenance_mode', false);
        $banner_active  = (bool) get_option('tsmb_banner_active', false);
        $banner_text    = (string) get_option('tsmb_banner_text', '');
        $banner_link    = (string) get_option('tsmb_banner_link', '');

        $flash_active   = (bool) get_option('tsmb_flash_active', false);
        $flash_title    = (string) get_option('tsmb_flash_title', '');
        $flash_code     = (string) get_option('tsmb_flash_code', '');
        $flash_discount = max(0, min(100, intval(get_option('tsmb_flash_discount', 0))));
        $flash_end      = (string) get_option('tsmb_flash_end', '');

        $trending_raw   = (string) get_option('tsmb_trending_keywords', '');
        $support_wa     = (string) get_option('tsmb_support_whatsapp', '');
        $support_mail   = (string) get_option('tsmb_support_email', '');
        $support_phone  = (string) get_option('tsmb_support_helpline', '');

        $hero_slides    = get_option('tsmb_hero_slides', []);
        $total_devices  = TSMB_Notifications::get_registered_count();
        ?>
        <div class="wrap">
            <h1><span class="dashicons dashicons-smartphone" style="font-size:32px;line-height:1;margin-right:10px;color:#102F53;"></span> Thriving Skills Mobile Command Center</h1>
            <p style="color:#64748b;margin-bottom:16px;">Live control over mobile banners, push notifications, flash sales, search keywords, security, and remote configuration.</p>

            <?php settings_errors('tsmb_notices'); ?>

            <h2 class="nav-tab-wrapper" style="margin-bottom:20px;">
                <a href="?page=thriving-skills-app&tab=broadcast" class="nav-tab <?php echo $active_tab === 'broadcast' ? 'nav-tab-active' : ''; ?>">1-Click Push Broadcast</a>
                <a href="?page=thriving-skills-app&tab=banners" class="nav-tab <?php echo $active_tab === 'banners' ? 'nav-tab-active' : ''; ?>">Hero Slides &amp; Banners</a>
                <a href="?page=thriving-skills-app&tab=flash" class="nav-tab <?php echo $active_tab === 'flash' ? 'nav-tab-active' : ''; ?>">Flash Sale &amp; Countdown</a>
                <a href="?page=thriving-skills-app&tab=chips" class="nav-tab <?php echo $active_tab === 'chips' ? 'nav-tab-active' : ''; ?>">Trending Search &amp; Support</a>
                <a href="?page=thriving-skills-app&tab=version" class="nav-tab <?php echo $active_tab === 'version' ? 'nav-tab-active' : ''; ?>">App Version &amp; Security</a>
                <a href="?page=thriving-skills-app&tab=inbox" class="nav-tab <?php echo $active_tab === 'inbox' ? 'nav-tab-active' : ''; ?>">Support &amp; Leads</a>
            </h2>

            <div style="display:flex;gap:24px;flex-wrap:wrap;">
                <div style="flex:2.5;min-width:320px;background:#fff;padding:24px;border:1px solid #ccd0d4;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">

                    <?php if ($active_tab === 'broadcast') : ?>
                        <h2 style="margin-top:0;">1-Click Push Notification Broadcaster</h2>
                        <p style="color:#64748b;">Send push alerts to all <?php echo intval($total_devices); ?> registered authenticated Android and iOS devices. Dead Expo tokens are pruned automatically.</p>

                        <form method="post" action="?page=thriving-skills-app&tab=broadcast">
                            <?php wp_nonce_field('tsmb_push_broadcast_nonce'); ?>
                            <table class="form-table">
                                <tr>
                                    <th scope="row"><label for="push_title">Notification Title *</label></th>
                                    <td><input name="push_title" type="text" id="push_title" class="large-text" placeholder="e.g. Live Workshop Starting Soon" required /></td>
                                </tr>
                                <tr>
                                    <th scope="row"><label for="push_message">Message Body *</label></th>
                                    <td><textarea name="push_message" id="push_message" rows="3" class="large-text" required></textarea></td>
                                </tr>
                                <tr>
                                    <th scope="row"><label for="push_screen">Target Screen on Tap</label></th>
                                    <td>
                                        <select name="push_screen" id="push_screen">
                                            <option value="home">Home Feed (Default)</option>
                                            <option value="CourseDetail">Specific Course (Requires Course ID)</option>
                                            <option value="summit">Bangladesh Skills Summit</option>
                                            <option value="catalog">Browse Courses Catalog</option>
                                            <option value="url">External Link / Web Page</option>
                                        </select>
                                    </td>
                                </tr>
                                <tr>
                                    <th scope="row"><label for="push_target_id">Course ID or URL (Optional)</label></th>
                                    <td>
                                        <input name="push_target_id" type="text" id="push_target_id" class="regular-text" placeholder="e.g. 1284 or https://..." />
                                    </td>
                                </tr>
                            </table>

                            <p class="submit">
                                <button type="submit" name="tsmb_send_push_broadcast" class="button button-primary button-hero" onclick="return confirm('Broadcast this notification to all active devices now?');" style="background:#102F53;border-color:#102F53;">
                                    Broadcast Push Alert Now
                                </button>
                            </p>
                        </form>

                    <?php elseif ($active_tab === 'banners') : ?>
                        <h2 style="margin-top:0;">Hero Slides &amp; Announcement Banner</h2>
                        <form method="post" action="?page=thriving-skills-app&tab=banners">
                            <?php wp_nonce_field('tsmb_save_settings_nonce'); ?>

                            <h3>Top Highlight Announcement</h3>
                            <table class="form-table">
                                <tr>
                                    <th scope="row">Enable Banner</th>
                                    <td><label><input name="banner_active" type="checkbox" value="1" <?php checked($banner_active, true); ?> /> Display highlight bar on the mobile Home feed.</label></td>
                                </tr>
                                <tr>
                                    <th scope="row">Banner Text</th>
                                    <td><input name="banner_text" type="text" value="<?php echo esc_attr($banner_text); ?>" class="large-text" /></td>
                                </tr>
                                <tr>
                                    <th scope="row">Target Action</th>
                                    <td><input name="banner_link" type="text" value="<?php echo esc_attr($banner_link); ?>" class="regular-text" placeholder="summit or https://..." /></td>
                                </tr>
                            </table>

                            <hr style="margin:24px 0;" />

                            <h3>Home Feed Hero Carousel Slides</h3>
                            <textarea name="hero_slides_json" id="hero_slides_json" rows="8" class="large-text code" style="font-family:monospace;"><?php echo esc_textarea(wp_json_encode($hero_slides, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)); ?></textarea>
                            <p class="description">JSON array of custom slide titles, badges, and background banner image URLs.</p>

                            <p class="submit">
                                <input type="submit" name="tsmb_save_settings" class="button button-primary" value="Save Banner Settings" />
                            </p>
                        </form>

                    <?php elseif ($active_tab === 'flash') : ?>
                        <h2 style="margin-top:0;">Flash Sale &amp; Live Countdown Campaign</h2>
                        <form method="post" action="?page=thriving-skills-app&tab=flash">
                            <?php wp_nonce_field('tsmb_save_settings_nonce'); ?>
                            <table class="form-table">
                                <tr>
                                    <th scope="row">Enable Flash Sale</th>
                                    <td><label><input name="flash_active" type="checkbox" value="1" <?php checked($flash_active, true); ?> /> Display countdown banner while end date is in the future.</label></td>
                                </tr>
                                <tr>
                                    <th scope="row">Campaign Title</th>
                                    <td><input name="flash_title" type="text" value="<?php echo esc_attr($flash_title); ?>" class="large-text" /></td>
                                </tr>
                                <tr>
                                    <th scope="row">Coupon Code</th>
                                    <td><input name="flash_code" type="text" value="<?php echo esc_attr($flash_code); ?>" class="regular-text" /></td>
                                </tr>
                                <tr>
                                    <th scope="row">Discount Percentage (%)</th>
                                    <td><input name="flash_discount" type="number" min="0" max="100" value="<?php echo esc_attr((string) $flash_discount); ?>" class="small-text" /> %</td>
                                </tr>
                                <tr>
                                    <th scope="row">Sale End Date &amp; Time (Site TZ: <?php echo esc_html(wp_timezone_string()); ?>)</th>
                                    <td>
                                        <input name="flash_end" type="text" value="<?php echo esc_attr($flash_end); ?>" class="regular-text" placeholder="YYYY-MM-DD HH:MM:SS" />
                                        <p class="description">Required for an active flash sale. Automatically hides when past due.</p>
                                    </td>
                                </tr>
                            </table>

                            <p class="submit">
                                <input type="submit" name="tsmb_save_settings" class="button button-primary" value="Save Flash Sale Campaign" />
                            </p>
                        </form>

                    <?php elseif ($active_tab === 'chips') : ?>
                        <h2 style="margin-top:0;">Trending Search Chips &amp; Learner Support</h2>
                        <form method="post" action="?page=thriving-skills-app&tab=chips">
                            <?php wp_nonce_field('tsmb_save_settings_nonce'); ?>

                            <h3>Trending Search Keywords</h3>
                            <table class="form-table">
                                <tr>
                                    <th scope="row">Search Pills</th>
                                    <td>
                                        <input name="trending_keywords" type="text" value="<?php echo esc_attr($trending_raw); ?>" class="large-text" placeholder="Comma-separated keywords" />
                                    </td>
                                </tr>
                            </table>

                            <hr style="margin:24px 0;" />

                            <h3>Learner Support &amp; Hotlines (Optional Overrides)</h3>
                            <table class="form-table">
                                <tr>
                                    <th scope="row">WhatsApp Hotline</th>
                                    <td><input name="support_whatsapp" type="text" value="<?php echo esc_attr($support_wa); ?>" class="regular-text" placeholder="Leave blank if unset" /></td>
                                </tr>
                                <tr>
                                    <th scope="row">Support Email</th>
                                    <td><input name="support_email" type="email" value="<?php echo esc_attr($support_mail); ?>" class="regular-text" placeholder="Leave blank if unset" /></td>
                                </tr>
                                <tr>
                                    <th scope="row">Helpline Phone</th>
                                    <td><input name="support_helpline" type="text" value="<?php echo esc_attr($support_phone); ?>" class="regular-text" placeholder="Leave blank if unset" /></td>
                                </tr>
                            </table>

                            <p class="submit">
                                <input type="submit" name="tsmb_save_settings" class="button button-primary" value="Save Search &amp; Support Settings" />
                            </p>
                        </form>

                    <?php elseif ($active_tab === 'version') : ?>
                        <h2 style="margin-top:0;">App Version Control, Deep Links &amp; Security</h2>
                        <form method="post" action="?page=thriving-skills-app&tab=version">
                            <?php wp_nonce_field('tsmb_save_settings_nonce'); ?>
                            <table class="form-table">
                                <tr>
                                    <th scope="row">Minimum Supported Version</th>
                                    <td><input name="min_version" type="text" value="<?php echo esc_attr($min_version); ?>" class="regular-text" placeholder="1.0.0" /></td>
                                </tr>
                                <tr>
                                    <th scope="row">Latest Store Version</th>
                                    <td><input name="latest_version" type="text" value="<?php echo esc_attr($latest_version); ?>" class="regular-text" placeholder="1.4.0" /></td>
                                </tr>
                                <tr>
                                    <th scope="row">Maintenance Mode</th>
                                    <td><label><input name="maintenance_mode" type="checkbox" value="1" <?php checked($maintenance, true); ?> /> Display a maintenance notice on mobile.</label></td>
                                </tr>
                                <tr>
                                    <th scope="row">Android App Links SHA-256 Fingerprints</th>
                                    <td>
                                        <textarea name="android_sha256_fingerprints" rows="3" class="large-text code" placeholder="AA:BB:CC:... (one SHA-256 per line)"><?php echo esc_textarea((string) get_option('tsmb_android_sha256_fingerprints', '')); ?></textarea>
                                        <p class="description">Served live at <code>/.well-known/assetlinks.json</code> for Android <code>autoVerify</code> App Links.</p>
                                    </td>
                                </tr>
                            </table>

                            <hr style="margin:24px 0;" />

                            <h3>Rate Limiting &amp; Reverse Proxy IP Security</h3>
                            <table class="form-table">
                                <tr>
                                    <th scope="row">Trust Reverse Proxy Header</th>
                                    <td>
                                        <label>
                                            <input name="trust_proxy_headers" type="checkbox" value="1" <?php checked(get_option('tsmb_trust_proxy_headers', '0'), '1'); ?> />
                                            Honor a single reverse proxy client IP header instead of <code>REMOTE_ADDR</code>.
                                        </label>
                                        <p class="description"><strong>Warning:</strong> Only enable if direct origin access is blocked at your firewall/Cloudflare Origin Rules.</p>
                                    </td>
                                </tr>
                                <tr>
                                    <th scope="row"><label for="trusted_proxy_header">Trusted Header</label></th>
                                    <td>
                                        <?php $cur_hdr = TSMB_Security::get_trusted_proxy_header(); ?>
                                        <select name="trusted_proxy_header" id="trusted_proxy_header">
                                            <option value="HTTP_CF_CONNECTING_IP" <?php selected($cur_hdr, 'HTTP_CF_CONNECTING_IP'); ?>>CF-Connecting-IP (Cloudflare)</option>
                                            <option value="HTTP_X_REAL_IP" <?php selected($cur_hdr, 'HTTP_X_REAL_IP'); ?>>X-Real-IP (Nginx)</option>
                                            <option value="REMOTE_ADDR" <?php selected($cur_hdr, 'REMOTE_ADDR'); ?>>REMOTE_ADDR Only</option>
                                        </select>
                                    </td>
                                </tr>
                                <tr>
                                    <th scope="row"><label for="trusted_proxy_ips">Allowed Proxy <code>REMOTE_ADDR</code> IPs (Optional)</label></th>
                                    <td>
                                        <textarea name="trusted_proxy_ips" id="trusted_proxy_ips" rows="2" class="regular-text code" placeholder="127.0.0.1"><?php echo esc_textarea((string) get_option('tsmb_trusted_proxy_ips', '')); ?></textarea>
                                        <p class="description">Comma/newline separated proxy peer IPs allowed to forward the chosen header.</p>
                                    </td>
                                </tr>
                            </table>

                            <p class="submit" style="display:flex;gap:12px;align-items:center;">
                                <input type="submit" name="tsmb_save_settings" class="button button-primary" value="Save Settings" />
                                <input type="submit" name="purge_cache" class="button button-secondary" value="Purge Mobile Feed Cache" />
                            </p>
                        </form>
                    <?php elseif ($active_tab === 'inbox') : ?>
                        <?php
                        global $wpdb;
                        TSMB_Lifecycle::maybe_upgrade();
                        $tickets_table = TSMB_Lifecycle::get_tickets_table();
                        $leads_table   = TSMB_Lifecycle::get_leads_table();
                        $tickets       = $wpdb->get_results("SELECT * FROM {$tickets_table} ORDER BY id DESC LIMIT 30", ARRAY_A);
                        $leads         = $wpdb->get_results("SELECT * FROM {$leads_table} ORDER BY id DESC LIMIT 30", ARRAY_A);
                        ?>
                        <h2 style="margin-top:0;">Learner Support Tickets</h2>
                        <?php if (empty($tickets)) : ?>
                            <p style="color:#64748b;">No support tickets submitted yet.</p>
                        <?php else : ?>
                            <table class="widefat striped" style="margin-bottom:24px;">
                                <thead>
                                    <tr>
                                        <th>Ticket</th>
                                        <th>Topic &amp; Learner</th>
                                        <th>Message</th>
                                        <th>Status &amp; Reply</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php foreach ($tickets as $t) : ?>
                                        <tr>
                                            <td>
                                                <strong><?php echo esc_html((string) ($t['ticket_id'] ?? '')); ?></strong><br />
                                                <small><?php echo esc_html((string) ($t['created_at'] ?? '')); ?></small>
                                            </td>
                                            <td>
                                                <code><?php echo esc_html((string) ($t['topic'] ?? 'general')); ?></code><br />
                                                <small>UID #<?php echo intval($t['user_id'] ?? 0); ?> • <?php echo esc_html((string) ($t['contact_email'] ?? '')); ?></small>
                                            </td>
                                            <td>
                                                <strong><?php echo esc_html((string) ($t['subject'] ?? '')); ?></strong>
                                                <p style="margin:4px 0 0;"><?php echo esc_html((string) ($t['message'] ?? '')); ?></p>
                                            </td>
                                            <td>
                                                <form method="post" action="?page=thriving-skills-app&tab=inbox">
                                                    <?php wp_nonce_field('tsmb_update_ticket_nonce'); ?>
                                                    <input type="hidden" name="ticket_id" value="<?php echo esc_attr((string) ($t['ticket_id'] ?? '')); ?>" />
                                                    <select name="ticket_status" style="margin-bottom:6px;width:100%;">
                                                        <option value="open" <?php selected((string) ($t['status'] ?? 'open'), 'open'); ?>>Open</option>
                                                        <option value="in_progress" <?php selected((string) ($t['status'] ?? ''), 'in_progress'); ?>>In Progress</option>
                                                        <option value="resolved" <?php selected((string) ($t['status'] ?? ''), 'resolved'); ?>>Resolved</option>
                                                    </select>
                                                    <textarea name="admin_reply" rows="2" class="large-text" placeholder="Advisor reply visible to learner..."><?php echo esc_textarea((string) ($t['admin_reply'] ?? '')); ?></textarea>
                                                    <button type="submit" name="tsmb_update_ticket" class="button button-small button-primary" style="margin-top:6px;">Save</button>
                                                </form>
                                            </td>
                                        </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                        <?php endif; ?>

                        <hr style="margin:24px 0;" />
                        <h2>Corporate &amp; Enterprise Leads</h2>
                        <?php if (empty($leads)) : ?>
                            <p style="color:#64748b;">No corporate inquiries submitted yet.</p>
                        <?php else : ?>
                            <table class="widefat striped">
                                <thead>
                                    <tr>
                                        <th>Reference</th>
                                        <th>Company &amp; Contact</th>
                                        <th>Solution &amp; Team Size</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php foreach ($leads as $l) : ?>
                                        <tr>
                                            <td>
                                                <strong><?php echo esc_html((string) ($l['reference_id'] ?? '')); ?></strong><br />
                                                <small><?php echo esc_html((string) ($l['created_at'] ?? '')); ?></small>
                                            </td>
                                            <td>
                                                <strong><?php echo esc_html((string) ($l['company_name'] ?? '')); ?></strong><br />
                                                <?php echo esc_html((string) ($l['contact_name'] ?? '')); ?> (<?php echo esc_html((string) ($l['work_email'] ?? '')); ?>)<br />
                                                <small><?php echo esc_html((string) ($l['phone'] ?? '')); ?></small>
                                            </td>
                                            <td>
                                                <strong><?php echo esc_html((string) ($l['service_type'] ?? '')); ?></strong><br />
                                                <small>Team: <?php echo esc_html((string) ($l['team_size'] ?? '')); ?></small>
                                            </td>
                                            <td>
                                                <form method="post" action="?page=thriving-skills-app&tab=inbox">
                                                    <?php wp_nonce_field('tsmb_update_lead_nonce'); ?>
                                                    <input type="hidden" name="reference_id" value="<?php echo esc_attr((string) ($l['reference_id'] ?? '')); ?>" />
                                                    <select name="lead_status" style="margin-bottom:6px;">
                                                        <option value="new" <?php selected((string) ($l['status'] ?? 'new'), 'new'); ?>>New</option>
                                                        <option value="contacted" <?php selected((string) ($l['status'] ?? ''), 'contacted'); ?>>Contacted</option>
                                                        <option value="closed" <?php selected((string) ($l['status'] ?? ''), 'closed'); ?>>Closed</option>
                                                    </select>
                                                    <button type="submit" name="tsmb_update_lead" class="button button-small">Update</button>
                                                </form>
                                            </td>
                                        </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                        <?php endif; ?>
                    <?php endif; ?>

                </div>

                <div style="flex:1;min-width:260px;background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-radius:8px;height:fit-content;">
                    <h3 style="margin-top:0;">Ecosystem Status</h3>

                    <div style="background:#fff;padding:12px 16px;border-radius:6px;border:1px solid #e2e8f0;margin-bottom:12px;">
                        <div style="font-size:12px;color:#64748b;">Registered Push Devices</div>
                        <div style="font-size:24px;font-weight:700;color:#102F53;"><?php echo intval($total_devices); ?></div>
                    </div>

                    <div style="background:#fff;padding:12px 16px;border-radius:6px;border:1px solid #e2e8f0;margin-bottom:12px;">
                        <div style="font-size:12px;color:#64748b;">Checkout Policy</div>
                        <div style="font-weight:600;color:#0369a1;margin-top:2px;">WebView (Google Play Safe)</div>
                    </div>

                    <div style="background:#fff;padding:12px 16px;border-radius:6px;border:1px solid #e2e8f0;margin-bottom:16px;">
                        <div style="font-size:12px;color:#64748b;">Feed Cache Version</div>
                        <div style="margin-top:2px;font-weight:600;color:#15803d;">v<?php echo intval(get_option('tsmb_feed_cache_ver', 1)); ?> (Scoped per limit/page)</div>
                    </div>

                    <hr style="margin:16px 0;border:0;border-top:1px solid #cbd5e1;" />
                    <h4 style="margin:0 0 8px 0;font-size:13px;">REST Endpoints</h4>
                    <ul style="font-size:11px;color:#475569;line-height:1.7;padding-left:14px;margin:0;">
                        <li><code>/wp-json/thrivingskill/v1/config</code></li>
                        <li><code>/wp-json/thrivingskill/v1/feed</code></li>
                        <li><code>/wp-json/thrivingskill/v1/lessons/{id}</code></li>
                        <li><code>/wp-json/thrivingskill/v1/register</code></li>
                        <li><code>/wp-json/thrivingskill/v1/verify-registration</code></li>
                        <li><code>/wp-json/thrivingskill/v1/register-push-token</code></li>
                        <li><code>/wp-json/thrivingskill/v1/auth/webview-handoff</code></li>
                        <li><code>/wp-json/thrivingskill/v1/learning-state</code></li>
                        <li><code>/wp-json/thrivingskill/v1/engagement-sync</code></li>
                        <li><code>/wp-json/thrivingskill/v1/courses/{id}/submit-review</code></li>
                        <li><code>/wp-json/thrivingskill/v1/certificates/verify</code></li>
                        <li><code>/wp-json/thrivingskill/v1/corporate-inquiry</code></li>
                        <li><code>/wp-json/thrivingskill/v1/support-tickets</code></li>
                    </ul>
                </div>
            </div>
        </div>
        <?php
    }
}

/* ==========================================================================
   7. BOOTSTRAP INITIALIZATION
   ========================================================================== */

function tsmb_init_plugin(): void
{
    TSMB_Lifecycle::maybe_upgrade();
    TSMB_Security::init();
    TSMB_Rest_API::init();
    TSMB_Notifications::init();
    if (is_admin()) {
        TSMB_Admin::init();
    }
}
add_action('plugins_loaded', 'tsmb_init_plugin');
