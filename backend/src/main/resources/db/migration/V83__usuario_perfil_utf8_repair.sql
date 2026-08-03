-- Repara nomes de usuário e perfil com acentos perdidos (??) ou mojibake.
-- Script manual complementar: db/scripts/fix_usuario_perfil_texto_utf8.sql

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

UPDATE perfil
SET nome = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(nome, 'Ã©', 'é'), 'Ã§', 'ç'), 'Ã£', 'ã'), 'Ã¡', 'á'), 'Ãµ', 'õ'),
    descricao = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(descricao, 'Ã©', 'é'), 'Ã§', 'ç'), 'Ã£', 'ã'), 'Ã¡', 'á'), 'Ãµ', 'õ')
WHERE nome LIKE '%Ã%' OR descricao LIKE '%Ã%';

UPDATE perfil SET nome = 'Mecânico', descricao = REPLACE(descricao, 'Mec??nico', 'Mecânico')
WHERE UPPER(TRIM(codigo)) = 'MECANICO' AND (nome LIKE '%?%' OR descricao LIKE '%?%');

UPDATE perfil SET nome = REPLACE(nome, 'Mec??nico', 'Mecânico') WHERE nome LIKE '%Mec??nico%';
UPDATE perfil SET nome = REPLACE(nome, 'Mec?nico', 'Mecânico') WHERE nome LIKE '%Mec?nico%';
UPDATE perfil SET nome = REPLACE(nome, 'Administra??o', 'Administração') WHERE nome LIKE '%Administra??o%';
UPDATE perfil SET nome = REPLACE(nome, 'Calibra??o', 'Calibração') WHERE nome LIKE '%Calibra??o%';

UPDATE usuario SET nome = REPLACE(nome, 'PE??ANHA', 'PEÇANHA') WHERE nome LIKE '%PE??ANHA%';
UPDATE usuario SET nome = REPLACE(nome, 'Pe??anha', 'Peçanha') WHERE nome LIKE '%Pe??anha%';
UPDATE usuario SET nome = REPLACE(nome, 'Guimar??es', 'Guimarães') WHERE nome LIKE '%Guimar??es%';
UPDATE usuario SET nome = REPLACE(nome, '??LCIO', 'ÉLCIO') WHERE nome LIKE '%??LCIO%';
UPDATE usuario SET nome = REPLACE(nome, '?LCIO', 'ÉLCIO') WHERE nome LIKE '%?LCIO%';
UPDATE usuario SET nome = REPLACE(nome, '??lcio', 'Élcio') WHERE nome LIKE '%??lcio%';

UPDATE usuario_externo SET nome = REPLACE(nome, 'PE??ANHA', 'PEÇANHA') WHERE nome LIKE '%PE??ANHA%';
UPDATE usuario_externo SET nome = REPLACE(nome, 'Pe??anha', 'Peçanha') WHERE nome LIKE '%Pe??anha%';
UPDATE usuario_externo SET nome = REPLACE(nome, 'Guimar??es', 'Guimarães') WHERE nome LIKE '%Guimar??es%';
UPDATE usuario_externo SET nome = REPLACE(nome, '??LCIO', 'ÉLCIO') WHERE nome LIKE '%??LCIO%';
UPDATE usuario_externo SET nome = REPLACE(nome, '?LCIO', 'ÉLCIO') WHERE nome LIKE '%?LCIO%';
