-- Bling multi-tenant: companyId por conexão, mapeamento contato↔cliente, fila de retentativa.

ALTER TABLE tenant_bling_connection
    ADD COLUMN bling_company_id VARCHAR(64) NULL AFTER bling_company_name;

CREATE UNIQUE INDEX uk_tenant_bling_company_id
    ON tenant_bling_connection (bling_company_id);

CREATE TABLE cliente_proposta_bling_map (
    id                  BIGINT       NOT NULL AUTO_INCREMENT,
    tenant_id           BIGINT       NOT NULL,
    cliente_proposta_id INT          NOT NULL,
    bling_contato_id    BIGINT       NOT NULL,
    last_sync_at        DATETIME(6)  NULL,
    last_sync_source    VARCHAR(32)  NULL,
    created_at          DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT fk_cpblm_tenant FOREIGN KEY (tenant_id) REFERENCES tenant (id) ON DELETE CASCADE,
    CONSTRAINT fk_cpblm_cliente FOREIGN KEY (cliente_proposta_id) REFERENCES cliente_proposta (id) ON DELETE CASCADE,
    CONSTRAINT uk_cpblm_tenant_bling UNIQUE (tenant_id, bling_contato_id),
    CONSTRAINT uk_cpblm_tenant_cliente UNIQUE (tenant_id, cliente_proposta_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE INDEX idx_cpblm_tenant ON cliente_proposta_bling_map (tenant_id);

CREATE TABLE bling_sync_job (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    tenant_id       BIGINT       NULL,
    job_type        VARCHAR(64)  NOT NULL,
    payload_json    MEDIUMTEXT   NOT NULL,
    status          VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    attempts        INT          NOT NULL DEFAULT 0,
    max_attempts    INT          NOT NULL DEFAULT 5,
    next_run_at     DATETIME(6)  NOT NULL,
    last_error      VARCHAR(1000) NULL,
    source_event_id BIGINT       NULL,
    created_at      DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    processed_at    DATETIME(6)  NULL,
    PRIMARY KEY (id),
    INDEX idx_bling_sync_job_pending (status, next_run_at),
    INDEX idx_bling_sync_job_tenant (tenant_id, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

ALTER TABLE bling_webhook_event
    ADD COLUMN processing_status VARCHAR(20) NOT NULL DEFAULT 'QUEUED' AFTER signature_ok;
