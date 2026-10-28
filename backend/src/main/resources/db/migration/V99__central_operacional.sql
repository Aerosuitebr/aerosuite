CREATE TABLE operacao_registro (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, tenant_id VARCHAR(64) NOT NULL, version BIGINT NOT NULL DEFAULT 0,
 modulo VARCHAR(24) NOT NULL, os_id BIGINT NULL, item_id BIGINT NULL, ferramenta_id BIGINT NULL, origem_id BIGINT NULL, tecnico_id INT NULL,
 titulo VARCHAR(180) NOT NULL, status VARCHAR(30) NOT NULL, tipo VARCHAR(40), responsavel VARCHAR(180), referencia VARCHAR(180), recurso VARCHAR(180),
 proxima_acao VARCHAR(1000), observacao TEXT, prazo DATE, inicio DATE, fim DATE,
 quantidade DECIMAL(15,3), quantidade_consumida DECIMAL(15,3) NOT NULL DEFAULT 0, valor DECIMAL(15,2), horas DECIMAL(10,2), capacidade DECIMAL(10,2),
 created_at DATETIME(6) NOT NULL, updated_at DATETIME(6) NOT NULL, closed_at DATETIME(6), created_by INT,
 INDEX idx_operacao_tenant_modulo (tenant_id,modulo,status), INDEX idx_operacao_os (tenant_id,os_id),
 INDEX idx_operacao_item (tenant_id,item_id,status), INDEX idx_operacao_recurso (tenant_id,recurso,inicio,fim),
 INDEX idx_operacao_ferramenta (tenant_id,ferramenta_id,status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE operacao_evento (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, tenant_id VARCHAR(64) NOT NULL, registro_id BIGINT NOT NULL,
 descricao VARCHAR(1000) NOT NULL, autor VARCHAR(180), created_at DATETIME(6) NOT NULL,
 INDEX idx_operacao_evento (tenant_id,registro_id,created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
INSERT INTO funcionalidade (nome,descricao,codigo,icone,rota,ordem,secao,tipo,visivel,posicao,ativo,created_at,updated_at)
SELECT 'Central operacional','Impedimentos, materiais, compras, prontidão, planejamento, ferramentas e retornos','CENTRAL_OPERACIONAL','pi pi-compass','/operacoes',5,'Oficina','funcionalidade',TRUE,5,TRUE,NOW(),NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo='CENTRAL_OPERACIONAL');
INSERT INTO funcionalidade (nome,descricao,codigo,icone,rota,ordem,secao,tipo,visivel,posicao,ativo,created_at,updated_at)
SELECT 'Resultados por OS','Custos e resultado operacional por ordem de serviço','CUSTOS_OPERACIONAIS','pi pi-chart-line','/operacoes/custos',60,'Gestão','funcionalidade',TRUE,60,TRUE,NOW(),NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo='CUSTOS_OPERACIONAIS');
INSERT INTO perfil_funcionalidade(perfil_id,funcionalidade_id)
SELECT DISTINCT pf.perfil_id,f.id FROM perfil_funcionalidade pf
JOIN funcionalidade origem ON origem.id=pf.funcionalidade_id AND origem.codigo='ORDEM_SERVICO'
JOIN funcionalidade f ON f.codigo='CENTRAL_OPERACIONAL'
WHERE NOT EXISTS (SELECT 1 FROM perfil_funcionalidade atual WHERE atual.perfil_id=pf.perfil_id AND atual.funcionalidade_id=f.id);
INSERT INTO perfil_funcionalidade(perfil_id,funcionalidade_id)
SELECT p.id,f.id FROM perfil p JOIN funcionalidade f ON f.codigo='CUSTOS_OPERACIONAIS'
WHERE UPPER(p.codigo) IN ('ADMIN','ADMINISTRADOR','DIRETOR','GERENTE') AND NOT EXISTS
(SELECT 1 FROM perfil_funcionalidade atual WHERE atual.perfil_id=p.id AND atual.funcionalidade_id=f.id);
