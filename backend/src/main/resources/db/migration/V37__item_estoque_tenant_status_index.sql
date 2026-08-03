-- Índice para listagem de quarentena / filtro por status em volume.

SET @idx_exists := (
    SELECT COUNT(1)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'item_estoque'
      AND index_name = 'idx_item_estoque_tenant_status'
);

SET @sql := IF(
    @idx_exists = 0,
    'CREATE INDEX idx_item_estoque_tenant_status ON item_estoque (tenant_id, status)',
    'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
