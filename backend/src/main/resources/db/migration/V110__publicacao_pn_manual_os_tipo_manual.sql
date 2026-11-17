-- PN do Manual na publicação técnica + Tipo de Manual na OS

ALTER TABLE publicacao_tecnica
  ADD COLUMN pn_manual VARCHAR(20) NULL AFTER tipo_manual;

ALTER TABLE os
  ADD COLUMN tipo_manual VARCHAR(1000) NULL AFTER manual_pn;
