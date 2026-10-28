-- NRC: registro de não conformidade (ISO 9001 §8.7 / §10.2), isolado por organização.

CREATE TABLE nrc (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    numero VARCHAR(32) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ABERTA',
    data_deteccao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_ocorrencia DATETIME NULL,
    detectado_por_id BIGINT NULL,
    detectado_por_nome VARCHAR(255) NULL,
    origem VARCHAR(255) NOT NULL,
    tipo_nc VARCHAR(30) NOT NULL,
    severidade VARCHAR(20) NOT NULL DEFAULT 'MENOR',
    descricao_ocorrido TEXT NOT NULL,
    requisito_nao_atendido TEXT NULL,
    documento_envolvido TEXT NULL,
    requisito_referencia VARCHAR(100) NULL,
    evidencias_texto TEXT NULL,
    local_ocorrencia VARCHAR(255) NULL,
    os_id BIGINT NULL,
    os_numero VARCHAR(30) NULL,
    part_number VARCHAR(100) NULL,
    serial_number VARCHAR(100) NULL,
    invoice_id BIGINT NULL,
    invoice_numero VARCHAR(50) NULL,
    lote_id BIGINT NULL,
    lote_codigo VARCHAR(50) NULL,
    cliente_nome VARCHAR(255) NULL,
    fcu_id BIGINT NULL,
    fcu_codigo VARCHAR(50) NULL,
    prazo_tratamento DATE NULL,
    custo_nao_conformidade DECIMAL(15,2) NULL,
    responsavel_tratamento_id BIGINT NULL,
    responsavel_tratamento_nome VARCHAR(255) NULL,
    prazo_tratamento_proposto DATE NULL,
    responsavel_tratamento_proposto_id BIGINT NULL,
    responsavel_tratamento_proposto_nome VARCHAR(255) NULL,
    tratamento_proposta_status VARCHAR(30) NULL,
    tratamento_proposta_em DATETIME NULL,
    tratamento_aprovado_por_id BIGINT NULL,
    tratamento_aprovado_por_nome VARCHAR(255) NULL,
    tratamento_aprovado_em DATETIME NULL,
    contencao_acao TEXT NULL,
    contencao_responsavel_id BIGINT NULL,
    contencao_responsavel_nome VARCHAR(255) NULL,
    contencao_data DATETIME NULL,
    contencao_nao_aplicavel TINYINT(1) NOT NULL DEFAULT 0,
    contencao_oque TEXT NULL,
    contencao_quem VARCHAR(255) NULL,
    contencao_quando VARCHAR(255) NULL,
    contencao_concluida TINYINT(1) NOT NULL DEFAULT 0,
    contencao_data_conclusao DATETIME NULL,
    contencao_aprovacao_status VARCHAR(30) NULL,
    contencao_solicitado_em DATETIME NULL,
    contencao_solicitado_por_id BIGINT NULL,
    contencao_solicitado_por_nome VARCHAR(255) NULL,
    contencao_aprovado_por_id BIGINT NULL,
    contencao_aprovado_por_nome VARCHAR(255) NULL,
    contencao_aprovado_em DATETIME NULL,
    contencao_rejeicao_observacoes TEXT NULL,
    causa_raiz TEXT NULL,
    metodo_causa VARCHAR(30) NULL,
    porque_1 TEXT NULL,
    porque_2 TEXT NULL,
    porque_3 TEXT NULL,
    porque_4 TEXT NULL,
    porque_5 TEXT NULL,
    porques_extra TEXT NULL,
    ishikawa_material TEXT NULL,
    analise_causa_status VARCHAR(30) NULL,
    analise_causa_solicitado_em DATETIME NULL,
    analise_causa_solicitado_por_id BIGINT NULL,
    analise_causa_solicitado_por_nome VARCHAR(255) NULL,
    analise_causa_aprovado_por_id BIGINT NULL,
    analise_causa_aprovado_por_nome VARCHAR(255) NULL,
    analise_causa_aprovado_em DATETIME NULL,
    analise_causa_rejeicao_observacoes TEXT NULL,
    acoes_plano_status VARCHAR(30) NULL,
    acoes_plano_solicitado_em DATETIME NULL,
    acoes_plano_solicitado_por_id BIGINT NULL,
    acoes_plano_solicitado_por_nome VARCHAR(255) NULL,
    acoes_plano_aprovado_por_id BIGINT NULL,
    acoes_plano_aprovado_por_nome VARCHAR(255) NULL,
    acoes_plano_aprovado_em DATETIME NULL,
    acoes_plano_rejeicao_observacoes TEXT NULL,
    disposicao VARCHAR(30) NULL,
    disposicao_observacao TEXT NULL,
    disposicao_aprovada_por_id BIGINT NULL,
    disposicao_aprovada_por_nome VARCHAR(255) NULL,
    disposicao_data DATETIME NULL,
    verificacao_eficacia TEXT NULL,
    verificacao_data DATETIME NULL,
    eficacia_decisao VARCHAR(20) NULL,
    eficacia_atualizar_riscos TINYINT(1) NULL,
    eficacia_mudancas_sgq TEXT NULL,
    encerrado_por_id BIGINT NULL,
    encerrado_por_nome VARCHAR(255) NULL,
    data_encerramento DATETIME NULL,
    data_ultima_atualizacao DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    UNIQUE KEY uk_nrc_tenant_numero (tenant_id, numero),
    INDEX idx_nrc_tenant_status (tenant_id, status),
    INDEX idx_nrc_tenant_os (tenant_id, os_id),
    INDEX idx_nrc_tenant_prazo (tenant_id, prazo_tratamento),
    INDEX idx_nrc_tenant_deteccao (tenant_id, data_deteccao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE nrc_acao (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    nrc_id BIGINT NOT NULL,
    descricao TEXT NOT NULL,
    o_que TEXT NULL,
    por_que TEXT NULL,
    onde VARCHAR(255) NULL,
    quando_acao DATE NULL,
    como TEXT NULL,
    quanto_custo VARCHAR(100) NULL,
    responsavel_id BIGINT NULL,
    responsavel_nome VARCHAR(255) NULL,
    prazo DATE NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',
    data_conclusao DATETIME NULL,
    evidencia_conclusao TEXT NULL,
    concluido_por_id BIGINT NULL,
    concluido_por_nome VARCHAR(255) NULL,
    ordem_item INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_nrc_acao_nrc FOREIGN KEY (nrc_id) REFERENCES nrc (id) ON DELETE CASCADE,
    INDEX idx_nrc_acao_nrc (tenant_id, nrc_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE nrc_anexo (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    nrc_id BIGINT NOT NULL,
    nome_arquivo VARCHAR(255) NOT NULL,
    nome_original VARCHAR(255) NULL,
    tipo_arquivo VARCHAR(100) NULL,
    tamanho_bytes BIGINT NULL,
    caminho_arquivo VARCHAR(500) NULL,
    descricao VARCHAR(500) NULL,
    categoria VARCHAR(30) NOT NULL DEFAULT 'EVIDENCIA',
    usuario_id BIGINT NULL,
    usuario_nome VARCHAR(255) NULL,
    data_upload DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    CONSTRAINT fk_nrc_anexo_nrc FOREIGN KEY (nrc_id) REFERENCES nrc (id) ON DELETE CASCADE,
    INDEX idx_nrc_anexo_nrc (tenant_id, nrc_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE nrc_auditoria (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    nrc_id BIGINT NOT NULL,
    acao VARCHAR(50) NOT NULL,
    campo VARCHAR(100) NULL,
    valor_anterior TEXT NULL,
    valor_novo TEXT NULL,
    usuario_id BIGINT NULL,
    usuario_nome VARCHAR(255) NULL,
    data_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_nrc_auditoria_nrc FOREIGN KEY (nrc_id) REFERENCES nrc (id) ON DELETE CASCADE,
    INDEX idx_nrc_auditoria_nrc (tenant_id, nrc_id, data_hora)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE nrc_responsavel_historico (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    nrc_id BIGINT NOT NULL,
    usuario_id BIGINT NOT NULL,
    usuario_nome VARCHAR(255) NULL,
    data_atribuicao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_nrc_resp_hist_nrc FOREIGN KEY (nrc_id) REFERENCES nrc (id) ON DELETE CASCADE,
    UNIQUE KEY uk_nrc_resp_hist (tenant_id, nrc_id, usuario_id),
    INDEX idx_nrc_resp_hist_usuario (tenant_id, usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE nrc_sequencia (
    tenant_id VARCHAR(64) NOT NULL,
    ano INT NOT NULL,
    ultimo_numero INT NOT NULL DEFAULT 0,
    PRIMARY KEY (tenant_id, ano)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Registros RNC', 'Consultar e acompanhar o registro de não conformidade (RNC) da oficina', 'NRC_LIST', 'pi pi-list', '/nrc', 35, 'Oficina', 'funcionalidade', TRUE, 35, TRUE, NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'NRC_LIST');

INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Abrir RNC', 'Registrar novo RNC vinculado à ordem de serviço', 'NRC_ABRIR', 'pi pi-plus-circle', '/nrc/nova', 36, 'Oficina', 'funcionalidade', TRUE, 36, TRUE, NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'NRC_ABRIR');

INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Indicadores RNC', 'Prazos, severidade e eficácia dos registros de não conformidade', 'NRC_DASHBOARD', 'pi pi-chart-pie', '/nrc/dashboard', 36, 'Gestão', 'funcionalidade', TRUE, 36, TRUE, NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'NRC_DASHBOARD');

INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Tratar RNC', 'Contenção, causa e plano de ações do RNC', 'NRC_ANALISAR', 'pi pi-wrench', '/nrc', 37, 'Oficina', 'funcionalidade', TRUE, 37, TRUE, NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'NRC_ANALISAR');

INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Encerrar RNC', 'Verificação de eficácia e fechamento do RNC', 'NRC_ENCERRAR', 'pi pi-check-circle', '/nrc', 38, 'Gestão', 'funcionalidade', TRUE, 38, TRUE, NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'NRC_ENCERRAR');

INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Relatório RNC', 'Relatório completo do registro de não conformidade', 'NRC_RELATORIO', 'pi pi-file', '/nrc', 39, 'Gestão', 'funcionalidade', TRUE, 39, TRUE, NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'NRC_RELATORIO');

INSERT INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT p.id, f.id
FROM perfil p
JOIN funcionalidade f ON f.codigo IN ('NRC_LIST','NRC_ABRIR','NRC_DASHBOARD','NRC_ANALISAR','NRC_ENCERRAR','NRC_RELATORIO')
WHERE UPPER(p.codigo) IN ('ADMIN','ADMINISTRADOR','DIRETOR','GERENTE','QUALIDADE','P145_RT','P145_INSPETOR')
  AND NOT EXISTS (
    SELECT 1 FROM perfil_funcionalidade atual
    WHERE atual.perfil_id = p.id AND atual.funcionalidade_id = f.id);

INSERT INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT DISTINCT pf.perfil_id, f.id
FROM perfil_funcionalidade pf
JOIN funcionalidade origem ON origem.id = pf.funcionalidade_id AND origem.codigo = 'ORDEM_SERVICO'
JOIN funcionalidade f ON f.codigo IN ('NRC_LIST','NRC_ABRIR','NRC_ANALISAR','NRC_RELATORIO')
WHERE NOT EXISTS (
    SELECT 1 FROM perfil_funcionalidade atual
    WHERE atual.perfil_id = pf.perfil_id AND atual.funcionalidade_id = f.id);
