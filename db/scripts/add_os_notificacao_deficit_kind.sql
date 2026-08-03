-- Distingue déficit de estoque (DEFICIT) de nova Solicitação de Troca Eventual (SOLICITACAO_TROCA)
ALTER TABLE os_notificacao_deficit_troca
  ADD COLUMN kind VARCHAR(32) NOT NULL DEFAULT 'DEFICIT' COMMENT 'DEFICIT | SOLICITACAO_TROCA';

CREATE INDEX idx_os_notif_deficit_kind_pendente ON os_notificacao_deficit_troca (usuario_id, acknowledged_at, kind);
