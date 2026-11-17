-- Interrogacoes substituiram caracteres na importacao de algumas descricoes.
-- Corrige apenas as frases afetadas, preservando descricoes personalizadas.
UPDATE perfil
SET descricao = CONCAT('Suprimento ', CONVERT(0xE28094 USING utf8mb4),
    ' libera', CONVERT(0xC3A7C3A3 USING utf8mb4), 'o de pagamento de itens de trocas eventuais na OS')
WHERE codigo = 'SUPRIMENTO'
  AND descricao REGEXP '^Suprimento [?]+ libera[?]+o de pagamento de itens de trocas eventuais na OS$';

UPDATE perfil
SET descricao = CONCAT('Respons', CONVERT(0xC3A1 USING utf8mb4), 'vel por captar clientes para a bellows.')
WHERE codigo = 'VENDEDOR'
  AND descricao REGEXP '^Respons[?]+vel por captar clientes para a bellows[.]$';

UPDATE perfil
SET descricao = CONCAT('Acesso limitado apenas para visualiza', CONVERT(0xC3A7C3A3 USING utf8mb4), 'o')
WHERE codigo = 'VISITANTE'
  AND descricao REGEXP '^Acesso limitado apenas para visualiza[?]+o$';

UPDATE perfil
SET descricao = CONCAT('Controle de Produ', CONVERT(0xC3A7C3A3 USING utf8mb4), 'o')
WHERE nome = 'Planejamento'
  AND descricao REGEXP '^Controle de Produ[?]+o$';
