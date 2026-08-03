-- ===========================================
-- Script para criar tabelas da Seção Comercial
-- Propostas Comerciais e Templates de Produto/Serviço
-- ===========================================

-- ===========================================
-- 1. TABELA DE TEMPLATES DE PRODUTO/SERVIÇO
-- ===========================================
CREATE TABLE IF NOT EXISTS template_produto_servico (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nome_template VARCHAR(200) NOT NULL,
    descricao_template VARCHAR(500),
    categoria VARCHAR(100),
    
    -- Dados do Produto
    produto_nome VARCHAR(200),
    produto_pn VARCHAR(100),
    produto_manual VARCHAR(200),
    produto_valor_base DECIMAL(15,2),
    aplicacao_motor VARCHAR(200),
    
    -- Dados do Serviço
    id_tipo_servico INT,
    tipo_servico_nome VARCHAR(200),
    servico_descricao_padrao VARCHAR(2000),
    
    -- Condições Padrão
    prazo_entrega_padrao VARCHAR(100),
    forma_pagamento_padrao VARCHAR(200),
    validade_dias INT DEFAULT 30,
    condicoes_gerais_padrao TEXT,
    
    -- Metadados
    ativo BOOLEAN DEFAULT TRUE,
    vezes_utilizado INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    
    -- Índices
    INDEX idx_template_nome (nome_template),
    INDEX idx_template_categoria (categoria),
    INDEX idx_template_ativo (ativo),
    INDEX idx_template_uso (vezes_utilizado DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- 2. TABELA DE PROPOSTAS COMERCIAIS
-- ===========================================
CREATE TABLE IF NOT EXISTS proposta_comercial (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    numero_proposta VARCHAR(50) UNIQUE,
    
    -- Dados do Produto
    produto_nome VARCHAR(200),
    produto_pn VARCHAR(100),
    produto_sn VARCHAR(100),
    produto_manual VARCHAR(200),
    produto_valor DECIMAL(15,2),
    aplicacao_motor VARCHAR(200),
    aeronave_prefixo VARCHAR(50),
    servico_executado VARCHAR(1000),
    id_tipo_servico INT,
    tipo_servico_nome VARCHAR(200),
    
    -- Dados do Cliente
    cliente_nome VARCHAR(200),
    cliente_cnpj_cpf VARCHAR(20),
    cliente_email VARCHAR(150),
    cliente_telefone VARCHAR(30),
    cliente_endereco VARCHAR(500),
    cliente_cidade VARCHAR(100),
    cliente_estado VARCHAR(2),
    cliente_cep VARCHAR(10),
    cliente_contato VARCHAR(150),
    
    -- Dados da Proposta
    data_proposta DATE,
    validade_proposta DATE,
    prazo_entrega VARCHAR(100),
    forma_pagamento VARCHAR(200),
    observacoes VARCHAR(2000),
    condicoes_gerais TEXT,
    status VARCHAR(30) DEFAULT 'RASCUNHO',
    
    -- Metadados
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    
    -- Índices
    INDEX idx_proposta_numero (numero_proposta),
    INDEX idx_proposta_cliente (cliente_nome),
    INDEX idx_proposta_status (status),
    INDEX idx_proposta_data (data_proposta)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- Inserir funcionalidade no menu (se existir tabela de funcionalidades)
-- ===========================================

-- Primeiro, verificar se a seção "Comercial" já existe
-- Se não existir, criar
INSERT IGNORE INTO funcionalidade (nome, codigo, rota, icone, secao, tipo, ativo, ordem)
SELECT 'Propostas Comerciais', 'propostas-comerciais', '/propostas-comerciais', 'pi pi-file-edit', 'Comercial', 'menu', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'propostas-comerciais');

-- ===========================================
-- 3. TEMPLATES INICIAIS DE EXEMPLO
-- ===========================================

INSERT IGNORE INTO template_produto_servico 
(nome_template, descricao_template, categoria, produto_nome, produto_pn, produto_manual, produto_valor_base, aplicacao_motor, tipo_servico_nome, servico_descricao_padrao, prazo_entrega_padrao, forma_pagamento_padrao, validade_dias, condicoes_gerais_padrao, ativo, vezes_utilizado)
VALUES
('Overhaul FCU Lycoming', 'Template para overhaul de Fuel Control Unit em motores Lycoming', 'FCU', 'Fuel Control Unit', '2524300-1', 'CMM 73-10-01', 8500.00, 'Lycoming IO-360', 'Overhaul', 'Desmontagem completa, inspeção dimensional, substituição de peças desgastadas, remontagem, teste de bancada conforme CMM.', '45 dias úteis após recebimento', '50% na aprovação + 50% na entrega', 30, '1. Os valores acima não incluem impostos.\n2. O prazo começa após aprovação e recebimento do material.\n3. Serviço executado conforme CMM do fabricante.\n4. Garantia de 12 meses.\n5. Transporte por conta do cliente.', TRUE, 0),

('Reparo Alternador', 'Template para reparo de alternadores aeronáuticos', 'Elétrico', 'Alternador', '10-163090-1', 'CMM 24-30-01', 3200.00, 'Continental IO-550', 'Reparo', 'Inspeção visual e dimensional, teste de bancada, substituição de componentes defeituosos, balanceamento do rotor, teste final.', '30 dias úteis após recebimento', '30% entrada + 70% entrega', 30, '1. Os valores acima não incluem impostos.\n2. O prazo começa após aprovação e recebimento do material.\n3. Serviço executado conforme CMM do fabricante.\n4. Garantia de 12 meses.\n5. Transporte por conta do cliente.', TRUE, 0),

('Overhaul Magneto', 'Template para overhaul de magnetos Slick', 'Ignição', 'Magneto', '4370/4371', 'CMM M-1', 2800.00, 'Lycoming O-320', 'Overhaul', 'Desmontagem, limpeza, inspeção, substituição de peças conforme limites, remontagem, ajuste de timing, teste de centelha e isolamento.', '25 dias úteis após recebimento', '50% na aprovação + 50% na entrega', 30, '1. Os valores acima não incluem impostos.\n2. O prazo começa após aprovação e recebimento do material.\n3. Serviço executado conforme CMM do fabricante.\n4. Garantia de 12 meses.\n5. Transporte por conta do cliente.', TRUE, 0),

('Calibração Instrumentos', 'Template para calibração de instrumentos de voo', 'Instrumentos', 'Instrumento de Voo', 'Diversos', 'AC 43-12A', 450.00, 'Geral', 'Calibração', 'Calibração e ajuste conforme padrões certificados, emissão de certificado de calibração com rastreabilidade.', '15 dias úteis após recebimento', '100% na entrega', 15, '1. Os valores acima não incluem impostos.\n2. O prazo começa após recebimento do material.\n3. Calibração conforme normas aplicáveis.\n4. Certificado de calibração incluso.\n5. Transporte por conta do cliente.', TRUE, 0),

('Inspeção Hélice', 'Template para inspeção dimensional de hélices', 'Hélice', 'Hélice', 'Hartzell HC-C2YK', 'Manual 115N', 1200.00, 'Lycoming IO-540', 'Inspeção', 'Inspeção dimensional completa, verificação de trincas por líquido penetrante, medição de passo, emissão de relatório.', '10 dias úteis após recebimento', '100% na entrega', 20, '1. Os valores acima não incluem impostos.\n2. O prazo começa após recebimento do material.\n3. Inspeção conforme manual do fabricante.\n4. Relatório de inspeção incluso.\n5. Transporte por conta do cliente.', TRUE, 0);

-- Mensagem de sucesso
SELECT 'Tabelas criadas com sucesso!' AS resultado;
SELECT 'Templates iniciais inseridos!' AS resultado;
