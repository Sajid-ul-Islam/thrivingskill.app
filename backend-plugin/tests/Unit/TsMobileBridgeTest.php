<?php

use PHPUnit\Framework\TestCase;

final class TsMobileBridgeTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        TSMB_Test_State::reset();
        update_option('tsmb_sms_gateway_url', 'https://sms.example.test/send');
    }

    public function test_lesson_gate_blocks_unenrolled_non_preview_and_allows_free_preview(): void
    {
        TSMB_Test_State::$posts[501] = (object) ['ID' => 501, 'post_type' => 'lp_course', 'post_status' => 'publish'];
        TSMB_Test_State::$posts[601] = (object) ['ID' => 601, 'post_type' => 'lp_lesson', 'post_status' => 'publish'];
        TSMB_Test_State::$posts[602] = (object) ['ID' => 602, 'post_type' => 'lp_lesson', 'post_status' => 'publish'];
        TSMB_Test_State::$post_meta[601]['_lp_preview'] = 'yes';
        TSMB_Test_State::$post_meta[602]['_lp_preview'] = 'no';
        TSMB_Test_State::$lesson_courses[601] = [501];
        TSMB_Test_State::$lesson_courses[602] = [501];

        // Guest can access free preview lesson 601
        $guestPreview = TSMB_Rest_API::check_lesson_access(new WP_REST_Request([], ['id' => 601]));
        $this->assertTrue($guestPreview);

        // Guest blocked with 401 on paid lesson 602
        $guestLocked = TSMB_Rest_API::check_lesson_access(new WP_REST_Request([], ['id' => 602]));
        $this->assertInstanceOf(WP_Error::class, $guestLocked);
        $this->assertSame(401, $guestLocked->get_error_data()['status']);

        // Signed-in unenrolled user blocked with 403 on paid lesson 602
        $uid = wp_insert_user(['user_login' => 'learner1', 'user_email' => 'l1@example.com']);
        wp_set_current_user($uid);
        $unenrolledLocked = TSMB_Rest_API::check_lesson_access(new WP_REST_Request([], ['id' => 602]));
        $this->assertInstanceOf(WP_Error::class, $unenrolledLocked);
        $this->assertSame(403, $unenrolledLocked->get_error_data()['status']);

        // Enrolled learner gets access to lesson 602
        TSMB_Test_State::$enrolled_courses[$uid] = [501];
        $enrolledAllowed = TSMB_Rest_API::check_lesson_access(new WP_REST_Request([], ['id' => 602]));
        $this->assertTrue($enrolledAllowed);
    }

    public function test_paid_enrollment_allows_paid_orders_and_memoizes_per_request(): void
    {
        $uid = wp_insert_user(['user_login' => 'buyer1', 'user_email' => 'buyer@example.com']);
        TSMB_Test_State::$posts[701] = (object) ['ID' => 701, 'post_type' => 'lp_course', 'post_status' => 'publish'];
        TSMB_Test_State::$posts[702] = (object) ['ID' => 702, 'post_type' => 'lp_course', 'post_status' => 'publish'];
        TSMB_Test_State::$post_meta[701]['_lp_price'] = 1500;
        TSMB_Test_State::$post_meta[702]['_lp_price'] = 2000;

        TSMB_Test_State::$wc_orders[] = [
            'user_id'     => $uid,
            'status'      => 'completed',
            'product_ids' => [701],
        ];

        $this->assertTrue(TSMB_Rest_API::filter_learnpress_can_enroll_course(true, 701, $uid));
        // Supports reversed (can_enroll, $user_id, $course_id) argument order too
        $this->assertFalse(TSMB_Rest_API::filter_learnpress_can_enroll_course(true, $uid, 702));
        // Repeated checks in the same request reuse memoized per-user map
        $this->assertTrue(TSMB_Rest_API::filter_learnpress_can_enroll_course(true, 701, $uid));
        $this->assertSame(1, TSMB_Test_State::$lp_query_count);
        $this->assertSame(1, TSMB_Test_State::$wc_query_count);
    }

    public function test_registration_optional_phone_preserves_username_and_hides_existing_email(): void
    {
        $existingUid = wp_insert_user([
            'user_login' => 'existing_user',
            'user_email' => 'taken@example.com',
        ]);
        $this->assertGreaterThan(0, $existingUid);

        // Register WITHOUT phone number (optional) -> succeeds and keeps requested username
        $reqNew = new WP_REST_Request([
            'email'    => 'freshstudent@example.com',
            'username' => 'freshstudent',
            'password' => 'StrongPassword123!',
            'name'     => 'Fresh Student',
        ]);
        $resNew = TSMB_Rest_API::register_user($reqNew);
        $this->assertInstanceOf(WP_REST_Response::class, $resNew);
        $dataNew = $resNew->get_data();
        $this->assertSame('verification_required', $dataNew['status']);
        $this->assertSame('freshstudent', $dataNew['username']);
        $this->assertCount(1, TSMB_Test_State::$sent_emails);

        // Re-registering existing email returns identical verification_required status without mailing
        $reqExisting = new WP_REST_Request([
            'email'    => 'taken@example.com',
            'username' => 'takenuser',
            'password' => 'StrongPassword123!',
        ]);
        $resExisting = TSMB_Rest_API::register_user($reqExisting);
        $this->assertInstanceOf(WP_REST_Response::class, $resExisting);
        $this->assertSame('verification_required', $resExisting->get_data()['status']);
        $this->assertCount(1, TSMB_Test_State::$sent_emails);
    }

    public function test_shared_billing_phone_allowed_across_users_and_no_otp_class(): void
    {
        $this->assertFalse(class_exists('TSMB_OTP_Auth'));

        $userA = wp_insert_user(['user_login' => 'emailuser1', 'user_email' => 'emailuser1@example.com']);
        $userB = wp_insert_user(['user_login' => 'emailuser2', 'user_email' => 'emailuser2@example.com']);

        update_user_meta($userA, 'billing_phone', '01704999999');
        update_user_meta($userB, 'billing_phone', '01704999999');

        $this->assertSame('01704999999', get_user_meta($userA, 'billing_phone', true));
        $this->assertSame('01704999999', get_user_meta($userB, 'billing_phone', true));
    }

    public function test_session_scoped_revoke_keeps_other_devices_signed_in(): void
    {
        $uid = wp_insert_user(['user_login' => 'multiuser', 'user_email' => 'multi@example.com']);
        $tokenA = TSMB_Security::issue_bearer_token($uid);
        $tokenB = TSMB_Security::issue_bearer_token($uid);

        // Phone A authenticates and revokes only its own session
        $_SERVER['HTTP_AUTHORIZATION'] = 'Bearer ' . $tokenA;
        $this->assertSame($uid, TSMB_Security::determine_current_user(0));
        wp_set_current_user($uid);

        $revokeRes = TSMB_Rest_API::revoke_token(new WP_REST_Request([]));
        $this->assertInstanceOf(WP_REST_Response::class, $revokeRes);
        $this->assertSame('current_session', $revokeRes->get_data()['scope']);

        // Phone A is now rejected
        TSMB_Security::reset_request_context();
        $_SERVER['HTTP_AUTHORIZATION'] = 'Bearer ' . $tokenA;
        $this->assertSame(0, TSMB_Security::determine_current_user(0));

        // Phone B remains valid
        TSMB_Security::reset_request_context();
        $_SERVER['HTTP_AUTHORIZATION'] = 'Bearer ' . $tokenB;
        $this->assertSame($uid, TSMB_Security::determine_current_user(0));

        // External / LearnPress JWT passed via REDIRECT_HTTP_AUTHORIZATION is also blocklisted at REST auth layer
        TSMB_Security::reset_request_context();
        $lpHeader  = rtrim(strtr(base64_encode('{"alg":"HS256","typ":"JWT"}'), '+/', '-_'), '=');
        $lpPayload = rtrim(
            strtr(
                base64_encode(json_encode([
                    'iss'  => home_url('/'),
                    'iat'  => time() - 10,
                    'exp'  => time() + 3600,
                    'data' => ['user' => ['id' => (string) $uid]],
                ])),
                '+/',
                '-_'
            ),
            '='
        );
        $lpJwt = $lpHeader . '.' . $lpPayload . '.lp_sig';
        unset($_SERVER['HTTP_AUTHORIZATION']);
        $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] = 'Bearer ' . $lpJwt;
        wp_set_current_user($uid);

        $lpRevokeRes = TSMB_Rest_API::revoke_token(new WP_REST_Request([]));
        $this->assertInstanceOf(WP_REST_Response::class, $lpRevokeRes);
        $this->assertTrue($lpRevokeRes->get_data()['revoked']);

        $this->assertSame(0, TSMB_Security::enforce_revoked_token($uid));
        $restErr = TSMB_Security::reject_revoked_rest_token(true);
        $this->assertInstanceOf(WP_Error::class, $restErr);
        $this->assertSame(401, $restErr->get_error_data()['status']);
    }

    public function test_webview_handoff_is_single_use_and_sets_auth_cookie(): void
    {
        $uid = wp_insert_user(['user_login' => 'checkoutbuyer', 'user_email' => 'cb@example.com']);
        wp_set_current_user($uid);

        $handoffRes = TSMB_Rest_API::create_webview_handoff(new WP_REST_Request([
            'course_id'   => 991,
            'redirect_to' => '/checkout/?add-to-cart=991',
        ]));
        $this->assertInstanceOf(WP_REST_Response::class, $handoffRes);
        $loginUrl = (string) $handoffRes->get_data()['login_url'];
        parse_str((string) parse_url($loginUrl, PHP_URL_QUERY), $qs);
        $this->assertNotEmpty($qs['tsmb_handoff'] ?? '');

        // First request succeeds and sets cookie + redirects to checkout
        $_GET['tsmb_handoff'] = $qs['tsmb_handoff'];
        TSMB_Security::handle_webview_handoff();
        $this->assertCount(1, TSMB_Test_State::$auth_cookies);
        $this->assertSame($uid, TSMB_Test_State::$auth_cookies[0]['uid']);
        $this->assertSame('https://thrivingskill.com/checkout/?add-to-cart=991', TSMB_Test_State::$redirects[0]['location']);

        // Replay of the exact same handoff code must NOT log in again
        TSMB_Test_State::$auth_cookies = [];
        TSMB_Test_State::$redirects    = [];
        TSMB_Security::handle_webview_handoff();
        $this->assertCount(0, TSMB_Test_State::$auth_cookies);
        $this->assertSame('https://thrivingskill.com/', TSMB_Test_State::$redirects[0]['location']);
    }

    public function test_proxy_ip_single_header_and_sanitized_hero_slides(): void
    {
        // With trust enabled + Cloudflare header selected, leftmost X-Forwarded-For is ignored
        update_option('tsmb_trust_proxy_headers', '1');
        update_option('tsmb_trusted_proxy_header', 'HTTP_CF_CONNECTING_IP');
        update_option('tsmb_trusted_proxy_ips', '10.0.0.5');
        $_SERVER['REMOTE_ADDR']          = '10.0.0.5';
        $_SERVER['HTTP_X_FORWARDED_FOR'] = '1.2.3.4, 5.6.7.8';
        $_SERVER['HTTP_CF_CONNECTING_IP'] = '203.0.113.42';
        $this->assertSame('203.0.113.42', TSMB_Security::get_client_ip());

        // Untrusted origin direct hit falls back to REMOTE_ADDR
        $_SERVER['REMOTE_ADDR'] = '198.51.100.77';
        $this->assertSame('198.51.100.77', TSMB_Security::get_client_ip());

        // Hero slide sanitization strips javascript: target & invalid URLs
        $cleaned = TSMB_Admin::sanitize_hero_slides([
            [
                'id'          => 'Slide 1!',
                'title'       => '<b>Welcome</b> Leader',
                'image_url'   => 'javascript:alert(1)',
                'target'      => 'javascript:evil()',
                'button_text' => 'Explore',
            ],
            [
                'id'        => 's2',
                'title'     => 'AI Course',
                'image_url' => 'https://thrivingskill.com/banner.jpg',
                'target'    => 'https://thrivingskill.com/courses/ai',
            ],
        ]);
        $this->assertCount(2, $cleaned);
        $this->assertSame('Welcome Leader', $cleaned[0]['title']);
        $this->assertSame('', $cleaned[0]['image_url']);
        $this->assertSame('', $cleaned[0]['target']);
        $this->assertSame('https://thrivingskill.com/banner.jpg', $cleaned[1]['image_url']);
    }

    public function test_review_submission_enforces_completion_persists_comment_and_issues_verifiable_certificate(): void
    {
        $uid = wp_insert_user([
            'user_login'   => 'gradstudent',
            'user_email'   => 'grad@example.com',
            'display_name' => 'Sadia Rahman',
        ]);
        TSMB_Test_State::$posts[901] = (object) [
            'ID'          => 901,
            'post_type'   => 'lp_course',
            'post_status' => 'publish',
            'post_title'  => 'Executive AI Mastery',
            'post_author' => 1,
        ];
        TSMB_Test_State::$posts[990] = (object) [
            'ID'          => 990,
            'post_type'   => 'lp_cert',
            'post_status' => 'publish',
            'post_title'  => 'AI Cert Template',
        ];
        TSMB_Test_State::$post_meta[901]['_lp_cert'] = 990;
        TSMB_Test_State::$course_curriculum[901] = [1001, 1002];

        wp_set_current_user($uid);

        // 1. Unenrolled learner is blocked (403 not_enrolled)
        $req = new WP_REST_Request([
            'rate'    => 5,
            'title'   => 'Great course',
            'content' => 'Learned practical workflows.',
        ], ['id' => 901]);
        $unenrolledRes = TSMB_Rest_API::submit_course_review($req);
        $this->assertInstanceOf(WP_Error::class, $unenrolledRes);
        $this->assertSame('not_enrolled', $unenrolledRes->get_error_code());
        $this->assertCount(0, TSMB_Test_State::$comments);

        // 2. Enrolled with only 1/2 lessons completed is blocked (403 course_not_completed)
        TSMB_Test_State::$enrolled_courses[$uid] = [901];
        TSMB_Test_State::$completed_lessons[$uid][901] = [1001];
        $incompleteRes = TSMB_Rest_API::submit_course_review($req);
        $this->assertInstanceOf(WP_Error::class, $incompleteRes);
        $this->assertSame('course_not_completed', $incompleteRes->get_error_code());
        $this->assertCount(0, TSMB_Test_State::$comments);

        // 3. Once 2/2 lessons are finished on server, submit_course_review saves review & issues LP cert
        TSMB_Test_State::$completed_lessons[$uid][901] = [1001, 1002];
        TSMB_Test_State::$course_item_state[$uid][901] = [
            'user_item_id' => 77,
            'item_id'      => 901,
            'status'       => 'finished',
            'graduation'   => 'passed',
            'start_time'   => '2026-11-20 10:00:00',
            'end_time'     => '2026-11-26 12:00:00',
        ];

        $okRes = TSMB_Rest_API::submit_course_review($req);
        $this->assertInstanceOf(WP_REST_Response::class, $okRes);
        $data = $okRes->get_data();
        $this->assertTrue($data['course_completed']);
        $this->assertTrue($data['has_reviewed']);
        $this->assertCount(1, TSMB_Test_State::$comments);

        $expectedKey = md5($uid . ':901:990');
        $this->assertSame($expectedKey, $data['certificate']['credentialId']);
        $this->assertSame(
            'https://thrivingskill.com/certificates/' . $expectedKey . '/',
            $data['certificate']['verificationUrl']
        );

        // 4. Cross-device learning state sync and public verification both confirm certificate
        $stateRes = TSMB_Rest_API::get_learning_state(new WP_REST_Request([]));
        $this->assertInstanceOf(WP_REST_Response::class, $stateRes);
        $state = $stateRes->get_data();
        $this->assertContains('901', $state['reviewed_course_ids']);
        $this->assertCount(1, $state['certificates']);
        $this->assertSame($expectedKey, $state['certificates'][0]['credentialId']);
        $this->assertTrue($state['progress']['901']['isCompleted']);

        $verifyRes = TSMB_Rest_API::verify_certificate(new WP_REST_Request([], ['code' => $expectedKey]));
        $this->assertInstanceOf(WP_REST_Response::class, $verifyRes);
        $this->assertTrue($verifyRes->get_data()['valid']);
    }

    public function test_lesson_detail_extracts_trimmed_meta_and_post_content_videos(): void
    {
        TSMB_Test_State::$posts[950] = (object) [
            'ID'           => 950,
            'post_type'    => 'lp_lesson',
            'post_status'  => 'publish',
            'post_title'   => 'Vimeo With Spaces',
            'post_content' => 'Watch this lesson.',
            'post_excerpt' => 'Summary',
        ];
        TSMB_Test_State::$post_meta[950]['_lp_preview'] = 'yes';
        TSMB_Test_State::$post_meta[950]['_lp_lesson_video_intro'] = "  https://player.vimeo.com/video/1228513027?h=abc123  \n";

        $res1 = TSMB_Rest_API::get_lesson_detail(new WP_REST_Request([], ['id' => 950]));
        $this->assertInstanceOf(WP_REST_Response::class, $res1);
        $d1 = $res1->get_data();
        $this->assertSame('vimeo', $d1['video_type']);
        $this->assertSame('1228513027', $d1['video_id']);
        $this->assertSame('https://player.vimeo.com/video/1228513027?h=abc123', $d1['video_url']);

        TSMB_Test_State::$posts[951] = (object) [
            'ID'           => 951,
            'post_type'    => 'lp_lesson',
            'post_status'  => 'publish',
            'post_title'   => 'Content Embedded Lesson',
            'post_content' => '<p>Intro</p><iframe src="//player.vimeo.com/video/987654321"></iframe>',
            'post_excerpt' => '',
        ];
        TSMB_Test_State::$post_meta[951]['_lp_preview'] = 'yes';

        $res2 = TSMB_Rest_API::get_lesson_detail(new WP_REST_Request([], ['id' => 951]));
        $this->assertInstanceOf(WP_REST_Response::class, $res2);
        $d2 = $res2->get_data();
        $this->assertSame('vimeo', $d2['video_type']);
        $this->assertSame('987654321', $d2['video_id']);
        $this->assertSame('https://player.vimeo.com/video/987654321', $d2['video_url']);
    }

    public function test_corporate_inquiry_validates_inputs_and_persists_lead_receipt(): void
    {
        $badReq = new WP_REST_Request([
            'service_type' => 'Corporate Training',
            'company_name' => 'A',
            'contact_name' => 'Tariq',
            'work_email'   => 'not-an-email',
        ]);
        $badRes = TSMB_Rest_API::submit_corporate_inquiry($badReq);
        $this->assertInstanceOf(WP_Error::class, $badRes);

        $okReq = new WP_REST_Request([
            'service_type' => 'Team Training Access',
            'company_name' => 'Apex Enterprise Ltd',
            'contact_name' => 'Nadia Hasan',
            'work_email'   => 'nadia@apex.example.com',
            'phone'        => '+8801711000000',
            'team_size'    => '20-50',
            'notes'        => 'Need AI workshop seats for Q1.',
        ]);
        $okRes = TSMB_Rest_API::submit_corporate_inquiry($okReq);
        $this->assertInstanceOf(WP_REST_Response::class, $okRes);
        $this->assertSame(201, $okRes->get_status());
        $data = $okRes->get_data();
        $this->assertSame('success', $data['status']);
        $this->assertStringStartsWith('CORP-', $data['reference_id']);

        $rows = TSMB_Test_State::$tables['wp_tsmb_corporate_inquiries'] ?? [];
        $this->assertCount(1, $rows);
        $this->assertSame('Apex Enterprise Ltd', $rows[0]['company_name']);
        $this->assertNotEmpty(TSMB_Test_State::$sent_emails);
    }

    public function test_support_tickets_require_auth_and_are_strictly_scoped_per_user(): void
    {
        $u1 = wp_insert_user(['user_login' => 'learner1', 'user_email' => 'l1@example.com']);
        $u2 = wp_insert_user(['user_login' => 'learner2', 'user_email' => 'l2@example.com']);

        wp_set_current_user($u1);
        $createRes = TSMB_Rest_API::create_support_ticket(new WP_REST_Request([
            'topic'   => 'certificate',
            'subject' => 'Certificate name check',
            'message' => 'Please verify the spelling on my AI course certificate.',
            'course_id' => 901,
        ]));
        $this->assertInstanceOf(WP_REST_Response::class, $createRes);
        $this->assertSame(201, $createRes->get_status());
        $ticket = $createRes->get_data()['ticket'];
        $this->assertStringStartsWith('TS-', $ticket['ticket_id']);
        $this->assertSame('open', $ticket['status']);

        $listU1 = TSMB_Rest_API::get_support_tickets(new WP_REST_Request([]))->get_data();
        $this->assertCount(1, $listU1['tickets']);
        $this->assertSame('Certificate name check', $listU1['tickets'][0]['subject']);

        // Second user cannot see User 1's support tickets
        wp_set_current_user($u2);
        $listU2 = TSMB_Rest_API::get_support_tickets(new WP_REST_Request([]))->get_data();
        $this->assertCount(0, $listU2['tickets']);
    }

    public function test_engagement_sync_merges_streaks_monotonically_and_isolates_watch_positions(): void
    {
        $uid = wp_insert_user(['user_login' => 'syncuser', 'user_email' => 'sync@example.com']);
        wp_set_current_user($uid);

        // Device A syncs 120 XP, 20 total minutes, streak 4, plus preview watch position
        $res1 = TSMB_Rest_API::sync_engagement_state(new WP_REST_Request([
            'watch_positions' => ['88180' => ['88181' => 145]],
            'gamification'    => [
                'streakDays'        => 4,
                'lastActiveDate'    => '2026-11-26',
                'dailyMinutesSpent' => 20,
                'totalStudyMinutes' => 20,
                'dailyHistory'      => ['2026-11-26' => 20],
                'xp'                => 120,
                'unlockedBadges'    => [['id' => 'first_step', 'unlockedAt' => '2026-11-25']],
                'updatedAt'         => 2000,
            ],
        ]));
        $this->assertInstanceOf(WP_REST_Response::class, $res1);

        // Fresh Device B sends lower totals (xp 50, streak 1) with an older date -> monotonic merge keeps higher totals
        $res2 = TSMB_Rest_API::sync_engagement_state(new WP_REST_Request([
            'gamification' => [
                'streakDays'        => 1,
                'lastActiveDate'    => '2026-11-24',
                'dailyMinutesSpent' => 10,
                'totalStudyMinutes' => 10,
                'dailyHistory'      => ['2026-11-24' => 10],
                'xp'                => 50,
                'unlockedBadges'    => [['id' => 'streak_champ', 'unlockedAt' => '2026-11-26']],
                'updatedAt'         => 3000,
            ],
        ]));
        $d2 = $res2->get_data();
        $this->assertSame(120, $d2['gamification']['xp']);
        $this->assertSame(20, $d2['gamification']['totalStudyMinutes']);
        $this->assertSame(4, $d2['gamification']['streakDays']);
        $this->assertSame(20, $d2['gamification']['dailyHistory']['2026-11-26']);
        $this->assertSame(10, $d2['gamification']['dailyHistory']['2026-11-24']);
        $this->assertCount(2, $d2['gamification']['unlockedBadges']);

        // Learning state includes watch_positions + gamification without fabricating paid course enrollment
        $state = TSMB_Rest_API::get_learning_state(new WP_REST_Request([]))->get_data();
        $this->assertSame([], $state['enrolled_course_ids']);
        $this->assertSame(145, $state['watch_positions']['88180']['88181']);
        $this->assertSame(120, $state['gamification']['xp']);
    }

    public function test_engagement_sync_retains_newer_watch_position_when_older_device_syncs_later(): void
    {
        $uid = wp_insert_user(['user_login' => 'watchsync', 'user_email' => 'watchsync@example.com']);
        wp_set_current_user($uid);

        // Device A records 18 minutes (1080 seconds)
        $resA = TSMB_Rest_API::sync_engagement_state(new WP_REST_Request([
            'watch_positions' => ['88180' => ['88181' => 1080]],
        ]));
        $this->assertInstanceOf(WP_REST_Response::class, $resA);
        $this->assertSame(1080, $resA->get_data()['watch_positions']['88180']['88181']);

        // Device B still has older 10 minutes (600 seconds) for lesson 88181, plus progress on lesson 88182
        $resB = TSMB_Rest_API::sync_engagement_state(new WP_REST_Request([
            'watch_positions' => ['88180' => ['88181' => 600, '88182' => 310]],
        ]));
        $this->assertInstanceOf(WP_REST_Response::class, $resB);
        $dataB = $resB->get_data();
        $this->assertSame(1080, $dataB['watch_positions']['88180']['88181']);
        $this->assertSame(310, $dataB['watch_positions']['88180']['88182']);

        // Negative/invalid positions cannot regress stored watch positions either
        $resNeg = TSMB_Rest_API::sync_engagement_state(new WP_REST_Request([
            'watch_positions' => ['88180' => ['88181' => -25]],
        ]));
        $this->assertSame(1080, $resNeg->get_data()['watch_positions']['88180']['88181']);

        // Subsequent learning-state fetch continues returning the newer 1080s position
        $state = TSMB_Rest_API::get_learning_state(new WP_REST_Request([]))->get_data();
        $this->assertSame(1080, $state['watch_positions']['88180']['88181']);
        $this->assertSame(310, $state['watch_positions']['88180']['88182']);
    }

    public function test_get_config_exposes_plugin_version(): void
    {
        $res = TSMB_Rest_API::get_config();
        $this->assertInstanceOf(WP_REST_Response::class, $res);
        $data = $res->get_data();
        $this->assertSame(TSMB_VERSION, $data['plugin_version']);
    }

    public function test_admin_analytics_access_control_validation_and_transient_caching(): void
    {
        // 1. Unauthenticated caller gets 401
        $guestErr = TSMB_Analytics_Rest::check_admin_access();
        $this->assertInstanceOf(WP_Error::class, $guestErr);
        $this->assertSame(401, $guestErr->get_error_data()['status']);

        // 2. Non-admin subscriber gets 403
        $studentId = wp_insert_user(['user_login' => 'student_an', 'user_email' => 'san@example.com', 'role' => 'subscriber']);
        wp_set_current_user($studentId);
        $subErr = TSMB_Analytics_Rest::check_admin_access();
        $this->assertInstanceOf(WP_Error::class, $subErr);
        $this->assertSame(403, $subErr->get_error_data()['status']);

        // 3. Administrator allowed (true) & filter validation rejects invalid presets / date ranges
        $adminId = wp_insert_user(['user_login' => 'admin_an', 'user_email' => 'aan@example.com', 'role' => 'administrator']);
        wp_set_current_user($adminId);
        $this->assertTrue(TSMB_Analytics_Rest::check_admin_access());

        $badPreset = TSMB_Analytics_Rest::get_dashboard(new WP_REST_Request([], ['preset' => 'bogus']));
        $this->assertInstanceOf(WP_Error::class, $badPreset);
        $this->assertSame(400, $badPreset->get_error_data()['status']);

        $badRange = TSMB_Analytics_Rest::get_dashboard(new WP_REST_Request([], [
            'preset'     => 'custom',
            'start_date' => '2026-11-10',
            'end_date'   => '2026-11-01',
        ]));
        $this->assertInstanceOf(WP_Error::class, $badRange);
        $this->assertSame(400, $badRange->get_error_data()['status']);

        // 4. First dashboard call computes live and caches in transient; second call hits cache
        $res1 = TSMB_Analytics_Rest::get_dashboard(new WP_REST_Request([], ['preset' => 'all']));
        $this->assertInstanceOf(WP_REST_Response::class, $res1);
        $d1 = $res1->get_data();
        $this->assertFalse($d1['meta']['cache_hit']);
        $this->assertFalse($d1['meta']['schema_modified']);
        $this->assertSame('wordpress_transient', $d1['meta']['cache_backend']);
        $this->assertSame('no-store, no-cache, must-revalidate, max-age=0', $res1->get_headers()['Cache-Control']);

        $res2 = TSMB_Analytics_Rest::get_dashboard(new WP_REST_Request([], ['preset' => 'all']));
        $this->assertTrue($res2->get_data()['meta']['cache_hit']);

        // 5. Invalidation forces fresh live recompute
        TSMB_Analytics_Service::invalidate_cache();
        $res3 = TSMB_Analytics_Rest::get_dashboard(new WP_REST_Request([], ['preset' => 'all']));
        $this->assertFalse($res3->get_data()['meta']['cache_hit']);
    }

    public function test_admin_analytics_deduplicates_woo_lp_orders_and_excludes_free_pending_manual(): void
    {
        $adminId   = wp_insert_user(['user_login' => 'admin2', 'user_email' => 'a2@example.com', 'role' => 'administrator']);
        $buyerId   = wp_insert_user(['user_login' => 'buyer2', 'user_email' => 'b2@example.com', 'role' => 'customer']);
        $freeStuId = wp_insert_user(['user_login' => 'freestu', 'user_email' => 'fs@example.com', 'role' => 'customer']);
        wp_set_current_user($adminId);

        // Paid course #501 (৳500) + Free course #502 (৳0)
        TSMB_Test_State::$posts[501] = (object) ['ID' => 501, 'post_type' => 'lp_course', 'post_status' => 'publish', 'post_title' => 'Paid Course'];
        TSMB_Test_State::$posts[502] = (object) ['ID' => 502, 'post_type' => 'lp_course', 'post_status' => 'publish', 'post_title' => 'Free Course'];
        TSMB_Test_State::$post_meta[501]['_lp_price'] = '500';
        TSMB_Test_State::$post_meta[502]['_lp_price'] = '0';

        // Completed paid WooCommerce order #801 (৳500 gross, ৳100 partial refund -> ৳400 net) linked to LP order #802
        TSMB_Test_State::$posts[801] = (object) ['ID' => 801, 'post_type' => 'shop_order', 'post_status' => 'wc-completed', 'post_date_gmt' => gmdate('Y-m-d H:i:s')];
        TSMB_Test_State::$post_meta[801] = [
            '_order_total'          => '500',
            '_order_currency'       => 'BDT',
            '_customer_user'        => (string) $buyerId,
            '_payment_method'       => 'sslcommerz',
            '_payment_method_title' => 'SSLCommerz',
            '_date_paid'            => (string) time(),
            '_learn_press_order_id' => '802',
        ];
        TSMB_Test_State::$posts[809] = (object) ['ID' => 809, 'post_type' => 'shop_order_refund', 'post_parent' => 801, 'post_status' => 'wc-completed'];
        TSMB_Test_State::$post_meta[809]['_refund_amount'] = '100';
        TSMB_Test_State::$wc_order_items[] = ['order_item_id' => 1, 'order_id' => 801, 'name' => 'Paid Course', 'product_id' => 501, 'course_id' => 501, 'qty' => 1, 'line_total' => '500'];

        // Woo-linked LP order #802 -> must be deduplicated, NOT double-counted
        TSMB_Test_State::$posts[802] = (object) ['ID' => 802, 'post_type' => 'lp_order', 'post_status' => 'lp-completed', 'post_date_gmt' => gmdate('Y-m-d H:i:s')];
        TSMB_Test_State::$post_meta[802] = ['_order_total' => '500', '_woo_order_id' => '801', '_payment_method' => 'sslcommerz', '_user_id' => (string) $buyerId];

        // Pending WC order #803 (৳750) -> excluded from revenue, counted as pending
        TSMB_Test_State::$posts[803] = (object) ['ID' => 803, 'post_type' => 'shop_order', 'post_status' => 'wc-pending', 'post_date_gmt' => gmdate('Y-m-d H:i:s')];
        TSMB_Test_State::$post_meta[803] = ['_order_total' => '750', '_order_currency' => 'BDT', '_customer_user' => (string) $buyerId, '_payment_method' => 'sslcommerz'];

        // Free ৳0 WC order #804 + free course enrollment -> never counted as paid purchase
        TSMB_Test_State::$posts[804] = (object) ['ID' => 804, 'post_type' => 'shop_order', 'post_status' => 'wc-completed', 'post_date_gmt' => gmdate('Y-m-d H:i:s')];
        TSMB_Test_State::$post_meta[804] = ['_order_total' => '0', '_order_currency' => 'BDT', '_customer_user' => (string) $freeStuId, '_payment_method' => 'free'];

        // Gateway-less manual LP order #805 (৳500) -> excluded from confirmed revenue & surfaced in reconciliation
        TSMB_Test_State::$posts[805] = (object) ['ID' => 805, 'post_type' => 'lp_order', 'post_status' => 'lp-completed', 'post_date_gmt' => gmdate('Y-m-d H:i:s')];
        TSMB_Test_State::$post_meta[805] = ['_order_total' => '500', '_woo_order_id' => '', '_payment_method' => '', '_user_id' => (string) $adminId];

        // Enrollments: buyer completed Paid Course #501; freeStu enrolled (in-progress) in Free Course #502
        TSMB_Test_State::$lp_section_items = [
            ['course_id' => 501, 'item_type' => 'lp_lesson', 'item_count' => 2],
            ['course_id' => 502, 'item_type' => 'lp_lesson', 'item_count' => 2],
        ];
        TSMB_Test_State::$lp_user_items = [
            ['user_item_id' => 1, 'user_id' => $buyerId, 'item_id' => 501, 'item_type' => 'lp_course', 'status' => 'finished', 'graduation' => 'passed', 'start_time' => gmdate('Y-m-d H:i:s'), 'end_time' => gmdate('Y-m-d H:i:s')],
            ['user_item_id' => 2, 'user_id' => $freeStuId, 'item_id' => 502, 'item_type' => 'lp_course', 'status' => 'enrolled', 'graduation' => 'in-progress', 'start_time' => gmdate('Y-m-d H:i:s'), 'end_time' => ''],
        ];

        $data = TSMB_Analytics_Service::get_dashboard_data(['preset' => 'all', 'refresh' => true]);
        $this->assertIsArray($data);
        $this->assertSame(400.0, $data['overview']['confirmed_revenue']);
        $this->assertSame(1, $data['overview']['confirmed_paid_orders']);
        $this->assertSame(400.0, $data['overview']['average_order_value']);
        $this->assertSame(1, $data['overview']['pending_orders_count']);
        $this->assertSame(750.0, $data['overview']['pending_orders_amount']);
        $this->assertSame(2, $data['enrollments']['active_snapshot_total']);
        $this->assertSame(1, $data['enrollments']['free_enrollments_all_time']);
        $this->assertSame(1, $data['enrollments']['completed_snapshot_total']);
        $this->assertSame(50.0, $data['enrollments']['completion_rate_percent']);
        $this->assertSame(1, $data['revenue']['free_zero_wc_orders']);
        $this->assertSame(1, $data['revenue']['reconciliation']['woo_linked_lp_orders_deduped']);
        $this->assertSame(1, $data['revenue']['reconciliation']['unverified_or_manual_lp_orders']);
        $this->assertSame(500.0, $data['revenue']['reconciliation']['unverified_or_manual_lp_total']);

        // Course #502 (free) has 0 paid orders and 0 confirmed revenue; Paid course #501 has 1 order & 400 revenue
        $coursesById = [];
        foreach ($data['course_performance'] as $cp) {
            $coursesById[$cp['course_id']] = $cp;
        }
        $this->assertSame(0, $coursesById[502]['paid_orders_count']);
        $this->assertSame(0.0, $coursesById[502]['confirmed_revenue']);
        $this->assertSame(1, $coursesById[501]['paid_orders_count']);
        $this->assertSame(400.0, $coursesById[501]['confirmed_revenue']);

        // Unsupported metrics explicitly documented without fabrication
        $unsupportedKeys = array_column($data['unsupported_metrics'], 'key');
        $this->assertContains('platform_dau_wau_mau', $unsupportedKeys);
        $this->assertContains('course_view_to_checkout_ctr', $unsupportedKeys);
    }

    public function test_zero_quiz_course_repairs_stale_failed_graduation_while_preserving_real_quiz_failures(): void
    {
        $uid = wp_insert_user([
            'user_login'   => 'mindset_grad',
            'user_email'   => 'mindset@example.com',
            'display_name' => 'Mindset Graduate',
        ]);
        TSMB_Test_State::$posts[902] = (object) [
            'ID'          => 902,
            'post_type'   => 'lp_course',
            'post_status' => 'publish',
            'post_title'  => 'Creating Winning Mindset QA',
            'post_author' => 1,
        ];
        TSMB_Test_State::$posts[991] = (object) [
            'ID'          => 991,
            'post_type'   => 'lp_cert',
            'post_status' => 'publish',
            'post_title'  => 'Mindset Cert Template',
        ];
        TSMB_Test_State::$post_meta[902] = [
            '_lp_cert'              => 991,
            '_lp_course_result'     => 'evaluate_quiz',
            '_lp_passing_condition' => 70,
        ];
        TSMB_Test_State::$enrolled_courses[$uid] = [902];
        TSMB_Test_State::$course_curriculum[902] = [1101, 1102];
        TSMB_Test_State::$course_item_state[$uid][902] = [
            'user_item_id' => 88,
            'item_id'      => 902,
            'status'       => 'finished',
            'graduation'   => 'failed',
            'start_time'   => '2026-11-27 04:31:48',
            'end_time'     => '2026-11-27 16:35:43',
        ];

        wp_set_current_user($uid);

        // Partial progress (1/2) on a finished/failed row must NOT auto-pass
        TSMB_Test_State::$completed_lessons[$uid][902] = [1101];
        $req = new WP_REST_Request([
            'rate'    => 5,
            'title'   => 'Review',
            'content' => 'Great lessons.',
        ], ['id' => 902]);
        $partialErr = TSMB_Rest_API::submit_course_review($req);
        $this->assertInstanceOf(WP_Error::class, $partialErr);
        $this->assertSame('course_not_completed', $partialErr->get_error_code());

        // Once 2/2 lessons complete on a zero-quiz course, stale graduation='failed' repairs -> 'passed'
        TSMB_Test_State::$completed_lessons[$uid][902] = [1101, 1102];
        $okRes = TSMB_Rest_API::submit_course_review($req);
        $this->assertInstanceOf(WP_REST_Response::class, $okRes);
        $data = $okRes->get_data();
        $this->assertTrue($data['course_completed']);
        $this->assertSame(md5($uid . ':902:991'), $data['certificate']['credentialId']);

        $state = TSMB_Rest_API::get_learning_state(new WP_REST_Request([]))->get_data();
        $this->assertTrue($state['progress']['902']['isCompleted']);
        $this->assertSame('passed', $state['progress']['902']['grade']);
    }
}
