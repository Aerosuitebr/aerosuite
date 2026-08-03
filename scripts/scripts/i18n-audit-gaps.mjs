#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const root = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const javaRoot = path.join(root, 'backend', 'src', 'main', 'java');
const i18nDir = path.join(root, 'frontend', 'src', 'app', 'core', 'i18n');

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (ent.name.endsWith('.java')) out.push(p);
  }
  return out;
}

function loadDictText() {
  let text = '';
  for (const ent of fs.readdirSync(i18nDir, { withFileTypes: true })) {
    if (ent.name.endsWith('.ts')) text += fs.readFileSync(path.join(i18nDir, ent.name), 'utf8');
  }
  // module-level *-i18n.ts elsewhere
  const extra = execSync('git ls-files frontend/src/app', { cwd: root, encoding: 'utf8' })
    .split(/\n/)
    .filter((f) => f.endsWith('-i18n.ts'));
  for (const f of extra) text += fs.readFileSync(path.join(root, f), 'utf8');
  return text;
}

const dictText = loadDictText();
const domainKeys = new Set();
const ptThrows = [];
const ptMessages = [];
const rawDomainThrows = [];

const ptRe = /[àáâãéêíóôõúçÀÁÂÃÉÊÍÓÔÕÚÇ]|(\bnão\b|\bNão\b|\bErro\b|\bFalha\b|\bobrigat|\binválid|\bencontrad|\bInforme\b|\bConfigure\b)/i;

for (const file of walk(javaRoot)) {
  const rel = path.relative(javaRoot, file).replace(/\\/g, '/');
  const src = fs.readFileSync(file, 'utf8');
  const lines = src.split('\n');

  for (const m of src.matchAll(/ApiI18nMessages\.domain\("([^"]+)"\)/g)) domainKeys.add(m[1]);
  for (const m of src.matchAll(/ApiI18nMessages\.encode\("([^"]+)"/g)) {
    if (!m[1].startsWith('api.')) domainKeys.add(m[1]);
  }

  lines.forEach((line, i) => {
    if (/throw new \w+/.test(line) && /"[^"]{3,}"/.test(line) && !line.includes('ApiI18nMessages') && !line.includes('AuthI18nCodes')) {
      if (ptRe.test(line) || /throw new \w+\("[a-z][a-z0-9_.]+"\)/.test(line)) {
        ptThrows.push(`${rel}:${i + 1}: ${line.trim()}`);
      }
    }
    if (/throw new \w+\("[a-z][a-z0-9_.]+"\)/.test(line) && !line.includes('ApiI18nMessages')) {
      rawDomainThrows.push(`${rel}:${i + 1}: ${line.trim()}`);
    }
    if (/\.(message|mensagem|mensagemErro|mensagemBloqueio)\s*=/.test(line) && /"[^"]{2,}"/.test(line) && !line.includes('ApiI18nMessages')) {
      if (ptRe.test(line) || !line.includes('i18n:')) ptMessages.push(`${rel}:${i + 1}: ${line.trim()}`);
    }
  });
}

const missingDomain = [...domainKeys].filter((k) => !isDomainKeyCovered(k, dictText)).sort();

function isDomainKeyCovered(key, dictText) {
  if (dictText.includes(`'${key}'`)) return true;
  if (key.startsWith('estoque.certificado.')) {
    const alt = key.replace('estoque.certificado.', 'estoque.cert.');
    if (dictText.includes(`'${alt}'`)) return true;
  }
  return false;
}

console.log('=== API keys (api.*) ===');
const apiJava = fs.readFileSync(path.join(javaRoot, 'com/aerosuite/i18n/ApiI18nMessages.java'), 'utf8');
const apiKeys = [...apiJava.matchAll(/=\s*"(api\.[^"]+)"/g)].map((m) => m[1]);
const apiBackend = fs.readFileSync(path.join(i18nDir, 'api-backend-i18n.ts'), 'utf8');
const missingApi = apiKeys.filter((k) => !apiBackend.includes(`'${k}'`));
console.log(`Total: ${apiKeys.length}, missing in api-backend-i18n: ${missingApi.length}`);

console.log('\n=== Domain keys (non api.*) ===');
console.log(`Used in backend: ${domainKeys.size}, missing in frontend i18n: ${missingDomain.length}`);
missingDomain.slice(0, 80).forEach((k) => console.log('  -', k));
if (missingDomain.length > 80) console.log(`  ... +${missingDomain.length - 80} more`);

console.log('\n=== Throws PT / raw (sample) ===');
[...new Set(ptThrows)].slice(0, 30).forEach((l) => console.log(l));
if (ptThrows.length > 30) console.log(`... +${ptThrows.length - 30} more`);

console.log('\n=== Raw domain throws without ApiI18nMessages ===');
[...new Set(rawDomainThrows)].slice(0, 20).forEach((l) => console.log(l));

console.log('\n=== .message / .mensagem PT literals (sample) ===');
[...new Set(ptMessages)].slice(0, 40).forEach((l) => console.log(l));
if (ptMessages.length > 40) console.log(`... +${ptMessages.length - 40} more`);
