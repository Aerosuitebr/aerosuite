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

function escapeFmt(s) {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/%/g, '%%');
}

function convertArg(arg) {
  arg = arg.trim();
  if (arg.startsWith('"') && arg.endsWith('"') && !arg.slice(1, -1).includes('"')) {
    return { kind: 'plain', msg: escapeFmt(arg.slice(1, -1)) };
  }
  const parts = [];
  let rest = arg;
  while (rest.length) {
    rest = rest.trim();
    if (rest.startsWith('"')) {
      let i = 1;
      let s = '';
      while (i < rest.length) {
        if (rest[i] === '\\') {
          s += rest[i] + rest[i + 1];
          i += 2;
        } else if (rest[i] === '"') {
          break;
        } else {
          s += rest[i++];
        }
      }
      parts.push({ type: 'str', value: s });
      rest = rest.slice(i + 1).trim();
      if (rest.startsWith('+')) rest = rest.slice(1);
    } else {
      const m = rest.match(/^([^+]+)(?:\s*\+\s*)?/);
      const expr = m[1].trim();
      parts.push({ type: 'expr', value: expr });
      rest = rest.slice(m[0].length).trim();
      if (rest.startsWith('+')) rest = rest.slice(1);
    }
  }
  if (parts.length === 1 && parts[0].type === 'str') {
    return { kind: 'plain', msg: escapeFmt(parts[0].value) };
  }
  let msg = '';
  const exprs = [];
  for (const p of parts) {
    if (p.type === 'str') msg += escapeFmt(p.value);
    else {
      if (!msg.endsWith('%s') && !msg.endsWith(' ')) msg += ' ';
      if (!msg.endsWith('%s')) msg += '%s';
      exprs.push(p.value);
    }
  }
  const ex = exprs.find((e) => /\.getMessage\(\)/.test(e));
  return { kind: 'fmt', msg, exprs, ex };
}

function ensureLogger(content, className) {
  if (!/System\.err\.println/.test(content)) return content;
  if (!content.includes('import org.jboss.logging.Logger;')) {
    const pkgEnd = content.indexOf('\n', content.indexOf('package '));
    const importBlock = content.indexOf('\nimport ', pkgEnd);
    if (importBlock >= 0) {
      content =
        content.slice(0, importBlock + 1) +
        'import org.jboss.logging.Logger;\n' +
        content.slice(importBlock + 1);
    } else {
      content = content.slice(0, pkgEnd + 1) + '\nimport org.jboss.logging.Logger;\n' + content.slice(pkgEnd + 1);
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
  if (!content.includes('System.err.println')) return false;
  const className = path.basename(file, '.java');
  content = ensureLogger(content, className);
  const lines = content.split('\n');
  let changed = false;
  const out = lines.map((line) => {
    const m = line.match(/^(\s*)System\.err\.println\((.+)\);\s*$/);
    if (!m) return line;
    changed = true;
    const indent = m[1];
    const conv = convertArg(m[2]);
    if (conv.kind === 'plain') return `${indent}LOG.warn("${conv.msg}");`;
    if (conv.ex) {
      const exVar = conv.ex.split('.')[0];
      return `${indent}LOG.warnf(${exVar}, "${conv.msg}", ${conv.exprs.join(', ')});`;
    }
    return `${indent}LOG.warnf("${conv.msg}", ${conv.exprs.join(', ')});`;
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
