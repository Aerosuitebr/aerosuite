ALTER TABLE perfil ADD COLUMN owner_tenant_id BIGINT NULL;

-- Older installations may have either or both of these single-column indexes.
SET @old_profile_indexes = (
    SELECT GROUP_CONCAT(CONCAT('DROP INDEX `', INDEX_NAME, '`') SEPARATOR ', ')
    FROM (
        SELECT INDEX_NAME
        FROM information_schema.statistics
        WHERE table_schema = DATABASE() AND table_name = 'perfil'
          AND NON_UNIQUE = 0 AND INDEX_NAME <> 'PRIMARY'
        GROUP BY INDEX_NAME
        HAVING COUNT(*) = 1 AND MAX(COLUMN_NAME) = 'codigo'
    ) indexes_to_replace
);
SET @profile_index_sql = CONCAT(
    'ALTER TABLE perfil ',
    IF(@old_profile_indexes IS NULL, '', CONCAT(@old_profile_indexes, ', ')),
    'ADD CONSTRAINT uk_perfil_owner_codigo UNIQUE (owner_tenant_id, codigo), ',
    'ADD CONSTRAINT fk_perfil_owner_tenant FOREIGN KEY (owner_tenant_id) REFERENCES tenant(id)'
);
PREPARE profile_index_stmt FROM @profile_index_sql;
EXECUTE profile_index_stmt;
DEALLOCATE PREPARE profile_index_stmt;

-- Preserve customized legacy profiles and their grants for organizations that use them.
-- Catalog profiles supplied by the platform remain available as shared defaults.
CREATE TEMPORARY TABLE legacy_private_profiles AS
SELECT id, codigo FROM perfil
WHERE UPPER(TRIM(codigo)) NOT IN (
    'ADMIN', 'ADMINISTRADOR', 'DIRETOR', 'ATENDENTE', 'CALIBRACAO', 'COMERCIAL',
    'ESTOQUISTA', 'FERRAMENTISTA', 'MECANICO', 'MONTADOR', 'P145_ALMOX', 'P145_COMERCIAL',
    'P145_EXECUCAO', 'P145_INSPETOR', 'P145_RT', 'PLATFORM_OPS', 'SGQ', 'SUPRIMENTO',
    'VENDEDOR', 'VISITANTE'
) AND COALESCE(oculto, FALSE) = FALSE;

INSERT INTO perfil (nome, descricao, codigo, ativo, oculto, created_at, updated_at, owner_tenant_id)
SELECT DISTINCT p.nome, p.descricao, p.codigo, p.ativo, p.oculto, p.created_at, p.updated_at, u.tenant_id
FROM legacy_private_profiles legacy
JOIN perfil p ON p.id = legacy.id
JOIN usuario u ON u.perfil_id = p.id
WHERE u.tenant_id <> 1;

INSERT INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT copy.id, grant_row.funcionalidade_id
FROM legacy_private_profiles legacy
JOIN perfil copy ON copy.codigo = legacy.codigo AND copy.owner_tenant_id <> 1
JOIN perfil_funcionalidade grant_row ON grant_row.perfil_id = legacy.id;

UPDATE usuario u
JOIN legacy_private_profiles legacy ON legacy.id = u.perfil_id
JOIN perfil copy ON copy.owner_tenant_id = u.tenant_id AND copy.codigo = legacy.codigo
SET u.perfil_id = copy.id;

UPDATE perfil p
JOIN legacy_private_profiles legacy ON legacy.id = p.id
SET p.owner_tenant_id = 1;

DROP TEMPORARY TABLE legacy_private_profiles;
