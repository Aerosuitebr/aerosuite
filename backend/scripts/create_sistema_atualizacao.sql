-- Script para criar a tabela sistema_atualizacao
-- Banco de dados: aerosuite
-- Data: 2025-12-19

USE aerosuite;

CREATE TABLE IF NOT EXISTS sistema_atualizacao (
    id INT AUTO_INCREMENT PRIMARY KEY,
    versao_disponivel VARCHAR(50) NULL,
    versao_atual VARCHAR(50) NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'DISPONIVEL',
    aprovado_por INT NULL,
    data_aprovacao DATETIME NULL,
    data_inicio DATETIME NULL,
    data_conclusao DATETIME NULL,
    contador_regressivo INT NULL COMMENT 'segundos restantes',
    mensagem TEXT NULL,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    INDEX idx_status (status),
    INDEX idx_versao_disponivel (versao_disponivel),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Comentários sobre os status possíveis:
-- DISPONIVEL: Nova versão disponível para aprovação
-- APROVADA: Versão aprovada, aguardando início
-- EM_ANDAMENTO: Atualização em progresso
-- CONCLUIDA: Atualização concluída com sucesso
-- CANCELADA: Atualização cancelada

