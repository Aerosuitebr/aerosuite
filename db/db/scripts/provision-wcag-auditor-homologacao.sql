/*
 * Conta dedicada à auditoria WCAG (homologação) — mesmo perfil e acesso do admin.
 *
 * Email:    wcag-auditor@aerosuite.com.br
 * Senha:    WcagAud1t2026!   (BCrypt abaixo; MFA desligado)
 * Tenant:   default (id resolvido em runtime)
 *
 * Também garante que o perfil Administrador tenha TODAS as funcionalidades ativas
 * (admin@aerosuite.com e wcag-auditor partilham o mesmo perfil_id).
 *
 * CLI:
 *   mysql -u root -p aerosuite < db/scripts/provision-wcag-auditor-homologacao.sql
 *
 * MySQL Workbench: Ctrl+A → Execute (script inteiro).
 */

USE aerosuite;

SET NAMES utf8mb4;

SET @tenant_id = (SELECT id FROM tenant WHERE codigo = 'default' LIMIT 1);
SET @tenant_id = COALESCE(@tenant_id, 1);

-- Perfil do admin existente (mesmo que wcag-auditor receberá)
SET @admin_perfil_id = (
  SELECT u.perfil_id
  FROM usuario u
  WHERE u.tenant_id = @tenant_id AND u.email = 'admin@aerosuite.com'
  LIMIT 1
);

SET @admin_perfil_id = COALESCE(
  @admin_perfil_id,
  (SELECT id FROM perfil WHERE UPPER(TRIM(codigo)) IN ('ADMIN', 'ADMINISTRADOR') ORDER BY id LIMIT 1),
  (SELECT id FROM perfil WHERE nome LIKE '%Administrador%' ORDER BY id LIMIT 1),
  13,
  1
);

-- Garantir acesso total no perfil Administrador (admin + wcag-auditor)
INSERT IGNORE INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT @admin_perfil_id, f.id
FROM funcionalidade f
WHERE f.ativo = 1;

-- Alinhar admin@aerosuite.com ao perfil com acesso total
UPDATE usuario
SET perfil_id = @admin_perfil_id,
    ativo = 1,
    mfa_enabled = 0,
    mfa_totp_secret = NULL,
    updated_at = NOW(6)
WHERE tenant_id = @tenant_id
  AND email = 'admin@aerosuite.com';

-- Criar ou actualizar wcag-auditor (mesmo perfil_id que admin)
INSERT INTO usuario (
  nome,
  email,
  senha,
  perfil_id,
  ativo,
  data_cadastro,
  tenant_id,
  precisa_trocar_senha,
  idioma,
  mfa_enabled,
  mfa_totp_secret,
  created_at,
  updated_at
)
SELECT
  'Auditor WCAG',
  'wcag-auditor@aerosuite.com.br',
  '$2b$10$7YGf46vVdt6JAUyYxc/qgeymzKWIS.WLMwyCzBgpQfSsyedDJ5Vza',
  @admin_perfil_id,
  1,
  CURDATE(),
  @tenant_id,
  0,
  'pt-BR',
  0,
  NULL,
  NOW(6),
  NOW(6)
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM usuario
  WHERE tenant_id = @tenant_id AND email = 'wcag-auditor@aerosuite.com.br'
);

UPDATE usuario
SET nome = 'Auditor WCAG',
    senha = '$2b$10$7YGf46vVdt6JAUyYxc/qgeymzKWIS.WLMwyCzBgpQfSsyedDJ5Vza',
    perfil_id = @admin_perfil_id,
    ativo = 1,
    precisa_trocar_senha = 0,
    idioma = COALESCE(idioma, 'pt-BR'),
    mfa_enabled = 0,
    mfa_totp_secret = NULL,
    updated_at = NOW(6)
WHERE tenant_id = @tenant_id
  AND email = 'wcag-auditor@aerosuite.com.br';

-- Diagnóstico
SELECT
  u.id,
  u.email,
  u.nome,
  u.perfil_id,
  p.codigo AS perfil_codigo,
  p.nome AS perfil_nome,
  u.tenant_id,
  u.mfa_enabled,
  u.ativo
FROM usuario u
LEFT JOIN perfil p ON p.id = u.perfil_id
WHERE u.tenant_id = @tenant_id
  AND u.email IN ('admin@aerosuite.com', 'wcag-auditor@aerosuite.com.br')
ORDER BY u.email;

SELECT
  p.id AS perfil_id,
  p.codigo,
  p.nome,
  COUNT(pf.funcionalidade_id) AS total_funcionalidades
FROM perfil p
LEFT JOIN perfil_funcionalidade pf ON pf.perfil_id = p.id
WHERE p.id = @admin_perfil_id
GROUP BY p.id, p.codigo, p.nome;

SELECT
  (SELECT COUNT(*) FROM funcionalidade WHERE ativo = 1) AS funcionalidades_ativas,
  (SELECT COUNT(*) FROM perfil_funcionalidade WHERE perfil_id = @admin_perfil_id) AS no_perfil_admin;
