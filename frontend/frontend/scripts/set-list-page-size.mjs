import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/app');

function walk(dir, files = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory() && e.name !== 'node_modules') walk(p, files);
    else if (e.isFile() && e.name.endsWith('.ts')) files.push(p);
  }
  return files;
}

function relImport(fromFile) {
  const fromDir = path.dirname(fromFile);
  const target = path.join(root, 'core/list-pagination.constants.ts');
  let rel = path.relative(fromDir, target).replace(/\\/g, '/');
  if (!rel.startsWith('.')) rel = './' + rel;
  return rel.replace(/\.ts$/, '');
}

function ensureImport(content, fromFile) {
  if (content.includes('list-pagination.constants')) return content;
  const imp = `import { DEFAULT_LIST_PAGE_SIZE, LIST_ROWS_PER_PAGE_OPTIONS } from '${relImport(fromFile)}';\n`;
  const m = content.match(/^import .+;\n/mg);
  if (!m) return imp + content;
  const last = m[m.length - 1];
  const idx = content.indexOf(last) + last.length;
  return content.slice(0, idx) + imp + content.slice(idx);
}

function ensureClassProps(content) {
  let c = content;
  const needsPageSize = /\[rows\]="listPageSize"/.test(c) || /listPageSize/.test(c);
  const needsOptions = /listRowsPerPageOptions/.test(c);
  if (!needsPageSize && !needsOptions) return c;
  if (c.includes('readonly listPageSize') && c.includes('readonly listRowsPerPageOptions')) return c;

  const inject = [];
  if (needsPageSize && !c.includes('readonly listPageSize')) {
    inject.push('  readonly listPageSize = DEFAULT_LIST_PAGE_SIZE;');
  }
  if (needsOptions && !c.includes('readonly listRowsPerPageOptions')) {
    inject.push('  readonly listRowsPerPageOptions = LIST_ROWS_PER_PAGE_OPTIONS;');
  }
  if (!inject.length) return c;

  return c.replace(/(export class \w+[^{]*\{)/, `$1\n${inject.join('\n')}\n`);
}

const files = walk(root).filter((f) => {
  const c = fs.readFileSync(f, 'utf8');
  if (f.includes('list-pagination.constants')) return false;
  return (
    /\[paginator\]="true"/.test(c) ||
    /paginator]="true"/.test(c) ||
    /rowsPerPageOptions/.test(c) ||
    /\bpageSize\s*=\s*\d+/.test(c) ||
    (/\bsize\s*=\s*\d+/.test(c) && /p-table|pTable|TableModule|appListScroll/.test(c))
  );
});

for (const file of files) {
  let c = fs.readFileSync(file, 'utf8');
  const orig = c;

  c = ensureImport(c, file);

  c = c.replace(/\bsize\s*=\s*\d+/g, 'size = DEFAULT_LIST_PAGE_SIZE');
  c = c.replace(/\bpageSize\s*=\s*\d+/g, 'pageSize = DEFAULT_LIST_PAGE_SIZE');
  c = c.replace(/\bpageSizeLegado\s*=\s*\d+/g, 'pageSizeLegado = DEFAULT_LIST_PAGE_SIZE');

  c = c.replace(/\[rowsPerPageOptions\]="\[[^\]]+\]"/g, '[rowsPerPageOptions]="listRowsPerPageOptions"');
  c = c.replace(/\[rows\]="(10|15|20|50)"/g, '[rows]="listPageSize"');

  c = c.replace(/\brows:\s*(10|15|20|30|50)\b/g, 'rows: DEFAULT_LIST_PAGE_SIZE');
  c = c.replace(/\?\?\s*(10|15|20|30|50)\b/g, '?? DEFAULT_LIST_PAGE_SIZE');
  c = c.replace(/\|\|\s*(10|15|20|30|50)\b/g, '|| DEFAULT_LIST_PAGE_SIZE');

  c = c.replace(/\(this\.pageIndex \|\| 0\) \* \(this\.size \|\| 5\)/g, '(this.pageIndex || 0) * (this.size || DEFAULT_LIST_PAGE_SIZE)');
  c = c.replace(/this\.size \|\| 5/g, 'this.size || DEFAULT_LIST_PAGE_SIZE');

  c = ensureClassProps(c);

  if (c !== orig) {
    fs.writeFileSync(file, c);
    console.log('updated', path.relative(root, file));
  }
}
