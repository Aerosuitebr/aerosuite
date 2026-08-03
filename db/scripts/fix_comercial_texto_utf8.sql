-- Repara textos comerciais com '?' no lugar de acentos. Ver V26__comercial_repair_utf8_text.sql (mesma logica).
-- mysql --default-character-set=utf8mb4 -uroot -proot aerosuite < db/scripts/fix_comercial_texto_utf8.sql

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

UPDATE template_produto_servico SET nome_template = REPLACE(nome_template, 'COMBUST?VEL', 'COMBUSTÍVEL') WHERE nome_template LIKE '%COMBUST?VEL%';
UPDATE template_produto_servico SET nome_template = REPLACE(nome_template, 'Combust?vel', 'Combustível') WHERE nome_template LIKE '%Combust?vel%';
UPDATE template_produto_servico SET nome_template = REPLACE(nome_template, 'REVIS?O', 'REVISÃO') WHERE nome_template LIKE '%REVIS?O%';
UPDATE template_produto_servico SET nome_template = REPLACE(nome_template, 'Revis?o', 'Revisão') WHERE nome_template LIKE '%Revis?o%';
UPDATE template_produto_servico SET nome_template = REPLACE(nome_template, 'revis?o', 'revisão') WHERE nome_template LIKE '%revis?o%';
UPDATE template_produto_servico SET produto_nome = REPLACE(produto_nome, 'COMBUST?VEL', 'COMBUSTÍVEL') WHERE produto_nome LIKE '%COMBUST?VEL%';
UPDATE template_produto_servico SET produto_nome = REPLACE(produto_nome, 'Combust?vel', 'Combustível') WHERE produto_nome LIKE '%Combust?vel%';
UPDATE template_produto_servico SET produto_nome = REPLACE(produto_nome, 'REVIS?O', 'REVISÃO') WHERE produto_nome LIKE '%REVIS?O%';
UPDATE template_produto_servico SET produto_nome = REPLACE(produto_nome, 'Revis?o', 'Revisão') WHERE produto_nome LIKE '%Revis?o%';
UPDATE template_produto_servico SET categoria = REPLACE(categoria, 'Combust?vel', 'Combustível') WHERE categoria LIKE '%Combust?vel%';
UPDATE template_produto_servico SET categoria = REPLACE(categoria, 'El?trico', 'Elétrico') WHERE categoria LIKE '%El?trico%';
UPDATE template_produto_servico SET tipo_servico_nome = REPLACE(tipo_servico_nome, 'REVIS?O', 'REVISÃO') WHERE tipo_servico_nome LIKE '%REVIS?O%';
UPDATE template_produto_servico SET tipo_servico_nome = REPLACE(tipo_servico_nome, 'Revis?o', 'Revisão') WHERE tipo_servico_nome LIKE '%Revis?o%';
UPDATE tipo_servico SET nome = REPLACE(nome, 'REVIS?O', 'REVISÃO') WHERE nome LIKE '%REVIS?O%';
UPDATE tipo_servico SET nome = REPLACE(nome, 'Revis?o', 'Revisão') WHERE nome LIKE '%Revis?o%';
UPDATE tipo_servico SET nome = REPLACE(nome, 'Combust?vel', 'Combustível') WHERE nome LIKE '%Combust?vel%';

UPDATE template_produto_servico t
INNER JOIN tipo_servico ts ON t.id_tipo_servico = ts.id
SET t.tipo_servico_nome = ts.nome
WHERE t.tipo_servico_nome LIKE '%?%'
  AND ts.nome IS NOT NULL
  AND ts.nome NOT LIKE '%?%';

SELECT 'fix_comercial_texto_utf8 concluido' AS resultado;
