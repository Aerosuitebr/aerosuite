#!/usr/bin/env node
/**
 * QA automatizado: paridade i18n entre pt-BR, en-US, es-ES e fr-FR.
 *
 * - nativeMissing: chave existe em pt-BR mas não no bloco es-ES/fr-FR (usa fallback en-US em runtime)
 * - criticalMissing: chave ausente em es/fr E en-US (mostraria pt-BR ou a própria chave)
 *
 * Falha se nativeMissing > 0 ou (I18N_QA_STRICT=1 e criticalMissing > 0).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const strict = process.env.I18N_QA_STRICT === '1';

const LOCALE_SUFFIXES = [
  { suffix: '_PT_BR', locale: 'pt-BR' },
  { suffix: '_EN_US', locale: 'en-US' },
  { suffix: '_ES_ES', locale: 'es-ES' },
  { suffix: '_FR_FR', locale: 'fr-FR' }
];

const SKIP_FILES = new Set([
  'frontend/src/app/core/i18n/api-backend-i18n.ts',
  'frontend/src/app/core/translation.service.ts'
]);

/** Catálogos só com overlay ES/FR (PT/EN vêm de outro módulo). */
const OVERLAY_ONLY = new Set([
  'frontend/src/app/core/i18n/externo-portal-i18n.ts',
  'frontend/src/app/core/i18n/resolver-pendencias-i18n.ts',
  'frontend/src/app/core/i18n/os-consulta-i18n.ts'
]);

function extractKeys(block) {
  const keys = new Set();
  for (const m of block.matchAll(/'([a-zA-Z][a-zA-Z0-9_.-]*)'\s*:/g)) {
    keys.add(m[1]);
  }
  return keys;
}

function loadCatalogFiles() {
  const tracked = execSync('git ls-files frontend/src/app', { cwd: root, encoding: 'utf8' })
    .split(/\n/)
    .filter((f) => f.endsWith('.ts') && !SKIP_FILES.has(f));

  const coreDir = path.join(root, 'frontend/src/app/core/i18n');
  for (const name of fs.readdirSync(coreDir)) {
    if (name.endsWith('.ts')) {
      tracked.push(`frontend/src/app/core/i18n/${name}`);
    }
  }

  return [...new Set(tracked)].filter((f) => fs.existsSync(path.join(root, f)));
}

function parseLocaleBlocks(filePath) {
  const rel = path.relative(root, filePath).replace(/\\/g, '/');
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
    blocks[locale] = extractKeys(src.slice(match.index, i));
  }

  return { rel, blocks };
}

const files = loadCatalogFiles();
let nativeMissingTotal = 0;
let criticalMissingTotal = 0;
const nativeSamples = [];
const criticalSamples = [];

for (const file of files) {
  const { rel, blocks } = parseLocaleBlocks(file);
  if (OVERLAY_ONLY.has(rel)) continue;

  const pt = blocks['pt-BR'];
  const en = blocks['en-US'];
  if (!pt || pt.size === 0) continue;

  for (const locale of ['es-ES', 'fr-FR']) {
    const loc = blocks[locale];
    if (!loc) continue;

    for (const key of pt) {
      if (loc.has(key)) continue;
      nativeMissingTotal++;
      if (nativeSamples.length < 8) {
        nativeSamples.push({ rel, locale, key });
      }

      const coveredByEn = en && en.has(key);
      if (!coveredByEn) {
        criticalMissingTotal++;
        if (criticalSamples.length < 8) {
          criticalSamples.push({ rel, locale, key });
        }
      }
    }
  }
}

console.log('=== i18n QA — paridade 4 locales ===');
console.log(`Tradução nativa em falta (es/fr vs pt, fallback en-US): ${nativeMissingTotal}`);
console.log(`Crítico (sem es/fr nem en-US): ${criticalMissingTotal}`);

if (nativeSamples.length) {
  console.log('\nAmostra nativeMissing:');
  for (const s of nativeSamples) {
    console.log(`  [${s.locale}] ${s.rel} → ${s.key}`);
  }
}
if (criticalSamples.length) {
  console.log('\nAmostra criticalMissing:');
  for (const s of criticalSamples) {
    console.log(`  [${s.locale}] ${s.rel} → ${s.key}`);
  }
}

if (criticalMissingTotal === 0 && nativeMissingTotal === 0) {
  console.log('\n✓ Paridade nativa es/fr completa (0 chaves em falta).');
} else if (criticalMissingTotal === 0) {
  console.log('\n✓ Nenhuma chave crítica em falta (es/fr cobertas via en-US ou bloco nativo).');
}

if (nativeMissingTotal > 0 || (strict && criticalMissingTotal > 0)) {
  process.exit(1);
}
