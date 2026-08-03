-- Sincroniza tipo_servico: bellows (UTF-8 correto) -> aerosuite.
-- Preserva IDs para manter id_tipo_servico em templates, propostas, etc.
-- Uso: mysql --default-character-set=utf8mb4 -uroot -p < db/scripts/sync_tipo_servico_bellows_to_aerosuite.sql

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
USE aerosuite;

SELECT COUNT(*) AS origem_bellows FROM bellows.tipo_servico;
SELECT COUNT(*) AS destino_antes FROM aerosuite.tipo_servico;

SET @bellows_exists := (
  SELECT COUNT(*) FROM information_schema.tables
  WHERE table_schema = 'bellows' AND table_name = 'tipo_servico'
);
SELECT IF(@bellows_exists = 0, 'ERRO: tabela bellows.tipo_servico nao existe', 'OK: origem encontrada') AS check_origem;

SET FOREIGN_KEY_CHECKS = 0;

-- Upsert: atualiza nomes/ativo e insere registos novos do bellows
INSERT INTO aerosuite.tipo_servico (id, nome, isActive)
SELECT id, nome, IFNULL(isActive, 1)
FROM bellows.tipo_servico
ON DUPLICATE KEY UPDATE
  nome = VALUES(nome),
  isActive = VALUES(isActive);

-- Remove em aerosuite o que nao existe mais no bellows
DELETE FROM aerosuite.tipo_servico
WHERE id NOT IN (SELECT id FROM bellows.tipo_servico);

SET @max_id := (SELECT IFNULL(MAX(id), 0) FROM aerosuite.tipo_servico);
SET @sql_ai := CONCAT('ALTER TABLE aerosuite.tipo_servico AUTO_INCREMENT = ', @max_id + 1);
PREPARE stmt_ai FROM @sql_ai;
EXECUTE stmt_ai;
DEALLOCATE PREPARE stmt_ai;

SET FOREIGN_KEY_CHECKS = 1;

-- Propaga nomes corrigidos para templates e propostas comerciais
UPDATE template_produto_servico t
INNER JOIN tipo_servico ts ON t.id_tipo_servico = ts.id
SET t.tipo_servico_nome = ts.nome
WHERE t.id_tipo_servico IS NOT NULL;

UPDATE proposta_comercial p
INNER JOIN tipo_servico ts ON p.id_tipo_servico = ts.id
SET p.tipo_servico_nome = ts.nome
WHERE p.id_tipo_servico IS NOT NULL;

SELECT COUNT(*) AS destino_depois FROM tipo_servico;

SELECT id, nome, isActive
FROM tipo_servico
ORDER BY id;

SELECT COUNT(*) AS templates_com_interrogacao
FROM template_produto_servico
WHERE tipo_servico_nome LIKE '%?%';
