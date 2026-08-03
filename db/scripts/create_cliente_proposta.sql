-- =====================================================
-- MÓDULO: CADASTRO DE CLIENTES PARA PROPOSTAS
-- Criação da tabela e funcionalidades
-- =====================================================

-- 1. Tabela de Clientes
CREATE TABLE IF NOT EXISTS cliente_proposta (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(200) NOT NULL COMMENT 'Nome / Razão Social',
    cnpj_cpf VARCHAR(20) COMMENT 'CNPJ ou CPF',
    email VARCHAR(100) COMMENT 'E-mail do cliente',
    telefone VARCHAR(20) COMMENT 'Telefone',
    contato VARCHAR(100) COMMENT 'Pessoa de contato',
    endereco VARCHAR(300) COMMENT 'Endereço completo',
    cidade VARCHAR(100) COMMENT 'Cidade',
    estado VARCHAR(2) COMMENT 'UF',
    cep VARCHAR(10) COMMENT 'CEP',
    observacao VARCHAR(5000) COMMENT 'Observações sobre o cliente',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT COMMENT 'Usuário que criou',
    
    INDEX idx_cliente_nome (nome),
    INDEX idx_cliente_cnpj (cnpj_cpf),
    INDEX idx_cliente_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Adicionar coluna cliente_observacao na tabela proposta_comercial
-- Execute este comando diretamente se der erro (significa que a coluna já existe):
ALTER TABLE proposta_comercial ADD COLUMN cliente_observacao VARCHAR(5000) COMMENT 'Observações sobre o cliente';

-- =====================================================
-- VERIFICAR RESULTADO
-- =====================================================
SELECT 'Tabela cliente_proposta criada com sucesso!' AS resultado;

DESCRIBE cliente_proposta;
