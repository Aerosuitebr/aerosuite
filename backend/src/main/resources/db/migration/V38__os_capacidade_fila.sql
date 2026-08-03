-- P5.3 — Quadro capacidade / AOG: prioridade e estágio de fila na OS.

ALTER TABLE os
    ADD COLUMN prioridade_fila VARCHAR(20) NOT NULL DEFAULT 'NORMAL' COMMENT 'NORMAL ou AOG',
    ADD COLUMN fila_estagio VARCHAR(30) NOT NULL DEFAULT 'AGUARDANDO' COMMENT 'AGUARDANDO, EM_EXECUCAO, AGUARDANDO_PECAS, INSPECAO',
    ADD COLUMN data_prevista_conclusao DATE NULL;

CREATE INDEX idx_os_tenant_capacidade
    ON os (tenant_id, fila_estagio, prioridade_fila, dt_abertura);

INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, parent_id, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Quadro de capacidade',
       'Fila de OS abertas por estágio (AOG e SLA)',
       'QUADRO_CAPACIDADE',
       'pi pi-th-large',
       '/capacidade',
       94,
       'Operacional',
       NULL,
       'funcionalidade',
       TRUE,
       94,
       TRUE,
       NOW(),
       NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'QUADRO_CAPACIDADE');

INSERT INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT p.id, f.id
FROM perfil p
         CROSS JOIN funcionalidade f
WHERE f.codigo = 'QUADRO_CAPACIDADE'
  AND UPPER(p.codigo) IN (
        'ADMIN', 'ADMINISTRADOR', 'DIRETOR', 'GERENTE', 'QUALIDADE',
        'P145_RT', 'P145_INSPETOR', 'P145_EXECUCAO', 'OPERADOR', 'GERENCIAR_PERMISSOES')
  AND NOT EXISTS (
    SELECT 1 FROM perfil_funcionalidade pf
    WHERE pf.perfil_id = p.id AND pf.funcionalidade_id = f.id);

INSERT INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT pf.perfil_id, f.id
FROM perfil_funcionalidade pf
         JOIN funcionalidade fa ON fa.id = pf.funcionalidade_id AND fa.codigo = 'ORDEM_SERVICO'
         CROSS JOIN funcionalidade f
WHERE f.codigo = 'QUADRO_CAPACIDADE'
  AND NOT EXISTS (
    SELECT 1 FROM perfil_funcionalidade x
    WHERE x.perfil_id = pf.perfil_id AND x.funcionalidade_id = f.id);
