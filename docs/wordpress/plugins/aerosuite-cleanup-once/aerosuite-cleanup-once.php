<?php
/**
 * Plugin Name: Aero Suite Cleanup Once
 * Description: Remove log publico de debug WPForms (one-shot).
 * Version: 1.0.0
 * Author: Aero Suite
 */
if (!defined('ABSPATH')) {
    exit;
}

register_activation_hook(__FILE__, static function () {
    $log = WP_CONTENT_DIR . '/uploads/aerosuite-wpforms-debug.log';
    if (is_file($log)) {
        @unlink($log);
    }
    $htaccess = WP_CONTENT_DIR . '/uploads/.htaccess';
    $rule = "\n# Block aerosuite debug logs\n<Files \"aerosuite-wpforms-debug.log\">\nRequire all denied\n</Files>\n";
    if (is_file($htaccess) && strpos(file_get_contents($htaccess), 'aerosuite-wpforms-debug') === false) {
        @file_put_contents($htaccess, $rule, FILE_APPEND);
    }
});
