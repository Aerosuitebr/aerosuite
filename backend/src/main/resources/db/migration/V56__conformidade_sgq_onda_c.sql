-- Onda C — SGQ operacional: documentos controlados, treinamento, calibração, NC, subcontratação, ASL.

CREATE TABLE IF NOT EXISTS sgq_documento_controlado (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    tipo VARCHAR(32) NOT NULL COMMENT 'MOE, POP, PROCEDIMENTO, MANUAL, FORMULARIO, OUTRO',
    codigo VARCHAR(80) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    revisao VARCHAR(32) NOT NULL DEFAULT '00',
    data_revisao DATE NULL,
    data_vigencia DATE NULL,
    status VARCHAR(24) NOT NULL DEFAULT 'VIGENTE' COMMENT 'RASCUNHO, VIGENTE, OBSOLETO',
    referencia_arquivo VARCHAR(512) NULL COMMENT 'Caminho ou URL do documento master',
    observacoes TEXT NULL,
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    UNIQUE KEY uk_sgq_doc_tenant_codigo_rev (tenant_id, codigo, revisao),
    INDEX idx_sgq_doc_tenant_status (tenant_id, status),
    INDEX idx_sgq_doc_vigencia (tenant_id, data_vigencia)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS conformidade_treinamento (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    usuario_id INT NOT NULL,
    curso VARCHAR(255) NOT NULL,
    carga_horaria DECIMAL(6, 2) NULL,
    data_conclusao DATE NULL,
    data_validade DATE NULL,
    certificador VARCHAR(120) NULL,
    observacoes TEXT NULL,
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    INDEX idx_conf_trein_usuario (tenant_id, usuario_id),
    INDEX idx_conf_trein_validade (tenant_id, data_validade)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS conformidade_calibracao_ferramenta (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    identificador VARCHAR(80) NOT NULL COMMENT 'Tag / patrimônio',
    descricao VARCHAR(255) NOT NULL,
    tipo VARCHAR(24) NOT NULL DEFAULT 'INSTRUMENTO' COMMENT 'FERRAMENTA, INSTRUMENTO',
    localizacao VARCHAR(120) NULL,
    data_ultima_calibracao DATE NULL,
    data_proxima_calibracao DATE NULL,
    certificado_ref VARCHAR(120) NULL,
    observacoes TEXT NULL,
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    UNIQUE KEY uk_calib_tenant_ident (tenant_id, identificador),
    INDEX idx_calib_proxima (tenant_id, data_proxima_calibracao)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS conformidade_nao_conformidade (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    numero VARCHAR(40) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT NULL,
    severidade VARCHAR(16) NOT NULL DEFAULT 'MEDIA' COMMENT 'BAIXA, MEDIA, ALTA, CRITICA',
    status VARCHAR(16) NOT NULL DEFAULT 'ABERTA' COMMENT 'ABERTA, EM_ACAO, FECHADA',
    os_id INT NULL,
    data_abertura DATE NOT NULL,
    data_fechamento DATE NULL,
    acao_corretiva TEXT NULL,
    observacoes TEXT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    UNIQUE KEY uk_nc_tenant_numero (tenant_id, numero),
    INDEX idx_nc_status (tenant_id, status),
    INDEX idx_nc_os (tenant_id, os_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS conformidade_subcontratacao (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    razao_social VARCHAR(255) NOT NULL,
    certificado_part145 VARCHAR(120) NULL,
    escopo TEXT NULL,
    validade_certificado DATE NULL,
    os_id INT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'ATIVO' COMMENT 'ATIVO, SUSPENSO, ENCERRADO',
    observacoes TEXT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    INDEX idx_subcontrat_status (tenant_id, status),
    INDEX idx_subcontrat_os (tenant_id, os_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

ALTER TABLE fornecedor
    ADD COLUMN asl_status VARCHAR(24) NULL DEFAULT 'PENDENTE' COMMENT 'APROVADO, PENDENTE, SUSPENSO, NAO_APLICAVEL' AFTER observacoes,
    ADD COLUMN asl_escopo VARCHAR(255) NULL AFTER asl_status,
    ADD COLUMN asl_validade DATE NULL AFTER asl_escopo,
    ADD COLUMN asl_aprovado_em DATE NULL AFTER asl_validade,
    ADD COLUMN asl_observacoes TEXT NULL AFTER asl_aprovado_em;

INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, parent_id, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Documentos controlados', 'MOE, POP e procedimentos com revisão e vigência', 'SGQ_DOCUMENTO_CONTROLADO', 'pi pi-book',
       '/conformidade/documentos', 99, 'Administração', NULL, 'funcionalidade', TRUE, 99, TRUE, NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'SGQ_DOCUMENTO_CONTROLADO');

INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, parent_id, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Treinamentos', 'Registros de treinamento e reciclagem formal', 'CONFORMIDADE_TREINAMENTO', 'pi pi-users',
       '/conformidade/treinamentos', 100, 'Administração', NULL, 'funcionalidade', TRUE, 100, TRUE, NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'CONFORMIDADE_TREINAMENTO');

INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, parent_id, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Calibração', 'Ferramentas e instrumentos calibrados', 'CONFORMIDADE_CALIBRACAO', 'pi pi-wrench',
       '/conformidade/calibracao', 101, 'Administração', NULL, 'funcionalidade', TRUE, 101, TRUE, NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'CONFORMIDADE_CALIBRACAO');

INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, parent_id, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Não conformidades', 'Ocorrências, NC e ações corretivas (SMS básico)', 'CONFORMIDADE_NC', 'pi pi-exclamation-triangle',
       '/conformidade/nao-conformidades', 102, 'Administração', NULL, 'funcionalidade', TRUE, 102, TRUE, NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'CONFORMIDADE_NC');

INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, parent_id, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Subcontratação', 'Oficinas subcontratadas Part 145', 'CONFORMIDADE_SUBCONTRATACAO', 'pi pi-share-alt',
       '/conformidade/subcontratacao', 103, 'Administração', NULL, 'funcionalidade', TRUE, 103, TRUE, NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'CONFORMIDADE_SUBCONTRATACAO');

INSERT INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT p.id, f.id
FROM perfil p
         CROSS JOIN funcionalidade f
WHERE f.codigo IN (
    'SGQ_DOCUMENTO_CONTROLADO', 'CONFORMIDADE_TREINAMENTO', 'CONFORMIDADE_CALIBRACAO',
    'CONFORMIDADE_NC', 'CONFORMIDADE_SUBCONTRATACAO'
  )
  AND UPPER(p.codigo) IN ('ADMIN', 'ADMINISTRADOR', 'DIRETOR', 'QUALIDADE', 'GERENTE', 'P145_RT', 'P145_INSPETOR')
  AND NOT EXISTS (
    SELECT 1 FROM perfil_funcionalidade pf
    WHERE pf.perfil_id = p.id AND pf.funcionalidade_id = f.id
);

INSERT INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT pf.perfil_id, f.id
FROM perfil_funcionalidade pf
         JOIN funcionalidade fa ON fa.id = pf.funcionalidade_id AND fa.codigo = 'GERENCIAR_PERMISSOES'
         CROSS JOIN funcionalidade f
WHERE f.codigo IN (
    'SGQ_DOCUMENTO_CONTROLADO', 'CONFORMIDADE_TREINAMENTO', 'CONFORMIDADE_CALIBRACAO',
    'CONFORMIDADE_NC', 'CONFORMIDADE_SUBCONTRATACAO'
  )
  AND NOT EXISTS (
    SELECT 1 FROM perfil_funcionalidade x
    WHERE x.perfil_id = pf.perfil_id AND x.funcionalidade_id = f.id
);
