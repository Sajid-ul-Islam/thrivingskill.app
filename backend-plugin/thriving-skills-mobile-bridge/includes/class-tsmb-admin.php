<?php
/**
 * WordPress Admin Settings Page for Thriving Skills Mobile Bridge
 */

if (!defined('ABSPATH')) {
    exit;
}

class TSMB_Admin {

    public static function init() {
        add_action('admin_menu', [__CLASS__, 'add_menu']);
        add_action('admin_init', [__CLASS__, 'handle_actions']);
    }

    public static function add_menu() {
        add_menu_page(
            'Thriving Skills App',
            'Mobile App',
            'manage_options',
            'thriving-skills-app',
            [__CLASS__, 'render_page'],
            'dashicons-smartphone',
            30
        );
    }

    public static function handle_actions() {
        if (!isset($_POST['tsmb_save_settings'])) {
            return;
        }

        check_admin_referer('tsmb_save_settings_nonce');

        if (!current_user_can('manage_options')) {
            return;
        }

        update_option('tsmb_min_app_version', sanitize_text_field($_POST['min_version'] ?? '1.0.0'));
        update_option('tsmb_latest_app_version', sanitize_text_field($_POST['latest_version'] ?? '1.0.0'));
        update_option('tsmb_maintenance_mode', isset($_POST['maintenance_mode']) ? 1 : 0);
        update_option('tsmb_banner_active', isset($_POST['banner_active']) ? 1 : 0);
        update_option('tsmb_banner_text', sanitize_text_field($_POST['banner_text'] ?? ''));
        update_option('tsmb_banner_link', sanitize_text_field($_POST['banner_link'] ?? 'summit'));

        if (isset($_POST['purge_cache'])) {
            delete_transient('tsmb_mobile_feed_v1');
            add_settings_error('tsmb_notices', 'cache_purged', 'Mobile feed cache purged successfully!', 'updated');
        } else {
            add_settings_error('tsmb_notices', 'settings_saved', 'Mobile app settings saved successfully!', 'updated');
        }
    }

    public static function render_page() {
        $min_version     = get_option('tsmb_min_app_version', '1.0.0');
        $latest_version  = get_option('tsmb_latest_app_version', '1.0.0');
        $maintenance     = (bool) get_option('tsmb_maintenance_mode', false);
        $banner_active   = (bool) get_option('tsmb_banner_active', true);
        $banner_text     = get_option('tsmb_banner_text', 'Bangladesh Skills Summit 2026 registration is live!');
        $banner_link     = get_option('tsmb_banner_link', 'summit');

        $tokens_data     = get_option(TSMB_Notifications::OPTION_TOKENS, []);
        $total_devices   = is_array($tokens_data) ? count($tokens_data) : 0;
        ?>
        <div class="wrap">
            <h1><span class="dashicons dashicons-smartphone" style="font-size:28px;line-height:1;margin-right:8px;"></span> Thriving Skills Mobile App Settings</h1>
            <?php settings_errors('tsmb_notices'); ?>

            <div style="display:flex;gap:20px;margin-top:20px;flex-wrap:wrap;">
                <!-- Main Settings Form -->
                <div style="flex:2;min-width:320px;background:#fff;padding:24px;border:1px solid #ccd0d4;border-radius:8px;">
                    <form method="post" action="">
                        <?php wp_nonce_field('tsmb_save_settings_nonce'); ?>

                        <h2>App Version Control & Remote Flags</h2>
                        <table class="form-table">
                            <tr>
                                <th scope="row"><label for="min_version">Minimum Supported App Version</label></th>
                                <td>
                                    <input name="min_version" type="text" id="min_version" value="<?php echo esc_attr($min_version); ?>" class="regular-text" placeholder="1.0.0" />
                                    <p class="description">Devices running below this version will be politely prompted to update.</p>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row"><label for="latest_version">Latest Store Version</label></th>
                                <td>
                                    <input name="latest_version" type="text" id="latest_version" value="<?php echo esc_attr($latest_version); ?>" class="regular-text" placeholder="1.0.0" />
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">Maintenance Mode</th>
                                <td>
                                    <label>
                                        <input name="maintenance_mode" type="checkbox" value="1" <?php checked($maintenance, true); ?> />
                                        Temporarily notify mobile learners of scheduled server maintenance.
                                    </label>
                                </td>
                            </tr>
                        </table>

                        <hr style="margin:24px 0;border:0;border-top:1px solid #eee;" />

                        <h2>In-App Announcement Banner</h2>
                        <table class="form-table">
                            <tr>
                                <th scope="row">Enable In-App Banner</th>
                                <td>
                                    <label>
                                        <input name="banner_active" type="checkbox" value="1" <?php checked($banner_active, true); ?> />
                                        Display top highlight banner on the mobile Home feed.
                                    </label>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row"><label for="banner_text">Banner Message</label></th>
                                <td>
                                    <input name="banner_text" type="text" id="banner_text" value="<?php echo esc_attr($banner_text); ?>" class="large-text" />
                                </td>
                            </tr>
                            <tr>
                                <th scope="row"><label for="banner_link">Action Target / Screen</label></th>
                                <td>
                                    <input name="banner_link" type="text" id="banner_link" value="<?php echo esc_attr($banner_link); ?>" class="regular-text" placeholder="summit or https://..." />
                                </td>
                            </tr>
                        </table>

                        <p class="submit" style="display:flex;gap:12px;align-items:center;">
                            <input type="submit" name="tsmb_save_settings" id="submit" class="button button-primary" value="Save App Settings">
                            <input type="submit" name="purge_cache" class="button button-secondary" value="Purge Mobile Feed Cache">
                        </p>
                    </form>
                </div>

                <!-- Status Sidebar -->
                <div style="flex:1;min-width:260px;background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-radius:8px;height:fit-content;">
                    <h3 style="margin-top:0;">📱 Mobile Ecosystem Status</h3>
                    <p><strong>Active Push Devices:</strong> <?php echo intval($total_devices); ?></p>
                    <p><strong>Checkout Mode:</strong> <span style="background:#e0f2fe;color:#0369a1;padding:2px 8px;border-radius:4px;font-weight:600;">WebView (Google Play Safe)</span></p>
                    <p><strong>Mobile Feed Cache:</strong> <?php echo (get_transient('tsmb_mobile_feed_v1') !== false) ? '<span style="color:#15803d;font-weight:600;">Active (Cached)</span>' : '<span style="color:#64748b;">Not cached</span>'; ?></p>

                    <hr style="margin:16px 0;border:0;border-top:1px solid #cbd5e1;" />
                    <h4>REST API Diagnostics</h4>
                    <ul style="font-size:12px;color:#475569;line-height:1.6;padding-left:16px;">
                        <li><code>/wp-json/thrivingskill/v1/config</code></li>
                        <li><code>/wp-json/thrivingskill/v1/feed</code></li>
                        <li><code>/wp-json/thrivingskill/v1/lessons/{id}</code></li>
                        <li><code>/wp-json/thrivingskill/v1/register-push-token</code></li>
                    </ul>
                </div>
            </div>
        </div>
        <?php
    }
}
