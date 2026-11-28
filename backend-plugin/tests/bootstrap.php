<?php

/**
 * Isolated unit-test bootstrap with deterministic WordPress/LearnPress/WooCommerce stubs.
 *
 * For live WordPress + MySQL + LearnPress + WooCommerce integration tests, use
 * `tests/bootstrap-integration.php` via `phpunit.integration.xml.dist`.
 */

if (!defined('ABSPATH')) {
    define('ABSPATH', dirname(__DIR__) . '/');
}
if (!defined('TSMB_TESTING')) {
    define('TSMB_TESTING', true);
}
if (!defined('TSMB_DISABLE_TIMING_SLEEP')) {
    define('TSMB_DISABLE_TIMING_SLEEP', true);
}
if (!defined('MINUTE_IN_SECONDS')) {
    define('MINUTE_IN_SECONDS', 60);
}
if (!defined('HOUR_IN_SECONDS')) {
    define('HOUR_IN_SECONDS', 3600);
}
if (!defined('DAY_IN_SECONDS')) {
    define('DAY_IN_SECONDS', 86400);
}
if (!defined('ARRAY_A')) {
    define('ARRAY_A', 'ARRAY_A');
}
if (!defined('OBJECT')) {
    define('OBJECT', 'OBJECT');
}

class WP_Error
{
    private $code;
    private $message;
    private $data;

    public function __construct($code = '', $message = '', $data = [])
    {
        $this->code    = $code;
        $this->message = $message;
        $this->data    = $data;
    }

    public function get_error_code()
    {
        return $this->code;
    }

    public function get_error_message()
    {
        return $this->message;
    }

    public function get_error_data()
    {
        return $this->data;
    }
}

class WP_User
{
    public $ID = 0;
    public $user_login = '';
    public $user_pass = '';
    public $user_email = '';
    public $user_nicename = '';
    public $display_name = '';
    public $user_registered = '';
    public $roles = [];

    public function __construct($id = 0)
    {
        $this->ID = intval($id);
    }

    public function set_role($role)
    {
        $this->roles = [$role];
    }
}

class WP_REST_Response
{
    private $data;
    private $status;
    private $headers = [];

    public function __construct($data = null, int $status = 200)
    {
        $this->data   = $data;
        $this->status = $status;
    }

    public function get_data()
    {
        return $this->data;
    }

    public function set_data($data): void
    {
        $this->data = $data;
    }

    public function get_status(): int
    {
        return $this->status;
    }

    public function header(string $key, string $value, bool $replace = true): void
    {
        $this->headers[$key] = $value;
    }

    public function get_headers(): array
    {
        return $this->headers;
    }
}

class WP_REST_Request implements ArrayAccess
{
    private $params = [];
    private $json_params = [];

    public function __construct(array $json_params = [], array $params = [])
    {
        $this->json_params = $json_params;
        $this->params      = $params;
    }

    public function get_json_params()
    {
        return $this->json_params;
    }

    public function get_param($key)
    {
        return $this->params[$key] ?? ($this->json_params[$key] ?? null);
    }

    public function set_param($key, $value): void
    {
        $this->params[$key] = $value;
    }

    #[\ReturnTypeWillChange]
    public function offsetExists($offset): bool
    {
        return isset($this->params[$offset]) || isset($this->json_params[$offset]);
    }

    #[\ReturnTypeWillChange]
    public function offsetGet($offset)
    {
        return $this->get_param($offset);
    }

    #[\ReturnTypeWillChange]
    public function offsetSet($offset, $value): void
    {
        $this->params[$offset] = $value;
    }

    #[\ReturnTypeWillChange]
    public function offsetUnset($offset): void
    {
        unset($this->params[$offset]);
    }
}

final class TSMB_Test_State
{
    public static array $options = [];
    public static array $transients = [];
    public static array $users = [];
    public static array $user_meta = [];
    public static array $posts = [];
    public static array $post_meta = [];
    public static array $lesson_courses = [];
    public static array $course_curriculum = [];
    public static array $course_item_state = [];
    public static array $completed_lessons = [];
    public static array $comments = [];
    public static array $comment_meta = [];
    public static int $next_comment_id = 500;
    public static array $enrolled_courses = [];
    public static array $lp_orders = [];
    public static array $wc_orders = [];
    public static array $wc_order_items = [];
    public static array $lp_order_items = [];
    public static array $lp_user_items = [];
    public static array $lp_section_items = [];
    public static array $tables = [];
    public static array $sent_emails = [];
    public static array $sent_sms = [];
    public static array $auth_cookies = [];
    public static array $redirects = [];
    public static int $current_user_id = 0;
    public static int $next_user_id = 100;
    public static int $lp_query_count = 0;
    public static int $wc_query_count = 0;
    public static bool $is_admin = false;
    public static bool $allow_redirect_throw = false;

    public static function reset(): void
    {
        self::$options           = ['users_can_register' => 1];
        self::$transients        = [];
        self::$users             = [];
        self::$user_meta         = [];
        self::$posts             = [];
        self::$post_meta         = [];
        self::$lesson_courses    = [];
        self::$course_curriculum = [];
        self::$course_item_state = [];
        self::$completed_lessons = [];
        self::$comments          = [];
        self::$comment_meta      = [];
        self::$next_comment_id   = 500;
        self::$enrolled_courses  = [];
        self::$lp_orders         = [];
        self::$wc_orders         = [];
        self::$wc_order_items    = [];
        self::$lp_order_items    = [];
        self::$lp_user_items     = [];
        self::$lp_section_items  = [];
        self::$tables            = [];
        self::$sent_emails       = [];
        self::$sent_sms          = [];
        self::$auth_cookies      = [];
        self::$redirects         = [];
        self::$current_user_id   = 0;
        self::$next_user_id      = 100;
        self::$lp_query_count    = 0;
        self::$wc_query_count    = 0;
        self::$is_admin          = false;
        $_SERVER                 = ['REMOTE_ADDR' => '198.51.100.10'];
        $_GET                    = [];
        $_POST                   = [];

        if (class_exists('TSMB_Security')) {
            TSMB_Security::reset_request_context();
        }
        if (class_exists('TSMB_Rest_API')) {
            TSMB_Rest_API::reset_request_caches();
        }
    }
}

final class TSMB_Fake_LP_Order
{
    private array $items;
    private string $status;

    public function __construct(array $items, string $status = 'completed')
    {
        $this->items  = $items;
        $this->status = $status;
    }

    public function get_items(): array
    {
        return $this->items;
    }

    public function has_status(string $status): bool
    {
        return $this->status === $status;
    }
}

final class TSMB_Fake_WC_Item
{
    private int $product_id;

    public function __construct(int $product_id)
    {
        $this->product_id = $product_id;
    }

    public function get_product_id(): int
    {
        return $this->product_id;
    }
}

final class TSMB_Fake_WC_Order
{
    private int $customer_id;
    private string $status;
    private array $items;

    public function __construct(int $customer_id, string $status, array $product_ids)
    {
        $this->customer_id = $customer_id;
        $this->status      = $status;
        $this->items       = array_map(static fn($pid) => new TSMB_Fake_WC_Item($pid), $product_ids);
    }

    public function get_customer_id(): int
    {
        return $this->customer_id;
    }

    public function get_items(): array
    {
        return $this->items;
    }

    public function get_status(): string
    {
        return $this->status;
    }

    public function is_paid(): bool
    {
        return in_array($this->status, ['completed', 'processing'], true);
    }
}

final class TSMB_Fake_WPDB
{
    public string $prefix = 'wp_';
    public string $posts = 'wp_posts';
    public string $postmeta = 'wp_postmeta';
    public string $users = 'wp_users';
    public string $usermeta = 'wp_usermeta';
    public string $options = 'wp_options';
    public string $comments = 'wp_comments';
    public string $commentmeta = 'wp_commentmeta';

    public function prepare($query, ...$args)
    {
        return ['query' => $query, 'args' => $args];
    }

    public function get_var($prepared)
    {
        $sql  = is_array($prepared) ? (string) ($prepared['query'] ?? '') : (string) $prepared;
        $args = is_array($prepared) ? (array) ($prepared['args'] ?? []) : [];

        if (strpos($sql, 'SHOW TABLES LIKE') !== false) {
            return (string) ($args[0] ?? '');
        }
        if (strpos($sql, 'SHOW COLUMNS FROM') !== false) {
            return (string) ($args[0] ?? 'item_id');
        }
        if (strpos($sql, 'FROM wp_users') !== false && strpos($sql, 'COUNT(*)') !== false) {
            $require_caps = strpos($sql, 'wp_usermeta') !== false;
            $cap_key      = $require_caps ? (string) ($args[0] ?? 'wp_capabilities') : '';
            $has_range    = strpos($sql, 'user_registered >=') !== false;
            $s            = $has_range ? (string) ($args[$require_caps ? 1 : 0] ?? '') : '';
            $e            = $has_range ? (string) ($args[$require_caps ? 2 : 1] ?? '') : '';
            $cnt          = 0;

            foreach (TSMB_Test_State::$users as $uid => $u) {
                if ($require_caps) {
                    $caps = TSMB_Test_State::$user_meta[intval($uid)][$cap_key] ?? null;
                    if (($caps === null || $caps === '') && empty((array) ($u->roles ?? []))) {
                        continue;
                    }
                }
                if ($has_range) {
                    $reg = (string) ($u->user_registered ?? '');
                    if ($reg < $s || $reg > $e) {
                        continue;
                    }
                }
                $cnt++;
            }
            return $cnt;
        }
        if (strpos($sql, 'FROM wp_usermeta') !== false && strpos($sql, 'COUNT(DISTINCT user_id)') !== false) {
            $cnt = 0;
            foreach (TSMB_Test_State::$user_meta as $uid => $meta) {
                if (isset($meta['tsmb_watch_positions_v1']) || isset($meta['tsmb_gamification_v1'])) {
                    $cnt++;
                }
            }
            return $cnt;
        }
        if (strpos($sql, 'wp_learnpress_user_items') !== false && strpos($sql, "item_type = 'lp_quiz'") !== false && strpos($sql, 'COUNT(*)') !== false) {
            $s   = (string) ($args[0] ?? '');
            $e   = (string) ($args[1] ?? '');
            $cnt = 0;
            foreach (TSMB_Test_State::$lp_user_items as $ui) {
                if (($ui['item_type'] ?? '') !== 'lp_quiz') {
                    continue;
                }
                $st = (string) ($ui['start_time'] ?? '');
                if ($s !== '' && $e !== '' && ($st < $s || $st > $e)) {
                    continue;
                }
                $cnt++;
            }
            return $cnt;
        }
        if (strpos($sql, 'wp_learnpress_user_items') !== false && strpos($sql, 'COUNT(DISTINCT') !== false) {
            $uids = [];
            $is_lesson = strpos($sql, "'lp_lesson'") !== false;
            $is_finished = strpos($sql, "'finished'") !== false && strpos($sql, "'enrolled'") === false;
            foreach (TSMB_Test_State::$lp_user_items as $ui) {
                if ($is_lesson) {
                    if (in_array($ui['item_type'] ?? '', ['lp_lesson', 'lp_quiz'], true)) {
                        $uids[intval($ui['user_id'] ?? 0)] = true;
                    }
                    continue;
                }
                if (($ui['item_type'] ?? '') !== 'lp_course') {
                    continue;
                }
                if ($is_finished && (($ui['status'] ?? '') !== 'finished' || ($ui['graduation'] ?? '') === 'failed')) {
                    continue;
                }
                $uids[intval($ui['user_id'] ?? 0)] = true;
            }
            return count($uids);
        }
        foreach (['wp_tsmb_push_tokens', 'wp_tsmb_corporate_inquiries', 'wp_tsmb_support_tickets'] as $tbl) {
            if (strpos($sql, $tbl) !== false) {
                $rows = TSMB_Test_State::$tables[$tbl] ?? [];
                if (strpos($sql, 'DISTINCT user_id') !== false) {
                    $uids = [];
                    foreach ($rows as $r) {
                        if (intval($r['user_id'] ?? 0) > 0) {
                            $uids[intval($r['user_id'])] = true;
                        }
                    }
                    return count($uids);
                }
                return count($rows);
            }
        }
        return null;
    }

    public function get_col($prepared): array
    {
        if (!is_array($prepared)) {
            return [];
        }
        $sql  = $prepared['query'];
        $args = $prepared['args'];

        if (strpos($sql, 'section_course_id') !== false) {
            $lesson_id = intval($args[0] ?? 0);
            return TSMB_Test_State::$lesson_courses[$lesson_id] ?? [];
        }

        if (strpos($sql, 'learnpress_user_items') !== false && strpos($sql, 'IN') !== false) {
            $uid   = intval($args[0] ?? 0);
            $cids  = TSMB_Test_State::$enrolled_courses[$uid] ?? [];
            $out   = [];
            foreach ($cids as $cid) {
                $status = get_post_status($cid);
                if ($status === 'publish') {
                    $out[] = $cid;
                }
            }
            return $out;
        }

        return [];
    }

    public function get_charset_collate(): string
    {
        return 'DEFAULT CHARACTER SET utf8mb4';
    }

    public function insert($table, $data, $format = null)
    {
        $tbl = (string) $table;
        if (!isset(TSMB_Test_State::$tables[$tbl])) {
            TSMB_Test_State::$tables[$tbl] = [];
        }
        $nextId = count(TSMB_Test_State::$tables[$tbl]) + 1;
        $row = array_merge(['id' => $nextId], (array) $data);
        TSMB_Test_State::$tables[$tbl][] = $row;
        return 1;
    }

    public function get_results($prepared, $output = null): array
    {
        $sql  = is_array($prepared) ? (string) ($prepared['query'] ?? '') : (string) $prepared;
        $args = is_array($prepared) ? (array) ($prepared['args'] ?? []) : [];

        // Analytics: site users + capabilities usermeta (SQL GROUP BY & hourly buckets with LIMIT/OFFSET)
        if (strpos($sql, 'FROM wp_users u') !== false && strpos($sql, 'wp_usermeta') !== false) {
            $cap_key = (string) ($args[0] ?? 'wp_capabilities');

            if (strpos($sql, 'GROUP BY um.meta_value') !== false) {
                $limit  = max(1, intval($args[1] ?? 500));
                $offset = max(0, intval($args[2] ?? 0));
                $counts = [];
                foreach (TSMB_Test_State::$users as $uid => $user) {
                    $caps = TSMB_Test_State::$user_meta[intval($uid)][$cap_key] ?? null;
                    if ($caps === null || $caps === '') {
                        $roles_assoc = [];
                        foreach ((array) ($user->roles ?? []) as $rk) {
                            $roles_assoc[$rk] = true;
                        }
                        if (empty($roles_assoc)) {
                            continue;
                        }
                        $caps = serialize($roles_assoc);
                    }
                    $raw_cap = is_array($caps) ? serialize($caps) : (string) $caps;
                    $counts[$raw_cap] = ($counts[$raw_cap] ?? 0) + 1;
                }
                $out = [];
                foreach ($counts as $raw_cap => $cnt) {
                    $out[] = ['capabilities_raw' => $raw_cap, 'role_cnt' => $cnt];
                }
                $sliced = array_slice($out, $offset, $limit);
                return $output === ARRAY_A ? $sliced : array_map(static fn($r) => (object) $r, $sliced);
            }

            if (strpos($sql, 'DATE_FORMAT(u.user_registered') !== false) {
                $has_range = strpos($sql, 'u.user_registered >=') !== false;
                $s         = $has_range ? (string) ($args[1] ?? '') : '';
                $e         = $has_range ? (string) ($args[2] ?? '') : '';
                $limit     = max(1, intval($args[$has_range ? 3 : 1] ?? 500));
                $offset    = max(0, intval($args[$has_range ? 4 : 2] ?? 0));
                $buckets   = [];

                foreach (TSMB_Test_State::$users as $uid => $user) {
                    $caps = TSMB_Test_State::$user_meta[intval($uid)][$cap_key] ?? null;
                    if (($caps === null || $caps === '') && empty((array) ($user->roles ?? []))) {
                        continue;
                    }
                    $reg = (string) ($user->user_registered ?: gmdate('Y-m-d H:i:s'));
                    if ($reg === '' || strpos($reg, '0000-00-00') === 0) {
                        continue;
                    }
                    if ($has_range && ($reg < $s || $reg > $e)) {
                        continue;
                    }
                    $hk = substr($reg, 0, 13) . ':00:00';
                    $buckets[$hk] = ($buckets[$hk] ?? 0) + 1;
                }
                ksort($buckets);
                $out = [];
                foreach ($buckets as $hk => $cnt) {
                    $out[] = ['bucket_gmt' => $hk, 'reg_cnt' => $cnt];
                }
                $sliced = array_slice($out, $offset, $limit);
                return $output === ARRAY_A ? $sliced : array_map(static fn($r) => (object) $r, $sliced);
            }
        }

        // Analytics: reverse Woo link query joining wp_postmeta pm + wp_posts p
        if (strpos($sql, 'FROM wp_postmeta pm') !== false && strpos($sql, 'wp_posts p') !== false) {
            $want_vals = array_map('strval', $args);
            $out       = [];
            foreach (TSMB_Test_State::$posts as $p) {
                if (($p->post_type ?? '') !== 'shop_order') {
                    continue;
                }
                $pid = intval($p->ID ?? 0);
                foreach (['_learn_press_order_id', '_lp_order_id'] as $mk) {
                    $mv = (string) (TSMB_Test_State::$post_meta[$pid][$mk] ?? '');
                    if ($mv !== '' && in_array($mv, $want_vals, true)) {
                        $out[] = ['meta_value' => $mv];
                    }
                }
            }
            return $out;
        }

        // Analytics: posts queries by post_type
        if (strpos($sql, 'FROM wp_posts') !== false) {
            if (strpos($sql, "post_type = 'lp_course'") !== false) {
                if (strpos($sql, 'GROUP BY post_status') !== false) {
                    $counts = [];
                    foreach (TSMB_Test_State::$posts as $p) {
                        if (($p->post_type ?? '') === 'lp_course') {
                            $st = (string) ($p->post_status ?? 'publish');
                            $counts[$st] = ($counts[$st] ?? 0) + 1;
                        }
                    }
                    $out = [];
                    foreach ($counts as $st => $cnt) {
                        $out[] = ['post_status' => $st, 'cnt' => $cnt];
                    }
                    return $out;
                }
                $filter_cid = count($args) > 0 ? intval($args[0]) : 0;
                $out = [];
                foreach (TSMB_Test_State::$posts as $p) {
                    if (($p->post_type ?? '') === 'lp_course' && ($p->post_status ?? '') === 'publish') {
                        if ($filter_cid > 0 && intval($p->ID) !== $filter_cid) {
                            continue;
                        }
                        $out[] = [
                            'ID'            => intval($p->ID),
                            'post_title'    => (string) ($p->post_title ?? ('Course ' . $p->ID)),
                            'post_author'   => intval($p->post_author ?? 1),
                            'post_date_gmt' => (string) ($p->post_date_gmt ?? gmdate('Y-m-d H:i:s')),
                        ];
                    }
                }
                return $out;
            }
            if (strpos($sql, "post_type = 'shop_order_refund'") !== false) {
                $id_list = array_map('intval', $args);
                $by_ref_id = strpos($sql, 'ID IN') !== false;
                $out = [];
                foreach (TSMB_Test_State::$posts as $p) {
                    if (($p->post_type ?? '') !== 'shop_order_refund') {
                        continue;
                    }
                    $match_val = $by_ref_id ? intval($p->ID ?? 0) : intval($p->post_parent ?? 0);
                    if (in_array($match_val, $id_list, true)) {
                        $out[] = ['parent_id' => intval($p->post_parent ?? 0), 'refund_id' => intval($p->ID ?? 0)];
                    }
                }
                return $out;
            }
            foreach (['shop_order', 'lp_order'] as $pt) {
                if (strpos($sql, "post_type = '{$pt}'") !== false) {
                    $after_id = intval($args[0] ?? 0);
                    $has_date = strpos($sql, 'post_date_gmt >=') !== false;
                    $limit    = 200;
                    if (count($args) >= 2) {
                        $limit = max(1, intval($args[count($args) - 1]));
                    }
                    $start_ts  = ($pt === 'shop_order' && $has_date) ? intval($args[1] ?? 0) : 0;
                    $end_ts    = ($pt === 'shop_order' && $has_date) ? intval($args[2] ?? 0) : 0;
                    $start_gmt = ($pt === 'shop_order' && $has_date) ? (string) ($args[3] ?? '') : ($has_date ? (string) ($args[1] ?? '') : '');
                    $end_gmt   = ($pt === 'shop_order' && $has_date) ? (string) ($args[4] ?? '') : ($has_date ? (string) ($args[2] ?? '') : '');

                    $matching = [];
                    foreach (TSMB_Test_State::$posts as $p) {
                        if (($p->post_type ?? '') !== $pt) {
                            continue;
                        }
                        $pid = intval($p->ID ?? 0);
                        if ($pid <= $after_id) {
                            continue;
                        }
                        $dgmt = (string) ($p->post_date_gmt ?? gmdate('Y-m-d H:i:s'));
                        if ($has_date) {
                            $st = strtolower((string) ($p->post_status ?? ''));
                            $dp = intval(TSMB_Test_State::$post_meta[$pid]['_date_paid'] ?? 0);
                            if ($pt === 'shop_order' && in_array($st, ['wc-completed', 'completed', 'wc-processing', 'processing'], true) && $dp > 0) {
                                if ($dp < $start_ts || $dp > $end_ts) {
                                    continue;
                                }
                            } elseif ($dgmt < $start_gmt || $dgmt > $end_gmt) {
                                continue;
                            }
                        }
                        $matching[] = [
                            'ID'            => $pid,
                            'id'            => $pid,
                            'post_status'   => (string) ($p->post_status ?? ''),
                            'status'        => (string) ($p->post_status ?? ''),
                            'post_date_gmt' => $dgmt,
                            'created_gmt'   => $dgmt,
                        ];
                    }
                    usort($matching, static fn($a, $b) => $a['ID'] <=> $b['ID']);
                    return array_slice($matching, 0, $limit);
                }
            }
        }

        // Analytics: postmeta batch
        if (strpos($sql, 'FROM wp_postmeta') !== false) {
            $out = [];
            foreach (TSMB_Test_State::$post_meta as $pid => $metas) {
                foreach ($metas as $mk => $mv) {
                    $out[] = ['post_id' => intval($pid), 'meta_key' => (string) $mk, 'meta_value' => $mv];
                }
            }
            return $out;
        }

        // Analytics: learnpress_user_items & curriculum & WC items
        if (strpos($sql, 'wp_learnpress_user_items') !== false) {
            if (strpos($sql, "item_type = 'lp_quiz'") !== false && strpos($sql, 'GROUP BY status, graduation') !== false) {
                $grouped = [];
                foreach (TSMB_Test_State::$lp_user_items as $ui) {
                    if (($ui['item_type'] ?? '') !== 'lp_quiz') {
                        continue;
                    }
                    $key = ($ui['status'] ?? '') . '|' . ($ui['graduation'] ?? '');
                    if (!isset($grouped[$key])) {
                        $grouped[$key] = [
                            'status'     => (string) ($ui['status'] ?? ''),
                            'graduation' => (string) ($ui['graduation'] ?? ''),
                            'cnt'        => 0,
                        ];
                    }
                    $grouped[$key]['cnt']++;
                }
                return array_values($grouped);
            }
            if (strpos($sql, 'GROUP BY parent_id') !== false) {
                $parent_filter = array_map('intval', $args);
                $grouped       = [];
                foreach (TSMB_Test_State::$lp_user_items as $ui) {
                    $pid = intval($ui['parent_id'] ?? 0);
                    if (
                        in_array($ui['item_type'] ?? '', ['lp_lesson', 'lp_quiz'], true) &&
                        ($ui['status'] ?? '') === 'completed' &&
                        $pid > 0 &&
                        (empty($parent_filter) || in_array($pid, $parent_filter, true))
                    ) {
                        $grouped[$pid] = ($grouped[$pid] ?? 0) + 1;
                    }
                }
                $out = [];
                foreach ($grouped as $pid => $cnt) {
                    $out[] = ['parent_id' => $pid, 'completed_cnt' => $cnt];
                }
                return $out;
            }
            if (strpos($sql, 'latest.latest_id') !== false) {
                $after_ui_id = intval($args[0] ?? 0);
                $filter_cid  = (count($args) >= 3) ? intval($args[1]) : 0;
                $limit       = max(1, intval($args[count($args) - 1] ?? 500));
                $latest      = [];
                foreach (TSMB_Test_State::$lp_user_items as $ui) {
                    if (($ui['item_type'] ?? '') !== 'lp_course') {
                        continue;
                    }
                    $uid = intval($ui['user_id'] ?? 0);
                    $cid = intval($ui['item_id'] ?? 0);
                    if ($filter_cid > 0 && $cid !== $filter_cid) {
                        continue;
                    }
                    $key = $uid . ':' . $cid;
                    $id  = intval($ui['user_item_id'] ?? 0);
                    if (!isset($latest[$key]) || $id > intval($latest[$key]['user_item_id'] ?? 0)) {
                        $latest[$key] = [
                            'user_item_id' => $id,
                            'user_id'      => $uid,
                            'course_id'    => $cid,
                            'status'       => (string) ($ui['status'] ?? 'enrolled'),
                            'graduation'   => (string) ($ui['graduation'] ?? ''),
                            'start_time'   => (string) ($ui['start_time'] ?? gmdate('Y-m-d H:i:s')),
                            'end_time'     => (string) ($ui['end_time'] ?? ''),
                        ];
                    }
                }
                $filtered = array_values(array_filter($latest, static fn($r) => intval($r['user_item_id']) > $after_ui_id));
                usort($filtered, static fn($a, $b) => $a['user_item_id'] <=> $b['user_item_id']);
                return array_slice($filtered, 0, $limit);
            }
        }

        if (strpos($sql, 'wp_learnpress_section_items') !== false) {
            return TSMB_Test_State::$lp_section_items;
        }

        if (strpos($sql, 'wp_woocommerce_order_items') !== false) {
            $want_oids = array_map('intval', $args);
            $out       = [];
            foreach (TSMB_Test_State::$wc_order_items as $it) {
                $oid = intval($it['order_id'] ?? 0);
                if (!empty($want_oids) && !in_array($oid, $want_oids, true)) {
                    continue;
                }
                $out[] = [
                    'order_item_id'   => intval($it['order_item_id']),
                    'order_id'        => $oid,
                    'order_item_name' => (string) ($it['name'] ?? ''),
                ];
            }
            return $out;
        }

        if (strpos($sql, 'wp_woocommerce_order_itemmeta') !== false) {
            $want_iids = array_map('intval', $args);
            $out       = [];
            foreach (TSMB_Test_State::$wc_order_items as $it) {
                $iid = intval($it['order_item_id']);
                if (!empty($want_iids) && !in_array($iid, $want_iids, true)) {
                    continue;
                }
                $meta_fields = [
                    '_product_id'      => $it['product_id'] ?? 0,
                    '_qty'             => $it['qty'] ?? 1,
                    '_line_total'      => $it['line_total'] ?? 0,
                    '_course_id'       => $it['course_id'] ?? 0,
                    '_refunded_item_id' => $it['refunded_item_id'] ?? 0,
                ];
                foreach ($meta_fields as $mk => $mv) {
                    if ($mv !== 0 && $mv !== '0' && $mv !== '') {
                        $out[] = ['order_item_id' => $iid, 'meta_key' => $mk, 'meta_value' => $mv];
                    }
                }
            }
            return $out;
        }

        if (strpos($sql, 'wp_learnpress_order_items') !== false) {
            return TSMB_Test_State::$lp_order_items;
        }

        if (strpos($sql, 'wp_learnpress_order_itemmeta') !== false) {
            $out = [];
            foreach (TSMB_Test_State::$lp_order_items as $it) {
                $iid = intval($it['order_item_id']);
                $out[] = ['item_id' => $iid, 'meta_key' => '_course_id', 'meta_value' => intval($it['item_id'] ?? 0)];
                $out[] = ['item_id' => $iid, 'meta_key' => '_quantity', 'meta_value' => intval($it['qty'] ?? 1)];
                $out[] = ['item_id' => $iid, 'meta_key' => '_total', 'meta_value' => floatval($it['total'] ?? 0)];
            }
            return $out;
        }

        $matchedTable = null;
        foreach (array_keys(TSMB_Test_State::$tables) as $tbl) {
            if (strpos($sql, $tbl) !== false) {
                $matchedTable = $tbl;
                break;
            }
        }
        if ($matchedTable === null) {
            return [];
        }

        $rows = TSMB_Test_State::$tables[$matchedTable];
        if (strpos($sql, 'WHERE user_id = %d') !== false) {
            $uid  = intval($args[0] ?? 0);
            $rows = array_values(array_filter($rows, static fn($r) => intval($r['user_id'] ?? 0) === $uid));
        }
        if (strpos($sql, 'ORDER BY id DESC') !== false) {
            $rows = array_reverse($rows);
        }

        if ($output === ARRAY_A) {
            return $rows;
        }
        return array_map(static fn($r) => (object) $r, $rows);
    }

    public function update($table, $data, $where, $format = null, $where_format = null)
    {
        if ($table === $this->users && isset($where['ID'], $data['user_pass'])) {
            $uid = intval($where['ID']);
            if (isset(TSMB_Test_State::$users[$uid])) {
                TSMB_Test_State::$users[$uid]->user_pass = (string) $data['user_pass'];
            }
        }
        $tbl = (string) $table;
        if (isset(TSMB_Test_State::$tables[$tbl]) && is_array($where)) {
            foreach (TSMB_Test_State::$tables[$tbl] as $idx => $row) {
                $match = true;
                foreach ($where as $wk => $wv) {
                    if (!isset($row[$wk]) || (string) $row[$wk] !== (string) $wv) {
                        $match = false;
                        break;
                    }
                }
                if ($match) {
                    TSMB_Test_State::$tables[$tbl][$idx] = array_merge($row, (array) $data);
                }
            }
        }
        return 1;
    }
}

$GLOBALS['wpdb'] = new TSMB_Fake_WPDB();

function add_action($tag, $cb, $priority = 10, $accepted_args = 1) {}
function add_filter($tag, $cb, $priority = 10, $accepted_args = 1) {}
function apply_filters($tag, $value, ...$args)
{
    if ($tag === 'tsmb_course_curriculum_items') {
        $cid = intval($args[0] ?? 0);
        return TSMB_Test_State::$course_curriculum[$cid] ?? $value;
    }
    if ($tag === 'tsmb_user_course_item_state') {
        $uid = intval($args[0] ?? 0);
        $cid = intval($args[1] ?? 0);
        return TSMB_Test_State::$course_item_state[$uid][$cid] ?? $value;
    }
    if ($tag === 'tsmb_user_completed_lesson_ids') {
        $uid = intval($args[0] ?? 0);
        $cid = intval($args[1] ?? 0);
        return TSMB_Test_State::$completed_lessons[$uid][$cid] ?? $value;
    }
    return $value;
}
function do_action($tag, ...$args) {}
function register_rest_route($ns, $route, $args = []) {}
function nocache_headers() {}
function is_admin(): bool { return TSMB_Test_State::$is_admin; }
function is_ssl(): bool { return true; }
function __($text, $domain = 'default') { return (string) $text; }
function esc_html($text) { return htmlspecialchars((string) $text, ENT_QUOTES, 'UTF-8'); }
function esc_attr($text) { return htmlspecialchars((string) $text, ENT_QUOTES, 'UTF-8'); }
function esc_textarea($text) { return htmlspecialchars((string) $text, ENT_QUOTES, 'UTF-8'); }
function absint($val): int { return abs(intval($val)); }
function wp_unslash($val) { return is_string($val) ? stripslashes($val) : $val; }
function sanitize_text_field($str): string { return trim(strip_tags((string) $str)); }
function sanitize_textarea_field($str): string { return trim(strip_tags((string) $str)); }
function sanitize_email($email): string { return trim((string) filter_var(trim((string) $email), FILTER_SANITIZE_EMAIL)); }
function is_email($email): bool { return (bool) filter_var((string) $email, FILTER_VALIDATE_EMAIL); }
function sanitize_key($key): string { return preg_replace('/[^a-z0-9_\-]/', '', strtolower((string) $key)); }
function sanitize_user($username, $strict = false): string { return preg_replace('/[^a-zA-Z0-9_\-.@]/', '', (string) $username); }
function wp_strip_all_tags($str): string { return strip_tags((string) $str); }
function wp_html_excerpt($str, $count, $more = ''): string
{
    $clean = trim(strip_tags((string) $str));
    if (strlen($clean) <= $count) return $clean;
    return substr($clean, 0, $count) . $more;
}
function current_time($type, $gmt = 0): string { return gmdate('Y-m-d H:i:s'); }
function wp_insert_comment($commentdata)
{
    $cid = ++TSMB_Test_State::$next_comment_id;
    $row = (object) array_merge([
        'comment_ID'       => $cid,
        'comment_post_ID'  => 0,
        'user_id'          => 0,
        'comment_author'   => '',
        'comment_content'  => '',
        'comment_type'     => 'comment',
        'comment_approved' => 1,
        'comment_date_gmt' => gmdate('Y-m-d H:i:s'),
    ], (array) $commentdata);
    TSMB_Test_State::$comments[$cid] = $row;
    return $cid;
}
function add_comment_meta($comment_id, $meta_key, $meta_value, $unique = false): bool
{
    TSMB_Test_State::$comment_meta[intval($comment_id)][(string) $meta_key] = $meta_value;
    return true;
}
function get_comment_meta($comment_id, $meta_key = '', $single = false)
{
    $val = TSMB_Test_State::$comment_meta[intval($comment_id)][(string) $meta_key] ?? '';
    return $single ? $val : [$val];
}
function get_comments($args = []): array
{
    $matches = [];
    foreach (TSMB_Test_State::$comments as $c) {
        if (isset($args['post_id']) && intval($c->comment_post_ID) !== intval($args['post_id'])) continue;
        if (isset($args['user_id']) && intval($c->user_id) !== intval($args['user_id'])) continue;
        if (isset($args['type']) && (string) $c->comment_type !== (string) $args['type']) continue;
        $matches[] = $c;
    }
    if (!empty($args['number'])) {
        return array_slice($matches, 0, intval($args['number']));
    }
    return $matches;
}
function esc_url_raw($url, $protocols = ['http', 'https']): string
{
    $url = trim((string) $url);
    $scheme = strtolower((string) parse_url($url, PHP_URL_SCHEME));
    if ($scheme !== '' && !in_array($scheme, (array) $protocols, true)) {
        return '';
    }
    return $url;
}
function set_url_scheme($url, $scheme = null): string
{
    $orig_scheme = $scheme;
    if (!$orig_scheme) {
        $scheme = 'https';
    }
    $url = trim((string) $url);
    if (substr($url, 0, 2) === '//') {
        $url = 'http:' . $url;
    }
    if (strpos($url, 'http') === 0) {
        return preg_replace('#^\w+://#', $scheme . '://', $url);
    }
    return $url;
}
function is_wp_error($thing): bool { return $thing instanceof WP_Error; }
function rest_ensure_response($data) { return new WP_REST_Response($data); }
function wp_json_encode($data, $options = 0) { return json_encode($data, $options); }
function wp_salt($scheme = 'auth'): string { return 'unit_test_deterministic_salt_for_tsmb_bridge_2026'; }
function wp_generate_password($len = 12, $special = true, $extra = false): string { return bin2hex(random_bytes(max(6, intval($len / 2)))); }
function wp_hash_password($password): string { return password_hash((string) $password, PASSWORD_BCRYPT); }
function wp_check_password($password, $hash, $user_id = ''): bool { return password_verify((string) $password, (string) $hash); }
function clean_user_cache($id) {}
function wp_timezone() { return new DateTimeZone('UTC'); }
function current_datetime() { return new DateTimeImmutable('now', new DateTimeZone('UTC')); }

function home_url($path = '/'): string
{
    return 'https://thrivingskill.com/' . ltrim((string) $path, '/');
}

function add_query_arg($key, $val, $url): string
{
    $sep = strpos((string) $url, '?') !== false ? '&' : '?';
    return $url . $sep . rawurlencode((string) $key) . '=' . rawurlencode((string) $val);
}

function wp_validate_redirect($location, $default = ''): string
{
    $loc = trim((string) $location);
    if ($loc === '') {
        return (string) $default;
    }
    if (strpos($loc, '/') === 0 && strpos($loc, '//') !== 0) {
        return home_url($loc);
    }
    $host = strtolower((string) parse_url($loc, PHP_URL_HOST));
    $scheme = strtolower((string) parse_url($loc, PHP_URL_SCHEME));
    if ($scheme === 'https' && in_array($host, ['thrivingskill.com', 'www.thrivingskill.com'], true)) {
        return $loc;
    }
    return (string) $default;
}

function wp_safe_redirect($location, $status = 302): bool
{
    TSMB_Test_State::$redirects[] = ['location' => $location, 'status' => $status];
    return true;
}

function get_option($name, $default = false)
{
    return array_key_exists($name, TSMB_Test_State::$options) ? TSMB_Test_State::$options[$name] : $default;
}

function update_option($name, $val, $autoload = null): bool
{
    TSMB_Test_State::$options[$name] = $val;
    return true;
}

function get_transient($key)
{
    return array_key_exists($key, TSMB_Test_State::$transients) ? TSMB_Test_State::$transients[$key]['value'] : false;
}

function set_transient($key, $val, $ttl = 0): bool
{
    TSMB_Test_State::$transients[$key] = ['value' => $val, 'ttl' => $ttl];
    return true;
}

function delete_transient($key): bool
{
    unset(TSMB_Test_State::$transients[$key]);
    return true;
}

function get_userdata($uid)
{
    return TSMB_Test_State::$users[intval($uid)] ?? false;
}

function get_user_by($field, $val)
{
    foreach (TSMB_Test_State::$users as $user) {
        if ($field === 'login' && $user->user_login === $val) return $user;
        if ($field === 'email' && strtolower($user->user_email) === strtolower((string) $val)) return $user;
    }
    return false;
}

function username_exists($username)
{
    $u = get_user_by('login', $username);
    return $u ? $u->ID : false;
}

function email_exists($email)
{
    $u = get_user_by('email', $email);
    return $u ? $u->ID : false;
}

function wp_insert_user($data)
{
    $uid = ++TSMB_Test_State::$next_user_id;
    $u = new WP_User($uid);
    $u->user_login    = (string) ($data['user_login'] ?? ('user_' . $uid));
    $u->user_pass     = (string) ($data['user_pass'] ?? '');
    $u->user_email    = (string) ($data['user_email'] ?? '');
    $u->user_nicename = $u->user_login;
    $u->display_name  = (string) ($data['display_name'] ?? $u->user_login);
    $u->user_registered = (string) ($data['user_registered'] ?? gmdate('Y-m-d H:i:s'));
    $u->roles         = [($data['role'] ?? 'subscriber')];
    TSMB_Test_State::$users[$uid] = $u;
    return $uid;
}

function wp_update_user($data)
{
    $uid = intval($data['ID'] ?? 0);
    if (!isset(TSMB_Test_State::$users[$uid])) {
        return new WP_Error('invalid_user', 'User not found');
    }
    if (isset($data['user_email'])) {
        TSMB_Test_State::$users[$uid]->user_email = (string) $data['user_email'];
    }
    return $uid;
}

function get_user_meta($uid, $key = '', $single = false)
{
    $meta = TSMB_Test_State::$user_meta[intval($uid)][$key] ?? '';
    return $single ? $meta : [$meta];
}

function update_user_meta($uid, $key, $value): bool
{
    TSMB_Test_State::$user_meta[intval($uid)][$key] = $value;
    return true;
}

function get_users($args = []): array
{
    $exclude = array_map('intval', $args['exclude'] ?? []);
    $meta_query = $args['meta_query'][0] ?? null;
    $matches = [];
    foreach (TSMB_Test_State::$users as $uid => $user) {
        if (in_array(intval($uid), $exclude, true)) {
            continue;
        }
        if ($meta_query) {
            $mval = get_user_meta($uid, $meta_query['key'], true);
            if ($mval !== $meta_query['value']) {
                continue;
            }
        }
        $matches[] = ($args['fields'] ?? '') === 'ID' ? $uid : $user;
    }
    if (!empty($args['number'])) {
        return array_slice($matches, 0, intval($args['number']));
    }
    return $matches;
}

function get_post($id)
{
    return TSMB_Test_State::$posts[intval($id)] ?? null;
}

function get_post_status($id)
{
    return TSMB_Test_State::$posts[intval($id)]->post_status ?? false;
}
function get_post_type($id)
{
    return TSMB_Test_State::$posts[intval($id)]->post_type ?? false;
}
function admin_url($path = ''): string
{
    return 'https://thrivingskill.com/wp-admin/' . ltrim((string) $path, '/');
}
function rest_url($path = ''): string
{
    return 'https://thrivingskill.com/wp-json/' . ltrim((string) $path, '/');
}
function wp_create_nonce($action = -1): string
{
    return 'nonce_' . sanitize_key((string) $action);
}
function add_submenu_page($parent_slug, $page_title, $menu_title, $capability, $menu_slug, $callback = '') {}
function selected($selected, $current = true, $display = true) { return ''; }
function checked($checked, $current = true, $display = true) { return ''; }
function wp_nonce_field($action = -1, $name = '_wpnonce', $referer = true, $display = true) { return ''; }
function check_admin_referer($action = -1, $query_arg = '_wpnonce') { return true; }
function wp_die($message = '', $title = '', $args = []) { throw new \RuntimeException((string) $message); }

function get_post_meta($id, $key = '', $single = false)
{
    $val = TSMB_Test_State::$post_meta[intval($id)][$key] ?? '';
    return $single ? $val : [$val];
}

function get_posts($args = []): array
{
    if (($args['post_type'] ?? '') === 'lp_order') {
        TSMB_Test_State::$lp_query_count++;
        $uid = intval($args['meta_query'][0]['value'] ?? 0);
        $ids = [];
        foreach (TSMB_Test_State::$lp_orders as $oid => $order) {
            if ($order['user_id'] === $uid) {
                $ids[] = $oid;
            }
        }
        return $ids;
    }
    return [];
}

function learn_press_get_order($order_id)
{
    $entry = TSMB_Test_State::$lp_orders[intval($order_id)] ?? null;
    return $entry ? new TSMB_Fake_LP_Order($entry['items'], $entry['status'] ?? 'completed') : null;
}

function wc_get_orders($args = []): array
{
    TSMB_Test_State::$wc_query_count++;
    $uid = intval($args['customer_id'] ?? 0);
    $out = [];
    foreach (TSMB_Test_State::$wc_orders as $order) {
        if ($order['user_id'] === $uid && in_array($order['status'], (array) ($args['status'] ?? []), true)) {
            $out[] = new TSMB_Fake_WC_Order($uid, $order['status'], $order['product_ids']);
        }
    }
    return $out;
}

function get_current_user_id(): int { return TSMB_Test_State::$current_user_id; }
function is_user_logged_in(): bool { return TSMB_Test_State::$current_user_id > 0; }
function wp_set_current_user($uid) { TSMB_Test_State::$current_user_id = intval($uid); }
function wp_clear_auth_cookie() { TSMB_Test_State::$auth_cookies = []; }
function wp_set_auth_cookie($uid, $remember = false, $secure = true) { TSMB_Test_State::$auth_cookies[] = ['uid' => $uid, 'secure' => $secure]; }
function user_can($uid, $cap): bool
{
    $u = get_userdata($uid);
    return $u && in_array('administrator', (array) $u->roles, true) && $cap === 'manage_options';
}
function current_user_can($cap): bool { return user_can(get_current_user_id(), $cap); }

function wp_mail($to, $subject, $message): bool
{
    TSMB_Test_State::$sent_emails[] = compact('to', 'subject', 'message');
    return true;
}

function wp_remote_post($url, $args = [])
{
    $body = json_decode((string) ($args['body'] ?? '{}'), true);
    TSMB_Test_State::$sent_sms[] = ['url' => $url, 'body' => $body];
    return ['response' => ['code' => 200], 'body' => '{"ok":true}'];
}

function wp_remote_retrieve_response_code($res): int
{
    return intval($res['response']['code'] ?? 200);
}

function wp_remote_retrieve_body($res): string
{
    return (string) ($res['body'] ?? '');
}

require_once dirname(__DIR__) . '/ts-mobile-bridge/ts-mobile-bridge.php';
