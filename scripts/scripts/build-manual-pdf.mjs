#!/usr/bin/env node
/**
 * Gera o Manual Aero Suite (homologação) em PDF via Puppeteer.
 * Uso: node scripts/build-manual-pdf.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const puppeteer = require(path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../frontend/node_modules/puppeteer'
));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const docDir = path.join(root, 'docs/manual-homologacao');
const cssPath = path.join(docDir, 'manual-styles.css');
const chaptersPath = path.join(docDir, 'manual-chapters.html');
const htmlOut = path.join(docDir, 'Manual_Aero_Suite.html');
const pdfOut = path.join(root, 'manuals/Manual_Aero_Suite_Homologacao.pdf');

const logoCover = path.join(root, 'frontend/src/assets/LOGO_LETRA_LIGHT.png');
const logoHeader = path.join(root, 'frontend/src/assets/LOGO_LETRA.png');
const logoCoverUri = 'file:///' + logoCover.replace(/\\/g, '/');
const logoHeaderUri = 'file:///' + logoHeader.replace(/\\/g, '/');

const css = fs.readFileSync(cssPath, 'utf8');
const year = new Date().getFullYear();
const chapters = fs
  .readFileSync(chaptersPath, 'utf8')
  .replaceAll('{{LOGO_HEADER}}', logoHeaderUri)
  .replaceAll('{{YEAR}}', String(year));

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Manual Aero Suite — Homologação</title>
  <style>${css}</style>
</head>
<body>

<section class="cover">
  <div class="cover-grid"></div>
  <div class="cover-inner">
    <img class="cover-logo" src="${logoCoverUri}" alt="Aero Suite" />
    <div class="cover-badge">Manual oficial · Homologação</div>
    <h1>Manual do Usuário</h1>
    <p class="cover-sub">Guia completo para operação, configuração e homologação da plataforma de gestão aeronáutica</p>
    <div class="cover-gold-line"></div>
    <p class="cover-meta">
      <strong>Versão 3.0</strong> · ${year}<br />
      MRO · Estoque · Comercial · SGQ Part 145 · Certificação ANAC
    </p>
  </div>
  <div class="cover-footer">Aero Suite — Gestão aeronáutica integrada</div>
</section>

<section class="page toc">
  <div class="page-header">
    <img src="${logoHeaderUri}" alt="Aero Suite" />
    <span class="chapter-label">Sumário</span>
  </div>
  <h2>Conteúdo do manual</h2>
  <ul class="toc-list">
    <li class="part">Parte I — Primeiros passos</li>
    <li><span class="toc-num">1</span><span class="toc-title">Cadastro trial e criação da organização</span></li>
    <li><span class="toc-num">2</span><span class="toc-title">Primeiro login e aceite LGPD</span></li>
    <li><span class="toc-num">3</span><span class="toc-title">Assistente de configuração da empresa (4 etapas)</span></li>
    <li><span class="toc-num">4</span><span class="toc-title">Configurações essenciais do sistema</span></li>
    <li class="part">Parte II — Navegação e cadastros base</li>
    <li><span class="toc-num">5</span><span class="toc-title">Dashboard e menu lateral</span></li>
    <li><span class="toc-num">6</span><span class="toc-title">Produtos, fabricantes e tipos de serviço</span></li>
    <li><span class="toc-num">7</span><span class="toc-title">Produto aeronáutico (FCU) e associações</span></li>
    <li><span class="toc-num">8</span><span class="toc-title">Usuários internos e perfis</span></li>
    <li class="part">Parte III — MRO e operação</li>
    <li><span class="toc-num">9</span><span class="toc-title">Ordens de serviço (OS)</span></li>
    <li><span class="toc-num">10</span><span class="toc-title">Quadro de capacidade e hangar (job card)</span></li>
    <li><span class="toc-num">11</span><span class="toc-title">AD/SB, habilitações e auditoria de OS</span></li>
    <li class="part">Parte IV — Estoque</li>
    <li><span class="toc-num">12</span><span class="toc-title">Visão geral e fluxo do módulo estoque</span></li>
    <li><span class="toc-num">13</span><span class="toc-title">Entrada, itens, saídas e rastreabilidade</span></li>
    <li class="part">Parte V — Comercial</li>
    <li><span class="toc-num">14</span><span class="toc-title">Propostas comerciais e templates</span></li>
    <li><span class="toc-num">15</span><span class="toc-title">Portal do cliente e usuários externos</span></li>
    <li class="part">Parte VI — Governança e suporte</li>
    <li><span class="toc-num">16</span><span class="toc-title">Controle de acesso e permissões</span></li>
    <li><span class="toc-num">17</span><span class="toc-title">Backup, relatórios, biblioteca e go-live</span></li>
    <li><span class="toc-num">18</span><span class="toc-title">Suporte, chat e portal externo</span></li>
    <li class="part">Parte VII — Certificação ANAC</li>
    <li><span class="toc-num">19</span><span class="toc-title">Certificação ANAC — habilitação do produto</span></li>
    <li><span class="toc-num">A</span><span class="toc-title">Apêndice — Checklist homologação (Fases 1–7)</span></li>
    <li><span class="toc-num">B</span><span class="toc-title">Apêndice — Checklist certificação ANAC (Fase 8)</span></li>
  </ul>
  <div class="page-footer"><span>Aero Suite · Manual de Homologação</span><span>Versão 3.0</span></div>
</section>

${chapters}

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
  margin: { top: 0, right: 0, bottom: 0, left: 0 }
});
await browser.close();

console.log('PDF:', pdfOut);
console.log('Páginas geradas com sucesso.');
