#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOCALE_SUFFIXES = [
  { suffix: '_PT_BR', locale: 'pt-BR' },
  { suffix: '_EN_US', locale: 'en-US' },
  { suffix: '_ES_ES', locale: 'es-ES' },
  { suffix: '_FR_FR', locale: 'fr-FR' }
];
const SKIP = new Set([
  'frontend/src/app/core/i18n/api-backend-i18n.ts',
  'frontend/src/app/core/translation.service.ts'
]);
const OVERLAY = new Set([
  'frontend/src/app/core/i18n/externo-portal-i18n.ts',
  'frontend/src/app/core/i18n/resolver-pendencias-i18n.ts',
  'frontend/src/app/core/i18n/os-consulta-i18n.ts'
]);

function extractEntries(block) {
  const entries = new Map();
  const re = /'([a-zA-Z][a-zA-Z0-9_.-]*)'\s*:\s*('(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|"(?:\\.|[^"\\])*")/g;
  for (const m of block.matchAll(re)) {
    entries.set(m[1], m[2]);
  }
  return entries;
}

function parseBlocks(filePath) {
  const src = fs.readFileSync(filePath, 'utf8');
  const blocks = {};
  for (const { suffix, locale } of LOCALE_SUFFIXES) {
    const re = new RegExp(
      `export const [A-Z0-9_]+${suffix}\\s*:\\s*TranslationDictionary\\s*=\\s*\\{`,
      'm'
    );
    const match = re.exec(src);
    if (!match) continue;
    let depth = 1;
    let i = match.index + match[0].length;
    while (i < src.length && depth > 0) {
      const ch = src[i];
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
      i++;
    }
    blocks[locale] = extractEntries(src.slice(match.index, i));
  }
  return blocks;
}

function loadFiles() {
  const tracked = execSync('git ls-files frontend/src/app', { cwd: root, encoding: 'utf8' })
    .split(/\n/)
    .filter((f) => f.endsWith('-i18n.ts') && !SKIP.has(f));
  const coreDir = path.join(root, 'frontend/src/app/core/i18n');
  for (const name of fs.readdirSync(coreDir)) {
    if (name.endsWith('-i18n.ts')) tracked.push(`frontend/src/app/core/i18n/${name}`);
  }
  return [...new Set(tracked)].filter((f) => fs.existsSync(path.join(root, f)));
}

const out = {};
for (const rel of loadFiles()) {
  if (OVERLAY.has(rel)) continue;
  const blocks = parseBlocks(path.join(root, rel));
  const pt = blocks['pt-BR'];
  const en = blocks['en-US'];
  const es = blocks['es-ES'];
  const fr = blocks['fr-FR'];
  if (!pt || !en || !es) continue;

  const missEs = [];
  const missFr = [];
  for (const key of pt.keys()) {
    if (!es.has(key) && en.has(key)) {
      missEs.push({ key, en: en.get(key), pt: pt.get(key) });
    }
    if (fr && !fr.has(key) && en.has(key)) {
      missFr.push({ key, en: en.get(key), pt: pt.get(key) });
    }
  }
  if (missEs.length || missFr.length) {
    out[rel] = { missEs, missFr };
  }
}

const outPath = path.join(root, 'scripts/.i18n-native-gaps.json');
fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
let n = 0;
for (const v of Object.values(out)) n += v.missEs.length + v.missFr.length;
console.log(`Wrote ${outPath} — ${n} entries across ${Object.keys(out).length} files`);
