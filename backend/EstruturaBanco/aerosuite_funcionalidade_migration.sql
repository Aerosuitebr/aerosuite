-- ========================================
-- MIGRAÇÃO DA ESTRUTURA DE FUNCIONALIDADES
-- ========================================

-- Verificar se as colunas já existem antes de adicionar
SET @sql = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'funcionalidade' 
     AND COLUMN_NAME = 'secao') = 0,
    'ALTER TABLE funcionalidade ADD COLUMN secao VARCHAR(50) NOT NULL DEFAULT ''Sistema'' COMMENT ''Seção do menu onde a funcionalidade aparece''',
    'SELECT ''Coluna secao já existe'' as status'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'funcionalidade' 
     AND COLUMN_NAME = 'parent_id') = 0,
    'ALTER TABLE funcionalidade ADD COLUMN parent_id BIGINT NULL COMMENT ''ID da funcionalidade pai (para submenus)''',
    'SELECT ''Coluna parent_id já existe'' as status'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'funcionalidade' 
     AND COLUMN_NAME = 'tipo') = 0,
    'ALTER TABLE funcionalidade ADD COLUMN tipo ENUM(''secao'', ''funcionalidade'', ''submenu'') NOT NULL DEFAULT ''funcionalidade'' COMMENT ''Tipo do item: seção, funcionalidade ou submenu''',
    'SELECT ''Coluna tipo já existe'' as status'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'funcionalidade' 
     AND COLUMN_NAME = 'visivel') = 0,
    'ALTER TABLE funcionalidade ADD COLUMN visivel BOOLEAN NOT NULL DEFAULT TRUE COMMENT ''Se o item deve aparecer no menu''',
    'SELECT ''Coluna visivel já existe'' as status'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'funcionalidade' 
     AND COLUMN_NAME = 'cor_icone') = 0,
    'ALTER TABLE funcionalidade ADD COLUMN cor_icone VARCHAR(7) NULL COMMENT ''Cor do ícone em hexadecimal''',
    'SELECT ''Coluna cor_icone já existe'' as status'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'funcionalidade' 
     AND COLUMN_NAME = 'posicao') = 0,
    'ALTER TABLE funcionalidade ADD COLUMN posicao INT NOT NULL DEFAULT 0 COMMENT ''Posição de ordenação dentro da seção''',
    'SELECT ''Coluna posicao já existe'' as status'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adicionar índices se não existirem (MySQL 8.x não suporta CREATE INDEX IF NOT EXISTS)
SET @sql = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'funcionalidade'
     AND INDEX_NAME = 'idx_funcionalidade_secao') = 0,
    'CREATE INDEX idx_funcionalidade_secao ON funcionalidade(secao)',
    'SELECT ''idx_funcionalidade_secao já existe'' as status'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'funcionalidade'
     AND INDEX_NAME = 'idx_funcionalidade_parent') = 0,
    'CREATE INDEX idx_funcionalidade_parent ON funcionalidade(parent_id)',
    'SELECT ''idx_funcionalidade_parent já existe'' as status'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'funcionalidade'
     AND INDEX_NAME = 'idx_funcionalidade_tipo') = 0,
    'CREATE INDEX idx_funcionalidade_tipo ON funcionalidade(tipo)',
    'SELECT ''idx_funcionalidade_tipo já existe'' as status'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'funcionalidade'
     AND INDEX_NAME = 'idx_funcionalidade_visivel') = 0,
    'CREATE INDEX idx_funcionalidade_visivel ON funcionalidade(visivel)',
    'SELECT ''idx_funcionalidade_visivel já existe'' as status'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'funcionalidade'
     AND INDEX_NAME = 'idx_funcionalidade_posicao') = 0,
    'CREATE INDEX idx_funcionalidade_posicao ON funcionalidade(posicao)',
    'SELECT ''idx_funcionalidade_posicao já existe'' as status'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adicionar foreign key se não existir
SET @sql = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'funcionalidade' 
     AND CONSTRAINT_NAME = 'fk_funcionalidade_parent') = 0,
    'ALTER TABLE funcionalidade ADD CONSTRAINT fk_funcionalidade_parent FOREIGN KEY (parent_id) REFERENCES funcionalidade(id) ON DELETE CASCADE ON UPDATE CASCADE',
    'SELECT ''Foreign key fk_funcionalidade_parent já existe'' as status'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Atualizar funcionalidades existentes com valores padrão
UPDATE funcionalidade SET 
    secao = 'Sistema',
    tipo = 'funcionalidade',
    visivel = TRUE,
    posicao = ordem
WHERE secao IS NULL OR secao = '';

-- Atualizar timestamps se necessário
UPDATE funcionalidade SET 
    created_at = NOW(),
    updated_at = NOW()
WHERE created_at IS NULL OR updated_at IS NULL;

SELECT 'Migração concluída com sucesso!' as status;
