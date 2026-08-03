-- Numeração única de id_os por tenant + backfill de registros importados (0/1 duplicados).
-- NC os_id passa a referenciar os.id (PK interno); ver ConformidadeNaoConformidade.

SET @__old_sql_safe_updates = @@SQL_SAFE_UPDATES;
SET SQL_SAFE_UPDATES = 0;

-- 1) OS ativas: sequência 1..N por tenant (ordem estável por id interno)
UPDATE os o
         INNER JOIN (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY tenant_id ORDER BY id) AS rn
    FROM os
    WHERE is_active = 1
) x ON x.id = o.id
SET o.id_os     = x.rn,
    o.updated_at = NOW(6);

-- 2) OS inativas: prefixo 900000 + id interno (evita colisão com ativas 1..N)
UPDATE os
SET id_os      = 900000 + id,
    updated_at = NOW(6)
WHERE is_active = 0;

-- 3) Índice único por tenant
SET @idx_exists = (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'os'
      AND index_name = 'uk_os_tenant_id_os'
);
SET @ddl = IF(
        @idx_exists = 0,
        'ALTER TABLE os ADD CONSTRAINT uk_os_tenant_id_os UNIQUE (tenant_id, id_os)',
        'SELECT 1'
           );
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4) Documentação da coluna NC (os_id = PK interno da OS)
ALTER TABLE conformidade_nao_conformidade
    MODIFY COLUMN os_id INT NULL COMMENT 'FK lógica os.id (PK interno), não id_os de negócio';

SET SQL_SAFE_UPDATES = @__old_sql_safe_updates;
