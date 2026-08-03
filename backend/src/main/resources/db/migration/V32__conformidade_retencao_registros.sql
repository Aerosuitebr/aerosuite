-- B4 — política de retenção de registros de manutenção (anos) por tenant
ALTER TABLE sistema_empresa_config
    ADD COLUMN retencao_registros_anos INT NOT NULL DEFAULT 5
        COMMENT 'Prazo mínimo orientativo para manter registros de OS fechadas (anos)';
