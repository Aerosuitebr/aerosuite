-- Notificações in-app: déficit de estoque ou nova Solicitação de Troca Eventual na OS (Suprimento, Comercial, Admin, Diretor, Mecânico).
-- Cada usuário recebe uma linha; acknowledged_at preenchido quando marcar "ciente" no sistema.
-- Ajuste os_id ao tipo de os.id na sua base (INT ou BIGINT), como em sql-os-solicitacao-trocas-eventuais.sql.

CREATE TABLE IF NOT EXISTS os_notificacao_deficit_troca (
  id BIGINT NOT NULL AUTO_INCREMENT,
  usuario_id INT NOT NULL,
  os_id BIGINT NOT NULL,
  id_os INT NULL,
  cliente_nome VARCHAR(500) NULL,
  detalhe_json TEXT NOT NULL COMMENT 'JSON: DEFICIT {nome,pn,solicitado,disponivel,deficit} | SOLICITACAO_TROCA {nome,pn,quantidade,descricao}',
  kind VARCHAR(32) NOT NULL DEFAULT 'DEFICIT' COMMENT 'DEFICIT | SOLICITACAO_TROCA',
  created_at DATETIME NOT NULL,
  acknowledged_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_notif_deficit_user_pend (usuario_id, acknowledged_at),
  KEY idx_notif_deficit_os (os_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Opcional: adicione FKs após validar tipos (usuario.id, os.id) na sua base.

-- ==========================================
-- Migração para bases que JÁ têm a tabela
-- ==========================================
-- Compatível com MySQL que NÃO suporta IF NOT EXISTS em ADD COLUMN/CREATE INDEX.

-- 1) Adicionar coluna kind se não existir
SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'os_notificacao_deficit_troca'
    AND COLUMN_NAME = 'kind'
);

SET @sql_col := IF(
  @col_exists = 0,
  "ALTER TABLE os_notificacao_deficit_troca
     ADD COLUMN kind VARCHAR(32) NOT NULL DEFAULT 'DEFICIT'
     COMMENT 'DEFICIT | SOLICITACAO_TROCA'",
  "SELECT 'coluna kind já existe' AS msg"
);

PREPARE stmt_col FROM @sql_col;
EXECUTE stmt_col;
DEALLOCATE PREPARE stmt_col;

-- 2) Criar índice (usuario_id, acknowledged_at, kind) se não existir
SET @idx_exists := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'os_notificacao_deficit_troca'
    AND INDEX_NAME = 'idx_os_notif_deficit_kind_pendente'
);

SET @sql_idx := IF(
  @idx_exists = 0,
  "CREATE INDEX idx_os_notif_deficit_kind_pendente
     ON os_notificacao_deficit_troca (usuario_id, acknowledged_at, kind)",
  "SELECT 'índice idx_os_notif_deficit_kind_pendente já existe' AS msg"
);

PREPARE stmt_idx FROM @sql_idx;
EXECUTE stmt_idx;
DEALLOCATE PREPARE stmt_idx;
