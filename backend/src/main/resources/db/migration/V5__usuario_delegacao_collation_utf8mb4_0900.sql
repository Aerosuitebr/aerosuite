-- Alinha `usuario_delegacao_funcionalidade` ao collation do resto do schema (EstruturaBanco / servidor 8.x).
-- Instalações antigas criaram a tabela em utf8mb4_unicode_ci (V3 anterior); idempotente após CONVERT.

SET @exists := (
    SELECT COUNT(*) FROM information_schema.tables
    WHERE table_schema = DATABASE() AND table_name = 'usuario_delegacao_funcionalidade'
);
SET @sql := IF(@exists > 0,
    'ALTER TABLE usuario_delegacao_funcionalidade CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci',
    'SELECT ''skip: usuario_delegacao_funcionalidade absent'' AS flyway_note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
