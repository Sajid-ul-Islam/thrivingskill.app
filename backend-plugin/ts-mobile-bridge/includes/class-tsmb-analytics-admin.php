<?php

/**
 * WordPress Admin Analytics Dashboard integrated into TS Mobile Bridge.
 *
 * Provides Overview, Users, Enrollments, Revenue, Course Performance, and Conversion
 * views backed strictly by TSMB_Analytics_Service without adding React Native UI
 * or modifying database schemas.
 */

if (!defined('ABSPATH')) {
    exit;
}

class TSMB_Analytics_Admin
{
    public const PAGE_SLUG = 'tsmb-admin-analytics';
    private static $initialized = false;

    public static function init(): void
    {
        if (self::$initialized) {
            return;
        }
        self::$initialized = true;

        add_action('admin_menu', [__CLASS__, 'register_menu'], 20);
        add_action('admin_post_tsmb_analytics_refresh', [__CLASS__, 'handle_refresh_cache']);
        add_action('admin_post_tsmb_analytics_export_csv', [__CLASS__, 'handle_export_csv']);
    }

    public static function register_menu(): void
    {
        add_submenu_page(
            'thriving-skills-app',
            __('Platform Analytics', 'ts-mobile-bridge'),
            __('Platform Analytics', 'ts-mobile-bridge'),
            'manage_options',
            self::PAGE_SLUG,
            [__CLASS__, 'render_page']
        );
    }

    public static function handle_refresh_cache(): void
    {
        if (!current_user_can('manage_options')) {
            wp_die(esc_html__('You do not have permission to refresh analytics cache.', 'ts-mobile-bridge'), 403);
        }
        check_admin_referer('tsmb_analytics_refresh_nonce');

        TSMB_Analytics_Service::invalidate_cache();

        $redirect_args = [
            'page'    => self::PAGE_SLUG,
            'preset'  => sanitize_key(wp_unslash($_POST['preset'] ?? 'all')),
            'refreshed' => '1',
        ];
        if (!empty($_POST['start_date'])) {
            $redirect_args['start_date'] = sanitize_text_field(wp_unslash($_POST['start_date']));
        }
        if (!empty($_POST['end_date'])) {
            $redirect_args['end_date'] = sanitize_text_field(wp_unslash($_POST['end_date']));
        }
        if (!empty($_POST['course_id'])) {
            $redirect_args['course_id'] = absint($_POST['course_id']);
        }

        wp_safe_redirect(add_query_arg($redirect_args, admin_url('admin.php')));
        exit;
    }

    public static function handle_export_csv(): void
    {
        if (!current_user_can('manage_options')) {
            wp_die(esc_html__('You do not have permission to export analytics.', 'ts-mobile-bridge'), 403);
        }
        check_admin_referer('tsmb_analytics_export_nonce');

        $raw_params = [
            'preset'     => sanitize_key(wp_unslash($_POST['preset'] ?? 'all')),
            'start_date' => sanitize_text_field(wp_unslash($_POST['start_date'] ?? '')),
            'end_date'   => sanitize_text_field(wp_unslash($_POST['end_date'] ?? '')),
            'course_id'  => sanitize_text_field(wp_unslash($_POST['course_id'] ?? '')),
        ];

        $data = TSMB_Analytics_Service::get_dashboard_data($raw_params);
        if (is_wp_error($data)) {
            wp_die(esc_html($data->get_error_message()), 400);
        }

        $filename = sprintf('tsmb-course-analytics-%s.csv', gmdate('Y-m-d'));
        nocache_headers();
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . $filename . '"');

        $out = fopen('php://output', 'w');
        if ($out !== false) {
            fputcsv($out, [
                'Course ID',
                'Title',
                'Pricing Type',
                'Price (BDT)',
                'Curriculum Items',
                'Enrollments (Period)',
                'Enrollments (All Time)',
                'Completions (Period)',
                'Completions (All Time)',
                'Completion Rate (%)',
                'Avg Progress (%)',
                'Confirmed Paid Orders',
                'Confirmed Paid Units',
                'Gross Revenue',
                'Refunded Amount',
                'Refund Attribution',
                'Confirmed Revenue',
                'Verified Reviews',
                'Avg Rating',
            ]);

            foreach (($data['course_performance'] ?? []) as $row) {
                fputcsv($out, [
                    intval($row['course_id'] ?? 0),
                    self::escape_csv_cell((string) ($row['title'] ?? '')),
                    !empty($row['is_free']) ? 'Free' : 'Paid',
                    number_format((float) ($row['price_bdt'] ?? 0), 2, '.', ''),
                    intval($row['curriculum_items_count'] ?? 0),
                    intval($row['enrolled_in_period'] ?? 0),
                    intval($row['enrolled_all_time'] ?? 0),
                    intval($row['completed_in_period'] ?? 0),
                    intval($row['completed_all_time'] ?? 0),
                    number_format((float) ($row['completion_rate_percent'] ?? 0), 1, '.', ''),
                    $row['avg_progress_percent'] !== null ? number_format((float) $row['avg_progress_percent'], 1, '.', '') : 'N/A',
                    intval($row['paid_orders_count'] ?? 0),
                    intval($row['paid_units_sold'] ?? 0),
                    number_format((float) ($row['gross_revenue'] ?? ($row['confirmed_revenue'] ?? 0)), 2, '.', ''),
                    number_format((float) ($row['refunded_revenue'] ?? 0), 2, '.', ''),
                    self::escape_csv_cell((string) ($row['refund_attribution_label'] ?? 'None')),
                    number_format((float) ($row['confirmed_revenue'] ?? 0), 2, '.', ''),
                    intval($row['reviews_count'] ?? 0),
                    $row['avg_rating'] !== null ? number_format((float) $row['avg_rating'], 2, '.', '') : 'N/A',
                ]);
            }
            fclose($out);
        }
        exit;
    }

    public static function render_page(): void
    {
        if (!current_user_can('manage_options')) {
            wp_die(esc_html__('You do not have permission to view this page.', 'ts-mobile-bridge'), 403);
        }

        $raw_params = [
            'preset'     => isset($_GET['preset']) ? sanitize_key(wp_unslash($_GET['preset'])) : 'all',
            'start_date' => isset($_GET['start_date']) ? sanitize_text_field(wp_unslash($_GET['start_date'])) : '',
            'end_date'   => isset($_GET['end_date']) ? sanitize_text_field(wp_unslash($_GET['end_date'])) : '',
            'course_id'  => isset($_GET['course_id']) ? sanitize_text_field(wp_unslash($_GET['course_id'])) : '',
            'refresh'    => !empty($_GET['refresh']) || !empty($_GET['refreshed']),
        ];

        $filter_error = null;
        $data = TSMB_Analytics_Service::get_dashboard_data($raw_params);
        if (is_wp_error($data)) {
            $filter_error = $data->get_error_message();
            $data = TSMB_Analytics_Service::get_dashboard_data(['preset' => 'all']);
        }

        if (is_wp_error($data) || !is_array($data)) {
            echo '<div class="wrap"><h1>Platform Analytics</h1><div class="notice notice-error"><p>' . esc_html__('Unable to load analytics data.', 'ts-mobile-bridge') . '</p></div></div>';
            return;
        }

        $meta        = $data['meta'] ?? [];
        $filters     = $data['filters'] ?? [];
        $overview    = $data['overview'] ?? [];
        $users       = $data['users'] ?? [];
        $enrollments = $data['enrollments'] ?? [];
        $revenue     = $data['revenue'] ?? [];
        $courses     = $data['course_performance'] ?? [];
        $conversion  = $data['conversion'] ?? [];
        $ops         = $data['companion_ops'] ?? [];
        $series      = $data['time_series'] ?? [];
        $sources     = $data['data_sources'] ?? [];
        $unsupported = $data['unsupported_metrics'] ?? [];

        // Fetch unfiltered course list for dropdown even when filtered to 1 course
        $all_courses_dropdown = $courses;
        if (intval($filters['course_id'] ?? 0) > 0) {
            $unfiltered = TSMB_Analytics_Service::get_dashboard_data(['preset' => 'all']);
            if (is_array($unfiltered) && !empty($unfiltered['course_performance'])) {
                $all_courses_dropdown = $unfiltered['course_performance'];
            }
        }

        $active_preset  = (string) ($filters['preset'] ?? 'all');
        $cur_start      = (string) ($filters['start_date'] ?? '');
        $cur_end        = (string) ($filters['end_date'] ?? '');
        $cur_course_id  = intval($filters['course_id'] ?? 0);
        $currency       = (string) ($overview['currency'] ?? 'BDT');
        $currency_sym   = $currency === 'BDT' ? '৳' : ($currency . ' ');

        $rest_url = esc_url_raw(
            add_query_arg(
                array_filter([
                    'preset'     => $active_preset,
                    'start_date' => $cur_start,
                    'end_date'   => $cur_end,
                    'course_id'  => $cur_course_id > 0 ? $cur_course_id : null,
                    'refresh'    => '1',
                ], static function ($v) {
                    return $v !== null && $v !== '';
                }),
                rest_url(TSMB_Rest_API::NAMESPACE . '/admin/analytics')
            )
        );
        $rest_nonce = wp_create_nonce('wp_rest');
        ?>
        <div class="wrap tsmb-analytics-wrap">
            <style>
                .tsmb-analytics-wrap { max-width: 1380px; }
                .tsmb-an-header { display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:16px; margin-bottom:14px; }
                .tsmb-an-badges { display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
                .tsmb-pill { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:999px; font-size:12px; font-weight:600; background:#e2e8f0; color:#102F53; }
                .tsmb-pill-ok { background:#dcfce7; color:#166534; }
                .tsmb-pill-navy { background:#102F53; color:#ffffff; }
                .tsmb-pill-warn { background:#fef3c7; color:#92400e; }
                .tsmb-filter-bar { background:#fff; border:1px solid #ccd0d4; border-radius:8px; padding:16px; margin:16px 0; display:flex; flex-wrap:wrap; align-items:flex-end; gap:12px; justify-content:space-between; }
                .tsmb-filter-group { display:flex; flex-wrap:wrap; align-items:flex-end; gap:10px; }
                .tsmb-presets { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:10px; }
                .tsmb-preset-btn { display:inline-block; padding:5px 11px; border-radius:6px; text-decoration:none; font-size:12px; font-weight:600; border:1px solid #cbd5e1; background:#f8fafc; color:#102F53; }
                .tsmb-preset-btn.active { background:#102F53; color:#fff; border-color:#102F53; }
                .tsmb-section-nav { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:18px; }
                .tsmb-section-nav a { text-decoration:none; font-size:12px; font-weight:600; color:#102F53; background:#f1f5f9; padding:5px 10px; border-radius:5px; border:1px solid #e2e8f0; }
                .tsmb-section-card { background:#fff; border:1px solid #ccd0d4; border-radius:8px; padding:20px; margin-bottom:20px; box-shadow:0 1px 2px rgba(16,47,83,0.04); }
                .tsmb-section-title { margin:0 0 4px 0; font-size:17px; color:#102F53; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; }
                .tsmb-section-sub { margin:0 0 16px 0; color:#64748b; font-size:13px; }
                .tsmb-kpi-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(210px, 1fr)); gap:14px; }
                .tsmb-kpi { background:#f8fafc; border:1px solid #e2e8f0; border-left:4px solid #102F53; border-radius:8px; padding:14px 16px; }
                .tsmb-kpi.accent { border-left-color:#E34234; }
                .tsmb-kpi-label { font-size:12px; color:#475569; font-weight:600; text-transform:uppercase; letter-spacing:0.3px; }
                .tsmb-kpi-val { font-size:26px; font-weight:700; color:#102F53; margin:6px 0 4px 0; line-height:1.15; }
                .tsmb-kpi-meta { font-size:12px; color:#64748b; }
                .tsmb-two-col { display:grid; grid-template-columns:repeat(auto-fit, minmax(360px, 1fr)); gap:18px; }
                .tsmb-bar-chart { display:flex; align-items:flex-end; gap:8px; height:150px; padding:16px 8px 4px 8px; border-bottom:1px solid #cbd5e1; overflow-x:auto; }
                .tsmb-bar-col { min-width:36px; flex:1; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; height:100%; }
                .tsmb-bar-fill { width:24px; background:#102F53; border-radius:4px 4px 0 0; min-height:2px; transition:opacity .15s; }
                .tsmb-bar-label { font-size:10px; color:#64748b; margin-top:5px; white-space:nowrap; }
                .tsmb-bar-top { font-size:10px; font-weight:600; color:#102F53; margin-bottom:3px; }
                .tsmb-table-wrap { overflow-x:auto; }
                .tsmb-num { text-align:right; font-variant-numeric:tabular-nums; }
                .tsmb-unsupported-item { background:#fff7ed; border:1px solid #fed7aa; border-left:4px solid #E34234; border-radius:6px; padding:12px 14px; margin-bottom:10px; }
            </style>

            <div class="tsmb-an-header">
                <div>
                    <h1 style="display:flex;align-items:center;gap:10px;margin-bottom:4px;">
                        <span class="dashicons dashicons-chart-area" style="font-size:28px;width:28px;height:28px;color:#102F53;"></span>
                        <?php echo esc_html__('Thriving Skills Platform Analytics', 'ts-mobile-bridge'); ?>
                    </h1>
                    <p style="margin:0;color:#64748b;">
                        <?php echo esc_html__('Verified WordPress, LearnPress & WooCommerce metrics inside WordPress Admin. Zero schema modifications.', 'ts-mobile-bridge'); ?>
                    </p>
                </div>
                <div class="tsmb-an-badges">
                    <span class="tsmb-pill tsmb-pill-navy">TSMB v<?php echo esc_html((string) ($meta['plugin_version'] ?? '1.4.0')); ?></span>
                    <span class="tsmb-pill <?php echo !empty($meta['cache_hit']) ? 'tsmb-pill-ok' : ''; ?>" id="tsmb-cache-badge">
                        <?php echo !empty($meta['cache_hit']) ? 'Transient Cache: HIT' : 'Transient Cache: LIVE'; ?>
                        (<?php echo intval($meta['computation_ms'] ?? 0); ?> ms)
                    </span>
                    <span class="tsmb-pill">Schema Modified: No</span>
                </div>
            </div>

            <h2 class="nav-tab-wrapper" style="margin-bottom:16px;">
                <a href="?page=thriving-skills-app&tab=broadcast" class="nav-tab">1-Click Push Broadcast</a>
                <a href="?page=thriving-skills-app&tab=banners" class="nav-tab">Hero Slides &amp; Banners</a>
                <a href="?page=thriving-skills-app&tab=flash" class="nav-tab">Flash Sale &amp; Countdown</a>
                <a href="?page=thriving-skills-app&tab=chips" class="nav-tab">Trending Search &amp; Support</a>
                <a href="?page=thriving-skills-app&tab=version" class="nav-tab">App Version &amp; Security</a>
                <a href="?page=thriving-skills-app&tab=inbox" class="nav-tab">Support &amp; Leads</a>
                <a href="?page=<?php echo esc_attr(self::PAGE_SLUG); ?>" class="nav-tab nav-tab-active">Platform Analytics</a>
            </h2>

            <?php if ($filter_error !== null) : ?>
                <div class="notice notice-error"><p><?php echo esc_html($filter_error); ?></p></div>
            <?php endif; ?>

            <?php if (!empty($_GET['refreshed'])) : ?>
                <div class="notice notice-success is-dismissible"><p><?php echo esc_html__('Analytics transient cache cleared and recomputed from live records.', 'ts-mobile-bridge'); ?></p></div>
            <?php endif; ?>

            <div class="tsmb-filter-bar">
                <div style="flex:1;min-width:300px;">
                    <div class="tsmb-presets">
                        <?php
                        $presets = [
                            'today' => 'Today',
                            '7d'    => 'Last 7 Days',
                            '30d'   => 'Last 30 Days',
                            '90d'   => 'Last 90 Days',
                            'mtd'   => 'Month to Date',
                            'ytd'   => 'Year to Date',
                            'all'   => 'All Time',
                        ];
                        foreach ($presets as $p_key => $p_label) :
                            $p_url = add_query_arg(
                                array_filter([
                                    'page'      => self::PAGE_SLUG,
                                    'preset'    => $p_key,
                                    'course_id' => $cur_course_id > 0 ? $cur_course_id : null,
                                ]),
                                admin_url('admin.php')
                            );
                            ?>
                            <a href="<?php echo esc_url($p_url); ?>" class="tsmb-preset-btn <?php echo $active_preset === $p_key ? 'active' : ''; ?>">
                                <?php echo esc_html($p_label); ?>
                            </a>
                        <?php endforeach; ?>
                    </div>

                    <form method="get" action="<?php echo esc_url(admin_url('admin.php')); ?>" class="tsmb-filter-group">
                        <input type="hidden" name="page" value="<?php echo esc_attr(self::PAGE_SLUG); ?>" />
                        <div>
                            <label for="tsmb_preset" style="display:block;font-size:11px;font-weight:600;color:#475569;">Range Preset</label>
                            <select id="tsmb_preset" name="preset">
                                <?php foreach ($presets as $p_key => $p_label) : ?>
                                    <option value="<?php echo esc_attr($p_key); ?>" <?php selected($active_preset, $p_key); ?>><?php echo esc_html($p_label); ?></option>
                                <?php endforeach; ?>
                                <option value="custom" <?php selected($active_preset, 'custom'); ?>>Custom Dates</option>
                            </select>
                        </div>
                        <div>
                            <label for="tsmb_start_date" style="display:block;font-size:11px;font-weight:600;color:#475569;">Start Date</label>
                            <input type="date" id="tsmb_start_date" name="start_date" value="<?php echo esc_attr($cur_start); ?>" />
                        </div>
                        <div>
                            <label for="tsmb_end_date" style="display:block;font-size:11px;font-weight:600;color:#475569;">End Date</label>
                            <input type="date" id="tsmb_end_date" name="end_date" value="<?php echo esc_attr($cur_end); ?>" />
                        </div>
                        <div>
                            <label for="tsmb_course_id" style="display:block;font-size:11px;font-weight:600;color:#475569;">Course Filter</label>
                            <select id="tsmb_course_id" name="course_id" style="max-width:260px;">
                                <option value="">All Published Courses</option>
                                <?php foreach ($all_courses_dropdown as $cd) : ?>
                                    <option value="<?php echo intval($cd['course_id']); ?>" <?php selected($cur_course_id, intval($cd['course_id'])); ?>>
                                        #<?php echo intval($cd['course_id']); ?> — <?php echo esc_html((string) $cd['title']); ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <button type="submit" class="button button-primary" style="background:#102F53;border-color:#102F53;">Apply Filter</button>
                    </form>
                </div>

                <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
                    <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="margin:0;">
                        <input type="hidden" name="action" value="tsmb_analytics_refresh" />
                        <?php wp_nonce_field('tsmb_analytics_refresh_nonce'); ?>
                        <input type="hidden" name="preset" value="<?php echo esc_attr($active_preset); ?>" />
                        <input type="hidden" name="start_date" value="<?php echo esc_attr($cur_start); ?>" />
                        <input type="hidden" name="end_date" value="<?php echo esc_attr($cur_end); ?>" />
                        <input type="hidden" name="course_id" value="<?php echo esc_attr((string) $cur_course_id); ?>" />
                        <button type="submit" class="button">Clear &amp; Recompute Cache</button>
                    </form>

                    <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="margin:0;">
                        <input type="hidden" name="action" value="tsmb_analytics_export_csv" />
                        <?php wp_nonce_field('tsmb_analytics_export_nonce'); ?>
                        <input type="hidden" name="preset" value="<?php echo esc_attr($active_preset); ?>" />
                        <input type="hidden" name="start_date" value="<?php echo esc_attr($cur_start); ?>" />
                        <input type="hidden" name="end_date" value="<?php echo esc_attr($cur_end); ?>" />
                        <input type="hidden" name="course_id" value="<?php echo esc_attr((string) $cur_course_id); ?>" />
                        <button type="submit" class="button button-secondary">Export Courses CSV</button>
                    </form>

                    <button type="button" id="tsmb-verify-rest-btn" class="button">Verify REST Endpoint</button>
                </div>
            </div>

            <div id="tsmb-rest-probe-result" style="display:none;margin-bottom:14px;" class="notice notice-info"><p></p></div>

            <div class="tsmb-section-nav">
                <a href="#sec-overview">1. Overview</a>
                <a href="#sec-users">2. Users</a>
                <a href="#sec-enrollments">3. Enrollments &amp; Progress</a>
                <a href="#sec-revenue">4. Revenue &amp; Orders</a>
                <a href="#sec-courses">5. Course Performance</a>
                <a href="#sec-conversion">6. Conversion Funnels</a>
                <a href="#sec-limitations">7. Sources &amp; Limitations</a>
            </div>

            <!-- SECTION 1: OVERVIEW -->
            <div class="tsmb-section-card" id="sec-overview">
                <h2 class="tsmb-section-title">
                    <span>1. Executive Overview</span>
                    <small style="font-weight:500;color:#64748b;">
                        <?php
                        echo !empty($filters['is_all_time'])
                            ? 'Scope: All Time'
                            : sprintf('Range: %s to %s (%s)', esc_html($cur_start), esc_html($cur_end), esc_html((string) ($filters['timezone'] ?? 'UTC')));
                        ?>
                    </small>
                </h2>
                <p class="tsmb-section-sub">Confirmed paid WooCommerce commerce combined with authoritative LearnPress learner activity.</p>

                <div class="tsmb-kpi-grid">
                    <div class="tsmb-kpi accent">
                        <div class="tsmb-kpi-label">Confirmed Paid Revenue</div>
                        <div class="tsmb-kpi-val"><?php echo esc_html($currency_sym . number_format((float) ($overview['confirmed_revenue'] ?? 0), 2)); ?></div>
                        <div class="tsmb-kpi-meta"><?php echo intval($overview['confirmed_paid_orders'] ?? 0); ?> confirmed paid orders</div>
                    </div>
                    <div class="tsmb-kpi">
                        <div class="tsmb-kpi-label">Average Order Value</div>
                        <div class="tsmb-kpi-val"><?php echo esc_html($currency_sym . number_format((float) ($overview['average_order_value'] ?? 0), 2)); ?></div>
                        <div class="tsmb-kpi-meta">Paid orders &gt; 0 <?php echo esc_html($currency); ?> only</div>
                    </div>
                    <div class="tsmb-kpi">
                        <div class="tsmb-kpi-label">Recorded Enrollments</div>
                        <div class="tsmb-kpi-val"><?php echo intval($overview['enrollments_in_period'] ?? 0); ?></div>
                        <div class="tsmb-kpi-meta"><?php echo intval($overview['enrollments_all_time_active'] ?? 0); ?> total active all-time</div>
                    </div>
                    <div class="tsmb-kpi">
                        <div class="tsmb-kpi-label">Course Completion Rate</div>
                        <div class="tsmb-kpi-val"><?php echo number_format((float) ($overview['completion_rate_percent'] ?? 0), 1); ?>%</div>
                        <div class="tsmb-kpi-meta"><?php echo intval($overview['completions_all_time'] ?? 0); ?> finished of <?php echo intval($overview['enrollments_all_time_active'] ?? 0); ?> enrolled</div>
                    </div>
                    <div class="tsmb-kpi">
                        <div class="tsmb-kpi-label">Site-Capable Users</div>
                        <div class="tsmb-kpi-val"><?php echo number_format(intval($overview['site_users_total'] ?? 0)); ?></div>
                        <div class="tsmb-kpi-meta">+<?php echo intval($overview['new_users_in_period'] ?? 0); ?> in range (<?php echo number_format(intval($overview['raw_wp_users_total'] ?? 0)); ?> raw wp_users)</div>
                    </div>
                    <div class="tsmb-kpi accent">
                        <div class="tsmb-kpi-label">Pending Checkout Orders</div>
                        <div class="tsmb-kpi-val"><?php echo esc_html($currency_sym . number_format((float) ($overview['pending_orders_amount'] ?? 0), 2)); ?></div>
                        <div class="tsmb-kpi-meta"><?php echo intval($overview['pending_orders_count'] ?? 0); ?> unpaid orders excluded from revenue</div>
                    </div>
                    <div class="tsmb-kpi">
                        <div class="tsmb-kpi-label">Published Courses</div>
                        <div class="tsmb-kpi-val"><?php echo intval($overview['published_courses_count'] ?? 0); ?></div>
                        <div class="tsmb-kpi-meta"><?php echo intval($enrollments['published_lessons_count'] ?? 0); ?> lessons &bull; <?php echo intval($enrollments['published_quizzes_count'] ?? 0); ?> quizzes</div>
                    </div>
                    <div class="tsmb-kpi">
                        <div class="tsmb-kpi-label">Mobile Ops &amp; Push</div>
                        <div class="tsmb-kpi-val"><?php echo intval($overview['registered_push_devices'] ?? 0); ?></div>
                        <div class="tsmb-kpi-meta"><?php echo intval($overview['open_support_tickets'] ?? 0); ?> open tickets &bull; <?php echo intval($overview['new_corporate_leads'] ?? 0); ?> new leads</div>
                    </div>
                </div>

                <?php if (!empty($series)) : ?>
                    <h3 style="margin:22px 0 8px 0;font-size:14px;color:#102F53;">Confirmed Revenue Trend (<?php echo esc_html((($filters['granularity'] ?? 'month') === 'day') ? 'Daily' : 'Monthly'); ?>)</h3>
                    <?php
                    $max_rev = 1.0;
                    foreach ($series as $pt) {
                        if ((float) ($pt['revenue'] ?? 0) > $max_rev) {
                            $max_rev = (float) $pt['revenue'];
                        }
                    }
                    $tail_series = count($series) > 31 ? array_slice($series, -31) : $series;
                    ?>
                    <div class="tsmb-bar-chart" aria-label="Confirmed revenue trend">
                        <?php foreach ($tail_series as $pt) : ?>
                            <?php
                            $val = (float) ($pt['revenue'] ?? 0);
                            $pct = $max_rev > 0 ? max(2, intval(round(($val / $max_rev) * 100))) : 2;
                            ?>
                            <div class="tsmb-bar-col" title="<?php echo esc_attr($pt['period'] . ': ' . $currency_sym . number_format($val, 2) . ' (' . intval($pt['paid_orders']) . ' orders, ' . intval($pt['enrollments']) . ' enrollments)'); ?>">
                                <div class="tsmb-bar-top"><?php echo $val > 0 ? esc_html($currency_sym . number_format($val, 0)) : ''; ?></div>
                                <div class="tsmb-bar-fill" style="height:<?php echo $val > 0 ? $pct : 2; ?>%;background:<?php echo $val > 0 ? '#102F53' : '#e2e8f0'; ?>;"></div>
                                <div class="tsmb-bar-label"><?php echo esc_html((string) $pt['period']); ?></div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>
            </div>

            <!-- SECTION 2 & 3: USERS + ENROLLMENTS -->
            <div class="tsmb-two-col">
                <div class="tsmb-section-card" id="sec-users">
                    <h2 class="tsmb-section-title">2. User Analytics</h2>
                    <p class="tsmb-section-sub">Account registrations, active LMS learners, roles, and mobile sync coverage.</p>
                    <table class="widefat striped">
                        <tbody>
                            <tr><th>Site-Capable Users (<?php echo esc_html($GLOBALS['wpdb']->prefix . 'capabilities'); ?>)</th><td class="tsmb-num"><strong><?php echo number_format(intval($users['site_users_total'] ?? 0)); ?></strong></td></tr>
                            <tr><th>New Site Registrations (Selected Range)</th><td class="tsmb-num"><?php echo number_format(intval($users['new_site_users_in_period'] ?? 0)); ?></td></tr>
                            <tr><th>Raw <code>wp_users</code> Rows (All Table Rows)</th><td class="tsmb-num"><?php echo number_format(intval($users['raw_wp_users_total'] ?? 0)); ?></td></tr>
                            <tr><th>Legacy Rows Without Site Capabilities</th><td class="tsmb-num"><?php echo number_format(intval($users['legacy_users_without_site_caps'] ?? 0)); ?></td></tr>
                            <tr><th>Enrolled Learners (All-Time / Period)</th><td class="tsmb-num"><?php echo intval($users['enrolled_learners_all_time'] ?? 0); ?> / <?php echo intval($users['enrolled_learners_in_period'] ?? 0); ?></td></tr>
                            <tr><th>Active Lesson/Quiz Learners (Period)</th><td class="tsmb-num"><?php echo intval($users['active_lesson_learners_period'] ?? 0); ?></td></tr>
                            <tr><th>Completed Course Graduates (All-Time)</th><td class="tsmb-num"><?php echo intval($users['completed_learners_all_time'] ?? 0); ?></td></tr>
                            <tr><th>Distinct Paying Customers (Period)</th><td class="tsmb-num"><?php echo intval($users['paying_customers_in_period'] ?? 0); ?></td></tr>
                            <tr><th>Mobile App Synced Learners (Telemetry Meta)</th><td class="tsmb-num"><?php echo intval($users['mobile_synced_learners'] ?? 0); ?></td></tr>
                            <tr><th>Registered Push Devices / Unique Users</th><td class="tsmb-num"><?php echo intval($ops['push_tokens']['total_devices'] ?? 0); ?> / <?php echo intval($ops['push_tokens']['unique_users'] ?? 0); ?></td></tr>
                        </tbody>
                    </table>

                    <h4 style="margin:14px 0 6px 0;">Role Breakdown (Site-Capable Accounts)</h4>
                    <table class="widefat striped">
                        <thead><tr><th>Role</th><th class="tsmb-num">Users</th></tr></thead>
                        <tbody>
                            <?php foreach (($users['roles_breakdown'] ?? []) as $role_name => $r_cnt) : ?>
                                <tr><td><code><?php echo esc_html((string) $role_name); ?></code></td><td class="tsmb-num"><?php echo number_format(intval($r_cnt)); ?></td></tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>

                <div class="tsmb-section-card" id="sec-enrollments">
                    <h2 class="tsmb-section-title">3. Enrollment &amp; Course Progress</h2>
                    <p class="tsmb-section-sub">Deduplicated LearnPress course enrollments. Free courses are never recorded as purchases.</p>
                    <table class="widefat striped">
                        <tbody>
                            <tr><th>Enrollments in Selected Period</th><td class="tsmb-num"><strong><?php echo intval($enrollments['enrollments_in_period'] ?? 0); ?></strong></td></tr>
                            <tr><th>Free Course Enrollments (Period / All-Time)</th><td class="tsmb-num"><?php echo intval($enrollments['free_enrollments_in_period'] ?? 0); ?> / <?php echo intval($enrollments['free_enrollments_all_time'] ?? 0); ?></td></tr>
                            <tr><th>Paid Course Enrollments (Period / All-Time)</th><td class="tsmb-num"><?php echo intval($enrollments['paid_course_enrollments_period'] ?? 0); ?> / <?php echo intval($enrollments['paid_course_enrollments_all_time'] ?? 0); ?></td></tr>
                            <tr><th>All-Time Active Enrollment Snapshot</th><td class="tsmb-num"><?php echo intval($enrollments['active_snapshot_total'] ?? 0); ?></td></tr>
                            <tr><th>In-Progress Enrollments</th><td class="tsmb-num"><?php echo intval($enrollments['in_progress_snapshot_total'] ?? 0); ?></td></tr>
                            <tr><th>Completed Courses (Period / All-Time)</th><td class="tsmb-num"><?php echo intval($enrollments['completions_in_period'] ?? 0); ?> / <?php echo intval($enrollments['completed_snapshot_total'] ?? 0); ?></td></tr>
                            <tr><th>Average Lesson/Quiz Completion Across Enrolled</th><td class="tsmb-num"><?php echo $enrollments['avg_progress_percent'] !== null ? number_format((float) $enrollments['avg_progress_percent'], 1) . '%' : 'N/A'; ?></td></tr>
                            <tr><th>Courses With Zero Recorded Enrollments</th><td class="tsmb-num"><?php echo intval($enrollments['courses_without_enrollments'] ?? 0); ?></td></tr>
                            <tr><th>Published Courses With Empty Curriculum</th><td class="tsmb-num"><?php echo intval($enrollments['courses_empty_curriculum'] ?? 0); ?></td></tr>
                            <tr><th>Quiz Attempts (Total / Passed / Failed)</th><td class="tsmb-num"><?php echo intval($enrollments['quizzes']['attempts_total'] ?? 0); ?> / <?php echo intval($enrollments['quizzes']['passed_total'] ?? 0); ?> / <?php echo intval($enrollments['quizzes']['failed_total'] ?? 0); ?></td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- SECTION 4: REVENUE & ORDER RECONCILIATION -->
            <div class="tsmb-section-card" id="sec-revenue">
                <h2 class="tsmb-section-title">
                    <span>4. Revenue &amp; Order Reconciliation</span>
                    <span class="tsmb-pill">Storage: <?php echo esc_html((string) ($revenue['wc_storage_mode'] ?? '')); ?></span>
                </h2>
                <p class="tsmb-section-sub">Only confirmed paid orders (<code>wc-completed</code> / <code>wc-processing</code> with net total &gt; 0 after refunds) are included in confirmed revenue.</p>

                <div class="tsmb-two-col">
                    <div>
                        <h4 style="margin:0 0 8px 0;">WooCommerce Order Status Breakdown</h4>
                        <table class="widefat striped">
                            <thead><tr><th>Status</th><th class="tsmb-num">Orders</th><th class="tsmb-num">Amount (<?php echo esc_html($currency); ?>)</th><th>Included in Revenue?</th></tr></thead>
                            <tbody>
                                <?php foreach (($revenue['status_breakdown'] ?? []) as $st => $st_data) : ?>
                                    <?php
                                    $is_rev_status = in_array($st, ['completed', 'processing'], true);
                                    if (intval($st_data['count'] ?? 0) === 0 && !$is_rev_status && $st !== 'pending' && $st !== 'failed' && $st !== 'refunded') {
                                        continue;
                                    }
                                    ?>
                                    <tr>
                                        <td><code>wc-<?php echo esc_html((string) $st); ?></code></td>
                                        <td class="tsmb-num"><?php echo intval($st_data['count'] ?? 0); ?></td>
                                        <td class="tsmb-num"><?php echo esc_html($currency_sym . number_format((float) ($st_data['amount'] ?? 0), 2)); ?></td>
                                        <td><?php echo $is_rev_status ? '<strong style="color:#166534;">Yes (if net &gt; 0)</strong>' : '<span style="color:#64748b;">No</span>'; ?></td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>

                        <?php if (!empty($revenue['gateway_breakdown'])) : ?>
                            <h4 style="margin:16px 0 8px 0;">Payment Gateways (Confirmed Paid)</h4>
                            <table class="widefat striped">
                                <thead><tr><th>Gateway</th><th class="tsmb-num">Paid Orders</th><th class="tsmb-num">Net Revenue</th></tr></thead>
                                <tbody>
                                    <?php foreach ($revenue['gateway_breakdown'] as $gw) : ?>
                                        <tr>
                                            <td><?php echo esc_html((string) $gw['title']); ?> (<code><?php echo esc_html((string) $gw['method']); ?></code>)</td>
                                            <td class="tsmb-num"><?php echo intval($gw['orders']); ?></td>
                                            <td class="tsmb-num"><?php echo esc_html($currency_sym . number_format((float) $gw['total'], 2)); ?></td>
                                        </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                        <?php endif; ?>
                    </div>

                    <div>
                        <h4 style="margin:0 0 8px 0;">WooCommerce vs. LearnPress Order Reconciliation</h4>
                        <?php $rec = $revenue['reconciliation'] ?? []; ?>
                        <table class="widefat striped">
                            <tbody>
                                <tr><th>Gross Paid WooCommerce Orders Total</th><td class="tsmb-num"><?php echo esc_html($currency_sym . number_format((float) ($revenue['gross_paid_total'] ?? 0), 2)); ?></td></tr>
                                <tr><th>Partial Refunds Deducted</th><td class="tsmb-num">-<?php echo esc_html($currency_sym . number_format((float) ($revenue['refunds_deducted_total'] ?? 0), 2)); ?></td></tr>
                                <tr><th>Course Refunds: Exact Line-Item Mapped</th><td class="tsmb-num">-<?php echo esc_html($currency_sym . number_format((float) ($revenue['course_refund_attribution']['exact_line_item_refunds_total'] ?? 0), 2)); ?></td></tr>
                                <tr><th>Course Refunds: Proportionally Allocated (Unmapped)</th><td class="tsmb-num">-<?php echo esc_html($currency_sym . number_format((float) ($revenue['course_refund_attribution']['proportionally_allocated_refunds_total'] ?? 0), 2)); ?></td></tr>
                                <tr><th>Free / ৳0 Orders Excluded</th><td class="tsmb-num"><?php echo intval($revenue['free_zero_wc_orders'] ?? 0); ?> WC / <?php echo intval($rec['free_zero_lp_orders_excluded'] ?? 0); ?> LP</td></tr>
                                <tr><th>Woo-Linked LearnPress Orders (Deduplicated)</th><td class="tsmb-num"><?php echo intval($rec['woo_linked_lp_orders_deduped'] ?? 0); ?> orders (<?php echo esc_html($currency_sym . number_format((float) ($rec['woo_linked_lp_nominal_total'] ?? 0), 2)); ?>)</td></tr>
                                <tr><th>Unverified / Manual Standalone <code>lp_order</code> (Excluded)</th><td class="tsmb-num"><?php echo intval($rec['unverified_or_manual_lp_orders'] ?? 0); ?> orders (<?php echo esc_html($currency_sym . number_format((float) ($rec['unverified_or_manual_lp_total'] ?? 0), 2)); ?>)</td></tr>
                                <tr><th>Verified Direct LP Gateway Orders (Included)</th><td class="tsmb-num"><?php echo intval($rec['direct_gateway_lp_orders_included'] ?? 0); ?> orders (<?php echo esc_html($currency_sym . number_format((float) ($rec['direct_gateway_lp_revenue'] ?? 0), 2)); ?>)</td></tr>
                                <tr><th>Non-Course WC Line Revenue (if any)</th><td class="tsmb-num"><?php echo esc_html($currency_sym . number_format((float) ($revenue['non_course_wc_revenue'] ?? 0), 2)); ?></td></tr>
                                <tr><th><strong>Net Authoritative Confirmed Revenue</strong></th><td class="tsmb-num"><strong><?php echo esc_html($currency_sym . number_format((float) ($revenue['confirmed_revenue'] ?? 0), 2)); ?></strong></td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- SECTION 5: COURSE PERFORMANCE -->
            <div class="tsmb-section-card" id="sec-courses">
                <h2 class="tsmb-section-title">
                    <span>5. Course Performance Breakdown</span>
                    <input type="search" id="tsmb-course-search" placeholder="Filter courses by title..." style="min-width:220px;" />
                </h2>
                <p class="tsmb-section-sub">Enrollments, completions, curriculum progress, verified purchases, revenue attribution, and review scores across published courses.</p>

                <div class="tsmb-table-wrap">
                    <table class="widefat striped" id="tsmb-courses-table">
                        <thead>
                            <tr>
                                <th>Course</th>
                                <th class="tsmb-num">Price</th>
                                <th class="tsmb-num">Items</th>
                                <th class="tsmb-num">Enrolled (Period)</th>
                                <th class="tsmb-num">Enrolled (All)</th>
                                <th class="tsmb-num">Completed (All)</th>
                                <th class="tsmb-num">Completion %</th>
                                <th class="tsmb-num">Avg Progress</th>
                                <th class="tsmb-num">Paid Orders</th>
                                <th class="tsmb-num">Refunds</th>
                                <th class="tsmb-num">Confirmed Revenue</th>
                                <th class="tsmb-num">Reviews</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php if (empty($courses)) : ?>
                                <tr><td colspan="12">No published courses matched this filter.</td></tr>
                            <?php else : ?>
                                <?php foreach ($courses as $c) : ?>
                                    <?php
                                    $ref_amt  = (float) ($c['refunded_revenue'] ?? 0);
                                    $ref_mode = (string) ($c['refund_attribution_mode'] ?? 'none');
                                    ?>
                                    <tr class="tsmb-course-row" data-title="<?php echo esc_attr(strtolower((string) $c['title'])); ?>">
                                        <td>
                                            <strong><?php echo esc_html((string) $c['title']); ?></strong><br />
                                            <small style="color:#64748b;">ID #<?php echo intval($c['course_id']); ?><?php echo intval($c['legacy_lp_students_meta']) > 0 ? ' &bull; Legacy _lp_students: ' . intval($c['legacy_lp_students_meta']) : ''; ?></small>
                                        </td>
                                        <td class="tsmb-num">
                                            <?php echo !empty($c['is_free']) ? '<span class="tsmb-pill">Free</span>' : esc_html($currency_sym . number_format((float) $c['price_bdt'], 0)); ?>
                                        </td>
                                        <td class="tsmb-num"><?php echo intval($c['curriculum_items_count']); ?></td>
                                        <td class="tsmb-num"><?php echo intval($c['enrolled_in_period']); ?></td>
                                        <td class="tsmb-num"><?php echo intval($c['enrolled_all_time']); ?></td>
                                        <td class="tsmb-num"><?php echo intval($c['completed_all_time']); ?></td>
                                        <td class="tsmb-num"><?php echo number_format((float) $c['completion_rate_percent'], 1); ?>%</td>
                                        <td class="tsmb-num"><?php echo $c['avg_progress_percent'] !== null ? number_format((float) $c['avg_progress_percent'], 1) . '%' : '—'; ?></td>
                                        <td class="tsmb-num"><?php echo intval($c['paid_orders_count']); ?></td>
                                        <td class="tsmb-num">
                                            <?php if ($ref_amt > 0.0) : ?>
                                                <span>-<?php echo esc_html($currency_sym . number_format($ref_amt, 2)); ?></span><br />
                                                <small class="tsmb-pill <?php echo $ref_mode === 'exact' ? 'tsmb-pill-ok' : 'tsmb-pill-warn'; ?>" style="font-size:10px;padding:2px 6px;">
                                                    <?php echo esc_html((string) ($c['refund_attribution_label'] ?? 'Proportionally Allocated')); ?>
                                                </small>
                                            <?php else : ?>
                                                —
                                            <?php endif; ?>
                                        </td>
                                        <td class="tsmb-num"><strong><?php echo esc_html($currency_sym . number_format((float) $c['confirmed_revenue'], 2)); ?></strong></td>
                                        <td class="tsmb-num">
                                            <?php echo intval($c['reviews_count']) > 0 && $c['avg_rating'] !== null ? esc_html(number_format((float) $c['avg_rating'], 1) . '★ (' . intval($c['reviews_count']) . ')') : '—'; ?>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- SECTION 6: CONVERSION FUNNELS -->
            <div class="tsmb-section-card" id="sec-conversion">
                <h2 class="tsmb-section-title">6. Checkout &amp; Learner Conversion Funnels</h2>
                <p class="tsmb-section-sub">Grounded server conversion metrics only. Pre-checkout page views and cart impressions are intentionally not guessed.</p>
                <?php
                $cf = $conversion['checkout_order_funnel'] ?? [];
                $lf = $conversion['learner_journey_funnel'] ?? [];
                $em = $conversion['enrollment_mix'] ?? [];
                ?>
                <div class="tsmb-two-col">
                    <div>
                        <h4 style="margin:0 0 8px 0;">WooCommerce Checkout Order Conversion (Period)</h4>
                        <table class="widefat striped">
                            <tbody>
                                <tr><th>Total Checkout Orders Initiated</th><td class="tsmb-num"><?php echo intval($cf['total_orders_initiated'] ?? 0); ?></td></tr>
                                <tr><th>Confirmed Paid Orders (<code>net &gt; 0</code>)</th><td class="tsmb-num"><strong><?php echo intval($cf['confirmed_paid_orders'] ?? 0); ?></strong> (<?php echo number_format((float) ($cf['paid_conversion_percent'] ?? 0), 1); ?>%)</td></tr>
                                <tr><th>Pending / On-Hold Orders</th><td class="tsmb-num"><?php echo intval($cf['pending_or_on_hold_orders'] ?? 0); ?> (<?php echo esc_html($currency_sym . number_format((float) ($cf['uncollected_pending_amount'] ?? 0), 2)); ?> uncollected)</td></tr>
                                <tr><th>Failed / Cancelled Orders</th><td class="tsmb-num"><?php echo intval($cf['failed_or_cancelled_orders'] ?? 0); ?></td></tr>
                                <tr><th>Refunded Orders</th><td class="tsmb-num"><?php echo intval($cf['refunded_orders'] ?? 0); ?></td></tr>
                                <tr><th>Checkout Non-Paid Dropoff Rate</th><td class="tsmb-num"><?php echo number_format((float) ($cf['non_paid_drop_percent'] ?? 0), 1); ?>%</td></tr>
                            </tbody>
                        </table>
                    </div>

                    <div>
                        <h4 style="margin:0 0 8px 0;">Learner Activation &amp; Enrollment Mix</h4>
                        <table class="widefat striped">
                            <tbody>
                                <tr><th>Site Accounts &rarr; Enrolled Learners (All-Time)</th><td class="tsmb-num"><?php echo intval($lf['enrolled_learners_all_time'] ?? 0); ?> / <?php echo intval($lf['site_accounts_total'] ?? 0); ?> (<?php echo number_format((float) ($lf['account_to_enrolled_percent'] ?? 0), 1); ?>%)</td></tr>
                                <tr><th>Active Lesson Learners (Period)</th><td class="tsmb-num"><?php echo intval($lf['active_lesson_learners_period'] ?? 0); ?></td></tr>
                                <tr><th>Enrolled &rarr; Completed Rate</th><td class="tsmb-num"><?php echo number_format((float) ($lf['enrolled_to_completed_percent'] ?? 0), 1); ?>%</td></tr>
                                <tr><th>Free Enrollments Share (Period)</th><td class="tsmb-num"><?php echo intval($em['free_in_period'] ?? 0); ?> / <?php echo intval($em['total_in_period'] ?? 0); ?> (<?php echo number_format((float) ($em['free_share_percent'] ?? 0), 1); ?>%)</td></tr>
                                <tr><th>Paid-Course Enrollments Share (Period)</th><td class="tsmb-num"><?php echo intval($em['paid_course_in_period'] ?? 0); ?> / <?php echo intval($em['total_in_period'] ?? 0); ?> (<?php echo number_format((float) ($em['paid_share_percent'] ?? 0), 1); ?>%)</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- SECTION 7: METRIC SOURCES & LIMITATIONS -->
            <div class="tsmb-section-card" id="sec-limitations">
                <h2 class="tsmb-section-title">7. Metric Sources &amp; Unsupported Metrics Disclosure</h2>
                <p class="tsmb-section-sub">Audit trace of authoritative database sources and metrics intentionally marked unavailable rather than fabricated.</p>

                <h4>Verified Sources of Truth</h4>
                <table class="widefat striped" style="margin-bottom:18px;">
                    <tbody>
                        <?php foreach ($sources as $s_key => $s_desc) : ?>
                            <tr><th style="width:220px;"><code><?php echo esc_html((string) $s_key); ?></code></th><td><?php echo esc_html((string) $s_desc); ?></td></tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>

                <h4>Metrics Not Reliably Calculable From Existing Schema</h4>
                <?php foreach ($unsupported as $um) : ?>
                    <div class="tsmb-unsupported-item">
                        <strong><?php echo esc_html((string) ($um['label'] ?? '')); ?></strong>
                        <span class="tsmb-pill tsmb-pill-warn" style="margin-left:8px;">Unavailable (No Fabrication)</span>
                        <p style="margin:6px 0 0 0;color:#334155;font-size:13px;"><?php echo esc_html((string) ($um['reason'] ?? '')); ?></p>
                    </div>
                <?php endforeach; ?>
            </div>

            <script>
                (function () {
                    var searchInput = document.getElementById('tsmb-course-search');
                    if (searchInput) {
                        searchInput.addEventListener('input', function () {
                            var q = String(searchInput.value || '').trim().toLowerCase();
                            var rows = document.querySelectorAll('#tsmb-courses-table tbody .tsmb-course-row');
                            rows.forEach(function (row) {
                                var title = row.getAttribute('data-title') || '';
                                row.style.display = (!q || title.indexOf(q) !== -1) ? '' : 'none';
                            });
                        });
                    }

                    var restBtn = document.getElementById('tsmb-verify-rest-btn');
                    var restBox = document.getElementById('tsmb-rest-probe-result');
                    if (restBtn && restBox && window.fetch) {
                        restBtn.addEventListener('click', function () {
                            restBtn.disabled = true;
                            restBox.style.display = 'block';
                            restBox.querySelector('p').textContent = 'Querying authenticated admin REST endpoint...';
                            fetch(<?php echo wp_json_encode($rest_url); ?>, {
                                method: 'GET',
                                credentials: 'same-origin',
                                headers: { 'X-WP-Nonce': <?php echo wp_json_encode($rest_nonce); ?>, 'Accept': 'application/json' }
                            })
                            .then(function (r) { return r.json().then(function (j) { return { status: r.status, body: j }; }); })
                            .then(function (res) {
                                var ov = (res.body && res.body.overview) ? res.body.overview : null;
                                if (res.status === 200 && ov) {
                                    restBox.className = 'notice notice-success';
                                    restBox.querySelector('p').textContent =
                                        'REST HTTP 200 OK — Confirmed Revenue: ' + ov.currency + ' ' + ov.confirmed_revenue +
                                        ', Paid Orders: ' + ov.confirmed_paid_orders +
                                        ', Recorded Enrollments: ' + ov.enrollments_in_period +
                                        ', Schema Modified: ' + String(res.body.meta && res.body.meta.schema_modified);
                                } else {
                                    restBox.className = 'notice notice-error';
                                    restBox.querySelector('p').textContent = 'REST HTTP ' + res.status + ': ' + JSON.stringify(res.body);
                                }
                            })
                            .catch(function (err) {
                                restBox.className = 'notice notice-error';
                                restBox.querySelector('p').textContent = 'REST error: ' + String(err);
                            })
                            .finally(function () {
                                restBtn.disabled = false;
                            });
                        });
                    }
                })();
            </script>
        </div>
        <?php
    }

    private static function escape_csv_cell(string $value): string
    {
        $clean = str_replace(["\r", "\n"], ' ', $value);
        if ($clean !== '' && in_array($clean[0], ['=', '+', '-', '@'], true)) {
            return "'" . $clean;
        }
        return $clean;
    }
}
