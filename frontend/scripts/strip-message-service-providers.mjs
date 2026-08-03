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

function stripMessageServiceProviders(text) {
  let t = text;
  // providers: [MessageService],
  t = t.replace(/\n\s*providers:\s*\[\s*MessageService\s*\],?\s*\n/g, '\n');
  // providers: [MessageService, X] or [X, MessageService]
  t = t.replace(/providers:\s*\[\s*MessageService\s*,\s*/g, 'providers: [');
  t = t.replace(/,\s*MessageService\s*\]/g, ']');
  t = t.replace(/providers:\s*\[\s*MessageService\s*\]/g, 'providers: []');
  // clean providers: [],\n  -> remove empty providers line
  t = t.replace(/\n\s*providers:\s*\[\s*\],?\s*\n/g, '\n');
  return t;
}

let changed = 0;
for (const file of walk(appDir)) {
  const text = fs.readFileSync(file, 'utf8');
  if (!text.includes('providers:') || !text.includes('MessageService')) continue;
  const next = stripMessageServiceProviders(text);
  if (next !== text) {
    fs.writeFileSync(file, next, 'utf8');
    changed++;
    console.log('updated', path.relative(path.join(__dirname, '..'), file));
  }
}
console.log('files changed:', changed);
