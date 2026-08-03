-- Pagar.me: IDs externos de checkout + idempotência de webhooks.

ALTER TABLE tenant_billing
    ADD COLUMN pagarme_order_id VARCHAR(128) NULL AFTER external_subscription_id,
    ADD COLUMN pagarme_plan_id VARCHAR(128) NULL AFTER pagarme_order_id;

CREATE TABLE IF NOT EXISTS billing_webhook_event (
    provider VARCHAR(16) NOT NULL,
    event_id VARCHAR(128) NOT NULL,
    event_type VARCHAR(64) NULL,
    processed_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (provider, event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
