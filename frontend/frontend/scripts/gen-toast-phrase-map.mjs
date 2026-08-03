/**
 * Extrai strings literais de summary e detail em messageService.add(...)
 * Gera toast-phrase-map.ts com mapa PT -> { enUS, esES, frFR } (EN traduzido; ES/FR = EN até revisão).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.join(__dirname, '..', 'src', 'app');

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, name.name);
    if (name.isDirectory()) {
      if (name.name === 'node_modules') continue;
      walk(p, acc);
    } else if (name.name.endsWith('.ts')) acc.push(p);
  }
  return acc;
}

/** Extrai strings entre aspas simples, respeitando escapes básicos */
function singleQuotedStrings(s) {
  const out = [];
  let i = 0;
  while (i < s.length) {
    const q = s.indexOf("'", i);
    if (q < 0) break;
    let j = q + 1;
    let buf = '';
    while (j < s.length) {
      const c = s[j];
      if (c === '\\') {
        buf += s[j + 1] || '';
        j += 2;
        continue;
      }
      if (c === "'") break;
      buf += c;
      j++;
    }
    if (j < s.length && s[j] === "'") {
      out.push(buf);
      i = j + 1;
    } else i = q + 1;
  }
  return out;
}

function extractAddBlocks(text) {
  const blocks = [];
  const re = /messageService\.add\s*\(\s*\{/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    let depth = 1;
    let i = m.index + m[0].length - 1;
    let start = i;
    while (i < text.length && depth > 0) {
      if (text[i] === '{') depth++;
      else if (text[i] === '}') depth--;
      i++;
    }
    blocks.push(text.slice(start, i - 1));
  }
  return blocks;
}

function isStaticToastFragment(str) {
  if (!str || str.length < 2 || str.length > 400) return false;
  if (str.includes('`') || str.includes('${') || str.includes('\n')) return false;
  if (str.includes("' +") || str.includes('+ ')) return false;
  return true;
}

/** Tradução mínima EN para frases muito comuns (fallback quando não há mapa) */
function toEnglish(pt) {
  const m = {
    Erro: 'Error',
    Sucesso: 'Success',
    Atenção: 'Warning',
    Aviso: 'Notice',
    Informação: 'Information',
    'Campos Obrigatórios': 'Required fields',
    'Perfil Obrigatório': 'Profile required'
  };
  if (m[pt]) return m[pt];
  if (pt.startsWith('Erro ao ')) return pt.replace(/^Erro ao /, 'Error ');
  if (pt.startsWith('Não foi possível ')) return pt.replace(/^Não foi possível /, 'Could not ');
  if (pt.endsWith(' com sucesso!')) return pt.replace(/ com sucesso!$/, ' successfully!');
  if (pt.endsWith(' com sucesso.')) return pt.replace(/ com sucesso\.$/, ' successfully.');
  return pt;
}

function toSpanish(en) {
  return en
    .replace(/^Error /, 'Error al ')
    .replace(/^Could not /, 'No se pudo ')
    .replace(/ successfully!$/, ' correctamente.')
    .replace(/ successfully\.$/, ' correctamente.');
}

function toFrench(en) {
  return en
    .replace(/^Error /, 'Erreur lors de ')
    .replace(/^Could not /, 'Impossible de ')
    .replace(/ successfully!$/, ' avec succès.')
    .replace(/ successfully\.$/, ' avec succès.');
}

const files = walk(appDir);
const summaries = new Set();
const details = new Set();

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  if (!text.includes('messageService.add')) continue;
  for (const block of extractAddBlocks(text)) {
    const sm = block.match(/summary:\s*'([^']*)'/);
    const sm2 = block.match(/summary:\s*"([^"]*)"/);
    const s = sm?.[1] ?? sm2?.[1];
    if (s && isStaticToastFragment(s)) summaries.add(s);
    const dm = block.match(/detail:\s*'([^']*)'/);
    const dm2 = block.match(/detail:\s*"([^"]*)"/);
    const d = dm?.[1] ?? dm2?.[1];
    if (d && isStaticToastFragment(d)) details.add(d);
  }
}

const all = new Set([...summaries, ...details]);
const sorted = [...all].sort();

const entries = sorted.map((pt) => {
  const en = toEnglish(pt);
  const es = toSpanish(en);
  const fr = toFrench(en);
  const key = JSON.stringify(pt);
  return `  ${key}: { enUS: ${JSON.stringify(en)}, esES: ${JSON.stringify(es)}, frFR: ${JSON.stringify(fr)} }`;
});

const out = `/* eslint-disable max-len */
/**
 * Mapa automático de frases PT (toasts/mensagens) → EN/ES/FR.
 * Gerado por scripts/gen-toast-phrase-map.mjs — pode afinar traduções manualmente.
 */
export type ToastPhraseRow = { enUS: string; esES: string; frFR: string };

export const TOAST_PHRASE_MAP: Record<string, ToastPhraseRow> = {
${entries.join(',\n')}
};
`;

const outPath = path.join(__dirname, '..', 'src', 'app', 'core', 'i18n', 'toast-phrase-map.generated.ts');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, out, 'utf8');
console.log('Wrote', outPath, 'keys:', sorted.length);
