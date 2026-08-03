/**
 * Falha se aerosuite-seo-pages.php estiver desatualizado em relação a aerosuite-seo.mjs.
 * Uso: node build-seo-php.mjs && node verify-seo-php-sync.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import { PAGE_SEO } from './aerosuite-seo.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const phpPath = path.join(dir, 'plugins', 'aerosuite-performance', 'aerosuite-seo-pages.php');

const build = spawnSync(process.execPath, ['build-seo-php.mjs'], { cwd: dir, encoding: 'utf8' });
if (build.status !== 0) {
  console.error('build-seo-php failed');
  process.exit(1);
}

const php = fs.readFileSync(phpPath, 'utf8');
const errors = [];

for (const [key, seo] of Object.entries(PAGE_SEO)) {
  for (const field of ['title', 'description', 'path']) {
    const value = seo[field];
    if (!php.includes(value)) {
      errors.push(`${key}.${field} missing in generated PHP`);
    }
  }
}

if (errors.length) {
  console.error('SEO_PHP_OUT_OF_SYNC', errors);
  process.exit(1);
}

console.log('SEO_PHP_SYNC_OK', Object.keys(PAGE_SEO).join(', '));
