-- Cenário B1: mesmo e-mail em default (tenant 1) e demo (tenant 2).
-- Senha de teste: admin123 (mesmo BCrypt de seed_aerosuite_admin.sql)
-- E-mail: multi-tenant-test@aerosuite.local
--
-- Pré-requisito: tenant codigo 'demo' ativo (provision-tenant-demo.ps1 ou POST /api/tenants).
-- Teste API: POST /api/auth/login sem tenantCodigo -> 401 code TENANT_REQUIRED
-- Teste API: POST /api/auth/forgot-password sem tenantCodigo -> 400 code TENANT_REQUIRED

SET NAMES utf8mb4;

SET @email := 'multi-tenant-test@aerosuite.local';
SET @senha := '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDi';
SET @perfil_id := (SELECT id FROM perfil ORDER BY id LIMIT 1);

INSERT INTO usuario (
  nome, email, senha, perfil_id, ativo, data_cadastro, tenant_id, precisa_trocar_senha, created_at, updated_at
)
SELECT
  'Utilizador multi-tenant (default)',
  @email,
  @senha,
  @perfil_id,
  1,
  CURDATE(),
  1,
  0,
  NOW(6),
  NOW(6)
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM usuario WHERE email = @email AND tenant_id = 1
);

INSERT INTO usuario (
  nome, email, senha, perfil_id, ativo, data_cadastro, tenant_id, precisa_trocar_senha, created_at, updated_at
)
SELECT
  'Utilizador multi-tenant (demo)',
  @email,
  @senha,
  @perfil_id,
  1,
  CURDATE(),
  t.id,
  0,
  NOW(6),
  NOW(6)
FROM tenant t
WHERE t.codigo = 'demo' AND t.ativo = 1
  AND NOT EXISTS (
    SELECT 1 FROM usuario u WHERE u.email = @email AND u.tenant_id = t.id
  );

-- Conferência:
-- SELECT u.email, u.tenant_id, t.codigo
-- FROM usuario u JOIN tenant t ON t.id = u.tenant_id
-- WHERE u.email = @email ORDER BY u.tenant_id;
