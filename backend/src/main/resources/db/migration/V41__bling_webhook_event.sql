-- P5.5 — eventos recebidos via webhook Bling (idempotência por event_id).

CREATE TABLE bling_webhook_event (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id       BIGINT       NOT NULL DEFAULT 1,
    event_id        VARCHAR(120) NOT NULL,
    event_type      VARCHAR(80)  NOT NULL,
    resource_id     VARCHAR(80)  NULL,
    payload_json    MEDIUMTEXT   NOT NULL,
    signature_ok    TINYINT(1)   NOT NULL DEFAULT 0,
    processed_at    DATETIME     NULL,
    process_note    VARCHAR(500) NULL,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_bling_webhook_event_id UNIQUE (event_id)
);

CREATE INDEX idx_bling_webhook_tenant_created ON bling_webhook_event (tenant_id, created_at DESC);
