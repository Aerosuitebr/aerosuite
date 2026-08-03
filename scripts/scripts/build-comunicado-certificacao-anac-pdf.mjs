#!/usr/bin/env node
/**
 * Gera Comunicado Executivo — Certificação ANAC (PDF)
 * Uso: node scripts/build-comunicado-certificacao-anac-pdf.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const puppeteer = require(path.join(path.dirname(fileURLToPath(import.meta.url)), '../frontend/node_modules/puppeteer'));

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const comercialDir = path.join(root, 'docs/comercial');
const css = fs.readFileSync(path.join(root, 'docs/ux-relatorio-executivo/relatorio-styles.css'), 'utf8');
const stamp = '20260610';
const htmlOut = path.join(comercialDir, `Comunicado_Certificacao_ANAC_${stamp}.html`);
const pdfOut = path.join(comercialDir, `Comunicado_Certificacao_ANAC_${stamp}.pdf`);

const logoCover = path.join(root, 'frontend/src/assets/LOGO_LETRA_LIGHT.png');
const logoHeader = path.join(root, 'frontend/src/assets/LOGO_LETRA.png');
const logoCoverUri = 'file:///' + logoCover.replace(/\\/g, '/');
const logoHeaderUri = 'file:///' + logoHeader.replace(/\\/g, '/');

const META = {
  date: '10 de junho de 2026',
  version: 'cce2e9e',
  author: 'Wellem Lyra',
  role: 'Diretor Técnico de TI',
  org: 'Aero Suite',
};

function footer(label) {
  return `<div class="page-footer"><span>Aero Suite · Comunicado Certificação ANAC</span><span>${label}</span></div>`;
}

function pageHeader(label) {
  return `<div class="page-header"><img src="${logoHeaderUri}" alt="Aero Suite" /><span class="chapter-label">${label}</span></div>`;
}

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Comunicado Executivo — Certificação ANAC · Aero Suite</title>
  <style>${css}
.comunicado-dest { background:#f0f9ff;border:1px solid #bae6fd;border-radius:6px;padding:4mm 5mm;margin:4mm 0;font-size:9.5pt; }
.phase-table td:first-child { font-weight:700;color:#0369a1;width:22mm; }
.highlight-gold { color:#b45309;font-weight:700; }
  </style>
</head>
<body>

<section class="cover">
  <div class="cover-grid"></div>
  <div class="cover-inner">
    <img class="cover-logo" src="${logoCoverUri}" alt="Aero Suite" />
    <div class="cover-badge">Comunicado executivo · Diretoria de TI</div>
    <h1>Aplicação pronta para submissão ao processo de certificação ANAC</h1>
    <div class="cover-gold-line"></div>
    <p class="cover-sub">Informe ao time comercial e consultoria regulatória: o Aero Suite concluiu o ciclo técnico de conformidade para registros de manutenção aeronáutica (RBAC 145 / Nível 3–4).</p>
    <p class="cover-meta">
      <strong>Data:</strong> ${META.date}<br />
      <strong>Versão validada:</strong> ${META.version}<br />
      <strong>Destinatários:</strong> Comercial Bellows · Consultoria regulatória<br />
      <strong>Remetente:</strong> ${META.author} — ${META.role}
    </p>
  </div>
  <div class="cover-footer">Documento confidencial · Uso interno e parceiros autorizados</div>
</section>

<section class="page">
  ${pageHeader('Sumário executivo')}
  <h2>Veredicto técnico</h2>
  <p class="lead">
    Declaro, na qualidade de <strong>Diretor Técnico de TI</strong>, que o <strong>Aero Suite</strong> está
    <strong>totalmente pronto</strong> para iniciar o processo formal de certificação / consulta junto à ANAC,
    com dossiê técnico-regulatório completo e evidências automatizadas validadas em homologação.
  </p>
  <div class="score-grid">
    <div class="score-card score-card--ok">
      <div class="score-val">30/30</div>
      <div class="score-lbl">Matriz ATENDE</div>
    </div>
    <div class="score-card score-card--ok">
      <div class="score-val">11/11</div>
      <div class="score-lbl">Suite evidências</div>
    </div>
    <div class="score-card score-card--ok">
      <div class="score-val">100%</div>
      <div class="score-lbl">Controles P-001…P-009</div>
    </div>
    <div class="score-card score-card--ok">
      <div class="score-val">OK</div>
      <div class="score-lbl">Backup validado</div>
    </div>
  </div>
  <div class="comunicado-dest">
    <strong>Para o Comercial:</strong> podemos posicionar o produto como <em>software de gestão MRO com trilha regulatória ANAC documentada</em>,
    apto a demonstração técnica, piloto Part 145 e submissão de consulta formal — sem bloqueio de engenharia aberto.
  </div>
  ${footer('Sumário executivo')}
</section>

<section class="page">
  ${pageHeader('Capítulo 1')}
  <h2>O que foi envolvido na adequação</h2>
  <p class="lead">Consolidação do trabalho técnico-regulatório (ondas A–D + roadmap P-001 a P-009):</p>
  <table class="data-table">
    <thead><tr><th>Área</th><th>Entrega</th><th>Status</th></tr></thead>
    <tbody>
      <tr><td>Matriz de requisitos</td><td>30 requisitos RBAC 145 / IS mapeados — 100% ATENDE</td><td><span class="status-ok">✓ Fechado</span></td></tr>
      <tr><td>CRS e segregação</td><td>Emissão segregada RT/inspetor; bloqueio executor</td><td><span class="status-ok">✓ Fechado</span></td></tr>
      <tr><td>Registros encerrados</td><td>Guard OS fechada + reabertura auditada (REQ-009)</td><td><span class="status-ok">✓ Fechado</span></td></tr>
      <tr><td>Assinaturas job card</td><td>SHA-256 + integridade verificável (REQ-008)</td><td><span class="status-ok">✓ Fechado</span></td></tr>
      <tr><td>MFA</td><td>TOTP backend + enrollment UI (REQ-023)</td><td><span class="status-ok">✓ Fechado</span></td></tr>
      <tr><td>Backup / restore</td><td>Docker /app/backups, mysqldump, arquivo real ~1,4 MB</td><td><span class="status-ok">✓ Fechado</span></td></tr>
      <tr><td>Contingência</td><td>Plano + simulação hangar offline + atas</td><td><span class="status-ok">✓ Fechado</span></td></tr>
      <tr><td>SGQ / conformidade</td><td>Painel, NC, SMS, relatório ZIP, enforcement</td><td><span class="status-ok">✓ Fechado</span></td></tr>
      <tr><td>Hangar offline</td><td>PWA, fila IndexedDB, sync — E2E validado</td><td><span class="status-ok">✓ Fechado</span></td></tr>
      <tr><td>Dossiê ANAC</td><td>21 documentos + evidências + pacote ZIP homologação</td><td><span class="status-ok">✓ Fechado</span></td></tr>
    </tbody>
  </table>
  <h3>Evidências automatizadas (última execução)</h3>
  <p>Script <code>anac-conformidade-evidencias.ps1</code>: Maven unit/IT, Flyway V68, smokes RBAC/isolamento/enforcement/SGQ/hangar, atas contingência/backup, Playwright — <strong class="highlight-gold">11/11 PASS</strong>.</p>
  ${footer('Capítulo 1 · Adequação')}
</section>

<section class="page">
  ${pageHeader('Capítulo 2')}
  <h2>Passos para dar start no pedido ANAC</h2>
  <p class="lead">Roteiro recomendado para o Comercial alinhar com RT da OM piloto e consultoria (Rafaela Nottes):</p>
  <table class="data-table phase-table">
    <thead><tr><th>Fase</th><th>Ação</th><th>Responsável</th><th>Prazo sugerido</th></tr></thead>
    <tbody>
      <tr><td>1</td><td>Alinhar OM piloto Part 145 e nomear RT interlocutor</td><td>Comercial + Cliente</td><td>Semana 1</td></tr>
      <tr><td>2</td><td>Assinaturas reais: escopo regulatório, relatório validação, atas</td><td>RT + Qualidade OM</td><td>Semana 1–2</td></tr>
      <tr><td>3</td><td>Atualizar MOM/MCQ da OM referenciando Aero Suite</td><td>Qualidade OM</td><td>Semana 2</td></tr>
      <tr><td>4</td><td>Demonstração técnica (tenant demo sanitizado + OS completa)</td><td>Comercial + TI</td><td>Semana 2–3</td></tr>
      <tr><td>5</td><td>Montar pacote ZIP dossiê (<code>pacote-dossie-anac-*.zip</code>)</td><td>TI / Fornecedor</td><td>Pronto</td></tr>
      <tr><td>6</td><td>Submeter consulta formal ANAC (texto doc 18 + anexos)</td><td>RT + Consultoria</td><td>Semana 3–4</td></tr>
      <tr><td>7</td><td>Piloto 30 dias + treinamento perfis Part 145</td><td>OM + Fornecedor</td><td>Semana 4–8</td></tr>
      <tr><td>8</td><td>Resposta a eventuais complementações ANAC</td><td>RT + TI</td><td>Conforme ANAC</td></tr>
    </tbody>
  </table>
  <h3>Materiais já disponíveis no repositório</h3>
  <ul class="checklist">
    <li><code>docs/anac-conformidade/</code> — dossiê completo (matriz, planos, manuais)</li>
    <li><code>evidencias/ultima-execucao.json</code> — 11/11 PASS</li>
    <li><code>evidencias/pacote-dossie-anac-*.zip</code> — pacote submissão</li>
    <li><code>21-pendencias-acoes-certificacao.md</code> — guia de fechamento organizacional</li>
  </ul>
  ${footer('Capítulo 2 · Roteiro')}
</section>

<section class="page">
  ${pageHeader('Capítulo 3')}
  <h2>Mensagem ao Comercial</h2>
  <p class="lead">
    O salto de qualidade não é apenas marketing: é <strong>engenharia comprovada</strong>. O Aero Suite passou por
    matriz regulatória, testes automatizados, backup real, segregação CRS, auditoria e dossiê ANAC — o mesmo rigor
    exigido de um sistema que a OM pretenda usar como registro oficial de manutenção.
  </p>
  <h3>Argumentos de venda autorizados</h3>
  <ul class="checklist">
    <li>Conformidade técnica documentada (30/30 requisitos ATENDE)</li>
    <li>Demonstração auditável com scripts reproduzíveis</li>
    <li>Hangar offline + sync para chão de oficina</li>
    <li>CRS em PDF com segregação Part 145</li>
    <li>Trilha pronta para consulta ANAC — diferencial competitivo em MRO Brasil</li>
  </ul>
  <h3>O que ainda depende da OM (não bloqueia start)</h3>
  <ul class="checklist">
    <li>Assinaturas físicas/ICP do RT e Qualidade da organização cliente</li>
    <li>MOM/MCQ específicos da OM</li>
    <li>Restore de backup no MySQL de produção da OM (VAL-19 operacional)</li>
  </ul>
  <div class="signature-block">
    <p class="lead" style="margin-bottom:6mm">
      Declaro, para os devidos fins, que as informações deste comunicado refletem o estado técnico verificado
      do Aero Suite na data indicada, com base nas evidências do dossiê ANAC e na suite automatizada
      <strong>anac-conformidade-evidencias.ps1</strong> (11/11 PASS, backup com arquivo validado).
    </p>
    <div class="signature-line"></div>
    <div class="signature-name">${META.author}</div>
    <div class="signature-role">${META.role}</div>
    <div class="signature-role">${META.org}</div>
    <div class="signature-date">${META.date} · wellemlyra@gmail.com · aerosuite.com.br</div>
  </div>
  ${footer('Assinatura · Wellem Lyra')}
</section>

</body>
</html>`;

fs.mkdirSync(comercialDir, { recursive: true });
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
