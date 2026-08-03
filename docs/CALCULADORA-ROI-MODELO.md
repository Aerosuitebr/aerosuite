# Modelo de calculadora de ROI (venda Aero Suite / MRO)

Material de **pré-venda**: pode viver em planilha (Google Sheets / Excel) ou numa landing estática. Este arquivo define **variáveis e narrativa** alinhadas ao plano de comercialização (§12).

## Premissas (ajustar por cliente)

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `horas_admin_mes` | Horas/mês em follow-up de OS, e-mail, planilhas | 40 |
| `custo_hora` | Custo carregado (salário + encargos) / hora | R$ 80 |
| `erros_mes` | Retrabalho médio por mês (horas) | 8 |
| `multa_risco` | Valor esperado de multa/atraso evitado por mês (pode ser 0 na conversa) | R$ 0 |
| `licenca_mes` | Preço mensal da suite (proposta comercial) | R$ X |

## Fórmula simplificada (mensal)

```
economia_mes = horas_admin_mes * custo_hora + erros_mes * custo_hora + multa_risco
payback_meses = licenca_mes > 0 ? investimento_inicial / (economia_mes - licenca_mes) : n/d
```

Use `investimento_inicial` = setup + migração + treinamento, se cobrar à parte.

## Narrativa de valor (bullets para proposta)

- Menos **e-mail** com PDF solto: proposta com rastreio e histórico na suite.  
- **Permissões** por perfil reduzem erro operacional.  
- **Estoque / OS** no mesmo fluxo reduz ida e volta entre setores.  
- **OpenAPI** (`/q/openapi`) permite integrações futuras (Bling, BI) sem refatoração grande.

## Entregáveis “mínimos” de marketing

1. Planilha com as células acima + gráfico `economia_mes` vs `licenca_mes` — **Feito:** [`marketing/landing-roi/Calculadora_ROI_Aero_Suite.xlsx`](./marketing/landing-roi/Calculadora_ROI_Aero_Suite.xlsx) (importável no Google Sheets). Regenerar: `node scripts/marketing/generate-roi-spreadsheet.mjs`.  
2. Uma página pública (landing) com **um** case numérico fictício + CTA “agendar demo” — **Feito:** [`marketing/landing-roi/index.html`](./marketing/landing-roi/index.html).  
3. Link para documentação técnica resumida (`docs/IMPLEMENTACAO-PLANO-SAAS.md` + staging).

## Nota

A calculadora **não** precisa estar dentro do monólito Angular para o primeiro ciclo de vendas: planilha + PDF comercial costuma ser mais rápido que desenvolver UI.
