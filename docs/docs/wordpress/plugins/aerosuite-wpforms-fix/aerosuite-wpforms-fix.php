<?php

/**

 * Plugin Name: Aero Suite WPForms Fix

 * Description: Memoria 256M e form #12 reparado (JSON corrompido no banco).

 * Version: 1.1.1

 * Author: Aero Suite

 */



if (!defined('ABSPATH')) {

    exit;

}



@ini_set('memory_limit', '256M');



function as_wpf_form_12_fields() {

    return [

        '1' => ['id' => '1', 'type' => 'text', 'label' => 'Nome', 'format' => 'simple', 'required' => '1', 'size' => 'large', 'default_value' => '', 'css' => ''],

        '2' => ['id' => '2', 'type' => 'email', 'label' => 'E-mail', 'required' => '1', 'size' => 'large', 'default_value' => '', 'css' => ''],

        '5' => ['id' => '5', 'type' => 'text', 'label' => 'Empresa', 'required' => '0', 'size' => 'medium', 'default_value' => '', 'css' => ''],

        '7' => ['id' => '7', 'type' => 'text', 'label' => 'Telefone', 'required' => '0', 'size' => 'medium', 'default_value' => '', 'css' => ''],

        '3' => ['id' => '3', 'type' => 'text', 'label' => 'Leave this field empty', 'required' => '0', 'label_hide' => '1', 'default_value' => '', 'css' => '', 'meta' => ['invisible' => '1']],

        '8' => ['id' => '8', 'type' => 'textarea', 'label' => 'Mensagem', 'required' => '0', 'size' => 'medium', 'default_value' => '', 'css' => ''],

    ];

}



function as_wpf_repair_form_12($form_data) {

    if (empty($form_data['id']) || (int) $form_data['id'] !== 12) {

        return $form_data;

    }

    $form_data['fields'] = as_wpf_form_12_fields();

    if (empty($form_data['settings']) || !is_array($form_data['settings'])) {

        $form_data['settings'] = [];

    }

    $form_data['settings']['notification_enable'] = '1';

    $form_data['settings']['notifications']       = [

        '1' => [

            'enable'         => '1',

            'email'          => 'contato@aerosuite.com.br',

            'subject'        => 'Novo contato — Aero Suite',

            'sender_name'    => 'Aero Suite',

            'sender_address' => '{admin_email}',

            'replyto'        => '{field_id="2"}',

            'message'        => '{all_fields}',

        ],

    ];

    $form_data['settings']['antispam']      = '0';

    $form_data['settings']['ajax_submit']   = '1';

    $form_data['settings']['confirmations'] = [

        '1' => [

            'type'           => 'message',

            'message'        => '<p>Obrigado! Recebemos sua mensagem e retornaremos em até um dia útil.</p>',

            'message_scroll' => '1',

        ],

    ];

    return $form_data;

}



add_filter('wpforms_frontend_form_data', 'as_wpf_repair_form_12', 999);

add_filter('wpforms_form_data', 'as_wpf_repair_form_12', 999);



add_action('template_redirect', static function () {

    if (function_exists('is_page') && is_page('contato')) {

        if (!defined('DONOTCACHEPAGE')) {

            define('DONOTCACHEPAGE', true);

        }

        nocache_headers();

    }

}, 0);


