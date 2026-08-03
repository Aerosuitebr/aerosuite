<?php
/**
 * Plugin Name: Aero Suite Marketing WhatsApp
 * Description: Modal público com QR, envio único via Evolution API, desconexão e feedback.
 * Version: 1.1.0
 * Author: Aero Suite
 */

if (!defined('ABSPATH')) {
    exit;
}

const AS_MKT_WA_API = 'https://prod.aerosuite.com.br/api/public/onboarding/marketing-whatsapp/session';
const AS_MKT_WA_REST_NAMESPACE = 'aerosuite/v1';
const AS_MKT_WA_FALLBACK = 'https://wa.me/5521990403514?text=Ol%C3%A1%21%20Quero%20agendar%20uma%20apresenta%C3%A7%C3%A3o%20da%20Aero%20Suite.';

add_action('rest_api_init', function () {
    register_rest_route(AS_MKT_WA_REST_NAMESPACE, '/marketing-whatsapp', [
        'methods' => ['GET', 'POST', 'PUT', 'DELETE'],
        'callback' => function (WP_REST_Request $request) {
            $method = $request->get_method();
            $session_key = sanitize_text_field((string) $request->get_param('sessionKey'));
            if (!preg_match('/^guest_[a-f0-9]{32}$/', $session_key)) {
                return new WP_Error('invalid_session', 'Sessão inválida.', ['status' => 400]);
            }

            $url = AS_MKT_WA_API;
            $args = [
                'method' => $method,
                'timeout' => 70,
                'redirection' => 0,
                'headers' => ['Accept' => 'application/json'],
            ];
            if ($method === 'GET' || $method === 'DELETE') {
                $url = add_query_arg('sessionKey', $session_key, $url);
            } else {
                $payload = ['sessionKey' => $session_key];
                if ($method === 'PUT') {
                    $payload['name'] = sanitize_text_field((string) $request->get_param('name'));
                    $payload['company'] = sanitize_text_field((string) $request->get_param('company'));
                    $payload['interest'] = sanitize_textarea_field((string) $request->get_param('interest'));
                }
                $args['headers']['Content-Type'] = 'application/json';
                $args['body'] = wp_json_encode($payload);
            }

            $response = wp_remote_request($url, $args);
            if (is_wp_error($response)) {
                return new WP_Error('service_unavailable', 'Contato temporariamente indisponível.', ['status' => 503]);
            }
            $status = wp_remote_retrieve_response_code($response);
            $data = json_decode(wp_remote_retrieve_body($response), true);
            if (!is_array($data)) {
                $data = ['error' => 'Contato temporariamente indisponível.'];
            }
            return new WP_REST_Response($data, $status >= 100 ? $status : 502);
        },
        'permission_callback' => '__return_true',
    ]);
});

add_action('wp_footer', function () {
    if (is_admin()) {
        return;
    }
    ?>
    <div id="as-wa-modal" class="as-wa-modal" hidden>
      <div class="as-wa-modal__backdrop" data-as-wa-close></div>
      <section class="as-wa-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="as-wa-title">
        <button class="as-wa-modal__close" type="button" data-as-wa-close aria-label="Fechar e desconectar">×</button>
        <p class="as-wa-modal__eyebrow">Contato seguro pelo seu WhatsApp</p>
        <h2 id="as-wa-title">Conecte, envie e desconecte</h2>
        <p class="as-wa-modal__intro">Escaneie o QR Code. A mensagem será enviada somente ao WhatsApp comercial da Aero Suite e a sessão será removida logo depois.</p>

        <div id="as-wa-form">
          <label>Seu nome <input id="as-wa-name" type="text" maxlength="100" autocomplete="name" required></label>
          <label>Empresa <input id="as-wa-company" type="text" maxlength="120" autocomplete="organization"></label>
          <label>O que deseja ver na apresentação?
            <textarea id="as-wa-interest" maxlength="500" rows="3" placeholder="Estoque, e-commerce, RFI/RFQ/RFP, MRO..."></textarea>
          </label>
          <button id="as-wa-connect" class="as-wa-primary" type="button">Gerar QR Code</button>
        </div>

        <div id="as-wa-session" hidden>
          <p id="as-wa-status" class="as-wa-modal__status" aria-live="polite">Preparando sessão segura…</p>
          <img id="as-wa-qr" class="as-wa-modal__qr" alt="QR Code para conectar o WhatsApp" hidden>
          <p class="as-wa-modal__hint">WhatsApp → Aparelhos conectados → Conectar um aparelho</p>
          <button id="as-wa-send" class="as-wa-primary" type="button" disabled>Enviar e desconectar</button>
        </div>

        <div id="as-wa-feedback" hidden>
          <p class="as-wa-modal__success">Mensagem enviada e sessão desconectada.</p>
          <p>A experiência funcionou bem?</p>
          <div class="as-wa-feedback__buttons">
            <button type="button" data-as-wa-feedback="positive">👍 Sim</button>
            <button type="button" data-as-wa-feedback="negative">👎 Preciso de ajuda</button>
          </div>
        </div>

        <p id="as-wa-error" class="as-wa-modal__error" role="alert"></p>
        <a class="as-wa-modal__fallback" href="<?php echo esc_url(AS_MKT_WA_FALLBACK); ?>" target="_blank" rel="noopener noreferrer">Abrir WhatsApp sem QR Code</a>
      </section>
    </div>
    <style>
      .as-wa-modal[hidden]{display:none}.as-wa-modal{position:fixed;inset:0;z-index:999999;display:grid;place-items:center;padding:18px}
      .as-wa-modal__backdrop{position:absolute;inset:0;background:rgba(2,12,27,.72);backdrop-filter:blur(5px)}
      .as-wa-modal__dialog{position:relative;width:min(520px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:24px;padding:28px;box-shadow:0 30px 80px rgba(0,0,0,.32);color:#10243d}
      .as-wa-modal__close{position:absolute;right:14px;top:12px;border:0;background:#eef3f7;border-radius:999px;width:38px;height:38px;font-size:25px;cursor:pointer}
      .as-wa-modal__eyebrow{margin:0 44px 5px 0;color:#087f5b;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.11em}
      .as-wa-modal h2{margin:.15em 42px .4em 0;font-size:clamp(24px,5vw,34px)}.as-wa-modal__intro{line-height:1.55;color:#52657b}
      .as-wa-modal label{display:grid;gap:6px;margin:14px 0;font-weight:700;font-size:14px}
      .as-wa-modal input,.as-wa-modal textarea{width:100%;box-sizing:border-box;border:1px solid #c9d5df;border-radius:12px;padding:12px;font:inherit}
      .as-wa-primary{width:100%;border:0;border-radius:13px;padding:14px 18px;background:#0b8f64;color:#fff;font-weight:800;cursor:pointer}
      .as-wa-primary:disabled{opacity:.5;cursor:not-allowed}.as-wa-modal__status{text-align:center;font-weight:700}
      .as-wa-modal__qr{display:block;width:230px;height:230px;object-fit:contain;margin:12px auto;border:1px solid #d8e1e8;border-radius:18px;padding:8px}
      .as-wa-modal__hint{text-align:center;color:#68798b;font-size:13px}.as-wa-modal__error{color:#b42318;font-weight:700}
      .as-wa-modal__fallback{display:block;text-align:center;margin-top:14px;color:#315574;font-weight:700}
      .as-wa-modal__success{padding:14px;border-radius:14px;background:#e9fbf3;color:#087f5b;font-weight:800}
      .as-wa-feedback__buttons{display:flex;gap:10px}.as-wa-feedback__buttons button{flex:1;padding:12px;border:1px solid #c9d5df;border-radius:12px;background:#fff;cursor:pointer}
      @media(max-width:520px){.as-wa-modal{align-items:end;padding:0}.as-wa-modal__dialog{border-radius:24px 24px 0 0;padding:23px}}
    </style>
    <script>
    (() => {
      const api = <?php echo wp_json_encode(rest_url(AS_MKT_WA_REST_NAMESPACE . '/marketing-whatsapp')); ?>;
      const modal = document.getElementById('as-wa-modal');
      if (!modal) return;
      const form = document.getElementById('as-wa-form');
      const session = document.getElementById('as-wa-session');
      const feedback = document.getElementById('as-wa-feedback');
      const errorBox = document.getElementById('as-wa-error');
      const statusBox = document.getElementById('as-wa-status');
      const qr = document.getElementById('as-wa-qr');
      const send = document.getElementById('as-wa-send');
      let poll = null;
      let sessionKey = '';

      const json = async (url, options = {}) => {
        const response = await fetch(url, {cache:'no-store', ...options});
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Não foi possível conectar ao WhatsApp.');
        return data;
      };
      const getKey = () => {
        let key = sessionStorage.getItem('as_marketing_whatsapp_session');
        if (!key) {
          key = 'guest_' + crypto.randomUUID().replaceAll('-', '');
          sessionStorage.setItem('as_marketing_whatsapp_session', key);
        }
        return key;
      };
      const setError = message => { errorBox.textContent = message || ''; };
      const renderStatus = data => {
        const connected = String(data.state || '').toLowerCase() === 'open';
        statusBox.textContent = connected ? 'WhatsApp conectado. Pode enviar agora.' : 'Escaneie o QR Code para conectar.';
        send.disabled = !connected;
        if (data.qr) {
          qr.src = data.qr.startsWith('data:') ? data.qr : 'data:image/png;base64,' + data.qr;
          qr.hidden = false;
        } else if (connected) {
          qr.hidden = true;
        }
      };
      const refresh = async () => {
        try { renderStatus(await json(api + '?sessionKey=' + encodeURIComponent(sessionKey))); }
        catch (e) { setError(e.message); }
      };
      const disconnect = async () => {
        if (poll) clearInterval(poll);
        poll = null;
        if (!sessionKey) return;
        try { await json(api + '?sessionKey=' + encodeURIComponent(sessionKey), {method:'DELETE'}); } catch (_) {}
      };
      const close = async () => {
        await disconnect();
        modal.hidden = true;
        document.body.style.overflow = '';
      };
      const open = event => {
        event.preventDefault();
        modal.hidden = false;
        form.hidden = false; session.hidden = true; feedback.hidden = true;
        setError(''); document.body.style.overflow = 'hidden';
        document.getElementById('as-wa-name').focus();
      };
      document.addEventListener('click', event => {
        const link = event.target.closest('a.as-btn-whatsapp,a.as-track-whatsapp,a[href*="wa.me/"],a[href*="whatsapp.com/send"]');
        if (link && !modal.contains(link)) open(event);
      });
      modal.querySelectorAll('[data-as-wa-close]').forEach(node => node.addEventListener('click', close));
      document.getElementById('as-wa-connect').addEventListener('click', async () => {
        const name = document.getElementById('as-wa-name').value.trim();
        if (name.length < 2) { setError('Informe seu nome.'); return; }
        setError(''); sessionKey = getKey(); form.hidden = true; session.hidden = false;
        try {
          renderStatus(await json(api, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionKey})}));
          poll = setInterval(refresh, 2500);
        } catch (e) { setError(e.message); form.hidden = false; session.hidden = true; }
      });
      send.addEventListener('click', async () => {
        send.disabled = true; statusBox.textContent = 'Enviando e desconectando…'; setError('');
        try {
          const data = await json(api, {
            method:'PUT',headers:{'Content-Type':'application/json'},
            body:JSON.stringify({
              sessionKey,
              name:document.getElementById('as-wa-name').value.trim(),
              company:document.getElementById('as-wa-company').value.trim(),
              interest:document.getElementById('as-wa-interest').value.trim()
            })
          });
          if (!data.sent) throw new Error(data.error || 'Não foi possível enviar.');
          if (poll) clearInterval(poll); poll = null; session.hidden = true; feedback.hidden = false;
          sessionStorage.removeItem('as_marketing_whatsapp_session');
        } catch (e) { setError(e.message); send.disabled = false; }
      });
      modal.querySelectorAll('[data-as-wa-feedback]').forEach(button => button.addEventListener('click', () => {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({event:'whatsapp_contact_feedback',rating:button.dataset.asWaFeedback});
        if (button.dataset.asWaFeedback === 'negative') {
          window.location.href = <?php echo wp_json_encode(AS_MKT_WA_FALLBACK); ?>;
        } else {
          modal.hidden = true; document.body.style.overflow = '';
        }
      }));
    })();
    </script>
    <?php
}, 99);
