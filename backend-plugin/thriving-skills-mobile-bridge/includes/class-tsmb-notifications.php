<?php
/**
 * Push Notification Manager for Thriving Skills Mobile Bridge
 * Supports Expo Push Service directly from WordPress action hooks.
 */

if (!defined('ABSPATH')) {
    exit;
}

class TSMB_Notifications {

    const OPTION_TOKENS = 'tsmb_registered_push_tokens';

    public static function init() {
        add_action('rest_api_init', [__CLASS__, 'register_routes']);
        add_action('transition_post_status', [__CLASS__, 'handle_post_transition'], 10, 3);
    }

    public static function register_routes() {
        register_rest_route('thrivingskill/v1', '/register-push-token', [
            'methods'  => 'POST',
            'callback' => [__CLASS__, 'register_token'],
            'permission_callback' => '__return_true',
            'args'     => [
                'token' => [
                    'required' => true,
                    'sanitize_callback' => 'sanitize_text_field',
                ],
                'platform' => [
                    'required' => false,
                    'sanitize_callback' => 'sanitize_text_field',
                ],
            ],
        ]);
    }

    /**
     * Register or update user device push token
     */
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

        // Store unique token with last_seen timestamp
        $tokens[$token] = [
            'platform'   => $platform,
            'updated_at' => current_time('mysql'),
        ];

        // Cap stored tokens to the most recent 10,000 to avoid excessive memory usage
        if (count($tokens) > 10000) {
            $tokens = array_slice($tokens, -10000, null, true);
        }

        update_option(self::OPTION_TOKENS, $tokens, false);

        return rest_ensure_response([
            'status'  => 'success',
            'message' => 'Push token registered successfully',
        ]);
    }

    /**
     * Send push notification when a new course is published
     */
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

    /**
     * Dispatches Push Notification to Expo Push Service API
     */
    public static function send_expo_push($payload) {
        $tokens_data = get_option(self::OPTION_TOKENS, []);
        if (empty($tokens_data) || !is_array($tokens_data)) {
            return;
        }

        $push_tokens = array_keys($tokens_data);
        if (empty($push_tokens)) {
            return;
        }

        // Expo allows sending up to 100 notifications per batch
        $batches = array_chunk($push_tokens, 100);

        foreach ($batches as $batch) {
            $messages = [];
            foreach ($batch as $token) {
                $messages[] = [
                    'to'        => $token,
                    'sound'     => 'default',
                    'title'     => $payload['title'] ?? 'Thriving Skills',
                    'body'      => $payload['body'] ?? '',
                    'data'      => $payload['data'] ?? [],
                    'priority'  => 'high',
                ];
            }

            // Non-blocking asynchronous remote post
            wp_remote_post('https://exp.host/--/api/v2/push/send', [
                'headers'  => [
                    'Accept'       => 'application/json',
                    'Content-Type' => 'application/json',
                ],
                'body'     => wp_json_encode($messages),
                'timeout'  => 5,
                'blocking' => false, // Asynchronous to prevent admin save delays
            ]);
        }
    }
}
