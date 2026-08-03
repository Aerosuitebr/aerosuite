import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = Number(process.argv[2]);
const viewId = process.argv[3] || '1031af';
const raw = process.argv[4];
if (!raw) {
  console.error('usage: node .cdp-save-mcp-result.mjs <n> <viewId> <json-string-or-file>');
  process.exit(2);
}
const json = raw.startsWith('{') ? raw : fs.readFileSync(raw, 'utf8');
fs.mkdirSync(path.join(dir, '.cdp-mcp-results'), { recursive: true });
fs.writeFileSync(path.join(dir, `.cdp-mcp-results/${n}.json`), json, 'utf8');
const j = JSON.parse(json);
const val = j?.result?.value ?? j?.value;
console.log(JSON.stringify({ step: n, ok: !j?.exceptionDetails, value: val }));
