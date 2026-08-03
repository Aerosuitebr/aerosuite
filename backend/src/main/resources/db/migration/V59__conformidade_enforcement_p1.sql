-- P1 — flags de bloqueio operacional SGQ por tenant + ferramenta no apontamento hangar.

ALTER TABLE sistema_empresa_config
    ADD COLUMN conformidade_bloquear_calibracao_vencida TINYINT(1) NOT NULL DEFAULT 0
        COMMENT 'Bloqueia saída de estoque e apontamento hangar com calibração vencida',
    ADD COLUMN conformidade_bloquear_treino_obrigatorio TINYINT(1) NOT NULL DEFAULT 0
        COMMENT 'Bloqueia execução hangar e emissão CRS sem treino obrigatório vigente',
    ADD COLUMN conformidade_bloquear_subcontratacao_vencida TINYINT(1) NOT NULL DEFAULT 0
        COMMENT 'Bloqueia operações na OS com subcontratação ativa e certificado vencido';

ALTER TABLE os_job_card_apontamento
    ADD COLUMN ferramenta_identificador VARCHAR(80) NULL
        COMMENT 'Identificador de ferramenta calibrada usada no apontamento';
