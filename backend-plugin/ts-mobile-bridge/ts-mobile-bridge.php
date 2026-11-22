<?php
/**
 * Plugin Name: TS Mobile Bridge
 * Plugin URI: https://thrivingskill.com
 * Description: High-speed mobile API bridge, remote configuration, push notification engine, and Mobile App Command Center for Thriving Skills.
 * Version: 1.1.0
 * Author: Thriving Skills Engineering
 * Author URI: https://thrivingskill.com
 * License: GPLv2 or later
 * Text Domain: ts-mobile-bridge
 */

if (!defined('ABSPATH')) {
    exit;
}

define('TSMB_VERSION', '1.1.0');

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
        $latest_version  = get_option('tsmb_latest_app_version', '1.1.0');
        $maintenance     = (bool) get_option('tsmb_maintenance_mode', false);
        $banner_active   = (bool) get_option('tsmb_banner_active', true);
        $banner_text     = get_option('tsmb_banner_text', 'Bangladesh Skills Summit 2026 registration is live!');
        $banner_link     = get_option('tsmb_banner_link', 'summit');

        // Hero Carousel Slides
        $default_slides = [
            [
                'id'          => 1,
                'tag'         => 'FLAGSHIP CONFERENCE 2026',
                'title'       => 'Bangladesh Skills Summit 2026',
                'subtitle'    => 'Decoding 4IR employability, AI workforce transformation, & leadership.',
                'button_text' => 'Reserve Summit Pass →',
                'image_url'   => 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800',
                'target'      => 'summit',
            ],
            [
                'id'          => 2,
                'tag'         => 'POPULAR SKILL',
                'title'       => 'AI for Teachers & Educators',
                'subtitle'    => 'Master lesson planning, automated grading, and personalized learning.',
                'button_text' => 'Explore Course →',
                'image_url'   => 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800',
                'target'      => 'course',
            ],
        ];
        $hero_slides = get_option('tsmb_hero_slides', $default_slides);
        if (!is_array($hero_slides)) {
            $hero_slides = $default_slides;
        }

        // Flash Sale & Countdown
        $flash_active   = (bool) get_option('tsmb_flash_active', true);
        $flash_title    = get_option('tsmb_flash_title', 'Cyber Skills Flash Sale 50% Off');
        $flash_code     = get_option('tsmb_flash_code', 'THRIVE50');
        $flash_discount = intval(get_option('tsmb_flash_discount', 50));
        $flash_end      = get_option('tsmb_flash_end', date('Y-m-d H:i:s', strtotime('+7 days')));

        // Trending Search Chips
        $trending_raw = get_option('tsmb_trending_keywords', 'Agentic AI, AI for Business, Power BI Data, Financial Modeling, ESG Strategy, Growth Marketing');
        $trending_keywords = array_values(array_filter(array_map('trim', explode(',', $trending_raw))));

        // Learner Support Hotline
        $support_whatsapp = get_option('tsmb_support_whatsapp', '+8801700000000');
        $support_email    = get_option('tsmb_support_email', 'support@thrivingskill.com');
        $support_helpline = get_option('tsmb_support_helpline', '+88029876543');

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
            'hero_slides' => $hero_slides,
            'flash_sale' => [
                'active'           => $flash_active,
                'title'            => $flash_title,
                'coupon_code'      => $flash_code,
                'discount_percent' => $flash_discount,
                'end_time'         => $flash_end,
                'end_timestamp'    => strtotime($flash_end),
            ],
            'trending_keywords' => $trending_keywords,
            'support' => [
                'whatsapp' => $support_whatsapp,
                'email'    => $support_email,
                'helpline' => $support_helpline,
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
            return new WP_Error('registration-error-invalid-email', 'Please provide a valid email address.', ['status' => 400]);
        }

        if (email_exists($email)) {
            return new WP_Error('registration-error-email-exists', 'An account is already registered with your email address. Please log in.', ['status' => 400]);
        }

        if (empty($password) || strlen($password) < 6) {
            return new WP_Error('registration-error-missing-password', 'Password must be at least 6 characters long.', ['status' => 400]);
        }

        if (empty($username)) {
            $base_user = sanitize_user(explode('@', $email)[0], true);
            if (empty($base_user) || strlen($base_user) < 3) $base_user = 'student';
            $username = $base_user . rand(100, 999);
            while (username_exists($username)) $username = $base_user . rand(1000, 9999);
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
            'message'  => 'Registration complete! You may now sign in.',
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

    public static function send_broadcast($title, $body, $data = []) {
        $tokens_data = get_option(self::OPTION_TOKENS, []);
        if (empty($tokens_data) || !is_array($tokens_data)) {
            return ['success' => false, 'count' => 0, 'error' => 'No registered devices found.'];
        }

        $push_tokens = array_keys($tokens_data);
        $total = count($push_tokens);
        $batches = array_chunk($push_tokens, 100);

        foreach ($batches as $batch) {
            $messages = [];
            foreach ($batch as $token) {
                $messages[] = [
                    'to'       => $token,
                    'sound'    => 'default',
                    'title'    => $title,
                    'body'     => $body,
                    'data'     => $data,
                    'priority' => 'high',
                ];
            }

            wp_remote_post('https://exp.host/--/api/v2/push/send', [
                'headers'  => [
                    'Accept'       => 'application/json',
                    'Content-Type' => 'application/json',
                ],
                'body'     => wp_json_encode($messages),
                'timeout'  => 10,
                'blocking' => true,
            ]);
        }

        return ['success' => true, 'count' => $total];
    }

    public static function send_expo_push($payload) {
        $tokens_data = get_option(self::OPTION_TOKENS, []);
        if (empty($tokens_data) || !is_array($tokens_data)) {
            return;
        }

        $push_tokens = array_keys($tokens_data);
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
   3. WP ADMIN SETTINGS DASHBOARD (MOBILE APP COMMAND CENTER)
   ========================================================================== */

class TSMB_Admin {

    public static function init() {
        add_action('admin_menu', [__CLASS__, 'add_menu']);
        add_action('admin_init', [__CLASS__, 'handle_actions']);
    }

    public static function add_menu() {
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

    public static function handle_actions() {
        // 1. Handle Broadcast Push Notification
        if (isset($_POST['tsmb_send_push_broadcast'])) {
            check_admin_referer('tsmb_push_broadcast_nonce');
            if (!current_user_can('manage_options')) return;

            $title  = sanitize_text_field($_POST['push_title'] ?? '');
            $body   = sanitize_textarea_field($_POST['push_message'] ?? '');
            $screen = sanitize_text_field($_POST['push_screen'] ?? 'home');
            $target = sanitize_text_field($_POST['push_target_id'] ?? '');

            if (empty($title) || empty($body)) {
                add_settings_error('tsmb_notices', 'push_empty', 'Please enter both Title and Message for the push notification.', 'error');
                return;
            }

            $data = ['screen' => $screen];
            if (!empty($target)) {
                $data['course_id'] = $target;
                $data['url'] = $target;
            }

            $res = TSMB_Notifications::send_broadcast($title, $body, $data);
            if ($res['success']) {
                add_settings_error('tsmb_notices', 'push_sent', "🚀 Push broadcast successfully dispatched to {$res['count']} active devices!", 'updated');
            } else {
                add_settings_error('tsmb_notices', 'push_err', "Notice: {$res['error']}", 'warning');
            }
            return;
        }

        // 2. Handle Settings Save
        if (isset($_POST['tsmb_save_settings'])) {
            check_admin_referer('tsmb_save_settings_nonce');
            if (!current_user_can('manage_options')) return;

            // General & Version
            update_option('tsmb_min_app_version', sanitize_text_field($_POST['min_version'] ?? '1.0.0'));
            update_option('tsmb_latest_app_version', sanitize_text_field($_POST['latest_version'] ?? '1.1.0'));
            update_option('tsmb_maintenance_mode', isset($_POST['maintenance_mode']) ? 1 : 0);
            update_option('tsmb_banner_active', isset($_POST['banner_active']) ? 1 : 0);
            update_option('tsmb_banner_text', sanitize_text_field($_POST['banner_text'] ?? ''));
            update_option('tsmb_banner_link', sanitize_text_field($_POST['banner_link'] ?? 'summit'));

            // Flash Sale
            update_option('tsmb_flash_active', isset($_POST['flash_active']) ? 1 : 0);
            update_option('tsmb_flash_title', sanitize_text_field($_POST['flash_title'] ?? ''));
            update_option('tsmb_flash_code', sanitize_text_field($_POST['flash_code'] ?? ''));
            update_option('tsmb_flash_discount', intval($_POST['flash_discount'] ?? 50));
            update_option('tsmb_flash_end', sanitize_text_field($_POST['flash_end'] ?? ''));

            // Trending search chips & support hotlines
            update_option('tsmb_trending_keywords', sanitize_text_field($_POST['trending_keywords'] ?? ''));
            update_option('tsmb_support_whatsapp', sanitize_text_field($_POST['support_whatsapp'] ?? ''));
            update_option('tsmb_support_email', sanitize_email($_POST['support_email'] ?? ''));
            update_option('tsmb_support_helpline', sanitize_text_field($_POST['support_helpline'] ?? ''));

            // Hero Slides
            if (isset($_POST['hero_slides_json'])) {
                $raw_json = wp_unslash($_POST['hero_slides_json']);
                $decoded = json_decode($raw_json, true);
                if (is_array($decoded)) {
                    update_option('tsmb_hero_slides', $decoded);
                }
            }

            if (isset($_POST['purge_cache'])) {
                delete_transient('tsmb_mobile_feed_v1');
                add_settings_error('tsmb_notices', 'cache_purged', 'Mobile feed cache purged successfully!', 'updated');
            } else {
                add_settings_error('tsmb_notices', 'settings_saved', 'Mobile App Command Center settings saved successfully!', 'updated');
            }
        }
    }

    public static function render_page() {
        $active_tab = isset($_GET['tab']) ? sanitize_key($_GET['tab']) : 'broadcast';

        $min_version     = get_option('tsmb_min_app_version', '1.0.0');
        $latest_version  = get_option('tsmb_latest_app_version', '1.1.0');
        $maintenance     = (bool) get_option('tsmb_maintenance_mode', false);
        $banner_active   = (bool) get_option('tsmb_banner_active', true);
        $banner_text     = get_option('tsmb_banner_text', 'Bangladesh Skills Summit 2026 registration is live!');
        $banner_link     = get_option('tsmb_banner_link', 'summit');

        $flash_active    = (bool) get_option('tsmb_flash_active', true);
        $flash_title     = get_option('tsmb_flash_title', 'Cyber Skills Flash Sale 50% Off');
        $flash_code      = get_option('tsmb_flash_code', 'THRIVE50');
        $flash_discount  = intval(get_option('tsmb_flash_discount', 50));
        $flash_end       = get_option('tsmb_flash_end', date('Y-m-d H:i:s', strtotime('+7 days')));

        $trending_raw    = get_option('tsmb_trending_keywords', 'Agentic AI, AI for Business, Power BI Data, Financial Modeling, ESG Strategy, Growth Marketing');
        $support_wa      = get_option('tsmb_support_whatsapp', '+8801700000000');
        $support_mail    = get_option('tsmb_support_email', 'support@thrivingskill.com');
        $support_phone   = get_option('tsmb_support_helpline', '+88029876543');

        $hero_slides     = get_option('tsmb_hero_slides', []);
        $tokens_data     = get_option(TSMB_Notifications::OPTION_TOKENS, []);
        $total_devices   = is_array($tokens_data) ? count($tokens_data) : 0;
        ?>
        <div class="wrap">
            <h1><span class="dashicons dashicons-smartphone" style="font-size:32px;line-height:1;margin-right:10px;color:#102F53;"></span> Thriving Skills Mobile Command Center</h1>
            <p style="color:#64748b;margin-bottom:16px;">Live real-time control over mobile banners, push notifications, flash sales, search keywords, and remote configuration.</p>
            
            <?php settings_errors('tsmb_notices'); ?>

            <!-- Navigation Tabs -->
            <h2 class="nav-tab-wrapper" style="margin-bottom:20px;">
                <a href="?page=thriving-skills-app&tab=broadcast" class="nav-tab <?php echo $active_tab === 'broadcast' ? 'nav-tab-active' : ''; ?>">📢 1-Click Push Broadcast</a>
                <a href="?page=thriving-skills-app&tab=banners" class="nav-tab <?php echo $active_tab === 'banners' ? 'nav-tab-active' : ''; ?>">🖼️ Hero Slides & Banners</a>
                <a href="?page=thriving-skills-app&tab=flash" class="nav-tab <?php echo $active_tab === 'flash' ? 'nav-tab-active' : ''; ?>">⚡ Flash Sale & Countdown</a>
                <a href="?page=thriving-skills-app&tab=chips" class="nav-tab <?php echo $active_tab === 'chips' ? 'nav-tab-active' : ''; ?>">🔍 Trending Search & Support</a>
                <a href="?page=thriving-skills-app&tab=version" class="nav-tab <?php echo $active_tab === 'version' ? 'nav-tab-active' : ''; ?>">⚙️ App Version & System</a>
            </h2>

            <div style="display:flex;gap:24px;flex-wrap:wrap;">
                <div style="flex:2.5;min-width:320px;background:#fff;padding:24px;border:1px solid #ccd0d4;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">

                    <!-- TAB 1: PUSH NOTIFICATION BROADCAST -->
                    <?php if ($active_tab === 'broadcast') : ?>
                        <h2 style="margin-top:0;">📢 1-Click Push Notification Broadcaster</h2>
                        <p style="color:#64748b;">Instantly send high-priority push alerts to all <?php echo intval($total_devices); ?> registered Android and iOS devices.</p>
                        
                        <form method="post" action="?page=thriving-skills-app&tab=broadcast">
                            <?php wp_nonce_field('tsmb_push_broadcast_nonce'); ?>
                            <table class="form-table">
                                <tr>
                                    <th scope="row"><label for="push_title">Notification Title *</label></th>
                                    <td>
                                        <input name="push_title" type="text" id="push_title" class="large-text" placeholder="e.g. 🚨 Live Workshop Starting in 1 Hour!" required />
                                    </td>
                                </tr>
                                <tr>
                                    <th scope="row"><label for="push_message">Message Body *</label></th>
                                    <td>
                                        <textarea name="push_message" id="push_message" rows="3" class="large-text" placeholder="e.g. Join Humaira Sharmeen live on Zoom to master Prompt Engineering. Tap to join now." required></textarea>
                                    </td>
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
                                        <p class="description">If you selected 'Specific Course', enter the LearnPress Course Post ID.</p>
                                    </td>
                                </tr>
                            </table>

                            <p class="submit">
                                <button type="submit" name="tsmb_send_push_broadcast" class="button button-primary button-hero" onclick="return confirm('Broadcast this notification to all active devices now?');" style="background:#102F53;border-color:#102F53;">
                                    🚀 Broadcast Push Alert Now
                                </button>
                            </p>
                        </form>

                    <!-- TAB 2: HERO SLIDES & BANNERS -->
                    <?php elseif ($active_tab === 'banners') : ?>
                        <h2 style="margin-top:0;">🖼️ Hero Slides & Announcement Banner</h2>
                        <form method="post" action="?page=thriving-skills-app&tab=banners">
                            <?php wp_nonce_field('tsmb_save_settings_nonce'); ?>
                            
                            <h3>Top Highlight Announcement</h3>
                            <table class="form-table">
                                <tr>
                                    <th scope="row">Enable Banner</th>
                                    <td>
                                        <label><input name="banner_active" type="checkbox" value="1" <?php checked($banner_active, true); ?> /> Display highlight bar at the very top of the mobile Home feed.</label>
                                    </td>
                                </tr>
                                <tr>
                                    <th scope="row">Banner Text</th>
                                    <td>
                                        <input name="banner_text" type="text" value="<?php echo esc_attr($banner_text); ?>" class="large-text" />
                                    </td>
                                </tr>
                                <tr>
                                    <th scope="row">Target Action</th>
                                    <td>
                                        <input name="banner_link" type="text" value="<?php echo esc_attr($banner_link); ?>" class="regular-text" placeholder="summit or https://..." />
                                    </td>
                                </tr>
                            </table>

                            <hr style="margin:24px 0;" />

                            <h3>Home Feed Hero Carousel Slides</h3>
                            <p class="description">Configure the promotional slides displayed at the top of the Home Screen.</p>
                            
                            <textarea name="hero_slides_json" id="hero_slides_json" rows="8" class="large-text code" style="font-family:monospace;"><?php echo esc_textarea(wp_json_encode($hero_slides, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)); ?></textarea>
                            <p class="description">Edit the JSON array above with custom slide titles, badges, and background banner image URLs.</p>

                            <p class="submit">
                                <input type="submit" name="tsmb_save_settings" class="button button-primary" value="Save Banner Settings" />
                            </p>
                        </form>

                    <!-- TAB 3: FLASH SALE & COUNTDOWN -->
                    <?php elseif ($active_tab === 'flash') : ?>
                        <h2 style="margin-top:0;">⚡ Flash Sale & Live Countdown Campaign</h2>
                        <form method="post" action="?page=thriving-skills-app&tab=flash">
                            <?php wp_nonce_field('tsmb_save_settings_nonce'); ?>
                            <table class="form-table">
                                <tr>
                                    <th scope="row">Enable Flash Sale</th>
                                    <td>
                                        <label><input name="flash_active" type="checkbox" value="1" <?php checked($flash_active, true); ?> /> Display live countdown timer banner on the mobile app.</label>
                                    </td>
                                </tr>
                                <tr>
                                    <th scope="row">Campaign Title</th>
                                    <td>
                                        <input name="flash_title" type="text" value="<?php echo esc_attr($flash_title); ?>" class="large-text" placeholder="e.g. Cyber Skills Flash Sale 50% Off" />
                                    </td>
                                </tr>
                                <tr>
                                    <th scope="row">Coupon Code</th>
                                    <td>
                                        <input name="flash_code" type="text" value="<?php echo esc_attr($flash_code); ?>" class="regular-text" placeholder="e.g. THRIVE50" />
                                    </td>
                                </tr>
                                <tr>
                                    <th scope="row">Discount Percentage (%)</th>
                                    <td>
                                        <input name="flash_discount" type="number" min="1" max="100" value="<?php echo esc_attr($flash_discount); ?>" class="small-text" /> %
                                    </td>
                                </tr>
                                <tr>
                                    <th scope="row">Sale End Date & Time</th>
                                    <td>
                                        <input name="flash_end" type="text" value="<?php echo esc_attr($flash_end); ?>" class="regular-text" placeholder="YYYY-MM-DD HH:MM:SS" />
                                        <p class="description">Format: YYYY-MM-DD HH:MM:SS (e.g. 2026-12-31 23:59:59)</p>
                                    </td>
                                </tr>
                            </table>

                            <p class="submit">
                                <input type="submit" name="tsmb_save_settings" class="button button-primary" value="Save Flash Sale Campaign" />
                            </p>
                        </form>

                    <!-- TAB 4: TRENDING SEARCH & SUPPORT -->
                    <?php elseif ($active_tab === 'chips') : ?>
                        <h2 style="margin-top:0;">🔍 Trending Search Chips & Learner Support</h2>
                        <form method="post" action="?page=thriving-skills-app&tab=chips">
                            <?php wp_nonce_field('tsmb_save_settings_nonce'); ?>
                            
                            <h3>Trending Search Keywords</h3>
                            <table class="form-table">
                                <tr>
                                    <th scope="row">Search Pills</th>
                                    <td>
                                        <input name="trending_keywords" type="text" value="<?php echo esc_attr($trending_raw); ?>" class="large-text" />
                                        <p class="description">Enter comma-separated keywords that appear as clickable chips below the search bar.</p>
                                    </td>
                                </tr>
                            </table>

                            <hr style="margin:24px 0;" />

                            <h3>Learner Support & Hotlines</h3>
                            <table class="form-table">
                                <tr>
                                    <th scope="row">WhatsApp Hotline</th>
                                    <td>
                                        <input name="support_whatsapp" type="text" value="<?php echo esc_attr($support_wa); ?>" class="regular-text" placeholder="+8801700000000" />
                                    </td>
                                </tr>
                                <tr>
                                    <th scope="row">Support Email</th>
                                    <td>
                                        <input name="support_email" type="email" value="<?php echo esc_attr($support_mail); ?>" class="regular-text" placeholder="support@thrivingskill.com" />
                                    </td>
                                </tr>
                                <tr>
                                    <th scope="row">Helpline Phone</th>
                                    <td>
                                        <input name="support_helpline" type="text" value="<?php echo esc_attr($support_phone); ?>" class="regular-text" placeholder="+88029876543" />
                                    </td>
                                </tr>
                            </table>

                            <p class="submit">
                                <input type="submit" name="tsmb_save_settings" class="button button-primary" value="Save Search & Support Settings" />
                            </p>
                        </form>

                    <!-- TAB 5: APP VERSION & SYSTEM -->
                    <?php elseif ($active_tab === 'version') : ?>
                        <h2 style="margin-top:0;">⚙️ App Version Control & System Hygiene</h2>
                        <form method="post" action="?page=thriving-skills-app&tab=version">
                            <?php wp_nonce_field('tsmb_save_settings_nonce'); ?>
                            <table class="form-table">
                                <tr>
                                    <th scope="row">Minimum Supported Version</th>
                                    <td>
                                        <input name="min_version" type="text" value="<?php echo esc_attr($min_version); ?>" class="regular-text" placeholder="1.0.0" />
                                        <p class="description">Devices running below this version will be prompted to update.</p>
                                    </td>
                                </tr>
                                <tr>
                                    <th scope="row">Latest Store Version</th>
                                    <td>
                                        <input name="latest_version" type="text" value="<?php echo esc_attr($latest_version); ?>" class="regular-text" placeholder="1.1.0" />
                                    </td>
                                </tr>
                                <tr>
                                    <th scope="row">Maintenance Mode</th>
                                    <td>
                                        <label><input name="maintenance_mode" type="checkbox" value="1" <?php checked($maintenance, true); ?> /> Temporarily display a maintenance notice on mobile.</label>
                                    </td>
                                </tr>
                            </table>

                            <p class="submit" style="display:flex;gap:12px;align-items:center;">
                                <input type="submit" name="tsmb_save_settings" class="button button-primary" value="Save Version Settings" />
                                <input type="submit" name="purge_cache" class="button button-secondary" value="Purge Mobile Feed Cache" />
                            </p>
                        </form>
                    <?php endif; ?>

                </div>

                <!-- Live Ecosystem Sidebar -->
                <div style="flex:1;min-width:260px;background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-radius:8px;height:fit-content;">
                    <h3 style="margin-top:0;display:flex;align-items:center;gap:8px;">
                        <span class="dashicons dashicons-admin-generic" style="color:#102F53;"></span> Ecosystem Status
                    </h3>
                    
                    <div style="background:#fff;padding:12px 16px;border-radius:6px;border:1px solid #e2e8f0;margin-bottom:12px;">
                        <div style="font-size:12px;color:#64748b;">Registered Push Devices</div>
                        <div style="font-size:24px;font-weight:700;color:#102F53;"><?php echo intval($total_devices); ?></div>
                    </div>

                    <div style="background:#fff;padding:12px 16px;border-radius:6px;border:1px solid #e2e8f0;margin-bottom:12px;">
                        <div style="font-size:12px;color:#64748b;">Checkout Policy</div>
                        <div style="font-weight:600;color:#0369a1;margin-top:2px;">WebView (Google Play Safe)</div>
                    </div>

                    <div style="background:#fff;padding:12px 16px;border-radius:6px;border:1px solid #e2e8f0;margin-bottom:16px;">
                        <div style="font-size:12px;color:#64748b;">Transient Cache</div>
                        <div style="margin-top:2px;">
                            <?php echo (get_transient('tsmb_mobile_feed_v1') !== false) 
                                ? '<span style="color:#15803d;font-weight:600;">Active (Cached)</span>' 
                                : '<span style="color:#64748b;">Not cached</span>'; ?>
                        </div>
                    </div>

                    <hr style="margin:16px 0;border:0;border-top:1px solid #cbd5e1;" />
                    <h4 style="margin:0 0 8px 0;font-size:13px;">API Diagnostics</h4>
                    <ul style="font-size:11px;color:#475569;line-height:1.7;padding-left:14px;margin:0;">
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
