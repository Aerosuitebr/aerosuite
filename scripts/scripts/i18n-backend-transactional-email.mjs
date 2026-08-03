#!/usr/bin/env node
/**
 * QA: e-mails transacionais com locale do destinatário (4 locales em TransactionalEmailMessages).
 *
 * - EmailService não deve fixar "pt-BR" nos envios (exceto default de config suporte.responsavel.locale).
 * - TransactionalEmailMessages: cada template público cobre en-US, es-ES e fr-FR.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const emailService = path.join(root, 'backend/src/main/java/com/aerosuite/service/EmailService.java');
const transactional = path.join(
  root,
  'backend/src/main/java/com/aerosuite/i18n/TransactionalEmailMessages.java'
);

let failures = 0;

function fail(msg) {
  console.log(`  ✗ ${msg}`);
  failures++;
}

function ok(msg) {
  console.log(`  ✓ ${msg}`);
}

console.log('=== i18n QA — e-mails transacionais ===');

const esSrc = fs.readFileSync(emailService, 'utf8');
const ptBrHits = esSrc
  .split('\n')
  .map((line, i) => ({ line, n: i + 1 }))
  .filter(
    ({ line }) =>
      line.includes('"pt-BR"') &&
      !line.includes('suporte.responsavel.locale') &&
      !line.trim().startsWith('//')
  );

if (ptBrHits.length) {
  for (const h of ptBrHits.slice(0, 8)) {
    fail(`EmailService.java:${h.n} locale fixo pt-BR — use UserLocaleResolver`);
  }
  if (ptBrHits.length > 8) {
    fail(`… e mais ${ptBrHits.length - 8} ocorrências`);
  }
} else {
  ok('EmailService sem locale pt-BR hardcoded nos envios');
}

const txSrc = fs.readFileSync(transactional, 'utf8');
const methodRe = /public static EmailContent (\w+)\(/g;
const templates = [];
for (const m of txSrc.matchAll(methodRe)) {
  templates.push(m[1]);
}

function methodBlock(name) {
  const start = txSrc.indexOf(`public static EmailContent ${name}(`);
  if (start < 0) return '';
  const next = txSrc.indexOf('public static EmailContent ', start + 1);
  return txSrc.slice(start, next > start ? next : txSrc.length);
}

function blockHasFourLocales(block) {
  if (['case "en-US"', 'case "es-ES"', 'case "fr-FR"'].every((c) => block.includes(c))) {
    return true;
  }
  const delegate = block.match(/return\s+(\w+)\s*\(/);
  if (!delegate) return false;
  const helper = delegate[1];
  const helperRe = new RegExp(`(?:private\\s+)?static\\s+EmailContent\\s+${helper}\\s*\\(`);
  const helperMatch = helperRe.exec(txSrc);
  if (!helperMatch) return false;
  const helperStart = helperMatch.index;
  const searchFrom = helperStart + helperMatch[0].length;
  const helperNext = txSrc.indexOf('static EmailContent ', searchFrom);
  const helperBlock = txSrc.slice(helperStart, helperNext > helperStart ? helperNext : helperStart + 12000);
  return ['case "en-US"', 'case "es-ES"', 'case "fr-FR"'].every((c) => helperBlock.includes(c));
}

const missingLocales = [];
for (const name of templates) {
  const block = methodBlock(name);
  if (!blockHasFourLocales(block)) {
    missingLocales.push(name);
  }
}

if (missingLocales.length) {
  for (const name of missingLocales.slice(0, 10)) {
    fail(`TransactionalEmailMessages.${name} sem cobertura en/es/fr`);
  }
} else {
  ok(`${templates.length} templates transacionais com en/es/fr`);
}

console.log(`\nTemplates: ${templates.length} | Falhas: ${failures}`);
process.exit(failures > 0 ? 1 : 0);
