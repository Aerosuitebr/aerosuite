-- =====================================================
-- MÓDULO: PUBLICAÇÕES TÉCNICAS
-- Criação das tabelas e funcionalidades do menu
-- =====================================================

-- 1. Tabela de Publicações Técnicas (ATA Manual)
CREATE TABLE IF NOT EXISTS publicacao_tecnica (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fabricante_id INT NOT NULL COMMENT 'FK para fabricante',
    ata_manual VARCHAR(20) NOT NULL COMMENT 'Código ATA do Manual',
    data_revisao_manual DATE NOT NULL COMMENT 'Data de Revisão do Manual',
    numero_revisao VARCHAR(20) NOT NULL COMMENT 'Número da Revisão',
    tipo_manual VARCHAR(1000) COMMENT 'Tipo/Descrição do Manual',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT COMMENT 'Usuário que criou',
    
    INDEX idx_pub_fabricante (fabricante_id),
    INDEX idx_pub_ata (ata_manual),
    INDEX idx_pub_active (is_active),
    
    CONSTRAINT fk_pub_fabricante FOREIGN KEY (fabricante_id) 
        REFERENCES fabricante(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabela de Associação Publicação x FCU (Produto Aeronáutico)
CREATE TABLE IF NOT EXISTS publicacao_fcu (
    id INT AUTO_INCREMENT PRIMARY KEY,
    publicacao_id INT NOT NULL COMMENT 'FK para publicacao_tecnica',
    fcu_id INT NOT NULL COMMENT 'FK para fcu (produto aeronáutico)',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT COMMENT 'Usuário que criou',
    
    INDEX idx_assoc_pub (publicacao_id),
    INDEX idx_assoc_fcu (fcu_id),
    INDEX idx_assoc_active (is_active),
    
    -- Evitar duplicatas ativas
    UNIQUE KEY uk_pub_fcu_active (publicacao_id, fcu_id, is_active),
    
    CONSTRAINT fk_assoc_publicacao FOREIGN KEY (publicacao_id) 
        REFERENCES publicacao_tecnica(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_assoc_fcu FOREIGN KEY (fcu_id) 
        REFERENCES fcu(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- INSERIR FUNCIONALIDADES NO MENU
-- =====================================================

-- Funcionalidade pai: Publicações Técnicas (seção principal)
INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, parent_id, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Publicações Técnicas', 'Gestão de Publicações Técnicas e ATAs', 'PUBLICACOES_TECNICAS', 'pi pi-book', '/publicacoes-tecnicas', 25, 'Documentos', NULL, 'secao', TRUE, 25, TRUE, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'PUBLICACOES_TECNICAS');

-- Obter ID do pai
SET @pub_id = (SELECT id FROM funcionalidade WHERE codigo = 'PUBLICACOES_TECNICAS' LIMIT 1);

-- Submenu: Cadastro de Publicação
INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, parent_id, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Cadastro de Publicação', 'Cadastrar novas publicações técnicas', 'PUBLICACAO_CADASTRO', 'pi pi-file-edit', '/publicacoes-tecnicas/cadastro', 1, 'Publicações Técnicas', @pub_id, 'funcionalidade', TRUE, 1, TRUE, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'PUBLICACAO_CADASTRO');

-- Submenu: Associar PN
INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, parent_id, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Associar PN', 'Associar Part Numbers às Publicações', 'PUBLICACAO_ASSOCIAR_PN', 'pi pi-link', '/publicacoes-tecnicas/associar-pn', 2, 'Publicações Técnicas', @pub_id, 'funcionalidade', TRUE, 2, TRUE, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'PUBLICACAO_ASSOCIAR_PN');

-- =====================================================
-- ASSOCIAR AO PERFIL ADMIN
-- =====================================================

SET @func_pub = (SELECT id FROM funcionalidade WHERE codigo = 'PUBLICACOES_TECNICAS');
SET @func_cadastro = (SELECT id FROM funcionalidade WHERE codigo = 'PUBLICACAO_CADASTRO');
SET @func_associar = (SELECT id FROM funcionalidade WHERE codigo = 'PUBLICACAO_ASSOCIAR_PN');

-- Associar ao perfil ID 1
INSERT IGNORE INTO perfil_funcionalidade (perfil_id, funcionalidade_id) VALUES (1, @func_pub);
INSERT IGNORE INTO perfil_funcionalidade (perfil_id, funcionalidade_id) VALUES (1, @func_cadastro);
INSERT IGNORE INTO perfil_funcionalidade (perfil_id, funcionalidade_id) VALUES (1, @func_associar);

-- Associar ao perfil ID 13 (se existir)
INSERT IGNORE INTO perfil_funcionalidade (perfil_id, funcionalidade_id) VALUES (13, @func_pub);
INSERT IGNORE INTO perfil_funcionalidade (perfil_id, funcionalidade_id) VALUES (13, @func_cadastro);
INSERT IGNORE INTO perfil_funcionalidade (perfil_id, funcionalidade_id) VALUES (13, @func_associar);

-- =====================================================
-- VERIFICAR RESULTADO
-- =====================================================
SELECT 'Módulo Publicações Técnicas criado com sucesso!' AS resultado;

SELECT f.id, f.nome, f.codigo, f.rota, f.secao 
FROM funcionalidade f 
WHERE f.codigo LIKE 'PUBLICAC%' 
ORDER BY f.posicao;
