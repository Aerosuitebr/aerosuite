UPDATE perfil
SET descricao = CONCAT('Acesso a Ordem de Servi', CONVERT(0xC3A7 USING utf8mb4),
    'o, estoque e or', CONVERT(0xC3A7 USING utf8mb4), 'amentos')
WHERE nome = 'Financeiro'
  AND descricao REGEXP '^Acesso a Ordem de Servi[?]+o, estoque e or[?]+amentos$';

UPDATE perfil
SET descricao = CONCAT('Acesso para manuten', CONVERT(0xC3A7C3A3 USING utf8mb4),
    'o e reparos t', CONVERT(0xC3A9 USING utf8mb4), 'cnicos')
WHERE codigo = 'MECANICO'
  AND descricao REGEXP '^Acesso para manuten[?]+o e reparos t[?]+cnicos$';

UPDATE perfil
SET descricao = CONCAT('Acesso para opera', CONVERT(0xC3A7C3B5 USING utf8mb4),
    'es de montagem e produ', CONVERT(0xC3A7C3A3 USING utf8mb4), 'o')
WHERE codigo = 'MONTADOR'
  AND descricao REGEXP '^Acesso para opera[?]+es de montagem e produ[?]+o$';
