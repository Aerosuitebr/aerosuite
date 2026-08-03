-- =====================================================
-- CHAT INTERNO - SISTEMA DE MENSAGENS AEROSUITE
-- Script de criação das tabelas
-- =====================================================

-- Tabela de Conversas
CREATE TABLE IF NOT EXISTS conversa (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tipo VARCHAR(20) NOT NULL COMMENT 'DIRETA ou GRUPO',
    nome VARCHAR(255) COMMENT 'Nome do grupo (null para conversas diretas)',
    descricao TEXT COMMENT 'Descrição do grupo',
    imagem VARCHAR(500) COMMENT 'URL da imagem do grupo',
    criador_id BIGINT NOT NULL COMMENT 'ID do usuário que criou',
    data_criacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ativo BOOLEAN DEFAULT TRUE,
    
    INDEX idx_conversa_criador (criador_id),
    INDEX idx_conversa_tipo (tipo),
    INDEX idx_conversa_ativo (ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Participantes da Conversa
CREATE TABLE IF NOT EXISTS conversa_participante (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    conversa_id BIGINT NOT NULL,
    usuario_id BIGINT NOT NULL,
    papel VARCHAR(20) NOT NULL DEFAULT 'MEMBRO' COMMENT 'ADMIN ou MEMBRO',
    data_entrada DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ultima_leitura DATETIME COMMENT 'Última vez que o usuário leu as mensagens',
    notificacoes_ativas BOOLEAN DEFAULT TRUE,
    ativo BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (conversa_id) REFERENCES conversa(id) ON DELETE CASCADE,
    INDEX idx_participante_conversa (conversa_id),
    INDEX idx_participante_usuario (usuario_id),
    INDEX idx_participante_ativo (ativo),
    UNIQUE KEY uk_conversa_usuario (conversa_id, usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Mensagens
CREATE TABLE IF NOT EXISTS mensagem (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    conversa_id BIGINT NOT NULL,
    remetente_id BIGINT NOT NULL,
    conteudo TEXT COMMENT 'Conteúdo da mensagem',
    tipo VARCHAR(20) NOT NULL DEFAULT 'TEXTO' COMMENT 'TEXTO, ARQUIVO, SISTEMA',
    data_envio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_edicao DATETIME COMMENT 'Data da última edição',
    editada BOOLEAN DEFAULT FALSE,
    ativo BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (conversa_id) REFERENCES conversa(id) ON DELETE CASCADE,
    INDEX idx_mensagem_conversa (conversa_id),
    INDEX idx_mensagem_remetente (remetente_id),
    INDEX idx_mensagem_data (data_envio),
    INDEX idx_mensagem_ativo (ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Anexos de Mensagem
CREATE TABLE IF NOT EXISTS mensagem_anexo (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    mensagem_id BIGINT NOT NULL,
    nome_original VARCHAR(255) NOT NULL COMMENT 'Nome original do arquivo',
    nome_arquivo VARCHAR(255) NOT NULL COMMENT 'Nome único no servidor',
    tipo_arquivo VARCHAR(100) COMMENT 'MIME type',
    tamanho_bytes BIGINT COMMENT 'Tamanho em bytes',
    caminho VARCHAR(500) NOT NULL COMMENT 'Caminho no servidor',
    data_upload DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ativo BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (mensagem_id) REFERENCES mensagem(id) ON DELETE CASCADE,
    INDEX idx_anexo_mensagem (mensagem_id),
    INDEX idx_anexo_ativo (ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- FUNCIONALIDADES DO MENU DINÂMICO
-- =====================================================

-- Funcionalidade: Chat Interno (Menu Principal)
-- Primeiro, atualizar se já existir com rota errada
UPDATE funcionalidade SET rota = '/chat', icone = 'pi pi-comments', visivel = TRUE, ativo = TRUE
WHERE codigo = 'chat';

-- Se não existir, inserir
INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Chat', 'Chat interno para comunicação entre usuários', 'chat', 'pi pi-comments', '/chat', 1, 'Comunicação', 'funcionalidade', TRUE, 800, TRUE, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'chat');

-- Associar ao perfil Administrador (ID 1)
INSERT IGNORE INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT 1, id FROM funcionalidade WHERE codigo = 'chat';

-- Associar ao perfil Administrador (ID 13) - se existir
INSERT IGNORE INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT 13, id FROM funcionalidade WHERE codigo = 'chat' AND EXISTS (SELECT 1 FROM perfil WHERE id = 13);

-- Associar a TODOS os perfis ativos
INSERT IGNORE INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT p.id, f.id 
FROM perfil p, funcionalidade f 
WHERE p.ativo = 1 AND f.codigo = 'chat';

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================
SELECT 'Tabelas do Chat criadas com sucesso!' as resultado;

SELECT TABLE_NAME, TABLE_ROWS 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME IN ('conversa', 'conversa_participante', 'mensagem', 'mensagem_anexo');
