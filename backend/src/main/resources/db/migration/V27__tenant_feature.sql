-- Feature flags finas por organização (customização sem fork de código).

CREATE TABLE tenant_feature (
    tenant_id           BIGINT       NOT NULL,
    feature_code        VARCHAR(128) NOT NULL,
    enabled             TINYINT(1)   NOT NULL DEFAULT 1,
    config_json         JSON         NULL,
    updated_at          DATETIME(6)  NULL,
    updated_by_usuario_id INT        NULL,
    PRIMARY KEY (tenant_id, feature_code),
    CONSTRAINT fk_tenant_feature_tenant
        FOREIGN KEY (tenant_id) REFERENCES tenant (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE INDEX idx_tenant_feature_tenant_enabled ON tenant_feature (tenant_id, enabled);
