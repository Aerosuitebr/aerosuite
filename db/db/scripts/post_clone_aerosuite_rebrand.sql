-- Executado após clonar bellows → aerosuite (dados legados).
-- Flyway V16/V74/V75 faz o mesmo no arranque da API; este script garante consistência imediata.

UPDATE usuario
SET email = 'admin@aerosuite.com'
WHERE email = 'admin@bellows.com';

UPDATE sistema_empresa_config
SET display_name = 'Aero Suite',
    copyright_entity = 'Aero Suite',
    email_subject_suffix = 'Aero Suite',
    tagline = 'Plataforma de gestão para oficinas MRO',
    browser_title_suffix = 'Gestão MRO',
    logo_url = CASE WHEN logo_url IS NOT NULL AND LOWER(logo_url) LIKE '%bellows%' THEN NULL ELSE logo_url END,
    wordmark_url = CASE WHEN wordmark_url IS NOT NULL AND LOWER(wordmark_url) LIKE '%bellows%' THEN NULL ELSE wordmark_url END
WHERE display_name IS NOT NULL
  AND (
    LOWER(display_name) LIKE '%bellows%'
    OR LOWER(IFNULL(tagline, '')) LIKE '%bellows%'
    OR LOWER(IFNULL(tagline, '')) LIKE '%serviços aeronáuticos%'
    OR LOWER(IFNULL(tagline, '')) LIKE '%servicos aeronauticos%'
    OR LOWER(IFNULL(copyright_entity, '')) LIKE '%bellows%'
  );

UPDATE tenant
SET nome = 'Aero Suite'
WHERE LOWER(nome) LIKE '%bellows%';

UPDATE sistema_empresa_config
SET support_email = 'contato@aerosuite.com.br'
WHERE support_email IS NOT NULL
  AND (
    LOWER(support_email) LIKE '%bellows%'
    OR LOWER(support_email) LIKE '%bellowscontrols%'
  );
