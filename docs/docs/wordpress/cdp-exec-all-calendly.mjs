#!/usr/bin/env node
/** Prints MCP browser_cdp invocations as JSON lines for agent (chunk index optional). */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const only = process.argv[2] != null ? Number(process.argv[2]) : null;

const files = [];
for (let i = 0; i < 7; i++) files.push(`.cdp-calendly-arg-${i}.json`);
files.push('.cdp-calendly-arg-run.json');

const list = only != null ? [files[only]] : files;
for (const f of list) {
  const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  console.log(JSON.stringify({ file: f, args: j }));
}
