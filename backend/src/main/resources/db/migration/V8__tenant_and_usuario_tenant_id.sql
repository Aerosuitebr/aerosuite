-- Tenant lógico (SaaS / multi-instância futura). Fase 1: uma linha default e FK em usuario.
CREATE TABLE IF NOT EXISTS tenant (
    id BIGINT NOT NULL AUTO_INCREMENT,
    codigo VARCHAR(64) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME(6) NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_tenant_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO tenant (id, codigo, nome, ativo)
VALUES (1, 'default', 'Default', 1)
ON DUPLICATE KEY UPDATE nome = VALUES(nome), ativo = VALUES(ativo);

ALTER TABLE tenant AUTO_INCREMENT = 2;

ALTER TABLE usuario
    ADD COLUMN tenant_id BIGINT NOT NULL DEFAULT 1;

ALTER TABLE usuario
    ADD CONSTRAINT fk_usuario_tenant FOREIGN KEY (tenant_id) REFERENCES tenant (id);

CREATE INDEX idx_usuario_tenant ON usuario (tenant_id);
