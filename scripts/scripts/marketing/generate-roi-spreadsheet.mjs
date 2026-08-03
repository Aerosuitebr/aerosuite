#!/usr/bin/env node
/**
 * Gera planilha Excel (.xlsx) da calculadora ROI — importável no Google Sheets.
 * Uso: node scripts/marketing/generate-roi-spreadsheet.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outPath = path.join(root, 'docs/marketing/landing-roi/Calculadora_ROI_Aero_Suite.xlsx');

let XLSX;
try {
  XLSX = require('xlsx');
} catch {
  console.error('Instale xlsx: npm install --no-save xlsx (na raiz do repo)');
  process.exit(1);
}

const wb = XLSX.utils.book_new();

const rows = [
  ['Aero Suite — Calculadora de ROI (MRO / Part 145)', '', ''],
  ['Ajuste os valores na coluna B por prospect.', '', ''],
  ['', '', ''],
  ['PARÂMETRO', 'VALOR', 'NOTAS'],
  ['Horas administração / mês', 40, 'OS, e-mail, planilhas'],
  ['Custo hora carregado (R$)', 80, 'Salário + encargos'],
  ['Horas retrabalho / mês', 8, 'Erro operacional evitável'],
  ['Multa/atraso evitado (R$/mês)', 0, 'Pode ser 0 na 1ª conversa'],
  ['Licença mensal proposta (R$)', 2500, 'Preço comercial'],
  ['Investimento inicial (R$)', 15000, 'Setup + migração + treinamento'],
  ['', '', ''],
  ['RESULTADO', 'VALOR', 'FÓRMULA'],
  ['Economia operacional / mês (R$)', null, 'admin + retrabalho + multa'],
  ['Ganho líquido / mês (R$)', null, 'economia − licença'],
  ['Payback investimento (meses)', null, 'investimento ÷ líquido'],
  ['Economia acumulada Ano 1 (R$)', null, 'líquido×12 − investimento'],
  ['', '', ''],
  ['GRÁFICO', '', ''],
  ['Licença mensal (referência)', null, 'Para gráfico de barras'],
  ['Economia bruta mensal (referência)', null, 'Para gráfico de barras'],
];

const ws = XLSX.utils.aoa_to_sheet(rows);

// Largura visual aproximada
ws['!cols'] = [{ wch: 36 }, { wch: 18 }, { wch: 32 }];

// Fórmulas (linhas 1-based no Excel: B5=horas, B6=custo, B7=erros, B8=multa, B9=lic, B10=inv)
ws['B13'] = { t: 'n', f: 'B5*B6+B7*B6+B8' };
ws['B14'] = { t: 'n', f: 'B13-B9' };
ws['B15'] = {
  t: 's',
  f: 'IF(B14<=0,"Revise premissas",IF(B10=0,"Imediato",B10/B14))',
};
ws['B16'] = { t: 'n', f: 'B14*12-B10' };
ws['B19'] = { t: 'n', f: 'B9' };
ws['B20'] = { t: 'n', f: 'B13' };

// Formato moeda BRL nas células numéricas de resultado
const currencyCells = ['B5', 'B6', 'B8', 'B9', 'B10', 'B13', 'B14', 'B16', 'B19', 'B20'];
for (const ref of currencyCells) {
  if (ws[ref]) {
    ws[ref].z = '#,##0.00';
  }
}

XLSX.utils.book_append_sheet(wb, ws, 'ROI');

const instrRows = [
  ['Como usar no Google Sheets', ''],
  ['1', 'Faça upload deste .xlsx no Google Drive'],
  ['2', 'Abra com Google Planilhas (Arquivo → Importar se necessário)'],
  ['3', 'Edite apenas a coluna B (parâmetros)'],
  ['4', 'Gráfico: selecione A19:B20 → Inserir → Gráfico → Barras'],
  ['5', 'Landing web equivalente: docs/marketing/landing-roi/index.html'],
  ['', ''],
  ['Fórmulas (referência)', ''],
  ['Economia/mês', '=B5*B6+B7*B6+B8'],
  ['Líquido/mês', '=B13-B9'],
  ['Payback', '=SE(B14<=0;"Revise premissas";SE(B10=0;"Imediato";B10/B14))'],
  ['Ano 1', '=B14*12-B10'],
];

const wsInstr = XLSX.utils.aoa_to_sheet(instrRows);
wsInstr['!cols'] = [{ wch: 28 }, { wch: 52 }];
XLSX.utils.book_append_sheet(wb, wsInstr, 'Instruções');

fs.mkdirSync(path.dirname(outPath), { recursive: true });
XLSX.writeFile(wb, outPath);
console.log('Gerado:', outPath);
