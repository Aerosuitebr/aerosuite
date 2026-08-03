#!/usr/bin/env node
/**
 * Gera Guia de Produção do Vídeo Promocional Aero Suite (PDF)
 * Uso: node scripts/build-video-promo-guia-pdf.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import {
  META,
  WORKFLOW,
  PRE_FLIGHT,
  RECORDING_SPECS,
  RECORDING_SCRIPT,
  NARRATION_FULL,
  ABACUS_PROMPTS,
  ABACUS_DONT,
  CAPTIONS_BY_SCENE,
  SCENE_TEMPLATE,
  PUBLISH_CHECKLIST,
  COMPLIANCE,
  VIDEO_MAPPING,
  BRAND,
  MUSIC,
} from '../docs/video-promo-guia/guia-data.mjs';

const require = createRequire(import.meta.url);
const puppeteer = require(path.join(path.dirname(fileURLToPath(import.meta.url)), '../frontend/node_modules/puppeteer'));

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const docDir = path.join(root, 'docs/video-promo-guia');
const cssPath = path.join(docDir, 'guia-styles.css');
const baseCss = fs.readFileSync(path.join(root, 'docs/ux-relatorio-executivo/relatorio-styles.css'), 'utf8');
const extraCss = fs.readFileSync(cssPath, 'utf8').replace(/@import[^;]+;/, '');
const css = baseCss + '\n' + extraCss;
const htmlOut = path.join(docDir, 'Guia_Video_Promocional_AeroSuite.html');
const pdfOut = path.join(root, 'manuals/Guia_Video_Promocional_AeroSuite.pdf');

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

function footer(label) {
  return `<div class="page-footer"><span>Aero Suite · Guia Vídeo Promocional</span><span>${esc(label)} · v${esc(META.version)}</span></div>`;
}

function pageHeader(label) {
  return `<div class="page-header"><img src="${logoHeaderUri}" alt="Aero Suite" /><span class="chapter-label">${esc(label)}</span></div>`;
}

const workflowHtml = WORKFLOW.map(
  (w) => `
<div class="workflow-step">
  <div class="workflow-num">${w.step}</div>
  <div class="workflow-body"><strong>${esc(w.title)}</strong>${esc(w.body)}</div>
</div>`,
).join('');

const preFlightHtml = `<ul class="checklist">${PRE_FLIGHT.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;

const specsRows = Object.entries(RECORDING_SPECS)
  .map(([k, v]) => `<tr><td><strong>${esc(k)}</strong></td><td>${esc(v)}</td></tr>`)
  .join('');

const scriptRows = RECORDING_SCRIPT.map(
  (r) => `<tr>
    <td>${r.id}</td>
    <td>${esc(r.duration)}</td>
    <td><code>${esc(r.route)}</code><br/>${esc(r.action)}<br/><small>${esc(r.detail)}</small></td>
    <td class="col-caption">${esc(r.caption)}</td>
    <td class="col-narration">${esc(r.narration)}</td>
  </tr>`,
).join('');

const abacusHtml = ABACUS_PROMPTS.map(
  (p) => `
<div class="item-card">
  <div class="item-head">
    <span class="item-id">${esc(p.id)}</span>
    <span class="item-title">${esc(p.title)}</span>
  </div>
  <div class="item-body">
    <div class="item-row"><div class="item-label">Quando usar</div><div class="item-text">${esc(p.when)}</div></div>
    <div class="item-label prompt-label">Prompt (copiar e colar no Abacus)</div>
    <div class="prompt-block">${esc(p.prompt)}</div>
  </div>
</div>`,
).join('');

const dontHtml = ABACUS_DONT.map(
  (d) => `<tr><td><span class="tag-dont">Evitar</span> ${esc(d.bad)}</td><td>${esc(d.why)}</td></tr>`,
).join('');

const captionsRows = CAPTIONS_BY_SCENE.map(
  (c) => `<tr><td>${esc(c.scene)}</td><td><strong>${esc(c.caption)}</strong></td><td>${esc(c.alt)}</td></tr>`,
).join('');

const publishHtml = `<ul class="checklist">${PUBLISH_CHECKLIST.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;

const complianceUse = COMPLIANCE.use.map((u) => `<li>${esc(u)}</li>`).join('');
const complianceAvoid = COMPLIANCE.avoid.map((u) => `<li>${esc(u)}</li>`).join('');

const sceneTemplateRow = SCENE_TEMPLATE.map((t) => `<tr><td>${esc(t.col)}</td><td>${esc(t.example)}</td></tr>`).join('');

const deliverablesHtml = META.deliverables.map((d) => `<li>${esc(d)}</li>`).join('');

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>${esc(META.title)} — Aero Suite</title>
  <style>${css}</style>
</head>
<body>

<section class="cover">
  <div class="cover-grid"></div>
  <div class="cover-inner">
    <img class="cover-logo" src="${logoCoverUri}" alt="Aero Suite" />
    <div class="cover-badge">Marketing · Produção de vídeo</div>
    <h1>${esc(META.title)}</h1>
    <p class="cover-sub">${esc(META.subtitle)}</p>
    <div class="cover-gold-line"></div>
    <p class="cover-meta">
      <strong>Versão ${esc(META.version)}</strong> · ${esc(META.date)}<br />
      Destinatário: <strong>${esc(META.recipient)}</strong><br />
      Autor: <strong>${esc(META.author)}</strong><br />
      Duração alvo: <strong>${esc(META.targetDuration)}</strong>
    </p>
  </div>
  <div class="cover-footer">Aero Suite — Gestão aeronáutica integrada</div>
</section>

<section class="page">
  ${pageHeader('Sumário')}
  <h2>Conteúdo do guia</h2>
  <ul class="toc-list">
    <li><span class="toc-num">1</span><span class="toc-title">Visão geral e fluxo de produção</span></li>
    <li><span class="toc-num">2</span><span class="toc-title">Pré-gravação (checklist)</span></li>
    <li><span class="toc-num">3</span><span class="toc-title">Especificações técnicas de gravação</span></li>
    <li><span class="toc-num">4</span><span class="toc-title">Roteiro de gravação — teleprompter de ações</span></li>
    <li><span class="toc-num">5</span><span class="toc-title">Roteiro de narração (TTS)</span></li>
    <li><span class="toc-num">6</span><span class="toc-title">Abacus — prompts prontos</span></li>
    <li><span class="toc-num">7</span><span class="toc-title">Legendas, marca e áudio</span></li>
    <li><span class="toc-num">8</span><span class="toc-title">Compliance de copy</span></li>
    <li class="part">Anexos</li>
    <li><span class="toc-num">A</span><span class="toc-title">Mapeamento de vídeo bruto (pós-gravação)</span></li>
    <li><span class="toc-num">B</span><span class="toc-title">Modelo de tabela de cenas</span></li>
    <li><span class="toc-num">C</span><span class="toc-title">Checklist de publicação</span></li>
  </ul>
  ${footer('Sumário')}
</section>

<section class="page">
  ${pageHeader('Seção 1')}
  <h2>Visão geral e fluxo de produção</h2>
  <p class="lead">
    Este guia orienta o departamento de marketing na produção do <strong>vídeo promocional do Aero Suite</strong>,
    software de gestão para oficinas aeronáuticas (MRO). A gravação é um <strong>tour contínuo do produto</strong>;
    a edição final (60–90 s) combina <strong>CapCut</strong> para corte e legendas com <strong>Abacus</strong> apenas
    para tarefas pontuais (upscale, B-roll, voz).
  </p>
  <div class="callout">
    <strong>Princípio central:</strong> a gravação da interface é sagrada — nitidez dos textos, botões e labels
    é mais importante que efeitos cinematográficos. O Abacus <em>não</em> substitui o editor de vídeo.
  </div>
  <h3>Entregáveis</h3>
  <ul>${deliverablesHtml}</ul>
  <h3>Fluxo em 6 etapas</h3>
  ${workflowHtml}
  ${footer('Seção 1')}
</section>

<section class="page">
  ${pageHeader('Seção 2')}
  <h2>Pré-gravação — checklist</h2>
  <p class="lead">Executar <strong>na véspera</strong> e repetir 5 minutos antes de gravar. Evita refazer por detalhes evitáveis.</p>
  ${preFlightHtml}
  ${footer('Seção 2')}
</section>

<section class="page">
  ${pageHeader('Seção 3')}
  <h2>Especificações técnicas</h2>
  <table>
    <thead><tr><th>Parâmetro</th><th>Valor recomendado</th></tr></thead>
    <tbody>${specsRows}</tbody>
  </table>
  <h3>Regras de ouro durante a gravação</h3>
  <ul>
    <li><strong>Mouse devagar</strong> — movimentos amplos, sem jitter</li>
    <li><strong>Pausa 1–2 s</strong> em cada tela antes de clicar</li>
    <li><strong>Um fluxo contínuo</strong> — evita cortes feios; erros = gravar de novo</li>
    <li><strong>Sem scroll frenético</strong> — scroll em incrementos pequenos</li>
    <li><strong>Sem digitar URLs</strong> — usar favoritos ou menu interno</li>
  </ul>
  ${footer('Seção 3')}
</section>

<section class="page">
  ${pageHeader('Seção 4')}
  <h2>Roteiro de gravação — teleprompter de ações</h2>
  <p class="lead">
    Gravação bruta estimada: <strong>${esc(META.rawDuration)}</strong>.
    Siga a ordem; tempos são orientativos. Colunas “Legenda” e “Narração” servem para o CapCut e TTS depois.
  </p>
  <table class="timeline-table">
    <thead>
      <tr><th>#</th><th>Tempo</th><th>Rota e ação</th><th>Legenda sugerida</th><th>Hint narração</th></tr>
    </thead>
    <tbody>${scriptRows}</tbody>
  </table>
  ${footer('Seção 4')}
</section>

<section class="page">
  ${pageHeader('Seção 5')}
  <h2>Roteiro de narração completo (TTS)</h2>
  <p class="lead">
    Texto para Abacus TTS ou locutor. Tom: neutro, profissional, 35–45 anos, ritmo calmo (~130 palavras/min).
    Ajustar cortes no CapCut para sincronizar com as cenas visíveis.
  </p>
  <div class="prompt-block">${esc(NARRATION_FULL)}</div>
  <p><em>Dica:</em> grave primeiro sem narração; adicione voz na pós-produção. Música ambiente 20 dB abaixo da voz.</p>
  ${footer('Seção 5')}
</section>

<section class="page">
  ${pageHeader('Seção 6')}
  <h2>Abacus — prompts prontos (copiar e colar)</h2>
  <p class="lead">Pedir <strong>uma tarefa por vez</strong>. Anexar MP4 apenas quando o prompt pedir análise de vídeo.</p>
  ${abacusHtml}
  <h3>O que NÃO pedir ao Abacus</h3>
  <table>
    <thead><tr><th>Pedido</th><th>Motivo</th></tr></thead>
    <tbody>${dontHtml}</tbody>
  </table>
  ${footer('Seção 6')}
</section>

<section class="page">
  ${pageHeader('Seção 7')}
  <h2>Legendas, identidade visual e áudio</h2>
  <div class="two-col">
    <div>
      <h3>Legendas por cena</h3>
      <table>
        <thead><tr><th>Cena</th><th>Legenda</th><th>Alternativa</th></tr></thead>
        <tbody>${captionsRows}</tbody>
      </table>
    </div>
    <div>
      <h3>Marca Aero Suite</h3>
      <table>
        <tr><td>Cor primária</td><td>${esc(BRAND.primary)}</td></tr>
        <tr><td>Destaque</td><td>${esc(BRAND.accent)}</td></tr>
        <tr><td>Tipografia</td><td>${esc(BRAND.font)}</td></tr>
        <tr><td>Lower third</td><td>${esc(BRAND.lowerThird)}</td></tr>
        <tr><td>CTA</td><td>${esc(BRAND.cta)}</td></tr>
      </table>
      <h3>Música de fundo</h3>
      <p><strong>Estilo:</strong> ${esc(MUSIC.style)}</p>
      <p><strong>Fontes:</strong> ${esc(MUSIC.sources)}</p>
      <p><strong>Nível:</strong> ${esc(MUSIC.level)}</p>
    </div>
  </div>
  ${footer('Seção 7')}
</section>

<section class="page">
  ${pageHeader('Seção 8')}
  <h2>Compliance de copy (marketing)</h2>
  <p class="lead">Público técnico aeronáutico detecta exageros. Use linguagem precisa.</p>
  <div class="two-col">
    <div>
      <h3><span class="tag-do">Usar</span></h3>
      <ul>${complianceUse}</ul>
    </div>
    <div>
      <h3><span class="tag-dont">Evitar</span></h3>
      <ul>${complianceAvoid}</ul>
    </div>
  </div>
  ${footer('Seção 8')}
</section>

<section class="page">
  ${pageHeader('Anexo A')}
  <h2>Mapeamento do vídeo bruto (pós-gravação)</h2>
  <p class="lead">${esc(VIDEO_MAPPING.intro)}</p>
  <h3>Como enviar o arquivo</h3>
  <ul>${VIDEO_MAPPING.howToSend.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>
  <h3>Formato de retorno esperado</h3>
  <div class="prompt-block">${esc(VIDEO_MAPPING.outputFormat)}</div>
  <h3>Limitações</h3>
  <ul>${VIDEO_MAPPING.limits.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>
  ${footer('Anexo A')}
</section>

<section class="page">
  ${pageHeader('Anexo B')}
  <h2>Modelo de tabela de cenas (CapCut + Abacus)</h2>
  <p class="lead">Preencher após assistir aerosuite-demo-bruto.mp4. Ordenar cenas na sequência final do vídeo de 90 s.</p>
  <table>
    <thead><tr><th>Coluna</th><th>Exemplo</th></tr></thead>
    <tbody>${sceneTemplateRow}</tbody>
  </table>
  <p style="margin-top:5mm"><em>Repita linhas CENA 01–08 conforme necessário. Coluna ABACUS: upscale | B-roll intro | TTS | —</em></p>
  ${footer('Anexo B')}
</section>

<section class="page">
  ${pageHeader('Anexo C')}
  <h2>Checklist de publicação</h2>
  ${publishHtml}
  <div class="signature-block">
    <p class="lead" style="margin-bottom:6mm">
      Este guia foi preparado para capacitar a produção de um vídeo promocional de alta qualidade,
      preservando a fidelidade do produto e a credibilidade técnica da marca Aero Suite.
      Dúvidas sobre telas ou fluxos do demo: contatar ${esc(META.author)}.
    </p>
    <div class="signature-line"></div>
    <div class="signature-name">${esc(META.author)}</div>
    <div class="signature-role">${esc(META.role)}</div>
    <div class="signature-role">${esc(META.org)}</div>
    <div class="signature-date">${esc(META.date)} · aerosuite.com.br</div>
  </div>
  ${footer('Anexo C · Assinatura')}
</section>

</body>
</html>`;

fs.mkdirSync(path.dirname(pdfOut), { recursive: true });
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
