/**
 * Remove travessões (—) de cópia visível ao usuário.
 * Uso: node aerosuite-copy-normalize.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));

const FILES = [
  'aerosuite-content.mjs',
  'aerosuite-compliance-blocks.mjs',
  'aerosuite-shared-blocks.mjs',
  'aerosuite-contact-page.mjs',
  'aerosuite-portfolio.mjs',
  'aerosuite-clients.mjs',
  'aerosuite-solucoes-page.mjs',
  'aerosuite-conformidade-page.mjs',
  'aerosuite-sobre-page.mjs',
  'aerosuite-comparativo-page.mjs',
  'aerosuite-pillar-pages.mjs',
  'aerosuite-obrigado-page.mjs',
  'aerosuite-blog.mjs',
  'aerosuite-legal-pages.mjs',
  'aerosuite-schema.mjs',
  'aerosuite-seo.mjs',
  'aerosuite-site-config.mjs',
  'plugins/aerosuite-performance/aerosuite-performance.php',
];

/** Substitui travessão por pontuação adequada ao contexto. */
export function normalizeEmDash(text) {
  return (
    text
      // Títulos SEO: pipe em vez de travessão
      .replace(/\s+—\s+(?=[A-ZÀ-Ú])/g, ' | ')
      // Respostas curtas (Sim/Não)
      .replace(/\b(Sim|Não)\s+—\s+/g, '$1. ')
      // Demais ocorrências
      .replace(/\s+—\s+/g, ', ')
      .replace(/—/g, ', ')
      // Limpeza
      .replace(/,\s*,/g, ',')
      // Não colapsar spread (...foo) nem URLs
      .replace(/(?<!\.)\.\s+\.(?!\.)/g, '.')
      .replace(/,\s+\./g, '.')
  );
}

let total = 0;
for (const rel of FILES) {
  const file = path.join(dir, rel);
  if (!fs.existsSync(file)) continue;
  const before = fs.readFileSync(file, 'utf8');
  if (!before.includes('—')) continue;
  const after = normalizeEmDash(before);
  if (after !== before) {
    fs.writeFileSync(file, after);
    const n = (before.match(/—/g) || []).length;
    total += n;
    console.log('OK', rel, n);
  }
}
console.log('NORMALIZE_OK', total, 'travessões');
