-- Lista linhas com possivel corrupcao de acentuacao ('?' no texto).
-- Uso: mysql --default-character-set=utf8mb4 -uroot -proot aerosuite < db/scripts/diagnose_utf8_corruption.sql

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

SELECT 'funcionalidade' AS tabela, codigo AS chave, 'nome' AS coluna, nome AS valor
FROM funcionalidade WHERE nome LIKE '%?%'
UNION ALL
SELECT 'funcionalidade', codigo, 'descricao', descricao
FROM funcionalidade WHERE descricao LIKE '%?%'
UNION ALL
SELECT 'funcionalidade', codigo, 'secao', secao
FROM funcionalidade WHERE secao LIKE '%?%'
UNION ALL
SELECT 'funcionalidade', codigo, 'descricao=vazia/codigo', descricao
FROM funcionalidade
WHERE descricao = codigo OR descricao IS NULL OR TRIM(descricao) = ''
ORDER BY tabela, chave, coluna;

SELECT 'template_produto_servico' AS tabela, CAST(id AS CHAR) AS chave, 'nome_template' AS coluna, nome_template AS valor
FROM template_produto_servico WHERE nome_template LIKE '%?%'
UNION ALL
SELECT 'template_produto_servico', CAST(id AS CHAR), 'produto_nome', produto_nome
FROM template_produto_servico WHERE produto_nome LIKE '%?%'
UNION ALL
SELECT 'tipo_servico', CAST(id AS CHAR), 'nome', nome
FROM tipo_servico WHERE nome LIKE '%?%'
ORDER BY tabela, chave;

SELECT
  (SELECT COUNT(*) FROM funcionalidade WHERE nome LIKE '%?%' OR descricao LIKE '%?%' OR secao LIKE '%?%') AS funcionalidade_com_interrogacao,
  (SELECT COUNT(*) FROM template_produto_servico WHERE nome_template LIKE '%?%' OR produto_nome LIKE '%?%' OR categoria LIKE '%?%') AS templates_com_interrogacao,
  (SELECT COUNT(*) FROM tipo_servico WHERE nome LIKE '%?%') AS tipos_servico_com_interrogacao;
