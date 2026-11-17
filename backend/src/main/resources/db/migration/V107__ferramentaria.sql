CREATE TABLE ferramenta (
 id BIGINT AUTO_INCREMENT PRIMARY KEY, tenant_id VARCHAR(64) NOT NULL, codigo VARCHAR(80) NOT NULL, UNIQUE KEY uk_ferramenta_tenant_codigo (tenant_id,codigo),
 descricao VARCHAR(255), tipo VARCHAR(255), marca VARCHAR(255), modelo VARCHAR(255), serie VARCHAR(255), posicao VARCHAR(255),
 condicao VARCHAR(255) NOT NULL DEFAULT 'REGULAR', exigeCalibracao BIT NOT NULL DEFAULT 0,
 intervalo INT, unidade VARCHAR(255), alertas VARCHAR(255), criterio VARCHAR(2000),
 ultimaCalibracao DATE, proximaCalibracao DATE, criadaEm DATETIME(6), versao BIGINT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE ferramenta_custodia (
 id BIGINT AUTO_INCREMENT PRIMARY KEY, tenant_id VARCHAR(64) NOT NULL, ferramentaId BIGINT NOT NULL, osId BIGINT NOT NULL,
 mecanicoId INT NOT NULL, entreguePor INT NOT NULL, localizacao VARCHAR(255),
 retiradaEm DATETIME(6), retornoPrevisto DATETIME(6), previsaoAtualizadaEm DATETIME(6), encerradaEm DATETIME(6), encerramento VARCHAR(255),
 ativaFerramenta BIGINT GENERATED ALWAYS AS (CASE WHEN encerradaEm IS NULL THEN ferramentaId ELSE NULL END) STORED,
 UNIQUE KEY uk_custodia_ativa (ativaFerramenta), INDEX ix_custodia_os (osId,encerradaEm),
 FOREIGN KEY (ferramentaId) REFERENCES ferramenta(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE ferramenta_movimento (
 id BIGINT AUTO_INCREMENT PRIMARY KEY, tenant_id VARCHAR(64) NOT NULL, ferramentaId BIGINT NOT NULL, custodiaOrigemId BIGINT, osId BIGINT NOT NULL,
 mecanicoId INT NOT NULL, solicitanteId INT NOT NULL, tipo VARCHAR(255), status VARCHAR(255), localizacao VARCHAR(255),
 retornoPrevisto DATETIME(6), entregaPor INT, recebidoPor INT, cienciaPor INT,
 entregaEm DATETIME(6), recebidoEm DATETIME(6), cienciaEm DATETIME(6), criadoEm DATETIME(6),
 INDEX ix_mov_pendente (status,ferramentaId), INDEX ix_mov_os (osId,status), FOREIGN KEY (ferramentaId) REFERENCES ferramenta(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE ferramenta_evento (
 id BIGINT AUTO_INCREMENT PRIMARY KEY, tenant_id VARCHAR(64) NOT NULL, ferramentaId BIGINT NOT NULL, osId BIGINT, autorId INT NOT NULL,
 autor VARCHAR(255), tipo VARCHAR(255), detalhe TEXT, ocorridoEm DATETIME(6),
 INDEX ix_evento_ferramenta (ferramentaId,ocorridoEm), INDEX ix_evento_os (osId),
 FOREIGN KEY (ferramentaId) REFERENCES ferramenta(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE ferramenta_laboratorio (
 id BIGINT AUTO_INCREMENT PRIMARY KEY, tenant_id VARCHAR(64) NOT NULL, nome VARCHAR(255), contato VARCHAR(255), escopo VARCHAR(2000), consultaAcreditacao DATE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE ferramenta_calibracao (
 id BIGINT AUTO_INCREMENT PRIMARY KEY, tenant_id VARCHAR(64) NOT NULL, ferramentaId BIGINT NOT NULL, laboratorioId BIGINT NOT NULL,
 status VARCHAR(255), enviadaEm DATE, retornoPrevisto DATE, recebidaEm DATE, realizadaEm DATE,
 certificado VARCHAR(255), arquivoNome VARCHAR(500), arquivo LONGBLOB, resultados VARCHAR(4000), analise VARCHAR(4000),
 condicaoEnvio VARCHAR(2000), enviadoPor INT, analisadoPor INT, analisadaEm DATETIME(6), conferenciaFisica BIT NOT NULL DEFAULT 0,
 intervaloAplicado INT, unidadeAplicada VARCHAR(255), proximaCalculada DATE,
 INDEX ix_cal_ferramenta (ferramentaId,status), FOREIGN KEY (ferramentaId) REFERENCES ferramenta(id),
 FOREIGN KEY (laboratorioId) REFERENCES ferramenta_laboratorio(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- Vínculo de terminal reutiliza os_fluxo_terminal e o pareamento central.
-- Snapshots preservam a origem mesmo após renomear/remover uma máquina.
ALTER TABLE ferramenta_evento
 ADD COLUMN terminalId VARCHAR(120) NULL,
 ADD COLUMN estacaoCodigo VARCHAR(120) NULL,
 ADD COLUMN estacaoNome VARCHAR(120) NULL,
 ADD COLUMN maquina VARCHAR(120) NULL;
CREATE INDEX ix_ferramenta_evento_terminal ON ferramenta_evento(terminalId,ocorridoEm);
ALTER TABLE ferramenta_movimento
 ADD COLUMN terminalId VARCHAR(120) NULL,
 ADD COLUMN estacaoCodigo VARCHAR(120) NULL,
 ADD COLUMN estacaoNome VARCHAR(120) NULL,
 ADD COLUMN maquina VARCHAR(120) NULL;
-- Preserve physical restrictions independently from calibration workflow.
ALTER TABLE ferramenta ADD COLUMN bloqueioOperacional VARCHAR(255) NULL;
ALTER TABLE ferramenta ADD COLUMN statusCalibracao VARCHAR(255) NULL;
UPDATE ferramenta SET bloqueioOperacional=condicao
WHERE condicao IN ('AVARIA','INSPECAO','PERDA','DESVIO','BAIXA');
UPDATE ferramenta f
JOIN (SELECT ferramentaId,MAX(id) id FROM ferramenta_calibracao GROUP BY ferramentaId) ultimo ON ultimo.ferramentaId=f.id
JOIN ferramenta_calibracao c ON c.id=ultimo.id
SET f.statusCalibracao=c.status;


INSERT IGNORE INTO perfil (nome,descricao,codigo,ativo,created_at,updated_at) VALUES
 ('Ferramentista','Operação do balcão e acervo','FERRAMENTISTA',1,NOW(),NOW()),
 ('Responsável pela calibração','Controle metrológico','CALIBRACAO',1,NOW(),NOW());
INSERT INTO funcionalidade (nome,descricao,codigo,icone,rota,ordem,secao,tipo,visivel,posicao,ativo,created_at,updated_at) VALUES
 ('Estação de ferramentas','Bipagem, custódia, devolução e transferências','FERRAMENTAS_ESTACAO','pi pi-barcode','/ferramentas',1,'Ferramentaria','funcionalidade',1,1,1,NOW(),NOW()),
 ('Minhas ferramentas','Recebimentos, solicitações e itens sob responsabilidade','FERRAMENTAS_MECANICO','pi pi-wrench','/ferramentas/minhas',2,'Ferramentaria','funcionalidade',1,2,1,NOW(),NOW()),
 ('Acervo de ferramentas','Cadastro individual, ocorrências e histórico','FERRAMENTAS_GESTAO','pi pi-box','/ferramentas/acervo',3,'Ferramentaria','funcionalidade',1,3,1,NOW(),NOW()),
 ('Gestão de calibração','Laboratórios, certificados, análise e liberação','FERRAMENTAS_CALIBRACAO','pi pi-verified','/ferramentas/calibracao',4,'Ferramentaria','funcionalidade',1,4,1,NOW(),NOW()),
 ('Central de operações','Custódias, retornos e calibrações em andamento','FERRAMENTAS_OPERACOES','pi pi-list','/ferramentas/operacoes',5,'Ferramentaria','funcionalidade',1,5,1,NOW(),NOW());
INSERT IGNORE INTO perfil_funcionalidade (perfil_id,funcionalidade_id)
 SELECT p.id,f.id FROM perfil p JOIN funcionalidade f ON f.codigo LIKE 'FERRAMENTAS_%'
 WHERE UPPER(TRIM(p.codigo)) IN ('ADMIN','ADMINISTRADOR','DIRETOR');
INSERT IGNORE INTO perfil_funcionalidade (perfil_id,funcionalidade_id)
 SELECT p.id,f.id FROM perfil p JOIN funcionalidade f ON f.codigo IN ('FERRAMENTAS_ESTACAO','FERRAMENTAS_GESTAO','FERRAMENTAS_OPERACOES','FERRAMENTAS_CALIBRACAO')
 WHERE UPPER(TRIM(p.codigo)) IN ('FERRAMENTISTA');
INSERT IGNORE INTO perfil_funcionalidade (perfil_id,funcionalidade_id)
 SELECT p.id,f.id FROM perfil p JOIN funcionalidade f ON f.codigo='FERRAMENTAS_MECANICO'
 WHERE UPPER(TRIM(p.codigo)) IN ('MECANICO','MECÂNICO','MECANICO_OFICINA','MECANICO_MONTAGEM');
INSERT IGNORE INTO perfil_funcionalidade (perfil_id,funcionalidade_id)
 SELECT p.id,f.id FROM perfil p JOIN funcionalidade f ON f.codigo='FERRAMENTAS_CALIBRACAO'
 WHERE UPPER(TRIM(p.codigo)) IN ('QUALIDADE','CALIBRACAO');
