#!/usr/bin/env node
/**
 * Envia Resposta Técnica Homologação UX Consolidado v2.0 para equipe.
 *
 * Pré-requisito:
 *   node scripts/build-homolog-ux-consolidado-resposta-pdf.mjs
 *
 * Uso:
 *   node scripts/send-homolog-ux-consolidado-email.mjs --dry-run
 *   node scripts/send-homolog-ux-consolidado-email.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const nodemailer = require('nodemailer');

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dryRun = process.argv.includes('--dry-run');
const stamp = '20260610';

function readEnv(name, fallback = null) {
  if (process.env[name]) return process.env[name];
  const envPath = path.join(root, '.env');
  if (!fs.existsSync(envPath)) return fallback;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(new RegExp(`^\\s*${name}\\s*=\\s*(.+)\\s*$`));
    if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  }
  return fallback;
}

const diretorio = JSON.parse(
  fs.readFileSync(path.join(root, 'docs/templates/directorio-email-direcao.json'), 'utf8'),
);

const pdfPath = path.join(root, `docs/homolog_ux/Resposta_Homolog_UX_Consolidado_v2_${stamp}.pdf`);
const htmlPath = path.join(root, `docs/homolog_ux/emails/email-resposta-consolidado-equipe-${stamp}.html`);

for (const f of [pdfPath, htmlPath]) {
  if (!fs.existsSync(f)) {
    console.error('Arquivo ausente:', f);
    console.error('Gere o PDF: node scripts/build-homolog-ux-consolidado-resposta-pdf.mjs');
    process.exit(1);
  }
}

const pdfMb = (fs.statSync(pdfPath).size / (1024 * 1024)).toFixed(1);

let html = fs.readFileSync(htmlPath, 'utf8');
html = html.replace(/<!--[\s\S]*?-->/g, '').trim();
html = html.replaceAll('{{PDF_SIZE_MB}}', pdfMb);

const logoPath = path.join(root, diretorio.logos.hero);
const logoCid = diretorio.logos.hero_cid || 'aerosuite-hero-logo';
const logoAttachments = [];

if (fs.existsSync(logoPath)) {
  html = html.replaceAll('{{LOGO_CID_SRC}}', `cid:${logoCid}`);
  logoAttachments.push({
    filename: path.basename(logoPath),
    path: logoPath,
    cid: logoCid,
    contentDisposition: 'inline',
    contentType: 'image/png',
  });
}

const subject =
  'Resposta Técnica — Homologação UX Consolidado v2.0 (61/61 achados endereçados · PDF em anexo)';

const host = readEnv('QUARKUS_MAILER_HOST', 'smtp.gmail.com');
const port = Number(readEnv('QUARKUS_MAILER_PORT', '587'));
const user = readEnv('QUARKUS_MAILER_USERNAME', 'contato@aerosuite.com.br');
const pass = readEnv('QUARKUS_MAILER_PASSWORD');
const from = readEnv('QUARKUS_MAILER_FROM', user);
const toList = diretorio.lista_to;

if (dryRun) {
  console.log('DRY RUN');
  console.log('Subject:', subject);
  console.log('To:', toList.join('; '));
  console.log('PDF:', pdfPath, pdfMb, 'MB');
  process.exit(0);
}

if (!pass) {
  console.error('Defina QUARKUS_MAILER_PASSWORD no .env');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: { user, pass },
});

await transporter.sendMail({
  from,
  to: toList.join(', '),
  subject,
  html,
  attachments: [
    ...logoAttachments,
    {
      filename: path.basename(pdfPath),
      path: pdfPath,
      contentType: 'application/pdf',
    },
  ],
});

console.log('E-mail enviado para:', toList.join(', '));
