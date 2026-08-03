<?php

/**

 * Plugin Name: Aero Suite Send Auth Emails Once

 * Description: Envia e-mails de autorização portfólio na ativação (one-shot).

 * Version: 1.1.0

 * Author: Aero Suite

 */

if (!defined('ABSPATH')) {

    exit;

}



/**

 * @return array{sent: list<array{to: string, cc: string, ok: bool}>, at: string}

 */

function aerosuite_send_portfolio_auth_emails(): array

{

    $toBellows = getenv('AEROSUITE_PORTFOLIO_BELOWS_EMAIL') ?: 'timmaia@bellowscontrols.com.br';

    $toKing    = getenv('AEROSUITE_PORTFOLIO_KING_EMAIL') ?: 'timmaia@kingdorio.com';

    $cc        = getenv('AEROSUITE_PORTFOLIO_AUTH_CC') ?: 'wellemlyra@gmail.com';



    $headers = [

        'Content-Type: text/html; charset=UTF-8',

        'From: Aero Suite <contato@aerosuite.com.br>',

        'Cc: ' . $cc,

    ];



    $bellowsBody = '<p>Olá,</p><p>Somos da <strong>Aero Suite</strong> (software de gestão para oficinas MRO). Gostaríamos de manter no site <a href="https://aerosuite.com.br">aerosuite.com.br</a> a menção à <strong>Bellows — Serviços Aeronáuticos</strong> como operação em produção, incluindo nome, logo e <a href="https://aerosuite.com.br/casos/bellows-servicos-aeronauticos/">página de caso</a>.</p><p><strong>Pedimos confirmação por escrito</strong> (resposta a este e-mail) autorizando uso do nome, marca e logo nos materiais do site.</p><p>Atenciosamente,<br>Aero Suite<br>contato@aerosuite.com.br</p>';



    $kingBody = '<p>Olá,</p><p>Somos da <strong>Aero Suite</strong>. Gostaríamos de manter no site a menção à <strong>King do Rio — Peças Aeronáuticas</strong>, incluindo nome, logo e <a href="https://aerosuite.com.br/casos/king-do-rio-pecas-aeronauticas/">página de caso</a>.</p><p><strong>Pedimos confirmação por escrito</strong> autorizando uso do nome, marca e logo.</p><p>Atenciosamente,<br>Aero Suite<br>contato@aerosuite.com.br</p>';



    $sent = [

        [

            'to'  => $toBellows,

            'cc'  => $cc,

            'ok'  => (bool) wp_mail(

                $toBellows,

                'Autorização de menção — Aero Suite / site institucional (Bellows)',

                $bellowsBody,

                $headers

            ),

        ],

        [

            'to'  => $toKing,

            'cc'  => $cc,

            'ok'  => (bool) wp_mail(

                $toKing,

                'Autorização de menção — Aero Suite / site institucional (King do Rio)',

                $kingBody,

                $headers

            ),

        ],

    ];



    $payload = ['at' => gmdate('c'), 'sent' => $sent];

    update_option('aerosuite_auth_emails_sent', $payload, false);



    return $payload;

}



register_activation_hook(__FILE__, static function () {

    aerosuite_send_portfolio_auth_emails();

});



add_action('admin_init', static function () {

    if (!current_user_can('manage_options') || !isset($_GET['aerosuite_auth_status'])) {

        return;

    }

    wp_send_json(get_option('aerosuite_auth_emails_sent'));

});


