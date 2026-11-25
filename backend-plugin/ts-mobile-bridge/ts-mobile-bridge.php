<?php
/**
 * Plugin Name: TS Mobile Bridge
 * Plugin URI: https://thrivingskill.com
 * Description: Hardened mobile REST API bridge, remote configuration, push notification engine, OTP auth, and Mobile App Command Center for Thriving Skills.
 * Version: 1.2.0
 * Requires PHP: 7.4
 * Author: Thriving Skills Engineering
 * Author URI: https://thrivingskill.com
 * License: GPLv2 or later
 * Text Domain: ts-mobile-bridge
 */

if (!defined('ABSPATH')) {
    exit;
}

define('TSMB_VERSION', '1.2.0');
define('TSMB_DB_VERSION', '1.2.0');

/* ==========================================================================
   1. PLUGIN LIFECYCLE (SCHEMA, MIGRATIONS & UNINSTALL CLEANUP)
   ========================================================================== */

class TSMB_Lifecycle
{
    public const DB_VERSION_OPTION = 'tsmb_db_version';
    public const PUSH_TABLE_SUFFIX = 'tsmb_push_tokens';
    public const CRON_RECEIPTS_HOOK = 'tsmb_process_expo_receipts';

    public static function get_push_tokens_table(): string
    {
        global $wpdb;
        return $wpdb->prefix . self::PUSH_TABLE_SUFFIX;
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

        $table_name = self::get_push_tokens_table();
        $charset_collate = $wpdb->get_charset_collate();

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';

        $sql = "CREATE TABLE {$table_name} (
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

        dbDelta($sql);
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

        $table_name = self::get_push_tokens_table();
        $wpdb->query("DROP TABLE IF EXISTS {$table_name}");

        wp_clear_scheduled_hook(self::CRON_RECEIPTS_HOOK);
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

    public static function init(): void
    {
        add_filter('determine_current_user', [__CLASS__, 'determine_current_user'], 20);
    }

    public static function get_client_ip(): string
    {
        $raw = isset($_SERVER['REMOTE_ADDR']) ? wp_unslash((string) $_SERVER['REMOTE_ADDR']) : '';
        $clean = sanitize_text_field($raw);
        if (filter_var($clean, FILTER_VALIDATE_IP)) {
            return $clean;
        }
        return '0.0.0.0';
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
        $header = self::base64url_encode(wp_json_encode([
            'alg' => 'HS256',
            'typ' => 'JWT',
        ]));
        $payload = self::base64url_encode(wp_json_encode([
            'iss' => self::JWT_ISSUER,
            'sub' => $user_id,
            'iat' => $now,
            'exp' => $now + $ttl,
            'jti' => bin2hex(random_bytes(8)),
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

        return $sub;
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

    public static function init(): void
    {
        add_action('rest_api_init', [__CLASS__, 'register_routes']);
        add_action('save_post_lp_course', [__CLASS__, 'clear_feed_cache']);
        add_filter('rest_request_before_callbacks', [__CLASS__, 'guard_learnpress_paid_enroll'], 10, 3);
        add_filter('learn_press_user_can_enroll_course', [__CLASS__, 'filter_learnpress_can_enroll_course'], 10, 3);
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
        $auth_check = self::check_authenticated_user();
        if (is_wp_error($auth_check)) {
            return $auth_check;
        }

        if (current_user_can('manage_options')) {
            return true;
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

        $lesson_id = absint($request['id']);
        $post      = get_post($lesson_id);

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
        $auth_check = self::check_authenticated_user();
        if (is_wp_error($auth_check)) {
            return $auth_check;
        }

        $lesson_id = absint($request['id']);
        $post      = get_post($lesson_id);
        $is_admin  = current_user_can('manage_options');

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

        if (!$is_admin && !self::is_user_enrolled_in_any_lesson_course(get_current_user_id(), $lesson_id)) {
            return new WP_Error(
                'tsmb_not_enrolled',
                __('You must be enrolled in this course to access this lesson.', 'ts-mobile-bridge'),
                ['status' => 403]
            );
        }

        $video_intro = get_post_meta($lesson_id, '_lp_lesson_video_intro', true);
        $video_url   = get_post_meta($lesson_id, 'video_url', true);

        $parsed_video_url = '';
        $video_type       = 'none';
        $video_id         = null;

        if (!empty($video_url)) {
            $parsed_video_url = html_entity_decode((string) $video_url, ENT_QUOTES, 'UTF-8');
        } elseif (!empty($video_intro)) {
            if (preg_match('/src=["\']([^"\']+)["\']/i', (string) $video_intro, $matches)) {
                $parsed_video_url = html_entity_decode($matches[1], ENT_QUOTES, 'UTF-8');
            } elseif (filter_var($video_intro, FILTER_VALIDATE_URL)) {
                $parsed_video_url = (string) $video_intro;
            }
        }

        if (!empty($parsed_video_url)) {
            if (strpos($parsed_video_url, 'vimeo.com') !== false) {
                if (preg_match('/(?:player\.vimeo\.com\/video\/|vimeo\.com\/(?:channels\/[^\/]+\/|groups\/[^\/]+\/videos\/|video\/)?)(\d+)/i', $parsed_video_url, $id_matches)) {
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
            } elseif (preg_match('/\.(mp4|m3u8|webm)($|\?)/i', $parsed_video_url)) {
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

    public static function filter_learnpress_can_enroll_course($can_enroll, $course_id, $user_id = 0)
    {
        if (!$can_enroll) {
            return false;
        }

        $uid = absint($user_id) > 0 ? absint($user_id) : get_current_user_id();
        if ($uid > 0 && user_can($uid, 'manage_options')) {
            return true;
        }

        return self::can_user_enroll_paid_course($uid, absint($course_id));
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

        return self::is_user_enrolled_in_course($user_id, $course_id);
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

        if (!$email_already_registered) {
            $seed = !empty($req_user) ? $req_user : (explode('@', $email)[0] ?? 'student');
            $username = TSMB_Security::generate_secure_username($seed);

            $name_parts = preg_split('/\s+/', trim($name));
            $first_name = sanitize_text_field($params['first_name'] ?? ($name_parts[0] ?? ''));
            $last_name  = sanitize_text_field(
                $params['last_name'] ?? (isset($name_parts[1]) ? implode(' ', array_slice($name_parts, 1)) : '')
            );

            $pending_key = 'tsmb_reg_otp_' . hash('sha256', $email);
            set_transient(
                $pending_key,
                [
                    'email'         => $email,
                    'username'      => $username,
                    'password_hash' => $password_hash,
                    'name'          => $name,
                    'first_name'    => $first_name,
                    'last_name'     => $last_name,
                    'phone'         => $phone,
                    'otp_hash'      => $otp_hash,
                    'attempts'      => 0,
                ],
                15 * MINUTE_IN_SECONDS
            );

            $subject = __('Verify your Thriving Skills account', 'ts-mobile-bridge');
            $body    = sprintf(
                __("Your 6-digit Thriving Skills verification code is: %s\n\nThis code expires in 15 minutes. If you did not request this registration, you can safely ignore this email.", 'ts-mobile-bridge'),
                $otp
            );
            wp_mail($email, $subject, $body);
        }

        // Identical response for existing and non-existing emails to prevent email enumeration.
        $response = [
            'status'                => 'verification_required',
            'requires_verification' => true,
            'code'                  => 200,
            'message'               => __('If this email address is eligible, a 6-digit verification code has been sent. Please enter the code to activate your account.', 'ts-mobile-bridge'),
            'expires_in'            => 900,
        ];

        if (TSMB_Security::is_dev_environment() && !$email_already_registered) {
            $response['dev_verification_otp'] = $otp;
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

        $username = TSMB_Security::generate_secure_username((string) ($record['username'] ?? 'student'));
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
}

/* ==========================================================================
   4. PHONE OTP AUTH CONTROLLER (/wp-json/tsl/v1/auth/*)
   ========================================================================== */

class TSMB_OTP_Auth
{
    public const NAMESPACE = 'tsl/v1';

    public static function init(): void
    {
        add_action('rest_api_init', [__CLASS__, 'register_routes']);
    }

    public static function register_routes(): void
    {
        register_rest_route(self::NAMESPACE, '/auth/send-otp', [
            'methods'             => 'POST',
            'callback'            => [__CLASS__, 'send_otp'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route(self::NAMESPACE, '/auth/verify-otp', [
            'methods'             => 'POST',
            'callback'            => [__CLASS__, 'verify_otp'],
            'permission_callback' => '__return_true',
        ]);
    }

    public static function send_otp($request)
    {
        $client_ip = TSMB_Security::get_client_ip();
        $ip_limit  = TSMB_Security::consume_rate_limit('otp_send_ip', $client_ip, 5, 15 * MINUTE_IN_SECONDS);
        if (is_wp_error($ip_limit)) {
            return $ip_limit;
        }

        $params = $request->get_json_params();
        if (!is_array($params)) {
            $params = [];
        }

        $phone = self::normalize_bd_phone((string) ($params['phone'] ?? ''));
        if ($phone === '') {
            return new WP_Error(
                'invalid_phone',
                __('Please enter a valid Bangladeshi mobile number (e.g. 017XXXXXXXX).', 'ts-mobile-bridge'),
                ['status' => 400]
            );
        }

        $cooldown_key = 'tsmb_sms_cd_' . hash('sha256', $phone);
        if (get_transient($cooldown_key) !== false) {
            return new WP_Error(
                'otp_cooldown',
                __('Please wait 60 seconds before requesting another OTP.', 'ts-mobile-bridge'),
                ['status' => 429]
            );
        }

        $phone_limit = TSMB_Security::consume_rate_limit('otp_send_phone', $phone, 3, 15 * MINUTE_IN_SECONDS);
        if (is_wp_error($phone_limit)) {
            return $phone_limit;
        }

        $otp     = TSMB_Security::generate_numeric_otp(6);
        $otp_key = 'tsmb_phone_otp_' . hash('sha256', $phone);

        set_transient(
            $otp_key,
            [
                'hash'     => wp_hash_password($otp),
                'attempts' => 0,
            ],
            5 * MINUTE_IN_SECONDS
        );
        set_transient($cooldown_key, 1, 60);

        $dispatched = self::dispatch_sms($phone, $otp);
        $is_dev     = TSMB_Security::is_dev_environment();

        if (!$dispatched && !$is_dev) {
            delete_transient($otp_key);
            delete_transient($cooldown_key);
            return new WP_Error(
                'sms_gateway_unavailable',
                __('Phone OTP verification service is currently unavailable. Please sign in with email and password.', 'ts-mobile-bridge'),
                ['status' => 503]
            );
        }

        $response = [
            'success'             => true,
            'message'             => __('Verification code sent to your mobile number.', 'ts-mobile-bridge'),
            'expires_in'          => 300,
            'resend_available_in' => 60,
        ];

        // Strictly only expose testOtp in local/development environments.
        if ($is_dev) {
            $response['testOtp'] = $otp;
        }

        return rest_ensure_response($response);
    }

    public static function verify_otp($request)
    {
        $client_ip = TSMB_Security::get_client_ip();
        $ip_limit  = TSMB_Security::consume_rate_limit('otp_verify_ip', $client_ip, 10, 15 * MINUTE_IN_SECONDS);
        if (is_wp_error($ip_limit)) {
            return $ip_limit;
        }

        $params = $request->get_json_params();
        if (!is_array($params)) {
            $params = [];
        }

        $phone        = self::normalize_bd_phone((string) ($params['phone'] ?? ''));
        $otp          = trim(sanitize_text_field((string) ($params['otp'] ?? '')));
        $display_name = sanitize_text_field((string) ($params['display_name'] ?? ''));

        if ($phone === '' || !preg_match('/^\d{6}$/', $otp)) {
            return new WP_Error(
                'invalid_otp_input',
                __('Please enter a valid mobile number and 6-digit OTP.', 'ts-mobile-bridge'),
                ['status' => 400]
            );
        }

        $phone_limit = TSMB_Security::consume_rate_limit('otp_verify_phone', $phone, 5, 15 * MINUTE_IN_SECONDS);
        if (is_wp_error($phone_limit)) {
            return $phone_limit;
        }

        $otp_key = 'tsmb_phone_otp_' . hash('sha256', $phone);
        $record  = get_transient($otp_key);

        if (!is_array($record) || empty($record['hash'])) {
            return new WP_Error(
                'invalid_otp',
                __('OTP has expired or is invalid. Please request a new code.', 'ts-mobile-bridge'),
                ['status' => 403]
            );
        }

        $attempts = intval($record['attempts'] ?? 0) + 1;
        if ($attempts > 3) {
            delete_transient($otp_key);
            return new WP_Error(
                'otp_attempts_exceeded',
                __('Too many incorrect OTP attempts. Please request a new code.', 'ts-mobile-bridge'),
                ['status' => 429]
            );
        }

        if (!wp_check_password($otp, (string) $record['hash'])) {
            $record['attempts'] = $attempts;
            set_transient($otp_key, $record, 5 * MINUTE_IN_SECONDS);
            return new WP_Error(
                'invalid_otp',
                __('Incorrect OTP code. Please check and try again.', 'ts-mobile-bridge'),
                ['status' => 403]
            );
        }

        // Consume OTP once verified to eliminate replay attacks.
        delete_transient($otp_key);

        $user = self::find_user_by_phone($phone);

        if (!$user) {
            if (!get_option('users_can_register')) {
                return new WP_Error(
                    'registration_disabled',
                    __('New account registration is currently disabled.', 'ts-mobile-bridge'),
                    ['status' => 403]
                );
            }

            $username = TSMB_Security::generate_secure_username('student_' . substr($phone, -4));
            $email    = $username . '@phone.thrivingskill.com';
            $name     = $display_name !== '' ? $display_name : ('Student (' . substr($phone, -4) . ')');

            $user_id = wp_insert_user([
                'user_login'   => $username,
                'user_pass'    => wp_generate_password(24, true, true),
                'user_email'   => $email,
                'display_name' => $name,
                'role'         => 'subscriber',
            ]);

            if (is_wp_error($user_id)) {
                return $user_id;
            }

            $user = get_userdata($user_id);
            if ($user) {
                $user->set_role('subscriber');
            }
            update_user_meta($user_id, 'phone', $phone);
            update_user_meta($user_id, 'phone_number', $phone);
            update_user_meta($user_id, 'billing_phone', $phone);
            update_user_meta($user_id, '_lp_phone', $phone);
        } else {
            $user_id = intval($user->ID);
        }

        $token = TSMB_Security::issue_bearer_token($user_id);

        return rest_ensure_response([
            'success'           => true,
            'token'             => $token,
            'user_id'           => $user_id,
            'user_email'        => $user ? $user->user_email : '',
            'user_nicename'     => $user ? $user->user_nicename : '',
            'user_display_name' => $user ? $user->display_name : $display_name,
        ]);
    }

    private static function normalize_bd_phone(string $raw): string
    {
        $clean = preg_replace('/[\s\-\(\)]+/', '', trim($raw));
        if (preg_match('/^(?:\+?88)?(01[3-9]\d{8})$/', (string) $clean, $matches)) {
            return $matches[1];
        }
        return '';
    }

    private static function find_user_by_phone(string $phone)
    {
        $by_login = get_user_by('login', $phone);
        if ($by_login) {
            return $by_login;
        }

        $users = get_users([
            'number'     => 1,
            'meta_query' => [
                'relation' => 'OR',
                [
                    'key'     => 'phone',
                    'value'   => $phone,
                    'compare' => '=',
                ],
                [
                    'key'     => 'billing_phone',
                    'value'   => $phone,
                    'compare' => '=',
                ],
            ],
        ]);

        return !empty($users) ? $users[0] : null;
    }

    private static function dispatch_sms(string $phone, string $otp): bool
    {
        $handled = apply_filters('tsmb_send_sms_otp', false, $phone, $otp);
        if ($handled === true) {
            return true;
        }

        $gateway_url = esc_url_raw((string) get_option('tsmb_sms_gateway_url', ''));
        $api_key     = (string) get_option('tsmb_sms_api_key', '');
        $sender_id   = sanitize_text_field((string) get_option('tsmb_sms_sender_id', 'ThrivingSkills'));

        if (empty($gateway_url)) {
            return false;
        }

        $message = sprintf(
            __('Your Thriving Skills verification code is %s. Valid for 5 minutes.', 'ts-mobile-bridge'),
            $otp
        );

        $res = wp_remote_post($gateway_url, [
            'timeout' => 10,
            'headers' => [
                'Accept'       => 'application/json',
                'Content-Type' => 'application/json',
            ],
            'body'    => wp_json_encode([
                'api_key'   => $api_key,
                'sender_id' => $sender_id,
                'to'        => $phone,
                'message'   => $message,
            ]),
        ]);

        if (is_wp_error($res)) {
            return false;
        }

        $status_code = intval(wp_remote_retrieve_response_code($res));
        return ($status_code >= 200 && $status_code < 300);
    }
}

/* ==========================================================================
   5. PUSH NOTIFICATIONS CONTROLLER (CUSTOM TABLE + EXPO RECEIPT PRUNING)
   ========================================================================== */

class TSMB_Notifications
{
    private const EXPO_SEND_URL = 'https://exp.host/--/api/v2/push/send';
    private const EXPO_RECEIPTS_URL = 'https://exp.host/--/api/v2/push/getReceipts';

    public static function init(): void
    {
        add_action('rest_api_init', [__CLASS__, 'register_routes']);
        add_action('transition_post_status', [__CLASS__, 'handle_post_transition'], 10, 3);
        add_action(TSMB_Lifecycle::CRON_RECEIPTS_HOOK, [__CLASS__, 'process_expo_receipts'], 10, 1);
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

        TSMB_Lifecycle::install_schema();
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
            return ['success' => false, 'count' => 0, 'pruned' => 0, 'error' => 'Push tokens table unavailable.'];
        }

        $push_tokens = $wpdb->get_col("SELECT token FROM {$table} ORDER BY id ASC");
        if (empty($push_tokens) || !is_array($push_tokens)) {
            return ['success' => false, 'count' => 0, 'pruned' => 0, 'error' => 'No registered devices found.'];
        }

        $total       = count($push_tokens);
        $batches     = array_chunk($push_tokens, 100);
        $dead_tokens = [];
        $receipt_map = [];

        foreach ($batches as $batch) {
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

            if (is_wp_error($res)) {
                continue;
            }

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

        return [
            'success' => true,
            'count'   => $total,
            'pruned'  => count($dead_tokens),
        ];
    }
}

/* ==========================================================================
   6. WP ADMIN SETTINGS DASHBOARD (MOBILE APP COMMAND CENTER)
   ========================================================================== */

class TSMB_Admin
{
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
                $data['url']       = $target;
            }

            $res = TSMB_Notifications::send_broadcast($title, $body, $data);
            if ($res['success']) {
                $msg = sprintf(
                    'Push broadcast dispatched to %d active devices (%d invalid tokens pruned).',
                    intval($res['count']),
                    intval($res['pruned'] ?? 0)
                );
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

                update_option('tsmb_sms_gateway_url', esc_url_raw(wp_unslash($_POST['sms_gateway_url'] ?? '')));
                $new_api_key = sanitize_text_field(wp_unslash($_POST['sms_api_key'] ?? ''));
                if ($new_api_key !== '') {
                    update_option('tsmb_sms_api_key', $new_api_key);
                }
                update_option('tsmb_sms_sender_id', sanitize_text_field(wp_unslash($_POST['sms_sender_id'] ?? 'ThrivingSkills')));
            } elseif ($submitted_tab === 'banners') {
                update_option('tsmb_banner_active', isset($_POST['banner_active']) ? 1 : 0);
                update_option('tsmb_banner_text', sanitize_text_field(wp_unslash($_POST['banner_text'] ?? '')));
                update_option('tsmb_banner_link', sanitize_text_field(wp_unslash($_POST['banner_link'] ?? '')));

                if (isset($_POST['hero_slides_json'])) {
                    $raw_json = wp_unslash((string) $_POST['hero_slides_json']);
                    $decoded  = json_decode($raw_json, true);
                    if (is_array($decoded)) {
                        update_option('tsmb_hero_slides', $decoded);
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

        $sms_url        = (string) get_option('tsmb_sms_gateway_url', '');
        $has_sms_key    = ((string) get_option('tsmb_sms_api_key', '')) !== '';
        $sms_sender     = (string) get_option('tsmb_sms_sender_id', 'ThrivingSkills');

        $hero_slides    = get_option('tsmb_hero_slides', []);
        $total_devices  = TSMB_Notifications::get_registered_count();
        ?>
        <div class="wrap">
            <h1><span class="dashicons dashicons-smartphone" style="font-size:32px;line-height:1;margin-right:10px;color:#102F53;"></span> Thriving Skills Mobile Command Center</h1>
            <p style="color:#64748b;margin-bottom:16px;">Live control over mobile banners, push notifications, flash sales, search keywords, OTP gateway, and remote configuration.</p>

            <?php settings_errors('tsmb_notices'); ?>

            <h2 class="nav-tab-wrapper" style="margin-bottom:20px;">
                <a href="?page=thriving-skills-app&tab=broadcast" class="nav-tab <?php echo $active_tab === 'broadcast' ? 'nav-tab-active' : ''; ?>">1-Click Push Broadcast</a>
                <a href="?page=thriving-skills-app&tab=banners" class="nav-tab <?php echo $active_tab === 'banners' ? 'nav-tab-active' : ''; ?>">Hero Slides &amp; Banners</a>
                <a href="?page=thriving-skills-app&tab=flash" class="nav-tab <?php echo $active_tab === 'flash' ? 'nav-tab-active' : ''; ?>">Flash Sale &amp; Countdown</a>
                <a href="?page=thriving-skills-app&tab=chips" class="nav-tab <?php echo $active_tab === 'chips' ? 'nav-tab-active' : ''; ?>">Trending Search &amp; Support</a>
                <a href="?page=thriving-skills-app&tab=version" class="nav-tab <?php echo $active_tab === 'version' ? 'nav-tab-active' : ''; ?>">App Version &amp; SMS OTP</a>
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
                        <h2 style="margin-top:0;">App Version Control, System &amp; SMS OTP Gateway</h2>
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
                            </table>

                            <hr style="margin:24px 0;" />

                            <h3>SMS OTP Gateway (/wp-json/tsl/v1/auth/*)</h3>
                            <table class="form-table">
                                <tr>
                                    <th scope="row">Gateway Webhook URL</th>
                                    <td><input name="sms_gateway_url" type="url" value="<?php echo esc_attr($sms_url); ?>" class="large-text" placeholder="https://sms-gateway.example/api/send" /></td>
                                </tr>
                                <tr>
                                    <th scope="row">Gateway API Key</th>
                                    <td>
                                        <input name="sms_api_key" type="password" value="" autocomplete="new-password" class="regular-text" placeholder="<?php echo $has_sms_key ? 'Stored (enter to replace)' : 'Enter SMS API key'; ?>" />
                                    </td>
                                </tr>
                                <tr>
                                    <th scope="row">Sender ID</th>
                                    <td><input name="sms_sender_id" type="text" value="<?php echo esc_attr($sms_sender); ?>" class="regular-text" /></td>
                                </tr>
                            </table>

                            <p class="submit" style="display:flex;gap:12px;align-items:center;">
                                <input type="submit" name="tsmb_save_settings" class="button button-primary" value="Save Settings" />
                                <input type="submit" name="purge_cache" class="button button-secondary" value="Purge Mobile Feed Cache" />
                            </p>
                        </form>
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
                        <li><code>/wp-json/tsl/v1/auth/send-otp</code></li>
                        <li><code>/wp-json/tsl/v1/auth/verify-otp</code></li>
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
    TSMB_OTP_Auth::init();
    TSMB_Notifications::init();
    if (is_admin()) {
        TSMB_Admin::init();
    }
}
add_action('plugins_loaded', 'tsmb_init_plugin');
