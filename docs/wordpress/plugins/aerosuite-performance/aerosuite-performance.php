<?php

/**

 * Plugin Name: Aero Suite Performance

 * Description: Preloads LCP, adia CSS/JS não crítico, cache edge e limpeza WP.

 * Version: 1.3.3

 * Author: Aero Suite

 */



if (!defined('ABSPATH')) {

    exit;

}



const AS_PERF_ORIGIN = 'https://aerosuite.com.br';

const AS_PERF_HOME_PAGE_ID = 21;

const AS_PERF_LOGO = 'https://aerosuite.com.br/wp-content/uploads/2026/06/aero-claro-logo.png';

const AS_PERF_DASHBOARD = 'https://aerosuite.com.br/wp-content/uploads/2026/06/dashboard-web-6.webp';

const AS_PERF_INTER_FONT = 'https://aerosuite.com.br/wp-content/themes/extendable/assets/fonts/inter/inter-variable.woff2';

const AS_PERF_LOGO_BRAND = 'https://aerosuite.com.br/wp-content/uploads/2026/06/aerosuite-site-icon-512.png';

/** Imagem grande para WhatsApp, LinkedIn e Facebook (preview com foto + texto). */
const AS_PERF_OG_SHARE = 'https://aerosuite.com.br/wp-content/uploads/2026/06/dashboard-web-6.webp';

require_once __DIR__ . '/aerosuite-seo-pages.php';

function as_perf_trim_description($text, $max = 160) {

    $text = wp_strip_all_tags((string) $text);

    $text = preg_replace('/\s+/u', ' ', $text);

    $text = trim($text);

    if (mb_strlen($text, 'UTF-8') > $max) {

        $text = mb_substr($text, 0, $max - 1, 'UTF-8');
        $text = preg_replace('/\s+\S*$/u', '', $text) . '…';

    }

    return $text;

}

function as_perf_post_share_image($post_id) {

    if ($post_id && has_post_thumbnail($post_id)) {

        $url = get_the_post_thumbnail_url($post_id, 'large');

        if ($url) {

            return $url;

        }

    }

    return AS_PERF_OG_SHARE;

}

function as_perf_resolve_share_context() {

    if (is_admin() || is_feed() || is_robots() || is_trackback()) {

        return null;

    }

    $config = as_perf_page_seo_config();

    $home = $config['home'];

    if (is_front_page()) {

        return [

            'title' => $home['title'],

            'description' => $home['description'],

            'url' => home_url('/'),

            'image' => AS_PERF_OG_SHARE,

            'type' => 'website',

        ];

    }

    if (is_page('solucoes')) {

        return [

            'title' => $config['solucoes']['title'],

            'description' => $config['solucoes']['description'],

            'url' => home_url('/solucoes/'),

            'image' => AS_PERF_OG_SHARE,

            'type' => 'website',

        ];

    }

    if (is_page('contato')) {

        return [

            'title' => $config['contato']['title'],

            'description' => $config['contato']['description'],

            'url' => home_url('/contato/'),

            'image' => AS_PERF_OG_SHARE,

            'type' => 'website',

        ];

    }

    if (is_home() && !is_front_page()) {

        $posts_page = (int) get_option('page_for_posts');

        return [

            'title' => 'Blog Aero Suite, guias MRO e gestão de oficinas',

            'description' => $home['description'],

            'url' => $posts_page ? get_permalink($posts_page) : home_url('/blog/'),

            'image' => AS_PERF_OG_SHARE,

            'type' => 'website',

        ];

    }

    if (is_singular()) {

        $post_id = get_queried_object_id();

        $title = wp_strip_all_tags(get_the_title($post_id));

        $desc = get_the_excerpt($post_id);

        if (!$desc) {

            $desc = get_post_field('post_content', $post_id);

        }

        $desc = as_perf_trim_description($desc);

        if (strlen($desc) < 60) {

            $desc = $home['description'];

        }

        return [

            'title' => $title . ' | Aero Suite',

            'description' => $desc,

            'url' => get_permalink($post_id),

            'image' => as_perf_post_share_image($post_id),

            'type' => is_singular('post') ? 'article' : 'website',

        ];

    }

    return [

        'title' => $home['title'],

        'description' => $home['description'],

        'url' => home_url('/'),

        'image' => AS_PERF_OG_SHARE,

        'type' => 'website',

    ];

}



add_action('send_headers', 'as_perf_www_to_apex', 0);
add_action('template_redirect', 'as_perf_www_to_apex', 0);

function as_perf_www_to_apex() {
    if (is_admin() || (defined('DOING_CRON') && DOING_CRON) || (defined('WP_CLI') && WP_CLI)) {
        return;
    }
    $host = isset($_SERVER['HTTP_HOST']) ? strtolower($_SERVER['HTTP_HOST']) : '';
    if ($host !== 'www.aerosuite.com.br') {
        return;
    }
    $uri = isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : '/';
    $target = 'https://aerosuite.com.br' . $uri;
    if (!headers_sent()) {
        header('Location: ' . $target, true, 301);
        exit;
    }
    wp_redirect($target, 301);
    exit;
}

add_filter('redirect_canonical', 'as_perf_prevent_canonical_loop', 1, 2);

function as_perf_prevent_canonical_loop($redirect_url, $requested_url) {

    if (!$redirect_url) {

        return $redirect_url;

    }

    $red = strtolower(untrailingslashit($redirect_url));

    $req = strtolower(untrailingslashit($requested_url));

    if ($red === $req || trailingslashit($red) === trailingslashit($req)) {

        return false;

    }

    return $redirect_url;

}



add_action('wp_head', 'as_perf_output_page_seo_meta', 2);

remove_action('wp_head', 'rel_canonical');
remove_action('wp_head', 'wp_shortlink_wp_head');

add_filter('pre_get_document_title', 'as_perf_document_title', 20);

add_filter('render_block', 'as_perf_remove_duplicate_h1_blocks', 20, 2);

function as_perf_remove_duplicate_h1_blocks($content, $block) {
    $name = isset($block['blockName']) ? $block['blockName'] : '';
    if ($name === 'core/site-title') {
        return '';
    }
    if ($name !== 'core/post-title' || !is_page()) {
        return $content;
    }
    $post_id = get_queried_object_id();
    $page_content = $post_id ? get_post_field('post_content', $post_id) : '';
    return preg_match('/<h1\b/i', (string) $page_content) ? '' : $content;
}

function as_perf_document_title($title) {
    $ctx = as_perf_resolve_share_context();
    return $ctx ? $ctx['title'] : $title;
}

add_filter('wp_robots', 'as_perf_robots_policy');

function as_perf_robots_policy($robots) {
    if (is_search() || is_404() || is_author() || is_date() || is_page('obrigado')) {
        $robots['noindex'] = true;
        $robots['follow'] = true;
    }
    return $robots;
}

add_filter('wp_sitemaps_posts_query_args', 'as_perf_exclude_private_landing_pages', 10, 2);

function as_perf_exclude_private_landing_pages($args, $post_type) {
    if ($post_type !== 'page') {
        return $args;
    }
    $thank_you = get_page_by_path('obrigado');
    if ($thank_you) {
        $args['post__not_in'] = array_values(array_unique(array_merge(
            isset($args['post__not_in']) ? (array) $args['post__not_in'] : [],
            [(int) $thank_you->ID]
        )));
    }
    return $args;
}

function as_perf_output_page_seo_meta() {

    $ctx = as_perf_resolve_share_context();

    if (!$ctx) {

        return;

    }

    $url = esc_url($ctx['url']);

    $title = esc_attr($ctx['title']);

    $desc = esc_attr($ctx['description']);

    $image = esc_url($ctx['image']);

    $brand = esc_attr('Aero Suite');

    $type = esc_attr($ctx['type']);

    echo '<meta id="as-seo-meta" name="description" content="' . $desc . "\" />\n";

    echo '<link rel="canonical" href="' . $url . "\" />\n";

    echo '<meta property="og:type" content="' . $type . "\" />\n";

    echo '<meta property="og:site_name" content="' . $brand . "\" />\n";

    echo '<meta property="og:title" content="' . $title . "\" />\n";

    echo '<meta property="og:description" content="' . $desc . "\" />\n";

    echo '<meta property="og:url" content="' . $url . "\" />\n";

    echo '<meta property="og:image" content="' . $image . "\" />\n";

    echo '<meta property="og:image:secure_url" content="' . $image . "\" />\n";

    echo '<meta property="og:image:alt" content="Aero Suite, software de gestão MRO para oficinas aeronáuticas" />' . "\n";

    echo '<meta property="og:image:width" content="1200" />' . "\n";

    echo '<meta property="og:image:height" content="630" />' . "\n";

    echo '<meta property="og:locale" content="pt_BR" />' . "\n";

    echo '<meta name="twitter:card" content="summary_large_image" />' . "\n";

    echo '<meta name="twitter:title" content="' . $title . "\" />\n";

    echo '<meta name="twitter:description" content="' . $desc . "\" />\n";

    echo '<meta name="twitter:image" content="' . $image . "\" />\n";

}



function as_perf_is_marketing_view() {

    return is_front_page() || is_page(['contato', 'solucoes', 'sobre']);

}



function as_perf_defer_css_handles() {

    $handles = ['wpforms-modern-base', 'trp-language-switcher-v2'];

    if (is_front_page()) {

        $handles[] = 'extendable-style';

        $handles[] = 'wp-block-library';

        $handles[] = 'global-styles';

    }

    return $handles;

}



function as_perf_defer_script_handles() {

    if (!is_front_page()) {

        return [];

    }

    return [

        'trp-language-switcher-js-v2-js',

        'wp-embed',

    ];

}



add_action('init', 'as_perf_disable_translatepress_floater', 1);

function as_perf_disable_translatepress_floater() {
    add_filter('trp_show_floating_switcher', '__return_false', 999);
    add_filter('trp_floating_ls_html', '__return_empty_string', 999);
}

add_action('wp_enqueue_scripts', 'as_perf_dequeue_translatepress_switcher', 9999);

function as_perf_dequeue_translatepress_switcher() {
    wp_dequeue_style('trp-language-switcher-v2');
    wp_deregister_style('trp-language-switcher-v2');
    wp_dequeue_script('trp-language-switcher-js-v2-js');
    wp_deregister_script('trp-language-switcher-js-v2-js');
}

add_action('init', 'as_perf_disable_wp_bloat');

function as_perf_disable_wp_bloat() {

    remove_action('wp_head', 'print_emoji_detection_script', 7);

    remove_action('wp_print_styles', 'print_emoji_styles');

    remove_action('admin_print_styles', 'print_emoji_styles');

    remove_action('admin_print_scripts', 'print_emoji_detection_script');

    remove_action('wp_head', 'wp_generator');

    add_filter('emoji_svg_url', '__return_false');

}



add_action('wp_head', 'as_perf_hide_translatepress_switcher_css', 3);

function as_perf_hide_translatepress_switcher_css() {
    echo "<style id=\"as-hide-trp-switcher\">#trp-floater-language-switcher.trp-floating-switcher.trp-language-switcher.trp-floating-switcher{display:none!important;visibility:hidden!important;pointer-events:none!important}</style>\n";
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

    if (is_admin() || is_admin_bar_showing() || !in_array($handle, as_perf_defer_css_handles(), true)) {

        return $html;

    }

    $href = esc_url($href);

    $media = esc_attr($media ?: 'all');

    return "<link rel='preload' href='{$href}' as='style' onload=\"this.onload=null;this.rel='stylesheet'\" media='{$media}'>\n"

        . "<noscript><link rel='stylesheet' href='{$href}' media='{$media}'></noscript>\n";

}



add_action('wp_enqueue_scripts', 'as_perf_ensure_admin_bar_styles', 1000);

function as_perf_ensure_admin_bar_styles() {

    if (!is_admin_bar_showing()) {

        return;

    }

    wp_enqueue_style('dashicons');

    wp_enqueue_style('admin-bar');

}



add_action('wp_enqueue_scripts', 'as_perf_trim_and_defer_assets', 999);

function as_perf_trim_and_defer_assets() {

    // Admin bar (usuário logado) depende de dashicons + admin-bar.css no front.
    if (is_front_page() && !is_admin_bar_showing()) {

        wp_dequeue_style('dashicons');

        wp_deregister_style('dashicons');

        wp_dequeue_script('wp-embed');

    }



    if (!function_exists('wp_script_add_data')) {

        return;

    }



    $wp_scripts = wp_scripts();

    if (!$wp_scripts) {

        return;

    }



    foreach (as_perf_defer_script_handles() as $handle) {

        if (wp_script_is($handle, 'enqueued')) {

            wp_script_add_data($handle, 'strategy', 'defer');

        }

    }



    if (!is_front_page()) {

        return;

    }



    foreach ($wp_scripts->queue as $handle) {

        if (strpos($handle, 'wpforms') === false) {

            continue;

        }

        wp_script_add_data($handle, 'strategy', 'defer');

    }

}



add_action('send_headers', 'as_perf_cache_headers');

function as_perf_cache_headers() {

    if (is_admin() || is_user_logged_in() || headers_sent()) {

        return;

    }

    if (is_front_page()) {

        header('Cache-Control: public, max-age=300, s-maxage=300, stale-while-revalidate=600');

        return;

    }

    header('Cache-Control: public, max-age=300, s-maxage=86400, stale-while-revalidate=604800');

}



add_action('rest_after_insert_page', 'as_perf_purge_caches_after_home_update', 20, 3);

add_action('save_post_page', 'as_perf_purge_caches_on_home_save', 20, 3);



function as_perf_purge_caches_after_home_update($post, $request, $creating) {

    if (!is_object($post) || (int) $post->ID !== AS_PERF_HOME_PAGE_ID) {

        return;

    }

    as_perf_purge_all_caches();

}



function as_perf_purge_caches_on_home_save($post_id, $post, $update) {

    if ((int) $post_id !== AS_PERF_HOME_PAGE_ID || wp_is_post_revision($post_id)) {

        return;

    }

    as_perf_purge_all_caches();

}



function as_perf_purge_all_caches() {

    if (!headers_sent()) {

        header('X-LiteSpeed-Purge: *');

        header('X-LiteSpeed-Purge: public,' . AS_PERF_ORIGIN . '/');

    }

    if (class_exists('LiteSpeed_Cache_API')) {

        LiteSpeed_Cache_API::purge_all();

    }

    if (function_exists('litespeed_purge_all')) {

        litespeed_purge_all();

    }

    do_action('litespeed_purge_all');

    if (function_exists('wp_cache_flush')) {

        wp_cache_flush();

    }

}



register_activation_hook(__FILE__, 'as_perf_cleanup_htaccess_markers');

register_deactivation_hook(__FILE__, 'as_perf_cleanup_htaccess_markers');

function as_perf_cleanup_htaccess_markers() {

    if (!function_exists('insert_with_markers')) {

        require_once ABSPATH . 'wp-admin/includes/misc.php';

    }

    $path = trailingslashit(get_home_path()) . '.htaccess';

    if (is_writable($path)) {

        insert_with_markers($path, 'AERO-SUITE-CACHE', []);

    }

    delete_option('as_perf_force_home_dynamic');

}



add_filter('wp_get_attachment_image_attributes', 'as_perf_lazy_below_fold', 10, 3);

function as_perf_lazy_below_fold($attr, $attachment, $size) {

    if (is_admin() || is_front_page()) {

        return $attr;

    }

    if (empty($attr['loading'])) {

        $attr['loading'] = 'lazy';

    }

    if (empty($attr['decoding'])) {

        $attr['decoding'] = 'async';

    }

    return $attr;

}


