-- =====================================================
-- Script Master: Executar Migração Completa
-- =====================================================
-- Este script executa todos os scripts de migração na ordem correta
-- IMPORTANTE: Revise e ajuste antes de executar!
-- =====================================================

-- =====================================================
-- CONFIGURAÇÕES
-- =====================================================
-- Ajuste estas variáveis conforme seu ambiente:
SET @banco_backup = 'aerosuite_backup_antigo';  -- Nome do banco de backup
SET @banco_destino = 'aerosuite';                -- Nome do banco destino

-- =====================================================
-- PASSO 1: BACKUP
-- =====================================================
-- Execute manualmente via mysqldump ou use o script 01_backup_banco_antigo.sql
-- IMPORTANTE: Não pule esta etapa!

-- =====================================================
-- PASSO 2: COMPARAR ESTRUTURAS
-- =====================================================
-- Execute o script 02_comparar_estruturas.sql
-- Revise as diferenças antes de prosseguir

-- =====================================================
-- PASSO 3: MIGRAR TABELAS BASE
-- =====================================================

-- 3.1. Migrar Fabricantes
SOURCE 03_migrar_fabricante.sql;
-- Verifique o resultado antes de continuar

-- 3.2. Migrar Perfis
SOURCE 04_migrar_perfil.sql;
-- Verifique o resultado antes de continuar

-- =====================================================
-- PASSO 4: MIGRAR TABELAS DEPENDENTES
-- =====================================================

-- 4.1. Migrar Usuários (depende de Perfil)
SOURCE 05_migrar_usuario.sql;
-- Verifique o resultado antes de continuar

-- 4.2. Migrar FCUs (depende de Fabricante)
SOURCE 06_migrar_fcu.sql;
-- Verifique o resultado antes de continuar

-- 4.3. Migrar OSs (depende de Fabricante e FCU)
SOURCE 07_migrar_os.sql;
-- Verifique o resultado antes de continuar

-- =====================================================
-- PASSO 5: VALIDAR MIGRAÇÃO
-- =====================================================
SOURCE 08_validar_migracao.sql;

-- =====================================================
-- OBSERVAÇÕES IMPORTANTES
-- =====================================================
-- 1. Todos os scripts usam TRANSACTION, então você pode fazer ROLLBACK se necessário
-- 2. Os scripts verificam se já existem dados antes de inserir
-- 3. Ajuste os nomes das colunas conforme sua estrutura real
-- 4. Teste primeiro em ambiente de desenvolvimento
-- 5. Faça backup antes de cada etapa crítica

-- =====================================================
-- PRÓXIMOS PASSOS APÓS MIGRAÇÃO
-- =====================================================
-- 1. Testar login com usuários migrados
-- 2. Verificar se as OSs aparecem corretamente
-- 3. Validar relacionamentos (FCU-OS, Fabricante-OS, etc.)
-- 4. Verificar se não há dados faltando
-- 5. Testar funcionalidades críticas do sistema

