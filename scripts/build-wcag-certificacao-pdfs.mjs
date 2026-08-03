#!/usr/bin/env node
/**
 * Gera PDFs executivos WCAG 2.2 AA:
 *   1) Dossiê técnico para a equipe (Comercial, Marketing, Qualidade, TI)
 *   2) Roteiro 100% passo a passo (ex-WCAG-100-PASSO-A-PASSO.md)
 *
 * Uso: node scripts/build-wcag-certificacao-pdfs.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { spawnSync } from 'child_process';

const require = createRequire(import.meta.url);
const puppeteer = require(path.join(path.dirname(fileURLToPath(import.meta.url)), '../frontend/node_modules/puppeteer'));

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const comercialDir = path.join(root, 'docs/comercial');
const css = fs.readFileSync(path.join(root, 'docs/ux-relatorio-executivo/relatorio-styles.css'), 'utf8');
const stamp = '20260610';

const logoCover = path.join(root, 'frontend/src/assets/LOGO_LETRA_LIGHT.png');
const logoHeader = path.join(root, 'frontend/src/assets/LOGO_LETRA.png');
const logoCoverUri = 'file:///' + logoCover.replace(/\\/g, '/');
const logoHeaderUri = 'file:///' + logoHeader.replace(/\\/g, '/');

let commit = '586cb45';
try {
  const r = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: root, encoding: 'utf8' });
  if (r.status === 0) commit = r.stdout.trim();
} catch {
  /* ignore */
}

const META = {
  date: '10 de junho de 2026',
  commit,
  author: 'Wellem Lyra',
  role: 'Diretor de TI',
  org: 'Aero Suite',
};

function footer(label) {
  return `<div class="page-footer"><span>Aero Suite · Certificação WCAG 2.2 AA</span><span>${label}</span></div>`;
}

function pageHeader(label) {
  return `<div class="page-header"><img src="${logoHeaderUri}" alt="Aero Suite" /><span class="chapter-label">${label}</span></div>`;
}

function wrapPdf(title, extraCss, body) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <style>${css}${extraCss}</style>
</head>
<body>${body}</body>
</html>`;
}

const extraCss = `
.wcag-dest { background:#f0f9ff;border:1px solid #bae6fd;border-radius:6px;padding:4mm 5mm;margin:4mm 0;font-size:9.5pt; }
.wcag-gold { color:#b45309;font-weight:700; }
.role-table td:first-child { font-weight:700;color:#0369a1;width:38mm;vertical-align:top; }
.checklist td:last-child { text-align:center;width:18mm; }
`;

const dossieBody = `
<section class="cover">
  <div class="cover-grid"></div>
  <div class="cover-inner">
    <img class="cover-logo" src="${logoCoverUri}" alt="Aero Suite" />
    <div class="cover-badge">Dossiê técnico · Diretoria de TI</div>
    <h1>Certificação WCAG 2.2 AA — acessibilidade digital de classe enterprise</h1>
    <div class="cover-gold-line"></div>
    <p class="cover-sub">Documento para alinhar Comercial, Marketing, Qualidade e TI sobre o que é a certificação WCAG, o valor para o Aero Suite e como nos prepararmos para a auditoria externa e o VPAT comercial.</p>
    <p class="cover-meta">
      <strong>Data:</strong> ${META.date}<br />
      <strong>Baseline técnica:</strong> commit ${META.commit}<br />
      <strong>Destinatários:</strong> Comercial · Marketing · Qualidade · TI<br />
      <strong>Remetente:</strong> ${META.author} — ${META.role}
    </p>
  </div>
  <div class="cover-footer">Documento confidencial · Uso interno Aero Suite</div>
</section>

<section class="page">
  ${pageHeader('Sumário executivo')}
  <h2>O passo rumo à excelência</h2>
  <p class="lead">
    O Aero Suite concluiu a <strong>trilha de código 100%</strong> para acessibilidade WCAG 2.2 nível AA:
    <strong>52 rotas</strong> validadas automaticamente, <strong>12 fluxos críticos</strong> (F1–F12) e gate contínuo no CI.
    Este é o mesmo patamar que empresas SaaS enterprise exibem em procurement internacional (VPAT / Section 508).
  </p>
  <div class="score-grid">
    <div class="score-card score-card--ok">
      <div class="score-val">52/52</div>
      <div class="score-lbl">Rotas axe OK</div>
    </div>
    <div class="score-card score-card--ok">
      <div class="score-val">12/12</div>
      <div class="score-lbl">Fluxos F1–F12</div>
    </div>
    <div class="score-card score-card--ok">
      <div class="score-val">100%</div>
      <div class="score-lbl">Trilha código</div>
    </div>
    <div class="score-card score-card--info">
      <div class="score-val">4</div>
      <div class="score-lbl">Idiomas UI</div>
    </div>
  </div>
  <div class="wcag-dest">
    <strong>Mensagem para o mercado:</strong> não se trata apenas de “cumprir lei” — é <em>diferencial competitivo</em>
    em licitações, contratos enterprise, parcerias internacionais e posicionamento premium frente a ERPs genéricos.
  </div>
  ${footer('Sumário executivo')}
</section>

<section class="page">
  ${pageHeader('Capítulo 1')}
  <h2>O que é a certificação WCAG?</h2>
  <p class="lead">
    <strong>WCAG</strong> (Web Content Accessibility Guidelines) é o padrão internacional da W3C para acessibilidade digital.
    O nível <strong>AA</strong> (nossa meta) é o exigido por legislações como a LBI (Brasil), ADA (EUA) e directivas europeias
    para software utilizado por pessoas com deficiência visual, motora, auditiva ou cognitiva.
  </p>
  <table class="data-table">
    <thead><tr><th>Conceito</th><th>Explicação</th></tr></thead>
    <tbody>
      <tr><td>WCAG 2.2 AA</td><td>Conjunto de critérios testáveis (contraste, teclado, leitor de tela, formulários, erros i18n).</td></tr>
      <tr><td>VPAT 2.5</td><td>Voluntary Product Accessibility Template — documento comercial que resume conformidade para compradores enterprise.</td></tr>
      <tr><td>Auditoria externa</td><td>Avaliação independente por especialista CPACC/WAS; emite relatório com severidades (blocker/major/minor).</td></tr>
      <tr><td>Declaração de acessibilidade</td><td>Página pública no site informando o compromisso e canal de feedback (pós-certificação).</td></tr>
    </tbody>
  </table>
  <h3>Os quatro princípios WCAG</h3>
  <ul class="bullet-list">
    <li><strong>Perceptível</strong> — conteúdo visível ou alternativo (texto, contraste, não depender só de cor).</li>
    <li><strong>Operável</strong> — navegação completa por teclado; sem armadilhas de foco em modais.</li>
    <li><strong>Compreensível</strong> — labels, erros em texto, interface em 4 idiomas (pt-BR, en-US, es-ES, fr-FR).</li>
    <li><strong>Robusto</strong> — componentes PrimeNG/Angular expõem roles ARIA corretos para leitores de tela.</li>
  </ul>
  ${footer('Capítulo 1')}
</section>

<section class="page">
  ${pageHeader('Capítulo 2')}
  <h2>O que a certificação agrega ao Aero Suite</h2>
  <table class="data-table role-table">
    <thead><tr><th>Área</th><th>Valor agregado</th></tr></thead>
    <tbody>
      <tr><td>Comercial</td><td>VPAT anexável a propostas; redução de objeções em RFPs enterprise; narrativa “software acessível e auditável” alinhada à ANAC/SGQ.</td></tr>
      <tr><td>Marketing</td><td>Claim verificável de acessibilidade AA; material para site, LinkedIn e demos; diferenciação vs. concorrentes sem trilha documentada.</td></tr>
      <tr><td>Qualidade</td><td>Processo mensurável (gate CI + checklist); evidências JSON; integração com cultura SGQ e auditorias de cliente.</td></tr>
      <tr><td>TI / Produto</td><td>Regressão automática em PR; menos retrabalho pós-venda; conformidade com boas práticas Angular 18 + i18n obrigatório.</td></tr>
      <tr><td>Cliente final</td><td>Mecânicos e gestores podem usar teclado e NVDA; portal externo acessível; trial e login públicos inclusivos.</td></tr>
    </tbody>
  </table>
  <div class="wcag-dest">
    <strong>Escopo do produto:</strong> portal interno + portal externo cliente · 52 rotas · fluxos OS, estoque, comercial, conformidade SGQ, hangar e cadastro trial.
  </div>
  ${footer('Capítulo 2')}
</section>

<section class="page">
  ${pageHeader('Capítulo 3')}
  <h2>Estado actual (junho/2026)</h2>
  <table class="data-table">
    <thead><tr><th>Trilha</th><th>Meta</th><th>Estado</th></tr></thead>
    <tbody>
      <tr><td>A — Código</td><td>100% automatizável</td><td><span class="status-ok">✓ Concluída</span> — <code>npm run a11y:gate</code></td></tr>
      <tr><td>B — Humano</td><td>NVDA + teclado</td><td><span class="status-warn">⏳ Próxima</span> — sessão ~60–90 min</td></tr>
      <tr><td>C — Externa</td><td>Auditoria + VPAT 2.5</td><td><span class="status-warn">⏳ RFP pronto</span> — contratação pendente</td></tr>
    </tbody>
  </table>
  <h3>Evidências técnicas já disponíveis</h3>
  <ul class="bullet-list">
    <li><code>docs/wcag-evidencias/axe-baseline-latest.json</code> — 52 rotas, 0 violações critical/serious.</li>
    <li><code>docs/wcag-evidencias/gate-codigo-latest.json</code> — gate código 100%.</li>
    <li>CI GitHub: build + unit + axe + flow-p0 + flow-full em cada PR.</li>
    <li>Conta de auditoria: <code>wcag-auditor@aerosuite.com.br</code> (homologação).</li>
  </ul>
  ${footer('Capítulo 3')}
</section>

<section class="page">
  ${pageHeader('Capítulo 4')}
  <h2>Como nos preparamos para solicitar a certificação</h2>
  <p class="lead">Plano em <strong>4 fases</strong> (detalhe no anexo — Roteiro 100% passo a passo):</p>
  <table class="data-table phase-table">
    <thead><tr><th>Fase</th><th>Objectivo</th><th>Responsável principal</th></tr></thead>
    <tbody>
      <tr><td>1</td><td>Fecho interno — gate §8 “Pronto para auditor externa”</td><td>TI + Qualidade (sessão NVDA)</td></tr>
      <tr><td>2</td><td>Auditoria externa WCAG 2.2 AA (relatório independente)</td><td>TI (RFP) + fornecedor</td></tr>
      <tr><td>3</td><td>VPAT 2.5 comercial + declaração PT no site</td><td>Comercial + Marketing + TI</td></tr>
      <tr><td>4</td><td>Manutenção contínua (CI + amostra release)</td><td>TI + Qualidade</td></tr>
    </tbody>
  </table>
  <h3>Próximas acções por área</h3>
  <table class="data-table role-table">
    <thead><tr><th>Área</th><th>Acção</th><th>Prazo sugerido</th></tr></thead>
    <tbody>
      <tr><td>TI</td><td>Conduzir sessão NVDA; enviar RFP a 2–3 auditores; remediar blockers pós-relatório</td><td>Jun–Jul/2026</td></tr>
      <tr><td>Qualidade</td><td>Validar checklist §7; participar sessão NVDA; alinhar evidências ao SGQ</td><td>Jun/2026</td></tr>
      <tr><td>Comercial</td><td>Revisar RFP; preparar talking points VPAT para propostas; não prometer “certificado” antes da Fase 3</td><td>Jul/2026</td></tr>
      <tr><td>Marketing</td><td>Planejar página “Acessibilidade” no site pós-VPAT; evitar claims adiantados</td><td>Ago/2026</td></tr>
    </tbody>
  </table>
  ${footer('Capítulo 4')}
</section>

<section class="page">
  ${pageHeader('Consolidação')}
  <h2>Consolidação técnica (o que já fizemos)</h2>
  <ul class="bullet-list">
    <li>Smoke axe em <strong>52 rotas</strong> (interno + externo) integrado ao CI.</li>
    <li>Smoke estrutural <strong>F1–F12</strong> (modais OS, hangar, FCU, proposta, confirm dialogs, trial, idioma, erros API).</li>
    <li>Correcções UI: contraste, labels, <code>aria-label</code> i18n, modo escuro, upload OS, totais proposta com live region.</li>
    <li>Documentação: checklist pré-auditoria, VPAT interno, protocolo NVDA, RFP Fase 2, roteiro 100%.</li>
    <li>Gate único: <code>npm run a11y:gate</code> — referência objectiva para releases.</li>
  </ul>
  <h2>Anexos deste envio</h2>
  <ol class="numbered-list">
    <li><strong>Dossiê técnico WCAG</strong> (este documento) — visão executiva e por área.</li>
    <li><strong>Roteiro 100% passo a passo</strong> — trilhas Código, Humano e Externa até certificação comercial total.</li>
  </ol>
  <div class="signature-block">
    <p class="lead" style="margin-bottom:6mm">
      Com este dossiê, a equipe passa a operar com o mesmo rigor que aplicamos à trilha ANAC:
      <span class="wcag-gold">excelência técnica documentada, mensurável e comunicável ao mercado.</span>
    </p>
    <div class="signature-line"></div>
    <div class="signature-name">${META.author}</div>
    <div class="signature-role">${META.role}</div>
    <div class="signature-role">${META.org}</div>
    <div class="signature-date">${META.date} · ${META.author.split(' ')[0].toLowerCase()}@aerosuite.com.br · aerosuite.com.br</div>
  </div>
  ${footer('Assinatura')}
</section>
`;

const roteiroBody = `
<section class="cover">
  <div class="cover-grid"></div>
  <div class="cover-inner">
    <img class="cover-logo" src="${logoCoverUri}" alt="Aero Suite" />
    <div class="cover-badge">Roteiro operacional · WCAG 2.2 AA</div>
    <h1>Roteiro 100% — código, humano e auditoria externa</h1>
    <div class="cover-gold-line"></div>
    <p class="cover-sub">Plano único para atingir certificação comercial completa: VPAT 2.5, declaração em português e regressão contínua. Três trilhas independentes, cada uma a 100% no seu domínio.</p>
    <p class="cover-meta">
      <strong>Data:</strong> ${META.date}<br />
      <strong>Commit referência:</strong> ${META.commit}<br />
      <strong>Origem:</strong> docs/WCAG-100-PASSO-A-PASSO.md
    </p>
  </div>
  <div class="cover-footer">Uso interno · TI · Qualidade · Comercial</div>
</section>

<section class="page">
  ${pageHeader('Visão geral')}
  <h2>Três trilhas até 100% total</h2>
  <table class="data-table">
    <thead><tr><th>Trilha</th><th>Meta</th><th>Verificação</th><th>Jun/2026</th></tr></thead>
    <tbody>
      <tr><td><strong>A — Código</strong></td><td>100%</td><td><code>npm run a11y:gate</code></td><td><span class="status-ok">✓</span></td></tr>
      <tr><td><strong>B — Humano</strong></td><td>100%</td><td>Checklist §7 + NVDA</td><td><span class="status-warn">Pendente</span></td></tr>
      <tr><td><strong>C — Externa</strong></td><td>100%</td><td>Relatório + VPAT 2.5</td><td><span class="status-warn">Pendente</span></td></tr>
    </tbody>
  </table>
  <p class="lead"><strong>Certificação total</strong> = A 100% <em>e</em> B 100% <em>e</em> C 100%.</p>
  <h3>Mapa de percentagens globais</h3>
  <table class="data-table">
    <thead><tr><th>Meta</th><th>Acção</th><th>% global após</th></tr></thead>
    <tbody>
      <tr><td>~75% Fase 1</td><td>Sessão NVDA + §7 sem blockers</td><td>Pronto para RFP</td></tr>
      <tr><td>~85% Fase 1</td><td>+ validação hangar/FCU + modo escuro</td><td>Pré-auditoria sólida</td></tr>
      <tr><td>~95% Fase 1</td><td>Gate §8 = Sim</td><td>Auditor pode entrar</td></tr>
      <tr><td>~70% cert. total</td><td>Relatório externo + remediação</td><td>Pós-Fase 2</td></tr>
      <tr><td>100% comercial</td><td>VPAT 2.5 + declaração PT</td><td>Fase 3 fechada</td></tr>
    </tbody>
  </table>
  ${footer('Visão geral')}
</section>

<section class="page">
  ${pageHeader('Trilha A')}
  <h2>Trilha A — Código (meta 100%)</h2>
  <p class="lead">Executável por script/CI. Estado actual: <span class="status-ok">concluída</span>.</p>
  <pre class="code-block" style="font-size:8pt;white-space:pre-wrap;background:#f1f5f9;padding:3mm;border-radius:4px;">cd frontend
npm run build
npm run test:unit
npm run a11y:axe
npm run a11y:flow-p0
npm run a11y:flow-full
npm run a11y:gate</pre>
  <h3>Checklist código</h3>
  <table class="data-table checklist">
    <thead><tr><th>#</th><th>Item</th><th>OK</th></tr></thead>
    <tbody>
      <tr><td>A1</td><td>Build produção</td><td>✓</td></tr>
      <tr><td>A2</td><td>Vitest core</td><td>✓</td></tr>
      <tr><td>A3</td><td>Axe 52/52</td><td>✓</td></tr>
      <tr><td>A4</td><td>Flow P0 4/4</td><td>✓</td></tr>
      <tr><td>A5</td><td>Flow full 12/12</td><td>✓</td></tr>
      <tr><td>A6</td><td>Gate código 100%</td><td>✓</td></tr>
      <tr><td>A7</td><td>CI integrado</td><td>✓</td></tr>
    </tbody>
  </table>
  ${footer('Trilha A')}
</section>

<section class="page">
  ${pageHeader('Trilha B')}
  <h2>Trilha B — Humano (meta 100%)</h2>
  <p class="lead">Não automatizável. Ferramentas: <strong>NVDA</strong> (Windows) ou VoiceOver (macOS) + navegação só por teclado.</p>
  <h3>B.1 Pré-requisitos</h3>
  <ul class="bullet-list">
    <li>Trilha A em 100% (<code>a11y:gate</code> verde).</li>
    <li>Ambiente: <code>https://app.aerosuite.com.br</code> · tenant <code>default</code>.</li>
    <li>Login: <code>wcag-auditor@aerosuite.com.br</code>.</li>
    <li>Script SQL de sanitização do tenant demo executado.</li>
  </ul>
  <h3>B.2 Sessão única (~60–90 min)</h3>
  <ol class="numbered-list">
    <li>Setup NVDA (template SESSAO-P0-MANUAL).</li>
    <li>6 rotas P0: login, OS, estoque, configurações, propostas, externo/propostas.</li>
    <li>Fluxos F1, F4, F6, F12 com teclado e leitor de tela.</li>
    <li>Preencher §7 do checklist pré-auditoria.</li>
    <li>Zero blockers → Gate §8 “Pronto para auditor externa: Sim”.</li>
  </ol>
  ${footer('Trilha B')}
</section>

<section class="page">
  ${pageHeader('Trilha C')}
  <h2>Trilha C — Externa + VPAT (meta 100%)</h2>
  <h3>C.1 Contratar auditoria</h3>
  <ol class="numbered-list">
    <li>Enviar RFP (<code>docs/wcag-evidencias/RFP-FASE2-AUDITORIA-WCAG.md</code>) a 2–3 fornecedores.</li>
    <li>Prover credenciais homologação (canal seguro).</li>
    <li>Resposta até 11/jul/2026 · janela de teste 15–20 dias úteis.</li>
  </ol>
  <h3>C.2 Remediação</h3>
  <table class="data-table">
    <thead><tr><th>Severidade</th><th>Acção</th></tr></thead>
    <tbody>
      <tr><td>Blocker</td><td>Corrigir antes de VPAT comercial</td></tr>
      <tr><td>Major</td><td>Corrigir no mesmo ciclo de release</td></tr>
      <tr><td>Minor</td><td>Backlog priorizado</td></tr>
    </tbody>
  </table>
  <h3>C.3 VPAT 2.5 e comunicação</h3>
  <ul class="bullet-list">
    <li>Emitir VPAT 2.5 (formato ITI) com base no relatório externo.</li>
    <li>Publicar declaração de acessibilidade em aerosuite.com.br.</li>
    <li>Actualizar VPAT interno e arquivo de evidências.</li>
  </ul>
  <h3>C.4 Manutenção</h3>
  <ul class="bullet-list">
    <li>PR bloqueado se axe/flow falhar.</li>
    <li>Amostra manual 6 rotas P0 a cada release (15 min).</li>
    <li>Re-auditoria semestral ou após refactor UI legado.</li>
  </ul>
  ${footer('Trilha C')}
</section>

<section class="page">
  ${pageHeader('Referências')}
  <h2>Documentos de apoio no repositório</h2>
  <table class="data-table">
    <thead><tr><th>Documento</th><th>Uso</th></tr></thead>
    <tbody>
      <tr><td>WCAG-CERTIFICACAO-ROTEIRO.md</td><td>Fases 1–4 resumidas</td></tr>
      <tr><td>PRE-AUDITORIA-WCAG-CHECKLIST.md</td><td>Checklist operacional</td></tr>
      <tr><td>VPAT-WCAG-INTERNO.md</td><td>VPAT interno</td></tr>
      <tr><td>PROTOCOLO-P0-MANUAL.md</td><td>Sessão NVDA</td></tr>
      <tr><td>RFP-FASE2-AUDITORIA-WCAG.md</td><td>Contratação auditor</td></tr>
    </tbody>
  </table>
  <p class="lead" style="margin-top:8mm;font-size:9pt;color:#64748b;">Última revisão: junho/2026 · Aero Suite · Diretoria de TI</p>
  ${footer('Referências')}
</section>
`;

async function renderPdf(html, pdfPath) {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('file:///' + html.replace(/\\/g, '/'), { waitUntil: 'networkidle0', timeout: 90000 });
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });
  await browser.close();
}

fs.mkdirSync(comercialDir, { recursive: true });

const dossieHtml = path.join(comercialDir, `Dossie_Tecnico_WCAG_${stamp}.html`);
const dossiePdf = path.join(comercialDir, `Dossie_Tecnico_WCAG_${stamp}.pdf`);
const roteiroHtml = path.join(comercialDir, `Roteiro_WCAG_100_Passo_a_Passo_${stamp}.html`);
const roteiroPdf = path.join(comercialDir, `Roteiro_WCAG_100_Passo_a_Passo_${stamp}.pdf`);

fs.writeFileSync(dossieHtml, wrapPdf('Dossiê Técnico WCAG', extraCss, dossieBody), 'utf8');
fs.writeFileSync(roteiroHtml, wrapPdf('Roteiro WCAG 100%', extraCss, roteiroBody), 'utf8');

console.log('HTML dossiê:', dossieHtml);
console.log('HTML roteiro:', roteiroHtml);

await renderPdf(dossieHtml, dossiePdf);
await renderPdf(roteiroHtml, roteiroPdf);

for (const p of [dossiePdf, roteiroPdf]) {
  const kb = Math.round(fs.statSync(p).size / 1024);
  console.log('PDF:', p, `(${kb} KB)`);
}
