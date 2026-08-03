-- =====================================================
-- Script de Comparação de Estruturas
-- =====================================================
-- Este script compara as estruturas das tabelas antigas e novas
-- para identificar diferenças antes da migração
-- =====================================================

-- Substitua 'aerosuite_antigo' pelo nome do seu banco antigo
-- e 'aerosuite_novo' pelo nome do banco novo

SET @banco_antigo = 'aerosuite';  -- Ajuste conforme necessário
SET @banco_novo = 'aerosuite';     -- Ajuste conforme necessário

-- =====================================================
-- 1. Comparar estrutura da tabela FABRICANTE
-- =====================================================
SELECT 
    'FABRICANTE' as tabela,
    'ANTIGA' as versao,
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_KEY
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = @banco_antigo 
  AND TABLE_NAME = 'fabricante'
ORDER BY ORDINAL_POSITION;

SELECT 
    'FABRICANTE' as tabela,
    'NOVA' as versao,
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_KEY
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = @banco_novo 
  AND TABLE_NAME = 'fabricante'
ORDER BY ORDINAL_POSITION;

-- =====================================================
-- 2. Comparar estrutura da tabela USUARIO
-- =====================================================
SELECT 
    'USUARIO' as tabela,
    'ANTIGA' as versao,
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = @banco_antigo 
  AND TABLE_NAME = 'usuario'
ORDER BY ORDINAL_POSITION;

SELECT 
    'USUARIO' as tabela,
    'NOVA' as versao,
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = @banco_novo 
  AND TABLE_NAME = 'usuario'
ORDER BY ORDINAL_POSITION;

-- =====================================================
-- 3. Comparar estrutura da tabela FCU
-- =====================================================
SELECT 
    'FCU' as tabela,
    'ANTIGA' as versao,
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = @banco_antigo 
  AND TABLE_NAME = 'fcu'
ORDER BY ORDINAL_POSITION;

SELECT 
    'FCU' as tabela,
    'NOVA' as versao,
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = @banco_novo 
  AND TABLE_NAME = 'fcu'
ORDER BY ORDINAL_POSITION;

-- =====================================================
-- 4. Comparar estrutura da tabela OS
-- =====================================================
SELECT 
    'OS' as tabela,
    'ANTIGA' as versao,
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = @banco_antigo 
  AND TABLE_NAME = 'os'
ORDER BY ORDINAL_POSITION;

SELECT 
    'OS' as tabela,
    'NOVA' as versao,
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = @banco_novo 
  AND TABLE_NAME = 'os'
ORDER BY ORDINAL_POSITION;

-- =====================================================
-- 5. Contar registros em cada tabela (ANTIGA vs NOVA)
-- =====================================================
SELECT 
    'fabricante' as tabela,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = @banco_antigo AND table_name = 'fabricante') as existe_antiga,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = @banco_novo AND table_name = 'fabricante') as existe_nova,
    (SELECT COUNT(*) FROM aerosuite.fabricante) as registros_antiga,
    (SELECT COUNT(*) FROM aerosuite.fabricante) as registros_nova
UNION ALL
SELECT 
    'usuario',
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = @banco_antigo AND table_name = 'usuario'),
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = @banco_novo AND table_name = 'usuario'),
    (SELECT COUNT(*) FROM aerosuite.usuario),
    (SELECT COUNT(*) FROM aerosuite.usuario)
UNION ALL
SELECT 
    'fcu',
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = @banco_antigo AND table_name = 'fcu'),
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = @banco_novo AND table_name = 'fcu'),
    (SELECT COUNT(*) FROM aerosuite.fcu),
    (SELECT COUNT(*) FROM aerosuite.fcu)
UNION ALL
SELECT 
    'os',
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = @banco_antigo AND table_name = 'os'),
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = @banco_novo AND table_name = 'os'),
    (SELECT COUNT(*) FROM aerosuite.os),
    (SELECT COUNT(*) FROM aerosuite.os);

