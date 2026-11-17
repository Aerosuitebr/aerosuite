-- FORM-MNT-045 (Solicitação de Serviços) + aceite digital do cliente na proposta comercial

ALTER TABLE proposta_comercial
  ADD COLUMN tsn VARCHAR(50) NULL,
  ADD COLUMN tso VARCHAR(50) NULL,
  ADD COLUMN csn VARCHAR(50) NULL,
  ADD COLUMN cso VARCHAR(50) NULL,
  ADD COLUMN pn_motor VARCHAR(100) NULL,
  ADD COLUMN modelo_motor VARCHAR(100) NULL,
  ADD COLUMN tempo_desde_hsi VARCHAR(50) NULL,
  ADD COLUMN servicos_flags VARCHAR(500) NULL,
  ADD COLUMN reporte_cliente TEXT NULL,
  ADD COLUMN incidente_acidente TINYINT(1) NULL,
  ADD COLUMN submerso_agua TINYINT(1) NULL,
  ADD COLUMN descricao_incidente TEXT NULL,
  ADD COLUMN solicitante_nome VARCHAR(200) NULL,
  ADD COLUMN solicitante_empresa VARCHAR(200) NULL,
  ADD COLUMN solicitante_cargo VARCHAR(150) NULL,
  ADD COLUMN solicitante_data DATE NULL,
  ADD COLUMN aceite_token VARCHAR(64) NULL,
  ADD COLUMN aceite_token_expira_em DATETIME NULL,
  ADD COLUMN aceite_status VARCHAR(20) NULL,
  ADD COLUMN aceito_em DATETIME NULL,
  ADD COLUMN aceito_ip VARCHAR(255) NULL,
  ADD COLUMN aceito_user_agent VARCHAR(500) NULL,
  ADD COLUMN aceite_nome VARCHAR(200) NULL,
  ADD COLUMN aceite_email VARCHAR(150) NULL,
  ADD COLUMN aceite_cargo VARCHAR(150) NULL,
  ADD COLUMN aceite_empresa VARCHAR(200) NULL,
  ADD COLUMN aceite_declaracao TINYINT(1) NULL,
  ADD COLUMN aceite_autorizacao TINYINT(1) NULL,
  ADD COLUMN recusa_motivo TEXT NULL;

CREATE UNIQUE INDEX uk_proposta_aceite_token ON proposta_comercial (aceite_token);
