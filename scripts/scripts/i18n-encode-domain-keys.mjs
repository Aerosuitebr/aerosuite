#!/usr/bin/env node
/**
 * Wraps raw domain i18n keys in throws with ApiI18nMessages.domain("key").
 * Keys: lowercase segments with dots, no spaces (ex. hangar.error.foo).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'backend', 'src', 'main', 'java');

const EXCEPTION_TYPES = [
  'BadRequestException',
  'NotFoundException',
  'IllegalStateException',
  'IllegalArgumentException',
  'RuntimeException',
  'ForbiddenException',
  'InternalServerErrorException',
];

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (ent.name.endsWith('.java')) out.push(p);
  }
  return out;
}

const domainKeyRe = /^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$/;

function processFile(file) {
  let src = fs.readFileSync(file, 'utf8');
  const orig = src;
  let changed = false;

  for (const ex of EXCEPTION_TYPES) {
    const re = new RegExp(
      `throw new ${ex}\\("([a-z][a-z0-9_.]*)"(\\))`,
      'g'
    );
    src = src.replace(re, (match, key, end) => {
      if (!domainKeyRe.test(key) || key.startsWith('api.')) return match;
      if (match.includes('ApiI18nMessages')) return match;
      changed = true;
      return `throw new ${ex}(ApiI18nMessages.domain("${key}")${end}`;
    });
  }

  // proposta.* keys
  for (const ex of EXCEPTION_TYPES) {
    const re = new RegExp(
      `throw new ${ex}\\("(proposta\\.[a-z0-9_.]+)"(\\))`,
      'g'
    );
    src = src.replace(re, (match, key, end) => {
      if (match.includes('ApiI18nMessages')) return match;
      changed = true;
      return `throw new ${ex}(ApiI18nMessages.domain("${key}")${end}`;
    });
  }

  if (changed) {
    if (!src.includes('import com.aerosuite.i18n.ApiI18nMessages;')) {
      const pkg = src.match(/^package [\w.]+;/m);
      if (pkg) {
        src = src.replace(pkg[0], pkg[0] + '\n\nimport com.aerosuite.i18n.ApiI18nMessages;');
      }
    }
    fs.writeFileSync(file, src);
    console.log('updated:', path.relative(root, file));
  }
}

for (const f of walk(root)) {
  if (f.includes(`${path.sep}i18n${path.sep}`)) continue;
  processFile(f);
}
