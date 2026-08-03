/**
 * Builds minimal MCP groups from cdp-invocations.jsonl and writes cdp-groups/*.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const inv = fs
  .readFileSync(path.join(dir, 'cdp-invocations.jsonl'), 'utf8')
  .trim()
  .split('\n')
  .filter(Boolean)
  .map((l) => JSON.parse(l));

const groups = [];
let cur = [];
let curLen = 0;
const MAX = 28000;

function flush() {
  if (!cur.length) return;
  groups.push([...cur]);
  cur = [];
  curLen = 0;
}

for (let i = 0; i < inv.length; i++) {
  const s = inv[i];
  const len = s.expression.length;
  if (s.awaitPromise || curLen + len > MAX || cur.some((j) => inv[j].awaitPromise)) {
    flush();
  }
  if (s.awaitPromise) {
    cur = [i];
    curLen = len;
    flush();
    continue;
  }
  if (curLen + len > MAX) flush();
  cur.push(i);
  curLen += len;
}
flush();

const outDir = path.join(dir, 'cdp-groups');
fs.mkdirSync(outDir, { recursive: true });
const manifest = [];

for (let gi = 0; gi < groups.length; gi++) {
  const idxs = groups[gi];
  const hasAsync = idxs.some((i) => inv[i].awaitPromise);
  const body = idxs
    .map((i) => {
      const s = inv[i];
      const e = s.expression.trim();
      return s.awaitPromise
        ? `out.push({i:${i},batch:${JSON.stringify(s.batch)},value:await (${e})});`
        : `out.push({i:${i},batch:${JSON.stringify(s.batch)},value:(${e})});`;
    })
    .join('\n');
  const expression = hasAsync
    ? `(async function(){const out=[];${body}return out;})()`
    : `(function(){const out=[];${body}return out;})()`;
  const file = `group-${String(gi).padStart(2, '0')}.json`;
  const payload = {
    group: gi,
    indexes: idxs,
    awaitPromise: hasAsync,
    length: expression.length,
    expression,
  };
  fs.writeFileSync(path.join(outDir, file), JSON.stringify(payload));
  manifest.push({ group: gi, file, indexes: idxs, awaitPromise: hasAsync, length: expression.length });
}

fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log('groups', groups.length);
manifest.forEach((m) => console.log(m.group, m.indexes.join(','), m.length, m.awaitPromise));
