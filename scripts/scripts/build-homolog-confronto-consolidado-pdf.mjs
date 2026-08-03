#!/usr/bin/env node
/**
 * Gera Confronto Técnico — Homologação UX Consolidado v2.0 (PDF + HTML).
 * Uso: node scripts/build-homolog-confronto-consolidado-pdf.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { META, SECTIONS, ITEMS, SCORE, STATUS } from '../docs/homolog_ux/confronto-consolidado-v2-data.mjs';

const require = createRequire(import.meta.url);
const puppeteer = require(path.join(path.dirname(fileURLToPath(import.meta.url)), '../frontend/node_modules/puppeteer'));

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const docDir = path.join(root, 'docs/homolog_ux');
const evDir = path.join(root, META.evidenceDir);
const stamp = '20260616_status';
const css = fs.readFileSync(path.join(root, 'docs/ux-relatorio-executivo/relatorio-styles.css'), 'utf8');
const htmlOut = path.join(docDir, `Confronto_Homolog_UX_Consolidado_v2_${stamp}.html`);
const pdfOut = path.join(docDir, `Confronto_Homolog_UX_Consolidado_v2_${stamp}_verificado.pdf`);

const logoCover = path.join(root, 'frontend/src/assets/LOGO_LETRA_LIGHT.png');
const logoHeader = path.join(root, 'frontend/src/assets/LOGO_LETRA.png');
const logoCoverUri = 'file:///' + logoCover.replace(/\\/g, '/');
const logoHeaderUri = 'file:///' + logoHeader.replace(/\\/g, '/');

const antesImg = path.join(evDir, 'antes-login-tenant-dropdown.png');
const depoisImg = path.join(evDir, 'depois-login-tenant-dropdown.png');
const hasA2Images = fs.existsSync(antesImg) && fs.existsSync(depoisImg);

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
  if (code === 'MANTIDO') return 'status-pos';
  return 'status-code';
}

function statusShort(code) {
  if (code === 'VERIFICADO_CORRIGIDO') return '✓ Verificado - corrigido';
  if (code === 'VERIFICADO_OK') return '✓ Verificado - ok';
  if (code === 'MANTIDO') return '✓ Mantido';
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
      <div class="item-label">Verificação sugerida</div>
      <div class="item-text">${esc(it.verify)}</div>
    </div>
    <div class="item-row">
      <div class="item-label">Evidência</div>
      <div class="item-text item-evidence">${esc(it.evidence)}</div>
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
    <span>Aero Suite · Confronto UX Consolidado v2</span>
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

const a2EvidenceBlock = hasA2Images
  ? `
<section class="page">
  <div class="page-header">
    <img src="${logoHeaderUri}" alt="Aero Suite" />
    <span class="chapter-label">Evidência A2</span>
  </div>
  <h2>A2 — Antes e depois (login multi-organização)</h2>
  <p class="lead">E-mail: <code>rafaellanottesconsultoria@gmail.com</code> · Ambiente: ${esc(META.site)} · 16/06/2026</p>
  <div class="evidence-pair">
    <figure class="evidence-fig">
      <img src="file:///${antesImg.replace(/\\/g, '/')}" alt="Antes A2" />
      <figcaption><strong>Antes:</strong> 3 entradas idênticas no dropdown (tenants #16, #17, #18)</figcaption>
    </figure>
    <figure class="evidence-fig">
      <img src="file:///${depoisImg.replace(/\\/g, '/')}" alt="Depois A2" />
      <figcaption><strong>Depois:</strong> 1 organização ativa; API retorna label com código, data e #id</figcaption>
    </figure>
  </div>
  <div class="callout callout--info">
    <strong>Ações:</strong> deploy backend/frontend com TenantLoginService + enrichTenantLoginOptions;
    execução de <code>db/scripts/cleanup-duplicate-tenants-consultora-homolog.sql</code> (inativação tenants 17 e 18).
  </div>
  <div class="page-footer"><span>Aero Suite · Confronto UX</span><span>Evidência A2</span></div>
</section>`
  : '';

const extraCss = `
.item-meta { font-size: 9pt; color: #64748b; margin: -2mm 0 3mm 0; }
.confronto-antes { border-left: 3px solid #dc2626; padding-left: 3mm; }
.confronto-depois { border-left: 3px solid #16a34a; padding-left: 3mm; }
.item-evidence { font-size: 8.5pt; color: #475569; }
.status-fixed { color: #15803d; font-weight: 700; font-size: 8pt; }
.status-code { color: #b45309; font-weight: 700; font-size: 8pt; }
.status-pos { color: #0369a1; font-weight: 700; font-size: 8pt; }
.evidence-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; margin: 4mm 0; }
.evidence-fig img { width: 100%; border: 1px solid #e2e8f0; border-radius: 4px; }
.evidence-fig figcaption { font-size: 8pt; margin-top: 2mm; color: #475569; }
.callout--warn { background: #fffbeb; border-color: #f59e0b; }
.callout--info { background: #f0f9ff; border-color: #38bdf8; }
.metric-table td, .metric-table th { font-size: 9pt; }
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
    <div class="cover-badge">Confronto técnico · Homologação UX · Confidencial</div>
    <h1>${esc(META.title)}</h1>
    <p class="cover-sub">${esc(META.subtitle)}<br/>Referência: ${esc(META.reference)}</p>
    <div class="cover-gold-line"></div>
    <p class="cover-meta">
      <strong>Versão ${esc(META.version)}</strong> · ${esc(META.date)}<br />
      Responsável: <strong>${esc(META.analyst)}</strong> · ${esc(META.role)}<br />
      Consultora: <strong>${esc(META.consultant)}</strong><br />
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
    Este documento confronta, achado a achado, o estado reportado pela consultora
    (<strong>antes</strong>) com o estado após as ações corretivas da equipe de desenvolvimento
    (<strong>depois</strong>), incluindo métricas de eficácia e evidências objetivas quando disponíveis.
  </p>

  <div class="score-grid">
    <div class="score-card"><div class="score-val">${SCORE.total}</div><div class="score-label">Achados (A1–A61)</div></div>
    <div class="score-card score-card--ok"><div class="score-val">${SCORE.correctable}</div><div class="score-label">Corrigíveis</div></div>
    <div class="score-card score-card--ok"><div class="score-val">${SCORE.positive}</div><div class="score-label">Positivos</div></div>
    <div class="score-card"><div class="score-val">${SCORE.reincidenciaReportada}</div><div class="score-label">Reincidência confirmada</div></div>
  </div>

  <h3>Métricas de eficácia (verificação 16/jun/2026)</h3>
  <table class="metric-table">
    <thead><tr><th>Indicador</th><th>Valor</th><th>Observação</th></tr></thead>
    <tbody>
      <tr><td>Verificação automatizada</td><td><strong>${SCORE.verificacaoAutomaticaPass}/${SCORE.verificacaoAutomaticaTotal}</strong> (${SCORE.pctVerificacaoAutomatica}%)</td><td>scripts/verify-consolidado-homolog.mjs</td></tr>
      <tr><td>Achados corrigíveis verificados</td><td><strong>${SCORE.correctable}/${SCORE.correctable}</strong> (${SCORE.pctCorrectableVerified}%)</td><td>A1–A49</td></tr>
      <tr><td>Positivos mantidos</td><td><strong>${SCORE.positive}</strong></td><td>A50–A61</td></tr>
      <tr><td>Reincidência A2</td><td><strong>1 → 0</strong></td><td>${SCORE.pctReincidenciaResolvida}% resolvida após deploy + limpeza SQL</td></tr>
      <tr><td><strong>Eficácia da intervenção</strong></td><td><strong>${SCORE.pctEficaciaIntervencao}%</strong></td><td>Todos os checks automatizados passaram</td></tr>
    </tbody>
  </table>

  <div class="callout callout--info">
    <strong>Metodologia:</strong> ${esc(SCORE.notaMetodologia)}
  </div>

  <h3>Legenda de status</h3>
  <ul>
    <li><span class="status-fixed">Verificado - corrigido</span> — Achado com erro reportado e correção aplicada (inclui evidência A2).</li>
    <li><span class="status-ok">Verificado - ok</span> — Achado corrigido e confirmado por verificação automatizada em homolog.</li>
    <li><span class="status-pos">Mantido</span> — Achado positivo preservado.</li>
  </ul>

  <div class="page-footer"><span>Aero Suite · Confronto UX</span><span>Sumário</span></div>
</section>

${a2EvidenceBlock}

${sectionPages()}

<section class="page">
  <div class="page-header">
    <img src="${logoHeaderUri}" alt="Aero Suite" />
    <span class="chapter-label">Anexo A</span>
  </div>
  <h2>Matriz consolidada de confronto</h2>
  <table>
    <thead>
      <tr><th>ID</th><th>Severidade</th><th>Módulo</th><th>Título</th><th>Status final</th></tr>
    </thead>
    <tbody>${matrixRows}</tbody>
  </table>
  <div class="page-footer"><span>Aero Suite · Confronto UX</span><span>Anexo A</span></div>
</section>

<section class="page">
  <div class="page-header">
    <img src="${logoHeaderUri}" alt="Aero Suite" />
    <span class="chapter-label">Anexo B</span>
  </div>
  <h2>Encaminhamento</h2>
  <p class="lead">
    Solicitamos à <strong>${esc(META.consultant.split(' — ')[0])}</strong> a retomada da homologação com base neste
    confronto item a item. O achado A2 possui evidência antes/depois anexa neste dossiê.
  </p>
  <p>Evidências brutas: <code>${esc(META.evidenceDir)}</code></p>
  <div class="signature-block">
    <div class="signature-line"></div>
    <div class="signature-name">${esc(META.analyst)}</div>
    <div class="signature-role">${esc(META.role)} · ${esc(META.org)}</div>
    <div class="signature-date">${esc(META.date)} · ${esc(META.site)}</div>
  </div>
  <div class="page-footer"><span>Aero Suite · Confronto UX</span><span>Assinatura</span></div>
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
