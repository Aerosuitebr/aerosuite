-- Listagens (OS, produto, fabricante, tipo de serviço, fornecedor) consultam
-- colunas que esta base ainda não tinha. Sem elas o SELECT falha e a tela
-- mostra erro mesmo quando não há registros.

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'os' AND COLUMN_NAME = 'marcas_matricula');
SET @sql := IF(@col = 0, 'ALTER TABLE os ADD COLUMN marcas_matricula VARCHAR(50) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'os' AND COLUMN_NAME = 'motor');
SET @sql := IF(@col = 0, 'ALTER TABLE os ADD COLUMN motor VARCHAR(30) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'os' AND COLUMN_NAME = 'sn_motor');
SET @sql := IF(@col = 0, 'ALTER TABLE os ADD COLUMN sn_motor VARCHAR(30) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'os' AND COLUMN_NAME = 'solicitacao_trocas_comentario');
SET @sql := IF(@col = 0, 'ALTER TABLE os ADD COLUMN solicitacao_trocas_comentario TEXT NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'os' AND COLUMN_NAME = 'email_trocas_nao_pagas_enviado');
SET @sql := IF(@col = 0, 'ALTER TABLE os ADD COLUMN email_trocas_nao_pagas_enviado TINYINT(1) NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'os' AND COLUMN_NAME = 'inicio_servico');
SET @sql := IF(@col = 0, 'ALTER TABLE os ADD COLUMN inicio_servico TEXT NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'os' AND COLUMN_NAME = 'fim_servico');
SET @sql := IF(@col = 0, 'ALTER TABLE os ADD COLUMN fim_servico TEXT NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product' AND COLUMN_NAME = 'photo_url');
SET @sql := IF(@col = 0, 'ALTER TABLE product ADD COLUMN photo_url VARCHAR(255) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product' AND COLUMN_NAME = 'id_fabricante');
SET @sql := IF(@col = 0, 'ALTER TABLE product ADD COLUMN id_fabricante INT NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product' AND COLUMN_NAME = 'created_at');
SET @sql := IF(@col = 0, 'ALTER TABLE product ADD COLUMN created_at DATETIME NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product' AND COLUMN_NAME = 'updated_at');
SET @sql := IF(@col = 0, 'ALTER TABLE product ADD COLUMN updated_at DATETIME NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product' AND COLUMN_NAME = 'created_by');
SET @sql := IF(@col = 0, 'ALTER TABLE product ADD COLUMN created_by VARCHAR(255) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product' AND COLUMN_NAME = 'is_active');
SET @sql := IF(@col = 0, 'ALTER TABLE product ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'fabricante' AND COLUMN_NAME = 'isActive');
SET @sql := IF(@col = 0, 'ALTER TABLE fabricante ADD COLUMN isActive TINYINT(1) NOT NULL DEFAULT 1', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tipo_servico' AND COLUMN_NAME = 'isActive');
SET @sql := IF(@col = 0, 'ALTER TABLE tipo_servico ADD COLUMN isActive TINYINT(1) NOT NULL DEFAULT 1', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'fornecedor' AND COLUMN_NAME = 'nome_fantasia');
SET @sql := IF(@col = 0, 'ALTER TABLE fornecedor ADD COLUMN nome_fantasia VARCHAR(255) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'fornecedor' AND COLUMN_NAME = 'cnpj_cpf');
SET @sql := IF(@col = 0, 'ALTER TABLE fornecedor ADD COLUMN cnpj_cpf VARCHAR(20) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'fornecedor' AND COLUMN_NAME = 'inscricao_estadual');
SET @sql := IF(@col = 0, 'ALTER TABLE fornecedor ADD COLUMN inscricao_estadual VARCHAR(50) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'fornecedor' AND COLUMN_NAME = 'pais_origem');
SET @sql := IF(@col = 0, 'ALTER TABLE fornecedor ADD COLUMN pais_origem VARCHAR(100) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'fornecedor' AND COLUMN_NAME = 'endereco');
SET @sql := IF(@col = 0, 'ALTER TABLE fornecedor ADD COLUMN endereco VARCHAR(255) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'fornecedor' AND COLUMN_NAME = 'numero');
SET @sql := IF(@col = 0, 'ALTER TABLE fornecedor ADD COLUMN numero VARCHAR(20) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'fornecedor' AND COLUMN_NAME = 'complemento');
SET @sql := IF(@col = 0, 'ALTER TABLE fornecedor ADD COLUMN complemento VARCHAR(100) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'fornecedor' AND COLUMN_NAME = 'bairro');
SET @sql := IF(@col = 0, 'ALTER TABLE fornecedor ADD COLUMN bairro VARCHAR(100) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'fornecedor' AND COLUMN_NAME = 'cidade');
SET @sql := IF(@col = 0, 'ALTER TABLE fornecedor ADD COLUMN cidade VARCHAR(100) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'fornecedor' AND COLUMN_NAME = 'estado');
SET @sql := IF(@col = 0, 'ALTER TABLE fornecedor ADD COLUMN estado VARCHAR(50) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'fornecedor' AND COLUMN_NAME = 'cep');
SET @sql := IF(@col = 0, 'ALTER TABLE fornecedor ADD COLUMN cep VARCHAR(20) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'fornecedor' AND COLUMN_NAME = 'telefone');
SET @sql := IF(@col = 0, 'ALTER TABLE fornecedor ADD COLUMN telefone VARCHAR(50) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'fornecedor' AND COLUMN_NAME = 'email');
SET @sql := IF(@col = 0, 'ALTER TABLE fornecedor ADD COLUMN email VARCHAR(255) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'fornecedor' AND COLUMN_NAME = 'website');
SET @sql := IF(@col = 0, 'ALTER TABLE fornecedor ADD COLUMN website VARCHAR(255) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'fornecedor' AND COLUMN_NAME = 'contato_nome');
SET @sql := IF(@col = 0, 'ALTER TABLE fornecedor ADD COLUMN contato_nome VARCHAR(255) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'fornecedor' AND COLUMN_NAME = 'contato_telefone');
SET @sql := IF(@col = 0, 'ALTER TABLE fornecedor ADD COLUMN contato_telefone VARCHAR(50) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'fornecedor' AND COLUMN_NAME = 'contato_email');
SET @sql := IF(@col = 0, 'ALTER TABLE fornecedor ADD COLUMN contato_email VARCHAR(255) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS os_solicitacao_troca_item (
    id BIGINT NOT NULL AUTO_INCREMENT,
    os_id INT NOT NULL,
    id_produto BIGINT NULL,
    produto_nome VARCHAR(500) NULL,
    produto_descricao TEXT NULL,
    produto_pn VARCHAR(200) NULL,
    produto_sn VARCHAR(200) NULL,
    quantidade INT NOT NULL DEFAULT 1,
    valor_unitario DECIMAL(15,2) NULL,
    valor_total DECIMAL(15,2) NULL,
    pago TINYINT(1) NULL,
    ordem INT NOT NULL DEFAULT 0,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    PRIMARY KEY (id),
    KEY idx_os_solicitacao_troca_os (os_id),
    KEY idx_os_solicitacao_troca_pago (os_id, pago)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS os_kit_fcu_deficit (
    id BIGINT NOT NULL AUTO_INCREMENT,
    os_id BIGINT NOT NULL,
    id_fcu INT NULL,
    id_produto_catalogo INT NULL,
    product_pn VARCHAR(255) NULL,
    product_name VARCHAR(500) NULL,
    quantidade_necessaria INT NOT NULL DEFAULT 0,
    quantidade_disponivel DECIMAL(18, 3) NOT NULL DEFAULT 0,
    deficit DECIMAL(18, 3) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_os_kit_fcu_deficit_os_pn (os_id, product_pn),
    KEY ix_os_kit_fcu_deficit_os (os_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS os_auditoria (
    id BIGINT NOT NULL AUTO_INCREMENT,
    id_os BIGINT NOT NULL,
    numero_os INT NOT NULL,
    acao VARCHAR(40) NOT NULL,
    campo_alterado VARCHAR(100) NULL,
    valor_anterior TEXT NULL,
    valor_novo TEXT NULL,
    snapshot_os TEXT NULL,
    usuario_id BIGINT NULL,
    usuario_nome VARCHAR(200) NULL,
    usuario_email VARCHAR(200) NULL,
    ip_origem VARCHAR(50) NULL,
    user_agent VARCHAR(500) NULL,
    data_hora DATETIME NOT NULL,
    PRIMARY KEY (id),
    KEY ix_os_auditoria_os (id_os)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
