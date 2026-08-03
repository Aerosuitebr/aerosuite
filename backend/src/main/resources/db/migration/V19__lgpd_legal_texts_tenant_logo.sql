-- Textos legais LGPD configuráveis por tenant (sistema_empresa_config).

ALTER TABLE sistema_empresa_config
    ADD COLUMN lgpd_termos_text MEDIUMTEXT NULL AFTER site_url,
    ADD COLUMN lgpd_privacidade_text MEDIUMTEXT NULL AFTER lgpd_termos_text,
    ADD COLUMN lgpd_textos_customizados TINYINT(1) NOT NULL DEFAULT 0 AFTER lgpd_privacidade_text;
