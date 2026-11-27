<?php

/**
 * Real WordPress + LearnPress + WooCommerce integration test bootstrap.
 *
 * Requires an installed WordPress PHPUnit test suite (`WP_TESTS_DIR`) backed
 * by MySQL and never falls back to fake/mock stubs.
 */

$vendor_autoload = dirname(__DIR__) . '/vendor/autoload.php';
if (file_exists($vendor_autoload)) {
    require_once $vendor_autoload;
}

$polyfills_dir = dirname(__DIR__) . '/vendor/yoast/phpunit-polyfills';
if (!defined('WP_TESTS_PHPUNIT_POLYFILLS_PATH') && is_dir($polyfills_dir)) {
    define('WP_TESTS_PHPUNIT_POLYFILLS_PATH', $polyfills_dir);
}

$wp_tests_dir = getenv('WP_TESTS_DIR');
if (!$wp_tests_dir) {
    $wp_tests_dir = rtrim(sys_get_temp_dir(), '/\\') . '/wordpress-tests-lib';
}

if (!file_exists($wp_tests_dir . '/includes/functions.php')) {
    fwrite(
        STDERR,
        sprintf(
            "WordPress test library not found at '%s'. Run backend-plugin/bin/install-wp-tests.sh or set WP_TESTS_DIR.\n",
            $wp_tests_dir
        )
    );
    exit(1);
}

if (!defined('TSMB_TESTING')) {
    define('TSMB_TESTING', true);
}
if (!defined('TSMB_DISABLE_TIMING_SLEEP')) {
    define('TSMB_DISABLE_TIMING_SLEEP', true);
}

require_once $wp_tests_dir . '/includes/functions.php';

tests_add_filter('muplugins_loaded', static function (): void {
    $plugins_dir = getenv('WP_PLUGINS_DIR');
    if (!$plugins_dir && defined('WP_PLUGIN_DIR')) {
        $plugins_dir = WP_PLUGIN_DIR;
    }
    if (!$plugins_dir) {
        $plugins_dir = rtrim(sys_get_temp_dir(), '/\\') . '/wordpress/wp-content/plugins';
    }

    $wc_main = rtrim($plugins_dir, '/\\') . '/woocommerce/woocommerce.php';
    if (file_exists($wc_main)) {
        require_once $wc_main;
    }

    $lp_main = rtrim($plugins_dir, '/\\') . '/learnpress/learnpress.php';
    if (file_exists($lp_main)) {
        require_once $lp_main;
    }

    require_once dirname(__DIR__) . '/ts-mobile-bridge/ts-mobile-bridge.php';
});

require_once $wp_tests_dir . '/includes/bootstrap.php';

// Ensure database tables for WooCommerce, LearnPress, and TS Mobile Bridge exist in the real test DB.
if (class_exists('WC_Install') && method_exists('WC_Install', 'install')) {
    WC_Install::install();
}
if (class_exists('LP_Install') && method_exists('LP_Install', 'install')) {
    LP_Install::install();
}
TSMB_Lifecycle::activate();
