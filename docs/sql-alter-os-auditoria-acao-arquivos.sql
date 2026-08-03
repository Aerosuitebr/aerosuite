-- Amplia ENUM acao para registrar upload/associação/exclusão de arquivos da OS.
-- Execute no banco já existente (MySQL).

ALTER TABLE os_auditoria
MODIFY COLUMN acao ENUM(
  'CRIACAO',
  'ALTERACAO',
  'EXCLUSAO',
  'RESTAURACAO',
  'UPLOAD_ARQUIVO',
  'ASSOCIACAO_ARQUIVO',
  'EXCLUSAO_ARQUIVO'
) NOT NULL COMMENT 'Tipo de ação (inclui eventos de arquivo)';
