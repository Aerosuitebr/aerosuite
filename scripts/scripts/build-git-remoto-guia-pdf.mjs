#!/usr/bin/env node
/**
 * Guia premium — Operação Git remoto Aero Suite (PDF + HTML).
 * Uso: node scripts/build-git-remoto-guia-pdf.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { META, SUMMARY, SECTIONS, CHECKLIST } from '../docs/git_operacao/git-remoto-guia-data.mjs';

const require = createRequire(import.meta.url);
const puppeteer = require(path.join(path.dirname(fileURLToPath(import.meta.url)), '../frontend/node_modules/puppeteer'));

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const docDir = path.join(root, 'docs/git_operacao');
const stamp = '20260618';
const css = fs.readFileSync(path.join(root, 'docs/ux-relatorio-executivo/relatorio-styles.css'), 'utf8');
const htmlOut = path.join(docDir, `Guia_Operacao_Git_Remoto_${stamp}.html`);
const pdfOut = path.join(docDir, `Guia_Operacao_Git_Remoto_${stamp}.pdf`);

const logoCover = path.join(root, 'frontend/src/assets/LOGO_LETRA_LIGHT.png');
const logoHeader = path.join(root, 'frontend/src/assets/LOGO_LETRA.png');
const logoCoverUri = 'file:///' + logoCover.replace(/\\/g, '/');
const logoHeaderUri = 'file:///' + logoHeader.replace(/\\/g, '/');

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderBlock(block) {
  if (block.type === 'table') {
    const rows = block.rows
      .map(
        ([a, b]) =>
          `<tr><td><strong>${esc(a)}</strong></td><td>${esc(b)}</td></tr>`,
      )
      .join('');
    return `<h3>${esc(block.title)}</h3><table class="metric-table"><tbody>${rows}</tbody></table>`;
  }
  if (block.type === 'list') {
    const items = block.items.map((i) => `<li>${esc(i)}</li>`).join('');
    return `<h3>${esc(block.title)}</h3><ul class="bullet-list">${items}</ul>`;
  }
  if (block.type === 'steps') {
    const steps = block.steps.map((s, i) => `<li><span class="step-num">${i + 1}</span> ${esc(s)}</li>`).join('');
    return `<h3>${esc(block.title)}</h3><ol class="step-list">${steps}</ol>`;
  }
  if (block.type === 'code') {
    const lines = block.lines.map((l) => esc(l)).join('\n');
    return `<h3>${esc(block.title)}</h3><pre class="code-block">${lines}</pre>`;
  }
  if (block.type === 'diagram') {
    return `<div class="flow-diagram">${esc(block.text)}</div>`;
  }
  if (block.type === 'callout') {
    const cls = block.variant === 'warn' ? 'callout-warn' : 'callout-info';
    return `<div class="callout ${cls}">${esc(block.text)}</div>`;
  }
  if (block.type === 'faq') {
    return block.items
      .map(
        (f) =>
          `<div class="faq-item"><div class="faq-q">${esc(f.q)}</div><div class="faq-a">${esc(f.a)}</div></div>`,
      )
      .join('');
  }
  return '';
}

function sectionPages() {
  return SECTIONS.map((sec) => {
    const body = sec.blocks.map(renderBlock).join('\n');
    return `
<section class="page">
  <div class="page-header">
    <img src="${logoHeaderUri}" alt="Aero Suite" />
    <span class="chapter-label">Capítulo ${esc(sec.id)}</span>
  </div>
  <h2>${esc(sec.title)}</h2>
  <p class="section-intro">${esc(sec.intro)}</p>
  ${body}
  <div class="page-footer">
    <span>Aero Suite · Guia Git Remoto</span>
    <span>Cap. ${esc(sec.id)}</span>
  </div>
</section>`;
  }).join('\n');
}

const extraCss = `
.bullet-list, .step-list { font-size: 9.5pt; line-height: 1.55; color: #334155; margin: 0 0 4mm 5mm; }
.step-list li { margin-bottom: 2.5mm; list-style: none; position: relative; padding-left: 7mm; }
.step-num { position: absolute; left: 0; color: #0ea5e9; font-weight: 700; }
.code-block { background: #0f172a; color: #e2e8f0; padding: 4mm 5mm; border-radius: 4px; font-size: 8.5pt; line-height: 1.45; overflow-x: auto; white-space: pre-wrap; margin: 0 0 5mm 0; }
.flow-diagram { background: linear-gradient(90deg,#f0f9ff,#ecfeff); border: 1px solid #7dd3fc; border-radius: 8px; padding: 5mm 6mm; font-family: Consolas, monospace; font-size: 10pt; color: #0369a1; text-align: center; margin: 4mm 0 6mm 0; font-weight: 600; }
.callout { border-radius: 8px; padding: 4mm 5mm; margin: 4mm 0 6mm 0; font-size: 9pt; line-height: 1.5; }
.callout-warn { background: #fffbeb; border-left: 4px solid #f59e0b; color: #92400e; }
.callout-info { background: #eff6ff; border-left: 4px solid #3b82f6; color: #1e40af; }
.faq-item { margin-bottom: 4mm; border-bottom: 1px solid #e2e8f0; padding-bottom: 3mm; }
.faq-q { font-weight: 700; font-size: 9.5pt; color: #0f172a; margin-bottom: 1.5mm; }
.faq-a { font-size: 9pt; color: #475569; line-height: 1.5; }
.checklist li { margin-bottom: 2mm; }
.metric-table td { font-size: 9pt; vertical-align: top; }
`;

const checklistHtml = CHECKLIST.map((c) => `<li>${esc(c)}</li>`).join('');

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>${esc(META.title)}</title>
  <style>${css}${extraCss}</style>
</head>
<body>

<section class="cover">
  <div class="cover-grid"></div>
  <div class="cover-inner">
    <img class="cover-logo" src="${logoCoverUri}" alt="Aero Suite" />
    <div class="cover-badge">Operações · Git &amp; CI/CD · ${esc(META.classification)}</div>
    <h1>${esc(META.title)}</h1>
    <p class="cover-sub">${esc(META.subtitle)}<br/>${esc(META.reference)}</p>
    <div class="cover-gold-line"></div>
    <p class="cover-meta">
      <strong>Versão ${esc(META.version)}</strong> · ${esc(META.date)}<br />
      Repositório: <strong>${esc(SUMMARY.repoUrl)}</strong>
    </p>
  </div>
  <div class="cover-footer">Aero Suite — Gestão aeronáutica</div>
</section>

<section class="page">
  <div class="page-header">
    <img src="${logoHeaderUri}" alt="Aero Suite" />
    <span class="chapter-label">Sumário executivo</span>
  </div>
  <h2>Sumário executivo</h2>
  <p class="lead">
    Este guia formaliza os procedimentos de interação com o ambiente Git remoto do projeto Aero Suite,
    após a criação da organização <strong>${esc(SUMMARY.org)}</strong> e do repositório privado
    <strong>${esc(SUMMARY.repo)}</strong>. O documento cobre autenticação, fluxo de branches,
  integração contínua, secrets, releases e resolução de incidentes comuns.
  </p>

  <div class="score-grid">
    <div class="score-card score-card--ok"><div class="score-val">${esc(SUMMARY.defaultBranch)}</div><div class="score-label">Produção</div></div>
    <div class="score-card"><div class="score-val">${esc(SUMMARY.devBranch)}</div><div class="score-label">Desenvolvimento</div></div>
    <div class="score-card score-card--ok"><div class="score-val">CI</div><div class="score-label">${esc(SUMMARY.ciStatus)}</div></div>
    <div class="score-card"><div class="score-val">2</div><div class="score-label">Ambientes GH</div></div>
  </div>

  <h3>Checklist rápido — novo membro</h3>
  <ul class="bullet-list checklist">${checklistHtml}</ul>

  <div class="page-footer"><span>Aero Suite · Guia Git</span><span>Sumário</span></div>
</section>

${sectionPages()}

</body>
</html>`;

fs.mkdirSync(docDir, { recursive: true });
fs.writeFileSync(htmlOut, html, 'utf8');
console.log('HTML:', htmlOut);

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.goto('file:///' + htmlOut.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
await page.pdf({
  path: pdfOut,
  format: 'A4',
  printBackground: true,
  preferCSSPageSize: true,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
});
await browser.close();

console.log('PDF:', pdfOut);
console.log('Tamanho:', Math.round(fs.statSync(pdfOut).size / 1024), 'KB');
