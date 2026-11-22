<?php
/**
 * Plugin Name:       Thriving Skills Mobile Bridge
 * Plugin URI:        https://thrivingskill.com
 * Description:       Companion high-performance REST API bridge, remote configuration, and notification engine for the Thriving Skills React Native mobile application.
 * Version:           1.0.0
 * Author:            Thriving Skills Engineering
 * Author URI:        https://thrivingskill.com
 * License:           GPL-2.0+
 * Text Domain:       thriving-skills-mobile-bridge
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

define('TSMB_VERSION', '1.0.0');
define('TSMB_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('TSMB_PLUGIN_URL', plugin_dir_url(__FILE__));

// Require module classes
require_once TSMB_PLUGIN_DIR . 'includes/class-tsmb-rest-api.php';
require_once TSMB_PLUGIN_DIR . 'includes/class-tsmb-notifications.php';
require_once TSMB_PLUGIN_DIR . 'includes/class-tsmb-admin.php';

/**
 * Bootstrap the plugin
 */
function tsmb_init_plugin() {
    TSMB_Rest_API::init();
    TSMB_Notifications::init();
    if (is_admin()) {
        TSMB_Admin::init();
    }
}
add_action('plugins_loaded', 'tsmb_init_plugin');
