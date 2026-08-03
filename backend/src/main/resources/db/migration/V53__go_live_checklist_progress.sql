-- Kit go-live: persistência do checklist 30 dias por tenant
CREATE TABLE IF NOT EXISTS go_live_checklist_progress (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(32) NOT NULL,
    item_key VARCHAR(120) NOT NULL,
    concluido TINYINT(1) NOT NULL DEFAULT 0,
    concluido_em DATETIME NULL,
    concluido_por_usuario_id INT NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uk_go_live_checklist_tenant_item UNIQUE (tenant_id, item_key)
);

CREATE INDEX idx_go_live_checklist_tenant ON go_live_checklist_progress (tenant_id);
