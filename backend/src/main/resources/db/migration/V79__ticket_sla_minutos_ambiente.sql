-- SLA em minutos (suporta prazos sub-hora, ex.: Produção + Crítica = 30 min).

ALTER TABLE ticket
    ADD COLUMN sla_primeira_resposta_minutos INT NULL AFTER sla_resolucao_horas,
    ADD COLUMN sla_resolucao_minutos INT NULL AFTER sla_primeira_resposta_minutos;

UPDATE ticket
SET sla_primeira_resposta_minutos = sla_primeira_resposta_horas * 60,
    sla_resolucao_minutos = sla_resolucao_horas * 60
WHERE sla_primeira_resposta_horas IS NOT NULL
  AND sla_resolucao_horas IS NOT NULL;
