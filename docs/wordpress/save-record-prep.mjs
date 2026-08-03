import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const n = Number(process.argv[2]);
const viewId = process.argv[3] || 'b83599';
const out = execSync(`node record-step-result.mjs ${n}`, { cwd: dir, encoding: 'utf8' });
const rec = JSON.parse(out.trim());
if (!rec.ok) {
  console.log(out.trim());
  process.exit(1);
}
if (n < 29) {
  const boot = execSync(`node prep-expr-bootstrap.mjs ${viewId} ${n + 1}`, { cwd: dir, encoding: 'utf8' }).trim();
  console.log(JSON.stringify({ recorded: n, next: n + 1, record: rec, ready: true }));
} else {
  const summary = execSync(`node agent-cdp-step.mjs summary ${viewId}`, { cwd: dir, encoding: 'utf8' }).trim();
  console.log(summary);
}
