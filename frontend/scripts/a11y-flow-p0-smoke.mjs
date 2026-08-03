/**
 * Smoke estrutural dos fluxos WCAG (F1–F12) — complementa axe, não substitui NVDA/VoiceOver.
 * F12: limpa localStorage (partilhado no browser context Puppeteer após fluxos autenticados).
 * Uso:
 *   npm run build && npm run a11y:flow-p0    # F1 F4 F6 F12
 *   npm run build && npm run a11y:flow-full  # F1–F12
 * Env: A11Y_FLOW_SCOPE=p0|full (default p0)
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '../dist/aerosuite-frontend');
const PORT = Number(process.env.A11Y_FLOW_PORT || 4174);
const BASE_URL = `http://127.0.0.1:${PORT}/`;

const MOCK_OS_ROW = {
  id: 1,
  idOs: 1001,
  numeroOs: 1001,
  clienteNome: 'Cliente A11y',
  ativo: true,
  dtAbertura: '2026-01-15T10:00:00',
  partNumber: 'PN-001',
  serialNumber: 'SN-001',
  fcuPn: 'PN-001',
  numOsOriginal: 'EXT-1001',
};

const MOCK_OS_DETAIL = {
  ...MOCK_OS_ROW,
  tipoServicoId: null,
  fabricanteId: null,
  fcuId: 1,
  idFcuId: 1,
  fileNames: [],
  observacoes: '',
};

const MOCK_PROPOSTA = {
  id: 1,
  numeroProposta: 'P-2026-001',
  moedaProposta: 'USD',
  status: 'RASCUNHO',
  clienteNome: 'Cliente Demo',
  produtoNome: 'Serviço demo',
  produtoPn: 'PN-001',
  produtoSn: 'SN-001',
  produtoManual: 'Manual demo',
  produtoValor: 100,
  servicoExecutado: 'Serviço de demonstração para smoke a11y.',
  dataProposta: '2026-01-15',
  validadeProposta: '2026-02-15',
  prazoEntrega: '30 dias',
  formaPagamento: 'À vista',
  observacoes: '',
  condicoesGerais: 'Condições gerais de demonstração.',
  itens: [
    {
      id: 1,
      produtoNome: 'Serviço demo',
      quantidade: 1,
      valorUnitario: 100,
      valorTotal: 100,
      ordem: 1,
    },
  ],
};

const MOCK_USER = {
  id: 999,
  tenantId: 1,
  email: 'a11y@aerosuite.test',
  nome: 'A11y Flow',
  role: 'ADMIN',
  funcionalidadeCodigos: [
    'ORDEM_SERVICO',
    'ESTOQUE_ITENS',
    'ESTOQUE_DASHBOARD',
    'propostas-comerciais',
    'CONFIGURACOES',
    'ADMIN',
    'HANGAR_JOB_CARD',
    'FCU_ASSEMBLY',
    'FCU',
  ],
  modulosHabilitados: ['os', 'comercial', 'estoque'],
  perfil: { id: 1, nome: 'Administrador', descricao: '', codigo: 'ADMIN' },
};

const API_CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function createMockJwt() {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
      sub: String(MOCK_USER.id),
      tid: MOCK_USER.tenantId,
    })
  ).toString('base64url');
  return `${header}.${payload}.flow-p0`;
}

const MOCK_TOKEN = createMockJwt();

function mockApiBody(url, method) {
  const u = url.toLowerCase();

  if (u.includes('/public/health')) {
    return {
      status: 200,
      body: JSON.stringify({
        ok: true,
        database: 'UP',
        checkedAt: new Date().toISOString(),
        components: { api: 'UP', database: 'UP' },
      }),
    };
  }

  if (u.includes('/auth/me')) {
    return { status: 200, body: JSON.stringify(MOCK_USER) };
  }

  if (u.includes('sistema-empresa') && u.includes('status')) {
    return { status: 200, body: JSON.stringify({ needsCompletion: false, canEdit: false }) };
  }

  if (u.includes('/tenant/features')) {
    return { status: 200, body: JSON.stringify({ enabled: [] }) };
  }

  if (u.includes('/propostas-comerciais')) {
    if (u.includes('/aditivos') || u.includes('/anexos') || u.includes('/portal-acesso')) {
      return { status: 200, body: JSON.stringify([]) };
    }
    if (u.includes('/itens') && method === 'GET') {
      return { status: 200, body: JSON.stringify(MOCK_PROPOSTA.itens) };
    }
    if (/\/propostas-comerciais\/\d+/.test(u) && method === 'GET' && !u.includes('/itens')) {
      return { status: 200, body: JSON.stringify(MOCK_PROPOSTA) };
    }
    if (u.includes('campos-extras') || u.includes('regras')) {
      return { status: 200, body: JSON.stringify({ camposExtras: false }) };
    }
    if (method === 'GET') {
      return {
        status: 200,
        body: JSON.stringify({ content: [MOCK_PROPOSTA], totalElements: 1, totalPages: 1, size: 20, number: 0 }),
      };
    }
    return { status: 200, body: JSON.stringify({}) };
  }

  if (u.includes('templates-produto-servico') || u.includes('templates-proposta')) {
    if (u.includes('categorias')) {
      return { status: 200, body: JSON.stringify([]) };
    }
    if (method === 'GET') {
      return {
        status: 200,
        body: JSON.stringify({ content: [], totalElements: 0, totalPages: 0, size: 20, number: 0 }),
      };
    }
    return { status: 200, body: JSON.stringify({}) };
  }

  if (u.includes('tipos-servico') || u.includes('tipo-servico')) {
    return { status: 200, body: JSON.stringify({ items: [], totalElements: 0, totalPages: 0, page: 0, size: 20 }) };
  }

  if (u.includes('/fcu') && !u.includes('assembly') && !u.includes('associacao')) {
    if (method === 'GET') {
      return {
        status: 200,
        body: JSON.stringify({
          items: [{ id: 1, fcuCodigo: 'FCU-DEMO', pn: 'PN-001', fcuDescription: 'FCU demo A11y' }],
          totalElements: 1,
          totalPages: 1,
          page: 0,
          size: 1000,
        }),
      };
    }
    return { status: 200, body: JSON.stringify({}) };
  }

  if (u.includes('/integracoes/bling') || u.includes('/bling')) {
    if (u.includes('/fluxo')) {
      return {
        status: 200,
        body: JSON.stringify({ passos: [], automacaoPendente: false, automacaoMotivo: 'NENHUM' }),
      };
    }
    if (u.includes('/pedido')) {
      return { status: 200, body: JSON.stringify({ linked: false }) };
    }
    if (u.includes('/nfe')) {
      return { status: 200, body: JSON.stringify({ items: [] }) };
    }
    if (u.includes('/status')) {
      return { status: 200, body: JSON.stringify({ connected: false, enabled: false }) };
    }
    return { status: 200, body: JSON.stringify({}) };
  }

  if (u.includes('/os/job-card')) {
    if (u.includes('/abertas')) {
      return {
        status: 200,
        body: JSON.stringify({
          itens: [{ osId: 1, numeroOs: 1001, clienteNome: 'Cliente A11y', partNumber: 'PN-001', serialNumber: 'SN-001' }],
          total: 1,
        }),
      };
    }
    if (/\/job-card\/\d+/.test(u) && method === 'GET') {
      return {
        status: 200,
        body: JSON.stringify({
          osId: 1,
          numeroOs: 1001,
          clienteNome: 'Cliente A11y',
          partNumber: 'PN-001',
          serialNumber: 'SN-001',
          apontamentos: [],
          assinaturas: [],
          fotos: [],
          alertasConformidade: [],
        }),
      };
    }
    return { status: 200, body: JSON.stringify({}) };
  }

  if (u.includes('item-estoque') || (u.includes('/estoque') && u.includes('/itens'))) {
    if (method === 'GET') {
      return {
        status: 200,
        body: JSON.stringify({
          content: [{ id: 1, codigo: 'ITEM-001', descricao: 'Item demo A11y', quantidade: 10, status: 'DISPONIVEL' }],
          totalElements: 1,
          totalPages: 1,
          size: 20,
          number: 0,
          page: 0,
        }),
      };
    }
    return { status: 200, body: JSON.stringify({}) };
  }

  if (u.includes('/estoque/saida/regras')) {
    return { status: 200, body: JSON.stringify({ exigeCertificadoPeca: false }) };
  }

  if (u.includes('fcu-assembly') || (u.includes('/fcu') && u.includes('assembly'))) {
    if (method === 'GET') {
      return {
        status: 200,
        body: JSON.stringify({
          items: [{ id: 1, fcuCodigo: 'FCU-DEMO', pn: 'PN-001', fcuDescription: 'Assembly demo' }],
          totalElements: 1,
        }),
      };
    }
    return { status: 200, body: JSON.stringify({}) };
  }

  if (u.includes('/os') && !u.includes('job-card') && !u.includes('auditoria')) {
    if (u.includes('painel-resumo')) {
      return {
        status: 200,
        body: JSON.stringify({
          aguardando: 0,
          emExecucao: 0,
          aguardandoPecas: 0,
          inspecao: 0,
          prioridadeAog: 0,
          crsPendente: 0,
        }),
      };
    }
    if (u.includes('preview-kit-fcu-deficit')) {
      return { status: 200, body: JSON.stringify({ temDeficit: false, itens: [] }) };
    }
    if (/\/os\/\d+/.test(u) && method === 'GET') {
      return { status: 200, body: JSON.stringify(MOCK_OS_DETAIL) };
    }
    if (method === 'GET') {
      return {
        status: 200,
        body: JSON.stringify({
          items: [MOCK_OS_ROW],
          totalElements: 1,
          totalPages: 1,
          size: 20,
          page: 0,
        }),
      };
    }
    return { status: 200, body: JSON.stringify({}) };
  }

  if (u.includes('/public/lgpd/termos') || u.includes('/public/lgpd/privacidade')) {
    const tipo = u.includes('privacidade') ? 'privacidade' : 'termos';
    return {
      status: 200,
      body: JSON.stringify({
        tipo,
        versao: '1.0-a11y',
        titulo: tipo === 'termos' ? 'Termos de uso' : 'Privacidade',
        conteudo: 'Documento legal mock para smoke a11y.',
      }),
    };
  }

  if (u.includes('login-tenants')) {
    return { status: 200, body: JSON.stringify([]) };
  }

  if (u.includes('sistema-empresa') || u.includes('/branding') || u.includes('/empresa/public')) {
    return {
      status: 200,
      body: JSON.stringify({
        displayName: 'Aero Suite',
        commercialName: 'Aero Suite',
        logoUrl: 'assets/LOGO_AERO.png',
        primaryColor: '#0ea5e9',
      }),
    };
  }

  if (method === 'GET') {
    return { status: 200, body: JSON.stringify({ items: [], totalElements: 0, totalPages: 0, page: 0, size: 20 }) };
  }
  return { status: 200, body: JSON.stringify({}) };
}

function respondApiMock(req) {
  const method = req.method();
  if (method === 'OPTIONS') {
    req.respond({ status: 204, headers: API_CORS_HEADERS });
    return;
  }
  const { status, body } = mockApiBody(req.url(), method);
  req.respond({
    status,
    contentType: 'application/json',
    headers: API_CORS_HEADERS,
    body,
  });
}

function respondExternalMock(req) {
  const url = req.url();
  if (url.includes('olinda.bcb.gov.br') || url.includes('frankfurter.app')) {
    req.respond({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        value: [{ cotacaoCompra: 5, cotacaoVenda: 5, dataHoraCotacao: '2026-01-01 10:00:00.000' }],
        amount: 1,
        base: 'USD',
        date: '2026-01-01',
        rates: { EUR: 0.92, BRL: 5 },
      }),
    });
    return true;
  }
  return false;
}

function installExternalFetchStubScript() {
  return `(function () {
    const healthPayload = ${JSON.stringify({
      ok: true,
      database: 'UP',
      checkedAt: new Date().toISOString(),
      components: { api: 'UP', database: 'UP' },
    })};
    const externalPayload = ${JSON.stringify({
      value: [{ cotacaoCompra: 5, cotacaoVenda: 5, dataHoraCotacao: '2026-01-01 10:00:00.000' }],
      amount: 1,
      base: 'USD',
      date: '2026-01-01',
      rates: { EUR: 0.92, BRL: 5 },
    })};
    const originalFetch = window.fetch.bind(window);
    window.fetch = async function (input, init) {
      const url = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);
      if (url.includes('/public/health')) {
        return new Response(JSON.stringify(healthPayload), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (url.includes('olinda.bcb.gov.br') || url.includes('frankfurter.app')) {
        return new Response(JSON.stringify(externalPayload), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return originalFetch(input, init);
    };
  })();`;
}

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = req.url ?? '/';
      const rawPath = url.split('?')[0] ?? '/';
      if (rawPath.startsWith('/api/')) {
        const { status, body } = mockApiBody(url, req.method ?? 'GET');
        res.writeHead(status, {
          'Content-Type': 'application/json',
          ...API_CORS_HEADERS,
        });
        res.end(body);
        return;
      }
      const urlPath = rawPath === '/' ? '/index.html' : rawPath;
      const filePath = path.join(distDir, decodeURIComponent(urlPath));
      fs.readFile(filePath, (err, data) => {
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
        const ext = path.extname(filePath);
        const types = {
          '.html': 'text/html',
          '.js': 'application/javascript',
          '.css': 'text/css',
          '.json': 'application/json',
        };
        res.setHeader('Content-Type', types[ext] || 'application/octet-stream');
        res.end(data);
      });
    });
    server.listen(PORT, '127.0.0.1', () => resolve(server));
    server.on('error', reject);
  });
}

async function installAuth(page) {
  await page.evaluateOnNewDocument(
    (token, user, fetchStub) => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.removeItem('aerosuite_external_token');
      localStorage.removeItem('aerosuite_external_user');
      localStorage.removeItem('aerosuite_external_funcionalidades');
      localStorage.setItem('aerosuite_token', token);
      localStorage.setItem('aerosuite_user', JSON.stringify(user));
      localStorage.setItem('aerosuite_tenant_codigo', 'default');
      if (navigator.serviceWorker) {
        navigator.serviceWorker.register = async () => ({
          scope: '/',
          unregister: async () => true,
          update: async () => {},
          addEventListener: () => {},
        });
      }
      // eslint-disable-next-line no-eval
      eval(fetchStub);
    },
    MOCK_TOKEN,
    MOCK_USER,
    installExternalFetchStubScript()
  );
}

function isOsListResponse(response) {
  try {
    const path = new URL(response.url()).pathname;
    return path.endsWith('/os') && response.request().method() === 'GET' && response.status() === 200;
  } catch {
    return false;
  }
}

function isPropostaDetailResponse(response) {
  try {
    const path = new URL(response.url()).pathname;
    return /\/propostas-comerciais\/\d+$/.test(path) && response.request().method() === 'GET' && response.status() === 200;
  } catch {
    return false;
  }
}

function isEstoqueItensResponse(response) {
  try {
    const path = new URL(response.url()).pathname;
    return path.endsWith('/estoque/itens') && response.request().method() === 'GET' && response.status() === 200;
  } catch {
    return false;
  }
}

async function waitForApp(page) {
  await page.waitForFunction(
    () => document.querySelector('app-root')?.childElementCount > 0,
    { timeout: 45000 }
  );
  await new Promise(r => setTimeout(r, 1500));
}

async function clickButton(page, selector) {
  await page.waitForSelector(selector, { timeout: 20000 });
  await page.evaluate(sel => {
    const btn = document.querySelector(sel);
    btn?.scrollIntoView({ block: 'center' });
    btn?.click();
  }, selector);
  await new Promise(r => setTimeout(r, 400));
}

async function dismissOpenDialogs(page) {
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForFunction(
    () => !document.querySelector('.p-dialog-mask, .p-confirm-dialog'),
    { timeout: 3000 }
  ).catch(() => {});
}

async function waitForVisibleDialog(page, timeoutMs = 15000) {
  await page.waitForFunction(
    () => {
      const dialogs = document.querySelectorAll('.p-dialog, [role="dialog"]');
      for (const dialog of dialogs) {
        const style = window.getComputedStyle(dialog);
        if (style.display === 'none' || style.visibility === 'hidden') continue;
        if (dialog.classList.contains('p-dialog-mask')) continue;
        return true;
      }
      return false;
    },
    { timeout: timeoutMs }
  );
}

async function countDialogLabels(page) {
  return page.evaluate(() => {
    const selectors = [
      '.p-dialog-content label',
      '.p-dialog-content .field-label',
      '.os-form label',
      '.os-form .field-label',
      '[role="dialog"] label',
      '[role="dialog"] .field-label',
    ];
    const seen = new Set();
    for (const selector of selectors) {
      for (const el of document.querySelectorAll(selector)) {
        seen.add(el);
      }
    }
    return seen.size;
  });
}

async function waitForOsListReady(page) {
  await page.waitForSelector('button.add-btn', { timeout: 20000 });
  await page.waitForSelector('button.delete-btn', { visible: true, timeout: 20000 });
}

async function testF1(page) {
  await page.goto(`${BASE_URL}os`, { waitUntil: 'networkidle0', timeout: 90000 });
  await waitForApp(page);
  await dismissOpenDialogs(page);

  await clickButton(page, 'button.add-btn');
  await page.waitForSelector('.as-hero-dialog .field-label, .os-form .field-label', {
    visible: true,
    timeout: 15000,
  });

  const role = await page.$eval('.as-hero-dialog, .p-dialog[role="dialog"]', el =>
    el.getAttribute('role') ?? 'dialog'
  );
  const labelCount = await countDialogLabels(page);
  if (role !== 'dialog' && role !== 'alertdialog') {
    throw new Error(`F1: dialog role esperado, obtido "${role}"`);
  }
  if (labelCount < 2) {
    throw new Error(`F1: poucos labels no modal OS (${labelCount})`);
  }

  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('.p-dialog-mask'), { timeout: 8000 });
  return 'modal OS abre com labels; Esc fecha';
}

async function testF6(page) {
  await page.goto(`${BASE_URL}os`, { waitUntil: 'networkidle0', timeout: 90000 });
  await waitForApp(page);
  await dismissOpenDialogs(page);
  await waitForOsListReady(page);

  await clickButton(page, 'button.delete-btn');
  await page.waitForSelector('.p-confirm-dialog', { visible: true, timeout: 8000 });

  const headerText = await page.$eval('.p-confirm-dialog .p-dialog-title', el => el.textContent?.trim() ?? '');
  const acceptText = await page.$eval('.p-confirm-dialog .p-confirm-dialog-accept', el => el.textContent?.trim() ?? '');
  const rejectText = await page.$eval('.p-confirm-dialog .p-confirm-dialog-reject', el => el.textContent?.trim() ?? '');

  if (!headerText || headerText.includes('confirm.header')) {
    throw new Error(`F6: título do confirm não traduzido: "${headerText}"`);
  }
  if (!acceptText || !rejectText) {
    throw new Error('F6: botões accept/reject sem texto visível');
  }

  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('.p-confirm-dialog'), { timeout: 8000 });
  return 'confirm dialog com título e botões i18n; Esc fecha';
}

async function testF12(page) {
  if (process.env.A11Y_DEBUG) {
    page.on('console', msg => console.log(`F12 console: ${msg.text()}`));
    page.on('pageerror', err => console.log(`F12 pageerror: ${err.message}`));
    page.on('requestfailed', req =>
      console.log(`F12 requestfailed: ${req.url()} — ${req.failure()?.errorText ?? 'unknown'}`)
    );
  }

  // localStorage é partilhado no browser context do Puppeteer — limpar sessão dos fluxos autenticados (F1/F4/F6).
  await page.evaluateOnNewDocument(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  await page.setRequestInterception(true);
  page.on('request', req => {
    const url = req.url();
    const isApi = url.includes('/api/');
    if (isApi && req.method() === 'GET' && url.includes('/auth/me')) {
      req.respond({
        status: 401,
        contentType: 'application/json',
        headers: API_CORS_HEADERS,
        body: JSON.stringify({ message: 'Unauthorized' }),
      });
      return;
    }
    if (isApi && req.method() === 'POST' && url.includes('/auth/login')) {
      req.respond({
        status: 401,
        contentType: 'application/json',
        headers: API_CORS_HEADERS,
        body: JSON.stringify({
          message: 'i18n:api.common.forbidden',
          code: 'INVALID_CREDENTIALS',
        }),
      });
      return;
    }
    if (isApi && req.resourceType() !== 'document') {
      respondApiMock(req);
      return;
    }
    req.continue();
  });

  await page.goto(`${BASE_URL}login`, { waitUntil: 'networkidle0', timeout: 90000 });

  await page.waitForSelector('app-login', { timeout: 45000 });

  const emailInput = await page.waitForSelector('app-login input#email', { timeout: 30000 });
  await emailInput.type('a11y@aerosuite.test', { delay: 20 });

  const passwordInput = await page.waitForSelector('app-login input[type="password"]', { timeout: 10000 });
  await passwordInput.type('senha-invalida', { delay: 20 });

  const submit = await page.waitForSelector('app-login button[data-testid="login-submit"]', { timeout: 10000 });
  await submit.click();

  await page.waitForSelector('.error-message', { visible: true, timeout: 12000 });
  const text = await page.$eval('.error-message', el => el.textContent?.trim() ?? '');

  if (!text || text.includes('i18n:') || text.includes('api.common.forbidden')) {
    throw new Error(`F12: erro de login sem mensagem legível: "${text}"`);
  }

  return `erro API mapeado no login: "${text.slice(0, 80)}"`;
}

async function testF2(page) {
  await page.goto(`${BASE_URL}hangar`, { waitUntil: 'networkidle0', timeout: 90000 });
  await page.waitForSelector('app-hangar-job-card', { timeout: 45000 });

  const searchAria = await page.$eval(
    'app-hangar-job-card button[aria-label]',
    el => el.getAttribute('aria-label')?.trim() ?? ''
  );
  if (!searchAria || searchAria.length < 4) {
    throw new Error(`F2: botão busca hangar sem aria-label: "${searchAria}"`);
  }

  const bareIconButtons = await page.$$eval('app-hangar-job-card button', buttons =>
    buttons.filter(b => {
      const label = b.getAttribute('aria-label')?.trim() || b.textContent?.trim() || '';
      const hasIcon = !!b.querySelector('.pi');
      return hasIcon && label.length < 2;
    }).length
  );
  if (bareIconButtons > 0) {
    throw new Error(`F2: ${bareIconButtons} botão(ões) só ícone sem nome no hangar`);
  }

  return 'hangar com aria-label na busca; ícones nomeados';
}

async function testF3(page) {
  await page.goto(`${BASE_URL}fcu-assembly`, { waitUntil: 'networkidle0', timeout: 90000 });
  await waitForApp(page);

  await page.waitForSelector('app-fcu-assembly-editor', { timeout: 45000 });
  const labelCount = await page.$$eval('label, .field-label', els => els.length);
  if (labelCount < 1) {
    throw new Error(`F3: editor FCU sem labels visíveis (${labelCount})`);
  }

  const hasEditorShell = await page.evaluate(() => {
    return !!(
      document.querySelector('app-fcu-assembly-editor') ||
      document.querySelector('app-page-hero') ||
      document.querySelector('form.content-wrapper') ||
      document.querySelector('.p-accordion')
    );
  });
  if (!hasEditorShell) {
    throw new Error('F3: shell do editor FCU assembly não renderizou');
  }

  return `FCU assembly com ${labelCount} label(s) e shell editor`;
}

async function testF5(page) {
  const detailReady = page.waitForResponse(isPropostaDetailResponse, { timeout: 30000 });
  await page.goto(`${BASE_URL}propostas-comerciais/1`, { waitUntil: 'networkidle0', timeout: 90000 });
  await detailReady;
  await waitForApp(page);
  await dismissOpenDialogs(page);

  const printBtn = await page.waitForSelector('app-proposta-comercial button .pi-print', { timeout: 20000 });
  const printLabel = await printBtn.evaluate(el => {
    const btn = el.closest('button');
    return btn?.textContent?.trim() ?? '';
  });
  if (!printLabel || printLabel.length < 3) {
    throw new Error(`F5: botão imprimir sem rótulo visível: "${printLabel}"`);
  }

  return `imprimir com rótulo: "${printLabel.slice(0, 40)}"`;
}

async function testF7(page) {
  await page.goto(`${BASE_URL}configuracoes`, { waitUntil: 'networkidle0', timeout: 90000 });
  await waitForApp(page);

  const dropdownCount = await page.$$eval('.p-dropdown, p-dropdown', els => els.length);
  if (dropdownCount < 1) {
    throw new Error('F7: configurações sem dropdown PrimeNG');
  }

  const labeled = await page.$$eval('.p-dropdown [role="combobox"], .p-dropdown input', inputs =>
    inputs.filter(i => {
      const id = i.id;
      if (id && document.querySelector(`label[for="${id}"]`)) return true;
      return !!(i.getAttribute('aria-label') || i.getAttribute('aria-labelledby'));
    }).length
  );
  if (labeled < 1 && dropdownCount > 0) {
    throw new Error('F7: dropdown sem label/aria associado');
  }

  return `${dropdownCount} dropdown(s); foco em combobox testável`;
}

async function testF8(page) {
  await page.goto(`${BASE_URL}estoque/itens`, { waitUntil: 'networkidle0', timeout: 90000 });
  await waitForApp(page);
  await page.waitForSelector('app-item-estoque-list .p-datatable-thead th', { timeout: 20000 });

  const thCount = await page.$$eval('app-item-estoque-list table th, app-item-estoque-list .p-datatable-thead th', els => els.length);
  if (thCount < 2) {
    throw new Error(`F8: tabela estoque com poucos cabeçalhos (${thCount})`);
  }

  const paginator = await page.$('.p-paginator, p-paginator');
  if (!paginator) {
    throw new Error('F8: paginação não encontrada na lista de itens');
  }

  return `${thCount} cabeçalhos; paginador presente`;
}

async function testF9(page) {
  await page.goto(`${BASE_URL}os`, { waitUntil: 'networkidle0', timeout: 90000 });
  await waitForApp(page);
  await dismissOpenDialogs(page);
  await waitForOsListReady(page);

  await clickButton(page, 'button.edit-btn');
  await waitForVisibleDialog(page);

  const fileInputs = await page.$$eval('.p-dialog input[type="file"], input[type="file"]', inputs =>
    inputs.map(i => ({
      id: i.id,
      aria: i.getAttribute('aria-label') || '',
      hasLabel: !!(i.id && document.querySelector(`label[for="${i.id}"]`)),
    }))
  );

  await page.keyboard.press('Escape');

  if (fileInputs.length === 0) {
    return 'modal OS sem upload neste mock (skip estrutural)';
  }

  const ok = fileInputs.some(f => f.hasLabel || f.aria.length > 2);
  if (!ok) {
    throw new Error('F9: input file sem label nem aria-label');
  }

  return 'input file com nome acessível no modal OS';
}

async function testF10(page) {
  await page.evaluateOnNewDocument((fetchStub) => {
    localStorage.clear();
    sessionStorage.clear();
    // eslint-disable-next-line no-eval
    eval(fetchStub);
  }, installExternalFetchStubScript());
  await page.goto(`${BASE_URL}cadastro-trial`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForFunction(
    () => document.querySelectorAll('app-trial-signup label').length >= 3,
    { timeout: 60000 }
  );

  const labelCount = await page.$$eval('app-trial-signup label', (els) => els.length);
  if (labelCount < 3) {
    throw new Error(`F10: cadastro trial com poucos labels (${labelCount})`);
  }

  const hasCheckbox = await page.$('app-trial-signup input[type="checkbox"], app-trial-signup p-checkbox');
  if (!hasCheckbox) {
    throw new Error('F10: cadastro trial sem checkbox legal');
  }

  return `${labelCount} labels; checkbox legal presente`;
}

async function testF11(page) {
  await page.evaluateOnNewDocument(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  await page.goto(`${BASE_URL}login`, { waitUntil: 'networkidle0', timeout: 90000 });
  await page.waitForSelector('app-login', { timeout: 45000 });

  const groupLabel = await page.$eval('.lang-switcher[role="group"]', el => el.getAttribute('aria-label')?.trim() ?? '');
  if (!groupLabel || groupLabel.length < 4) {
    throw new Error(`F11: seletor de idioma sem aria-label no grupo: "${groupLabel}"`);
  }

  const lang = await page.evaluate(() => document.documentElement.lang || document.documentElement.getAttribute('lang'));
  if (!lang) {
    throw new Error('F11: <html> sem atributo lang');
  }

  return `lang="${lang}"; grupo idioma: "${groupLabel.slice(0, 50)}"`;
}

async function testF4(page) {
  const detailReady = page.waitForResponse(isPropostaDetailResponse, { timeout: 30000 });
  await page.goto(`${BASE_URL}propostas-comerciais/1`, { waitUntil: 'networkidle0', timeout: 90000 });
  await detailReady;
  await waitForApp(page);
  await dismissOpenDialogs(page);

  await page.waitForSelector('app-proposta-comercial', { timeout: 20000 });
  await page.waitForFunction(
    () => {
      const loading = document.querySelector('.proposta-loading');
      if (loading && loading.offsetParent !== null) return false;
      return !!document.querySelector('.tabs-container p-tabview, .tabs-container .p-tabview, p-tabview');
    },
    { timeout: 30000 }
  );
  const tabCount = await page.$$eval('.p-tabview-nav li', els => els.length);
  if (tabCount < 2) {
    throw new Error(`F4: TabView com poucas abas (${tabCount})`);
  }

  const brandPrimary = await page.$eval('app-proposta-comercial, app-root', el => {
    const host = document.querySelector('app-proposta-comercial') ?? document.querySelector('app-root');
    return host ? getComputedStyle(host).getPropertyValue('--proposta-brand-primary').trim() : '';
  });
  if (!brandPrimary) {
    throw new Error('F4: --proposta-brand-primary não aplicada');
  }

  const caption = await page
    .$eval('.final-totals caption.as-sr-only', el => el.textContent?.trim() ?? '')
    .catch(() => '');
  if (!caption || caption.length < 8) {
    throw new Error(`F4: região de totais sem caption a11y: "${caption}"`);
  }

  const firstTab = await page.$('.p-tabview-nav-link');
  await firstTab?.focus();
  await page.keyboard.press('ArrowRight');
  return `TabView ${tabCount} abas; brand CSS var; totais anunciados`;
}

async function main() {
  if (!fs.existsSync(distDir)) {
    console.error('flow-p0: execute npm run build primeiro.');
    process.exit(1);
  }

  const server = await startStaticServer();
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const scope = (
    process.env.A11Y_FLOW_SCOPE ||
    (process.env.npm_lifecycle_event === 'a11y:flow-full' ? 'full' : 'p0')
  ).toLowerCase();
  const p0Ids = new Set(['F1', 'F4', 'F6', 'F12']);
  const noAuthIds = new Set(['F10', 'F11', 'F12']);
  const allTests = [
    ['F1', testF1],
    ['F2', testF2],
    ['F3', testF3],
    ['F4', testF4],
    ['F5', testF5],
    ['F6', testF6],
    ['F7', testF7],
    ['F8', testF8],
    ['F9', testF9],
    ['F10', testF10],
    ['F11', testF11],
    ['F12', testF12],
  ];
  const flowFilter = (process.env.A11Y_FLOW_IDS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const tests =
    flowFilter.length > 0
      ? allTests.filter(([id]) => flowFilter.includes(id))
      : scope === 'full'
        ? allTests
        : allTests.filter(([id]) => p0Ids.has(id));
  let exitCode = 0;

  try {
    for (const [id, fn] of tests) {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });
      if (!noAuthIds.has(id)) {
        await installAuth(page);
      }
      try {
        const note = await fn(page);
        console.log(`flow OK [${id}] — ${note}`);
      } catch (err) {
        exitCode = 1;
        console.error(`flow FAIL [${id}]: ${err.message}`);
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
    server.close();
  }

  if (exitCode === 0) {
    const label = scope === 'full' ? 'flow-full' : 'flow-p0';
    console.log(
      `${label}: ${tests.length}/${tests.length} fluxos estruturais OK (complementar com NVDA — docs/WCAG-100-PASSO-A-PASSO.md §B)`
    );
  }
  process.exit(exitCode);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
