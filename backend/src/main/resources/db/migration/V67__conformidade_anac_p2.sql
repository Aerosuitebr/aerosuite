-- P-006..P-009 / REQ-004,008,028,029 — contingência, assinatura hash, release aceite, turma treinamento.

ALTER TABLE os_job_card_assinatura
    ADD COLUMN assinatura_sha256 CHAR(64) NULL COMMENT 'SHA-256 do PNG (integridade)',
    ADD COLUMN assinatura_timestamp_server DATETIME(6) NULL COMMENT 'Carimbo server-side na gravação';

ALTER TABLE conformidade_treinamento
    ADD COLUMN turma_ref VARCHAR(120) NULL COMMENT 'Referência da turma (lista de presença)',
    ADD COLUMN presente_lista TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 = presente na turma';

CREATE TABLE IF NOT EXISTS conformidade_contingencia_reconciliacao (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    os_id INT NULL,
    periodo_inicio DATE NULL,
    periodo_fim DATE NULL,
    checklist_json MEDIUMTEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'EM_ANDAMENTO',
    observacoes TEXT NULL,
    concluido_em DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by_usuario_id INT NULL,
    INDEX idx_conting_tenant_status (tenant_id, status),
    INDEX idx_conting_tenant_os (tenant_id, os_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS conformidade_release_aceite (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    versao_app VARCHAR(40) NOT NULL,
    flyway_ate VARCHAR(16) NULL,
    tipo_mudanca VARCHAR(32) NOT NULL DEFAULT 'EVOLUTIVA',
    impacto_regulatorio TINYINT(1) NOT NULL DEFAULT 0,
    checklist_json MEDIUMTEXT NOT NULL,
    observacoes TEXT NULL,
    aceite_usuario_id INT NOT NULL,
    aceite_usuario_nome VARCHAR(255) NULL,
    aceite_em DATETIME(6) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    INDEX idx_release_tenant_aceite (tenant_id, aceite_em)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
