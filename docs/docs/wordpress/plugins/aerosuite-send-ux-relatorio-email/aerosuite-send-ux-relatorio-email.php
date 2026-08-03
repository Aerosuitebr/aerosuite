<?php
/**
 * Plugin Name: Aero Suite Send UX Relatorio Once
 * Description: Envia e-mail do Relatório Executivo UX na ativação (one-shot).
 * Version: 1.0.0
 * Author: Aero Suite
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * @return array{sent: array, at: string}
 */
function aerosuite_send_ux_relatorio_email(): array
{
    $to = getenv('AEROSUITE_UX_RELATORIO_TO') ?: 'rafaellanottesconsultoria@gmail.com';
    $cc = getenv('AEROSUITE_UX_RELATORIO_CC') ?: 'timmaia@bellowscontrols.com.br, wellemlyra@gmail.com';

    $subject = '[Aero Suite] Relatório Executivo UX — 100% aderente (32/32 itens resolvidos)';

    $pluginDir = plugin_dir_path(__FILE__);
    $htmlFile = $pluginDir . 'email-body.html';
    $pdfFile = $pluginDir . 'Relatorio_Executivo_UX_AeroSuite.pdf';

    $body = is_readable($htmlFile)
        ? file_get_contents($htmlFile)
        : '<p>Relatório Executivo UX Aero Suite em anexo.</p>';

    $headers = [
        'Content-Type: text/html; charset=UTF-8',
        'From: Equipe Aero Suite <contato@aerosuite.com.br>',
        'Cc: ' . $cc,
    ];

    $attachments = is_readable($pdfFile) ? [$pdfFile] : [];

    $ok = wp_mail($to, $subject, $body, $headers, $attachments);

    $payload = [
        'at' => gmdate('c'),
        'sent' => [
            [
                'to' => $to,
                'cc' => $cc,
                'ok' => (bool) $ok,
                'pdf' => is_readable($pdfFile),
                'html' => is_readable($htmlFile),
            ],
        ],
    ];

    update_option('aerosuite_ux_relatorio_email_sent', $payload, false);

    return $payload;
}

register_activation_hook(__FILE__, static function () {
    aerosuite_send_ux_relatorio_email();
});

add_action('admin_init', static function () {
    if (!current_user_can('manage_options') || !isset($_GET['aerosuite_ux_relatorio_status'])) {
        return;
    }
    wp_send_json(get_option('aerosuite_ux_relatorio_email_sent'));
});

add_action('wp_ajax_aerosuite_ux_relatorio_status', static function () {
    if (!current_user_can('manage_options')) {
        wp_send_json_error(['message' => 'forbidden'], 403);
    }
    wp_send_json(get_option('aerosuite_ux_relatorio_email_sent') ?: ['sent' => []]);
});
