/**
 * Agent helper: process .cdp-mcp-batch.json one call at a time.
 * Usage: node cdp-mcp-batch-agent.mjs current   -> stdout current call JSON
 *        node cdp-mcp-batch-agent.mjs append <responseFile>
 *        node cdp-mcp-batch-agent.mjs status
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const batchPath = path.join(dir, '.cdp-mcp-batch.json');
const resultsPath = path.join(dir, '.cdp-mcp-batch-results.json');
const cmd = process.argv[2];

function loadBatch() {
  return JSON.parse(fs.readFileSync(batchPath, 'utf8'));
}

function loadResults() {
  if (!fs.existsSync(resultsPath)) return [];
  return JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
}

if (cmd === 'current') {
  const b = loadBatch();
  const results = loadResults();
  const idx = results.length;
  if (idx >= b.calls.length) {
    console.log(JSON.stringify({ done: true, step: b.step, total: b.calls.length }));
    process.exit(0);
  }
  console.log(JSON.stringify({ step: b.step, index: idx, total: b.calls.length, call: b.calls[idx] }));
  process.exit(0);
}

if (cmd === 'append') {
  const respFile = path.resolve(process.argv[3]);
  const raw = fs.readFileSync(respFile, 'utf8');
  JSON.parse(raw);
  const results = loadResults();
  results.push(JSON.parse(raw));
  fs.writeFileSync(resultsPath, JSON.stringify(results));
  const b = loadBatch();
  console.log(JSON.stringify({ step: b.step, index: results.length, total: b.calls.length, complete: results.length >= b.calls.length }));
  process.exit(0);
}

if (cmd === 'status') {
  const b = loadBatch();
  const results = loadResults();
  console.log(JSON.stringify({ step: b.step, done: results.length, total: b.calls.length }));
  process.exit(0);
}

console.error('usage: current|append|status');
process.exit(2);
