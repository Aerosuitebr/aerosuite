-- P1: módulos por tenant, billing (trial/assinatura), LGPD (consentimento + solicitações).

ALTER TABLE tenant
    ADD COLUMN modulos_habilitados VARCHAR(255) NOT NULL DEFAULT 'MRO,ESTOQUE,COMERCIAL' AFTER ativo;

CREATE TABLE IF NOT EXISTS tenant_billing (
    tenant_id BIGINT NOT NULL,
    plano_codigo VARCHAR(32) NOT NULL DEFAULT 'trial',
    status VARCHAR(32) NOT NULL DEFAULT 'trialing',
    trial_ends_at DATETIME(6) NULL,
    provedor VARCHAR(16) NOT NULL DEFAULT 'mock',
    external_customer_id VARCHAR(128) NULL,
    external_subscription_id VARCHAR(128) NULL,
    updated_at DATETIME(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (tenant_id),
    CONSTRAINT fk_tenant_billing_tenant FOREIGN KEY (tenant_id) REFERENCES tenant (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO tenant_billing (tenant_id, plano_codigo, status, trial_ends_at, provedor)
SELECT t.id, 'platform', 'active', NULL, 'internal'
FROM tenant t
WHERE t.codigo = 'default'
  AND NOT EXISTS (SELECT 1 FROM tenant_billing b WHERE b.tenant_id = t.id);

INSERT INTO tenant_billing (tenant_id, plano_codigo, status, trial_ends_at, provedor)
SELECT t.id, 'trial', 'trialing', DATE_ADD(NOW(6), INTERVAL 14 DAY), 'mock'
FROM tenant t
WHERE t.codigo <> 'default'
  AND NOT EXISTS (SELECT 1 FROM tenant_billing b WHERE b.tenant_id = t.id);

CREATE TABLE IF NOT EXISTS usuario_consentimento_lgpd (
    id BIGINT NOT NULL AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    tenant_id BIGINT NOT NULL,
    versao_termos VARCHAR(32) NOT NULL,
    versao_privacidade VARCHAR(32) NOT NULL,
    aceite_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ip_origem VARCHAR(64) NULL,
    user_agent VARCHAR(512) NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_consentimento_usuario_versoes (usuario_id, versao_termos, versao_privacidade),
    KEY idx_consentimento_tenant (tenant_id),
    CONSTRAINT fk_consentimento_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE,
    CONSTRAINT fk_consentimento_tenant FOREIGN KEY (tenant_id) REFERENCES tenant (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS lgpd_solicitacao (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL,
    usuario_id INT NULL,
    email VARCHAR(255) NOT NULL,
    tipo VARCHAR(16) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    observacao TEXT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    processed_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    KEY idx_lgpd_solicitacao_tenant (tenant_id),
    KEY idx_lgpd_solicitacao_status (status),
    CONSTRAINT fk_lgpd_solicitacao_tenant FOREIGN KEY (tenant_id) REFERENCES tenant (id),
    CONSTRAINT fk_lgpd_solicitacao_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
