#!/usr/bin/env node
/**
 * QA: documentação OpenAPI centralizada em OpenApiDescriptions (inglês, dev-facing).
 *
 * Falha se @Parameter/@Operation/@APIResponse/@Tag usar description/summary literal
 * em vez de constante OpenApiDescriptions.*.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const javaRoot = path.join(root, 'backend/src/main/java');

const annoRe = /@(Parameter|Operation|APIResponse|Tag)\s*\(/;
const inlineDescRe = /(?:description|summary)\s*=\s*"/;

let inlineTotal = 0;
const samples = [];

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (ent.name.endsWith('.java')) {
      const rel = path.relative(root, p).replace(/\\/g, '/');
      const src = fs.readFileSync(p, 'utf8');
      let i = 0;
      while (i < src.length) {
        const idx = src.indexOf('@', i);
        if (idx < 0) break;
        const slice = src.slice(idx, idx + 80);
        if (!annoRe.test(slice)) {
          i = idx + 1;
          continue;
        }
        const end = src.indexOf(')', idx);
        if (end < 0) break;
        const block = src.slice(idx, end + 1);
        if (inlineDescRe.test(block) && !block.includes('OpenApiDescriptions')) {
          inlineTotal++;
          if (samples.length < 8) {
            const line = src.slice(0, idx).split('\n').length;
            samples.push(`${rel}:${line}`);
          }
        }
        i = end + 1;
      }
    }
  }
}

walk(javaRoot);

console.log('=== i18n QA — OpenAPI centralizado ===');
console.log(`Anotações OpenAPI com description/summary literal: ${inlineTotal}`);

if (samples.length) {
  console.log('\nAmostra:');
  for (const s of samples) console.log(`  ${s}`);
}

if (inlineTotal === 0) {
  console.log('\n✓ Toda a documentação OpenAPI usa OpenApiDescriptions (inglês).');
} else {
  console.log('\n✗ Migrar strings inline para backend/.../openapi/OpenApiDescriptions.java');
}

process.exit(inlineTotal > 0 ? 1 : 0);
