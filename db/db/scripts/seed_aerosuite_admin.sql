-- Admin plataforma (tenant default). Senha: admin123 (BCrypt)
INSERT INTO usuario (
  nome, email, senha, perfil_id, ativo, data_cadastro, tenant_id, precisa_trocar_senha, created_at, updated_at
)
SELECT
  'Administrador',
  'admin@aerosuite.com',
  '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDi',
  1,
  1,
  CURDATE(),
  1,
  0,
  NOW(6),
  NOW(6)
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM usuario WHERE email = 'admin@aerosuite.com');
