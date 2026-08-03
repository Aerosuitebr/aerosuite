-- P4.4 Dossiê de auditoria: export PDF consolidado por OS.

INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, parent_id, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Dossiê de auditoria', 'Exportação PDF: OS, anexos, estoque e logs', 'DOSSIE_AUDITORIA', 'pi pi-file-pdf',
       '/dossie-auditoria', 96, 'Administração', NULL, 'funcionalidade', TRUE, 96, TRUE, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'DOSSIE_AUDITORIA');

INSERT INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT p.id, f.id
FROM perfil p
         CROSS JOIN funcionalidade f
WHERE f.codigo = 'DOSSIE_AUDITORIA'
  AND UPPER(p.codigo) IN ('ADMIN', 'ADMINISTRADOR', 'DIRETOR', 'QUALIDADE', 'GERENTE')
  AND NOT EXISTS (
    SELECT 1 FROM perfil_funcionalidade pf
    WHERE pf.perfil_id = p.id AND pf.funcionalidade_id = f.id
);

-- Quem já consulta auditoria de OS pode exportar o dossiê.
INSERT INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT pf.perfil_id, f.id
FROM perfil_funcionalidade pf
         JOIN funcionalidade fa ON fa.id = pf.funcionalidade_id AND fa.codigo = 'ORDEM_SERVICO'
         CROSS JOIN funcionalidade f
WHERE f.codigo = 'DOSSIE_AUDITORIA'
  AND NOT EXISTS (
    SELECT 1 FROM perfil_funcionalidade x
    WHERE x.perfil_id = pf.perfil_id AND x.funcionalidade_id = f.id
);
