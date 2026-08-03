-- P-005 / REQ-007 — vínculo estruturado tarefa ↔ AD/SB/manual na OS.

CREATE TABLE IF NOT EXISTS os_tarefa_dado_tecnico (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    os_id INT NOT NULL,
    ordem INT NOT NULL DEFAULT 0,
    tarefa_descricao VARCHAR(500) NOT NULL COMMENT 'Escopo/tarefa da OS coberta pelo dado técnico',
    tipo_dado VARCHAR(16) NOT NULL COMMENT 'AD_SB, MANUAL, OUTRO',
    aero_diretriz_id BIGINT NULL,
    publicacao_tecnica_id INT NULL,
    referencia_externa VARCHAR(255) NULL COMMENT 'Referência livre quando tipo_dado=OUTRO',
    titulo_exibicao VARCHAR(500) NULL,
    numero_exibicao VARCHAR(120) NULL,
    observacao VARCHAR(1000) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by_usuario_id INT NULL,
    INDEX idx_os_tarefa_dt_tenant_os (tenant_id, os_id),
    INDEX idx_os_tarefa_dt_diretriz (tenant_id, aero_diretriz_id),
    INDEX idx_os_tarefa_dt_pub (tenant_id, publicacao_tecnica_id),
    CONSTRAINT fk_os_tarefa_dt_os FOREIGN KEY (os_id) REFERENCES os (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
