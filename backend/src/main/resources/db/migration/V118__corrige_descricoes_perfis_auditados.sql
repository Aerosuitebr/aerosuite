UPDATE perfil
SET descricao = CONCAT('Acesso total ao sistema com todas as permiss', CONVERT(0xC3B5 USING utf8mb4), 'es')
WHERE codigo = 'ADMIN'
  AND descricao REGEXP '^Acesso total ao sistema com todas as permiss[?]+es$';

UPDATE perfil
SET descricao = CONCAT('Acesso para atendimento ao cliente e consultas b', CONVERT(0xC3A1 USING utf8mb4), 'sicas')
WHERE codigo = 'ATENDENTE'
  AND descricao REGEXP '^Acesso para atendimento ao cliente e consultas b[?]+sicas$';

UPDATE perfil
SET descricao = CONCAT('Atualiza', CONVERT(0xC3A7C3B5 USING utf8mb4), 'es de Manuais')
WHERE TRIM(codigo) = 'Biblioteca'
  AND TRIM(descricao) REGEXP '^Atualiza[?]+es de Manuais$';

UPDATE perfil
SET descricao = CONCAT('Acesso ', CONVERT(0xC3A0 USING utf8mb4),
    ' abertura de Ordens de servi', CONVERT(0xC3A7 USING utf8mb4),
    'o, visualizar produtos aeron', CONVERT(0xC3A1 USING utf8mb4), 'uticos, visualizar manuais.')
WHERE nome = 'CTM'
  AND TRIM(descricao) REGEXP '^Acesso a abertura de Ordens de servi[?]+o, visualizar produtos aeron[?]+uticos, visualizar manuais[.]$';

UPDATE perfil
SET descricao = CONCAT('Comercial ', CONVERT(0xE28094 USING utf8mb4),
    ' notifica', CONVERT(0xC3A7C3B5 USING utf8mb4), 'es de itens n', CONVERT(0xC3A3 USING utf8mb4),
    'o pagos em trocas eventuais')
WHERE codigo = 'COMERCIAL'
  AND descricao REGEXP '^Comercial [?]+ notifica[?]+es de itens n[?]+o pagos em trocas eventuais$';
