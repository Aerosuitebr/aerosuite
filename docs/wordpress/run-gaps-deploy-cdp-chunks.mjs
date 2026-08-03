/**
 * Executa deploy gaps via CDP (Playwright connectOverCDP na tab wp-admin logada).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pw = require('playwright-core');
const dir = path.dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(
  fs.readFileSync(path.join(dir, '.mcp-gaps-deploy/manifest.json'), 'utf8')
);

async function findCdp() {
  const urls = [process.env.CURSOR_CDP_URL, process.env.CHROME_WS, 'http://127.0.0.1:9222'].filter(
    Boolean
  );
  for (const base of urls) {
    try {
      const list = await fetch(`${base.replace(/\/$/, '')}/json/list`).then((r) => r.json());
      const page = list.find(
        (t) => t.type === 'page' && t.url && t.url.includes('aerosuite.com.br/wp-admin')
      );
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
      const any = list.find((t) => t.type === 'page' && t.url?.includes('aerosuite.com.br'));
      if (any?.webSocketDebuggerUrl) return any.webSocketDebuggerUrl;
    } catch {
      /* next */
    }
  }
  return null;
}

async function evalExpr(page, expr) {
  return page.evaluate(
    async ({ expression }) => {
      let v = eval(expression);
      if (v && typeof v.then === 'function') v = await v;
      return v;
    },
    { expression: expr }
  );
}

const ws = await findCdp();
if (!ws) {
  console.error('NO_CDP');
  process.exit(2);
}

const browser = await pw.chromium.connectOverCDP(ws);
const page =
  browser.contexts()[0]?.pages().find((p) => p.url().includes('post=21')) ||
  browser.contexts()[0]?.pages().find((p) => p.url().includes('wp-admin')) ||
  browser.contexts()[0]?.pages()[0];
if (!page) {
  console.error('NO_PAGE');
  process.exit(3);
}

await page.waitForFunction(() => typeof wp !== 'undefined' && !!wp.apiFetch, null, {
  timeout: 120000,
});

let result = null;
for (const step of manifest.manifest) {
  const payload = JSON.parse(fs.readFileSync(path.join(dir, step.file), 'utf8'));
  const v = await evalExpr(page, payload.params.expression);
  console.log(step.name, JSON.stringify(v));
  if (step.name === 'run') {
    result = v;
    fs.writeFileSync(path.join(dir, 'gaps-deploy-result.json'), JSON.stringify(v, null, 2));
    if (!v?.ok) {
      console.error('DEPLOY_FAIL', JSON.stringify(v));
      process.exit(1);
    }
  }
}

console.log('DEPLOY_OK', JSON.stringify(result));
await browser.disconnect();
