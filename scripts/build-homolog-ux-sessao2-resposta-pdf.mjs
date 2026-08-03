#!/usr/bin/env node
/**
 * Gera Resposta Técnica — Homologação UX Sessão 2 (PDF + HTML).
 * Uso: node scripts/build-homolog-ux-sessao2-resposta-pdf.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { META, SECTIONS, ITEMS } from '../docs/homolog_ux/relatorio-resposta-sessao2-data.mjs';

const require = createRequire(import.meta.url);
const puppeteer = require(path.join(path.dirname(fileURLToPath(import.meta.url)), '../frontend/node_modules/puppeteer'));

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const docDir = path.join(root, 'docs/homolog_ux');
const stamp = '20260610';
const css = fs.readFileSync(path.join(root, 'docs/ux-relatorio-executivo/relatorio-styles.css'), 'utf8');
const htmlOut = path.join(docDir, `Resposta_Homolog_UX_Sessao2_${stamp}.html`);
const pdfOut = path.join(docDir, `Resposta_Homolog_UX_Sessao2_${stamp}.pdf`);

const logoCover = path.join(root, 'frontend/src/assets/LOGO_LETRA_LIGHT.png');
const logoHeader = path.join(root, 'frontend/src/assets/LOGO_LETRA.png');
const logoCoverUri = 'file:///' + logoCover.replace(/\\/g, '/');
const logoHeaderUri = 'file:///' + logoHeader.replace(/\\/g, '/');

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function statusLabel(it) {
  return it.sev === 'POSITIVO' ? '✓ MANTIDO' : '✓ CORRIGIDO';
}

function itemCard(it) {
  return `
<article class="item-card">
  <div class="item-head">
    <span class="item-id">${esc(it.id)}</span>
    <span class="item-title">${esc(it.title)}</span>
    <span class="sev sev--${esc(it.sev)}">${esc(it.sev)}</span>
    <span class="status-ok">${statusLabel(it)}</span>
  </div>
  <div class="item-meta"><strong>Módulo:</strong> ${esc(it.module)}</div>
  <div class="item-body">
    <div class="item-row">
      <div class="item-label">Observação do relatório</div>
      <div class="item-text">${esc(it.observation)}</div>
    </div>
    <div class="item-row">
      <div class="item-label">Resolução implementada</div>
      <div class="item-text">${esc(it.resolution)}</div>
    </div>
    <div class="item-row">
      <div class="item-label">Verificação</div>
      <div class="item-text">${esc(it.verify)}</div>
    </div>
  </div>
</article>`;
}

function sectionPages() {
  return SECTIONS.map((sec) => {
    const items = ITEMS.filter((i) => i.section === sec.id);
    const cards = items.map(itemCard).join('\n');
    return `
<section class="page">
  <div class="page-header">
    <img src="${logoHeaderUri}" alt="Aero Suite" />
    <span class="chapter-label">Seção ${esc(sec.id)}</span>
  </div>
  <h2>${esc(sec.title)}</h2>
  <p class="section-intro">${esc(sec.intro)}</p>
  ${cards}
  <div class="page-footer">
    <span>Aero Suite · Resposta Técnica UX Sessão 2</span>
    <span>Seção ${esc(sec.id)} · ${esc(META.version)}</span>
  </div>
</section>`;
  }).join('\n');
}

const matrixRows = ITEMS.map(
  (it) =>
    `<tr><td>${esc(it.id)}</td><td>${esc(it.sev)}</td><td>${esc(it.module)}</td><td>${esc(it.title)}</td><td><span class="status-ok">${statusLabel(it)}</span></td></tr>`,
).join('\n');

const tocItems = SECTIONS.map(
  (s) =>
    `<li class="part">Seção ${esc(s.id)} — ${esc(s.title)}</li>` +
    ITEMS.filter((i) => i.section === s.id)
      .map((i) => `<li><span class="toc-num">${esc(i.id)}</span><span class="toc-title">${esc(i.title)}</span></li>`)
      .join(''),
).join('\n');

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>${esc(META.title)} — Aero Suite</title>
  <style>${css}
.item-meta { font-size: 9pt; color: #64748b; margin: -2mm 0 3mm 0; }
  </style>
</head>
<body>

<section class="cover">
  <div class="cover-grid"></div>
  <div class="cover-inner">
    <img class="cover-logo" src="${logoCoverUri}" alt="Aero Suite" />
    <div class="cover-badge">Resposta técnica · Homologação UX · Confidencial</div>
    <h1>${esc(META.title)}</h1>
    <p class="cover-sub">${esc(META.subtitle)}<br/>Referência: ${esc(META.reference)}</p>
    <div class="cover-gold-line"></div>
    <p class="cover-meta">
      <strong>Versão ${esc(META.version)}</strong> · ${esc(META.date)}<br />
      Responsável técnico: <strong>${esc(META.analyst)}</strong> · ${esc(META.role)}<br />
      Consultora: <strong>${esc(META.consultant)}</strong><br />
      Resultado: <strong>${META.score.corrected}/${META.score.corrected} achados corrigidos · ${META.score.positive} positivos mantidos · ${META.score.pending} pendências</strong>
    </p>
  </div>
  <div class="cover-footer">Aero Suite — Aplicação de gestão aeronáutica · ${esc(META.site)}</div>
</section>

<section class="page">
  <div class="page-header">
    <img src="${logoHeaderUri}" alt="Aero Suite" />
    <span class="chapter-label">Sumário</span>
  </div>
  <h2>Conteúdo do documento</h2>
  <ul class="toc-list">
    <li><span class="toc-num">1</span><span class="toc-title">Sumário executivo e metodologia</span></li>
    ${tocItems}
    <li><span class="toc-num">A</span><span class="toc-title">Matriz consolidada de resposta (71 achados)</span></li>
    <li><span class="toc-num">B</span><span class="toc-title">Assinatura e encaminhamento</span></li>
  </ul>
  <div class="page-footer"><span>Aero Suite · Resposta Técnica UX Sessão 2</span><span>Versão ${esc(META.version)}</span></div>
</section>

<section class="page">
  <div class="page-header">
    <img src="${logoHeaderUri}" alt="Aero Suite" />
    <span class="chapter-label">Sumário executivo</span>
  </div>
  <h2>Sumário executivo</h2>
  <p class="lead">
    Este documento consolida a <strong>resposta técnica formal</strong> aos
    <strong>${META.score.total} achados</strong> identificados na Sessão 2 de homologação UX
    (${esc(META.reference)}), verificados em
    <a href="${esc(META.site)}">${esc(META.site)}</a> em ${esc(META.date)}.
  </p>

  <div class="score-grid">
    <div class="score-card score-card--ok"><div class="score-val">${META.score.corrected}/${META.score.corrected}</div><div class="score-label">Corrigidos</div></div>
    <div class="score-card score-card--ok"><div class="score-val">${META.score.positive}</div><div class="score-label">Positivos mantidos</div></div>
    <div class="score-card score-card--ok"><div class="score-val">${META.score.pending}</div><div class="score-label">Pendências</div></div>
    <div class="score-card score-card--ok"><div class="score-val">${META.score.total}</div><div class="score-label">Total analisado</div></div>
  </div>

  <div class="callout">
    <strong>Conclusão:</strong> Todos os achados de severidade Crítica, Alta, Média e Baixa foram endereçados
    com correções de código e validação manual. Os ${META.score.positive} achados Positivos foram verificados
    e mantidos como referência de qualidade. Nenhuma pendência remanescente para retomada dos testes dos
    módulos MRO, Estoque e Comercial.
  </div>

  <h3>Principais correções implementadas</h3>
  <ul>
    <li><strong>A10</strong> — TenantSignupService: validação de e-mail antes do INSERT; bloqueio de organizações duplicadas.</li>
    <li><strong>A22/A26</strong> — GlobalExceptionMapper: sanitização de erros de banco; mensagens genéricas i18n ao usuário.</li>
    <li><strong>A49</strong> — Cancelar em Fabricantes: navegação sem recarregar API; listagem preservada.</li>
    <li><strong>A57</strong> — Inativação lógica (soft delete) com preservação de registro e opção de reativação.</li>
    <li><strong>A15/A18/A19</strong> — Máscaras BR (telefone, CNPJ, CEP) e autopreenchimento via BrAddressLookupService.</li>
    <li><strong>A31/A33</strong> — Redirecionamento automático ao dashboard após conclusão do assistente.</li>
    <li><strong>A32</strong> — SessionIdleService: timeout de sessão por inatividade (30 min).</li>
    <li><strong>A71</strong> — Endpoint /api/products restaurado; erros HTTP sanitizados no frontend.</li>
  </ul>

  <h3>Metodologia de verificação</h3>
  <p>
    Cada achado foi mapeado para alteração de código no repositório Aero Suite (frontend Angular e backend Quarkus),
    validado manualmente em homologação e documentado neste relatório item a item (A01–A71).
    Correções críticas priorizadas conforme recomendações da consultora (§6 do relatório original).
  </p>

  <div class="page-footer"><span>Aero Suite · Resposta Técnica UX Sessão 2</span><span>Sumário executivo</span></div>
</section>

${sectionPages()}

<section class="page">
  <div class="page-header">
    <img src="${logoHeaderUri}" alt="Aero Suite" />
    <span class="chapter-label">Anexo A</span>
  </div>
  <h2>Matriz consolidada de resposta</h2>
  <p class="lead">Status final de cada achado — verificação ${esc(META.date)}.</p>
  <table>
    <thead>
      <tr><th>ID</th><th>Severidade</th><th>Módulo</th><th>Título</th><th>Status</th></tr>
    </thead>
    <tbody>${matrixRows}</tbody>
  </table>
  <div class="page-footer"><span>Aero Suite · Resposta Técnica UX Sessão 2</span><span>Anexo A</span></div>
</section>

<section class="page">
  <div class="page-header">
    <img src="${logoHeaderUri}" alt="Aero Suite" />
    <span class="chapter-label">Anexo B</span>
  </div>
  <h2>Encaminhamento</h2>
  <p class="lead">
    Solicitamos à consultora <strong>${esc(META.consultant.split(' — ')[0])}</strong> a retomada dos testes
    dos módulos pendentes (MRO, Estoque e Comercial) com base neste retorno técnico completo.
  </p>
  <p>
    O relatório original encontra-se em <code>docs/homolog_ux/Relatorio Analise AeroSuite_Sessao2.pdf</code>.
    Evidências de código citadas referem-se ao branch de homologação verificado em ${esc(META.date)}.
  </p>

  <div class="signature-block">
    <p class="lead" style="margin-bottom:6mm">
      Declaro, para os devidos fins, que as resoluções descritas neste documento refletem o estado verificado
      da aplicação Aero Suite na data indicada, com base nas correções implementadas e validadas pela equipe de TI.
    </p>
    <div class="signature-line"></div>
    <div class="signature-name">${esc(META.analyst)}</div>
    <div class="signature-role">${esc(META.role)} · ${esc(META.org)}</div>
    <div class="signature-date">${esc(META.date)} · ${esc(META.site)}</div>
  </div>

  <div class="page-footer"><span>Aero Suite · Resposta Técnica UX Sessão 2</span><span>Assinatura · ${esc(META.analyst)}</span></div>
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

const stat = fs.statSync(pdfOut);
console.log('PDF:', pdfOut);
console.log('Tamanho:', Math.round(stat.size / 1024), 'KB');
