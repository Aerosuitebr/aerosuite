/**
 * Extrai chamadas messageService.add({ ... }) de .ts para revisão i18n.
 * Uso: node scripts/extract-toasts.mjs
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
    } else if (name.name.endsWith('.component.ts') || name.name.endsWith('.service.ts')) {
      acc.push(p);
    }
  }
  return acc;
}

const files = walk(appDir);
const rows = [];
const re = /messageService\.add\s*\(\s*\{([^}]+)\}/gs;

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  if (!text.includes('messageService.add')) continue;
  let m;
  while ((m = re.exec(text)) !== null) {
    const body = m[1].replace(/\s+/g, ' ').trim().slice(0, 200);
    rows.push({ file: path.relative(path.join(__dirname, '..'), file), snippet: body });
  }
}

console.log(JSON.stringify({ count: rows.length, samples: rows.slice(0, 30) }, null, 2));
