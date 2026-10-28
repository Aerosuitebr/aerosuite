-- Repara texto em que UTF-8 foi lido como CP850/CP437 e gravado de novo
-- (ex.: Serviço virou Servi├ºo, Usuários virou Usu├írios, — virou ÔÇö).
-- Só altera valores que ainda contêm o marcador ├ (U+251C, bytes E2 94 9C).

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

UPDATE funcionalidade
SET nome = CONVERT(CAST(CONVERT(nome USING cp850) AS BINARY) USING utf8mb4)
WHERE HEX(nome) LIKE '%E2949C%'
  AND HEX(CONVERT(CAST(CONVERT(nome USING cp850) AS BINARY) USING utf8mb4)) NOT LIKE '%E2949C%';

UPDATE funcionalidade
SET descricao = CONVERT(CAST(CONVERT(descricao USING cp850) AS BINARY) USING utf8mb4)
WHERE HEX(descricao) LIKE '%E2949C%'
  AND HEX(CONVERT(CAST(CONVERT(descricao USING cp850) AS BINARY) USING utf8mb4)) NOT LIKE '%E2949C%';

UPDATE funcionalidade
SET secao = CONVERT(CAST(CONVERT(secao USING cp850) AS BINARY) USING utf8mb4)
WHERE HEX(secao) LIKE '%E2949C%'
  AND HEX(CONVERT(CAST(CONVERT(secao USING cp850) AS BINARY) USING utf8mb4)) NOT LIKE '%E2949C%';

UPDATE perfil
SET nome = CONVERT(CAST(CONVERT(nome USING cp850) AS BINARY) USING utf8mb4)
WHERE HEX(nome) LIKE '%E2949C%'
  AND HEX(CONVERT(CAST(CONVERT(nome USING cp850) AS BINARY) USING utf8mb4)) NOT LIKE '%E2949C%';

UPDATE perfil
SET descricao = CONVERT(CAST(CONVERT(descricao USING cp850) AS BINARY) USING utf8mb4)
WHERE HEX(descricao) LIKE '%E2949C%'
  AND HEX(CONVERT(CAST(CONVERT(descricao USING cp850) AS BINARY) USING utf8mb4)) NOT LIKE '%E2949C%';

UPDATE tipo_servico
SET nome = CONVERT(CAST(CONVERT(nome USING cp850) AS BINARY) USING utf8mb4)
WHERE HEX(nome) LIKE '%E2949C%'
  AND HEX(CONVERT(CAST(CONVERT(nome USING cp850) AS BINARY) USING utf8mb4)) NOT LIKE '%E2949C%';

UPDATE usuario
SET nome = CONVERT(CAST(CONVERT(nome USING cp850) AS BINARY) USING utf8mb4)
WHERE HEX(nome) LIKE '%E2949C%'
  AND HEX(CONVERT(CAST(CONVERT(nome USING cp850) AS BINARY) USING utf8mb4)) NOT LIKE '%E2949C%';

UPDATE fabricante
SET nome = CONVERT(CAST(CONVERT(nome USING cp850) AS BINARY) USING utf8mb4)
WHERE HEX(nome) LIKE '%E2949C%'
  AND HEX(CONVERT(CAST(CONVERT(nome USING cp850) AS BINARY) USING utf8mb4)) NOT LIKE '%E2949C%';
