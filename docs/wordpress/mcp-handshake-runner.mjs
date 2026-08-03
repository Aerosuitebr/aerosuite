/**
 * Handshake runner for prepared MCP files.
 * node mcp-handshake-runner.mjs start [viewId] [fromIndex]
 * node mcp-handshake-runner.mjs ack <index> <resultJsonPath>
 * node mcp-handshake-runner.mjs status
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const hsPath = path.join(dir, '.mcp-handshake.json');
const seqScript = path.join(dir, 'run-prepared-mcp-sequence.mjs');

function loadHs() {
  return JSON.parse(fs.readFileSync(hsPath, 'utf8'));
}

function saveHs(h) {
  fs.writeFileSync(hsPath, JSON.stringify(h, null, 2));
}

function extractValue(r) {
  return r?.result?.value ?? r?.result?.result?.value ?? r?.value ?? null;
}

const cmd = process.argv[2];

if (cmd === 'start') {
  const viewId = process.argv[3] || 'f29abe';
  const from = Number(process.argv[4] ?? 0);
  const total = Number(JSON.parse(execSync(`node "${seqScript}" list`, { encoding: 'utf8' })).count);
  saveHs({ viewId, index: from, total, status: 'need', argsPath: path.join(dir, '.mcp-call-args.json'), results: {} });
  execSync(`node "${seqScript}" args ${from} ${viewId}`, { stdio: 'inherit' });
  console.log(JSON.stringify({ status: 'need', index: from, total }));
  process.exit(0);
}

if (cmd === 'ack') {
  const idx = Number(process.argv[3]);
  const resultPath = process.argv[4];
  const hs = loadHs();
  const raw = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
  const value = extractValue(raw);
  hs.results[idx] = value;
  const next = idx + 1;
  if (next >= hs.total) {
    hs.status = 'complete';
    hs.index = next;
    saveHs(hs);
    execSync(`node "${seqScript}" record ${idx} "${resultPath}"`, { stdio: 'inherit' });
    console.log(JSON.stringify({ status: 'complete', index: idx, value }));
    process.exit(0);
  }
  execSync(`node "${seqScript}" record ${idx} "${resultPath}"`, { stdio: 'inherit' });
  execSync(`node "${seqScript}" args ${next} ${hs.viewId}`, { stdio: 'inherit' });
  hs.status = 'need';
  hs.index = next;
  saveHs(hs);
  console.log(JSON.stringify({ status: 'need', index: next, total: hs.total, prevValue: value }));
  process.exit(0);
}

if (cmd === 'status') {
  console.log(fs.readFileSync(hsPath, 'utf8'));
  process.exit(0);
}

console.error('usage: start [viewId] [from] | ack <index> <resultPath> | status');
process.exit(2);
