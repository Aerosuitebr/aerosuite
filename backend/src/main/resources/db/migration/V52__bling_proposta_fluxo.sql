-- Rastreio do fluxo proposta → pedido Bling → OS → NF-e.

CREATE TABLE bling_proposta_fluxo_evento (
    id                    BIGINT       NOT NULL AUTO_INCREMENT,
    tenant_id             BIGINT       NOT NULL,
    proposta_comercial_id BIGINT       NOT NULL,
    os_id                 BIGINT       NULL,
    etapa                 VARCHAR(40)  NOT NULL,
    status                VARCHAR(20)  NOT NULL,
    mensagem              VARCHAR(500) NULL,
    detalhe               TEXT         NULL,
    created_at            DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT fk_bpfe_tenant FOREIGN KEY (tenant_id) REFERENCES tenant (id) ON DELETE CASCADE,
    CONSTRAINT fk_bpfe_proposta FOREIGN KEY (proposta_comercial_id) REFERENCES proposta_comercial (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE INDEX idx_bpfe_tenant_proposta ON bling_proposta_fluxo_evento (tenant_id, proposta_comercial_id, created_at);
