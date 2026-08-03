-- Uniques globais → compostos (tenant_id, coluna) para permitir o mesmo código/número em tenants distintos.
-- Remove apenas índices UNIQUE de uma coluna (não toca em uk_* já compostos com tenant_id).
-- Diagnóstico: SELECT index_name, GROUP_CONCAT(column_name ORDER BY seq_in_index)
--   FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = '<tabela>'
--   AND non_unique = 0 GROUP BY index_name;

-- ========== usuario (email) ==========
SET @idx := (
    SELECT s.INDEX_NAME
    FROM information_schema.STATISTICS s
    WHERE s.TABLE_SCHEMA = DATABASE() AND s.TABLE_NAME = 'usuario'
      AND s.NON_UNIQUE = 0 AND s.INDEX_NAME <> 'PRIMARY'
    GROUP BY s.INDEX_NAME
    HAVING GROUP_CONCAT(s.COLUMN_NAME ORDER BY s.SEQ_IN_INDEX) = 'email'
    LIMIT 1
);
SET @sql := IF(@idx IS NOT NULL, CONCAT('ALTER TABLE usuario DROP INDEX `', @idx, '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'usuario'
      AND CONSTRAINT_NAME = 'uk_usuario_tenant_email'
);
SET @sql := IF(@exists = 0,
    'ALTER TABLE usuario ADD CONSTRAINT uk_usuario_tenant_email UNIQUE (tenant_id, email)',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ========== proposta_comercial (numero_proposta) ==========
SET @idx := (
    SELECT s.INDEX_NAME
    FROM information_schema.STATISTICS s
    WHERE s.TABLE_SCHEMA = DATABASE() AND s.TABLE_NAME = 'proposta_comercial'
      AND s.NON_UNIQUE = 0 AND s.INDEX_NAME <> 'PRIMARY'
    GROUP BY s.INDEX_NAME
    HAVING GROUP_CONCAT(s.COLUMN_NAME ORDER BY s.SEQ_IN_INDEX) = 'numero_proposta'
    LIMIT 1
);
SET @sql := IF(@idx IS NOT NULL, CONCAT('ALTER TABLE proposta_comercial DROP INDEX `', @idx, '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'proposta_comercial'
      AND CONSTRAINT_NAME = 'uk_proposta_comercial_tenant_numero'
);
SET @sql := IF(@exists = 0,
    'ALTER TABLE proposta_comercial ADD CONSTRAINT uk_proposta_comercial_tenant_numero UNIQUE (tenant_id, numero_proposta)',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ========== fornecedor (codigo) ==========
SET @idx := (
    SELECT s.INDEX_NAME
    FROM information_schema.STATISTICS s
    WHERE s.TABLE_SCHEMA = DATABASE() AND s.TABLE_NAME = 'fornecedor'
      AND s.NON_UNIQUE = 0 AND s.INDEX_NAME <> 'PRIMARY'
    GROUP BY s.INDEX_NAME
    HAVING GROUP_CONCAT(s.COLUMN_NAME ORDER BY s.SEQ_IN_INDEX) = 'codigo'
    LIMIT 1
);
SET @sql := IF(@idx IS NOT NULL, CONCAT('ALTER TABLE fornecedor DROP INDEX `', @idx, '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'fornecedor'
      AND CONSTRAINT_NAME = 'uk_fornecedor_tenant_codigo'
);
SET @sql := IF(@exists = 0,
    'ALTER TABLE fornecedor ADD CONSTRAINT uk_fornecedor_tenant_codigo UNIQUE (tenant_id, codigo)',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ========== lote (codigo_lote) ==========
SET @idx := (
    SELECT s.INDEX_NAME
    FROM information_schema.STATISTICS s
    WHERE s.TABLE_SCHEMA = DATABASE() AND s.TABLE_NAME = 'lote'
      AND s.NON_UNIQUE = 0 AND s.INDEX_NAME <> 'PRIMARY'
    GROUP BY s.INDEX_NAME
    HAVING GROUP_CONCAT(s.COLUMN_NAME ORDER BY s.SEQ_IN_INDEX) = 'codigo_lote'
    LIMIT 1
);
SET @sql := IF(@idx IS NOT NULL, CONCAT('ALTER TABLE lote DROP INDEX `', @idx, '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'lote'
      AND CONSTRAINT_NAME = 'uk_lote_tenant_codigo'
);
SET @sql := IF(@exists = 0,
    'ALTER TABLE lote ADD CONSTRAINT uk_lote_tenant_codigo UNIQUE (tenant_id, codigo_lote)',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ========== item_estoque (codigo_rastreio) ==========
SET @idx := (
    SELECT s.INDEX_NAME
    FROM information_schema.STATISTICS s
    WHERE s.TABLE_SCHEMA = DATABASE() AND s.TABLE_NAME = 'item_estoque'
      AND s.NON_UNIQUE = 0 AND s.INDEX_NAME <> 'PRIMARY'
    GROUP BY s.INDEX_NAME
    HAVING GROUP_CONCAT(s.COLUMN_NAME ORDER BY s.SEQ_IN_INDEX) = 'codigo_rastreio'
    LIMIT 1
);
SET @sql := IF(@idx IS NOT NULL, CONCAT('ALTER TABLE item_estoque DROP INDEX `', @idx, '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'item_estoque'
      AND CONSTRAINT_NAME = 'uk_item_estoque_tenant_rastreio'
);
SET @sql := IF(@exists = 0,
    'ALTER TABLE item_estoque ADD CONSTRAINT uk_item_estoque_tenant_rastreio UNIQUE (tenant_id, codigo_rastreio)',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ========== product (codigo_barras) — nullable; MySQL permite vários NULL ==========
SET @idx := (
    SELECT s.INDEX_NAME
    FROM information_schema.STATISTICS s
    WHERE s.TABLE_SCHEMA = DATABASE() AND s.TABLE_NAME = 'product'
      AND s.NON_UNIQUE = 0 AND s.INDEX_NAME <> 'PRIMARY'
    GROUP BY s.INDEX_NAME
    HAVING GROUP_CONCAT(s.COLUMN_NAME ORDER BY s.SEQ_IN_INDEX) = 'codigo_barras'
    LIMIT 1
);
SET @sql := IF(@idx IS NOT NULL, CONCAT('ALTER TABLE product DROP INDEX `', @idx, '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'product'
      AND CONSTRAINT_NAME = 'uk_product_tenant_codigo_barras'
);
SET @sql := IF(@exists = 0,
    'ALTER TABLE product ADD CONSTRAINT uk_product_tenant_codigo_barras UNIQUE (tenant_id, codigo_barras)',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
