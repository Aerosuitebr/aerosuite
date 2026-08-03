#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const apiDir = path.join(root, 'backend', 'src', 'main', 'java', 'com', 'aerosuite', 'api');
const javaRoot = path.join(root, 'backend', 'src', 'main', 'java');
const ptRe =
  /[àáâãéêíóôõúç]|(\bErro\b|\bFalha\b|\bNão\b|\bnão\b|\bobrigat|\bUsuário\b|\bArquivo\b|\bNenhum\b|\bEnvie\b|\bItem não\b|\binválid)/i;
const openapiPtRe =
  /[àáâãéêíóôõúçÀÁÂÃÉÊÍÓÔÕÚÇ]|(\bOperações\b|\bRetorna\b|\bListar\b|\bBuscar\b|\bArquivo\b|\bOrdem\b|\bpágina\b|\bbusca\b|\bServiço\b)/i;

function scanApi() {
  const files = fs.readdirSync(apiDir).filter((f) => f.endsWith('.java'));
  const byFile = {};
  let total = 0;
  for (const f of files) {
    const lines = fs.readFileSync(path.join(apiDir, f), 'utf8').split('\n');
    lines.forEach((line) => {
      if (!ptRe.test(line)) return;
      if (line.includes('ApiI18nMessages')) return;
      if (/LOG\.|LOGGER\.|Logger\.|warnf|errorf|infof|debugf/.test(line)) return;
      if (/description\s*=|summary\s*=|@Tag\(/.test(line)) return;
      if (/^\s*(\*|\/\/|import |package )/.test(line)) return;
      if (!/(?:\.entity|Map\.of|put\(|jsonError|throw new|"message"|resultado\.|analise\.|out\.steps)/.test(line))
        return;
      total++;
      byFile[f] = (byFile[f] || 0) + 1;
    });
  }
  return { total, byFile, fileCount: Object.keys(byFile).length };
}

function countOpenApiPt() {
  let n = 0;
  const byFile = {};
  function walk(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (ent.name.endsWith('.java')) {
        const rel = path.relative(javaRoot, p).replace(/\\/g, '/');
        const lines = fs.readFileSync(p, 'utf8').split('\n');
        lines.forEach((line) => {
          if (!/@Parameter\(|@Operation\(|@APIResponse\(|@Tag\(/.test(line)) return;
          if (!/(description\s*=|summary\s*=)/.test(line)) return;
          if (line.includes('OpenApiDescriptions')) return;
          const m = line.match(/(?:description|summary)\s*=\s*"([^"]+)"/);
          if (!m) return;
          if (!openapiPtRe.test(m[1])) return;
          n++;
          byFile[rel] = (byFile[rel] || 0) + 1;
        });
      }
    }
  }
  walk(javaRoot);
  return { total: n, byFile, fileCount: Object.keys(byFile).length };
}

function scanFrontendFallbacks() {
  const appDir = path.join(root, 'frontend', 'src', 'app');
  let n = 0;
  function walk(d) {
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, ent.name);
      if (ent.isDirectory() && ent.name !== 'node_modules') walk(p);
      else if (ent.name.endsWith('.component.ts') && !ent.name.endsWith('.spec.ts')) {
        const src = fs.readFileSync(p, 'utf8');
        if (/\|\|\s*['"]Erro ao/.test(src)) n++;
      }
    }
  }
  walk(appDir);
  return n;
}

function scanConsoleErrorPt() {
  const appDir = path.join(root, 'frontend', 'src', 'app');
  let n = 0;
  function walk(d) {
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, ent.name);
      if (ent.isDirectory() && ent.name !== 'node_modules') walk(p);
      else if (ent.name.endsWith('.ts') && !ent.name.endsWith('.spec.ts')) {
        const src = fs.readFileSync(p, 'utf8');
        const matches = src.match(/console\.(error|warn)\([^)]*[àáâãéêíóôõúçÀÁÂÃÉÊÍÓÔÕÚÇ]/g);
        if (matches) n += matches.length;
      }
    }
  }
  walk(appDir);
  return n;
}

function scanPtBrEuropean() {
  const i18nDir = path.join(root, 'frontend', 'src', 'app', 'core', 'i18n');
  const terms = ['ficheiro', 'utilizador', 'Guardar como', 'Inicie sessão', 'folha de cálculo', 'diapositivo', 'Descarregar'];
  const hits = [];
  for (const f of fs.readdirSync(i18nDir).filter((x) => x.endsWith('.ts'))) {
    const src = fs.readFileSync(path.join(i18nDir, f), 'utf8');
    const ptBlock = src.split('PT_BR')[1]?.split('EN_US')[0] || '';
    for (const t of terms) {
      if (ptBlock.includes(t)) hits.push(`${f}: ${t}`);
    }
  }
  return hits;
}

const api = scanApi();
const openapi = countOpenApiPt();
const fallbacks = scanFrontendFallbacks();
const consolePt = scanConsoleErrorPt();
const european = scanPtBrEuropean();

console.log(JSON.stringify({ api, openapi, fallbacks, consolePt, european }, null, 2));
