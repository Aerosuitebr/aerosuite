-- Rebrand legado Bellows → Aero Suite (white-label, títulos, logos e e-mails).
-- Complementa V16 (admin@bellows.com) e V74 (taglines "Serviços Aeronáuticos").

UPDATE usuario
SET email = 'admin@aerosuite.com'
WHERE email = 'admin@bellows.com';

UPDATE sistema_empresa_config
SET display_name = 'Aero Suite'
WHERE display_name IS NOT NULL
  AND (
    LOWER(display_name) LIKE '%bellows%'
    OR display_name IN ('BELLOWS', 'Bellows', 'Bellows MRO')
  );

UPDATE sistema_empresa_config
SET copyright_entity = 'Aero Suite'
WHERE copyright_entity IS NOT NULL
  AND LOWER(copyright_entity) LIKE '%bellows%';

UPDATE sistema_empresa_config
SET email_subject_suffix = 'Aero Suite'
WHERE email_subject_suffix IS NOT NULL
  AND LOWER(email_subject_suffix) LIKE '%bellows%';

UPDATE sistema_empresa_config
SET tagline = 'Plataforma de gestão para oficinas MRO'
WHERE tagline IS NULL
   OR TRIM(tagline) = ''
   OR LOWER(tagline) LIKE '%bellows%'
   OR LOWER(tagline) LIKE '%serviços aeronáuticos%'
   OR LOWER(tagline) LIKE '%servicos aeronauticos%'
   OR tagline = 'Gestão aeronáutica'
   OR tagline = 'Sistema de Gestão Aeronáutica';

UPDATE sistema_empresa_config
SET browser_title_suffix = 'Gestão MRO'
WHERE browser_title_suffix IS NULL
   OR TRIM(browser_title_suffix) = ''
   OR LOWER(browser_title_suffix) LIKE '%bellows%'
   OR LOWER(browser_title_suffix) LIKE '%serviços aeronáuticos%'
   OR LOWER(browser_title_suffix) LIKE '%servicos aeronauticos%'
   OR browser_title_suffix = 'Gestão aeronáutica'
   OR browser_title_suffix = 'Sistema de Gestão Aeronáutica';

UPDATE sistema_empresa_config
SET logo_url = NULL
WHERE logo_url IS NOT NULL
  AND LOWER(logo_url) LIKE '%bellows%';

UPDATE sistema_empresa_config
SET wordmark_url = NULL
WHERE wordmark_url IS NOT NULL
  AND LOWER(wordmark_url) LIKE '%bellows%';

UPDATE tenant
SET nome = 'Aero Suite'
WHERE LOWER(nome) LIKE '%bellows%';
