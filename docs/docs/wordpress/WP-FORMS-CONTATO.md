# Formulário de contato (WPForms #12) — troubleshooting

## Sintoma: clicar em **Enviar** e “nada acontece”

### Confirmado (jun/2026)

Pedido `POST …/wp-admin/admin-ajax.php` retorna **HTTP 500** com corpo:

> Há um erro crítico no seu site.

Isso é **erro fatal PHP** durante o processamento do WPForms — não é GA4, cache do navegador nem o botão em si. O GA4 (`collect` com `G-GLP0ELSN4V`) pode funcionar em paralelo.

Script local de reprodução: `node run-wpforms-diagnose.mjs`

### Diagnóstico rápido (F12)

1. **Rede** → filtrar `admin-ajax.php` → clicar **Enviar**.
2. Interpretação:
   - **Nenhum pedido** → validação HTML/JS bloqueou (veja **Consola**).
   - **200 com erro no corpo** → nonce/cache ou anti-spam (ver abaixo).
   - **500** → **erro crítico WordPress** — ver secção “Corrigir 500” abaixo.

### Causas frequentes neste site

| Causa | O que fazer |
|--------|-------------|
| **Cache (Cloudflare / plugin)** | Purgar cache; não cachear `/contato/`; recarregar com Ctrl+Shift+R. |
| **Nonce WPForms expirado** | Mesmo que acima; em WPForms 1.9.1.6+ deve aparecer mensagem de erro. |
| **Honeypot (campo 3)** | Autofill pode preencher o campo oculto → anti-spam rejeita em silêncio. Script `aerosuite-wpforms-helper.js` limpa o honeypot. |
| **Telefone inválido** | Máscara BR: mínimo 10 dígitos com DDD. |
| **Confirmação WPForms** | WP Admin → WPForms → Formulários → #12 → **Configurações → Confirmações**: preferir mensagem na mesma página ou redirect para `/obrigado/` (não conflitar com redirect do `aerosuite-analytics.js`). |

### Corrigir HTTP 500 (prioridade)

1. **Ver a linha exata do erro** (escolha uma):
   - **Hospedagem** → Logs de erro PHP / `error_log` no horário do envio.
   - **wp-config.php** (FTP/arquivo):
     ```php
     define('WP_DEBUG', true);
     define('WP_DEBUG_LOG', true);
     define('WP_DEBUG_DISPLAY', false);
     ```
     Reproduza o envio → leia `wp-content/debug.log`.
2. **WPForms → formulário #12 → Configurações → Notificações**: desative temporariamente o e-mail de notificação e teste de novo.
   - Se passar a funcionar → configure **WP Mail SMTP** (teste de envio em *WP Mail SMTP → Configurações*).
3. **Plugins → Atualizar** WPForms Lite e WP Mail SMTP (há **6 atualizações** pendentes no painel).
4. **Isolar conflito**: desative por 2 min (teste entre cada um) **Sugar Calendar**, **MonsterInsights**, **Complianz** — só para testar; reative depois.
5. **PHP**: na hospedagem, confirme extensões **mbstring**, **xml**, **curl**, **mysqli** (ou **pdo_mysql**) ativas — falta de `xml`/`mbstring` costuma quebrar AJAX do WPForms em PHP 8.2+.

### WP Admin — checklist

1. **WPForms → All Forms →** formulário usado na página Contato (ID **12**).
2. **Settings → General**: AJAX ativado (padrão).
3. **Settings → Spam Protection and Security**: testar desativar **Modern Anti-Spam** temporariamente se cache agressivo.
4. **Settings → Notifications**: e-mail de destino válido.
5. **Entries**: ver se entradas chegam mesmo sem e-mail.
6. **Sugestão de e-mail (Mailcheck)**: se aparecer “Você quis dizer … .com.au?”, ignore ou desative sugestão em WPForms → *Settings* (não causa 500, mas confunde).

### Deploy das correções no repositório

```bash
cd docs/wordpress
node build-gaps-deploy.mjs
node run-gaps-deploy.mjs
```

Inclui: `aerosuite-wpforms-helper.js`, máscara de telefone sem `setCustomValidity`, CSS de erro visível, remoção de scripts legados duplicados no footer.

---

*Junho/2026*
