-- Listagem de fornecedores: filtro tenant + is_active (Panache/Hibernate multitenant).

SET @idx_exists := (
    SELECT COUNT(1)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'fornecedor'
      AND index_name = 'idx_fornecedor_tenant_active'
);

SET @sql := IF(
    @idx_exists = 0,
    'CREATE INDEX idx_fornecedor_tenant_active ON fornecedor (tenant_id, is_active, razao_social)',
    'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
