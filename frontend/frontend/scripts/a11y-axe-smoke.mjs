/**
 * Smoke test de acessibilidade com axe-core sobre o build estático do Angular.
 * Rotas públicas + rotas autenticadas (mock JWT + API stub) + portal externo.
 * Uso: npm run build && npm run a11y:axe
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';
import { AxePuppeteer } from '@axe-core/puppeteer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '../dist/aerosuite-frontend');
const PORT = Number(process.env.A11Y_PORT || 4173);
const BASE_URL = `http://127.0.0.1:${PORT}/`;

/** Rotas públicas (shell interno) */
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/forgot-password',
  '/cadastro-trial',
  '/termos',
  '/privacidade',
];

/** Rotas autenticadas (shell interno) */
const AUTH_ROUTES = [
  '/',
  '/os',
  '/estoque/itens',
  '/configuracoes',
  '/propostas-comerciais',
  '/chat',
  '/biblioteca',
  '/fcu-assembly',
  '/associacao-fcu',
  '/relatorios',
  '/usuarios',
  '/products',
  '/organizacoes',
  '/auditoria-acesso',
  '/capacidade',
  '/controle-acesso',
  '/fabricantes',
  '/perfis',
  '/funcionalidades',
  '/suporte',
  '/templates-proposta',
  '/aero/diretrizes',
  '/publicacoes-tecnicas/associar-pn',
  '/estoque/invoices',
  '/estoque/lotes',
  '/capacidade/hangares',
  '/hangar',
  '/conformidade/painel',
  '/conformidade/documentos',
  '/conformidade/treinamentos',
  '/conformidade/calibracao',
  '/conformidade/nao-conformidades',
  '/conformidade/subcontratacao',
  '/conformidade/contingencia',
  '/conformidade/releases',
  '/conformidade/treinamentos-obrigatorios',
  '/conformidade/habilitacoes',
  '/dossie-auditoria',
  '/go-live-migracao',
  '/os-auditoria',
  '/settings/backup',
];

/** Rotas públicas do portal externo */
const EXTERNO_PUBLIC_ROUTES = ['/externo/login'];

/** Rotas autenticadas do portal externo */
const EXTERNO_AUTH_ROUTES = ['/externo', '/externo/os', '/externo/documentos', '/externo/propostas'];

const MOCK_USER = {
  id: 999,
  tenantId: 1,
  email: 'a11y@aerosuite.test',
  nome: 'A11y Smoke',
  role: 'ADMIN',
  funcionalidadeCodigos: [
    'ORDEM_SERVICO',
    'PRODUTOS',
    'ESTOQUE_ITENS',
    'ESTOQUE_DASHBOARD',
    'ESTOQUE_ENTRADA',
    'EDITOR_DOCUMENTOS',
    'CHAT',
    'ADMIN',
    'CONFIGURACOES',
    'propostas-comerciais',
    'templates-proposta',
    'BIBLIOTECA',
    'FCU',
    'FCU_ASSEMBLY',
    'ASSOCIACAO_FCU',
    'USUARIOS',
    'ORGANIZACOES',
    'AUDITORIA_ACESSO',
    'CAPACIDADE',
    'RELATORIOS',
    'CONTROLE_ACESSO',
    'FABRICANTES',
    'PERFIS',
    'FUNCIONALIDADES',
    'PLATFORM_ADMIN',
    'suporte',
    'suporte-chamados',
    'suporte-atendimento',
    'templates-proposta',
    'HANGAR_JOB_CARD',
    'QUADRO_CAPACIDADE',
    'CONFORMIDADE_PAINEL',
    'SGQ_DOCUMENTO_CONTROLADO',
    'CONFORMIDADE_TREINAMENTO',
    'CONFORMIDADE_CALIBRACAO',
    'CONFORMIDADE_NC',
    'CONFORMIDADE_SUBCONTRATACAO',
    'CONFORMIDADE_TREINAMENTO_OBRIG',
    'HABILITACAO_TECNICA',
    'GERENCIAR_PERMISSOES',
    'DOSSIE_AUDITORIA',
    'GO_LIVE_MIGRACAO',
    'CONSULTA_TROCAS_EVENTUAIS',
    'AD_SB_ALERTAS',
  ],
  modulosHabilitados: ['estoque', 'os', 'chat', 'comercial', 'conformidade'],
  perfil: { id: 1, nome: 'Administrador', descricao: '', codigo: 'ADMIN' },
};

const MOCK_EXT_USER = {
  id: 999,
  email: 'a11y.externo@test.com',
  nome: 'Cliente Externo A11y',
  precisaTrocarSenha: false,
  ativo: true,
};

const MOCK_EXT_FUNCIONALIDADES = [
  { id: 1, codigo: 'os-externa', nome: 'Ordens de Serviço', ativo: true },
  { id: 2, codigo: 'documentos-externos', nome: 'Documentos', ativo: true },
  { id: 3, codigo: 'perfil-externo', nome: 'Perfil', ativo: true },
  { id: 4, codigo: 'propostas-externas', nome: 'Propostas', ativo: true },
];

function createMockJwt() {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365,
      sub: String(MOCK_USER.id),
      tid: MOCK_USER.tenantId,
    })
  ).toString('base64url');
  return `${header}.${payload}.a11y-smoke`;
}

function createMockExternoToken() {
  return Buffer.from(`EXT:${MOCK_EXT_USER.id}:${MOCK_EXT_USER.email}:${Date.now()}`).toString('base64');
}

const MOCK_TOKEN = createMockJwt();
const MOCK_EXT_TOKEN = createMockExternoToken();

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = req.url ?? '/';
      const rawPath = url.split('?')[0] ?? '/';
      if (rawPath.startsWith('/api/')) {
        const body = mockApiBody(url, req.method ?? 'GET');
        res.writeHead(200, {
          'Content-Type': 'application/json',
          ...API_CORS_HEADERS,
        });
        res.end(body);
        return;
      }
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
            '.woff': 'font/woff',
            '.svg': 'image/svg+xml',
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

const EMPTY_CONFORMIDADE_PAGE = { items: [], totalElements: 0, totalPages: 0, page: 0, size: 20 };
const EMPTY_CONFORMIDADE_ALERTAS = {
  diasJanela: 30,
  totalVencidas: 0,
  totalProximas: 0,
  totalAtivos: 0,
  itens: [],
};

function mockApiBody(url, method) {
  const u = url.toLowerCase();
  if (u.includes('/public/health')) {
    return JSON.stringify({
      ok: true,
      database: 'UP',
      checkedAt: new Date().toISOString(),
      components: { api: 'UP', database: 'UP' },
    });
  }
  if (u.includes('sistema-empresa') && u.includes('status')) {
    return JSON.stringify({ needsCompletion: false, canEdit: false });
  }
  if (u.includes('sistema-empresa') && (method === 'GET' || method === 'PUT')) {
    return JSON.stringify({
      displayName: 'Aero Suite',
      tagline: 'Plataforma de gestão para oficinas MRO',
      logoUrl: 'assets/LOGO_AERO.png',
      wordmarkUrl: 'assets/LOGO_LETRA.png',
    });
  }
  if (u.includes('/branding') || u.includes('/empresa/public')) {
    return JSON.stringify({
      commercialName: 'Aero Suite',
      tagline: 'Plataforma de gestão para oficinas MRO',
      logoUrl: 'assets/LOGO_AERO.png',
      wordmarkUrl: 'assets/LOGO_LETRA.png',
    });
  }
  if (u.includes('auth-externo/me')) {
    if (u.includes('/documentos')) {
      return JSON.stringify([]);
    }
    if (u.includes('/propostas')) {
      return JSON.stringify([]);
    }
    if (u.includes('/os/')) {
      return JSON.stringify({});
    }
    if (u.includes('/os')) {
      return JSON.stringify([]);
    }
    return JSON.stringify(MOCK_EXT_USER);
  }
  if (u.includes('/auth-externo')) {
    return JSON.stringify({});
  }
  if (u.includes('/conformidade/')) {
    if (u.includes('/painel')) {
      return JSON.stringify({
        diasJanela: 30,
        totalDocumentosVencidos: 0,
        totalDocumentosProximos: 0,
        totalTreinamentosVencidos: 0,
        totalTreinamentosProximos: 0,
        totalCalibracaoVencida: 0,
        totalCalibracaoProxima: 0,
        totalNcAbertas: 0,
        totalAslPendente: 0,
        totalAslVencido: 0,
        totalSubcontratacaoAlerta: 0,
        itens: [],
      });
    }
    if (u.includes('/sms/indicadores')) {
      return JSON.stringify({
        diasJanela: 30,
        ncAbertas: 0,
        ncFechadasPeriodo: 0,
        ncAbertasPeriodo: 0,
        ncCriticasSemAcao: 0,
        ncMediaDiasAbertas: 0,
        scoreRisco: 0,
        taxaFechamentoPercent: 100,
        porSeveridade: {},
        porCapaFase: {},
        tendenciaMensal: [],
      });
    }
    if (u.includes('/enforcement')) {
      return JSON.stringify({
        bloquearCalibracaoVencida: false,
        bloquearTreinoObrigatorio: false,
        bloquearSubcontratacaoVencida: false,
      });
    }
    if (u.includes('/releases/meta')) {
      return JSON.stringify({ versaoApp: '1.0.0', flywayAte: '1', checklistPadrao: [] });
    }
    if (u.includes('/contingencia/checklist-padrao')) {
      return JSON.stringify([]);
    }
    if (u.includes('/retencao')) {
      if (u.includes('/inventario')) {
        return JSON.stringify({
          anosRetencao: 5,
          dataLimiteRetencao: '2021-01-01',
          totalOsFechadas: 0,
          totalDentroRetencao: 0,
          totalForaRetencao: 0,
          totalOsAbertas: 0,
          amostraForaRetencao: [],
        });
      }
      return JSON.stringify({ anosRetencao: 5, dataLimiteRetencao: '2021-01-01', minAnos: 1, maxAnos: 30 });
    }
    if (u.includes('/alertas')) {
      return JSON.stringify(EMPTY_CONFORMIDADE_ALERTAS);
    }
    if (method === 'GET') {
      return JSON.stringify(EMPTY_CONFORMIDADE_PAGE);
    }
    return JSON.stringify({});
  }
  if (u.includes('/go-live-migracao')) {
    if (u.includes('/templates') && !u.includes('/download')) {
      return JSON.stringify([]);
    }
    if (u.includes('/checklist')) {
      return JSON.stringify([]);
    }
    return JSON.stringify({});
  }
  if (u.includes('/dossie-auditoria')) {
    if (u.includes('/pacote/resumo')) {
      return JSON.stringify({
        totalOsIncluidas: 0,
        limiteMaximo: 30,
        ordens: [],
      });
    }
    return JSON.stringify({});
  }
  if (u.includes('/os-auditoria')) {
    if (method === 'GET') {
      return JSON.stringify({ items: [], totalElements: 0, page: 0, size: 20, totalPages: 0 });
    }
    return JSON.stringify({});
  }
  if (u.includes('/os/job-card')) {
    if (u.includes('/abertas')) {
      return JSON.stringify({ itens: [], total: 0 });
    }
    if (/\/job-card\/\d+/.test(u)) {
      return JSON.stringify({
        osId: 1,
        numeroOs: 1001,
        clienteNome: 'Cliente A11y',
        apontamentos: [],
        assinaturas: [],
        fotos: [],
      });
    }
    return JSON.stringify({});
  }
  if (u.includes('/backup-config')) {
    if (u.includes('/history')) {
      return JSON.stringify([]);
    }
    if (method === 'GET') {
      return JSON.stringify({
        connection: {
          host: 'localhost',
          port: 5432,
          database: 'aerosuite',
          username: 'a11y',
          password: '',
        },
        backupPath: '/var/backups/aerosuite',
        schedule: { scheduleType: 'daily', enabled: false, scheduledTime: '02:00' },
        retentionDays: 30,
        compressBackup: true,
        emailNotification: false,
      });
    }
    return JSON.stringify({});
  }
  if (u.includes('/os') && method === 'GET') {
    if (/\/os\/\d+/.test(u)) {
      return JSON.stringify({ id: 1, numeroOs: 1001, clienteNome: 'Cliente A11y', ativo: true });
    }
    return JSON.stringify({
      items: [{ id: 1, numeroOs: 1001, clienteNome: 'Cliente A11y', ativo: true }],
      totalElements: 1,
      totalPages: 1,
      page: 0,
      size: 20,
    });
  }
  if (u.includes('proposta') || u.includes('comercial')) {
    if (method === 'GET') {
      return JSON.stringify({ content: [], totalElements: 0, totalPages: 0, size: 20, number: 0 });
    }
  }
  if (u.includes('configurac') || u.includes('backup') || u.includes('modulo')) {
    if (method === 'GET') {
      return JSON.stringify([]);
    }
    return JSON.stringify({});
  }
  if (u.includes('aero/diretriz')) {
    if (u.includes('/alertas')) {
      return JSON.stringify({
        diasJanela: 30,
        totalVencidas: 0,
        totalProximas: 0,
        totalAbertas: 0,
        itens: [],
      });
    }
    return JSON.stringify({ items: [], totalElements: 0, totalPages: 0, page: 0, size: 20 });
  }
  if (u.includes('publicacoes-tecnicas') || u.includes('publicacao-fcu')) {
    if (method === 'GET') {
      return JSON.stringify({ items: [], total: 0 });
    }
    return JSON.stringify({});
  }
  if (u.includes('item-estoque') || u.includes('/estoque/itens') || u.includes('estoque')) {
    if (method === 'GET') {
      return JSON.stringify({ content: [], totalElements: 0, totalPages: 0, size: 20, number: 0 });
    }
    return JSON.stringify({});
  }
  if (u.includes('tenant') || u.includes('organizac') || u.includes('access-audit') || u.includes('auditoria-acesso')) {
    if (method === 'GET') {
      if (u.includes('access-audit') || u.includes('auditoria')) {
        return JSON.stringify({ items: [], total: 0, page: 0, size: 20 });
      }
      return JSON.stringify([]);
    }
  }
  if (u.includes('chat') || u.includes('conversa')) {
    return JSON.stringify([]);
  }
  if (u.includes('biblioteca')) {
    if (method === 'GET') {
      return JSON.stringify([]);
    }
  }
  if (u.includes('/fcu/assembly')) {
    if (method === 'GET') {
      // Lista e detalhe de documentos de montagem para smoke test.
      if (/\/fcu\/assembly\/\d+/.test(u)) {
        return JSON.stringify({
          id: 1,
          title: 'Mock FCU Assembly',
          company: 'Aero Suite',
          sections: [],
          isActive: true,
        });
      }
      return JSON.stringify([]);
    }
    return JSON.stringify({ id: 1 });
  }
  if (u.includes('/capacidade/quadro')) {
    return JSON.stringify({
      totalAbertas: 0,
      colunas: [
        { estagio: 'AGUARDANDO', cards: [] },
        { estagio: 'EM_EXECUCAO', cards: [] },
        { estagio: 'AGUARDANDO_PECAS', cards: [] },
        { estagio: 'INSPECAO', cards: [] },
      ],
    });
  }
  if (u.includes('/capacidade/hangares') || u.includes('/hangares')) {
    if (method === 'GET') {
      return JSON.stringify([]);
    }
  }
  if (u.includes('capacidade') || u.includes('hangar')) {
    if (method === 'GET') {
      return JSON.stringify([]);
    }
  }
  if (u.includes('relatorio')) {
    if (method === 'GET') {
      return JSON.stringify([]);
    }
  }
  if (u.includes('/ticket')) {
    if (method === 'GET') {
      if (/\/ticket\/\d+/.test(u) || u.includes('/estatisticas')) {
        return JSON.stringify({ items: [], totalElements: 0, totalPages: 0, page: 0, size: 20 });
      }
      return JSON.stringify({ items: [], totalElements: 0, totalPages: 0, page: 0, size: 20 });
    }
    return JSON.stringify({});
  }
  if (u.includes('/auth/me')) {
    return JSON.stringify(MOCK_USER);
  }
  if (method === 'GET') {
    return JSON.stringify([]);
  }
  return JSON.stringify({});
}

const API_CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function respondApiMock(req) {
  const method = req.method();
  if (method === 'OPTIONS') {
    req.respond({ status: 204, headers: API_CORS_HEADERS });
    return;
  }
  const body = mockApiBody(req.url(), method);
  req.respond({
    status: 200,
    contentType: 'application/json',
    headers: API_CORS_HEADERS,
    body,
  });
}

async function installAuthMocks(page) {
  await page.evaluateOnNewDocument((token, user) => {
    localStorage.setItem('aerosuite_token', token);
    localStorage.setItem('aerosuite_user', JSON.stringify(user));
    localStorage.setItem('aerosuite_tenant_codigo', 'default');

    const healthPayload = JSON.stringify({
      ok: true,
      database: 'UP',
      checkedAt: new Date().toISOString(),
      components: { api: 'UP', database: 'UP' },
    });
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);
      if (url.includes('/public/health')) {
        return new Response(healthPayload, {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return originalFetch(input, init);
    };
  }, MOCK_TOKEN, MOCK_USER);

  await page.setRequestInterception(true);
  page.on('request', req => {
    const url = req.url();
    const resourceType = req.resourceType();
    const isApi =
      url.includes('/api/') ||
      (url.startsWith(BASE_URL) && url.includes('api'));

    if (isApi && resourceType !== 'document') {
      respondApiMock(req);
      return;
    }

    req.continue();
  });
}

async function installExternoMocks(page) {
  await page.evaluateOnNewDocument((token, user, funcionalidades) => {
    localStorage.setItem('aerosuite_external_token', token);
    localStorage.setItem('aerosuite_external_user', JSON.stringify(user));
    localStorage.setItem('aerosuite_external_funcionalidades', JSON.stringify(funcionalidades));
    localStorage.setItem('aerosuite_externo_tenant_codigo', 'default');
  }, MOCK_EXT_TOKEN, MOCK_EXT_USER, MOCK_EXT_FUNCIONALIDADES);

  await page.setRequestInterception(true);
  page.on('request', req => {
    const url = req.url();
    const resourceType = req.resourceType();
    const isApi =
      url.includes('/api/') ||
      (url.startsWith(BASE_URL) && url.includes('api'));

    if (isApi && resourceType !== 'document') {
      respondApiMock(req);
      return;
    }

    req.continue();
  });
}

async function waitForApp(page, timeoutMs = 45000) {
  await page.waitForFunction(
    () => {
      const root = document.querySelector('app-root');
      return root && root.childElementCount > 0;
    },
    { timeout: timeoutMs }
  );
  await new Promise(r => setTimeout(r, 1200));
}

async function analyzeRoute(page, route, label) {
  const url = route === '/' ? BASE_URL : `${BASE_URL}${route.replace(/^\//, '')}`;
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 90000 });
  try {
    await waitForApp(page);
  } catch {
    console.warn(`axe: app-root não renderizou em ${label} — analisando shell estático`);
  }
  const results = await new AxePuppeteer(page).withTags(['wcag2a', 'wcag2aa']).analyze();
  return { route: label, results };
}

function reportResults(label, results) {
  const blocking = results.violations.filter(
    v => v.impact === 'critical' || v.impact === 'serious'
  );
  if (blocking.length) {
    console.error(`axe [${label}]: ${blocking.length} violação(ões) critical/serious:`);
    for (const v of blocking) {
      console.error(`  - [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} nó(s))`);
      const firstNode = v.nodes[0];
      if (firstNode?.html) {
        console.error(`      ${firstNode.html.slice(0, 320)}`);
      }
    }
    return 1;
  }
  console.log(
    `axe OK [${label}] — ${results.violations.length} menor(es), ${results.passes.length} regras passaram.`
  );
  return 0;
}

function writeWcagReport(report) {
  const outDir = path.join(__dirname, '../../docs/wcag-evidencias');
  fs.mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const filePath = path.join(outDir, `axe-baseline-${stamp}.json`);
  fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
  fs.writeFileSync(path.join(outDir, 'axe-baseline-latest.json'), JSON.stringify(report, null, 2));
  console.log(`wcag: relatório gravado em ${filePath}`);
}

async function main() {
  if (!fs.existsSync(distDir)) {
    console.error(`axe: dist não encontrado em ${distDir}. Execute npm run build primeiro.`);
    process.exit(1);
  }

  const server = await startStaticServer();
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  let exitCode = 0;
  const reportRows = [];

  try {
    const publicPage = await browser.newPage();
    await publicPage.setViewport({ width: 1280, height: 800 });

    for (const route of PUBLIC_ROUTES) {
      const { results } = await analyzeRoute(publicPage, route, route);
      exitCode |= reportResults(route, results);
      reportRows.push(summarizeRoute('public', route, results));
    }

    await publicPage.close();

    const authPage = await browser.newPage();
    await authPage.setViewport({ width: 1280, height: 800 });
    await installAuthMocks(authPage);

    for (const route of AUTH_ROUTES) {
      const label = route === '/' ? '/ (home autenticado)' : route;
      const { results } = await analyzeRoute(authPage, route, label);
      exitCode |= reportResults(`auth ${label}`, results);
      reportRows.push(summarizeRoute('auth', route, results));
    }

    await authPage.close();

    const externoPublicPage = await browser.newPage();
    await externoPublicPage.setViewport({ width: 1280, height: 800 });

    for (const route of EXTERNO_PUBLIC_ROUTES) {
      const { results } = await analyzeRoute(externoPublicPage, route, route);
      exitCode |= reportResults(route, results);
      reportRows.push(summarizeRoute('externo-public', route, results));
    }

    await externoPublicPage.close();

    const externoAuthPage = await browser.newPage();
    await externoAuthPage.setViewport({ width: 1280, height: 800 });
    await installExternoMocks(externoAuthPage);

    for (const route of EXTERNO_AUTH_ROUTES) {
      const { results } = await analyzeRoute(externoAuthPage, route, route);
      exitCode |= reportResults(`externo auth ${route}`, results);
      reportRows.push(summarizeRoute('externo-auth', route, results));
    }
  } finally {
    await browser.close();
    server.close();
  }

  const totalRoutes =
    PUBLIC_ROUTES.length + AUTH_ROUTES.length + EXTERNO_PUBLIC_ROUTES.length + EXTERNO_AUTH_ROUTES.length;
  const blockingTotal = reportRows.reduce((n, r) => n + r.blockingCount, 0);
  console.log(`axe: ${totalRoutes} rotas analisadas — ${blockingTotal} violação(ões) critical/serious.`);

  if (process.env.WCAG_REPORT === '1') {
    writeWcagReport({
      generatedAt: new Date().toISOString(),
      totalRoutes,
      blockingTotal,
      pass: blockingTotal === 0,
      routes: reportRows,
    });
  }

  process.exit(exitCode);
}

function summarizeRoute(group, route, results) {
  const blocking = results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
  return {
    group,
    route,
    pass: blocking.length === 0,
    blockingCount: blocking.length,
    violations: blocking.map(v => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length })),
    minorCount: results.violations.filter(v => v.impact !== 'critical' && v.impact !== 'serious').length,
    passes: results.passes.length,
  };
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
