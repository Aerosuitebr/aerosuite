/**
 * Run steps start..end via Playwright page.evaluate on WP tab (fallback when CDP port unavailable).
 * Reads .cdp-step-N-live-args.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const dir = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pw = require(path.join(dir, 'node_modules', 'playwright-core'));
const start = Number(process.argv[2] ?? 0);
const end = Number(process.argv[3] ?? 29);
const outPath = path.join(dir, '.cdp-agent-deploy-state.json');

const summaryKeys = {
  4: 'cssFullRun', 5: 'cssVerify', 6: 'cssFinalize', 7: 'encInit',
  13: 'enc0', 19: 'enc1', 25: 'enc2', 28: 'enc3', 29: 'encRun',
};

function check(i, v) {
  if (i === 4 && (!v?.ok || v?.len !== 34708)) return `step4 ${JSON.stringify(v)}`;
  if (i === 5 && (!v?.hasGrid || v?.b64 !== 34708)) return `step5 ${JSON.stringify(v)}`;
  if (i === 6 && !v?.ok) return 'step6';
  if (i === 7 && !v?.ok) return 'step7';
  if (i === 29 && (!v?.ok || !v?.hasHeroV2)) return `step29 ${JSON.stringify(v)}`;
  return null;
}

// Connect via playwright to aerosuite - use launch? No - use existing page from MCP isn't accessible.

// Use fetch to browser MCP - not available from node.

console.error('Use MCP loop from agent');
process.exit(2);
