-- Atualiza taglines legadas da marca Aero Suite (produto ≠ prestador de serviços aeronáuticos).
UPDATE sistema_empresa_config
SET tagline = 'Plataforma de gestão para oficinas MRO'
WHERE tagline IS NULL
   OR TRIM(tagline) = ''
   OR tagline = 'Gestão aeronáutica'
   OR LOWER(tagline) LIKE '%serviços aeronáuticos%'
   OR LOWER(tagline) LIKE '%servicos aeronauticos%'
   OR LOWER(tagline) LIKE '%aeronautical management%'
   OR LOWER(tagline) LIKE '%gestión aeronáutica%'
   OR LOWER(tagline) LIKE '%gestion aéronautique%';

UPDATE sistema_empresa_config
SET browser_title_suffix = 'Gestão MRO'
WHERE browser_title_suffix IS NULL
   OR TRIM(browser_title_suffix) = ''
   OR browser_title_suffix = 'Gestão aeronáutica'
   OR LOWER(browser_title_suffix) LIKE '%serviços aeronáuticos%'
   OR LOWER(browser_title_suffix) LIKE '%servicos aeronauticos%'
   OR LOWER(browser_title_suffix) LIKE '%aeronautical management%'
   OR LOWER(browser_title_suffix) LIKE '%gestión aeronáutica%'
   OR LOWER(browser_title_suffix) LIKE '%gestion aéronautique%';
