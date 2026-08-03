import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('src/main/java');

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith('.java')) out.push(p);
  }
  return out;
}

function ensureLogger(content, className) {
  if (!content.includes('.printStackTrace()')) return content;
  if (!content.includes('import org.jboss.logging.Logger;')) {
    const pkgEnd = content.indexOf('\n', content.indexOf('package '));
    const importBlock = content.indexOf('\nimport ', pkgEnd);
    if (importBlock >= 0) {
      content =
        content.slice(0, importBlock + 1) +
        'import org.jboss.logging.Logger;\n' +
        content.slice(importBlock + 1);
    }
  }
  if (!content.includes('private static final Logger LOG')) {
    const re = /public (?:final )?class (\w+)[^{]*\{/;
    const m = content.match(re);
    if (m) {
      const idx = content.indexOf('{', content.indexOf('class ' + m[1]));
      content =
        content.slice(0, idx + 1) +
        `\n\n    private static final Logger LOG = Logger.getLogger(${m[1]}.class);` +
        content.slice(idx + 1);
    }
  }
  return content;
}

function convertFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('.printStackTrace()')) return false;
  const className = path.basename(file, '.java');
  content = ensureLogger(content, className);
  const lines = content.split('\n');
  let changed = false;
  const out = lines.map((line) => {
    const m = line.match(/^(\s*)(\w+)\.printStackTrace\(\);\s*$/);
    if (!m) return line;
    changed = true;
    return `${m[1]}LOG.warnf(${m[2]}, "Erro inesperado");`;
  });
  if (changed) {
    fs.writeFileSync(file, out.join('\n'), 'utf8');
    console.log('updated', file);
  }
  return changed;
}

let n = 0;
for (const f of walk(root)) {
  if (convertFile(f)) n++;
}
console.log('files updated:', n);
