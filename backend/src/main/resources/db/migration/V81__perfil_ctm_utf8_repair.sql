-- Repara rótulos do perfil CTM com mojibake (UTF-8 interpretado como Latin-1).
UPDATE perfil
SET nome = 'Centro Técnico de Manutenção',
    descricao = 'Centro técnico de manutenção e operações de hangar'
WHERE UPPER(TRIM(codigo)) = 'CTM';

UPDATE perfil
SET nome = REPLACE(REPLACE(REPLACE(nome, 'Ã©', 'é'), 'Ã§', 'ç'), 'Ã£', 'ã'),
    descricao = REPLACE(REPLACE(REPLACE(descricao, 'Ã©', 'é'), 'Ã§', 'ç'), 'Ã£', 'ã')
WHERE nome LIKE '%Ã%' OR descricao LIKE '%Ã%';
