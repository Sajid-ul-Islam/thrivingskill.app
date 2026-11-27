<?php

/**
 * WordPress + LearnPress + WooCommerce Integration Test Suite.
 *
 * Exercises real WP_REST_Server route dispatch, WPDB/MySQL tables created via
 * dbDelta(), LearnPress CPTs/curriculum/enrollments, and WooCommerce order flows.
 */

final class WordPressIntegrationTest extends WP_UnitTestCase
{
    public function set_up(): void
    {
        parent::set_up();
        global $wp_rest_server;
        $wp_rest_server = null;
        TSMB_Security::reset_request_context();
        TSMB_Rest_API::reset_request_caches();
        wp_set_current_user(0);
    }

    public function tear_down(): void
    {
        wp_set_current_user(0);
        TSMB_Security::reset_request_context();
        TSMB_Rest_API::reset_request_caches();
        parent::tear_down();
    }

    /**
     * Inserts a row compatible with strict MySQL 8.0 modes across LearnPress schema versions
     * by filling any non-nullable column that lacks a default value.
     */
    private function insertMatchingColumns(string $table, array $data): int
    {
        global $wpdb;
        $columns = $wpdb->get_results("DESCRIBE `{$table}`", ARRAY_A);
        $this->assertIsArray($columns);

        $row = [];
        foreach ($columns as $col) {
            $field = (string) ($col['Field'] ?? '');
            if ($field === '' || stripos((string) ($col['Extra'] ?? ''), 'auto_increment') !== false) {
                continue;
            }
            if (array_key_exists($field, $data)) {
                $row[$field] = $data[$field];
                continue;
            }
            if (($col['Null'] ?? '') === 'NO' && ($col['Default'] ?? null) === null) {
                $type = strtolower((string) ($col['Type'] ?? ''));
                if (preg_match('/int|decimal|float|double|bit/', $type)) {
                    $row[$field] = 0;
                } elseif (strpos($type, 'datetime') !== false || strpos($type, 'timestamp') !== false) {
                    $row[$field] = gmdate('Y-m-d H:i:s');
                } elseif (strpos($type, 'date') !== false) {
                    $row[$field] = gmdate('Y-m-d');
                } else {
                    $row[$field] = '';
                }
            }
        }

        $inserted = $wpdb->insert($table, $row);
        $this->assertNotFalse($inserted, "Failed inserting into {$table}: {$wpdb->last_error}");
        return intval($wpdb->insert_id);
    }

    public function test_real_plugins_and_custom_tables_exist_in_mysql(): void
    {
        global $wpdb;

        $this->assertTrue(class_exists('LearnPress'), 'Real LearnPress plugin must be active for WP integration tests.');
        $this->assertTrue(function_exists('WC') && class_exists('WooCommerce'), 'Real WooCommerce plugin must be active for WP integration tests.');

        $required_tables = [
            TSMB_Lifecycle::get_push_tokens_table(),
            TSMB_Lifecycle::get_leads_table(),
            TSMB_Lifecycle::get_tickets_table(),
            $wpdb->prefix . 'learnpress_sections',
            $wpdb->prefix . 'learnpress_section_items',
            $wpdb->prefix . 'learnpress_user_items',
        ];

        foreach ($required_tables as $table) {
            $found = $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $table));
            $this->assertSame($table, $found, "Missing MySQL table: {$table}");
        }
    }

    public function test_real_rest_server_registers_all_v1_3_routes_and_auth_guards(): void
    {
        $server = rest_get_server();
        $routes = $server->get_routes();

        $expected_routes = [
            '/thrivingskill/v1/config',
            '/thrivingskill/v1/feed',
            '/thrivingskill/v1/lessons/(?P<id>\d+)',
            '/thrivingskill/v1/enrollments',
            '/thrivingskill/v1/register',
            '/thrivingskill/v1/verify-registration',
            '/thrivingskill/v1/resend-registration',
            '/thrivingskill/v1/auth/reset-password/confirm',
            '/thrivingskill/v1/revoke-token',
            '/thrivingskill/v1/auth/webview-handoff',
            '/thrivingskill/v1/learning-state',
            '/thrivingskill/v1/courses/(?P<id>\d+)/submit-review',
            '/thrivingskill/v1/certificates/verify',
            '/thrivingskill/v1/corporate-inquiry',
            '/thrivingskill/v1/support-tickets',
            '/thrivingskill/v1/engagement-sync',
            '/thrivingskill/v1/register-push-token',
        ];

        foreach ($expected_routes as $route) {
            $this->assertArrayHasKey($route, $routes, "REST route not registered on WP_REST_Server: {$route}");
        }

        // /config returns plugin_version matching TSMB_VERSION
        $cfgRes = rest_do_request(new WP_REST_Request('GET', '/thrivingskill/v1/config'));
        $this->assertSame(200, $cfgRes->get_status());
        $this->assertSame(TSMB_VERSION, $cfgRes->get_data()['plugin_version']);

        // Unauthenticated requests to protected routes must return 401/403
        $protected = [
            ['POST', '/thrivingskill/v1/register-push-token'],
            ['GET', '/thrivingskill/v1/enrollments'],
            ['GET', '/thrivingskill/v1/learning-state'],
            ['GET', '/thrivingskill/v1/support-tickets'],
            ['POST', '/thrivingskill/v1/support-tickets'],
            ['POST', '/thrivingskill/v1/engagement-sync'],
            ['POST', '/thrivingskill/v1/auth/webview-handoff'],
            ['POST', '/thrivingskill/v1/revoke-token'],
        ];

        foreach ($protected as [$method, $path]) {
            $res = rest_do_request(new WP_REST_Request($method, $path));
            $this->assertContains($res->get_status(), [401, 403], "{$method} {$path} must reject unauthenticated requests.");
        }
    }

    public function test_lesson_paywall_and_draft_guard_via_real_wp_rest_dispatch(): void
    {
        global $wpdb;

        $student_id = self::factory()->user->create(['role' => 'subscriber']);
        $admin_id   = self::factory()->user->create(['role' => 'administrator']);

        $course_id = wp_insert_post([
            'post_type'   => 'lp_course',
            'post_status' => 'publish',
            'post_title'  => 'Paid AI Course',
        ]);
        update_post_meta($course_id, '_lp_price', '1500');

        $preview_id = wp_insert_post([
            'post_type'    => 'lp_lesson',
            'post_status'  => 'publish',
            'post_title'   => 'Free Preview Lesson',
            'post_content' => 'Welcome preview',
        ]);
        update_post_meta($preview_id, '_lp_preview', 'yes');
        update_post_meta($preview_id, '_lp_lesson_video_intro', 'https://player.vimeo.com/video/111111111');

        $paid_lesson_id = wp_insert_post([
            'post_type'    => 'lp_lesson',
            'post_status'  => 'publish',
            'post_title'   => 'Paid Lesson',
            'post_content' => 'Secret paid content',
        ]);
        update_post_meta($paid_lesson_id, '_lp_preview', 'no');
        update_post_meta($paid_lesson_id, '_lp_lesson_video_intro', 'https://player.vimeo.com/video/222222222');

        $draft_lesson_id = wp_insert_post([
            'post_type'    => 'lp_lesson',
            'post_status'  => 'draft',
            'post_title'   => 'Unpublished Draft Lesson',
            'post_content' => 'Draft secret',
        ]);
        update_post_meta($draft_lesson_id, '_lp_preview', 'yes');

        $section_id = $this->insertMatchingColumns($wpdb->prefix . 'learnpress_sections', [
            'section_name'      => 'Module 1',
            'section_course_id' => $course_id,
            'section_order'     => 1,
        ]);
        $this->assertGreaterThan(0, $section_id);

        foreach ([$preview_id, $paid_lesson_id, $draft_lesson_id] as $idx => $lid) {
            $this->insertMatchingColumns($wpdb->prefix . 'learnpress_section_items', [
                'section_id' => $section_id,
                'item_id'    => $lid,
                'item_order' => $idx + 1,
                'item_type'  => 'lp_lesson',
            ]);
        }

        // 1. Guest accesses preview lesson (200) but blocked on paid (401) and draft (403)
        wp_set_current_user(0);
        $this->assertSame(200, rest_do_request(new WP_REST_Request('GET', '/thrivingskill/v1/lessons/' . $preview_id))->get_status());
        $this->assertSame(401, rest_do_request(new WP_REST_Request('GET', '/thrivingskill/v1/lessons/' . $paid_lesson_id))->get_status());
        $this->assertSame(403, rest_do_request(new WP_REST_Request('GET', '/thrivingskill/v1/lessons/' . $draft_lesson_id))->get_status());

        // 2. Unenrolled subscriber blocked from paid & draft lessons (403)
        wp_set_current_user($student_id);
        $this->assertSame(403, rest_do_request(new WP_REST_Request('GET', '/thrivingskill/v1/lessons/' . $paid_lesson_id))->get_status());
        $this->assertSame(403, rest_do_request(new WP_REST_Request('GET', '/thrivingskill/v1/lessons/' . $draft_lesson_id))->get_status());

        // 3. Enrolled subscriber in real learnpress_user_items gets 200 for paid lesson, still 403 for draft
        $this->insertMatchingColumns($wpdb->prefix . 'learnpress_user_items', [
            'user_id'   => $student_id,
            'item_id'   => $course_id,
            'item_type' => 'lp_course',
            'status'    => 'enrolled',
        ]);
        $paidRes = rest_do_request(new WP_REST_Request('GET', '/thrivingskill/v1/lessons/' . $paid_lesson_id));
        $this->assertSame(200, $paidRes->get_status());
        $this->assertSame('222222222', $paidRes->get_data()['video_id']);
        $this->assertSame(403, rest_do_request(new WP_REST_Request('GET', '/thrivingskill/v1/lessons/' . $draft_lesson_id))->get_status());

        // 4. Administrator can access draft lesson (200)
        wp_set_current_user($admin_id);
        $this->assertSame(200, rest_do_request(new WP_REST_Request('GET', '/thrivingskill/v1/lessons/' . $draft_lesson_id))->get_status());
    }

    public function test_learnpress_paid_enroll_requires_completed_woocommerce_order(): void
    {
        $student_id = self::factory()->user->create(['role' => 'subscriber']);
        wp_set_current_user($student_id);

        $course_id = wp_insert_post([
            'post_type'   => 'lp_course',
            'post_status' => 'publish',
            'post_title'  => 'Enterprise AI Course',
        ]);
        update_post_meta($course_id, '_lp_price', '2500');

        // Without payment, /learnpress/v1/courses/enroll guard blocks unpaid enrollment with 403 tsmb_payment_required
        $enrollReq = new WP_REST_Request('POST', '/learnpress/v1/courses/enroll');
        $enrollReq->set_header('Content-Type', 'application/json');
        $enrollReq->set_body(wp_json_encode(['id' => $course_id]));
        $blockedRes = rest_do_request($enrollReq);
        $this->assertSame(403, $blockedRes->get_status());
        $err = $blockedRes->as_error();
        $this->assertInstanceOf(WP_Error::class, $err);
        $this->assertSame('tsmb_payment_required', $err->get_error_code());

        // Create a real WooCommerce product linked to the course and a pending WC order
        $product = new WC_Product_Simple();
        $product->set_name('Enterprise AI Product');
        $product->set_status('publish');
        $product->set_regular_price('2500');
        $product->set_price('2500');
        $product_id = $product->save();
        update_post_meta($product_id, '_learnpress_course', $course_id);

        $order = wc_create_order(['customer_id' => $student_id, 'status' => 'pending']);
        $order->add_product(wc_get_product($product_id), 1);
        $order->calculate_totals();
        $order->save();

        // While order is pending, /enrollments reports payment_confirmed = false and enroll guard still blocks
        $enrollCheckPending = new WP_REST_Request('GET', '/thrivingskill/v1/enrollments');
        $enrollCheckPending->set_query_params([
            'course_id' => $course_id,
            'order_id'  => $order->get_id(),
            'order_key' => $order->get_order_key(),
        ]);
        $pendingRes = rest_do_request($enrollCheckPending);
        $this->assertSame(200, $pendingRes->get_status());
        $this->assertFalse($pendingRes->get_data()['payment_confirmed']);
        $this->assertFalse(TSMB_Rest_API::filter_learnpress_can_enroll_course(true, $course_id, $student_id));

        // Mark real WC order completed -> guard allows enrollment and /enrollments confirms payment
        $order->set_status('completed');
        $order->save();
        TSMB_Rest_API::reset_request_caches();

        $paidRes = rest_do_request($enrollCheckPending);
        $this->assertSame(200, $paidRes->get_status());
        $this->assertTrue($paidRes->get_data()['payment_confirmed']);
        $this->assertSame('completed', $paidRes->get_data()['order_status']);
        $this->assertTrue(TSMB_Rest_API::filter_learnpress_can_enroll_course(true, $course_id, $student_id));
    }

    public function test_corporate_inquiry_and_support_tickets_persist_and_enforce_user_scoping(): void
    {
        global $wpdb;

        $_SERVER['REMOTE_ADDR'] = '198.51.100.200';
        update_option('tsmb_trust_proxy_headers', '0');

        $corpReq = new WP_REST_Request('POST', '/thrivingskill/v1/corporate-inquiry');
        $corpReq->set_header('Content-Type', 'application/json');
        $corpReq->set_body(wp_json_encode([
            'service_type' => 'Enterprise AI Training',
            'company_name' => 'Apex Dhaka Ltd',
            'contact_name' => 'Farhana Karim',
            'work_email'   => 'farhana@apexdhaka.example.com',
            'phone'        => '+8801711111111',
            'team_size'    => '50-100',
            'notes'        => 'Need custom cohort training.',
        ]));
        $corpRes = rest_do_request($corpReq);
        $this->assertSame(201, $corpRes->get_status());
        $ref = $corpRes->get_data()['reference_id'];
        $this->assertStringStartsWith('CORP-', $ref);

        $leadRow = $wpdb->get_row(
            $wpdb->prepare(
                'SELECT * FROM ' . TSMB_Lifecycle::get_leads_table() . ' WHERE reference_id = %s',
                $ref
            ),
            ARRAY_A
        );
        $this->assertIsArray($leadRow);
        $this->assertSame('Apex Dhaka Ltd', $leadRow['company_name']);

        // Support tickets strictly scoped to owner user_id in real MySQL
        $u1 = self::factory()->user->create(['role' => 'subscriber']);
        $u2 = self::factory()->user->create(['role' => 'subscriber']);

        wp_set_current_user($u1);
        $ticketReq = new WP_REST_Request('POST', '/thrivingskill/v1/support-tickets');
        $ticketReq->set_header('Content-Type', 'application/json');
        $ticketReq->set_body(wp_json_encode([
            'topic'   => 'billing',
            'subject' => 'Receipt PDF query',
            'message' => 'Please share invoice details for my order.',
        ]));
        $ticketRes = rest_do_request($ticketReq);
        $this->assertSame(201, $ticketRes->get_status());
        $ticketId = $ticketRes->get_data()['ticket']['ticket_id'];

        $listU1 = rest_do_request(new WP_REST_Request('GET', '/thrivingskill/v1/support-tickets'))->get_data();
        $this->assertCount(1, $listU1['tickets']);
        $this->assertSame($ticketId, $listU1['tickets'][0]['ticket_id']);

        wp_set_current_user($u2);
        $listU2 = rest_do_request(new WP_REST_Request('GET', '/thrivingskill/v1/support-tickets'))->get_data();
        $this->assertCount(0, $listU2['tickets']);
    }

    public function test_engagement_sync_persists_monotonic_watch_positions_in_real_usermeta(): void
    {
        $uid = self::factory()->user->create(['role' => 'subscriber']);
        wp_set_current_user($uid);

        // Device A syncs 1080 seconds (18 minutes)
        $reqA = new WP_REST_Request('POST', '/thrivingskill/v1/engagement-sync');
        $reqA->set_header('Content-Type', 'application/json');
        $reqA->set_body(wp_json_encode([
            'watch_positions' => ['88180' => ['88181' => 1080]],
            'gamification'    => [
                'streakDays'        => 3,
                'lastActiveDate'    => '2026-11-26',
                'dailyMinutesSpent' => 18,
                'totalStudyMinutes' => 18,
                'xp'                => 100,
                'updatedAt'         => 1000,
            ],
        ]));
        $resA = rest_do_request($reqA);
        $this->assertSame(200, $resA->get_status());
        $this->assertSame(1080, $resA->get_data()['watch_positions']['88180']['88181']);

        // Device B syncs stale 600 seconds (10 minutes) for the same lesson + 220s for another lesson
        $reqB = new WP_REST_Request('POST', '/thrivingskill/v1/engagement-sync');
        $reqB->set_header('Content-Type', 'application/json');
        $reqB->set_body(wp_json_encode([
            'watch_positions' => ['88180' => ['88181' => 600, '88182' => 220]],
        ]));
        $resB = rest_do_request($reqB);
        $this->assertSame(200, $resB->get_status());
        $this->assertSame(1080, $resB->get_data()['watch_positions']['88180']['88181']);
        $this->assertSame(220, $resB->get_data()['watch_positions']['88180']['88182']);

        // Verify /learning-state reads the retained monotonic position from real wp_usermeta
        $stateRes = rest_do_request(new WP_REST_Request('GET', '/thrivingskill/v1/learning-state'));
        $this->assertSame(200, $stateRes->get_status());
        $stateData = $stateRes->get_data();
        $this->assertSame(1080, $stateData['watch_positions']['88180']['88181']);
        $this->assertSame(220, $stateData['watch_positions']['88180']['88182']);
        $this->assertSame([], $stateData['enrolled_course_ids']);
    }
}
