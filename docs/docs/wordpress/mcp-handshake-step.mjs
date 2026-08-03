/**
 * Agent helper: reads .cdp-mcp-call-min.json, agent calls browser_cdp, then:
 * node mcp-handshake-step.mjs write '<json>'
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const cmd = process.argv[2];

if (cmd === 'read') {
  const raw = fs.readFileSync(path.join(dir, '.cdp-mcp-call-min.json'), 'utf8');
  process.stdout.write(raw);
  process.exit(0);
}

if (cmd === 'write') {
  const raw = process.argv[3] || fs.readFileSync(0, 'utf8');
  fs.writeFileSync(path.join(dir, '.cdp-mcp-result.json'), raw);
  const j = JSON.parse(raw);
  const v = j?.result?.value ?? j?.value;
  console.log(JSON.stringify({ ok: true, value: v }));
  process.exit(0);
}

console.error('read | write [json]');
process.exit(2);
