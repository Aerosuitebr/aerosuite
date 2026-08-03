/**
 * Gera aerosuite-seo-pages.php a partir de aerosuite-seo.mjs (fonte única).
 * Uso: node build-seo-php.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PAGE_SEO } from './aerosuite-seo.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(dir, 'plugins', 'aerosuite-performance', 'aerosuite-seo-pages.php');

function phpString(value) {
  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function buildPhpPageEntries() {
  return Object.entries(PAGE_SEO)
    .map(([key, seo]) => {
      const title = phpString(seo.title);
      const description = phpString(seo.description);
      const pagePath = phpString(seo.path);
      return `        '${key}' => [
            'title' => ${title},
            'description' => ${description},
            'path' => ${pagePath},
        ]`;
    })
    .join(',\n');
}

const generatedAt = new Date().toISOString();
const php = `<?php
/**
 * Gerado automaticamente por build-seo-php.mjs — NÃO EDITAR.
 * Fonte: aerosuite-seo.mjs (PAGE_SEO).
 * Gerado em: ${generatedAt}
 */
if (!defined('ABSPATH')) {
    exit;
}

function as_perf_page_seo_config() {
    return [
${buildPhpPageEntries()}
    ];
}
`;

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, php, 'utf8');
console.log('seo-php', outPath, `${php.length} bytes`, Object.keys(PAGE_SEO).join(','));
