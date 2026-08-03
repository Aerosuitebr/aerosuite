# Stripe em produção

Checklist para ativar **checkout e webhooks** reais (substituir `AERO_SUITE_BILLING_PROVIDER=mock`).

Relacionado: [DEPLOY-PRODUCAO.md](./DEPLOY-PRODUCAO.md), [BILLING-PAGARME.md](./BILLING-PAGARME.md), [IMPLEMENTACAO-PLANO-SAAS.md](./IMPLEMENTACAO-PLANO-SAAS.md).

---

## 1. Conta e produto

1. Criar conta Stripe em modo **Live**.
2. Criar **Product** + **Price** recorrente (plano SaaS).
3. Anotar o `price_…` → `AERO_SUITE_STRIPE_PRICE_ID`.

---

## 2. Chaves e variáveis (`.env.production`)

| Variável | Descrição |
|----------|-----------|
| `AERO_SUITE_BILLING_PROVIDER` | `stripe` |
| `AERO_SUITE_STRIPE_SECRET_KEY` | Secret key **live** (`sk_live_…`) |
| `AERO_SUITE_STRIPE_WEBHOOK_SECRET` | Signing secret do endpoint (`whsec_…`) |
| `AERO_SUITE_STRIPE_PRICE_ID` | Price ID do plano |
| `AERO_SUITE_STRIPE_SUCCESS_URL` | Ex.: `https://app.seudominio.com/organizacoes?billing=ok` |
| `AERO_SUITE_STRIPE_CANCEL_URL` | Ex.: `https://app.seudominio.com/organizacoes?billing=cancel` |
| `FRONTEND_URL` | Mesma origem pública usada nos redirects |

Copiar de [.env.production.example](../.env.production.example). **Não** commitar valores reais.

Propriedades Quarkus (mapeamento): `aero.suite.billing.stripe.*` em `application.properties`.

---

## 3. Webhook no dashboard Stripe

1. **Developers → Webhooks → Add endpoint**
2. URL pública (via Cloudflare Tunnel ou load balancer):

   `https://api.seudominio.com/api/billing/stripe/webhook`

3. Eventos mínimos sugeridos:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`

4. Copiar **Signing secret** → `AERO_SUITE_STRIPE_WEBHOOK_SECRET`.

5. Em desenvolvimento local: `stripe listen --forward-to localhost:8080/api/billing/stripe/webhook` e usar o `whsec_` temporário.

---

## 4. Smoke pós-configuração

```bash
# API responde (sem expor secret)
curl -sf https://api.seudominio.com/q/health

# Checkout (autenticado como admin do tenant) — UI Organizações / billing
# ou POST /api/billing/checkout conforme implementação atual
```

- [ ] Sessão de checkout abre no browser (URL Stripe).
- [ ] Pagamento de teste em **modo test** antes de live.
- [ ] Webhook recebido (logs da API sem erro de assinatura).
- [ ] Tenant com plano ativo após `checkout.session.completed`.

---

## 5. Segurança

- Rotacionar `AERO_SUITE_STRIPE_SECRET_KEY` apenas no dashboard Stripe + redeploy.
- Webhook **sempre** validado com `Stripe-Signature` (já no `StripeBillingGateway`).
- Não expor `sk_live_` no frontend nem em repositório.

---

## 6. Rollback

- Definir `AERO_SUITE_BILLING_PROVIDER=mock` e redeploy (checkout desabilitado; dados de assinatura permanecem no BD).
- Cancelar assinaturas ativas manualmente no dashboard Stripe se necessário.
