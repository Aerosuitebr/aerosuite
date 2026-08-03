/**
 * Bridge for agent MCP loop: reads step args, signals which step needs MCP.
 * Usage:
 *   node cdp-agent-bridge.mjs prepare <n> [viewId]  -> writes .cdp-mcp-invoke.json
 *   node cdp-agent-bridge.mjs record <n> <resultPath>
 *   node cdp-agent-bridge.mjs run <start> <end> [viewId]  -> serial prepare/await/record loop (agent fills .cdp-mcp-result.json)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const cmd = process.argv[2];
const viewId = (n) => process.argv[n] || '7c1495';

function argsPath(n) {
  return path.join(dir, `.cdp-step-${n}-args.json`);
}

function loadArgs(n, vid) {
  const p = argsPath(n);
  if (!fs.existsSync(p)) {
    execSync(`node .cdp-agent-one-mcp.mjs ${n} ${vid}`, { cwd: dir, stdio: 'pipe' });
  }
  const a = JSON.parse(fs.readFileSync(p, 'utf8'));
  a.viewId = vid;
  return a;
}

if (cmd === 'prepare') {
  const n = Number(process.argv[3]);
  const vid = viewId(4);
  const args = loadArgs(n, vid);
  fs.writeFileSync(path.join(dir, '.cdp-mcp-invoke.json'), JSON.stringify(args));
  fs.writeFileSync(path.join(dir, '.cdp-needs-mcp-step'), String(n));
  console.log(JSON.stringify({ step: n, viewId: vid, exprLen: args.params?.expression?.length ?? 0 }));
  process.exit(0);
}

if (cmd === 'record') {
  const n = Number(process.argv[3]);
  const resultPath = path.resolve(process.argv[4]);
  const out = execSync(`node apply-step-result.mjs ${n} "${resultPath.replace(/\\/g, '/')}"`, {
    cwd: dir,
    encoding: 'utf8',
  });
  console.log(out.trim());
  process.exit(0);
}

if (cmd === 'run') {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const start = Number(process.argv[3] ?? 0);
  const end = Number(process.argv[4] ?? 29);
  const vid = viewId(5);
  const invokePath = path.join(dir, '.cdp-mcp-invoke.json');
  const resultPath = path.join(dir, '.cdp-mcp-result.json');
  const flagPath = path.join(dir, '.cdp-needs-mcp-step');

  (async () => {
    for (let n = start; n <= end; n++) {
      if (fs.existsSync(resultPath)) fs.unlinkSync(resultPath);
      const args = loadArgs(n, vid);
      fs.writeFileSync(invokePath, JSON.stringify(args));
      fs.writeFileSync(flagPath, String(n));
      console.log(`AWAIT ${n} exprLen=${args.params?.expression?.length ?? 0}`);

      let ok = false;
      for (let t = 0; t < 600; t++) {
        if (fs.existsSync(resultPath)) {
          try {
            JSON.parse(fs.readFileSync(resultPath, 'utf8'));
            ok = true;
            break;
          } catch {
            /* partial write */
          }
        }
        await sleep(200);
      }
      if (!ok) {
        console.log(JSON.stringify({ error: 'timeout', step: n }));
        process.exit(1);
      }
      const rec = execSync(`node apply-step-result.mjs ${n} "${resultPath.replace(/\\/g, '/')}"`, {
        cwd: dir,
        encoding: 'utf8',
      });
      console.log(`DONE ${n} ${rec.trim()}`);
      if (rec.includes('"stopped":true') || (rec.includes('"ok":false') && !rec.includes('"ok":true'))) {
        process.exit(1);
      }
      fs.unlinkSync(resultPath);
    }
    if (fs.existsSync(flagPath)) fs.unlinkSync(flagPath);
    console.log('ALL_DONE');
  })();
}
