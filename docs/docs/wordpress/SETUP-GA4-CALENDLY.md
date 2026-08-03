# GA4 e Calendly — Aero Suite (site WordPress)

## O que você precisa criar (uma vez)

### Google Analytics 4

1. Acesse [analytics.google.com](https://analytics.google.com) com a conta Google da empresa.
2. **Administrador** → **Criar propriedade** → nome: `Aero Suite — Site`.
3. Fluxo de dados: **Web** → URL: `https://aerosuite.com.br`.
4. Copie o **ID de métrica** (formato `G-XXXXXXXXXX`).

### Calendly

1. Conta em [calendly.com](https://calendly.com) (plano gratuito serve para começar).
2. Crie um evento, por exemplo **Demonstração Aero Suite** (30 min, videoconferência).
3. **Copiar link** do evento (URL completa `https://calendly.com/SEU-USUARIO/nome-do-evento`).

---

## Configurar no projeto (local)

Na pasta `docs/wordpress/`:

```bash
node setup-marketing-ids.mjs --ga4 G-SEU_ID --calendly https://calendly.com/SEU-USUARIO/demo-aero-suite
```

Isso grava `aerosuite-site-secrets.local.mjs` (ignorado pelo Git) e regenera `.deploy-marketing-once.js`.

Alternativa manual:

```bash
cp aerosuite-site-secrets.local.mjs.example aerosuite-site-secrets.local.mjs
# edite os dois campos e depois:
node build-marketing-deploy.mjs
```

---

## Publicar no WordPress

1. Servir a pasta: `npx --yes serve docs/wordpress -p 8765` (ou o servidor que já usa no deploy).
2. Login em `https://aerosuite.com.br/wp-admin/`.
3. Console do navegador (F12):

```js
fetch('http://127.0.0.1:8765/.deploy-marketing-once.js')
  .then((r) => r.text())
  .then((code) => eval(code));
```

4. Aguarde a mensagem de sucesso no console.

---

## Verificar

| Item | Como |
|------|------|
| GA4 | DevTools → Rede → filtro `gtag` ou `collect`; ou GA4 → Relatórios em tempo real |
| Eventos | Clique em **Agendar demonstração** / WhatsApp → eventos `cta_demo` / `cta_whatsapp` |
| Calendly | Página `/contato/` — widget de agenda ou fallback formulário + WhatsApp |

Sem IDs reais, o site continua funcionando: formulário WPForms + WhatsApp, sem script do Google nem widget Calendly.
