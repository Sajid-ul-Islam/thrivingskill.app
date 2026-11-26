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
}
