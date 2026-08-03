-- Sincroniza os_auditoria: bellows (UTF-8 correto) -> aerosuite.
-- Corrige acentuação em valores, nomes de utilizador e comentários da tabela.
-- Uso: mysql --default-character-set=utf8mb4 -uroot -p < db/scripts/sync_os_auditoria_bellows_to_aerosuite.sql

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
USE aerosuite;

SELECT COUNT(*) AS origem_bellows FROM bellows.os_auditoria;
SELECT COUNT(*) AS destino_antes FROM aerosuite.os_auditoria;

SET @bellows_exists := (
  SELECT COUNT(*) FROM information_schema.tables
  WHERE table_schema = 'bellows' AND table_name = 'os_auditoria'
);
SELECT IF(@bellows_exists = 0, 'ERRO: tabela bellows.os_auditoria nao existe', 'OK: origem encontrada') AS check_origem;

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE aerosuite.os_auditoria;

INSERT INTO aerosuite.os_auditoria (
  id,
  id_os,
  numero_os,
  acao,
  campo_alterado,
  valor_anterior,
  valor_novo,
  snapshot_os,
  usuario_id,
  usuario_nome,
  usuario_email,
  ip_origem,
  user_agent,
  data_hora
)
SELECT
  id,
  id_os,
  numero_os,
  acao,
  campo_alterado,
  valor_anterior,
  valor_novo,
  snapshot_os,
  usuario_id,
  usuario_nome,
  usuario_email,
  ip_origem,
  user_agent,
  data_hora
FROM bellows.os_auditoria;

SET @max_id := (SELECT IFNULL(MAX(id), 0) FROM aerosuite.os_auditoria);
SET @sql_ai := CONCAT('ALTER TABLE aerosuite.os_auditoria AUTO_INCREMENT = ', @max_id + 1);
PREPARE stmt_ai FROM @sql_ai;
EXECUTE stmt_ai;
DEALLOCATE PREPARE stmt_ai;

SET FOREIGN_KEY_CHECKS = 1;

SELECT COUNT(*) AS destino_depois FROM aerosuite.os_auditoria;

-- Amostra: registos que antes tinham '?' por encoding incorreto
SELECT id, campo_alterado, LEFT(valor_novo, 50) AS valor_novo
FROM aerosuite.os_auditoria
WHERE id IN (12, 13)
ORDER BY id;

SELECT COUNT(*) AS registos_com_interrogacao_valor
FROM aerosuite.os_auditoria
WHERE valor_novo LIKE '%?%'
   OR valor_anterior LIKE '%?%'
   OR usuario_nome LIKE '%?%';
