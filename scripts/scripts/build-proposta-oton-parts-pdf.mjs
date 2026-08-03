#!/usr/bin/env node
/**
 * Gera PDF — Proposta Comercial OTON PARTS CORP
 * Uso: node scripts/build-proposta-oton-parts-pdf.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const puppeteer = require(path.join(path.dirname(fileURLToPath(import.meta.url)), '../frontend/node_modules/puppeteer'));

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const stamp = '20260624';
const outDir = path.join(root, 'docs/comercial');
const marketingDir = 'D:/Desenvolvimento/Marketing/PROPOSTA_COMERCIAL';
const htmlSrc = path.join(outDir, `Proposta_Comercial_OTON_PARTS_CORP_${stamp}.html`);
const pdfOut = path.join(outDir, `Proposta_Comercial_OTON_PARTS_CORP_${stamp}_v13.pdf`);
const pdfMarketing = path.join(marketingDir, 'Proposta_Comercial_OTON_PARTS_CORP_AeroSuite_Premium_v18.pdf');
const pdfGenerated = path.join(outDir, `.tmp-proposta-oton-${stamp}.pdf`);

if (!fs.existsSync(htmlSrc)) {
  console.error('HTML ausente:', htmlSrc);
  process.exit(1);
}

const logoCover = path.join(root, 'frontend/src/assets/Aero_Claro.png');
const logoHeader = path.join(root, 'frontend/src/assets/LOGO_LETRA.png');
const logoCoverUri = 'file:///' + logoCover.replace(/\\/g, '/');
const logoHeaderUri = 'file:///' + logoHeader.replace(/\\/g, '/');

let html = fs.readFileSync(htmlSrc, 'utf8');
html = html.replace(
  /file:\/\/\/D:\/Desenvolvimento\/aerosuite\/frontend\/src\/assets\/Aero_Claro\.png/g,
  logoCoverUri
);
html = html.replace(
  /file:\/\/\/D:\/Desenvolvimento\/aerosuite\/frontend\/src\/assets\/LOGO_LETRA_LIGHT\.png/g,
  logoCoverUri
);
html = html.replace(/file:\/\/\/D:\/Desenvolvimento\/aerosuite\/frontend\/src\/assets\/LOGO_LETRA\.png/g, logoHeaderUri);

const htmlTmp = path.join(outDir, `.tmp-proposta-oton-${stamp}.html`);
fs.writeFileSync(htmlTmp, html, 'utf8');
fs.mkdirSync(marketingDir, { recursive: true });

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.goto('file:///' + htmlTmp.replace(/\\/g, '/'), { waitUntil: 'networkidle0', timeout: 120000 });
await page.pdf({
  path: pdfGenerated,
  format: 'A4',
  printBackground: true,
  preferCSSPageSize: true,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
});
await browser.close();
fs.unlinkSync(htmlTmp);

for (const target of [pdfMarketing, pdfOut]) {
  try {
    fs.copyFileSync(pdfGenerated, target);
    console.log('OK:', target);
  } catch (err) {
    console.warn('Não foi possível gravar (arquivo em uso?):', target, '-', err.message);
  }
}

try {
  fs.unlinkSync(pdfGenerated);
} catch {
  // ignore
}

const stat = fs.statSync(fs.existsSync(pdfMarketing) ? pdfMarketing : pdfGenerated);
console.log('Tamanho:', (stat.size / (1024 * 1024)).toFixed(2), 'MB');
