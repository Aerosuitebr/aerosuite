/**
 * Grava vídeo automatizado da jornada oficina → cadastro → módulos.
 * Gera chapter-map.json + GUIA-EDICAO.md com timestamps para cortes.
 *
 * Uso:
 *   node record-demo-jornada-oficina.mjs
 *   node record-demo-jornada-oficina.mjs --with-signup
 *   node record-demo-jornada-oficina.mjs --dry-run
 *
 * Env: AEROSUITE_APP_URL, AEROSUITE_APP_EMAIL, AEROSUITE_APP_PASSWORD, AEROSUITE_APP_TENANT
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  chromium,
  __dirname,
  DEFAULT_BASE,
  VIEWPORT,
  loadSecrets,
  ChapterLogger,
  waitForAuth,
  tryAutoLogin,
  dismissOnboardingBanner,
  runInteraction,
} from './demo-recording-lib.mjs';
import { buildRecordingSteps, JORNADA_META } from './demo-jornada-oficina-scenario.mjs';

const args = process.argv.slice(2);
const withSignup = args.includes('--with-signup');
const dryRun = args.includes('--dry-run');
const headless = process.env.AEROSUITE_DEMO_HEADLESS === '1';

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const outDir = path.join(__dirname, 'demo-recordings', `jornada-oficina-${stamp}`);

async function fillSignupForm(page, demo) {
  await page.locator('#signup-nome').fill(demo.orgName);
  await page.locator('#signup-email').fill(demo.email);
  await page.locator('#signup-admin-nome').fill(demo.adminName);
  await page.locator('#signup-senha input').fill(demo.password);
  await page.waitForTimeout(600);
  const aceito = page.locator('#signup-aceito');
  await aceito.click({ force: true }).catch(async () => {
    await page.locator('input[formcontrolname="aceito"]').click({ force: true });
  });
}

async function executeStep(page, step, ctx) {
  const base = ctx.base;
  switch (step.action) {
    case 'goto': {
      if (step.path) {
        await page.goto(`${base}${step.path}`, { waitUntil: 'networkidle', timeout: 90000 }).catch(() =>
          page.goto(`${base}${step.path}`, { waitUntil: 'domcontentloaded', timeout: 90000 }),
        );
      }
      if (step.waitFor) {
        await page.waitForSelector(step.waitFor, { timeout: 60000 }).catch(() => {});
      }
      await dismissOnboardingBanner(page);
      if (step.interaction) await runInteraction(page, step.interaction);
      break;
    }
    case 'login': {
      await waitForAuth(page, ctx.secrets, base);
      break;
    }
    case 'showSignupForm': {
      await page.goto(`${base}/cadastro-trial`, { waitUntil: 'domcontentloaded' });
      await fillSignupForm(page, ctx.demo);
      break;
    }
    case 'signupTrial': {
      await page.goto(`${base}/cadastro-trial`, { waitUntil: 'domcontentloaded' });
      await fillSignupForm(page, ctx.demo);
      await page.locator('button[type="submit"]').click();
      await page.waitForSelector('.success-message', { timeout: 30000 }).catch(() => {});
      break;
    }
    case 'loginAfterSignup': {
      await tryAutoLogin(page, ctx.secrets, {
        base,
        email: ctx.demo.email,
        password: ctx.demo.password,
        tenant: ctx.demo.tenantSlug,
      });
      break;
    }
    case 'showWizard': {
      await page.goto(`${base}/configuracao-empresa/inicial`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1200);
      break;
    }
    case 'pause':
      await dismissOnboardingBanner(page);
      break;
    default:
      break;
  }

  const shotPath = path.join(outDir, 'frames', `${step.id}.png`);
  fs.mkdirSync(path.dirname(shotPath), { recursive: true });
  await page.screenshot({ path: shotPath, fullPage: false }).catch(() => {});

  await page.waitForTimeout(step.pauseMs ?? 2500);
}

async function main() {
  const secrets = await loadSecrets();
  const base = DEFAULT_BASE;
  const demo = {
    orgName: process.env.AEROSUITE_DEMO_ORG || `Oficina Demo ${stamp.slice(11, 19)}`,
    email: process.env.AEROSUITE_DEMO_EMAIL || `demo+${Date.now()}@aerosuite.com.br`,
    adminName: process.env.AEROSUITE_DEMO_ADMIN || 'Gestor Demo',
    password: process.env.AEROSUITE_DEMO_PASSWORD || 'DemoAero2026!',
    tenantSlug: process.env.AEROSUITE_DEMO_TENANT || '',
  };

  const steps = buildRecordingSteps({
    includeSignup: withSignup,
    includeWizard: true,
    skipOptional: !args.includes('--with-suporte'),
  });

  if (dryRun) {
    console.log('DRY_RUN steps:', steps.length);
    steps.forEach((s, i) => console.log(`${i + 1}. [${s.action}] ${s.title} → ${s.path || '—'}`));
    return;
  }

  fs.mkdirSync(outDir, { recursive: true });
  const startedAt = Date.now();
  const logger = new ChapterLogger(startedAt);

  const browser = await chromium.launch({
    headless,
    args: ['--window-size=1920,1080'],
  });

  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    recordVideo: {
      dir: outDir,
      size: VIEWPORT,
    },
  });

  const page = await context.newPage();
  const ctx = { base, secrets, demo };

  console.log('DEMO_RECORDING_START', outDir);
  console.log('BASE', base);
  console.log('MODE', withSignup ? 'signup+login' : 'tour (login existente)');

  for (const step of steps) {
    try {
      await executeStep(page, step, ctx);
      logger.mark(step, { screenshot: `frames/${step.id}.png` });
    } catch (err) {
      logger.mark(step, { error: err.message, screenshot: `frames/${step.id}.png` });
      console.warn('STEP_WARN', step.id, err.message);
    }
  }

  const video = page.video();
  await page.close();
  await context.close();
  await browser.close();

  let videoPath = video ? await video.path() : null;
  if (videoPath) {
    const finalVideo = path.join(outDir, 'jornada-oficina-bruto.webm');
    fs.renameSync(videoPath, finalVideo);
    videoPath = finalVideo;
  }

  logger.write(outDir, {
    title: JORNADA_META.title,
    subtitle: JORNADA_META.subtitle,
    base,
    videoFile: videoPath ? path.basename(videoPath) : null,
    durationMs: Date.now() - startedAt,
    mode: withSignup ? 'signup' : 'tour',
  });

  const desktop = path.join(process.env.USERPROFILE || '', 'Desktop', 'aerosuite-demo-jornada');
  if (process.env.USERPROFILE) {
    fs.mkdirSync(desktop, { recursive: true });
    fs.cpSync(outDir, path.join(desktop, path.basename(outDir)), { recursive: true });
    console.log('COPIED_TO_DESKTOP', desktop);
  }

  console.log('DEMO_RECORDING_DONE', outDir);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
