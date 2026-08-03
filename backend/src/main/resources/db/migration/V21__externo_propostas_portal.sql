-- P4.2 Portal cliente: decisão do cliente na proposta + menu externo.

ALTER TABLE proposta_comercial
    ADD COLUMN cliente_decisao_em DATETIME NULL,
    ADD COLUMN cliente_decisao_ip VARCHAR(45) NULL,
    ADD COLUMN cliente_decisao_user_agent VARCHAR(500) NULL,
    ADD COLUMN cliente_decisao_motivo TEXT NULL,
    ADD COLUMN cliente_decisao_usuario_externo_id INT NULL;

ALTER TABLE proposta_comercial
    ADD CONSTRAINT fk_proposta_decisao_usuario_externo
        FOREIGN KEY (cliente_decisao_usuario_externo_id) REFERENCES usuario_externo (id);

INSERT INTO funcionalidade_externa (nome, descricao, codigo, icone, rota, ordem, ativo)
SELECT 'Minhas Propostas', 'Visualizar e aprovar propostas comerciais', 'propostas-externa', 'pi pi-file',
       '/externo/propostas', 25, 1
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM funcionalidade_externa WHERE codigo = 'propostas-externa');

INSERT INTO usuario_externo_funcionalidade (usuario_externo_id, funcionalidade_externa_id, concedido_por, data_concessao)
SELECT ue.id, fe.id, NULL, NOW()
FROM usuario_externo ue
         CROSS JOIN funcionalidade_externa fe
WHERE fe.codigo = 'propostas-externa'
  AND ue.ativo = 1
  AND NOT EXISTS (
    SELECT 1 FROM usuario_externo_funcionalidade uef
    WHERE uef.usuario_externo_id = ue.id AND uef.funcionalidade_externa_id = fe.id
);
