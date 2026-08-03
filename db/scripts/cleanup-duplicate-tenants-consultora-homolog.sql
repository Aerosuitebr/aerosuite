/*
 * A2 — Limpeza de organizações trial duplicadas (consultora homologação).
 * E-mail: rafaellanottesconsultoria@gmail.com
 * Tenants atuais em homolog (2026-06-16): id 16, 17, 18 — mesmo nome.
 *
 * Estratégia: manter o tenant mais antigo (menor id) ativo; inativar duplicatas.
 * Executar em homolog ANTES do reteste da consultora.
 *
 * CLI:
 *   mysql -u root -p aerosuite < db/scripts/cleanup-duplicate-tenants-consultora-homolog.sql
 */

USE aerosuite;

SET NAMES utf8mb4;
SET @email = 'rafaellanottesconsultoria@gmail.com';
SET @keep_tenant_id = 16;

SET @__old_sql_safe_updates = @@SQL_SAFE_UPDATES;
SET SQL_SAFE_UPDATES = 0;

-- ─── Auditoria ANTES ───
SELECT 'ANTES — tenants ativos por e-mail' AS fase;
SELECT t.id, t.codigo, t.nome, t.ativo, t.created_at,
       u.id AS usuario_id, u.email, u.ativo AS usuario_ativo
FROM tenant t
JOIN usuario u ON u.tenant_id = t.id AND LOWER(TRIM(u.email)) = @email
WHERE t.ativo = 1
ORDER BY t.id;

SELECT 'ANTES — login-tenants (simulação)' AS fase;
SELECT t.id, t.codigo, t.nome
FROM tenant t
JOIN usuario u ON u.tenant_id = t.id AND LOWER(TRIM(u.email)) = @email AND u.ativo = 1
WHERE t.ativo = 1
ORDER BY t.nome, t.id;

-- ─── Inativar tenants duplicados (manter @keep_tenant_id) ───
UPDATE tenant
SET ativo = 0
WHERE id IN (17, 18)
  AND codigo IN ('rafaella-nottes-consultoria-1', 'rafaella-nottes-consultoria-2')
  AND id <> @keep_tenant_id;

UPDATE usuario
SET ativo = 0, isActive = 0, updated_at = NOW()
WHERE tenant_id IN (17, 18)
  AND LOWER(TRIM(email)) = @email
  AND tenant_id <> @keep_tenant_id;

-- ─── Auditoria DEPOIS ───
SELECT 'DEPOIS — tenants ativos por e-mail' AS fase;
SELECT t.id, t.codigo, t.nome, t.ativo, t.created_at
FROM tenant t
JOIN usuario u ON u.tenant_id = t.id AND LOWER(TRIM(u.email)) = @email
WHERE t.ativo = 1
ORDER BY t.id;

SET SQL_SAFE_UPDATES = @__old_sql_safe_updates;
