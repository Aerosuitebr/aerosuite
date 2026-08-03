<?php
/**
 * Plugin Name: Aero Suite Send Homologacao Manual Once
 * Description: Envia e-mail do Manual de Homologacao na ativacao (one-shot).
 * Version: 2.0.0
 * Author: Aero Suite
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * @return array{sent: array, at: string}
 */
function aerosuite_send_homologacao_manual_email(): array
{
    $to = getenv('AEROSUITE_HOMOLOG_TO') ?: 'rafaellanottesconsultoria@gmail.com';
    $cc = getenv('AEROSUITE_HOMOLOG_CC') ?: 'timmaia@bellowscontrols.com.br, wellemlyra@gmail.com';

    $subject = '[Aero Suite] ⚠ NOVA VERSÃO v2.0 — Manual de Homologação atualizado (SGQ · Fase 7 · SMS)';

    $pluginDir = plugin_dir_path(__FILE__);
    $htmlFile = $pluginDir . 'email-body.html';
    $pdfFile = $pluginDir . 'Manual_Aero_Suite_Homologacao.pdf';

    $body = is_readable($htmlFile)
        ? file_get_contents($htmlFile)
        : '<p>Manual de Homologação Aero Suite em anexo.</p>';

    $headers = [
        'Content-Type: text/html; charset=UTF-8',
        'From: Equipe de Sistemas Aero Suite <contato@aerosuite.com.br>',
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

    update_option('aerosuite_homolog_email_sent', $payload, false);

    return $payload;
}

register_activation_hook(__FILE__, static function () {
    aerosuite_send_homologacao_manual_email();
});

add_action('admin_init', static function () {
    if (!current_user_can('manage_options') || !isset($_GET['aerosuite_homolog_status'])) {
        return;
    }
    wp_send_json(get_option('aerosuite_homolog_email_sent'));
});

add_action('wp_ajax_aerosuite_homolog_status', static function () {
    if (!current_user_can('manage_options')) {
        wp_send_json_error(['message' => 'forbidden'], 403);
    }
    wp_send_json(get_option('aerosuite_homolog_email_sent') ?: ['sent' => []]);
});
