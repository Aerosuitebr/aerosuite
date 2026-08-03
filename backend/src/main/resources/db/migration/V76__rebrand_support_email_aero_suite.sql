-- E-mail de suporte legado Bellows → Aero Suite.
UPDATE sistema_empresa_config
SET support_email = 'contato@aerosuite.com.br'
WHERE support_email IS NOT NULL
  AND (
    LOWER(support_email) LIKE '%bellows%'
    OR LOWER(support_email) LIKE '%bellowscontrols%'
  );
