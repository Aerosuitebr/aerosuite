-- P5.3.4 — evita sobrescrever estágio manual quando o déficit de kit FCU é recalculado.

ALTER TABLE os
    ADD COLUMN fila_estagio_travada TINYINT(1) NOT NULL DEFAULT 0
        COMMENT '1 = estágio definido manualmente no quadro de capacidade';
