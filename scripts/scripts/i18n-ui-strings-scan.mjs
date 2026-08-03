#!/usr/bin/env node
/**
 * Heuristic scan for likely user-visible Portuguese literals in frontend UI
 * (outside *-i18n.ts dictionaries). Informational — does not fail CI by default.
 * Set I18N_UI_STRICT=1 to exit 1 when high-confidence hits remain.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const appDir = path.join(root, 'frontend', 'src', 'app');
const strict = process.env.I18N_UI_STRICT === '1';

const ptStrongRe =
  /[àáâãéêíóôõúçÀÁÂÃÉÊÍÓÔÕÚÇ]|(\bNão foi\b|\bErro ao\b|\bErro de\b|\bFalha ao\b|\bVerifique se\b|\bobrigatório\b|\binválid[oa]\b|\bconexão\b|\btente novamente\b)/i;

const skipFile = (rel) =>
  rel.includes('-i18n.ts') ||
  rel.includes('/core/i18n/') ||
  rel.includes('/core/domain/') ||
  rel.endsWith('.spec.ts') ||
  rel.endsWith('.d.ts') ||
  rel.endsWith('translation.service.ts');

const skipLine = (line) => {
  const t = line.trim();
  if (!t || t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) return true;
  if (/console\.(log|debug|info|warn|error)\s*\(/.test(line)) return true;
  if (/\|\s*translate/.test(line)) return true;
  if (/translate\s*\(\s*['"`]/.test(line)) return true;
  if (/translateApi(Error|Message)/.test(line)) return true;
  if (/addToast\s*\(/.test(line)) return true;
  if (/toastKey\s*\(/.test(line)) return true;
  if (/buildTranslatedOptions\s*\(/.test(line)) return true;
  if (/label:\s*['"][A-Z0-9_]+['"]/.test(line)) return true;
  if (/api\.[\w.]+/.test(line)) return true;
  return false;
};

function isLikelyNonUiString(s) {
  if (s.length < 8) return true;
  if (/^\//.test(s) || s.includes('${') || s.includes('://')) return true;
  if (/^[a-z][\w.-]*$/.test(s) && !/[àáâãéêíóôõúç]/i.test(s)) return true;
  if (/^[\w-]+$/.test(s) && s.includes('-')) return true;
  if (/^salvar\(/.test(s)) return true;
  if (/^[A-Z]{2}$/.test(s)) return true;
  return false;
}

function listUiFiles() {
  const out = [];
  try {
    const tracked = execSync('git ls-files frontend/src/app', { cwd: root, encoding: 'utf8' })
      .split(/\n/)
      .filter((f) => (f.endsWith('.ts') || f.endsWith('.html')) && !skipFile(f));
    for (const f of tracked) out.push(path.join(root, f));
  } catch {
    function walk(dir) {
      for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, ent.name);
        const rel = path.relative(root, p).replace(/\\/g, '/');
        if (ent.isDirectory()) walk(p);
        else if ((p.endsWith('.ts') || p.endsWith('.html')) && !skipFile(rel)) out.push(p);
      }
    }
    walk(appDir);
  }
  return out;
}

const stringRe = /(['"`])((?:\\.|(?!\1)[^\\])*)\1/g;
const hits = [];

for (const file of listUiFiles()) {
  if (!fs.existsSync(file)) continue;
  const rel = path.relative(root, file).replace(/\\/g, '/');
  const lines = fs.readFileSync(file, 'utf8').split(/\n/);
  lines.forEach((line, idx) => {
    if (skipLine(line)) return;
    for (const m of line.matchAll(stringRe)) {
      const s = m[2];
      if (isLikelyNonUiString(s)) continue;
      if (!ptStrongRe.test(s)) continue;
      hits.push({ file: rel, line: idx + 1, text: s.slice(0, 100) });
    }
  });
}

console.log('UI PT literals (high-confidence):', hits.length);
for (const h of hits.slice(0, 40)) {
  console.log(`${h.file}:${h.line}: ${JSON.stringify(h.text)}`);
}
if (hits.length > 40) console.log(`... and ${hits.length - 40} more`);
if (strict && hits.length > 0) process.exit(1);
