#!/usr/bin/env node
/**
 * Gera Confronto Técnico — Homologação UX Relatório 6 (PDF + HTML).
 * Uso: node scripts/build-homolog-confronto-relatorio6-pdf.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { META, SECTIONS, ITEMS, SCORE } from '../docs/homolog_ux/confronto-relatorio6-data.mjs';

const require = createRequire(import.meta.url);
const puppeteer = require(path.join(path.dirname(fileURLToPath(import.meta.url)), '../frontend/node_modules/puppeteer'));

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const docDir = path.join(root, 'docs/homolog_ux');
const stamp = '20260621';
const css = fs.readFileSync(path.join(root, 'docs/ux-relatorio-executivo/relatorio-styles.css'), 'utf8');
const htmlOut = path.join(docDir, `Confronto_Homolog_UX_Relatorio6_${stamp}.html`);
const pdfOut = path.join(docDir, `Confronto_Homolog_UX_Relatorio6_${stamp}_verificado.pdf`);

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

function statusClass(code) {
  if (code === 'VERIFICADO_CORRIGIDO') return 'status-fixed';
  if (code === 'VERIFICADO_OK') return 'status-ok';
  if (code === 'PENDENTE') return 'status-pend';
  return 'status-code';
}

function statusShort(code) {
  if (code === 'VERIFICADO_CORRIGIDO') return '✓ Verificado - corrigido';
  if (code === 'VERIFICADO_OK') return '✓ Verificado - ok';
  if (code === 'PENDENTE') return '◐ Pendente homolog';
  return '◐ Pendente';
}

function itemCard(it) {
  return `
<article class="item-card confronto-card">
  <div class="item-head">
    <span class="item-id">${esc(it.id)}</span>
    <span class="item-title">${esc(it.title)}</span>
    <span class="sev sev--${esc(it.sev)}">${esc(it.sev)}</span>
    <span class="${statusClass(it.statusCode)}">${statusShort(it.statusCode)}</span>
  </div>
  <div class="item-meta"><strong>Módulo:</strong> ${esc(it.module)}</div>
  <div class="item-body confronto-grid">
    <div class="item-row confronto-antes">
      <div class="item-label">Antes (relatório consultora)</div>
      <div class="item-text">${esc(it.antes)}</div>
    </div>
    <div class="item-row confronto-depois">
      <div class="item-label">Depois (ação corretiva)</div>
      <div class="item-text">${esc(it.depois)}</div>
    </div>
    <div class="item-row">
      <div class="item-label">Evidência de verificação</div>
      <div class="item-text item-evidence">${esc(it.evidence)}</div>
    </div>
    <div class="item-row">
      <div class="item-label">Como reproduzir</div>
      <div class="item-text">${esc(it.verify)}</div>
    </div>
  </div>
</article>`;
}

function sectionPages() {
  return SECTIONS.map((sec) => {
    const items = ITEMS.filter((i) => i.section === sec.id);
    return `
<section class="page">
  <div class="page-header">
    <img src="${logoHeaderUri}" alt="Aero Suite" />
    <span class="chapter-label">Seção ${esc(sec.id)}</span>
  </div>
  <h2>${esc(sec.title)}</h2>
  <p class="section-intro">${esc(sec.intro)}</p>
  ${items.map(itemCard).join('\n')}
  <div class="page-footer">
    <span>Aero Suite · Confronto UX Relatório 6</span>
    <span>Seção ${esc(sec.id)}</span>
  </div>
</section>`;
  }).join('\n');
}

const matrixRows = ITEMS.map(
  (it) =>
    `<tr>
      <td>${esc(it.id)}</td>
      <td>${esc(it.sev)}</td>
      <td>${esc(it.module)}</td>
      <td>${esc(it.title)}</td>
      <td><span class="${statusClass(it.statusCode)}">${statusShort(it.statusCode)}</span></td>
    </tr>`,
).join('\n');

const reincidenciasHtml = (META.reincidencias ?? [])
  .map((r) => `<li>${esc(r)}</li>`)
  .join('');

const deployNote = SCORE.deployRequired
  ? `<p class="lead callout-warn"><strong>Próximo passo operacional:</strong> as correções estão integradas na branch <strong>desenv</strong> (commits 416a11d–417265c). A validação API/UI final em <strong>${esc(META.site)}</strong> depende do deploy das migrations V74–V77 e do frontend atualizado. Após deploy, executar <code>node scripts/verify-relatorio6-homolog.mjs</code>.</p>`
  : '';

const extraCss = `
.item-meta { font-size: 9pt; color: #64748b; margin: -2mm 0 3mm 0; }
.confronto-antes { border-left: 3px solid #dc2626; padding-left: 3mm; }
.confronto-depois { border-left: 3px solid #16a34a; padding-left: 3mm; }
.item-evidence { font-size: 8.5pt; color: #475569; }
.status-fixed { color: #15803d; font-weight: 700; font-size: 8pt; }
.status-ok { color: #15803d; font-weight: 700; font-size: 8pt; }
.status-pend { color: #b45309; font-weight: 700; font-size: 8pt; }
.metric-table td, .metric-table th { font-size: 9pt; }
.callout-warn { background: #fffbeb; border-left: 3px solid #f59e0b; padding: 3mm 4mm; }
`;

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
    <div class="cover-badge">Confronto técnico · Relatório 6 · Confidencial</div>
    <h1>${esc(META.title)}</h1>
    <p class="cover-sub">${esc(META.subtitle)}<br/>Referência: ${esc(META.reference)}</p>
    <div class="cover-gold-line"></div>
    <p class="cover-meta">
      <strong>Versão ${esc(META.version)}</strong> · ${esc(META.date)}<br />
      Ambiente: <strong>${esc(META.site)}</strong>
    </p>
  </div>
  <div class="cover-footer">Aero Suite — Gestão aeronáutica</div>
</section>

<section class="page">
  <div class="page-header">
    <img src="${logoHeaderUri}" alt="Aero Suite" />
    <span class="chapter-label">Sumário executivo</span>
  </div>
  <h2>Sumário executivo do confronto</h2>
  <p class="lead">
  O Relatório 6 (Sessão 4, 19/jun/2026) catalogou <strong>28 achados</strong> (S4-01 a S4-36) em Produtos, Fabricantes,
  Relatórios, Usuários Externos, Ordens de Serviço e Conformidade Técnica, incluindo
  <strong>${META.criticosRelatorio} críticos</strong> e <strong>${META.altosRelatorio} altos</strong>.
  Este documento confronta cada achado com a ação corretiva aplicada e a evidência de verificação no código-fonte.
  </p>

  <h3>Reincidências tratadas</h3>
  <ul class="lead">${reincidenciasHtml}</ul>

  <div class="score-grid">
    <div class="score-card"><div class="score-val">${SCORE.total}</div><div class="score-label">Achados totais</div></div>
    <div class="score-card score-card--ok"><div class="score-val">${SCORE.verified}</div><div class="score-label">Corrigidos (código)</div></div>
    <div class="score-card"><div class="score-val">${SCORE.pending}</div><div class="score-label">Pendentes código</div></div>
    <div class="score-card score-card--ok"><div class="score-val">${SCORE.criticalOk}/${SCORE.critical}</div><div class="score-label">Críticos resolvidos</div></div>
  </div>

  <h3>Métricas (${esc(META.date)})</h3>
  <table class="metric-table">
    <thead><tr><th>Indicador</th><th>Valor</th></tr></thead>
    <tbody>
      <tr><td>Verificação estática (verify-relatorio6)</td><td><strong>${SCORE.verificacaoCodigoPass}/${SCORE.verificacaoCodigoTotal}</strong></td></tr>
      <tr><td>Conformidade no código</td><td><strong>${SCORE.pctConformidadeCodigo}%</strong> (${SCORE.verified}/${SCORE.total})</td></tr>
      <tr><td>Críticos (S4-07, S4-24, S4-34, S4-36)</td><td><strong>${SCORE.pctCriticosResolvidos}%</strong></td></tr>
      <tr><td>Altos (S4-06, S4-22)</td><td><strong>${SCORE.pctAltosResolvidos}%</strong></td></tr>
    </tbody>
  </table>

  <p class="lead">${esc(SCORE.notaMetodologia)}</p>
  ${deployNote}
  <p class="lead">Evidências versionadas em <strong>${esc(META.evidenceDir)}</strong>.</p>
  <div class="page-footer"><span>Aero Suite · Confronto UX</span><span>Sumário</span></div>
</section>

${sectionPages()}

<section class="page">
  <div class="page-header">
    <img src="${logoHeaderUri}" alt="Aero Suite" />
    <span class="chapter-label">Anexo</span>
  </div>
  <h2>Matriz consolidada</h2>
  <table>
    <thead><tr><th>ID</th><th>Severidade</th><th>Módulo</th><th>Título</th><th>Status</th></tr></thead>
    <tbody>${matrixRows}</tbody>
  </table>
  <div class="page-footer"><span>Aero Suite · Confronto UX</span><span>Anexo</span></div>
</section>

</body>
</html>`;

fs.mkdirSync(docDir, { recursive: true });
fs.writeFileSync(htmlOut, html, 'utf8');
console.log('HTML:', htmlOut);

const browser = await puppeteer.launch({ headless: true });
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
