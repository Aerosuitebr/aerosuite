-- ========================================
-- ESTRUTURA MELHORADA DA TABELA FUNCIONALIDADE
-- ========================================

-- Primeiro, vamos adicionar as novas colunas à tabela existente
ALTER TABLE funcionalidade 
ADD COLUMN secao VARCHAR(50) NOT NULL DEFAULT 'Sistema' COMMENT 'Seção do menu onde a funcionalidade aparece',
ADD COLUMN parent_id BIGINT NULL COMMENT 'ID da funcionalidade pai (para submenus)',
ADD COLUMN tipo ENUM('secao', 'funcionalidade', 'submenu') NOT NULL DEFAULT 'funcionalidade' COMMENT 'Tipo do item: seção, funcionalidade ou submenu',
ADD COLUMN visivel BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Se o item deve aparecer no menu',
ADD COLUMN cor_icone VARCHAR(7) NULL COMMENT 'Cor do ícone em hexadecimal',
ADD COLUMN posicao INT NOT NULL DEFAULT 0 COMMENT 'Posição de ordenação dentro da seção';

-- Adicionar índices para melhor performance
CREATE INDEX idx_funcionalidade_secao ON funcionalidade(secao);
CREATE INDEX idx_funcionalidade_parent ON funcionalidade(parent_id);
CREATE INDEX idx_funcionalidade_tipo ON funcionalidade(tipo);
CREATE INDEX idx_funcionalidade_visivel ON funcionalidade(visivel);
CREATE INDEX idx_funcionalidade_posicao ON funcionalidade(posicao);

-- Adicionar foreign key para parent_id
ALTER TABLE funcionalidade 
ADD CONSTRAINT fk_funcionalidade_parent 
FOREIGN KEY (parent_id) REFERENCES funcionalidade(id) 
ON DELETE CASCADE ON UPDATE CASCADE;

-- ========================================
-- DADOS INICIAIS ORGANIZADOS POR SEÇÕES
-- ========================================

-- Limpar dados existentes
DELETE FROM funcionalidade;

-- ========================================
-- SEÇÃO: PRINCIPAL
-- ========================================
INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, ativo, secao, tipo, visivel, cor_icone, posicao) VALUES
('Dashboard', 'Página inicial do sistema', 'DASHBOARD', 'pi pi-home', '/', 1, TRUE, 'Principal', 'funcionalidade', TRUE, '#0ea5e9', 1);

-- ========================================
-- SEÇÃO: DOCUMENTOS
-- ========================================
INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, ativo, secao, tipo, visivel, cor_icone, posicao) VALUES
('Editor de Documentos', 'Editor de Documentos de Montagem FCU', 'EDITOR_DOCUMENTOS', 'pi pi-cog', '/fcu-assembly', 2, TRUE, 'Documentos', 'funcionalidade', TRUE, '#8b5cf6', 1);

-- ========================================
-- SEÇÃO: CADASTRO
-- ========================================
INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, ativo, secao, tipo, visivel, cor_icone, posicao) VALUES
('Produtos', 'Gerenciar produtos do sistema', 'PRODUTOS', 'pi pi-box', '/products', 3, TRUE, 'Cadastro', 'funcionalidade', TRUE, '#10b981', 1),
('Fabricantes', 'Gerenciar fabricantes', 'FABRICANTES', 'pi pi-building', '/fabricantes', 4, TRUE, 'Cadastro', 'funcionalidade', TRUE, '#f59e0b', 2),
('Tipos de Serviço', 'Gerenciar tipos de serviço', 'TIPOS_SERVICO', 'pi pi-cog', '/tipos-servico', 5, TRUE, 'Cadastro', 'funcionalidade', TRUE, '#6366f1', 3),
('FCU', 'Gerenciar FCU - Flight Control Unit', 'FCU', 'pi pi-microchip', '/fcu', 6, TRUE, 'Cadastro', 'funcionalidade', TRUE, '#ec4899', 4),
('Ordem de Serviço', 'Gerenciar Ordens de Serviço', 'ORDEM_SERVICO', 'pi pi-file-edit', '/os', 7, TRUE, 'Cadastro', 'funcionalidade', TRUE, '#06b6d4', 5),
('Arquivos Tipo Serviço', 'Gerenciar arquivos de tipos de serviço', 'ARQUIVOS_TIPO_SERVICO', 'pi pi-file', '/tpfiles', 8, TRUE, 'Cadastro', 'funcionalidade', TRUE, '#84cc16', 6),
('Usuários', 'Gerenciar usuários do sistema', 'USUARIOS', 'pi pi-users', '/usuarios', 9, TRUE, 'Cadastro', 'funcionalidade', TRUE, '#ef4444', 7),
('Definir Associação', 'Associar FCUs com produtos', 'ASSOCIACAO_FCU', 'pi pi-link', '/associacao-fcu', 10, TRUE, 'Cadastro', 'funcionalidade', TRUE, '#8b5cf6', 8);

-- ========================================
-- SEÇÃO: SISTEMA
-- ========================================
INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, ativo, secao, tipo, visivel, cor_icone, posicao) VALUES
('Configurações', 'Configurações do sistema', 'CONFIGURACOES', 'pi pi-cog', '/test', 11, TRUE, 'Sistema', 'funcionalidade', TRUE, '#6b7280', 1);

-- ========================================
-- SEÇÃO: CONTROLE DE ACESSO
-- ========================================
INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, ativo, secao, tipo, visivel, cor_icone, posicao) VALUES
('Gerenciar Permissões', 'Gerenciar permissões de funcionalidades por perfil', 'GERENCIAR_PERMISSOES', 'pi pi-shield', '/controle-acesso', 12, TRUE, 'Controle de Acesso', 'funcionalidade', TRUE, '#dc2626', 1),
('Funcionalidades', 'Gerenciar funcionalidades do sistema', 'FUNCIONALIDADES', 'pi pi-list', '/funcionalidades', 13, TRUE, 'Controle de Acesso', 'funcionalidade', TRUE, '#059669', 2),
('Perfis', 'Gerenciar perfis de usuário', 'PERFIS', 'pi pi-id-card', '/perfis', 14, TRUE, 'Controle de Acesso', 'funcionalidade', TRUE, '#7c3aed', 3);

-- ========================================
-- SEÇÃO: AÇÕES RÁPIDAS
-- ========================================
INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, ativo, secao, tipo, visivel, cor_icone, posicao) VALUES
('Novo Produto', 'Criar novo produto rapidamente', 'NOVO_PRODUTO', 'pi pi-plus', '/products/new', 15, TRUE, 'Ações Rápidas', 'funcionalidade', TRUE, '#10b981', 1),
('Relatório', 'Gerar relatórios do sistema', 'RELATORIO', 'pi pi-chart-bar', '/relatorios', 16, TRUE, 'Ações Rápidas', 'funcionalidade', TRUE, '#f59e0b', 2);

-- ========================================
-- FUNCIONALIDADES ADMINISTRATIVAS (não aparecem no menu)
-- ========================================
INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, ativo, secao, tipo, visivel, cor_icone, posicao) VALUES
('Visualizar Dashboard', 'Permissão para visualizar o dashboard', 'VIEW_DASHBOARD', 'pi pi-eye', '/', 17, TRUE, 'Sistema', 'funcionalidade', FALSE, '#6b7280', 1),
('Criar Produto', 'Permissão para criar produtos', 'CREATE_PRODUTO', 'pi pi-plus', '/products', 18, TRUE, 'Sistema', 'funcionalidade', FALSE, '#10b981', 2),
('Editar Produto', 'Permissão para editar produtos', 'EDIT_PRODUTO', 'pi pi-pencil', '/products', 19, TRUE, 'Sistema', 'funcionalidade', FALSE, '#f59e0b', 3),
('Excluir Produto', 'Permissão para excluir produtos', 'DELETE_PRODUTO', 'pi pi-trash', '/products', 20, TRUE, 'Sistema', 'funcionalidade', FALSE, '#ef4444', 4),
('Visualizar Produto', 'Permissão para visualizar produtos', 'VIEW_PRODUTO', 'pi pi-eye', '/products', 21, TRUE, 'Sistema', 'funcionalidade', FALSE, '#6366f1', 5);

-- ========================================
-- ATUALIZAR TIMESTAMPS
-- ========================================
UPDATE funcionalidade SET 
    created_at = NOW(),
    updated_at = NOW()
WHERE created_at IS NULL OR updated_at IS NULL;

-- ========================================
-- VERIFICAÇÃO DOS DADOS
-- ========================================
SELECT 
    secao,
    COUNT(*) as total_funcionalidades,
    GROUP_CONCAT(nome ORDER BY posicao SEPARATOR ', ') as funcionalidades
FROM funcionalidade 
WHERE visivel = TRUE
GROUP BY secao
ORDER BY secao;
