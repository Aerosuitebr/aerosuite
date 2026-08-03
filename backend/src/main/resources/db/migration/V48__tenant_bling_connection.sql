-- Conexão OAuth Bling por tenant (tokens criptografados em repouso).

CREATE TABLE tenant_bling_connection (
    tenant_id                 BIGINT       NOT NULL,
    access_token_enc          TEXT         NOT NULL,
    refresh_token_enc         TEXT         NOT NULL,
    token_expires_at          DATETIME(6)  NOT NULL,
    bling_company_name        VARCHAR(255) NULL,
    connected_at              DATETIME(6)  NOT NULL,
    connected_by_usuario_id   INT          NULL,
    updated_at                DATETIME(6)  NOT NULL,
    PRIMARY KEY (tenant_id),
    CONSTRAINT fk_tenant_bling_connection_tenant
        FOREIGN KEY (tenant_id) REFERENCES tenant (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE bling_oauth_state (
    state_token   VARCHAR(64)  NOT NULL,
    tenant_id     BIGINT       NOT NULL,
    usuario_id    INT          NOT NULL,
    expires_at    DATETIME(6)  NOT NULL,
    created_at    DATETIME(6)  NOT NULL,
    PRIMARY KEY (state_token),
    INDEX idx_bling_oauth_state_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
