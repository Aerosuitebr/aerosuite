-- Unifica variantes de secao no menu (evita blocos duplicados no frontend).

SET NAMES utf8mb4;

UPDATE funcionalidade SET secao = 'Operacional'
WHERE secao <> 'Operacional'
  AND (
    UPPER(TRIM(secao)) = 'OPERACIONAL'
    OR UPPER(TRIM(secao)) IN ('OPERACAO', 'OPERACOES')
    OR secao REGEXP '^Operac'
  );

UPDATE funcionalidade SET secao = 'Gestão'
WHERE secao <> 'Gestão'
  AND (
    UPPER(TRIM(secao)) IN ('GESTAO', 'GESTÃO')
    OR secao REGEXP '^Gest[aã]o'
  );

UPDATE funcionalidade SET secao = 'Administração'
WHERE secao <> 'Administração'
  AND secao LIKE 'Administra%';

UPDATE funcionalidade SET secao = 'Publicações Técnicas'
WHERE secao <> 'Publicações Técnicas'
  AND secao LIKE 'Publica%'
  AND secao LIKE '%T%cnica%';
