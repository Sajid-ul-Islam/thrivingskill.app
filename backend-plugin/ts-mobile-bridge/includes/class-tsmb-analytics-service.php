<?php

/**
 * Authoritative WordPress, LearnPress, WooCommerce & Companion Analytics Service.
 *
 * Strictly reuses existing core and plugin records without creating or altering any
 * database tables, columns, indexes, or external infrastructure. Temporary response
 * caching uses WordPress transients only.
 */

if (!defined('ABSPATH')) {
    exit;
}

class TSMB_Analytics_Service
{
    public const CACHE_TTL_SECONDS = 300;
    public const CACHE_EPOCH_TRANSIENT = 'tsmb_analytics_epoch_v1';
    public const CACHE_KEY_PREFIX = 'tsmb_an_v1_';

    private static $hooks_registered = false;

    /**
     * Valid date range presets supported by REST and WP Admin filters.
     *
     * @var string[]
     */
    private static $valid_presets = [
        'today',
        '7d',
        '30d',
        '90d',
        'mtd',
        'ytd',
        'all',
        'custom',
    ];

    /**
     * Register lightweight transient cache invalidation hooks on commerce/LMS events.
     */
    public static function register_cache_hooks(): void
    {
        if (self::$hooks_registered) {
            return;
        }
        self::$hooks_registered = true;

        add_action('woocommerce_order_status_changed', [__CLASS__, 'invalidate_cache'], 20);
        add_action('woocommerce_new_order', [__CLASS__, 'invalidate_cache'], 20);
        add_action('woocommerce_refund_created', [__CLASS__, 'invalidate_cache'], 20);
        add_action('learn_press_user_enrolled_course', [__CLASS__, 'invalidate_cache'], 20);
        add_action('learnpress/user/course-enrolled', [__CLASS__, 'invalidate_cache'], 20);
        add_action('learnpress/user/course-finished', [__CLASS__, 'invalidate_cache'], 20);
        add_action('save_post_lp_course', [__CLASS__, 'invalidate_cache'], 20);
        add_action('user_register', [__CLASS__, 'invalidate_cache'], 20);
        add_action('deleted_user', [__CLASS__, 'invalidate_cache'], 20);
        add_action('wp_insert_comment', [__CLASS__, 'invalidate_cache'], 20);
    }

    /**
     * Rotates the transient cache epoch without creating any permanent options or SQL deletes.
     */
    public static function invalidate_cache(): void
    {
        $epoch = sprintf('%.6F_%d', microtime(true), random_int(1000, 9999));
        set_transient(self::CACHE_EPOCH_TRANSIENT, $epoch, DAY_IN_SECONDS);
    }

    /**
     * Reads or initializes the current transient cache epoch.
     */
    private static function get_cache_epoch(): string
    {
        $epoch = get_transient(self::CACHE_EPOCH_TRANSIENT);
        if (!is_string($epoch) || $epoch === '') {
            $epoch = sprintf('%.6F', microtime(true));
            set_transient(self::CACHE_EPOCH_TRANSIENT, $epoch, DAY_IN_SECONDS);
        }
        return $epoch;
    }

    /**
     * Validates and resolves date range, preset, course filter, and cache refresh options.
     *
     * @param array $raw_params Request or query parameters.
     * @return array|WP_Error Normalized filter payload or validation error.
     */
    public static function parse_and_validate_filters(array $raw_params)
    {
        $raw_preset = isset($raw_params['preset']) ? sanitize_key((string) $raw_params['preset']) : '';
        $start_raw  = isset($raw_params['start_date']) ? trim(sanitize_text_field((string) $raw_params['start_date'])) : '';
        $end_raw    = isset($raw_params['end_date']) ? trim(sanitize_text_field((string) $raw_params['end_date'])) : '';

        if ($raw_preset === '') {
            $preset = ($start_raw !== '' || $end_raw !== '') ? 'custom' : 'all';
        } else {
            $preset = $raw_preset;
        }

        if (!in_array($preset, self::$valid_presets, true)) {
            return new WP_Error(
                'invalid_analytics_preset',
                sprintf(
                    __('Unsupported preset "%s". Allowed presets: %s.', 'ts-mobile-bridge'),
                    $preset,
                    implode(', ', self::$valid_presets)
                ),
                ['status' => 400]
            );
        }

        $course_id = 0;
        if (isset($raw_params['course_id']) && $raw_params['course_id'] !== '' && $raw_params['course_id'] !== null) {
            if (!is_numeric($raw_params['course_id']) || intval($raw_params['course_id']) < 0) {
                return new WP_Error(
                    'invalid_course_id',
                    __('The course_id filter must be a non-negative integer.', 'ts-mobile-bridge'),
                    ['status' => 400]
                );
            }
            $course_id = absint($raw_params['course_id']);
            if ($course_id > 0) {
                $course_post = get_post($course_id);
                if (!$course_post || $course_post->post_type !== 'lp_course') {
                    return new WP_Error(
                        'course_not_found',
                        __('The requested course_id does not reference a LearnPress course.', 'ts-mobile-bridge'),
                        ['status' => 404]
                    );
                }
            }
        }

        $refresh = false;
        if (isset($raw_params['refresh']) || isset($raw_params['nocache'])) {
            $flag = $raw_params['refresh'] ?? ($raw_params['nocache'] ?? false);
            $refresh = ($flag === true || $flag === 1 || $flag === '1' || $flag === 'true');
        }

        $tz    = function_exists('wp_timezone') ? wp_timezone() : new \DateTimeZone('UTC');
        $utc   = new \DateTimeZone('UTC');
        $now   = function_exists('current_datetime') ? current_datetime() : new \DateTimeImmutable('now', $tz);
        $today = $now->setTime(0, 0, 0);

        $is_all_time = ($preset === 'all');
        $start_local = null;
        $end_local   = null;

        if ($preset === 'custom') {
            if ($start_raw === '' || $end_raw === '') {
                return new WP_Error(
                    'missing_custom_date_range',
                    __('Both start_date and end_date (YYYY-MM-DD) are required when preset=custom.', 'ts-mobile-bridge'),
                    ['status' => 400]
                );
            }
            $start_local = self::parse_strict_ymd($start_raw, $tz);
            $end_local   = self::parse_strict_ymd($end_raw, $tz);
            if ($start_local === null || $end_local === null) {
                return new WP_Error(
                    'invalid_date_format',
                    __('Dates must use valid YYYY-MM-DD format.', 'ts-mobile-bridge'),
                    ['status' => 400]
                );
            }
            if ($start_local->getTimestamp() > $end_local->getTimestamp()) {
                return new WP_Error(
                    'invalid_date_range',
                    __('start_date cannot be later than end_date.', 'ts-mobile-bridge'),
                    ['status' => 400]
                );
            }
            $end_local = $end_local->setTime(23, 59, 59);
        } elseif ($preset === 'today') {
            $start_local = $today;
            $end_local   = $today->setTime(23, 59, 59);
        } elseif ($preset === '7d') {
            $start_local = $today->modify('-6 days');
            $end_local   = $today->setTime(23, 59, 59);
        } elseif ($preset === '30d') {
            $start_local = $today->modify('-29 days');
            $end_local   = $today->setTime(23, 59, 59);
        } elseif ($preset === '90d') {
            $start_local = $today->modify('-89 days');
            $end_local   = $today->setTime(23, 59, 59);
        } elseif ($preset === 'mtd') {
            $start_local = $today->modify('first day of this month');
            $end_local   = $today->setTime(23, 59, 59);
        } elseif ($preset === 'ytd') {
            $year = $today->format('Y');
            $start_local = \DateTimeImmutable::createFromFormat('!Y-m-d', $year . '-01-01', $tz);
            $end_local   = $today->setTime(23, 59, 59);
        }

        if ($is_all_time || !($start_local instanceof \DateTimeImmutable) || !($end_local instanceof \DateTimeImmutable)) {
            return [
                'preset'       => 'all',
                'is_all_time'  => true,
                'start_date'   => null,
                'end_date'     => null,
                'start_gmt'    => null,
                'end_gmt'      => null,
                'start_utc_ts' => null,
                'end_utc_ts'   => null,
                'timezone'     => $tz->getName(),
                'course_id'    => $course_id,
                'refresh'      => $refresh,
                'granularity'  => 'month',
            ];
        }

        $start_utc = $start_local->setTimezone($utc);
        $end_utc   = $end_local->setTimezone($utc);
        $span_days = max(1, intval(floor(($end_local->getTimestamp() - $start_local->getTimestamp()) / DAY_IN_SECONDS)) + 1);

        return [
            'preset'       => $preset,
            'is_all_time'  => false,
            'start_date'   => $start_local->format('Y-m-d'),
            'end_date'     => $end_local->format('Y-m-d'),
            'start_gmt'    => $start_utc->format('Y-m-d H:i:s'),
            'end_gmt'      => $end_utc->format('Y-m-d H:i:s'),
            'start_utc_ts' => $start_utc->getTimestamp(),
            'end_utc_ts'   => $end_utc->getTimestamp(),
            'timezone'     => $tz->getName(),
            'course_id'    => $course_id,
            'refresh'      => $refresh,
            'granularity'  => $span_days <= 93 ? 'day' : 'month',
        ];
    }

    /**
     * Returns the full cached analytics bundle for the validated filters.
     *
     * @param array $raw_params Query parameters.
     * @return array|WP_Error Full analytics payload or validation error.
     */
    public static function get_dashboard_data(array $raw_params = [])
    {
        $filters = self::parse_and_validate_filters($raw_params);
        if (is_wp_error($filters)) {
            return $filters;
        }

        $epoch = self::get_cache_epoch();
        $cache_key = self::CACHE_KEY_PREFIX . substr(
            hash('sha256', wp_json_encode([
                $epoch,
                $filters['preset'],
                $filters['start_date'],
                $filters['end_date'],
                $filters['course_id'],
            ])),
            0,
            28
        );

        if (empty($filters['refresh'])) {
            $cached = get_transient($cache_key);
            if (is_array($cached) && isset($cached['overview'])) {
                $cached['meta']['cache_hit'] = true;
                return $cached;
            }
        }

        $started = microtime(true);

        $revenue_data = self::compute_revenue_and_orders($filters);
        $course_and_enrollment = self::compute_enrollments_and_courses(
            $filters,
            $revenue_data['course_attribution'] ?? []
        );
        $users_data = self::compute_users($filters, $revenue_data['paying_customer_ids'] ?? []);
        $conversion_data = self::compute_conversions(
            $filters,
            $users_data,
            $course_and_enrollment['enrollments'],
            $revenue_data
        );
        $companion_ops = self::compute_companion_ops($filters);
        $time_series = self::build_time_series(
            $filters,
            $revenue_data['paid_events'] ?? [],
            $course_and_enrollment['enrollment_events'] ?? [],
            $course_and_enrollment['completion_events'] ?? [],
            $users_data['registration_events'] ?? []
        );

        $enrollments = $course_and_enrollment['enrollments'];
        $course_performance = $course_and_enrollment['course_performance'];

        // Strip internal raw arrays from revenue before assembling response.
        $revenue_public = $revenue_data;
        unset($revenue_public['course_attribution'], $revenue_public['paying_customer_ids'], $revenue_public['paid_events']);
        unset($users_data['registration_events']);

        $overview = [
            'currency'                       => $revenue_public['currency'],
            'confirmed_revenue'              => $revenue_public['confirmed_revenue'],
            'confirmed_paid_orders'          => $revenue_public['confirmed_paid_orders'],
            'average_order_value'            => $revenue_public['average_order_value'],
            'pending_orders_count'           => $revenue_public['pending_orders_count'],
            'pending_orders_amount'          => $revenue_public['pending_orders_amount'],
            'site_users_total'               => $users_data['site_users_total'],
            'new_users_in_period'            => $users_data['new_site_users_in_period'],
            'raw_wp_users_total'             => $users_data['raw_wp_users_total'],
            'enrollments_in_period'          => $enrollments['enrollments_in_period'],
            'enrollments_all_time_active'    => $enrollments['active_snapshot_total'],
            'completions_in_period'          => $enrollments['completions_in_period'],
            'completions_all_time'           => $enrollments['completed_snapshot_total'],
            'completion_rate_percent'        => $enrollments['completion_rate_percent'],
            'published_courses_count'        => $enrollments['published_courses_count'],
            'registered_push_devices'        => $companion_ops['push_tokens']['total_devices'],
            'open_support_tickets'           => $companion_ops['support_tickets']['open_count'],
            'new_corporate_leads'            => $companion_ops['corporate_inquiries']['new_count'],
        ];

        $generated_at = gmdate('Y-m-d H:i:s');
        $payload = [
            'meta' => [
                'plugin_version'    => defined('TSMB_VERSION') ? TSMB_VERSION : '1.4.0',
                'schema_modified'   => false,
                'generated_at_gmt'  => $generated_at,
                'computation_ms'    => round((microtime(true) - $started) * 1000, 1),
                'cache_hit'         => false,
                'cache_ttl_seconds' => self::CACHE_TTL_SECONDS,
                'cache_backend'     => 'wordpress_transient',
            ],
            'filters'             => [
                'preset'      => $filters['preset'],
                'is_all_time' => $filters['is_all_time'],
                'start_date'  => $filters['start_date'],
                'end_date'    => $filters['end_date'],
                'timezone'    => $filters['timezone'],
                'course_id'   => $filters['course_id'],
                'granularity' => $filters['granularity'],
            ],
            'overview'            => $overview,
            'users'               => $users_data,
            'enrollments'         => $enrollments,
            'revenue'             => $revenue_public,
            'course_performance'  => $course_performance,
            'conversion'          => $conversion_data,
            'companion_ops'       => $companion_ops,
            'time_series'         => $time_series,
            'data_sources'        => self::get_data_source_notes($revenue_public),
            'unsupported_metrics' => self::get_unsupported_metrics_catalog(),
        ];

        set_transient($cache_key, $payload, self::CACHE_TTL_SECONDS);

        return $payload;
    }

    /**
     * Computes a specific analytics section using the same cached calculation pipeline.
     *
     * @param string $section One of overview, users, enrollments, revenue, course_performance, conversion.
     * @param array  $raw_params Query filters.
     * @return array|WP_Error Section response or WP_Error.
     */
    public static function get_section_data(string $section, array $raw_params = [])
    {
        $dashboard = self::get_dashboard_data($raw_params);
        if (is_wp_error($dashboard)) {
            return $dashboard;
        }

        if (!array_key_exists($section, $dashboard)) {
            return new WP_Error(
                'invalid_analytics_section',
                __('Unknown analytics section.', 'ts-mobile-bridge'),
                ['status' => 400]
            );
        }

        return [
            'meta'                => $dashboard['meta'],
            'filters'             => $dashboard['filters'],
            'section'             => $section,
            'data'                => $dashboard[$section],
            'data_sources'        => $dashboard['data_sources'],
            'unsupported_metrics' => $dashboard['unsupported_metrics'],
        ];
    }

    /**
     * Parses strict YYYY-MM-DD calendar strings without using strtotime().
     */
    private static function parse_strict_ymd(string $value, \DateTimeZone $tz): ?\DateTimeImmutable
    {
        if (!preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $value, $m)) {
            return null;
        }
        $year  = intval($m[1]);
        $month = intval($m[2]);
        $day   = intval($m[3]);
        if (!checkdate($month, $day, $year)) {
            return null;
        }
        $dt = \DateTimeImmutable::createFromFormat('!Y-m-d', $value, $tz);
        return ($dt instanceof \DateTimeImmutable) ? $dt : null;
    }

    /**
     * Checks whether a given database table exists.
     */
    private static function table_exists(string $table_name): bool
    {
        global $wpdb;
        if (!isset($wpdb) || !is_object($wpdb)) {
            return false;
        }
        return $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $table_name)) === $table_name;
    }

    /**
     * Checks whether a column exists on an existing database table.
     */
    private static function table_has_column(string $table_name, string $column_name): bool
    {
        global $wpdb;
        if (!isset($wpdb) || !is_object($wpdb) || !self::table_exists($table_name)) {
            return false;
        }
        $safe_col = sanitize_key($column_name);
        return $wpdb->get_var($wpdb->prepare("SHOW COLUMNS FROM `{$table_name}` LIKE %s", $safe_col)) !== null;
    }

    /**
     * Checks whether WooCommerce High-Performance Order Storage (HPOS) is active.
     */
    private static function is_wc_hpos_enabled(): bool
    {
        global $wpdb;
        if (
            class_exists('\Automattic\WooCommerce\Utilities\OrderUtil') &&
            method_exists('\Automattic\WooCommerce\Utilities\OrderUtil', 'custom_orders_table_usage_is_enabled')
        ) {
            if (\Automattic\WooCommerce\Utilities\OrderUtil::custom_orders_table_usage_is_enabled()) {
                return self::table_exists($wpdb->prefix . 'wc_orders');
            }
        }
        return false;
    }

    /**
     * Computes user totals, capability-scoped accounts, roles, registrations, and learner reach.
     */
    private static function compute_users(array $filters, array $paying_customer_ids): array
    {
        global $wpdb;

        $cap_meta_key = $wpdb->prefix . 'capabilities';
        $has_usermeta = isset($wpdb->usermeta) && is_string($wpdb->usermeta) && $wpdb->usermeta !== '';
        $has_users    = isset($wpdb->users) && is_string($wpdb->users) && $wpdb->users !== '';

        $raw_wp_users_total      = 0;
        $raw_new_in_period       = 0;
        $site_users_total        = 0;
        $new_site_users_in_period = 0;
        $roles_breakdown         = [];
        $registration_events     = [];

        if ($has_users) {
            $raw_wp_users_total = intval($wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->users}"));
            if (!empty($filters['is_all_time'])) {
                $raw_new_in_period = $raw_wp_users_total;
            } else {
                $raw_new_in_period = intval(
                    $wpdb->get_var(
                        $wpdb->prepare(
                            "SELECT COUNT(*) FROM {$wpdb->users} WHERE user_registered >= %s AND user_registered <= %s",
                            $filters['start_gmt'],
                            $filters['end_gmt']
                        )
                    )
                );
            }
        }

        if ($has_users && $has_usermeta) {
            $user_rows = $wpdb->get_results(
                $wpdb->prepare(
                    "SELECT u.ID, u.user_registered, um.meta_value AS capabilities_raw
                     FROM {$wpdb->users} u
                     INNER JOIN {$wpdb->usermeta} um
                         ON um.user_id = u.ID AND um.meta_key = %s",
                    $cap_meta_key
                ),
                ARRAY_A
            );

            if (is_array($user_rows)) {
                foreach ($user_rows as $row) {
                    $site_users_total++;
                    $reg_gmt = (string) ($row['user_registered'] ?? '');
                    if (self::is_gmt_in_range($reg_gmt, $filters)) {
                        $new_site_users_in_period++;
                        if (self::is_valid_mysql_datetime($reg_gmt)) {
                            $registration_events[] = $reg_gmt;
                        }
                    }

                    $caps = self::safe_unserialize_array((string) ($row['capabilities_raw'] ?? ''));
                    $wp_roles_obj = function_exists('wp_roles') ? wp_roles() : null;
                    $assigned = false;
                    foreach ($caps as $role_key => $enabled) {
                        if ($enabled) {
                            $clean_role = sanitize_key((string) $role_key);
                            if ($clean_role !== '') {
                                // Only count actual WordPress roles (skip plugin-specific granular capability flags).
                                if (
                                    $wp_roles_obj &&
                                    method_exists($wp_roles_obj, 'is_role') &&
                                    !$wp_roles_obj->is_role($clean_role)
                                ) {
                                    continue;
                                }
                                $roles_breakdown[$clean_role] = ($roles_breakdown[$clean_role] ?? 0) + 1;
                                $assigned = true;
                            }
                        }
                    }
                    if (!$assigned) {
                        $roles_breakdown['none'] = ($roles_breakdown['none'] ?? 0) + 1;
                    }
                }
            }

            // Count mobile companion opt-in learners (gamification/watch meta exists).
            $mobile_synced_learners = intval(
                $wpdb->get_var(
                    "SELECT COUNT(DISTINCT user_id)
                     FROM {$wpdb->usermeta}
                     WHERE meta_key IN ('tsmb_watch_positions_v1', 'tsmb_gamification_v1')"
                )
            );
        } else {
            $mobile_synced_learners = 0;
        }

        arsort($roles_breakdown);

        $lp_items_table = $wpdb->prefix . 'learnpress_user_items';
        $enrolled_learners_all_time = 0;
        $enrolled_learners_period   = 0;
        $active_lesson_learners_period = 0;
        $completed_learners_all_time = 0;
        $course_filter_id = intval($filters['course_id'] ?? 0);

        if (self::table_exists($lp_items_table)) {
            $course_ui_clause = $course_filter_id > 0
                ? $wpdb->prepare(' AND ui.item_id = %d', $course_filter_id)
                : '';

            $enrolled_learners_all_time = intval(
                $wpdb->get_var(
                    "SELECT COUNT(DISTINCT ui.user_id)
                     FROM {$lp_items_table} ui
                     INNER JOIN {$wpdb->posts} p ON p.ID = ui.item_id
                     WHERE ui.item_type = 'lp_course'
                       AND p.post_type = 'lp_course'
                       AND p.post_status = 'publish'
                       AND ui.status IN ('enrolled', 'finished', 'purchased'){$course_ui_clause}"
                )
            );

            $completed_learners_all_time = intval(
                $wpdb->get_var(
                    "SELECT COUNT(DISTINCT ui.user_id)
                     FROM {$lp_items_table} ui
                     INNER JOIN {$wpdb->posts} p ON p.ID = ui.item_id
                     WHERE ui.item_type = 'lp_course'
                       AND p.post_type = 'lp_course'
                       AND p.post_status = 'publish'
                       AND ui.status = 'finished'
                       AND (ui.graduation IS NULL OR ui.graduation != 'failed'){$course_ui_clause}"
                )
            );

            if (!empty($filters['is_all_time'])) {
                $enrolled_learners_period = $enrolled_learners_all_time;
                $active_lesson_learners_period = intval(
                    $wpdb->get_var(
                        "SELECT COUNT(DISTINCT user_id)
                         FROM {$lp_items_table}
                         WHERE item_type IN ('lp_lesson', 'lp_quiz')
                           AND status IN ('completed', 'started', 'passed', 'failed')"
                    )
                );
            } else {
                $enrolled_learners_period = intval(
                    $wpdb->get_var(
                        $wpdb->prepare(
                            "SELECT COUNT(DISTINCT ui.user_id)
                             FROM {$lp_items_table} ui
                             INNER JOIN {$wpdb->posts} p ON p.ID = ui.item_id
                             WHERE ui.item_type = 'lp_course'
                               AND p.post_type = 'lp_course'
                               AND p.post_status = 'publish'
                               AND ui.status IN ('enrolled', 'finished', 'purchased'){$course_ui_clause}
                               AND ui.start_time >= %s
                               AND ui.start_time <= %s",
                            $filters['start_gmt'],
                            $filters['end_gmt']
                        )
                    )
                );

                $active_lesson_learners_period = intval(
                    $wpdb->get_var(
                        $wpdb->prepare(
                            "SELECT COUNT(DISTINCT user_id)
                             FROM {$lp_items_table}
                             WHERE item_type IN ('lp_lesson', 'lp_quiz')
                               AND status IN ('completed', 'started', 'passed', 'failed')
                               AND (
                                   (start_time >= %s AND start_time <= %s)
                                   OR (end_time >= %s AND end_time <= %s)
                               )",
                            $filters['start_gmt'],
                            $filters['end_gmt'],
                            $filters['start_gmt'],
                            $filters['end_gmt']
                        )
                    )
                );
            }
        }

        $legacy_users_without_caps = max(0, $raw_wp_users_total - $site_users_total);

        return [
            'site_users_total'               => $site_users_total,
            'new_site_users_in_period'       => $new_site_users_in_period,
            'raw_wp_users_total'             => $raw_wp_users_total,
            'raw_new_users_in_period'        => $raw_new_in_period,
            'legacy_users_without_site_caps' => $legacy_users_without_caps,
            'roles_breakdown'                => $roles_breakdown,
            'enrolled_learners_all_time'     => $enrolled_learners_all_time,
            'enrolled_learners_in_period'    => $enrolled_learners_period,
            'active_lesson_learners_period'  => $active_lesson_learners_period,
            'completed_learners_all_time'    => $completed_learners_all_time,
            'paying_customers_in_period'     => count($paying_customer_ids),
            'mobile_synced_learners'         => $mobile_synced_learners,
            'registration_events'            => $registration_events,
        ];
    }

    /**
     * Computes enrollments, course progress, completion rates, quizzes, and course-level metrics.
     */
    private static function compute_enrollments_and_courses(array $filters, array $course_attribution): array
    {
        global $wpdb;

        $course_filter_id = intval($filters['course_id'] ?? 0);
        $lp_items_table   = $wpdb->prefix . 'learnpress_user_items';
        $sections_table   = $wpdb->prefix . 'learnpress_sections';
        $sec_items_table  = $wpdb->prefix . 'learnpress_section_items';

        // 1. Fetch published LearnPress courses (plus status summary).
        $course_status_counts = [
            'publish' => 0,
            'draft'   => 0,
            'pending' => 0,
            'other'   => 0,
        ];
        $status_rows = $wpdb->get_results(
            "SELECT post_status, COUNT(*) AS cnt
             FROM {$wpdb->posts}
             WHERE post_type = 'lp_course'
               AND post_status NOT IN ('trash', 'auto-draft')
             GROUP BY post_status",
            ARRAY_A
        );
        if (is_array($status_rows)) {
            foreach ($status_rows as $sr) {
                $st  = (string) ($sr['post_status'] ?? 'other');
                $cnt = intval($sr['cnt'] ?? 0);
                if (isset($course_status_counts[$st])) {
                    $course_status_counts[$st] = $cnt;
                } else {
                    $course_status_counts['other'] += $cnt;
                }
            }
        }

        $course_sql = "SELECT ID, post_title, post_author, post_date_gmt
                       FROM {$wpdb->posts}
                       WHERE post_type = 'lp_course'
                         AND post_status = 'publish'";
        if ($course_filter_id > 0) {
            $course_rows = $wpdb->get_results(
                $wpdb->prepare($course_sql . ' AND ID = %d ORDER BY ID DESC', $course_filter_id),
                ARRAY_A
            );
        } else {
            $course_rows = $wpdb->get_results($course_sql . ' ORDER BY ID DESC', ARRAY_A);
        }

        $courses_map = [];
        $course_ids  = [];
        if (is_array($course_rows)) {
            foreach ($course_rows as $cr) {
                $cid = intval($cr['ID']);
                $course_ids[] = $cid;
                $raw_price = get_post_meta($cid, '_lp_price', true);
                $price     = is_numeric($raw_price) ? round(max(0.0, floatval($raw_price)), 2) : 0.0;
                $lp_stu    = get_post_meta($cid, '_lp_students', true);

                $courses_map[$cid] = [
                    'course_id'                 => $cid,
                    'title'                     => html_entity_decode(wp_strip_all_tags((string) $cr['post_title']), ENT_QUOTES, 'UTF-8'),
                    'price_bdt'                 => $price,
                    'is_free'                   => ($price <= 0.0),
                    'lessons_count'             => 0,
                    'quizzes_count'             => 0,
                    'curriculum_items_count'    => 0,
                    'enrolled_all_time'         => 0,
                    'in_progress_all_time'      => 0,
                    'completed_all_time'        => 0,
                    'failed_all_time'           => 0,
                    'enrolled_in_period'        => 0,
                    'completed_in_period'       => 0,
                    'completion_rate_percent'   => 0.0,
                    'avg_progress_percent'      => null,
                    'paid_orders_count'         => 0,
                    'paid_units_sold'           => 0,
                    'confirmed_revenue'         => 0.0,
                    'reviews_count'             => 0,
                    'avg_rating'                => null,
                    'legacy_lp_students_meta'   => (is_numeric($lp_stu) && intval($lp_stu) > 0) ? intval($lp_stu) : 0,
                ];
            }
        }

        // 2. Curriculum lesson & quiz inventory per published course.
        $total_published_lessons = 0;
        $total_published_quizzes = 0;
        if (
            !empty($course_ids) &&
            self::table_exists($sections_table) &&
            self::table_exists($sec_items_table)
        ) {
            $curr_rows = $wpdb->get_results(
                "SELECT s.section_course_id AS course_id,
                        si.item_type,
                        COUNT(DISTINCT si.item_id) AS item_count
                 FROM {$sec_items_table} si
                 INNER JOIN {$sections_table} s ON s.section_id = si.section_id
                 INNER JOIN {$wpdb->posts} p ON p.ID = si.item_id
                 WHERE si.item_type IN ('lp_lesson', 'lp_quiz')
                   AND p.post_status = 'publish'
                 GROUP BY s.section_course_id, si.item_type",
                ARRAY_A
            );
            if (is_array($curr_rows)) {
                foreach ($curr_rows as $cur) {
                    $cid  = intval($cur['course_id'] ?? 0);
                    $type = (string) ($cur['item_type'] ?? '');
                    $cnt  = intval($cur['item_count'] ?? 0);
                    if (!isset($courses_map[$cid])) {
                        continue;
                    }
                    if ($type === 'lp_lesson') {
                        $courses_map[$cid]['lessons_count'] += $cnt;
                        $total_published_lessons += $cnt;
                    } elseif ($type === 'lp_quiz') {
                        $courses_map[$cid]['quizzes_count'] += $cnt;
                        $total_published_quizzes += $cnt;
                    }
                    $courses_map[$cid]['curriculum_items_count'] =
                        $courses_map[$cid]['lessons_count'] + $courses_map[$cid]['quizzes_count'];
                }
            }
        }

        // 3. Reviews & ratings per course (authentic approved LearnPress reviews only).
        if (!empty($course_ids)) {
            $placeholders = implode(',', array_fill(0, count($course_ids), '%d'));
            $rev_rows = $wpdb->get_results(
                $wpdb->prepare(
                    "SELECT c.comment_post_ID AS course_id,
                            AVG(CAST(cm.meta_value AS DECIMAL(4,2))) AS avg_rating,
                            COUNT(DISTINCT c.comment_ID) AS review_count
                     FROM {$wpdb->comments} c
                     INNER JOIN {$wpdb->commentmeta} cm
                         ON cm.comment_id = c.comment_ID AND cm.meta_key = '_lpr_rating'
                     WHERE c.comment_approved = '1'
                       AND c.comment_type = 'review'
                       AND c.comment_post_ID IN ({$placeholders})
                       AND CAST(cm.meta_value AS DECIMAL(4,2)) > 0
                     GROUP BY c.comment_post_ID",
                    ...$course_ids
                ),
                ARRAY_A
            );
            if (is_array($rev_rows)) {
                foreach ($rev_rows as $rr) {
                    $cid = intval($rr['course_id'] ?? 0);
                    if (isset($courses_map[$cid])) {
                        $cnt = intval($rr['review_count'] ?? 0);
                        $avg = round(floatval($rr['avg_rating'] ?? 0), 2);
                        $courses_map[$cid]['reviews_count'] = $cnt;
                        $courses_map[$cid]['avg_rating'] = $cnt > 0 ? min(5.0, max(1.0, $avg)) : null;
                    }
                }
            }
        }

        // 4. Authoritative enrollment & completion metrics from learnpress_user_items.
        $active_snapshot_total    = 0;
        $in_progress_snapshot     = 0;
        $completed_snapshot_total = 0;
        $failed_snapshot_total    = 0;
        $enrollments_in_period    = 0;
        $completions_in_period    = 0;
        $free_enrollments_period  = 0;
        $paid_course_enrollments_period = 0;
        $free_enrollments_all_time = 0;
        $paid_course_enrollments_all_time = 0;
        $enrollment_events        = [];
        $completion_events        = [];
        $progress_sums            = [];
        $progress_counts          = [];

        $quiz_stats = [
            'attempts_total'   => 0,
            'passed_total'     => 0,
            'failed_total'     => 0,
            'in_progress'      => 0,
            'attempts_period'  => 0,
        ];

        if (self::table_exists($lp_items_table)) {
            $child_completed_by_parent = [];
            $child_rows = $wpdb->get_results(
                "SELECT parent_id, COUNT(DISTINCT item_id) AS completed_cnt
                 FROM {$lp_items_table}
                 WHERE item_type IN ('lp_lesson', 'lp_quiz')
                   AND status = 'completed'
                   AND parent_id > 0
                 GROUP BY parent_id",
                ARRAY_A
            );
            if (is_array($child_rows)) {
                foreach ($child_rows as $ch) {
                    $pid = intval($ch['parent_id'] ?? 0);
                    if ($pid > 0) {
                        $child_completed_by_parent[$pid] = intval($ch['completed_cnt'] ?? 0);
                    }
                }
            }

            $course_where = $course_filter_id > 0
                ? $wpdb->prepare(' AND ui.item_id = %d', $course_filter_id)
                : '';

            $enr_rows = $wpdb->get_results(
                "SELECT ui.user_item_id, ui.user_id, ui.item_id AS course_id,
                        ui.status, ui.graduation, ui.start_time, ui.end_time
                 FROM {$lp_items_table} ui
                 INNER JOIN (
                     SELECT user_id, item_id, MAX(user_item_id) AS latest_id
                     FROM {$lp_items_table}
                     WHERE item_type = 'lp_course'
                     GROUP BY user_id, item_id
                 ) latest ON latest.latest_id = ui.user_item_id
                 INNER JOIN {$wpdb->posts} p ON p.ID = ui.item_id
                 WHERE p.post_type = 'lp_course'
                   AND p.post_status = 'publish'
                   AND ui.status IN ('enrolled', 'finished', 'purchased'){$course_where}",
                ARRAY_A
            );

            if (is_array($enr_rows)) {
                foreach ($enr_rows as $er) {
                    $cid        = intval($er['course_id'] ?? 0);
                    $ui_id      = intval($er['user_item_id'] ?? 0);
                    $status     = strtolower((string) ($er['status'] ?? ''));
                    $graduation = strtolower((string) ($er['graduation'] ?? ''));
                    $start_time = (string) ($er['start_time'] ?? '');
                    $end_time   = (string) ($er['end_time'] ?? '');

                    if (!isset($courses_map[$cid])) {
                        continue;
                    }

                    $is_free_course = !empty($courses_map[$cid]['is_free']);
                    $is_finished    = ($status === 'finished');
                    $is_failed      = ($is_finished && $graduation === 'failed');
                    $is_passed      = ($is_finished && !$is_failed);

                    $active_snapshot_total++;
                    $courses_map[$cid]['enrolled_all_time']++;

                    if ($is_free_course) {
                        $free_enrollments_all_time++;
                    } else {
                        $paid_course_enrollments_all_time++;
                    }

                    if ($is_passed) {
                        $completed_snapshot_total++;
                        $courses_map[$cid]['completed_all_time']++;
                    } elseif ($is_failed) {
                        $failed_snapshot_total++;
                        $courses_map[$cid]['failed_all_time']++;
                    } else {
                        $in_progress_snapshot++;
                        $courses_map[$cid]['in_progress_all_time']++;
                    }

                    // Progress percentage for this enrollment
                    $curr_total = intval($courses_map[$cid]['curriculum_items_count']);
                    $done_cnt   = intval($child_completed_by_parent[$ui_id] ?? 0);
                    $pct        = null;
                    if ($is_passed) {
                        $pct = 100.0;
                    } elseif ($curr_total > 0) {
                        $pct = min(100.0, round(($done_cnt / $curr_total) * 100.0, 1));
                    }
                    if ($pct !== null) {
                        $progress_sums[$cid]   = ($progress_sums[$cid] ?? 0.0) + $pct;
                        $progress_counts[$cid] = ($progress_counts[$cid] ?? 0) + 1;
                    }

                    // Period filtering using start_time / end_time (UTC timestamps in LearnPress)
                    if (self::is_gmt_in_range($start_time, $filters)) {
                        $enrollments_in_period++;
                        $courses_map[$cid]['enrolled_in_period']++;
                        if ($is_free_course) {
                            $free_enrollments_period++;
                        } else {
                            $paid_course_enrollments_period++;
                        }
                        if (self::is_valid_mysql_datetime($start_time)) {
                            $enrollment_events[] = $start_time;
                        }
                    }

                    if ($is_passed && self::is_gmt_in_range($end_time, $filters)) {
                        $completions_in_period++;
                        $courses_map[$cid]['completed_in_period']++;
                        if (self::is_valid_mysql_datetime($end_time)) {
                            $completion_events[] = $end_time;
                        }
                    }
                }
            }

            // Quiz execution statistics
            $quiz_rows = $wpdb->get_results(
                "SELECT status, graduation, start_time
                 FROM {$lp_items_table}
                 WHERE item_type = 'lp_quiz'",
                ARRAY_A
            );
            if (is_array($quiz_rows)) {
                foreach ($quiz_rows as $qr) {
                    $q_st   = strtolower((string) ($qr['status'] ?? ''));
                    $q_grad = strtolower((string) ($qr['graduation'] ?? ''));
                    $q_time = (string) ($qr['start_time'] ?? '');
                    $quiz_stats['attempts_total']++;
                    if ($q_grad === 'passed') {
                        $quiz_stats['passed_total']++;
                    } elseif ($q_grad === 'failed') {
                        $quiz_stats['failed_total']++;
                    } elseif ($q_st === 'started') {
                        $quiz_stats['in_progress']++;
                    }
                    if (self::is_gmt_in_range($q_time, $filters)) {
                        $quiz_stats['attempts_period']++;
                    }
                }
            }
        }

        // Merge confirmed WooCommerce / direct revenue attribution into each course row.
        $all_progress_sum   = 0.0;
        $all_progress_count = 0;

        foreach ($courses_map as $cid => $c) {
            if (!empty($c['enrolled_all_time'])) {
                $courses_map[$cid]['completion_rate_percent'] = round(
                    ($c['completed_all_time'] / $c['enrolled_all_time']) * 100.0,
                    1
                );
            }
            if (!empty($progress_counts[$cid])) {
                $avg_p = round($progress_sums[$cid] / $progress_counts[$cid], 1);
                $courses_map[$cid]['avg_progress_percent'] = $avg_p;
                $all_progress_sum += $progress_sums[$cid];
                $all_progress_count += $progress_counts[$cid];
            }
            if (isset($course_attribution[$cid])) {
                $courses_map[$cid]['paid_orders_count'] = intval($course_attribution[$cid]['orders_count'] ?? 0);
                $courses_map[$cid]['paid_units_sold']   = intval($course_attribution[$cid]['units_sold'] ?? 0);
                $courses_map[$cid]['confirmed_revenue'] = round(floatval($course_attribution[$cid]['revenue'] ?? 0.0), 2);
            }
        }

        $course_performance = array_values($courses_map);
        usort($course_performance, static function (array $a, array $b): int {
            if ($b['confirmed_revenue'] !== $a['confirmed_revenue']) {
                return ($b['confirmed_revenue'] > $a['confirmed_revenue']) ? 1 : -1;
            }
            if ($b['enrolled_in_period'] !== $a['enrolled_in_period']) {
                return $b['enrolled_in_period'] - $a['enrolled_in_period'];
            }
            return $b['enrolled_all_time'] - $a['enrolled_all_time'];
        });

        $completion_rate_overall = $active_snapshot_total > 0
            ? round(($completed_snapshot_total / $active_snapshot_total) * 100.0, 1)
            : 0.0;

        $avg_progress_overall = $all_progress_count > 0
            ? round($all_progress_sum / $all_progress_count, 1)
            : null;

        $courses_without_enrollments = 0;
        $courses_empty_curriculum    = 0;
        foreach ($course_performance as $cp) {
            if ($cp['enrolled_all_time'] === 0) {
                $courses_without_enrollments++;
            }
            if ($cp['curriculum_items_count'] === 0) {
                $courses_empty_curriculum++;
            }
        }

        return [
            'enrollments' => [
                'enrollments_in_period'            => $enrollments_in_period,
                'completions_in_period'            => $completions_in_period,
                'free_enrollments_in_period'       => $free_enrollments_period,
                'paid_course_enrollments_period'   => $paid_course_enrollments_period,
                'active_snapshot_total'            => $active_snapshot_total,
                'in_progress_snapshot_total'       => $in_progress_snapshot,
                'completed_snapshot_total'         => $completed_snapshot_total,
                'failed_snapshot_total'            => $failed_snapshot_total,
                'free_enrollments_all_time'        => $free_enrollments_all_time,
                'paid_course_enrollments_all_time' => $paid_course_enrollments_all_time,
                'completion_rate_percent'          => $completion_rate_overall,
                'avg_progress_percent'             => $avg_progress_overall,
                'published_courses_count'          => $course_status_counts['publish'],
                'draft_or_pending_courses_count'   => $course_status_counts['draft'] + $course_status_counts['pending'],
                'published_lessons_count'          => $total_published_lessons,
                'published_quizzes_count'          => $total_published_quizzes,
                'courses_without_enrollments'      => $courses_without_enrollments,
                'courses_empty_curriculum'         => $courses_empty_curriculum,
                'quizzes'                          => $quiz_stats,
            ],
            'course_performance' => $course_performance,
            'enrollment_events'  => $enrollment_events,
            'completion_events'  => $completion_events,
        ];
    }

    /**
     * Computes authoritative revenue & orders from WooCommerce (HPOS or Legacy CPT)
     * plus reconciled LearnPress order audit without double-counting or fake free revenue.
     */
    private static function compute_revenue_and_orders(array $filters): array
    {
        global $wpdb;

        $currency        = sanitize_text_field((string) get_option('woocommerce_currency', 'BDT')) ?: 'BDT';
        $course_filter   = intval($filters['course_id'] ?? 0);
        $is_hpos         = self::is_wc_hpos_enabled();
        $wc_orders_list  = $is_hpos ? self::fetch_wc_hpos_orders() : self::fetch_wc_legacy_orders();

        $paid_statuses     = ['completed', 'processing'];
        $status_breakdown  = [
            'completed'  => ['count' => 0, 'amount' => 0.0],
            'processing' => ['count' => 0, 'amount' => 0.0],
            'pending'    => ['count' => 0, 'amount' => 0.0],
            'on-hold'    => ['count' => 0, 'amount' => 0.0],
            'failed'     => ['count' => 0, 'amount' => 0.0],
            'cancelled'  => ['count' => 0, 'amount' => 0.0],
            'refunded'   => ['count' => 0, 'amount' => 0.0],
            'other'      => ['count' => 0, 'amount' => 0.0],
        ];
        $gateway_breakdown = [];

        $wc_order_ids_in_scope   = [];
        $linked_lp_order_ids_map = [];
        $in_scope_paid_orders    = [];
        $paying_customer_ids     = [];
        $paid_events             = [];
        $gross_paid_total        = 0.0;
        $refunds_deducted_total  = 0.0;
        $confirmed_revenue       = 0.0;
        $confirmed_paid_orders   = 0;
        $free_zero_wc_orders     = 0;

        // Fetch line items in batch for all WC orders so course_id filtering & course attribution stay fast.
        $all_wc_order_ids = array_map(static function ($o) {
            return intval($o['id']);
        }, $wc_orders_list);
        $wc_items_by_order = self::fetch_wc_line_items_grouped($all_wc_order_ids);

        foreach ($wc_orders_list as $ord) {
            $oid       = intval($ord['id']);
            $status    = self::normalize_wc_status((string) ($ord['status'] ?? ''));
            $is_paid_st = in_array($status, $paid_statuses, true);
            $lp_ref    = intval($ord['lp_order_id'] ?? 0);
            if ($lp_ref > 0) {
                $linked_lp_order_ids_map[$lp_ref] = $oid;
            }

            // Effective event timestamp in UTC: paid_ts/paid_gmt for paid orders, created_ts/created_gmt otherwise.
            $event_ts  = $is_paid_st
                ? intval($ord['paid_ts'] ?: $ord['created_ts'])
                : intval($ord['created_ts']);
            $event_gmt = $is_paid_st
                ? ((string) ($ord['paid_gmt'] ?: $ord['created_gmt']))
                : ((string) $ord['created_gmt']);

            if (!self::is_ts_in_range($event_ts, $event_gmt, $filters)) {
                continue;
            }

            $items = $wc_items_by_order[$oid] ?? [];
            if ($course_filter > 0) {
                $matches_course = false;
                foreach ($items as $it) {
                    if (in_array($course_filter, $it['course_ids'], true)) {
                        $matches_course = true;
                        break;
                    }
                }
                if (!$matches_course) {
                    continue;
                }
            }

            $gross    = max(0.0, round(floatval($ord['gross_total'] ?? 0.0), 2));
            $refunded = max(0.0, round(floatval($ord['refunded_total'] ?? 0.0), 2));
            $net      = max(0.0, round($gross - $refunded, 2));

            $scoped_gross = $gross;
            $scoped_net   = $net;
            if ($course_filter > 0) {
                $matched_line_sum = 0.0;
                foreach ($items as $it) {
                    if (in_array($course_filter, $it['course_ids'], true)) {
                        $count_c = max(1, count($it['course_ids']));
                        $matched_line_sum += floatval($it['line_total']) / $count_c;
                    }
                }
                $refund_ratio = $gross > 0.0 ? ($net / $gross) : 1.0;
                $scoped_gross = round($matched_line_sum, 2);
                $scoped_net   = round($matched_line_sum * $refund_ratio, 2);
            }

            $bucket_key = isset($status_breakdown[$status]) ? $status : 'other';
            $status_breakdown[$bucket_key]['count']++;
            $status_breakdown[$bucket_key]['amount'] = round(
                $status_breakdown[$bucket_key]['amount'] + ($status === 'refunded' ? $scoped_gross : ($is_paid_st ? $scoped_net : $scoped_gross)),
                2
            );

            if (!$is_paid_st) {
                continue;
            }

            // Free / zero-amount orders never count as paid purchases (Constraint #7).
            if ($net <= 0.0) {
                $free_zero_wc_orders++;
                continue;
            }

            $effective_order_net = $course_filter > 0 ? $scoped_net : $net;
            if ($course_filter > 0 && $effective_order_net <= 0.0) {
                continue;
            }

            $effective_gross        = $course_filter > 0 ? $scoped_gross : $gross;
            $effective_refunded     = max(0.0, round($effective_gross - $effective_order_net, 2));
            $confirmed_paid_orders++;
            $confirmed_revenue      = round($confirmed_revenue + $effective_order_net, 2);
            $gross_paid_total       = round($gross_paid_total + $effective_gross, 2);
            $refunds_deducted_total = round($refunds_deducted_total + $effective_refunded, 2);
            $wc_order_ids_in_scope[] = $oid;
            $in_scope_paid_orders[$oid] = [
                'gross' => $gross,
                'net'   => $net,
                'items' => $items,
            ];

            $cust_id = intval($ord['customer_id'] ?? 0);
            if ($cust_id > 0) {
                $paying_customer_ids[$cust_id] = true;
            }

            $pm_key = sanitize_key((string) ($ord['payment_method'] ?? 'unknown')) ?: 'unknown';
            $pm_title = trim((string) ($ord['payment_method_title'] ?? '')) ?: strtoupper($pm_key);
            if (!isset($gateway_breakdown[$pm_key])) {
                $gateway_breakdown[$pm_key] = [
                    'method' => $pm_key,
                    'title'  => $pm_title,
                    'orders' => 0,
                    'total'  => 0.0,
                ];
            }
            $gateway_breakdown[$pm_key]['orders']++;
            $gateway_breakdown[$pm_key]['total'] = round($gateway_breakdown[$pm_key]['total'] + $effective_order_net, 2);

            if (self::is_valid_mysql_datetime($event_gmt)) {
                $paid_events[] = [
                    'gmt'    => $event_gmt,
                    'amount' => $effective_order_net,
                ];
            }
        }

        // Allocate confirmed WC order revenue cleanly across mapped LearnPress courses (never multiplying revenue).
        $course_attribution       = [];
        $non_course_wc_revenue    = 0.0;
        $orders_counted_by_course = [];

        foreach ($in_scope_paid_orders as $oid => $ord_info) {
            $gross = floatval($ord_info['gross']);
            $net   = floatval($ord_info['net']);
            $refund_ratio = $gross > 0.0 ? ($net / $gross) : 1.0;

            foreach ($ord_info['items'] as $it) {
                $line_net = round(floatval($it['line_total']) * $refund_ratio, 2);
                if ($line_net <= 0.0) {
                    continue;
                }
                $qty  = max(1, intval($it['qty']));
                $cids = $it['course_ids'];
                if (empty($cids)) {
                    $non_course_wc_revenue = round($non_course_wc_revenue + $line_net, 2);
                    continue;
                }

                $target_cids = $course_filter > 0
                    ? array_values(array_intersect($cids, [$course_filter]))
                    : $cids;

                $split_count = count($cids);
                $per_course_share = round($line_net / $split_count, 2);
                $remainder = round($line_net - ($per_course_share * $split_count), 2);

                foreach ($cids as $idx => $cid) {
                    if ($course_filter > 0 && !in_array($cid, $target_cids, true)) {
                        continue;
                    }
                    $alloc = ($idx === 0) ? round($per_course_share + $remainder, 2) : $per_course_share;
                    if (!isset($course_attribution[$cid])) {
                        $course_attribution[$cid] = [
                            'orders_count' => 0,
                            'units_sold'   => 0,
                            'revenue'      => 0.0,
                        ];
                    }
                    $course_attribution[$cid]['revenue'] = round($course_attribution[$cid]['revenue'] + $alloc, 2);
                    $course_attribution[$cid]['units_sold'] += $qty;
                    if (empty($orders_counted_by_course[$cid][$oid])) {
                        $orders_counted_by_course[$cid][$oid] = true;
                        $course_attribution[$cid]['orders_count']++;
                    }
                }
            }
        }

        // Audit LearnPress Orders (`lp_order`) so Woo-linked orders are deduplicated and
        // non-gateway / manual / unverified orders are separated from confirmed paid revenue.
        $lp_audit = self::audit_learnpress_orders(
            $filters,
            $linked_lp_order_ids_map,
            $all_wc_order_ids,
            $course_filter
        );

        // Only add direct LearnPress online gateway orders (never offline/empty/woo-linked/free)
        if ($lp_audit['direct_gateway_paid_count'] > 0) {
            $confirmed_paid_orders += $lp_audit['direct_gateway_paid_count'];
            $confirmed_revenue = round($confirmed_revenue + $lp_audit['direct_gateway_paid_revenue'], 2);
            foreach ($lp_audit['direct_gateway_events'] as $evt) {
                $paid_events[] = $evt;
            }
            foreach ($lp_audit['direct_gateway_course_attribution'] as $cid => $attr) {
                if (!isset($course_attribution[$cid])) {
                    $course_attribution[$cid] = ['orders_count' => 0, 'units_sold' => 0, 'revenue' => 0.0];
                }
                $course_attribution[$cid]['orders_count'] += intval($attr['orders_count']);
                $course_attribution[$cid]['units_sold']   += intval($attr['units_sold']);
                $course_attribution[$cid]['revenue']      = round($course_attribution[$cid]['revenue'] + floatval($attr['revenue']), 2);
            }
            foreach ($lp_audit['direct_gateway_customers'] as $uid => $_flag) {
                $paying_customer_ids[$uid] = true;
            }
        }

        $aov = $confirmed_paid_orders > 0 ? round($confirmed_revenue / $confirmed_paid_orders, 2) : 0.0;
        $pending_count = $status_breakdown['pending']['count'] + $status_breakdown['on-hold']['count'];
        $pending_amount = round(
            $status_breakdown['pending']['amount'] + $status_breakdown['on-hold']['amount'],
            2
        );

        $gateways_list = array_values($gateway_breakdown);
        usort($gateways_list, static function ($a, $b) {
            return $b['total'] <=> $a['total'];
        });

        return [
            'currency'                  => $currency,
            'wc_storage_mode'           => $is_hpos ? 'wc_hpos_orders_table' : 'wp_posts_shop_order',
            'confirmed_revenue'         => $confirmed_revenue,
            'gross_paid_total'          => $gross_paid_total,
            'refunds_deducted_total'    => $refunds_deducted_total,
            'confirmed_paid_orders'     => $confirmed_paid_orders,
            'average_order_value'       => $aov,
            'pending_orders_count'      => $pending_count,
            'pending_orders_amount'     => $pending_amount,
            'failed_orders_count'       => $status_breakdown['failed']['count'],
            'cancelled_orders_count'    => $status_breakdown['cancelled']['count'],
            'refunded_orders_count'     => $status_breakdown['refunded']['count'],
            'free_zero_wc_orders'       => $free_zero_wc_orders,
            'non_course_wc_revenue'     => $non_course_wc_revenue,
            'status_breakdown'          => $status_breakdown,
            'gateway_breakdown'         => $gateways_list,
            'reconciliation'            => [
                'woo_linked_lp_orders_deduped'      => $lp_audit['woo_linked_count'],
                'woo_linked_lp_nominal_total'       => $lp_audit['woo_linked_total'],
                'unverified_or_manual_lp_orders'    => $lp_audit['unverified_manual_count'],
                'unverified_or_manual_lp_total'     => $lp_audit['unverified_manual_total'],
                'free_zero_lp_orders_excluded'      => $lp_audit['free_zero_count'],
                'direct_gateway_lp_orders_included' => $lp_audit['direct_gateway_paid_count'],
                'direct_gateway_lp_revenue'         => $lp_audit['direct_gateway_paid_revenue'],
                'wc_total_orders_in_period'         => array_sum(array_column($status_breakdown, 'count')),
            ],
            'course_attribution'        => $course_attribution,
            'paying_customer_ids'       => $paying_customer_ids,
            'paid_events'               => $paid_events,
        ];
    }

    /**
     * Fetches WooCommerce orders when HPOS (`wp_wc_orders`) is active.
     */
    private static function fetch_wc_hpos_orders(): array
    {
        global $wpdb;
        $orders_table = $wpdb->prefix . 'wc_orders';
        $op_table     = $wpdb->prefix . 'wc_order_operational_data';
        $meta_table   = $wpdb->prefix . 'wc_orders_meta';

        $has_op   = self::table_exists($op_table);
        $has_meta = self::table_exists($meta_table);

        $op_join = $has_op ? "LEFT JOIN {$op_table} op ON op.order_id = o.id" : '';
        $op_paid = $has_op ? 'op.date_paid_gmt' : 'NULL';

        $rows = $wpdb->get_results(
            "SELECT o.id, o.status, o.total_amount AS gross_total, o.currency,
                    o.customer_id, o.payment_method, o.payment_method_title,
                    o.date_created_gmt AS created_gmt,
                    {$op_paid} AS paid_gmt
             FROM {$orders_table} o
             {$op_join}
             WHERE o.type = 'shop_order'
               AND o.status NOT IN ('trash', 'auto-draft', 'wc-checkout-draft')
             ORDER BY o.id DESC",
            ARRAY_A
        );
        if (!is_array($rows)) {
            return [];
        }

        // Refund totals by parent order ID
        $refunds_by_parent = [];
        $ref_rows = $wpdb->get_results(
            "SELECT parent_order_id, SUM(ABS(total_amount)) AS ref_total
             FROM {$orders_table}
             WHERE type = 'shop_order_refund' AND parent_order_id > 0
             GROUP BY parent_order_id",
            ARRAY_A
        );
        if (is_array($ref_rows)) {
            foreach ($ref_rows as $rr) {
                $refunds_by_parent[intval($rr['parent_order_id'])] = floatval($rr['ref_total'] ?? 0.0);
            }
        }

        $lp_links = [];
        if ($has_meta && !empty($rows)) {
            $ids = array_map(static function ($r) {
                return intval($r['id']);
            }, $rows);
            $placeholders = implode(',', array_fill(0, count($ids), '%d'));
            $meta_rows = $wpdb->get_results(
                $wpdb->prepare(
                    "SELECT order_id, meta_value
                     FROM {$meta_table}
                     WHERE order_id IN ({$placeholders})
                       AND meta_key IN ('_learn_press_order_id', '_lp_order_id')",
                    ...$ids
                ),
                ARRAY_A
            );
            if (is_array($meta_rows)) {
                foreach ($meta_rows as $mr) {
                    $lp_links[intval($mr['order_id'])] = absint($mr['meta_value']);
                }
            }
        }

        $out = [];
        foreach ($rows as $row) {
            $oid        = intval($row['id']);
            $created_gm = (string) ($row['created_gmt'] ?? '');
            $paid_gm    = (string) ($row['paid_gmt'] ?? '');
            $out[] = [
                'id'                   => $oid,
                'status'               => (string) ($row['status'] ?? ''),
                'gross_total'          => floatval($row['gross_total'] ?? 0.0),
                'refunded_total'       => floatval($refunds_by_parent[$oid] ?? 0.0),
                'currency'             => (string) ($row['currency'] ?? 'BDT'),
                'customer_id'          => intval($row['customer_id'] ?? 0),
                'payment_method'       => (string) ($row['payment_method'] ?? ''),
                'payment_method_title' => (string) ($row['payment_method_title'] ?? ''),
                'created_gmt'          => $created_gm,
                'paid_gmt'             => self::is_valid_mysql_datetime($paid_gm) ? $paid_gm : $created_gm,
                'created_ts'           => self::mysql_gmt_to_ts($created_gm),
                'paid_ts'              => self::is_valid_mysql_datetime($paid_gm) ? self::mysql_gmt_to_ts($paid_gm) : 0,
                'lp_order_id'          => intval($lp_links[$oid] ?? 0),
            ];
        }

        return $out;
    }

    /**
     * Fetches WooCommerce orders from legacy `wp_posts` (`shop_order`) and `wp_postmeta`.
     */
    private static function fetch_wc_legacy_orders(): array
    {
        global $wpdb;

        $rows = $wpdb->get_results(
            "SELECT p.ID AS id, p.post_status AS status, p.post_date_gmt AS created_gmt
             FROM {$wpdb->posts} p
             WHERE p.post_type = 'shop_order'
               AND p.post_status NOT IN ('trash', 'auto-draft', 'wc-checkout-draft')
             ORDER BY p.ID DESC",
            ARRAY_A
        );
        if (!is_array($rows) || empty($rows)) {
            return [];
        }

        $ids = array_map(static function ($r) {
            return intval($r['id']);
        }, $rows);
        $meta_map = self::fetch_postmeta_batch(
            $ids,
            [
                '_order_total',
                '_order_currency',
                '_customer_user',
                '_payment_method',
                '_payment_method_title',
                '_date_paid',
                '_paid_date',
                '_learn_press_order_id',
                '_lp_order_id',
            ]
        );

        // Refund totals from child `shop_order_refund` posts.
        $refunds_by_parent = [];
        $placeholders = implode(',', array_fill(0, count($ids), '%d'));
        $ref_rows = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT p.post_parent AS parent_id, p.ID AS refund_id
                 FROM {$wpdb->posts} p
                 WHERE p.post_type = 'shop_order_refund'
                   AND p.post_parent IN ({$placeholders})",
                ...$ids
            ),
            ARRAY_A
        );
        if (is_array($ref_rows) && !empty($ref_rows)) {
            $ref_ids = array_map(static function ($r) {
                return intval($r['refund_id']);
            }, $ref_rows);
            $ref_meta = self::fetch_postmeta_batch($ref_ids, ['_refund_amount', '_order_total']);
            foreach ($ref_rows as $rr) {
                $pid = intval($rr['parent_id']);
                $rid = intval($rr['refund_id']);
                $raw_ref = $ref_meta[$rid]['_refund_amount'] ?? ($ref_meta[$rid]['_order_total'] ?? 0);
                $amt = abs(floatval($raw_ref));
                $refunds_by_parent[$pid] = ($refunds_by_parent[$pid] ?? 0.0) + $amt;
            }
        }

        $tz  = function_exists('wp_timezone') ? wp_timezone() : new \DateTimeZone('UTC');
        $utc = new \DateTimeZone('UTC');

        $out = [];
        foreach ($rows as $row) {
            $oid = intval($row['id']);
            $m   = $meta_map[$oid] ?? [];
            $created_gm = (string) ($row['created_gmt'] ?? '');
            $raw_dp     = trim((string) ($m['_date_paid'] ?? ''));
            $raw_pd_loc = trim((string) ($m['_paid_date'] ?? ''));
            $paid_ts    = 0;
            $paid_gmt   = '';

            if ($raw_dp !== '' && ctype_digit($raw_dp) && intval($raw_dp) > 0) {
                $paid_ts  = intval($raw_dp);
                $paid_gmt = gmdate('Y-m-d H:i:s', $paid_ts);
            } elseif (self::is_valid_mysql_datetime($raw_pd_loc)) {
                $pd_dt = \DateTimeImmutable::createFromFormat('Y-m-d H:i:s', $raw_pd_loc, $tz);
                if ($pd_dt instanceof \DateTimeImmutable) {
                    $pd_utc   = $pd_dt->setTimezone($utc);
                    $paid_ts  = $pd_utc->getTimestamp();
                    $paid_gmt = $pd_utc->format('Y-m-d H:i:s');
                }
            }

            $out[] = [
                'id'                   => $oid,
                'status'               => (string) ($row['status'] ?? ''),
                'gross_total'          => floatval($m['_order_total'] ?? 0.0),
                'refunded_total'       => floatval($refunds_by_parent[$oid] ?? 0.0),
                'currency'             => (string) ($m['_order_currency'] ?? 'BDT'),
                'customer_id'          => intval($m['_customer_user'] ?? 0),
                'payment_method'       => (string) ($m['_payment_method'] ?? ''),
                'payment_method_title' => (string) ($m['_payment_method_title'] ?? ''),
                'created_gmt'          => $created_gm,
                'paid_gmt'             => $paid_gmt !== '' ? $paid_gmt : $created_gm,
                'created_ts'           => self::mysql_gmt_to_ts($created_gm),
                'paid_ts'              => $paid_ts,
                'lp_order_id'          => intval($m['_learn_press_order_id'] ?? ($m['_lp_order_id'] ?? 0)),
            ];
        }

        return $out;
    }

    /**
     * Fetches WooCommerce order line items batched and resolves mapped LearnPress course IDs.
     */
    private static function fetch_wc_line_items_grouped(array $order_ids): array
    {
        global $wpdb;

        $items_table    = $wpdb->prefix . 'woocommerce_order_items';
        $itemmeta_table = $wpdb->prefix . 'woocommerce_order_itemmeta';

        if (empty($order_ids) || !self::table_exists($items_table) || !self::table_exists($itemmeta_table)) {
            return [];
        }

        $placeholders = implode(',', array_fill(0, count($order_ids), '%d'));
        $rows = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT oi.order_item_id, oi.order_id, oi.order_item_name
                 FROM {$items_table} oi
                 WHERE oi.order_item_type = 'line_item'
                   AND oi.order_id IN ({$placeholders})",
                ...$order_ids
            ),
            ARRAY_A
        );
        if (!is_array($rows) || empty($rows)) {
            return [];
        }

        $item_ids = array_map(static function ($r) {
            return intval($r['order_item_id']);
        }, $rows);
        $im_placeholders = implode(',', array_fill(0, count($item_ids), '%d'));
        $meta_rows = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT order_item_id, meta_key, meta_value
                 FROM {$itemmeta_table}
                 WHERE order_item_id IN ({$im_placeholders})
                   AND meta_key IN ('_product_id', '_qty', '_line_total', '_course_id')",
                ...$item_ids
            ),
            ARRAY_A
        );

        $item_meta = [];
        $product_ids = [];
        if (is_array($meta_rows)) {
            foreach ($meta_rows as $mr) {
                $iid = intval($mr['order_item_id']);
                $key = (string) ($mr['meta_key'] ?? '');
                $val = $mr['meta_value'] ?? '';
                $item_meta[$iid][$key] = $val;
                if ($key === '_product_id' && absint($val) > 0) {
                    $product_ids[absint($val)] = true;
                }
            }
        }

        // Batch-fetch product-to-course mappings from postmeta (_learnpress_course, _lp_course).
        $product_course_map = [];
        if (!empty($product_ids)) {
            $pids = array_keys($product_ids);
            $prod_meta = self::fetch_postmeta_batch($pids, ['_learnpress_course', '_lp_course']);
            foreach ($pids as $pid) {
                $mapped = [];
                foreach (['_learnpress_course', '_lp_course'] as $mk) {
                    if (!isset($prod_meta[$pid][$mk]) || $prod_meta[$pid][$mk] === '') {
                        continue;
                    }
                    foreach (self::extract_int_ids($prod_meta[$pid][$mk]) as $cid) {
                        if ($cid > 0) {
                            $mapped[] = $cid;
                        }
                    }
                }
                // Direct fallback: LearnPress WooCommerce Integration sometimes sets product_id = course_id directly.
                if (empty($mapped) && get_post_type($pid) === 'lp_course') {
                    $mapped[] = $pid;
                }
                $product_course_map[$pid] = array_values(array_unique($mapped));
            }
        }

        $grouped = [];
        foreach ($rows as $row) {
            $iid = intval($row['order_item_id']);
            $oid = intval($row['order_id']);
            $im  = $item_meta[$iid] ?? [];

            $pid        = absint($im['_product_id'] ?? 0);
            $qty        = max(1, intval($im['_qty'] ?? 1));
            $line_total = round(floatval($im['_line_total'] ?? 0.0), 2);
            $course_ids = [];

            if (!empty($im['_course_id']) && absint($im['_course_id']) > 0) {
                $course_ids[] = absint($im['_course_id']);
            }
            if (empty($course_ids) && $pid > 0 && !empty($product_course_map[$pid])) {
                $course_ids = $product_course_map[$pid];
            }

            $grouped[$oid][] = [
                'order_item_id' => $iid,
                'product_id'    => $pid,
                'name'          => (string) ($row['order_item_name'] ?? ''),
                'qty'           => $qty,
                'line_total'    => $line_total,
                'course_ids'    => array_values(array_unique(array_filter(array_map('intval', $course_ids)))),
            ];
        }

        return $grouped;
    }

    /**
     * Audits LearnPress orders (`lp_order`), deduplicating Woo-linked orders and
     * separating gateway-verified direct LP payments from manual/unverified/free orders.
     */
    private static function audit_learnpress_orders(
        array $filters,
        array $wc_reverse_linked_lp_ids,
        array $known_wc_order_ids,
        int $course_filter
    ): array {
        global $wpdb;

        $lp_order_posts = $wpdb->get_results(
            "SELECT ID, post_status, post_date_gmt
             FROM {$wpdb->posts}
             WHERE post_type = 'lp_order'
               AND post_status NOT IN ('trash', 'auto-draft')
             ORDER BY ID DESC",
            ARRAY_A
        );

        $result = [
            'woo_linked_count'                  => 0,
            'woo_linked_total'                  => 0.0,
            'unverified_manual_count'           => 0,
            'unverified_manual_total'           => 0.0,
            'free_zero_count'                   => 0,
            'direct_gateway_paid_count'         => 0,
            'direct_gateway_paid_revenue'       => 0.0,
            'direct_gateway_events'             => [],
            'direct_gateway_course_attribution' => [],
            'direct_gateway_customers'          => [],
        ];

        if (!is_array($lp_order_posts) || empty($lp_order_posts)) {
            return $result;
        }

        $lp_ids = array_map(static function ($r) {
            return intval($r['ID']);
        }, $lp_order_posts);
        $meta_map = self::fetch_postmeta_batch(
            $lp_ids,
            ['_order_total', '_woo_order_id', '_payment_method', '_payment_method_title', '_user_id']
        );

        $lp_items_by_order = self::fetch_lp_order_items_grouped($lp_ids);
        $wc_id_set = array_flip($known_wc_order_ids);

        foreach ($lp_order_posts as $row) {
            $oid       = intval($row['ID']);
            $status    = strtolower((string) ($row['post_status'] ?? ''));
            $date_gmt  = (string) ($row['post_date_gmt'] ?? '');
            if (!self::is_gmt_in_range($date_gmt, $filters)) {
                continue;
            }

            $m     = $meta_map[$oid] ?? [];
            $total = round(max(0.0, floatval($m['_order_total'] ?? 0.0)), 2);
            $items = $lp_items_by_order[$oid] ?? [];

            if ($course_filter > 0) {
                $matched = false;
                foreach ($items as $it) {
                    if (intval($it['course_id']) === $course_filter) {
                        $matched = true;
                        break;
                    }
                }
                if (!$matched) {
                    continue;
                }
            }

            $woo_id = absint($m['_woo_order_id'] ?? 0);
            $pm     = strtolower(trim((string) ($m['_payment_method'] ?? '')));
            $is_woo_linked = ($woo_id > 0)
                || isset($wc_reverse_linked_lp_ids[$oid])
                || (strpos($pm, 'woo') !== false)
                || ($woo_id > 0 && isset($wc_id_set[$woo_id]));

            if ($is_woo_linked) {
                $result['woo_linked_count']++;
                $result['woo_linked_total'] = round($result['woo_linked_total'] + $total, 2);
                continue;
            }

            if ($total <= 0.0) {
                $result['free_zero_count']++;
                continue;
            }

            // Verified direct LearnPress online gateway (excludes blank payment method & offline-payment/manual).
            $non_online_methods = ['', 'offline-payment', 'offline', 'manual', 'free', 'admin', 'cod'];
            $is_verified_direct = ($status === 'lp-completed') && !in_array($pm, $non_online_methods, true);

            if (!$is_verified_direct) {
                $result['unverified_manual_count']++;
                $result['unverified_manual_total'] = round($result['unverified_manual_total'] + $total, 2);
                continue;
            }

            $result['direct_gateway_paid_count']++;
            $result['direct_gateway_paid_revenue'] = round($result['direct_gateway_paid_revenue'] + $total, 2);
            $uid = intval($m['_user_id'] ?? 0);
            if ($uid > 0) {
                $result['direct_gateway_customers'][$uid] = true;
            }
            if (self::is_valid_mysql_datetime($date_gmt)) {
                $result['direct_gateway_events'][] = ['gmt' => $date_gmt, 'amount' => $total];
            }

            foreach ($items as $it) {
                $cid = intval($it['course_id']);
                $it_total = round(max(0.0, floatval($it['total'])), 2);
                if ($cid <= 0 || ($course_filter > 0 && $cid !== $course_filter)) {
                    continue;
                }
                if (!isset($result['direct_gateway_course_attribution'][$cid])) {
                    $result['direct_gateway_course_attribution'][$cid] = [
                        'orders_count' => 0,
                        'units_sold'   => 0,
                        'revenue'      => 0.0,
                    ];
                }
                $result['direct_gateway_course_attribution'][$cid]['orders_count']++;
                $result['direct_gateway_course_attribution'][$cid]['units_sold'] += max(1, intval($it['qty']));
                $result['direct_gateway_course_attribution'][$cid]['revenue'] = round(
                    $result['direct_gateway_course_attribution'][$cid]['revenue'] + $it_total,
                    2
                );
            }
        }

        return $result;
    }

    /**
     * Fetches LearnPress order items batched by order_id.
     */
    private static function fetch_lp_order_items_grouped(array $lp_order_ids): array
    {
        global $wpdb;

        $items_table    = $wpdb->prefix . 'learnpress_order_items';
        $itemmeta_table = $wpdb->prefix . 'learnpress_order_itemmeta';
        if (empty($lp_order_ids) || !self::table_exists($items_table) || !self::table_exists($itemmeta_table)) {
            return [];
        }

        $has_item_id_col = self::table_has_column($items_table, 'item_id');
        $select_cols     = $has_item_id_col ? 'order_item_id, order_id, order_item_name, item_id' : 'order_item_id, order_id, order_item_name';
        $placeholders    = implode(',', array_fill(0, count($lp_order_ids), '%d'));
        $rows = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT {$select_cols}
                 FROM {$items_table}
                 WHERE order_id IN ({$placeholders})",
                ...$lp_order_ids
            ),
            ARRAY_A
        );
        if (!is_array($rows) || empty($rows)) {
            return [];
        }

        $item_ids = array_map(static function ($r) {
            return intval($r['order_item_id']);
        }, $rows);
        $im_placeholders = implode(',', array_fill(0, count($item_ids), '%d'));
        $meta_rows = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT learnpress_order_item_id AS item_id, meta_key, meta_value
                 FROM {$itemmeta_table}
                 WHERE learnpress_order_item_id IN ({$im_placeholders})
                   AND meta_key IN ('_course_id', '_quantity', '_total')",
                ...$item_ids
            ),
            ARRAY_A
        );

        $item_meta = [];
        if (is_array($meta_rows)) {
            foreach ($meta_rows as $mr) {
                $iid = intval($mr['item_id']);
                $key = (string) ($mr['meta_key'] ?? '');
                $item_meta[$iid][$key] = $mr['meta_value'] ?? '';
            }
        }

        $grouped = [];
        foreach ($rows as $row) {
            $iid = intval($row['order_item_id']);
            $oid = intval($row['order_id']);
            $im  = $item_meta[$iid] ?? [];
            $cid = absint($im['_course_id'] ?? ($row['item_id'] ?? 0));
            $grouped[$oid][] = [
                'course_id' => $cid,
                'qty'       => max(1, intval($im['_quantity'] ?? 1)),
                'total'     => floatval($im['_total'] ?? 0.0),
            ];
        }

        return $grouped;
    }

    /**
     * Computes checkout order funnel & learner progression conversion ratios.
     */
    private static function compute_conversions(
        array $filters,
        array $users,
        array $enrollments,
        array $revenue
    ): array {
        $status_map = $revenue['status_breakdown'] ?? [];
        $wc_total = intval($revenue['reconciliation']['wc_total_orders_in_period'] ?? 0);
        $wc_paid  = intval(($status_map['completed']['count'] ?? 0) + ($status_map['processing']['count'] ?? 0) - ($revenue['free_zero_wc_orders'] ?? 0));
        $wc_paid  = max(0, $wc_paid);
        $wc_pend  = intval($revenue['pending_orders_count'] ?? 0);
        $wc_fail  = intval(($revenue['failed_orders_count'] ?? 0) + ($revenue['cancelled_orders_count'] ?? 0));
        $wc_ref   = intval($revenue['refunded_orders_count'] ?? 0);

        $checkout_paid_rate = $wc_total > 0 ? round(($wc_paid / $wc_total) * 100.0, 1) : 0.0;
        $checkout_abandon_rate = $wc_total > 0 ? round((($wc_pend + $wc_fail) / $wc_total) * 100.0, 1) : 0.0;

        $total_enroll_period = intval($enrollments['enrollments_in_period'] ?? 0);
        $free_enroll_period  = intval($enrollments['free_enrollments_in_period'] ?? 0);
        $paid_enroll_period  = intval($enrollments['paid_course_enrollments_period'] ?? 0);

        $free_share = $total_enroll_period > 0
            ? round(($free_enroll_period / $total_enroll_period) * 100.0, 1)
            : 0.0;

        $site_users = intval($users['site_users_total'] ?? 0);
        $enrolled_all = intval($users['enrolled_learners_all_time'] ?? 0);
        $completed_all = intval($users['completed_learners_all_time'] ?? 0);

        return [
            'checkout_order_funnel' => [
                'total_orders_initiated'      => $wc_total,
                'confirmed_paid_orders'       => $wc_paid,
                'pending_or_on_hold_orders'   => $wc_pend,
                'failed_or_cancelled_orders'  => $wc_fail,
                'refunded_orders'             => $wc_ref,
                'free_zero_orders_excluded'   => intval($revenue['free_zero_wc_orders'] ?? 0),
                'paid_conversion_percent'     => $checkout_paid_rate,
                'non_paid_drop_percent'       => $checkout_abandon_rate,
                'uncollected_pending_amount'  => floatval($revenue['pending_orders_amount'] ?? 0.0),
            ],
            'learner_journey_funnel' => [
                'site_accounts_total'             => $site_users,
                'new_site_accounts_in_period'     => intval($users['new_site_users_in_period'] ?? 0),
                'enrolled_learners_all_time'      => $enrolled_all,
                'enrolled_learners_in_period'     => intval($users['enrolled_learners_in_period'] ?? 0),
                'active_lesson_learners_period'   => intval($users['active_lesson_learners_period'] ?? 0),
                'completed_learners_all_time'     => $completed_all,
                'paying_customers_in_period'      => intval($users['paying_customers_in_period'] ?? 0),
                'account_to_enrolled_percent'     => $site_users > 0 ? round(($enrolled_all / $site_users) * 100.0, 1) : 0.0,
                'enrolled_to_completed_percent'   => intval($enrollments['completion_rate_percent'] ?? 0),
                'scope_note'                      => !empty($filters['is_all_time'])
                    ? 'All-time snapshot across site-capable accounts and LearnPress enrollments.'
                    : 'Registrations, active lesson learners, and paying customers reflect the selected period; all-time snapshot totals shown alongside.',
            ],
            'enrollment_mix' => [
                'total_in_period'       => $total_enroll_period,
                'free_in_period'        => $free_enroll_period,
                'paid_course_in_period' => $paid_enroll_period,
                'free_share_percent'    => $free_share,
                'paid_share_percent'    => $total_enroll_period > 0 ? round(100.0 - $free_share, 1) : 0.0,
            ],
        ];
    }

    /**
     * Reads operational counts from existing TS Mobile Bridge custom tables (no new tables).
     */
    private static function compute_companion_ops(array $filters): array
    {
        global $wpdb;

        $push_table    = TSMB_Lifecycle::get_push_tokens_table();
        $leads_table   = TSMB_Lifecycle::get_leads_table();
        $tickets_table = TSMB_Lifecycle::get_tickets_table();

        $push_stats = [
            'total_devices'    => 0,
            'unique_users'     => 0,
            'active_in_period' => 0,
            'by_platform'      => [],
        ];
        if (self::table_exists($push_table)) {
            $push_stats['total_devices'] = intval($wpdb->get_var("SELECT COUNT(*) FROM {$push_table}"));
            $push_stats['unique_users']  = intval($wpdb->get_var("SELECT COUNT(DISTINCT user_id) FROM {$push_table} WHERE user_id > 0"));
            if (!empty($filters['is_all_time'])) {
                $push_stats['active_in_period'] = $push_stats['total_devices'];
            } else {
                $push_stats['active_in_period'] = intval(
                    $wpdb->get_var(
                        $wpdb->prepare(
                            "SELECT COUNT(*) FROM {$push_table} WHERE last_seen >= %s AND last_seen <= %s",
                            $filters['start_gmt'],
                            $filters['end_gmt']
                        )
                    )
                );
            }
            $plat_rows = $wpdb->get_results(
                "SELECT platform, COUNT(*) AS cnt FROM {$push_table} GROUP BY platform",
                ARRAY_A
            );
            if (is_array($plat_rows)) {
                foreach ($plat_rows as $pr) {
                    $push_stats['by_platform'][sanitize_key((string) ($pr['platform'] ?? 'unknown'))] = intval($pr['cnt'] ?? 0);
                }
            }
        }

        $ticket_stats = ['total' => 0, 'in_period' => 0, 'open_count' => 0, 'by_status' => []];
        if (self::table_exists($tickets_table)) {
            $t_rows = $wpdb->get_results(
                "SELECT status, COUNT(*) AS cnt FROM {$tickets_table} GROUP BY status",
                ARRAY_A
            );
            if (is_array($t_rows)) {
                foreach ($t_rows as $tr) {
                    $st  = sanitize_key((string) ($tr['status'] ?? 'open'));
                    $cnt = intval($tr['cnt'] ?? 0);
                    $ticket_stats['by_status'][$st] = $cnt;
                    $ticket_stats['total'] += $cnt;
                    if ($st === 'open' || $st === 'in_progress') {
                        $ticket_stats['open_count'] += $cnt;
                    }
                }
            }
            if (!empty($filters['is_all_time'])) {
                $ticket_stats['in_period'] = $ticket_stats['total'];
            } else {
                $ticket_stats['in_period'] = intval(
                    $wpdb->get_var(
                        $wpdb->prepare(
                            "SELECT COUNT(*) FROM {$tickets_table} WHERE created_at >= %s AND created_at <= %s",
                            $filters['start_gmt'],
                            $filters['end_gmt']
                        )
                    )
                );
            }
        }

        $lead_stats = ['total' => 0, 'in_period' => 0, 'new_count' => 0, 'by_status' => []];
        if (self::table_exists($leads_table)) {
            $l_rows = $wpdb->get_results(
                "SELECT status, COUNT(*) AS cnt FROM {$leads_table} GROUP BY status",
                ARRAY_A
            );
            if (is_array($l_rows)) {
                foreach ($l_rows as $lr) {
                    $st  = sanitize_key((string) ($lr['status'] ?? 'new'));
                    $cnt = intval($lr['cnt'] ?? 0);
                    $lead_stats['by_status'][$st] = $cnt;
                    $lead_stats['total'] += $cnt;
                    if ($st === 'new') {
                        $lead_stats['new_count'] += $cnt;
                    }
                }
            }
            if (!empty($filters['is_all_time'])) {
                $lead_stats['in_period'] = $lead_stats['total'];
            } else {
                $lead_stats['in_period'] = intval(
                    $wpdb->get_var(
                        $wpdb->prepare(
                            "SELECT COUNT(*) FROM {$leads_table} WHERE created_at >= %s AND created_at <= %s",
                            $filters['start_gmt'],
                            $filters['end_gmt']
                        )
                    )
                );
            }
        }

        return [
            'push_tokens'         => $push_stats,
            'support_tickets'     => $ticket_stats,
            'corporate_inquiries' => $lead_stats,
        ];
    }

    /**
     * Builds chronological daily or monthly buckets across site-timezone dates.
     */
    private static function build_time_series(
        array $filters,
        array $paid_events,
        array $enrollment_events,
        array $completion_events,
        array $registration_events
    ): array {
        $granularity = $filters['granularity'] === 'day' ? 'day' : 'month';
        $tz  = function_exists('wp_timezone') ? wp_timezone() : new \DateTimeZone('UTC');
        $utc = new \DateTimeZone('UTC');
        $buckets = [];

        // Pre-seed continuous empty buckets for bounded ranges so charts have no missing gaps.
        if (empty($filters['is_all_time']) && !empty($filters['start_date']) && !empty($filters['end_date'])) {
            $cursor = \DateTimeImmutable::createFromFormat('!Y-m-d', $filters['start_date'], $tz);
            $end    = \DateTimeImmutable::createFromFormat('!Y-m-d', $filters['end_date'], $tz);
            if ($cursor instanceof \DateTimeImmutable && $end instanceof \DateTimeImmutable) {
                $step = ($granularity === 'day') ? '+1 day' : 'first day of next month';
                if ($granularity === 'month') {
                    $cursor = $cursor->modify('first day of this month');
                }
                $guard = 0;
                while ($cursor->getTimestamp() <= $end->getTimestamp() && $guard < 400) {
                    $guard++;
                    $bkey = $granularity === 'day' ? $cursor->format('Y-m-d') : $cursor->format('Y-m');
                    $buckets[$bkey] = self::empty_series_bucket($bkey);
                    $cursor = $cursor->modify($step);
                }
            }
        }

        $bucket_key_from_gmt = static function (string $gmt) use ($granularity, $tz, $utc): ?string {
            $dt = \DateTimeImmutable::createFromFormat('Y-m-d H:i:s', trim($gmt), $utc);
            if (!($dt instanceof \DateTimeImmutable)) {
                return null;
            }
            $local = $dt->setTimezone($tz);
            return $granularity === 'day' ? $local->format('Y-m-d') : $local->format('Y-m');
        };

        foreach ($paid_events as $pe) {
            $bk = $bucket_key_from_gmt((string) ($pe['gmt'] ?? ''));
            if ($bk === null) {
                continue;
            }
            if (!isset($buckets[$bk])) {
                $buckets[$bk] = self::empty_series_bucket($bk);
            }
            $buckets[$bk]['paid_orders']++;
            $buckets[$bk]['revenue'] = round($buckets[$bk]['revenue'] + floatval($pe['amount'] ?? 0.0), 2);
        }

        foreach ($enrollment_events as $ee) {
            $bk = $bucket_key_from_gmt((string) $ee);
            if ($bk === null) {
                continue;
            }
            if (!isset($buckets[$bk])) {
                $buckets[$bk] = self::empty_series_bucket($bk);
            }
            $buckets[$bk]['enrollments']++;
        }

        foreach ($completion_events as $ce) {
            $bk = $bucket_key_from_gmt((string) $ce);
            if ($bk === null) {
                continue;
            }
            if (!isset($buckets[$bk])) {
                $buckets[$bk] = self::empty_series_bucket($bk);
            }
            $buckets[$bk]['completions']++;
        }

        foreach ($registration_events as $re) {
            $bk = $bucket_key_from_gmt((string) $re);
            if ($bk === null) {
                continue;
            }
            if (!isset($buckets[$bk])) {
                $buckets[$bk] = self::empty_series_bucket($bk);
            }
            $buckets[$bk]['new_users']++;
        }

        ksort($buckets);
        return array_values($buckets);
    }

    private static function empty_series_bucket(string $period_key): array
    {
        return [
            'period'      => $period_key,
            'revenue'     => 0.0,
            'paid_orders' => 0,
            'enrollments' => 0,
            'completions' => 0,
            'new_users'   => 0,
        ];
    }

    /**
     * Documents the authoritative database table and logic used per section.
     */
    private static function get_data_source_notes(array $revenue): array
    {
        return [
            'users' => 'Site-capable users joined from wp_users + wp_usermeta (prefix_capabilities); raw wp_users row count disclosed separately when imported rows lack site capabilities.',
            'enrollments_and_progress' => 'Deduplicated latest course states per (user_id, item_id) in learnpress_user_items for published lp_course posts, with curriculum counts from learnpress_sections + learnpress_section_items.',
            'revenue_and_orders' => sprintf(
                'Confirmed paid WooCommerce orders (%s; statuses wc-completed and wc-processing with net total > 0 after child refunds). Woo-linked lp_order entries and free/manual/unverified lp_order rows are deduplicated and excluded from paid revenue.',
                $revenue['wc_storage_mode'] ?? 'wp_posts_shop_order'
            ),
            'reviews_and_ratings' => 'Approved LearnPress course reviews in wp_comments (comment_type = review, comment_approved = 1) joined with _lpr_rating meta.',
            'companion_ops' => 'Existing TSMB tables: tsmb_push_tokens, tsmb_support_tickets, and tsmb_corporate_inquiries.',
        ];
    }

    /**
     * Explicit transparency catalog of metrics not reliably computable from existing schema.
     */
    public static function get_unsupported_metrics_catalog(): array
    {
        return [
            [
                'key'       => 'platform_dau_wau_mau',
                'label'     => __('True Platform DAU / WAU / MAU & Session Traffic', 'ts-mobile-bridge'),
                'available' => false,
                'reason'    => __('WordPress wp_users only records registration dates (user_registered), and LearnPress only updates learnpress_user_items on course/item status transitions. True site-wide daily active visits and pageviews are not logged without introducing session/event tables or external analytics.', 'ts-mobile-bridge'),
            ],
            [
                'key'       => 'course_view_to_checkout_ctr',
                'label'     => __('Course View-to-Cart & Pre-Order Checkout CTR', 'ts-mobile-bridge'),
                'available' => false,
                'reason'    => __('WordPress/WooCommerce do not store server-side page impressions or anonymous cart views before order creation. Client-side AnalyticsService remains device/interaction-scoped and is intentionally not treated as authoritative platform revenue telemetry.', 'ts-mobile-bridge'),
            ],
            [
                'key'       => 'recommendation_revenue_lift',
                'label'     => __('Recommendation Algorithm Revenue Attribution & Lift', 'ts-mobile-bridge'),
                'available' => false,
                'reason'    => __('Evaluating cross-user recommendation ROI requires server-side impression/click attribution storage, which is excluded by the no-schema-modification and no-external-analytics constraints.', 'ts-mobile-bridge'),
            ],
            [
                'key'       => 'subscription_mrr_and_churn',
                'label'     => __('Recurring Subscription MRR & Cohort Churn', 'ts-mobile-bridge'),
                'available' => false,
                'reason'    => __('Course purchases on this platform use one-time WooCommerce checkout orders without WooCommerce Subscriptions schema tables.', 'ts-mobile-bridge'),
            ],
            [
                'key'       => 'legacy_student_meta_dates',
                'label'     => __('Historical Enrollment Dates for Pre-Migration _lp_students Counters', 'ts-mobile-bridge'),
                'available' => false,
                'reason'    => __('Legacy scalar postmeta (_lp_students) stores aggregate counts without per-user timestamps or completion proof, so it cannot be placed into date filters or completion cohorts (surfaced as reference metadata only).', 'ts-mobile-bridge'),
            ],
        ];
    }

    /**
     * Fetches specified postmeta keys for a list of post IDs in a single query.
     */
    private static function fetch_postmeta_batch(array $post_ids, array $meta_keys): array
    {
        global $wpdb;
        if (empty($post_ids) || empty($meta_keys) || empty($wpdb->postmeta)) {
            return [];
        }

        $post_ph = implode(',', array_fill(0, count($post_ids), '%d'));
        $key_ph  = implode(',', array_fill(0, count($meta_keys), '%s'));
        $args    = array_merge(array_map('intval', $post_ids), $meta_keys);

        $rows = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT post_id, meta_key, meta_value
                 FROM {$wpdb->postmeta}
                 WHERE post_id IN ({$post_ph})
                   AND meta_key IN ({$key_ph})",
                ...$args
            ),
            ARRAY_A
        );

        $out = [];
        if (is_array($rows)) {
            foreach ($rows as $row) {
                $pid = intval($row['post_id'] ?? 0);
                $mk  = (string) ($row['meta_key'] ?? '');
                if ($pid > 0 && $mk !== '' && !array_key_exists($mk, $out[$pid] ?? [])) {
                    $out[$pid][$mk] = $row['meta_value'] ?? '';
                }
            }
        }

        return $out;
    }

    private static function normalize_wc_status(string $raw): string
    {
        $clean = strtolower(trim($raw));
        if (strpos($clean, 'wc-') === 0) {
            return substr($clean, 3);
        }
        return $clean;
    }

    private static function is_valid_mysql_datetime(string $dt): bool
    {
        $clean = trim($dt);
        return $clean !== '' && strpos($clean, '0000-00-00') !== 0;
    }

    private static function mysql_gmt_to_ts(string $gmt): int
    {
        if (!self::is_valid_mysql_datetime($gmt)) {
            return 0;
        }
        $dt = \DateTimeImmutable::createFromFormat('Y-m-d H:i:s', trim($gmt), new \DateTimeZone('UTC'));
        return ($dt instanceof \DateTimeImmutable) ? $dt->getTimestamp() : 0;
    }

    private static function is_gmt_in_range(string $gmt, array $filters): bool
    {
        if (!empty($filters['is_all_time'])) {
            return true;
        }
        if (!self::is_valid_mysql_datetime($gmt)) {
            return false;
        }
        $ts = self::mysql_gmt_to_ts($gmt);
        if ($ts <= 0) {
            return false;
        }
        return $ts >= intval($filters['start_utc_ts']) && $ts <= intval($filters['end_utc_ts']);
    }

    private static function is_ts_in_range(int $ts, string $fallback_gmt, array $filters): bool
    {
        if (!empty($filters['is_all_time'])) {
            return true;
        }
        $effective_ts = $ts > 0 ? $ts : self::mysql_gmt_to_ts($fallback_gmt);
        if ($effective_ts <= 0) {
            return false;
        }
        return $effective_ts >= intval($filters['start_utc_ts']) && $effective_ts <= intval($filters['end_utc_ts']);
    }

    private static function safe_unserialize_array(string $raw): array
    {
        $trimmed = trim($raw);
        if ($trimmed === '') {
            return [];
        }
        $val = @unserialize($trimmed, ['allowed_classes' => false]);
        if (is_array($val)) {
            return $val;
        }
        $json = json_decode($trimmed, true);
        return is_array($json) ? $json : [];
    }

    /**
     * @return int[]
     */
    private static function extract_int_ids($raw): array
    {
        if (is_numeric($raw)) {
            $v = absint($raw);
            return $v > 0 ? [$v] : [];
        }
        if (is_array($raw)) {
            return array_values(array_unique(array_filter(array_map('absint', $raw))));
        }
        if (is_string($raw) && trim($raw) !== '') {
            $parsed = self::safe_unserialize_array($raw);
            if (!empty($parsed)) {
                return array_values(array_unique(array_filter(array_map('absint', $parsed))));
            }
            $parts = preg_split('/\s*,\s*/', trim($raw)) ?: [];
            return array_values(array_unique(array_filter(array_map('absint', $parts))));
        }
        return [];
    }
}
