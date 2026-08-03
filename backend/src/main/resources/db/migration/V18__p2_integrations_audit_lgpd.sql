-- Auditoria de acesso (login/RBAC) + artefacto LGPD.

CREATE TABLE IF NOT EXISTS acesso_auditoria (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id BIGINT NULL,
    usuario_id INT NULL,
    email VARCHAR(255) NULL,
    evento VARCHAR(64) NOT NULL,
    sucesso TINYINT(1) NOT NULL DEFAULT 0,
    detalhe VARCHAR(512) NULL,
    ip VARCHAR(64) NULL,
    user_agent VARCHAR(512) NULL,
    recurso VARCHAR(255) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY idx_acesso_auditoria_tenant (tenant_id),
    KEY idx_acesso_auditoria_evento (evento),
    KEY idx_acesso_auditoria_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

ALTER TABLE lgpd_solicitacao
    ADD COLUMN result_artifact VARCHAR(512) NULL AFTER observacao,
    ADD COLUMN error_message TEXT NULL AFTER result_artifact;
