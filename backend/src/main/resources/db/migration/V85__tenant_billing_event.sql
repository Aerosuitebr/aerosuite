-- Histórico de cobrança por tenant (Centro de Fiscalização)
CREATE TABLE tenant_billing_event (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    detail VARCHAR(512),
    status VARCHAR(32),
    amount_cents BIGINT,
    operator_email VARCHAR(255),
    created_at DATETIME(6) NOT NULL,
    INDEX idx_tbe_tenant_created (tenant_id, created_at DESC)
);
