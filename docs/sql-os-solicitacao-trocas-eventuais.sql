-- Solicitação de trocas eventuais na OS (comentário + itens com status de pagamento)
-- Execute no banco MySQL/MariaDB antes de usar a funcionalidade.

ALTER TABLE os
  ADD COLUMN solicitacao_trocas_comentario TEXT NULL AFTER obs_ini_serv,
  ADD COLUMN email_trocas_nao_pagas_enviado TINYINT(1) NOT NULL DEFAULT 0 AFTER solicitacao_trocas_comentario;

-- os_id deve ser o MESMO tipo que os.id (em bases antigas costuma ser INT; em init novo pode ser BIGINT).
-- Se o CREATE falhar com erro 3780, confira: SHOW COLUMNS FROM os LIKE 'id'; e alinhe os_id (INT ou BIGINT UNSIGNED) ao tipo exato de os.id.
CREATE TABLE IF NOT EXISTS os_solicitacao_troca_item (
  id BIGINT NOT NULL AUTO_INCREMENT,
  os_id INT NOT NULL,
  id_produto BIGINT NULL,
  produto_nome VARCHAR(500) NULL,
  produto_descricao TEXT NULL,
  produto_pn VARCHAR(200) NULL,
  produto_sn VARCHAR(200) NULL,
  quantidade INT NOT NULL DEFAULT 1,
  valor_unitario DECIMAL(15,2) NULL,
  valor_total DECIMAL(15,2) NULL,
  pago TINYINT(1) NULL COMMENT 'NULL=pendente análise suprimento, 1=pago, 0=não pago',
  ordem INT NOT NULL DEFAULT 0,
  created_at DATETIME NULL,
  updated_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_os_solicitacao_troca_os (os_id),
  KEY idx_os_solicitacao_troca_pago (os_id, pago),
  CONSTRAINT fk_os_solicitacao_troca_os FOREIGN KEY (os_id) REFERENCES os (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Se a tabela foi criada sem FK (erro 3780) e os_id ficou BIGINT, corrija antes de criar a FK:
-- ALTER TABLE os_solicitacao_troca_item MODIFY os_id INT NOT NULL;
-- ALTER TABLE os_solicitacao_troca_item ADD CONSTRAINT fk_os_solicitacao_troca_os FOREIGN KEY (os_id) REFERENCES os (id) ON DELETE CASCADE;

-- Perfis usados no código (ajuste nomes se necessário). INSERT IGNORE evita duplicar.
INSERT IGNORE INTO perfil (nome, descricao, codigo, ativo, created_at, updated_at) VALUES
  ('Diretor', 'Diretoria — liberação de pagamento de itens de trocas eventuais na OS', 'DIRETOR', TRUE, NOW(), NOW()),
  ('Suprimento', 'Suprimento — liberação de pagamento de itens de trocas eventuais na OS', 'SUPRIMENTO', TRUE, NOW(), NOW()),
  ('Comercial', 'Comercial — notificações de itens não pagos em trocas eventuais', 'COMERCIAL', TRUE, NOW(), NOW());

-- ---------------------------------------------------------------------------
-- Tela / API "Consulta trocas eventuais" (lista + modal somente leitura)
-- Não há DDL extra: o endpoint usa os mesmos objetos deste script:
--   - os.is_active, os.id, os.id_os, os.cliente_nome, os.dt_abertura
--   - os.solicitacao_trocas_comentario (TEXT, TRIM para considerar "preenchido")
--   - os_solicitacao_troca_item (JOIN/EXISTS por os_id = os.id; agregação pago)
-- Índices úteis para a listagem já estão acima (os_id, os_id+pago).
-- Se CREATE falhar por tipo de os_id vs os.id, use os comentários no topo deste arquivo.
-- ---------------------------------------------------------------------------
-- Menu e permissões (tabela funcionalidade + perfil_funcionalidade):
--   O backend Quarkus, ao iniciar, grava CONSULTA_TROCAS_EVENTUAIS e associa aos perfis que já têm ORDEM_SERVICO.
--   Opcional: db/scripts/add_funcionalidade_consulta_trocas_eventuais.sql ou seed aerosuite_funcionalidade_seed.sql.
-- ---------------------------------------------------------------------------
