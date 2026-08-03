-- =====================================================
-- Script de Validação da Migração
-- =====================================================
-- Valida se todos os dados foram migrados corretamente
-- Execute este script após completar todas as migrações
-- =====================================================

-- =====================================================
-- 1. Comparar contagem de registros
-- =====================================================
SELECT 
    'Comparação de Registros' as validacao,
    'FABRICANTE' as tabela,
    (SELECT COUNT(*) FROM `aerosuite_backup_antigo`.`backup_fabricante`) as antigo,
    (SELECT COUNT(*) FROM `fabricante`) as novo,
    CASE 
        WHEN (SELECT COUNT(*) FROM `aerosuite_backup_antigo`.`backup_fabricante`) = 
             (SELECT COUNT(*) FROM `fabricante`)
        THEN 'OK'
        ELSE 'DIFERENÇA'
    END as status
UNION ALL
SELECT 
    '',
    'USUARIO',
    (SELECT COUNT(*) FROM `aerosuite_backup_antigo`.`backup_usuario`),
    (SELECT COUNT(*) FROM `usuario`),
    CASE 
        WHEN (SELECT COUNT(*) FROM `aerosuite_backup_antigo`.`backup_usuario`) = 
             (SELECT COUNT(*) FROM `usuario`)
        THEN 'OK'
        ELSE 'DIFERENÇA'
    END
UNION ALL
SELECT 
    '',
    'FCU',
    (SELECT COUNT(*) FROM `aerosuite_backup_antigo`.`backup_fcu`),
    (SELECT COUNT(*) FROM `fcu`),
    CASE 
        WHEN (SELECT COUNT(*) FROM `aerosuite_backup_antigo`.`backup_fcu`) = 
             (SELECT COUNT(*) FROM `fcu`)
        THEN 'OK'
        ELSE 'DIFERENÇA'
    END
UNION ALL
SELECT 
    '',
    'OS',
    (SELECT COUNT(*) FROM `aerosuite_backup_antigo`.`backup_os`),
    (SELECT COUNT(*) FROM `os`),
    CASE 
        WHEN (SELECT COUNT(*) FROM `aerosuite_backup_antigo`.`backup_os`) = 
             (SELECT COUNT(*) FROM `os`)
        THEN 'OK'
        ELSE 'DIFERENÇA'
    END;

-- =====================================================
-- 2. Validar integridade referencial
-- =====================================================
SELECT 
    'Integridade Referencial' as validacao,
    'Usuários sem perfil' as tipo,
    COUNT(*) as quantidade,
    CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'ERRO' END as status
FROM `usuario`
WHERE `perfil_id` IS NULL
UNION ALL
SELECT 
    '',
    'FCUs com fabricante inválido',
    COUNT(*),
    CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'ERRO' END
FROM `fcu` f
WHERE NOT EXISTS (SELECT 1 FROM `fabricante` fab WHERE fab.id = f.id_fabricante)
UNION ALL
SELECT 
    '',
    'OSs com fabricante inválido',
    COUNT(*),
    CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'ERRO' END
FROM `os` o
WHERE o.`id_fabricante` IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM `fabricante` fab WHERE fab.id = o.id_fabricante)
UNION ALL
SELECT 
    '',
    'OSs com FCU inválido',
    COUNT(*),
    CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'ERRO' END
FROM `os` o
WHERE o.`id_fcu` IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM `fcu` fc WHERE fc.id = o.id_fcu);

-- =====================================================
-- 3. Validar dados críticos
-- =====================================================
SELECT 
    'Dados Críticos' as validacao,
    'Perfil ADMIN existe' as tipo,
    CASE WHEN EXISTS (SELECT 1 FROM `perfil` WHERE codigo = 'ADMIN') THEN 'OK' ELSE 'ERRO' END as status
UNION ALL
SELECT 
    '',
    'Existe pelo menos 1 usuário',
    CASE WHEN EXISTS (SELECT 1 FROM `usuario`) THEN 'OK' ELSE 'ERRO' END
UNION ALL
SELECT 
    '',
    'Existe pelo menos 1 fabricante',
    CASE WHEN EXISTS (SELECT 1 FROM `fabricante`) THEN 'OK' ELSE 'ERRO' END;

-- =====================================================
-- 4. Verificar duplicatas
-- =====================================================
SELECT 
    'Duplicatas' as validacao,
    'Emails duplicados em usuários' as tipo,
    COUNT(*) as quantidade,
    CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'ERRO' END as status
FROM (
    SELECT email, COUNT(*) as cnt
    FROM `usuario`
    GROUP BY email
    HAVING cnt > 1
) duplicados
UNION ALL
SELECT 
    '',
    'IDs duplicados em fabricante',
    COUNT(*),
    CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'ERRO' END
FROM (
    SELECT id, COUNT(*) as cnt
    FROM `fabricante`
    GROUP BY id
    HAVING cnt > 1
) duplicados;

-- =====================================================
-- 5. Resumo final
-- =====================================================
SELECT 
    'RESUMO FINAL DA MIGRAÇÃO' as titulo,
    '' as detalhe
UNION ALL
SELECT 
    'Total de Fabricantes:',
    CAST((SELECT COUNT(*) FROM `fabricante`) AS CHAR)
UNION ALL
SELECT 
    'Total de Usuários:',
    CAST((SELECT COUNT(*) FROM `usuario`) AS CHAR)
UNION ALL
SELECT 
    'Total de FCUs:',
    CAST((SELECT COUNT(*) FROM `fcu`) AS CHAR)
UNION ALL
SELECT 
    'Total de OSs:',
    CAST((SELECT COUNT(*) FROM `os`) AS CHAR)
UNION ALL
SELECT 
    '',
    ''
UNION ALL
SELECT 
    'Status Geral:',
    CASE 
        WHEN (SELECT COUNT(*) FROM `usuario` WHERE `perfil_id` IS NULL) = 0
         AND (SELECT COUNT(*) FROM `fcu` f WHERE NOT EXISTS (SELECT 1 FROM `fabricante` fab WHERE fab.id = f.id_fabricante)) = 0
         AND (SELECT COUNT(*) FROM `os` o WHERE o.`id_fabricante` IS NOT NULL AND NOT EXISTS (SELECT 1 FROM `fabricante` fab WHERE fab.id = o.id_fabricante)) = 0
         AND (SELECT COUNT(*) FROM `os` o WHERE o.`id_fcu` IS NOT NULL AND NOT EXISTS (SELECT 1 FROM `fcu` fc WHERE fc.id = o.id_fcu)) = 0
        THEN 'MIGRAÇÃO CONCLUÍDA COM SUCESSO ✓'
        ELSE 'ATENÇÃO: Verifique os erros acima ⚠'
    END;

