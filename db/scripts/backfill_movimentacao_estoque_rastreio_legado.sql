-- Backfill de rastreio em movimentacao_estoque: linhas antigas de baixa automática
-- (criadas antes de origem_saida / chave_idempotencia / id_produto_catalogo).
--
-- Pré-requisito: colunas já existem (rodar add_movimentacao_estoque_rastreio.sql).
-- Idempotente: pode executar mais de uma vez; não sobrescreve origem_saida já preenchida.
--
-- Critérios alinhados ao código Java (OsEstoqueSaidaAutomacaoService):
--   Kit FCU: motivo LIKE 'Kit FCU na OS%'
--   Troca eventual paga: motivo LIKE 'Troca eventual paga%'

SET NAMES utf8mb4;

-- MySQL Workbench "Safe Updates": o WHERE precisa usar coluna indexada (ex.: PK `m.id`).
-- Todos os UPDATE abaixo incluem `AND m.id > 0` para não falhar com Error 1175.

-- Comparações P/N: bases mistas (ex.: product utf8mb4_0900_ai_ci, item utf8mb4_unicode_ci)
-- exigem COLLATE explícito para evitar Error 1267 (Illegal mix of collations).

-- 1) Marcar saídas do kit FCU
UPDATE movimentacao_estoque m
SET
  m.origem_saida = 'OS_FCU_KIT',
  m.chave_idempotencia = CASE
    WHEN m.chave_idempotencia IS NOT NULL AND TRIM(m.chave_idempotencia) <> '' THEN m.chave_idempotencia
    ELSE CONCAT('BACKFILL_KIT|', m.id)
  END
WHERE m.tipo_movimentacao = 'SAIDA'
  AND m.id > 0
  AND (m.origem_saida IS NULL OR TRIM(COALESCE(m.origem_saida, '')) = '')
  AND m.motivo LIKE 'Kit FCU na OS%';

-- 2) Marcar saídas de troca eventual paga
UPDATE movimentacao_estoque m
SET
  m.origem_saida = 'TROCAS_EVENTUAL',
  m.chave_idempotencia = CASE
    WHEN m.chave_idempotencia IS NOT NULL AND TRIM(m.chave_idempotencia) <> '' THEN m.chave_idempotencia
    ELSE CONCAT('BACKFILL_TE|', m.id)
  END
WHERE m.tipo_movimentacao = 'SAIDA'
  AND m.id > 0
  AND (m.origem_saida IS NULL OR TRIM(COALESCE(m.origem_saida, '')) = '')
  AND m.motivo LIKE 'Troca eventual paga%';

-- 3) Preencher id_produto_catalogo do kit: OS + FCU + associação + P/N do item = product
UPDATE movimentacao_estoque m
INNER JOIN item_estoque i ON i.id = m.item_estoque_id
INNER JOIN os o ON o.id = m.os_id
INNER JOIN associacao_fcu af ON af.id_fcu = o.id_fcu
  AND (af.isActive IS NULL OR af.isActive = 1)
INNER JOIN product p ON p.id = af.id_product
  AND LOWER(TRIM(COALESCE(p.productpn, ''))) COLLATE utf8mb4_unicode_ci
    = LOWER(TRIM(COALESCE(i.part_number, ''))) COLLATE utf8mb4_unicode_ci
SET m.id_produto_catalogo = p.id
WHERE m.id > 0
  AND m.origem_saida = 'OS_FCU_KIT'
  AND (m.id_produto_catalogo IS NULL OR m.id_produto_catalogo = 0);

-- 4) Preencher id_produto_catalogo da troca eventual: item pago na OS com mesmo P/N
UPDATE movimentacao_estoque m
INNER JOIN item_estoque i ON i.id = m.item_estoque_id
INNER JOIN (
  SELECT m2.id AS mov_id, MIN(s.id) AS sol_id
  FROM movimentacao_estoque m2
  INNER JOIN item_estoque i2 ON i2.id = m2.item_estoque_id
  INNER JOIN os_solicitacao_troca_item s ON s.os_id = m2.os_id AND COALESCE(s.pago, 0) = 1
    AND LOWER(TRIM(COALESCE(s.produto_pn, ''))) COLLATE utf8mb4_unicode_ci
      = LOWER(TRIM(COALESCE(i2.part_number, ''))) COLLATE utf8mb4_unicode_ci
  WHERE m2.id > 0
    AND m2.origem_saida = 'TROCAS_EVENTUAL'
    AND (m2.id_produto_catalogo IS NULL OR m2.id_produto_catalogo = 0)
  GROUP BY m2.id
) x ON m.id = x.mov_id
INNER JOIN os_solicitacao_troca_item s2 ON s2.id = x.sol_id
SET m.id_produto_catalogo = CAST(s2.id_produto AS UNSIGNED)
WHERE m.id > 0
  AND m.origem_saida = 'TROCAS_EVENTUAL'
  AND (m.id_produto_catalogo IS NULL OR m.id_produto_catalogo = 0);
