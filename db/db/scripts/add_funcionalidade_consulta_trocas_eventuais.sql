-- =============================================================================
-- Funcionalidade: Consulta trocas eventuais (menu + controle de acesso por perfil)
-- MySQL/MariaDB — idempotente (pode executar mais de uma vez)
-- =============================================================================
-- Regra de perfis: recebem a funcionalidade todos os perfis que já têm
-- "Ordem de Serviço" (ORDEM_SERVICO), para manter o mesmo público da lista de OS.
-- Para restringir (ex.: só Suprimento), remova linhas em perfil_funcionalidade via tela
-- de Controle de Acesso ou ajuste este script.
-- =============================================================================

INSERT INTO funcionalidade (
    nome,
    descricao,
    codigo,
    icone,
    rota,
    ordem,
    ativo,
    secao,
    tipo,
    visivel,
    cor_icone,
    posicao,
    created_at,
    updated_at
)
SELECT
    'Consulta Troca Eventual',
    'Listar OS com Solicitação de Troca Eventual; detalhe e status somente leitura',
    'CONSULTA_TROCAS_EVENTUAIS',
    'pi pi-search',
    '/os/consulta-trocas-eventuais',
    11,
    TRUE,
    'Cadastro',
    'funcionalidade',
    TRUE,
    '#0284c7',
    9,
    NOW(),
    NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'CONSULTA_TROCAS_EVENTUAIS');

-- Atualiza metadados se a linha já existia (reexecução)
UPDATE funcionalidade
SET
    nome = 'Consulta Troca Eventual',
    descricao = 'Listar OS com Solicitação de Troca Eventual; detalhe e status somente leitura',
    icone = 'pi pi-search',
    rota = '/os/consulta-trocas-eventuais',
    ordem = 11,
    ativo = TRUE,
    secao = 'Cadastro',
    tipo = 'funcionalidade',
    visivel = TRUE,
    cor_icone = '#0284c7',
    posicao = 9,
    updated_at = NOW()
WHERE codigo = 'CONSULTA_TROCAS_EVENTUAIS';

SET @fid_consulta_trocas := (SELECT id FROM funcionalidade WHERE codigo = 'CONSULTA_TROCAS_EVENTUAIS' LIMIT 1);

INSERT IGNORE INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT DISTINCT pf.perfil_id, @fid_consulta_trocas
FROM perfil_funcionalidade pf
INNER JOIN funcionalidade f ON f.id = pf.funcionalidade_id AND f.codigo = 'ORDEM_SERVICO'
WHERE @fid_consulta_trocas IS NOT NULL;

-- Verificação
SELECT f.id, f.codigo, f.nome, f.rota, f.secao, f.ativo, f.visivel
FROM funcionalidade f
WHERE f.codigo = 'CONSULTA_TROCAS_EVENTUAIS';

SELECT p.id AS perfil_id, p.nome AS perfil_nome, p.codigo AS perfil_codigo
FROM perfil_funcionalidade pf
JOIN perfil p ON p.id = pf.perfil_id
JOIN funcionalidade f ON f.id = pf.funcionalidade_id AND f.codigo = 'CONSULTA_TROCAS_EVENTUAIS'
ORDER BY p.id;
