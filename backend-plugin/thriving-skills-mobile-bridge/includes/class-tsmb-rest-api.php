<?php
/**
 * REST API Endpoints for Thriving Skills Mobile Bridge
 */

if (!defined('ABSPATH')) {
    exit;
}

class TSMB_Rest_API {

    const NAMESPACE = 'thrivingskill/v1';

    public static function init() {
        add_action('rest_api_init', [__CLASS__, 'register_routes']);
        add_action('save_post_lp_course', [__CLASS__, 'clear_feed_cache']);
    }

    public static function register_routes() {
        // 1. App Remote Config & Version Control
        register_rest_route(self::NAMESPACE, '/config', [
            'methods'  => 'GET',
            'callback' => [__CLASS__, 'get_config'],
            'permission_callback' => '__return_true',
        ]);

        // 2. Ultra-lean Mobile Course Feed
        register_rest_route(self::NAMESPACE, '/feed', [
            'methods'  => 'GET',
            'callback' => [__CLASS__, 'get_feed'],
            'permission_callback' => '__return_true',
        ]);

        // 3. Optimized Lesson Detail with Clean Video Stream Meta
        register_rest_route(self::NAMESPACE, '/lessons/(?P<id>\d+)', [
            'methods'  => 'GET',
            'callback' => [__CLASS__, 'get_lesson_detail'],
            'permission_callback' => '__return_true',
            'args'     => [
                'id' => [
                    'validate_callback' => function($param) {
                        return is_numeric($param);
                    }
                ],
            ],
        ]);

        // 4. In-App Mobile Fast Registration (Name + Email + Phone + Password)
        register_rest_route(self::NAMESPACE, '/register', [
            'methods'  => 'POST',
            'callback' => [__CLASS__, 'register_user'],
            'permission_callback' => '__return_true',
        ]);
    }

    /**
     * Remote App Configuration
     */
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
                // Preserved as webview to strictly comply with Google Play In-App Purchase policies
                'mode'                 => 'webview',
                'checkout_url'         => home_url('/checkout'),
                'sslcommerz_active'    => true,
            ],
            'announcement_banner' => [
                'active'  => $banner_active,
                'message' => $banner_text,
                'target'  => $banner_link,
            ],
            'server_time' => current_time('mysql'),
        ]);
    }

    /**
     * High-Speed Lean Course Feed for Mobile
     * Reduces 400KB LearnPress response down to ~20KB
     */
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

                // Clean price
                $price         = get_post_meta($post_id, '_lp_price', true);
                $regular_price = get_post_meta($post_id, '_lp_regular_price', true);
                $duration      = get_post_meta($post_id, '_lp_duration', true);
                $level         = get_post_meta($post_id, '_lp_level', true);
                $students      = get_post_meta($post_id, '_lp_students', true);

                $bdt_price = is_numeric($price) ? floatval($price) : 0;
                $origin_price = is_numeric($regular_price) ? floatval($regular_price) : $bdt_price;

                // Thumbnail with dynamic site url scheme
                $thumb_url = get_the_post_thumbnail_url($post_id, 'medium_large');
                if ($thumb_url) {
                    $thumb_url = set_url_scheme($thumb_url, 'https');
                } else {
                    $site_icon = get_site_icon_url(512);
                    $thumb_url = $site_icon ? set_url_scheme($site_icon, 'https') : home_url('/wp-content/uploads/2023/11/logo.png');
                }

                // Instructor
                $author_id = get_the_author_meta('ID');
                $instructor_name = get_the_author_meta('display_name');
                $instructor_avatar = set_url_scheme(get_avatar_url($author_id, ['size' => 128]), 'https');

                // Category
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

        // Cache for 10 minutes to minimize database queries on heavy traffic
        set_transient($cache_key, $response, 10 * MINUTE_IN_SECONDS);

        return rest_ensure_response($response);
    }

    /**
     * Lesson Detail with Parsed Video Streaming Meta
     */
    public static function get_lesson_detail($request) {
        $lesson_id = intval($request['id']);
        $post = get_post($lesson_id);

        if (!$post || $post->post_type !== 'lp_lesson') {
            return new WP_Error('not_found', 'Lesson not found', ['status' => 404]);
        }

        $video_intro = get_post_meta($lesson_id, '_lp_lesson_video_intro', true);
        $video_url   = get_post_meta($lesson_id, 'video_url', true);

        // Parse video source cleanly on server
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
            'id'           => $lesson_id,
            'title'        => wp_strip_all_tags($post->post_title),
            'content'      => wp_strip_all_tags($post->post_content),
            'raw_content'  => $post->post_content,
            'video_url'    => $parsed_video_url ? set_url_scheme($parsed_video_url, 'https') : null,
            'video_type'   => $video_type,
            'duration'     => get_post_meta($lesson_id, '_lp_duration', true) ?: '10m',
        ]);
    }

    /**
     * In-App Mobile Fast Registration (Name + Email + Phone + Password)
     */
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
                __('Please provide a valid email address.', 'thriving-skills-mobile-bridge'),
                ['status' => 400]
            );
        }

        if (email_exists($email)) {
            return new WP_Error(
                'registration-error-email-exists',
                __('An account is already registered with your email address. Please log in.', 'thriving-skills-mobile-bridge'),
                ['status' => 400]
            );
        }

        if (empty($password) || strlen($password) < 6) {
            return new WP_Error(
                'registration-error-missing-password',
                __('Password must be at least 6 characters long.', 'thriving-skills-mobile-bridge'),
                ['status' => 400]
            );
        }

        // Auto-generate username from email if empty
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

        // Update user profile meta
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
            'message'  => __('Registration complete! You may now sign in.', 'thriving-skills-mobile-bridge'),
            'user_id'  => $user_id,
            'username' => $username,
            'email'    => $email,
        ]);
    }

    /**
     * Clear transient cache when course is updated in WP Admin
     */
    public static function clear_feed_cache() {
        delete_transient('tsmb_mobile_feed_v1');
    }
}
