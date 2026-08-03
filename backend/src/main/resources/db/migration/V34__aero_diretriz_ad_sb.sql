-- B6 — Registro estruturado de AD/SB e alertas de cumprimento.

CREATE TABLE IF NOT EXISTS aero_diretriz (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    tipo VARCHAR(16) NOT NULL COMMENT 'AD, SB, OUTRO',
    numero VARCHAR(80) NOT NULL,
    titulo VARCHAR(500) NOT NULL,
    emissor VARCHAR(120) NULL,
    ata VARCHAR(32) NULL,
    fcu_id INT NULL,
    part_number VARCHAR(100) NULL,
    serial_number VARCHAR(100) NULL,
    data_emissao DATE NULL,
    data_limite_cumprimento DATE NULL,
    data_cumprimento DATE NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ABERTA',
    os_cumprimento_id BIGINT NULL,
    observacoes TEXT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    INDEX idx_aero_dir_tenant_status (tenant_id, status),
    INDEX idx_aero_dir_limite (tenant_id, data_limite_cumprimento),
    INDEX idx_aero_dir_fcu (tenant_id, fcu_id),
    INDEX idx_aero_dir_pn (tenant_id, part_number)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, parent_id, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'AD / SB e alertas', 'Diretrizes aeronáuticas e prazos de cumprimento', 'AD_SB_ALERTAS', 'pi pi-exclamation-triangle',
       '/aero/diretrizes', 97, 'Administração', NULL, 'funcionalidade', TRUE, 97, TRUE, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'AD_SB_ALERTAS');

INSERT INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT p.id, f.id
FROM perfil p
         CROSS JOIN funcionalidade f
WHERE f.codigo = 'AD_SB_ALERTAS'
  AND UPPER(p.codigo) IN ('ADMIN', 'ADMINISTRADOR', 'DIRETOR', 'QUALIDADE', 'GERENTE', 'P145_RT', 'P145_INSPETOR')
  AND NOT EXISTS (
    SELECT 1 FROM perfil_funcionalidade pf
    WHERE pf.perfil_id = p.id AND pf.funcionalidade_id = f.id
);

INSERT INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT DISTINCT pf.perfil_id, f.id
FROM perfil_funcionalidade pf
         JOIN funcionalidade fa ON fa.id = pf.funcionalidade_id AND fa.codigo IN ('ORDEM_SERVICO', 'FCU')
         CROSS JOIN funcionalidade f
WHERE f.codigo = 'AD_SB_ALERTAS'
  AND NOT EXISTS (
    SELECT 1 FROM perfil_funcionalidade x
    WHERE x.perfil_id = pf.perfil_id AND x.funcionalidade_id = f.id
);
