-- Rebrand: utilizador plataforma admin@bellows.com → admin@aerosuite.com
UPDATE usuario
SET email = 'admin@aerosuite.com'
WHERE email = 'admin@bellows.com';
