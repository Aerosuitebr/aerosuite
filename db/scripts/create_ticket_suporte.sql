-- =====================================================
-- Script de Criação das Tabelas do Sistema de Suporte
-- Aero Suite - Sistema de Chamados e Tickets
-- =====================================================

-- Tabela principal de Tickets
CREATE TABLE IF NOT EXISTS ticket (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    numero VARCHAR(20) NOT NULL UNIQUE,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    tipo VARCHAR(50) NOT NULL DEFAULT 'ERRO',
    prioridade VARCHAR(20) NOT NULL DEFAULT 'MEDIA',
    status VARCHAR(30) NOT NULL DEFAULT 'ABERTO',
    categoria VARCHAR(100),
    subcategoria VARCHAR(100),
    passos_reproduzir TEXT,
    comportamento_esperado TEXT,
    comportamento_atual TEXT,
    ambiente VARCHAR(50),
    navegador VARCHAR(100),
    sistema_operacional VARCHAR(100),
    versao_sistema VARCHAR(50),
    usuario_id BIGINT,
    usuario_nome VARCHAR(255),
    usuario_email VARCHAR(255),
    atendente_id BIGINT,
    atendente_nome VARCHAR(255),
    data_abertura DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_primeira_resposta DATETIME,
    data_resolucao DATETIME,
    data_fechamento DATETIME,
    data_ultima_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    sla_primeira_resposta_horas INT,
    sla_resolucao_horas INT,
    sla_primeira_resposta_estourado BOOLEAN DEFAULT FALSE,
    sla_resolucao_estourado BOOLEAN DEFAULT FALSE,
    avaliacao INT,
    comentario_avaliacao TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    
    INDEX idx_ticket_numero (numero),
    INDEX idx_ticket_status (status),
    INDEX idx_ticket_prioridade (prioridade),
    INDEX idx_ticket_tipo (tipo),
    INDEX idx_ticket_usuario (usuario_id),
    INDEX idx_ticket_atendente (atendente_id),
    INDEX idx_ticket_data_abertura (data_abertura),
    INDEX idx_ticket_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Anexos dos Tickets
CREATE TABLE IF NOT EXISTS ticket_attachment (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ticket_id BIGINT NOT NULL,
    nome_arquivo VARCHAR(255) NOT NULL,
    nome_original VARCHAR(255),
    tipo_arquivo VARCHAR(100),
    tamanho_bytes BIGINT,
    caminho_arquivo VARCHAR(500),
    url_download VARCHAR(500),
    descricao VARCHAR(500),
    tipo_anexo VARCHAR(50) DEFAULT 'OUTRO',
    usuario_id BIGINT,
    usuario_nome VARCHAR(255),
    data_upload DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (ticket_id) REFERENCES ticket(id) ON DELETE CASCADE,
    INDEX idx_attachment_ticket (ticket_id),
    INDEX idx_attachment_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Comentários dos Tickets
CREATE TABLE IF NOT EXISTS ticket_comment (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ticket_id BIGINT NOT NULL,
    conteudo TEXT NOT NULL,
    tipo VARCHAR(30) NOT NULL DEFAULT 'COMENTARIO',
    visivel_usuario BOOLEAN DEFAULT TRUE,
    usuario_id BIGINT,
    usuario_nome VARCHAR(255),
    usuario_tipo VARCHAR(50),
    status_anterior VARCHAR(30),
    status_novo VARCHAR(30),
    data_criacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_edicao DATETIME,
    is_active BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (ticket_id) REFERENCES ticket(id) ON DELETE CASCADE,
    INDEX idx_comment_ticket (ticket_id),
    INDEX idx_comment_tipo (tipo),
    INDEX idx_comment_usuario (usuario_id),
    INDEX idx_comment_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Notificações do Sistema
CREATE TABLE IF NOT EXISTS notificacao (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    mensagem TEXT,
    link VARCHAR(500),
    referencia_tipo VARCHAR(50),
    referencia_id BIGINT,
    lida BOOLEAN DEFAULT FALSE,
    data_criacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_leitura DATETIME,
    is_active BOOLEAN DEFAULT TRUE,
    
    INDEX idx_notificacao_usuario (usuario_id),
    INDEX idx_notificacao_lida (lida),
    INDEX idx_notificacao_data (data_criacao),
    INDEX idx_notificacao_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Inserir categorias padrão de tickets
-- =====================================================

-- Não há tabela de categorias separada, mas aqui estão as categorias sugeridas:
-- ESTOQUE, PRODUTOS, OS, FCU, COMERCIAL, FINANCEIRO, RELATORIOS, USUARIOS, INTEGRACAO, OUTRO

-- =====================================================
-- Comentários sobre os campos
-- =====================================================

-- TIPO: ERRO, MELHORIA, DUVIDA, SOLICITACAO
-- PRIORIDADE: BAIXA, MEDIA, ALTA, CRITICA
-- STATUS: ABERTO, EM_ANALISE, EM_ANDAMENTO, AGUARDANDO_USUARIO, RESOLVIDO, FECHADO
-- AMBIENTE: PRODUCAO, HOMOLOGACAO, DESENVOLVIMENTO
-- TIPO_ANEXO: SCREENSHOT, LOG, DOCUMENTO, VIDEO, OUTRO
-- TIPO_COMENTARIO: COMENTARIO, RESPOSTA, ALTERACAO_STATUS, INTERNO, SOLUCAO
-- USUARIO_TIPO: CLIENTE, ATENDENTE, SISTEMA


-- =====================================================
-- FUNCIONALIDADES DO MÓDULO SUPORTE
-- =====================================================

-- Funcionalidade: Central de Suporte (Menu Principal)
INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Central de Suporte', 'Acessar a Central de Chamados e Suporte', 'suporte', 'pi pi-headphones', '/suporte', 1, 'Suporte', 'funcionalidade', TRUE, 900, TRUE, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'suporte');

-- Funcionalidade: Meus Chamados
INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Meus Chamados', 'Visualizar e acompanhar seus chamados de suporte', 'suporte-chamados', 'pi pi-inbox', '/suporte', 2, 'Suporte', 'funcionalidade', TRUE, 901, TRUE, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'suporte-chamados');

-- Funcionalidade: Novo Chamado
INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Novo Chamado', 'Abrir um novo chamado de suporte', 'suporte-novo', 'pi pi-plus-circle', '/suporte/novo', 3, 'Suporte', 'funcionalidade', TRUE, 902, TRUE, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'suporte-novo');

-- Funcionalidade: Atendimento de Chamados (APENAS PARA ATENDENTES/ADMINS)
INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Atendimento', 'Central de atendimento de chamados - Gerenciar e atender chamados', 'suporte-atendimento', 'pi pi-users', '/suporte/atendimento', 4, 'Suporte', 'funcionalidade', TRUE, 903, TRUE, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'suporte-atendimento');


-- =====================================================
-- ASSOCIAR FUNCIONALIDADES AOS PERFIS
-- =====================================================

-- Associar ao perfil Administrador (ID 1)
INSERT IGNORE INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT 1, id FROM funcionalidade WHERE codigo = 'suporte';

INSERT IGNORE INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT 1, id FROM funcionalidade WHERE codigo = 'suporte-chamados';

INSERT IGNORE INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT 1, id FROM funcionalidade WHERE codigo = 'suporte-novo';

INSERT IGNORE INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT 1, id FROM funcionalidade WHERE codigo = 'suporte-atendimento';

-- Associar ao perfil Administrador (ID 13) - se existir
INSERT IGNORE INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT 13, id FROM funcionalidade WHERE codigo = 'suporte' AND EXISTS (SELECT 1 FROM perfil WHERE id = 13);

INSERT IGNORE INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT 13, id FROM funcionalidade WHERE codigo = 'suporte-chamados' AND EXISTS (SELECT 1 FROM perfil WHERE id = 13);

INSERT IGNORE INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT 13, id FROM funcionalidade WHERE codigo = 'suporte-novo' AND EXISTS (SELECT 1 FROM perfil WHERE id = 13);

INSERT IGNORE INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT 13, id FROM funcionalidade WHERE codigo = 'suporte-atendimento' AND EXISTS (SELECT 1 FROM perfil WHERE id = 13);

-- Associar a TODOS os perfis ativos (para que todos tenham acesso ao suporte básico)
INSERT IGNORE INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT p.id, f.id 
FROM perfil p, funcionalidade f 
WHERE p.ativo = 1 AND f.codigo IN ('suporte', 'suporte-chamados', 'suporte-novo');

-- Associar ATENDIMENTO apenas aos administradores (perfis com código que contenha 'admin')
INSERT IGNORE INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT p.id, f.id 
FROM perfil p, funcionalidade f 
WHERE p.ativo = 1 AND (p.codigo LIKE '%admin%' OR p.nome LIKE '%Admin%' OR p.id IN (1, 13)) 
AND f.codigo = 'suporte-atendimento';


-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Verificar funcionalidades criadas
SELECT id, nome, codigo, secao, rota, ativo FROM funcionalidade WHERE secao = 'Suporte';

-- Verificar associações com perfis
SELECT p.nome AS perfil, f.nome AS funcionalidade, f.codigo
FROM perfil_funcionalidade pf
JOIN perfil p ON p.id = pf.perfil_id
JOIN funcionalidade f ON f.id = pf.funcionalidade_id
WHERE f.secao = 'Suporte'
ORDER BY p.nome, f.ordem;
