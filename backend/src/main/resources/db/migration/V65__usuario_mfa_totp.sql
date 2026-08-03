-- MFA TOTP (REQ-023 / P-004): segundo fator para perfis críticos quando autenticacao_dupla ativa.

ALTER TABLE usuario
    ADD COLUMN mfa_totp_secret VARCHAR(512) NULL COMMENT 'Segredo TOTP cifrado (AES-GCM)',
    ADD COLUMN mfa_enabled TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 = TOTP ativo para este usuário';
