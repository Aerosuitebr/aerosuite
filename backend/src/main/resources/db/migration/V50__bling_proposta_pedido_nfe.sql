-- Bling: vínculo proposta ↔ pedido de venda e registro de NF-e.

CREATE TABLE proposta_bling_pedido (
    id                    BIGINT       NOT NULL AUTO_INCREMENT,
    tenant_id             BIGINT       NOT NULL,
    proposta_comercial_id BIGINT       NOT NULL,
    bling_pedido_id       BIGINT       NOT NULL,
    bling_pedido_numero   VARCHAR(40)  NULL,
    bling_situacao        VARCHAR(80)  NULL,
    pushed_at             DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    pushed_by_usuario_id  INT          NULL,
    last_sync_at          DATETIME(6)  NULL,
    last_sync_source      VARCHAR(32)  NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_pbp_tenant FOREIGN KEY (tenant_id) REFERENCES tenant (id) ON DELETE CASCADE,
    CONSTRAINT fk_pbp_proposta FOREIGN KEY (proposta_comercial_id) REFERENCES proposta_comercial (id) ON DELETE CASCADE,
    CONSTRAINT uk_pbp_tenant_proposta UNIQUE (tenant_id, proposta_comercial_id),
    CONSTRAINT uk_pbp_tenant_pedido UNIQUE (tenant_id, bling_pedido_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE INDEX idx_pbp_tenant ON proposta_bling_pedido (tenant_id);

CREATE TABLE bling_nfe_registro (
    id                    BIGINT       NOT NULL AUTO_INCREMENT,
    tenant_id             BIGINT       NOT NULL,
    proposta_comercial_id BIGINT       NULL,
    bling_pedido_id       BIGINT       NULL,
    bling_nfe_id          BIGINT       NOT NULL,
    numero                VARCHAR(40)  NULL,
    chave_acesso          VARCHAR(44)  NULL,
    situacao              VARCHAR(80)  NULL,
    danfe_url             VARCHAR(500) NULL,
    emitted_at            DATETIME(6)  NULL,
    payload_resumo        VARCHAR(1000) NULL,
    created_at            DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at            DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT fk_bnr_tenant FOREIGN KEY (tenant_id) REFERENCES tenant (id) ON DELETE CASCADE,
    CONSTRAINT uk_bnr_tenant_nfe UNIQUE (tenant_id, bling_nfe_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE INDEX idx_bnr_tenant_proposta ON bling_nfe_registro (tenant_id, proposta_comercial_id);
