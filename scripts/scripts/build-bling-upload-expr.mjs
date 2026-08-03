import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const svg = readFileSync(resolve(root, 'aerosuite-bling.svg'), 'utf8');
const expr = `(async () => {
  const svg = ${JSON.stringify(svg)};
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const file = new File([blob], 'aerosuite.svg', { type: 'image/svg+xml' });
  const input = document.querySelector('input.qq-file-input');
  if (!input) return { ok: false, error: 'no input' };
  const dt = new DataTransfer();
  dt.items.add(file);
  input.files = dt.files;
  input.dispatchEvent(new Event('change', { bubbles: true }));
  input.dispatchEvent(new Event('input', { bubbles: true }));
  return { ok: true, size: file.size, type: file.type };
})()`;
writeFileSync(resolve(root, 'docs/wordpress/.bling-upload-expr.txt'), expr, 'utf8');
console.log('bytes', expr.length);
