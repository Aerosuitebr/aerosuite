-- ===========================================
-- SCRIPT SIMPLIFICADO - Seção COMERCIAL
-- Execute cada bloco separadamente se necessário
-- ===========================================

-- 1. Inserir funcionalidade: Propostas Comerciais
INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, tipo, visivel, posicao, ativo, created_at, updated_at)
VALUES ('Propostas Comerciais', 'Criar e gerenciar propostas comerciais', 'propostas-comerciais', 'pi pi-file-edit', '/propostas-comerciais', 1, 'Comercial', 'funcionalidade', 1, 1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- 2. Inserir funcionalidade: Templates de Proposta
INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, tipo, visivel, posicao, ativo, created_at, updated_at)
VALUES ('Templates de Proposta', 'Gerenciar templates de produtos e serviços', 'templates-proposta', 'pi pi-th-large', '/templates-proposta', 2, 'Comercial', 'funcionalidade', 1, 2, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- 3. Verificar IDs criados
SELECT id, nome, codigo, secao FROM funcionalidade WHERE secao = 'Comercial';

-- 4. Associar ao perfil Administrador (ajuste o perfil_id conforme seu banco)
-- Primeiro, descubra o ID do perfil administrador:
SELECT id, nome, codigo FROM perfil;

-- Depois, execute os INSERTs abaixo substituindo o 1 pelo ID correto do perfil admin:
-- (Se o ID do admin for 1, pode executar diretamente)

INSERT IGNORE INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT 1, id FROM funcionalidade WHERE codigo = 'propostas-comerciais';

INSERT IGNORE INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT 1, id FROM funcionalidade WHERE codigo = 'templates-proposta';

-- 5. Verificar associações
SELECT p.nome AS perfil, f.nome AS funcionalidade, f.rota 
FROM perfil_funcionalidade pf
JOIN perfil p ON p.id = pf.perfil_id
JOIN funcionalidade f ON f.id = pf.funcionalidade_id
WHERE f.secao = 'Comercial';
