/**
 * Smoke de LCP (Largest Contentful Paint) sobre build estático com mocks de API.
 * Rotas críticas MRO: OS e listagens de estoque.
 * Uso: npm run build && npm run perf:lcp
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '../dist/aerosuite-frontend');
const PORT = Number(process.env.LCP_PORT || 4174);
const BASE_URL = `http://127.0.0.1:${PORT}/`;
const LCP_BUDGET_MS = Number(process.env.LCP_BUDGET_MS || 2500);

const LCP_ROUTES = [
  { path: '/os', budgetMs: Number(process.env.LCP_BUDGET_OS_MS || 3000) },
  { path: '/estoque/itens', budgetMs: LCP_BUDGET_MS },
  { path: '/estoque/invoices', budgetMs: LCP_BUDGET_MS },
];

const MOCK_USER = {
  id: 999,
  tenantId: 1,
  email: 'perf@aerosuite.test',
  nome: 'Perf Smoke',
  role: 'ADMIN',
  funcionalidadeCodigos: ['ORDEM_SERVICO', 'ESTOQUE_ITENS', 'ADMIN', 'CONFIGURACOES'],
  modulosHabilitados: ['estoque', 'os'],
  perfil: { id: 1, nome: 'Administrador', descricao: '', codigo: 'ADMIN' },
};

const EMPTY_PAGE = JSON.stringify({
  content: [],
  totalElements: 0,
  totalPages: 0,
  size: 20,
  number: 0,
});

function createMockJwt() {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      exp: Math.floor(Date.now() / 1000) + 86400,
      sub: String(MOCK_USER.id),
      tid: MOCK_USER.tenantId,
    })
  ).toString('base64url');
  return `${header}.${payload}.lcp-smoke`;
}

const MOCK_TOKEN = createMockJwt();

function mockApiBody(url, method) {
  const u = url.toLowerCase();
  if (u.includes('/auth/me')) {
    return JSON.stringify(MOCK_USER);
  }
  if (method === 'GET') {
    if (u.includes('os') || u.includes('estoque') || u.includes('invoice')) {
      return EMPTY_PAGE;
    }
    return JSON.stringify([]);
  }
  return JSON.stringify({});
}

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const rawPath = req.url?.split('?')[0] ?? '/';
      const urlPath = rawPath === '/' ? '/index.html' : rawPath;
      const filePath = path.join(distDir, decodeURIComponent(urlPath));

      const sendFile = fp => {
        fs.readFile(fp, (err, data) => {
          if (err) {
            if (!path.extname(rawPath)) {
              fs.readFile(path.join(distDir, 'index.html'), (err2, indexData) => {
                if (err2) {
                  res.statusCode = 404;
                  res.end('Not found');
                  return;
                }
                res.setHeader('Content-Type', 'text/html');
                res.end(indexData);
              });
              return;
            }
            res.statusCode = 404;
            res.end('Not found');
            return;
          }
          const ext = path.extname(fp);
          const types = {
            '.html': 'text/html',
            '.js': 'application/javascript',
            '.css': 'text/css',
            '.json': 'application/json',
            '.woff2': 'font/woff2',
          };
          res.setHeader('Content-Type', types[ext] || 'application/octet-stream');
          res.end(data);
        });
      };
      sendFile(filePath);
    });
    server.listen(PORT, '127.0.0.1', () => resolve(server));
    server.on('error', reject);
  });
}

async function installAuthMocks(page) {
  await page.evaluateOnNewDocument(
    (token, user) => {
      localStorage.setItem('aerosuite_token', token);
      localStorage.setItem('aerosuite_user', JSON.stringify(user));
      localStorage.setItem('aerosuite_tenant_codigo', 'default');
      window.__lcp = 0;
      window.__fcp = 0;
      try {
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              window.__fcp = entry.startTime;
            }
          }
        }).observe({ type: 'paint', buffered: true });
        new PerformanceObserver(list => {
          const entries = list.getEntries();
          const last = entries[entries.length - 1];
          if (last) {
            window.__lcp = last.renderTime || last.startTime;
          }
        }).observe({ type: 'largest-contentful-paint', buffered: true });
      } catch {
        /* unsupported */
      }
    },
    MOCK_TOKEN,
    MOCK_USER
  );

  await page.setRequestInterception(true);
  page.on('request', req => {
    const url = req.url();
    const isApi = url.includes('/api/') || (url.startsWith(BASE_URL) && url.includes('api'));
    if (isApi && req.resourceType() !== 'document') {
      req.respond({
        status: 200,
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: mockApiBody(url, req.method()),
      });
      return;
    }
    req.continue();
  });
}

async function measureLcp(page, routePath) {
  const url = `${BASE_URL}${routePath.replace(/^\//, '')}`;
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 90000 });
  await page.waitForFunction(
    () => document.querySelector('app-root')?.childElementCount > 0,
    { timeout: 45000 }
  );
  await new Promise(r => setTimeout(r, 1500));
  const metrics = await page.evaluate(() => ({
    lcp: window.__lcp || 0,
    fcp: window.__fcp || 0,
  }));
  return metrics;
}

async function main() {
  if (!fs.existsSync(distDir)) {
    console.error(`LCP: dist não encontrado em ${distDir}. Execute npm run build primeiro.`);
    process.exit(1);
  }

  const server = await startStaticServer();
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  let exitCode = 0;

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await installAuthMocks(page);

    for (const { path, budgetMs } of LCP_ROUTES) {
      const { lcp, fcp } = await measureLcp(page, path);
      const ms = Math.round(lcp || fcp);
      const metric = lcp > 0 ? 'LCP' : 'FCP';
      if (ms <= 0) {
        console.warn(`${metric} WARN [${path}] — métrica não capturada (ambiente headless)`);
        continue;
      }
      if (ms > budgetMs) {
        console.error(`${metric} FAIL [${path}] — ${ms} ms (budget ${budgetMs} ms)`);
        exitCode = 1;
      } else {
        console.log(`${metric} OK [${path}] — ${ms} ms (budget ${budgetMs} ms)`);
      }
    }
  } finally {
    await browser.close();
    server.close();
  }

  process.exit(exitCode);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
