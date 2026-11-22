<?php
/**
 * Plugin Name: TS Mobile Bridge
 * Plugin URI: https://thrivingskill.com
 * Description: High-speed mobile API bridge, remote configuration, and push notification engine for Thriving Skills.
 * Version: 1.0.0
 * Author: Thriving Skills
 * Author URI: https://thrivingskill.com
 * License: GPLv2 or later
 * Text Domain: ts-mobile-bridge
 */

if (!defined('ABSPATH')) {
    exit;
}

define('TSMB_VERSION', '1.0.0');

/* ==========================================================================
   1. REST API CONTROLLER
   ========================================================================== */

class TSMB_Rest_API {

    const NAMESPACE = 'thrivingskill/v1';

    public static function init() {
        add_action('rest_api_init', [__CLASS__, 'register_routes']);
        add_action('save_post_lp_course', [__CLASS__, 'clear_feed_cache']);
    }

    public static function register_routes() {
        register_rest_route(self::NAMESPACE, '/config', [
            'methods'             => 'GET',
            'callback'            => [__CLASS__, 'get_config'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route(self::NAMESPACE, '/feed', [
            'methods'             => 'GET',
            'callback'            => [__CLASS__, 'get_feed'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route(self::NAMESPACE, '/lessons/(?P<id>\d+)', [
            'methods'             => 'GET',
            'callback'            => [__CLASS__, 'get_lesson_detail'],
            'permission_callback' => '__return_true',
            'args'                => [
                'id' => [
                    'validate_callback' => function($param) {
                        return is_numeric($param);
                    }
                ],
            ],
        ]);

        register_rest_route(self::NAMESPACE, '/register', [
            'methods'             => 'POST',
            'callback'            => [__CLASS__, 'register_user'],
            'permission_callback' => '__return_true',
        ]);
    }

    public static function get_config() {
        $min_version     = get_option('tsmb_min_app_version', '1.0.0');
        $latest_version  = get_option('tsmb_latest_app_version', '1.0.0');
        $maintenance     = (bool) get_option('tsmb_maintenance_mode', false);
        $banner_active   = (bool) get_option('tsmb_banner_active', true);
        $banner_text     = get_option('tsmb_banner_text', 'Bangladesh Skills Summit 2026 registration is live!');
        $banner_link     = get_option('tsmb_banner_link', 'summit');

        return rest_ensure_response([
            'status' => 'success',
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
                'active'  => $banner_active,
                'message' => $banner_text,
                'target'  => $banner_link,
            ],
            'server_time' => current_time('mysql'),
        ]);
    }

    public static function get_feed($request) {
        $cache_key = 'tsmb_mobile_feed_v1';
        $limit     = isset($request['limit']) ? intval($request['limit']) : 30;

        $cached = get_transient($cache_key);
        if ($cached !== false && empty($request['nocache'])) {
            return rest_ensure_response($cached);
        }

        $args = [
            'post_type'      => 'lp_course',
            'post_status'    => 'publish',
            'posts_per_page' => $limit,
            'orderby'        => 'date',
            'order'          => 'DESC',
        ];

        $query = new WP_Query($args);
        $courses = [];

        if ($query->have_posts()) {
            while ($query->have_posts()) {
                $query->the_post();
                $post_id = get_the_ID();

                $price         = get_post_meta($post_id, '_lp_price', true);
                $regular_price = get_post_meta($post_id, '_lp_regular_price', true);
                $duration      = get_post_meta($post_id, '_lp_duration', true);
                $level         = get_post_meta($post_id, '_lp_level', true);
                $students      = get_post_meta($post_id, '_lp_students', true);

                $bdt_price    = is_numeric($price) ? floatval($price) : 0;
                $origin_price = is_numeric($regular_price) ? floatval($regular_price) : $bdt_price;

                $thumb_url = get_the_post_thumbnail_url($post_id, 'medium_large');
                if ($thumb_url) {
                    $thumb_url = set_url_scheme($thumb_url, 'https');
                } else {
                    $site_icon = get_site_icon_url(512);
                    $thumb_url = $site_icon ? set_url_scheme($site_icon, 'https') : home_url('/wp-content/uploads/2023/11/logo.png');
                }

                $author_id         = get_the_author_meta('ID');
                $instructor_name   = get_the_author_meta('display_name');
                $instructor_avatar = set_url_scheme(get_avatar_url($author_id, ['size' => 128]), 'https');

                $terms = get_the_terms($post_id, 'course_category');
                $category = null;
                if (!empty($terms) && !is_wp_error($terms)) {
                    $first_term = $terms[0];
                    $category = [
                        'id'   => $first_term->term_id,
                        'name' => $first_term->name,
                        'slug' => $first_term->slug,
                    ];
                }

                $courses[] = [
                    'id'               => $post_id,
                    'title'            => wp_strip_all_tags(get_the_title()),
                    'excerpt'          => wp_trim_words(wp_strip_all_tags(get_the_excerpt()), 20, '...'),
                    'price_bdt'        => $bdt_price,
                    'origin_price_bdt' => $origin_price > $bdt_price ? $origin_price : null,
                    'is_free'          => ($bdt_price === 0.0),
                    'thumbnail'        => $thumb_url,
                    'duration'         => $duration ? $duration : 'Self-paced',
                    'level'            => $level ? $level : 'All Levels',
                    'students_count'   => $students ? intval($students) : 120,
                    'rating'           => 4.9,
                    'instructor'       => [
                        'name'   => $instructor_name ? $instructor_name : 'Thriving Skills Fellow',
                        'avatar' => $instructor_avatar,
                    ],
                    'category'         => $category,
                ];
            }
            wp_reset_postdata();
        }

        $response = [
            'count'   => count($courses),
            'courses' => $courses,
        ];

        set_transient($cache_key, $response, 10 * MINUTE_IN_SECONDS);

        return rest_ensure_response($response);
    }

    public static function get_lesson_detail($request) {
        $lesson_id = intval($request['id']);
        $post = get_post($lesson_id);

        if (!$post || $post->post_type !== 'lp_lesson') {
            return new WP_Error('not_found', 'Lesson not found', ['status' => 404]);
        }

        $video_intro = get_post_meta($lesson_id, '_lp_lesson_video_intro', true);
        $video_url   = get_post_meta($lesson_id, 'video_url', true);

        $parsed_video_url = '';
        $video_type = 'none';

        if (!empty($video_url)) {
            $parsed_video_url = $video_url;
        } elseif (!empty($video_intro)) {
            if (preg_match('/src=["\']([^"\']+)["\']/i', $video_intro, $matches)) {
                $parsed_video_url = $matches[1];
            } elseif (filter_var($video_intro, FILTER_VALIDATE_URL)) {
                $parsed_video_url = $video_intro;
            }
        }

        if (!empty($parsed_video_url)) {
            if (strpos($parsed_video_url, 'vimeo.com') !== false) {
                $video_type = 'vimeo';
            } elseif (strpos($parsed_video_url, 'youtube.com') !== false || strpos($parsed_video_url, 'youtu.be') !== false) {
                $video_type = 'youtube';
            } elseif (preg_match('/\.(mp4|m3u8|webm)($|\?)/i', $parsed_video_url)) {
                $video_type = 'mp4';
            } else {
                $video_type = 'iframe';
            }
        }

        return rest_ensure_response([
            'id'          => $lesson_id,
            'title'       => wp_strip_all_tags($post->post_title),
            'content'     => wp_strip_all_tags($post->post_content),
            'raw_content' => $post->post_content,
            'video_url'   => $parsed_video_url ? set_url_scheme($parsed_video_url, 'https') : null,
            'video_type'  => $video_type,
            'duration'    => get_post_meta($lesson_id, '_lp_duration', true) ?: '10m',
        ]);
    }

    public static function register_user($request) {
        $params   = $request->get_json_params();
        $email    = sanitize_email($params['email'] ?? '');
        $password = $params['password'] ?? '';
        $phone    = sanitize_text_field($params['phone'] ?? ($params['billing_phone'] ?? ''));
        $name     = sanitize_text_field($params['name'] ?? ($params['display_name'] ?? ''));
        $username = sanitize_user($params['username'] ?? '', true);

        if (empty($email) || !is_email($email)) {
            return new WP_Error(
                'registration-error-invalid-email',
                __('Please provide a valid email address.', 'ts-mobile-bridge'),
                ['status' => 400]
            );
        }

        if (email_exists($email)) {
            return new WP_Error(
                'registration-error-email-exists',
                __('An account is already registered with your email address. Please log in.', 'ts-mobile-bridge'),
                ['status' => 400]
            );
        }

        if (empty($password) || strlen($password) < 6) {
            return new WP_Error(
                'registration-error-missing-password',
                __('Password must be at least 6 characters long.', 'ts-mobile-bridge'),
                ['status' => 400]
            );
        }

        if (empty($username)) {
            $base_user = sanitize_user(explode('@', $email)[0], true);
            if (empty($base_user) || strlen($base_user) < 3) {
                $base_user = 'student';
            }
            $username = $base_user . rand(100, 999);
            while (username_exists($username)) {
                $username = $base_user . rand(1000, 9999);
            }
        } elseif (username_exists($username)) {
            $username = $username . rand(100, 999);
        }

        $name_parts = explode(' ', trim($name));
        $first_name = sanitize_text_field($params['first_name'] ?? ($name_parts[0] ?? ''));
        $last_name  = sanitize_text_field($params['last_name'] ?? (isset($name_parts[1]) ? implode(' ', array_slice($name_parts, 1)) : ''));

        $user_id = wp_create_user($username, $password, $email);
        if (is_wp_error($user_id)) {
            return $user_id;
        }

        wp_update_user([
            'ID'           => $user_id,
            'display_name' => !empty($name) ? $name : $username,
            'first_name'   => $first_name,
            'last_name'    => $last_name,
        ]);

        if (!empty($phone)) {
            update_user_meta($user_id, 'phone', $phone);
            update_user_meta($user_id, 'phone_number', $phone);
            update_user_meta($user_id, 'billing_phone', $phone);
            update_user_meta($user_id, '_lp_phone', $phone);
        }

        return rest_ensure_response([
            'status'   => 'success',
            'code'     => 200,
            'message'  => __('Registration complete! You may now sign in.', 'ts-mobile-bridge'),
            'user_id'  => $user_id,
            'username' => $username,
            'email'    => $email,
        ]);
    }

    public static function clear_feed_cache() {
        delete_transient('tsmb_mobile_feed_v1');
    }
}

/* ==========================================================================
   2. PUSH NOTIFICATIONS CONTROLLER
   ========================================================================== */

class TSMB_Notifications {

    const OPTION_TOKENS = 'tsmb_registered_push_tokens';

    public static function init() {
        add_action('rest_api_init', [__CLASS__, 'register_routes']);
        add_action('transition_post_status', [__CLASS__, 'handle_post_transition'], 10, 3);
    }

    public static function register_routes() {
        register_rest_route('thrivingskill/v1', '/register-push-token', [
            'methods'             => 'POST',
            'callback'            => [__CLASS__, 'register_token'],
            'permission_callback' => '__return_true',
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

    public static function register_token($request) {
        $token    = trim($request['token']);
        $platform = sanitize_text_field($request['platform'] ?? 'unknown');

        if (empty($token) || strpos($token, 'ExponentPushToken') === false) {
            return new WP_Error('invalid_token', 'Invalid Expo push token format', ['status' => 400]);
        }

        $tokens = get_option(self::OPTION_TOKENS, []);
        if (!is_array($tokens)) {
            $tokens = [];
        }

        $tokens[$token] = [
            'platform'   => $platform,
            'updated_at' => current_time('mysql'),
        ];

        if (count($tokens) > 10000) {
            $tokens = array_slice($tokens, -10000, null, true);
        }

        update_option(self::OPTION_TOKENS, $tokens, false);

        return rest_ensure_response([
            'status'  => 'success',
            'message' => 'Push token registered successfully',
        ]);
    }

    public static function handle_post_transition($new_status, $old_status, $post) {
        if ($new_status === 'publish' && $old_status !== 'publish' && $post->post_type === 'lp_course') {
            $title = get_the_title($post->ID);
            $message = "🎓 New Course Alert: {$title} is now available on Thriving Skills!";

            self::send_expo_push([
                'title' => 'New Course Published!',
                'body'  => $message,
                'data'  => [
                    'course_id' => $post->ID,
                    'screen'    => 'CourseDetail',
                ],
            ]);
        }
    }

    public static function send_expo_push($payload) {
        $tokens_data = get_option(self::OPTION_TOKENS, []);
        if (empty($tokens_data) || !is_array($tokens_data)) {
            return;
        }

        $push_tokens = array_keys($tokens_data);
        if (empty($push_tokens)) {
            return;
        }

        $batches = array_chunk($push_tokens, 100);

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

            wp_remote_post('https://exp.host/--/api/v2/push/send', [
                'headers'  => [
                    'Accept'       => 'application/json',
                    'Content-Type' => 'application/json',
                ],
                'body'     => wp_json_encode($messages),
                'timeout'  => 5,
                'blocking' => false,
            ]);
        }
    }
}

/* ==========================================================================
   3. WP ADMIN SETTINGS DASHBOARD
   ========================================================================== */

class TSMB_Admin {

    public static function init() {
        add_action('admin_menu', [__CLASS__, 'add_menu']);
        add_action('admin_init', [__CLASS__, 'handle_actions']);
    }

    public static function add_menu() {
        add_menu_page(
            'Thriving Skills App',
            'Mobile App',
            'manage_options',
            'thriving-skills-app',
            [__CLASS__, 'render_page'],
            'dashicons-smartphone',
            30
        );
    }

    public static function handle_actions() {
        if (!isset($_POST['tsmb_save_settings'])) {
            return;
        }

        check_admin_referer('tsmb_save_settings_nonce');

        if (!current_user_can('manage_options')) {
            return;
        }

        update_option('tsmb_min_app_version', sanitize_text_field($_POST['min_version'] ?? '1.0.0'));
        update_option('tsmb_latest_app_version', sanitize_text_field($_POST['latest_version'] ?? '1.0.0'));
        update_option('tsmb_maintenance_mode', isset($_POST['maintenance_mode']) ? 1 : 0);
        update_option('tsmb_banner_active', isset($_POST['banner_active']) ? 1 : 0);
        update_option('tsmb_banner_text', sanitize_text_field($_POST['banner_text'] ?? ''));
        update_option('tsmb_banner_link', sanitize_text_field($_POST['banner_link'] ?? 'summit'));

        if (isset($_POST['purge_cache'])) {
            delete_transient('tsmb_mobile_feed_v1');
            add_settings_error('tsmb_notices', 'cache_purged', 'Mobile feed cache purged successfully!', 'updated');
        } else {
            add_settings_error('tsmb_notices', 'settings_saved', 'Mobile app settings saved successfully!', 'updated');
        }
    }

    public static function render_page() {
        $min_version     = get_option('tsmb_min_app_version', '1.0.0');
        $latest_version  = get_option('tsmb_latest_app_version', '1.0.0');
        $maintenance     = (bool) get_option('tsmb_maintenance_mode', false);
        $banner_active   = (bool) get_option('tsmb_banner_active', true);
        $banner_text     = get_option('tsmb_banner_text', 'Bangladesh Skills Summit 2026 registration is live!');
        $banner_link     = get_option('tsmb_banner_link', 'summit');

        $tokens_data     = get_option(TSMB_Notifications::OPTION_TOKENS, []);
        $total_devices   = is_array($tokens_data) ? count($tokens_data) : 0;
        ?>
        <div class="wrap">
            <h1><span class="dashicons dashicons-smartphone" style="font-size:28px;line-height:1;margin-right:8px;"></span> Thriving Skills Mobile App Settings</h1>
            <?php settings_errors('tsmb_notices'); ?>

            <div style="display:flex;gap:20px;margin-top:20px;flex-wrap:wrap;">
                <!-- Main Settings Form -->
                <div style="flex:2;min-width:320px;background:#fff;padding:24px;border:1px solid #ccd0d4;border-radius:8px;">
                    <form method="post" action="">
                        <?php wp_nonce_field('tsmb_save_settings_nonce'); ?>

                        <h2>App Version Control & Remote Flags</h2>
                        <table class="form-table">
                            <tr>
                                <th scope="row"><label for="min_version">Minimum Supported App Version</label></th>
                                <td>
                                    <input name="min_version" type="text" id="min_version" value="<?php echo esc_attr($min_version); ?>" class="regular-text" placeholder="1.0.0" />
                                    <p class="description">Devices running below this version will be politely prompted to update.</p>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row"><label for="latest_version">Latest Store Version</label></th>
                                <td>
                                    <input name="latest_version" type="text" id="latest_version" value="<?php echo esc_attr($latest_version); ?>" class="regular-text" placeholder="1.0.0" />
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">Maintenance Mode</th>
                                <td>
                                    <label>
                                        <input name="maintenance_mode" type="checkbox" value="1" <?php checked($maintenance, true); ?> />
                                        Temporarily notify mobile learners of scheduled server maintenance.
                                    </label>
                                </td>
                            </tr>
                        </table>

                        <hr style="margin:24px 0;border:0;border-top:1px solid #eee;" />

                        <h2>In-App Announcement Banner</h2>
                        <table class="form-table">
                            <tr>
                                <th scope="row">Enable In-App Banner</th>
                                <td>
                                    <label>
                                        <input name="banner_active" type="checkbox" value="1" <?php checked($banner_active, true); ?> />
                                        Display top highlight banner on the mobile Home feed.
                                    </label>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row"><label for="banner_text">Banner Message</label></th>
                                <td>
                                    <input name="banner_text" type="text" id="banner_text" value="<?php echo esc_attr($banner_text); ?>" class="large-text" />
                                </td>
                            </tr>
                            <tr>
                                <th scope="row"><label for="banner_link">Action Target / Screen</label></th>
                                <td>
                                    <input name="banner_link" type="text" id="banner_link" value="<?php echo esc_attr($banner_link); ?>" class="regular-text" placeholder="summit or https://..." />
                                </td>
                            </tr>
                        </table>

                        <p class="submit" style="display:flex;gap:12px;align-items:center;">
                            <input type="submit" name="tsmb_save_settings" id="submit" class="button button-primary" value="Save App Settings">
                            <input type="submit" name="purge_cache" class="button button-secondary" value="Purge Mobile Feed Cache">
                        </p>
                    </form>
                </div>

                <!-- Status Sidebar -->
                <div style="flex:1;min-width:260px;background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-radius:8px;height:fit-content;">
                    <h3 style="margin-top:0;">📱 Mobile Ecosystem Status</h3>
                    <p><strong>Active Push Devices:</strong> <?php echo intval($total_devices); ?></p>
                    <p><strong>Checkout Mode:</strong> <span style="background:#e0f2fe;color:#0369a1;padding:2px 8px;border-radius:4px;font-weight:600;">WebView (Google Play Safe)</span></p>
                    <p><strong>Mobile Feed Cache:</strong> <?php echo (get_transient('tsmb_mobile_feed_v1') !== false) ? '<span style="color:#15803d;font-weight:600;">Active (Cached)</span>' : '<span style="color:#64748b;">Not cached</span>'; ?></p>

                    <hr style="margin:16px 0;border:0;border-top:1px solid #cbd5e1;" />
                    <h4>REST API Diagnostics</h4>
                    <ul style="font-size:12px;color:#475569;line-height:1.6;padding-left:16px;">
                        <li><code>/wp-json/thrivingskill/v1/config</code></li>
                        <li><code>/wp-json/thrivingskill/v1/feed</code></li>
                        <li><code>/wp-json/thrivingskill/v1/lessons/{id}</code></li>
                        <li><code>/wp-json/thrivingskill/v1/register</code></li>
                        <li><code>/wp-json/thrivingskill/v1/register-push-token</code></li>
                    </ul>
                </div>
            </div>
        </div>
        <?php
    }
}

/* ==========================================================================
   4. BOOTSTRAP INITIALIZATION
   ========================================================================== */

function tsmb_init_plugin() {
    TSMB_Rest_API::init();
    TSMB_Notifications::init();
    if (is_admin()) {
        TSMB_Admin::init();
    }
}
add_action('plugins_loaded', 'tsmb_init_plugin');
