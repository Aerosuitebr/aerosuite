-- P3 — backfill CONFORMIDADE_PAINEL e CONFORMIDADE_TREINAMENTO_OBRIG para perfis com módulos SGQ (Onda C/D).

INSERT INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT DISTINCT pf.perfil_id, f.id
FROM perfil_funcionalidade pf
         JOIN funcionalidade fa ON fa.id = pf.funcionalidade_id
    AND fa.codigo IN (
                       'SGQ_DOCUMENTO_CONTROLADO', 'CONFORMIDADE_TREINAMENTO', 'CONFORMIDADE_CALIBRACAO',
                       'CONFORMIDADE_NC', 'CONFORMIDADE_SUBCONTRATACAO'
    )
         CROSS JOIN funcionalidade f
WHERE f.codigo IN ('CONFORMIDADE_PAINEL', 'CONFORMIDADE_TREINAMENTO_OBRIG')
  AND NOT EXISTS (
    SELECT 1 FROM perfil_funcionalidade x
    WHERE x.perfil_id = pf.perfil_id AND x.funcionalidade_id = f.id
);

INSERT INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT p.id, f.id
FROM perfil p
         CROSS JOIN funcionalidade f
WHERE p.codigo IN ('P145_RT', 'P145_INSPETOR', 'GERENTE_MANUTENCAO', 'GERENTE', 'DIRETOR')
  AND f.codigo IN ('CONFORMIDADE_PAINEL', 'CONFORMIDADE_TREINAMENTO_OBRIG')
  AND NOT EXISTS (
    SELECT 1 FROM perfil_funcionalidade pf
    WHERE pf.perfil_id = p.id AND pf.funcionalidade_id = f.id
);
