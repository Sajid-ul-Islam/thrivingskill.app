<?php

/**
 * Administrator-only REST API endpoints for Thriving Skills Platform Analytics.
 *
 * All endpoints require an authenticated user holding `manage_options` and
 * disable intermediary/CDN caching on responses.
 */

if (!defined('ABSPATH')) {
    exit;
}

class TSMB_Analytics_Rest
{
    private static $initialized = false;

    public static function init(): void
    {
        if (self::$initialized) {
            return;
        }
        self::$initialized = true;
        add_action('rest_api_init', [__CLASS__, 'register_routes']);
    }

    public static function register_routes(): void
    {
        $common_args = self::get_filter_args_schema();

        register_rest_route(TSMB_Rest_API::NAMESPACE, '/admin/analytics', [
            'methods'             => 'GET',
            'callback'            => [__CLASS__, 'get_dashboard'],
            'permission_callback' => [__CLASS__, 'check_admin_access'],
            'args'                => $common_args,
        ]);

        $section_routes = [
            'overview'    => 'overview',
            'users'       => 'users',
            'enrollments' => 'enrollments',
            'revenue'     => 'revenue',
            'courses'     => 'course_performance',
            'conversions' => 'conversion',
        ];

        foreach ($section_routes as $slug => $section_key) {
            register_rest_route(TSMB_Rest_API::NAMESPACE, '/admin/analytics/' . $slug, [
                'methods'             => 'GET',
                'callback'            => static function ($request) use ($section_key) {
                    return self::get_section($request, $section_key);
                },
                'permission_callback' => [__CLASS__, 'check_admin_access'],
                'args'                => $common_args,
            ]);
        }
    }

    /**
     * Enforces authentication (401) and administrator capability (403) + gentle rate limit.
     *
     * @return true|WP_Error
     */
    public static function check_admin_access()
    {
        if (!is_user_logged_in() || get_current_user_id() <= 0) {
            return new WP_Error(
                'rest_not_logged_in',
                __('Authentication is required to access admin analytics.', 'ts-mobile-bridge'),
                ['status' => 401]
            );
        }

        if (!current_user_can('manage_options')) {
            return new WP_Error(
                'tsmb_admin_forbidden',
                __('Administrator privileges (manage_options) are required to view platform analytics.', 'ts-mobile-bridge'),
                ['status' => 403]
            );
        }

        $rl = TSMB_Security::consume_rate_limit(
            'admin_analytics_rest',
            (string) get_current_user_id(),
            120,
            MINUTE_IN_SECONDS
        );
        if (is_wp_error($rl)) {
            return $rl;
        }

        return true;
    }

    public static function get_dashboard($request)
    {
        $raw_params = self::extract_filter_params($request);
        $data = TSMB_Analytics_Service::get_dashboard_data($raw_params);
        if (is_wp_error($data)) {
            return $data;
        }

        return self::build_no_store_response($data);
    }

    public static function get_section($request, string $section_key)
    {
        $raw_params = self::extract_filter_params($request);
        $data = TSMB_Analytics_Service::get_section_data($section_key, $raw_params);
        if (is_wp_error($data)) {
            return $data;
        }

        return self::build_no_store_response($data);
    }

    private static function extract_filter_params($request): array
    {
        $keys = ['preset', 'start_date', 'end_date', 'course_id', 'refresh', 'nocache'];
        $out  = [];

        foreach ($keys as $key) {
            if (is_object($request) && method_exists($request, 'get_param')) {
                $val = $request->get_param($key);
                if ($val !== null) {
                    $out[$key] = $val;
                    continue;
                }
            }
            if (is_array($request) && array_key_exists($key, $request)) {
                $out[$key] = $request[$key];
            } elseif ($request instanceof \ArrayAccess && isset($request[$key])) {
                $out[$key] = $request[$key];
            }
        }

        return $out;
    }

    private static function build_no_store_response(array $payload): WP_REST_Response
    {
        $response = rest_ensure_response($payload);
        if (is_object($response) && method_exists($response, 'header')) {
            $response->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
            $response->header('Pragma', 'no-cache');
            $response->header('X-LiteSpeed-Cache-Control', 'no-cache');
            $response->header('X-Robots-Tag', 'noindex');
        }
        return $response;
    }

    private static function get_filter_args_schema(): array
    {
        return [
            'preset' => [
                'required'          => false,
                'sanitize_callback' => 'sanitize_key',
            ],
            'start_date' => [
                'required'          => false,
                'sanitize_callback' => 'sanitize_text_field',
            ],
            'end_date' => [
                'required'          => false,
                'sanitize_callback' => 'sanitize_text_field',
            ],
            'course_id' => [
                'required'          => false,
                'sanitize_callback' => 'sanitize_text_field',
            ],
            'refresh' => [
                'required' => false,
            ],
            'nocache' => [
                'required' => false,
            ],
        ];
    }
}
