-- Script seguro para criar tabela password_reset_token (MySQL)
-- Este script pode ser executado múltiplas vezes sem causar erros

-- Verificar se a tabela já existe antes de criar
CREATE TABLE IF NOT EXISTS password_reset_token (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_token (token),
    INDEX idx_email (email),
    INDEX idx_expires_at (expires_at),
    INDEX idx_used (used)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Adicionar comentário na tabela
ALTER TABLE password_reset_token COMMENT = 'Tabela para armazenar tokens de reset de senha';

-- Verificar se os índices existem e criar se necessário (MySQL não suporta CREATE INDEX IF NOT EXISTS)
-- Os índices já estão incluídos na criação da tabela acima

