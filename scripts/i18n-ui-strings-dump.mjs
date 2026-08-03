#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const ptStrongRe =
  /[àáâãéêíóôõúçÀÁÂÃÉÊÍÓÔÕÚÇ]|(\bNão foi\b|\bErro ao\b|\bErro de\b|\bFalha ao\b|\bVerifique se\b|\bobrigatório\b|\binválid[oa]\b|\bconexão\b|\btente novamente\b)/i;
const skipFile = (rel) =>
  rel.includes('-i18n.ts') ||
  rel.includes('/core/i18n/') ||
  rel.includes('/core/domain/') ||
  rel.endsWith('.spec.ts') ||
  rel.endsWith('translation.service.ts');
const skipLine = (line) => {
  const t = line.trim();
  if (!t || t.startsWith('//') || t.startsWith('*')) return true;
  if (/console\./.test(line)) return true;
  if (/\|\s*translate/.test(line) || /translate\s*\(\s*['"`]/.test(line)) return true;
  if (/translateApi(Error|Message)/.test(line)) return true;
  if (/addToast\s*\(|toastKey\s*\(|buildTranslatedOptions\s*\(/.test(line)) return true;
  if (/label:\s*['"][A-Z0-9_]+['"]/.test(line)) return true;
  return false;
};
const isLikelyNonUi = (s) =>
  s.length < 8 ||
  /^\//.test(s) ||
  s.includes('${') ||
  (/^[a-z][\w.-]*$/.test(s) && !/[àáâãéêíóôõúç]/i.test(s)) ||
  (/^[\w-]+$/.test(s) && s.includes('-'));
const stringRe = /(['"`])((?:\\.|(?!\1)[^\\])*)\1/g;
const files = execSync('git ls-files frontend/src/app', { cwd: root, encoding: 'utf8' })
  .split(/\n/)
  .filter((f) => (f.endsWith('.ts') || f.endsWith('.html')) && !skipFile(f));
const hits = [];
for (const f of files) {
  const fp = path.join(root, f);
  if (!fs.existsSync(fp)) continue;
  fs.readFileSync(fp, 'utf8')
    .split(/\n/)
    .forEach((line, idx) => {
      if (skipLine(line)) return;
      for (const m of line.matchAll(stringRe)) {
        const s = m[2];
        if (isLikelyNonUi(s) || !ptStrongRe.test(s)) continue;
        hits.push(`${f}:${idx + 1}: ${JSON.stringify(s.slice(0, 100))}`);
      }
    });
}
console.log('Total:', hits.length);
hits.forEach((h) => console.log(h));
