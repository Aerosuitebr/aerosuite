# Billing — Pagar.me

## Estado atual (Jun/2026)

| Capacidade | Estado |
|------------|--------|
| Seleção de provedor (`AERO_SUITE_BILLING_PROVIDER=pagarme`) | Implementado |
| Validação de chaves (`AERO_SUITE_PAGARME_SECRET_KEY`, `AERO_SUITE_PAGARME_PUBLIC_KEY`) | Implementado |
| `GET /api/billing/status` | Funciona (mostra `provedor=pagarme`) |
| `POST /api/billing/checkout-session` | **Implementado** — payment link de assinatura (API v5) |
| `POST /api/billing/webhooks/pagarme` | **Implementado** — HMAC + idempotência (`billing_webhook_event`) |
| Flyway `V62` — `pagarme_order_id`, `pagarme_plan_id` | Implementado |

## Variáveis de ambiente

```env
AERO_SUITE_BILLING_PROVIDER=pagarme
AERO_SUITE_PAGARME_SECRET_KEY=sk_test_...
AERO_SUITE_PAGARME_PUBLIC_KEY=pk_test_...
AERO_SUITE_PAGARME_WEBHOOK_SECRET=whsec_...   # opcional; fallback = secret-key
AERO_SUITE_PAGARME_BASE_URL=https://sdx-api.pagar.me/core/v5   # sandbox; produção = https://api.pagar.me/core/v5
AERO_SUITE_PAGARME_PLAN_ID=plan_...            # opcional; se omitido, cria plano automaticamente
AERO_SUITE_PAGARME_AMOUNT_CENTS=9900
AERO_SUITE_PAGARME_PLAN_NAME=Aero Suite Professional
```

Webhook no painel Pagar.me: `https://<api>/api/billing/webhooks/pagarme`

Eventos tratados: `order.paid`, `charge.paid`, `subscription.created`, `checkout.closed`, `invoice.paid`, `subscription.canceled`, `charge.payment_failed`.

## Testes automatizados

- **Unitário:** `PagarmeBillingGatewayTest`, `PagarmeApiClientTest`, `BillingGatewaySelectorTest`
- **Smoke HTTP:** `scripts/test/api-p3-smoke.ps1`

## Homologação

1. Chaves de teste no dashboard Pagar.me.
2. `AERO_SUITE_BILLING_PROVIDER=pagarme` + variáveis acima.
3. Checkout em **Organizações / Billing** → deve retornar URL `checkout.pagar.me`.
4. Configurar webhook e pagar com cartão de teste `4000000000000010`.
5. Confirmar `tenant_billing.status=active` e `plano_codigo=professional`.
