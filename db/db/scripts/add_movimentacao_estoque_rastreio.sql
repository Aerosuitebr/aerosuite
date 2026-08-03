-- Rastreio de saídas automáticas (kit FCU na OS e trocas eventuais pagas) em movimentacao_estoque
-- Compatível com MySQL: idempotente (pode rodar várias vezes).
-- Depois, para marcar movimentações antigas: db/scripts/backfill_movimentacao_estoque_rastreio_legado.sql

-- 1) origem_saida
SET @c1 := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'movimentacao_estoque' AND COLUMN_NAME = 'origem_saida'
);
SET @sql1 := IF(@c1 = 0,
  "ALTER TABLE movimentacao_estoque ADD COLUMN origem_saida VARCHAR(40) NULL COMMENT 'OS_FCU_KIT, TROCAS_EVENTUAL'",
  "SELECT 'coluna origem_saida já existe' AS msg");
PREPARE s1 FROM @sql1; EXECUTE s1; DEALLOCATE PREPARE s1;

-- 2) id_produto_catalogo
SET @c2 := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'movimentacao_estoque' AND COLUMN_NAME = 'id_produto_catalogo'
);
SET @sql2 := IF(@c2 = 0,
  "ALTER TABLE movimentacao_estoque ADD COLUMN id_produto_catalogo INT NULL",
  "SELECT 'coluna id_produto_catalogo já existe' AS msg");
PREPARE s2 FROM @sql2; EXECUTE s2; DEALLOCATE PREPARE s2;

-- 3) chave_idempotencia
SET @c3 := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'movimentacao_estoque' AND COLUMN_NAME = 'chave_idempotencia'
);
SET @sql3 := IF(@c3 = 0,
  "ALTER TABLE movimentacao_estoque ADD COLUMN chave_idempotencia VARCHAR(160) NULL",
  "SELECT 'coluna chave_idempotencia já existe' AS msg");
PREPARE s3 FROM @sql3; EXECUTE s3; DEALLOCATE PREPARE s3;

-- 4) índice único (vários NULL permitidos no MySQL)
SET @i1 := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'movimentacao_estoque' AND INDEX_NAME = 'uk_mov_est_chave_idempotencia'
);
SET @sql4 := IF(@i1 = 0,
  "CREATE UNIQUE INDEX uk_mov_est_chave_idempotencia ON movimentacao_estoque (chave_idempotencia)",
  "SELECT 'índice uk_mov_est_chave_idempotencia já existe' AS msg");
PREPARE s4 FROM @sql4; EXECUTE s4; DEALLOCATE PREPARE s4;
