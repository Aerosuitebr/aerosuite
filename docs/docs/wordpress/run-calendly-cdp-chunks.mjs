/**
 * Executa chunks CDP via Playwright connectOverCDP (porta 9222) se disponível.
 * Fallback: imprime instrução para agente MCP.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));

const argsFiles = [
  '.cdp-calendly-arg-0.json',
  '.cdp-calendly-arg-1.json',
  '.cdp-calendly-arg-2.json',
  '.cdp-calendly-arg-run.json',
];

async function findCdp() {
  const urls = [
    process.env.CURSOR_CDP_URL,
    process.env.CHROME_WS,
    'http://127.0.0.1:9222',
  ].filter(Boolean);
  for (const base of urls) {
    try {
      const list = await fetch(`${base.replace(/\/$/, '')}/json/list`).then((r) => r.json());
      const page = list.find(
        (t) => t.type === 'page' && t.url && t.url.includes('aerosuite.com.br/wp-admin')
      );
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {
      /* next */
    }
  }
  return null;
}

const ws = await findCdp();
if (!ws) {
  console.error('NO_CDP');
  process.exit(2);
}

const browser = await pw.chromium.connectOverCDP(ws);
const page = browser.contexts()[0]?.pages().find((p) => p.url().includes('wp-admin'));
if (!page) {
  console.error('NO_WP_ADMIN_PAGE');
  process.exit(3);
}

for (const f of argsFiles) {
  const { params } = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  const value = await page.evaluate(
    async ({ expr }) => {
      let v = eval(expr);
      if (v && typeof v.then === 'function') v = await v;
      return v;
    },
    { expr: params.expression }
  );
  console.log(f, JSON.stringify(value).slice(0, 200));
}

await browser.close();
