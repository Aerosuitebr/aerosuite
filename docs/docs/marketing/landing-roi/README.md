# Landing comercial + calculadora ROI

Material **fora do monólito** Angular/Quarkus — página estática e planilha para pré-venda.

## Abrir localmente

```powershell
start docs/marketing/landing-roi/index.html
```

## Planilha (Google Sheets / Excel)

| Arquivo | Uso |
|---------|-----|
| [`Calculadora_ROI_Aero_Suite.xlsx`](./Calculadora_ROI_Aero_Suite.xlsx) | Upload no Google Drive → Abrir com Planilhas Google |
| Aba **ROI** | Parâmetros (coluna B) + resultados com fórmulas |
| Aba **Instruções** | Passo a passo + fórmulas em PT para Google Sheets |

**Gráfico no Google Sheets:** selecione células `A19:B20` (Licença vs Economia) → Inserir → Gráfico → Barras.

Regenerar após editar o gerador:

```powershell
npm install --no-save xlsx
node scripts/marketing/generate-roi-spreadsheet.mjs
```

## Publicação sugerida

Subdomínio ou domínio comercial (ex. `www.aerosuite.com.br/roi`) apontando para a landing ou cópia no CMS/WordPress. Planilha: link “Fazer uma cópia” no Drive após upload.
