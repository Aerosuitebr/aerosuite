-- Copia template_produto_servico de bellows (UTF-8 correto) para aerosuite.
-- Preserva IDs para manter referências existentes.
-- Uso: mysql --default-character-set=utf8mb4 -uroot -p < db/scripts/sync_template_produto_servico_bellows_to_aerosuite.sql

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

SELECT COUNT(*) AS origem_bellows FROM bellows.template_produto_servico;
SELECT COUNT(*) AS destino_antes FROM aerosuite.template_produto_servico;

SET @bellows_exists := (
  SELECT COUNT(*) FROM information_schema.tables
  WHERE table_schema = 'bellows' AND table_name = 'template_produto_servico'
);
SELECT IF(@bellows_exists = 0, 'ERRO: tabela bellows.template_produto_servico nao existe', 'OK: origem encontrada') AS check_origem;

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE aerosuite.template_produto_servico;

INSERT INTO aerosuite.template_produto_servico (
  id,
  nome_template,
  descricao_template,
  categoria,
  produto_nome,
  produto_pn,
  produto_manual,
  produto_valor_base,
  aplicacao_motor,
  id_tipo_servico,
  tipo_servico_nome,
  servico_descricao_padrao,
  prazo_entrega_padrao,
  forma_pagamento_padrao,
  validade_dias,
  condicoes_gerais_padrao,
  ativo,
  vezes_utilizado,
  created_at,
  updated_at,
  created_by,
  observacao_padrao
)
SELECT
  id,
  nome_template,
  descricao_template,
  categoria,
  produto_nome,
  produto_pn,
  produto_manual,
  produto_valor_base,
  aplicacao_motor,
  id_tipo_servico,
  tipo_servico_nome,
  servico_descricao_padrao,
  prazo_entrega_padrao,
  forma_pagamento_padrao,
  validade_dias,
  condicoes_gerais_padrao,
  ativo,
  vezes_utilizado,
  created_at,
  updated_at,
  created_by,
  observacao_padrao
FROM bellows.template_produto_servico;

SET @max_id := (SELECT IFNULL(MAX(id), 0) FROM aerosuite.template_produto_servico);
SET @sql_ai := CONCAT('ALTER TABLE aerosuite.template_produto_servico AUTO_INCREMENT = ', @max_id + 1);
PREPARE stmt_ai FROM @sql_ai;
EXECUTE stmt_ai;
DEALLOCATE PREPARE stmt_ai;

SET FOREIGN_KEY_CHECKS = 1;

SELECT COUNT(*) AS destino_depois FROM aerosuite.template_produto_servico;

SELECT id, nome_template, produto_nome, categoria, tipo_servico_nome
FROM aerosuite.template_produto_servico
WHERE nome_template LIKE '%Revis%' OR nome_template LIKE '%Combust%' OR nome_template LIKE '%?%'
ORDER BY id
LIMIT 15;

SELECT 'sync_template_produto_servico concluido' AS resultado;
