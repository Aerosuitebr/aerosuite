/**
 * Run MCP steps [start,end) — agent must call browser_cdp per printed INVOKE block.
 * After each MCP response, agent writes .cdp-mcp-result.json then:
 *   node run-mcp-indices.mjs continue <viewId> <index>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const cmd = process.argv[2];
const viewId = process.argv[3] || '5c671d';
const manifestPath = path.join(dir, '.invoke-steps-manifest.json');

if (!fs.existsSync(manifestPath)) {
  execSync(`node gen-invoke-steps.mjs ${viewId}`, { cwd: dir, stdio: 'inherit' });
}
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

if (cmd === 'continue') {
  const idx = Number(process.argv[4]);
  const rel = manifest.steps[idx].replace(/\\/g, '/');
  const out = execSync(`node record-step-result.mjs ${idx}`, { cwd: dir, encoding: 'utf8' });
  const parsed = JSON.parse(out);
  if (parsed.stopped) {
    console.log(JSON.stringify({ stopped: true, idx, rel, out: parsed }));
    process.exit(1);
  }
  const next = idx + 1;
  if (next >= manifest.count) {
    const summary = execSync(`node agent-cdp-step.mjs summary ${viewId}`, { cwd: dir, encoding: 'utf8' });
    console.log('FINAL', summary.trim());
    process.exit(0);
  }
  process.argv[2] = 'invoke';
  process.argv[4] = String(next);
}

if (cmd === 'invoke' || cmd === 'continue') {
  const idx = Number(process.argv[4] ?? 0);
  if (cmd === 'invoke' && idx === 0) {
    execSync('node mcp-deploy-runner.mjs reset', { cwd: dir, stdio: 'inherit' });
  }
  const args = fs.readFileSync(path.join(dir, `.invoke-step-${idx}.json`), 'utf8');
  fs.writeFileSync(path.join(dir, '.cdp-current-step.json'), JSON.stringify({ idx, rel: manifest.steps[idx], args: JSON.parse(args) }));
  console.log(`INVOKE_INDEX ${idx} ${manifest.steps[idx]}`);
  process.exit(0);
}

console.error('usage: invoke|continue <viewId> [index]');
process.exit(2);
