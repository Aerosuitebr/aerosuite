/**
 * Loop steps via MCP: reads _invoke-step-{i}.json, writes compact result log.
 * Agent must call browser_cdp for each step using _invoke-step-{i}.json contents.
 * This script validates buffer lengths after manual/agent MCP runs by re-evaluating length.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || 'b46d46';
const start = Number(process.argv[3] ?? 3);
const end = Number(process.argv[4] ?? 14);

const manifest = [];
for (let i = start; i <= end; i++) {
  const invokePath = path.join(dir, `_invoke-step-${i}.json`);
  if (!fs.existsSync(invokePath)) {
    console.error('MISSING', invokePath);
    process.exit(1);
  }
  const invoke = JSON.parse(fs.readFileSync(invokePath, 'utf8'));
  manifest.push({
    index: i,
    invokePath,
    viewId: invoke.viewId,
    awaitPromise: invoke.params.awaitPromise,
    exprLen: invoke.params.expression.length,
  });
}
console.log(JSON.stringify(manifest, null, 2));
