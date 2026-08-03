-- Repara acentos gravados como '?' (JDBC sem UTF-8). REPLACE aceita 3 args — um UPDATE por padrao.
-- Script manual: db/scripts/fix_comercial_texto_utf8.sql

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

SET @db := DATABASE();

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = @db AND table_name = 'template_produto_servico') > 0,
  'ALTER TABLE template_produto_servico CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci',
  'SELECT 1'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = @db AND table_name = 'tipo_servico') > 0,
  'ALTER TABLE tipo_servico CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci',
  'SELECT 1'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

UPDATE template_produto_servico t
INNER JOIN tipo_servico ts ON t.id_tipo_servico = ts.id
SET t.tipo_servico_nome = ts.nome
WHERE t.tipo_servico_nome LIKE '%?%'
  AND ts.nome IS NOT NULL
  AND ts.nome NOT LIKE '%?%';

-- nome_template
UPDATE template_produto_servico SET nome_template = REPLACE(nome_template, 'INSPE??O', 'INSPEÇÃO') WHERE nome_template LIKE '%INSPE??O%';
UPDATE template_produto_servico SET nome_template = REPLACE(nome_template, 'Inspe??o', 'Inspeção') WHERE nome_template LIKE '%Inspe??o%';
UPDATE template_produto_servico SET nome_template = REPLACE(nome_template, 'MANUTEN??O', 'MANUTENÇÃO') WHERE nome_template LIKE '%MANUTEN??O%';
UPDATE template_produto_servico SET nome_template = REPLACE(nome_template, 'Manuten??o', 'Manutenção') WHERE nome_template LIKE '%Manuten??o%';
UPDATE template_produto_servico SET nome_template = REPLACE(nome_template, 'Calibra??o', 'Calibração') WHERE nome_template LIKE '%Calibra??o%';
UPDATE template_produto_servico SET nome_template = REPLACE(nome_template, 'CALIBRA??O', 'CALIBRAÇÃO') WHERE nome_template LIKE '%CALIBRA??O%';
UPDATE template_produto_servico SET nome_template = REPLACE(nome_template, 'Igni??o', 'Ignição') WHERE nome_template LIKE '%Igni??o%';
UPDATE template_produto_servico SET nome_template = REPLACE(nome_template, 'IGNI??O', 'IGNIÇÃO') WHERE nome_template LIKE '%IGNI??O%';
UPDATE template_produto_servico SET nome_template = REPLACE(nome_template, 'COMBUST?VEL', 'COMBUSTÍVEL') WHERE nome_template LIKE '%COMBUST?VEL%';
UPDATE template_produto_servico SET nome_template = REPLACE(nome_template, 'Combust?vel', 'Combustível') WHERE nome_template LIKE '%Combust?vel%';
UPDATE template_produto_servico SET nome_template = REPLACE(nome_template, 'combust?vel', 'combustível') WHERE nome_template LIKE '%combust?vel%';
UPDATE template_produto_servico SET nome_template = REPLACE(nome_template, 'REVIS?O', 'REVISÃO') WHERE nome_template LIKE '%REVIS?O%';
UPDATE template_produto_servico SET nome_template = REPLACE(nome_template, 'Revis?o', 'Revisão') WHERE nome_template LIKE '%Revis?o%';
UPDATE template_produto_servico SET nome_template = REPLACE(nome_template, 'revis?o', 'revisão') WHERE nome_template LIKE '%revis?o%';
UPDATE template_produto_servico SET nome_template = REPLACE(nome_template, 'El?trico', 'Elétrico') WHERE nome_template LIKE '%El?trico%';
UPDATE template_produto_servico SET nome_template = REPLACE(nome_template, 'EL?TRICO', 'ELÉTRICO') WHERE nome_template LIKE '%EL?TRICO%';
UPDATE template_produto_servico SET nome_template = REPLACE(nome_template, 'H?lice', 'Hélice') WHERE nome_template LIKE '%H?lice%';
UPDATE template_produto_servico SET nome_template = REPLACE(nome_template, 'H?LICE', 'HÉLICE') WHERE nome_template LIKE '%H?LICE%';
UPDATE template_produto_servico SET nome_template = REPLACE(nome_template, 'Servi?os', 'Serviços') WHERE nome_template LIKE '%Servi?os%';
UPDATE template_produto_servico SET nome_template = REPLACE(nome_template, 'SERVI?OS', 'SERVIÇOS') WHERE nome_template LIKE '%SERVI?OS%';
UPDATE template_produto_servico SET nome_template = REPLACE(nome_template, 'Aeron?utico', 'Aeronáutico') WHERE nome_template LIKE '%Aeron?utico%';
UPDATE template_produto_servico SET nome_template = REPLACE(nome_template, 'AERON?UTICO', 'AERONÁUTICO') WHERE nome_template LIKE '%AERON?UTICO%';
UPDATE template_produto_servico SET nome_template = REPLACE(nome_template, 'Pe?as', 'Peças') WHERE nome_template LIKE '%Pe?as%';
UPDATE template_produto_servico SET nome_template = REPLACE(nome_template, 'Pe?a', 'Peça') WHERE nome_template LIKE '%Pe?a%';
UPDATE template_produto_servico SET nome_template = REPLACE(nome_template, 'Padr?o', 'Padrão') WHERE nome_template LIKE '%Padr?o%';
UPDATE template_produto_servico SET nome_template = REPLACE(nome_template, 'PADR?O', 'PADRÃO') WHERE nome_template LIKE '%PADR?O%';

-- produto_nome
UPDATE template_produto_servico SET produto_nome = REPLACE(produto_nome, 'COMBUST?VEL', 'COMBUSTÍVEL') WHERE produto_nome LIKE '%COMBUST?VEL%';
UPDATE template_produto_servico SET produto_nome = REPLACE(produto_nome, 'Combust?vel', 'Combustível') WHERE produto_nome LIKE '%Combust?vel%';
UPDATE template_produto_servico SET produto_nome = REPLACE(produto_nome, 'REVIS?O', 'REVISÃO') WHERE produto_nome LIKE '%REVIS?O%';
UPDATE template_produto_servico SET produto_nome = REPLACE(produto_nome, 'Revis?o', 'Revisão') WHERE produto_nome LIKE '%Revis?o%';
UPDATE template_produto_servico SET produto_nome = REPLACE(produto_nome, 'revis?o', 'revisão') WHERE produto_nome LIKE '%revis?o%';

-- categoria
UPDATE template_produto_servico SET categoria = REPLACE(categoria, 'COMBUST?VEL', 'COMBUSTÍVEL') WHERE categoria LIKE '%COMBUST?VEL%';
UPDATE template_produto_servico SET categoria = REPLACE(categoria, 'Combust?vel', 'Combustível') WHERE categoria LIKE '%Combust?vel%';
UPDATE template_produto_servico SET categoria = REPLACE(categoria, 'El?trico', 'Elétrico') WHERE categoria LIKE '%El?trico%';
UPDATE template_produto_servico SET categoria = REPLACE(categoria, 'H?lice', 'Hélice') WHERE categoria LIKE '%H?lice%';

-- tipo_servico_nome
UPDATE template_produto_servico SET tipo_servico_nome = REPLACE(tipo_servico_nome, 'REVIS?O', 'REVISÃO') WHERE tipo_servico_nome LIKE '%REVIS?O%';
UPDATE template_produto_servico SET tipo_servico_nome = REPLACE(tipo_servico_nome, 'Revis?o', 'Revisão') WHERE tipo_servico_nome LIKE '%Revis?o%';
UPDATE template_produto_servico SET tipo_servico_nome = REPLACE(tipo_servico_nome, 'INSPE??O', 'INSPEÇÃO') WHERE tipo_servico_nome LIKE '%INSPE??O%';
UPDATE template_produto_servico SET tipo_servico_nome = REPLACE(tipo_servico_nome, 'Inspe??o', 'Inspeção') WHERE tipo_servico_nome LIKE '%Inspe??o%';

-- tipo_servico.nome
UPDATE tipo_servico SET nome = REPLACE(nome, 'REVIS?O', 'REVISÃO') WHERE nome LIKE '%REVIS?O%';
UPDATE tipo_servico SET nome = REPLACE(nome, 'Revis?o', 'Revisão') WHERE nome LIKE '%Revis?o%';
UPDATE tipo_servico SET nome = REPLACE(nome, 'INSPE??O', 'INSPEÇÃO') WHERE nome LIKE '%INSPE??O%';
UPDATE tipo_servico SET nome = REPLACE(nome, 'Inspe??o', 'Inspeção') WHERE nome LIKE '%Inspe??o%';
UPDATE tipo_servico SET nome = REPLACE(nome, 'COMBUST?VEL', 'COMBUSTÍVEL') WHERE nome LIKE '%COMBUST?VEL%';
UPDATE tipo_servico SET nome = REPLACE(nome, 'Combust?vel', 'Combustível') WHERE nome LIKE '%Combust?vel%';
UPDATE tipo_servico SET nome = REPLACE(nome, 'El?trico', 'Elétrico') WHERE nome LIKE '%El?trico%';
UPDATE tipo_servico SET nome = REPLACE(nome, 'H?lice', 'Hélice') WHERE nome LIKE '%H?lice%';

UPDATE template_produto_servico t
INNER JOIN tipo_servico ts ON t.id_tipo_servico = ts.id
SET t.tipo_servico_nome = ts.nome
WHERE t.tipo_servico_nome LIKE '%?%'
  AND ts.nome IS NOT NULL
  AND ts.nome NOT LIKE '%?%';
