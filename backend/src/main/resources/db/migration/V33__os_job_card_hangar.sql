-- P5.2 — Job card digital (hangar): apontamento de horas e assinaturas por OS.

CREATE TABLE IF NOT EXISTS os_job_card_apontamento (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    os_id BIGINT NOT NULL,
    trabalho_em DATE NOT NULL,
    horas DECIMAL(6, 2) NOT NULL,
    descricao TEXT NULL,
    usuario_id BIGINT NULL,
    usuario_nome VARCHAR(255) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    INDEX idx_job_card_apont_tenant_os (tenant_id, os_id),
    INDEX idx_job_card_apont_trabalho (trabalho_em)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS os_job_card_assinatura (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    os_id BIGINT NOT NULL,
    papel VARCHAR(32) NOT NULL,
    assinatura_png LONGBLOB NOT NULL,
    assinado_em DATETIME(6) NOT NULL,
    usuario_id BIGINT NULL,
    usuario_nome VARCHAR(255) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    UNIQUE KEY uk_job_card_assin_os_papel (tenant_id, os_id, papel),
    INDEX idx_job_card_assin_tenant_os (tenant_id, os_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
