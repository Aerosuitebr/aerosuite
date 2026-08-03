#!/usr/bin/env node
/**
 * Gera PDF — Síntese Técnica Aero Suite (RT e ANAC)
 * Uso: node scripts/build-sintese-rt-anac-pdf.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const puppeteer = require(path.join(path.dirname(fileURLToPath(import.meta.url)), '../frontend/node_modules/puppeteer'));

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'docs/anac-conformidade');
const css = fs.readFileSync(path.join(root, 'docs/ux-relatorio-executivo/relatorio-styles.css'), 'utf8');
const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
const htmlSrc = path.join(outDir, 'Sintese_Sistema_RT_ANAC.html');
const htmlOut = path.join(outDir, `Sintese_Sistema_RT_ANAC_${stamp}.html`);
const pdfOut = path.join(outDir, `Sintese_Sistema_RT_ANAC_${stamp}.pdf`);

const logoCover = path.join(root, 'frontend/src/assets/LOGO_LETRA_LIGHT.png');
const logoHeader = path.join(root, 'frontend/src/assets/LOGO_LETRA.png');
const logoCoverUri = 'file:///' + logoCover.replace(/\\/g, '/');
const logoHeaderUri = 'file:///' + logoHeader.replace(/\\/g, '/');

let html = fs.readFileSync(htmlSrc, 'utf8');
html = html.replace(
  '<link rel="stylesheet" href="../ux-relatorio-executivo/relatorio-styles.css" />',
  `<style>${css}</style>`
);
html = html.replace(/\.\.\/\.\.\/frontend\/src\/assets\/LOGO_LETRA_LIGHT\.png/g, logoCoverUri);
html = html.replace(/\.\.\/\.\.\/frontend\/src\/assets\/LOGO_LETRA\.png/g, logoHeaderUri);

fs.writeFileSync(htmlOut, html, 'utf8');
console.log('HTML:', htmlOut);

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.goto('file:///' + htmlOut.replace(/\\/g, '/'), { waitUntil: 'networkidle0', timeout: 60000 });
await page.pdf({
  path: pdfOut,
  format: 'A4',
  printBackground: true,
  preferCSSPageSize: true,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
});
await browser.close();

const stat = fs.statSync(pdfOut);
console.log('PDF:', pdfOut);
console.log('Tamanho:', Math.round(stat.size / 1024), 'KB');
