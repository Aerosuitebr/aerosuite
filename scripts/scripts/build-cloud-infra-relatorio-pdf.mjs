#!/usr/bin/env node
/**
 * Relatório premium — Infraestrutura Cloud Aero Suite (PDF + HTML).
 * Uso: node scripts/build-cloud-infra-relatorio-pdf.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import {
  META,
  CURRENT_STATE,
  URGENCY,
  SERVICES,
  PROVIDERS,
  TOP3,
  COST_CHART,
  SCORE_CHART,
  ROADMAP,
  SECTIONS,
  ARCHITECTURE_DIAGRAM,
  COMMERCIAL_MESSAGE,
} from '../docs/infraestrutura/cloud-infra-relatorio-data.mjs';

const require = createRequire(import.meta.url);
const puppeteer = require(path.join(path.dirname(fileURLToPath(import.meta.url)), '../frontend/node_modules/puppeteer'));

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const docDir = path.join(root, 'docs/infraestrutura');
const stamp = '20260618';
const css = fs.readFileSync(path.join(root, 'docs/ux-relatorio-executivo/relatorio-styles.css'), 'utf8');
const htmlOut = path.join(docDir, `Relatorio_Infraestrutura_Cloud_${stamp}.html`);
const pdfOut = path.join(docDir, `Relatorio_Infraestrutura_Cloud_${stamp}.pdf`);

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

function barChart(items, unit = '') {
  return `<div class="bar-chart">${items
    .map(
      (it) => `
    <div class="bar-row">
      <div class="bar-label">${esc(it.label)}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.round((it.value / it.max) * 100)}%"></div></div>
      <div class="bar-val">${esc(String(it.value))}${unit}</div>
    </div>`,
    )
    .join('')}</div>`;
}

function section01() {
  return `
<h3>Repositório e ambientes</h3>
<table class="metric-table">
  <tbody>
    <tr><td><strong>Desenvolvimento local</strong></td><td>${esc(CURRENT_STATE.repoLocal)}</td></tr>
    <tr><td><strong>Repositório remoto</strong></td><td>${esc(CURRENT_STATE.repoRemote)}</td></tr>
    <tr><td><strong>Branches</strong></td><td>Produção: <strong>${esc(CURRENT_STATE.branches.prod)}</strong> · Desenvolvimento: <strong>${esc(CURRENT_STATE.branches.dev)}</strong></td></tr>
    <tr><td><strong>CI/CD</strong></td><td>${esc(CURRENT_STATE.ci)}</td></tr>
    <tr><td><strong>Produção atual</strong></td><td>${esc(CURRENT_STATE.prodUrl)}</td></tr>
    <tr><td><strong>Stack</strong></td><td>${esc(CURRENT_STATE.stack)}</td></tr>
    <tr><td><strong>Decisão registrada</strong></td><td>${esc(CURRENT_STATE.decisionDoc)}</td></tr>
  </tbody>
</table>

<h3>Fluxo atual (código → cliente)</h3>
<pre class="arch-diagram">${esc(ARCHITECTURE_DIAGRAM)}</pre>

<div class="callout callout-warn">
  <strong>Lacuna operacional:</strong> o repositório remoto e o CI estão maduros, porém a camada de hospedagem dedicada
  ainda precisa ser provisionada e isolada do ambiente de desenvolvimento — condição necessária para SLA comercial.
</div>`;
}

function section02() {
  const rows = SERVICES.map(
    (s) =>
      `<tr>
        <td><strong>${esc(s.name)}</strong></td>
        <td><span class="sev sev--${s.importance === 'Crítica' ? 'CRITICO' : s.importance === 'Alta' ? 'ALTO' : 'MEDIO'}">${esc(s.importance)}</span></td>
        <td>${esc(s.why)}</td>
        <td>${esc(s.spec)}</td>
      </tr>`,
  ).join('');
  return `
<table>
  <thead><tr><th>Serviço</th><th>Criticidade</th><th>Por que importa</th><th>Especificação piloto</th></tr></thead>
  <tbody>${rows}</tbody>
</table>`;
}

function section03() {
  const rows = PROVIDERS.map(
    (p) =>
      `<tr>
        <td>${p.rank}</td>
        <td><strong>${esc(p.name)}</strong><br/><span class="muted">${esc(p.model)}</span></td>
        <td>${esc(p.monthlyBrl)}</td>
        <td>${p.totalScore.toFixed(1)}</td>
        <td>${p.scoreCost}</td>
        <td>${p.scoreScale}</td>
      </tr>`,
  ).join('');
  return `
<p class="lead">Estimativa mensal em reais (câmbio ~R$ 5,50/USD; piloto 1–15 organizações, sem tráfego massivo).</p>
<table class="compare-table">
  <thead>
    <tr><th>#</th><th>Provedor / modelo</th><th>Custo/mês (R$)</th><th>Score total</th><th>Custo-ben.</th><th>Escala</th></tr>
  </thead>
  <tbody>${rows}</tbody>
</table>

<h3>Comparativo de custo mensal estimado (R$)</h3>
${barChart(COST_CHART, '')}

<h3>Score composto — Top 3 (0–10)</h3>
${barChart(SCORE_CHART, '')}
<p class="muted-note">Peso: custo-benefício 40% · operação 25% · escala 20% · conformidade 15%</p>`;
}

function section04() {
  return TOP3.map(
    (p) => `
<article class="top-card top-card--${p.rank}">
  <div class="top-card__rank">${p.rank}º</div>
  <h3>${esc(p.name)}</h3>
  <p class="top-card__model">${esc(p.model)} · ${esc(p.region)}</p>
  <div class="top-card__cost"><strong>${esc(p.monthlyBrl)}</strong> / mês · ~${esc(p.monthlyUsd)} USD</div>
  <p class="top-card__verdict">${esc(p.verdict)}</p>
  <div class="pros-cons">
    <div><strong>Vantagens</strong><ul>${p.pros.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
    <div><strong>Limitações</strong><ul>${p.cons.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
  </div>
</article>`,
  ).join('');
}

function section05() {
  const phases = ROADMAP.map(
    (r) => `
<div class="roadmap-phase">
  <div class="roadmap-head"><span class="roadmap-phase-name">${esc(r.phase)}</span><span class="sev sev--${r.urgency === 'CRÍTICA' ? 'CRITICO' : r.urgency === 'ALTA' ? 'ALTO' : 'MEDIO'}">${esc(r.urgency)}</span></div>
  <ul>${r.actions.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>
</div>`,
  ).join('');

  return `
<div class="callout callout-urgent">
  <strong>${esc(URGENCY.headline)}</strong>
  <ul>${URGENCY.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
</div>
${phases}
<div class="callout callout-info commercial-box">
  <strong>Mensagem à área comercial</strong><br/>${esc(COMMERCIAL_MESSAGE)}
</div>`;
}

function sectionBody(id) {
  if (id === '01') return section01();
  if (id === '02') return section02();
  if (id === '03') return section03();
  if (id === '04') return section04();
  if (id === '05') return section05();
  return '';
}

function sectionPages() {
  return SECTIONS.map((sec) => `
<section class="page">
  <div class="page-header">
    <img src="${logoHeaderUri}" alt="Aero Suite" />
    <span class="chapter-label">Capítulo ${esc(sec.id)}</span>
  </div>
  <h2>${esc(sec.title)}</h2>
  <p class="section-intro">${esc(sec.intro)}</p>
  ${sectionBody(sec.id)}
  <div class="page-footer">
    <span>Aero Suite · Infraestrutura Cloud</span>
    <span>Cap. ${esc(sec.id)}</span>
  </div>
</section>`).join('\n');
}

const extraCss = `
.muted { font-size: 8pt; color: #64748b; }
.muted-note { font-size: 8pt; color: #94a3b8; margin-top: 2mm; }
.arch-diagram { background: #0f172a; color: #7dd3fc; padding: 4mm 5mm; border-radius: 6px; font-size: 7.5pt; line-height: 1.35; white-space: pre; overflow-x: auto; }
.callout { border-radius: 8px; padding: 4mm 5mm; margin: 4mm 0 6mm 0; font-size: 9pt; line-height: 1.55; }
.callout-warn { background: #fffbeb; border-left: 4px solid #f59e0b; color: #92400e; }
.callout-urgent { background: #fef2f2; border-left: 4px solid #dc2626; color: #991b1b; }
.callout-info { background: #eff6ff; border-left: 4px solid #3b82f6; color: #1e40af; }
.commercial-box { margin-top: 6mm; }
.bar-chart { margin: 4mm 0 6mm 0; }
.bar-row { display: grid; grid-template-columns: 22mm 1fr 14mm; gap: 2mm; align-items: center; margin-bottom: 2.5mm; }
.bar-label { font-size: 8.5pt; font-weight: 600; color: #334155; }
.bar-track { height: 5mm; background: #e2e8f0; border-radius: 3px; overflow: hidden; }
.bar-fill { height: 100%; background: linear-gradient(90deg, #0ea5e9, #0369a1); border-radius: 3px; }
.bar-val { font-size: 8pt; font-weight: 700; color: #0f172a; text-align: right; }
.compare-table th, .compare-table td { font-size: 8.5pt; vertical-align: top; padding: 2mm 2.5mm; }
.top-card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 4mm 5mm; margin-bottom: 5mm; position: relative; page-break-inside: avoid; }
.top-card--1 { border-color: #c9a227; background: linear-gradient(135deg, #fffbeb 0%, #fff 40%); }
.top-card--2 { border-color: #94a3b8; background: #f8fafc; }
.top-card--3 { border-color: #cd7f32; background: #fff7ed; }
.top-card__rank { position: absolute; top: 3mm; right: 4mm; font-size: 18pt; font-weight: 800; color: #cbd5e1; }
.top-card__model { font-size: 8.5pt; color: #64748b; margin: 0 0 2mm 0; }
.top-card__cost { font-size: 10pt; margin-bottom: 2mm; color: #0f172a; }
.top-card__verdict { font-size: 9pt; font-weight: 700; color: #15803d; margin-bottom: 3mm; }
.pros-cons { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; font-size: 8.5pt; }
.pros-cons ul { margin: 1mm 0 0 4mm; padding: 0; color: #475569; }
.roadmap-phase { margin-bottom: 4mm; padding-bottom: 3mm; border-bottom: 1px solid #e2e8f0; }
.roadmap-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2mm; }
.roadmap-phase-name { font-weight: 700; font-size: 9.5pt; color: #0f172a; }
.roadmap-phase ul { margin: 0 0 0 5mm; font-size: 9pt; color: #475569; line-height: 1.5; }
.signature-block { margin-top: 12mm; padding-top: 6mm; border-top: 2px solid #c9a227; }
.signature-name { font-size: 12pt; font-weight: 700; color: #0f172a; margin: 0; }
.signature-role { font-size: 10pt; color: #475569; margin: 1mm 0 0 0; }
.signature-email { font-size: 9pt; color: #2563eb; }
.metric-table td { font-size: 9pt; vertical-align: top; }
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
    <div class="cover-badge">Estratégia · Infraestrutura · ${esc(META.classification)}</div>
    <h1>${esc(META.title)}</h1>
    <p class="cover-sub">${esc(META.subtitle)}<br/>Destinatário: <strong>${esc(META.audience)}</strong></p>
    <div class="cover-gold-line"></div>
    <p class="cover-meta">
      <strong>Versão ${esc(META.version)}</strong> · ${esc(META.date)}<br />
      Ambiente de referência: <strong>${esc(META.site)}</strong>
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
    O Aero Suite atingiu maturidade funcional e de homologação UX suficiente para comercialização ao segmento MRO Part 145.
    O próximo gargalo não é o código — é a <strong>infraestrutura cloud dedicada</strong> que sustente disponibilidade,
    segurança multi-tenant e backups auditáveis. Este relatório apresenta o diagnóstico atual, os serviços indispensáveis,
    a comparação de seis provedores e as <strong>três melhores opções</strong> por custo-benefício.
  </p>

  <div class="score-grid">
    <div class="score-card score-card--ok"><div class="score-val">#1</div><div class="score-label">Hetzner + Cloudflare</div></div>
    <div class="score-card"><div class="score-val">R$ 120+</div><div class="score-label">Custo piloto/mês</div></div>
    <div class="score-card score-card--ok"><div class="score-val">8,9</div><div class="score-label">Score Hetzner</div></div>
    <div class="score-card"><div class="score-val">0–15d</div><div class="score-label">Prazo crítico</div></div>
  </div>

  <div class="callout callout-urgent">
    <strong>Urgência:</strong> cada semana sem VPS de produção dedicado expõe a operação a risco de indisponibilidade,
    mistura dev/prod e limita o SLA que a área comercial pode oferecer a clientes seletos.
  </div>

  <h3>Recomendação em uma linha</h3>
  <p class="lead">
    <strong>Provisionar imediatamente Hetzner CPX31 + Cloudflare Tunnel + backups automatizados</strong>,
    conforme decisão D1 já documentada internamente, com staging em paralelo e evolução para MySQL gerido conforme crescimento.
  </p>

  <div class="page-footer"><span>Aero Suite · Infraestrutura</span><span>Sumário</span></div>
</section>

${sectionPages()}

<section class="page">
  <div class="page-header">
    <img src="${logoHeaderUri}" alt="Aero Suite" />
    <span class="chapter-label">Encerramento</span>
  </div>
  <h2>Conclusão e próximos passos</h2>
  <p class="lead">
    A análise conclui que o caminho de menor risco e maior retorno para o estágio atual do Aero Suite é a
    <strong>opção 1 (Hetzner)</strong>, com reserva estratégica em DigitalOcean (opção 2) e AWS (opção 3) conforme
    volume contratual e exigências enterprise. A área comercial pode comunicar aos prospects que a plataforma opera
    sobre stack Docker madura, CI verde e arquitetura preparada para escala — faltando apenas a formalização do
    ambiente de produção dedicado, ação com prazo imediato.
  </p>

  <table class="metric-table">
    <thead><tr><th>Ação</th><th>Responsável</th><th>Prazo</th></tr></thead>
    <tbody>
      <tr><td>Aprovar budget infra piloto (~R$ 150/mês)</td><td>Diretoria / Comercial</td><td>Imediato</td></tr>
      <tr><td>Provisionar VPS Hetzner CPX31</td><td>TI (Wellem Lyra)</td><td>0–7 dias</td></tr>
      <tr><td>Deploy produção + Tunnel Cloudflare</td><td>TI</td><td>7–15 dias</td></tr>
      <tr><td>Staging + teste de restore</td><td>TI + Qualidade</td><td>15–30 dias</td></tr>
      <tr><td>Comunicar SLA comercial aos clientes piloto</td><td>Comercial</td><td>Após go-live infra</td></tr>
    </tbody>
  </table>

  <div class="signature-block">
    <p class="signature-name">${esc(META.signer.name)}</p>
    <p class="signature-role">${esc(META.signer.role)} · ${esc(META.signer.org)}</p>
    <p class="signature-email">${esc(META.signer.email)}</p>
    <p class="muted" style="margin-top:4mm;">Documento elaborado em ${esc(META.date)} · Versão ${esc(META.version)} · ${esc(META.classification)}</p>
  </div>

  <div class="page-footer"><span>Aero Suite · Infraestrutura</span><span>Assinatura</span></div>
</section>

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
