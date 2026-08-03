-- ========================================
-- VERIFICAR TIPOS DAS COLUNAS PARA FKs
-- ========================================
-- Execute este script no MySQL Workbench para ver os tipos exatos

USE aerosuite;

-- Ver tipo da coluna os.id
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_KEY
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'aerosuite' 
AND TABLE_NAME = 'os' 
AND COLUMN_NAME = 'id';

-- Ver tipo da coluna tp_files.id
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_KEY
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'aerosuite' 
AND TABLE_NAME = 'tp_files' 
AND COLUMN_NAME = 'id';

-- Ver tipo da coluna usuario.id
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_KEY
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'aerosuite' 
AND TABLE_NAME = 'usuario' 
AND COLUMN_NAME = 'id';
