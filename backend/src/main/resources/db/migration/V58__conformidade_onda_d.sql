-- Onda D — CAPA NC, histórico documental, treinamento obrigatório por função, painel qualidade.

ALTER TABLE conformidade_nao_conformidade
    ADD COLUMN causa_raiz TEXT NULL AFTER acao_corretiva,
    ADD COLUMN acao_contencao TEXT NULL AFTER causa_raiz,
    ADD COLUMN verificacao_eficacia TEXT NULL AFTER acao_contencao,
    ADD COLUMN eficacia_confirmada TINYINT(1) NULL DEFAULT 0 AFTER verificacao_eficacia,
    ADD COLUMN data_verificacao DATE NULL AFTER eficacia_confirmada,
    ADD COLUMN capa_fase VARCHAR(24) NOT NULL DEFAULT 'REGISTRO'
        COMMENT 'REGISTRO, CONTENCAO, CAUSA, ACAO, VERIFICACAO, FECHADA' AFTER status;

CREATE TABLE IF NOT EXISTS sgq_documento_revisao_historico (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    documento_id BIGINT NOT NULL,
    codigo VARCHAR(80) NOT NULL,
    revisao_anterior VARCHAR(32) NULL,
    revisao_nova VARCHAR(32) NOT NULL,
    status_anterior VARCHAR(24) NULL,
    status_novo VARCHAR(24) NOT NULL,
    observacao TEXT NULL,
    usuario_email VARCHAR(255) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    INDEX idx_sgq_hist_codigo (tenant_id, codigo),
    INDEX idx_sgq_hist_doc (tenant_id, documento_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS conformidade_treinamento_obrigatorio (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    funcao_codigo VARCHAR(64) NOT NULL COMMENT 'Perfil ou função (ex. MECANICO, IIA)',
    curso VARCHAR(255) NOT NULL,
    validade_meses INT NOT NULL DEFAULT 24,
    observacoes TEXT NULL,
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    UNIQUE KEY uk_trein_obrig_funcao_curso (tenant_id, funcao_codigo, curso),
    INDEX idx_trein_obrig_funcao (tenant_id, funcao_codigo)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, ativo)
SELECT 'Painel qualidade', 'Alertas consolidados SGQ (documentos, treinos, calibração, NC, ASL)',
       'CONFORMIDADE_PAINEL', 'pi pi-chart-bar', '/conformidade/painel', 195, 1
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'CONFORMIDADE_PAINEL');

INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, ativo)
SELECT 'Treinamentos obrigatórios', 'Cursos exigidos por função/perfil', 'CONFORMIDADE_TREINAMENTO_OBRIG',
       'pi pi-id-card', '/conformidade/treinamentos-obrigatorios', 196, 1
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'CONFORMIDADE_TREINAMENTO_OBRIG');

INSERT INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT p.id, f.id
FROM perfil p
CROSS JOIN funcionalidade f
WHERE p.codigo IN ('ADMIN', 'QUALIDADE', 'GERENTE_MANUTENCAO')
  AND f.codigo IN ('CONFORMIDADE_PAINEL', 'CONFORMIDADE_TREINAMENTO_OBRIG')
  AND NOT EXISTS (
      SELECT 1 FROM perfil_funcionalidade pf
      WHERE pf.perfil_id = p.id AND pf.funcionalidade_id = f.id
  );
