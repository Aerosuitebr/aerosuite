<?php
/**
 * Plugin Name: Aero Suite Performance
 * Description: Preloads LCP, adia CSS não crítico e reforça cache no edge.
 * Version: 1.0.1
 * Author: Aero Suite
 */

if (!defined('ABSPATH')) {
    exit;
}

const AS_PERF_ORIGIN = 'https://aerosuite.com.br';
const AS_PERF_LOGO = 'https://aerosuite.com.br/wp-content/uploads/2026/06/hero-logo-transparent-v2.png';
const AS_PERF_DASHBOARD = 'https://aerosuite.com.br/wp-content/uploads/2026/06/dashboard-web.webp';
const AS_PERF_INTER_FONT = 'https://aerosuite.com.br/wp-content/themes/extendable/assets/fonts/inter/inter-variable.woff2';

/** Handles de CSS que podem carregar após o first paint. */
function as_perf_defer_css_handles() {
    $handles = ['wpforms-modern-base', 'trp-language-switcher-v2'];
    if (is_front_page()) {
        $handles[] = 'extendable-style';
    }
    return $handles;
}

add_action('wp_head', 'as_perf_lcp_hints', 1);
function as_perf_lcp_hints() {
    if (!is_front_page()) {
        return;
    }
    echo '<link rel="preconnect" href="' . esc_url(AS_PERF_ORIGIN) . '" crossorigin>' . "\n";
    echo '<link rel="dns-prefetch" href="' . esc_url(AS_PERF_ORIGIN) . '">' . "\n";
    echo '<link rel="preload" as="image" href="' . esc_url(AS_PERF_LOGO) . '" fetchpriority="high">' . "\n";
    echo '<link rel="preload" as="image" href="' . esc_url(AS_PERF_DASHBOARD) . '" fetchpriority="high">' . "\n";
    echo '<link rel="preload" href="' . esc_url(AS_PERF_INTER_FONT) . '" as="font" type="font/woff2" crossorigin>' . "\n";
    echo "<style id=\"as-perf-font-display\">@font-face{font-family:Inter;font-display:swap;src:url('" . esc_url(AS_PERF_INTER_FONT) . "') format('woff2');font-weight:100 900;font-style:normal;}</style>\n";
}

add_filter('style_loader_tag', 'as_perf_defer_noncritical_css', 10, 4);
function as_perf_defer_noncritical_css($html, $handle, $href, $media) {
    if (is_admin() || !in_array($handle, as_perf_defer_css_handles(), true)) {
        return $html;
    }
    $href = esc_url($href);
    $media = esc_attr($media ?: 'all');
    return "<link rel='preload' href='{$href}' as='style' onload=\"this.onload=null;this.rel='stylesheet'\" media='{$media}'>\n"
        . "<noscript><link rel='stylesheet' href='{$href}' media='{$media}'></noscript>\n";
}

add_action('wp_enqueue_scripts', 'as_perf_defer_wpforms_scripts', 999);
function as_perf_defer_wpforms_scripts() {
    if (!is_front_page()) {
        return;
    }
    $wp_scripts = wp_scripts();
    if (!$wp_scripts) {
        return;
    }
    foreach ($wp_scripts->queue as $handle) {
        if (strpos($handle, 'wpforms') === false) {
            continue;
        }
        if (function_exists('wp_script_add_data')) {
            wp_script_add_data($handle, 'strategy', 'defer');
        }
    }
}

add_action('send_headers', 'as_perf_cache_headers');
function as_perf_cache_headers() {
    if (is_admin() || is_user_logged_in() || headers_sent()) {
        return;
    }
    header('Cache-Control: public, max-age=300, s-maxage=86400, stale-while-revalidate=604800');
}
