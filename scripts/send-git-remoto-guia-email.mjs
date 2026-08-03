#!/usr/bin/env node
/**
 * Envia Guia de Operação Git Remoto (PDF premium) para a equipe.
 * Uso:
 *   node scripts/send-git-remoto-guia-email.mjs --dry-run
 *   node scripts/send-git-remoto-guia-email.mjs
 *   node scripts/send-git-remoto-guia-email.mjs --to wellemlyra@aerosuite.com.br,thiagolyra18@gmail.com
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const nodemailer = require('nodemailer');

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dryRun = process.argv.includes('--dry-run');
const toArgIdx = process.argv.indexOf('--to');
const toOverride =
  toArgIdx >= 0
    ? process.argv[toArgIdx + 1].split(',').map((s) => s.trim()).filter(Boolean)
    : null;
const stamp = '20260618';

const DEFAULT_TO = ['wellemlyra@aerosuite.com.br', 'thiagolyra18@gmail.com'];

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

const pdfPath = path.join(root, `docs/git_operacao/Guia_Operacao_Git_Remoto_${stamp}.pdf`);
const htmlPath = path.join(root, `docs/git_operacao/emails/email-git-remoto-equipe-${stamp}.html`);

for (const f of [pdfPath, htmlPath]) {
  if (!fs.existsSync(f)) {
    console.error('Arquivo ausente:', f);
    console.error('Execute: node scripts/build-git-remoto-guia-pdf.mjs');
    process.exit(1);
  }
}

const pdfMb = (fs.statSync(pdfPath).size / (1024 * 1024)).toFixed(1);
let html = fs.readFileSync(htmlPath, 'utf8').replaceAll('{{PDF_SIZE_MB}}', pdfMb);

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
} else {
  html = html.replaceAll('{{LOGO_CID_SRC}}', '');
}

const subject =
  'Guia de Operação Git — Ambiente Remoto Aero Suite (PDF em anexo · v1.0)';
const toList = toOverride ?? DEFAULT_TO;
const host = readEnv('QUARKUS_MAILER_HOST', 'smtp.gmail.com');
const port = Number(readEnv('QUARKUS_MAILER_PORT', '587'));
const user = readEnv('QUARKUS_MAILER_USERNAME', 'contato@aerosuite.com.br');
const pass = readEnv('QUARKUS_MAILER_PASSWORD');
const from = readEnv('QUARKUS_MAILER_FROM', user);

if (dryRun) {
  console.log('Dry-run — Guia Git Remoto');
  console.log('Para:', toList.join(', '));
  console.log('Assunto:', subject);
  console.log('PDF:', pdfPath, `(${pdfMb} MB)`);
  process.exit(0);
}

if (!pass || pass.length < 8) {
  console.error('Defina QUARKUS_MAILER_PASSWORD no .env');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: { user, pass },
  requireTLS: port === 587,
});

const info = await transporter.sendMail({
  from: `"${diretorio.from_name}" <${from}>`,
  to: toList.join(', '),
  subject,
  html,
  attachments: [
    ...logoAttachments,
    {
      filename: 'Guia_Operacao_Git_Remoto_AeroSuite_v1.0.pdf',
      path: pdfPath,
      contentType: 'application/pdf',
    },
  ],
});

console.log('E-mail enviado.');
console.log('Message-Id:', info.messageId);
console.log('Para:', toList.join(', '));
